import test from 'node:test';
import assert from 'node:assert/strict';
import {
  trendSeries,
  monthlyTotals,
  budgetSnapshot,
  categoryBreakdown,
} from '../src/utils/finance.ts';

const tx = (date, amount, type = 'expense', extra = {}) => ({
  id: `${date}-${amount}`,
  date: `${date}T12:00:00`,
  amount,
  type,
  hashtags: [],
  payment_method: 'Card',
  ...extra,
});
const sum = (points, key) =>
  Math.round(points.reduce((s, p) => s + p[key], 0) * 100) / 100;

test('unfinished month compares matching elapsed days and excludes future entries', () => {
  const data = [
    tx('2026-11-01', 25),
    tx('2026-11-04', 75),
    tx('2026-11-05', 900),
    tx('2026-10-01', 40),
    tx('2026-10-04', 10),
    tx('2026-10-20', 1000),
  ];
  const points = trendSeries(
    data,
    'month',
    new Date(2026, 10, 1),
    new Date(2026, 10, 4),
  );
  assert.equal(points.length, 4);
  assert.equal(sum(points, 'expense'), 100);
  assert.equal(sum(points, 'previousExpense'), 50);
});

test('seven days crosses a year boundary and compares exactly the preceding seven days', () => {
  const data = [
    tx('2025-12-30', 10),
    tx('2026-01-03', 20),
    tx('2025-12-23', 5),
    tx('2025-12-27', 7),
    tx('2026-01-04', 900),
  ];
  const points = trendSeries(
    data,
    'week',
    new Date(2026, 0, 1),
    new Date(2026, 0, 3),
  );
  assert.equal(points[0].date, '2025-12-28');
  assert.equal(points.at(-1).date, '2026-01-03');
  assert.equal(points[0].previousDate, '2025-12-21');
  assert.equal(sum(points, 'expense'), 30);
  assert.equal(sum(points, 'previousExpense'), 12);
});

test('a shorter previous month does not roll missing dates into March', () => {
  const points = trendSeries(
    [tx('2024-02-29', 10), tx('2024-03-01', 100), tx('2024-03-31', 30)],
    'month',
    new Date(2024, 2, 1),
    new Date(2024, 3, 10),
  );
  assert.equal(points.length, 31);
  assert.equal(points[28].previousDate, '2024-02-29');
  assert.equal(points[29].previousDate, '');
  assert.equal(points[30].previousExpense, 0);
  assert.equal(sum(points, 'previousExpense'), 10);
});

test('six-month comparison uses a matching cutoff in the unfinished last month', () => {
  const data = [
    tx('2026-06-30', 20),
    tx('2026-11-04', 30),
    tx('2026-11-05', 900),
    tx('2025-12-31', 10),
    tx('2026-05-04', 15),
    tx('2026-05-05', 1000),
  ];
  const points = trendSeries(
    data,
    'half-year',
    new Date(2026, 10, 1),
    new Date(2026, 10, 4),
  );
  assert.equal(points.length, 6);
  assert.equal(sum(points, 'expense'), 50);
  assert.equal(sum(points, 'previousExpense'), 25);
});

test('income and expense remain separate and cents aggregate accurately', () => {
  const points = trendSeries(
    [
      tx('2026-11-01', 0.1),
      tx('2026-11-01', 0.2),
      tx('2026-11-01', 500, 'income'),
    ],
    'month',
    new Date(2026, 10, 1),
    new Date(2026, 10, 4),
  );
  assert.equal(points[0].expense, 0.3);
  assert.equal(points[0].income, 500);
  assert.equal(points[0].previousIncome, 0);
});

test('empty periods retain all date buckets and zero totals', () => {
  for (const period of ['week', 'month', 'half-year']) {
    const points = trendSeries(
      [],
      period,
      new Date(2026, 10, 1),
      new Date(2026, 10, 4),
    );
    assert.ok(points.length > 0);
    for (const key of [
      'income',
      'expense',
      'previousIncome',
      'previousExpense',
    ])
      assert.equal(sum(points, key), 0);
  }
});

test('unknown and removed categories stay in the breakdown and its total', () => {
  const data = [
    tx('2026-11-01', 20),
    tx('2026-11-02', 30, 'expense', { category_id: 'removed' }),
  ];
  const items = categoryBreakdown(data, [], new Date(2026, 10, 1));
  assert.equal(items.length, 1);
  assert.equal(items[0].id, 'uncategorized');
  assert.equal(items[0].amount, 50);
  assert.equal(items[0].share, 100);
  assert.equal(items[0].count, 2);
});

test('budget overspending and completed months never produce a negative daily allowance', () => {
  const now = new Date(2026, 10, 4);
  const snapshot = budgetSnapshot(1200, 1000, now, now);
  assert.equal(snapshot.remaining, -200);
  assert.equal(snapshot.status, 'over');
  assert.equal(snapshot.perDaySafe, 0);
  const completed = budgetSnapshot(200, 1000, new Date(2026, 9, 1), now);
  assert.equal(completed.daysLeft, 0);
  assert.equal(
    monthlyTotals([tx('2026-11-01', 100, 'income'), tx('2026-11-02', 30)], now)
      .net,
    70,
  );
});

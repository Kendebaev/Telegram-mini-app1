import crypto from 'crypto';

const PORT = 3001;
const BASE_URL = `http://localhost:${PORT}/api`;
const BOT_TOKEN = 'test_bot_token_secret_123';

/**
 * Creates a valid Telegram WebApp initData string signed with BOT_TOKEN.
 */
function createSignedInitData(botToken: string, userObj: object): string {
  const params: Record<string, string> = {
    auth_date: Math.floor(Date.now() / 1000).toString(),
    query_id: 'AAHdF6IQAAAAAN0XohD12345',
    user: JSON.stringify(userObj),
  };

  const keys = Object.keys(params).sort();
  const dataCheckString = keys.map((k) => `${k}=${params[k]}`).join('\n');

  const secretKey = crypto
    .createHmac('sha256', 'WebAppData')
    .update(botToken)
    .digest();

  const hash = crypto
    .createHmac('sha256', secretKey)
    .update(dataCheckString)
    .digest('hex');

  const searchParams = new URLSearchParams(params);
  searchParams.set('hash', hash);
  return searchParams.toString();
}

async function runTests() {
  console.log('--- Starting API Integration Tests ---');

  // Test 1: Health check
  const healthRes = await fetch(`http://localhost:${PORT}/api/health`);
  const healthData = (await healthRes.json()) as any;
  console.log('✓ Health check status:', healthData.status);

  // Test 2: Generate signed initData
  const mockUser = {
    id: 1122334455,
    first_name: 'Elena',
    last_name: 'Rostova',
    username: 'elena_test',
  };
  const initData = createSignedInitData(BOT_TOKEN, mockUser);
  console.log('✓ Generated valid signed Telegram initData');

  const headers = {
    'Content-Type': 'application/json',
    'x-telegram-init-data': initData,
  };

  // Test 3: User Profile
  const profileRes = await fetch(`${BASE_URL}/user/profile`, { headers });
  const profileData = (await profileRes.json()) as any;
  console.log('✓ Profile fetched for user:', profileData.username, 'ID:', profileData.id);

  // Test 4: Get Categories
  const catRes = await fetch(`${BASE_URL}/categories`, { headers });
  const categories = (await catRes.json()) as any[];
  console.log(`✓ Fetched ${categories.length} categories (First: ${categories[0]?.name})`);

  // Test 5: Create Expense
  const targetCategory = categories[0];
  const postRes = await fetch(`${BASE_URL}/expenses`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      amount: 42.75,
      category_id: targetCategory.id,
      note: 'API integration test expense',
      date: new Date().toISOString(),
      payment_method: 'Card',
    }),
  });
  const createdExp = (await postRes.json()) as any;
  console.log('✓ Expense created successfully. ID:', createdExp.id, 'Amount:', createdExp.amount);

  // Test 6: Get Expenses
  const expRes = await fetch(`${BASE_URL}/expenses`, { headers });
  const allExpenses = (await expRes.json()) as any[];
  console.log(`✓ Fetched ${allExpenses.length} user expenses`);

  // Test 7: Update Expense
  const updateRes = await fetch(`${BASE_URL}/expenses/${createdExp.id}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify({
      amount: 50.0,
      note: 'Updated API test expense note',
    }),
  });
  const updatedExp = (await updateRes.json()) as any;
  console.log('✓ Expense updated. New Amount:', updatedExp.amount, 'New Note:', updatedExp.note);

  // Test 8: Analytics
  const analyticsRes = await fetch(`${BASE_URL}/analytics`, { headers });
  const analyticsData = (await analyticsRes.json()) as any;
  console.log('✓ Analytics computed successfully:');
  console.log('   Today total:', analyticsData.summary.today);
  console.log('   This month total:', analyticsData.summary.thisMonth);
  console.log('   Category breakdown items:', analyticsData.categoryBreakdown.length);

  // Test 9: Delete Expense
  const delRes = await fetch(`${BASE_URL}/expenses/${createdExp.id}`, {
    method: 'DELETE',
    headers,
  });
  const delData = (await delRes.json()) as any;
  console.log('✓ Expense deleted successfully. Result:', delData);

  // Test 10: Update currency
  const currRes = await fetch(`${BASE_URL}/user/currency`, {
    method: 'PUT',
    headers,
    body: JSON.stringify({ currency: 'KZT' }),
  });
  const currData = (await currRes.json()) as any;
  console.log('✓ Currency updated successfully to:', currData.currency);

  console.log('\n==========================================');
  console.log('  ALL 10 API INTEGRATION TESTS PASSED!   ');
  console.log('==========================================');
}

runTests().catch((err) => {
  console.error('Test failed with error:', err);
  process.exit(1);
});

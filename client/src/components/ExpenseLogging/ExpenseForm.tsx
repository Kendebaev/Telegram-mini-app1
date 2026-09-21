import React from 'react';
import { AddTransactionScreen } from './AddTransactionScreen';

interface ExpenseFormProps {
  onSuccess?: () => void;
}

export const ExpenseForm: React.FC<ExpenseFormProps> = () => {
  return <AddTransactionScreen />;
};

export default ExpenseForm;

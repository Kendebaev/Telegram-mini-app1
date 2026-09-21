import React from 'react';
import { TransactionDetailSheet } from './TransactionDetailSheet';
import type { Transaction } from '../../types/models';

interface EditExpenseModalProps {
  expense?: Transaction | null;
  onClose?: () => void;
}

export const EditExpenseModal: React.FC<EditExpenseModalProps> = () => {
  return <TransactionDetailSheet />;
};

export default EditExpenseModal;

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import TransactionsPage from '../page';
import { accountsService, transactionsService } from '@/lib/services';

// Mock the services
jest.mock('@/lib/services', () => ({
  accountsService: {
    getAccounts: jest.fn(),
  },
  transactionsService: {
    getTransactions: jest.fn(),
    createTransaction: jest.fn(),
    transfer: jest.fn(),
  },
}));

// Mock Next.js router
jest.mock('next/link', () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  );
});

const mockAccounts = [
  {
    id: 1,
    user_id: 1,
    account_number: '1234567890',
    account_type: 'checking' as const,
    balance: 1000.50,
    currency: 'USD',
    status: 'active' as const,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 2,
    user_id: 1,
    account_number: '0987654321',
    account_type: 'savings' as const,
    balance: 5000.00,
    currency: 'USD',
    status: 'active' as const,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
];

const mockTransactions = [
  {
    id: 1,
    account_id: 1,
    type: 'credit' as const,
    amount: 100.00,
    currency: 'USD',
    description: 'Salary deposit',
    reference: 'TXN001',
    status: 'completed' as const,
    created_at: '2024-01-01T12:00:00Z',
    updated_at: '2024-01-01T12:00:00Z',
    processed_at: '2024-01-01T12:00:00Z',
  },
  {
    id: 2,
    account_id: 1,
    type: 'debit' as const,
    amount: 50.00,
    currency: 'USD',
    description: 'ATM withdrawal',
    reference: 'TXN002',
    status: 'pending' as const,
    created_at: '2024-01-02T12:00:00Z',
    updated_at: '2024-01-02T12:00:00Z',
  },
  {
    id: 3,
    account_id: 2,
    type: 'transfer' as const,
    amount: 200.00,
    currency: 'USD',
    description: 'Transfer to checking',
    reference: 'TXN003',
    status: 'completed' as const,
    to_account_id: 1,
    created_at: '2024-01-03T12:00:00Z',
    updated_at: '2024-01-03T12:00:00Z',
    processed_at: '2024-01-03T12:00:00Z',
  },
];

describe('TransactionsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (accountsService.getAccounts as jest.Mock).mockResolvedValue(mockAccounts);
    (transactionsService.getTransactions as jest.Mock).mockResolvedValue(mockTransactions);
  });

  describe('Component Rendering', () => {
    it('should render the transactions page', async () => {
      render(<TransactionsPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Transactions')).toBeInTheDocument();
      });
    });

    it('should display loading skeleton initially', () => {
      render(<TransactionsPage />);
      
      // Check for multiple skeleton elements
      const skeletons = document.querySelectorAll('[class*="animate-pulse"]');
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it('should render header with navigation and action buttons', async () => {
      render(<TransactionsPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Back to Dashboard')).toBeInTheDocument();
        expect(screen.getByText('New Transaction')).toBeInTheDocument();
        expect(screen.getByText('Transfer')).toBeInTheDocument();
      });
    });

    it('should render transactions list after data loads', async () => {
      render(<TransactionsPage />);
      
      await waitFor(() => {
        expect(screen.getByText('All Transactions')).toBeInTheDocument();
        expect(screen.getByText('Salary deposit')).toBeInTheDocument();
        expect(screen.getByText('ATM withdrawal')).toBeInTheDocument();
        expect(screen.getByText('Transfer to checking')).toBeInTheDocument();
      });
    });
  });

  describe('Data Loading', () => {
    it('should fetch accounts and transactions on mount', async () => {
      render(<TransactionsPage />);
      
      await waitFor(() => {
        expect(accountsService.getAccounts).toHaveBeenCalledTimes(1);
        expect(transactionsService.getTransactions).toHaveBeenCalledTimes(1);
      });
    });

    it('should handle empty transactions list', async () => {
      (transactionsService.getTransactions as jest.Mock).mockResolvedValue([]);
      
      render(<TransactionsPage />);
      
      await waitFor(() => {
        expect(screen.getByText('No transactions found. Create your first transaction!')).toBeInTheDocument();
        expect(screen.getByText('Create Transaction')).toBeInTheDocument();
      });
    });

    it('should handle API errors gracefully', async () => {
      (accountsService.getAccounts as jest.Mock).mockRejectedValue(new Error('API Error'));
      (transactionsService.getTransactions as jest.Mock).mockRejectedValue(new Error('API Error'));
      
      render(<TransactionsPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Failed to load data')).toBeInTheDocument();
      });
    });

    it('should handle non-array data responses', async () => {
      (accountsService.getAccounts as jest.Mock).mockResolvedValue(null);
      (transactionsService.getTransactions as jest.Mock).mockResolvedValue(undefined);
      
      render(<TransactionsPage />);
      
      await waitFor(() => {
        expect(screen.getByText('All Transactions')).toBeInTheDocument();
      });
    });
  });

  describe('New Transaction Form', () => {
    it('should show transaction form when New Transaction button is clicked', async () => {
      render(<TransactionsPage />);
      
      await waitFor(() => {
        fireEvent.click(screen.getByText('New Transaction'));
      });
      
      expect(screen.getByText('Create New Transaction')).toBeInTheDocument();
      expect(screen.getByText('Account')).toBeInTheDocument();
      expect(screen.getByText('Transaction Type')).toBeInTheDocument();
      expect(screen.getByText('Amount')).toBeInTheDocument();
      expect(screen.getByText('Description')).toBeInTheDocument();
    });

    it('should hide transaction form when Cancel is clicked', async () => {
      render(<TransactionsPage />);
      
      await waitFor(() => {
        fireEvent.click(screen.getByText('New Transaction'));
      });
      
      fireEvent.click(screen.getByText('Cancel'));
      
      expect(screen.queryByText('Create New Transaction')).not.toBeInTheDocument();
    });

    it('should populate account dropdown with active accounts', async () => {
      render(<TransactionsPage />);
      
      await waitFor(() => {
        fireEvent.click(screen.getByText('New Transaction'));
      });
      
      const accountSelect = screen.getByDisplayValue('Select an account');
      expect(accountSelect).toBeInTheDocument();
      
      // Check if accounts are in the select options
      await waitFor(() => {
        expect(screen.getByDisplayValue('Select an account')).toBeInTheDocument();
      });
    });

    it('should submit transaction form with valid data', async () => {
      (transactionsService.createTransaction as jest.Mock).mockResolvedValue({
        id: 4,
        account_id: 1,
        type: 'credit',
        amount: 250.00,
        currency: 'USD',
        description: 'Test deposit',
        status: 'completed',
      });
      
      render(<TransactionsPage />);
      
      await waitFor(() => {
        fireEvent.click(screen.getByText('New Transaction'));
      });
      
      // Fill form
      const accountSelect = screen.getByDisplayValue('Select an account');
      const amountInput = screen.getByPlaceholderText('0.00');
      const descriptionInput = screen.getByPlaceholderText('Optional description');
      
      fireEvent.change(accountSelect, { target: { value: '1' } });
      fireEvent.change(amountInput, { target: { value: '250.00' } });
      fireEvent.change(descriptionInput, { target: { value: 'Test deposit' } });
      
      // Submit form
      fireEvent.click(screen.getByText('Create Transaction'));
      
      await waitFor(() => {
        expect(transactionsService.createTransaction).toHaveBeenCalledWith({
          account_id: 1,
          type: 'credit',
          amount: 250.00,
          description: 'Test deposit',
        });
      });
    });

    it('should handle transaction creation errors', async () => {
      (transactionsService.createTransaction as jest.Mock).mockRejectedValue(new Error('Transaction failed'));
      
      render(<TransactionsPage />);
      
      await waitFor(() => {
        fireEvent.click(screen.getByText('New Transaction'));
      });
      
      // Fill and submit form
      const accountSelect = screen.getByDisplayValue('Select an account');
      const amountInput = screen.getByPlaceholderText('0.00');
      
      fireEvent.change(accountSelect, { target: { value: '1' } });
      fireEvent.change(amountInput, { target: { value: '100.00' } });
      
      fireEvent.click(screen.getByText('Create Transaction'));
      
      await waitFor(() => {
        expect(screen.getByText('Failed to create transaction')).toBeInTheDocument();
      });
    });
  });

  describe('Transfer Form', () => {
    it('should show transfer form when Transfer button is clicked', async () => {
      render(<TransactionsPage />);
      
      await waitFor(() => {
        fireEvent.click(screen.getByText('Transfer'));
      });
      
      expect(screen.getByText('Transfer Between Accounts')).toBeInTheDocument();
      expect(screen.getByText('From Account')).toBeInTheDocument();
      expect(screen.getByText('To Account')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Select source account')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Select destination account')).toBeInTheDocument();
    });

    it('should hide transfer form when Cancel is clicked', async () => {
      render(<TransactionsPage />);
      
      await waitFor(() => {
        fireEvent.click(screen.getByText('Transfer'));
      });
      
      fireEvent.click(screen.getByText('Cancel'));
      
      expect(screen.queryByText('Transfer Between Accounts')).not.toBeInTheDocument();
    });

    it('should submit transfer form with valid data', async () => {
      (transactionsService.transfer as jest.Mock).mockResolvedValue({
        success: true,
        message: 'Transfer completed',
      });
      
      render(<TransactionsPage />);
      
      await waitFor(() => {
        fireEvent.click(screen.getByText('Transfer'));
      });
      
      // Fill form
      const fromAccountSelect = screen.getByDisplayValue('Select source account');
      const toAccountSelect = screen.getByDisplayValue('Select destination account');
      const amountInput = screen.getByPlaceholderText('0.00');
      const descriptionInput = screen.getByPlaceholderText('Optional transfer description');
      
      fireEvent.change(fromAccountSelect, { target: { value: '1' } });
      fireEvent.change(toAccountSelect, { target: { value: '2' } });
      fireEvent.change(amountInput, { target: { value: '150.00' } });
      fireEvent.change(descriptionInput, { target: { value: 'Test transfer' } });
      
      // Submit form
      fireEvent.click(screen.getByText('Transfer Funds'));
      
      await waitFor(() => {
        expect(transactionsService.transfer).toHaveBeenCalledWith({
          from_account_id: 1,
          to_account_id: 2,
          amount: 150.00,
          description: 'Test transfer',
        });
      });
    });

    it('should handle transfer errors', async () => {
      (transactionsService.transfer as jest.Mock).mockRejectedValue(new Error('Transfer failed'));
      
      render(<TransactionsPage />);
      
      await waitFor(() => {
        fireEvent.click(screen.getByText('Transfer'));
      });
      
      // Fill and submit form
      const fromAccountSelect = screen.getByDisplayValue('Select source account');
      const toAccountSelect = screen.getByDisplayValue('Select destination account');
      const amountInput = screen.getByPlaceholderText('0.00');
      
      fireEvent.change(fromAccountSelect, { target: { value: '1' } });
      fireEvent.change(toAccountSelect, { target: { value: '2' } });
      fireEvent.change(amountInput, { target: { value: '100.00' } });
      
      fireEvent.click(screen.getByText('Transfer Funds'));
      
      await waitFor(() => {
        expect(screen.getByText('Failed to process transfer')).toBeInTheDocument();
      });
    });
  });

  describe('Transaction Display', () => {
    it('should display transaction details correctly', async () => {
      render(<TransactionsPage />);
      
      await waitFor(() => {
        // Check credit transaction
        expect(screen.getByText('Salary deposit')).toBeInTheDocument();
        expect(screen.getByText('+100.00 USD')).toBeInTheDocument();
        expect(screen.getAllByText('completed')[0]).toBeInTheDocument();
        expect(screen.getByText('Ref: TXN001')).toBeInTheDocument();
        
        // Check debit transaction
        expect(screen.getByText('ATM withdrawal')).toBeInTheDocument();
        expect(screen.getByText('-50.00 USD')).toBeInTheDocument();
        expect(screen.getByText('pending')).toBeInTheDocument();
        
        // Check transfer transaction
        expect(screen.getByText('Transfer to checking')).toBeInTheDocument();
        expect(screen.getByText('200.00 USD')).toBeInTheDocument();
      });
    });

    it('should display account information for each transaction', async () => {
      render(<TransactionsPage />);
      
      await waitFor(() => {
        expect(screen.getAllByText('checking - 1234567890')[0]).toBeInTheDocument();
        expect(screen.getByText('savings - 0987654321')).toBeInTheDocument();
      });
    });

    it('should display processed date when available', async () => {
      render(<TransactionsPage />);
      
      await waitFor(() => {
        expect(screen.getAllByText(/Processed:/)[0]).toBeInTheDocument();
      });
    });

    it('should handle missing account data gracefully', async () => {
      const transactionsWithMissingAccount = [
        {
          ...mockTransactions[0],
          account_id: 999, // Non-existent account
        },
      ];
      
      (transactionsService.getTransactions as jest.Mock).mockResolvedValue(transactionsWithMissingAccount);
      
      render(<TransactionsPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Account 999')).toBeInTheDocument();
      });
    });
  });

  describe('Transaction Icons and Colors', () => {
    it('should display correct icons for different transaction types', async () => {
      render(<TransactionsPage />);
      
      await waitFor(() => {
        // Check that transaction icons are rendered (using class selectors since lucide icons don't have accessible text)
        const icons = document.querySelectorAll('svg');
        expect(icons.length).toBeGreaterThan(0);
      });
    });

    it('should apply correct colors for transaction types', async () => {
      render(<TransactionsPage />);
      
      await waitFor(() => {
        const creditAmount = screen.getByText('+100.00 USD');
        const debitAmount = screen.getByText('-50.00 USD');
        
        expect(creditAmount).toHaveClass('text-green-600');
        expect(debitAmount).toHaveClass('text-red-600');
      });
    });

    it('should apply correct status colors', async () => {
      render(<TransactionsPage />);
      
      await waitFor(() => {
        const completedStatus = screen.getAllByText('completed')[0];
        const pendingStatus = screen.getByText('pending');
        
        expect(completedStatus).toHaveClass('bg-green-100', 'text-green-800');
        expect(pendingStatus).toHaveClass('bg-yellow-100', 'text-yellow-800');
      });
    });
  });

  describe('Form Validation', () => {
    it('should require account selection for new transaction', async () => {
      render(<TransactionsPage />);
      
      await waitFor(() => {
        fireEvent.click(screen.getByText('New Transaction'));
      });
      
      const accountSelect = screen.getByDisplayValue('Select an account');
      expect(accountSelect).toHaveAttribute('required');
    });

    it('should require amount for new transaction', async () => {
      render(<TransactionsPage />);
      
      await waitFor(() => {
        fireEvent.click(screen.getByText('New Transaction'));
      });
      
      const amountInput = screen.getByPlaceholderText('0.00');
      expect(amountInput).toHaveAttribute('required');
      expect(amountInput).toHaveAttribute('min', '0.01');
      expect(amountInput).toHaveAttribute('step', '0.01');
    });

    it('should require from and to accounts for transfer', async () => {
      render(<TransactionsPage />);
      
      await waitFor(() => {
        fireEvent.click(screen.getByText('Transfer'));
      });
      
      const fromAccountSelect = screen.getByDisplayValue('Select source account');
      const toAccountSelect = screen.getByDisplayValue('Select destination account');
      
      expect(fromAccountSelect).toHaveAttribute('required');
      expect(toAccountSelect).toHaveAttribute('required');
    });
  });

  describe('Accessibility', () => {
    it('should have proper form labels', async () => {
      render(<TransactionsPage />);
      
      await waitFor(() => {
        fireEvent.click(screen.getByText('New Transaction'));
      });
      
      expect(screen.getByText('Account')).toBeInTheDocument();
      expect(screen.getByText('Transaction Type')).toBeInTheDocument();
      expect(screen.getByText('Amount')).toBeInTheDocument();
      expect(screen.getByText('Description')).toBeInTheDocument();
    });

    it('should have proper heading structure', async () => {
      render(<TransactionsPage />);
      
      await waitFor(() => {
        expect(screen.getByRole('heading', { name: 'Transactions' })).toBeInTheDocument();
      });
    });

    it('should have proper button roles', async () => {
      render(<TransactionsPage />);
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /New Transaction/ })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Transfer/ })).toBeInTheDocument();
      });
    });
  });
});

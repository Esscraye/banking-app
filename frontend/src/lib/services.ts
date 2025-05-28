import api from './api';

export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Account {
  id: number;
  user_id: number;
  account_number: string;
  account_type: 'checking' | 'savings' | 'business';
  balance: number;
  currency: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Transaction {
  id: number;
  from_account_id?: number;
  to_account_id?: number;
  amount: number;
  transaction_type: 'deposit' | 'withdrawal' | 'transfer' | 'payment';
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  description?: string;
  reference?: string;
  created_at: string;
  updated_at: string;
}

export interface Notification {
  id: number;
  user_id: number;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  is_read: boolean;
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

// Auth Service
export const authService = {
  login: async (credentials: { email: string; password: string }) => {
    const response = await api.post('/api/auth/login', credentials);
    return response.data;
  },

  register: async (userData: {
    email: string;
    password: string;
    first_name: string;
    last_name: string;
    phone?: string;
  }) => {
    const response = await api.post('/api/auth/register', userData);
    return response.data;
  },

  logout: async () => {
    const response = await api.post('/api/auth/logout');
    return response.data;
  },

  getProfile: async (): Promise<User> => {
    const response = await api.get('/api/auth/profile');
    return response.data;
  },

  updateProfile: async (userData: Partial<User>): Promise<User> => {
    const response = await api.put('/api/auth/profile', userData);
    return response.data;
  },
};

// Accounts Service
export const accountsService = {
  getAccounts: async (): Promise<Account[]> => {
    const response = await api.get('/api/accounts');
    return response.data;
  },

  getAccount: async (id: number): Promise<Account> => {
    const response = await api.get(`/api/accounts/${id}`);
    return response.data;
  },

  createAccount: async (accountData: {
    account_type: string;
    currency?: string;
  }): Promise<Account> => {
    const response = await api.post('/api/accounts', accountData);
    return response.data;
  },

  updateAccount: async (id: number, accountData: Partial<Account>): Promise<Account> => {
    const response = await api.put(`/api/accounts/${id}`, accountData);
    return response.data;
  },

  deleteAccount: async (id: number) => {
    const response = await api.delete(`/api/accounts/${id}`);
    return response.data;
  },
};

// Transactions Service
export const transactionsService = {
  getTransactions: async (accountId?: number): Promise<Transaction[]> => {
    const url = accountId ? `/api/transactions?account_id=${accountId}` : '/api/transactions';
    const response = await api.get(url);
    return response.data;
  },

  getTransaction: async (id: number): Promise<Transaction> => {
    const response = await api.get(`/api/transactions/${id}`);
    return response.data;
  },

  createTransaction: async (transactionData: {
    from_account_id?: number;
    to_account_id?: number;
    amount: number;
    transaction_type: string;
    description?: string;
  }): Promise<Transaction> => {
    const response = await api.post('/api/transactions', transactionData);
    return response.data;
  },

  transfer: async (transferData: {
    from_account_id: number;
    to_account_id: number;
    amount: number;
    description?: string;
  }): Promise<Transaction> => {
    const response = await api.post('/api/transactions/transfer', transferData);
    return response.data;
  },
};

// Notifications Service
export const notificationsService = {
  getNotifications: async (): Promise<Notification[]> => {
    const response = await api.get('/api/notifications');
    return response.data;
  },

  markAsRead: async (id: number): Promise<Notification> => {
    const response = await api.put(`/api/notifications/${id}/read`);
    return response.data;
  },

  markAllAsRead: async () => {
    const response = await api.put('/api/notifications/read-all');
    return response.data;
  },

  deleteNotification: async (id: number) => {
    const response = await api.delete(`/api/notifications/${id}`);
    return response.data;
  },
};

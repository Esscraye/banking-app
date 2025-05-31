import api from "./api";

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
  account_type: "checking" | "savings" | "credit";
  balance: number;
  currency: string;
  status: "active" | "frozen" | "closed";
  created_at: string;
  updated_at: string;
}

export interface Transaction {
  id: number;
  account_id: number;
  type: "debit" | "credit" | "transfer";
  amount: number;
  currency: string;
  description?: string;
  reference?: string;
  status: "pending" | "completed" | "failed";
  to_account_id?: number;
  processed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface Notification {
  id: number;
  user_id: number;
  type: "email" | "sms" | "push" | "system";
  title: string;
  message: string;
  status: "pending" | "sent" | "failed";
  is_read: boolean;
  sent_at?: string;
  created_at: string;
  updated_at: string;
}

// Auth Service
export const authService = {
  login: async (credentials: { email: string; password: string }) => {
    const response = await api.post("/api/auth/login", credentials);
    return response.data;
  },

  register: async (userData: {
    email: string;
    password: string;
    first_name: string;
    last_name: string;
    phone?: string;
  }) => {
    const response = await api.post("/api/auth/register", userData);
    return response.data;
  },

  logout: async () => {
    const response = await api.post("/api/auth/logout");
    return response.data;
  },

  getProfile: async (): Promise<User> => {
    const response = await api.get("/api/auth/profile");
    return response.data.data;
  },

  updateProfile: async (userData: {
    first_name?: string;
    last_name?: string;
    phone?: string;
  }): Promise<User> => {
    const response = await api.put("/api/auth/profile", userData);
    return response.data.data;
  },

  changePassword: async (passwordData: {
    current_password: string;
    new_password: string;
  }) => {
    const response = await api.post("/api/auth/change-password", passwordData);
    return response.data;
  },
};

// Accounts Service
export const accountsService = {
  getAccounts: async (): Promise<Account[]> => {
    const response = await api.get("/api/accounts/");
    return response.data.data;
  },

  getAccount: async (id: number): Promise<Account> => {
    const response = await api.get(`/api/accounts/${id}`);
    return response.data.data;
  },

  createAccount: async (accountData: {
    account_type: string;
    currency?: string;
  }): Promise<Account> => {
    const response = await api.post("/api/accounts/", accountData);
    return response.data.data;
  },

  updateAccount: async (
    id: number,
    accountData: { status: string },
  ): Promise<Account> => {
    const response = await api.put(`/api/accounts/${id}`, accountData);
    return response.data.data;
  },

  deleteAccount: async (id: number) => {
    const response = await api.delete(`/api/accounts/${id}`);
    return response.data;
  },

  getBalance: async (id: number) => {
    const response = await api.get(`/api/accounts/${id}/balance`);
    return response.data.data;
  },
};

// Transactions Service
export const transactionsService = {
  getTransactions: async (): Promise<Transaction[]> => {
    const response = await api.get("/api/transactions/");
    return response.data.data;
  },

  getTransaction: async (id: number): Promise<Transaction> => {
    const response = await api.get(`/api/transactions/${id}`);
    return response.data.data;
  },

  getAccountTransactions: async (accountId: number): Promise<Transaction[]> => {
    const response = await api.get(`/api/transactions/account/${accountId}`);
    return response.data.data;
  },

  createTransaction: async (transactionData: {
    account_id: number;
    type: string;
    amount: number;
    description?: string;
  }): Promise<Transaction> => {
    const response = await api.post("/api/transactions/", transactionData);
    return response.data.data;
  },

  transfer: async (transferData: {
    from_account_id: number;
    to_account_id: number;
    amount: number;
    description?: string;
  }) => {
    const response = await api.post("/api/transactions/transfer", transferData);
    return response.data.data;
  },
};

// Notifications Service
export const notificationsService = {
  getNotifications: async (): Promise<Notification[]> => {
    const response = await api.get("/api/notifications/");
    return response.data.data;
  },

  getNotification: async (id: number): Promise<Notification> => {
    const response = await api.get(`/api/notifications/${id}`);
    return response.data.data;
  },

  createNotification: async (notificationData: {
    type: string;
    title: string;
    message: string;
  }): Promise<Notification> => {
    const response = await api.post("/api/notifications/", notificationData);
    return response.data.data;
  },

  markAsRead: async (id: number): Promise<Notification> => {
    const response = await api.put(`/api/notifications/${id}/read`);
    return response.data.data;
  },

  deleteNotification: async (id: number) => {
    const response = await api.delete(`/api/notifications/${id}`);
    return response.data;
  },
};

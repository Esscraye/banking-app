import "@testing-library/jest-dom";
import {
  authService,
  accountsService,
  transactionsService,
  notificationsService,
  User,
  Account,
  Transaction,
  Notification,
} from "../services";
import api from "../api";

// Mock the api module
jest.mock("../api");
const mockedApi = api as jest.Mocked<typeof api>;

describe("Services", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("authService", () => {
    describe("login", () => {
      it("should make POST request to /api/auth/login", async () => {
        const credentials = { email: "test@example.com", password: "password" };
        const mockResponse = { data: { token: "mock-token", user: { id: 1 } } };

        mockedApi.post.mockResolvedValue({ data: mockResponse });

        const result = await authService.login(credentials);

        expect(mockedApi.post).toHaveBeenCalledWith(
          "/api/auth/login",
          credentials,
        );
        expect(result).toEqual(mockResponse);
      });

      it("should handle login errors", async () => {
        const credentials = { email: "test@example.com", password: "wrong" };
        const mockError = new Error("Invalid credentials");

        mockedApi.post.mockRejectedValue(mockError);

        await expect(authService.login(credentials)).rejects.toThrow(
          "Invalid credentials",
        );
      });
    });

    describe("register", () => {
      it("should make POST request to /api/auth/register", async () => {
        const userData = {
          email: "test@example.com",
          password: "password",
          first_name: "John",
          last_name: "Doe",
          phone: "123456789",
        };
        const mockResponse = { token: "mock-token", user: { id: 1 } };

        mockedApi.post.mockResolvedValue({ data: mockResponse });

        const result = await authService.register(userData);

        expect(mockedApi.post).toHaveBeenCalledWith(
          "/api/auth/register",
          userData,
        );
        expect(result).toEqual(mockResponse);
      });

      it("should handle register without phone", async () => {
        const userData = {
          email: "test@example.com",
          password: "password",
          first_name: "John",
          last_name: "Doe",
        };
        const mockResponse = { token: "mock-token", user: { id: 1 } };

        mockedApi.post.mockResolvedValue({ data: mockResponse });

        const result = await authService.register(userData);

        expect(mockedApi.post).toHaveBeenCalledWith(
          "/api/auth/register",
          userData,
        );
        expect(result).toEqual(mockResponse);
      });
    });

    describe("logout", () => {
      it("should make POST request to /api/auth/logout", async () => {
        const mockResponse = { message: "Logged out successfully" };

        mockedApi.post.mockResolvedValue({ data: mockResponse });

        const result = await authService.logout();

        expect(mockedApi.post).toHaveBeenCalledWith("/api/auth/logout");
        expect(result).toEqual(mockResponse);
      });
    });

    describe("getProfile", () => {
      it("should make GET request to /api/auth/profile", async () => {
        const mockUser: User = {
          id: 1,
          email: "test@example.com",
          first_name: "John",
          last_name: "Doe",
          phone: "123456789",
          is_active: true,
          created_at: "2023-01-01T00:00:00Z",
          updated_at: "2023-01-01T00:00:00Z",
        };

        mockedApi.get.mockResolvedValue({ data: { data: mockUser } });

        const result = await authService.getProfile();

        expect(mockedApi.get).toHaveBeenCalledWith("/api/auth/profile");
        expect(result).toEqual(mockUser);
      });
    });

    describe("updateProfile", () => {
      it("should make PUT request to /api/auth/profile", async () => {
        const userData = { first_name: "Jane", last_name: "Smith" };
        const mockUser: User = {
          id: 1,
          email: "test@example.com",
          first_name: "Jane",
          last_name: "Smith",
          is_active: true,
          created_at: "2023-01-01T00:00:00Z",
          updated_at: "2023-01-01T00:00:00Z",
        };

        mockedApi.put.mockResolvedValue({ data: { data: mockUser } });

        const result = await authService.updateProfile(userData);

        expect(mockedApi.put).toHaveBeenCalledWith(
          "/api/auth/profile",
          userData,
        );
        expect(result).toEqual(mockUser);
      });
    });

    describe("changePassword", () => {
      it("should make POST request to /api/auth/change-password", async () => {
        const passwordData = {
          current_password: "oldpass",
          new_password: "newpass",
        };
        const mockResponse = { message: "Password changed successfully" };

        mockedApi.post.mockResolvedValue({ data: mockResponse });

        const result = await authService.changePassword(passwordData);

        expect(mockedApi.post).toHaveBeenCalledWith(
          "/api/auth/change-password",
          passwordData,
        );
        expect(result).toEqual(mockResponse);
      });
    });
  });

  describe("accountsService", () => {
    describe("getAccounts", () => {
      it("should make GET request to /api/accounts/", async () => {
        const mockAccounts: Account[] = [
          {
            id: 1,
            user_id: 1,
            account_number: "ACC001",
            account_type: "checking",
            balance: 1000,
            currency: "EUR",
            status: "active",
            created_at: "2023-01-01T00:00:00Z",
            updated_at: "2023-01-01T00:00:00Z",
          },
        ];

        mockedApi.get.mockResolvedValue({ data: { data: mockAccounts } });

        const result = await accountsService.getAccounts();

        expect(mockedApi.get).toHaveBeenCalledWith("/api/accounts/");
        expect(result).toEqual(mockAccounts);
      });
    });

    describe("getAccount", () => {
      it("should make GET request to /api/accounts/:id", async () => {
        const mockAccount: Account = {
          id: 1,
          user_id: 1,
          account_number: "ACC001",
          account_type: "checking",
          balance: 1000,
          currency: "EUR",
          status: "active",
          created_at: "2023-01-01T00:00:00Z",
          updated_at: "2023-01-01T00:00:00Z",
        };

        mockedApi.get.mockResolvedValue({ data: { data: mockAccount } });

        const result = await accountsService.getAccount(1);

        expect(mockedApi.get).toHaveBeenCalledWith("/api/accounts/1");
        expect(result).toEqual(mockAccount);
      });
    });

    describe("createAccount", () => {
      it("should make POST request to /api/accounts/", async () => {
        const accountData = { account_type: "savings", currency: "EUR" };
        const mockAccount: Account = {
          id: 2,
          user_id: 1,
          account_number: "ACC002",
          account_type: "savings",
          balance: 0,
          currency: "EUR",
          status: "active",
          created_at: "2023-01-01T00:00:00Z",
          updated_at: "2023-01-01T00:00:00Z",
        };

        mockedApi.post.mockResolvedValue({ data: { data: mockAccount } });

        const result = await accountsService.createAccount(accountData);

        expect(mockedApi.post).toHaveBeenCalledWith(
          "/api/accounts/",
          accountData,
        );
        expect(result).toEqual(mockAccount);
      });
    });

    describe("updateAccount", () => {
      it("should make PUT request to /api/accounts/:id", async () => {
        const accountData = { status: "frozen" };
        const mockAccount: Account = {
          id: 1,
          user_id: 1,
          account_number: "ACC001",
          account_type: "checking",
          balance: 1000,
          currency: "EUR",
          status: "frozen",
          created_at: "2023-01-01T00:00:00Z",
          updated_at: "2023-01-01T00:00:00Z",
        };

        mockedApi.put.mockResolvedValue({ data: { data: mockAccount } });

        const result = await accountsService.updateAccount(1, accountData);

        expect(mockedApi.put).toHaveBeenCalledWith(
          "/api/accounts/1",
          accountData,
        );
        expect(result).toEqual(mockAccount);
      });
    });

    describe("deleteAccount", () => {
      it("should make DELETE request to /api/accounts/:id", async () => {
        const mockResponse = { message: "Account deleted successfully" };

        mockedApi.delete.mockResolvedValue({ data: mockResponse });

        const result = await accountsService.deleteAccount(1);

        expect(mockedApi.delete).toHaveBeenCalledWith("/api/accounts/1");
        expect(result).toEqual(mockResponse);
      });
    });

    describe("getBalance", () => {
      it("should make GET request to /api/accounts/:id/balance", async () => {
        const mockBalance = { balance: 1500, currency: "EUR" };

        mockedApi.get.mockResolvedValue({ data: { data: mockBalance } });

        const result = await accountsService.getBalance(1);

        expect(mockedApi.get).toHaveBeenCalledWith("/api/accounts/1/balance");
        expect(result).toEqual(mockBalance);
      });
    });
  });

  describe("transactionsService", () => {
    describe("getTransactions", () => {
      it("should make GET request to /api/transactions/", async () => {
        const mockTransactions: Transaction[] = [
          {
            id: 1,
            account_id: 1,
            type: "credit",
            amount: 100,
            currency: "EUR",
            description: "Test transaction",
            status: "completed",
            created_at: "2023-01-01T00:00:00Z",
            updated_at: "2023-01-01T00:00:00Z",
          },
        ];

        mockedApi.get.mockResolvedValue({ data: { data: mockTransactions } });

        const result = await transactionsService.getTransactions();

        expect(mockedApi.get).toHaveBeenCalledWith("/api/transactions/");
        expect(result).toEqual(mockTransactions);
      });
    });

    describe("getTransaction", () => {
      it("should make GET request to /api/transactions/:id", async () => {
        const mockTransaction: Transaction = {
          id: 1,
          account_id: 1,
          type: "credit",
          amount: 100,
          currency: "EUR",
          description: "Test transaction",
          status: "completed",
          created_at: "2023-01-01T00:00:00Z",
          updated_at: "2023-01-01T00:00:00Z",
        };

        mockedApi.get.mockResolvedValue({ data: { data: mockTransaction } });

        const result = await transactionsService.getTransaction(1);

        expect(mockedApi.get).toHaveBeenCalledWith("/api/transactions/1");
        expect(result).toEqual(mockTransaction);
      });
    });

    describe("getAccountTransactions", () => {
      it("should make GET request to /api/transactions/account/:id", async () => {
        const mockTransactions: Transaction[] = [
          {
            id: 1,
            account_id: 1,
            type: "credit",
            amount: 100,
            currency: "EUR",
            description: "Test transaction",
            status: "completed",
            created_at: "2023-01-01T00:00:00Z",
            updated_at: "2023-01-01T00:00:00Z",
          },
        ];

        mockedApi.get.mockResolvedValue({ data: { data: mockTransactions } });

        const result = await transactionsService.getAccountTransactions(1);

        expect(mockedApi.get).toHaveBeenCalledWith(
          "/api/transactions/account/1",
        );
        expect(result).toEqual(mockTransactions);
      });
    });

    describe("createTransaction", () => {
      it("should make POST request to /api/transactions/", async () => {
        const transactionData = {
          account_id: 1,
          type: "debit",
          amount: 50,
          description: "Test debit",
        };
        const mockTransaction: Transaction = {
          id: 2,
          account_id: 1,
          type: "debit",
          amount: 50,
          currency: "EUR",
          description: "Test debit",
          status: "completed",
          created_at: "2023-01-01T00:00:00Z",
          updated_at: "2023-01-01T00:00:00Z",
        };

        mockedApi.post.mockResolvedValue({ data: { data: mockTransaction } });

        const result =
          await transactionsService.createTransaction(transactionData);

        expect(mockedApi.post).toHaveBeenCalledWith(
          "/api/transactions/",
          transactionData,
        );
        expect(result).toEqual(mockTransaction);
      });
    });

    describe("transfer", () => {
      it("should make POST request to /api/transactions/transfer", async () => {
        const transferData = {
          from_account_id: 1,
          to_account_id: 2,
          amount: 200,
          description: "Transfer test",
        };
        const mockResponse = { success: true, transaction_id: 3 };

        mockedApi.post.mockResolvedValue({ data: { data: mockResponse } });

        const result = await transactionsService.transfer(transferData);

        expect(mockedApi.post).toHaveBeenCalledWith(
          "/api/transactions/transfer",
          transferData,
        );
        expect(result).toEqual(mockResponse);
      });
    });
  });

  describe("notificationsService", () => {
    describe("getNotifications", () => {
      it("should make GET request to /api/notifications/", async () => {
        const mockNotifications: Notification[] = [
          {
            id: 1,
            user_id: 1,
            type: "info",
            title: "Test Notification",
            message: "This is a test",
            is_read: false,
            created_at: "2023-01-01T00:00:00Z",
            updated_at: "2023-01-01T00:00:00Z",
          },
        ];

        mockedApi.get.mockResolvedValue({ data: { data: mockNotifications } });

        const result = await notificationsService.getNotifications();

        expect(mockedApi.get).toHaveBeenCalledWith("/api/notifications/");
        expect(result).toEqual(mockNotifications);
      });
    });

    describe("getNotification", () => {
      it("should make GET request to /api/notifications/:id", async () => {
        const mockNotification: Notification = {
          id: 1,
          user_id: 1,
          type: "info",
          title: "Test Notification",
          message: "This is a test",
          is_read: false,
          created_at: "2023-01-01T00:00:00Z",
          updated_at: "2023-01-01T00:00:00Z",
        };

        mockedApi.get.mockResolvedValue({ data: { data: mockNotification } });

        const result = await notificationsService.getNotification(1);

        expect(mockedApi.get).toHaveBeenCalledWith("/api/notifications/1");
        expect(result).toEqual(mockNotification);
      });
    });

    describe("createNotification", () => {
      it("should make POST request to /api/notifications/", async () => {
        const notificationData = {
          type: "warning",
          title: "Warning",
          message: "This is a warning",
        };
        const mockNotification: Notification = {
          id: 2,
          user_id: 1,
          type: "warning",
          title: "Warning",
          message: "This is a warning",
          is_read: false,
          created_at: "2023-01-01T00:00:00Z",
          updated_at: "2023-01-01T00:00:00Z",
        };

        mockedApi.post.mockResolvedValue({ data: { data: mockNotification } });

        const result =
          await notificationsService.createNotification(notificationData);

        expect(mockedApi.post).toHaveBeenCalledWith(
          "/api/notifications/",
          notificationData,
        );
        expect(result).toEqual(mockNotification);
      });
    });

    describe("markAsRead", () => {
      it("should make PUT request to /api/notifications/:id/read", async () => {
        const mockNotification: Notification = {
          id: 1,
          user_id: 1,
          type: "info",
          title: "Test Notification",
          message: "This is a test",
          is_read: true,
          created_at: "2023-01-01T00:00:00Z",
          updated_at: "2023-01-01T00:00:00Z",
        };

        mockedApi.put.mockResolvedValue({ data: { data: mockNotification } });

        const result = await notificationsService.markAsRead(1);

        expect(mockedApi.put).toHaveBeenCalledWith("/api/notifications/1/read");
        expect(result).toEqual(mockNotification);
      });
    });

    describe("deleteNotification", () => {
      it("should make DELETE request to /api/notifications/:id", async () => {
        const mockResponse = { message: "Notification deleted successfully" };

        mockedApi.delete.mockResolvedValue({ data: mockResponse });

        const result = await notificationsService.deleteNotification(1);

        expect(mockedApi.delete).toHaveBeenCalledWith("/api/notifications/1");
        expect(result).toEqual(mockResponse);
      });
    });
  });
});

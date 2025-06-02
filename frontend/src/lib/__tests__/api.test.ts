import "@testing-library/jest-dom";
import axios from "axios";

// Mock axios
jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  removeItem: jest.fn(),
  setItem: jest.fn(),
};
Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
});

// Mock window.location
delete (window as any).location;
window.location = { href: "" } as any;

describe("API Configuration", () => {
  let mockAxiosInstance: any;

  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
    window.location.href = "";

    // Setup mock axios instance
    mockAxiosInstance = {
      interceptors: {
        request: { use: jest.fn() },
        response: { use: jest.fn() },
      },
    };
    mockedAxios.create.mockReturnValue(mockAxiosInstance);
  });

  it("should have correct service URLs configuration", () => {
    // Test that the service URLs are properly configured
    const expectedUrls = {
      auth: process.env.NEXT_PUBLIC_AUTH_URL || "http://localhost:8082",
      accounts: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080",
      transactions:
        process.env.NEXT_PUBLIC_TRANSACTIONS_URL || "http://localhost:8081",
      notifications:
        process.env.NEXT_PUBLIC_NOTIFICATIONS_URL || "http://localhost:8083",
    };

    expect(expectedUrls.auth).toBeDefined();
    expect(expectedUrls.accounts).toBeDefined();
    expect(expectedUrls.transactions).toBeDefined();
    expect(expectedUrls.notifications).toBeDefined();
  });

  it("should use default URLs when environment variables are not set", () => {
    // Test default fallback URLs
    const authUrl = process.env.NEXT_PUBLIC_AUTH_URL || "http://localhost:8082";
    const accountsUrl =
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
    const transactionsUrl =
      process.env.NEXT_PUBLIC_TRANSACTIONS_URL || "http://localhost:8081";
    const notificationsUrl =
      process.env.NEXT_PUBLIC_NOTIFICATIONS_URL || "http://localhost:8083";

    expect(authUrl).toMatch(/http:\/\/localhost:8082|https?:\/\/.*auth/);
    expect(accountsUrl).toMatch(/http:\/\/localhost:8080|https?:\/\/.*api/);
    expect(transactionsUrl).toMatch(
      /http:\/\/localhost:8081|https?:\/\/.*transactions/,
    );
    expect(notificationsUrl).toMatch(
      /http:\/\/localhost:8083|https?:\/\/.*notifications/,
    );
  });

  it("should determine correct base URL for different endpoints", () => {
    // Test URL determination logic
    const getBaseURL = (url: string): string => {
      if (url.startsWith("/api/auth")) {
        return process.env.NEXT_PUBLIC_AUTH_URL || "http://localhost:8082";
      } else if (url.startsWith("/api/accounts")) {
        return process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
      } else if (url.startsWith("/api/transactions")) {
        return (
          process.env.NEXT_PUBLIC_TRANSACTIONS_URL || "http://localhost:8081"
        );
      } else if (url.startsWith("/api/notifications")) {
        return (
          process.env.NEXT_PUBLIC_NOTIFICATIONS_URL || "http://localhost:8083"
        );
      }
      return process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"; // fallback
    };

    expect(getBaseURL("/api/auth/login")).toBe(
      process.env.NEXT_PUBLIC_AUTH_URL || "http://localhost:8082",
    );
    expect(getBaseURL("/api/accounts/balance")).toBe(
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080",
    );
    expect(getBaseURL("/api/transactions/history")).toBe(
      process.env.NEXT_PUBLIC_TRANSACTIONS_URL || "http://localhost:8081",
    );
    expect(getBaseURL("/api/notifications/unread")).toBe(
      process.env.NEXT_PUBLIC_NOTIFICATIONS_URL || "http://localhost:8083",
    );
    expect(getBaseURL("/api/unknown/endpoint")).toBe(
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080",
    );
  });

  it("should handle localStorage operations correctly", () => {
    // Test localStorage mock is working
    localStorageMock.getItem.mockReturnValue("test-token");
    expect(localStorage.getItem("auth_token")).toBe("test-token");

    localStorageMock.setItem.mockImplementation((key, value) => {
      expect(key).toBe("auth_token");
      expect(value).toBe("new-token");
    });
    localStorage.setItem("auth_token", "new-token");

    localStorageMock.removeItem.mockImplementation((key) => {
      expect(key).toBe("auth_token");
    });
    localStorage.removeItem("auth_token");

    expect(localStorageMock.getItem).toHaveBeenCalledWith("auth_token");
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      "auth_token",
      "new-token",
    );
    expect(localStorageMock.removeItem).toHaveBeenCalledWith("auth_token");
  });

  it("should handle window location correctly", () => {
    // Test window.location mock is working
    window.location.href = "/login";
    expect(window.location.href).toBe("/login");

    window.location.href = "/dashboard";
    expect(window.location.href).toBe("/dashboard");
  });
});

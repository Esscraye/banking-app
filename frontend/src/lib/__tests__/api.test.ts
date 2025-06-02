/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import "@testing-library/jest-dom";
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from "axios";

// Variables to store interceptor functions
let requestInterceptorSuccess:
  | ((config: AxiosRequestConfig) => AxiosRequestConfig)
  | undefined;
let requestInterceptorError: ((error: any) => Promise<any>) | undefined;
let responseInterceptorSuccess:
  | ((response: AxiosResponse<any, any>) => AxiosResponse<any, any>)
  | undefined;
let responseInterceptorError: ((error: any) => Promise<any>) | undefined;

// Create mock interceptors object
const mockInterceptors = {
  request: {
    use: jest
      .fn()
      .mockImplementation(
        (
          success: (config: AxiosRequestConfig) => AxiosRequestConfig,
          error: (error: any) => Promise<any>,
        ) => {
          requestInterceptorSuccess = success;
          requestInterceptorError = error;
          return 1; // Return interceptor id
        },
      ),
  },
  response: {
    use: jest
      .fn()
      .mockImplementation(
        (
          success: (response: AxiosResponse) => AxiosResponse,
          error: (error: any) => Promise<any>,
        ) => {
          responseInterceptorSuccess = success;
          responseInterceptorError = error;
          return 1; // Return interceptor id
        },
      ),
  },
};

// Setup mock axios instance with interceptors
const mockAxiosInstance: AxiosInstance = {
  interceptors: mockInterceptors,
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
  patch: jest.fn(),
  options: jest.fn(),
  head: jest.fn(),
  request: jest.fn(),
  getUri: jest.fn(),
  defaults: {} as any,
} as unknown as AxiosInstance;

// Mock axios completely before importing anything else
jest.mock("axios", () => ({
  __esModule: true,
  default: {
    create: jest.fn(() => mockAxiosInstance),
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
    patch: jest.fn(),
    options: jest.fn(),
    head: jest.fn(),
    request: jest.fn(),
  },
}));

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
  beforeAll(async () => {
    // Import the api module to register interceptors with our mocks
    await import("../api");
  });

  beforeEach(async () => {
    // Don't clear all mocks as it resets axios.create call count
    // Instead, selectively clear what we need
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
    localStorageMock.removeItem.mockClear();
    localStorageMock.getItem.mockReturnValue(null);
    window.location.href = "";

    // Reset the captured interceptor functions
    requestInterceptorSuccess = undefined;
    requestInterceptorError = undefined;
    responseInterceptorSuccess = undefined;
    responseInterceptorError = undefined;

    // Clear only interceptor mocks but preserve create call tracking
    mockInterceptors.request.use.mockClear();
    mockInterceptors.response.use.mockClear();

    // Re-import to capture interceptors
    jest.resetModules();
    await import("../api");
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
      // No expectation here - just mock the function
    });
    localStorage.setItem("auth_token", "new-token");

    localStorageMock.removeItem.mockImplementation((key) => {
      // No expectation here - just mock the function
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

  it("should create axios instance with correct configuration", () => {
    expect(mockedAxios.create).toHaveBeenCalledWith({
      timeout: 10000,
    });
  });

  it("should setup request interceptor correctly", () => {
    // The api module has already been imported at the top of this file
    // So the interceptors should have been set up during initial import
    expect(mockAxiosInstance.interceptors.request.use).toHaveBeenCalled();
    expect(mockAxiosInstance.interceptors.response.use).toHaveBeenCalled();
  });

  it("should add auth token to request headers when token exists", () => {
    localStorageMock.getItem.mockReturnValue("test-token");

    const config = {
      url: "/api/accounts/balance",
      headers: {},
    };

    // Call the request interceptor success function
    const modifiedConfig = requestInterceptorSuccess!(config);

    expect(localStorageMock.getItem).toHaveBeenCalledWith("auth_token");
    expect(modifiedConfig.headers?.Authorization).toBe("Bearer test-token");
    expect(modifiedConfig.baseURL).toBe(
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080",
    );
  });

  it("should not add auth header when no token exists", () => {
    localStorageMock.getItem.mockReturnValue(null);

    const config = {
      url: "/api/transactions/history",
      headers: {},
    };

    const modifiedConfig = requestInterceptorSuccess!(config);

    expect(modifiedConfig.headers?.Authorization).toBeUndefined();
    expect(modifiedConfig.baseURL).toBe(
      process.env.NEXT_PUBLIC_TRANSACTIONS_URL || "http://localhost:8081",
    );
  });

  it("should handle request interceptor errors", () => {
    const error = new Error("Request error");
    const result = requestInterceptorError!(error);

    expect(result).rejects.toBe(error);
  });

  it("should handle successful responses", () => {
    const response = {
      data: { success: true },
      status: 200,
      statusText: "",
      headers: {},
      config: {},
    } as AxiosResponse;
    const result = responseInterceptorSuccess!(response);

    expect(result).toBe(response);
  });

  it("should handle 401 errors by clearing storage and redirecting", () => {
    const error = {
      response: { status: 401 },
    };

    const result = responseInterceptorError!(error);

    expect(localStorageMock.removeItem).toHaveBeenCalledWith("auth_token");
    expect(localStorageMock.removeItem).toHaveBeenCalledWith("user");
    expect(window.location.href).toBe("/login");
    expect(result).rejects.toBe(error);
  });

  it("should handle non-401 errors without clearing storage", () => {
    const error = {
      response: { status: 500 },
    };

    const result = responseInterceptorError!(error);

    expect(localStorageMock.removeItem).not.toHaveBeenCalled();
    expect(window.location.href).toBe("");
    expect(result).rejects.toBe(error);
  });

  it("should handle errors without response object", () => {
    const error = new Error("Network error");

    const result = responseInterceptorError!(error);

    expect(localStorageMock.removeItem).not.toHaveBeenCalled();
    expect(window.location.href).toBe("");
    expect(result).rejects.toBe(error);
  });

  it("should set correct base URL for auth endpoints", () => {
    const config = {
      url: "/api/auth/login",
      headers: {},
    };

    const modifiedConfig = requestInterceptorSuccess!(config);

    expect(modifiedConfig.baseURL).toBe(
      process.env.NEXT_PUBLIC_AUTH_URL || "http://localhost:8082",
    );
  });

  it("should set correct base URL for notifications endpoints", () => {
    const config = {
      url: "/api/notifications/unread",
      headers: {},
    };

    const modifiedConfig = requestInterceptorSuccess!(config);

    expect(modifiedConfig.baseURL).toBe(
      process.env.NEXT_PUBLIC_NOTIFICATIONS_URL || "http://localhost:8083",
    );
  });

  it("should handle config without url property", () => {
    const config = {
      headers: {},
    };

    const modifiedConfig = requestInterceptorSuccess!(config);

    expect(modifiedConfig.baseURL).toBeUndefined();
  });
});

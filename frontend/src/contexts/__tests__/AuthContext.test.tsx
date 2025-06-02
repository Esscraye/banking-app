import "@testing-library/jest-dom";
import { render, screen, waitFor, act } from "@testing-library/react";
import { renderHook } from "@testing-library/react";
import React from "react";
import { AuthProvider, useAuth } from "../AuthContext";

// Mock authService
jest.mock("@/lib/services", () => ({
  authService: {
    login: jest.fn(),
    register: jest.fn(),
    updateProfile: jest.fn(),
  },
}));

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
};
Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
});

const { authService } = require("@/lib/services");

describe("AuthContext", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  describe("useAuth hook", () => {
    it("throws error when used outside AuthProvider", () => {
      // Suppress console.error for this test since we expect an error
      const originalError = console.error;
      console.error = jest.fn();

      expect(() => {
        renderHook(() => useAuth());
      }).toThrow("useAuth must be used within an AuthProvider");

      console.error = originalError;
    });

    it("returns context when used within AuthProvider", () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AuthProvider>{children}</AuthProvider>
      );

      const { result } = renderHook(() => useAuth(), { wrapper });

      expect(result.current).toBeDefined();
      expect(result.current.user).toBeNull();
      expect(result.current.token).toBeNull();
      expect(result.current.isLoading).toBe(false);
      expect(typeof result.current.login).toBe("function");
      expect(typeof result.current.register).toBe("function");
      expect(typeof result.current.logout).toBe("function");
      expect(typeof result.current.updateProfile).toBe("function");
    });
  });

  describe("AuthProvider", () => {
    it("initializes with no user and loading false when no stored data", async () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AuthProvider>{children}</AuthProvider>
      );

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.user).toBeNull();
      expect(result.current.token).toBeNull();
    });

    it("initializes with stored user data when available", async () => {
      const mockUser = {
        id: 1,
        email: "test@example.com",
        first_name: "John",
        last_name: "Doe",
        is_active: true,
        created_at: "2025-01-01T00:00:00Z",
        updated_at: "2025-01-01T00:00:00Z",
      };
      const mockToken = "mock-token";

      localStorageMock.getItem.mockImplementation((key) => {
        if (key === "auth_token") return mockToken;
        if (key === "user") return JSON.stringify(mockUser);
        return null;
      });

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AuthProvider>{children}</AuthProvider>
      );

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.user).toEqual(mockUser);
      expect(result.current.token).toBe(mockToken);
    });

    it("handles login successfully", async () => {
      const mockUser = {
        id: 1,
        email: "test@example.com",
        first_name: "John",
        last_name: "Doe",
        is_active: true,
        created_at: "2025-01-01T00:00:00Z",
        updated_at: "2025-01-01T00:00:00Z",
      };
      const mockToken = "mock-token";
      const credentials = { email: "test@example.com", password: "password" };

      authService.login.mockResolvedValue({
        data: { token: mockToken, user: mockUser },
      });

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AuthProvider>{children}</AuthProvider>
      );

      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        await result.current.login(credentials);
      });

      expect(authService.login).toHaveBeenCalledWith(credentials);
      expect(result.current.user).toEqual(mockUser);
      expect(result.current.token).toBe(mockToken);
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        "auth_token",
        mockToken,
      );
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        "user",
        JSON.stringify(mockUser),
      );
    });

    it("handles login error", async () => {
      const credentials = { email: "test@example.com", password: "wrong" };
      const error = new Error("Invalid credentials");

      authService.login.mockRejectedValue(error);

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AuthProvider>{children}</AuthProvider>
      );

      const { result } = renderHook(() => useAuth(), { wrapper });

      await expect(
        act(async () => {
          await result.current.login(credentials);
        }),
      ).rejects.toThrow("Invalid credentials");

      expect(result.current.user).toBeNull();
      expect(result.current.token).toBeNull();
    });

    it("handles register successfully", async () => {
      const mockUser = {
        id: 1,
        email: "test@example.com",
        first_name: "John",
        last_name: "Doe",
        is_active: true,
        created_at: "2025-01-01T00:00:00Z",
        updated_at: "2025-01-01T00:00:00Z",
      };
      const mockToken = "mock-token";
      const userData = {
        email: "test@example.com",
        password: "password",
        first_name: "John",
        last_name: "Doe",
      };

      authService.register.mockResolvedValue({
        data: { token: mockToken, user: mockUser },
      });

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AuthProvider>{children}</AuthProvider>
      );

      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        await result.current.register(userData);
      });

      expect(authService.register).toHaveBeenCalledWith(userData);
      expect(result.current.user).toEqual(mockUser);
      expect(result.current.token).toBe(mockToken);
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        "auth_token",
        mockToken,
      );
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        "user",
        JSON.stringify(mockUser),
      );
    });

    it("handles register error", async () => {
      const userData = {
        email: "test@example.com",
        password: "password",
        first_name: "John",
        last_name: "Doe",
      };
      const error = new Error("Registration failed");

      authService.register.mockRejectedValue(error);

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AuthProvider>{children}</AuthProvider>
      );

      const { result } = renderHook(() => useAuth(), { wrapper });

      await expect(
        act(async () => {
          await result.current.register(userData);
        }),
      ).rejects.toThrow("Registration failed");

      expect(result.current.user).toBeNull();
      expect(result.current.token).toBeNull();
    });

    it("handles logout", async () => {
      // First login
      const mockUser = {
        id: 1,
        email: "test@example.com",
        first_name: "John",
        last_name: "Doe",
        is_active: true,
        created_at: "2025-01-01T00:00:00Z",
        updated_at: "2025-01-01T00:00:00Z",
      };
      const mockToken = "mock-token";

      localStorageMock.getItem.mockImplementation((key) => {
        if (key === "auth_token") return mockToken;
        if (key === "user") return JSON.stringify(mockUser);
        return null;
      });

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AuthProvider>{children}</AuthProvider>
      );

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.user).toEqual(mockUser);
      });

      // Then logout
      act(() => {
        result.current.logout();
      });

      expect(result.current.user).toBeNull();
      expect(result.current.token).toBeNull();
      expect(localStorageMock.removeItem).toHaveBeenCalledWith("auth_token");
      expect(localStorageMock.removeItem).toHaveBeenCalledWith("user");
    });

    it("handles updateProfile successfully", async () => {
      const initialUser = {
        id: 1,
        email: "test@example.com",
        first_name: "John",
        last_name: "Doe",
        is_active: true,
        created_at: "2025-01-01T00:00:00Z",
        updated_at: "2025-01-01T00:00:00Z",
      };

      const updatedUser = {
        ...initialUser,
        first_name: "Jane",
      };

      const updateData = { first_name: "Jane" };

      localStorageMock.getItem.mockImplementation((key) => {
        if (key === "auth_token") return "mock-token";
        if (key === "user") return JSON.stringify(initialUser);
        return null;
      });

      authService.updateProfile.mockResolvedValue(updatedUser);

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AuthProvider>{children}</AuthProvider>
      );

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.user).toEqual(initialUser);
      });

      await act(async () => {
        await result.current.updateProfile(updateData);
      });

      expect(authService.updateProfile).toHaveBeenCalledWith(updateData);
      expect(result.current.user).toEqual(updatedUser);
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        "user",
        JSON.stringify(updatedUser),
      );
    });

    it("handles updateProfile error", async () => {
      const initialUser = {
        id: 1,
        email: "test@example.com",
        first_name: "John",
        last_name: "Doe",
        is_active: true,
        created_at: "2025-01-01T00:00:00Z",
        updated_at: "2025-01-01T00:00:00Z",
      };

      localStorageMock.getItem.mockImplementation((key) => {
        if (key === "auth_token") return "mock-token";
        if (key === "user") return JSON.stringify(initialUser);
        return null;
      });

      const updateData = { first_name: "Jane" };
      const error = new Error("Update failed");

      authService.updateProfile.mockRejectedValue(error);

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AuthProvider>{children}</AuthProvider>
      );

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.user).toEqual(initialUser);
      });

      await expect(
        act(async () => {
          await result.current.updateProfile(updateData);
        }),
      ).rejects.toThrow("Update failed");

      // User should remain unchanged
      expect(result.current.user).toEqual(initialUser);
    });
  });
});

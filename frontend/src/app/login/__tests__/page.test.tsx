import "@testing-library/jest-dom";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { useRouter } from "next/navigation";
import LoginPage from "../page";
import { authService } from "@/lib/services";

// Mock useRouter
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
}));

// Mock authService
jest.mock("@/lib/services", () => ({
  authService: {
    login: jest.fn(),
  },
}));

// Mock localStorage
const localStorageMock = {
  setItem: jest.fn(),
};
Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
});

const mockPush = jest.fn();
const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;
const mockAuthService = authService as jest.Mocked<typeof authService>;

describe("LoginPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseRouter.mockReturnValue({
      push: mockPush,
    } as any); // TODO: Replace any with a more specific type if possible
  });

  it("renders login form correctly", () => {
    render(<LoginPage />);

    expect(screen.getByText("Sign in to your account")).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /sign in/i }),
    ).toBeInTheDocument();
    expect(screen.getByText("Or")).toBeInTheDocument();
    expect(screen.getByText("create a new account")).toBeInTheDocument();
  });

  it("updates form data when inputs change", () => {
    render(<LoginPage />);

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);

    fireEvent.change(emailInput, { target: { value: "test@example.com" } });
    fireEvent.change(passwordInput, { target: { value: "password123" } });

    expect(emailInput).toHaveValue("test@example.com");
    expect(passwordInput).toHaveValue("password123");
  });

  it("handles successful login", async () => {
    const mockResponse = {
      data: {
        token: "mock-token",
        user: {
          id: 1,
          email: "test@example.com",
          first_name: "John",
          last_name: "Doe",
        },
      },
    };

    mockAuthService.login.mockResolvedValue(mockResponse);

    render(<LoginPage />);

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole("button", { name: /sign in/i });

    fireEvent.change(emailInput, { target: { value: "test@example.com" } });
    fireEvent.change(passwordInput, { target: { value: "password123" } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockAuthService.login).toHaveBeenCalledWith({
        email: "test@example.com",
        password: "password123",
      });
    });

    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      "auth_token",
      "mock-token",
    );
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      "user",
      JSON.stringify(mockResponse.data.user),
    );
    expect(mockPush).toHaveBeenCalledWith("/");
  });

  it("handles login error", async () => {
    const mockError = {
      response: {
        data: {
          message: "Invalid credentials",
        },
      },
    };

    mockAuthService.login.mockRejectedValue(mockError);

    render(<LoginPage />);

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole("button", { name: /sign in/i });

    fireEvent.change(emailInput, { target: { value: "test@example.com" } });
    fireEvent.change(passwordInput, { target: { value: "wrongpassword" } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText("Invalid credentials")).toBeInTheDocument();
    });

    expect(mockPush).not.toHaveBeenCalled();
    expect(localStorageMock.setItem).not.toHaveBeenCalled();
  });

  it("handles login error without specific message", async () => {
    mockAuthService.login.mockRejectedValue(new Error("Network error"));

    render(<LoginPage />);

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole("button", { name: /sign in/i });

    fireEvent.change(emailInput, { target: { value: "test@example.com" } });
    fireEvent.change(passwordInput, { target: { value: "password123" } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText("Login failed. Please try again."),
      ).toBeInTheDocument();
    });
  });

  it("shows loading state during login", async () => {
    mockAuthService.login.mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 100)),
    );

    render(<LoginPage />);

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole("button", { name: /sign in/i });

    fireEvent.change(emailInput, { target: { value: "test@example.com" } });
    fireEvent.change(passwordInput, { target: { value: "password123" } });
    fireEvent.click(submitButton);

    expect(submitButton).toBeDisabled();
    expect(screen.getByText(/signing in/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(submitButton).not.toBeDisabled();
    });
  });

  it("prevents form submission when already loading", () => {
    render(<LoginPage />);

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole("button", { name: /sign in/i });

    fireEvent.change(emailInput, { target: { value: "test@example.com" } });
    fireEvent.change(passwordInput, { target: { value: "password123" } });

    // Submit form
    fireEvent.click(submitButton);

    // Try to submit again while loading
    fireEvent.click(submitButton);

    // Should only be called once due to loading state preventing second submit
    expect(mockAuthService.login).toHaveBeenCalledTimes(1);
  });

  it("clears error when form is resubmitted", async () => {
    // First, cause an error
    mockAuthService.login.mockRejectedValueOnce(new Error("Login failed"));

    render(<LoginPage />);

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole("button", { name: /sign in/i });

    fireEvent.change(emailInput, { target: { value: "test@example.com" } });
    fireEvent.change(passwordInput, { target: { value: "wrong" } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText("Login failed. Please try again."),
      ).toBeInTheDocument();
    });

    // Now mock successful login
    mockAuthService.login.mockResolvedValue({
      data: { token: "token", user: { id: 1 } },
    });

    // Submit again
    fireEvent.change(passwordInput, { target: { value: "correct" } });
    fireEvent.click(submitButton);

    // Error should be cleared
    await waitFor(() => {
      expect(
        screen.queryByText("Login failed. Please try again."),
      ).not.toBeInTheDocument();
    });
  });
});

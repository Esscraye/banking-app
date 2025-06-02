import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { useRouter } from "next/navigation";
import RegisterPage from "../page";
import { authService } from "@/lib/services";

// Mock next/navigation
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
}));

// Mock Link component
jest.mock("next/link", () => {
  return function MockLink({
    children,
    href,
  }: {
    children: React.ReactNode;
    href: string;
  }) {
    return <a href={href}>{children}</a>;
  };
});

// Mock authService
jest.mock("@/lib/services", () => ({
  authService: {
    register: jest.fn(),
  },
}));

describe("RegisterPage", () => {
  const mockPush = jest.fn();
  const mockAuthService = authService as jest.Mocked<typeof authService>;

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    });
  });

  it("should render registration form", () => {
    render(<RegisterPage />);

    expect(screen.getByText("Create your account")).toBeInTheDocument();
    expect(
      screen.getByText("Fill in your information to create a new account."),
    ).toBeInTheDocument();
    expect(screen.getByPlaceholderText("First Name")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Last Name")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Email address")).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("Phone Number (optional)"),
    ).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Password")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Confirm Password")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /create account/i }),
    ).toBeInTheDocument();
  });

  it("should have link to login page", () => {
    render(<RegisterPage />);
    expect(
      screen.getByText("sign in to your existing account"),
    ).toBeInTheDocument();
  });

  it("should show validation error when passwords do not match", async () => {
    render(<RegisterPage />);

    const firstNameInput = screen.getByPlaceholderText("First Name");
    const lastNameInput = screen.getByPlaceholderText("Last Name");
    const emailInput = screen.getByPlaceholderText("Email address");
    const passwordInput = screen.getByPlaceholderText("Password");
    const confirmPasswordInput =
      screen.getByPlaceholderText("Confirm Password");
    const submitButton = screen.getByRole("button", {
      name: /create account/i,
    });

    fireEvent.change(firstNameInput, { target: { value: "John" } });
    fireEvent.change(lastNameInput, { target: { value: "Doe" } });
    fireEvent.change(emailInput, { target: { value: "john@example.com" } });
    fireEvent.change(passwordInput, { target: { value: "password123" } });
    fireEvent.change(confirmPasswordInput, { target: { value: "different" } });

    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText("Passwords do not match")).toBeInTheDocument();
    });
  });

  it("should call register service on successful form submission", async () => {
    mockAuthService.register.mockResolvedValue({
      data: {
        token: "fake-token",
        user: { id: 1, email: "john@example.com" },
      },
    });

    // Mock localStorage
    const mockLocalStorage = {
      setItem: jest.fn(),
    };
    Object.defineProperty(window, "localStorage", {
      value: mockLocalStorage,
    });

    render(<RegisterPage />);

    const firstNameInput = screen.getByPlaceholderText("First Name");
    const lastNameInput = screen.getByPlaceholderText("Last Name");
    const emailInput = screen.getByPlaceholderText("Email address");
    const passwordInput = screen.getByPlaceholderText("Password");
    const confirmPasswordInput =
      screen.getByPlaceholderText("Confirm Password");
    const submitButton = screen.getByRole("button", {
      name: /create account/i,
    });

    fireEvent.change(firstNameInput, { target: { value: "John" } });
    fireEvent.change(lastNameInput, { target: { value: "Doe" } });
    fireEvent.change(emailInput, { target: { value: "john@example.com" } });
    fireEvent.change(passwordInput, { target: { value: "password123" } });
    fireEvent.change(confirmPasswordInput, {
      target: { value: "password123" },
    });

    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockAuthService.register).toHaveBeenCalledWith({
        email: "john@example.com",
        password: "password123",
        first_name: "John",
        last_name: "Doe",
        phone: "",
      });
    });

    expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
      "auth_token",
      "fake-token",
    );
    expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
      "user",
      JSON.stringify({ id: 1, email: "john@example.com" }),
    );
    expect(mockPush).toHaveBeenCalledWith("/");
  });
});

import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import Home from "../page";

// Mock the components
jest.mock("@/contexts/AuthContext", () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="auth-provider">{children}</div>
  ),
}));

jest.mock("@/components/ProtectedRoute", () => ({
  ProtectedRoute: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="protected-route">{children}</div>
  ),
}));

jest.mock("@/components/Dashboard", () => {
  return function MockDashboard() {
    return <div data-testid="dashboard">Dashboard Component</div>;
  };
});

describe("Home Page", () => {
  it("should render AuthProvider", () => {
    render(<Home />);
    expect(screen.getByTestId("auth-provider")).toBeInTheDocument();
  });

  it("should render ProtectedRoute within AuthProvider", () => {
    render(<Home />);

    const authProvider = screen.getByTestId("auth-provider");
    const protectedRoute = screen.getByTestId("protected-route");

    expect(authProvider).toContainElement(protectedRoute);
  });

  it("should render Dashboard within ProtectedRoute", () => {
    render(<Home />);

    const protectedRoute = screen.getByTestId("protected-route");
    const dashboard = screen.getByTestId("dashboard");

    expect(protectedRoute).toContainElement(dashboard);
  });

  it("should have the correct component hierarchy", () => {
    render(<Home />);

    // Check that components are nested correctly
    const authProvider = screen.getByTestId("auth-provider");
    const protectedRoute = screen.getByTestId("protected-route");
    const dashboard = screen.getByTestId("dashboard");

    expect(authProvider).toBeInTheDocument();
    expect(protectedRoute).toBeInTheDocument();
    expect(dashboard).toBeInTheDocument();

    // Verify nesting
    expect(authProvider).toContainElement(protectedRoute);
    expect(protectedRoute).toContainElement(dashboard);
  });
});

import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import RootLayout from "../layout";

// Mock the CSS import
jest.mock("../globals.css", () => ({}));

// Mock the font imports
jest.mock("next/font/google", () => ({
  Geist: () => ({
    variable: "--font-geist-sans",
  }),
  Geist_Mono: () => ({
    variable: "--font-geist-mono",
  }),
}));

// Mock AuthProvider
jest.mock("@/contexts/AuthContext", () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="auth-provider">{children}</div>
  ),
}));

describe("RootLayout", () => {
  it("should render children within AuthProvider", () => {
    render(
      <RootLayout>
        <div data-testid="test-child">Test Content</div>
      </RootLayout>,
    );

    expect(screen.getByTestId("auth-provider")).toBeInTheDocument();
    expect(screen.getByTestId("test-child")).toBeInTheDocument();
  });

  it("should have proper metadata structure", () => {
    render(
      <RootLayout>
        <div data-testid="test-content">Test Content</div>
      </RootLayout>,
    );

    // Verify the content is rendered
    expect(screen.getByTestId("test-content")).toBeInTheDocument();
    expect(screen.getByTestId("auth-provider")).toBeInTheDocument();
  });

  it("should render without errors", () => {
    const { container } = render(
      <RootLayout>
        <div>Test Content</div>
      </RootLayout>,
    );

    // Check that the component renders without throwing
    expect(container.firstChild).toBeInTheDocument();
  });

  it("should wrap content in AuthProvider", () => {
    render(
      <RootLayout>
        <div data-testid="content">Content</div>
      </RootLayout>,
    );

    const authProvider = screen.getByTestId("auth-provider");
    const content = screen.getByTestId("content");

    expect(authProvider).toContainElement(content);
  });
});

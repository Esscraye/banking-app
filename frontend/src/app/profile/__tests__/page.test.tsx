import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import ProfilePage from "../page";
import { useAuth } from "@/contexts/AuthContext";
import { authService } from "@/lib/services";

// Mock the auth context
jest.mock("@/contexts/AuthContext", () => ({
  useAuth: jest.fn(),
}));

// Mock the auth service
jest.mock("@/lib/services", () => ({
  authService: {
    changePassword: jest.fn(),
  },
}));

// Mock Next.js Link component
jest.mock("next/link", () => {
  const MockLink = ({
    children,
    href,
  }: {
    children: React.ReactNode;
    href: string;
  }) => <a href={href}>{children}</a>;
  MockLink.displayName = "MockLink";
  return MockLink;
});

const mockUser = {
  id: 1,
  email: "john.doe@example.com",
  first_name: "John",
  last_name: "Doe",
  phone: "+33123456789",
  is_active: true,
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-15T10:30:00Z",
};

const mockUpdateProfile = jest.fn();

describe("ProfilePage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock useAuth hook with default values
    jest.mocked(useAuth).mockReturnValue({
      user: mockUser,
      token: "mock-token",
      updateProfile: mockUpdateProfile,
      login: jest.fn(),
      logout: jest.fn(),
      register: jest.fn(),
      isLoading: false,
    });
  });

  describe("Initial Render", () => {
    it("renders the page header correctly", () => {
      render(<ProfilePage />);

      expect(screen.getByText("Profile Settings")).toBeInTheDocument();
      expect(screen.getByText("Back to Dashboard")).toBeInTheDocument();
    });

    it("displays user information in form fields", () => {
      render(<ProfilePage />);

      // Check that user data is populated in form fields
      expect(
        screen.getByDisplayValue("john.doe@example.com"),
      ).toBeInTheDocument();
      expect(screen.getByDisplayValue("John")).toBeInTheDocument();
      expect(screen.getByDisplayValue("Doe")).toBeInTheDocument();
      expect(screen.getByDisplayValue("+33123456789")).toBeInTheDocument();
    });

    it("displays account information section", () => {
      render(<ProfilePage />);

      expect(screen.getByText("Account Information")).toBeInTheDocument();
      expect(
        screen.getByText("Read-only account details and status."),
      ).toBeInTheDocument();

      // Check account details
      expect(screen.getByText("1")).toBeInTheDocument(); // User ID
      expect(screen.getByText("Active")).toBeInTheDocument(); // Account status
      // Check dates with flexible matching since toLocaleDateString() format may vary
      expect(
        screen.getByText(/01\/01\/2024|1\/1\/2024|1\/1\/24|Jan.*1.*2024/),
      ).toBeInTheDocument(); // Member since
      expect(
        screen.getByText(/15\/01\/2024|1\/15\/2024|15\/1\/24|Jan.*15.*2024/),
      ).toBeInTheDocument(); // Last updated
    });

    it("shows email field as disabled", () => {
      render(<ProfilePage />);

      const emailInput = screen.getByDisplayValue("john.doe@example.com");
      expect(emailInput).toBeDisabled();
      expect(screen.getByText("Email cannot be changed")).toBeInTheDocument();
    });
  });

  describe("Profile Update Form", () => {
    it("renders profile information form correctly", () => {
      render(<ProfilePage />);

      expect(screen.getByText("Profile Information")).toBeInTheDocument();
      expect(
        screen.getByText(
          "Update your personal information and contact details.",
        ),
      ).toBeInTheDocument();

      // Check form fields
      expect(screen.getByText("Email Address")).toBeInTheDocument();
      expect(screen.getByText("First Name *")).toBeInTheDocument();
      expect(screen.getByText("Last Name *")).toBeInTheDocument();
      expect(screen.getByText("Phone Number")).toBeInTheDocument();
      expect(screen.getByText("Update Profile")).toBeInTheDocument();
    });

    it("allows updating profile information", async () => {
      render(<ProfilePage />);

      // Update first name
      const firstNameInput = screen.getByDisplayValue("John");
      fireEvent.change(firstNameInput, { target: { value: "Johnny" } });
      expect(firstNameInput).toHaveValue("Johnny");

      // Update last name
      const lastNameInput = screen.getByDisplayValue("Doe");
      fireEvent.change(lastNameInput, { target: { value: "Smith" } });
      expect(lastNameInput).toHaveValue("Smith");

      // Update phone
      const phoneInput = screen.getByDisplayValue("+33123456789");
      fireEvent.change(phoneInput, { target: { value: "+33987654321" } });
      expect(phoneInput).toHaveValue("+33987654321");
    });

    it("submits profile update with correct data", async () => {
      mockUpdateProfile.mockResolvedValue({});

      render(<ProfilePage />);

      // Update form fields
      fireEvent.change(screen.getByDisplayValue("John"), {
        target: { value: "Johnny" },
      });
      fireEvent.change(screen.getByDisplayValue("Doe"), {
        target: { value: "Smith" },
      });
      fireEvent.change(screen.getByDisplayValue("+33123456789"), {
        target: { value: "+33987654321" },
      });

      // Submit form
      const updateButton = screen.getByText("Update Profile");
      fireEvent.click(updateButton);

      await waitFor(() => {
        expect(mockUpdateProfile).toHaveBeenCalledWith({
          first_name: "Johnny",
          last_name: "Smith",
          phone: "+33987654321",
        });
      });
    });

    it("shows success message after successful profile update", async () => {
      mockUpdateProfile.mockResolvedValue({});

      render(<ProfilePage />);

      const updateButton = screen.getByText("Update Profile");
      fireEvent.click(updateButton);

      await waitFor(() => {
        expect(
          screen.getByText("Profile updated successfully!"),
        ).toBeInTheDocument();
      });
    });

    it("shows error message when profile update fails", async () => {
      const errorMessage = "Update failed";
      mockUpdateProfile.mockRejectedValue({
        response: { data: { message: errorMessage } },
      });

      render(<ProfilePage />);

      const updateButton = screen.getByText("Update Profile");
      fireEvent.click(updateButton);

      await waitFor(() => {
        expect(screen.getByText(errorMessage)).toBeInTheDocument();
      });
    });

    it("shows generic error message when no specific error message is provided", async () => {
      mockUpdateProfile.mockRejectedValue(new Error("Network error"));

      render(<ProfilePage />);

      const updateButton = screen.getByText("Update Profile");
      fireEvent.click(updateButton);

      await waitFor(() => {
        expect(
          screen.getByText("Failed to update profile"),
        ).toBeInTheDocument();
      });
    });

    it("shows loading state during profile update", async () => {
      mockUpdateProfile.mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100)),
      );

      render(<ProfilePage />);

      const updateButton = screen.getByText("Update Profile");
      fireEvent.click(updateButton);

      // Check loading state
      expect(screen.getByText("Updating...")).toBeInTheDocument();
      expect(updateButton).toBeDisabled();

      await waitFor(() => {
        expect(screen.getByText("Update Profile")).toBeInTheDocument();
      });
    });
  });

  describe("Password Change Form", () => {
    it("renders password change form correctly", () => {
      render(<ProfilePage />);

      expect(screen.getAllByText("Change Password")[0]).toBeInTheDocument(); // Heading
      expect(
        screen.getByText("Update your password to keep your account secure."),
      ).toBeInTheDocument();

      // Check form fields
      expect(screen.getByText("Current Password *")).toBeInTheDocument();
      expect(screen.getByText("New Password *")).toBeInTheDocument();
      expect(screen.getByText("Confirm New Password *")).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /Change Password/i }),
      ).toBeInTheDocument();
      expect(screen.getByText("Minimum 6 characters")).toBeInTheDocument();
    });

    it("allows entering password information", () => {
      render(<ProfilePage />);

      const currentPasswordInput = screen.getByLabelText("Current Password *");
      const newPasswordInput = screen.getByLabelText("New Password *");
      const confirmPasswordInput = screen.getByLabelText(
        "Confirm New Password *",
      );

      fireEvent.change(currentPasswordInput, {
        target: { value: "oldpassword" },
      });
      fireEvent.change(newPasswordInput, {
        target: { value: "newpassword123" },
      });
      fireEvent.change(confirmPasswordInput, {
        target: { value: "newpassword123" },
      });

      expect(currentPasswordInput).toHaveValue("oldpassword");
      expect(newPasswordInput).toHaveValue("newpassword123");
      expect(confirmPasswordInput).toHaveValue("newpassword123");
    });

    it("validates password match before submitting", async () => {
      render(<ProfilePage />);

      fireEvent.change(screen.getByLabelText("Current Password *"), {
        target: { value: "oldpassword" },
      });
      fireEvent.change(screen.getByLabelText("New Password *"), {
        target: { value: "newpassword123" },
      });
      fireEvent.change(screen.getByLabelText("Confirm New Password *"), {
        target: { value: "differentpassword" },
      });

      const changeButton = screen.getByRole("button", {
        name: /Change Password/i,
      });
      fireEvent.click(changeButton);

      await waitFor(() => {
        expect(
          screen.getByText("New passwords don't match"),
        ).toBeInTheDocument();
      });

      expect(authService.changePassword).not.toHaveBeenCalled();
    });

    it("validates password length before submitting", async () => {
      render(<ProfilePage />);

      fireEvent.change(screen.getByLabelText("Current Password *"), {
        target: { value: "oldpassword" },
      });
      fireEvent.change(screen.getByLabelText("New Password *"), {
        target: { value: "short" },
      });
      fireEvent.change(screen.getByLabelText("Confirm New Password *"), {
        target: { value: "short" },
      });

      const changeButton = screen.getByRole("button", {
        name: /Change Password/i,
      });
      fireEvent.click(changeButton);

      await waitFor(() => {
        expect(
          screen.getByText("New password must be at least 6 characters long"),
        ).toBeInTheDocument();
      });

      expect(authService.changePassword).not.toHaveBeenCalled();
    });

    it("submits password change with correct data", async () => {
      jest.mocked(authService.changePassword).mockResolvedValue(undefined);

      render(<ProfilePage />);

      fireEvent.change(screen.getByLabelText("Current Password *"), {
        target: { value: "oldpassword" },
      });
      fireEvent.change(screen.getByLabelText("New Password *"), {
        target: { value: "newpassword123" },
      });
      fireEvent.change(screen.getByLabelText("Confirm New Password *"), {
        target: { value: "newpassword123" },
      });

      const changeButton = screen.getByRole("button", {
        name: /Change Password/i,
      });
      fireEvent.click(changeButton);

      await waitFor(() => {
        expect(authService.changePassword).toHaveBeenCalledWith({
          current_password: "oldpassword",
          new_password: "newpassword123",
        });
      });
    });

    it("shows success message after successful password change", async () => {
      jest.mocked(authService.changePassword).mockResolvedValue(undefined);

      render(<ProfilePage />);

      fireEvent.change(screen.getByLabelText("Current Password *"), {
        target: { value: "oldpassword" },
      });
      fireEvent.change(screen.getByLabelText("New Password *"), {
        target: { value: "newpassword123" },
      });
      fireEvent.change(screen.getByLabelText("Confirm New Password *"), {
        target: { value: "newpassword123" },
      });

      const changeButton = screen.getByRole("button", {
        name: /Change Password/i,
      });
      fireEvent.click(changeButton);

      await waitFor(() => {
        expect(
          screen.getByText("Password changed successfully!"),
        ).toBeInTheDocument();
      });
    });

    it("clears password form after successful change", async () => {
      jest.mocked(authService.changePassword).mockResolvedValue(undefined);

      render(<ProfilePage />);

      const currentPasswordInput = screen.getByLabelText("Current Password *");
      const newPasswordInput = screen.getByLabelText("New Password *");
      const confirmPasswordInput = screen.getByLabelText(
        "Confirm New Password *",
      );

      fireEvent.change(currentPasswordInput, {
        target: { value: "oldpassword" },
      });
      fireEvent.change(newPasswordInput, {
        target: { value: "newpassword123" },
      });
      fireEvent.change(confirmPasswordInput, {
        target: { value: "newpassword123" },
      });

      const changeButton = screen.getByRole("button", {
        name: /Change Password/i,
      });
      fireEvent.click(changeButton);

      await waitFor(() => {
        expect(currentPasswordInput).toHaveValue("");
        expect(newPasswordInput).toHaveValue("");
        expect(confirmPasswordInput).toHaveValue("");
      });
    });

    it("shows error message when password change fails", async () => {
      const errorMessage = "Current password is incorrect";
      jest.mocked(authService.changePassword).mockRejectedValue({
        response: { data: { message: errorMessage } },
      });

      render(<ProfilePage />);

      fireEvent.change(screen.getByLabelText("Current Password *"), {
        target: { value: "wrongpassword" },
      });
      fireEvent.change(screen.getByLabelText("New Password *"), {
        target: { value: "newpassword123" },
      });
      fireEvent.change(screen.getByLabelText("Confirm New Password *"), {
        target: { value: "newpassword123" },
      });

      const changeButton = screen.getByRole("button", {
        name: /Change Password/i,
      });
      fireEvent.click(changeButton);

      await waitFor(() => {
        expect(screen.getByText(errorMessage)).toBeInTheDocument();
      });
    });

    it("shows generic error message when no specific error message is provided", async () => {
      jest
        .mocked(authService.changePassword)
        .mockRejectedValue(new Error("Network error"));

      render(<ProfilePage />);

      fireEvent.change(screen.getByLabelText("Current Password *"), {
        target: { value: "oldpassword" },
      });
      fireEvent.change(screen.getByLabelText("New Password *"), {
        target: { value: "newpassword123" },
      });
      fireEvent.change(screen.getByLabelText("Confirm New Password *"), {
        target: { value: "newpassword123" },
      });

      const changeButton = screen.getByRole("button", {
        name: /Change Password/i,
      });
      fireEvent.click(changeButton);

      await waitFor(() => {
        expect(
          screen.getByText("Failed to change password"),
        ).toBeInTheDocument();
      });
    });

    it("shows loading state during password change", async () => {
      jest
        .mocked(authService.changePassword)
        .mockImplementation(
          () => new Promise((resolve) => setTimeout(resolve, 100)),
        );

      render(<ProfilePage />);

      fireEvent.change(screen.getByLabelText("Current Password *"), {
        target: { value: "oldpassword" },
      });
      fireEvent.change(screen.getByLabelText("New Password *"), {
        target: { value: "newpassword123" },
      });
      fireEvent.change(screen.getByLabelText("Confirm New Password *"), {
        target: { value: "newpassword123" },
      });

      const changeButton = screen.getByRole("button", {
        name: /Change Password/i,
      });
      fireEvent.click(changeButton);

      // Check loading state
      expect(screen.getByText("Changing...")).toBeInTheDocument();
      expect(changeButton).toBeDisabled();

      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: /Change Password/i }),
        ).toBeInTheDocument();
      });
    });
  });

  describe("Account Status Display", () => {
    it("displays active status correctly", () => {
      render(<ProfilePage />);

      const statusElement = screen.getByText("Active");
      expect(statusElement).toBeInTheDocument();
      expect(statusElement).toHaveClass("text-green-700", "bg-green-50");
    });

    it("displays inactive status correctly", () => {
      jest.mocked(useAuth).mockReturnValue({
        user: { ...mockUser, is_active: false },
        token: "mock-token",
        updateProfile: mockUpdateProfile,
        login: jest.fn(),
        logout: jest.fn(),
        register: jest.fn(),
        isLoading: false,
      });

      render(<ProfilePage />);

      const statusElement = screen.getByText("Inactive");
      expect(statusElement).toBeInTheDocument();
      expect(statusElement).toHaveClass("text-red-700", "bg-red-50");
    });

    it("handles missing user dates gracefully", () => {
      jest.mocked(useAuth).mockReturnValue({
        user: { ...mockUser, created_at: "", updated_at: "" },
        token: "mock-token",
        updateProfile: mockUpdateProfile,
        login: jest.fn(),
        logout: jest.fn(),
        register: jest.fn(),
        isLoading: false,
      });

      render(<ProfilePage />);

      expect(screen.getAllByText("N/A")).toHaveLength(2);
    });
  });

  describe("No User State", () => {
    it("handles when no user is logged in", () => {
      jest.mocked(useAuth).mockReturnValue({
        user: null,
        token: null,
        updateProfile: mockUpdateProfile,
        login: jest.fn(),
        logout: jest.fn(),
        register: jest.fn(),
        isLoading: false,
      });

      render(<ProfilePage />);

      // Should still render the page structure
      expect(screen.getByText("Profile Settings")).toBeInTheDocument();

      // Form fields should be empty
      const firstNameInput = screen.getByLabelText("First Name *");
      const lastNameInput = screen.getByLabelText("Last Name *");
      const phoneInput = screen.getByLabelText("Phone Number");

      expect(firstNameInput).toHaveValue("");
      expect(lastNameInput).toHaveValue("");
      expect(phoneInput).toHaveValue("");
    });
  });

  describe("Navigation", () => {
    it("renders back to dashboard link", () => {
      render(<ProfilePage />);

      const backLink = screen.getByText("Back to Dashboard");
      expect(backLink).toBeInTheDocument();
      expect(backLink.closest("a")).toHaveAttribute("href", "/");
    });
  });

  describe("Form Validation", () => {
    it("requires first name for profile update", () => {
      render(<ProfilePage />);

      const firstNameInput = screen.getByLabelText("First Name *");
      expect(firstNameInput).toBeRequired();
    });

    it("requires last name for profile update", () => {
      render(<ProfilePage />);

      const lastNameInput = screen.getByLabelText("Last Name *");
      expect(lastNameInput).toBeRequired();
    });

    it("does not require phone number", () => {
      render(<ProfilePage />);

      const phoneInput = screen.getByLabelText("Phone Number");
      expect(phoneInput).not.toBeRequired();
    });

    it("requires all password fields for password change", () => {
      render(<ProfilePage />);

      expect(screen.getByLabelText("Current Password *")).toBeRequired();
      expect(screen.getByLabelText("New Password *")).toBeRequired();
      expect(screen.getByLabelText("Confirm New Password *")).toBeRequired();
    });

    it("enforces minimum length for new password", () => {
      render(<ProfilePage />);

      const newPasswordInput = screen.getByLabelText("New Password *");
      const confirmPasswordInput = screen.getByLabelText(
        "Confirm New Password *",
      );

      expect(newPasswordInput).toHaveAttribute("minLength", "6");
      expect(confirmPasswordInput).toHaveAttribute("minLength", "6");
    });
  });

  describe("Message Display", () => {
    it("clears previous messages when new action is performed", async () => {
      render(<ProfilePage />);

      // First, trigger a success message
      mockUpdateProfile.mockResolvedValue({});
      fireEvent.click(screen.getByText("Update Profile"));

      await waitFor(() => {
        expect(
          screen.getByText("Profile updated successfully!"),
        ).toBeInTheDocument();
      });

      // Then trigger a password change that causes an error
      jest.mocked(authService.changePassword).mockRejectedValue({
        response: { data: { message: "Password change failed" } },
      });

      fireEvent.change(screen.getByLabelText("Current Password *"), {
        target: { value: "oldpassword" },
      });
      fireEvent.change(screen.getByLabelText("New Password *"), {
        target: { value: "newpassword123" },
      });
      fireEvent.change(screen.getByLabelText("Confirm New Password *"), {
        target: { value: "newpassword123" },
      });
      fireEvent.click(screen.getByRole("button", { name: /Change Password/i }));

      await waitFor(() => {
        expect(screen.getByText("Password change failed")).toBeInTheDocument();
        expect(
          screen.queryByText("Profile updated successfully!"),
        ).not.toBeInTheDocument();
      });
    });
  });
});

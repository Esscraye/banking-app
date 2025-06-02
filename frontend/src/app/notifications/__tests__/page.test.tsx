import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { notificationsService, Notification } from "@/lib/services";
import NotificationsPage from "../page";

// Define types for mocked components
interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: string;
  size?: string;
  type?: "button" | "submit" | "reset";
  [key: string]: unknown;
}

interface InputProps {
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  required?: boolean;
  [key: string]: unknown;
}

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

interface LinkProps {
  children: React.ReactNode;
  href: string;
}

interface SkeletonProps {
  className?: string;
  [key: string]: unknown;
}

// Mock the notifications service
jest.mock("@/lib/services", () => ({
  notificationsService: {
    getNotifications: jest.fn(),
    createNotification: jest.fn(),
    markAsRead: jest.fn(),
    deleteNotification: jest.fn(),
  },
}));

// Mock UI components
jest.mock("@/components/ui/button", () => ({
  Button: ({
    children,
    onClick,
    variant,
    size,
    type,
    ...props
  }: ButtonProps) => (
    <button
      onClick={onClick}
      data-variant={variant}
      data-size={size}
      type={type}
      {...props}
    >
      {children}
    </button>
  ),
}));

jest.mock("@/components/ui/input", () => ({
  Input: ({ value, onChange, placeholder, required, ...props }: InputProps) => (
    <input
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      required={required}
      {...props}
    />
  ),
}));

jest.mock("@/components/ui/card", () => ({
  Card: ({ children, className }: CardProps) => (
    <div className={className} data-testid="card">
      {children}
    </div>
  ),
  CardContent: ({ children, className }: CardProps) => (
    <div className={className} data-testid="card-content">
      {children}
    </div>
  ),
  CardDescription: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="card-description">{children}</div>
  ),
  CardHeader: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="card-header">{children}</div>
  ),
  CardTitle: ({ children }: { children: React.ReactNode }) => (
    <h2 data-testid="card-title">{children}</h2>
  ),
}));

jest.mock("@/components/ui/skeleton", () => ({
  Skeleton: ({ className, ...props }: SkeletonProps) => (
    <div className={className} data-testid="skeleton" {...props} />
  ),
}));

// Mock lucide-react icons
jest.mock("lucide-react", () => {
  const ArrowLeft = () => <div data-testid="arrow-left-icon">ArrowLeft</div>;
  ArrowLeft.displayName = "ArrowLeft";
  const Plus = () => <div data-testid="plus-icon">Plus</div>;
  Plus.displayName = "Plus";
  const Bell = () => <div data-testid="bell-icon">Bell</div>;
  Bell.displayName = "Bell";
  const Mail = () => <div data-testid="mail-icon">Mail</div>;
  Mail.displayName = "Mail";
  const MessageSquare = () => (
    <div data-testid="message-square-icon">MessageSquare</div>
  );
  MessageSquare.displayName = "MessageSquare";
  const Smartphone = () => <div data-testid="smartphone-icon">Smartphone</div>;
  Smartphone.displayName = "Smartphone";
  const Check = () => <div data-testid="check-icon">Check</div>;
  Check.displayName = "Check";
  const Trash = () => <div data-testid="trash-icon">Trash</div>;
  Trash.displayName = "Trash";
  return {
    ArrowLeft,
    Plus,
    Bell,
    Mail,
    MessageSquare,
    Smartphone,
    Check,
    Trash,
  };
});

// Mock Next.js Link
jest.mock("next/link", () => {
  const MockLink = ({ children, href }: LinkProps) => (
    <a href={href} data-testid="next-link">
      {children}
    </a>
  );
  MockLink.displayName = "MockLink";
  return MockLink;
});

// Mock utilities
jest.mock("@/lib/utils", () => ({
  cn: (...args: string[]) => args.filter(Boolean).join(" "),
}));

// Mock class-variance-authority
jest.mock("class-variance-authority", () => ({
  cva: () => () => "",
}));

const mockNotifications: Notification[] = [
  {
    id: 1,
    user_id: 1,
    type: "email",
    title: "Welcome Email",
    message: "Welcome to our platform!",
    status: "sent",
    is_read: false,
    sent_at: "2023-01-01T10:00:00Z",
    created_at: "2023-01-01T09:00:00Z",
    updated_at: "2023-01-01T10:00:00Z",
  },
  {
    id: 2,
    user_id: 1,
    type: "system",
    title: "System Alert",
    message: "System maintenance scheduled",
    status: "pending",
    is_read: true,
    created_at: "2023-01-01T11:00:00Z",
    updated_at: "2023-01-01T11:00:00Z",
  },
  {
    id: 3,
    user_id: 1,
    type: "sms",
    title: "SMS Notification",
    message: "Your transaction was processed",
    status: "failed",
    is_read: false,
    created_at: "2023-01-01T12:00:00Z",
    updated_at: "2023-01-01T12:00:00Z",
  },
];

describe("NotificationsPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("displays loading skeletons while fetching data", async () => {
    (notificationsService.getNotifications as jest.Mock).mockImplementation(
      () => new Promise(() => {}), // Never resolves
    );

    render(<NotificationsPage />);

    expect(screen.getAllByTestId("skeleton")).toBeTruthy();
  });

  it("displays notifications list when data is loaded", async () => {
    (notificationsService.getNotifications as jest.Mock).mockResolvedValue(
      mockNotifications,
    );

    render(<NotificationsPage />);

    await waitFor(() => {
      expect(screen.getByText("Welcome Email")).toBeInTheDocument();
      expect(screen.getByText("System Alert")).toBeInTheDocument();
      expect(screen.getByText("SMS Notification")).toBeInTheDocument();
    });
  });

  it("displays unread count badge", async () => {
    (notificationsService.getNotifications as jest.Mock).mockResolvedValue(
      mockNotifications,
    );

    render(<NotificationsPage />);

    await waitFor(() => {
      expect(screen.getByText("2 unread")).toBeInTheDocument();
    });
  });

  it("displays empty state when no notifications", async () => {
    (notificationsService.getNotifications as jest.Mock).mockResolvedValue([]);

    render(<NotificationsPage />);

    await waitFor(() => {
      expect(
        screen.getByText(
          "No notifications found. Create your first notification!",
        ),
      ).toBeInTheDocument();
    });
  });

  it("displays error message when fetch fails", async () => {
    (notificationsService.getNotifications as jest.Mock).mockRejectedValue(
      new Error("Network error"),
    );

    render(<NotificationsPage />);

    await waitFor(() => {
      expect(
        screen.getByText("Failed to load notifications"),
      ).toBeInTheDocument();
    });
  });

  it("shows create form when 'New Notification' button is clicked", async () => {
    (notificationsService.getNotifications as jest.Mock).mockResolvedValue([]);

    render(<NotificationsPage />);

    await waitFor(() => {
      expect(
        screen.getByText(
          "No notifications found. Create your first notification!",
        ),
      ).toBeInTheDocument();
    });

    const newNotificationButton = screen.getByText("New Notification");
    fireEvent.click(newNotificationButton);

    expect(screen.getByText("Create New Notification")).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("Notification title"),
    ).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("Notification message"),
    ).toBeInTheDocument();
  });

  it("creates a new notification successfully", async () => {
    const newNotification = {
      id: 4,
      user_id: 1,
      type: "system",
      title: "Test Notification",
      message: "Test message",
      status: "pending" as const,
      is_read: false,
      created_at: "2023-01-01T13:00:00Z",
      updated_at: "2023-01-01T13:00:00Z",
    };

    (notificationsService.getNotifications as jest.Mock)
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([newNotification]);
    (notificationsService.createNotification as jest.Mock).mockResolvedValue(
      newNotification,
    );

    render(<NotificationsPage />);

    await waitFor(() => {
      expect(
        screen.getByText(
          "No notifications found. Create your first notification!",
        ),
      ).toBeInTheDocument();
    });

    // Click new notification button
    const newNotificationButton = screen.getByText("New Notification");
    fireEvent.click(newNotificationButton);

    // Fill out the form
    const titleInput = screen.getByPlaceholderText("Notification title");
    const messageTextarea = screen.getByPlaceholderText("Notification message");

    fireEvent.change(titleInput, { target: { value: "Test Notification" } });
    fireEvent.change(messageTextarea, { target: { value: "Test message" } });

    // Submit the form - use data-testid to be specific
    const submitButton = screen.getByTestId("submit-notification");
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(notificationsService.createNotification).toHaveBeenCalledWith({
        type: "system",
        title: "Test Notification",
        message: "Test message",
      });
    });
  });

  it("marks notification as read", async () => {
    const updatedNotification = { ...mockNotifications[0], is_read: true };
    (notificationsService.getNotifications as jest.Mock).mockResolvedValue(
      mockNotifications,
    );
    (notificationsService.markAsRead as jest.Mock).mockResolvedValue(
      updatedNotification,
    );

    render(<NotificationsPage />);

    await waitFor(() => {
      expect(screen.getByText("Welcome Email")).toBeInTheDocument();
    });

    // Find and click the mark as read button for the first unread notification
    const markAsReadButtons = screen.getAllByTitle("Mark as read");
    fireEvent.click(markAsReadButtons[0]);

    await waitFor(() => {
      expect(notificationsService.markAsRead).toHaveBeenCalledWith(1);
    });
  });

  it("deletes notification after confirmation", async () => {
    (notificationsService.getNotifications as jest.Mock).mockResolvedValue(
      mockNotifications,
    );
    (notificationsService.deleteNotification as jest.Mock).mockResolvedValue(
      {},
    );

    // Mock window.confirm
    const originalConfirm = window.confirm;
    window.confirm = jest.fn(() => true);

    render(<NotificationsPage />);

    await waitFor(() => {
      expect(screen.getByText("Welcome Email")).toBeInTheDocument();
    });

    // Find and click the delete button for the first notification
    const deleteButtons = screen.getAllByTestId("trash-icon");
    fireEvent.click(deleteButtons[0].closest("button")!);

    await waitFor(() => {
      expect(notificationsService.deleteNotification).toHaveBeenCalledWith(1);
    });

    // Restore original confirm
    window.confirm = originalConfirm;
  });

  it("cancels deletion when user declines confirmation", async () => {
    (notificationsService.getNotifications as jest.Mock).mockResolvedValue(
      mockNotifications,
    );

    // Mock window.confirm to return false
    const originalConfirm = window.confirm;
    window.confirm = jest.fn(() => false);

    render(<NotificationsPage />);

    await waitFor(() => {
      expect(screen.getByText("Welcome Email")).toBeInTheDocument();
    });

    // Find and click the delete button for the first notification
    const deleteButtons = screen.getAllByTestId("trash-icon");
    fireEvent.click(deleteButtons[0].closest("button")!);

    expect(notificationsService.deleteNotification).not.toHaveBeenCalled();

    // Restore original confirm
    window.confirm = originalConfirm;
  });

  it("displays correct notification icons based on type", async () => {
    (notificationsService.getNotifications as jest.Mock).mockResolvedValue(
      mockNotifications,
    );

    render(<NotificationsPage />);

    await waitFor(() => {
      expect(screen.getByTestId("mail-icon")).toBeInTheDocument(); // email type
      expect(screen.getByTestId("bell-icon")).toBeInTheDocument(); // system type
      expect(screen.getByTestId("message-square-icon")).toBeInTheDocument(); // sms type
    });
  });

  it("displays notification statistics", async () => {
    (notificationsService.getNotifications as jest.Mock).mockResolvedValue(
      mockNotifications,
    );

    render(<NotificationsPage />);

    await waitFor(() => {
      expect(screen.getByText("Notification Statistics")).toBeInTheDocument();
      // Use more specific selectors for statistics
      const totalSection = screen.getByText("Total").closest("div");
      const unreadSection = screen.getByText("Unread").closest("div");
      const sentSection = screen.getByText("Sent").closest("div");
      const pendingSection = screen.getByText("Pending").closest("div");

      expect(totalSection).toHaveTextContent("3");
      expect(unreadSection).toHaveTextContent("2");
      expect(sentSection).toHaveTextContent("1");
      expect(pendingSection).toHaveTextContent("1");
    });
  });

  it("cancels create form when cancel button is clicked", async () => {
    (notificationsService.getNotifications as jest.Mock).mockResolvedValue([]);

    render(<NotificationsPage />);

    await waitFor(() => {
      expect(
        screen.getByText(
          "No notifications found. Create your first notification!",
        ),
      ).toBeInTheDocument();
    });

    // Open create form
    const newNotificationButton = screen.getByText("New Notification");
    fireEvent.click(newNotificationButton);

    expect(screen.getByText("Create New Notification")).toBeInTheDocument();

    // Cancel form
    const cancelButton = screen.getByText("Cancel");
    fireEvent.click(cancelButton);

    expect(
      screen.queryByText("Create New Notification"),
    ).not.toBeInTheDocument();
  });

  it("handles different notification types in the form", async () => {
    (notificationsService.getNotifications as jest.Mock).mockResolvedValue([]);

    render(<NotificationsPage />);

    await waitFor(() => {
      expect(
        screen.getByText(
          "No notifications found. Create your first notification!",
        ),
      ).toBeInTheDocument();
    });

    // Open create form
    const newNotificationButton = screen.getByText("New Notification");
    fireEvent.click(newNotificationButton);

    // Test type selection
    const typeSelect = screen.getByDisplayValue("System");
    fireEvent.change(typeSelect, { target: { value: "email" } });

    expect(typeSelect).toHaveValue("email");
  });

  it("displays notification timestamps correctly", async () => {
    (notificationsService.getNotifications as jest.Mock).mockResolvedValue(
      mockNotifications,
    );

    render(<NotificationsPage />);

    await waitFor(() => {
      // Check if dates are displayed using more flexible matcher
      expect(screen.getByText("01/01/2023 10:00:00")).toBeInTheDocument();
    });
  });

  it("displays different status badges correctly", async () => {
    (notificationsService.getNotifications as jest.Mock).mockResolvedValue(
      mockNotifications,
    );

    render(<NotificationsPage />);

    await waitFor(() => {
      expect(screen.getByText("sent")).toBeInTheDocument();
      expect(screen.getByText("pending")).toBeInTheDocument();
      expect(screen.getByText("failed")).toBeInTheDocument();
    });
  });

  it("handles create notification error", async () => {
    (notificationsService.getNotifications as jest.Mock).mockResolvedValue([]);
    (notificationsService.createNotification as jest.Mock).mockRejectedValue(
      new Error("Create failed"),
    );

    render(<NotificationsPage />);

    await waitFor(() => {
      expect(
        screen.getByText(
          "No notifications found. Create your first notification!",
        ),
      ).toBeInTheDocument();
    });

    // Open create form and submit
    const newNotificationButton = screen.getByText("New Notification");
    fireEvent.click(newNotificationButton);

    const titleInput = screen.getByPlaceholderText("Notification title");
    const messageTextarea = screen.getByPlaceholderText("Notification message");

    fireEvent.change(titleInput, { target: { value: "Test" } });
    fireEvent.change(messageTextarea, { target: { value: "Test message" } });

    const submitButton = screen.getByTestId("submit-notification");
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText("Failed to create notification"),
      ).toBeInTheDocument();
    });
  });

  it("handles mark as read error", async () => {
    (notificationsService.getNotifications as jest.Mock).mockResolvedValue(
      mockNotifications,
    );
    (notificationsService.markAsRead as jest.Mock).mockRejectedValue(
      new Error("Mark as read failed"),
    );

    render(<NotificationsPage />);

    await waitFor(() => {
      expect(screen.getByText("Welcome Email")).toBeInTheDocument();
    });

    // Try to mark as read
    const markAsReadButtons = screen.getAllByTestId("check-icon");
    fireEvent.click(markAsReadButtons[0].closest("button")!);

    await waitFor(() => {
      expect(
        screen.getByText("Failed to mark notification as read"),
      ).toBeInTheDocument();
    });
  });

  it("handles delete notification error", async () => {
    (notificationsService.getNotifications as jest.Mock).mockResolvedValue(
      mockNotifications,
    );
    (notificationsService.deleteNotification as jest.Mock).mockRejectedValue(
      new Error("Delete failed"),
    );

    // Mock window.confirm
    const originalConfirm = window.confirm;
    window.confirm = jest.fn(() => true);

    render(<NotificationsPage />);

    await waitFor(() => {
      expect(screen.getByText("Welcome Email")).toBeInTheDocument();
    });

    // Try to delete
    const deleteButtons = screen.getAllByTestId("trash-icon");
    fireEvent.click(deleteButtons[0].closest("button")!);

    await waitFor(() => {
      expect(
        screen.getByText("Failed to delete notification"),
      ).toBeInTheDocument();
    });

    // Restore original confirm
    window.confirm = originalConfirm;
  });
});

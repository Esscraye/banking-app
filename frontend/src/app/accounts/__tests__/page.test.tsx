import "@testing-library/jest-dom";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import AccountsPage from "../page";
import {
  accountsService,
  transactionsService,
  type Account,
} from "@/lib/services";

// Mock services
jest.mock("@/lib/services", () => ({
  accountsService: {
    getAccounts: jest.fn(),
    createAccount: jest.fn(),
    updateAccount: jest.fn(),
    deleteAccount: jest.fn(),
  },
  transactionsService: {
    getAccountTransactions: jest.fn(),
  },
}));

// Mock next/link
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

// Mock lucide-react icons
jest.mock("lucide-react", () => ({
  CreditCard: () => <div data-testid="credit-card-icon" />,
  Plus: () => <div data-testid="plus-icon" />,
  Edit: () => <div data-testid="edit-icon" />,
  Trash: () => <div data-testid="trash-icon" />,
  ArrowLeft: () => <div data-testid="arrow-left-icon" />,
  ArrowUpRight: () => <div data-testid="arrow-up-right-icon" />,
  ArrowDownLeft: () => <div data-testid="arrow-down-left-icon" />,
}));

const mockAccounts = [
  {
    id: 1,
    user_id: 1,
    account_number: "ACC001234567890",
    account_type: "checking" as const,
    balance: 1500.5,
    currency: "EUR",
    status: "active" as const,
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
  },
  {
    id: 2,
    user_id: 1,
    account_number: "ACC987654321098",
    account_type: "savings" as const,
    balance: 5000.0,
    currency: "USD",
    status: "active" as const,
    created_at: "2024-01-02T00:00:00Z",
    updated_at: "2024-01-02T00:00:00Z",
  },
];

const mockTransactions = [
  {
    id: 1,
    account_id: 1,
    type: "debit" as const,
    amount: -50.0,
    currency: "EUR",
    description: "Grocery Store",
    status: "completed" as const,
    created_at: "2024-01-15T10:00:00Z",
    updated_at: "2024-01-15T10:00:00Z",
  },
];

// Mock window.confirm
global.confirm = jest.fn();

describe("AccountsPage", () => {
  const mockAccountsService = accountsService as jest.Mocked<
    typeof accountsService
  >;
  const mockTransactionsService = transactionsService as jest.Mocked<
    typeof transactionsService
  >;

  beforeEach(() => {
    jest.clearAllMocks();
    mockAccountsService.getAccounts.mockResolvedValue(mockAccounts);
    mockTransactionsService.getAccountTransactions.mockResolvedValue(
      mockTransactions,
    );
    (global.confirm as jest.Mock).mockReturnValue(true);
  });

  it("should render accounts page header", async () => {
    render(<AccountsPage />);

    await waitFor(() => {
      expect(screen.getByText("Account Management")).toBeInTheDocument();
    });
  });

  it("should render the new account button", async () => {
    render(<AccountsPage />);

    await waitFor(() => {
      expect(screen.getByText("New Account")).toBeInTheDocument();
    });
  });

  it("should display loading state initially", () => {
    mockAccountsService.getAccounts.mockImplementation(
      () => new Promise(() => {}),
    );
    render(<AccountsPage />);

    // Check for skeleton loading components - they have specific classes
    const skeletons = document.querySelectorAll(".animate-pulse");
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it("should display accounts after loading", async () => {
    render(<AccountsPage />);

    await waitFor(() => {
      expect(screen.getByText("checking Account")).toBeInTheDocument();
      expect(screen.getByText("savings Account")).toBeInTheDocument();
      expect(screen.getByText("ACC001234567890")).toBeInTheDocument();
      expect(screen.getByText("ACC987654321098")).toBeInTheDocument();
    });
  });

  it("should display account balances", async () => {
    render(<AccountsPage />);

    await waitFor(() => {
      expect(screen.getByText("1500.50 EUR")).toBeInTheDocument();
      expect(screen.getByText("5000.00 USD")).toBeInTheDocument();
    });
  });

  it("should allow selecting an account", async () => {
    render(<AccountsPage />);

    await waitFor(() => {
      const checkingAccountCard = screen
        .getByText("checking Account")
        .closest(".cursor-pointer");
      fireEvent.click(checkingAccountCard!);
    });

    await waitFor(() => {
      expect(
        mockTransactionsService.getAccountTransactions,
      ).toHaveBeenCalledWith(1);
      expect(screen.getByText("Account Details")).toBeInTheDocument();
    });
  });

  it("should display account details when selected", async () => {
    render(<AccountsPage />);

    await waitFor(() => {
      const checkingAccountCard = screen
        .getByText("checking Account")
        .closest(".cursor-pointer");
      fireEvent.click(checkingAccountCard!);
    });

    await waitFor(() => {
      expect(screen.getByText("Account Details")).toBeInTheDocument();
      expect(
        screen.getByText("Account Number: ACC001234567890"),
      ).toBeInTheDocument();
    });
  });

  it("should show freeze buttons for active accounts", async () => {
    render(<AccountsPage />);

    await waitFor(() => {
      expect(screen.getAllByText("Freeze")).toHaveLength(2);
    });
  });

  it("should handle account creation", async () => {
    mockAccountsService.createAccount.mockResolvedValue({} as Account);

    render(<AccountsPage />);

    // Wait for accounts to load first
    await waitFor(() => {
      expect(screen.getByText("checking Account")).toBeInTheDocument();
    });

    // Click New Account button to open form
    const addButton = screen.getByText("New Account");
    fireEvent.click(addButton);

    // Wait for form to appear
    await waitFor(() => {
      expect(screen.getByText("Create New Account")).toBeInTheDocument();
    });

    // Find and fill the form elements
    const selects = screen.getAllByRole("combobox");
    const accountTypeSelect = selects[0]; // First select is account type
    const currencySelect = selects[1]; // Second select is currency

    fireEvent.change(accountTypeSelect, { target: { value: "savings" } });
    fireEvent.change(currencySelect, { target: { value: "USD" } });

    const createButton = screen.getByText("Create Account");
    fireEvent.click(createButton);

    await waitFor(() => {
      expect(mockAccountsService.createAccount).toHaveBeenCalledWith({
        account_type: "savings",
        currency: "USD",
      });
    });
  });

  it("should handle errors gracefully", async () => {
    mockAccountsService.getAccounts.mockRejectedValue(
      new Error("Network error"),
    );

    render(<AccountsPage />);

    await waitFor(() => {
      expect(screen.getByText("Failed to load accounts")).toBeInTheDocument();
    });
  });

  it("should display empty state when no accounts", async () => {
    mockAccountsService.getAccounts.mockResolvedValue([]);

    render(<AccountsPage />);

    await waitFor(() => {
      expect(
        screen.getByText("No accounts found. Create your first account!"),
      ).toBeInTheDocument();
    });
  });

  it("should handle account status updates", async () => {
    mockAccountsService.updateAccount.mockResolvedValue({} as Account);

    render(<AccountsPage />);

    await waitFor(() => {
      const freezeButtons = screen.getAllByText("Freeze");
      fireEvent.click(freezeButtons[0]);
    });

    await waitFor(() => {
      expect(mockAccountsService.updateAccount).toHaveBeenCalledWith(1, {
        status: "frozen",
      });
    });
  });

  it("should show your accounts section", async () => {
    render(<AccountsPage />);

    await waitFor(() => {
      expect(screen.getByText("Your Accounts")).toBeInTheDocument();
    });
  });

  it("should show delete button only for zero balance accounts", async () => {
    const zeroBalanceAccounts = [
      {
        ...mockAccounts[0],
        balance: 0,
      },
    ];
    mockAccountsService.getAccounts.mockResolvedValue(zeroBalanceAccounts);

    render(<AccountsPage />);

    await waitFor(() => {
      expect(screen.getByText("Delete")).toBeInTheDocument();
    });
  });

  it("should handle account deletion", async () => {
    const zeroBalanceAccounts = [
      {
        ...mockAccounts[0],
        balance: 0,
      },
    ];
    mockAccountsService.getAccounts.mockResolvedValue(zeroBalanceAccounts);
    mockAccountsService.deleteAccount.mockResolvedValue({} as Account);

    render(<AccountsPage />);

    await waitFor(() => {
      const deleteButton = screen.getByText("Delete");
      fireEvent.click(deleteButton);
    });

    await waitFor(() => {
      expect(mockAccountsService.deleteAccount).toHaveBeenCalledWith(1);
    });
  });
});

import "@testing-library/jest-dom";
import { render, screen, waitFor, act } from "@testing-library/react";
import Dashboard from "../Dashboard";

// Mock AuthContext
jest.mock("@/contexts/AuthContext", () => ({
  useAuth: jest.fn(() => ({
    user: {
      id: 1,
      email: "test@example.com",
      first_name: "John",
      last_name: "Doe",
    },
    logout: jest.fn(),
  })),
}));

// Mock des services API
jest.mock("@/lib/services", () => ({
  accountsService: {
    getAccounts: jest.fn(() =>
      Promise.resolve([
        {
          id: 1,
          user_id: 1,
          account_number: "ACC001234567890",
          account_type: "checking",
          balance: 1500.0,
          currency: "EUR",
          is_active: true,
          created_at: "2025-01-01T00:00:00Z",
          updated_at: "2025-01-01T00:00:00Z",
        },
      ]),
    ),
    createAccount: jest.fn(() =>
      Promise.resolve({
        id: 2,
        user_id: 1,
        account_number: "ACC001234567891",
        account_type: "checking",
        balance: 0.0,
        currency: "EUR",
        is_active: true,
        created_at: "2025-01-01T00:00:00Z",
        updated_at: "2025-01-01T00:00:00Z",
      }),
    ),
  },
  transactionsService: {
    getTransactions: jest.fn(() =>
      Promise.resolve([
        {
          id: 1,
          from_account_id: 1,
          to_account_id: null,
          amount: 100.0,
          transaction_type: "deposit",
          status: "completed",
          description: "Dépôt initial",
          created_at: "2025-01-01T00:00:00Z",
          updated_at: "2025-01-01T00:00:00Z",
        },
      ]),
    ),
  },
  notificationsService: {
    getNotifications: jest.fn(() =>
      Promise.resolve([
        {
          id: 1,
          user_id: 1,
          title: "Bienvenue",
          message: "Votre compte a été créé avec succès",
          type: "success",
          is_read: false,
          created_at: "2025-01-01T00:00:00Z",
          updated_at: "2025-01-01T00:00:00Z",
        },
      ]),
    ),
  },
}));

describe("Dashboard", () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  it("displays loading skeleton initially", () => {
    render(<Dashboard />);

    // Vérifier la présence des skeletons pendant le chargement via leur classe CSS
    const skeletons = document.querySelectorAll(".animate-pulse");
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it("displays the dashboard header after loading", async () => {
    await act(async () => {
      render(<Dashboard />);
    });

    // Attendre que le composant soit complètement chargé
    await waitFor(() => {
      expect(screen.getByText("Banking Dashboard")).toBeInTheDocument();
    });

    expect(screen.getByText("Welcome, John Doe")).toBeInTheDocument();
  });

  it("displays data after loading", async () => {
    await act(async () => {
      render(<Dashboard />);
    });

    // Attendre que les données soient chargées
    await waitFor(() => {
      expect(screen.getByText("Your Accounts")).toBeInTheDocument();
    });

    expect(screen.getByText("Total Balance")).toBeInTheDocument();
    expect(screen.getByText("Active Accounts")).toBeInTheDocument();
    expect(screen.getByText("Quick Actions")).toBeInTheDocument();
  });

  it("formats balance correctly in euros", async () => {
    await act(async () => {
      render(<Dashboard />);
    });

    // Attendre que les données soient chargées et chercher le montant formaté correct
    await waitFor(
      () => {
        const balanceElements = screen.getAllByText("€1500.00");
        expect(balanceElements.length).toBeGreaterThan(0);
      },
      { timeout: 3000 },
    );
  });

  it("displays the new account button", async () => {
    await act(async () => {
      render(<Dashboard />);
    });

    // Attendre que les données soient chargées
    await waitFor(() => {
      expect(screen.getByText("New Account")).toBeInTheDocument();
    });
  });

  it("shows account information when accounts are loaded", async () => {
    await act(async () => {
      render(<Dashboard />);
    });

    // Attendre que les données soient chargées
    await waitFor(() => {
      expect(screen.getByText("Your Accounts")).toBeInTheDocument();
    });

    // Vérifier que les informations du compte sont affichées
    expect(screen.getByText("checking Account")).toBeInTheDocument();

    // Vérifier que le numéro de compte est affiché
    expect(screen.getByText("ACC001234567890")).toBeInTheDocument();
  });
});

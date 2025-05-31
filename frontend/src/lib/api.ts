import axios from "axios";

// Configuration des URLs des services
const SERVICE_URLS = {
  auth: process.env.NEXT_PUBLIC_AUTH_URL || "http://localhost:8082",
  accounts: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080",
  transactions:
    process.env.NEXT_PUBLIC_TRANSACTIONS_URL || "http://localhost:8081",
  notifications:
    process.env.NEXT_PUBLIC_NOTIFICATIONS_URL || "http://localhost:8083",
};

// Fonction pour déterminer l'URL de base selon l'endpoint
const getBaseURL = (url: string): string => {
  if (url.startsWith("/api/auth")) {
    return SERVICE_URLS.auth;
  } else if (url.startsWith("/api/accounts")) {
    return SERVICE_URLS.accounts;
  } else if (url.startsWith("/api/transactions")) {
    return SERVICE_URLS.transactions;
  } else if (url.startsWith("/api/notifications")) {
    return SERVICE_URLS.notifications;
  }
  return SERVICE_URLS.accounts; // fallback
};

const api = axios.create({
  timeout: 10000,
});

// Intercepteur pour ajouter le token d'authentification et configurer l'URL
api.interceptors.request.use(
  (config) => {
    // Configurer l'URL de base selon l'endpoint
    if (config.url) {
      config.baseURL = getBaseURL(config.url);
    }

    const token = localStorage.getItem("auth_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Intercepteur pour gérer les erreurs
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("auth_token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  },
);

export default api;

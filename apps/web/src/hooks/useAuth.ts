"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  avatarUrl?: string | null;
  company: {
    id: string;
    name: string;
    slug: string;
  };
  createdAt?: string;
}

interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null,
  });
  const router = useRouter();

  const loadUser = async () => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      const response = await fetch("/api/user/profile", {
        credentials: "include",
      });

      if (response.status === 401 || response.status === 403) {
        // Access token expired — try to refresh it using the HttpOnly refresh token cookie
        const refreshRes = await fetch("/api/auth/refresh", {
          method: "POST",
          credentials: "include",
          // No body needed — the server reads refreshToken from the HttpOnly cookie
        });

        if (refreshRes.ok) {
          // New accessToken cookie has been set — retry the profile request
          const retryRes = await fetch("/api/user/profile", {
            credentials: "include",
          });

          if (retryRes.ok) {
            const data = await retryRes.json();
            if (data.user) {
              setState({ user: data.user, loading: false, error: null });
              if (typeof window !== "undefined") {
                localStorage.setItem("user-data", JSON.stringify(data.user));
              }
              return;
            }
          }
        }

        // Refresh also failed — user must log in again
        setState({
          user: null,
          loading: false,
          error: null,
        });
        return;
      }

      if (!response.ok) {
        setState({
          user: null,
          loading: false,
          error: "Falha ao carregar perfil do usuário",
        });
        return;
      }

      const data = await response.json();

      if (!data.user) {
        setState({ user: null, loading: false, error: null });
        return;
      }
      
      setState({
        user: data.user,
        loading: false,
        error: null,
      });

      // Armazenar no localStorage para acesso rápido
      if (typeof window !== "undefined") {
        localStorage.setItem("user-data", JSON.stringify(data.user));
      }
    } catch (error: any) {
      // Use warn to avoid triggering the Next.js dev overlay
      console.warn("[useAuth] loadUser failed:", error?.message ?? error);
      setState({
        user: null,
        loading: false,
        error: error.message || "Erro ao carregar usuário",
      });
    }
  };

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      // Limpar dados locais
      if (typeof window !== "undefined") {
        localStorage.removeItem("token");
        localStorage.removeItem("user-data");
      }
      
      // Redirecionar para login
      router.push("/login");
    }
  };

  const updateUser = (updates: Partial<User>) => {
    setState((prev) => ({
      ...prev,
      user: prev.user ? { ...prev.user, ...updates } : null,
    }));

    // Atualizar localStorage também
    if (typeof window !== "undefined" && state.user) {
      const updatedUser = { ...state.user, ...updates };
      localStorage.setItem("user-data", JSON.stringify(updatedUser));
    }
  };

  useEffect(() => {
    // Tentar carregar do localStorage primeiro (mais rápido)
    if (typeof window !== "undefined") {
      const cached = localStorage.getItem("user-data");
      if (cached) {
        try {
          const user = JSON.parse(cached);
          setState({
            user,
            loading: false,
            error: null,
          });
        } catch (e) {
          console.error("Failed to parse cached user:", e);
        }
      }
    }

    // Sempre buscar dados atualizados do servidor
    loadUser();
  }, []);

  return {
    user: state.user,
    loading: state.loading,
    error: state.error,
    logout,
    updateUser,
    refresh: loadUser,
  };
}

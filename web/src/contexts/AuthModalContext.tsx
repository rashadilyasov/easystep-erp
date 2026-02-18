"use client";

import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";

type AuthModalMode = "login" | "register" | null;

type AuthModalContextValue = {
  isOpen: boolean;
  mode: AuthModalMode;
  openLogin: () => void;
  openRegister: () => void;
  close: () => void;
};

const AuthModalContext = createContext<AuthModalContextValue | null>(null);

export function AuthModalProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<AuthModalMode>(null);

  const openLogin = useCallback(() => setMode("login"), []);
  const openRegister = useCallback(() => setMode("register"), []);
  const close = useCallback(() => setMode(null), []);

  return (
    <AuthModalContext.Provider
      value={{
        isOpen: mode !== null,
        mode,
        openLogin,
        openRegister,
        close,
      }}
    >
      {children}
    </AuthModalContext.Provider>
  );
}

export function useAuthModal() {
  const ctx = useContext(AuthModalContext);
  if (!ctx) {
    return {
      isOpen: false,
      mode: null as AuthModalMode,
      openLogin: () => {},
      openRegister: () => {},
      close: () => {},
    };
  }
  return ctx;
}

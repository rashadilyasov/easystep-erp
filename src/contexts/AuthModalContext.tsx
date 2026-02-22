"use client";

import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";

type AuthModalMode = "login" | "register" | "affiliate" | "forgotPassword" | null;

type AuthModalContextValue = {
  isOpen: boolean;
  mode: AuthModalMode;
  loginRedirect: string | null;
  openLogin: (redirect?: string) => void;
  openRegister: () => void;
  openRegisterAffiliate: () => void;
  openForgotPassword: () => void;
  close: () => void;
};

const AuthModalContext = createContext<AuthModalContextValue | null>(null);

export function AuthModalProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<AuthModalMode>(null);
  const [loginRedirect, setLoginRedirect] = useState<string | null>(null);

  const openLogin = useCallback((redirect?: string) => {
    if (redirect) setLoginRedirect(redirect);
    setMode("login");
  }, []);
  const openRegister = useCallback(() => {
    setLoginRedirect(null);
    setMode("register");
  }, []);
  const openRegisterAffiliate = useCallback(() => {
    setLoginRedirect(null);
    setMode("affiliate");
  }, []);
  const openForgotPassword = useCallback(() => {
    setLoginRedirect(null);
    setMode("forgotPassword");
  }, []);
  const close = useCallback(() => {
    setMode(null);
    setLoginRedirect(null);
  }, []);

  return (
    <AuthModalContext.Provider
      value={{
        isOpen: mode !== null,
        mode,
        loginRedirect,
        openLogin,
        openRegister,
        openRegisterAffiliate,
        openForgotPassword,
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
      loginRedirect: null as string | null,
      openLogin: (_redirect?: string) => {},
      openRegister: () => {},
      openRegisterAffiliate: () => {},
      openForgotPassword: () => {},
      close: () => {},
    };
  }
  return ctx;
}

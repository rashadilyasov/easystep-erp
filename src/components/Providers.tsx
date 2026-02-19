"use client";

import { Suspense } from "react";
import { AuthModalProvider } from "@/contexts/AuthModalContext";
import AuthModal from "./AuthModal";
import AuthModalFromUrl from "./AuthModalFromUrl";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthModalProvider>
      <Suspense fallback={null}>
        <AuthModalFromUrl />
      </Suspense>
      {children}
      <AuthModal />
    </AuthModalProvider>
  );
}

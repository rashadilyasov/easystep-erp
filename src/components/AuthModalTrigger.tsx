"use client";

import { useAuthModal } from "@/contexts/AuthModalContext";

type Props = {
  mode: "login" | "register";
  className?: string;
  children: React.ReactNode;
};

export default function AuthModalTrigger({ mode, className, children }: Props) {
  const { openLogin, openRegister } = useAuthModal();
  const open = mode === "login" ? openLogin : openRegister;

  return (
    <button
      type="button"
      onClick={open}
      className={className ?? "text-primary-600 font-medium hover:underline"}
    >
      {children}
    </button>
  );
}

"use client";

import { useEffect, useRef } from "react";
import { useSearchParams, usePathname, useRouter } from "next/navigation";
import { useAuthModal } from "@/contexts/AuthModalContext";

/**
 * Opens auth modal when URL has ?auth=login or ?auth=register, then cleans URL.
 */
export default function AuthModalFromUrl() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const { openLogin, openRegister } = useAuthModal();
  const processed = useRef(false);

  useEffect(() => {
    const auth = searchParams.get("auth");
    if (auth !== "login" && auth !== "register") return;
    if (processed.current) return;
    processed.current = true;

    if (auth === "login") {
      openLogin();
    } else {
      openRegister();
    }

    // Clean URL: keep redirect param for LoginForm, remove auth
    const redirect = searchParams.get("redirect");
    const params = new URLSearchParams();
    if (redirect) params.set("redirect", redirect);
    const query = params.toString();
    const newUrl = pathname + (query ? `?${query}` : "");
    router.replace(newUrl, { scroll: false });
  }, [searchParams, pathname, router, openLogin, openRegister]);

  return null;
}

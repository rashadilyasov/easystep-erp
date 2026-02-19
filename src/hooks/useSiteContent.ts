"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";

type SiteContent = Record<string, unknown>;

let cached: SiteContent | null = null;
let promise: Promise<SiteContent> | null = null;

export function useSiteContent() {
  const [content, setContent] = useState<SiteContent>(cached ?? {});
  const [loading, setLoading] = useState(!cached);

  const load = useCallback(() => {
    if (promise) {
      promise.then(setContent).finally(() => setLoading(false));
      return;
    }
    setLoading(true);
    promise = api.content
      .site()
      .then((data) => {
        cached = (data ?? {}) as SiteContent;
        setContent(cached);
        return cached;
      })
      .catch(() => ({}))
      .finally(() => {
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { content, loading };
}

export function getContent<T>(content: SiteContent, key: string, fallback: T): T {
  const val = content[key];
  if (val === undefined || val === null) return fallback;
  return val as unknown as T;
}

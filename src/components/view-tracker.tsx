"use client";

import { useEffect } from "react";
import { recordView } from "@/lib/public-actions";

export function ViewTracker({ slug }: { slug: string }) {
  useEffect(() => {
    const key = `vu:${slug}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
    } catch {}
    void recordView(slug);
  }, [slug]);
  return null;
}

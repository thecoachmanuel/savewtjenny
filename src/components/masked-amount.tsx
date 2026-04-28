"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

export function MaskedAmount({
  value,
  masked = "•••••",
  defaultVisible = true,
}: {
  value: string;
  masked?: string;
  defaultVisible?: boolean;
}) {
  const [visible, setVisible] = useState(defaultVisible);

  return (
    <div className="mt-2 flex items-center justify-center gap-2">
      <div className="text-[36px] font-semibold tracking-tight text-app-fg">
        {visible ? value : masked}
      </div>
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        className="flex h-9 w-9 items-center justify-center rounded-full bg-app-bg"
        aria-label={visible ? "Hide amount" : "Show amount"}
      >
        {visible ? (
          <EyeOff className="h-4 w-4 text-app-muted" />
        ) : (
          <Eye className="h-4 w-4 text-app-muted" />
        )}
      </button>
    </div>
  );
}


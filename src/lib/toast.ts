"use client";

// Lightweight toast utility without external deps
export function showToast(
  message: string,
  options?: {
    durationMs?: number;
    variant?: "success" | "error" | "warning" | "info";
  }
) {
  if (typeof window === "undefined") return;

  const duration = options?.durationMs ?? 2500;
  const variant = options?.variant ?? "info";

  const bgByVariant: Record<string, string> = {
    success:
      "bg-gradient-to-r from-emerald-500/30 to-green-600/30 shadow-lg shadow-green-500/20 text-green-900",
    error:
      "bg-gradient-to-r from-red-500/30 to-red-600/30 shadow-lg shadow-red-500/20 text-red-900",
    warning:
      "bg-gradient-to-r from-amber-400/40 to-yellow-500/40 shadow-lg shadow-yellow-500/20 text-yellow-900",
    info: "bg-gradient-to-r from-purple-500/30 to-purple-600/30 shadow-lg shadow-purple-500/20 text-purple-900",
  };

  const iconByVariant: Record<string, string> = {
    success: "✓",
    error: "✕",
    warning: "⚠",
    info: "ℹ",
  };

  // Ensure container
  let container = document.getElementById(
    "toast-root"
  ) as HTMLDivElement | null;
  if (!container) {
    container = document.createElement("div");
    container.id = "toast-root";
    container.style.position = "fixed";
    container.style.top = "16px";
    container.style.right = "16px";
    container.style.zIndex = "9999";
    container.style.display = "flex";
    container.style.flexDirection = "column";
    container.style.gap = "8px";
    document.body.appendChild(container);
  }

  // Toast element
  const toast = document.createElement("div");
  toast.className = `${bgByVariant[variant]} ${
    variant === "warning" ? "" : "text-white"
  } rounded-xl px-4 py-3 text-sm font-medium border border-white/10 backdrop-blur-sm flex items-center gap-2`;

  // Create icon element
  const iconElement = document.createElement("span");
  iconElement.textContent = iconByVariant[variant];
  iconElement.className = "text-base flex-shrink-0";

  // Create message element
  const messageElement = document.createElement("span");
  messageElement.textContent = message;
  messageElement.className = "flex-1";

  // Append elements
  toast.appendChild(iconElement);
  toast.appendChild(messageElement);

  // Add subtle animation and better styling
  toast.style.minWidth = "280px";
  toast.style.maxWidth = "400px";
  toast.style.wordBreak = "break-word";
  toast.style.opacity = "0";
  toast.style.transform = "translateY(-10px) scale(0.95)";
  toast.style.transition = "all 200ms ease-out";

  container.appendChild(toast);

  // Animate in
  requestAnimationFrame(() => {
    toast.style.opacity = "1";
    toast.style.transform = "translateY(0) scale(1)";
  });

  // Remove after duration
  window.setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateY(-10px) scale(0.95)";
    window.setTimeout(() => {
      toast.remove();
      // Cleanup container if empty
      if (container && container.childElementCount === 0) {
        container.remove();
      }
    }, 200);
  }, duration);
}

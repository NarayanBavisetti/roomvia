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
    success: "bg-green-600",
    error: "bg-red-600",
    warning: "bg-yellow-500 text-gray-900",
    info: "bg-gray-900",
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
  toast.textContent = message;
  toast.className = `${bgByVariant[variant]} text-white rounded-lg shadow-lg px-4 py-2 text-sm`;
  if (variant === "warning") {
    // ensure readable text for yellow background
    toast.className = `${bgByVariant[variant]} rounded-lg shadow-lg px-4 py-2 text-sm`;
  }
  toast.style.opacity = "0";
  toast.style.transform = "translateY(6px)";
  toast.style.transition = "opacity 150ms ease, transform 150ms ease";

  container.appendChild(toast);

  // Animate in
  requestAnimationFrame(() => {
    toast.style.opacity = "1";
    toast.style.transform = "translateY(0)";
  });

  // Remove after duration
  window.setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateY(6px)";
    window.setTimeout(() => {
      toast.remove();
      // Cleanup container if empty
      if (container && container.childElementCount === 0) {
        container.remove();
      }
    }, 180);
  }, duration);
}

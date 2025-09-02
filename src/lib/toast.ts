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

  const stylesByVariant: Record<
    string,
    { bg: string; text: string; border: string }
  > = {
    success: {
      bg: "linear-gradient(to right, #10b981, #059669)",
      text: "#ffffff",
      border: "#34d399",
    },
    error: {
      bg: "linear-gradient(to right, #ef4444, #dc2626)",
      text: "#ffffff",
      border: "#f87171",
    },
    warning: {
      bg: "linear-gradient(to right, #f59e0b, #d97706)",
      text: "#ffffff",
      border: "#fbbf24",
    },
    info: {
      bg: "linear-gradient(to right,rgb(145, 169, 166),rgb(202, 188, 206))",
      text: "#ffffff",
      border: "#a78bfa",
    },
  };

  const iconByVariant: Record<string, string> = {
    success: "✓",
    error: "✕",
    warning: "!",
    info: "i",
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
  const styles = stylesByVariant[variant];

  // Apply styles directly
  toast.style.background = styles.bg;
  toast.style.color = styles.text;
  toast.style.border = `1px solid ${styles.border}`;
  toast.style.borderRadius = "12px";
  toast.style.padding = "12px 16px";
  toast.style.fontSize = "14px";
  toast.style.fontWeight = "500";
  toast.style.display = "flex";
  toast.style.alignItems = "center";
  toast.style.gap = "8px";
  toast.style.backdropFilter = "blur(4px)";
  toast.style.boxShadow =
    "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)";

  // Create icon element
  const iconElement = document.createElement("span");
  iconElement.textContent = iconByVariant[variant];
  iconElement.style.fontSize = "16px";
  iconElement.style.fontWeight = "bold";
  iconElement.style.flexShrink = "0";
  iconElement.style.width = "20px";
  iconElement.style.height = "20px";
  iconElement.style.display = "flex";
  iconElement.style.alignItems = "center";
  iconElement.style.justifyContent = "center";
  iconElement.style.backgroundColor = "rgba(255, 255, 255, 0.2)";
  iconElement.style.borderRadius = "50%";
  iconElement.style.color = "#ffffff";

  // Create message element
  const messageElement = document.createElement("span");
  messageElement.textContent = message;
  messageElement.style.flex = "1";
  messageElement.style.color = "#ffffff";
  messageElement.style.fontSize = "14px";
  messageElement.style.fontWeight = "500";
  messageElement.style.lineHeight = "1.4";

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

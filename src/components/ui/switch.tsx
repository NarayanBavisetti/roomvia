"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface SwitchProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  disabled?: boolean
}

export function Switch({ checked, onCheckedChange, disabled, className, ...props }: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-disabled={disabled}
      onClick={() => !disabled && onCheckedChange(!checked)}
      className={cn(
        "inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500",
        checked ? "bg-purple-600" : "bg-gray-300",
        disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer",
        className
      )}
      {...props}
    >
      <span
        className={cn(
          "h-5 w-5 rounded-full bg-white shadow transform transition-transform",
          checked ? "translate-x-5" : "translate-x-1"
        )}
      />
    </button>
  )
}

export default Switch




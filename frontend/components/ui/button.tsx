"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "focus-ring inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-base font-medium transition-colors disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        solid: "bg-brand text-sidebar-bg hover:bg-brand-dark",
        ghost: "bg-transparent text-text-secondary hover:bg-surface-hover hover:text-text-primary dark:hover:bg-white/10 dark:text-text-muted dark:hover:text-white",
        secondary:
          "bg-surface-raised text-text-primary ring-1 ring-inset ring-border hover:bg-surface-hover dark:bg-[#1c1c1c] dark:ring-white/10 dark:text-white",
        subtle:
          "bg-brand/10 text-brand hover:bg-brand/15 dark:bg-brand/15 dark:text-brand"
      },
      size: {
        md: "h-11 px-4 py-2",
        icon: "h-11 w-11",
        sm: "h-9 px-3 py-2"
      }
    },
    defaultVariants: {
      variant: "solid",
      size: "md"
    }
  }
)

/**
 * Shared button props for UniSync interactive controls.
 */
export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, type = "button", ...props }, ref) => (
    <button ref={ref} type={type} className={cn(buttonVariants({ variant, size }), className)} {...props} />
  )
)

Button.displayName = "Button"

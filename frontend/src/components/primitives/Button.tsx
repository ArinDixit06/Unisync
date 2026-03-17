import React from "react"
import clsx from "clsx"
import "./primitives.css"

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger"
  size?: "sm" | "md" | "lg"
  loading?: boolean
}

export function Button({ variant = "primary", size = "md", loading, children, ...props }: ButtonProps) {
  return (
    <button className={clsx("button", variant, size)} disabled={loading || props.disabled} {...props}>
      {loading ? "Loading..." : children}
    </button>
  )
}

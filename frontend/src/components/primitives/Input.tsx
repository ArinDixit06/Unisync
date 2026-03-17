import React from "react"
import clsx from "clsx"
import "./primitives.css"

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: boolean
  prefix?: React.ReactNode
  suffix?: React.ReactNode
}

export function Input({ label, error, prefix, suffix, value, ...props }: InputProps) {
  const filled = Boolean(value && `${value}`.length > 0)
  return (
    <div className={clsx("input-wrap", { error, filled })}>
      {label && <span className="input-label">{label}</span>}
      {prefix}
      <input className="input" value={value} {...props} />
      {suffix}
    </div>
  )
}

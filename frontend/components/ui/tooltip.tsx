"use client"

import * as TooltipPrimitive from "@radix-ui/react-tooltip"
import type { ReactNode } from "react"

/**
 * Props for lightweight hover and focus tooltips.
 */
export interface TooltipProps {
  content: ReactNode
  children: ReactNode
}

export function Tooltip({ content, children }: TooltipProps) {
  return (
    <TooltipPrimitive.Provider delayDuration={120}>
      <TooltipPrimitive.Root>
        <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
        <TooltipPrimitive.Portal>
          <TooltipPrimitive.Content
            sideOffset={8}
            className="z-50 rounded-md bg-sidebar-bg px-3 py-2 text-sm text-white shadow-card"
          >
            {content}
            <TooltipPrimitive.Arrow className="fill-sidebar-bg" />
          </TooltipPrimitive.Content>
        </TooltipPrimitive.Portal>
      </TooltipPrimitive.Root>
    </TooltipPrimitive.Provider>
  )
}

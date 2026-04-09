"use client"

import { Moon, ShieldCheck, Sparkles, Star, Inbox, Clock3, Send, FilePenLine, Trash2, AlertTriangle } from "lucide-react"
import { motion } from "framer-motion"
import { Avatar } from "@/components/common/Avatar"
import { Button } from "@/components/ui/button"
import { SidebarCollapseToggle } from "@/components/layout/SidebarCollapseToggle"
import { SidebarNavItem } from "@/components/layout/SidebarNavItem"
import { copy } from "@/lib/copy"
import type { ActiveView } from "@/stores/useMailStore"
import { cn } from "@/lib/utils"

/**
 * Props for the persistent application sidebar.
 */
export interface SidebarProps {
  collapsed: boolean
  activeView: ActiveView
  onViewChange: (view: ActiveView) => void
  onCompose: () => void
  onToggleCollapse: () => void
  darkMode: boolean
  onToggleDarkMode: () => void
}

export function Sidebar({
  collapsed,
  activeView,
  onViewChange,
  onCompose,
  onToggleCollapse,
  darkMode,
  onToggleDarkMode
}: SidebarProps) {
  return (
    <motion.aside
      layout
      className="relative flex h-full flex-col border-r border-sidebar-border bg-sidebar-bg"
      animate={{ width: collapsed ? 56 : 200 }}
      transition={{ duration: 0.24, ease: "easeInOut" }}
    >
      <SidebarCollapseToggle
        collapsed={collapsed}
        ariaLabel={collapsed ? copy.sidebar.expand : copy.sidebar.collapse}
        onToggle={onToggleCollapse}
      />
      <div className={cn("flex items-center gap-3 px-4 py-4", collapsed && "justify-center px-2")}>
        <div className="flex h-[26px] w-[26px] items-center justify-center rounded-lg bg-brand text-sidebar-bg">
          <ShieldCheck className="h-4 w-4" />
        </div>
        {!collapsed ? <span className="text-base font-semibold text-white">{copy.appName}</span> : null}
      </div>
      <div className="px-2 pb-3">
        <Button
          aria-label={copy.sidebar.compose}
          className={cn("w-full justify-center", collapsed && "px-0")}
          onClick={onCompose}
        >
          <Sparkles className="h-4 w-4" />
          {!collapsed ? copy.sidebar.compose : null}
        </Button>
      </div>
      <nav aria-label={copy.sidebar.sections.mail} className="flex-1 overflow-y-auto px-2 pb-3 scrollbar-thin">
        <div className="px-2 py-2 text-xs uppercase tracking-[0.18em] text-sidebar-text">{collapsed ? "" : copy.sidebar.sections.mail}</div>
        <div className="space-y-1">
          <SidebarNavItem
            icon={Inbox}
            label={copy.sidebar.items.inbox}
            active={activeView === "inbox"}
            collapsed={collapsed}
            badgeCount={8}
            urgentBadge
            onClick={() => onViewChange("inbox")}
          />
          <SidebarNavItem
            icon={Clock3}
            label={copy.sidebar.items.snoozed}
            active={activeView === "snoozed"}
            collapsed={collapsed}
            badgeCount={2}
            onClick={() => onViewChange("snoozed")}
          />
          <SidebarNavItem
            icon={Send}
            label={copy.sidebar.items.sent}
            active={activeView === "sent"}
            collapsed={collapsed}
            onClick={() => onViewChange("sent")}
          />
          <SidebarNavItem
            icon={FilePenLine}
            label={copy.sidebar.items.drafts}
            active={activeView === "drafts"}
            collapsed={collapsed}
            badgeCount={3}
            onClick={() => onViewChange("drafts")}
          />
          <SidebarNavItem
            icon={Star}
            label={copy.sidebar.items.starred}
            active={activeView === "starred"}
            collapsed={collapsed}
            badgeCount={2}
            onClick={() => onViewChange("starred")}
          />
        </div>
        <div className="px-2 py-4 text-xs uppercase tracking-[0.18em] text-sidebar-text">
          {collapsed ? "" : copy.sidebar.sections.security}
        </div>
        <div className="space-y-1">
          <SidebarNavItem
            icon={AlertTriangle}
            label={copy.sidebar.items.highRisk}
            active={activeView === "high-risk"}
            collapsed={collapsed}
            badgeCount={2}
            urgentBadge
            onClick={() => onViewChange("high-risk")}
          />
          <SidebarNavItem
            icon={Trash2}
            label={copy.sidebar.items.trash}
            active={activeView === "trash"}
            collapsed={collapsed}
            badgeCount={12}
            onClick={() => onViewChange("trash")}
          />
        </div>
      </nav>
      <div className="border-t border-sidebar-border p-2">
        <button
          aria-label={copy.sidebar.darkMode}
          className={cn(
            "focus-ring mb-2 flex h-11 w-full items-center rounded-lg px-3 text-sidebar-text transition-colors hover:bg-white/5 hover:text-white",
            collapsed && "justify-center px-0"
          )}
          onClick={onToggleDarkMode}
        >
          <Moon className={cn("h-4 w-4", darkMode && "text-brand")} />
          {!collapsed ? <span className="ml-3 text-sm">{copy.sidebar.darkMode}</span> : null}
        </button>
        <div className={cn("flex items-center gap-3 rounded-lg px-2 py-2", collapsed && "justify-center px-0")}>
          <Avatar name="Diwanshu Yadav" size="sm" />
          {!collapsed ? (
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-white">Diwanshu Yadav</p>
              <p className="truncate text-sm text-sidebar-text">diwanshu@unisync.ai</p>
            </div>
          ) : null}
        </div>
      </div>
    </motion.aside>
  )
}

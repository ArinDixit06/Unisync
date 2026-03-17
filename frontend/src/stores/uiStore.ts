import { create } from "zustand"

export type EmailCategory = "primary" | "updates" | "promotions" | "social" | "forums"

export interface UIStore {
  sidebarOpen: boolean
  detailPanelOpen: boolean
  activeCategory: EmailCategory
  activeFilter: "all" | "unread" | "starred" | "high_risk" | "snoozed" | "sent" | "drafts" | "trash"
  activeLabelId: string | null
  selectedEmailId: string | null
  selectedThreadId: string | null
  composeOpen: boolean
  composeMinimized: boolean
  composeData: any | null
  searchOpen: boolean
  shortcutsHelpOpen: boolean
  calendarModalEvent: any | null
  snoozeModalEmailId: string | null
  pendingArchives: Set<string>
  pendingDeletes: Set<string>
  pendingReads: Map<string, boolean>
  pendingSend: { emailData: any; cancelFn: () => void } | null
  setState: (partial: Partial<UIStore>) => void
}

export const useUIStore = create<UIStore>((set) => ({
  sidebarOpen: true,
  detailPanelOpen: true,
  activeCategory: "primary",
  activeFilter: "all",
  activeLabelId: null,
  selectedEmailId: null,
  selectedThreadId: null,
  composeOpen: false,
  composeMinimized: false,
  composeData: null,
  searchOpen: false,
  shortcutsHelpOpen: false,
  calendarModalEvent: null,
  snoozeModalEmailId: null,
  pendingArchives: new Set(),
  pendingDeletes: new Set(),
  pendingReads: new Map(),
  pendingSend: null,
  setState: (partial) => set(partial)
}))

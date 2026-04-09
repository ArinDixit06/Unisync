"use client"

import { create } from "zustand"
import { mockEmails } from "@/lib/mockEmails"
import type { EmailRecord } from "@/lib/types"

export type ActiveView = "inbox" | "starred" | "snoozed" | "sent" | "drafts" | "high-risk" | "trash"
export type ListFilter = "all" | "unread" | "starred" | "snoozed"

interface MailState {
  emails: EmailRecord[]
  selectedEmailId: string | null
  activeView: ActiveView
  listFilter: ListFilter
  sidebarCollapsed: boolean
  composeOpen: boolean
  focusMode: boolean
  readerRiskDismissed: string[]
  shortcutsOpen: boolean
  darkMode: boolean
  searchQuery: string
  setSelectedEmail: (emailId: string) => void
  setActiveView: (view: ActiveView) => void
  setListFilter: (filter: ListFilter) => void
  toggleSidebar: () => void
  toggleCompose: (open?: boolean) => void
  toggleFocusMode: () => void
  dismissRisk: (emailId: string) => void
  toggleShortcuts: (open?: boolean) => void
  setDarkMode: (darkMode: boolean) => void
  setSearchQuery: (query: string) => void
  selectNext: () => void
  selectPrevious: () => void
  archiveSelected: () => void
}

export const useMailStore = create<MailState>((set, get) => ({
  emails: mockEmails,
  selectedEmailId: mockEmails[0]?.id ?? null,
  activeView: "inbox",
  listFilter: "all",
  sidebarCollapsed: false,
  composeOpen: false,
  focusMode: false,
  readerRiskDismissed: [],
  shortcutsOpen: false,
  darkMode: false,
  searchQuery: "",
  setSelectedEmail: (emailId) => set({ selectedEmailId: emailId }),
  setActiveView: (view) => set({ activeView: view }),
  setListFilter: (filter) => set({ listFilter: filter }),
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  toggleCompose: (open) => set((state) => ({ composeOpen: open ?? !state.composeOpen })),
  toggleFocusMode: () => set((state) => ({ focusMode: !state.focusMode })),
  dismissRisk: (emailId) =>
    set((state) => ({
      readerRiskDismissed: state.readerRiskDismissed.includes(emailId)
        ? state.readerRiskDismissed
        : [...state.readerRiskDismissed, emailId]
    })),
  toggleShortcuts: (open) => set((state) => ({ shortcutsOpen: open ?? !state.shortcutsOpen })),
  setDarkMode: (darkMode) => set({ darkMode }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  selectNext: () => {
    const { selectedEmailId } = get()
    const emails = getVisibleEmails(get())
    const currentIndex = emails.findIndex((email) => email.id === selectedEmailId)
    const nextEmail = emails[Math.min(currentIndex + 1, emails.length - 1)]
    if (nextEmail) {
      set({ selectedEmailId: nextEmail.id })
    }
  },
  selectPrevious: () => {
    const { selectedEmailId } = get()
    const emails = getVisibleEmails(get())
    const currentIndex = emails.findIndex((email) => email.id === selectedEmailId)
    const previousEmail = emails[Math.max(currentIndex - 1, 0)]
    if (previousEmail) {
      set({ selectedEmailId: previousEmail.id })
    }
  },
  archiveSelected: () => {
    const { selectedEmailId, emails } = get()
    if (!selectedEmailId) {
      return
    }

    set({
      emails: emails.map((email) =>
        email.id === selectedEmailId ? { ...email, archived: true, folder: "inbox", read: true } : email
      )
    })
  }
}))

export function getVisibleEmails(state: Pick<MailState, "emails" | "activeView" | "listFilter" | "searchQuery">) {
  return state.emails.filter((email) => {
    const matchesView =
      state.activeView === "high-risk"
        ? email.tag === "high-risk"
        : state.activeView === "inbox"
          ? email.folder === "inbox"
          : email.folder === state.activeView

    const matchesFilter =
      state.listFilter === "all"
        ? true
        : state.listFilter === "unread"
          ? !email.read
          : state.listFilter === "starred"
            ? email.starred
            : email.snoozed

    const search = state.searchQuery.trim().toLowerCase()
    const matchesSearch =
      search.length === 0
        ? true
        : [email.senderName, email.senderEmail, email.subject, email.preview].some((value) =>
            value.toLowerCase().includes(search)
          )

    return matchesView && matchesFilter && matchesSearch && !email.archived
  })
}

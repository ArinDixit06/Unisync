"use client"

import { useEffect, useMemo, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { Inbox, Moon, PenSquare, Star } from "lucide-react"
import { KeyboardShortcutsModal } from "@/components/common/KeyboardShortcutsModal"
import { ComposeModal } from "@/components/compose/ComposeModal"
import { Sidebar } from "@/components/layout/Sidebar"
import { MailListPane } from "@/components/mailList/MailListPane"
import { ReaderPane } from "@/components/reader/ReaderPane"
import { copy } from "@/lib/copy"
import { getVisibleEmails, useMailStore } from "@/stores/useMailStore"
import { cn } from "@/lib/utils"

/**
 * Props for the UniSync application shell.
 */
export function AppShell() {
  const [mobileReaderOpen, setMobileReaderOpen] = useState(false)
  const {
    selectedEmailId,
    activeView,
    listFilter,
    sidebarCollapsed,
    composeOpen,
    shortcutsOpen,
    darkMode,
    readerRiskDismissed,
    searchQuery,
    setSelectedEmail,
    setActiveView,
    setListFilter,
    toggleSidebar,
    toggleCompose,
    dismissRisk,
    toggleShortcuts,
    setDarkMode,
    setSearchQuery,
    selectNext,
    selectPrevious,
    archiveSelected
  } = useMailStore()

  const visibleEmails = useMailStore((state) => getVisibleEmails(state))
  const selectedEmail = useMemo(
    () => visibleEmails.find((email) => email.id === selectedEmailId) ?? visibleEmails[0] ?? null,
    [selectedEmailId, visibleEmails]
  )

  useEffect(() => {
    const savedTheme = window.localStorage.getItem("unisync-theme")
    const isDark = savedTheme === "dark"
    setDarkMode(isDark)
    document.documentElement.classList.toggle("dark", isDark)
  }, [setDarkMode])

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode)
    window.localStorage.setItem("unisync-theme", darkMode ? "dark" : "light")
  }, [darkMode])

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const key = event.key.toLowerCase()

      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        if (key !== "escape") {
          return
        }
      }

      if (key === "?") {
        event.preventDefault()
        toggleShortcuts(true)
        return
      }

      if (key === "c") {
        event.preventDefault()
        toggleCompose(true)
        return
      }

      if (key === "e") {
        event.preventDefault()
        archiveSelected()
        return
      }

      if (key === "r" && selectedEmail) {
        event.preventDefault()
        const replyTarget = document.querySelector("textarea[aria-label^='Reply to']")
        if (replyTarget instanceof HTMLTextAreaElement) {
          replyTarget.focus()
        }
        return
      }

      if (key === "j") {
        event.preventDefault()
        selectNext()
        return
      }

      if (key === "k") {
        event.preventDefault()
        selectPrevious()
        return
      }

      if (key === "g") {
        const listener = (nextEvent: KeyboardEvent) => {
          const nextKey = nextEvent.key.toLowerCase()
          if (nextKey === "i") {
            setActiveView("inbox")
          }
          if (nextKey === "s") {
            setActiveView("starred")
          }
          window.removeEventListener("keydown", listener)
        }

        window.addEventListener("keydown", listener, { once: true })
      }
    }

    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [archiveSelected, selectNext, selectPrevious, selectedEmail, setActiveView, toggleCompose, toggleShortcuts])

  useEffect(() => {
    if (selectedEmail && !visibleEmails.some((email) => email.id === selectedEmailId)) {
      setSelectedEmail(selectedEmail.id)
    }
  }, [selectedEmail, selectedEmailId, setSelectedEmail, visibleEmails])

  return (
    <div className="surface-grid relative min-h-screen">
      <a className="focus-ring absolute left-4 top-4 z-[60] -translate-y-16 rounded-md bg-brand px-4 py-2 text-sm font-semibold text-sidebar-bg focus:translate-y-0" href="#main-content">
        {copy.skipToMain}
      </a>
      <div className="h-screen overflow-hidden p-3 sm:p-4">
        <div className="grid h-full min-h-0 overflow-hidden rounded-[28px] border border-white/60 bg-white/85 shadow-panel backdrop-blur-xl dark:border-white/10 dark:bg-[#0d0d0d]/90 xl:grid-cols-[auto_320px_minmax(0,1fr)]">
          <div className="hidden h-full xl:block">
            <Sidebar
              activeView={activeView}
              collapsed={sidebarCollapsed}
              darkMode={darkMode}
              onCompose={() => toggleCompose(true)}
              onToggleCollapse={toggleSidebar}
              onToggleDarkMode={() => setDarkMode(!darkMode)}
              onViewChange={setActiveView}
            />
          </div>
          <div className="hidden h-full md:block xl:hidden">
            <Sidebar
              activeView={activeView}
              collapsed
              darkMode={darkMode}
              onCompose={() => toggleCompose(true)}
              onToggleCollapse={toggleSidebar}
              onToggleDarkMode={() => setDarkMode(!darkMode)}
              onViewChange={setActiveView}
            />
          </div>
          <main id="main-content" className="relative col-span-1 min-h-0 md:col-span-2 xl:col-span-2">
            <div className="hidden h-full min-h-0 md:grid xl:grid-cols-[320px_minmax(0,1fr)]">
              <MailListPane
                emails={visibleEmails}
                filter={listFilter}
                query={searchQuery}
                selectedEmailId={selectedEmail?.id ?? null}
                onFilterChange={setListFilter}
                onQueryChange={setSearchQuery}
                onSelect={(emailId) => setSelectedEmail(emailId)}
              />
              <ReaderPane
                email={selectedEmail}
                riskDismissed={selectedEmail ? readerRiskDismissed.includes(selectedEmail.id) : false}
                onArchive={archiveSelected}
                onDismissRisk={dismissRisk}
                onSendReply={() => {}}
              />
            </div>
            <div className="flex h-full min-h-0 md:hidden">
              <AnimatePresence initial={false} mode="wait">
                {!mobileReaderOpen ? (
                  <motion.div key="list" className="h-full w-full" initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -20, opacity: 0 }}>
                    <MailListPane
                      emails={visibleEmails}
                      filter={listFilter}
                      query={searchQuery}
                      selectedEmailId={selectedEmail?.id ?? null}
                      onFilterChange={setListFilter}
                      onQueryChange={setSearchQuery}
                      onSelect={(emailId) => {
                        setSelectedEmail(emailId)
                        setMobileReaderOpen(true)
                      }}
                    />
                  </motion.div>
                ) : (
                  <motion.div key="reader" className="h-full w-full" initial={{ x: 24, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 24, opacity: 0 }}>
                    <div className="flex h-full flex-col">
                      <button
                        aria-label={copy.list.title}
                        className="focus-ring border-b border-border px-4 py-3 text-left text-sm font-medium text-brand dark:border-white/10"
                        onClick={() => setMobileReaderOpen(false)}
                      >
                        {copy.list.title}
                      </button>
                      <ReaderPane
                        email={selectedEmail}
                        riskDismissed={selectedEmail ? readerRiskDismissed.includes(selectedEmail.id) : false}
                        onArchive={archiveSelected}
                        onDismissRisk={dismissRisk}
                        onSendReply={() => {}}
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </main>
        </div>
      </div>
      <nav aria-label={copy.common.mobileNavigation} className="fixed bottom-0 left-0 right-0 z-30 border-t border-border bg-white/95 px-3 py-2 backdrop-blur-md dark:border-white/10 dark:bg-[#111111]/95 md:hidden">
        <div className="grid grid-cols-4 gap-2">
          {[
            { key: "inbox", label: copy.bottomTabs.inbox, icon: Inbox, onClick: () => setActiveView("inbox") },
            { key: "starred", label: copy.bottomTabs.starred, icon: Star, onClick: () => setActiveView("starred") },
            { key: "compose", label: copy.bottomTabs.compose, icon: PenSquare, onClick: () => toggleCompose(true) },
            { key: "theme", label: copy.bottomTabs.settings, icon: Moon, onClick: () => setDarkMode(!darkMode) }
          ].map((item) => (
            <button key={item.key} aria-label={item.label} className="focus-ring flex min-h-11 flex-col items-center justify-center rounded-xl px-2 py-2 text-xs font-medium text-text-secondary" onClick={item.onClick}>
              <item.icon className={cn("mb-1 h-4 w-4", item.key === activeView && "text-brand")} />
              {item.label}
            </button>
          ))}
        </div>
      </nav>
      <div aria-live="polite" className="sr-only">
        {selectedEmail ? `${copy.reader.loadAnnouncement}: ${selectedEmail.subject}` : ""}
      </div>
      <ComposeModal open={composeOpen} onOpenChange={toggleCompose} />
      <KeyboardShortcutsModal open={shortcutsOpen} onOpenChange={toggleShortcuts} />
    </div>
  )
}

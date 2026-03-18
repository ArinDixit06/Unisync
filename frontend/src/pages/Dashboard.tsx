import { useState, useEffect, useRef } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { apiFetch } from "../lib/api"
import { AppShell, TopBar } from "../components/layout"
import { ComposeButton, MailList, MailPreview } from "../components/mail-ui"
import { ComposeModal } from "../components/compose/ComposeModal"
import { SearchCommand } from "../components/search/SearchCommand"
import { useUIStore } from "../stores/uiStore"
import { useAuthStore } from "../stores/authStore"
import { supabase, supabaseConfigured } from "../lib/supabase"

const DEFAULT_PRODUCTION_WS_URL = "wss://unisync-pztl.onrender.com"

export function Dashboard() {
  const [composeOpen, setComposeOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const queryClient = useQueryClient()
  const syncHandledRef = useRef(false)
  const { setLinkedAccounts, accessToken, setUser, setAccessToken } = useAuthStore()
  const { activeCategory, activeFilter, activeLabelId, selectedEmailId, sidebarOpen, setState } = useUIStore()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const resolvedWsBaseUrl =
    import.meta.env.VITE_WS_URL ||
    (import.meta.env.PROD
      ? DEFAULT_PRODUCTION_WS_URL
      : `${window.location.protocol === "https:" ? "wss" : "ws"}://${window.location.host}`)

  const { data: accountsData } = useQuery({
    queryKey: ["accounts"],
    queryFn: () => apiFetch("/auth/accounts"),
    enabled: Boolean(accessToken)
  })
  const linkedAccounts = accountsData?.accounts || []

  const { data: labelsData } = useQuery({
    queryKey: ["labels"],
    queryFn: () => apiFetch("/labels")
  })

  useEffect(() => {
    if (accountsData?.accounts) {
      setLinkedAccounts(accountsData.accounts)
    }
  }, [accountsData, setLinkedAccounts])

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault()
        setSearchOpen(true)
      }
      if (event.key === "/") {
        event.preventDefault()
        setSearchOpen(true)
      }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [])

  useEffect(() => {
    if (!accessToken) return
    const wsUrl = `${resolvedWsBaseUrl}/ws?token=${accessToken}`
    const socket = new WebSocket(wsUrl)
    socket.onmessage = () => {
      queryClient.invalidateQueries({ queryKey: ["emails"] })
      if (selectedEmailId) {
        queryClient.invalidateQueries({ queryKey: ["email", selectedEmailId] })
      }
    }
    return () => socket.close()
  }, [accessToken, queryClient, resolvedWsBaseUrl, selectedEmailId])

  useEffect(() => {
    if (!accessToken || syncHandledRef.current) return
    const params = new URLSearchParams(window.location.search)
    const accountId = params.get("account_id")
    if (!accountId) return
    syncHandledRef.current = true
    setSyncing(true)
    void apiFetch(`/sync/account/${accountId}`, { method: "POST" })
      .then(() => {
        queryClient.invalidateQueries({ queryKey: ["emails"] })
        queryClient.invalidateQueries({ queryKey: ["accounts"] })
      })
      .finally(() => {
        setSyncing(false)
      })

    const url = new URL(window.location.href)
    url.searchParams.delete("linked")
    url.searchParams.delete("account_id")
    window.history.replaceState({}, "", url.toString())
  }, [accessToken, queryClient])

  const listParams = new URLSearchParams()
  if (activeCategory && !["sent", "drafts", "trash"].includes(activeFilter)) listParams.set("category", activeCategory)
  if (activeFilter !== "all" && activeFilter !== "drafts") listParams.set("filter", activeFilter)
  if (activeLabelId) listParams.set("label_id", activeLabelId)
  const listPath = `/emails${listParams.toString() ? `?${listParams.toString()}` : ""}`

  const { data: emailsData } = useQuery({
    queryKey: ["emails", activeCategory, activeFilter, activeLabelId],
    queryFn: () => apiFetch(listPath),
    enabled: activeFilter !== "drafts"
  })

  const { data: draftsData } = useQuery({
    queryKey: ["drafts"],
    queryFn: () => apiFetch("/compose/drafts"),
    enabled: activeFilter === "drafts"
  })

  const emails =
    activeFilter === "drafts"
      ? (draftsData?.drafts || []).map((draft: any) => ({
          id: draft.id,
          sender_name: "Draft",
          sender_email: "draft",
          subject: draft.subject || "(No subject)",
          preview_snippet: (draft.body_html || "").replace(/<[^>]+>/g, "").slice(0, 140),
          received_at: draft.updated_at || draft.created_at,
          is_read: true,
          provider: "drafts",
          account_email: ""
        }))
      : emailsData?.emails || []

  const { data: emailDetail } = useQuery({
    queryKey: ["email", selectedEmailId],
    queryFn: () =>
      selectedEmailId && activeFilter !== "drafts" ? apiFetch(`/emails/${selectedEmailId}`) : null,
    enabled:
      Boolean(selectedEmailId) &&
      activeFilter !== "drafts" &&
      emails.some((email: any) => email.id === selectedEmailId)
  })

  const draftDetail =
    activeFilter === "drafts" && selectedEmailId
      ? (draftsData?.drafts || []).find((draft: any) => draft.id === selectedEmailId) || null
      : null

  useEffect(() => {
    if (activeFilter === "drafts") return
    if (selectedEmailId && !emails.some((email: any) => email.id === selectedEmailId)) {
      setState({ selectedEmailId: null })
    }
  }, [activeFilter, emails, selectedEmailId, setState])

  const handleSelect = (email: any) => {
    setState({ selectedEmailId: email.id })
    if (activeFilter === "drafts") {
      return
    }
    if (!email.is_read) {
      void apiFetch(`/emails/${email.id}`, {
        method: "PATCH",
        body: JSON.stringify({ is_read: true })
      }).then(() => queryClient.invalidateQueries({ queryKey: ["emails"] }))
    }
  }

  const handleArchive = async (emailId: string) => {
    if (activeFilter === "drafts") return
    await apiFetch(`/emails/${emailId}`, {
      method: "PATCH",
      body: JSON.stringify({ is_archived: true })
    })
    queryClient.invalidateQueries({ queryKey: ["emails"] })
    if (selectedEmailId === emailId) setState({ selectedEmailId: null })
  }

  const handleDelete = async (emailId: string) => {
    if (activeFilter === "drafts") {
      await apiFetch(`/compose/drafts/${emailId}`, { method: "DELETE" })
      queryClient.invalidateQueries({ queryKey: ["drafts"] })
      if (selectedEmailId === emailId) setState({ selectedEmailId: null })
      return
    }
    await apiFetch(`/emails/${emailId}`, { method: "DELETE" })
    queryClient.invalidateQueries({ queryKey: ["emails"] })
    if (selectedEmailId === emailId) setState({ selectedEmailId: null })
  }

  const handleToggleRead = async (email: any) => {
    if (activeFilter === "drafts") return
    await apiFetch(`/emails/${email.id}`, {
      method: "PATCH",
      body: JSON.stringify({ is_read: !email.is_read })
    })
    queryClient.invalidateQueries({ queryKey: ["emails"] })
    queryClient.invalidateQueries({ queryKey: ["email", email.id] })
  }

  const handleConfirmEvent = async (eventId: string) => {
    await apiFetch(`/calendar/events/${eventId}/confirm`, { method: "POST" })
    queryClient.invalidateQueries({ queryKey: ["email", selectedEmailId] })
  }

  const handleDismissEvent = async (eventId: string) => {
    await apiFetch(`/calendar/events/${eventId}`, { method: "DELETE" })
    queryClient.invalidateQueries({ queryKey: ["email", selectedEmailId] })
  }

  const handleSync = async () => {
    const accountId = linkedAccounts[0]?.id
    if (!accountId) return
    setSyncing(true)
    try {
      await apiFetch(`/sync/account/${accountId}`, { method: "POST" })
      queryClient.invalidateQueries({ queryKey: ["emails"] })
    } finally {
      setSyncing(false)
    }
  }

  const handleConnectGmail = async () => {
    try {
      const result = await apiFetch("/auth/link/gmail", { method: "POST" })
      if (result?.auth_url) {
        window.location.assign(result.auth_url)
      }
    } catch (err) {
      console.error(err)
      alert("Unable to start Gmail connection. Please try again.")
    }
  }

  const handleLogout = async () => {
    if (supabaseConfigured && supabase) {
      await supabase.auth.signOut()
    }
    setUser(null)
    setAccessToken(null)
    setLinkedAccounts([])
  }

  const accountOptions = linkedAccounts.length
    ? linkedAccounts.map((account: any) => ({
        id: account.id,
        name: account.display_name || account.email_address || account.provider?.toUpperCase?.() || "Account",
        email: account.email_address || "Connected"
      }))
    : [{ id: "local", name: "Primary", email: "student@unisync.app" }]

  const activeAccount = accountOptions[0]

  return (
    <AppShell
      sidebarProps={{
        labels: labelsData?.labels || [],
        activeFilter,
        activeCategory,
        activeLabelId,
        syncing,
        syncDisabled: !linkedAccounts.length || syncing,
        account: activeAccount,
        accounts: accountOptions,
        collapsed: sidebarCollapsed,
        onCollapseToggle: () => setSidebarCollapsed((value) => !value),
        onFilterChange: (filter) => setState({ activeFilter: filter }),
        onCategoryChange: (category) => setState({ activeCategory: category }),
        onLabelSelect: (labelId) => setState({ activeLabelId: labelId }),
        onCompose: () => setComposeOpen(true),
        onSync: handleSync,
        onAccountSelect: () => {
          setSidebarCollapsed(false)
        },
        onLogout: handleLogout
      }}
      sidebarOpen={sidebarOpen}
      onSidebarToggle={() => setState({ sidebarOpen: !sidebarOpen })}
      topbar={
        <TopBar
          onCompose={() => setComposeOpen(true)}
          onSync={handleSync}
          onConnectGmail={handleConnectGmail}
          showConnectGmail={!linkedAccounts.length}
          syncDisabled={!linkedAccounts.length || syncing}
          syncLoading={syncing}
          onToggleSidebar={() => setState({ sidebarOpen: !sidebarOpen })}
          unreadCount={activeFilter === "drafts" ? 0 : emails.filter((email: any) => !email.is_read).length}
        />
      }
      list={
        <div className="h-full border-r border-gray-200/70 bg-white">
          <MailList
            emails={emails}
            selectedEmailId={selectedEmailId}
            activeFilter={activeFilter}
            onFilterChange={(filter) => setState({ activeFilter: filter })}
            onSelect={handleSelect}
            onArchive={handleArchive}
            onDelete={handleDelete}
            onToggleRead={handleToggleRead}
          />
        </div>
      }
      detail={
        <div
          className={`fixed inset-0 z-20 bg-[var(--color-bg-base)] transition duration-200 ease-out lg:static lg:inset-auto lg:z-auto lg:h-full lg:translate-x-0 ${
            selectedEmailId ? "translate-x-0" : "translate-x-full lg:translate-x-0"
          }`}
        >
          <div className="h-full border-l border-gray-200/70 bg-white">
            <MailPreview
              email={activeFilter === "drafts" ? draftDetail : emailDetail}
              onArchive={() => emailDetail && handleArchive(emailDetail.id)}
              onDelete={() =>
                activeFilter === "drafts"
                  ? draftDetail && handleDelete(draftDetail.id)
                  : emailDetail && handleDelete(emailDetail.id)
              }
              onToggleRead={() => emailDetail && handleToggleRead(emailDetail)}
              onConfirmEvent={handleConfirmEvent}
              onDismissEvent={handleDismissEvent}
              onClose={() => setState({ selectedEmailId: null })}
            />
          </div>
        </div>
      }
    >
      <SearchCommand open={searchOpen} onClose={() => setSearchOpen(false)} />
      {composeOpen && <ComposeModal onClose={() => setComposeOpen(false)} />}
      <div className="lg:hidden">
        <ComposeButton onClick={() => setComposeOpen(true)} floating />
      </div>
    </AppShell>
  )
}

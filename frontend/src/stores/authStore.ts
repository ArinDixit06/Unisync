import { create } from "zustand"

export interface AuthUser {
  id: string
  email: string
}

interface AuthStore {
  user: AuthUser | null
  accessToken: string | null
  linkedAccounts: any[]
  isLoadingAuth: boolean
  setUser: (user: AuthUser | null) => void
  setAccessToken: (token: string | null) => void
  setLinkedAccounts: (accounts: any[]) => void
  setLoading: (loading: boolean) => void
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  accessToken: null,
  linkedAccounts: [],
  isLoadingAuth: true,
  setUser: (user) => set({ user }),
  setAccessToken: (accessToken) => set({ accessToken }),
  setLinkedAccounts: (linkedAccounts) => set({ linkedAccounts }),
  setLoading: (isLoadingAuth) => set({ isLoadingAuth })
}))

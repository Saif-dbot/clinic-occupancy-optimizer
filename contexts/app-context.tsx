'use client'

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import type { User, UserRole } from '@/types'
import { mockUsers } from '@/lib/mock-data'

interface AppContextType {
  currentUser: User | null
  currentRole: UserRole
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<boolean>
  logout: () => void
  setRole: (role: UserRole) => void
}

const AppContext = createContext<AppContextType | undefined>(undefined)

export function AppProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [currentRole, setCurrentRole] = useState<UserRole>('admin')

  const login = useCallback(async (email: string, _password: string): Promise<boolean> => {
    // Simulate login - in real app this would verify credentials
    await new Promise(resolve => setTimeout(resolve, 500))
    
    const user = mockUsers.find(u => u.email === email)
    if (user) {
      setCurrentUser(user)
      setCurrentRole(user.role)
      return true
    }
    return false
  }, [])

  const logout = useCallback(() => {
    setCurrentUser(null)
  }, [])

  const setRole = useCallback((role: UserRole) => {
    setCurrentRole(role)
    // Also update user mock if exists
    const userForRole = mockUsers.find(u => u.role === role)
    if (userForRole) {
      setCurrentUser(userForRole)
    }
  }, [])

  return (
    <AppContext.Provider
      value={{
        currentUser,
        currentRole,
        isAuthenticated: currentUser !== null,
        login,
        logout,
        setRole,
      }}
    >
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const context = useContext(AppContext)
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider')
  }
  return context
}

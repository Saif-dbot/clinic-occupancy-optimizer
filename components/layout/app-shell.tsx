'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { useApp } from '@/contexts/app-context'
import {
  LayoutDashboard,
  Calendar,
  ListTodo,
  AlertTriangle,
  Clock,
  BarChart3,
  Settings,
  FileText,
  Stethoscope,
  User,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Bell,
  Search,
  Menu,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import type { UserRole } from '@/types'

interface NavItem {
  href: string
  label: string
  icon: React.ElementType
  roles: UserRole[]
  badge?: number
}

const navItems: NavItem[] = [
  { href: '/dashboard', label: 'Tableau de bord', icon: LayoutDashboard, roles: ['admin', 'secretaire', 'medecin'] },
  { href: '/agenda', label: 'Rendez-vous', icon: Calendar, roles: ['admin', 'secretaire', 'medecin', 'client'] },
  { href: '/medecins', label: 'Médecins', icon: Stethoscope, roles: ['client'] },
  { href: '/symptomes', label: 'Formulaire symptômes', icon: FileText, roles: ['client'] },
  { href: '/profil', label: 'Mon profil', icon: User, roles: ['client'] },
  { href: '/appointments', label: 'Rendez-vous', icon: ListTodo, roles: ['admin', 'secretaire', 'medecin'] },
  { href: '/risk-center', label: 'Centre de risque', icon: AlertTriangle, roles: ['admin', 'secretaire'], badge: 5 },
  { href: '/waitlist', label: 'Liste d\'attente', icon: Clock, roles: ['admin', 'secretaire'], badge: 4 },
  { href: '/kpi', label: 'Indicateurs KPI', icon: BarChart3, roles: ['admin'] },
  { href: '/settings', label: 'Paramètres', icon: Settings, roles: ['admin'] },
  { href: '/audit', label: 'Journal d\'audit', icon: FileText, roles: ['admin'] },
]

const roleLabels: Record<UserRole, string> = {
  admin: 'Administrateur',
  secretaire: 'Secrétaire',
  medecin: 'Médecin',
  client: 'Client',
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { currentUser, currentRole, setRole, logout } = useApp()
  const isClientView = currentRole === 'client'
  const homeHref = isClientView ? '/agenda' : '/dashboard'
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  const filteredNav = navItems.filter(item => item.roles.includes(currentRole))

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div 
          className={cn('fixed inset-0 bg-black/50 z-40', !isClientView && 'lg:hidden')}
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex flex-col bg-sidebar border-r border-sidebar-border shadow-sm transition-all duration-300',
          !isClientView && 'lg:relative',
          isClientView ? 'w-72 bg-sidebar/95 backdrop-blur-sm' : (collapsed ? 'w-[72px]' : 'w-64'),
          isClientView
            ? (mobileOpen ? 'translate-x-0' : '-translate-x-full')
            : (mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0')
        )}
      >
        {/* Logo */}
        <div className={cn(
          'flex items-center h-16 px-4 border-b border-sidebar-border',
          collapsed ? 'justify-center' : 'justify-between'
        )}>
          {!collapsed && (
            <Link href={homeHref} className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">M</span>
              </div>
              <span className="font-semibold text-lg text-sidebar-foreground">MediPlan</span>
            </Link>
          )}
          {collapsed && (
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">M</span>
            </div>
          )}
          {isClientView && (
            <Button
              variant="ghost"
              size="icon"
              className="ml-auto"
              onClick={() => setMobileOpen(false)}
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
          {filteredNav.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
            const Icon = item.icon

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group relative',
                  isActive
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                    : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
                )}
                onClick={() => setMobileOpen(false)}
              >
                <Icon className={cn('w-5 h-5 flex-shrink-0', isActive && 'text-primary')} />
                {!collapsed && (
                  <>
                    <span className="font-medium text-sm">{item.label}</span>
                    {item.badge && item.badge > 0 && (
                      <Badge 
                        variant="destructive" 
                        className="ml-auto text-[10px] px-1.5 py-0 h-5 min-w-5 flex items-center justify-center"
                      >
                        {item.badge}
                      </Badge>
                    )}
                  </>
                )}
                {collapsed && item.badge && item.badge > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-destructive text-destructive-foreground text-[10px] rounded-full flex items-center justify-center">
                    {item.badge}
                  </span>
                )}
              </Link>
            )
          })}
        </nav>

        {/* Collapse button */}
        {!isClientView && (
          <div className="hidden lg:flex px-2 py-3 border-t border-sidebar-border">
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                'w-full justify-center text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50',
                !collapsed && 'justify-start'
              )}
              onClick={() => setCollapsed(!collapsed)}
            >
              {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
              {!collapsed && <span className="ml-2 text-sm">Réduire</span>}
            </Button>
          </div>
        )}
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="h-16 border-b border-border/70 bg-background/85 backdrop-blur-sm flex items-center justify-between px-4 lg:px-6 gap-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              className={cn(!isClientView && 'lg:hidden')}
              onClick={() => setMobileOpen((open) => !open)}
            >
              <Menu className="w-5 h-5" />
            </Button>
            
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder={isClientView ? 'Rechercher un médecin...' : 'Rechercher un patient, un praticien...'}
                className="w-80 pl-9 bg-secondary/60 border border-border/70"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Role switcher (for demo) */}
            <div className={cn('hidden sm:flex items-center gap-2', isClientView && 'hidden')}>
              <span className="text-xs text-muted-foreground">Rôle:</span>
              <Select value={currentRole} onValueChange={(v) => setRole(v as UserRole)}>
                <SelectTrigger className="w-36 h-8 text-xs bg-secondary border-0">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Administrateur</SelectItem>
                  <SelectItem value="secretaire">Secrétaire</SelectItem>
                  <SelectItem value="medecin">Médecin</SelectItem>
                  <SelectItem value="client">Client</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Notifications */}
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="w-5 h-5" />
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-destructive text-destructive-foreground text-[10px] rounded-full flex items-center justify-center">
                3
              </span>
            </Button>

            {/* User menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="gap-2 px-2">
                  <Avatar className="w-8 h-8">
                    <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                      {currentUser ? getInitials(currentUser.name) : 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden sm:block text-left">
                    <p className="text-sm font-medium leading-none">{currentUser?.name || 'Utilisateur'}</p>
                    <p className="text-xs text-muted-foreground">{roleLabels[currentRole]}</p>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel>Mon compte</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="sm:hidden">
                  Rôle: {roleLabels[currentRole]}
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/settings">Paramètres</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout} className="text-destructive">
                  <LogOut className="w-4 h-4 mr-2" />
                  Déconnexion
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto">
          <div className="relative min-h-full">
            {/* Subtle background texture */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-chart-2/8 pointer-events-none" />
            <div className="absolute inset-0 bg-noise pointer-events-none" />
            <div className="relative">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

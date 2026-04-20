'use client'

import { useEffect, useMemo, useState } from 'react'
import { formatDistanceToNowStrict, format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { toast } from 'sonner'
import { fetchAuditLog } from '@/lib/mock-api'
import { mockUsers } from '@/lib/mock-data'
import type { AuditAction, AuditLogEntry } from '@/types'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  FileText,
  RefreshCw,
  Search,
  Filter,
  Clock,
  UserCircle2,
  Shield,
} from 'lucide-react'

const actionLabels: Record<AuditAction, string> = {
  appointment_created: 'Rendez-vous créé',
  appointment_cancelled: 'Rendez-vous annulé',
  appointment_confirmed: 'Rendez-vous confirmé',
  appointment_completed: 'Rendez-vous terminé',
  appointment_no_show: 'No-show constaté',
  slot_reassigned: 'Créneau réaffecté',
  waitlist_offer_sent: 'Proposition envoyée',
  waitlist_offer_accepted: 'Proposition acceptée',
  waitlist_offer_declined: 'Proposition refusée',
  waitlist_offer_expired: 'Proposition expirée',
  reminder_sent: 'Rappel envoyé',
  backup_candidate_assigned: 'Backup assigné',
  settings_updated: 'Paramètres modifiés',
}

const entityLabels: Record<AuditLogEntry['entityType'], string> = {
  appointment: 'Rendez-vous',
  patient: 'Patient',
  slot: 'Créneau',
  waitlist: 'Liste d\'attente',
  settings: 'Paramètres',
}

const actionGroups = {
  critical: new Set<AuditAction>([
    'appointment_cancelled',
    'appointment_no_show',
    'settings_updated',
  ]),
  success: new Set<AuditAction>([
    'appointment_created',
    'appointment_confirmed',
    'appointment_completed',
    'waitlist_offer_accepted',
    'slot_reassigned',
  ]),
}

export default function AuditPage() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [actionFilter, setActionFilter] = useState<'all' | AuditAction>('all')
  const [entityFilter, setEntityFilter] = useState<'all' | AuditLogEntry['entityType']>('all')

  const loadAuditLog = async () => {
    setLoading(true)
    try {
      const data = await fetchAuditLog()
      setLogs(data)
    } catch {
      toast.error('Impossible de charger le journal d\'audit')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAuditLog()
  }, [])

  const filteredLogs = useMemo(() => {
    const normalized = query.trim().toLowerCase()

    return logs.filter((entry) => {
      if (actionFilter !== 'all' && entry.action !== actionFilter) {
        return false
      }
      if (entityFilter !== 'all' && entry.entityType !== entityFilter) {
        return false
      }
      if (!normalized) {
        return true
      }

      const userName = mockUsers.find((user) => user.id === entry.userId)?.name.toLowerCase() || ''
      const actionText = actionLabels[entry.action].toLowerCase()
      const entityText = entityLabels[entry.entityType].toLowerCase()
      const detailsText = JSON.stringify(entry.details).toLowerCase()

      return (
        actionText.includes(normalized) ||
        entityText.includes(normalized) ||
        userName.includes(normalized) ||
        detailsText.includes(normalized) ||
        entry.entityId.toLowerCase().includes(normalized)
      )
    })
  }, [logs, query, actionFilter, entityFilter])

  const stats = useMemo(() => {
    const critical = logs.filter((entry) => actionGroups.critical.has(entry.action)).length
    const success = logs.filter((entry) => actionGroups.success.has(entry.action)).length
    const reminders = logs.filter((entry) => entry.action === 'reminder_sent').length

    return { critical, success, reminders }
  }, [logs])

  const getUserName = (userId: string) => {
    return mockUsers.find((user) => user.id === userId)?.name || 'Utilisateur inconnu'
  }

  const getActionVariant = (action: AuditAction): 'default' | 'secondary' | 'destructive' | 'outline' => {
    if (actionGroups.critical.has(action)) return 'destructive'
    if (actionGroups.success.has(action)) return 'default'
    return 'secondary'
  }

  const renderDetails = (details: Record<string, unknown>) => {
    const entries = Object.entries(details)
    if (entries.length === 0) return 'Aucun détail'

    return entries
      .slice(0, 3)
      .map(([key, value]) => `${key}: ${String(value)}`)
      .join(' · ')
  }

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-12 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
        <Skeleton className="h-[460px]" />
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="w-6 h-6 text-primary" />
            Journal d&apos;audit
          </h1>
          <p className="text-muted-foreground">
            Traçabilité des actions sensibles et opérationnelles
          </p>
        </div>

        <Button variant="outline" onClick={loadAuditLog}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Actualiser
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Événements total</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{logs.length}</p>
          </CardContent>
        </Card>
        <Card className="border-destructive/30 bg-destructive/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Actions critiques</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-destructive">{stats.critical}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Rappels envoyés</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-primary">{stats.reminders}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            Événements
          </CardTitle>
          <CardDescription>
            Filtrez par action, entité ou texte libre
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
            <div className="relative lg:col-span-6">
              <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Rechercher un utilisateur, une action, un patient..."
                className="pl-9"
              />
            </div>

            <div className="lg:col-span-3">
              <Select value={actionFilter} onValueChange={(value) => setActionFilter(value as 'all' | AuditAction)}>
                <SelectTrigger>
                  <SelectValue placeholder="Action" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les actions</SelectItem>
                  {Object.entries(actionLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="lg:col-span-3">
              <Select
                value={entityFilter}
                onValueChange={(value) => setEntityFilter(value as 'all' | AuditLogEntry['entityType'])}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Entité" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les entités</SelectItem>
                  <SelectItem value="appointment">Rendez-vous</SelectItem>
                  <SelectItem value="patient">Patient</SelectItem>
                  <SelectItem value="slot">Créneau</SelectItem>
                  <SelectItem value="waitlist">Liste d&apos;attente</SelectItem>
                  <SelectItem value="settings">Paramètres</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="rounded-lg border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-48">
                    <span className="inline-flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      Horodatage
                    </span>
                  </TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead className="hidden xl:table-cell">Entité</TableHead>
                  <TableHead className="hidden lg:table-cell">
                    <span className="inline-flex items-center gap-1">
                      <UserCircle2 className="w-3.5 h-3.5" />
                      Utilisateur
                    </span>
                  </TableHead>
                  <TableHead>Détails</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                      <div className="inline-flex items-center gap-2">
                        <Filter className="w-4 h-4" />
                        Aucun événement ne correspond aux filtres
                      </div>
                    </TableCell>
                  </TableRow>
                )}

                {filteredLogs.map((entry, index) => (
                  <TableRow key={entry.id} className="animate-row" style={{ animationDelay: `${index * 0.02}s` }}>
                    <TableCell>
                      <div>
                        <p className="text-sm font-medium">
                          {format(new Date(entry.timestamp), 'dd/MM/yyyy HH:mm', { locale: fr })}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          il y a {formatDistanceToNowStrict(new Date(entry.timestamp), { locale: fr })}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getActionVariant(entry.action)} className="font-normal">
                        {actionLabels[entry.action]}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden xl:table-cell">
                      <div>
                        <p className="text-sm">{entityLabels[entry.entityType]}</p>
                        <p className="text-xs text-muted-foreground">{entry.entityId}</p>
                      </div>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-sm">
                      {getUserName(entry.userId)}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-[420px] truncate" title={renderDetails(entry.details)}>
                      {renderDetails(entry.details)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
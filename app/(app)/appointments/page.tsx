'use client'

import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { RiskBadge, RiskIndicator } from '@/components/dashboard/risk-badge'
import { useApp } from '@/contexts/app-context'
import {
  fetchAppointments,
  fetchSites,
  fetchPractitioners,
  cancelAppointment,
  confirmAppointment,
  markNoShow,
  sendReminder,
} from '@/lib/mock-api'
import { mockPatients } from '@/lib/mock-data'
import type { Appointment, Site, Practitioner, AppointmentStatus } from '@/types'
import {
  Search,
  Filter,
  MoreHorizontal,
  Phone,
  Mail,
  MessageSquare,
  X,
  Check,
  UserX,
  Calendar,
  Clock,
  User,
  ChevronDown,
  AlertTriangle,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { Empty } from '@/components/ui/empty'

const statusLabels: Record<AppointmentStatus, string> = {
  scheduled: 'Planifié',
  confirmed: 'Confirmé',
  completed: 'Terminé',
  cancelled: 'Annulé',
  no_show: 'No-show',
}

const statusColors: Record<AppointmentStatus, string> = {
  scheduled: 'bg-chart-2/20 text-chart-2 border-chart-2/30',
  confirmed: 'bg-success/20 text-success border-success/30',
  completed: 'bg-secondary text-secondary-foreground border-border',
  cancelled: 'bg-muted text-muted-foreground border-border',
  no_show: 'bg-destructive/20 text-destructive border-destructive/30',
}

export default function AppointmentsPage() {
  const { currentRole } = useApp()
  const canManageAppointments = currentRole === 'admin' || currentRole === 'secretaire'
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [sites, setSites] = useState<Site[]>([])
  const [practitioners, setPractitioners] = useState<Practitioner[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [siteFilter, setSiteFilter] = useState<string>('all')
  const [practitionerFilter, setPractitionerFilter] = useState<string>('all')
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null)
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    const loadData = async () => {
      try {
        const [appts, sitesData, practitionersData] = await Promise.all([
          fetchAppointments(),
          fetchSites(),
          fetchPractitioners(),
        ])
        setAppointments(appts.sort((a, b) => {
          const dateCompare = new Date(b.date).getTime() - new Date(a.date).getTime()
          if (dateCompare !== 0) return dateCompare
          return a.startTime.localeCompare(b.startTime)
        }))
        setSites(sitesData)
        setPractitioners(practitionersData)
      } catch (error) {
        console.error('Error loading appointments:', error)
        toast.error('Erreur lors du chargement des rendez-vous')
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  const getPatientName = (patientId: string) => {
    const patient = mockPatients.find(p => p.id === patientId)
    return patient ? `${patient.firstName} ${patient.lastName}` : 'Patient inconnu'
  }

  const getPatientPhone = (patientId: string) => {
    const patient = mockPatients.find(p => p.id === patientId)
    return patient?.phone || ''
  }

  const getPractitionerName = (practitionerId: string) => {
    const practitioner = practitioners.find(p => p.id === practitionerId)
    return practitioner?.name || 'Praticien inconnu'
  }

  const getSiteName = (siteId: string) => {
    const site = sites.find(s => s.id === siteId)
    return site?.name || 'Site inconnu'
  }

  const filteredAppointments = appointments.filter(appt => {
    const patientName = getPatientName(appt.patientId).toLowerCase()
    const matchesSearch = patientName.includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === 'all' || appt.status === statusFilter
    const matchesSite = siteFilter === 'all' || appt.siteId === siteFilter
    const matchesPractitioner = practitionerFilter === 'all' || appt.practitionerId === practitionerFilter
    return matchesSearch && matchesStatus && matchesSite && matchesPractitioner
  })

  const handleAction = async (action: 'cancel' | 'confirm' | 'noshow' | 'reminder', appt: Appointment, reminderType?: 'sms' | 'email' | 'call') => {
    setActionLoading(true)
    try {
      let updated: Appointment
      switch (action) {
        case 'cancel':
          updated = await cancelAppointment(appt.id)
          toast.success('Rendez-vous annulé')
          break
        case 'confirm':
          updated = await confirmAppointment(appt.id)
          toast.success('Rendez-vous confirmé')
          break
        case 'noshow':
          updated = await markNoShow(appt.id)
          toast.success('No-show enregistré')
          break
        case 'reminder':
          updated = await sendReminder(appt.id, reminderType || 'sms')
          toast.success(`Rappel ${reminderType} envoyé`)
          break
        default:
          return
      }
      setAppointments(prev => prev.map(a => a.id === appt.id ? updated : a))
      setSelectedAppointment(null)
    } catch (error) {
      toast.error('Erreur lors de l\'action')
    } finally {
      setActionLoading(false)
    }
  }

  const getSuggestedAction = (score: number) => {
    if (score >= 70) return { label: 'Appel prioritaire + Backup', color: 'text-destructive', icon: AlertTriangle }
    if (score >= 40) return { label: 'Double rappel J-2/J-1', color: 'text-warning', icon: MessageSquare }
    return { label: 'Rappel standard J-2', color: 'text-muted-foreground', icon: MessageSquare }
  }

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-[500px] w-full" />
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Rendez-vous</h1>
          <p className="text-muted-foreground">
            {filteredAppointments.length} rendez-vous
          </p>
        </div>
      </div>

      {!canManageAppointments && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="p-3 text-sm text-muted-foreground">
            Vue en lecture seule: les actions de gestion (annulation, rappels, confirmation) sont réservées à l&apos;équipe administrative.
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher un patient..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="scheduled">Planifié</SelectItem>
                <SelectItem value="confirmed">Confirmé</SelectItem>
                <SelectItem value="completed">Terminé</SelectItem>
                <SelectItem value="cancelled">Annulé</SelectItem>
                <SelectItem value="no_show">No-show</SelectItem>
              </SelectContent>
            </Select>

            <Select value={siteFilter} onValueChange={setSiteFilter}>
              <SelectTrigger className="w-44">
                <SelectValue placeholder="Site" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les sites</SelectItem>
                {sites.map(site => (
                  <SelectItem key={site.id} value={site.id}>{site.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={practitionerFilter} onValueChange={setPractitionerFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Praticien" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les praticiens</SelectItem>
                {practitioners.map(p => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {(searchQuery || statusFilter !== 'all' || siteFilter !== 'all' || practitionerFilter !== 'all') && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchQuery('')
                  setStatusFilter('all')
                  setSiteFilter('all')
                  setPractitionerFilter('all')
                }}
              >
                <X className="w-4 h-4 mr-1" />
                Réinitialiser
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {filteredAppointments.length === 0 ? (
            <Empty
              icon={Calendar}
              title="Aucun rendez-vous trouvé"
              description="Modifiez vos filtres pour voir plus de résultats"
              className="py-12"
            />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[180px]">Patient</TableHead>
                    <TableHead className="w-[140px]">Date & Heure</TableHead>
                    <TableHead className="w-[160px]">Praticien</TableHead>
                    <TableHead className="w-[140px]">Site</TableHead>
                    <TableHead className="w-[100px]">Statut</TableHead>
                    <TableHead className="w-[120px]">Score risque</TableHead>
                    <TableHead className="w-[160px]">Action suggérée</TableHead>
                    <TableHead className="w-[60px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAppointments.map((appt, idx) => {
                    const suggestedAction = getSuggestedAction(appt.noShowScore)
                    const ActionIcon = suggestedAction.icon

                    return (
                      <TableRow key={appt.id} className="animate-row" style={{ animationDelay: `${idx * 0.02}s` }}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
                              <User className="w-4 h-4 text-muted-foreground" />
                            </div>
                            <div>
                              <p className="font-medium text-sm">{getPatientName(appt.patientId)}</p>
                              <p className="text-xs text-muted-foreground">{getPatientPhone(appt.patientId)}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-muted-foreground" />
                            <div>
                              <p className="text-sm">{format(new Date(appt.date), 'd MMM', { locale: fr })}</p>
                              <p className="text-xs text-muted-foreground">{appt.startTime}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <p className="text-sm truncate max-w-[150px]">
                            {getPractitionerName(appt.practitionerId)}
                          </p>
                        </TableCell>
                        <TableCell>
                          <p className="text-sm truncate max-w-[130px]">
                            {getSiteName(appt.siteId)}
                          </p>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={cn('text-xs', statusColors[appt.status])}>
                            {statusLabels[appt.status]}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <RiskIndicator score={appt.noShowScore} />
                        </TableCell>
                        <TableCell>
                          <div className={cn('flex items-center gap-1.5 text-xs', suggestedAction.color)}>
                            <ActionIcon className="w-3.5 h-3.5" />
                            <span className="truncate">{suggestedAction.label}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => setSelectedAppointment(appt)}>
                                Voir les détails
                              </DropdownMenuItem>
                              {canManageAppointments && (appt.status === 'scheduled' || appt.status === 'confirmed') && (
                                <>
                                  <DropdownMenuSeparator />
                                <>
                                  <DropdownMenuItem onClick={() => handleAction('reminder', appt, 'sms')}>
                                    <MessageSquare className="w-4 h-4 mr-2" />
                                    Envoyer SMS
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleAction('reminder', appt, 'email')}>
                                    <Mail className="w-4 h-4 mr-2" />
                                    Envoyer Email
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleAction('reminder', appt, 'call')}>
                                    <Phone className="w-4 h-4 mr-2" />
                                    Appel téléphonique
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  {appt.status === 'scheduled' && (
                                    <DropdownMenuItem onClick={() => handleAction('confirm', appt)}>
                                      <Check className="w-4 h-4 mr-2" />
                                      Confirmer
                                    </DropdownMenuItem>
                                  )}
                                  <DropdownMenuItem onClick={() => handleAction('noshow', appt)} className="text-warning">
                                    <UserX className="w-4 h-4 mr-2" />
                                    Marquer no-show
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleAction('cancel', appt)} className="text-destructive">
                                    <X className="w-4 h-4 mr-2" />
                                    Annuler
                                  </DropdownMenuItem>
                                </>
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail dialog */}
      <Dialog open={!!selectedAppointment} onOpenChange={() => setSelectedAppointment(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Détails du rendez-vous</DialogTitle>
            <DialogDescription>
              Informations complètes et facteurs de risque
            </DialogDescription>
          </DialogHeader>
          
          {selectedAppointment && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Patient</p>
                  <p className="font-medium">{getPatientName(selectedAppointment.patientId)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Téléphone</p>
                  <p className="font-medium">{getPatientPhone(selectedAppointment.patientId)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Date</p>
                  <p className="font-medium">
                    {format(new Date(selectedAppointment.date), 'd MMMM yyyy', { locale: fr })}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Horaire</p>
                  <p className="font-medium">
                    {selectedAppointment.startTime} - {selectedAppointment.endTime}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Praticien</p>
                  <p className="font-medium">{getPractitionerName(selectedAppointment.practitionerId)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Site</p>
                  <p className="font-medium">{getSiteName(selectedAppointment.siteId)}</p>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-secondary/50">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium">Score de risque no-show</span>
                  <RiskBadge score={selectedAppointment.noShowScore} />
                </div>
                {selectedAppointment.noShowFactors.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">Facteurs contributifs:</p>
                    {selectedAppointment.noShowFactors.map((factor, idx) => (
                      <div key={idx} className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">{factor.factor}</span>
                        <span className={cn(
                          'font-mono text-xs',
                          factor.impact > 0 ? 'text-destructive' : 'text-success'
                        )}>
                          {factor.impact > 0 ? '+' : ''}{factor.impact}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {selectedAppointment.remindersSent.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Rappels envoyés</p>
                  <div className="space-y-1">
                    {selectedAppointment.remindersSent.map((reminder, idx) => (
                      <div key={idx} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          {reminder.type === 'sms' && <MessageSquare className="w-3 h-3" />}
                          {reminder.type === 'email' && <Mail className="w-3 h-3" />}
                          {reminder.type === 'call' && <Phone className="w-3 h-3" />}
                          <span className="capitalize">{reminder.type}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(reminder.sentAt), 'd MMM HH:mm', { locale: fr })}
                          </span>
                          <Badge variant={reminder.status === 'delivered' ? 'default' : 'destructive'} className="text-[10px]">
                            {reminder.status === 'delivered' ? 'Envoyé' : 'Échec'}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedAppointment(null)}>
              Fermer
            </Button>
            {canManageAppointments && selectedAppointment && (selectedAppointment.status === 'scheduled' || selectedAppointment.status === 'confirmed') && (
              <Button 
                variant="destructive" 
                onClick={() => handleAction('cancel', selectedAppointment)}
                disabled={actionLoading}
              >
                Annuler le RDV
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

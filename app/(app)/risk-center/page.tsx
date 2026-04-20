'use client'

import { useEffect, useState } from 'react'
import { format, addDays, isBefore } from 'date-fns'
import { fr } from 'date-fns/locale'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { RiskBadge, RiskIndicator } from '@/components/dashboard/risk-badge'
import {
  fetchHighRiskAppointments,
  fetchWaitlist,
  confirmAppointment,
  cancelAppointment,
  sendReminder,
} from '@/lib/mock-api'
import { mockPatients, mockPractitioners, mockSites } from '@/lib/mock-data'
import type { Appointment, WaitlistEntry } from '@/types'
import {
  AlertTriangle,
  Phone,
  Mail,
  MessageSquare,
  Check,
  X,
  UserPlus,
  Clock,
  Shield,
  Calendar,
  TrendingUp,
  Bell,
  ChevronRight,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { Empty } from '@/components/ui/empty'

export default function RiskCenterPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [waitlist, setWaitlist] = useState<WaitlistEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [backupPatient, setBackupPatient] = useState<string>('')

  useEffect(() => {
    const loadData = async () => {
      try {
        const [apptsData, waitlistData] = await Promise.all([
          fetchHighRiskAppointments(),
          fetchWaitlist(),
        ])
        setAppointments(apptsData)
        setWaitlist(waitlistData.filter(w => w.status === 'pending'))
      } catch (error) {
        console.error('Error loading risk center data:', error)
        toast.error('Erreur lors du chargement')
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
    const practitioner = mockPractitioners.find(p => p.id === practitionerId)
    return practitioner?.name || 'Praticien inconnu'
  }

  const getSiteName = (siteId: string) => {
    const site = mockSites.find(s => s.id === siteId)
    return site?.name || 'Site inconnu'
  }

  const highRiskAppts = appointments.filter(a => a.noShowScore >= 70)
  const mediumRiskAppts = appointments.filter(a => a.noShowScore >= 40 && a.noShowScore < 70)
  const lowRiskAppts = appointments.filter(a => a.noShowScore < 40)

  const today = new Date()
  const urgentAppts = appointments.filter(a => {
    const apptDate = new Date(a.date)
    return a.noShowScore >= 70 && isBefore(apptDate, addDays(today, 2))
  })

  const handleAction = async (action: 'confirm' | 'cancel' | 'sms' | 'email' | 'call', appt: Appointment) => {
    setActionLoading(true)
    try {
      let updated: Appointment
      switch (action) {
        case 'confirm':
          updated = await confirmAppointment(appt.id)
          toast.success('Rendez-vous confirmé')
          break
        case 'cancel':
          updated = await cancelAppointment(appt.id)
          toast.success('Rendez-vous annulé')
          break
        case 'sms':
        case 'email':
        case 'call':
          updated = await sendReminder(appt.id, action)
          toast.success(`Rappel ${action} envoyé`)
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

  const handleAssignBackup = (apptId: string) => {
    if (!backupPatient) return
    toast.success('Patient backup assigné')
    setBackupPatient('')
    setSelectedAppointment(null)
  }

  const getSuggestedActions = (score: number) => {
    if (score >= 70) {
      return [
        { icon: Phone, label: 'Appel prioritaire', action: 'call' as const, primary: true },
        { icon: UserPlus, label: 'Assigner backup', action: 'backup' as const },
        { icon: MessageSquare, label: 'Double rappel SMS', action: 'sms' as const },
      ]
    }
    if (score >= 40) {
      return [
        { icon: MessageSquare, label: 'SMS J-2', action: 'sms' as const, primary: true },
        { icon: Mail, label: 'Email J-2', action: 'email' as const },
        { icon: Check, label: 'Demander confirmation', action: 'confirm' as const },
      ]
    }
    return [
      { icon: MessageSquare, label: 'Rappel standard J-2', action: 'sms' as const, primary: true },
    ]
  }

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-12 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-[400px]" />
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="w-6 h-6 text-warning" />
            Centre de risque no-show
          </h1>
          <p className="text-muted-foreground">
            Surveillance et actions préventives sur les rendez-vous à risque
          </p>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className={urgentAppts.length > 0 ? 'border-destructive/50 bg-destructive/5' : ''}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-destructive" />
              Actions urgentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{urgentAppts.length}</div>
            <p className="text-xs text-muted-foreground">RDV à risque dans 48h</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-destructive" />
              Risque élevé
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{highRiskAppts.length}</div>
            <p className="text-xs text-muted-foreground">Score {'>'}= 70</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Bell className="w-4 h-4 text-warning" />
              Risque modéré
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mediumRiskAppts.length}</div>
            <p className="text-xs text-muted-foreground">Score 40-69</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Liste d&apos;attente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{waitlist.length}</div>
            <p className="text-xs text-muted-foreground">Patients disponibles</p>
          </CardContent>
        </Card>
      </div>

      {/* Main content */}
      <Tabs defaultValue="urgent" className="space-y-4">
        <TabsList>
          <TabsTrigger value="urgent" className="relative">
            Urgents
            {urgentAppts.length > 0 && (
              <Badge variant="destructive" className="ml-2 text-[10px] px-1.5 py-0">
                {urgentAppts.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="high">
            Risque élevé
            <Badge variant="secondary" className="ml-2 text-[10px] px-1.5 py-0">
              {highRiskAppts.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="medium">
            Risque modéré
            <Badge variant="secondary" className="ml-2 text-[10px] px-1.5 py-0">
              {mediumRiskAppts.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="all">Tous</TabsTrigger>
        </TabsList>

        <TabsContent value="urgent" className="space-y-4">
          {urgentAppts.length === 0 ? (
            <Card>
              <CardContent className="py-12">
                <Empty
                  icon={Shield}
                  title="Aucune action urgente"
                  description="Pas de rendez-vous à haut risque dans les prochaines 48h"
                />
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {urgentAppts.map((appt, idx) => (
                <AppointmentRiskCard
                  key={appt.id}
                  appointment={appt}
                  idx={idx}
                  getPatientName={getPatientName}
                  getPractitionerName={getPractitionerName}
                  getSiteName={getSiteName}
                  getSuggestedActions={getSuggestedActions}
                  onAction={handleAction}
                  onSelect={setSelectedAppointment}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="high" className="space-y-4">
          {highRiskAppts.length === 0 ? (
            <Card>
              <CardContent className="py-12">
                <Empty
                  icon={TrendingUp}
                  title="Aucun rendez-vous à haut risque"
                  description="Tous les scores sont inférieurs à 70"
                />
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {highRiskAppts.map((appt, idx) => (
                <AppointmentRiskCard
                  key={appt.id}
                  appointment={appt}
                  idx={idx}
                  getPatientName={getPatientName}
                  getPractitionerName={getPractitionerName}
                  getSiteName={getSiteName}
                  getSuggestedActions={getSuggestedActions}
                  onAction={handleAction}
                  onSelect={setSelectedAppointment}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="medium" className="space-y-4">
          {mediumRiskAppts.length === 0 ? (
            <Card>
              <CardContent className="py-12">
                <Empty
                  icon={Bell}
                  title="Aucun rendez-vous à risque modéré"
                  description="Tous les scores sont hors de la plage 40-69"
                />
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {mediumRiskAppts.map((appt, idx) => (
                <AppointmentRiskCard
                  key={appt.id}
                  appointment={appt}
                  idx={idx}
                  getPatientName={getPatientName}
                  getPractitionerName={getPractitionerName}
                  getSiteName={getSiteName}
                  getSuggestedActions={getSuggestedActions}
                  onAction={handleAction}
                  onSelect={setSelectedAppointment}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="all" className="space-y-4">
          <div className="space-y-3">
            {appointments.map((appt, idx) => (
              <AppointmentRiskCard
                key={appt.id}
                appointment={appt}
                idx={idx}
                getPatientName={getPatientName}
                getPractitionerName={getPractitionerName}
                getSiteName={getSiteName}
                getSuggestedActions={getSuggestedActions}
                onAction={handleAction}
                onSelect={setSelectedAppointment}
              />
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Detail dialog */}
      <Dialog open={!!selectedAppointment} onOpenChange={() => setSelectedAppointment(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Actions pour ce rendez-vous</DialogTitle>
            <DialogDescription>
              Score de risque: {selectedAppointment?.noShowScore}/100
            </DialogDescription>
          </DialogHeader>
          
          {selectedAppointment && (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-secondary/50">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="font-medium">{getPatientName(selectedAppointment.patientId)}</p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(selectedAppointment.date), 'd MMMM yyyy', { locale: fr })} à {selectedAppointment.startTime}
                    </p>
                  </div>
                  <RiskBadge score={selectedAppointment.noShowScore} />
                </div>
                <RiskIndicator score={selectedAppointment.noShowScore} />
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium">Facteurs de risque:</p>
                {selectedAppointment.noShowFactors.map((factor, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 rounded bg-muted/50 text-sm">
                    <span>{factor.factor}</span>
                    <span className={cn(
                      'font-mono',
                      factor.impact > 0 ? 'text-destructive' : 'text-success'
                    )}>
                      {factor.impact > 0 ? '+' : ''}{factor.impact}
                    </span>
                  </div>
                ))}
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium">Actions suggérées:</p>
                <div className="grid gap-2">
                  {getSuggestedActions(selectedAppointment.noShowScore).map((action, idx) => {
                    const Icon = action.icon
                    if (action.action === 'backup') {
                      return (
                        <div key={idx} className="space-y-2">
                          <Select value={backupPatient} onValueChange={setBackupPatient}>
                            <SelectTrigger>
                              <SelectValue placeholder="Sélectionner un patient backup" />
                            </SelectTrigger>
                            <SelectContent>
                              {waitlist.map(entry => (
                                <SelectItem key={entry.id} value={entry.patientId}>
                                  {getPatientName(entry.patientId)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Button
                            variant={action.primary ? 'default' : 'outline'}
                            className="w-full"
                            onClick={() => handleAssignBackup(selectedAppointment.id)}
                            disabled={!backupPatient}
                          >
                            <Icon className="w-4 h-4 mr-2" />
                            {action.label}
                          </Button>
                        </div>
                      )
                    }
                    return (
                      <Button
                        key={idx}
                        variant={action.primary ? 'default' : 'outline'}
                        className="w-full justify-start"
                        onClick={() => handleAction(action.action as 'confirm' | 'sms' | 'email' | 'call', selectedAppointment)}
                        disabled={actionLoading}
                      >
                        <Icon className="w-4 h-4 mr-2" />
                        {action.label}
                      </Button>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedAppointment(null)}>
              Fermer
            </Button>
            <Button
              variant="destructive"
              onClick={() => selectedAppointment && handleAction('cancel', selectedAppointment)}
              disabled={actionLoading}
            >
              <X className="w-4 h-4 mr-2" />
              Annuler le RDV
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

interface AppointmentRiskCardProps {
  appointment: Appointment
  idx: number
  getPatientName: (id: string) => string
  getPractitionerName: (id: string) => string
  getSiteName: (id: string) => string
  getSuggestedActions: (score: number) => { icon: React.ElementType; label: string; action: string; primary?: boolean }[]
  onAction: (action: 'confirm' | 'cancel' | 'sms' | 'email' | 'call', appt: Appointment) => void
  onSelect: (appt: Appointment) => void
}

function AppointmentRiskCard({
  appointment,
  idx,
  getPatientName,
  getPractitionerName,
  getSiteName,
  getSuggestedActions,
  onAction,
  onSelect,
}: AppointmentRiskCardProps) {
  const actions = getSuggestedActions(appointment.noShowScore)
  const primaryAction = actions.find(a => a.primary)

  return (
    <Card className="animate-row hover:shadow-md transition-shadow" style={{ animationDelay: `${idx * 0.05}s` }}>
      <CardContent className="p-4">
        <div className="flex flex-col lg:flex-row lg:items-center gap-4">
          {/* Risk score */}
          <div className="flex items-center gap-3 lg:min-w-[160px]">
            <RiskBadge score={appointment.noShowScore} size="lg" />
            <div className="flex-1 lg:hidden">
              <p className="font-medium">{getPatientName(appointment.patientId)}</p>
              <p className="text-sm text-muted-foreground">
                {format(new Date(appointment.date), 'd MMM', { locale: fr })} à {appointment.startTime}
              </p>
            </div>
          </div>

          {/* Patient info - hidden on mobile, shown in desktop */}
          <div className="hidden lg:block flex-1">
            <p className="font-medium">{getPatientName(appointment.patientId)}</p>
            <p className="text-sm text-muted-foreground">
              {format(new Date(appointment.date), 'EEEE d MMMM', { locale: fr })} à {appointment.startTime}
            </p>
          </div>

          {/* Practitioner & site */}
          <div className="text-sm lg:min-w-[180px]">
            <p className="truncate">{getPractitionerName(appointment.practitionerId)}</p>
            <p className="text-muted-foreground truncate">{getSiteName(appointment.siteId)}</p>
          </div>

          {/* Factors preview */}
          <div className="flex flex-wrap gap-1 lg:min-w-[200px]">
            {appointment.noShowFactors.slice(0, 2).map((factor, i) => (
              <Badge key={i} variant="outline" className="text-[10px]">
                {factor.factor.length > 15 ? factor.factor.substring(0, 15) + '...' : factor.factor}
              </Badge>
            ))}
            {appointment.noShowFactors.length > 2 && (
              <Badge variant="outline" className="text-[10px]">
                +{appointment.noShowFactors.length - 2}
              </Badge>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {primaryAction && (
              <Button
                size="sm"
                onClick={() => onAction(primaryAction.action as 'sms' | 'email' | 'call', appointment)}
              >
                <primaryAction.icon className="w-4 h-4 mr-1" />
                <span className="hidden sm:inline">{primaryAction.label}</span>
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => onSelect(appointment)}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

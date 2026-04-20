'use client'

import { useEffect, useState, useCallback } from 'react'
import { format, addDays, startOfWeek, eachDayOfInterval, isSameDay, isToday } from 'date-fns'
import { fr } from 'date-fns/locale'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { RiskBadge } from '@/components/dashboard/risk-badge'
import { useApp } from '@/contexts/app-context'
import {
  fetchAppointments,
  fetchTimeSlots,
  fetchPractitioners,
  fetchSites,
  createAppointment,
  cancelAppointment,
} from '@/lib/mock-api'
import { mockPatients } from '@/lib/mock-data'
import type { Appointment, TimeSlot, Practitioner, Site } from '@/types'
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  Clock,
  User,
  MapPin,
  X,
  Plus,
  Filter,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { Label } from '@/components/ui/label'
import { FieldGroup, Field } from '@/components/ui/field'

const timeSlots = [
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '14:00', '14:30', '15:00', '15:30', '16:00', '16:30',
]

export default function AgendaPage() {
  const { currentRole } = useApp()
  const canManageBookings = currentRole === 'admin' || currentRole === 'secretaire'
  const [view, setView] = useState<'day' | 'week'>('week')
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [slots, setSlots] = useState<TimeSlot[]>([])
  const [practitioners, setPractitioners] = useState<Practitioner[]>([])
  const [sites, setSites] = useState<Site[]>([])
  const [selectedSite, setSelectedSite] = useState<string>('all')
  const [selectedPractitioner, setSelectedPractitioner] = useState<string>('all')
  const [loading, setLoading] = useState(true)
  const [bookingSlot, setBookingSlot] = useState<TimeSlot | null>(null)
  const [selectedPatient, setSelectedPatient] = useState<string>('')
  const [bookingLoading, setBookingLoading] = useState(false)
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null)

  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 })
  const weekDays = eachDayOfInterval({
    start: weekStart,
    end: addDays(weekStart, 6),
  }).filter(d => d.getDay() !== 0 && d.getDay() !== 6) // Exclude weekends

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [sitesData, practitionersData] = await Promise.all([
        fetchSites(),
        fetchPractitioners(),
      ])
      setSites(sitesData)
      setPractitioners(practitionersData)

      const dateRange = view === 'day'
        ? [format(selectedDate, 'yyyy-MM-dd')]
        : weekDays.map(d => format(d, 'yyyy-MM-dd'))

      const [appointmentsData, slotsData] = await Promise.all([
        Promise.all(dateRange.map(date => fetchAppointments({ date }))).then(results => results.flat()),
        Promise.all(dateRange.map(date => fetchTimeSlots({ date }))).then(results => results.flat()),
      ])

      let filteredAppointments = appointmentsData
      let filteredSlots = slotsData

      if (selectedSite !== 'all') {
        filteredAppointments = filteredAppointments.filter(a => a.siteId === selectedSite)
        filteredSlots = filteredSlots.filter(s => s.siteId === selectedSite)
      }
      if (selectedPractitioner !== 'all') {
        filteredAppointments = filteredAppointments.filter(a => a.practitionerId === selectedPractitioner)
        filteredSlots = filteredSlots.filter(s => s.practitionerId === selectedPractitioner)
      }

      setAppointments(filteredAppointments)
      setSlots(filteredSlots)
    } catch (error) {
      console.error('Error loading agenda data:', error)
      toast.error('Erreur lors du chargement de l\'agenda')
    } finally {
      setLoading(false)
    }
  }, [selectedDate, view, selectedSite, selectedPractitioner, weekDays])

  useEffect(() => {
    loadData()
  }, [loadData])

  const getPatientName = (patientId: string) => {
    const patient = mockPatients.find(p => p.id === patientId)
    return patient ? `${patient.firstName} ${patient.lastName}` : 'Patient inconnu'
  }

  const getPractitionerName = (practitionerId: string) => {
    const practitioner = practitioners.find(p => p.id === practitionerId)
    return practitioner?.name || 'Praticien inconnu'
  }

  const getAppointmentForSlot = (date: string, time: string, practitionerId: string) => {
    return appointments.find(
      a => a.date === date && a.startTime === time && a.practitionerId === practitionerId
    )
  }

  const getSlotForTime = (date: string, time: string, practitionerId: string) => {
    return slots.find(
      s => s.date === date && s.startTime === time && s.practitionerId === practitionerId
    )
  }

  const handleBookSlot = async () => {
    if (!bookingSlot || !selectedPatient) return
    
    setBookingLoading(true)
    try {
      await createAppointment({
        patientId: selectedPatient,
        practitionerId: bookingSlot.practitionerId,
        siteId: bookingSlot.siteId,
        date: bookingSlot.date,
        startTime: bookingSlot.startTime,
        endTime: bookingSlot.endTime,
        status: 'scheduled',
      })
      toast.success('Rendez-vous créé avec succès')
      setBookingSlot(null)
      setSelectedPatient('')
      loadData()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erreur lors de la création')
    } finally {
      setBookingLoading(false)
    }
  }

  const handleCancelAppointment = async () => {
    if (!selectedAppointment) return
    
    try {
      await cancelAppointment(selectedAppointment.id)
      toast.success('Rendez-vous annulé')
      setSelectedAppointment(null)
      loadData()
    } catch (error) {
      toast.error('Erreur lors de l\'annulation')
    }
  }

  const getStatusColor = (status: Appointment['status']) => {
    switch (status) {
      case 'confirmed': return 'bg-success/20 border-success/50 text-success'
      case 'scheduled': return 'bg-chart-2/20 border-chart-2/50 text-chart-2'
      case 'cancelled': return 'bg-muted border-border text-muted-foreground line-through'
      case 'no_show': return 'bg-destructive/20 border-destructive/50 text-destructive'
      case 'completed': return 'bg-secondary border-border text-secondary-foreground'
      default: return 'bg-secondary border-border'
    }
  }

  const filteredPractitioners = selectedSite === 'all'
    ? practitioners
    : practitioners.filter(p => p.siteId === selectedSite)

  const displayPractitioners = selectedPractitioner === 'all'
    ? filteredPractitioners.slice(0, 4)
    : filteredPractitioners.filter(p => p.id === selectedPractitioner)

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-[600px] w-full" />
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setSelectedDate(d => addDays(d, view === 'day' ? -1 : -7))}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <div className="text-center min-w-[200px]">
            <h1 className="text-xl font-bold">
              {view === 'day'
                ? format(selectedDate, 'EEEE d MMMM yyyy', { locale: fr })
                : `Semaine du ${format(weekStart, 'd MMMM', { locale: fr })}`
              }
            </h1>
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setSelectedDate(d => addDays(d, view === 'day' ? 1 : 7))}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSelectedDate(new Date())}
          >
            Aujourd&apos;hui
          </Button>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Tabs value={view} onValueChange={(v) => setView(v as 'day' | 'week')}>
            <TabsList>
              <TabsTrigger value="day">Jour</TabsTrigger>
              <TabsTrigger value="week">Semaine</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <Select value={selectedSite} onValueChange={setSelectedSite}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Tous les sites" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les sites</SelectItem>
                {sites.map(site => (
                  <SelectItem key={site.id} value={site.id}>{site.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedPractitioner} onValueChange={setSelectedPractitioner}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Tous les praticiens" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les praticiens</SelectItem>
                {filteredPractitioners.map(p => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Calendar grid */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <div className="min-w-[800px]">
              {/* Header row */}
              <div className="grid border-b border-border" style={{
                gridTemplateColumns: `80px repeat(${view === 'day' ? displayPractitioners.length : weekDays.length}, 1fr)`,
              }}>
                <div className="p-3 border-r border-border bg-muted/50">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                </div>
                {view === 'day' ? (
                  displayPractitioners.map(p => (
                    <div key={p.id} className="p-3 text-center border-r border-border bg-muted/50">
                      <p className="font-medium text-sm truncate">{p.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {sites.find(s => s.id === p.siteId)?.name}
                      </p>
                    </div>
                  ))
                ) : (
                  weekDays.map(day => (
                    <div
                      key={day.toISOString()}
                      className={cn(
                        'p-3 text-center border-r border-border',
                        isToday(day) ? 'bg-primary/10' : 'bg-muted/50'
                      )}
                    >
                      <p className="font-medium text-sm">
                        {format(day, 'EEE', { locale: fr })}
                      </p>
                      <p className={cn(
                        'text-lg',
                        isToday(day) && 'text-primary font-bold'
                      )}>
                        {format(day, 'd')}
                      </p>
                    </div>
                  ))
                )}
              </div>

              {/* Time slots */}
              {timeSlots.map(time => (
                <div
                  key={time}
                  className="grid border-b border-border"
                  style={{
                    gridTemplateColumns: `80px repeat(${view === 'day' ? displayPractitioners.length : weekDays.length}, 1fr)`,
                  }}
                >
                  <div className="p-2 border-r border-border bg-muted/30 text-xs text-muted-foreground">
                    {time}
                  </div>
                  {view === 'day' ? (
                    displayPractitioners.map(practitioner => {
                      const dateStr = format(selectedDate, 'yyyy-MM-dd')
                      const appointment = getAppointmentForSlot(dateStr, time, practitioner.id)
                      const slot = getSlotForTime(dateStr, time, practitioner.id)

                      return (
                        <div
                          key={practitioner.id}
                          className="p-1 border-r border-border min-h-[60px] hover:bg-muted/20 transition-colors"
                        >
                          {appointment ? (
                            <button
                              onClick={() => setSelectedAppointment(appointment)}
                              className={cn(
                                'w-full p-2 rounded-md border text-left text-xs transition-all hover:scale-[1.02]',
                                getStatusColor(appointment.status)
                              )}
                            >
                              <div className="flex items-center justify-between gap-1 mb-1">
                                <span className="font-medium truncate">
                                  {getPatientName(appointment.patientId)}
                                </span>
                                <RiskBadge score={appointment.noShowScore} size="sm" showLabel={false} />
                              </div>
                              <Badge variant="outline" className="text-[10px]">
                                {appointment.status === 'confirmed' ? 'Confirmé' :
                                 appointment.status === 'scheduled' ? 'Planifié' :
                                 appointment.status === 'cancelled' ? 'Annulé' :
                                 appointment.status === 'no_show' ? 'No-show' : 'Terminé'}
                              </Badge>
                            </button>
                          ) : slot?.isAvailable && canManageBookings ? (
                            <button
                              onClick={() => setBookingSlot(slot)}
                              className="w-full h-full flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-md transition-colors"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          ) : null}
                        </div>
                      )
                    })
                  ) : (
                    weekDays.map(day => {
                      const dateStr = format(day, 'yyyy-MM-dd')
                      // For week view, show first practitioner's appointments or aggregate
                      const dayAppointments = appointments.filter(
                        a => a.date === dateStr && a.startTime === time
                      )

                      return (
                        <div
                          key={day.toISOString()}
                          className={cn(
                            'p-1 border-r border-border min-h-[60px] hover:bg-muted/20 transition-colors',
                            isToday(day) && 'bg-primary/5'
                          )}
                        >
                          {dayAppointments.length > 0 ? (
                            <div className="space-y-1">
                              {dayAppointments.slice(0, 2).map(appt => (
                                <button
                                  key={appt.id}
                                  onClick={() => setSelectedAppointment(appt)}
                                  className={cn(
                                    'w-full p-1.5 rounded text-[10px] text-left truncate transition-all hover:scale-[1.02]',
                                    getStatusColor(appt.status)
                                  )}
                                >
                                  {getPatientName(appt.patientId).split(' ')[0]}
                                </button>
                              ))}
                              {dayAppointments.length > 2 && (
                                <p className="text-[10px] text-muted-foreground text-center">
                                  +{dayAppointments.length - 2}
                                </p>
                              )}
                            </div>
                          ) : null}
                        </div>
                      )
                    })
                  )}
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Booking dialog */}
      <Dialog open={!!bookingSlot} onOpenChange={() => setBookingSlot(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Réserver un créneau</DialogTitle>
            <DialogDescription>
              {bookingSlot && (
                <>
                  {format(new Date(bookingSlot.date), 'd MMMM yyyy', { locale: fr })} à {bookingSlot.startTime}
                  <br />
                  {getPractitionerName(bookingSlot.practitionerId)}
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          
          <FieldGroup>
            <Field>
              <Label>Patient</Label>
              <Select value={selectedPatient} onValueChange={setSelectedPatient}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un patient" />
                </SelectTrigger>
                <SelectContent>
                  {mockPatients.map(patient => (
                    <SelectItem key={patient.id} value={patient.id}>
                      {patient.firstName} {patient.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </FieldGroup>

          <DialogFooter>
            <Button variant="outline" onClick={() => setBookingSlot(null)}>
              Annuler
            </Button>
            <Button onClick={handleBookSlot} disabled={!selectedPatient || bookingLoading}>
              {bookingLoading ? 'Création...' : 'Confirmer la réservation'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Appointment details dialog */}
      <Dialog open={!!selectedAppointment} onOpenChange={() => setSelectedAppointment(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Détails du rendez-vous</DialogTitle>
          </DialogHeader>
          
          {selectedAppointment && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <User className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">{getPatientName(selectedAppointment.patientId)}</p>
                  <p className="text-sm text-muted-foreground">Patient</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">
                    {format(new Date(selectedAppointment.date), 'd MMMM yyyy', { locale: fr })}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {selectedAppointment.startTime} - {selectedAppointment.endTime}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <User className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">{getPractitionerName(selectedAppointment.practitionerId)}</p>
                  <p className="text-sm text-muted-foreground">Praticien</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <MapPin className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">
                    {sites.find(s => s.id === selectedAppointment.siteId)?.name}
                  </p>
                  <p className="text-sm text-muted-foreground">Site</p>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-secondary/50">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Score no-show</span>
                  <RiskBadge
                    score={selectedAppointment.noShowScore}
                    factors={selectedAppointment.noShowFactors}
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Statut:</span>
                <Badge className={getStatusColor(selectedAppointment.status)}>
                  {selectedAppointment.status === 'confirmed' ? 'Confirmé' :
                   selectedAppointment.status === 'scheduled' ? 'Planifié' :
                   selectedAppointment.status === 'cancelled' ? 'Annulé' :
                   selectedAppointment.status === 'no_show' ? 'No-show' : 'Terminé'}
                </Badge>
              </div>
            </div>
          )}

          <DialogFooter>
            {selectedAppointment?.status === 'scheduled' || selectedAppointment?.status === 'confirmed' ? (
              <>
                <Button variant="outline" onClick={() => setSelectedAppointment(null)}>
                  Fermer
                </Button>
                <Button variant="destructive" onClick={handleCancelAppointment}>
                  <X className="w-4 h-4 mr-2" />
                  Annuler le RDV
                </Button>
              </>
            ) : (
              <Button variant="outline" onClick={() => setSelectedAppointment(null)}>
                Fermer
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

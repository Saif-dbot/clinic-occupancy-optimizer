'use client'

import { useEffect, useState, useCallback } from 'react'
import { format, formatDistanceToNow, isPast } from 'date-fns'
import { fr } from 'date-fns/locale'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  fetchWaitlist,
  fetchTimeSlots,
  offerSlotToWaitlist,
  acceptWaitlistOffer,
  declineWaitlistOffer,
} from '@/lib/mock-api'
import { mockPatients, mockPractitioners, mockSites, mockSpecialties } from '@/lib/mock-data'
import type { WaitlistEntry, TimeSlot } from '@/types'
import {
  Clock,
  User,
  Calendar,
  MapPin,
  Send,
  Check,
  X,
  Timer,
  AlertCircle,
  ArrowRight,
  RefreshCw,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { Empty } from '@/components/ui/empty'

export default function WaitlistPage() {
  const [waitlist, setWaitlist] = useState<WaitlistEntry[]>([])
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedEntry, setSelectedEntry] = useState<WaitlistEntry | null>(null)
  const [selectedSlot, setSelectedSlot] = useState<string>('')
  const [actionLoading, setActionLoading] = useState(false)
  const [currentTime, setCurrentTime] = useState(new Date())

  // Update current time every second for countdown timers
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  const loadData = useCallback(async () => {
    try {
      const [wlData, slotsData] = await Promise.all([
        fetchWaitlist(),
        fetchTimeSlots({ availableOnly: true }),
      ])
      setWaitlist(wlData)
      setAvailableSlots(slotsData)
    } catch (error) {
      console.error('Error loading waitlist:', error)
      toast.error('Erreur lors du chargement')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

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
    return practitioner?.name || 'Tous praticiens'
  }

  const getSiteName = (siteId: string) => {
    const site = mockSites.find(s => s.id === siteId)
    return site?.name || 'Site inconnu'
  }

  const getSpecialtyName = (specialtyId?: string) => {
    if (!specialtyId) return 'Toutes spécialités'
    const specialty = mockSpecialties.find(s => s.id === specialtyId)
    return specialty?.name || 'Spécialité inconnue'
  }

  const getTimeRemaining = (expiresAt?: string) => {
    if (!expiresAt) return null
    const expires = new Date(expiresAt)
    const now = currentTime
    const diff = expires.getTime() - now.getTime()
    
    if (diff <= 0) return { expired: true, text: 'Expirée', percentage: 0 }
    
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    const seconds = Math.floor((diff % (1000 * 60)) / 1000)
    
    // Assuming 2 hour expiry
    const totalDuration = 2 * 60 * 60 * 1000
    const percentage = Math.max(0, (diff / totalDuration) * 100)
    
    if (hours > 0) {
      return { expired: false, text: `${hours}h ${minutes}m`, percentage }
    }
    if (minutes > 0) {
      return { expired: false, text: `${minutes}m ${seconds}s`, percentage }
    }
    return { expired: false, text: `${seconds}s`, percentage }
  }

  const handleOfferSlot = async () => {
    if (!selectedEntry || !selectedSlot) return
    
    setActionLoading(true)
    try {
      const updated = await offerSlotToWaitlist(selectedEntry.id, selectedSlot)
      setWaitlist(prev => prev.map(w => w.id === updated.id ? updated : w))
      toast.success('Proposition envoyée au patient')
      setSelectedEntry(null)
      setSelectedSlot('')
    } catch (error) {
      toast.error('Erreur lors de l\'envoi de la proposition')
    } finally {
      setActionLoading(false)
    }
  }

  const handleAcceptOffer = async (entryId: string) => {
    setActionLoading(true)
    try {
      const { waitlistEntry } = await acceptWaitlistOffer(entryId)
      setWaitlist(prev => prev.map(w => w.id === waitlistEntry.id ? waitlistEntry : w))
      toast.success('Rendez-vous confirmé')
      loadData() // Refresh to update available slots
    } catch (error) {
      toast.error('Erreur lors de la confirmation')
    } finally {
      setActionLoading(false)
    }
  }

  const handleDeclineOffer = async (entryId: string) => {
    setActionLoading(true)
    try {
      const updated = await declineWaitlistOffer(entryId)
      setWaitlist(prev => prev.map(w => w.id === updated.id ? updated : w))
      toast.success('Proposition déclinée')
    } catch (error) {
      toast.error('Erreur lors du refus')
    } finally {
      setActionLoading(false)
    }
  }

  const pendingEntries = waitlist.filter(w => w.status === 'pending')
  const offeredEntries = waitlist.filter(w => w.status === 'offered')
  const acceptedEntries = waitlist.filter(w => w.status === 'accepted')
  const expiredEntries = waitlist.filter(w => w.status === 'expired' || w.status === 'declined')

  const getMatchingSlots = (entry: WaitlistEntry) => {
    return availableSlots.filter(slot => {
      const matchesSite = slot.siteId === entry.siteId
      const matchesPractitioner = !entry.practitionerId || slot.practitionerId === entry.practitionerId
      const matchesDate = entry.preferredDates.includes(slot.date)
      const matchesTime = entry.preferredTimes.some(t => slot.startTime.startsWith(t.substring(0, 2)))
      return matchesSite && matchesPractitioner && matchesDate && matchesTime
    })
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
            <Clock className="w-6 h-6 text-primary" />
            Liste d&apos;attente & Réaffectation
          </h1>
          <p className="text-muted-foreground">
            Gérez les patients en attente et réaffectez les créneaux annulés
          </p>
        </div>
        <Button variant="outline" onClick={loadData}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Actualiser
        </Button>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">En attente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingEntries.length}</div>
            <p className="text-xs text-muted-foreground">Patients à recontacter</p>
          </CardContent>
        </Card>

        <Card className={offeredEntries.length > 0 ? 'border-primary/50 bg-primary/5' : ''}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Timer className="w-4 h-4 text-primary" />
              Propositions actives
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{offeredEntries.length}</div>
            <p className="text-xs text-muted-foreground">En attente de réponse</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Check className="w-4 h-4 text-success" />
              Réaffectations réussies
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{acceptedEntries.length}</div>
            <p className="text-xs text-muted-foreground">Créneaux récupérés</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Créneaux disponibles</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{availableSlots.length}</div>
            <p className="text-xs text-muted-foreground">Pour réaffectation</p>
          </CardContent>
        </Card>
      </div>

      {/* Offered entries with timer */}
      {offeredEntries.length > 0 && (
        <Card className="border-primary/30">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Timer className="w-5 h-5 text-primary" />
              Propositions en cours
            </CardTitle>
            <CardDescription>
              Ces patients ont reçu une proposition de créneau avec un délai d&apos;expiration
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {offeredEntries.map((entry, idx) => {
                const timeRemaining = getTimeRemaining(entry.expiresAt)
                const slot = availableSlots.find(s => s.id === entry.offeredSlotId)
                
                return (
                  <div
                    key={entry.id}
                    className="flex flex-col lg:flex-row lg:items-center gap-4 p-4 rounded-lg bg-secondary/50 animate-row"
                    style={{ animationDelay: `${idx * 0.05}s` }}
                  >
                    {/* Timer */}
                    <div className="lg:w-40">
                      {timeRemaining && (
                        <div className="space-y-2">
                          <div className={cn(
                            'flex items-center gap-2 text-sm font-mono',
                            timeRemaining.expired ? 'text-destructive' : 
                            timeRemaining.percentage < 25 ? 'text-warning' : 'text-primary'
                          )}>
                            {timeRemaining.expired ? (
                              <AlertCircle className="w-4 h-4" />
                            ) : (
                              <Timer className="w-4 h-4 animate-pulse" />
                            )}
                            {timeRemaining.text}
                          </div>
                          <Progress 
                            value={timeRemaining.percentage} 
                            className={cn(
                              'h-1.5',
                              timeRemaining.percentage < 25 && '[&>div]:bg-warning'
                            )}
                          />
                        </div>
                      )}
                    </div>

                    {/* Patient info */}
                    <div className="flex-1">
                      <p className="font-medium">{getPatientName(entry.patientId)}</p>
                      <p className="text-sm text-muted-foreground">{getPatientPhone(entry.patientId)}</p>
                    </div>

                    {/* Offered slot */}
                    <div className="lg:w-48">
                      {slot && (
                        <div className="text-sm">
                          <p className="font-medium">
                            {format(new Date(slot.date), 'd MMMM', { locale: fr })} à {slot.startTime}
                          </p>
                          <p className="text-muted-foreground truncate">
                            {getPractitionerName(slot.practitionerId)}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleAcceptOffer(entry.id)}
                        disabled={actionLoading || timeRemaining?.expired}
                      >
                        <Check className="w-4 h-4 mr-1" />
                        Confirmer
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeclineOffer(entry.id)}
                        disabled={actionLoading}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pending entries table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Patients en attente</CardTitle>
          <CardDescription>
            Cliquez sur un patient pour lui proposer un créneau disponible
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {pendingEntries.length === 0 ? (
            <Empty
              icon={Clock}
              title="Liste d'attente vide"
              description="Aucun patient n'attend de créneau actuellement"
              className="py-12"
            />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Patient</TableHead>
                    <TableHead>Site</TableHead>
                    <TableHead>Spécialité / Praticien</TableHead>
                    <TableHead>Dates souhaitées</TableHead>
                    <TableHead>Horaires</TableHead>
                    <TableHead>Créneaux dispo.</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingEntries.map((entry, idx) => {
                    const matchingSlots = getMatchingSlots(entry)
                    
                    return (
                      <TableRow key={entry.id} className="animate-row" style={{ animationDelay: `${idx * 0.02}s` }}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
                              <User className="w-4 h-4 text-muted-foreground" />
                            </div>
                            <div>
                              <p className="font-medium text-sm">{getPatientName(entry.patientId)}</p>
                              <p className="text-xs text-muted-foreground">
                                Depuis {formatDistanceToNow(new Date(entry.createdAt), { locale: fr, addSuffix: false })}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <p className="text-sm">{getSiteName(entry.siteId)}</p>
                        </TableCell>
                        <TableCell>
                          <p className="text-sm">{getSpecialtyName(entry.specialtyId)}</p>
                          {entry.practitionerId && (
                            <p className="text-xs text-muted-foreground">
                              {getPractitionerName(entry.practitionerId)}
                            </p>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {entry.preferredDates.slice(0, 2).map((date, i) => (
                              <Badge key={i} variant="outline" className="text-[10px]">
                                {format(new Date(date), 'd MMM', { locale: fr })}
                              </Badge>
                            ))}
                            {entry.preferredDates.length > 2 && (
                              <Badge variant="outline" className="text-[10px]">
                                +{entry.preferredDates.length - 2}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {entry.preferredTimes.slice(0, 2).map((time, i) => (
                              <Badge key={i} variant="secondary" className="text-[10px]">
                                {time}
                              </Badge>
                            ))}
                            {entry.preferredTimes.length > 2 && (
                              <Badge variant="secondary" className="text-[10px]">
                                +{entry.preferredTimes.length - 2}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={matchingSlots.length > 0 ? 'default' : 'secondary'}
                            className="text-xs"
                          >
                            {matchingSlots.length} créneaux
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            onClick={() => setSelectedEntry(entry)}
                            disabled={matchingSlots.length === 0}
                          >
                            <Send className="w-4 h-4 mr-1" />
                            Proposer
                          </Button>
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

      {/* Offer slot dialog */}
      <Dialog open={!!selectedEntry} onOpenChange={() => {
        setSelectedEntry(null)
        setSelectedSlot('')
      }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Proposer un créneau</DialogTitle>
            <DialogDescription>
              Patient: {selectedEntry && getPatientName(selectedEntry.patientId)}
            </DialogDescription>
          </DialogHeader>
          
          {selectedEntry && (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-secondary/50">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Site souhaité</p>
                    <p className="font-medium">{getSiteName(selectedEntry.siteId)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Spécialité</p>
                    <p className="font-medium">{getSpecialtyName(selectedEntry.specialtyId)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Dates préférées</p>
                    <p className="font-medium">
                      {selectedEntry.preferredDates.map(d => format(new Date(d), 'd MMM', { locale: fr })).join(', ')}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Horaires</p>
                    <p className="font-medium">{selectedEntry.preferredTimes.join(', ')}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium">Sélectionnez un créneau</p>
                <Select value={selectedSlot} onValueChange={setSelectedSlot}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choisir un créneau disponible" />
                  </SelectTrigger>
                  <SelectContent>
                    {getMatchingSlots(selectedEntry).map(slot => (
                      <SelectItem key={slot.id} value={slot.id}>
                        {format(new Date(slot.date), 'EEE d MMM', { locale: fr })} à {slot.startTime} - {getPractitionerName(slot.practitionerId)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 text-sm text-muted-foreground">
                <Timer className="w-4 h-4" />
                <span>Le patient aura 2 heures pour accepter cette proposition</span>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setSelectedEntry(null)
              setSelectedSlot('')
            }}>
              Annuler
            </Button>
            <Button onClick={handleOfferSlot} disabled={!selectedSlot || actionLoading}>
              <Send className="w-4 h-4 mr-2" />
              Envoyer la proposition
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

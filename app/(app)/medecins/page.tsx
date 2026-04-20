'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { useApp } from '@/contexts/app-context'
import { fetchPractitioners, fetchSites, fetchTimeSlots } from '@/lib/mock-api'
import { mockSpecialties } from '@/lib/mock-data'
import type { Practitioner, Site, TimeSlot } from '@/types'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { Skeleton } from '@/components/ui/skeleton'
import { MapPin, Search, Stethoscope, CalendarClock, Phone, ArrowRight } from 'lucide-react'
import { toast } from 'sonner'

const sitePhones: Record<string, string> = {
  s1: '01 45 00 10 10',
  s2: '01 46 00 20 20',
  s3: '01 47 00 30 30',
}

export default function MedecinsPage() {
  const { currentRole } = useApp()
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [selectedSite, setSelectedSite] = useState('all')
  const [selectedSpecialty, setSelectedSpecialty] = useState('all')
  const [practitioners, setPractitioners] = useState<Practitioner[]>([])
  const [sites, setSites] = useState<Site[]>([])
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([])

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      try {
        const [practitionersData, sitesData, slotsData] = await Promise.all([
          fetchPractitioners(),
          fetchSites(),
          fetchTimeSlots({ availableOnly: true }),
        ])
        setPractitioners(practitionersData)
        setSites(sitesData)
        setAvailableSlots(slotsData)
      } catch (error) {
        console.error('Error loading practitioners page:', error)
        toast.error('Impossible de charger les informations des médecins')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  const filteredPractitioners = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()

    return practitioners
      .filter(p => selectedSite === 'all' || p.siteId === selectedSite)
      .filter(p => selectedSpecialty === 'all' || p.specialtyId === selectedSpecialty)
      .filter(p => {
        if (!normalizedQuery) return true

        const site = sites.find(s => s.id === p.siteId)
        const specialty = mockSpecialties.find(s => s.id === p.specialtyId)

        return [p.name, site?.name, specialty?.name]
          .filter(Boolean)
          .some(value => value?.toLowerCase().includes(normalizedQuery))
      })
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [practitioners, query, selectedSite, selectedSpecialty, sites])

  const getSite = (siteId: string) => sites.find(s => s.id === siteId)

  const getSpecialty = (specialtyId: string) =>
    mockSpecialties.find(s => s.id === specialtyId)

  const getNextAvailableSlot = (practitionerId: string) => {
    const now = Date.now()

    return availableSlots
      .filter(s => s.practitionerId === practitionerId)
      .map(slot => ({
        slot,
        timestamp: new Date(`${slot.date}T${slot.startTime}:00`).getTime(),
      }))
      .filter(item => item.timestamp >= now)
      .sort((a, b) => a.timestamp - b.timestamp)[0]?.slot
  }

  if (currentRole !== 'client') {
    return (
      <div className="p-6">
        <Card>
          <CardHeader>
            <CardTitle>Page client</CardTitle>
            <CardDescription>
              Cette page est réservée au parcours client pour consulter les médecins.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/agenda">Retour aux rendez-vous</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">Détails des médecins</h1>
        <p className="text-muted-foreground">
          Choisissez le praticien qui correspond le mieux à votre besoin médical.
        </p>
      </div>

      <Card>
        <CardContent className="pt-6 grid gap-3 md:grid-cols-3">
          <div className="relative md:col-span-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              className="pl-9"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Rechercher un médecin..."
            />
          </div>

          <Select value={selectedSite} onValueChange={setSelectedSite}>
            <SelectTrigger>
              <SelectValue placeholder="Tous les sites" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les sites</SelectItem>
              {sites.map(site => (
                <SelectItem key={site.id} value={site.id}>
                  {site.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedSpecialty} onValueChange={setSelectedSpecialty}>
            <SelectTrigger>
              <SelectValue placeholder="Toutes les spécialités" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les spécialités</SelectItem>
              {mockSpecialties.map(specialty => (
                <SelectItem key={specialty.id} value={specialty.id}>
                  {specialty.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-72" />
          ))}
        </div>
      ) : filteredPractitioners.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Stethoscope className="size-6" />
            </EmptyMedia>
            <EmptyTitle>Aucun médecin trouvé</EmptyTitle>
            <EmptyDescription>
              Modifiez vos filtres pour voir les praticiens disponibles.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button variant="outline" onClick={() => {
              setQuery('')
              setSelectedSite('all')
              setSelectedSpecialty('all')
            }}>
              Réinitialiser les filtres
            </Button>
          </EmptyContent>
        </Empty>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredPractitioners.map(practitioner => {
            const site = getSite(practitioner.siteId)
            const specialty = getSpecialty(practitioner.specialtyId)
            const nextSlot = getNextAvailableSlot(practitioner.id)

            return (
              <Card key={practitioner.id} className="h-full border-border/70">
                <CardHeader className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <CardTitle className="text-lg">{practitioner.name}</CardTitle>
                      <CardDescription>{site?.city}</CardDescription>
                    </div>
                    {specialty ? (
                      <Badge
                        variant="secondary"
                        style={{
                          borderColor: specialty.color,
                          backgroundColor: `${specialty.color}1A`,
                          color: specialty.color,
                        }}
                      >
                        {specialty.name}
                      </Badge>
                    ) : null}
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="w-4 h-4" />
                      <span>{site?.name}</span>
                    </div>
                    <div className="pl-6 text-muted-foreground">
                      {site?.address}
                    </div>

                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Phone className="w-4 h-4" />
                      <span>Secrétariat: {sitePhones[practitioner.siteId] ?? '01 40 00 00 00'}</span>
                    </div>

                    <div className="flex items-start gap-2 text-muted-foreground">
                      <CalendarClock className="w-4 h-4 mt-0.5" />
                      {nextSlot ? (
                        <span>
                          Prochain créneau: {format(new Date(nextSlot.date), 'EEE d MMM', { locale: fr })} à {nextSlot.startTime}
                        </span>
                      ) : (
                        <span>Aucun créneau proche disponible</span>
                      )}
                    </div>
                  </div>

                  <Button className="w-full" asChild>
                    <Link href={`/agenda?praticien=${practitioner.id}`}>
                      Prendre rendez-vous
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}

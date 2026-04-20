'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { useApp } from '@/contexts/app-context'
import { mockPatients } from '@/lib/mock-data'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Field, FieldGroup } from '@/components/ui/field'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { UserRound, ShieldCheck, Save, FileHeart, Phone, Calendar, ArrowRight } from 'lucide-react'
import { toast } from 'sonner'

interface ProfileFormData {
  firstName: string
  lastName: string
  phone: string
  email: string
  birthDate: string
  address: string
  city: string
  postalCode: string
  socialNumber: string
  mutualInsurance: string
  allergies: string
  chronicConditions: string
  currentMedications: string
  emergencyContactName: string
  emergencyContactPhone: string
  notesForDoctor: string
}

interface SymptomSnapshot {
  createdAt: string
  mainSymptom: string
  associatedSymptoms: string
}

export default function ProfilPage() {
  const { currentRole, currentUser } = useApp()

  const currentPatient = useMemo(() => {
    if (!currentUser) return null
    const normalizedName = currentUser.name.trim().toLowerCase()

    return (
      mockPatients.find(
        p => `${p.firstName} ${p.lastName}`.trim().toLowerCase() === normalizedName,
      ) || null
    )
  }, [currentUser])

  const defaultProfile = useMemo<ProfileFormData>(() => {
    const firstNameFromUser = currentUser?.name.split(' ')[0] ?? ''
    const lastNameFromUser = currentUser?.name.split(' ').slice(1).join(' ') ?? ''

    return {
      firstName: currentPatient?.firstName ?? firstNameFromUser,
      lastName: currentPatient?.lastName ?? lastNameFromUser,
      phone: currentPatient?.phone ?? '',
      email: currentPatient?.email ?? currentUser?.email ?? '',
      birthDate: currentPatient?.birthDate ?? '',
      address: '',
      city: '',
      postalCode: '',
      socialNumber: '',
      mutualInsurance: '',
      allergies: '',
      chronicConditions: '',
      currentMedications: '',
      emergencyContactName: '',
      emergencyContactPhone: '',
      notesForDoctor: '',
    }
  }, [currentPatient, currentUser])

  const profileStorageKey = useMemo(
    () => `patient-profile-${currentPatient?.id ?? currentUser?.id ?? 'guest'}`,
    [currentPatient, currentUser],
  )

  const symptomStorageKey = useMemo(
    () => `symptom-reports-${currentPatient?.id ?? currentUser?.id ?? 'guest'}`,
    [currentPatient, currentUser],
  )

  const [profile, setProfile] = useState<ProfileFormData>(defaultProfile)
  const [latestSymptom, setLatestSymptom] = useState<SymptomSnapshot | null>(null)
  const [hydrating, setHydrating] = useState(true)

  useEffect(() => {
    setHydrating(true)

    try {
      const rawProfile = localStorage.getItem(profileStorageKey)
      const savedProfile = rawProfile ? (JSON.parse(rawProfile) as Partial<ProfileFormData>) : null

      setProfile({
        ...defaultProfile,
        ...(savedProfile ?? {}),
      })

      const rawSymptoms = localStorage.getItem(symptomStorageKey)
      if (rawSymptoms) {
        const parsed = JSON.parse(rawSymptoms) as SymptomSnapshot[]
        if (Array.isArray(parsed) && parsed.length > 0) {
          setLatestSymptom(parsed[0])
        } else {
          setLatestSymptom(null)
        }
      } else {
        setLatestSymptom(null)
      }
    } catch {
      setProfile(defaultProfile)
      setLatestSymptom(null)
    } finally {
      setHydrating(false)
    }
  }, [defaultProfile, profileStorageKey, symptomStorageKey])

  const updateField = <K extends keyof ProfileFormData>(key: K, value: ProfileFormData[K]) => {
    setProfile(prev => ({ ...prev, [key]: value }))
  }

  const saveProfile = () => {
    if (!profile.firstName.trim() || !profile.lastName.trim() || !profile.phone.trim()) {
      toast.error('Merci de renseigner au minimum nom, prénom et téléphone')
      return
    }

    localStorage.setItem(profileStorageKey, JSON.stringify(profile))
    toast.success('Profil patient enregistré')
  }

  const age = useMemo(() => {
    if (!profile.birthDate) return null
    const birth = new Date(`${profile.birthDate}T00:00:00`)
    if (Number.isNaN(birth.getTime())) return null

    const today = new Date()
    let years = today.getFullYear() - birth.getFullYear()
    const monthDiff = today.getMonth() - birth.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      years -= 1
    }
    return years
  }, [profile.birthDate])

  if (currentRole !== 'client') {
    return (
      <div className="p-6">
        <Card>
          <CardHeader>
            <CardTitle>Page client</CardTitle>
            <CardDescription>
              Cette page est réservée au profil patient avant la consultation.
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

  if (hydrating) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-10 w-72" />
        <Skeleton className="h-[560px] w-full" />
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">Mon profil médical</h1>
        <p className="text-muted-foreground">
          Complétez vos informations pour aider le médecin pendant la visite.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[2fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserRound className="w-5 h-5 text-primary" />
              Informations patient
            </CardTitle>
            <CardDescription>
              Nom, prénom, numéro et données utiles pour la consultation.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <FieldGroup>
              <div className="grid gap-4 md:grid-cols-2">
                <Field>
                  <Label>Prénom</Label>
                  <Input
                    value={profile.firstName}
                    onChange={(event) => updateField('firstName', event.target.value)}
                  />
                </Field>
                <Field>
                  <Label>Nom</Label>
                  <Input
                    value={profile.lastName}
                    onChange={(event) => updateField('lastName', event.target.value)}
                  />
                </Field>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <Field>
                  <Label>Téléphone</Label>
                  <Input
                    value={profile.phone}
                    onChange={(event) => updateField('phone', event.target.value)}
                    placeholder="06 12 34 56 78"
                  />
                </Field>
                <Field>
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={profile.email}
                    onChange={(event) => updateField('email', event.target.value)}
                  />
                </Field>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <Field>
                  <Label>Date de naissance</Label>
                  <Input
                    type="date"
                    value={profile.birthDate}
                    onChange={(event) => updateField('birthDate', event.target.value)}
                  />
                </Field>
                <Field>
                  <Label>Numéro de sécurité sociale</Label>
                  <Input
                    value={profile.socialNumber}
                    onChange={(event) => updateField('socialNumber', event.target.value)}
                    placeholder="1 85 03 ..."
                  />
                </Field>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <Field className="md:col-span-2">
                  <Label>Adresse</Label>
                  <Input
                    value={profile.address}
                    onChange={(event) => updateField('address', event.target.value)}
                  />
                </Field>
                <Field>
                  <Label>Code postal</Label>
                  <Input
                    value={profile.postalCode}
                    onChange={(event) => updateField('postalCode', event.target.value)}
                  />
                </Field>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <Field>
                  <Label>Ville</Label>
                  <Input
                    value={profile.city}
                    onChange={(event) => updateField('city', event.target.value)}
                  />
                </Field>
                <Field>
                  <Label>Mutuelle</Label>
                  <Input
                    value={profile.mutualInsurance}
                    onChange={(event) => updateField('mutualInsurance', event.target.value)}
                  />
                </Field>
              </div>

              <Field>
                <Label>Allergies connues</Label>
                <Textarea
                  rows={3}
                  value={profile.allergies}
                  onChange={(event) => updateField('allergies', event.target.value)}
                  placeholder="Ex: pénicilline, arachides, pollen"
                />
              </Field>

              <Field>
                <Label>Antécédents / maladies chroniques</Label>
                <Textarea
                  rows={3}
                  value={profile.chronicConditions}
                  onChange={(event) => updateField('chronicConditions', event.target.value)}
                  placeholder="Ex: asthme, diabète, hypertension"
                />
              </Field>

              <Field>
                <Label>Traitements actuels</Label>
                <Textarea
                  rows={3}
                  value={profile.currentMedications}
                  onChange={(event) => updateField('currentMedications', event.target.value)}
                />
              </Field>

              <div className="grid gap-4 md:grid-cols-2">
                <Field>
                  <Label>Contact d'urgence</Label>
                  <Input
                    value={profile.emergencyContactName}
                    onChange={(event) => updateField('emergencyContactName', event.target.value)}
                    placeholder="Nom et prénom"
                  />
                </Field>
                <Field>
                  <Label>Téléphone d'urgence</Label>
                  <Input
                    value={profile.emergencyContactPhone}
                    onChange={(event) => updateField('emergencyContactPhone', event.target.value)}
                    placeholder="06 ..."
                  />
                </Field>
              </div>

              <Field>
                <Label>Informations utiles pour le médecin</Label>
                <Textarea
                  rows={4}
                  value={profile.notesForDoctor}
                  onChange={(event) => updateField('notesForDoctor', event.target.value)}
                  placeholder="Contexte, inquiétudes, questions à poser pendant la visite"
                />
              </Field>

              <div className="flex flex-wrap gap-3">
                <Button onClick={saveProfile}>
                  <Save className="w-4 h-4 mr-2" />
                  Enregistrer mon profil
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/symptomes">
                    Compléter mes symptômes
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </Button>
              </div>
            </FieldGroup>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <ShieldCheck className="w-5 h-5 text-primary" />
                Résumé pour la visite
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <p className="text-muted-foreground">Patient</p>
                <p className="font-medium">{profile.firstName} {profile.lastName}</p>
              </div>

              <div className="flex items-center gap-2 text-muted-foreground">
                <Phone className="w-4 h-4" />
                <span>{profile.phone || 'Non renseigné'}</span>
              </div>

              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="w-4 h-4" />
                <span>
                  {profile.birthDate
                    ? `${format(new Date(profile.birthDate), 'd MMMM yyyy', { locale: fr })}${age !== null ? ` (${age} ans)` : ''}`
                    : 'Date de naissance non renseignée'}
                </span>
              </div>

              <div className="pt-2 border-t space-y-2">
                <p className="text-muted-foreground">Points médicaux importants</p>
                <div className="flex flex-wrap gap-2">
                  {profile.allergies.trim() ? <Badge variant="destructive">Allergies signalées</Badge> : null}
                  {profile.chronicConditions.trim() ? <Badge variant="secondary">Antécédents renseignés</Badge> : null}
                  {profile.currentMedications.trim() ? <Badge variant="secondary">Traitements en cours</Badge> : null}
                  {!profile.allergies.trim() &&
                  !profile.chronicConditions.trim() &&
                  !profile.currentMedications.trim() ? (
                    <Badge variant="outline">Aucune info médicale détaillée</Badge>
                  ) : null}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileHeart className="w-5 h-5 text-primary" />
                Dernier formulaire symptômes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {latestSymptom ? (
                <>
                  <p className="text-muted-foreground">
                    {format(new Date(latestSymptom.createdAt), "EEE d MMM yyyy 'à' HH:mm", { locale: fr })}
                  </p>
                  <p className="font-medium">{latestSymptom.mainSymptom}</p>
                  <p className="text-muted-foreground line-clamp-4">{latestSymptom.associatedSymptoms}</p>
                </>
              ) : (
                <p className="text-muted-foreground">
                  Aucun formulaire symptômes enregistré pour le moment.
                </p>
              )}

              <div className="pt-2">
                <Button variant="outline" className="w-full" asChild>
                  <Link href="/symptomes">Gérer mes symptômes</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

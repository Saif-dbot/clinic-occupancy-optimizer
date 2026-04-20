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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Field, FieldGroup } from '@/components/ui/field'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { ClipboardPen, Calendar, ArrowRight, Eraser } from 'lucide-react'
import { toast } from 'sonner'

type Intensity = 'faible' | 'moderee' | 'forte'

interface SymptomFormState {
  mainSymptom: string
  startedAt: string
  intensity: Intensity
  temperature: string
  associatedSymptoms: string
  currentTreatments: string
  knownAllergies: string
  additionalNotes: string
}

interface SymptomReport extends SymptomFormState {
  id: string
  createdAt: string
}

const defaultFormState: SymptomFormState = {
  mainSymptom: '',
  startedAt: '',
  intensity: 'moderee',
  temperature: '',
  associatedSymptoms: '',
  currentTreatments: '',
  knownAllergies: '',
  additionalNotes: '',
}

export default function SymptomesPage() {
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

  const storageKey = useMemo(
    () => `symptom-reports-${currentPatient?.id ?? currentUser?.id ?? 'guest'}`,
    [currentPatient, currentUser],
  )

  const [form, setForm] = useState<SymptomFormState>(defaultFormState)
  const [reports, setReports] = useState<SymptomReport[]>([])

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey)
      if (!raw) {
        setReports([])
        return
      }

      const parsed = JSON.parse(raw) as SymptomReport[]
      if (!Array.isArray(parsed)) {
        setReports([])
        return
      }

      setReports(parsed)
    } catch {
      setReports([])
    }
  }, [storageKey])

  const updateField = <K extends keyof SymptomFormState>(key: K, value: SymptomFormState[K]) => {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  const saveReports = (nextReports: SymptomReport[]) => {
    setReports(nextReports)
    localStorage.setItem(storageKey, JSON.stringify(nextReports))
  }

  const handleSubmit = () => {
    if (!form.mainSymptom.trim()) {
      toast.error('Merci de renseigner le symptôme principal')
      return
    }

    if (!form.associatedSymptoms.trim()) {
      toast.error('Merci de décrire vos symptômes')
      return
    }

    const report: SymptomReport = {
      ...form,
      id: `sym-${Date.now()}`,
      createdAt: new Date().toISOString(),
    }

    const nextReports = [report, ...reports].slice(0, 20)
    saveReports(nextReports)
    setForm(defaultFormState)
    toast.success('Formulaire symptômes enregistré')
  }

  const handleReset = () => {
    setForm(defaultFormState)
  }

  const clearHistory = () => {
    saveReports([])
    toast.success('Historique supprimé')
  }

  if (currentRole !== 'client') {
    return (
      <div className="p-6">
        <Card>
          <CardHeader>
            <CardTitle>Page client</CardTitle>
            <CardDescription>
              Cette page est réservée au parcours client pour préparer la visite.
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
        <h1 className="text-2xl font-bold">Formulaire des symptômes</h1>
        <p className="text-muted-foreground">
          Remplissez ce formulaire avant votre rendez-vous pour aider le médecin.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[2fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardPen className="w-5 h-5 text-primary" />
              Nouveau formulaire
            </CardTitle>
          </CardHeader>

          <CardContent>
            <FieldGroup>
              <Field>
                <Label>Symptôme principal</Label>
                <Input
                  placeholder="Ex: mal de gorge, fièvre, toux"
                  value={form.mainSymptom}
                  onChange={(event) => updateField('mainSymptom', event.target.value)}
                />
              </Field>

              <div className="grid gap-4 md:grid-cols-3">
                <Field>
                  <Label>Début des symptômes</Label>
                  <Input
                    type="date"
                    value={form.startedAt}
                    onChange={(event) => updateField('startedAt', event.target.value)}
                  />
                </Field>

                <Field>
                  <Label>Intensité</Label>
                  <Select
                    value={form.intensity}
                    onValueChange={(value) => updateField('intensity', value as Intensity)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="faible">Faible</SelectItem>
                      <SelectItem value="moderee">Modérée</SelectItem>
                      <SelectItem value="forte">Forte</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>

                <Field>
                  <Label>Température (si fièvre)</Label>
                  <Input
                    placeholder="Ex: 38.5"
                    value={form.temperature}
                    onChange={(event) => updateField('temperature', event.target.value)}
                  />
                </Field>
              </div>

              <Field>
                <Label>Description des symptômes</Label>
                <Textarea
                  rows={5}
                  placeholder="Décrivez vos symptômes, leur évolution, ce qui aggrave ou soulage..."
                  value={form.associatedSymptoms}
                  onChange={(event) => updateField('associatedSymptoms', event.target.value)}
                />
              </Field>

              <Field>
                <Label>Traitements en cours</Label>
                <Textarea
                  rows={3}
                  placeholder="Ex: Paracétamol 1g, 2 fois/jour"
                  value={form.currentTreatments}
                  onChange={(event) => updateField('currentTreatments', event.target.value)}
                />
              </Field>

              <Field>
                <Label>Allergies connues</Label>
                <Textarea
                  rows={2}
                  placeholder="Ex: pénicilline, pollen"
                  value={form.knownAllergies}
                  onChange={(event) => updateField('knownAllergies', event.target.value)}
                />
              </Field>

              <Field>
                <Label>Notes complémentaires</Label>
                <Textarea
                  rows={3}
                  placeholder="Autres informations utiles pour le médecin"
                  value={form.additionalNotes}
                  onChange={(event) => updateField('additionalNotes', event.target.value)}
                />
              </Field>

              <div className="flex flex-wrap gap-3">
                <Button onClick={handleSubmit}>
                  Enregistrer le formulaire
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
                <Button variant="outline" onClick={handleReset}>
                  Réinitialiser
                  <Eraser className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </FieldGroup>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle>Historique récent</CardTitle>
              <CardDescription>Vos derniers formulaires enregistrés</CardDescription>
            </div>
            {reports.length > 0 ? (
              <Button variant="ghost" size="sm" onClick={clearHistory}>
                Vider
              </Button>
            ) : null}
          </CardHeader>

          <CardContent>
            {reports.length === 0 ? (
              <Empty className="border">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <Calendar className="size-6" />
                  </EmptyMedia>
                  <EmptyTitle>Aucun formulaire</EmptyTitle>
                  <EmptyDescription>
                    Vos prochains formulaires apparaîtront ici.
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            ) : (
              <div className="space-y-3">
                {reports.map(report => (
                  <div key={report.id} className="rounded-lg border p-3 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium line-clamp-1">{report.mainSymptom}</p>
                      <Badge variant="secondary">{report.intensity}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(report.createdAt), "EEE d MMM yyyy 'à' HH:mm", { locale: fr })}
                    </p>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {report.associatedSymptoms}
                    </p>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-4">
              <Button variant="outline" className="w-full" asChild>
                <Link href="/agenda">Retour aux rendez-vous</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

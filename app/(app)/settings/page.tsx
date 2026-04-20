'use client'

import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { fetchSettings, updateSettings } from '@/lib/mock-api'
import type { AppSettings, NoShowScoringRule } from '@/types'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Settings,
  Save,
  RotateCcw,
  SlidersHorizontal,
  Bell,
  AlertTriangle,
  Gauge,
} from 'lucide-react'

type ThresholdKey = keyof AppSettings['thresholds']

export default function SettingsPage() {
  const [settings, setSettings] = useState<AppSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadSettings = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await fetchSettings()
      setSettings(data)
    } catch {
      setError('Impossible de charger les paramètres')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadSettings()
  }, [])

  const activeRules = useMemo(() => {
    if (!settings) return []
    return settings.noShowScoringRules.filter((rule) => rule.isActive)
  }, [settings])

  const activeRulesWeight = useMemo(() => {
    return activeRules.reduce((sum, rule) => sum + rule.weight, 0)
  }, [activeRules])

  const updateRule = (ruleId: string, updater: (rule: NoShowScoringRule) => NoShowScoringRule) => {
    setSettings((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        noShowScoringRules: prev.noShowScoringRules.map((rule) =>
          rule.id === ruleId ? updater(rule) : rule
        ),
      }
    })
  }

  const updateThreshold = (key: ThresholdKey, value: number) => {
    setSettings((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        thresholds: {
          ...prev.thresholds,
          [key]: Number.isFinite(value) ? value : 0,
        },
      }
    })
  }

  const saveSettings = async () => {
    if (!settings) return

    setSaving(true)
    try {
      const updated = await updateSettings(settings)
      setSettings(updated)
      toast.success('Paramètres enregistrés')
    } catch {
      toast.error('Erreur lors de la sauvegarde')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-28" />
        <Skeleton className="h-[360px]" />
        <Skeleton className="h-[280px]" />
      </div>
    )
  }

  if (error || !settings) {
    return (
      <div className="p-6">
        <Card className="border-destructive/30 bg-destructive/5">
          <CardHeader>
            <CardTitle className="text-destructive">Chargement impossible</CardTitle>
            <CardDescription>{error || 'Aucune donnée de paramètres disponible'}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={loadSettings} variant="outline">
              <RotateCcw className="w-4 h-4 mr-2" />
              Réessayer
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Settings className="w-6 h-6 text-primary" />
            Paramètres de scoring no-show
          </h1>
          <p className="text-muted-foreground">
            Ajustez les règles de risque, rappels et seuils d&apos;alerte
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={loadSettings} disabled={saving}>
            <RotateCcw className="w-4 h-4 mr-2" />
            Recharger
          </Button>
          <Button onClick={saveSettings} disabled={saving}>
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Enregistrement...' : 'Enregistrer'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-primary" />
              Règles actives
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {activeRules.map((rule) => (
              <Badge key={rule.id} variant="secondary" className="font-normal">
                {rule.name}: {rule.weight}
              </Badge>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Gauge className="w-4 h-4 text-primary" />
              Résumé
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Règles actives</span>
              <span className="font-semibold">{activeRules.length}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Poids cumulé</span>
              <span className="font-semibold">{activeRulesWeight.toFixed(1)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Seuil no-show</span>
              <span className="font-semibold">{settings.thresholds.noShowRateWarning}%</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Règles de scoring</CardTitle>
          <CardDescription>
            Modifiez les poids et activez ou désactivez chaque facteur de risque
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Règle</TableHead>
                  <TableHead className="hidden md:table-cell">Description</TableHead>
                  <TableHead className="w-36">Poids</TableHead>
                  <TableHead className="w-28 text-right">Actif</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {settings.noShowScoringRules.map((rule) => (
                  <TableRow key={rule.id} className="animate-row">
                    <TableCell>
                      <div>
                        <p className="font-medium text-sm">{rule.name}</p>
                        <p className="text-xs text-muted-foreground">{rule.factor}</p>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground text-sm">
                      {rule.description}
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        inputMode="decimal"
                        step="0.1"
                        value={rule.weight}
                        onChange={(event) => {
                          const next = Number.parseFloat(event.target.value)
                          updateRule(rule.id, (current) => ({
                            ...current,
                            weight: Number.isFinite(next) ? next : 0,
                          }))
                        }}
                        className="h-8"
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="inline-flex items-center justify-end gap-2">
                        <Label htmlFor={`rule-${rule.id}`} className="sr-only">
                          Activer la règle {rule.name}
                        </Label>
                        <Switch
                          id={`rule-${rule.id}`}
                          checked={rule.isActive}
                          onCheckedChange={(checked) => {
                            updateRule(rule.id, (current) => ({
                              ...current,
                              isActive: checked,
                            }))
                          }}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Bell className="w-5 h-5 text-primary" />
              Politique de rappels
            </CardTitle>
            <CardDescription>
              Définissez les actions automatiques selon le niveau de risque
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5 text-sm">
            <div className="space-y-3 rounded-lg border p-4">
              <p className="font-medium">Risque faible (0-39)</p>
              <div className="flex items-center justify-between">
                <Label htmlFor="std-j2" className="text-muted-foreground">Rappel standard J-2</Label>
                <Switch
                  id="std-j2"
                  checked={settings.reminderSchedule.standard.daysBeforeJ2}
                  onCheckedChange={(checked) =>
                    setSettings((prev) =>
                      prev
                        ? {
                            ...prev,
                            reminderSchedule: {
                              ...prev.reminderSchedule,
                              standard: { daysBeforeJ2: checked },
                            },
                          }
                        : prev
                    )
                  }
                />
              </div>
            </div>

            <div className="space-y-3 rounded-lg border p-4">
              <p className="font-medium">Risque moyen (40-69)</p>
              <div className="flex items-center justify-between">
                <Label htmlFor="med-j2" className="text-muted-foreground">Rappel J-2</Label>
                <Switch
                  id="med-j2"
                  checked={settings.reminderSchedule.medium.daysBeforeJ2}
                  onCheckedChange={(checked) =>
                    setSettings((prev) =>
                      prev
                        ? {
                            ...prev,
                            reminderSchedule: {
                              ...prev.reminderSchedule,
                              medium: { ...prev.reminderSchedule.medium, daysBeforeJ2: checked },
                            },
                          }
                        : prev
                    )
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="med-j1" className="text-muted-foreground">Rappel J-1</Label>
                <Switch
                  id="med-j1"
                  checked={settings.reminderSchedule.medium.daysBeforeJ1}
                  onCheckedChange={(checked) =>
                    setSettings((prev) =>
                      prev
                        ? {
                            ...prev,
                            reminderSchedule: {
                              ...prev.reminderSchedule,
                              medium: { ...prev.reminderSchedule.medium, daysBeforeJ1: checked },
                            },
                          }
                        : prev
                    )
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="med-confirm" className="text-muted-foreground">Confirmation active</Label>
                <Switch
                  id="med-confirm"
                  checked={settings.reminderSchedule.medium.requireConfirmation}
                  onCheckedChange={(checked) =>
                    setSettings((prev) =>
                      prev
                        ? {
                            ...prev,
                            reminderSchedule: {
                              ...prev.reminderSchedule,
                              medium: {
                                ...prev.reminderSchedule.medium,
                                requireConfirmation: checked,
                              },
                            },
                          }
                        : prev
                    )
                  }
                />
              </div>
            </div>

            <div className="space-y-3 rounded-lg border p-4">
              <p className="font-medium">Risque élevé (70-100)</p>
              <div className="flex items-center justify-between">
                <Label htmlFor="high-call" className="text-muted-foreground">Appel prioritaire secrétaire</Label>
                <Switch
                  id="high-call"
                  checked={settings.reminderSchedule.high.priorityCall}
                  onCheckedChange={(checked) =>
                    setSettings((prev) =>
                      prev
                        ? {
                            ...prev,
                            reminderSchedule: {
                              ...prev.reminderSchedule,
                              high: { ...prev.reminderSchedule.high, priorityCall: checked },
                            },
                          }
                        : prev
                    )
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="high-backup" className="text-muted-foreground">Affecter un patient backup</Label>
                <Switch
                  id="high-backup"
                  checked={settings.reminderSchedule.high.assignBackup}
                  onCheckedChange={(checked) =>
                    setSettings((prev) =>
                      prev
                        ? {
                            ...prev,
                            reminderSchedule: {
                              ...prev.reminderSchedule,
                              high: { ...prev.reminderSchedule.high, assignBackup: checked },
                            },
                          }
                        : prev
                    )
                  }
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-warning" />
              Seuils d&apos;alerte KPI
            </CardTitle>
            <CardDescription>
              Déclenchement des alertes opérationnelles sur le dashboard
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="threshold-noshow">No-show rate ({'>'})</Label>
                <Input
                  id="threshold-noshow"
                  type="number"
                  value={settings.thresholds.noShowRateWarning}
                  onChange={(event) =>
                    updateThreshold('noShowRateWarning', Number.parseFloat(event.target.value))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="threshold-occupancy">Occupancy rate ({'<'})</Label>
                <Input
                  id="threshold-occupancy"
                  type="number"
                  value={settings.thresholds.occupancyRateWarning}
                  onChange={(event) =>
                    updateThreshold('occupancyRateWarning', Number.parseFloat(event.target.value))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="threshold-days">Jours consécutifs occupancy</Label>
                <Input
                  id="threshold-days"
                  type="number"
                  value={settings.thresholds.occupancyDaysThreshold}
                  onChange={(event) =>
                    updateThreshold('occupancyDaysThreshold', Number.parseFloat(event.target.value))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="threshold-reminder">Reminder delivery ({'<'})</Label>
                <Input
                  id="threshold-reminder"
                  type="number"
                  value={settings.thresholds.reminderDeliveryWarning}
                  onChange={(event) =>
                    updateThreshold('reminderDeliveryWarning', Number.parseFloat(event.target.value))
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="threshold-refill">Slot refill time ({'>'}, heures)</Label>
              <Input
                id="threshold-refill"
                type="number"
                value={settings.thresholds.slotRefillTimeWarning}
                onChange={(event) =>
                  updateThreshold('slotRefillTimeWarning', Number.parseFloat(event.target.value))
                }
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
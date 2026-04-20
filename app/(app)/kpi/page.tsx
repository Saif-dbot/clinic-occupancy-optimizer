'use client'

import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { KPICard } from '@/components/dashboard/kpi-card'
import { fetchKPIData, fetchKPIAlerts } from '@/lib/mock-api'
import type { KPIData, KPIAlert } from '@/types'
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Target,
  Clock,
  UserX,
  Activity,
  RefreshCw,
  Bell,
  CheckCircle,
  Calendar,
} from 'lucide-react'
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  Legend,
} from 'recharts'
import { cn } from '@/lib/utils'

interface KPITarget {
  key: keyof KPIData
  label: string
  target: number
  baseline: number
  unit: string
  inverted: boolean
  icon: React.ElementType
  description: string
}

const kpiTargets: KPITarget[] = [
  {
    key: 'noShowRate',
    label: 'Taux de no-show',
    target: 15,
    baseline: 25,
    unit: '%',
    inverted: true,
    icon: UserX,
    description: 'Pourcentage de patients qui ne se présentent pas à leur rendez-vous',
  },
  {
    key: 'occupancyRate',
    label: "Taux d'occupation",
    target: 85,
    baseline: 70,
    unit: '%',
    inverted: false,
    icon: Activity,
    description: 'Pourcentage de créneaux utilisés sur le total disponible',
  },
  {
    key: 'recoveredSlotsRate',
    label: 'Créneaux récupérés',
    target: 60,
    baseline: 40,
    unit: '%',
    inverted: false,
    icon: RefreshCw,
    description: 'Pourcentage de créneaux annulés qui ont été réattribués',
  },
  {
    key: 'bookingLeadTime',
    label: 'Délai de réservation',
    target: 5,
    baseline: 3,
    unit: 'jours',
    inverted: false,
    icon: Calendar,
    description: 'Temps moyen entre la prise de RDV et le RDV',
  },
  {
    key: 'reminderDeliveryRate',
    label: 'Livraison rappels',
    target: 98,
    baseline: 92,
    unit: '%',
    inverted: false,
    icon: Bell,
    description: 'Pourcentage de rappels envoyés avec succès',
  },
  {
    key: 'highRiskConfirmationRate',
    label: 'Confirmation haut risque',
    target: 75,
    baseline: 50,
    unit: '%',
    inverted: false,
    icon: CheckCircle,
    description: 'Pourcentage de patients à haut risque ayant confirmé',
  },
  {
    key: 'slotRefillTime',
    label: 'Temps réaffectation',
    target: 24,
    baseline: 48,
    unit: 'h',
    inverted: true,
    icon: Clock,
    description: 'Temps moyen pour réaffecter un créneau annulé',
  },
]

export default function KPIPage() {
  const [period, setPeriod] = useState<'daily' | 'weekly'>('daily')
  const [kpiData, setKPIData] = useState<KPIData[]>([])
  const [alerts, setAlerts] = useState<KPIAlert[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      try {
        const [data, alertsData] = await Promise.all([
          fetchKPIData(period),
          fetchKPIAlerts(),
        ])
        setKPIData(data)
        setAlerts(alertsData)
      } catch (error) {
        console.error('Error loading KPI data:', error)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [period])

  const latestData = kpiData[kpiData.length - 1]
  const previousData = kpiData[kpiData.length - 2]

  const getTrend = (current: number, previous: number) => {
    if (!previous) return 0
    return ((current - previous) / previous) * 100
  }

  const isKPIOnTarget = (target: KPITarget, value: number) => {
    if (target.inverted) {
      return value <= target.target
    }
    return value >= target.target
  }

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-12 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-36" />
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
            <BarChart3 className="w-6 h-6 text-primary" />
            Indicateurs de performance
          </h1>
          <p className="text-muted-foreground">
            Suivi des KPIs opérationnels et alertes
          </p>
        </div>
        <Tabs value={period} onValueChange={(v) => setPeriod(v as 'daily' | 'weekly')}>
          <TabsList>
            <TabsTrigger value="daily">Quotidien</TabsTrigger>
            <TabsTrigger value="weekly">Hebdomadaire</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className={cn(
                'flex items-center gap-3 p-3 rounded-lg border',
                alert.severity === 'critical'
                  ? 'bg-destructive/10 border-destructive/30'
                  : 'bg-warning/10 border-warning/30'
              )}
            >
              <AlertTriangle className={cn(
                'w-5 h-5 flex-shrink-0',
                alert.severity === 'critical' ? 'text-destructive' : 'text-warning'
              )} />
              <span className="text-sm font-medium flex-1">{alert.message}</span>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  Actuel: {alert.value.toFixed(1)}
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  Seuil: {alert.threshold}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* KPI Cards */}
      {latestData && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {kpiTargets.slice(0, 4).map((target) => {
            const value = latestData[target.key] as number
            const prevValue = previousData?.[target.key] as number
            const trend = getTrend(value, prevValue)
            const onTarget = isKPIOnTarget(target, value)
            const Icon = target.icon

            return (
              <KPICard
                key={target.key}
                title={target.label}
                value={value}
                unit={target.unit}
                target={target.target}
                baseline={target.baseline}
                trend={trend}
                trendLabel={period === 'daily' ? 'vs hier' : 'vs sem. préc.'}
                icon={<Icon className="w-4 h-4" />}
                alert={!onTarget && (target.key === 'noShowRate' || target.key === 'slotRefillTime')}
                alertMessage={!onTarget ? `${target.inverted ? 'Supérieur' : 'Inférieur'} à l'objectif de ${target.target}${target.unit}` : undefined}
                inverted={target.inverted}
              />
            )
          })}
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* No-show and Occupancy trend */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">No-show vs Occupation</CardTitle>
            <CardDescription>Évolution sur la période sélectionnée</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={kpiData}>
                  <defs>
                    <linearGradient id="noShowGradient2" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-chart-4)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="var(--color-chart-4)" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="occupancyGradient2" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-chart-1)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="var(--color-chart-1)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" opacity={0.5} />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(value) => format(new Date(value), period === 'daily' ? 'd MMM' : "'S'w", { locale: fr })}
                    stroke="var(--color-muted-foreground)"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="var(--color-muted-foreground)"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `${value}%`}
                  />
                  <RechartsTooltip
                    contentStyle={{
                      backgroundColor: 'var(--color-popover)',
                      border: '1px solid var(--color-border)',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                    labelFormatter={(value) => format(new Date(value), 'd MMMM', { locale: fr })}
                  />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="noShowRate"
                    name="No-show"
                    stroke="var(--color-chart-4)"
                    fill="url(#noShowGradient2)"
                    strokeWidth={2}
                  />
                  <Area
                    type="monotone"
                    dataKey="occupancyRate"
                    name="Occupation"
                    stroke="var(--color-chart-1)"
                    fill="url(#occupancyGradient2)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Recovered slots and refill time */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Récupération de créneaux</CardTitle>
            <CardDescription>Taux de récupération et temps de réaffectation</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={kpiData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" opacity={0.5} />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(value) => format(new Date(value), period === 'daily' ? 'd' : "'S'w", { locale: fr })}
                    stroke="var(--color-muted-foreground)"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    yAxisId="left"
                    stroke="var(--color-muted-foreground)"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `${value}%`}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    stroke="var(--color-muted-foreground)"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `${value}h`}
                  />
                  <RechartsTooltip
                    contentStyle={{
                      backgroundColor: 'var(--color-popover)',
                      border: '1px solid var(--color-border)',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                    labelFormatter={(value) => format(new Date(value), 'd MMMM', { locale: fr })}
                  />
                  <Legend />
                  <Bar
                    yAxisId="left"
                    dataKey="recoveredSlotsRate"
                    name="Récupération %"
                    fill="var(--color-chart-1)"
                    radius={[4, 4, 0, 0]}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="slotRefillTime"
                    name="Temps réaffect. (h)"
                    stroke="var(--color-chart-3)"
                    strokeWidth={2}
                    dot={{ fill: 'var(--color-chart-3)', r: 3 }}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Reminder effectiveness */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Efficacité des rappels</CardTitle>
            <CardDescription>Taux de livraison et confirmation haut risque</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={kpiData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" opacity={0.5} />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(value) => format(new Date(value), period === 'daily' ? 'd MMM' : "'S'w", { locale: fr })}
                    stroke="var(--color-muted-foreground)"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="var(--color-muted-foreground)"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `${value}%`}
                    domain={[0, 100]}
                  />
                  <RechartsTooltip
                    contentStyle={{
                      backgroundColor: 'var(--color-popover)',
                      border: '1px solid var(--color-border)',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                    labelFormatter={(value) => format(new Date(value), 'd MMMM', { locale: fr })}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="reminderDeliveryRate"
                    name="Livraison rappels"
                    stroke="var(--color-chart-2)"
                    strokeWidth={2}
                    dot={{ fill: 'var(--color-chart-2)', r: 3 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="highRiskConfirmationRate"
                    name="Confirm. haut risque"
                    stroke="var(--color-chart-5)"
                    strokeWidth={2}
                    dot={{ fill: 'var(--color-chart-5)', r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* KPI Summary table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Synthèse des objectifs</CardTitle>
            <CardDescription>Performance actuelle vs objectifs</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {kpiTargets.map((target) => {
                const value = latestData?.[target.key] as number
                const onTarget = value !== undefined && isKPIOnTarget(target, value)
                const Icon = target.icon
                const progress = target.inverted
                  ? Math.max(0, 100 - ((value - target.target) / (target.baseline - target.target)) * 100)
                  : Math.min(100, (value / target.target) * 100)

                return (
                  <div key={target.key} className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30">
                    <div className={cn(
                      'w-10 h-10 rounded-lg flex items-center justify-center',
                      onTarget ? 'bg-success/20' : 'bg-destructive/20'
                    )}>
                      <Icon className={cn(
                        'w-5 h-5',
                        onTarget ? 'text-success' : 'text-destructive'
                      )} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-medium truncate">{target.label}</p>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-mono">
                            {value?.toFixed(1)}{target.unit}
                          </span>
                          <Badge variant={onTarget ? 'default' : 'destructive'} className="text-[10px]">
                            {onTarget ? 'OK' : target.inverted ? '>' : '<'} {target.target}{target.unit}
                          </Badge>
                        </div>
                      </div>
                      <div className="w-full h-1.5 bg-secondary rounded-full overflow-hidden">
                        <div
                          className={cn(
                            'h-full transition-all',
                            onTarget ? 'bg-success' : 'bg-destructive'
                          )}
                          style={{ width: `${Math.min(100, progress)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

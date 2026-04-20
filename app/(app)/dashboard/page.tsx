'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { KPICard } from '@/components/dashboard/kpi-card'
import { RiskBadge } from '@/components/dashboard/risk-badge'
import { useApp } from '@/contexts/app-context'
import {
  fetchAppointments,
  fetchKPIData,
  fetchKPIAlerts,
  fetchHighRiskAppointments,
  fetchWaitlist,
} from '@/lib/mock-api'
import { mockPatients, mockPractitioners, mockSites } from '@/lib/mock-data'
import type { Appointment, KPIData, KPIAlert, WaitlistEntry } from '@/types'
import {
  Users,
  CalendarCheck,
  AlertTriangle,
  Clock,
  TrendingUp,
  ArrowRight,
  Calendar,
  Activity,
  UserX,
  RefreshCw,
} from 'lucide-react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
} from 'recharts'

export default function DashboardPage() {
  const router = useRouter()
  const { currentRole, currentUser } = useApp()
  const [loading, setLoading] = useState(true)
  const [todayAppointments, setTodayAppointments] = useState<Appointment[]>([])
  const [kpiData, setKPIData] = useState<KPIData[]>([])
  const [alerts, setAlerts] = useState<KPIAlert[]>([])
  const [highRiskAppointments, setHighRiskAppointments] = useState<Appointment[]>([])
  const [waitlist, setWaitlist] = useState<WaitlistEntry[]>([])

  useEffect(() => {
    if (currentRole === 'client') {
      router.replace('/agenda')
      return
    }

    const loadData = async () => {
      try {
        const today = format(new Date(), 'yyyy-MM-dd')
        const [appts, kpi, alertsData, highRisk, wl] = await Promise.all([
          fetchAppointments({ date: today }),
          fetchKPIData('daily'),
          fetchKPIAlerts(),
          fetchHighRiskAppointments(),
          fetchWaitlist(),
        ])
        setTodayAppointments(appts)
        setKPIData(kpi)
        setAlerts(alertsData)
        setHighRiskAppointments(highRisk.slice(0, 5))
        setWaitlist(wl.filter(w => w.status === 'pending' || w.status === 'offered'))
      } catch (error) {
        console.error('Error loading dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [currentRole, router])

  if (currentRole === 'client') {
    return (
      <div className="p-6">
        <Skeleton className="h-10 w-full" />
      </div>
    )
  }

  const getPatientName = (patientId: string) => {
    const patient = mockPatients.find(p => p.id === patientId)
    return patient ? `${patient.firstName} ${patient.lastName}` : 'Patient inconnu'
  }

  const getPractitionerName = (practitionerId: string) => {
    const practitioner = mockPractitioners.find(p => p.id === practitionerId)
    return practitioner?.name || 'Praticien inconnu'
  }

  const getSiteName = (siteId: string) => {
    const site = mockSites.find(s => s.id === siteId)
    return site?.name || 'Site inconnu'
  }

  const latestKPI = kpiData[kpiData.length - 1]
  const previousKPI = kpiData[kpiData.length - 2]

  const getTrend = (current: number, previous: number) => {
    if (!previous) return 0
    return ((current - previous) / previous) * 100
  }

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-36" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-80 lg:col-span-2" />
          <Skeleton className="h-80" />
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">
            Bonjour, {currentUser?.name?.split(' ')[0] || 'Utilisateur'}
          </h1>
          <p className="text-muted-foreground">
            {format(new Date(), "EEEE d MMMM yyyy", { locale: fr })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/agenda">
              <Calendar className="w-4 h-4 mr-2" />
              Voir les rendez-vous
            </Link>
          </Button>
        </div>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className={`flex items-center gap-3 p-3 rounded-lg border ${
                alert.severity === 'critical'
                  ? 'bg-destructive/10 border-destructive/30 text-destructive'
                  : 'bg-warning/10 border-warning/30 text-warning-foreground'
              }`}
            >
              <AlertTriangle className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm font-medium flex-1">{alert.message}</span>
              <Badge variant="outline" className="text-xs">
                {alert.value.toFixed(1)} (seuil: {alert.threshold})
              </Badge>
            </div>
          ))}
        </div>
      )}

      {/* KPI Cards */}
      {currentRole === 'admin' && latestKPI && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard
            title="Taux de no-show"
            value={latestKPI.noShowRate}
            unit="%"
            target={15}
            trend={previousKPI ? getTrend(latestKPI.noShowRate, previousKPI.noShowRate) : undefined}
            trendLabel="vs hier"
            icon={<UserX className="w-4 h-4" />}
            alert={latestKPI.noShowRate > 20}
            alertMessage="Taux supérieur au seuil de 20%"
            inverted
          />
          <KPICard
            title="Taux d'occupation"
            value={latestKPI.occupancyRate}
            unit="%"
            target={85}
            trend={previousKPI ? getTrend(latestKPI.occupancyRate, previousKPI.occupancyRate) : undefined}
            trendLabel="vs hier"
            icon={<Activity className="w-4 h-4" />}
            alert={latestKPI.occupancyRate < 70}
          />
          <KPICard
            title="Créneaux récupérés"
            value={latestKPI.recoveredSlotsRate}
            unit="%"
            target={60}
            trend={previousKPI ? getTrend(latestKPI.recoveredSlotsRate, previousKPI.recoveredSlotsRate) : undefined}
            trendLabel="vs hier"
            icon={<RefreshCw className="w-4 h-4" />}
          />
          <KPICard
            title="Temps réaffectation"
            value={latestKPI.slotRefillTime}
            unit="h"
            target={24}
            trend={previousKPI ? getTrend(latestKPI.slotRefillTime, previousKPI.slotRefillTime) : undefined}
            trendLabel="vs hier"
            icon={<Clock className="w-4 h-4" />}
            alert={latestKPI.slotRefillTime > 24}
            alertMessage="Temps supérieur à 24h"
            inverted
          />
        </div>
      )}

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart */}
        {currentRole === 'admin' && (
          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg">Évolution du no-show</CardTitle>
                <CardDescription>14 derniers jours</CardDescription>
              </div>
              <TrendingUp className="w-5 h-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={kpiData}>
                    <defs>
                      <linearGradient id="noShowGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--color-chart-4)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="var(--color-chart-4)" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="occupancyGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--color-chart-1)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="var(--color-chart-1)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" opacity={0.5} />
                    <XAxis
                      dataKey="date"
                      tickFormatter={(value) => format(new Date(value), 'd MMM', { locale: fr })}
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
                      formatter={(value: number, name: string) => [
                        `${value.toFixed(1)}%`,
                        name === 'noShowRate' ? 'No-show' : 'Occupation',
                      ]}
                    />
                    <Area
                      type="monotone"
                      dataKey="noShowRate"
                      stroke="var(--color-chart-4)"
                      fill="url(#noShowGradient)"
                      strokeWidth={2}
                    />
                    <Area
                      type="monotone"
                      dataKey="occupancyRate"
                      stroke="var(--color-chart-1)"
                      fill="url(#occupancyGradient)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Today's appointments */}
        <Card className={currentRole === 'admin' ? '' : 'lg:col-span-2'}>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">Rendez-vous du jour</CardTitle>
              <CardDescription>{todayAppointments.length} rendez-vous prévus</CardDescription>
            </div>
            <CalendarCheck className="w-5 h-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {todayAppointments.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Aucun rendez-vous aujourd&apos;hui</p>
              </div>
            ) : (
              <div className="space-y-3">
                {todayAppointments.slice(0, 5).map((appt, idx) => (
                  <div
                    key={appt.id}
                    className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50 animate-row"
                    style={{ animationDelay: `${idx * 0.05}s` }}
                  >
                    <div className="text-center min-w-[50px]">
                      <div className="text-sm font-semibold">{appt.startTime}</div>
                      <div className="text-[10px] text-muted-foreground">{appt.endTime}</div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">
                        {getPatientName(appt.patientId)}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {getPractitionerName(appt.practitionerId)}
                      </p>
                    </div>
                    <RiskBadge score={appt.noShowScore} size="sm" showLabel={false} />
                  </div>
                ))}
                {todayAppointments.length > 5 && (
                  <Button variant="ghost" size="sm" className="w-full" asChild>
                    <Link href="/appointments">
                      Voir tous les rendez-vous
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Link>
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* High risk appointments */}
        {(currentRole === 'admin' || currentRole === 'secretaire') && (
          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg">Rendez-vous à risque</CardTitle>
                <CardDescription>Score no-show {'>'} 40</CardDescription>
              </div>
              <AlertTriangle className="w-5 h-5 text-warning" />
            </CardHeader>
            <CardContent>
              {highRiskAppointments.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Aucun rendez-vous à risque élevé</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {highRiskAppointments.map((appt, idx) => (
                    <div
                      key={appt.id}
                      className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50 animate-row"
                      style={{ animationDelay: `${idx * 0.05}s` }}
                    >
                      <RiskBadge
                        score={appt.noShowScore}
                        size="md"
                        showLabel={false}
                        factors={appt.noShowFactors}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">
                          {getPatientName(appt.patientId)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(appt.date), 'd MMM', { locale: fr })} à {appt.startTime}
                          {' · '}
                          {getPractitionerName(appt.practitionerId)}
                        </p>
                      </div>
                      <Badge
                        variant={
                          appt.noShowScore >= 70
                            ? 'destructive'
                            : appt.noShowScore >= 40
                            ? 'secondary'
                            : 'outline'
                        }
                        className="text-[10px]"
                      >
                        {appt.noShowScore >= 70
                          ? 'Appel prioritaire'
                          : appt.noShowScore >= 40
                          ? 'Double rappel'
                          : 'Rappel J-2'}
                      </Badge>
                    </div>
                  ))}
                  <Button variant="ghost" size="sm" className="w-full" asChild>
                    <Link href="/risk-center">
                      Voir le centre de risque
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Waitlist */}
        {(currentRole === 'admin' || currentRole === 'secretaire') && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg">Liste d&apos;attente</CardTitle>
                <CardDescription>{waitlist.length} patients en attente</CardDescription>
              </div>
              <Clock className="w-5 h-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {waitlist.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Liste d&apos;attente vide</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {waitlist.slice(0, 4).map((entry, idx) => (
                    <div
                      key={entry.id}
                      className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50 animate-row"
                      style={{ animationDelay: `${idx * 0.05}s` }}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">
                          {getPatientName(entry.patientId)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {getSiteName(entry.siteId)}
                        </p>
                      </div>
                      <Badge
                        variant={entry.status === 'offered' ? 'default' : 'secondary'}
                        className="text-[10px]"
                      >
                        {entry.status === 'offered' ? 'Proposition envoyée' : 'En attente'}
                      </Badge>
                    </div>
                  ))}
                  <Button variant="ghost" size="sm" className="w-full" asChild>
                    <Link href="/waitlist">
                      Gérer la liste d&apos;attente
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

'use client'

import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingUp, TrendingDown, Minus, AlertTriangle } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

interface KPICardProps {
  title: string
  value: string | number
  unit?: string
  baseline?: number
  target?: number
  trend?: number
  trendLabel?: string
  icon?: React.ReactNode
  alert?: boolean
  alertMessage?: string
  className?: string
  inverted?: boolean // For metrics where lower is better
}

export function KPICard({
  title,
  value,
  unit = '%',
  baseline,
  target,
  trend,
  trendLabel,
  icon,
  alert,
  alertMessage,
  className,
  inverted = false,
}: KPICardProps) {
  const numValue = typeof value === 'string' ? parseFloat(value) : value
  
  const getTrendColor = () => {
    if (trend === undefined || trend === 0) return 'text-muted-foreground'
    const isPositive = inverted ? trend < 0 : trend > 0
    return isPositive ? 'text-success' : 'text-destructive'
  }

  const getTrendIcon = () => {
    if (trend === undefined || trend === 0) return <Minus className="w-3 h-3" />
    return trend > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />
  }

  const getTargetStatus = () => {
    if (target === undefined) return null
    const diff = numValue - target
    const isOnTarget = inverted ? diff <= 0 : diff >= 0
    return isOnTarget ? 'on-target' : 'off-target'
  }

  const targetStatus = getTargetStatus()

  return (
    <Card className={cn(
      'relative overflow-hidden transition-all duration-300 hover:shadow-lg',
      alert && 'border-destructive/50 bg-destructive/5',
      className
    )}>
      {alert && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-destructive animate-pulse-slow" />
      )}
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className="flex items-center gap-2">
          {alert && alertMessage && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <AlertTriangle className="w-4 h-4 text-destructive" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-sm">{alertMessage}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          {icon && (
            <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center text-muted-foreground">
              {icon}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline gap-1">
          <span className={cn(
            'text-2xl font-bold',
            alert && 'text-destructive'
          )}>
            {typeof value === 'number' ? value.toFixed(1) : value}
          </span>
          {unit && <span className="text-sm text-muted-foreground">{unit}</span>}
        </div>

        <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/50">
          {trend !== undefined && (
            <div className={cn('flex items-center gap-1 text-xs', getTrendColor())}>
              {getTrendIcon()}
              <span>{Math.abs(trend).toFixed(1)}%</span>
              {trendLabel && <span className="text-muted-foreground ml-1">{trendLabel}</span>}
            </div>
          )}

          {targetStatus && (
            <div className={cn(
              'text-xs px-2 py-0.5 rounded-full',
              targetStatus === 'on-target' 
                ? 'bg-success/10 text-success' 
                : 'bg-destructive/10 text-destructive'
            )}>
              Cible: {target}{unit}
            </div>
          )}
        </div>

        {baseline !== undefined && (
          <div className="text-xs text-muted-foreground mt-2">
            Référence: {baseline}{unit}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

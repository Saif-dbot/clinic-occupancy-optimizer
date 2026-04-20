'use client'

import { cn } from '@/lib/utils'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import type { NoShowFactor } from '@/types'

interface RiskBadgeProps {
  score: number
  showLabel?: boolean
  size?: 'sm' | 'md' | 'lg'
  factors?: NoShowFactor[]
  className?: string
}

export function RiskBadge({ 
  score, 
  showLabel = true, 
  size = 'md',
  factors,
  className 
}: RiskBadgeProps) {
  const getRiskLevel = () => {
    if (score < 40) return { level: 'low', label: 'Faible', color: 'bg-success text-success-foreground' }
    if (score < 70) return { level: 'medium', label: 'Modéré', color: 'bg-warning text-warning-foreground' }
    return { level: 'high', label: 'Élevé', color: 'bg-destructive text-destructive-foreground' }
  }

  const risk = getRiskLevel()

  const sizeClasses = {
    sm: 'text-[10px] px-1.5 py-0.5 min-w-[40px]',
    md: 'text-xs px-2 py-1 min-w-[50px]',
    lg: 'text-sm px-3 py-1.5 min-w-[60px]',
  }

  const content = (
    <span className={cn(
      'inline-flex items-center justify-center font-semibold rounded-md tabular-nums',
      risk.color,
      sizeClasses[size],
      className
    )}>
      {score}
      {showLabel && <span className="ml-1 font-normal opacity-90">/ 100</span>}
    </span>
  )

  if (factors && factors.length > 0) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            {content}
          </TooltipTrigger>
          <TooltipContent side="right" className="max-w-xs">
            <div className="space-y-2">
              <p className="font-semibold text-sm">Facteurs de risque</p>
              <ul className="space-y-1">
                {factors.map((factor, idx) => (
                  <li key={idx} className="text-xs flex items-center justify-between gap-4">
                    <span className="text-muted-foreground">{factor.factor}</span>
                    <span className={cn(
                      'font-mono',
                      factor.impact > 0 ? 'text-destructive' : 'text-success'
                    )}>
                      {factor.impact > 0 ? '+' : ''}{factor.impact}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  return content
}

export function RiskIndicator({ score, className }: { score: number; className?: string }) {
  const getColor = () => {
    if (score < 40) return 'bg-success'
    if (score < 70) return 'bg-warning'
    return 'bg-destructive'
  }

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
        <div 
          className={cn('h-full transition-all duration-500', getColor())}
          style={{ width: `${score}%` }}
        />
      </div>
      <span className="text-xs font-mono w-8 text-right">{score}</span>
    </div>
  )
}

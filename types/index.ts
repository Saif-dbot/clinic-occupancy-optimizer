// User and Role types
export type UserRole = 'admin' | 'secretaire' | 'medecin' | 'client'

export interface User {
  id: string
  email: string
  name: string
  role: UserRole
  avatar?: string
}

// Site and Practitioner types
export interface Site {
  id: string
  name: string
  address: string
  city: string
}

export interface Specialty {
  id: string
  name: string
  color: string
}

export interface Practitioner {
  id: string
  name: string
  siteId: string
  specialtyId: string
  avatar?: string
}

// Patient types
export interface Patient {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string
  birthDate: string
  noShowHistory: number
  lastVisit?: string
}

// Appointment types
export type AppointmentStatus = 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no_show'

export interface Appointment {
  id: string
  patientId: string
  practitionerId: string
  siteId: string
  date: string
  startTime: string
  endTime: string
  status: AppointmentStatus
  noShowScore: number
  noShowFactors: NoShowFactor[]
  notes?: string
  remindersSent: Reminder[]
  createdAt: string
}

export interface NoShowFactor {
  factor: string
  impact: number
  description: string
}

export interface Reminder {
  type: 'sms' | 'email' | 'call'
  sentAt: string
  status: 'sent' | 'delivered' | 'failed'
}

// Time slot types
export interface TimeSlot {
  id: string
  practitionerId: string
  siteId: string
  date: string
  startTime: string
  endTime: string
  isAvailable: boolean
  appointmentId?: string
}

// Waitlist types
export interface WaitlistEntry {
  id: string
  patientId: string
  practitionerId?: string
  siteId: string
  specialtyId?: string
  preferredDates: string[]
  preferredTimes: string[]
  createdAt: string
  expiresAt?: string
  status: 'pending' | 'offered' | 'accepted' | 'expired' | 'declined'
  offeredSlotId?: string
}

// KPI types
export interface KPIData {
  date: string
  noShowRate: number
  occupancyRate: number
  recoveredSlotsRate: number
  bookingLeadTime: number
  reminderDeliveryRate: number
  highRiskConfirmationRate: number
  slotRefillTime: number
}

export interface KPIAlert {
  id: string
  type: 'no_show_rate' | 'occupancy_rate' | 'reminder_delivery' | 'slot_refill'
  severity: 'warning' | 'critical'
  message: string
  value: number
  threshold: number
  createdAt: string
}

// Audit log types
export type AuditAction = 
  | 'appointment_created'
  | 'appointment_cancelled'
  | 'appointment_confirmed'
  | 'appointment_completed'
  | 'appointment_no_show'
  | 'slot_reassigned'
  | 'waitlist_offer_sent'
  | 'waitlist_offer_accepted'
  | 'waitlist_offer_declined'
  | 'waitlist_offer_expired'
  | 'reminder_sent'
  | 'backup_candidate_assigned'
  | 'settings_updated'

export interface AuditLogEntry {
  id: string
  action: AuditAction
  userId: string
  entityType: 'appointment' | 'patient' | 'slot' | 'waitlist' | 'settings'
  entityId: string
  details: Record<string, unknown>
  timestamp: string
}

// Settings types
export interface NoShowScoringRule {
  id: string
  name: string
  factor: string
  weight: number
  description: string
  isActive: boolean
}

export interface AppSettings {
  noShowScoringRules: NoShowScoringRule[]
  reminderSchedule: {
    standard: { daysBeforeJ2: boolean }
    medium: { daysBeforeJ2: boolean; daysBeforeJ1: boolean; requireConfirmation: boolean }
    high: { priorityCall: boolean; assignBackup: boolean }
  }
  thresholds: {
    noShowRateWarning: number
    occupancyRateWarning: number
    occupancyDaysThreshold: number
    reminderDeliveryWarning: number
    slotRefillTimeWarning: number
  }
}

// API Response types
export interface ApiResponse<T> {
  data: T | null
  error: string | null
  loading: boolean
}

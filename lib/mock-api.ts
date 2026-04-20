import type {
  Appointment,
  TimeSlot,
  WaitlistEntry,
  KPIData,
  AuditLogEntry,
  AppSettings,
  Patient,
  Practitioner,
  Site,
  KPIAlert,
} from '@/types'
import {
  mockAppointments,
  mockTimeSlots,
  mockWaitlist,
  mockKPIData,
  mockAuditLog,
  mockSettings,
  mockPatients,
  mockPractitioners,
  mockSites,
  mockKPIAlerts,
} from './mock-data'

// Simulate network latency
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))
const randomLatency = () => delay(200 + Math.random() * 300)

// Simulate random errors (for testing error states)
const shouldFail = (rate: number = 0) => Math.random() < rate

// Appointments
let appointments = [...mockAppointments]
let timeSlots = [...mockTimeSlots]
let waitlist = [...mockWaitlist]
let auditLog = [...mockAuditLog]

export async function fetchAppointments(filters?: {
  date?: string
  siteId?: string
  practitionerId?: string
  status?: string
}): Promise<Appointment[]> {
  await randomLatency()
  if (shouldFail()) throw new Error('Erreur de chargement des rendez-vous')
  
  let result = [...appointments]
  
  if (filters?.date) {
    result = result.filter(a => a.date === filters.date)
  }
  if (filters?.siteId) {
    result = result.filter(a => a.siteId === filters.siteId)
  }
  if (filters?.practitionerId) {
    result = result.filter(a => a.practitionerId === filters.practitionerId)
  }
  if (filters?.status) {
    result = result.filter(a => a.status === filters.status)
  }
  
  return result
}

export async function fetchAppointment(id: string): Promise<Appointment | null> {
  await randomLatency()
  return appointments.find(a => a.id === id) || null
}

export async function createAppointment(data: Omit<Appointment, 'id' | 'createdAt' | 'noShowScore' | 'noShowFactors' | 'remindersSent'>): Promise<Appointment> {
  await randomLatency()
  if (shouldFail()) throw new Error('Erreur lors de la création du rendez-vous')
  
  // Check for double booking
  const existingSlot = appointments.find(
    a => a.practitionerId === data.practitionerId &&
         a.date === data.date &&
         a.startTime === data.startTime &&
         a.status !== 'cancelled'
  )
  
  if (existingSlot) {
    throw new Error('Ce créneau est déjà réservé')
  }
  
  const patient = mockPatients.find(p => p.id === data.patientId)
  const noShowScore = calculateNoShowScore(patient)
  
  const newAppointment: Appointment = {
    ...data,
    id: `a${Date.now()}`,
    createdAt: new Date().toISOString(),
    noShowScore,
    noShowFactors: generateNoShowFactors(patient, data),
    remindersSent: [],
  }
  
  appointments = [...appointments, newAppointment]
  
  // Update time slot
  const slotIdx = timeSlots.findIndex(
    s => s.practitionerId === data.practitionerId &&
         s.date === data.date &&
         s.startTime === data.startTime
  )
  if (slotIdx >= 0) {
    timeSlots[slotIdx] = { ...timeSlots[slotIdx], isAvailable: false, appointmentId: newAppointment.id }
  }
  
  // Add audit log
  addAuditLog('appointment_created', 'appointment', newAppointment.id, {
    patientName: patient ? `${patient.firstName} ${patient.lastName}` : 'Unknown',
    date: data.date,
    time: data.startTime,
  })
  
  return newAppointment
}

export async function cancelAppointment(id: string, reason?: string): Promise<Appointment> {
  await randomLatency()
  if (shouldFail()) throw new Error('Erreur lors de l\'annulation')
  
  const idx = appointments.findIndex(a => a.id === id)
  if (idx < 0) throw new Error('Rendez-vous non trouvé')
  
  const updated = { ...appointments[idx], status: 'cancelled' as const }
  appointments[idx] = updated
  
  // Free up the time slot
  const slotIdx = timeSlots.findIndex(s => s.appointmentId === id)
  if (slotIdx >= 0) {
    timeSlots[slotIdx] = { ...timeSlots[slotIdx], isAvailable: true, appointmentId: undefined }
  }
  
  const patient = mockPatients.find(p => p.id === updated.patientId)
  addAuditLog('appointment_cancelled', 'appointment', id, {
    patientName: patient ? `${patient.firstName} ${patient.lastName}` : 'Unknown',
    reason: reason || 'Non spécifié',
  })
  
  return updated
}

export async function confirmAppointment(id: string): Promise<Appointment> {
  await randomLatency()
  
  const idx = appointments.findIndex(a => a.id === id)
  if (idx < 0) throw new Error('Rendez-vous non trouvé')
  
  const updated = { ...appointments[idx], status: 'confirmed' as const }
  appointments[idx] = updated
  
  const patient = mockPatients.find(p => p.id === updated.patientId)
  addAuditLog('appointment_confirmed', 'appointment', id, {
    patientName: patient ? `${patient.firstName} ${patient.lastName}` : 'Unknown',
    method: 'Manual',
  })
  
  return updated
}

export async function markNoShow(id: string): Promise<Appointment> {
  await randomLatency()
  
  const idx = appointments.findIndex(a => a.id === id)
  if (idx < 0) throw new Error('Rendez-vous non trouvé')
  
  const updated = { ...appointments[idx], status: 'no_show' as const }
  appointments[idx] = updated
  
  const patient = mockPatients.find(p => p.id === updated.patientId)
  addAuditLog('appointment_no_show', 'appointment', id, {
    patientName: patient ? `${patient.firstName} ${patient.lastName}` : 'Unknown',
  })
  
  return updated
}

// Time slots
export async function fetchTimeSlots(filters?: {
  date?: string
  siteId?: string
  practitionerId?: string
  availableOnly?: boolean
}): Promise<TimeSlot[]> {
  await randomLatency()
  
  let result = [...timeSlots]
  
  if (filters?.date) {
    result = result.filter(s => s.date === filters.date)
  }
  if (filters?.siteId) {
    result = result.filter(s => s.siteId === filters.siteId)
  }
  if (filters?.practitionerId) {
    result = result.filter(s => s.practitionerId === filters.practitionerId)
  }
  if (filters?.availableOnly) {
    result = result.filter(s => s.isAvailable)
  }
  
  return result
}

// Waitlist
export async function fetchWaitlist(): Promise<WaitlistEntry[]> {
  await randomLatency()
  return [...waitlist]
}

export async function offerSlotToWaitlist(waitlistId: string, slotId: string): Promise<WaitlistEntry> {
  await randomLatency()
  
  const idx = waitlist.findIndex(w => w.id === waitlistId)
  if (idx < 0) throw new Error('Entrée liste d\'attente non trouvée')
  
  const updated: WaitlistEntry = {
    ...waitlist[idx],
    status: 'offered',
    offeredSlotId: slotId,
    expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
  }
  waitlist[idx] = updated
  
  const patient = mockPatients.find(p => p.id === updated.patientId)
  const slot = timeSlots.find(s => s.id === slotId)
  addAuditLog('waitlist_offer_sent', 'waitlist', waitlistId, {
    patientName: patient ? `${patient.firstName} ${patient.lastName}` : 'Unknown',
    slotDate: slot?.date,
    slotTime: slot?.startTime,
  })
  
  return updated
}

export async function acceptWaitlistOffer(waitlistId: string): Promise<{ waitlistEntry: WaitlistEntry; appointment: Appointment }> {
  await randomLatency()
  
  const wlIdx = waitlist.findIndex(w => w.id === waitlistId)
  if (wlIdx < 0) throw new Error('Entrée liste d\'attente non trouvée')
  
  const wlEntry = waitlist[wlIdx]
  if (!wlEntry.offeredSlotId) throw new Error('Aucun créneau proposé')
  
  const slot = timeSlots.find(s => s.id === wlEntry.offeredSlotId)
  if (!slot || !slot.isAvailable) throw new Error('Créneau non disponible')
  
  // Create appointment
  const appointment = await createAppointment({
    patientId: wlEntry.patientId,
    practitionerId: slot.practitionerId,
    siteId: slot.siteId,
    date: slot.date,
    startTime: slot.startTime,
    endTime: slot.endTime,
    status: 'confirmed',
    notes: 'Réaffectation depuis liste d\'attente',
  })
  
  // Update waitlist entry
  const updatedWl: WaitlistEntry = {
    ...wlEntry,
    status: 'accepted',
  }
  waitlist[wlIdx] = updatedWl
  
  const patient = mockPatients.find(p => p.id === wlEntry.patientId)
  addAuditLog('waitlist_offer_accepted', 'waitlist', waitlistId, {
    patientName: patient ? `${patient.firstName} ${patient.lastName}` : 'Unknown',
    appointmentId: appointment.id,
  })
  
  return { waitlistEntry: updatedWl, appointment }
}

export async function declineWaitlistOffer(waitlistId: string): Promise<WaitlistEntry> {
  await randomLatency()
  
  const idx = waitlist.findIndex(w => w.id === waitlistId)
  if (idx < 0) throw new Error('Entrée liste d\'attente non trouvée')
  
  const updated: WaitlistEntry = {
    ...waitlist[idx],
    status: 'declined',
    offeredSlotId: undefined,
    expiresAt: undefined,
  }
  waitlist[idx] = updated
  
  const patient = mockPatients.find(p => p.id === updated.patientId)
  addAuditLog('waitlist_offer_declined', 'waitlist', waitlistId, {
    patientName: patient ? `${patient.firstName} ${patient.lastName}` : 'Unknown',
  })
  
  return updated
}

// KPIs
export async function fetchKPIData(period: 'daily' | 'weekly' = 'daily'): Promise<KPIData[]> {
  await randomLatency()
  
  if (period === 'weekly') {
    // Aggregate to weekly
    const weekly: KPIData[] = []
    for (let i = 0; i < mockKPIData.length; i += 7) {
      const week = mockKPIData.slice(i, i + 7)
      if (week.length === 0) continue
      
      weekly.push({
        date: week[0].date,
        noShowRate: week.reduce((sum, d) => sum + d.noShowRate, 0) / week.length,
        occupancyRate: week.reduce((sum, d) => sum + d.occupancyRate, 0) / week.length,
        recoveredSlotsRate: week.reduce((sum, d) => sum + d.recoveredSlotsRate, 0) / week.length,
        bookingLeadTime: week.reduce((sum, d) => sum + d.bookingLeadTime, 0) / week.length,
        reminderDeliveryRate: week.reduce((sum, d) => sum + d.reminderDeliveryRate, 0) / week.length,
        highRiskConfirmationRate: week.reduce((sum, d) => sum + d.highRiskConfirmationRate, 0) / week.length,
        slotRefillTime: week.reduce((sum, d) => sum + d.slotRefillTime, 0) / week.length,
      })
    }
    return weekly
  }
  
  return [...mockKPIData]
}

export async function fetchKPIAlerts(): Promise<KPIAlert[]> {
  await randomLatency()
  return [...mockKPIAlerts]
}

// Audit log
export async function fetchAuditLog(limit?: number): Promise<AuditLogEntry[]> {
  await randomLatency()
  const sorted = [...auditLog].sort((a, b) => 
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  )
  return limit ? sorted.slice(0, limit) : sorted
}

function addAuditLog(
  action: AuditLogEntry['action'],
  entityType: AuditLogEntry['entityType'],
  entityId: string,
  details: Record<string, unknown>
) {
  const entry: AuditLogEntry = {
    id: `log${Date.now()}`,
    action,
    userId: 'u1', // Current user
    entityType,
    entityId,
    details,
    timestamp: new Date().toISOString(),
  }
  auditLog = [entry, ...auditLog]
}

// Settings
export async function fetchSettings(): Promise<AppSettings> {
  await randomLatency()
  return { ...mockSettings }
}

export async function updateSettings(updates: Partial<AppSettings>): Promise<AppSettings> {
  await randomLatency()
  
  const updated = { ...mockSettings, ...updates }
  
  addAuditLog('settings_updated', 'settings', 'global', {
    updates: Object.keys(updates),
  })
  
  return updated
}

// Patients
export async function fetchPatients(): Promise<Patient[]> {
  await randomLatency()
  return [...mockPatients]
}

export async function fetchPatient(id: string): Promise<Patient | null> {
  await randomLatency()
  return mockPatients.find(p => p.id === id) || null
}

// Practitioners
export async function fetchPractitioners(siteId?: string): Promise<Practitioner[]> {
  await randomLatency()
  if (siteId) {
    return mockPractitioners.filter(p => p.siteId === siteId)
  }
  return [...mockPractitioners]
}

// Sites
export async function fetchSites(): Promise<Site[]> {
  await randomLatency()
  return [...mockSites]
}

// Helper functions
function calculateNoShowScore(patient?: Patient): number {
  if (!patient) return 50
  
  let score = 20 // Base score
  
  // History factor
  score += patient.noShowHistory * 15
  
  // Last visit factor
  if (patient.lastVisit) {
    const daysSinceVisit = Math.floor(
      (Date.now() - new Date(patient.lastVisit).getTime()) / (1000 * 60 * 60 * 24)
    )
    score += Math.min(daysSinceVisit * 0.3, 30)
  } else {
    score += 15 // New patient
  }
  
  return Math.min(Math.max(score, 0), 100)
}

function generateNoShowFactors(patient: Patient | undefined, appointmentData: { startTime: string }): Appointment['noShowFactors'] {
  const factors: Appointment['noShowFactors'] = []
  
  if (patient) {
    if (patient.noShowHistory === 0) {
      factors.push({ factor: 'Historique fiable', impact: -20, description: 'Aucun no-show passé' })
    } else if (patient.noShowHistory <= 2) {
      factors.push({ factor: 'Historique modéré', impact: patient.noShowHistory * 15, description: `${patient.noShowHistory} no-show(s) passé(s)` })
    } else {
      factors.push({ factor: 'Historique critique', impact: Math.min(patient.noShowHistory * 15, 60), description: `${patient.noShowHistory} no-shows passés` })
    }
    
    if (!patient.lastVisit) {
      factors.push({ factor: 'Nouveau patient', impact: 15, description: 'Première visite' })
    }
  }
  
  const hour = parseInt(appointmentData.startTime.split(':')[0])
  if (hour < 10) {
    factors.push({ factor: 'Créneau matinal', impact: 8, description: 'RDV avant 10h' })
  } else if (hour >= 17) {
    factors.push({ factor: 'Créneau tardif', impact: 5, description: 'RDV après 17h' })
  }
  
  return factors
}

// Send reminder
export async function sendReminder(appointmentId: string, type: 'sms' | 'email' | 'call'): Promise<Appointment> {
  await randomLatency()
  
  const idx = appointments.findIndex(a => a.id === appointmentId)
  if (idx < 0) throw new Error('Rendez-vous non trouvé')
  
  const reminder = {
    type,
    sentAt: new Date().toISOString(),
    status: Math.random() > 0.1 ? 'delivered' as const : 'failed' as const,
  }
  
  const updated = {
    ...appointments[idx],
    remindersSent: [...appointments[idx].remindersSent, reminder],
  }
  appointments[idx] = updated
  
  const patient = mockPatients.find(p => p.id === updated.patientId)
  addAuditLog('reminder_sent', 'appointment', appointmentId, {
    type,
    patientName: patient ? `${patient.firstName} ${patient.lastName}` : 'Unknown',
    status: reminder.status,
  })
  
  return updated
}

// High risk appointments
export async function fetchHighRiskAppointments(): Promise<Appointment[]> {
  await randomLatency()
  
  return appointments
    .filter(a => a.status === 'scheduled' || a.status === 'confirmed')
    .filter(a => a.noShowScore >= 40)
    .sort((a, b) => b.noShowScore - a.noShowScore)
}

// Reassign slot
export async function reassignSlot(
  cancelledAppointmentId: string,
  waitlistEntryId: string
): Promise<{ newAppointment: Appointment; waitlistEntry: WaitlistEntry }> {
  await randomLatency()
  
  const cancelledAppt = appointments.find(a => a.id === cancelledAppointmentId)
  if (!cancelledAppt) throw new Error('Rendez-vous annulé non trouvé')
  
  const wlEntry = waitlist.find(w => w.id === waitlistEntryId)
  if (!wlEntry) throw new Error('Entrée liste d\'attente non trouvée')
  
  // Create new appointment
  const newAppointment = await createAppointment({
    patientId: wlEntry.patientId,
    practitionerId: cancelledAppt.practitionerId,
    siteId: cancelledAppt.siteId,
    date: cancelledAppt.date,
    startTime: cancelledAppt.startTime,
    endTime: cancelledAppt.endTime,
    status: 'confirmed',
    notes: 'Réaffectation depuis créneau annulé',
  })
  
  // Update waitlist
  const wlIdx = waitlist.findIndex(w => w.id === waitlistEntryId)
  const updatedWl: WaitlistEntry = { ...wlEntry, status: 'accepted' }
  waitlist[wlIdx] = updatedWl
  
  const patient = mockPatients.find(p => p.id === wlEntry.patientId)
  addAuditLog('slot_reassigned', 'appointment', newAppointment.id, {
    originalAppointmentId: cancelledAppointmentId,
    patientName: patient ? `${patient.firstName} ${patient.lastName}` : 'Unknown',
  })
  
  return { newAppointment, waitlistEntry: updatedWl }
}

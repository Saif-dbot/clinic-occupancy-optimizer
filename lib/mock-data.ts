import type {
  User,
  Site,
  Specialty,
  Practitioner,
  Patient,
  Appointment,
  TimeSlot,
  WaitlistEntry,
  KPIData,
  KPIAlert,
  AuditLogEntry,
  NoShowScoringRule,
  AppSettings,
} from '@/types'

// Users
export const mockUsers: User[] = [
  { id: 'u1', email: 'admin@clinique.fr', name: 'Marie Dupont', role: 'admin', avatar: '/avatars/admin.jpg' },
  { id: 'u2', email: 'secretaire@clinique.fr', name: 'Sophie Martin', role: 'secretaire', avatar: '/avatars/secretary.jpg' },
  { id: 'u3', email: 'medecin@clinique.fr', name: 'Dr. Jean Lefevre', role: 'medecin', avatar: '/avatars/doctor.jpg' },
  { id: 'u4', email: 'client@clinique.fr', name: 'Lucas Martin', role: 'client', avatar: '/avatars/client.jpg' },
]

// Sites
export const mockSites: Site[] = [
  { id: 's1', name: 'Clinique Saint-Michel', address: '12 Rue de la Santé', city: 'Paris 14e' },
  { id: 's2', name: 'Centre Médical Montparnasse', address: '45 Boulevard du Montparnasse', city: 'Paris 6e' },
  { id: 's3', name: 'Cabinet Médical Auteuil', address: '8 Place de la Porte d\'Auteuil', city: 'Paris 16e' },
]

// Specialties
export const mockSpecialties: Specialty[] = [
  { id: 'sp1', name: 'Médecine Générale', color: '#10b981' },
  { id: 'sp2', name: 'Cardiologie', color: '#ef4444' },
  { id: 'sp3', name: 'Dermatologie', color: '#8b5cf6' },
  { id: 'sp4', name: 'Pédiatrie', color: '#f59e0b' },
  { id: 'sp5', name: 'Gynécologie', color: '#ec4899' },
]

// Practitioners
export const mockPractitioners: Practitioner[] = [
  { id: 'p1', name: 'Dr. Jean Lefevre', siteId: 's1', specialtyId: 'sp1' },
  { id: 'p2', name: 'Dr. Claire Moreau', siteId: 's1', specialtyId: 'sp2' },
  { id: 'p3', name: 'Dr. Pierre Dubois', siteId: 's2', specialtyId: 'sp3' },
  { id: 'p4', name: 'Dr. Isabelle Petit', siteId: 's2', specialtyId: 'sp4' },
  { id: 'p5', name: 'Dr. François Bernard', siteId: 's3', specialtyId: 'sp1' },
  { id: 'p6', name: 'Dr. Anne Laurent', siteId: 's3', specialtyId: 'sp5' },
]

// Patients
export const mockPatients: Patient[] = [
  { id: 'pt1', firstName: 'Lucas', lastName: 'Martin', email: 'lucas.martin@email.fr', phone: '06 12 34 56 78', birthDate: '1985-03-15', noShowHistory: 0, lastVisit: '2025-04-01' },
  { id: 'pt2', firstName: 'Emma', lastName: 'Bernard', email: 'emma.bernard@email.fr', phone: '06 23 45 67 89', birthDate: '1992-07-22', noShowHistory: 2, lastVisit: '2025-03-28' },
  { id: 'pt3', firstName: 'Hugo', lastName: 'Petit', email: 'hugo.petit@email.fr', phone: '06 34 56 78 90', birthDate: '1978-11-08', noShowHistory: 1, lastVisit: '2025-04-10' },
  { id: 'pt4', firstName: 'Chloé', lastName: 'Robert', email: 'chloe.robert@email.fr', phone: '06 45 67 89 01', birthDate: '1995-01-30', noShowHistory: 3, lastVisit: '2025-02-15' },
  { id: 'pt5', firstName: 'Louis', lastName: 'Richard', email: 'louis.richard@email.fr', phone: '06 56 78 90 12', birthDate: '1960-06-12', noShowHistory: 0, lastVisit: '2025-04-18' },
  { id: 'pt6', firstName: 'Léa', lastName: 'Durand', email: 'lea.durand@email.fr', phone: '06 67 89 01 23', birthDate: '1988-09-25', noShowHistory: 4, lastVisit: '2025-01-20' },
  { id: 'pt7', firstName: 'Gabriel', lastName: 'Moreau', email: 'gabriel.moreau@email.fr', phone: '06 78 90 12 34', birthDate: '2010-04-05', noShowHistory: 0 },
  { id: 'pt8', firstName: 'Manon', lastName: 'Simon', email: 'manon.simon@email.fr', phone: '06 89 01 23 45', birthDate: '1975-12-18', noShowHistory: 2, lastVisit: '2025-03-05' },
  { id: 'pt9', firstName: 'Raphaël', lastName: 'Michel', email: 'raphael.michel@email.fr', phone: '06 90 12 34 56', birthDate: '1998-02-28', noShowHistory: 1 },
  { id: 'pt10', firstName: 'Camille', lastName: 'Garcia', email: 'camille.garcia@email.fr', phone: '06 01 23 45 67', birthDate: '1982-08-14', noShowHistory: 5, lastVisit: '2024-12-10' },
]

// Generate dates for appointments
const today = new Date()
const formatDate = (date: Date) => date.toISOString().split('T')[0]

const generateDates = () => {
  const dates: string[] = []
  for (let i = -7; i <= 14; i++) {
    const d = new Date(today)
    d.setDate(d.getDate() + i)
    dates.push(formatDate(d))
  }
  return dates
}

const dates = generateDates()

// Appointments
export const mockAppointments: Appointment[] = [
  {
    id: 'a1',
    patientId: 'pt1',
    practitionerId: 'p1',
    siteId: 's1',
    date: dates[7],
    startTime: '09:00',
    endTime: '09:30',
    status: 'confirmed',
    noShowScore: 12,
    noShowFactors: [
      { factor: 'Historique fiable', impact: -20, description: 'Aucun no-show passé' },
      { factor: 'Délai RDV court', impact: 5, description: 'RDV dans moins de 3 jours' },
    ],
    remindersSent: [{ type: 'sms', sentAt: dates[5] + 'T10:00:00', status: 'delivered' }],
    createdAt: dates[0] + 'T14:30:00',
  },
  {
    id: 'a2',
    patientId: 'pt2',
    practitionerId: 'p1',
    siteId: 's1',
    date: dates[7],
    startTime: '09:30',
    endTime: '10:00',
    status: 'scheduled',
    noShowScore: 58,
    noShowFactors: [
      { factor: 'Historique à risque', impact: 30, description: '2 no-shows passés' },
      { factor: 'Créneau matinal', impact: 10, description: 'RDV avant 10h' },
      { factor: 'Premier RDV spécialiste', impact: 18, description: 'Première consultation' },
    ],
    remindersSent: [],
    createdAt: dates[1] + 'T09:15:00',
  },
  {
    id: 'a3',
    patientId: 'pt4',
    practitionerId: 'p2',
    siteId: 's1',
    date: dates[7],
    startTime: '14:00',
    endTime: '14:30',
    status: 'scheduled',
    noShowScore: 82,
    noShowFactors: [
      { factor: 'Historique critique', impact: 45, description: '3 no-shows passés' },
      { factor: 'Dernière visite ancienne', impact: 20, description: 'Plus de 60 jours' },
      { factor: 'Pas de confirmation', impact: 17, description: 'Aucune réponse aux rappels' },
    ],
    remindersSent: [
      { type: 'sms', sentAt: dates[5] + 'T10:00:00', status: 'delivered' },
      { type: 'email', sentAt: dates[5] + 'T10:00:00', status: 'delivered' },
    ],
    createdAt: dates[0] + 'T11:00:00',
  },
  {
    id: 'a4',
    patientId: 'pt5',
    practitionerId: 'p3',
    siteId: 's2',
    date: dates[7],
    startTime: '10:00',
    endTime: '10:30',
    status: 'confirmed',
    noShowScore: 8,
    noShowFactors: [
      { factor: 'Patient régulier', impact: -25, description: 'Visites fréquentes' },
      { factor: 'Historique fiable', impact: -20, description: 'Aucun no-show' },
    ],
    remindersSent: [{ type: 'sms', sentAt: dates[5] + 'T10:00:00', status: 'delivered' }],
    createdAt: dates[2] + 'T16:00:00',
  },
  {
    id: 'a5',
    patientId: 'pt6',
    practitionerId: 'p4',
    siteId: 's2',
    date: dates[8],
    startTime: '11:00',
    endTime: '11:30',
    status: 'scheduled',
    noShowScore: 91,
    noShowFactors: [
      { factor: 'Historique très critique', impact: 55, description: '4 no-shows passés' },
      { factor: 'Dernière visite très ancienne', impact: 25, description: 'Plus de 90 jours' },
      { factor: 'Pas de confirmation', impact: 11, description: 'Rappels ignorés' },
    ],
    remindersSent: [
      { type: 'sms', sentAt: dates[6] + 'T10:00:00', status: 'delivered' },
      { type: 'call', sentAt: dates[6] + 'T14:00:00', status: 'failed' },
    ],
    createdAt: dates[1] + 'T10:30:00',
  },
  {
    id: 'a6',
    patientId: 'pt3',
    practitionerId: 'p5',
    siteId: 's3',
    date: dates[8],
    startTime: '15:00',
    endTime: '15:30',
    status: 'confirmed',
    noShowScore: 35,
    noShowFactors: [
      { factor: 'Historique modéré', impact: 15, description: '1 no-show passé' },
      { factor: 'Confirmation reçue', impact: -15, description: 'A confirmé par SMS' },
    ],
    remindersSent: [{ type: 'sms', sentAt: dates[6] + 'T10:00:00', status: 'delivered' }],
    createdAt: dates[3] + 'T09:00:00',
  },
  {
    id: 'a7',
    patientId: 'pt7',
    practitionerId: 'p4',
    siteId: 's2',
    date: dates[9],
    startTime: '09:00',
    endTime: '09:30',
    status: 'scheduled',
    noShowScore: 22,
    noShowFactors: [
      { factor: 'Nouveau patient', impact: 15, description: 'Première visite' },
      { factor: 'Pédiatrie', impact: -5, description: 'Parents généralement ponctuels' },
    ],
    remindersSent: [],
    createdAt: dates[4] + 'T11:00:00',
  },
  {
    id: 'a8',
    patientId: 'pt8',
    practitionerId: 'p6',
    siteId: 's3',
    date: dates[9],
    startTime: '16:00',
    endTime: '16:30',
    status: 'scheduled',
    noShowScore: 48,
    noShowFactors: [
      { factor: 'Historique modéré', impact: 25, description: '2 no-shows passés' },
      { factor: 'Créneau fin de journée', impact: 8, description: 'RDV après 16h' },
      { factor: 'Délai booking long', impact: 15, description: 'RDV pris il y a plus de 2 semaines' },
    ],
    remindersSent: [],
    createdAt: dates[0] + 'T08:00:00',
  },
  {
    id: 'a9',
    patientId: 'pt10',
    practitionerId: 'p1',
    siteId: 's1',
    date: dates[10],
    startTime: '11:00',
    endTime: '11:30',
    status: 'scheduled',
    noShowScore: 95,
    noShowFactors: [
      { factor: 'Historique critique', impact: 60, description: '5 no-shows passés' },
      { factor: 'Dernière visite très ancienne', impact: 30, description: 'Plus de 120 jours' },
      { factor: 'Aucune réponse', impact: 5, description: 'Rappels non confirmés' },
    ],
    remindersSent: [
      { type: 'sms', sentAt: dates[8] + 'T10:00:00', status: 'delivered' },
      { type: 'email', sentAt: dates[8] + 'T10:00:00', status: 'delivered' },
    ],
    createdAt: dates[2] + 'T14:00:00',
  },
  {
    id: 'a10',
    patientId: 'pt9',
    practitionerId: 'p3',
    siteId: 's2',
    date: dates[10],
    startTime: '14:30',
    endTime: '15:00',
    status: 'confirmed',
    noShowScore: 28,
    noShowFactors: [
      { factor: 'Historique léger', impact: 12, description: '1 no-show passé' },
      { factor: 'Confirmation SMS', impact: -10, description: 'A confirmé sa venue' },
    ],
    remindersSent: [{ type: 'sms', sentAt: dates[8] + 'T10:00:00', status: 'delivered' }],
    createdAt: dates[3] + 'T15:30:00',
  },
  // Past appointments
  {
    id: 'a11',
    patientId: 'pt1',
    practitionerId: 'p1',
    siteId: 's1',
    date: dates[0],
    startTime: '10:00',
    endTime: '10:30',
    status: 'completed',
    noShowScore: 10,
    noShowFactors: [],
    remindersSent: [{ type: 'sms', sentAt: dates[0] + 'T08:00:00', status: 'delivered' }],
    createdAt: dates[0] + 'T09:00:00',
  },
  {
    id: 'a12',
    patientId: 'pt4',
    practitionerId: 'p2',
    siteId: 's1',
    date: dates[1],
    startTime: '14:00',
    endTime: '14:30',
    status: 'no_show',
    noShowScore: 75,
    noShowFactors: [],
    remindersSent: [{ type: 'sms', sentAt: dates[0] + 'T10:00:00', status: 'delivered' }],
    createdAt: dates[0] + 'T10:00:00',
  },
  {
    id: 'a13',
    patientId: 'pt6',
    practitionerId: 'p3',
    siteId: 's2',
    date: dates[2],
    startTime: '09:00',
    endTime: '09:30',
    status: 'cancelled',
    noShowScore: 85,
    noShowFactors: [],
    remindersSent: [],
    createdAt: dates[0] + 'T11:00:00',
  },
]

// Time slots (generate for next 7 days)
export const generateTimeSlots = (): TimeSlot[] => {
  const slots: TimeSlot[] = []
  const times = ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30']
  
  mockPractitioners.forEach(practitioner => {
    for (let dayOffset = 0; dayOffset < 14; dayOffset++) {
      const date = new Date(today)
      date.setDate(date.getDate() + dayOffset)
      const dateStr = formatDate(date)
      
      // Skip weekends
      if (date.getDay() === 0 || date.getDay() === 6) continue
      
      times.forEach((startTime, idx) => {
        const endTime = times[idx + 1] || '17:00'
        const existingAppointment = mockAppointments.find(
          a => a.practitionerId === practitioner.id && a.date === dateStr && a.startTime === startTime
        )
        
        slots.push({
          id: `slot-${practitioner.id}-${dateStr}-${startTime}`,
          practitionerId: practitioner.id,
          siteId: practitioner.siteId,
          date: dateStr,
          startTime,
          endTime,
          isAvailable: !existingAppointment,
          appointmentId: existingAppointment?.id,
        })
      })
    }
  })
  
  return slots
}

export const mockTimeSlots = generateTimeSlots()

// Waitlist
export const mockWaitlist: WaitlistEntry[] = [
  {
    id: 'w1',
    patientId: 'pt1',
    practitionerId: 'p2',
    siteId: 's1',
    specialtyId: 'sp2',
    preferredDates: [dates[7], dates[8], dates[9]],
    preferredTimes: ['09:00', '10:00', '11:00'],
    createdAt: dates[3] + 'T10:00:00',
    status: 'pending',
  },
  {
    id: 'w2',
    patientId: 'pt3',
    siteId: 's2',
    specialtyId: 'sp3',
    preferredDates: [dates[8], dates[9]],
    preferredTimes: ['14:00', '15:00', '16:00'],
    createdAt: dates[4] + 'T14:00:00',
    status: 'pending',
  },
  {
    id: 'w3',
    patientId: 'pt5',
    practitionerId: 'p1',
    siteId: 's1',
    preferredDates: [dates[7]],
    preferredTimes: ['09:00', '09:30'],
    createdAt: dates[5] + 'T09:00:00',
    status: 'offered',
    offeredSlotId: 'slot-p1-' + dates[7] + '-09:30',
    expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'w4',
    patientId: 'pt7',
    siteId: 's3',
    specialtyId: 'sp1',
    preferredDates: [dates[9], dates[10], dates[11]],
    preferredTimes: ['10:00', '11:00'],
    createdAt: dates[4] + 'T16:00:00',
    status: 'pending',
  },
]

// KPI data (last 14 days)
export const mockKPIData: KPIData[] = dates.slice(0, 14).map((date, idx) => ({
  date,
  noShowRate: 12 + Math.random() * 15 - (idx * 0.3),
  occupancyRate: 72 + Math.random() * 18,
  recoveredSlotsRate: 45 + Math.random() * 25,
  bookingLeadTime: 3 + Math.random() * 4,
  reminderDeliveryRate: 92 + Math.random() * 7,
  highRiskConfirmationRate: 55 + Math.random() * 30,
  slotRefillTime: 18 + Math.random() * 12,
}))

// KPI Alerts
export const mockKPIAlerts: KPIAlert[] = [
  {
    id: 'alert1',
    type: 'no_show_rate',
    severity: 'warning',
    message: 'Taux de no-show élevé sur les 3 derniers jours',
    value: 22.5,
    threshold: 20,
    createdAt: dates[6] + 'T08:00:00',
  },
  {
    id: 'alert2',
    type: 'slot_refill',
    severity: 'critical',
    message: 'Temps moyen de réaffectation supérieur à 24h',
    value: 28.5,
    threshold: 24,
    createdAt: dates[5] + 'T14:00:00',
  },
]

// Audit log
export const mockAuditLog: AuditLogEntry[] = [
  {
    id: 'log1',
    action: 'appointment_created',
    userId: 'u2',
    entityType: 'appointment',
    entityId: 'a1',
    details: { patientName: 'Lucas Martin', practitionerName: 'Dr. Jean Lefevre', date: dates[7], time: '09:00' },
    timestamp: dates[0] + 'T14:30:00',
  },
  {
    id: 'log2',
    action: 'reminder_sent',
    userId: 'u1',
    entityType: 'appointment',
    entityId: 'a1',
    details: { type: 'sms', patientName: 'Lucas Martin' },
    timestamp: dates[5] + 'T10:00:00',
  },
  {
    id: 'log3',
    action: 'appointment_confirmed',
    userId: 'u2',
    entityType: 'appointment',
    entityId: 'a1',
    details: { patientName: 'Lucas Martin', method: 'SMS' },
    timestamp: dates[5] + 'T12:30:00',
  },
  {
    id: 'log4',
    action: 'appointment_cancelled',
    userId: 'u2',
    entityType: 'appointment',
    entityId: 'a13',
    details: { patientName: 'Léa Durand', reason: 'Patient request' },
    timestamp: dates[2] + 'T08:00:00',
  },
  {
    id: 'log5',
    action: 'waitlist_offer_sent',
    userId: 'u1',
    entityType: 'waitlist',
    entityId: 'w3',
    details: { patientName: 'Louis Richard', slotDate: dates[7], slotTime: '09:30' },
    timestamp: dates[5] + 'T11:00:00',
  },
  {
    id: 'log6',
    action: 'appointment_no_show',
    userId: 'u2',
    entityType: 'appointment',
    entityId: 'a12',
    details: { patientName: 'Chloé Robert' },
    timestamp: dates[1] + 'T14:45:00',
  },
  {
    id: 'log7',
    action: 'backup_candidate_assigned',
    userId: 'u1',
    entityType: 'appointment',
    entityId: 'a9',
    details: { patientName: 'Camille Garcia', backupPatient: 'Louis Richard' },
    timestamp: dates[6] + 'T09:00:00',
  },
  {
    id: 'log8',
    action: 'settings_updated',
    userId: 'u1',
    entityType: 'settings',
    entityId: 'global',
    details: { setting: 'noShowThreshold', oldValue: 70, newValue: 75 },
    timestamp: dates[4] + 'T16:00:00',
  },
]

// App settings
export const mockSettings: AppSettings = {
  noShowScoringRules: [
    { id: 'r1', name: 'Historique no-show', factor: 'no_show_history', weight: 15, description: 'Points par no-show passé', isActive: true },
    { id: 'r2', name: 'Ancienneté dernière visite', factor: 'last_visit_age', weight: 0.3, description: 'Points par jour depuis dernière visite', isActive: true },
    { id: 'r3', name: 'Délai RDV court', factor: 'short_lead_time', weight: 10, description: 'RDV pris dans les 48h', isActive: true },
    { id: 'r4', name: 'Créneau matinal', factor: 'early_slot', weight: 8, description: 'RDV avant 10h', isActive: true },
    { id: 'r5', name: 'Créneau tardif', factor: 'late_slot', weight: 5, description: 'RDV après 17h', isActive: true },
    { id: 'r6', name: 'Nouveau patient', factor: 'new_patient', weight: 12, description: 'Première visite dans le cabinet', isActive: true },
    { id: 'r7', name: 'Confirmation SMS', factor: 'sms_confirmation', weight: -15, description: 'A confirmé par SMS', isActive: true },
    { id: 'r8', name: 'Patient régulier', factor: 'regular_patient', weight: -20, description: 'Plus de 3 visites dans l\'année', isActive: true },
  ],
  reminderSchedule: {
    standard: { daysBeforeJ2: true },
    medium: { daysBeforeJ2: true, daysBeforeJ1: true, requireConfirmation: true },
    high: { priorityCall: true, assignBackup: true },
  },
  thresholds: {
    noShowRateWarning: 20,
    occupancyRateWarning: 70,
    occupancyDaysThreshold: 5,
    reminderDeliveryWarning: 95,
    slotRefillTimeWarning: 24,
  },
}

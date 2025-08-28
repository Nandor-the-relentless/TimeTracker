// apps/web/src/api/entities.js
import base44, { supabase } from './base44Client'

// Entity shortcuts (kept for existing imports)
export const User              = base44.entities.UserEntity
export const TimeEntry         = base44.entities.TimeEntry
export const PTOPolicy         = base44.entities.PTOPolicy
export const PTOBalance        = base44.entities.PTOBalance
export const PTORequest        = base44.entities.PTORequest
export const Department        = base44.entities.Department
export const TeamMembership    = base44.entities.TeamMembership
export const Settings          = base44.entities.Settings
export const AuditLog          = base44.entities.AuditLog
export const NotificationQueue = base44.entities.NotificationQueue
export const WeeklyHoursView   = base44.entities.WeeklyHoursView
export const ReportPreset      = base44.entities.ReportPreset
export const ReportSchedule    = base44.entities.ReportSchedule

// Named exports for clients
export { supabase, base44 }

// Default export must be a single thing → base44
export default base44

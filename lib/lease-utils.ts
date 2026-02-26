// Shared types and calculation logic for the lease & payment system

export interface ExtraCharge {
  id: string
  name: string
  amount: number
}

export interface LeaseConfig {
  extras: ExtraCharge[]
  deposit_required: boolean
  rent_due_day: number
  duration_months: number
  annual_increase_percent: number
  property_options: {
    furnished: boolean
    own_bathroom: boolean
    own_kitchen: boolean
    parking_included: boolean
    wifi_included: boolean
    pets_allowed: boolean
  }
  move_in_total: number
  monthly_total: number
  cancellation_policy: {
    notice_days: 20
    penalty_amount: 300
    penalty_applies_without_deposit: boolean
  }
  admin_fee: 375
}

export interface PaymentBreakdown {
  base_rent: number
  deposit: number | null
  extras: { name: string; amount: number }[]
  total: number
}

export type PaymentType = 'move_in' | 'monthly_rent' | 'deposit_return' | 'admin_fee' | 'cancel_penalty'

export const ADMIN_FEE = 375
export const CANCEL_PENALTY = 300
export const NOTICE_DAYS = 20

export const LEASE_DURATIONS = [
  { value: 1, label: "1 month" },
  { value: 2, label: "2 months" },
  { value: 3, label: "3 months" },
  { value: 6, label: "6 months" },
  { value: 12, label: "12 months" },
  { value: 18, label: "18 months" },
  { value: 24, label: "24 months" },
]

export const RENT_DUE_DAYS = [
  { value: 1, label: "1st of each month" },
  { value: 15, label: "15th of each month" },
  { value: 25, label: "25th of each month" },
]

export function calculateMoveInTotal(rent: number, deposit: number | null, extras: ExtraCharge[]): number {
  const extrasTotal = extras.reduce((sum, e) => sum + e.amount, 0)
  return (deposit || 0) + rent + extrasTotal
}

export function calculateMonthlyTotal(rent: number, extras: ExtraCharge[]): number {
  return rent + extras.reduce((sum, e) => sum + e.amount, 0)
}

export function calculateEndDate(startDate: string, durationMonths: number): string {
  const start = new Date(startDate)
  const end = new Date(start)
  end.setMonth(end.getMonth() + durationMonths)
  end.setDate(end.getDate() - 1)
  return end.toISOString().split("T")[0]
}

export function formatCurrency(amount: number): string {
  return `R ${amount.toLocaleString("en-ZA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export function parseLeaseConfig(leaseTerms: string | null): LeaseConfig | null {
  if (!leaseTerms) return null
  try {
    return JSON.parse(leaseTerms)
  } catch {
    return null
  }
}

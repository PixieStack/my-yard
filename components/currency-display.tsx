import { formatCurrency } from "@/lib/utils"

interface CurrencyDisplayProps {
  amount: number
  className?: string
  showPrefix?: boolean
}

export function CurrencyDisplay({ amount, className = "", showPrefix = true }: CurrencyDisplayProps) {
  return <span className={className}>{showPrefix ? formatCurrency(amount) : amount.toLocaleString("en-ZA")}</span>
}

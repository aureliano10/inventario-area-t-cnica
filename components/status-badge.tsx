import { cn } from "@/lib/utils"
import type { ItemStatus } from "@/lib/types"

const STYLES: Record<ItemStatus, { label: string; className: string }> = {
  disponible: { label: "Disponible", className: "bg-success/12 text-success border-success/30" },
  prestado: { label: "Prestado", className: "bg-warning/20 text-warning-foreground border-warning/50" },
  dañado: { label: "Dañado", className: "bg-destructive/10 text-destructive border-destructive/30" },
}

export function StatusBadge({ status, className }: { status: ItemStatus; className?: string }) {
  const s = STYLES[status]
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold",
        s.className,
        className,
      )}
    >
      <span className="size-1.5 rounded-full bg-current" aria-hidden="true" />
      {s.label}
    </span>
  )
}

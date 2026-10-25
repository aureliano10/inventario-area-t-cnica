import { MapPin, Wrench, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { StatusBadge } from "@/components/status-badge"
import type { Item } from "@/lib/types"

export function ItemSummary({ item, onClear }: { item: Item; onClear?: () => void }) {
  return (
    <div className="flex items-start gap-3 rounded-lg border bg-muted/50 p-3">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
        <Wrench className="size-5" aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-medium">{item.name}</p>
          <StatusBadge status={item.status} />
        </div>
        <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-sm text-muted-foreground">
          <span className="font-mono">{item.code}</span>
          <span aria-hidden="true">·</span>
          <span>{item.category}</span>
          <span aria-hidden="true">·</span>
          <span className="inline-flex items-center gap-1">
            <MapPin className="size-3.5" aria-hidden="true" />
            {item.location} ({item.sector})
          </span>
        </p>
      </div>
      {onClear && (
        <Button variant="ghost" size="icon-sm" onClick={onClear} aria-label={`Quitar ${item.name}`}>
          <X aria-hidden="true" />
        </Button>
      )}
    </div>
  )
}

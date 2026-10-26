"use client"

import { forwardRef, useId, useMemo, useState } from "react"
import { ScanBarcode } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { StatusBadge } from "@/components/status-badge"
import { useStore } from "@/lib/store"
import type { Item } from "@/lib/types"
import { cn } from "@/lib/utils"

interface ItemScannerProps {
  label?: string
  onScan: (item: Item) => void
  suggestionFilter?: (item: Item) => boolean
  demoCodes?: string[]
  autoFocus?: boolean
}

export const ItemScanner = forwardRef<HTMLInputElement, ItemScannerProps>(function ItemScanner(
  { label = "Código de barras", onScan, suggestionFilter, demoCodes, autoFocus = true },
  ref,
) {
  const { items, findItem } = useStore()
  const [query, setQuery] = useState("")
  const [highlight, setHighlight] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const inputId = useId()
  const listId = useId()
  const errorId = useId()

  const suggestions = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (q.length < 2) return []
    return items
      .filter((i) => (suggestionFilter ? suggestionFilter(i) : true))
      .filter((i) => i.code.toLowerCase().includes(q) || i.name.toLowerCase().includes(q))
      .slice(0, 12)
  }, [items, query, suggestionFilter])

  function submit(item: Item) {
    setQuery("")
    setHighlight(0)
    setError(null)
    onScan(item)
  }

  function handleEnter() {
    const exact = findItem(query)
    if (exact) return submit(exact)
    if (suggestions[highlight]) return submit(suggestions[highlight])
    if (query.trim()) setError(`El código "${query.trim()}" no se encuentra en el inventario del colegio.`)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown" && suggestions.length) {
      e.preventDefault()
      setHighlight((h) => (h + 1) % suggestions.length)
    } else if (e.key === "ArrowUp" && suggestions.length) {
      e.preventDefault()
      setHighlight((h) => (h - 1 + suggestions.length) % suggestions.length)
    } else if (e.key === "Escape") {
      setQuery("")
    } else if (e.key === "Enter") {
      if (e.nativeEvent.isComposing || e.keyCode === 229) return
      e.preventDefault()
      handleEnter()
    }
  }

  const open = suggestions.length > 0

  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={inputId}>{label}</Label>
      <div className="relative">
        <ScanBarcode
          className="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <Input
          ref={ref}
          id={inputId}
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={open ? `${listId}-${highlight}` : undefined}
          aria-describedby={error ? errorId : undefined}
          aria-invalid={!!error}
          autoFocus={autoFocus}
          autoComplete="off"
          placeholder="Escaneá o escribí código / nombre…"
          className="h-12 pl-10 font-mono text-base"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setHighlight(0)
            setError(null)
          }}
          onKeyDown={handleKeyDown}
        />
        {open && (
          <ul
            id={listId}
            role="listbox"
            className="absolute inset-x-0 top-full z-[100] mt-1 max-h-[min(360px,50vh)] overflow-y-auto overscroll-contain rounded-lg border bg-popover shadow-2xl"
          >
            {suggestions.map((s, i) => (
              <li
                key={s.code}
                id={`${listId}-${i}`}
                role="option"
                aria-selected={i === highlight}
                className={cn(
                  "flex cursor-pointer items-center justify-between gap-3 px-3 py-2 text-sm",
                  i === highlight && "bg-accent text-accent-foreground",
                )}
                onMouseEnter={() => setHighlight(i)}
                onMouseDown={(e) => {
                  e.preventDefault()
                  submit(s)
                }}
              >
                <span className="min-w-0 truncate">
                  <span className="font-mono font-medium">{s.code}</span> · {s.name}
                </span>
                <StatusBadge status={s.status} />
              </li>
            ))}
          </ul>
        )}
      </div>
      {error ? (
        <p id={errorId} role="alert" className="text-sm font-medium text-destructive">
          {error}
        </p>
      ) : (
        <p className="text-xs text-muted-foreground">
          Usá el lector o escribí y presioná Enter. Flechas ↑ ↓ para elegir una sugerencia.
        </p>
      )}
      {demoCodes && demoCodes.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <span className="text-muted-foreground">Simular escaneo:</span>
          {demoCodes.map((code) => (
            <button
              key={code}
              type="button"
              className="rounded border bg-muted px-1.5 py-0.5 font-mono hover:bg-accent focus-visible:outline-2 focus-visible:outline-ring"
              onClick={() => {
                const item = findItem(code)
                if (item) submit(item)
                else setError(`El código "${code}" no se encuentra en el inventario del colegio.`)
              }}
            >
              {code}
            </button>
          ))}
        </div>
      )}
    </div>
  )
})

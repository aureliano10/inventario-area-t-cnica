"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Check, ChevronDown, PackageOpen, Search, Trash2, Users } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ItemScanner } from "@/components/item-scanner"
import { ItemSummary } from "@/components/item-summary"
import { NativeSelect } from "@/components/native-select"
import { PageHeader } from "@/components/page-header"
import { useStore } from "@/lib/store"
import type { Item } from "@/lib/types"
import { cn } from "@/lib/utils"

export function BatchLoanScreen() {
  const { lendBatch, items, teachers, user } = useStore()
  const [teacher, setTeacher] = useState("")
  const [batch, setBatch] = useState<Item[]>([])
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState("")
  const [showScanner, setShowScanner] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const searchRef = useRef<HTMLInputElement>(null)

  const suggestions = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return []
    return items
      .filter((i) => i.category !== "Proyector")
      .filter((i) => i.status === "disponible")
      .filter((i) => !batch.some((b) => b.code === i.code))
      .filter((i) => i.code.toLowerCase().includes(q) || i.name.toLowerCase().includes(q))
      .slice(0, 14)
  }, [items, query, batch])

  useEffect(() => {
    setActiveIndex(-1)
  }, [query, suggestions.length])

  function addItem(item: Item) {
    if (batch.some((b) => b.code === item.code)) {
      setError(`${item.name} ya está en el lote.`)
      return
    }
    if (item.status !== "disponible") {
      setError(`${item.name} (${item.code}) no está disponible.`)
      toast.error("No se puede agregar", { description: `${item.code} figura como ${item.status}.` })
      return
    }
    setError(null)
    setBatch((prev) => [...prev, item])
    searchRef.current?.focus()
  }

  function addAllVisible() {
    const toAdd = suggestions.filter((s) => s.status === "disponible" && !batch.some((b) => b.code === s.code))
    if (toAdd.length === 0) return
    setBatch((prev) => [...prev, ...toAdd])
    setError(null)
    toast.success("Agregados al lote", { description: `${toAdd.length} ${toAdd.length === 1 ? "equipo" : "equipos"}` })
    searchRef.current?.focus()
  }

  function removeItem(code: string) {
    setBatch((prev) => prev.filter((b) => b.code !== code))
    setError(null)
  }

  function clearAll() {
    setBatch([])
    setError(null)
    setQuery("")
    searchRef.current?.focus()
  }

  function confirm() {
    if (!teacher) {
      setError("Seleccioná el docente responsable del lote.")
      return
    }
    if (batch.length === 0) {
      setError("Agregá al menos un equipo al lote.")
      return
    }
    const result = lendBatch({ teacher, itemCodes: batch.map((b) => b.code) })
    if (!result.ok) {
      setError(result.error)
      return
    }
    toast.success("Préstamo por lote registrado", {
      description: `${batch.length} ${batch.length === 1 ? "equipo" : "equipos"} a cargo de ${teacher}`,
    })
    setBatch([])
    setTeacher("")
    setError(null)
    setQuery("")
    setShowScanner(false)
    searchRef.current?.focus()
  }

  return (
    <>
      <PageHeader
        title="Préstamo por lote a docente"
        description="Ideal para llevar varios equipos para una clase. Todo queda agrupado bajo un mismo lote y un único responsable."
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,380px)_minmax(0,1fr)]">
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="size-5" aria-hidden="true" />
                1. Docente responsable
              </CardTitle>
              <CardDescription>El docente queda como único responsable de todos los equipos del lote.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <div className="flex flex-col gap-2">
                <Label htmlFor="batch-teacher">Seleccionar docente</Label>
                <NativeSelect id="batch-teacher" value={teacher} onChange={(e) => setTeacher(e.target.value)}>
                  <option value="">Elegí un docente</option>
                  {(teachers || []).map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </NativeSelect>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>2. Agregar equipos</CardTitle>
              <CardDescription>Buscá por nombre o código. Agregalos uno tras otro.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="batch-search">Buscar equipo</Label>
                  {suggestions.length > 0 && (
                    <Button type="button" variant="ghost" size="sm" onClick={addAllVisible}>
                      Agregar todos los visibles ({suggestions.length})
                    </Button>
                  )}
                </div>
                <div className="relative">
                  <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                  <Input
                    ref={searchRef}
                    id="batch-search"
                    className="h-10 pl-8"
                    placeholder="Ej. Notebook, Alargue, Zapatilla..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    autoComplete="off"
                    onKeyDown={(e) => {
                      if (suggestions.length === 0) return
                      if (e.key === "ArrowDown") {
                        e.preventDefault()
                        setActiveIndex((i) => (i + 1) % suggestions.length)
                      } else if (e.key === "ArrowUp") {
                        e.preventDefault()
                        setActiveIndex((i) => (i - 1 + suggestions.length) % suggestions.length)
                      } else if (e.key === "Enter") {
                        if (activeIndex >= 0 && activeIndex < suggestions.length) {
                          e.preventDefault()
                          addItem(suggestions[activeIndex])
                        }
                      } else if (e.key === "Escape") {
                        setQuery("")
                        setActiveIndex(-1)
                      }
                    }}
                  />
                </div>
                {suggestions.length > 0 && (
                  <div className="overflow-hidden rounded-md border bg-card shadow-sm">
                    <div className="flex items-center justify-between border-b px-3 py-1.5 text-xs text-muted-foreground">
                      <span>Clickeá para agregar al lote. Podés seguir buscando.</span>
                      <span>↑↓ + Enter</span>
                    </div>
                    <ul className="max-h-[min(360px,48vh)] divide-y overflow-y-auto overscroll-contain">
                      {suggestions.map((s, idx) => (
                        <li key={s.code}>
                          <button
                            type="button"
                            className={cn("flex w-full items-center justify-between gap-3 px-3 py-2 text-left hover:bg-muted", activeIndex === idx && "bg-muted")}
                            onMouseEnter={() => setActiveIndex(idx)}
                            onClick={() => addItem(s)}
                          >
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium">{s.name}</p>
                              <p className="truncate text-xs text-muted-foreground">{s.category} · {s.location}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-mono text-xs text-muted-foreground">{s.code}</p>
                              <p className="text-xs text-emerald-600">+ Agregar</p>
                            </div>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {query.trim() && suggestions.length === 0 && (
                  <p className="text-sm text-muted-foreground">Todos los que coinciden ya fueron agregados al lote.</p>
                )}
              </div>

              <div className="rounded-lg border">
                <button
                  type="button"
                  className="flex w-full items-center justify-between px-3 py-2 text-sm font-medium hover:bg-muted"
                  onClick={() => setShowScanner((v) => !v)}
                  aria-expanded={showScanner}
                >
                  <span>¿Tiene código de barras? Escanear (opcional)</span>
                  <ChevronDown className={cn("size-4 transition-transform", showScanner && "rotate-180")} aria-hidden="true" />
                </button>
                {showScanner && (
                  <div className="border-t p-3">
                    <ItemScanner
                      label="Escanear equipos"
                      onScan={addItem}
                      suggestionFilter={(i) => i.status === "disponible" && i.category !== "Proyector"}
                      demoCodes={["AT-0011", "AT-0012", "AT-0013"]}
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="flex h-fit flex-col">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>3. Lote a entregar</CardTitle>
              <CardDescription aria-live="polite">
                {batch.length === 0 ? "Vacío" : `${batch.length} ${batch.length === 1 ? "equipo" : "equipos"}`}
              </CardDescription>
            </div>
            {batch.length > 0 && (
              <Button variant="ghost" size="sm" onClick={clearAll}>
                <Trash2 className="mr-2 size-4" aria-hidden="true" />
                Vaciar
              </Button>
            )}
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {batch.length === 0 ? (
              <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed py-10 text-center text-muted-foreground">
                <PackageOpen className="size-8" aria-hidden="true" />
                <p>Agregá equipos para armar el lote.</p>
              </div>
            ) : (
              <ul className="flex max-h-[55vh] flex-col gap-2 overflow-y-auto pr-1">
                {batch.map((b) => (
                  <li key={b.code} className="relative">
                    <ItemSummary item={b} />
                    <Button type="button" variant="ghost" size="icon" className="absolute right-2 top-2" onClick={() => removeItem(b.code)} aria-label="Quitar">
                      <Trash2 className="size-4" />
                    </Button>
                  </li>
                ))}
              </ul>
            )}

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="mt-auto flex flex-col gap-2">
              <p className="text-center text-sm text-muted-foreground">Registrado por {user?.username ? ({ mgarcia: "Encargado 1", lperez: "Encargado 2", directora: "Directivo" } as any)[user.username] || user?.name : user?.name} · Turno {user?.shift}</p>
              <Button size="lg" className="h-11 w-full" onClick={confirm} disabled={batch.length === 0 || !teacher}>
                <Check className="mr-2 size-4" aria-hidden="true" />
                Confirmar lote ({batch.length})
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  )
}
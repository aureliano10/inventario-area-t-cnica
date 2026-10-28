"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Check, ChevronDown, Filter, PackageOpen, Search, Trash2, Users, X } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ItemScanner } from "@/components/item-scanner"
import { NativeSelect } from "@/components/native-select"
import { PageHeader } from "@/components/page-header"
import { useStore } from "@/lib/store"
import type { Item } from "@/lib/types"
import { cn } from "@/lib/utils"
import { COURSES } from "@/lib/mock-data"

const CATEGORIES = ["Todos", "Notebooks", "Calculadoras", "Otros"]

export function BatchLoanScreen() {
  const { lendBatch, items, teachers, user } = useStore()
  const [teacher, setTeacher] = useState("")
  const [course, setCourse] = useState("")
  const [batch, setBatch] = useState<Item[]>([])
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState("")
  const [category, setCategory] = useState("Todos")
  const [showScanner, setShowScanner] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const searchRef = useRef<HTMLInputElement>(null)

  const canSearch = teacher.trim() && course.trim()

  const suggestions = useMemo(() => {
    const q = query.trim().toLowerCase()
    return items
      .filter((i) => i.category !== "Proyector")
      .filter((i) => i.status === "disponible")
      .filter((i) => !batch.some((b) => b.code === i.code))
      .filter((i) => {
        if (category === "Notebooks") return i.name.toLowerCase().includes("notebook") || i.code.toLowerCase().startsWith("nb")
        if (category === "Calculadoras") return i.name.toLowerCase().includes("calculadora") || i.category.toLowerCase().includes("calculadora")
        if (category === "Otros") {
          const name = i.name.toLowerCase()
          const code = i.code.toLowerCase()
          return !name.includes("notebook") && !code.startsWith("nb") && !name.includes("calculadora") && !i.category.toLowerCase().includes("calculadora")
        }
        return true
      })
      .filter((i) => !q || i.code.toLowerCase().includes(q) || i.name.toLowerCase().includes(q) || i.category.toLowerCase().includes(q))
      .sort((a, b) => a.location.localeCompare(b.location) || a.code.localeCompare(b.code))
  }, [items, query, batch, category])

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

  function toggleItem(item: Item) {
    if (batch.some((b) => b.code === item.code)) {
      removeItem(item.code)
      return
    }
    if (item.status !== "disponible") return
    setError(null)
    setBatch((prev) => [...prev, item])
  }

  function addAllVisible() {
    const toAdd = suggestions.filter((s) => s.status === "disponible" && !batch.some((b) => b.code === s.code))
    if (toAdd.length === 0) return
    setBatch((prev) => [...prev, ...toAdd])
    setError(null)
    toast.success("Seleccionados", { description: `${toAdd.length} ${toAdd.length === 1 ? "equipo" : "equipos"}` })
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
    if (!teacher.trim()) {
      setError("Seleccioná el docente responsable del lote.")
      return
    }
    if (!course.trim()) {
      setError("Seleccioná el curso para este lote.")
      return
    }
    if (batch.length === 0) {
      setError("Seleccioná al menos un equipo para el lote.")
      return
    }
    const result = lendBatch({ teacher: teacher.trim(), itemCodes: batch.map((b) => b.code) })
    if (!result.ok) {
      setError(result.error)
      return
    }
    toast.success("Préstamo por lote registrado", {
      description: `${batch.length} ${batch.length === 1 ? "equipo" : "equipos"} · ${teacher} · ${course}`,
    })
    setBatch([])
    setTeacher("")
    setCourse("")
    setError(null)
    setQuery("")
    setShowScanner(false)
    searchRef.current?.focus()
  }

  return (
    <>
      <PageHeader
        title="Préstamo por lote"
        description="Entrega masiva para un curso/grupo. Completá docente y curso, luego seleccioná los ítems."
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,380px)_minmax(0,1fr)]">
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="size-5" aria-hidden="true" />
                Datos del lote
              </CardTitle>
              <CardDescription>Docente y curso son obligatorios.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <div className="flex flex-col gap-2">
                <Label htmlFor="batch-teacher">Docente responsable *</Label>
                <NativeSelect id="batch-teacher" value={teacher} onChange={(e) => setTeacher(e.target.value)}>
                  <option value="">Seleccionar docente</option>
                  {(teachers || []).map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </NativeSelect>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="batch-course">Curso *</Label>
                <NativeSelect id="batch-course" value={course} onChange={(e) => setCourse(e.target.value)}>
                  <option value="">Seleccionar curso</option>
                  {COURSES.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </NativeSelect>
              </div>
            </CardContent>
          </Card>

          <Card className={cn(!canSearch && "opacity-70")}>
            <CardHeader>
              <CardTitle>Agregar equipos</CardTitle>
              <CardDescription>{canSearch ? "Buscá y agregá al lote." : "Completá docente y curso para habilitar."}</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="batch-search">Buscar</Label>
                <div className="relative">
                  <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                  <Input
                    ref={searchRef}
                    id="batch-search"
                    className="h-10 pl-8"
                    placeholder={canSearch ? "Nombre, código o categoría" : "Completá docente y curso primero"}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    disabled={!canSearch}
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
                          setQuery("")
                          setActiveIndex(-1)
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
                    <ul className="max-h-[320px] divide-y overflow-y-auto">
                      {suggestions.map((s, idx) => (
                        <li key={s.code}>
                          <button
                            type="button"
                            className={cn("flex w-full items-center justify-between gap-3 px-3 py-2 text-left hover:bg-muted", activeIndex === idx && "bg-muted")}
                            onMouseEnter={() => setActiveIndex(idx)}
                            onClick={() => { addItem(s); setQuery(""); setActiveIndex(-1); }}
                          >
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium">{s.name}</p>
                              <p className="truncate text-xs text-muted-foreground">{s.category} · {s.location}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-mono text-xs text-muted-foreground">{s.code}</p>
                              <p className="text-xs text-emerald-600">Agregar</p>
                            </div>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {canSearch && (
                <div className="flex flex-wrap items-center gap-2">
                  <Filter className="size-4 text-muted-foreground" />
                  {CATEGORIES.map((cat) => (
                    <Button key={cat} type="button" size="sm" variant={category === cat ? "default" : "outline"} onClick={() => setCategory(cat)}>
                      {cat}
                    </Button>
                  ))}
                </div>
              )}

              <div className="rounded-lg border">
                <button
                  type="button"
                  className="flex w-full items-center justify-between px-3 py-2 text-sm hover:bg-muted disabled:opacity-60"
                  onClick={() => setShowScanner((v) => !v)}
                  disabled={!canSearch}
                  aria-expanded={showScanner}
                >
                  <span className="font-medium">Código de barras (opcional)</span>
                  <ChevronDown className={cn("size-4 transition-transform", showScanner && "rotate-180")} aria-hidden="true" />
                </button>
                {showScanner && canSearch && (
                  <div className="border-t p-3">
                    <ItemScanner
                      label="Escanear equipos"
                      onScan={(i) => { addItem(i); setShowScanner(false); }}
                      suggestionFilter={(i) => i.status === "disponible" && i.category !== "Proyector"}
                      demoCodes={["NB-01", "NB-02", "NB-03"]}
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
              <CardTitle>Lote a entregar</CardTitle>
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
              <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed py-12 text-center text-muted-foreground">
                <PackageOpen className="size-8" aria-hidden="true" />
                <p>Agregá equipos desde el buscador o el escáner.</p>
              </div>
            ) : (
              <div className="flex max-h-[60vh] flex-col gap-2 overflow-y-auto pr-1">
                {batch.map((b) => (
                  <div key={b.code} className="flex items-center justify-between gap-3 rounded-lg border p-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{b.name}</p>
                      <p className="text-xs text-muted-foreground">{b.category} · {b.location} · <span className="font-mono">{b.code}</span></p>
                    </div>
                    <Button type="button" variant="ghost" size="icon" onClick={() => removeItem(b.code)} aria-label="Quitar">
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="hidden flex-col gap-2 border-t pt-4 xl:flex">
              <p className="text-center text-xs text-muted-foreground">Registrado por {user?.username ? ({ mgarcia: "Encargado 1", lperez: "Encargado 2", directora: "Directivo" } as any)[user.username] || user?.name : user?.name} · Turno {user?.shift}</p>
              <Button size="lg" className="h-11 w-full" onClick={confirm} disabled={batch.length === 0 || !teacher.trim() || !course.trim()}>
                <Check className="mr-2 size-4" aria-hidden="true" />
                Registrar lote ({batch.length})
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-40 border-t bg-background/95 p-3 backdrop-blur xl:hidden">
        <div className="mx-auto flex max-w-6xl items-center gap-2">
          <div className="flex-1 text-sm">
            <span className="font-semibold">{batch.length}</span> {batch.length === 1 ? "ítem" : "ítems"} seleccionado{batch.length === 1 ? "" : "s"}
            {teacher && course ? ` · ${teacher} · ${course}` : ""}
          </div>
          <Button size="sm" className="h-9" onClick={confirm} disabled={batch.length === 0 || !teacher.trim() || !course.trim()}>
            <Check className="mr-1 size-4" />
            Registrar lote
          </Button>
        </div>
      </div>
    </>
  )
}
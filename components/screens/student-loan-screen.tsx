"use client"

import { Suspense, useEffect, useMemo, useRef, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Check, ChevronDown, PackageOpen, Search, X } from "lucide-react"
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
import { COURSES } from "@/lib/mock-data"
import type { Item } from "@/lib/types"
import { cn } from "@/lib/utils"

const LOGIN_LABELS: Record<string, string> = {
  mgarcia: "Encargado 1",
  lperez: "Encargado 2",
  directora: "Directivo",
}

function StudentLoanInner() {
  const { lendToStudent, user, items, teachers } = useStore()
  const searchParams = useSearchParams()
  const scannerRef = useRef<HTMLInputElement>(null)
  const studentRef = useRef<HTMLInputElement>(null)
  const [selected, setSelected] = useState<Item[]>([])
  const [student, setStudent] = useState("")
  const [course, setCourse] = useState("")
  const [teacher, setTeacher] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [query, setQuery] = useState("")
  const [showScanner, setShowScanner] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)

  useEffect(() => {
    const code = searchParams.get("code")
    if (code && selected.length === 0) {
      const found = items.find((i) => i.code.toLowerCase() === code.toLowerCase())
      if (found && found.category !== "Proyector") {
        setSelected([found])
        setTimeout(() => studentRef.current?.focus(), 0)
      }
    }
  }, [searchParams])

  const suggestions = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return []
    return items
      .filter((i) => i.category !== "Proyector")
      .filter((i) => i.status === "disponible")
      .filter((i) => !selected.some((s) => s.code === i.code))
      .filter((i) => i.code.toLowerCase().includes(q) || i.name.toLowerCase().includes(q))
      .slice(0, 12)
  }, [items, query, selected])

  useEffect(() => {
    setActiveIndex(-1)
  }, [query, suggestions.length])

  function reset() {
    setSelected([])
    setStudent("")
    setCourse("")
    setTeacher("")
    setError(null)
    setSubmitted(false)
    setQuery("")
    setShowScanner(false)
  }

  function addItem(i: Item) {
    if (selected.some((s) => s.code === i.code)) {
      setError(`${i.code} ya está en la lista.`)
      return
    }
    if (i.status !== "disponible") {
      setError(`${i.name} (${i.code}) no está disponible.`)
      toast.error("No se puede agregar", { description: `${i.code} figura como ${i.status}.` })
      return
    }
    setError(null)
    setSelected((prev) => [...prev, i])
    setQuery("")
    if (selected.length === 0) setTimeout(() => studentRef.current?.focus(), 0)
  }

  function removeItem(code: string) {
    setSelected((prev) => prev.filter((s) => s.code !== code))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitted(true)
    if (selected.length === 0) return setError("Seleccioná al menos una herramienta.")
    if (!student.trim()) return setError("Ingresá el nombre y apellido de quien se lleva las herramientas.")
    const result = lendToStudent({ itemCodes: selected.map((s) => s.code), studentName: student.trim(), course, teacher })
    if (!result.ok) return setError(result.error)
    toast.success("Préstamo registrado", {
      description: `${selected.length} ${selected.length === 1 ? "herramienta" : "herramientas"} · ${student.trim()}${course ? ` (${course})` : ""}`,
    })
    reset()
  }

  return (
    <>
      <PageHeader
        title="Nuevo préstamo"
        description="Cargá los datos de quien retira y agregá todas las herramientas que se lleva."
      />
      <form onSubmit={handleSubmit} noValidate className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>1. Herramientas a prestar</CardTitle>
            <CardDescription>Podés agregar una o varias por nombre o escaneo.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="item-search">Buscar por nombre o código</Label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                <Input
                  id="item-search"
                  className="h-10 pl-8"
                  placeholder="Ej: Alargue, Zapatilla, Cable HDMI..."
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
                  <ul className="max-h-[min(320px,40vh)] divide-y overflow-y-auto overscroll-contain">
                    {suggestions.map((s, idx) => (
                      <li key={s.code}>
                        <button
                          type="button"
                          className={cn("flex w-full items-center justify-between px-3 py-2 text-left hover:bg-muted", activeIndex === idx && "bg-muted")}
                          onMouseEnter={() => setActiveIndex(idx)}
                          onClick={() => addItem(s)}
                        >
                          <div>
                            <p className="text-sm font-medium">{s.name}</p>
                            <p className="text-xs text-muted-foreground">{s.category} · {s.location}</p>
                          </div>
                          <p className="font-mono text-xs text-muted-foreground">{s.code}</p>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="rounded-lg border">
              <button type="button" className="flex w-full items-center justify-between px-3 py-2 text-sm font-medium hover:bg-muted" onClick={() => setShowScanner((v) => !v)}>
                <span>¿Tiene código de barras? Escanear (opcional)</span>
                <ChevronDown className={cn("size-4 transition-transform", showScanner && "rotate-180")} aria-hidden="true" />
              </button>
              {showScanner && (
                <div className="border-t p-3">
                  <ItemScanner ref={scannerRef} onScan={(i) => { addItem(i); setShowScanner(false); }} suggestionFilter={(i) => i.category !== "Proyector" && i.status === "disponible"} demoCodes={["AT-0001", "AT-0006", "AT-0009"]} />
                </div>
              )}
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <p className="text-sm font-medium">Lista ({selected.length})</p>
                {selected.length > 0 && <Button type="button" variant="ghost" size="sm" onClick={() => setSelected([])}>Vaciar</Button>}
              </div>
              {selected.length === 0 ? (
                <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed py-8 text-center text-muted-foreground">
                  <PackageOpen className="size-8" aria-hidden="true" />
                  <p>Agregá al menos una herramienta para prestar.</p>
                </div>
              ) : (
                <ul className="flex flex-col gap-2">
                  {selected.map((item) => (
                    <li key={item.code} className="relative">
                      <ItemSummary item={item} />
                      <Button type="button" variant="ghost" size="icon" className="absolute right-2 top-2" onClick={() => removeItem(item.code)} aria-label="Quitar">
                        <X className="size-4" />
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>2. Datos de quien retira</CardTitle>
            <CardDescription>Registrado por {user?.username ? LOGIN_LABELS[user.username] || user?.name : user?.name} · Turno {user?.shift}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="student">Nombre y apellido *</Label>
              <Input ref={studentRef} id="student" className="h-10" value={student} aria-invalid={submitted && !student.trim()} onChange={(e) => setStudent(e.target.value)} placeholder="Quién se lleva las herramientas" />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="course">Curso (opcional)</Label>
              <NativeSelect id="course" value={course} onChange={(e) => setCourse(e.target.value)}>
                <option value="">Sin curso</option>
                {COURSES.map((c) => (<option key={c}>{c}</option>))}
              </NativeSelect>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="teacher">Docente que autoriza (opcional)</Label>
              <NativeSelect id="teacher" value={teacher} onChange={(e) => setTeacher(e.target.value)}>
                <option value="">Sin docente</option>
                {(teachers || []).map((t) => (<option key={t}>{t}</option>))}
              </NativeSelect>
            </div>

            {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}

            <div className="flex gap-2">
              <Button type="submit" size="lg" className="h-11 flex-1" disabled={selected.length === 0}>
                <Check data-icon="inline-start" aria-hidden="true" />
                Confirmar préstamo ({selected.length})
              </Button>
              <Button type="button" variant="outline" size="lg" className="h-11" onClick={reset}>Limpiar</Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </>
  )
}

export function StudentLoanScreen() {
  return (
    <Suspense fallback={null}>
      <StudentLoanInner />
    </Suspense>
  )
}
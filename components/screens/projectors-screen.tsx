"use client"

import { useMemo, useState } from "react"
import { CalendarCheck, ChevronLeft, ChevronRight, Trash2, X } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { NativeSelect } from "@/components/native-select"
import { PageHeader } from "@/components/page-header"
import { useStore } from "@/lib/store"
import { COURSES, SLOTS, getWeekDays, toDateKey } from "@/lib/mock-data"
import { cn } from "@/lib/utils"

type Selection = { date: string; slot: number }

export function ProjectorsScreen() {
  const { items, reservations, reserveProjectorMany, cancelReservation, teachers } = useStore()
  const projectors = items.filter((i) => i.category === "Proyector")
  const [projector, setProjector] = useState(projectors[0]?.code ?? "")
  const [weekOffset, setWeekOffset] = useState(0)
  const [selectedSlots, setSelectedSlots] = useState<Selection[]>([])
  const [viewingReservation, setViewingReservation] = useState<Selection | null>(null)
  const [teacher, setTeacher] = useState("")
  const [course, setCourse] = useState("")
  const [error, setError] = useState<string | null>(null)

  const days = useMemo(() => {
    const ref = new Date()
    ref.setDate(ref.getDate() + weekOffset * 7)
    return getWeekDays(ref)
  }, [weekOffset])

  const now = new Date()
  const todayKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`
  const findReservation = (date: string, slot: number) =>
    reservations.find((r) => r.projectorCode === projector && r.date === date && r.slot === slot)

  const viewingReservationData = viewingReservation ? findReservation(viewingReservation.date, viewingReservation.slot) : undefined
  const viewingDay = viewingReservation ? days.find((d) => toDateKey(d) === viewingReservation.date) : undefined

  const selectedGrouped = useMemo(() => {
    const map = new Map<string, number[]>()
    for (const s of selectedSlots) {
      if (!map.has(s.date)) map.set(s.date, [])
      map.get(s.date)!.push(s.slot)
    }
    const entries = Array.from(map.entries())
    entries.sort(([a], [b]) => a.localeCompare(b))
    for (const [, slots] of entries) slots.sort((a, b) => a - b)
    return entries
  }, [selectedSlots])

  function toggleSlot(date: string, slot: number) {
    if (date < todayKey) {
      setViewingReservation({ date, slot })
      setError("No se pueden reservar horarios pasados.")
      return
    }
    const res = findReservation(date, slot)
    if (res) {
      setViewingReservation({ date, slot })
      setError("Ese horario ya está ocupado.")
      return
    }
    setViewingReservation(null)
    setError(null)
    setSelectedSlots((prev) => {
      const exists = prev.some((s) => s.date === date && s.slot === slot)
      if (exists) return prev.filter((s) => !(s.date === date && s.slot === slot))
      return [...prev, { date, slot }]
    })
  }

  function clearSelection() {
    setSelectedSlots([])
    setError(null)
  }

  function confirm() {
    if (selectedSlots.length === 0) return
    if (!teacher || !course) return setError("Elegí el docente y el curso.")
    for (const s of selectedSlots) {
      if (s.date < todayKey) {
        setError("No se pueden reservar horarios pasados.")
        return
      }
      if (findReservation(s.date, s.slot)) {
        setError("Uno de los horarios seleccionados ya está ocupado.")
        return
      }
    }
    const result = reserveProjectorMany({ projectorCode: projector, slots: selectedSlots, teacher, course })
    if (!result.ok) {
      setError(result.error)
      toast.error(result.error)
      return
    }
    toast.success(selectedSlots.length === 1 ? "Proyector reservado" : "Proyectores reservados", {
      description: `${teacher} · ${selectedSlots.length} ${selectedSlots.length === 1 ? "bloque" : "bloques"}`,
    })
    setSelectedSlots([])
    setViewingReservation(null)
    setTeacher("")
    setCourse("")
    setError(null)
  }

  return (
    <>
      <PageHeader
        title="Reservas de proyectores"
        description="Reservá un proyector por fecha, horario, docente y curso."
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
        <Card>
          <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex w-full flex-col gap-2 sm:w-64">
              <Label htmlFor="projector">Proyector</Label>
              <NativeSelect
                id="projector"
                value={projector}
                onChange={(e) => {
                setProjector(e.target.value)
                setSelectedSlots([])
                setViewingReservation(null)
                setError(null)
              }}
              >
                {projectors.map((p) => (
                  <option key={p.code} value={p.code}>
                    {p.code} · {p.name}
                  </option>
                ))}
              </NativeSelect>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={() => setWeekOffset((w) => w - 1)} aria-label="Semana anterior">
                <ChevronLeft aria-hidden="true" />
              </Button>
              <span className="min-w-40 text-center text-sm font-medium tabular-nums">
                {days[0].toLocaleDateString("es-AR", { day: "2-digit", month: "short" })} –{" "}
                {days[4].toLocaleDateString("es-AR", { day: "2-digit", month: "short" })}
              </span>
              <Button variant="outline" size="icon" onClick={() => setWeekOffset((w) => w + 1)} aria-label="Semana siguiente">
                <ChevronRight aria-hidden="true" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full min-w-[560px] table-fixed border-separate border-spacing-1 text-sm">
              <caption className="sr-only">Disponibilidad semanal del proyector {projector}</caption>
              <thead>
                <tr>
                  <th scope="col" className="w-24 text-left text-xs font-medium text-muted-foreground">
                    Módulo
                  </th>
                  {days.map((d) => {
                    const key = toDateKey(d)
                    return (
                      <th
                        key={key}
                        scope="col"
                        className={cn(
                          "rounded-md py-2 text-center font-medium capitalize",
                          key === todayKey && "bg-primary text-primary-foreground",
                        )}
                      >
                        {d.toLocaleDateString("es-AR", { weekday: "short", day: "2-digit" })}
                      </th>
                    )
                  })}
                </tr>
              </thead>
              <tbody>
                {SLOTS.map((slotLabel, slot) => (
                  <tr key={slotLabel}>
                    <th scope="row" className="pr-2 text-left text-xs font-medium tabular-nums text-muted-foreground">
                      {slotLabel}
                    </th>
                    {days.map((d) => {
                      const date = toDateKey(d)
                      const res = findReservation(date, slot)
                      const isSelected = selectedSlots.some((s) => s.date === date && s.slot === slot)
                      return (
                        <td key={date} className="p-0">
                          <button
                            type="button"
                            onClick={() => toggleSlot(date, slot)}
                            aria-pressed={isSelected}
                            aria-label={`${d.toLocaleDateString("es-AR", { weekday: "long", day: "numeric" })}, ${slotLabel}: ${res ? `ocupado por ${res.teacher}` : isSelected ? "seleccionado para reservar" : "libre"}`}
                            className={cn(
                              "flex h-14 w-full flex-col items-start justify-center rounded-md border px-2 text-left text-xs transition-colors focus-visible:outline-2 focus-visible:outline-ring",
                              res
                                ? "border-destructive/25 bg-destructive/8 text-destructive"
                                : isSelected
                                  ? "border-primary bg-primary/10 text-primary hover:bg-primary/15"
                                  : "border-success/30 bg-success/8 text-success hover:bg-success/15",
                              isSelected && "ring-2 ring-primary ring-offset-1",
                            )}
                          >
                            {res ? (
                              <>
                                <span className="line-clamp-1 font-semibold">{res.teacher.replace("Prof. ", "")}</span>
                                <span className="opacity-80">{res.course}</span>
                              </>
                            ) : (
                              <span className="font-medium">Libre</span>
                            )}
                          </button>
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>

        <Card className="h-fit">
          <CardHeader>
            <CardTitle>Reserva de proyectores</CardTitle>
            <CardDescription>
              {selectedSlots.length > 0
                ? `${selectedSlots.length} ${selectedSlots.length === 1 ? "bloque seleccionado" : "bloques seleccionados"}`
                : viewingReservation && viewingDay
                  ? `${viewingDay.toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long" })} · ${SLOTS[viewingReservation.slot]}`
                  : "Seleccioná uno o varios horarios libres."}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {selectedSlots.length === 0 && !viewingReservation && (
              <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed py-8 text-center text-sm text-muted-foreground">
                <CalendarCheck className="size-8" aria-hidden="true" />
                <p>Verde = libre · Azul = seleccionado · Rojo = ocupado</p>
                <p>Podés seleccionar varios bloques a la vez.</p>
              </div>
            )}

            {selectedSlots.length > 0 && (
              <>
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">Bloques a reservar</p>
                    <Button variant="ghost" size="sm" onClick={clearSelection}>
                      <X className="mr-2 size-4" aria-hidden="true" />
                      Limpiar
                    </Button>
                  </div>
                  <div className="flex max-h-40 flex-col gap-2 overflow-y-auto rounded-lg border">
                    {selectedGrouped.map(([dateKey, slots]) => {
                      const day = days.find((d) => toDateKey(d) === dateKey)
                      return (
                        <div key={dateKey} className="flex flex-col gap-1 px-3 py-2">
                          <p className="text-sm font-medium capitalize">{day ? day.toLocaleDateString("es-AR", { weekday: "long", day: "2-digit", month: "2-digit" }) : dateKey}</p>
                          <div className="flex flex-wrap gap-2">
                            {slots.map((s) => (
                              <button
                                key={`${dateKey}-${s}`}
                                type="button"
                                onClick={() => toggleSlot(dateKey, s)}
                                className="flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs hover:bg-destructive/10 hover:text-destructive"
                              >
                                {SLOTS[s]}
                                <X className="size-3" />
                              </button>
                            ))}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="res-teacher">Docente</Label>
                  <NativeSelect id="res-teacher" value={teacher} onChange={(e) => setTeacher(e.target.value)}>
                    <option value="">Elegí un docente</option>
                    {(teachers || []).map((t) => (
                      <option key={t}>{t}</option>
                    ))}
                  </NativeSelect>
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="res-course">Curso</Label>
                  <NativeSelect id="res-course" value={course} onChange={(e) => setCourse(e.target.value)}>
                    <option value="">Elegí un curso</option>
                    {COURSES.map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </NativeSelect>
                </div>
                {error && (
                  <Alert variant="destructive" role="alert">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                <Button size="lg" className="h-11" onClick={confirm} disabled={!teacher || !course}>
                  <CalendarCheck data-icon="inline-start" aria-hidden="true" />
                  Reservar {selectedSlots.length} {selectedSlots.length === 1 ? "bloque" : "bloques"}
                </Button>
              </>
            )}

            {selectedSlots.length === 0 && viewingReservation && (
              <>
                {viewingReservation.date < todayKey ? (
                  <Alert variant="destructive" role="alert">
                    <AlertDescription>No se pueden reservar horarios pasados.</AlertDescription>
                  </Alert>
                ) : viewingReservationData ? (
                  <>
                    <Alert variant="destructive" role="alert">
                      <AlertDescription>
                        Ocupado por {viewingReservationData.teacher} ({viewingReservationData.course})
                      </AlertDescription>
                    </Alert>
                    <Button
                      variant="outline"
                      onClick={() => {
                        cancelReservation(viewingReservationData.id)
                        setError(null)
                        toast("Reserva liberada")
                      }}
                    >
                      <Trash2 data-icon="inline-start" aria-hidden="true" />
                      Liberar este horario
                    </Button>
                  </>
                ) : (
                  <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed py-6 text-center text-sm text-muted-foreground">
                    <p>Este horario está libre.</p>
                    <Button size="sm" onClick={() => toggleSlot(viewingReservation.date, viewingReservation.slot)}>
                      Agregar a la selección
                    </Button>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  )
}

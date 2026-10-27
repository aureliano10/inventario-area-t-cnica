"use client"

import { useMemo, useState } from "react"
import { CalendarCheck, ChevronLeft, ChevronRight, Trash2 } from "lucide-react"
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
  const { items, reservations, reserveProjector, cancelReservation, teachers } = useStore()
  const projectors = items.filter((i) => i.category === "Proyector")
  const [projector, setProjector] = useState(projectors[0]?.code ?? "")
  const [weekOffset, setWeekOffset] = useState(0)
  const [selected, setSelected] = useState<Selection | null>(null)
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

  const selectedReservation = selected ? findReservation(selected.date, selected.slot) : undefined
  const selectedDay = selected ? days.find((d) => toDateKey(d) === selected.date) : undefined

  function confirm() {
    if (!selected) return
    if (!teacher || !course) return setError("Elegí el docente y el curso.")
    // No permitir reservar en fechas pasadas
    if (selected.date < todayKey) {
      setError("No se pueden reservar horarios pasados.")
      toast.error("No se pueden reservar horarios pasados.")
      return
    }
    const result = reserveProjector({ projectorCode: projector, date: selected.date, slot: selected.slot, teacher, course })
    if (!result.ok) {
      setError(result.error)
      toast.error(result.error)
      return
    }
    toast.success("Proyector reservado", { description: `${teacher} · ${SLOTS[selected.slot]}` })
    setSelected(null)
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
                  setSelected(null)
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
                      const isSelected = selected?.date === date && selected.slot === slot
                      return (
                        <td key={date} className="p-0">
                          <button
                            type="button"
                            onClick={() => {
                              if (date < todayKey && !res) {
                                setSelected({ date, slot })
                                setError("No se pueden reservar horarios pasados.")
                                return
                              }
                              setSelected({ date, slot })
                              setError(res ? "Ese horario ya está ocupado. Elegí otro." : null)
                            }}
                            aria-pressed={isSelected}
                            aria-label={`${d.toLocaleDateString("es-AR", { weekday: "long", day: "numeric" })}, ${slotLabel}: ${res ? `ocupado por ${res.teacher}` : "libre"}`}
                            className={cn(
                              "flex h-14 w-full flex-col items-start justify-center rounded-md border px-2 text-left text-xs transition-colors focus-visible:outline-2 focus-visible:outline-ring",
                              res
                                ? "border-destructive/25 bg-destructive/8 text-destructive"
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
            <CardTitle>Detalle de la reserva</CardTitle>
            <CardDescription>
              {selected && selectedDay
                ? `${selectedDay.toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long" })} · ${SLOTS[selected.slot]}`
                : "Tocá un horario de la grilla."}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {!selected && (
              <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed py-8 text-center text-sm text-muted-foreground">
                <CalendarCheck className="size-8" aria-hidden="true" />
                Verde = libre · Rojo = ocupado
              </div>
            )}

            {selected && selectedReservation && (
              <>
                <Alert variant="destructive" role="alert">
                  <AlertDescription>
                    Ocupado por {selectedReservation.teacher} ({selectedReservation.course}). Elegí otro horario.
                  </AlertDescription>
                </Alert>
                <Button
                  variant="outline"
                  onClick={() => {
                    cancelReservation(selectedReservation.id)
                    setError(null)
                    toast("Reserva liberada")
                  }}
                >
                  <Trash2 data-icon="inline-start" aria-hidden="true" />
                  Liberar este horario
                </Button>
              </>
            )}

            {selected && !selectedReservation && (
              <>
                {selected.date < todayKey ? (
                  <Alert variant="destructive" role="alert">
                    <AlertDescription>No se pueden reservar horarios pasados.</AlertDescription>
                  </Alert>
                ) : (
                  <>
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
                    <Button size="lg" className="h-11" onClick={confirm}>
                      <CalendarCheck data-icon="inline-start" aria-hidden="true" />
                      Reservar
                    </Button>
                  </>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  )
}

"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { AlertTriangle, CalendarCheck, CheckCircle2, ClipboardList, History, Package, ScanSearch, Search, Undo2, UserPlus, Users, X } from "lucide-react"
import { buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { formatDateTime, useStore } from "@/lib/store"
import { toDateKey } from "@/lib/mock-data"
import { cn } from "@/lib/utils"

type StatKey = "prestados" | "disponibles" | "danados" | "reservas" | null

export function PanelScreen() {
  const { user, loans, items, reservations } = useStore()
  const [query, setQuery] = useState("")
  const [activeStat, setActiveStat] = useState<StatKey>(null)
  const isEncargado = user?.role === "encargado"

  const active = useMemo(
    () =>
      loans
        .filter((l) => !l.returnedAt)
        .map((l) => ({ loan: l, item: items.find((i) => i.code === l.itemCode)! }))
        .sort((a, b) => a.loan.startedAt.localeCompare(b.loan.startedAt)),
    [loans, items],
  )

  const todayKey = toDateKey(new Date())
  // La distinción por turno es operativa del encargado que registra préstamos.
  // El directivo solo consulta, por lo que no se le marcan préstamos como "de otro turno".
  const isInherited = (startedAt: string, shift: string) =>
    isEncargado && (toDateKey(new Date(startedAt)) !== todayKey || shift !== user?.shift)
  const inherited = active.filter(({ loan }) => isInherited(loan.startedAt, loan.shift))

  const filtered = active.filter(({ loan, item }) => {
    const q = query.trim().toLowerCase()
    if (!q) return true
    return [item.code, item.name, loan.borrowerName, loan.course ?? "", loan.authorizedBy ?? ""].some((v) =>
      v.toLowerCase().includes(q),
    )
  })

  const disponibles = items.filter((i) => i.status === "disponible")
  const danados = items.filter((i) => i.status === "dañado")
  const reservasHoy = reservations.filter((r) => r.date === todayKey)

  const stats = [
    { key: "prestados" as const, label: "Prestados ahora", value: active.length, icon: Package, bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-700", iconBg: "bg-amber-100", iconText: "text-amber-700" },
    { key: "disponibles" as const, label: "Disponibles", value: disponibles.length, icon: CheckCircle2, bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-700", iconBg: "bg-emerald-100", iconText: "text-emerald-700" },
    { key: "danados" as const, label: "Dañados", value: danados.length, icon: AlertTriangle, bg: "bg-rose-50", border: "border-rose-200", text: "text-rose-700", iconBg: "bg-rose-100", iconText: "text-rose-700" },
    { key: "reservas" as const, label: "Reservas de proyectores hoy", value: reservasHoy.length, icon: CalendarCheck, bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-700", iconBg: "bg-blue-100", iconText: "text-blue-700" },
  ]

  return (
    <>
      <PageHeader
        title="Panel"
        description={`Bienvenido/a, ${user?.username === "mgarcia" ? "Encargado 1" : user?.username === "lperez" ? "Encargado 2" : user?.username === "directora" ? "Directivo" : user?.name.split(" ")[0]}. Préstamos activos y estado del inventario.`}
      />

      {isEncargado && (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {[
            { href: "/prestamos/simple", label: "Préstamo simple", icon: UserPlus },
            { href: "/prestamos/lote", label: "Préstamo por lote", icon: ClipboardList },
            { href: "/devolucion", label: "Devoluciones", icon: Undo2 },
            { href: "/consulta", label: "Consulta rápida", icon: ScanSearch },
          ].map((a) => (
            <Link
              key={a.href}
              href={a.href}
              className="group flex flex-col items-center justify-center gap-2 rounded-lg border border-primary/20 bg-primary/5 p-3 text-center transition-colors hover:border-primary/40 hover:bg-primary/10 focus-visible:outline-2 focus-visible:outline-ring sm:p-4"
            >
              <div className="flex size-10 items-center justify-center rounded-full bg-primary/15 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                <a.icon className="size-5" aria-hidden="true" />
              </div>
              <span className="text-sm font-semibold">{a.label}</span>
            </Link>
          ))}
        </div>
      )}

      <div className="grid grid-cols-2 gap-2 sm:gap-3 xl:grid-cols-4">
        {stats.map((s) => (
          <button
            key={s.key}
            type="button"
            onClick={() => setActiveStat(s.key)}
            className={cn(
              "group flex items-center gap-3 rounded-lg border p-3 text-left transition-all hover:shadow-sm focus-visible:outline-2 focus-visible:outline-ring sm:p-4",
              s.bg,
              s.border,
            )}
          >
            <div className={cn("flex size-10 shrink-0 items-center justify-center rounded-full sm:size-11", s.iconBg)}>
              <s.icon className={cn("size-5", s.iconText)} aria-hidden="true" />
            </div>
            <div className="min-w-0 flex-1">
              <p className={cn("text-xs font-medium sm:text-sm", s.text)}>{s.label}</p>
              <p className={cn("text-2xl font-semibold tabular-nums leading-tight sm:text-3xl", s.text)}>{s.value}</p>
            </div>
          </button>
        ))}
      </div>

      {inherited.length > 0 && (
        <Alert className="border-warning/60 bg-warning/10">
          <History aria-hidden="true" />
          <AlertTitle>
            {inherited.length} {inherited.length === 1 ? "préstamo viene" : "préstamos vienen"} de otro turno
          </AlertTitle>
          <AlertDescription>
            Quedaron sin devolver en turnos anteriores. Están marcados con la etiqueta &quot;Otro turno&quot; en la
            lista.
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-base">Préstamos pendientes</CardTitle>
            <p className="text-sm text-muted-foreground">{active.length} {active.length === 1 ? "equipo sin devolver" : "equipos sin devolver"}</p>
          </div>
          <div className="relative w-full sm:w-72">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <Input
              aria-label="Buscar en préstamos activos"
              placeholder="Buscar por equipo, alumno o docente..."
              className="h-9 pl-8"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          {active.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-12 text-center">
              <CheckCircle2 className="size-10 text-success" aria-hidden="true" />
              <p className="font-medium">El inventario está completo, no hay préstamos activos.</p>
            </div>
          ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Herramienta</TableHead>
                <TableHead>Lo tiene</TableHead>
                <TableHead className="hidden lg:table-cell">Autorizó</TableHead>
                <TableHead className="hidden md:table-cell">Ubicación</TableHead>
                <TableHead>Desde</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(({ loan, item }) => (
                <TableRow key={loan.id}>
                  <TableCell>
                    <p className="font-medium">{item.name}</p>
                    <p className="font-mono text-xs text-muted-foreground">{item.code}</p>
                  </TableCell>
                  <TableCell>
                    <p className="font-medium">{loan.borrowerName}</p>
                    <p className="text-xs text-muted-foreground">
                      {loan.borrowerType === "alumno" ? `Alumno${loan.course ? ` · ${loan.course}` : ""}` : loan.batchId ? `Docente · Lote ${loan.batchId}` : "Docente"}
                    </p>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">{loan.authorizedBy ?? "—"}</TableCell>
                  <TableCell className="hidden md:table-cell">
                    {item.location}
                    <span className="block text-xs text-muted-foreground">{item.sector}</span>
                  </TableCell>
                  <TableCell>
                    <span className="tabular-nums">{formatDateTime(loan.startedAt)}</span>
                    {isInherited(loan.startedAt, loan.shift) && (
                      <span className="mt-1 block w-fit rounded bg-warning/25 px-1.5 py-0.5 text-[11px] font-semibold text-warning-foreground">
                        Otro turno · {loan.shift}
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                    No hay resultados para &quot;{query}&quot;.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
          )}
        </CardContent>
      </Card>

      {activeStat === "prestados" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <Card className="max-h-[90vh] w-full max-w-4xl overflow-hidden">
            <CardHeader className="flex flex-row items-start justify-between gap-3">
              <div>
                <CardTitle>Préstamos activos</CardTitle>
                <p className="text-sm text-muted-foreground">{active.length} {active.length === 1 ? "equipo sin devolver" : "equipos sin devolver"}</p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setActiveStat(null)}>
                <X className="size-4" />
              </Button>
            </CardHeader>
            <CardContent className="max-h-[70vh] overflow-auto p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Equipo</TableHead>
                    <TableHead>Quien lo tiene</TableHead>
                    <TableHead className="hidden md:table-cell">Autorizó</TableHead>
                    <TableHead className="hidden lg:table-cell">Ubicación</TableHead>
                    <TableHead>Desde</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {active.map(({ loan, item }) => (
                    <TableRow key={loan.id}>
                      <TableCell>
                        <p className="font-medium">{item.name}</p>
                        <p className="font-mono text-xs text-muted-foreground">{item.code}</p>
                      </TableCell>
                      <TableCell>
                        <p className="font-medium">{loan.borrowerName}</p>
                        <p className="text-xs text-muted-foreground">
                          {loan.borrowerType === "alumno" ? `Alumno${loan.course ? ` · ${loan.course}` : ""}` : loan.batchId ? `Docente · Lote ${loan.batchId}` : "Docente"}
                        </p>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">{loan.authorizedBy ?? "—"}</TableCell>
                      <TableCell className="hidden lg:table-cell">
                        {item.location}
                        <span className="block text-xs text-muted-foreground">{item.sector}</span>
                      </TableCell>
                      <TableCell className="tabular-nums">{formatDateTime(loan.startedAt)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}

      {activeStat === "disponibles" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <Card className="max-h-[90vh] w-full max-w-3xl overflow-hidden">
            <CardHeader className="flex flex-row items-start justify-between gap-3">
              <div>
                <CardTitle>Equipos disponibles</CardTitle>
                <p className="text-sm text-muted-foreground">{disponibles.length} {disponibles.length === 1 ? "equipo disponible" : "equipos disponibles"}</p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setActiveStat(null)}>
                <X className="size-4" />
              </Button>
            </CardHeader>
            <CardContent className="max-h-[70vh] overflow-auto p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Código</TableHead>
                    <TableHead>Equipo</TableHead>
                    <TableHead className="hidden md:table-cell">Categoría</TableHead>
                    <TableHead className="hidden sm:table-cell">Ubicación</TableHead>
                    <TableHead>Sector</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {disponibles.map((i) => (
                    <TableRow key={i.code}>
                      <TableCell className="font-mono">{i.code}</TableCell>
                      <TableCell className="font-medium">{i.name}</TableCell>
                      <TableCell className="hidden md:table-cell">{i.category}</TableCell>
                      <TableCell className="hidden sm:table-cell">{i.location}</TableCell>
                      <TableCell>{i.sector}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}

      {activeStat === "danados" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <Card className="max-h-[90vh] w-full max-w-3xl overflow-hidden">
            <CardHeader className="flex flex-row items-start justify-between gap-3">
              <div>
                <CardTitle>Equipos dañados</CardTitle>
                <p className="text-sm text-muted-foreground">{danados.length} {danados.length === 1 ? "equipo fuera de servicio" : "equipos fuera de servicio"}</p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setActiveStat(null)}>
                <X className="size-4" />
              </Button>
            </CardHeader>
            <CardContent className="max-h-[70vh] overflow-auto p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Código</TableHead>
                    <TableHead>Equipo</TableHead>
                    <TableHead className="hidden md:table-cell">Categoría</TableHead>
                    <TableHead className="hidden sm:table-cell">Ubicación</TableHead>
                    <TableHead>Sector</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {danados.map((i) => (
                    <TableRow key={i.code}>
                      <TableCell className="font-mono">{i.code}</TableCell>
                      <TableCell className="font-medium">{i.name}</TableCell>
                      <TableCell className="hidden md:table-cell">{i.category}</TableCell>
                      <TableCell className="hidden sm:table-cell">{i.location}</TableCell>
                      <TableCell>{i.sector}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}

      {activeStat === "reservas" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <Card className="max-h-[90vh] w-full max-w-3xl overflow-hidden">
            <CardHeader className="flex flex-row items-start justify-between gap-3">
              <div>
                <CardTitle>Reservas de proyectores hoy</CardTitle>
                <p className="text-sm text-muted-foreground">{reservasHoy.length} {reservasHoy.length === 1 ? "reserva" : "reservas"} para el día de hoy</p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setActiveStat(null)}>
                <X className="size-4" />
              </Button>
            </CardHeader>
            <CardContent className="max-h-[70vh] overflow-auto p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Proyector</TableHead>
                    <TableHead>Docente</TableHead>
                    <TableHead>Curso</TableHead>
                    <TableHead>Horario</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reservasHoy
                    .slice()
                    .sort((a, b) => a.slot - b.slot)
                    .map((r) => (
                      <TableRow key={r.id}>
                        <TableCell className="font-medium">{r.projectorCode}</TableCell>
                        <TableCell>{r.teacher}</TableCell>
                        <TableCell>{r.course}</TableCell>
                        <TableCell>Hora {r.slot}</TableCell>
                      </TableRow>
                    ))}
                  {reservasHoy.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
                        No hay reservas para hoy
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  )
}

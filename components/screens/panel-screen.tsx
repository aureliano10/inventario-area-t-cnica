"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { CheckCircle2, History, ScanSearch, Search, Undo2, UserPlus, Users } from "lucide-react"
import { buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { PageHeader } from "@/components/page-header"
import { formatDateTime, useStore } from "@/lib/store"
import { toDateKey } from "@/lib/mock-data"
import { cn } from "@/lib/utils"

export function PanelScreen() {
  const { user, loans, items, reservations } = useStore()
  const [query, setQuery] = useState("")
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
  const isInherited = (startedAt: string, shift: string) =>
    toDateKey(new Date(startedAt)) !== todayKey || shift !== user?.shift
  const inherited = active.filter(({ loan }) => isInherited(loan.startedAt, loan.shift))

  const filtered = active.filter(({ loan, item }) => {
    const q = query.trim().toLowerCase()
    if (!q) return true
    return [item.code, item.name, loan.borrowerName, loan.course ?? "", loan.authorizedBy ?? ""].some((v) =>
      v.toLowerCase().includes(q),
    )
  })

  const stats = [
    { label: "Prestados ahora", value: active.length, className: "text-warning-foreground" },
    { label: "Disponibles", value: items.filter((i) => i.status === "disponible").length, className: "text-success" },
    { label: "Dañados", value: items.filter((i) => i.status === "dañado").length, className: "text-destructive" },
    { label: "Reservas de proyector hoy", value: reservations.filter((r) => r.date === todayKey).length, className: "text-primary" },
  ]

  return (
    <>
      <PageHeader
        title="Panel de préstamos activos"
        description={`Hola, ${user?.name.split(" ")[0]}. Esto es todo lo que falta devolver al inventario.`}
      />

      {isEncargado && (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[
            { href: "/prestamos/alumno", label: "Nuevo préstamo", icon: UserPlus, primary: true },
            { href: "/prestamos/lote", label: "Préstamo por lote", icon: Users },
            { href: "/devolucion", label: "Devolución", icon: Undo2 },
            { href: "/consulta", label: "Consulta rápida", icon: ScanSearch },
          ].map((a) => (
            <Link
              key={a.href}
              href={a.href}
              className={cn(
                buttonVariants({ variant: a.primary ? "default" : "outline", size: "lg" }),
                "h-14 justify-start text-base",
              )}
            >
              <a.icon data-icon="inline-start" className="size-5" aria-hidden="true" />
              {a.label}
            </Link>
          ))}
        </div>
      )}

      <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label} className="py-4">
            <CardContent>
              <dt className="text-sm text-muted-foreground">{s.label}</dt>
              <dd className={cn("mt-1 text-3xl font-semibold tabular-nums", s.className)}>{s.value}</dd>
            </CardContent>
          </Card>
        ))}
      </dl>

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
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle>Equipos sin devolver</CardTitle>
          <div className="relative w-full sm:w-72">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <Input
              aria-label="Buscar en préstamos activos"
              placeholder="Buscar herramienta, alumno, docente…"
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
                        {loan.borrowerType === "alumno" ? `Alumno · ${loan.course}` : loan.batchId ? `Docente · Lote ${loan.batchId}` : "Docente"}
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
          )}
        </CardContent>
      </Card>
    </>
  )
}

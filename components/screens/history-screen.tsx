"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import { Download, ExternalLink, FileSearch, Search, X } from "lucide-react"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PageHeader } from "@/components/page-header"
import { formatDateTime, useStore } from "@/lib/store"
import { cn } from "@/lib/utils"
import { toDateKey } from "@/lib/mock-data"
import type { Item } from "@/lib/types"

export function HistoryScreen() {
  const { loans, items, damages } = useStore()
  const [query, setQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<"todos" | "activos" | "devueltos">("todos")
  const [typeFilter, setTypeFilter] = useState<"todos" | "alumnos" | "docentes">("todos")
  const [fromDate, setFromDate] = useState("")
  const [toDate, setToDate] = useState("")
  const [page, setPage] = useState(1)
  const pageSize = 25
  const [selectedLoanId, setSelectedLoanId] = useState<string | null>(null)
  const [selectedDamageId, setSelectedDamageId] = useState<string | null>(null)

  const hasActiveFilters = query.trim().length > 0 || statusFilter !== "todos" || typeFilter !== "todos" || fromDate !== "" || toDate !== ""

  function clearFilters() {
    setQuery("")
    setStatusFilter("todos")
    setTypeFilter("todos")
    setFromDate("")
    setToDate("")
    setPage(1)
  }

  const itemName = (code: string) => items.find((i) => i.code === code)?.name ?? code
  const itemSector = (code: string) => items.find((i) => i.code === code)?.sector ?? ""
  const itemStatusLabel = (status?: Item["status"]) =>
    status === "prestado" ? "Prestado" : status === "dañado" ? "Fuera de servicio (dañado)" : "En servicio"

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase()
    let list = [...loans].sort((a, b) => b.startedAt.localeCompare(a.startedAt))
    if (statusFilter === "activos") list = list.filter((l) => !l.returnedAt)
    if (statusFilter === "devueltos") list = list.filter((l) => !!l.returnedAt)
    if (typeFilter === "alumnos") list = list.filter((l) => l.borrowerType === "alumno")
    if (typeFilter === "docentes") list = list.filter((l) => l.borrowerType === "docente")
    if (fromDate) {
      list = list.filter((l) => toDateKey(new Date(l.startedAt)) >= fromDate)
    }
    if (toDate) {
      list = list.filter((l) => toDateKey(new Date(l.startedAt)) <= toDate)
    }
    if (q) {
      list = list.filter((l) => {
        const it = items.find((i) => i.code === l.itemCode)
        return (
          l.itemCode.toLowerCase().includes(q) ||
          it?.name.toLowerCase().includes(q) ||
          l.borrowerName.toLowerCase().includes(q) ||
          (l.course?.toLowerCase().includes(q) ?? false) ||
          (l.authorizedBy?.toLowerCase().includes(q) ?? false) ||
          (l.batchId?.toLowerCase().includes(q) ?? false) ||
          l.registeredBy.toLowerCase().includes(q)
        )
      })
    }
    return list.map((l) => {
      const it = items.find((i) => i.code === l.itemCode)
      return {
        loan: l,
        item: it,
        name: it?.name ?? l.itemCode,
        sector: it?.sector ?? itemSector(l.itemCode),
      }
    })
  }, [loans, items, query, statusFilter, typeFilter, fromDate, toDate])

  const total = rows.length
  const activosCount = useMemo(() => loans.filter((l) => !l.returnedAt).length, [loans])
  const devueltosCount = useMemo(() => loans.filter((l) => !!l.returnedAt).length, [loans])
  const danosCount = useMemo(() => loans.filter((l) => l.returnedAt && l.returnedCondition === "dañado").length, [loans])

  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const currentPage = Math.min(page, totalPages)
  const paged = useMemo(() => rows.slice((currentPage - 1) * pageSize, currentPage * pageSize), [rows, currentPage])

  const selected = useMemo(() => {
    if (!selectedLoanId) return null
    const loan = loans.find((l) => l.id === selectedLoanId)
    if (!loan) return null
    const item = items.find((i) => i.code === loan.itemCode)
    return { loan, item }
  }, [selectedLoanId, loans, items])

  const selectedDamage = useMemo(() => {
    if (!selectedDamageId) return null
    const damage = damages.find((d) => d.id === selectedDamageId)
    if (!damage) return null
    const item = items.find((i) => i.code === damage.itemCode)
    const history = damages.filter((d) => d.itemCode === damage.itemCode)
    return { damage, item, history }
  }, [selectedDamageId, damages, items])

  function exportCsv() {
    const headers = ["Codigo", "Equipo", "Quien lo pidio", "Tipo", "Curso", "Autorizo", "Sector", "Prestado", "Devuelto", "Estado", "Registrado por", "Turno", "Lote"]
    const lines = [headers.join(";")]
    for (const r of rows) {
      const l = r.loan
      const estado = l.returnedAt ? (l.returnedCondition === "dañado" ? "Devuelto - Dañado" : "Devuelto - Buen estado") : "Prestado"
      const tipo = l.borrowerType === "alumno" ? "Alumno" : "Docente"
      const curso = l.course ?? ""
      const auth = l.authorizedBy ?? ""
      const dev = l.returnedAt ? formatDateTime(l.returnedAt) : "Pendiente"
      const lote = l.batchId ?? ""
      const esc = (v: string) => `"${String(v).replaceAll('"', '""')}"`
      lines.push([l.itemCode, r.name, l.borrowerName, tipo, curso, auth, r.sector, formatDateTime(l.startedAt), dev, estado, l.registeredBy, l.shift, lote].map(esc).join(";"))
    }
    const blob = new Blob(["\uFEFF" + lines.join("\n")], { type: "text/csv;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `historial-${toDateKey(new Date())}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  function exportDamagesCsv() {
    const headers = ["Fecha", "Codigo", "Equipo", "Sector", "Descripcion", "Responsable", "Reportado por", "Estado", "Reparado el"]
    const esc = (v: string) => `"${String(v).replaceAll('"', '""')}"`
    const lines = [headers.join(";")]
    for (const d of damages) {
      lines.push(
        [
          formatDateTime(d.date),
          d.itemCode,
          itemName(d.itemCode),
          itemSector(d.itemCode),
          d.description,
          d.responsible,
          d.reportedBy,
          d.repairedAt ? "Reparado" : "Pendiente",
          d.repairedAt ? formatDateTime(d.repairedAt) : "—",
        ]
          .map(esc)
          .join(";"),
      )
    }
    const blob = new Blob(["\uFEFF" + lines.join("\n")], { type: "text/csv;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `historial-danos-${toDateKey(new Date())}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <>
      <PageHeader
        title="Historial"
        description="Préstamos registrados e historial de daños, con estado y condición."
      />

      <Tabs defaultValue="prestamos">
        <TabsList>
          <TabsTrigger value="prestamos">Préstamos</TabsTrigger>
          <TabsTrigger value="danos">Daños ({damages.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="prestamos" className="mt-4 flex flex-col gap-6">
      <Card>
        <CardHeader className="flex flex-col gap-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Filtros</CardTitle>
              <p className="text-sm text-muted-foreground">Busca, filtra por estado/tipo y acota por fecha de préstamo.</p>
            </div>
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <X className="mr-2 size-4" aria-hidden="true" />
                Limpiar filtros
              </Button>
            )}
          </div>
          <div className="flex flex-col items-center gap-4">
            <div className="relative w-full max-w-xl">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <Input
                placeholder="Buscar por alumno, docente, lote, código, equipo..."
                className="h-10 pl-8 text-center sm:text-left"
                value={query}
                onChange={(e) => { setQuery(e.target.value); setPage(1); }}
              />
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2">
              <span className="text-sm text-muted-foreground">Estado</span>
              <Button size="sm" variant={statusFilter === "todos" ? "default" : "outline"} onClick={() => { setStatusFilter("todos"); setPage(1); }}>Todos</Button>
              <Button size="sm" variant={statusFilter === "activos" ? "default" : "outline"} onClick={() => { setStatusFilter("activos"); setPage(1); }}>Activos</Button>
              <Button size="sm" variant={statusFilter === "devueltos" ? "default" : "outline"} onClick={() => { setStatusFilter("devueltos"); setPage(1); }}>Devueltos</Button>
              <div className="mx-1 hidden h-4 w-px bg-border sm:block" />
              <span className="text-sm text-muted-foreground">Tipo</span>
              <Button size="sm" variant={typeFilter === "todos" ? "default" : "outline"} onClick={() => { setTypeFilter("todos"); setPage(1); }}>Todos</Button>
              <Button size="sm" variant={typeFilter === "alumnos" ? "default" : "outline"} onClick={() => { setTypeFilter("alumnos"); setPage(1); }}>Alumnos</Button>
              <Button size="sm" variant={typeFilter === "docentes" ? "default" : "outline"} onClick={() => { setTypeFilter("docentes"); setPage(1); }}>Docentes</Button>
            </div>
            <div className="flex flex-wrap items-end justify-center gap-3">
              <div className="flex flex-col items-center gap-1.5 sm:items-start">
                <Label htmlFor="hist-from">Desde</Label>
                <Input id="hist-from" type="date" className="h-9 w-[160px]" value={fromDate} onChange={(e) => { setFromDate(e.target.value); setPage(1); }} />
              </div>
              <div className="flex flex-col items-center gap-1.5 sm:items-start">
                <Label htmlFor="hist-to">Hasta</Label>
                <Input id="hist-to" type="date" className="h-9 w-[160px]" value={toDate} onChange={(e) => { setToDate(e.target.value); setPage(1); }} />
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Registro completo</CardTitle>
            <p className="text-sm text-muted-foreground">
              {total === 0 ? "Sin resultados" : `${total} totales · ${activosCount} activos · ${danosCount} devueltos con daño`}
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={exportCsv} disabled={rows.length === 0}>
            <Download className="mr-2 size-4" aria-hidden="true" />
            Exportar CSV filtrado
          </Button>
        </CardHeader>
        <CardContent>
          <div className="hidden overflow-x-auto md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs uppercase tracking-wide text-muted-foreground">Equipo</TableHead>
                  <TableHead className="text-xs uppercase tracking-wide text-muted-foreground">Quien lo pidió</TableHead>
                  <TableHead className="hidden text-xs uppercase tracking-wide text-muted-foreground md:table-cell">Autorizó</TableHead>
                  <TableHead className="hidden text-xs uppercase tracking-wide text-muted-foreground lg:table-cell">Sector</TableHead>
                  <TableHead className="text-xs uppercase tracking-wide text-muted-foreground">Prestado</TableHead>
                  <TableHead className="text-xs uppercase tracking-wide text-muted-foreground">Devuelto</TableHead>
                  <TableHead className="text-xs uppercase tracking-wide text-muted-foreground">Estado</TableHead>
                  <TableHead className="hidden text-xs uppercase tracking-wide text-muted-foreground sm:table-cell">Registró</TableHead>
                  <TableHead className="hidden text-xs uppercase tracking-wide text-muted-foreground xl:table-cell">Lote</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paged.map(({ loan, name, sector }) => (
                  <TableRow key={loan.id} onClick={() => setSelectedLoanId(loan.id)} className={`cursor-pointer hover:bg-muted/40 ${!loan.returnedAt ? "border-l-2 border-l-amber-400" : ""}`}>
                    <TableCell>
                      <p className="font-medium">{name}</p>
                      <p className="font-mono text-xs text-muted-foreground">{loan.itemCode}</p>
                    </TableCell>
                    <TableCell>
                      <p className="font-medium">{loan.borrowerName}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-1.5">
                        <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-xs text-muted-foreground">
                          {loan.borrowerType === "alumno" ? "Alumno" : "Docente"}
                        </span>
                        {loan.course && <span className="text-xs text-muted-foreground">{loan.course}</span>}
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">{loan.authorizedBy ?? "—"}</TableCell>
                    <TableCell className="hidden lg:table-cell">{sector}</TableCell>
                    <TableCell className="tabular-nums">{formatDateTime(loan.startedAt)}</TableCell>
                    <TableCell className="tabular-nums">{loan.returnedAt ? formatDateTime(loan.returnedAt) : "—"}</TableCell>
                    <TableCell>
                      {loan.returnedAt ? (
                        loan.returnedCondition === "dañado" ? (
                          <span className="inline-flex items-center rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-medium text-destructive">Devuelto - Dañado</span>
                        ) : (
                          <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">Devuelto - Buen estado</span>
                        )
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-500/10 dark:text-amber-400">Prestado</span>
                      )}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <p className="font-medium">{loan.registeredBy}</p>
                      <p className="text-xs text-muted-foreground">{loan.shift}</p>
                    </TableCell>
                    <TableCell className="hidden xl:table-cell">
                      {loan.batchId ? (
                        <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-xs">Lote: {loan.batchId}</span>
                      ) : (
                        <span className="text-muted-foreground/70">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {paged.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={9} className="py-10 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <FileSearch className="size-8 text-muted-foreground" aria-hidden="true" />
                        <p className="text-base font-medium">Sin resultados</p>
                        <p className="text-sm text-muted-foreground">Probá ajustando los filtros o limpiándolos.</p>
                        {hasActiveFilters && (
                          <Button variant="outline" size="sm" className="mt-2" onClick={clearFilters}>
                            Limpiar filtros
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          <div className="flex flex-col gap-3 md:hidden">
            {paged.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-10 text-center">
                <FileSearch className="size-8 text-muted-foreground" aria-hidden="true" />
                <p className="text-base font-medium">Sin resultados</p>
                <p className="text-sm text-muted-foreground">Probá ajustando los filtros o limpiándolos.</p>
                {hasActiveFilters && (
                  <Button variant="outline" size="sm" className="mt-2" onClick={clearFilters}>
                    Limpiar filtros
                  </Button>
                )}
              </div>
            ) : (
              paged.map(({ loan, name, sector }) => (
                <Card key={loan.id} onClick={() => setSelectedLoanId(loan.id)} className={`cursor-pointer transition-colors hover:bg-muted/40 ${!loan.returnedAt ? "border-l-2 border-l-amber-400" : "border-border/70"}`}>
                  <CardContent className="flex flex-col gap-3 pt-4">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-medium">{name}</p>
                        <p className="font-mono text-xs text-muted-foreground">{loan.itemCode}</p>
                      </div>
                      {loan.returnedAt ? (
                        loan.returnedCondition === "dañado" ? (
                          <span className="inline-flex items-center rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-medium text-destructive">Devuelto - Dañado</span>
                        ) : (
                          <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">Devuelto - Buen estado</span>
                        )
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-500/10 dark:text-amber-400">Prestado</span>
                      )}
                    </div>
                    <div className="flex flex-col gap-1">
                      <p className="text-sm font-medium">{loan.borrowerName}</p>
                      <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                        <span>{loan.borrowerType === "alumno" ? "Alumno" : "Docente"}</span>
                        {loan.course && <span>· {loan.course}</span>}
                        {sector && <span>· {sector}</span>}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <p className="text-xs text-muted-foreground">Prestado</p>
                        <p className="tabular-nums">{formatDateTime(loan.startedAt)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Devuelto</p>
                        <p className="tabular-nums">{loan.returnedAt ? formatDateTime(loan.returnedAt) : "Pendiente"}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Registró</p>
                        <p>{loan.registeredBy} · {loan.shift}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Autorizó</p>
                        <p>{loan.authorizedBy ?? "—"}</p>
                      </div>
                    </div>
                    {loan.batchId && (
                      <div>
                        <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-xs">Lote: {loan.batchId}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
          {totalPages > 1 && (
            <div className="mt-4 flex flex-col items-center justify-between gap-2 rounded-lg border p-3 sm:flex-row">
              <p className="text-sm text-muted-foreground">
                Mostrando {(currentPage - 1) * pageSize + 1} - {Math.min(currentPage * pageSize, total)} de {total}
              </p>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" disabled={currentPage <= 1} onClick={() => setPage((p) => p - 1)}>Anterior</Button>
                <p className="text-sm text-muted-foreground">Página {currentPage} de {totalPages}</p>
                <Button variant="outline" size="sm" disabled={currentPage >= totalPages} onClick={() => setPage((p) => p + 1)}>Siguiente</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
        </TabsContent>

        <TabsContent value="danos" className="mt-4">
          <Card>
            <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle>Historial de daños</CardTitle>
                <p className="text-sm text-muted-foreground">
                  {damages.length === 0
                    ? "Sin daños registrados"
                    : `${damages.length} ${damages.length === 1 ? "daño registrado" : "daños registrados"} · ${damages.filter((d) => !d.repairedAt).length} sin reparar`}
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={exportDamagesCsv} disabled={damages.length === 0}>
                <Download className="mr-2 size-4" aria-hidden="true" />
                Exportar CSV
              </Button>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <p className="text-sm text-muted-foreground">Hacé clic en un registro para ver el detalle del daño.</p>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Equipo</TableHead>
                      <TableHead>Descripción</TableHead>
                      <TableHead className="hidden md:table-cell">Responsable</TableHead>
                      <TableHead>Estado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {damages.map((d) => (
                      <TableRow
                        key={d.id}
                        onClick={() => setSelectedDamageId(d.id)}
                        className="cursor-pointer hover:bg-muted/40"
                      >
                        <TableCell className="tabular-nums">{formatDateTime(d.date)}</TableCell>
                        <TableCell>
                          <p className="font-medium">{itemName(d.itemCode)}</p>
                          <p className="font-mono text-xs text-muted-foreground">{d.itemCode}</p>
                        </TableCell>
                        <TableCell className="max-w-xs whitespace-normal">{d.description}</TableCell>
                        <TableCell className="hidden whitespace-normal md:table-cell">
                          {d.responsible}
                          <span className="block text-xs text-muted-foreground">Registró: {d.reportedBy}</span>
                        </TableCell>
                        <TableCell>
                          <span
                            className={cn(
                              "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold",
                              d.repairedAt
                                ? "border-success/30 bg-success/12 text-success"
                                : "border-destructive/30 bg-destructive/10 text-destructive",
                            )}
                          >
                            {d.repairedAt ? "Reparado" : "Pendiente"}
                          </span>
                          {d.repairedAt && (
                            <span className="mt-1 block text-xs text-muted-foreground">
                              El {formatDateTime(d.repairedAt)}
                              {d.repairedBy ? ` · ${d.repairedBy}` : ""}
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                    {damages.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                          No hay daños registrados.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <Card className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden">
            <div className="flex items-start justify-between gap-3 border-b p-6">
              <div>
                <p className="text-lg font-semibold">{selected.item?.name ?? selected.loan.itemCode}</p>
                <p className="text-sm text-muted-foreground">
                  {selected.loan.itemCode} · {selected.item?.category} · {selected.item?.sector}
                </p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setSelectedLoanId(null)}>
                <X className="size-4" />
              </Button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <div className="flex flex-col gap-6 p-6">
                <div className="grid grid-cols-2 gap-3 rounded-lg border p-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Estado</p>
                    <p className="font-medium">
                      {selected.loan.returnedAt
                        ? selected.loan.returnedCondition === "dañado"
                          ? "Devuelto - Dañado"
                          : "Devuelto - Buen estado"
                        : "Prestado"}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Tipo</p>
                    <p className="font-medium">{selected.loan.borrowerType === "alumno" ? "Alumno" : "Docente"}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-muted-foreground">Quien lo pidió</p>
                    <p className="font-medium">{selected.loan.borrowerName}{selected.loan.course ? ` · ${selected.loan.course}` : ""}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Autorizó</p>
                    <p className="font-medium">{selected.loan.authorizedBy ?? "—"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Registró</p>
                    <p className="font-medium">{selected.loan.registeredBy} · {selected.loan.shift}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Prestado</p>
                    <p className="font-medium tabular-nums">{formatDateTime(selected.loan.startedAt)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Devuelto</p>
                    <p className="font-medium tabular-nums">{selected.loan.returnedAt ? formatDateTime(selected.loan.returnedAt) : "Pendiente"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Lote</p>
                    <p className="font-medium">{selected.loan.batchId ?? "—"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Sector</p>
                    <p className="font-medium">{selected.item?.sector ?? "—"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Ubicación</p>
                    <p className="font-medium">{selected.item?.location ?? "—"}</p>
                  </div>
                </div>
                <Link href="/inventario" className={buttonVariants({ variant: "outline" })}>
                  <ExternalLink className="mr-2 size-4" aria-hidden="true" />
                  Ver ficha del equipo en Inventario
                </Link>
              </div>
            </div>
          </Card>
        </div>
      )}

      {selectedDamage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <Card className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden">
            <div className="flex items-start justify-between gap-3 border-b p-6">
              <div>
                <p className="text-lg font-semibold">{selectedDamage.item?.name ?? selectedDamage.damage.itemCode}</p>
                <p className="text-sm text-muted-foreground">
                  {selectedDamage.damage.itemCode} · {selectedDamage.item?.category} · {selectedDamage.item?.sector}
                </p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setSelectedDamageId(null)}>
                <X className="size-4" />
              </Button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <div className="flex flex-col gap-6 p-6">
                <div className="grid grid-cols-2 gap-3 rounded-lg border p-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Estado del equipo</p>
                    <p className="font-medium">{itemStatusLabel(selectedDamage.item?.status)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Categoría</p>
                    <p className="font-medium">{selectedDamage.item?.category ?? "—"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Sector</p>
                    <p className="font-medium">{selectedDamage.item?.sector ?? "—"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Ubicación</p>
                    <p className="font-medium">{selectedDamage.item?.location ?? "—"}</p>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <p className="text-sm font-medium">
                    Historial de daños de este equipo ({selectedDamage.history.length})
                  </p>
                  <div className="flex flex-col gap-2">
                    {selectedDamage.history.map((d) => {
                      const isCurrent = d.id === selectedDamage.damage.id
                      return (
                        <div
                          key={d.id}
                          className={cn(
                            "rounded-md border p-3 text-sm",
                            d.repairedAt ? "border-success/30 bg-success/5" : "border-destructive/30 bg-destructive/5",
                            isCurrent && "ring-2 ring-ring",
                          )}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <p className={cn("font-medium", d.repairedAt ? "text-success" : "text-destructive")}>
                              {formatDateTime(d.date)}
                            </p>
                            <span className={cn("text-xs font-semibold", d.repairedAt ? "text-success" : "text-destructive")}>
                              {d.repairedAt ? "Reparado" : "Pendiente de reparación"}
                            </span>
                          </div>
                          <p>{d.description}</p>
                          <p className="text-xs text-muted-foreground">
                            Responsable: {d.responsible} · Reportó: {d.reportedBy}
                          </p>
                          {d.repairedAt && (
                            <p className="text-xs text-muted-foreground">
                              Reparado el {formatDateTime(d.repairedAt)}
                              {d.repairedBy ? ` · por ${d.repairedBy}` : ""}
                            </p>
                          )}
                          {isCurrent && <p className="mt-1 text-xs font-medium text-foreground">Registro seleccionado</p>}
                        </div>
                      )
                    })}
                  </div>
                </div>
                <Link href="/inventario" className={buttonVariants({ variant: "outline" })}>
                  <ExternalLink className="mr-2 size-4" aria-hidden="true" />
                  Ver ficha del equipo en Inventario
                </Link>
              </div>
            </div>
          </Card>
        </div>
      )}
    </>
  )
}

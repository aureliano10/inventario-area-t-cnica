"use client"

import { useMemo, useState } from "react"
import { Download, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { PageHeader } from "@/components/page-header"
import { formatDateTime, useStore } from "@/lib/store"
import { toDateKey } from "@/lib/mock-data"

export function HistoryScreen() {
  const { loans, items } = useStore()
  const [query, setQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<"todos" | "activos" | "devueltos">("todos")
  const [typeFilter, setTypeFilter] = useState<"todos" | "alumnos" | "docentes">("todos")
  const [fromDate, setFromDate] = useState("")
  const [toDate, setToDate] = useState("")
  const [page, setPage] = useState(1)
  const pageSize = 25

  const itemName = (code: string) => items.find((i) => i.code === code)?.name ?? code
  const itemSector = (code: string) => items.find((i) => i.code === code)?.sector ?? ""

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
  const activosCount = useMemo(() => rows.filter((r) => !r.loan.returnedAt).length, [rows])
  const devueltosCount = useMemo(() => rows.filter((r) => !!r.loan.returnedAt).length, [rows])
  const danosCount = useMemo(() => rows.filter((r) => r.loan.returnedAt && r.loan.returnedCondition === "dañado").length, [rows])

  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const currentPage = Math.min(page, totalPages)
  const paged = useMemo(() => rows.slice((currentPage - 1) * pageSize, currentPage * pageSize), [rows, currentPage])

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

  return (
    <>
      <PageHeader
        title="Historial"
        description="Todos los préstamos con fecha, responsable, estado y condición al devolver."
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Total mostrados</p>
            <p className="text-2xl font-semibold">{total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Activos</p>
            <p className="text-2xl font-semibold">{activosCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Devueltos</p>
            <p className="text-2xl font-semibold">{devueltosCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Devueltos con daño</p>
            <p className="text-2xl font-semibold">{danosCount}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>Registro completo</CardTitle>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <div className="relative w-full sm:w-80">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                <Input
                  placeholder="Buscar por alumno, docente, lote, código, equipo..."
                  className="h-9 pl-8"
                  value={query}
                  onChange={(e) => { setQuery(e.target.value); setPage(1); }}
                />
              </div>
              <Button variant="outline" size="sm" onClick={exportCsv} disabled={rows.length === 0}>
                <Download className="mr-2 size-4" aria-hidden="true" />
                Exportar CSV
              </Button>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" variant={statusFilter === "todos" ? "default" : "outline"} onClick={() => { setStatusFilter("todos"); setPage(1); }}>Todos</Button>
            <Button size="sm" variant={statusFilter === "activos" ? "default" : "outline"} onClick={() => { setStatusFilter("activos"); setPage(1); }}>Activos</Button>
            <Button size="sm" variant={statusFilter === "devueltos" ? "default" : "outline"} onClick={() => { setStatusFilter("devueltos"); setPage(1); }}>Devueltos</Button>
            <div className="mx-1 h-4 w-px bg-border" />
            <Button size="sm" variant={typeFilter === "todos" ? "default" : "outline"} onClick={() => { setTypeFilter("todos"); setPage(1); }}>Todos los tipos</Button>
            <Button size="sm" variant={typeFilter === "alumnos" ? "default" : "outline"} onClick={() => { setTypeFilter("alumnos"); setPage(1); }}>Alumnos</Button>
            <Button size="sm" variant={typeFilter === "docentes" ? "default" : "outline"} onClick={() => { setTypeFilter("docentes"); setPage(1); }}>Docentes</Button>
          </div>
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="hist-from">Desde</Label>
              <Input id="hist-from" type="date" className="h-9 w-[160px]" value={fromDate} onChange={(e) => { setFromDate(e.target.value); setPage(1); }} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="hist-to">Hasta</Label>
              <Input id="hist-to" type="date" className="h-9 w-[160px]" value={toDate} onChange={(e) => { setToDate(e.target.value); setPage(1); }} />
            </div>
            {(fromDate || toDate) && (
              <Button variant="ghost" size="sm" onClick={() => { setFromDate(""); setToDate(""); setPage(1); }}>Limpiar fechas</Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Equipo</TableHead>
                <TableHead>Quien lo pidió</TableHead>
                <TableHead className="hidden md:table-cell">Autorizó</TableHead>
                <TableHead className="hidden lg:table-cell">Sector</TableHead>
                <TableHead>Prestado</TableHead>
                <TableHead>Devuelto</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="hidden sm:table-cell">Registró</TableHead>
                <TableHead className="hidden xl:table-cell">Lote</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paged.map(({ loan, name, sector }) => (
                <TableRow key={loan.id}>
                  <TableCell>
                    <p className="font-medium">{name}</p>
                    <p className="font-mono text-xs text-muted-foreground">{loan.itemCode}</p>
                  </TableCell>
                  <TableCell>
                    <p className="font-medium">{loan.borrowerName}</p>
                    <p className="text-xs text-muted-foreground">
                      {loan.borrowerType === "alumno" ? `Alumno${loan.course ? ` · ${loan.course}` : ""}` : "Docente"}
                    </p>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">{loan.authorizedBy ?? "—"}</TableCell>
                  <TableCell className="hidden lg:table-cell">{sector}</TableCell>
                  <TableCell className="tabular-nums">{formatDateTime(loan.startedAt)}</TableCell>
                  <TableCell className="tabular-nums">{loan.returnedAt ? formatDateTime(loan.returnedAt) : "Pendiente"}</TableCell>
                  <TableCell>
                    {loan.returnedAt ? (
                      <span className={loan.returnedCondition === "dañado" ? "text-destructive" : "text-success"}>
                        {loan.returnedCondition === "dañado" ? "Devuelto - Dañado" : "Devuelto - Buen estado"}
                      </span>
                    ) : (
                      <span className="text-amber-700 dark:text-amber-400">Prestado</span>
                    )}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">{loan.registeredBy} · {loan.shift}</TableCell>
                  <TableCell className="hidden xl:table-cell">{loan.batchId ?? "—"}</TableCell>
                </TableRow>
              ))}
              {paged.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} className="py-8 text-center text-muted-foreground">
                    No hay préstamos con esos filtros.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          {totalPages > 1 && (
            <div className="mt-4 flex flex-col items-center justify-between gap-2 sm:flex-row">
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
    </>
  )
}

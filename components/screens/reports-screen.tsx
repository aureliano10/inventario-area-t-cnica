"use client"

import { useMemo, useState } from "react"
import { Download, FileSpreadsheet, FileText } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { NativeSelect } from "@/components/native-select"
import { PageHeader } from "@/components/page-header"
import { formatDateTime, useStore } from "@/lib/store"
import { toDateKey } from "@/lib/mock-data"

const REPORTS = {
  activos: "Préstamos activos",
  historial: "Historial de préstamos",
  danos: "Daños registrados",
  inventario: "Inventario completo",
  por_turno: "Préstamos por turno (hoy)",
  mas_prestados: "Herramientas más prestadas",
} as const

type ReportKey = keyof typeof REPORTS

export function ReportsScreen() {
  const { items, loans, damages, reservations, user } = useStore()
  const [report, setReport] = useState<ReportKey>("activos")
  const [sector, setSector] = useState("")

  const itemName = (code: string) => items.find((i) => i.code === code)?.name ?? code
  const itemSector = (code: string) => items.find((i) => i.code === code)?.sector ?? ""
  const todayKey = toDateKey(new Date())

  const { headers, rows } = useMemo(() => {
    const bySector = (code: string) => !sector || itemSector(code) === sector
    switch (report) {
      case "activos":
        return {
          headers: ["Código", "Equipo", "Sector", "Lo tiene", "Tipo", "Curso", "Autorizó", "Desde", "Turno", "Registró"],
          rows: loans
            .filter((l) => !l.returnedAt && bySector(l.itemCode))
            .sort((a, b) => a.startedAt.localeCompare(b.startedAt))
            .map((l) => [
              l.itemCode,
              itemName(l.itemCode),
              itemSector(l.itemCode),
              l.borrowerName,
              l.borrowerType === "alumno" ? "Alumno" : l.batchId ? "Docente (Lote)" : "Docente",
              l.course ?? "—",
              l.authorizedBy ?? "—",
              formatDateTime(l.startedAt),
              l.shift,
              l.registeredBy,
            ]),
        }
      case "historial":
        return {
          headers: ["Código", "Equipo", "Sector", "Persona", "Tipo", "Salida", "Devolución", "Estado al volver", "Turno", "Registró"],
          rows: loans
            .filter((l) => bySector(l.itemCode))
            .sort((a, b) => b.startedAt.localeCompare(a.startedAt))
            .map((l) => [
              l.itemCode,
              itemName(l.itemCode),
              itemSector(l.itemCode),
              l.borrowerName + (l.course ? ` (${l.course})` : ""),
              l.borrowerType === "alumno" ? "Alumno" : "Docente",
              formatDateTime(l.startedAt),
              l.returnedAt ? formatDateTime(l.returnedAt) : "Pendiente",
              l.returnedCondition ?? "—",
              l.shift,
              l.registeredBy,
            ]),
        }
      case "danos":
        return {
          headers: ["Fecha", "Código", "Equipo", "Sector", "Descripción", "Responsable", "Reportado por"],
          rows: damages
            .filter((d) => bySector(d.itemCode))
            .sort((a, b) => b.date.localeCompare(a.date))
            .map((d) => [formatDateTime(d.date), d.itemCode, itemName(d.itemCode), itemSector(d.itemCode), d.description, d.responsible, d.reportedBy]),
        }
      case "inventario":
        return {
          headers: ["Código", "Nombre", "Categoría", "Sector", "Ubicación", "Estado"],
          rows: items
            .filter((i) => !sector || i.sector === sector)
            .sort((a, b) => a.code.localeCompare(b.code))
            .map((i) => [i.code, i.name, i.category, i.sector, i.location, i.status]),
        }
      case "por_turno":
        return {
          headers: ["Código", "Equipo", "Sector", "Lo tiene", "Tipo", "Curso", "Autorizó", "Desde", "Turno", "Registró"],
          rows: loans
            .filter((l) => !l.returnedAt && bySector(l.itemCode) && toDateKey(new Date(l.startedAt)) === todayKey)
            .sort((a, b) => a.shift.localeCompare(b.shift) || a.startedAt.localeCompare(b.startedAt))
            .map((l) => [
              l.itemCode,
              itemName(l.itemCode),
              itemSector(l.itemCode),
              l.borrowerName,
              l.borrowerType === "alumno" ? "Alumno" : l.batchId ? "Docente (Lote)" : "Docente",
              l.course ?? "—",
              l.authorizedBy ?? "—",
              formatDateTime(l.startedAt),
              l.shift,
              l.registeredBy,
            ]),
        }
      case "mas_prestados": {
        const counts = new Map<string, number>()
        for (const l of loans) {
          if (bySector(l.itemCode)) counts.set(l.itemCode, (counts.get(l.itemCode) || 0) + 1)
        }
        const list = Array.from(counts.entries())
          .map(([code, count]) => ({ code, count, item: items.find((i) => i.code === code) }))
          .sort((a, b) => b.count - a.count || a.code.localeCompare(b.code))
          .slice(0, 30)
        return {
          headers: ["Código", "Equipo", "Categoría", "Sector", "Ubicación", "Veces prestado", "Estado actual"],
          rows: list.map((x) => [x.code, x.item?.name ?? itemName(x.code), x.item?.category ?? "—", x.item?.sector ?? itemSector(x.code), x.item?.location ?? "—", String(x.count), x.item?.status ?? "—"]),
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [report, sector, items, loans, damages])

  function exportExcel() {
    const escape = (v: string) => `"${String(v).replaceAll('"', '""')}"`
    const csv = [headers, ...rows].map((r) => r.map(escape).join(";")).join("\n")
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${REPORTS[report].toLowerCase().replaceAll(/[^a-z0-9]+/g, "-")}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast.success("Reporte descargado (CSV)", { description: "Se abre con Excel, LibreOffice o Google Hojas de Cálculo." })
  }

  return (
    <>
      <div className="no-print">
        <PageHeader
          title="Reportes"
          description="Generá listados para la dirección y exportalos a Excel o PDF."
          actions={
            <>
              <Button variant="outline" onClick={exportExcel} disabled={rows.length === 0}>
                <FileSpreadsheet data-icon="inline-start" aria-hidden="true" />
                Exportar Excel
              </Button>
              <Button onClick={() => window.print()} disabled={rows.length === 0}>
                <FileText data-icon="inline-start" aria-hidden="true" />
                Exportar PDF
              </Button>
            </>
          }
        />
      </div>

      <Card className="no-print">
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="report-type">Tipo de reporte</Label>
            <NativeSelect id="report-type" value={report} onChange={(e) => setReport(e.target.value as ReportKey)}>
              {Object.entries(REPORTS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </NativeSelect>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="report-sector">Sector</Label>
            <NativeSelect id="report-sector" value={sector} onChange={(e) => setSector(e.target.value)}>
              <option value="">Todos</option>
              <option>Área Técnica</option>
              <option>Biblioteca</option>
            </NativeSelect>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{REPORTS[report]}</CardTitle>
          <CardDescription>
            ENS Dalmacio Vélez Sarsfield · {sector || "Todos los sectores"} · Generado el{" "}
            {new Date().toLocaleDateString("es-AR")} · {rows.length} registros
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                {headers.map((h) => (
                  <TableHead key={h}>{h}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r, idx) => (
                <TableRow key={idx}>
                  {r.map((c, j) => (
                    <TableCell key={j} className="whitespace-normal">
                      {c}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
              {rows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={headers.length} className="py-8 text-center text-muted-foreground">
                    No hay datos para este reporte.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  )
}

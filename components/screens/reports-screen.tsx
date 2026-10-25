"use client"

import { useMemo, useState } from "react"
import { FileSpreadsheet, FileText } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { NativeSelect } from "@/components/native-select"
import { PageHeader } from "@/components/page-header"
import { formatDateTime, useStore } from "@/lib/store"

const REPORTS = {
  activos: "Préstamos activos",
  historial: "Historial de préstamos",
  danos: "Daños registrados",
  inventario: "Inventario completo",
} as const

type ReportKey = keyof typeof REPORTS

export function ReportsScreen() {
  const { items, loans, damages } = useStore()
  const [report, setReport] = useState<ReportKey>("activos")
  const [sector, setSector] = useState("")

  const itemName = (code: string) => items.find((i) => i.code === code)?.name ?? code
  const itemSector = (code: string) => items.find((i) => i.code === code)?.sector ?? ""

  const { headers, rows } = useMemo(() => {
    const bySector = (code: string) => !sector || itemSector(code) === sector
    switch (report) {
      case "activos":
        return {
          headers: ["Código", "Equipo", "Lo tiene", "Curso", "Autorizó", "Desde", "Turno"],
          rows: loans
            .filter((l) => !l.returnedAt && bySector(l.itemCode))
            .map((l) => [l.itemCode, itemName(l.itemCode), l.borrowerName, l.course ?? "—", l.authorizedBy ?? "—", formatDateTime(l.startedAt), l.shift]),
        }
      case "historial":
        return {
          headers: ["Código", "Equipo", "Persona", "Salida", "Devolución", "Estado al volver", "Registró"],
          rows: loans
            .filter((l) => bySector(l.itemCode))
            .map((l) => [
              l.itemCode,
              itemName(l.itemCode),
              l.borrowerName + (l.course ? ` (${l.course})` : ""),
              formatDateTime(l.startedAt),
              l.returnedAt ? formatDateTime(l.returnedAt) : "Pendiente",
              l.returnedCondition ?? "—",
              l.registeredBy,
            ]),
        }
      case "danos":
        return {
          headers: ["Fecha", "Código", "Equipo", "Descripción", "Responsable"],
          rows: damages
            .filter((d) => bySector(d.itemCode))
            .map((d) => [formatDateTime(d.date), d.itemCode, itemName(d.itemCode), d.description, d.responsible]),
        }
      case "inventario":
        return {
          headers: ["Código", "Nombre", "Categoría", "Sector", "Ubicación", "Estado"],
          rows: items
            .filter((i) => !sector || i.sector === sector)
            .map((i) => [i.code, i.name, i.category, i.sector, i.location, i.status]),
        }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [report, sector, items, loans, damages])

  function exportExcel() {
    const escape = (v: string) => `"${v.replaceAll('"', '""')}"`
    const csv = [headers, ...rows].map((r) => r.map(escape).join(";")).join("\n")
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${REPORTS[report].toLowerCase().replaceAll(" ", "-")}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast.success("Reporte descargado", { description: "Se abre con Excel o Google Sheets." })
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

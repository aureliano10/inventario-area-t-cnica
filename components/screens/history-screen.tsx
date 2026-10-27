"use client"

import { useMemo, useState } from "react"
import { Search } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { PageHeader } from "@/components/page-header"
import { formatDateTime, useStore } from "@/lib/store"

export function HistoryScreen() {
  const { loans, items } = useStore()
  const [query, setQuery] = useState("")

  const itemName = (code: string) => items.find((i) => i.code === code)?.name ?? code
  const itemSector = (code: string) => items.find((i) => i.code === code)?.sector ?? ""

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase()
    let list = [...loans].sort((a, b) => b.startedAt.localeCompare(a.startedAt))
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
  }, [loans, items, query])

  return (
    <>
      <PageHeader
        title="Historial"
        description="Todos los préstamos con fecha, responsable, estado y condición al devolver."
      />

      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle>Registro completo</CardTitle>
          <div className="relative w-full sm:w-80">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <Input
              placeholder="Buscar por alumno, docente, lote, código, equipo..."
              className="h-9 pl-8"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
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
              {rows.map(({ loan, name, sector }) => (
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
                        {loan.returnedCondition === "dañado" ? "Dañado al devolver" : "Buen estado"}
                      </span>
                    ) : (
                      <span className="text-warning-foreground">Prestado</span>
                    )}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">{loan.registeredBy} · {loan.shift}</TableCell>
                  <TableCell className="hidden xl:table-cell">{loan.batchId ?? "—"}</TableCell>
                </TableRow>
              ))}
              {rows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} className="py-8 text-center text-muted-foreground">
                    No hay préstamos registrados.
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

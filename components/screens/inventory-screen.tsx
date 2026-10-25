"use client"

import { useState } from "react"
import { Search } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { NativeSelect } from "@/components/native-select"
import { PageHeader } from "@/components/page-header"
import { StatusBadge } from "@/components/status-badge"
import { formatDateTime, useStore } from "@/lib/store"

export function InventoryScreen() {
  const { items, damages } = useStore()
  const [query, setQuery] = useState("")
  const [sector, setSector] = useState("")
  const [status, setStatus] = useState("")

  const filtered = items.filter((i) => {
    const q = query.trim().toLowerCase()
    return (
      (!sector || i.sector === sector) &&
      (!status || i.status === status) &&
      (!q || i.code.toLowerCase().includes(q) || i.name.toLowerCase().includes(q) || i.category.toLowerCase().includes(q))
    )
  })

  return (
    <>
      <PageHeader title="Inventario" description="Todos los equipos del Área Técnica y Biblioteca, con su estado actual." />

      <Tabs defaultValue="equipos">
        <TabsList>
          <TabsTrigger value="equipos">Equipos ({items.length})</TabsTrigger>
          <TabsTrigger value="danos">Historial de daños ({damages.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="equipos" className="mt-4">
          <Card>
            <CardContent className="flex flex-col gap-4">
              <div className="grid gap-3 sm:grid-cols-[1fr_180px_180px]">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                  <Input
                    aria-label="Buscar equipo"
                    placeholder="Buscar por código, nombre o categoría…"
                    className="h-10 pl-9"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                </div>
                <NativeSelect aria-label="Filtrar por sector" value={sector} onChange={(e) => setSector(e.target.value)}>
                  <option value="">Todos los sectores</option>
                  <option>Área Técnica</option>
                  <option>Biblioteca</option>
                </NativeSelect>
                <NativeSelect aria-label="Filtrar por estado" value={status} onChange={(e) => setStatus(e.target.value)}>
                  <option value="">Todos los estados</option>
                  <option value="disponible">Disponible</option>
                  <option value="prestado">Prestado</option>
                  <option value="dañado">Dañado</option>
                </NativeSelect>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Código</TableHead>
                    <TableHead>Nombre</TableHead>
                    <TableHead className="hidden md:table-cell">Categoría</TableHead>
                    <TableHead className="hidden sm:table-cell">Ubicación</TableHead>
                    <TableHead>Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((i) => (
                    <TableRow key={i.code}>
                      <TableCell className="font-mono">{i.code}</TableCell>
                      <TableCell className="font-medium">{i.name}</TableCell>
                      <TableCell className="hidden md:table-cell">{i.category}</TableCell>
                      <TableCell className="hidden sm:table-cell">
                        {i.location}
                        <span className="block text-xs text-muted-foreground">{i.sector}</span>
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={i.status} />
                      </TableCell>
                    </TableRow>
                  ))}
                  {filtered.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                        No hay equipos con esos filtros.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="danos" className="mt-4">
          <Card>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Equipo</TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead className="hidden md:table-cell">Responsable</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {damages.map((d) => {
                    const item = items.find((i) => i.code === d.itemCode)
                    return (
                      <TableRow key={d.id}>
                        <TableCell className="tabular-nums">{formatDateTime(d.date)}</TableCell>
                        <TableCell>
                          <p className="font-medium">{item?.name}</p>
                          <p className="font-mono text-xs text-muted-foreground">{d.itemCode}</p>
                        </TableCell>
                        <TableCell className="max-w-xs whitespace-normal">{d.description}</TableCell>
                        <TableCell className="hidden whitespace-normal md:table-cell">
                          {d.responsible}
                          <span className="block text-xs text-muted-foreground">Registró: {d.reportedBy}</span>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                  {damages.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
                        No hay daños registrados.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </>
  )
}

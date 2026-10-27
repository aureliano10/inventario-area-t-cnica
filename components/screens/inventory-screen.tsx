"use client"

import { useMemo, useState } from "react"
import { Plus, Search, X } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { NativeSelect } from "@/components/native-select"
import { PageHeader } from "@/components/page-header"
import { StatusBadge } from "@/components/status-badge"
import { formatDateTime, useStore } from "@/lib/store"
import type { Sector } from "@/lib/types"

export function InventoryScreen() {
  const { items, damages, addItem, user, teachers, addTeacher, removeTeacher } = useStore()
  const [teacherForm, setTeacherForm] = useState("")
  const [teacherError, setTeacherError] = useState<string | null>(null)
  const [teacherQuery, setTeacherQuery] = useState("")
  const [showTeachersModal, setShowTeachersModal] = useState(false)
  const [query, setQuery] = useState("")
  const [sector, setSector] = useState("")
  const [status, setStatus] = useState("")
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: "", category: "", sector: "" as "" | Sector, location: "", code: "" })

  const filteredTeachersModal = useMemo(() => {
    const q = teacherQuery.trim().toLowerCase()
    if (!q) return teachers
    return teachers.filter((t) => t.toLowerCase().includes(q))
  }, [teachers, teacherQuery])

  const filtered = items.filter((i) => {
    const q = query.trim().toLowerCase()
    return (
      (!sector || i.sector === sector) &&
      (!status || i.status === status) &&
      (!q || i.code.toLowerCase().includes(q) || i.name.toLowerCase().includes(q) || i.category.toLowerCase().includes(q))
    )
  })

  function submit(e: React.FormEvent) {
    e.preventDefault()
    const res = addItem({
      name: form.name,
      category: form.category,
      sector: form.sector as Sector,
      location: form.location,
      code: form.code || undefined,
    })
    if (!res.ok) {
      toast.error(res.error)
      return
    }
    toast.success("Equipo agregado al inventario", { description: res.code ? `Código: ${res.code}` : undefined })
    setForm({ name: "", category: "", sector: "", location: "", code: "" })
    setShowForm(false)
  }

  function addNewTeacher(e: React.FormEvent) {
    e.preventDefault()
    setTeacherError(null)
    const res = addTeacher(teacherForm)
    if (!res.ok) {
      setTeacherError(res.error)
      return
    }
    toast.success("Docente agregado")
    setTeacherForm("")
  }

  return (
    <>
      <PageHeader
        title="Inventario"
        description="Listado de equipos, estado actual y gestión de docentes habilitados."
        actions={
          user?.role === "encargado" ? (
            <Button onClick={() => setShowForm((v) => !v)}>
              <Plus data-icon="inline-start" aria-hidden="true" />
              Agregar equipo
            </Button>
          ) : undefined
        }
      />

      {showForm && user?.role === "encargado" && (
        <Card>
          <CardContent className="pt-6">
            <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <div className="flex flex-col gap-1.5 sm:col-span-2 lg:col-span-1">
                <Label htmlFor="inv-name">Nombre del equipo/herramienta</Label>
                <Input id="inv-name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="inv-cat">Categoría</Label>
                <Input id="inv-cat" value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} placeholder="Ej: Herramienta manual" required />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="inv-sector">Sector</Label>
                <NativeSelect id="inv-sector" value={form.sector} onChange={(e) => setForm((f) => ({ ...f, sector: e.target.value as Sector | "" }))} required>
                  <option value="">Seleccionar</option>
                  <option value="Área Técnica">Área Técnica</option>
                  <option value="Biblioteca">Biblioteca</option>
                </NativeSelect>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="inv-loc">Ubicación / Estante</Label>
                <Input id="inv-loc" value={form.location} onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))} placeholder="Ej: Estante A1" required />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="inv-code">Código (opcional)</Label>
                <Input id="inv-code" value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))} placeholder="Se genera automático si vacío" />
              </div>
              <div className="flex items-end gap-2 sm:col-span-2 lg:col-span-3">
                <Button type="submit">Guardar</Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {user?.role === "encargado" && (
        <Card>
          <CardContent className="flex flex-col gap-3 pt-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-base font-semibold">Docentes habilitados</p>
              <p className="text-sm text-muted-foreground">
                {teachers.length} {teachers.length === 1 ? "docente habilitado" : "docentes habilitados"} para préstamos y reservas
              </p>
            </div>
            <Button variant="outline" onClick={() => setShowTeachersModal(true)}>
              Gestionar docentes
            </Button>
          </CardContent>
        </Card>
      )}

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

      {showTeachersModal && user?.role === "encargado" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <Card className="w-full max-w-2xl">
            <CardContent className="flex flex-col gap-4 pt-6">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-lg font-semibold">Gestionar docentes habilitados</p>
                  <p className="text-sm text-muted-foreground">Agregá o quitá docentes para usar en préstamos y reservas de proyectores.</p>
                </div>
                <Button variant="ghost" size="icon" onClick={() => { setShowTeachersModal(false); setTeacherQuery(""); setTeacherError(null) }}>
                  <X className="size-4" />
                </Button>
              </div>
              <form
                onSubmit={(e) => {
                  addNewTeacher(e)
                  if (!teacherError) setTeacherForm("")
                }}
                className="flex flex-col gap-2 sm:flex-row sm:items-end"
              >
                <div className="flex-1">
                  <Label htmlFor="teacher-name-modal">Agregar docente</Label>
                  <Input id="teacher-name-modal" className="mt-1.5" placeholder="Ej: Prof. María López" value={teacherForm} onChange={(e) => setTeacherForm(e.target.value)} />
                </div>
                <Button type="submit">
                  <Plus className="mr-1 size-4" aria-hidden="true" />
                  Agregar
                </Button>
              </form>
              {teacherError && <p className="text-sm text-destructive">{teacherError}</p>}
              {teachers.length > 0 && (
                <div className="relative">
                  <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                  <Input
                    placeholder="Buscar docente..."
                    className="h-9 pl-8"
                    value={teacherQuery}
                    onChange={(e) => setTeacherQuery(e.target.value)}
                  />
                </div>
              )}
              {teachers.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">No hay docentes habilitados cargados.</p>
              ) : filteredTeachersModal.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">No hay resultados para "{teacherQuery}".</p>
              ) : (
                <div className="max-h-[320px] overflow-y-auto rounded-md border">
                  <div className="flex flex-wrap gap-2 p-3">
                    {filteredTeachersModal.map((t) => (
                      <div key={t} className="flex items-center gap-1 rounded-full border bg-card px-2.5 py-1 text-sm shadow-sm">
                        <span className="max-w-[240px] truncate">{t}</span>
                        <button
                          type="button"
                          className="ml-1 rounded-full p-0.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                          onClick={() => {
                            removeTeacher(t)
                            toast("Docente eliminado")
                          }}
                          aria-label={`Quitar ${t}`}
                        >
                          <X className="size-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex justify-end">
                <Button variant="outline" onClick={() => { setShowTeachersModal(false); setTeacherQuery(""); setTeacherError(null) }}>
                  Cerrar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  )
}

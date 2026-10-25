"use client"

import { useState } from "react"
import { Check, PackageOpen } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ItemScanner } from "@/components/item-scanner"
import { ItemSummary } from "@/components/item-summary"
import { NativeSelect } from "@/components/native-select"
import { PageHeader } from "@/components/page-header"
import { useStore } from "@/lib/store"
import { TEACHERS } from "@/lib/mock-data"
import type { Item } from "@/lib/types"

export function BatchLoanScreen() {
  const { lendBatch } = useStore()
  const [teacher, setTeacher] = useState("")
  const [batch, setBatch] = useState<Item[]>([])
  const [error, setError] = useState<string | null>(null)

  function addItem(item: Item) {
    if (batch.some((b) => b.code === item.code)) {
      setError(`${item.code} ya está en la lista.`)
      return
    }
    if (item.status !== "disponible") {
      setError(`${item.name} (${item.code}) no está disponible: figura como ${item.status}.`)
      toast.error("No se puede agregar", { description: `${item.code} figura como ${item.status}.` })
      return
    }
    setError(null)
    setBatch((prev) => [...prev, item])
  }

  function confirm() {
    if (!teacher) return setError("Elegí el docente que se lleva el lote.")
    if (batch.length === 0) return setError("Escaneá al menos una herramienta.")
    const result = lendBatch({ teacher, itemCodes: batch.map((b) => b.code) })
    if (!result.ok) return setError(result.error)
    toast.success("Lote registrado", { description: `${batch.length} equipos a cargo de ${teacher}` })
    setBatch([])
    setTeacher("")
    setError(null)
  }

  return (
    <>
      <PageHeader
        title="Préstamo por lote a docente"
        description="Para actividades grupales: escaneá todos los equipos seguidos y confirmá una sola vez."
      />
      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Docente y escaneo</CardTitle>
            <CardDescription>El docente queda como único responsable de todo el lote.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <Label htmlFor="batch-teacher">Docente responsable</Label>
              <NativeSelect id="batch-teacher" value={teacher} onChange={(e) => setTeacher(e.target.value)}>
                <option value="">Elegí un docente</option>
                {TEACHERS.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </NativeSelect>
            </div>
            <ItemScanner
              label="Escanear equipos"
              onScan={addItem}
              suggestionFilter={(i) => i.status === "disponible" && i.category !== "Proyector"}
              demoCodes={["AT-0011", "AT-0012", "AT-0013", "AT-0014", "AT-0009"]}
            />
            {error && (
              <Alert variant="destructive" role="alert">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Equipos del lote</CardTitle>
              <CardDescription aria-live="polite">
                {batch.length} {batch.length === 1 ? "equipo" : "equipos"} en la lista
              </CardDescription>
            </div>
            {batch.length > 0 && (
              <Button variant="ghost" size="sm" onClick={() => setBatch([])}>
                Vaciar
              </Button>
            )}
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {batch.length === 0 ? (
              <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed py-10 text-center text-muted-foreground">
                <PackageOpen className="size-8" aria-hidden="true" />
                <p>Todavía no escaneaste equipos.</p>
              </div>
            ) : (
              <ul className="flex flex-col gap-2">
                {batch.map((b) => (
                  <li key={b.code}>
                    <ItemSummary item={b} onClear={() => setBatch((prev) => prev.filter((p) => p.code !== b.code))} />
                  </li>
                ))}
              </ul>
            )}
            <Button size="lg" className="mt-2 h-11" onClick={confirm} disabled={batch.length === 0}>
              <Check data-icon="inline-start" aria-hidden="true" />
              Confirmar lote ({batch.length})
            </Button>
          </CardContent>
        </Card>
      </div>
    </>
  )
}

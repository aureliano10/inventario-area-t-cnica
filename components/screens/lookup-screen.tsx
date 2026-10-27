"use client"

import { useState } from "react"
import Link from "next/link"
import { AlertCircle, Undo2, UserPlus } from "lucide-react"
import { buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { ItemScanner } from "@/components/item-scanner"
import { ItemSummary } from "@/components/item-summary"
import { PageHeader } from "@/components/page-header"
import { formatDateTime, useStore } from "@/lib/store"
import type { Item } from "@/lib/types"

export function LookupScreen() {
  const { loans, damages, activeLoanFor, findItem } = useStore()
  const [code, setCode] = useState<string | null>(null)
  const item: Item | undefined = code ? findItem(code) : undefined
  const loan = item ? activeLoanFor(item.code) : undefined
  const history = item ? loans.filter((l) => l.itemCode === item.code && l.returnedAt) : []
  const itemDamages = item ? damages.filter((d) => d.itemCode === item.code) : []

  return (
    <>
      <PageHeader
        title="Consulta rápida"
        description="Escaneá o buscá un ítem para ver ficha, estado, préstamo activo e historial."
      />
      <Card className="overflow-visible">
        <CardContent className="overflow-visible">
          <ItemScanner
            onScan={(i) => setCode(i.code)}
            demoCodes={["AT-0001", "AT-0003", "AT-0006", "BI-0002", "XX-9999"]}
          />
        </CardContent>
      </Card>

      {code && !item && (
        <Alert variant="destructive">
          <AlertCircle aria-hidden="true" />
          <AlertTitle>Código no encontrado</AlertTitle>
          <AlertDescription>El código escaneado no existe en el inventario.</AlertDescription>
        </Alert>
      )}

      {item && (
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="overflow-visible">
          <CardHeader>
            <CardTitle>Ficha del equipo</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 overflow-visible">
              <ItemSummary item={item} />
              <dl className="grid grid-cols-2 gap-3 rounded-lg border p-4 text-sm">
                <div>
                  <dt className="text-muted-foreground">Código de barras</dt>
                  <dd className="font-mono font-medium">{item.code}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Categoría</dt>
                  <dd className="font-medium">{item.category}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Sector</dt>
                  <dd className="font-medium">{item.sector}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Ubicación / Estante</dt>
                  <dd className="font-medium">{item.location}</dd>
                </div>
                <div className="col-span-2">
                  <dt className="text-muted-foreground">Estado actual</dt>
                  <dd className="font-medium capitalize">{item.status}</dd>
                </div>
              </dl>
              {loan ? (
                <dl className="grid grid-cols-2 gap-3 rounded-lg border border-warning/50 bg-warning/10 p-4 text-sm">
                  <div className="col-span-2">
                    <dt className="text-muted-foreground">Préstamo activo - Quién lo tiene</dt>
                    <dd className="font-medium">
                      {loan.borrowerName}
                      {loan.course && ` · Curso: ${loan.course}`}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Autorizó</dt>
                    <dd className="font-medium">{loan.authorizedBy ?? "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Registrado por</dt>
                    <dd className="font-medium">{loan.registeredBy || "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Desde</dt>
                    <dd className="font-medium tabular-nums">{formatDateTime(loan.startedAt)}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Turno</dt>
                    <dd className="font-medium">{loan.shift}</dd>
                  </div>
                  <div className="col-span-2">
                    <dt className="text-muted-foreground">Tipo</dt>
                    <dd className="font-medium">{loan.borrowerType === "alumno" ? "Alumno" : loan.batchId ? `Docente (Lote ${loan.batchId})` : "Docente"}</dd>
                  </div>
                </dl>
              ) : (
                <p className="text-sm text-muted-foreground">
                  {item.status === "disponible"
                    ? `Debería estar en ${item.location} (${item.sector}). Se puede prestar.`
                    : item.status === "dañado"
                      ? "Está fuera de servicio por daño. No se puede prestar."
                      : `Está ${item.status}.`}
                </p>
              )}
              <div className="flex flex-wrap gap-2">
                {item.status === "disponible" && !loan && (
                  <Link href={`/prestamos/alumno?code=${encodeURIComponent(item.code)}`} className={buttonVariants()}>
                    <UserPlus data-icon="inline-start" aria-hidden="true" />
                    Prestar
                  </Link>
                )}
                {loan && (
                  <Link href="/devolucion" className={buttonVariants()}>
                    <Undo2 data-icon="inline-start" aria-hidden="true" />
                    Registrar devolución
                  </Link>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Historial</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 text-sm">
              {history.length === 0 && itemDamages.length === 0 && (
                <p className="text-muted-foreground">Sin movimientos anteriores.</p>
              )}
              <ul className="flex flex-col gap-2">
                {itemDamages.map((d) => (
                  <li key={d.id} className="rounded-md border border-destructive/30 bg-destructive/5 p-3">
                    <p className="font-medium text-destructive">Daño · {formatDateTime(d.date)}</p>
                    <p>{d.description}</p>
                    <p className="text-xs text-muted-foreground">Responsable: {d.responsible}</p>
                  </li>
                ))}
                {history.map((h) => (
                  <li key={h.id} className="rounded-md border p-3">
                    <p className="font-medium">
                      {h.borrowerName}
                      {h.course && ` (${h.course})`}
                    </p>
                    <p className="text-xs text-muted-foreground tabular-nums">
                      {formatDateTime(h.startedAt)} → {formatDateTime(h.returnedAt!)} · Volvió{" "}
                      {h.returnedCondition === "dañado" ? "dañado" : "en buen estado"}
                    </p>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  )
}

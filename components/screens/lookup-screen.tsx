"use client"

import { useState } from "react"
import Link from "next/link"
import { Undo2, UserPlus } from "lucide-react"
import { buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
        description="Escaneá cualquier objeto para saber su estado, dónde está y quién lo tiene."
      />
      <Card>
        <CardContent>
          <ItemScanner
            onScan={(i) => setCode(i.code)}
            demoCodes={["AT-0001", "AT-0003", "AT-0006", "BI-0002", "XX-9999"]}
          />
        </CardContent>
      </Card>

      {item && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Estado actual</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <ItemSummary item={item} />
              {loan ? (
                <dl className="grid grid-cols-2 gap-3 rounded-lg border border-warning/50 bg-warning/10 p-4 text-sm">
                  <div>
                    <dt className="text-muted-foreground">Lo tiene</dt>
                    <dd className="font-medium">
                      {loan.borrowerName}
                      {loan.course && ` (${loan.course})`}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Autorizó</dt>
                    <dd className="font-medium">{loan.authorizedBy ?? "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Desde</dt>
                    <dd className="font-medium tabular-nums">{formatDateTime(loan.startedAt)}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Turno</dt>
                    <dd className="font-medium">{loan.shift}</dd>
                  </div>
                </dl>
              ) : (
                <p className="text-sm text-muted-foreground">
                  {item.status === "disponible"
                    ? `Está en ${item.location} y se puede prestar.`
                    : "Está fuera de servicio por daño."}
                </p>
              )}
              <div className="flex gap-2">
                {item.status === "disponible" && (
                  <Link href="/prestamos/alumno" className={buttonVariants()}>
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

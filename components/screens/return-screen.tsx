"use client"

import { useRef, useState } from "react"
import { AlertTriangle, Check, CheckCircle2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ItemScanner } from "@/components/item-scanner"
import { ItemSummary } from "@/components/item-summary"
import { PageHeader } from "@/components/page-header"
import { formatDateTime, useStore } from "@/lib/store"
import type { Item } from "@/lib/types"
import { cn } from "@/lib/utils"

export function ReturnScreen() {
  const { activeLoanFor, registerReturn } = useStore()
  const scannerRef = useRef<HTMLInputElement>(null)
  const [item, setItem] = useState<Item | null>(null)
  const [condition, setCondition] = useState<"bueno" | "dañado">("bueno")
  const [description, setDescription] = useState("")
  const [error, setError] = useState<string | null>(null)

  const loan = item ? activeLoanFor(item.code) : undefined

  function reset() {
    setItem(null)
    setCondition("bueno")
    setDescription("")
    setError(null)
    setTimeout(() => scannerRef.current?.focus(), 0)
  }

  function confirm() {
    if (!item) return
    const result = registerReturn({ itemCode: item.code, condition, description })
    if (!result.ok) return setError(result.error)
    if (condition === "dañado") {
      toast.warning("Devolución con daño registrada", { description: `${item.name} quedó marcado como dañado.` })
    } else {
      toast.success("Devolución registrada", { description: `${item.name} vuelve a estar disponible.` })
    }
    reset()
  }

  return (
    <>
      <PageHeader title="Registrar devolución" description="Escaneá la herramienta y verificá en qué estado vuelve." />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Herramienta devuelta</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {item ? (
              <ItemSummary item={item} onClear={reset} />
            ) : (
              <ItemScanner
                ref={scannerRef}
                onScan={(i) => {
                  setItem(i)
                  setError(null)
                }}
                suggestionFilter={(i) => i.status === "prestado"}
                demoCodes={["AT-0001", "AT-0002", "AT-0009", "AT-0005"]}
              />
            )}

            {item && !loan && (
              <Alert variant="destructive">
                <AlertDescription>
                  Esta herramienta no figura como prestada. Revisá el código o consultá el panel de préstamos.
                </AlertDescription>
              </Alert>
            )}

            {item && loan && (
              <dl className="grid grid-cols-2 gap-3 rounded-lg border p-4 text-sm">
                <div>
                  <dt className="text-muted-foreground">Prestado a</dt>
                  <dd className="font-medium">
                    {loan.borrowerName}
                    {loan.course && ` (${loan.course})`}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Responsable</dt>
                  <dd className="font-medium">{loan.authorizedBy ?? loan.borrowerName}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Desde</dt>
                  <dd className="font-medium tabular-nums">{formatDateTime(loan.startedAt)}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Registró</dt>
                  <dd className="font-medium">
                    {loan.registeredBy} · Turno {loan.shift}
                  </dd>
                </div>
              </dl>
            )}
          </CardContent>
        </Card>

        <Card aria-disabled={!loan} className={cn(!loan && "opacity-60")}>
          <CardHeader>
            <CardTitle>Estado de la herramienta</CardTitle>
            <CardDescription>Si vuelve dañada, se guarda en el historial de daños con el responsable.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <fieldset disabled={!loan} className="grid grid-cols-2 gap-3">
              <legend className="sr-only">Estado al devolver</legend>
              {(
                [
                  { value: "bueno", label: "En buen estado", icon: CheckCircle2, active: "border-success bg-success/10 text-success" },
                  { value: "dañado", label: "Vuelve dañada", icon: AlertTriangle, active: "border-destructive bg-destructive/10 text-destructive" },
                ] as const
              ).map((opt) => (
                <label
                  key={opt.value}
                  className={cn(
                    "flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 p-4 text-center text-sm font-semibold has-focus-visible:outline-2 has-focus-visible:outline-ring",
                    condition === opt.value ? opt.active : "border-border",
                  )}
                >
                  <input
                    type="radio"
                    name="condition"
                    value={opt.value}
                    checked={condition === opt.value}
                    onChange={() => setCondition(opt.value)}
                    className="sr-only"
                  />
                  <opt.icon className="size-6" aria-hidden="true" />
                  {opt.label}
                </label>
              ))}
            </fieldset>

            {condition === "dañado" && loan && (
              <div className="flex flex-col gap-2">
                <Label htmlFor="damage">¿Qué le pasó?</Label>
                <Textarea
                  id="damage"
                  rows={3}
                  placeholder="Ej.: cable cortado, no enciende, falta una pieza…"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
            )}

            {error && (
              <Alert variant="destructive" role="alert">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button size="lg" className="h-11" disabled={!loan} onClick={confirm}>
              <Check data-icon="inline-start" aria-hidden="true" />
              Confirmar devolución
            </Button>
          </CardContent>
        </Card>
      </div>
    </>
  )
}

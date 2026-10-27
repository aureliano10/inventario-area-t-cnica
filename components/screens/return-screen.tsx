"use client"

import { useMemo, useRef, useState } from "react"
import { AlertTriangle, Check, CheckCircle2, ChevronDown, ChevronRight, Search, X } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ItemScanner } from "@/components/item-scanner"
import { PageHeader } from "@/components/page-header"
import { formatDateTime, useStore } from "@/lib/store"
import type { Item, Loan } from "@/lib/types"
import { cn } from "@/lib/utils"

type Group = {
  key: string
  batchId?: string
  borrowerName: string
  borrowerType: Loan["borrowerType"]
  course?: string
  authorizedBy?: string
  registeredBy: string
  shift: Loan["shift"]
  startedAt: string
  loans: Loan[]
}

function makeGroupKey(l: Loan) {
  if (l.batchId) return `batch:${l.batchId}`
  return `solo:${l.borrowerType}:${l.borrowerName}:${l.course ?? ""}:${l.authorizedBy ?? ""}:${l.startedAt}:${l.registeredBy}`
}

export function ReturnScreen() {
  const { loans, items, registerReturn, findItem } = useStore()
  const scannerRef = useRef<HTMLInputElement>(null)
  const [query, setQuery] = useState("")
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [activeLoan, setActiveLoan] = useState<Loan | null>(null)
  const [bulkGroup, setBulkGroup] = useState<Group | null>(null)
  const [condition, setCondition] = useState<"bueno" | "dañado">("bueno")
  const [description, setDescription] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [showScanner, setShowScanner] = useState(false)

  const groups = useMemo<Group[]>(() => {
    const active = loans.filter((l) => !l.returnedAt)
    const map = new Map<string, Group>()
    for (const l of active) {
      const key = makeGroupKey(l)
      if (!map.has(key)) {
        map.set(key, {
          key,
          batchId: l.batchId,
          borrowerName: l.borrowerName,
          borrowerType: l.borrowerType,
          course: l.course,
          authorizedBy: l.authorizedBy,
          registeredBy: l.registeredBy,
          shift: l.shift,
          startedAt: l.startedAt,
          loans: [],
        })
      }
      map.get(key)!.loans.push(l)
    }
    const arr = Array.from(map.values())
    arr.sort((a, b) => a.startedAt.localeCompare(b.startedAt))
    for (const g of arr) g.loans.sort((a, b) => a.itemCode.localeCompare(b.itemCode))
    return arr
  }, [loans])

  const filteredGroups = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return groups
    return groups.filter((g) => {
      if (g.borrowerName.toLowerCase().includes(q)) return true
      if (g.course?.toLowerCase().includes(q)) return true
      if (g.authorizedBy?.toLowerCase().includes(q)) return true
      if (g.batchId?.toLowerCase().includes(q)) return true
      return g.loans.some((l) => {
        const it = items.find((i) => i.code === l.itemCode)
        return l.itemCode.toLowerCase().includes(q) || it?.name.toLowerCase().includes(q)
      })
    })
  }, [groups, query, items])

  function toggle(key: string) {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  function startReturn(loan: Loan) {
    setActiveLoan(loan)
    setCondition("bueno")
    setDescription("")
    setError(null)
  }

  function cancelReturn() {
    setActiveLoan(null)
    setCondition("bueno")
    setDescription("")
    setError(null)
  }

  function confirmReturn() {
    if (!activeLoan) return
    const result = registerReturn({ itemCode: activeLoan.itemCode, condition, description })
    if (!result.ok) return setError(result.error)
    const it = findItem(activeLoan.itemCode)
    if (condition === "dañado") {
      toast.warning("Devolución con daño registrada", { description: `${it?.name || activeLoan.itemCode} quedó marcado como dañado.` })
    } else {
      toast.success("Devolución registrada", { description: `${it?.name || activeLoan.itemCode} vuelve a estar disponible.` })
    }
    cancelReturn()
  }

  function startBulkReturn(group: Group) {
    setBulkGroup(group)
    setCondition("bueno")
    setDescription("")
    setError(null)
  }

  function cancelBulkReturn() {
    setBulkGroup(null)
    setCondition("bueno")
    setDescription("")
    setError(null)
  }

  function confirmBulkReturn() {
    if (!bulkGroup) return
    for (const loan of bulkGroup.loans) {
      const result = registerReturn({ itemCode: loan.itemCode, condition, description })
      if (!result.ok) {
        setError(result.error)
        return
      }
    }
    if (condition === "dañado") {
      toast.warning("Préstamo devuelto con daños registrados", {
        description: `${bulkGroup.loans.length} ${bulkGroup.loans.length === 1 ? "ítem marcado" : "ítems marcados"} como dañados.`,
      })
    } else {
      toast.success("Préstamo devuelto completo", {
        description: `${bulkGroup.loans.length} ${bulkGroup.loans.length === 1 ? "ítem" : "ítems"} devueltos en buen estado.`,
      })
    }
    cancelBulkReturn()
  }

  function handleScan(i: Item) {
    const loan = loans.find((l) => l.itemCode === i.code && !l.returnedAt)
    if (!loan) {
      toast.error("No hay préstamo activo para este ítem")
      return
    }
    startReturn(loan)
    setShowScanner(false)
  }

  return (
    <>
      <PageHeader title="Devoluciones" description="Seleccioná el préstamo activo y devolvé ítem por ítem o todo el grupo." />

      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-sm">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <Input
              placeholder="Buscar por alumno, docente, lote, código o herramienta..."
              className="pl-8"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <Button variant="outline" onClick={() => setShowScanner((s) => !s)}>
            {showScanner ? "Ocultar escáner" : "Usar escáner como atajo"}
          </Button>
        </div>

        {showScanner && (
          <Card>
            <CardHeader>
              <CardTitle>Escáner</CardTitle>
              <CardDescription>Escaneá el código para devolver ese ítem directamente.</CardDescription>
            </CardHeader>
            <CardContent>
              <ItemScanner
                ref={scannerRef}
                onScan={handleScan}
                suggestionFilter={(i) => i.status === "prestado"}
                demoCodes={["AT-0001", "AT-0002", "AT-0009", "AT-0005"]}
              />
            </CardContent>
          </Card>
        )}

        {filteredGroups.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
              <CheckCircle2 className="size-10 text-success" aria-hidden="true" />
              <p className="font-medium">No hay préstamos activos para devolver.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="flex flex-col gap-3">
            {filteredGroups.map((g) => {
              const isOpen = expanded.has(g.key)
              const pendingCount = g.loans.length
              const it0 = g.loans[0]
              const item0 = items.find((i) => i.code === it0.itemCode)

              return (
                <Card key={g.key}>
                  <button
                    type="button"
                    className="flex w-full items-center justify-between gap-3 p-4 text-left"
                    onClick={() => toggle(g.key)}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold">{g.borrowerName}</p>
                        {g.borrowerType === "alumno" && g.course && <span className="text-sm text-muted-foreground">· {g.course}</span>}
                        {g.batchId && <span className="rounded bg-muted px-1.5 py-0.5 text-xs">Lote {g.batchId}</span>}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {g.borrowerType === "alumno" ? `Alumno${g.authorizedBy ? ` · Autorizó: ${g.authorizedBy}` : ""}` : "Docente"}
                        {" · "}Registró: {g.registeredBy} · Turno {g.shift} · Desde {formatDateTime(g.startedAt)}
                      </p>
                      <p className="mt-1 text-sm font-medium">
                        {pendingCount} {pendingCount === 1 ? "ítem pendiente" : "ítems pendientes"} de devolver
                        {item0 && pendingCount === 1 && ` · ${item0.name} (${it0.itemCode})`}
                      </p>
                    </div>
                    {isOpen ? <ChevronDown className="size-5 text-muted-foreground" /> : <ChevronRight className="size-5 text-muted-foreground" />}
                  </button>

                  {isOpen && (
                    <CardContent className="border-t pt-4">
                      <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-sm text-muted-foreground">Podés devolver ítem por ítem o todo el préstamo junto.</p>
                        <Button size="sm" variant="secondary" onClick={(e) => { e.stopPropagation(); startBulkReturn(g) }}>
                          Devolver todo el préstamo
                        </Button>
                      </div>
                      <div className="flex flex-col divide-y">
                        {g.loans.map((loan) => {
                          const it = items.find((i) => i.code === loan.itemCode)
                          return (
                            <div key={loan.id} className="flex flex-col gap-3 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between">
                              <div className="min-w-0">
                                <p className="font-medium">{it?.name || loan.itemCode}</p>
                                <p className="font-mono text-xs text-muted-foreground">{loan.itemCode} · {it?.category} · {it?.location}</p>
                              </div>
                              <Button size="sm" onClick={() => startReturn(loan)}>
                                Marcar devuelto
                              </Button>
                            </div>
                          )
                        })}
                      </div>
                    </CardContent>
                  )}
                </Card>
              )
            })}
          </div>
        )}
      </div>

      {activeLoan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <Card className="w-full max-w-lg">
            <CardHeader>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <CardTitle>Devolver ítem</CardTitle>
                  <CardDescription>
                    {findItem(activeLoan.itemCode)?.name || activeLoan.itemCode} · {activeLoan.itemCode}
                  </CardDescription>
                </div>
                <Button variant="ghost" size="icon" onClick={cancelReturn}>
                  <X className="size-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <dl className="grid grid-cols-2 gap-3 rounded-lg border p-4 text-sm">
                <div>
                  <dt className="text-muted-foreground">Prestado a</dt>
                  <dd className="font-medium">
                    {activeLoan.borrowerName}
                    {activeLoan.course && ` (${activeLoan.course})`}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Autorizó / Responsable</dt>
                  <dd className="font-medium">{activeLoan.authorizedBy ?? activeLoan.borrowerName}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Desde</dt>
                  <dd className="font-medium tabular-nums">{formatDateTime(activeLoan.startedAt)}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Registró</dt>
                  <dd className="font-medium">
                    {activeLoan.registeredBy} · Turno {activeLoan.shift}
                  </dd>
                </div>
              </dl>

              <fieldset className="grid grid-cols-2 gap-3">
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

              {condition === "dañado" && (
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

              <div className="flex flex-col gap-2 sm:flex-row">
                <Button variant="outline" className="flex-1" onClick={cancelReturn}>
                  Cancelar
                </Button>
                <Button className="flex-1" onClick={confirmReturn}>
                  <Check data-icon="inline-start" aria-hidden="true" />
                  Confirmar devolución
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {bulkGroup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <Card className="w-full max-w-lg">
            <CardHeader>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <CardTitle>Devolver todo el préstamo</CardTitle>
                  <CardDescription>
                    {bulkGroup.borrowerName}
                    {bulkGroup.course && ` (${bulkGroup.course})`} · {bulkGroup.loans.length}{" "}
                    {bulkGroup.loans.length === 1 ? "ítem" : "ítems"}
                  </CardDescription>
                </div>
                <Button variant="ghost" size="icon" onClick={cancelBulkReturn}>
                  <X className="size-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="max-h-40 overflow-y-auto rounded-lg border">
                <ul className="divide-y">
                  {bulkGroup.loans.map((loan) => {
                    const it = items.find((i) => i.code === loan.itemCode)
                    return (
                      <li key={loan.id} className="flex items-center justify-between px-3 py-2 text-sm">
                        <div>
                          <p className="font-medium">{it?.name || loan.itemCode}</p>
                          <p className="font-mono text-xs text-muted-foreground">{loan.itemCode}</p>
                        </div>
                      </li>
                    )
                  })}
                </ul>
              </div>

              <fieldset className="grid grid-cols-2 gap-3">
                <legend className="sr-only">Estado al devolver</legend>
                {(
                  [
                    { value: "bueno", label: "Todos en buen estado", icon: CheckCircle2, active: "border-success bg-success/10 text-success" },
                    { value: "dañado", label: "Alguno/Todos dañados", icon: AlertTriangle, active: "border-destructive bg-destructive/10 text-destructive" },
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
                      name="condition-bulk"
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

              {condition === "dañado" && (
                <div className="flex flex-col gap-2">
                  <Label htmlFor="damage-bulk">¿Qué pasó con los ítems?</Label>
                  <Textarea
                    id="damage-bulk"
                    rows={3}
                    placeholder="Ej.: varios con cables cortados, detalles generales…"
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

              <div className="flex flex-col gap-2 sm:flex-row">
                <Button variant="outline" className="flex-1" onClick={cancelBulkReturn}>
                  Cancelar
                </Button>
                <Button className="flex-1" onClick={confirmBulkReturn}>
                  <Check data-icon="inline-start" aria-hidden="true" />
                  Confirmar devolución de todo
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  )
}

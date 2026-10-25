"use client"

import { useRef, useState } from "react"
import { Check } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ItemScanner } from "@/components/item-scanner"
import { ItemSummary } from "@/components/item-summary"
import { NativeSelect } from "@/components/native-select"
import { PageHeader } from "@/components/page-header"
import { useStore } from "@/lib/store"
import { COURSES, TEACHERS } from "@/lib/mock-data"
import type { Item } from "@/lib/types"

export function StudentLoanScreen() {
  const { lendToStudent, user } = useStore()
  const scannerRef = useRef<HTMLInputElement>(null)
  const studentRef = useRef<HTMLInputElement>(null)
  const [item, setItem] = useState<Item | null>(null)
  const [student, setStudent] = useState("")
  const [course, setCourse] = useState("")
  const [teacher, setTeacher] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)

  const itemError =
    item && item.status !== "disponible"
      ? item.status === "prestado"
        ? "Esta herramienta ya figura como prestada. Registrá la devolución antes de volver a prestarla."
        : "Esta herramienta está marcada como dañada y no se puede prestar."
      : null

  function reset() {
    setItem(null)
    setStudent("")
    setCourse("")
    setTeacher("")
    setError(null)
    setSubmitted(false)
    scannerRef.current?.focus()
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitted(true)
    if (!item) return setError("Primero escaneá la herramienta.")
    if (!student.trim() || !course) return setError("Completá el nombre y el curso del alumno.")
    if (!teacher) return setError("Falta el docente que autoriza. No se puede prestar sin su aval.")
    const result = lendToStudent({ itemCode: item.code, studentName: student.trim(), course, teacher })
    if (!result.ok) return setError(result.error)
    toast.success("Préstamo registrado", { description: `${item.name} → ${student.trim()} (${course})` })
    reset()
  }

  return (
    <>
      <PageHeader
        title="Nuevo préstamo a alumno"
        description="Escaneá la herramienta, cargá al alumno y elegí el docente que autoriza."
      />
      <form onSubmit={handleSubmit} noValidate className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>1. Herramienta</CardTitle>
            <CardDescription>El estado cambia a “Prestado” al confirmar.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {item ? (
              <>
                <ItemSummary item={item} onClear={() => setItem(null)} />
                {itemError && (
                  <Alert variant="destructive">
                    <AlertDescription>{itemError}</AlertDescription>
                  </Alert>
                )}
              </>
            ) : (
              <ItemScanner
                ref={scannerRef}
                onScan={(i) => {
                  setItem(i)
                  setError(null)
                  if (i.status === "disponible") setTimeout(() => studentRef.current?.focus(), 0)
                }}
                suggestionFilter={(i) => i.category !== "Proyector"}
                demoCodes={["AT-0003", "AT-0007", "AT-0001", "AT-0006"]}
              />
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>2. Alumno y autorización</CardTitle>
            <CardDescription>Registrado por {user?.name} · Turno {user?.shift}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="student">Nombre y apellido del alumno</Label>
              <Input
                ref={studentRef}
                id="student"
                className="h-10"
                value={student}
                aria-invalid={submitted && !student.trim()}
                onChange={(e) => setStudent(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="course">Curso</Label>
              <NativeSelect
                id="course"
                value={course}
                aria-invalid={submitted && !course}
                onChange={(e) => setCourse(e.target.value)}
              >
                <option value="">Elegí un curso</option>
                {COURSES.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </NativeSelect>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="teacher">Docente que autoriza</Label>
              <NativeSelect
                id="teacher"
                value={teacher}
                aria-invalid={submitted && !teacher}
                onChange={(e) => setTeacher(e.target.value)}
              >
                <option value="">Elegí un docente</option>
                {TEACHERS.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </NativeSelect>
              <p className="text-xs text-muted-foreground">Obligatorio: el docente queda como responsable del préstamo.</p>
            </div>

            {error && (
              <Alert variant="destructive" role="alert">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="flex gap-2">
              <Button type="submit" size="lg" className="h-11 flex-1" disabled={!!itemError}>
                <Check data-icon="inline-start" aria-hidden="true" />
                Confirmar préstamo
              </Button>
              <Button type="button" variant="outline" size="lg" className="h-11" onClick={reset}>
                Limpiar
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </>
  )
}

"use client"

import { createContext, useCallback, useContext, useMemo, useState } from "react"
import { INITIAL_DAMAGES, INITIAL_ITEMS, INITIAL_LOANS, INITIAL_RESERVATIONS, TEACHERS as INITIAL_TEACHERS, USERS } from "./mock-data"
import type { DamageRecord, Item, Loan, Reservation, User } from "./types"

type Result = { ok: true } | { ok: false; error: string }

interface StoreValue {
  user: User | null
  items: Item[]
  loans: Loan[]
  damages: DamageRecord[]
  reservations: Reservation[]
  teachers: string[]
  login: (username: string, password: string) => Result
  logout: () => void
  findItem: (code: string) => Item | undefined
  activeLoanFor: (code: string) => Loan | undefined
  lendToStudent: (input: { itemCode?: string; itemCodes?: string[]; studentName: string; course: string; teacher: string } | any) => Result
  lendBatch: (input: { teacher: string; itemCodes: string[] }) => Result
  registerReturn: (input: { itemCode: string; condition: "bueno" | "dañado"; description?: string }) => Result
  reserveProjector: (input: Omit<Reservation, "id">) => Result
  cancelReservation: (id: string) => void
  addItem: (input: {
    name: string
    category: string
    sector: Item["sector"]
    location: string
    status?: Item["status"]
    code?: string
  }) => Result & { code?: string }
  addTeacher: (name: string) => Result
  removeTeacher: (name: string) => void
}

const StoreContext = createContext<StoreValue | null>(null)

let counter = 200
const nextId = (prefix: string) => `${prefix}-${++counter}`

const LABELS: Record<string, string> = {
  mgarcia: "Encargado 1",
  lperez: "Encargado 2",
  directora: "Directivo",
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [items, setItems] = useState<Item[]>(INITIAL_ITEMS)
  const [loans, setLoans] = useState<Loan[]>(INITIAL_LOANS)
  const [damages, setDamages] = useState<DamageRecord[]>(INITIAL_DAMAGES)
  const [reservations, setReservations] = useState<Reservation[]>(INITIAL_RESERVATIONS)
  const [teachers, setTeachers] = useState<string[]>([...INITIAL_TEACHERS])

  const findItem = useCallback(
    (code: string) => items.find((i) => i.code.toLowerCase() === code.trim().toLowerCase()),
    [items],
  )
  const activeLoanFor = useCallback(
    (code: string) => loans.find((l) => l.itemCode === code && !l.returnedAt),
    [loans],
  )

  const setStatus = (codes: string[], status: Item["status"]) =>
    setItems((prev) => prev.map((i) => (codes.includes(i.code) ? { ...i, status } : i)))

  const value = useMemo<StoreValue>(() => {
    const ensureAvailable = (code: string): Result => {
      const item = findItem(code)
      if (!item) return { ok: false, error: `El código ${code} no existe en el inventario.` }
      if (item.status === "prestado") return { ok: false, error: `${item.name} (${item.code}) ya está prestado.` }
      if (item.status === "dañado") return { ok: false, error: `${item.name} (${item.code}) está dañado y no se puede prestar.` }
      return { ok: true }
    }

    return {
      user,
      items,
      loans,
      damages,
      reservations,
      teachers,
      findItem,
      activeLoanFor,
      login(username, password) {
        const found = USERS.find((u) => u.username === username.trim().toLowerCase() && u.password === password)
        if (!found) return { ok: false, error: "Usuario o contraseña incorrectos." }
        setUser(found)
        return { ok: true }
      },
      logout() {
        setUser(null)
      },
      lendToStudent(input: any) {
        const itemCodes: string[] = Array.isArray(input.itemCodes)
          ? input.itemCodes
          : input.itemCode
            ? [input.itemCode]
            : []
        const studentName = input.studentName || input.borrowerName || ""
        const course = input.course?.trim() || ""
        const teacher = input.teacher?.trim() || input.authorizedBy?.trim() || ""

        if (!itemCodes || itemCodes.length === 0) return { ok: false, error: "Seleccioná al menos una herramienta." }
        if (!studentName?.trim()) return { ok: false, error: "Ingresá el nombre y apellido del alumno." }

        for (const code of itemCodes) {
          const check = ensureAvailable(code)
          if (!check.ok) return check
        }

        const now = new Date().toISOString()
        const shift = user?.shift ?? "Mañana"
        const registeredBy = user?.username ? LABELS[user.username] || user?.name || "" : user?.name ?? ""
        const batchId = itemCodes.length > 1 ? nextId("LT") : undefined

        setLoans((prev) => [
          ...itemCodes.map<Loan>((code) => ({
            id: nextId("L"),
            itemCode: code,
            borrowerType: "alumno",
            borrowerName: studentName.trim(),
            course: course || undefined,
            authorizedBy: teacher || undefined,
            batchId,
            startedAt: now,
            shift,
            registeredBy,
          })),
          ...prev,
        ])
        setStatus(itemCodes, "prestado")
        return { ok: true }
      },
      lendBatch({ teacher, itemCodes }) {
        if (!teacher?.trim()) return { ok: false, error: "Seleccioná el docente." }
        if (!itemCodes || itemCodes.length === 0) return { ok: false, error: "Escaneá al menos una herramienta." }
        for (const code of itemCodes) {
          const check = ensureAvailable(code)
          if (!check.ok) return check
        }
        const batchId = nextId("LT")
        const now = new Date().toISOString()
        setLoans((prev) => [
          ...itemCodes.map<Loan>((itemCode) => ({
            id: nextId("L"),
            itemCode,
            borrowerType: "docente",
            borrowerName: teacher.trim(),
            batchId,
            startedAt: now,
            shift: user?.shift ?? "Mañana",
            registeredBy: user?.username ? LABELS[user.username] || user?.name || "" : user?.name ?? "",
          })),
          ...prev,
        ])
        setStatus(itemCodes, "prestado")
        return { ok: true }
      },
      registerReturn({ itemCode, condition, description }) {
        const loan = activeLoanFor(itemCode)
        if (!loan) return { ok: false, error: "Esta herramienta no figura como prestada." }
        if (condition === "dañado" && !description?.trim())
          return { ok: false, error: "Describí qué le pasó a la herramienta antes de guardar." }
        const now = new Date().toISOString()
        setLoans((prev) =>
          prev.map((l) => (l.id === loan.id ? { ...l, returnedAt: now, returnedCondition: condition } : l)),
        )
        if (condition === "dañado") {
          const responsible =
            loan.borrowerType === "alumno"
              ? `${loan.borrowerName}${loan.course ? ` (${loan.course})` : ""} – avaló ${loan.authorizedBy ?? "—"}`
              : loan.borrowerName
          setDamages((prev) => [
            { id: nextId("D"), itemCode, description: description!.trim(), responsible, reportedBy: user?.name ?? "", date: now },
            ...prev,
          ])
        }
        setStatus([itemCode], condition === "dañado" ? "dañado" : "disponible")
        return { ok: true }
      },
      reserveProjector(input) {
        if (!input.teacher?.trim()) return { ok: false, error: "Elegí el docente." }
        if (!input.course?.trim()) return { ok: false, error: "Elegí el curso." }
        const d = new Date()
        const todayKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
        if (input.date < todayKey) return { ok: false, error: "No se pueden reservar horarios pasados." }
        const taken = reservations.some(
          (r) => r.projectorCode === input.projectorCode && r.date === input.date && r.slot === input.slot,
        )
        if (taken) return { ok: false, error: "Ese horario ya está ocupado. Elegí otro." }
        setReservations((prev) => [...prev, { ...input, teacher: input.teacher.trim(), course: input.course.trim(), id: nextId("R") }])
        return { ok: true }
      },
      cancelReservation(id) {
        setReservations((prev) => prev.filter((r) => r.id !== id))
      },
      addItem(input) {
        if (!input.name?.trim()) return { ok: false, error: "Ingresá el nombre de la herramienta/equipo." }
        if (!input.category?.trim()) return { ok: false, error: "Ingresá la categoría." }
        if (!input.location?.trim()) return { ok: false, error: "Ingresá la ubicación/estante." }
        if (!input.sector) return { ok: false, error: "Seleccioná el sector." }

        const prefix = input.sector === "Biblioteca" ? "BI" : "AT"
        let code = input.code?.trim().toUpperCase()
        if (code) {
          if (items.some((i) => i.code.toUpperCase() === code)) {
            return { ok: false, error: `Ya existe un equipo con el código ${code}.` }
          }
        } else {
          const nums = items
            .filter((i) => i.code.startsWith(prefix))
            .map((i) => {
              const m = i.code.match(/-(\d+)$/)
              return m ? parseInt(m[1], 10) : 0
            })
          const nextNum = (Math.max(0, ...nums) + 1).toString().padStart(4, "0")
          code = `${prefix}-${nextNum}`
        }

        const newItem: Item = {
          code: code!,
          name: input.name.trim(),
          category: input.category.trim(),
          sector: input.sector,
          location: input.location.trim(),
          status: input.status || "disponible",
        }
        setItems((prev) => [newItem, ...prev])
        return { ok: true, code }
      },
      addTeacher(name: string) {
        const trimmed = name.trim()
        if (!trimmed) return { ok: false, error: "Ingresá el nombre del docente." }
        if (teachers.some((t) => t.toLowerCase() === trimmed.toLowerCase())) {
          return { ok: false, error: "Ese docente ya está cargado." }
        }
        setTeachers((prev) => [trimmed, ...prev].sort((a, b) => a.localeCompare(b)))
        return { ok: true }
      },
      removeTeacher(name: string) {
        setTeachers((prev) => prev.filter((t) => t !== name))
      },
    }
  }, [user, items, loans, damages, reservations, teachers, findItem, activeLoanFor])

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error("useStore debe usarse dentro de StoreProvider")
  return ctx
}

export function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("es-AR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })
}

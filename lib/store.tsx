"use client"

import { createContext, useCallback, useContext, useMemo, useState } from "react"
import { INITIAL_DAMAGES, INITIAL_ITEMS, INITIAL_LOANS, INITIAL_RESERVATIONS, USERS } from "./mock-data"
import type { DamageRecord, Item, Loan, Reservation, User } from "./types"

type Result = { ok: true } | { ok: false; error: string }

interface StoreValue {
  user: User | null
  items: Item[]
  loans: Loan[]
  damages: DamageRecord[]
  reservations: Reservation[]
  login: (username: string, password: string) => Result
  logout: () => void
  findItem: (code: string) => Item | undefined
  activeLoanFor: (code: string) => Loan | undefined
  lendToStudent: (input: { itemCode: string; studentName: string; course: string; teacher: string }) => Result
  lendBatch: (input: { teacher: string; itemCodes: string[] }) => Result
  registerReturn: (input: { itemCode: string; condition: "bueno" | "dañado"; description?: string }) => Result
  reserveProjector: (input: Omit<Reservation, "id">) => Result
  cancelReservation: (id: string) => void
}

const StoreContext = createContext<StoreValue | null>(null)

let counter = 200
const nextId = (prefix: string) => `${prefix}-${++counter}`

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [items, setItems] = useState<Item[]>(INITIAL_ITEMS)
  const [loans, setLoans] = useState<Loan[]>(INITIAL_LOANS)
  const [damages, setDamages] = useState<DamageRecord[]>(INITIAL_DAMAGES)
  const [reservations, setReservations] = useState<Reservation[]>(INITIAL_RESERVATIONS)

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
      lendToStudent({ itemCode, studentName, course, teacher }) {
        const check = ensureAvailable(itemCode)
        if (!check.ok) return check
        setLoans((prev) => [
          {
            id: nextId("L"),
            itemCode,
            borrowerType: "alumno",
            borrowerName: studentName,
            course,
            authorizedBy: teacher,
            startedAt: new Date().toISOString(),
            shift: user?.shift ?? "Mañana",
            registeredBy: user?.name ?? "",
          },
          ...prev,
        ])
        setStatus([itemCode], "prestado")
        return { ok: true }
      },
      lendBatch({ teacher, itemCodes }) {
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
            borrowerName: teacher,
            batchId,
            startedAt: now,
            shift: user?.shift ?? "Mañana",
            registeredBy: user?.name ?? "",
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
              ? `${loan.borrowerName} (${loan.course}) – avaló ${loan.authorizedBy}`
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
        const taken = reservations.some(
          (r) => r.projectorCode === input.projectorCode && r.date === input.date && r.slot === input.slot,
        )
        if (taken) return { ok: false, error: "Ese horario ya está ocupado. Elegí otro." }
        setReservations((prev) => [...prev, { ...input, id: nextId("R") }])
        return { ok: true }
      },
      cancelReservation(id) {
        setReservations((prev) => prev.filter((r) => r.id !== id))
      },
    }
  }, [user, items, loans, damages, reservations, findItem, activeLoanFor])

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

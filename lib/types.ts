export type ItemStatus = "disponible" | "prestado" | "dañado"
export type Sector = "Área Técnica" | "Biblioteca"
export type Shift = "Mañana" | "Tarde" | "Noche"
export type Role = "encargado" | "directivo"

export interface Item {
  code: string
  name: string
  category: string
  sector: Sector
  location: string
  status: ItemStatus
}

export interface User {
  username: string
  password: string
  name: string
  role: Role
  shift: Shift
}

export interface Loan {
  id: string
  itemCode: string
  borrowerType: "alumno" | "docente"
  borrowerName: string
  course?: string
  authorizedBy?: string
  batchId?: string
  startedAt: string
  shift: Shift
  registeredBy: string
  returnedAt?: string
  returnedCondition?: "bueno" | "dañado"
}

export interface DamageRecord {
  id: string
  itemCode: string
  description: string
  responsible: string
  reportedBy: string
  date: string
}

export interface Reservation {
  id: string
  projectorCode: string
  date: string
  slot: number
  teacher: string
  course: string
}

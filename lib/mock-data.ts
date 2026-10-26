import type { DamageRecord, Item, Loan, Reservation, User } from "./types"

export const USERS: User[] = [
  { username: "mgarcia", password: "1234", name: "Marta García", role: "encargado", shift: "Mañana" },
  { username: "lperez", password: "1234", name: "Luis Pérez", role: "encargado", shift: "Tarde" },
  { username: "directora", password: "1234", name: "Prof. Silvia Romero", role: "directivo", shift: "Mañana" },
]

export const TEACHERS = [
  "Prof. Juan Tortelli",
  "Prof. Ana Medina",
  "Prof. Carlos Ruiz",
  "Prof. Laura Sosa",
  "Prof. Diego Funes",
  "Prof. Paula Ibarra",
]

export const COURSES = ["1° A", "1° B", "2° A", "2° B", "3° A", "3° B", "4° A", "5° A", "6° A"]

export const SLOTS = [
  "07:30 – 08:50",
  "09:00 – 10:20",
  "10:30 – 11:50",
  "13:30 – 14:50",
  "15:00 – 16:20",
  "16:30 – 17:50",
]

export const INITIAL_ITEMS: Item[] = [
  // Alargues
  { code: "AT-0001", name: "Alargue eléctrico 5m", category: "Cables y accesorios", sector: "Área Técnica", location: "Cajón C1", status: "disponible" },
  { code: "AT-0002", name: "Alargue eléctrico 5m", category: "Cables y accesorios", sector: "Área Técnica", location: "Cajón C1", status: "disponible" },
  { code: "AT-0003", name: "Alargue eléctrico 5m", category: "Cables y accesorios", sector: "Área Técnica", location: "Cajón C1", status: "prestado" },
  { code: "AT-0004", name: "Alargue eléctrico 3m", category: "Cables y accesorios", sector: "Área Técnica", location: "Cajón C1", status: "disponible" },
  { code: "AT-0005", name: "Alargue eléctrico 3m", category: "Cables y accesorios", sector: "Área Técnica", location: "Cajón C1", status: "disponible" },
  // Zapatillas / regletas
  { code: "AT-0006", name: "Zapatilla eléctrica 4 tomas", category: "Cables y accesorios", sector: "Área Técnica", location: "Cajón C1", status: "disponible" },
  { code: "AT-0007", name: "Zapatilla eléctrica 6 tomas", category: "Cables y accesorios", sector: "Área Técnica", location: "Cajón C1", status: "disponible" },
  { code: "AT-0008", name: "Zapatilla eléctrica 6 tomas", category: "Cables y accesorios", sector: "Área Técnica", location: "Cajón C1", status: "disponible" },
  // Cables
  { code: "AT-0009", name: "Cable HDMI 2m", category: "Cables y accesorios", sector: "Área Técnica", location: "Cajón C2", status: "disponible" },
  { code: "AT-0010", name: "Cable HDMI 2m", category: "Cables y accesorios", sector: "Área Técnica", location: "Cajón C2", status: "disponible" },
  { code: "AT-0011", name: "Cable VGA 1.5m", category: "Cables y accesorios", sector: "Área Técnica", location: "Cajón C2", status: "disponible" },
  { code: "AT-0012", name: "Cable VGA 1.5m", category: "Cables y accesorios", sector: "Área Técnica", location: "Cajón C2", status: "disponible" },
  { code: "AT-0013", name: "Adaptador HDMI-VGA", category: "Cables y accesorios", sector: "Área Técnica", location: "Cajón C2", status: "disponible" },
  { code: "AT-0014", name: "Adaptador VGA-HDMI", category: "Cables y accesorios", sector: "Área Técnica", location: "Cajón C2", status: "disponible" },
  // Proyectores
  { code: "PR-0001", name: "Proyector Epson X41", category: "Proyector", sector: "Área Técnica", location: "Armario P1", status: "disponible" },
  { code: "PR-0002", name: "Proyector Epson X41", category: "Proyector", sector: "Área Técnica", location: "Armario P1", status: "disponible" },
  { code: "PR-0003", name: "Proyector BenQ MS560", category: "Proyector", sector: "Área Técnica", location: "Armario P2", status: "disponible" },
  // Notebooks Sala de Computación
  ...Array.from({ length: 30 }, (_, i) => {
    const num = String(i + 1).padStart(2, "0")
    return { code: `NB-${num}`, name: `Notebook Sala de Computación N° ${i + 1}`, category: "Informática", sector: "Área Técnica" as const, location: "Sala de Computación", status: "disponible" as const }
  }),
  // Biblioteca
  { code: "BI-0001", name: "Atlas geográfico universal", category: "Libro", sector: "Biblioteca", location: "Estante L3", status: "disponible" },
  { code: "BI-0002", name: "Diccionario RAE", category: "Libro", sector: "Biblioteca", location: "Estante L1", status: "prestado" },
  { code: "BI-0003", name: "Calculadora científica Casio", category: "Útiles", sector: "Biblioteca", location: "Cajón U2", status: "disponible" },
  { code: "BI-0004", name: "Calculadora científica Casio", category: "Útiles", sector: "Biblioteca", location: "Cajón U2", status: "disponible" },
  { code: "BI-0005", name: "Calculadora científica Casio", category: "Útiles", sector: "Biblioteca", location: "Cajón U2", status: "disponible" },
  { code: "BI-0006", name: "Parlante Bluetooth JBL", category: "Audio", sector: "Biblioteca", location: "Armario A1", status: "disponible" },
]

function todayAt(hours: number, minutes: number, dayOffset = 0) {
  const d = new Date()
  d.setDate(d.getDate() + dayOffset)
  d.setHours(hours, minutes, 0, 0)
  return d.toISOString()
}

export const INITIAL_LOANS: Loan[] = [
  { id: "L-101", itemCode: "AT-0003", borrowerType: "alumno", borrowerName: "Tomás Herrera", course: "5° A", authorizedBy: "Prof. Carlos Ruiz", startedAt: todayAt(8, 5), shift: "Mañana", registeredBy: "Marta García" },
  { id: "L-102", itemCode: "BI-0002", borrowerType: "docente", borrowerName: "Prof. Laura Sosa", startedAt: todayAt(13, 45), shift: "Tarde", registeredBy: "Luis Pérez" },
]

export const INITIAL_DAMAGES: DamageRecord[] = []

export function toDateKey(d: Date) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

export function getWeekDays(reference = new Date()) {
  const monday = new Date(reference)
  const dow = (monday.getDay() + 6) % 7
  monday.setDate(monday.getDate() - dow)
  monday.setHours(0, 0, 0, 0)
  return Array.from({ length: 5 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    return d
  })
}

const week = getWeekDays()

export const INITIAL_RESERVATIONS: Reservation[] = [
  { id: "R-1", projectorCode: "PR-0001", date: toDateKey(week[0]), slot: 1, teacher: "Prof. Ana Medina", course: "4° A" },
  { id: "R-2", projectorCode: "PR-0001", date: toDateKey(week[2]), slot: 0, teacher: "Prof. Juan Tortelli", course: "5° A" },
  { id: "R-3", projectorCode: "PR-0001", date: toDateKey(week[2]), slot: 3, teacher: "Prof. Laura Sosa", course: "2° B" },
  { id: "R-4", projectorCode: "PR-0001", date: toDateKey(week[3]), slot: 2, teacher: "Prof. Paula Ibarra", course: "1° A" },
  { id: "R-5", projectorCode: "PR-0002", date: toDateKey(week[1]), slot: 4, teacher: "Prof. Diego Funes", course: "6° A" },
  { id: "R-6", projectorCode: "PR-0002", date: toDateKey(week[2]), slot: 2, teacher: "Prof. Carlos Ruiz", course: "3° A" },
  { id: "R-7", projectorCode: "PR-0003", date: toDateKey(week[4]), slot: 1, teacher: "Prof. Ana Medina", course: "4° A" },
]

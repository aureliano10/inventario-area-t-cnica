"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  Boxes,
  ClipboardList,
  FileDown,
  History,
  LayoutDashboard,
  LogOut,
  Menu,
  Projector,
  ScanSearch,
  Undo2,
  UserPlus,
  Users,
  X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useStore } from "@/lib/store"
import type { Role } from "@/lib/types"
import { cn } from "@/lib/utils"

const NAV: { href: string; label: string; icon: typeof Boxes; roles: Role[]; shortcut?: string }[] = [
  { href: "/panel", label: "Panel de préstamos", icon: LayoutDashboard, roles: ["encargado", "directivo"] },
  { href: "/prestamos/alumno", label: "Nuevo préstamo", icon: UserPlus, roles: ["encargado"], shortcut: "N" },
  { href: "/prestamos/lote", label: "Préstamo por lote", icon: Users, roles: ["encargado"], shortcut: "L" },
  { href: "/devolucion", label: "Devolución", icon: Undo2, roles: ["encargado"], shortcut: "D" },
  { href: "/proyectores", label: "Proyectores", icon: Projector, roles: ["encargado"], shortcut: "P" },
  { href: "/consulta", label: "Consulta rápida", icon: ScanSearch, roles: ["encargado"], shortcut: "C" },
  { href: "/historial", label: "Historial de préstamos", icon: History, roles: ["encargado", "directivo"] },
  { href: "/inventario", label: "Inventario", icon: ClipboardList, roles: ["encargado", "directivo"] },
  { href: "/reportes", label: "Reportes", icon: FileDown, roles: ["encargado", "directivo"] },
]

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, logout } = useStore()
  const router = useRouter()
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    if (!user) router.replace("/")
  }, [user, router])

  const nav = user ? NAV.filter((n) => n.roles.includes(user.role)) : []

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (!e.altKey) return
      const target = nav.find((n) => n.shortcut && e.code === `Key${n.shortcut}`)
      if (target) {
        e.preventDefault()
        router.push(target.href)
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [nav, router])

  if (!user) return null

  return (
    <div className="flex min-h-dvh flex-col md:flex-row">
      <a
        href="#contenido"
        className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded focus:bg-primary focus:px-3 focus:py-2 focus:text-primary-foreground"
      >
        Saltar al contenido
      </a>

      <aside
        className={cn(
          "no-print flex-col bg-sidebar text-sidebar-foreground md:sticky md:top-0 md:flex md:h-dvh md:w-64 md:shrink-0",
          mobileOpen ? "flex" : "hidden",
        )}
        aria-label="Navegación principal"
      >
        <div className="hidden items-center gap-3 px-5 py-5 md:flex">
          <span className="flex size-9 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
            <Boxes className="size-5" aria-hidden="true" />
          </span>
          <div className="leading-tight">
            <p className="text-sm font-semibold">Área Técnica</p>
            <p className="text-xs text-sidebar-foreground/65">ENS Dalmacio Vélez Sarsfield</p>
          </div>
        </div>
        <nav className="flex-1 px-3 py-2">
          <ul className="flex flex-col gap-0.5">
            {nav.map((n) => {
              const active = pathname === n.href
              return (
                <li key={n.href}>
                  <Link
                    href={n.href}
                    onClick={() => setMobileOpen(false)}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-sidebar-ring",
                      active
                        ? "bg-sidebar-primary text-sidebar-primary-foreground"
                        : "text-sidebar-foreground/85 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                    )}
                  >
                    <n.icon className="size-4 shrink-0" aria-hidden="true" />
                    <span className="flex-1">{n.label}</span>
                    {n.shortcut && (
                      <kbd
                        className={cn(
                          "rounded px-1.5 font-mono text-[10px]",
                          active ? "bg-sidebar/15" : "bg-sidebar-accent text-sidebar-foreground/70",
                        )}
                        aria-label={`Atajo Alt + ${n.shortcut}`}
                      >
                        Alt+{n.shortcut}
                      </kbd>
                    )}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>
        <div className="border-t border-sidebar-border p-4">
          <p className="text-sm font-medium">{user.name}</p>
          <p className="text-xs text-sidebar-foreground/65">
            {user.role === "directivo" ? "Directivo" : `Encargado · Turno ${user.shift}`}
          </p>
          <Button
            variant="ghost"
            className="mt-3 w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            onClick={logout}
          >
            <LogOut data-icon="inline-start" aria-hidden="true" />
            Cerrar sesión
          </Button>
        </div>
      </aside>

      <header className="no-print order-first flex items-center justify-between bg-sidebar px-4 py-3 text-sidebar-foreground md:hidden">
        <div className="flex items-center gap-2">
          <Boxes className="size-5 text-sidebar-primary" aria-hidden="true" />
          <span className="text-sm font-semibold">Área Técnica</span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          onClick={() => setMobileOpen((o) => !o)}
          aria-expanded={mobileOpen}
          aria-label={mobileOpen ? "Cerrar menú" : "Abrir menú"}
        >
          {mobileOpen ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
        </Button>
      </header>

      <main id="contenido" className="min-w-0 flex-1 px-4 py-6 md:px-8 md:py-8">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 overflow-visible">{children}</div>
      </main>
    </div>
  )
}

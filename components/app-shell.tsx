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

const NAV: { href: string; label: string; icon: typeof Boxes; roles: Role[]; shortcut?: string; section?: string }[] = [
  { href: "/panel", label: "Panel", icon: LayoutDashboard, roles: ["encargado", "directivo"] },
  { href: "/prestamos/simple", label: "Préstamo simple", icon: UserPlus, roles: ["encargado"], shortcut: "N", section: "Préstamos" },
  { href: "/prestamos/lote", label: "Préstamo por lote", icon: Users, roles: ["encargado"], shortcut: "L", section: "Préstamos" },
  { href: "/devolucion", label: "Devoluciones", icon: Undo2, roles: ["encargado"], shortcut: "D", section: "Préstamos" },
  { href: "/proyectores", label: "Proyectores", icon: Projector, roles: ["encargado"], shortcut: "P", section: "Préstamos" },
  { href: "/consulta", label: "Consulta rápida", icon: ScanSearch, roles: ["encargado"], shortcut: "C", section: "Gestión" },
  { href: "/historial", label: "Historial", icon: History, roles: ["encargado", "directivo"], section: "Gestión" },
  { href: "/inventario", label: "Inventario", icon: ClipboardList, roles: ["encargado", "directivo"], section: "Gestión" },
  { href: "/reportes", label: "Reportes", icon: FileDown, roles: ["encargado", "directivo"], section: "Gestión" },
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
          "no-print flex-col bg-sidebar text-sidebar-foreground md:sticky md:top-0 md:flex md:h-dvh md:w-60 md:shrink-0",
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
        <nav className="flex-1 overflow-y-auto px-2 py-2">
          {(() => {
            const sections = ["Préstamos", "Gestión"]
            const general = nav.filter((n) => !n.section)
            return (
              <>
                {general.length > 0 && (
                  <ul className="mb-3 flex flex-col gap-0.5">
                    {general.map((n) => {
                      const active = pathname === n.href
                      return (
                        <li key={n.href}>
                          <Link
                            href={n.href}
                            onClick={() => setMobileOpen(false)}
                            aria-current={active ? "page" : undefined}
                            className={cn(
                              "flex items-center gap-2.5 rounded-md px-2 py-2 text-sm font-medium transition-colors",
                              active
                                ? "bg-sidebar-primary text-sidebar-primary-foreground"
                                : "text-sidebar-foreground/85 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                            )}
                          >
                            <n.icon className="size-4 shrink-0" aria-hidden="true" />
                            <span className="flex-1">{n.label}</span>
                            {n.shortcut && (
                              <kbd className={cn("rounded px-1 py-0.5 font-mono text-[10px]", active ? "bg-sidebar/15" : "bg-sidebar-accent/70 text-sidebar-foreground/60")}>
                                Alt+{n.shortcut}
                              </kbd>
                            )}
                          </Link>
                        </li>
                      )
                    })}
                  </ul>
                )}
                {sections.map((sec) => {
                  const items = nav.filter((n) => n.section === sec)
                  if (items.length === 0) return null
                  return (
                    <div key={sec} className="mb-3">
                      <p className="mb-1 px-2 text-[10px] font-semibold uppercase tracking-widest text-sidebar-foreground/40">{sec}</p>
                      <ul className="flex flex-col gap-0.5">
                        {items.map((n) => {
                          const active = pathname === n.href
                          return (
                            <li key={n.href}>
                              <Link
                                href={n.href}
                                onClick={() => setMobileOpen(false)}
                                aria-current={active ? "page" : undefined}
                                className={cn(
                                  "flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm transition-colors",
                                  active
                                    ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
                                    : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
                                )}
                              >
                                <n.icon className="size-4 shrink-0" aria-hidden="true" />
                                <span className="flex-1">{n.label}</span>
                                {n.shortcut && (
                                  <kbd className={cn("rounded px-1 py-0.5 font-mono text-[10px]", active ? "bg-sidebar/15" : "bg-sidebar-accent/70 text-sidebar-foreground/50")}>
                                    Alt+{n.shortcut}
                                  </kbd>
                                )}
                              </Link>
                            </li>
                          )
                        })}
                      </ul>
                    </div>
                  )
                })}
              </>
            )
          })()}
        </nav>
        <div className="border-t border-sidebar-border p-3">
          <div className="mb-2 px-1">
            <p className="text-sm font-medium leading-tight">
              {user.username === "mgarcia" ? "Encargado 1" : user.username === "lperez" ? "Encargado 2" : user.username === "directora" ? "Directivo" : user.name}
            </p>
            <p className="text-xs text-sidebar-foreground/60">
              {user.role === "directivo" ? "Directivo" : `Turno ${user.shift}`}
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            onClick={logout}
          >
            <LogOut data-icon="inline-start" className="size-4" aria-hidden="true" />
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

      <main id="contenido" className="min-w-0 flex-1 px-4 py-6 md:px-6 lg:px-8 md:py-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 overflow-visible">{children}</div>
      </main>
    </div>
  )
}

"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Boxes } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useStore } from "@/lib/store"
import { USERS } from "@/lib/mock-data"

const LABELS: Record<string, string> = {
  mgarcia: "Encargado 1",
  lperez: "Encargado 2",
  directora: "Directivo",
}

export function LoginScreen() {
  const { login, user } = useStore()
  const router = useRouter()

  useEffect(() => {
    if (user) router.replace(user.role === "directivo" ? "/reportes" : "/panel")
  }, [user, router])

  return (
    <main className="grid min-h-dvh lg:grid-cols-2">
      <section className="hidden flex-col justify-between bg-sidebar p-10 text-sidebar-foreground lg:flex">
        <div className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
            <Boxes className="size-5" aria-hidden="true" />
          </span>
          <span className="font-semibold">ENS Dalmacio Vélez Sarsfield</span>
        </div>
        <div className="max-w-md">
          <h1 className="text-balance text-4xl font-semibold leading-tight">
            Control de préstamos del Área Técnica y Biblioteca
          </h1>
          <p className="mt-4 text-pretty leading-relaxed text-sidebar-foreground/75">
            Registrá entregas y devoluciones en segundos, escaneando el código de barras. El estado del inventario
            pasa automáticamente al siguiente turno.
          </p>
        </div>
        <p className="text-sm text-sidebar-foreground/60">Prototipo · Grupo N° 2 · Ingeniería del Software</p>
      </section>

      <section className="flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Seleccionar usuario</CardTitle>
              <CardDescription>Hacé clic en el usuario con el que querés ingresar.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              {USERS.map((u) => (
                <button
                  key={u.username}
                  type="button"
                  className="w-full rounded-md border px-3 py-2.5 text-left transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-ring"
                  onClick={() => login(u.username, u.password)}
                >
                  <span className="font-medium">{LABELS[u.username] || u.name}</span>
                  <span className="text-muted-foreground">
                    {" "}
                    · {u.role === "directivo" ? "Directivo" : `Encargado · Turno ${u.shift}`}
                  </span>
                </button>
              ))}
            </CardContent>
          </Card>
        </div>
      </section>
    </main>
  )
}

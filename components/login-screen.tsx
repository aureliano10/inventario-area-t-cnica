"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Boxes, LogIn } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useStore } from "@/lib/store"
import { USERS } from "@/lib/mock-data"

export function LoginScreen() {
  const { login, user } = useStore()
  const router = useRouter()
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (user) router.replace(user.role === "directivo" ? "/reportes" : "/panel")
  }, [user, router])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const result = login(username, password)
    if (!result.ok) setError(result.error)
  }

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
              <CardTitle className="text-xl">Iniciar sesión</CardTitle>
              <CardDescription>Ingresá con tu usuario de encargado o directivo.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="username">Usuario</Label>
                  <Input
                    id="username"
                    autoComplete="username"
                    autoFocus
                    required
                    className="h-10"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="password">Contraseña</Label>
                  <Input
                    id="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    className="h-10"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                {error && (
                  <Alert variant="destructive" role="alert">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                <Button type="submit" size="lg" className="h-10">
                  <LogIn data-icon="inline-start" aria-hidden="true" />
                  Ingresar
                </Button>
              </form>
            </CardContent>
          </Card>

          <div className="mt-6 rounded-lg border border-dashed bg-card p-4 text-sm">
            <p className="font-medium">Entrar rápido con un usuario de prueba</p>
            <p className="text-muted-foreground">Hacé clic en uno para ingresar (contraseña: 1234).</p>
            <ul className="mt-2 flex flex-col gap-1.5">
              {USERS.map((u) => (
                <li key={u.username}>
                  <button
                    type="button"
                    className="w-full rounded-md px-2 py-1 text-left hover:bg-muted focus-visible:outline-2 focus-visible:outline-ring"
                    onClick={() => {
                      setError(null)
                      const result = login(u.username, u.password)
                      if (!result.ok) setError(result.error)
                    }}
                  >
                    <span className="font-mono font-medium">{u.username}</span>
                    <span className="text-muted-foreground">
                      {" "}
                      · {u.role === "directivo" ? "Directivo" : `Encargado turno ${u.shift}`}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </main>
  )
}

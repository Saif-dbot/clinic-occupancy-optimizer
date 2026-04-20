'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useApp } from '@/contexts/app-context'
import { mockUsers } from '@/lib/mock-data'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { FieldGroup, Field } from '@/components/ui/field'
import { Spinner } from '@/components/ui/spinner'
import { AlertCircle, ArrowRight } from 'lucide-react'
import { toast } from 'sonner'
import type { UserRole } from '@/types'

const getHomePath = (role: UserRole) => (role === 'client' ? '/agenda' : '/dashboard')

export default function LoginPage() {
  const router = useRouter()
  const { login, isAuthenticated, currentRole } = useApp()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (isAuthenticated) {
      router.push(getHomePath(currentRole))
    }
  }, [isAuthenticated, currentRole, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const success = await login(email, password)
      if (success) {
        toast.success('Connexion réussie')
        const userRole = mockUsers.find(u => u.email === email)?.role ?? 'client'
        router.push(getHomePath(userRole))
      } else {
        setError('Email ou mot de passe incorrect')
      }
    } catch {
      setError('Une erreur est survenue')
    } finally {
      setLoading(false)
    }
  }

  const handleQuickLogin = async (role: 'admin' | 'secretaire' | 'medecin' | 'client') => {
    const emails = {
      admin: 'admin@clinique.fr',
      secretaire: 'secretaire@clinique.fr',
      medecin: 'medecin@clinique.fr',
      client: 'client@clinique.fr',
    }
    setEmail(emails[role])
    setLoading(true)
    const success = await login(emails[role], 'demo')
    if (success) {
      toast.success('Connexion réussie')
      router.push(getHomePath(role))
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-primary/5" />
      <div className="absolute inset-0 bg-noise pointer-events-none" />
      
      {/* Decorative elements */}
      <div className="absolute top-20 left-20 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
      <div className="absolute bottom-20 right-20 w-96 h-96 bg-chart-2/10 rounded-full blur-3xl" />

      <div className="relative w-full max-w-md animate-fade-in">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/25">
            <span className="text-primary-foreground font-bold text-xl">M</span>
          </div>
          <div>
            <h1 className="text-2xl font-bold">MediPlan</h1>
            <p className="text-sm text-muted-foreground">Gestion des rendez-vous</p>
          </div>
        </div>

        <Card className="border-border/70 shadow-xl bg-card/95 backdrop-blur-sm">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-xl">Connexion</CardTitle>
            <CardDescription>
              Accédez rapidement à votre espace MediPlan
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit}>
              <FieldGroup>
                <Field>
                  <Label htmlFor="email">Adresse email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="votre@email.fr"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-secondary/50"
                    required
                  />
                </Field>

                <Field>
                  <Label htmlFor="password">Mot de passe</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-secondary/50"
                    required
                  />
                </Field>

                {error && (
                  <div className="flex items-center gap-2 text-destructive text-sm bg-destructive/10 p-3 rounded-lg">
                    <AlertCircle className="w-4 h-4" />
                    {error}
                  </div>
                )}

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? (
                    <Spinner className="w-4 h-4" />
                  ) : (
                    <>
                      Se connecter
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              </FieldGroup>
            </form>

            {/* Quick login for demo */}
            <div className="mt-6 pt-6 border-t border-border">
              <p className="text-xs text-muted-foreground text-center mb-3">
                Accès rapide (démo)
              </p>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={() => handleQuickLogin('admin')}
                  disabled={loading}
                >
                  Admin
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={() => handleQuickLogin('secretaire')}
                  disabled={loading}
                >
                  Secrétaire
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={() => handleQuickLogin('medecin')}
                  disabled={loading}
                >
                  Médecin
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={() => handleQuickLogin('client')}
                  disabled={loading}
                >
                  Client
                </Button>
              </div>
              <p className="text-[11px] text-muted-foreground mt-3 text-center">
                Comptes démo: admin, secrétaire, médecin et client
              </p>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-6">
          Solution de gestion des rendez-vous médicaux et réduction du no-show
        </p>
      </div>
    </div>
  )
}

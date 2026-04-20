'use client'

import { Suspense, useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { AlertCircle, Loader2, Lock, Mail } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'

const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
})

type LoginFormValues = z.infer<typeof loginSchema>

const AUTH_ERRORS: Record<string, string> = {
  CredentialsSignin: 'Invalid email or password.',
  Default: 'Something went wrong. Please try again.',
  SessionRequired: 'Please sign in to continue.',
}

export default function AgencyLoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-950" />}>
      <AgencyLoginForm />
    </Suspense>
  )
}

function AgencyLoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') || '/agency/projects'
  const urlError = searchParams.get('error')

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(
    urlError ? AUTH_ERRORS[urlError] || AUTH_ERRORS.Default : null,
  )

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  async function onSubmit(data: LoginFormValues) {
    setIsLoading(true)
    setError(null)

    const result = await signIn('credentials', {
      email: data.email,
      password: data.password,
      redirect: false,
      callbackUrl,
    })

    setIsLoading(false)

    if (result?.error) {
      setError(result.error === 'CredentialsSignin'
        ? 'Invalid email or password.'
        : result.error,
      )
      return
    }

    if (result?.url) {
      router.push(result.url)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4">
      {/* Background pattern */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-blue-500/10 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-indigo-500/10 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo / Brand */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-white">
            SiteForge
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Agency Management Platform
          </p>
        </div>

        <Card className="border-slate-800 bg-slate-900/80 text-slate-100 ring-slate-800 backdrop-blur-sm">
          <CardHeader className="text-center">
            <CardTitle className="text-lg text-white">
              Sign in to your account
            </CardTitle>
            <CardDescription className="text-slate-400">
              Enter your credentials to access the dashboard
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {error && (
                <Alert variant="destructive" className="border-red-500/30 bg-red-500/10 text-red-400">
                  <AlertCircle className="size-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-300">
                  Email
                </Label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-slate-500" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@agency.com"
                    autoComplete="email"
                    className="h-10 border-slate-700 bg-slate-800/50 pl-9 text-white placeholder:text-slate-500 focus-visible:border-blue-500 focus-visible:ring-blue-500/30"
                    {...register('email')}
                  />
                </div>
                {errors.email && (
                  <p className="text-xs text-red-400">{errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-slate-300">
                    Password
                  </Label>
                  <a
                    href="/forgot-password"
                    className="text-xs text-blue-400 hover:text-blue-300 hover:underline"
                  >
                    Forgot password?
                  </a>
                </div>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-slate-500" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    className="h-10 border-slate-700 bg-slate-800/50 pl-9 text-white placeholder:text-slate-500 focus-visible:border-blue-500 focus-visible:ring-blue-500/30"
                    {...register('password')}
                  />
                </div>
                {errors.password && (
                  <p className="text-xs text-red-400">{errors.password.message}</p>
                )}
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="h-10 w-full bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  'Sign in'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="mt-6 text-center text-xs text-slate-500">
          Client? Visit your{' '}
          <a href="/portal/login" className="text-blue-400 hover:underline">
            project portal
          </a>{' '}
          instead.
        </p>
      </div>
    </div>
  )
}

'use client'

import { useState, useEffect } from 'react'
import { signIn } from 'next-auth/react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { AlertCircle, CheckCircle2, Loader2, Mail } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import type { BrandingConfig } from '@/types'

const emailSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Enter a valid email'),
})

type EmailFormValues = z.infer<typeof emailSchema>

interface PortalBranding {
  primaryColor: string
  secondaryColor: string
  logoUrl: string | null
  welcomeMessage: string | null
  portalTitle: string | null
}

const DEFAULT_BRANDING: PortalBranding = {
  primaryColor: '#3B82F6',
  secondaryColor: '#1E40AF',
  logoUrl: null,
  welcomeMessage: 'Welcome to your project portal. Sign in to view your project progress, deliverables, and communicate with our team.',
  portalTitle: 'Client Portal',
}

export default function PortalLoginPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [isSent, setIsSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [branding, setBranding] = useState<PortalBranding>(DEFAULT_BRANDING)

  useEffect(() => {
    async function loadBranding() {
      try {
        const res = await fetch('/api/branding')
        if (res.ok) {
          const data: BrandingConfig = await res.json()
          setBranding({
            primaryColor: data.primaryColor || DEFAULT_BRANDING.primaryColor,
            secondaryColor: data.secondaryColor || DEFAULT_BRANDING.secondaryColor,
            logoUrl: data.logoUrl,
            welcomeMessage: data.welcomeMessage || DEFAULT_BRANDING.welcomeMessage,
            portalTitle: data.portalTitle || DEFAULT_BRANDING.portalTitle,
          })
        }
      } catch {
        // Use default branding on error
      }
    }
    loadBranding()
  }, [])

  const {
    register,
    handleSubmit,
    formState: { errors },
    getValues,
  } = useForm<EmailFormValues>({
    resolver: zodResolver(emailSchema),
    defaultValues: {
      email: '',
    },
  })

  async function onSubmit(data: EmailFormValues) {
    setIsLoading(true)
    setError(null)

    const result = await signIn('email', {
      email: data.email,
      redirect: false,
      callbackUrl: '/portal',
    })

    setIsLoading(false)

    if (result?.error) {
      setError('Unable to send login link. Please check your email and try again.')
      return
    }

    setIsSent(true)
  }

  return (
    <div
      className="flex min-h-screen items-center justify-center px-4"
      style={{
        background: `linear-gradient(135deg, ${branding.secondaryColor}15 0%, ${branding.primaryColor}10 50%, ${branding.secondaryColor}08 100%)`,
      }}
    >
      {/* Background accents */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div
          className="absolute -top-40 -right-40 h-96 w-96 rounded-full blur-3xl"
          style={{ backgroundColor: `${branding.primaryColor}12` }}
        />
        <div
          className="absolute -bottom-40 -left-40 h-96 w-96 rounded-full blur-3xl"
          style={{ backgroundColor: `${branding.secondaryColor}12` }}
        />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo / Brand */}
        <div className="mb-8 flex flex-col items-center text-center">
          {branding.logoUrl ? (
            <img
              src={branding.logoUrl}
              alt="Logo"
              className="mb-4 h-12 w-auto object-contain"
            />
          ) : (
            <div
              className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl text-xl font-bold text-white"
              style={{ backgroundColor: branding.primaryColor }}
            >
              S
            </div>
          )}
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            {branding.portalTitle}
          </h1>
        </div>

        <Card className="border-gray-200 bg-white/90 shadow-xl backdrop-blur-sm">
          <CardHeader className="text-center">
            {isSent ? (
              <>
                <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                  <CheckCircle2 className="size-6 text-green-600" />
                </div>
                <CardTitle className="text-lg text-gray-900">
                  Check your email
                </CardTitle>
                <CardDescription className="text-gray-500">
                  We sent a login link to{' '}
                  <span className="font-medium text-gray-700">
                    {getValues('email')}
                  </span>
                  . Click the link in the email to sign in. It may take a minute to arrive.
                </CardDescription>
              </>
            ) : (
              <>
                <CardTitle className="text-lg text-gray-900">
                  Sign in to your portal
                </CardTitle>
                <CardDescription className="text-gray-500">
                  {branding.welcomeMessage}
                </CardDescription>
              </>
            )}
          </CardHeader>

          {!isSent && (
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                {error && (
                  <Alert variant="destructive" className="border-red-200 bg-red-50 text-red-700">
                    <AlertCircle className="size-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-gray-700">
                    Email address
                  </Label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="your@email.com"
                      autoComplete="email"
                      className="h-10 border-gray-300 bg-white pl-9 text-gray-900 placeholder:text-gray-400 focus-visible:border-blue-500 focus-visible:ring-blue-500/30"
                      {...register('email')}
                    />
                  </div>
                  {errors.email && (
                    <p className="text-xs text-red-500">{errors.email.message}</p>
                  )}
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="h-10 w-full text-white"
                  style={{ backgroundColor: branding.primaryColor }}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Sending link...
                    </>
                  ) : (
                    'Send me a login link'
                  )}
                </Button>

                <p className="text-center text-xs text-gray-400">
                  No password needed. We will send a secure link to your email.
                </p>
              </form>
            </CardContent>
          )}

          {isSent && (
            <CardContent>
              <div className="space-y-3">
                <Button
                  type="button"
                  variant="outline"
                  className="h-10 w-full border-gray-300 text-gray-700"
                  onClick={() => {
                    setIsSent(false)
                    setError(null)
                  }}
                >
                  Use a different email
                </Button>
                <p className="text-center text-xs text-gray-400">
                  Didn&apos;t receive the email? Check your spam folder or try again.
                </p>
              </div>
            </CardContent>
          )}
        </Card>

        <p className="mt-6 text-center text-xs text-gray-400">
          Agency team?{' '}
          <a
            href="/login"
            className="hover:underline"
            style={{ color: branding.primaryColor }}
          >
            Sign in here
          </a>
        </p>
      </div>
    </div>
  )
}

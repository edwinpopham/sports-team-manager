# Next.js App Router Authentication Patterns

## Overview
Complete guide for implementing authentication in Next.js App Router with Server Components, Client Components, and Middleware integration.

## Architecture Overview

```
┌─────────────────────┐    ┌──────────────────────┐    ┌─────────────────────┐
│    Middleware       │───▶│  Server Components   │───▶│  Client Components  │
│                     │    │                      │    │                     │
│ • Route Protection  │    │ • Session Access     │    │ • Interactive Auth  │
│ • Role Checking     │    │ • Server-side Data   │    │ • State Management  │
│ • Redirects         │    │ • SSR with Auth      │    │ • Form Handling     │
└─────────────────────┘    └──────────────────────┘    └─────────────────────┘
                                        │
                                        ▼
                           ┌──────────────────────┐
                           │    API Routes        │
                           │                      │
                           │ • Auth Endpoints     │
                           │ • Protected APIs     │
                           │ • Session Management │
                           └──────────────────────┘
```

## 1. Middleware Implementation

### Basic Authentication Middleware

```typescript
// middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function middleware(request: NextRequest) {
  const token = await getToken({ 
    req: request,
    secret: process.env.NEXTAUTH_SECRET 
  })
  
  const { pathname, origin } = request.nextUrl

  // Define route patterns
  const isPublicRoute = isPublicPath(pathname)
  const isAuthRoute = pathname.startsWith('/auth/')
  const isApiRoute = pathname.startsWith('/api/')
  const isTeamRoute = pathname.startsWith('/teams/')
  const isAdminRoute = pathname.startsWith('/admin/')

  // Handle unauthenticated users
  if (!token && !isPublicRoute && !isAuthRoute) {
    const signInUrl = new URL('/auth/signin', origin)
    signInUrl.searchParams.set('callbackUrl', request.url)
    return NextResponse.redirect(signInUrl)
  }

  // Redirect authenticated users away from auth pages
  if (token && isAuthRoute) {
    return NextResponse.redirect(new URL('/teams', origin))
  }

  // Team-specific route protection
  if (isTeamRoute && token) {
    const response = await handleTeamRoutes(request, token, pathname)
    if (response) return response
  }

  // Admin route protection
  if (isAdminRoute && token) {
    if (token.role !== 'SYSTEM_ADMIN') {
      return NextResponse.redirect(new URL('/unauthorized', origin))
    }
  }

  return NextResponse.next()
}

async function handleTeamRoutes(
  request: NextRequest, 
  token: any, 
  pathname: string
) {
  const teamId = extractTeamId(pathname)
  
  if (!teamId) return null

  const { origin } = request.nextUrl
  const userTeamRole = token.teamRoles?.[teamId]
  const isSystemAdmin = token.role === 'SYSTEM_ADMIN'

  // Check basic team access
  if (!isSystemAdmin && !userTeamRole) {
    return NextResponse.redirect(new URL('/teams', origin))
  }

  // Check management routes
  if (isManagementRoute(pathname)) {
    const canManage = isSystemAdmin || userTeamRole === 'MANAGER'
    if (!canManage) {
      return NextResponse.redirect(new URL(`/teams/${teamId}`, origin))
    }
  }

  return null
}

function isPublicPath(pathname: string): boolean {
  const publicPaths = [
    '/',
    '/about',
    '/privacy',
    '/terms'
  ]
  
  const publicPatterns = [
    /^\/api\/auth\/.*$/,    // NextAuth.js endpoints
    /^\/api\/health$/,      // Health check
    /^\/favicon\.ico$/,     // Favicon
    /^\/.*\.png$/,          // Images
    /^\/.*\.svg$/,          // SVG files
    /^\/_next\/.*$/         // Next.js assets
  ]

  return publicPaths.includes(pathname) || 
         publicPatterns.some(pattern => pattern.test(pathname))
}

function extractTeamId(pathname: string): string | null {
  const match = pathname.match(/^\/teams\/([^\/]+)/)
  return match ? match[1] : null
}

function isManagementRoute(pathname: string): boolean {
  return pathname.includes('/manage') || 
         pathname.includes('/edit') || 
         pathname.includes('/settings') ||
         pathname.endsWith('/players/new')
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (authentication endpoints)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - *.png, *.svg etc. (image files)
     */
    '/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.svg$).*)',
  ],
}
```

### Advanced Middleware Features

```typescript
// middleware.ts (extended version)
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

// Rate limiting map (in production, use Redis or similar)
const rateLimitMap = new Map<string, { count: number; timestamp: number }>()

export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request })
  const { pathname, origin } = request.nextUrl
  const userAgent = request.headers.get('user-agent') || ''

  // Apply rate limiting
  const rateLimitResponse = applyRateLimit(request, token)
  if (rateLimitResponse) return rateLimitResponse

  // Security headers
  const response = NextResponse.next()
  applySecurityHeaders(response, pathname)

  // Audit logging for sensitive routes
  if (shouldAuditRequest(pathname, token)) {
    await logSecurityEvent(request, token)
  }

  // Standard auth checks
  const authResponse = await performAuthChecks(request, token)
  if (authResponse) return authResponse

  return response
}

function applyRateLimit(request: NextRequest, token: any): NextResponse | null {
  // Skip rate limiting for authenticated admin users
  if (token?.role === 'SYSTEM_ADMIN') return null

  const identifier = token?.email || getClientIP(request)
  const now = Date.now()
  const windowMs = 15 * 60 * 1000 // 15 minutes
  const maxRequests = token ? 100 : 20 // Higher limit for authenticated users

  const current = rateLimitMap.get(identifier) || { count: 0, timestamp: now }

  // Reset window if expired
  if (now - current.timestamp > windowMs) {
    current.count = 0
    current.timestamp = now
  }

  current.count++
  rateLimitMap.set(identifier, current)

  if (current.count > maxRequests) {
    return new NextResponse(JSON.stringify({ error: 'Too many requests' }), {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': String(Math.ceil((windowMs - (now - current.timestamp)) / 1000))
      }
    })
  }

  return null
}

function applySecurityHeaders(response: NextResponse, pathname: string) {
  // HSTS
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')
  
  // Frame protection
  response.headers.set('X-Frame-Options', 'DENY')
  
  // Content type sniffing
  response.headers.set('X-Content-Type-Options', 'nosniff')
  
  // XSS protection
  response.headers.set('X-XSS-Protection', '1; mode=block')
  
  // Referrer policy
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  
  // CSP for specific routes
  if (pathname.startsWith('/teams/')) {
    response.headers.set(
      'Content-Security-Policy',
      "default-src 'self'; script-src 'self' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://accounts.google.com;"
    )
  }
}

function shouldAuditRequest(pathname: string, token: any): boolean {
  // Audit admin actions
  if (pathname.startsWith('/admin/')) return true
  
  // Audit team management actions
  if (pathname.includes('/manage') || pathname.includes('/settings')) return true
  
  // Audit user role changes
  if (pathname.includes('/invite') || pathname.includes('/remove')) return true
  
  return false
}

async function logSecurityEvent(request: NextRequest, token: any) {
  // In production, send to logging service
  console.log('Security Event:', {
    timestamp: new Date().toISOString(),
    path: request.nextUrl.pathname,
    method: request.method,
    userId: token?.sub,
    userEmail: token?.email,
    userAgent: request.headers.get('user-agent'),
    ip: getClientIP(request)
  })
}

function getClientIP(request: NextRequest): string {
  const xForwardedFor = request.headers.get('x-forwarded-for')
  const xRealIP = request.headers.get('x-real-ip')
  
  if (xForwardedFor) {
    return xForwardedFor.split(',')[0].trim()
  }
  
  if (xRealIP) {
    return xRealIP
  }
  
  return 'unknown'
}
```

## 2. Server Component Patterns

### Layout with Authentication

```typescript
// app/layout.tsx
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { AuthProvider } from '@/contexts/AuthContext'
import { PermissionProvider } from '@/contexts/PermissionProvider'
import { Navigation } from '@/components/Navigation'

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)

  return (
    <html lang="en">
      <body>
        <AuthProvider session={session}>
          <PermissionProvider>
            <div className="min-h-screen bg-gray-50">
              <Navigation />
              <main className="max-w-7xl mx-auto py-6 px-4">
                {children}
              </main>
            </div>
          </PermissionProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
```

### Page with Server-Side Authentication

```typescript
// app/teams/[id]/page.tsx
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { redirect } from 'next/navigation'
import { TeamHeader } from '@/components/TeamHeader'
import { PlayerList } from '@/components/PlayerList'
import { TeamManagement } from '@/components/TeamManagement'

interface TeamPageProps {
  params: { id: string }
}

export default async function TeamPage({ params }: TeamPageProps) {
  const session = await getServerSession(authOptions)
  const teamId = params.id

  // Server-side authentication check
  if (!session) {
    redirect('/auth/signin')
  }

  // Server-side permission check
  const userTeamRole = session.user.teamRoles?.[teamId]
  const isSystemAdmin = session.user.role === 'SYSTEM_ADMIN'
  
  if (!userTeamRole && !isSystemAdmin) {
    redirect('/teams')
  }

  // Fetch team data server-side
  const team = await getTeamWithPlayers(teamId)
  
  if (!team) {
    redirect('/teams')
  }

  const canManage = isSystemAdmin || userTeamRole === 'MANAGER'

  return (
    <div className="space-y-6">
      <TeamHeader 
        team={team} 
        canManage={canManage}
        userRole={userTeamRole}
      />
      
      <PlayerList 
        players={team.players}
        canManage={canManage}
        teamId={teamId}
      />
      
      {canManage && (
        <TeamManagement 
          team={team}
          userId={session.user.id}
        />
      )}
    </div>
  )
}
```

### Loading and Error Boundaries

```typescript
// app/teams/[id]/loading.tsx
export default function TeamLoading() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-8 bg-gray-200 rounded w-1/3" />
      <div className="space-y-4">
        <div className="h-4 bg-gray-200 rounded w-3/4" />
        <div className="h-4 bg-gray-200 rounded w-1/2" />
      </div>
    </div>
  )
}

// app/teams/[id]/error.tsx
'use client'
import { useEffect } from 'react'
import { Button } from '@/components/ui/Button'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Team page error:', error)
  }, [error])

  return (
    <div className="text-center py-12">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">
        Something went wrong!
      </h2>
      <p className="text-gray-600 mb-6">
        We encountered an error loading this team.
      </p>
      <Button onClick={reset}>
        Try again
      </Button>
    </div>
  )
}
```

### Server Action Implementation

```typescript
// app/teams/[id]/actions.ts
'use server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function updateTeamAction(teamId: string, formData: FormData) {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    redirect('/auth/signin')
  }

  // Check permissions
  const userTeamRole = session.user.teamRoles?.[teamId]
  const isSystemAdmin = session.user.role === 'SYSTEM_ADMIN'
  const canManage = isSystemAdmin || userTeamRole === 'MANAGER'
  
  if (!canManage) {
    throw new Error('Insufficient permissions')
  }

  // Process form data
  const updateData = {
    name: formData.get('name') as string,
    description: formData.get('description') as string,
    coach: formData.get('coach') as string,
  }

  try {
    await updateTeam(teamId, updateData)
    revalidatePath(`/teams/${teamId}`)
    return { success: true }
  } catch (error) {
    return { success: false, error: 'Failed to update team' }
  }
}

export async function addPlayerAction(teamId: string, formData: FormData) {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    redirect('/auth/signin')
  }

  const userTeamRole = session.user.teamRoles?.[teamId]
  const isSystemAdmin = session.user.role === 'SYSTEM_ADMIN'
  
  if (!isSystemAdmin && userTeamRole !== 'MANAGER') {
    throw new Error('Only team managers can add players')
  }

  const playerData = {
    name: formData.get('name') as string,
    position: formData.get('position') as string,
    jerseyNumber: parseInt(formData.get('jerseyNumber') as string),
  }

  try {
    await addPlayerToTeam(teamId, playerData)
    revalidatePath(`/teams/${teamId}`)
    return { success: true }
  } catch (error) {
    return { success: false, error: 'Failed to add player' }
  }
}
```

## 3. Client Component Integration

### Authentication Hook

```typescript
// hooks/useAuth.ts
'use client'
import { useSession, signIn, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useCallback } from 'react'

export function useAuth() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const login = useCallback(async (callbackUrl?: string) => {
    await signIn('google', { callbackUrl: callbackUrl || '/teams' })
  }, [])

  const logout = useCallback(async () => {
    await signOut({ callbackUrl: '/' })
  }, [])

  const requireAuth = useCallback(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
      return false
    }
    return true
  }, [status, router])

  return {
    user: session?.user,
    isLoading: status === 'loading',
    isAuthenticated: status === 'authenticated',
    login,
    logout,
    requireAuth
  }
}
```

### Protected Component Wrapper

```typescript
// components/AuthenticatedContent.tsx
'use client'
import { useAuth } from '@/hooks/useAuth'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { SignInPrompt } from '@/components/auth/SignInPrompt'

interface AuthenticatedContentProps {
  children: React.ReactNode
  fallback?: React.ReactNode
  requireRole?: 'SYSTEM_ADMIN'
}

export function AuthenticatedContent({ 
  children, 
  fallback,
  requireRole 
}: AuthenticatedContentProps) {
  const { user, isLoading, isAuthenticated } = useAuth()

  if (isLoading) {
    return fallback || <LoadingSpinner />
  }

  if (!isAuthenticated) {
    return <SignInPrompt />
  }

  if (requireRole && user?.role !== requireRole) {
    return <div>Insufficient permissions</div>
  }

  return <>{children}</>
}
```

### Interactive Team Management

```typescript
// components/TeamManagement.tsx
'use client'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { useTeamPermissions } from '@/hooks/useTeamPermissions'
import { updateTeamAction, addPlayerAction } from '@/app/teams/[id]/actions'

export function TeamManagement({ team, teamId }: TeamManagementProps) {
  const { user } = useAuth()
  const { canManage, canDelete } = useTeamPermissions(teamId)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const handleTeamUpdate = async (formData: FormData) => {
    if (!canManage) return

    startTransition(async () => {
      const result = await updateTeamAction(teamId, formData)
      if (result.success) {
        // Optimistically update UI or show success message
      } else {
        // Handle error
      }
    })
  }

  const handleDeleteTeam = async () => {
    if (!canDelete || !confirm('Are you sure?')) return

    startTransition(async () => {
      try {
        await deleteTeamAction(teamId)
        router.push('/teams')
      } catch (error) {
        console.error('Failed to delete team:', error)
      }
    })
  }

  if (!canManage) {
    return <div>You don't have permission to manage this team.</div>
  }

  return (
    <div className="space-y-6">
      <form action={handleTeamUpdate} className="space-y-4">
        <div>
          <label htmlFor="name">Team Name</label>
          <input
            id="name"
            name="name"
            defaultValue={team.name}
            disabled={isPending}
            required
          />
        </div>
        
        <div>
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            name="description"
            defaultValue={team.description || ''}
            disabled={isPending}
          />
        </div>

        <button 
          type="submit" 
          disabled={isPending}
          className="btn-primary"
        >
          {isPending ? 'Updating...' : 'Update Team'}
        </button>
      </form>

      {canDelete && (
        <button
          onClick={handleDeleteTeam}
          disabled={isPending}
          className="btn-danger"
        >
          Delete Team
        </button>
      )}
    </div>
  )
}
```

## 4. API Route Protection

### Protected API Route Pattern

```typescript
// app/api/teams/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const teamId = params.id
    const userTeamRole = session.user.teamRoles?.[teamId]
    const isSystemAdmin = session.user.role === 'SYSTEM_ADMIN'

    // Check team access
    if (!isSystemAdmin && !userTeamRole) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const team = await getTeamWithPlayers(teamId)
    
    if (!team) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 })
    }

    return NextResponse.json(team)
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const teamId = params.id
    const userTeamRole = session.user.teamRoles?.[teamId]
    const isSystemAdmin = session.user.role === 'SYSTEM_ADMIN'

    // Check management permissions
    if (!isSystemAdmin && userTeamRole !== 'MANAGER') {
      return NextResponse.json(
        { error: 'Insufficient permissions' }, 
        { status: 403 }
      )
    }

    const updates = await request.json()
    const updatedTeam = await updateTeam(teamId, updates)

    return NextResponse.json(updatedTeam)
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    )
  }
}
```

### API Route Helper

```typescript
// lib/api-helpers.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'

export async function withAuth(
  handler: (request: NextRequest, session: any, context: any) => Promise<Response>
) {
  return async (request: NextRequest, context: any) => {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
      return await handler(request, session, context)
    } catch (error) {
      console.error('API Handler Error:', error)
      return NextResponse.json(
        { error: 'Internal server error' }, 
        { status: 500 }
      )
    }
  }
}

export async function withTeamAccess(
  handler: (request: NextRequest, session: any, context: any) => Promise<Response>
) {
  return withAuth(async (request, session, context) => {
    const teamId = context.params.id
    const userTeamRole = session.user.teamRoles?.[teamId]
    const isSystemAdmin = session.user.role === 'SYSTEM_ADMIN'

    if (!isSystemAdmin && !userTeamRole) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    return handler(request, session, context)
  })
}

export async function withTeamManager(
  handler: (request: NextRequest, session: any, context: any) => Promise<Response>
) {
  return withAuth(async (request, session, context) => {
    const teamId = context.params.id
    const userTeamRole = session.user.teamRoles?.[teamId]
    const isSystemAdmin = session.user.role === 'SYSTEM_ADMIN'

    if (!isSystemAdmin && userTeamRole !== 'MANAGER') {
      return NextResponse.json(
        { error: 'Team manager access required' }, 
        { status: 403 }
      )
    }

    return handler(request, session, context)
  })
}

// Usage:
export const GET = withTeamAccess(async (request, session, { params }) => {
  const team = await getTeam(params.id)
  return NextResponse.json(team)
})

export const PUT = withTeamManager(async (request, session, { params }) => {
  const updates = await request.json()
  const team = await updateTeam(params.id, updates)
  return NextResponse.json(team)
})
```

## Best Practices Summary

1. **Security Layers**: Use middleware for routing, server components for data fetching, and client components for interactivity
2. **Error Handling**: Implement proper error boundaries and graceful degradation
3. **Performance**: Use server components when possible, client components only for interactivity
4. **Type Safety**: Leverage TypeScript throughout the authentication flow
5. **Audit Trail**: Log important security events and user actions
6. **Rate Limiting**: Implement appropriate rate limiting for different user types
7. **Session Management**: Use secure cookies with proper expiration
8. **Permission Checks**: Validate permissions on both client and server sides
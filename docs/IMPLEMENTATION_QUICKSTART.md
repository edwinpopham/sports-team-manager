# Implementation Quick Start Guide

## Phase 1: Setup & Basic Authentication (Week 1)

### Prerequisites Checklist
- [ ] Google Cloud Console project created
- [ ] OAuth 2.0 credentials configured
- [ ] Domain verification completed for Google Sign-In
- [ ] Environment variables prepared

### Google OAuth Setup

1. **Google Cloud Console Configuration**
```bash
# Environment variables to add
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_random_secret_string
```

2. **Install Dependencies**
```bash
npm install next-auth @auth/prisma-adapter
npm install @types/next-auth --save-dev
```

### Step 1: NextAuth.js Configuration

Create `app/api/auth/[...nextauth]/route.ts`:
```typescript
import NextAuth from "next-auth"
import GoogleProvider from "next-auth/providers/google"

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    })
  ],
  session: {
    strategy: "jwt" as const,
    maxAge: 7 * 24 * 60 * 60, // 7 days
  },
  callbacks: {
    async jwt({ token, user, account, profile }) {
      if (user) {
        token.role = 'USER' // Default role
        token.teamRoles = {} // Will be populated later
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub!
        session.user.role = token.role as string
        session.user.teamRoles = token.teamRoles as Record<string, string>
      }
      return session
    }
  }
}

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }
```

### Step 2: Update Type Definitions

Create `types/next-auth.d.ts`:
```typescript
import NextAuth from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      name?: string | null
      email?: string | null
      image?: string | null
      role: string
      teamRoles: Record<string, string>
    }
  }

  interface User {
    role?: string
    teamRoles?: Record<string, string>
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: string
    teamRoles: Record<string, string>
  }
}
```

### Step 3: Create Session Provider

Update `app/layout.tsx`:
```typescript
import { getServerSession } from 'next-auth/next'
import { SessionProvider } from 'next-auth/react'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { Navigation } from './components/Navigation'
import { TeamProvider } from './contexts/TeamContext'

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)

  return (
    <html lang="en">
      <body>
        <SessionProvider session={session}>
          <TeamProvider>
            <div className="min-h-screen">
              <Navigation />
              <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                {children}
              </main>
            </div>
          </TeamProvider>
        </SessionProvider>
      </body>
    </html>
  )
}
```

### Step 4: Create Sign-In Components

Create `components/auth/SignInButton.tsx`:
```typescript
'use client'
import { signIn, useSession } from 'next-auth/react'
import { Button } from '@/components/ui/Button'

export function SignInButton() {
  const { data: session, status } = useSession()

  if (status === 'loading') {
    return <div>Loading...</div>
  }

  if (session) {
    return null // Already signed in
  }

  return (
    <Button 
      onClick={() => signIn('google')}
      className="bg-blue-600 hover:bg-blue-700"
    >
      Sign in with Google
    </Button>
  )
}
```

Create `components/auth/UserProfile.tsx`:
```typescript
'use client'
import { signOut, useSession } from 'next-auth/react'
import { Button } from '@/components/ui/Button'

export function UserProfile() {
  const { data: session, status } = useSession()

  if (status === 'loading') {
    return <div>Loading...</div>
  }

  if (!session) {
    return null
  }

  return (
    <div className="flex items-center space-x-4">
      <img 
        src={session.user.image || ''} 
        alt={session.user.name || ''}
        className="w-8 h-8 rounded-full"
      />
      <span>{session.user.name}</span>
      <Button 
        onClick={() => signOut()}
        variant="outline"
        size="sm"
      >
        Sign out
      </Button>
    </div>
  )
}
```

### Step 5: Update Navigation

Update `app/components/Navigation.tsx`:
```typescript
'use client'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { SignInButton } from './auth/SignInButton'
import { UserProfile } from './auth/UserProfile'

export function Navigation() {
  const { data: session } = useSession()

  return (
    <nav className="bg-white shadow">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="text-xl font-bold">
              Sports Team Manager
            </Link>
          </div>
          
          <div className="flex items-center space-x-4">
            {session && (
              <Link href="/teams" className="text-gray-700 hover:text-gray-900">
                My Teams
              </Link>
            )}
            
            <div className="flex items-center">
              {session ? <UserProfile /> : <SignInButton />}
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}
```

### Step 6: Create Basic Middleware

Create `middleware.ts`:
```typescript
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request })
  const { pathname } = request.nextUrl

  // Public routes that don't require auth
  const publicRoutes = ['/', '/auth/signin', '/about']
  const isPublicRoute = publicRoutes.includes(pathname) || 
                       pathname.startsWith('/api/auth/')

  if (!token && !isPublicRoute) {
    const signInUrl = new URL('/auth/signin', request.url)
    return NextResponse.redirect(signInUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
```

### Step 7: Create Sign-In Page

Create `app/auth/signin/page.tsx`:
```typescript
'use client'
import { signIn, useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { Button } from '@/components/ui/Button'

export default function SignInPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (session) {
      router.push('/teams')
    }
  }, [session, router])

  if (status === 'loading') {
    return <div>Loading...</div>
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Access your sports team management dashboard
          </p>
        </div>
        <div className="mt-8 space-y-6">
          <Button
            onClick={() => signIn('google', { callbackUrl: '/teams' })}
            className="w-full flex justify-center py-3 px-4 text-sm font-medium"
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
              {/* Google Icon SVG */}
            </svg>
            Sign in with Google
          </Button>
        </div>
      </div>
    </div>
  )
}
```

## Phase 2: Role-Based Access Control (Week 2)

### Step 1: Enhanced User Types

Update `types/auth.ts`:
```typescript
export interface User {
  id: string
  email: string
  name: string
  image?: string
  role: 'SYSTEM_ADMIN' | 'USER'
  teamRoles: Record<string, 'MANAGER' | 'MEMBER'>
  createdAt: string
  lastLoginAt: string
}

export interface TeamRole {
  teamId: string
  userId: string
  role: 'MANAGER' | 'MEMBER'
  assignedAt: string
  assignedBy: string
}
```

### Step 2: Create Permission Context

Create `contexts/PermissionContext.tsx`:
```typescript
'use client'
import { createContext, useContext, ReactNode } from 'react'
import { useSession } from 'next-auth/react'

interface PermissionContextType {
  canCreateTeam: boolean
  canViewTeam: (teamId: string) => boolean
  canManageTeam: (teamId: string) => boolean
  canDeleteTeam: (teamId: string) => boolean
  isSystemAdmin: boolean
  getUserTeamRole: (teamId: string) => string | null
}

const PermissionContext = createContext<PermissionContextType | null>(null)

export function usePermissions() {
  const context = useContext(PermissionContext)
  if (!context) {
    throw new Error('usePermissions must be used within PermissionProvider')
  }
  return context
}

export function PermissionProvider({ children }: { children: ReactNode }) {
  const { data: session } = useSession()

  const permissions: PermissionContextType = {
    canCreateTeam: !!session?.user,
    isSystemAdmin: session?.user?.role === 'SYSTEM_ADMIN',
    
    canViewTeam: (teamId: string) => {
      if (!session?.user) return false
      if (session.user.role === 'SYSTEM_ADMIN') return true
      return !!session.user.teamRoles?.[teamId]
    },
    
    canManageTeam: (teamId: string) => {
      if (!session?.user) return false
      if (session.user.role === 'SYSTEM_ADMIN') return true
      return session.user.teamRoles?.[teamId] === 'MANAGER'
    },
    
    canDeleteTeam: (teamId: string) => {
      if (!session?.user) return false
      if (session.user.role === 'SYSTEM_ADMIN') return true
      return session.user.teamRoles?.[teamId] === 'MANAGER'
    },
    
    getUserTeamRole: (teamId: string) => {
      return session?.user?.teamRoles?.[teamId] || null
    }
  }

  return (
    <PermissionContext.Provider value={permissions}>
      {children}
    </PermissionContext.Provider>
  )
}
```

### Step 3: Update TeamContext for User Association

Update `app/contexts/TeamContext.tsx`:
```typescript
// Add to existing TeamContext
import { useSession } from 'next-auth/react'

export function TeamProvider({ children }: TeamProviderProps) {
  const { data: session } = useSession()
  // ... existing state

  const createTeam = async (teamData: Omit<Team, 'id' | 'dateCreated' | 'players'>): Promise<Team> => {
    if (!session?.user) {
      throw new Error('Must be authenticated to create teams')
    }

    const newTeam: Team = {
      ...teamData,
      id: storage.generateId(),
      dateCreated: new Date().toISOString(),
      players: [],
      isActive: true,
      createdBy: session.user.id, // Associate with user
      managedBy: [session.user.id] // User becomes manager
    }

    storage.saveTeam(newTeam)
    setTeams(prev => [...prev, newTeam])
    
    // TODO: Update user's team roles in session
    
    return newTeam
  }

  // ... rest of existing implementation
}
```

## Phase 3: Advanced Features (Week 3-4)

### Team Invitation System
### Advanced Permissions
### Cross-Tab Synchronization
### Performance Optimizations

## Testing Strategy

### Unit Tests
```typescript
// __tests__/contexts/PermissionContext.test.tsx
import { render, screen } from '@testing-library/react'
import { SessionProvider } from 'next-auth/react'
import { PermissionProvider, usePermissions } from '@/contexts/PermissionContext'

const mockSession = {
  user: {
    id: 'user-1',
    role: 'USER',
    teamRoles: { 'team-1': 'MANAGER', 'team-2': 'MEMBER' }
  },
  expires: '2024-01-01'
}

function TestComponent({ teamId }: { teamId: string }) {
  const { canManageTeam, canViewTeam } = usePermissions()
  
  return (
    <div>
      <div data-testid="can-manage">{canManageTeam(teamId).toString()}</div>
      <div data-testid="can-view">{canViewTeam(teamId).toString()}</div>
    </div>
  )
}

test('team manager permissions', () => {
  render(
    <SessionProvider session={mockSession}>
      <PermissionProvider>
        <TestComponent teamId="team-1" />
      </PermissionProvider>
    </SessionProvider>
  )

  expect(screen.getByTestId('can-manage')).toHaveTextContent('true')
  expect(screen.getByTestId('can-view')).toHaveTextContent('true')
})
```

## Deployment Checklist

### Environment Variables
- [ ] `GOOGLE_CLIENT_ID` configured
- [ ] `GOOGLE_CLIENT_SECRET` configured  
- [ ] `NEXTAUTH_URL` set to production URL
- [ ] `NEXTAUTH_SECRET` set to secure random string

### Google OAuth Configuration
- [ ] Production domain added to authorized domains
- [ ] Redirect URIs updated for production
- [ ] Domain verification completed

### Security
- [ ] HTTPS enabled
- [ ] Security headers configured
- [ ] Rate limiting implemented
- [ ] Error handling and logging in place

### Performance
- [ ] Bundle size optimized
- [ ] Image optimization configured
- [ ] Database queries optimized
- [ ] Caching strategy implemented

## Troubleshooting Guide

### Common Issues

1. **"Configuration" Error**
   - Check environment variables are properly set
   - Verify Google OAuth credentials are correct
   - Ensure domain is properly configured in Google Console

2. **Session Not Persisting**
   - Check cookie settings (secure, httpOnly, sameSite)
   - Verify NEXTAUTH_SECRET is set
   - Check browser storage and network requests

3. **Permission Denied Errors**
   - Verify user roles are properly assigned
   - Check middleware and API route protection
   - Ensure team roles are correctly stored

4. **Cross-Tab Sync Issues**
   - Implement storage event listeners
   - Consider using BroadcastChannel API
   - Check session refresh logic

## Next Steps

After implementing Phase 1:
1. Test authentication flow thoroughly
2. Implement role-based UI restrictions
3. Add team creation with automatic manager assignment
4. Implement team invitation system
5. Add comprehensive error handling
6. Optimize for production deployment

This guide provides a solid foundation for implementing the complete authentication system with 7-day session persistence and role-based access control for your sports team manager application.
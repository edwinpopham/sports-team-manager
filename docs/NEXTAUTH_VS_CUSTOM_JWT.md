# NextAuth.js vs Custom JWT Implementation - Detailed Comparison

## Overview
This comparison focuses on implementing 7-day session persistence with Google OAuth for the sports team manager application.

## NextAuth.js Implementation

### Advantages
✅ **Production-Ready Security**
- CSRF protection by default
- Secure cookie handling (httpOnly, secure, sameSite)
- Automatic token refresh and rotation
- Built-in session encryption

✅ **Google Integration**
- Official Google provider with proper scopes
- Handles OAuth 2.0 flow complexity
- Automatic token refresh handling
- Profile data normalization

✅ **TypeScript Support**
- Full type definitions included
- Module augmentation for custom session properties
- IntelliSense support throughout

✅ **Maintenance & Updates**
- Regular security updates
- Community-tested implementations
- Extensive documentation and examples

### Implementation Example

```typescript
// app/api/auth/[...nextauth]/route.ts
import NextAuth, { NextAuthOptions } from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import { PrismaAdapter } from "@auth/prisma-adapter"

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma), // Optional: for database sessions
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: "openid email profile"
        }
      }
    })
  ],
  session: {
    strategy: "jwt", // For 7-day persistence without database
    maxAge: 7 * 24 * 60 * 60, // 7 days
  },
  jwt: {
    maxAge: 7 * 24 * 60 * 60, // 7 days
  },
  callbacks: {
    async jwt({ token, user, account, profile }) {
      // First sign in
      if (user && account && profile) {
        token.sub = user.id
        token.email = user.email
        token.name = user.name
        token.picture = user.image
        token.googleId = profile.sub
        
        // Assign roles and teams
        token.role = await determineUserRole(user.email)
        token.teamRoles = await getUserTeamRoles(user.id)
      }
      
      return token
    },
    async session({ session, token }) {
      if (session.user && token) {
        session.user.id = token.sub
        session.user.role = token.role as UserRole
        session.user.teamRoles = token.teamRoles as TeamRoles
        session.user.googleId = token.googleId as string
      }
      return session
    },
    async redirect({ url, baseUrl }) {
      // Redirect to dashboard after successful sign-in
      if (url.startsWith(baseUrl)) return url
      return `${baseUrl}/teams`
    }
  },
  pages: {
    signIn: '/auth/signin', // Custom sign-in page
    error: '/auth/error',   // Error página
  },
  events: {
    async signIn({ user, account, profile, isNewUser }) {
      // Log successful sign-ins
      console.log(`User ${user.email} signed in`, { isNewUser })
      
      if (isNewUser) {
        // Handle first-time user setup
        await initializeNewUser(user)
      }
    },
    async signOut({ session, token }) {
      // Clean up any user-specific data
      await handleUserSignOut(session.user.id)
    }
  }
}

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }
```

### Usage in Components

```typescript
// components/AuthGuard.tsx
'use client'
import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import { LoadingSpinner } from './ui/LoadingSpinner'

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession({
    required: true,
    onUnauthenticated() {
      redirect('/auth/signin')
    }
  })

  if (status === 'loading') {
    return <LoadingSpinner />
  }

  return <>{children}</>
}

// components/TeamManager.tsx
'use client'
import { useSession } from 'next-auth/react'
import { canManageTeam } from '@/lib/permissions'

export function TeamManager({ teamId }: { teamId: string }) {
  const { data: session } = useSession()
  
  if (!session || !canManageTeam(session.user, teamId)) {
    return <AccessDenied />
  }

  return (
    <div>
      {/* Team management interface */}
    </div>
  )
}
```

### Disadvantages
❌ **Bundle Size**: ~15-20KB additional bundle size
❌ **Learning Curve**: Requires understanding NextAuth.js patterns
❌ **Flexibility**: Some customization limitations
❌ **Dependency**: External library maintenance dependency

---

## Custom JWT Implementation

### Advantages
✅ **Full Control**: Complete customization of authentication flow
✅ **Lightweight**: Minimal dependencies (just `jose` library)
✅ **Flexibility**: Custom session structure and validation
✅ **Performance**: No framework overhead

### Implementation Example

```typescript
// lib/auth.ts
import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'

const secret = new TextEncoder().encode(process.env.JWT_SECRET!)

export interface SessionPayload {
  userId: string
  email: string
  name: string
  picture?: string
  role: 'SYSTEM_ADMIN' | 'USER'
  teamRoles: Record<string, 'MANAGER' | 'MEMBER'>
  googleId: string
  exp?: number
  iat?: number
}

export async function createSession(payload: Omit<SessionPayload, 'exp' | 'iat'>) {
  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secret)

  // Set secure cookie
  cookies().set('session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60, // 7 days
    path: '/'
  })

  return token
}

export async function getSession() {
  const token = cookies().get('session')?.value
  
  if (!token) return null

  try {
    const { payload } = await jwtVerify(token, secret)
    return payload as SessionPayload
  } catch (error) {
    return null
  }
}

export async function deleteSession() {
  cookies().delete('session')
}

// Google OAuth handling
export async function handleGoogleCallback(code: string) {
  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      code,
      grant_type: 'authorization_code',
      redirect_uri: `${process.env.NEXTAUTH_URL}/api/auth/callback/google`
    })
  })

  const tokens = await tokenResponse.json()

  // Get user profile
  const profileResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: {
      Authorization: `Bearer ${tokens.access_token}`
    }
  })

  const profile = await profileResponse.json()

  // Create session
  const sessionPayload: Omit<SessionPayload, 'exp' | 'iat'> = {
    userId: profile.id,
    email: profile.email,
    name: profile.name,
    picture: profile.picture,
    googleId: profile.id,
    role: await determineUserRole(profile.email),
    teamRoles: await getUserTeamRoles(profile.id)
  }

  return createSession(sessionPayload)
}
```

### API Route Protection

```typescript
// lib/api-middleware.ts
import { NextRequest, NextResponse } from 'next/server'
import { getSession } from './auth'

export function withAuth(
  handler: (request: NextRequest, session: SessionPayload) => Promise<Response>
) {
  return async (request: NextRequest) => {
    const session = await getSession()
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    return handler(request, session)
  }
}

// Usage in API route
// app/api/teams/[id]/route.ts
export const PUT = withAuth(async (request, session) => {
  const { id } = context.params
  const updates = await request.json()
  
  // Check permissions
  if (!canManageTeam(session, id)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Update team
  const updatedTeam = await updateTeam(id, updates)
  return NextResponse.json(updatedTeam)
})
```

### Client-Side Hook

```typescript
// hooks/useAuth.ts
import { useEffect, useState } from 'react'
import { SessionPayload } from '@/lib/auth'

export function useAuth() {
  const [session, setSession] = useState<SessionPayload | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkSession()
  }, [])

  const checkSession = async () => {
    try {
      const response = await fetch('/api/auth/me')
      if (response.ok) {
        const session = await response.json()
        setSession(session)
      } else {
        setSession(null)
      }
    } catch (error) {
      setSession(null)
    } finally {
      setLoading(false)
    }
  }

  const signOut = async () => {
    await fetch('/api/auth/signout', { method: 'POST' })
    setSession(null)
    window.location.href = '/auth/signin'
  }

  return { session, loading, signOut, refetch: checkSession }
}
```

### Disadvantages
❌ **Security Responsibility**: Must implement all security measures manually
❌ **OAuth Complexity**: Manual handling of OAuth flow and edge cases
❌ **Maintenance**: All security updates and bug fixes are your responsibility
❌ **Token Refresh**: Must implement refresh token logic manually
❌ **Testing**: More extensive security testing required

---

## Comparative Analysis

| Feature | NextAuth.js | Custom JWT |
|---------|-------------|------------|
| **Setup Time** | 2-3 hours | 1-2 days |
| **Security** | Production-ready | Requires expertise |
| **Customization** | Limited | Unlimited |
| **Bundle Size** | +15-20KB | +3-5KB |
| **Maintenance** | Community | Self |
| **Google Integration** | Built-in | Manual |
| **Token Refresh** | Automatic | Manual |
| **Type Safety** | Excellent | Custom |
| **Documentation** | Extensive | Self-documented |
| **Testing** | Well-tested | Requires thorough testing |

## Recommendation

**For your sports team manager application, I recommend NextAuth.js** because:

1. **Security First**: Your application manages team data and user permissions—security is critical
2. **Time to Market**: Focus on your business logic, not authentication infrastructure
3. **Google Integration**: Built-in provider handles all OAuth complexities
4. **7-Day Sessions**: JWT strategy perfectly matches your requirement
5. **TypeScript**: Excellent type safety for your TypeScript codebase
6. **Scalability**: Handles multiple users and concurrent sessions efficiently

The custom JWT approach would only be recommended if you have specific requirements that NextAuth.js cannot accommodate, or if you have dedicated security expertise on your team.

## Migration Path

If you start with NextAuth.js and later need more customization:

1. **Phase 1**: Implement with NextAuth.js for rapid development
2. **Phase 2**: Identify specific customization needs
3. **Phase 3**: If needed, implement custom solution with lessons learned

This approach minimizes risk while allowing for future flexibility.
# Quickstart Guide: Google Identity Sign-In Implementation

**Phase 1 Deliverable** | **Date**: February 15, 2026  
**Target**: Development team implementation guide  

## Prerequisites Checklist

### Google Cloud Console Setup
- [ ] Create Google Cloud Project or use existing
- [ ] Enable Google Identity Services API  
- [ ] Create OAuth 2.0 Client ID credentials
- [ ] Configure authorized domains (localhost:3000 + production domain)
- [ ] Set up OAuth consent screen with appropriate scopes
- [ ] Note down Client ID and Client Secret

### Environment Configuration
```bash
# .env.local
NEXTAUTH_URL=http://localhost:3000  # Production: your domain
NEXTAUTH_SECRET=your-super-secret-key-here
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

## Implementation Phases

### Phase 1: Core Authentication (Week 1)
**Goal**: Basic Google sign-in/sign-out with session management

#### 1.1 Install Dependencies
```bash
npm install next-auth @next-auth/prisma-adapter
npm install --save-dev @types/next-auth
```

#### 1.2 NextAuth.js Configuration
```typescript
// app/api/auth/[...nextauth]/route.ts
import NextAuth, { NextAuthOptions } from "next-auth"
import GoogleProvider from "next-auth/providers/google"

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    })
  ],
  session: {
    strategy: "jwt",
    maxAge: 7 * 24 * 60 * 60, // 7 days (FR-007)
  },
  jwt: {
    maxAge: 7 * 24 * 60 * 60,
  },
  callbacks: {
    async jwt({ token, account, user }) {
      if (account && user) {
        token.isSystemAdmin = false; // Default, will be enhanced
        token.googleId = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.sub!;
      session.user.isSystemAdmin = token.isSystemAdmin as boolean;
      session.user.googleId = token.googleId as string;
      return session;
    }
  },
  pages: {
    signIn: '/signin',  // Custom sign-in page
    error: '/signin',   // Redirect errors to sign-in
  }
}

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
```

#### 1.3 Custom Sign-In Page
```typescript
// app/signin/page.tsx
'use client';
import { signIn, getSession } from 'next-auth/react';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function SignInPage() {
  const router = useRouter();

  useEffect(() => {
    getSession().then(session => {
      if (session) {
        router.push('/teams'); // Redirect if already signed in
      }
    });
  }, [router]);

  const handleGoogleSignIn = () => {
    signIn('google', { callbackUrl: '/teams' });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to Sports Team Manager
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Use your Google account to access your teams
          </p>
        </div>
        <div>
          <button
            onClick={handleGoogleSignIn}
            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Sign in with Google
          </button>
        </div>
      </div>
    </div>
  );
}
```

#### 1.4 Enhanced Layout with Auth
```typescript
// app/layout.tsx (enhanced)
import { SessionProvider } from 'next-auth/react';
import { getServerSession } from 'next-auth';
import { authOptions } from './api/auth/[...nextauth]/route';

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  return (
    <html lang="en">
      <body>
        <SessionProvider session={session}>
          {children}
        </SessionProvider>
      </body>
    </html>
  );
}
```

#### 1.5 Authentication Middleware
```typescript
// middleware.ts
import { withAuth } from "next-auth/middleware";

export default withAuth(
  function middleware(req) {
    // Additional logic if needed
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token
    },
  }
);

export const config = {
  matcher: ['/teams/:path*', '/api/teams/:path*'] // Protect team routes
};
```

### Phase 2: Role-Based Access Control (Week 2)
**Goal**: Implement user roles and team-specific permissions

#### 2.1 Enhanced Type Definitions
```typescript
// app/types/auth.ts
import { User as NextAuthUser } from 'next-auth';

declare module 'next-auth' {
  interface User {
    isSystemAdmin: boolean;
    googleId: string;
  }
  
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      isSystemAdmin: boolean;
      googleId: string;
    };
  }
}

export interface TeamRole {
  userId: string;
  teamId: string;
  role: 'MANAGER' | 'MEMBER';
  assignedAt: string;
  assignedBy?: string;
}

export interface UserPermissions {
  isSystemAdmin: boolean;
  teamRoles: TeamRole[];
}
```

#### 2.2 Permission Context Provider
```typescript
// app/contexts/AuthContext.tsx
'use client';
import { createContext, useContext, useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { UserPermissions, TeamRole } from '@/types/auth';

interface AuthContextType {
  permissions: UserPermissions | null;
  hasPermission: (resource: string, action: string, teamId?: string) => boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const [permissions, setPermissions] = useState<UserPermissions | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      // Load user team roles from storage or API
      loadUserPermissions(session.user.id).then(setPermissions);
    }
    setIsLoading(status === 'loading');
  }, [session, status]);

  const hasPermission = (resource: string, action: string, teamId?: string): boolean => {
    if (!permissions) return false;
    
    // System admin has all permissions
    if (permissions.isSystemAdmin) return true;
    
    // Team-specific permissions
    if (teamId && resource === 'team') {
      const teamRole = permissions.teamRoles.find(role => role.teamId === teamId);
      if (!teamRole) return false;
      
      // Team managers can perform management actions
      if (action === 'manage' || action === 'update' || action === 'delete') {
        return teamRole.role === 'MANAGER';
      }
      
      // All team members can read
      if (action === 'read') return true;
    }
    
    return false;
  };

  return (
    <AuthContext.Provider value={{ permissions, hasPermission, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

async function loadUserPermissions(userId: string): Promise<UserPermissions> {
  // Implementation will load from localStorage initially, then API
  return {
    isSystemAdmin: false,
    teamRoles: []
  };
}
```

#### 2.3 Permission Gates Component
```typescript
// app/components/auth/PermissionGate.tsx
'use client';
import { useAuth } from '@/contexts/AuthContext';
import { ReactNode } from 'react';

interface PermissionGateProps {
  children: ReactNode;
  resource: string;
  action: string;
  teamId?: string;
  fallback?: ReactNode;
}

export function PermissionGate({ 
  children, 
  resource, 
  action, 
  teamId, 
  fallback = null 
}: PermissionGateProps) {
  const { hasPermission, isLoading } = useAuth();

  if (isLoading) {
    return <div>Loading...</div>; // Or skeleton component
  }

  if (!hasPermission(resource, action, teamId)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
```

### Phase 3: Team Management Integration (Week 3)
**Goal**: Integrate authentication with existing team functionality

#### 3.1 Enhanced Team Creation
```typescript
// app/teams/create/page.tsx (enhanced)
'use client';
import { useSession } from 'next-auth/react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function CreateTeamPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateTeam = async (formData: FormData) => {
    if (!session?.user) return;
    
    setIsCreating(true);
    try {
      const response = await fetch('/api/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.get('name'),
          description: formData.get('description'),
          createdBy: session.user.id  // Automatic ownership (FR-009)
        })
      });
      
      if (response.ok) {
        const team = await response.json();
        router.push(`/teams/${team.id}`);
      }
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <form action={handleCreateTeam}>
      {/* Team creation form */}
    </form>
  );
}
```

#### 3.2 Protected API Routes
```typescript
// app/api/teams/route.ts (enhanced)
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    return NextResponse.json(
      { error: 'UNAUTHORIZED', message: 'Authentication required' },
      { status: 401 }
    );
  }

  const data = await request.json();
  
  // Create team with user as manager (FR-008, FR-009)
  const newTeam = {
    ...data,
    id: crypto.randomUUID(),
    createdBy: session.user.id,
    createdAt: new Date().toISOString(),
    roles: [{
      userId: session.user.id,
      teamId: data.id,
      role: 'MANAGER' as const,
      assignedAt: new Date().toISOString()
    }]
  };

  // Save team logic here
  
  return NextResponse.json(newTeam, { status: 201 });
}
```

### Phase 4: Migration System (Week 4)
**Goal**: Implement localStorage team claiming system

#### 4.1 Migration Detection Component
```typescript
// app/components/migration/TeamClaimingFlow.tsx
'use client';
import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';

export function TeamClaimingFlow() {
  const { data: session } = useSession();
  const [localTeams, setLocalTeams] = useState<any[]>([]);
  const [showClaimDialog, setShowClaimDialog] = useState(false);

  useEffect(() => {
    if (session?.user) {
      // Detect localStorage teams
      const stored = localStorage.getItem('teams');
      if (stored) {
        const teams = JSON.parse(stored);
        if (teams.length > 0) {
          setLocalTeams(teams);
          setShowClaimDialog(true);
        }
      }
    }
  }, [session]);

  const handleClaimTeams = async (selectedTeams: string[]) => {
    const response = await fetch('/api/migration/claim-teams', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        teams: localTeams.filter(team => selectedTeams.includes(team.id))
      })
    });

    if (response.ok) {
      // Clear localStorage and refresh
      localStorage.removeItem('teams');
      window.location.reload();
    }
  };

  if (!showClaimDialog) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white p-6 rounded-lg max-w-md">
        <h3 className="text-lg font-semibold mb-4">
          Found {localTeams.length} teams in your browser
        </h3>
        <p className="mb-4">
          Would you like to claim these teams and associate them with your account?
        </p>
        {/* Team selection UI */}
        <div className="flex gap-2">
          <button onClick={() => handleClaimTeams(localTeams.map(t => t.id))}>
            Claim All
          </button>
          <button onClick={() => setShowClaimDialog(false)}>
            Skip for Now
          </button>
        </div>
      </div>
    </div>
  );
}
```

## Testing Strategy

### Unit Tests
```typescript
// __tests__/auth/permissions.test.ts
import { PermissionService } from '@/lib/permissions';

describe('PermissionService', () => {
  it('should grant team management permissions to team creator', () => {
    const user = { id: 'user1', isSystemAdmin: false };
    const teamRoles = [{ userId: 'user1', teamId: 'team1', role: 'MANAGER' }];
    
    const permissions = new PermissionService(user, teamRoles);
    expect(permissions.hasPermission('team', 'manage', 'team1')).toBe(true);
  });

  it('should deny management permissions to team members', () => {
    const user = { id: 'user1', isSystemAdmin: false };
    const teamRoles = [{ userId: 'user1', teamId: 'team1', role: 'MEMBER' }];
    
    const permissions = new PermissionService(user, teamRoles);
    expect(permissions.hasPermission('team', 'manage', 'team1')).toBe(false);
  });
});
```

### Integration Tests  
```typescript
// __tests__/integration/auth-flow.test.ts
import { render, screen, fireEvent } from '@testing-library/react';
import { signIn } from 'next-auth/react';

describe('Authentication Flow', () => {
  it('should redirect anonymous users to signin page', () => {
    // Test FR-014 requirement
  });

  it('should allow team creation after authentication', () => {
    // Test FR-008, FR-009 requirements
  });
});
```

## Deployment Checklist

### Pre-Production
- [ ] Environment variables configured in production
- [ ] Google OAuth domain authorization updated
- [ ] SSL certificate valid for domain
- [ ] Session secret is cryptographically secure
- [ ] Database migration plan ready (if applicable)

### Go-Live
- [ ] Monitor authentication success rates (target: >95%)
- [ ] Track session duration compliance (7-day requirement)
- [ ] Verify permission enforcement across all routes
- [ ] Test migration flow with staging localStorage data

### Post-Launch
- [ ] Set up authentication monitoring/alerting
- [ ] Monitor Google API quota usage
- [ ] Track user adoption of new authentication system
- [ ] Plan localStorage deprecation timeline

## Troubleshooting Guide

### Common Issues
1. **"Invalid client" error**: Check Google Client ID configuration
2. **Session not persisting**: Verify NEXTAUTH_SECRET and domain settings  
3. **Permission denied**: Check user role assignments and permission logic
4. **Migration not triggering**: Verify localStorage team data format

### Debug Commands
```bash
# Check session details
curl -H "Cookie: $(cat cookies.txt)" http://localhost:3000/api/auth/session

# Verify environment variables
printenv | grep -E "(GOOGLE|NEXTAUTH)"
```

## Support Resources
- [NextAuth.js Documentation](https://next-auth.js.org/)
- [Google Identity Services Guide](https://developers.google.com/identity)
- [Team contact for implementation questions]

---
**Implementation Timeline**: 4 weeks  
**Success Metrics**: >95% auth success rate, <30s signin completion, 100% permission enforcement  
**Next Phase**: Advanced features (team invitations, cross-device sync)
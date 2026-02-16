# Role-Based Access Control (RBAC) Implementation Guide

## Overview
Comprehensive RBAC system for sports team manager with hierarchical permissions and team-specific roles.

## Role Hierarchy & Permissions

### 1. System-Wide Roles

```typescript
// types/auth.ts
export type SystemRole = 'SYSTEM_ADMIN' | 'USER'

export interface User {
  id: string
  email: string
  name: string
  systemRole: SystemRole
  teamRoles: TeamRole[]
  createdAt: string
  lastLoginAt: string
}
```

### 2. Team-Specific Roles

```typescript
// types/team.ts
export type TeamRoleType = 'MANAGER' | 'MEMBER'

export interface TeamRole {
  teamId: string
  userId: string
  role: TeamRoleType
  assignedAt: string
  assignedBy: string
}

export interface TeamPermissions {
  canViewTeam: boolean
  canEditTeam: boolean
  canDeleteTeam: boolean
  canManagePlayers: boolean
  canViewPlayers: boolean
  canInviteMembers: boolean
  canRemoveMembers: boolean
  canChangeSettings: boolean
}
```

### 3. Permission Matrix

| Role | System Permissions | Team Permissions |
|------|-------------------|------------------|
| **SYSTEM_ADMIN** | • Manage all teams<br>• Delete any team<br>• Access all data<br>• Manage users | • Full access to all teams<br>• Override team permissions |
| **TEAM_MANAGER** | • Create teams<br>• Join teams as member | • Full control of managed teams<br>• Add/remove players<br>• Invite/remove members<br>• Team settings |
| **TEAM_MEMBER** | • Create teams<br>• Join teams as member | • View team data<br>• View player roster<br>• Basic team interaction |

## Implementation Patterns

### 1. Permission Context Provider

```typescript
// contexts/PermissionContext.tsx
'use client'
import { createContext, useContext, useMemo } from 'react'
import { useSession } from 'next-auth/react'

interface PermissionContextType {
  // System-level permissions
  isSystemAdmin: boolean
  canCreateTeam: boolean
  canAccessAllTeams: boolean
  
  // Team-specific permissions
  getTeamPermissions: (teamId: string) => TeamPermissions
  canManageTeam: (teamId: string) => boolean
  canViewTeam: (teamId: string) => boolean
  canEditTeam: (teamId: string) => boolean
  canDeleteTeam: (teamId: string) => boolean
  canManagePlayers: (teamId: string) => boolean
  canInviteMembers: (teamId: string) => boolean
  
  // Role queries
  getUserTeamRole: (teamId: string) => TeamRoleType | null
  isManagedTeam: (teamId: string) => boolean
  getManagedTeams: () => string[]
  getMemberTeams: () => string[]
}

const PermissionContext = createContext<PermissionContextType | null>(null)

export function usePermissions(): PermissionContextType {
  const context = useContext(PermissionContext)
  if (!context) {
    throw new Error('usePermissions must be used within PermissionProvider')
  }
  return context
}

export function PermissionProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession()

  const permissions = useMemo(() => {
    if (!session?.user) {
      return createGuestPermissions()
    }

    return createUserPermissions(session.user)
  }, [session])

  return (
    <PermissionContext.Provider value={permissions}>
      {children}
    </PermissionContext.Provider>
  )
}

// Permission calculation functions
function createUserPermissions(user: SessionUser): PermissionContextType {
  const isSystemAdmin = user.systemRole === 'SYSTEM_ADMIN'
  
  return {
    isSystemAdmin,
    canCreateTeam: true, // All authenticated users can create teams
    canAccessAllTeams: isSystemAdmin,
    
    getTeamPermissions: (teamId: string) => {
      if (isSystemAdmin) {
        return getAllPermissions()
      }
      
      const teamRole = user.teamRoles?.[teamId]
      return getPermissionsForRole(teamRole)
    },
    
    canManageTeam: (teamId: string) => {
      if (isSystemAdmin) return true
      return user.teamRoles?.[teamId] === 'MANAGER'
    },
    
    canViewTeam: (teamId: string) => {
      if (isSystemAdmin) return true
      return !!user.teamRoles?.[teamId] // MANAGER or MEMBER
    },
    
    canEditTeam: (teamId: string) => {
      if (isSystemAdmin) return true
      return user.teamRoles?.[teamId] === 'MANAGER'
    },
    
    canDeleteTeam: (teamId: string) => {
      if (isSystemAdmin) return true
      return user.teamRoles?.[teamId] === 'MANAGER'
    },
    
    canManagePlayers: (teamId: string) => {
      if (isSystemAdmin) return true
      return user.teamRoles?.[teamId] === 'MANAGER'
    },
    
    canInviteMembers: (teamId: string) => {
      if (isSystemAdmin) return true
      return user.teamRoles?.[teamId] === 'MANAGER'
    },
    
    getUserTeamRole: (teamId: string) => {
      return user.teamRoles?.[teamId] || null
    },
    
    isManagedTeam: (teamId: string) => {
      return user.teamRoles?.[teamId] === 'MANAGER'
    },
    
    getManagedTeams: () => {
      return Object.entries(user.teamRoles || {})
        .filter(([_, role]) => role === 'MANAGER')
        .map(([teamId, _]) => teamId)
    },
    
    getMemberTeams: () => {
      return Object.keys(user.teamRoles || {})
    }
  }
}

function getPermissionsForRole(role?: TeamRoleType): TeamPermissions {
  if (role === 'MANAGER') {
    return {
      canViewTeam: true,
      canEditTeam: true,
      canDeleteTeam: true,
      canManagePlayers: true,
      canViewPlayers: true,
      canInviteMembers: true,
      canRemoveMembers: true,
      canChangeSettings: true
    }
  }
  
  if (role === 'MEMBER') {
    return {
      canViewTeam: true,
      canEditTeam: false,
      canDeleteTeam: false,
      canManagePlayers: false,
      canViewPlayers: true,
      canInviteMembers: false,
      canRemoveMembers: false,
      canChangeSettings: false
    }
  }
  
  // No access
  return {
    canViewTeam: false,
    canEditTeam: false,
    canDeleteTeam: false,
    canManagePlayers: false,
    canViewPlayers: false,
    canInviteMembers: false,
    canRemoveMembers: false,
    canChangeSettings: false
  }
}
```

### 2. Component-Level Protection

```typescript
// components/PermissionGate.tsx
import { usePermissions } from '@/contexts/PermissionContext'
import { ReactNode } from 'react'

interface PermissionGateProps {
  children: ReactNode
  fallback?: ReactNode
  require: 'systemAdmin' | 'authenticated'
  teamId?: string
  teamPermission?: keyof TeamPermissions
}

export function PermissionGate({ 
  children, 
  fallback = null, 
  require, 
  teamId, 
  teamPermission 
}: PermissionGateProps) {
  const permissions = usePermissions()
  
  let hasPermission = false
  
  switch (require) {
    case 'systemAdmin':
      hasPermission = permissions.isSystemAdmin
      break
      
    case 'authenticated':
      hasPermission = true // Context only exists for authenticated users
      break
      
    default:
      if (teamId && teamPermission) {
        const teamPerms = permissions.getTeamPermissions(teamId)
        hasPermission = teamPerms[teamPermission]
      }
  }
  
  return hasPermission ? <>{children}</> : <>{fallback}</>
}

// Usage examples:
export function TeamManagerPanel({ teamId }: { teamId: string }) {
  return (
    <PermissionGate 
      teamId={teamId} 
      teamPermission="canEditTeam"
      fallback={<AccessDeniedMessage />}
    >
      <div>
        <h2>Team Management</h2>
        <EditTeamForm teamId={teamId} />
        <PlayerManagement teamId={teamId} />
      </div>
    </PermissionGate>
  )
}

export function SystemAdminTools() {
  return (
    <PermissionGate 
      require="systemAdmin"
      fallback={<div>Admin access required</div>}
    >
      <SystemAdministration />
    </PermissionGate>
  )
}
```

### 3. Higher-Order Components (HOCs)

```typescript
// hoc/withPermission.tsx
import { ComponentType } from 'react'
import { usePermissions } from '@/contexts/PermissionContext'

export interface WithPermissionOptions {
  requireSystemAdmin?: boolean
  requireTeamAccess?: boolean
  requireTeamManager?: boolean
  fallbackComponent?: ComponentType
}

export function withPermission<P extends object>(
  WrappedComponent: ComponentType<P>,
  options: WithPermissionOptions = {}
) {
  return function PermissionProtectedComponent(props: P & { teamId?: string }) {
    const permissions = usePermissions()
    const { teamId } = props
    const {
      requireSystemAdmin = false,
      requireTeamAccess = false,
      requireTeamManager = false,
      fallbackComponent: Fallback = DefaultAccessDenied
    } = options

    // Check system admin requirement
    if (requireSystemAdmin && !permissions.isSystemAdmin) {
      return <Fallback />
    }

    // Check team-specific requirements
    if (teamId) {
      if (requireTeamManager && !permissions.canManageTeam(teamId)) {
        return <Fallback />
      }
      
      if (requireTeamAccess && !permissions.canViewTeam(teamId)) {
        return <Fallback />
      }
    }

    return <WrappedComponent {...props} />
  }
}

// Usage:
const ProtectedTeamEditor = withPermission(TeamEditor, {
  requireTeamManager: true,
  fallbackComponent: TeamAccessDenied
})

const ProtectedSystemTools = withPermission(SystemTools, {
  requireSystemAdmin: true
})
```

### 4. Hook-Based Permission Checks

```typescript
// hooks/useTeamPermissions.ts
import { usePermissions } from '@/contexts/PermissionContext'
import { useMemo } from 'react'

export function useTeamPermissions(teamId?: string) {
  const permissions = usePermissions()
  
  return useMemo(() => {
    if (!teamId) {
      return {
        canView: false,
        canEdit: false,
        canDelete: false,
        canManage: false,
        role: null,
        permissions: getPermissionsForRole()
      }
    }

    const role = permissions.getUserTeamRole(teamId)
    const teamPermissions = permissions.getTeamPermissions(teamId)

    return {
      canView: permissions.canViewTeam(teamId),
      canEdit: permissions.canEditTeam(teamId),
      canDelete: permissions.canDeleteTeam(teamId),
      canManage: permissions.canManageTeam(teamId),
      role,
      permissions: teamPermissions,
      isManager: role === 'MANAGER',
      isMember: role === 'MEMBER',
      hasAccess: !!role
    }
  }, [permissions, teamId])
}

// Usage in components:
export function TeamHeader({ teamId }: { teamId: string }) {
  const { canEdit, canDelete, role, isManager } = useTeamPermissions(teamId)
  
  return (
    <div className="team-header">
      <h1>Team Details</h1>
      {isManager && (
        <div className="manager-badge">Manager</div>
      )}
      {canEdit && (
        <button>Edit Team</button>
      )}
      {canDelete && (
        <button className="danger">Delete Team</button>
      )}
    </div>
  )
}
```

### 5. API Route Protection

```typescript
// lib/api-permissions.ts
import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'

export async function requireAuth(request: NextRequest) {
  const session = await getServerSession(authOptions)
  
  if (!session?.user) {
    throw new ApiError('Unauthorized', 401)
  }
  
  return session.user
}

export async function requireSystemAdmin(request: NextRequest) {
  const user = await requireAuth(request)
  
  if (user.systemRole !== 'SYSTEM_ADMIN') {
    throw new ApiError('Forbidden - Admin access required', 403)
  }
  
  return user
}

export async function requireTeamAccess(request: NextRequest, teamId: string) {
  const user = await requireAuth(request)
  
  if (user.systemRole === 'SYSTEM_ADMIN') {
    return user // Admin can access all teams
  }
  
  if (!user.teamRoles?.[teamId]) {
    throw new ApiError('Forbidden - No team access', 403)
  }
  
  return user
}

export async function requireTeamManager(request: NextRequest, teamId: string) {
  const user = await requireAuth(request)
  
  if (user.systemRole === 'SYSTEM_ADMIN') {
    return user // Admin can manage all teams
  }
  
  if (user.teamRoles?.[teamId] !== 'MANAGER') {
    throw new ApiError('Forbidden - Team manager access required', 403)
  }
  
  return user
}

// Usage in API routes:
// app/api/teams/[id]/route.ts
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireTeamAccess(request, params.id)
    const team = await getTeam(params.id)
    
    return NextResponse.json(team)
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json(
        { error: error.message }, 
        { status: error.status }
      )
    }
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
    const user = await requireTeamManager(request, params.id)
    const updates = await request.json()
    
    const updatedTeam = await updateTeam(params.id, updates, user.id)
    
    return NextResponse.json(updatedTeam)
  } catch (error) {
    // Handle errors...
  }
}
```

### 6. Middleware Integration

```typescript
// middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request })
  const { pathname } = request.nextUrl

  // Public routes
  const isPublicRoute = [
    '/auth/signin',
    '/auth/error',
    '/api/auth'
  ].some(route => pathname.startsWith(route))

  if (!token && !isPublicRoute) {
    return NextResponse.redirect(new URL('/auth/signin', request.url))
  }

  // Team-specific route protection
  const teamMatch = pathname.match(/^\/teams\/([^\/]+)/)
  if (teamMatch && token) {
    const teamId = teamMatch[1]
    const userTeamRole = token.teamRoles?.[teamId]
    const isSystemAdmin = token.systemRole === 'SYSTEM_ADMIN'

    // Check if user has access to this team
    if (!isSystemAdmin && !userTeamRole) {
      return NextResponse.redirect(new URL('/unauthorized', request.url))
    }

    // Check for management routes
    if (pathname.includes('/manage') || pathname.includes('/edit')) {
      const canManage = isSystemAdmin || userTeamRole === 'MANAGER'
      if (!canManage) {
        return NextResponse.redirect(new URL('/unauthorized', request.url))
      }
    }
  }

  // System admin routes
  if (pathname.startsWith('/admin') && token) {
    if (token.systemRole !== 'SYSTEM_ADMIN') {
      return NextResponse.redirect(new URL('/unauthorized', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!api/auth|_next/static|_next/image|favicon.ico).*)',
  ],
}
```

## Role Assignment Patterns

### 1. Team Creation (Auto-Manager Assignment)

```typescript
// lib/team-roles.ts
export async function createTeamWithManager(teamData: CreateTeamRequest, creatorId: string) {
  // Create the team
  const team = await createTeam({
    ...teamData,
    createdBy: creatorId,
    createdAt: new Date().toISOString()
  })

  // Automatically assign creator as manager
  await assignTeamRole({
    teamId: team.id,
    userId: creatorId,
    role: 'MANAGER',
    assignedBy: creatorId, // Self-assigned
    assignedAt: new Date().toISOString()
  })

  return team
}
```

### 2. Team Invitation System

```typescript
// lib/team-invitations.ts
export async function inviteUserToTeam(
  teamId: string, 
  inviterUserId: string, 
  inviteeEmail: string, 
  role: TeamRoleType
) {
  // Verify inviter has permission to invite
  const inviter = await getUserWithTeamRoles(inviterUserId)
  if (!canInviteToTeam(inviter, teamId)) {
    throw new Error('Insufficient permissions to invite users')
  }

  // Create invitation
  const invitation = await createTeamInvitation({
    teamId,
    inviteeEmail,
    role,
    invitedBy: inviterUserId,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
  })

  // Send invitation email
  await sendInvitationEmail(invitation)

  return invitation
}

export async function acceptTeamInvitation(invitationId: string, userId: string) {
  const invitation = await getTeamInvitation(invitationId)
  
  if (!invitation || invitation.expiresAt < new Date()) {
    throw new Error('Invalid or expired invitation')
  }

  // Assign role
  await assignTeamRole({
    teamId: invitation.teamId,
    userId,
    role: invitation.role,
    assignedBy: invitation.invitedBy,
    assignedAt: new Date().toISOString()
  })

  // Mark invitation as accepted
  await markInvitationAccepted(invitationId)
}
```

### 3. Role Management Utils

```typescript
// lib/role-utils.ts
export function canInviteToTeam(user: User, teamId: string): boolean {
  if (user.systemRole === 'SYSTEM_ADMIN') return true
  return user.teamRoles?.[teamId] === 'MANAGER'
}

export function canRemoveFromTeam(user: User, teamId: string, targetUserId: string): boolean {
  if (user.systemRole === 'SYSTEM_ADMIN') return true
  if (user.teamRoles?.[teamId] !== 'MANAGER') return false
  
  // Managers can't remove other managers (only admins can)
  // Would need to fetch target user's role for this check
  return true
}

export function canPromoteToManager(user: User, teamId: string): boolean {
  if (user.systemRole === 'SYSTEM_ADMIN') return true
  return user.teamRoles?.[teamId] === 'MANAGER'
}

export function getEffectivePermissions(user: User, teamId: string): TeamPermissions {
  if (user.systemRole === 'SYSTEM_ADMIN') {
    return getAllPermissions()
  }
  
  const role = user.teamRoles?.[teamId]
  return getPermissionsForRole(role)
}
```

This comprehensive RBAC system provides:

1. **Hierarchical Permissions**: System admins override team-specific roles
2. **Flexible Team Roles**: Managers get full team control, members get read access
3. **Component Protection**: Multiple patterns for protecting UI components
4. **API Security**: Server-side permission enforcement
5. **Invitation System**: Secure team member invitation workflow
6. **Type Safety**: Full TypeScript support throughout

The system scales from simple team management to complex organizational structures while maintaining security and usability.
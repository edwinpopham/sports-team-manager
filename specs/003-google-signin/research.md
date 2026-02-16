# Research: Google Identity Sign-In System

**Phase 0 Research Completion** | **Date**: February 15, 2026  
**Resolving NEEDS CLARIFICATION from Technical Context**

## Google Identity Services Integration

### Decision: NextAuth.js with Google Provider
**Selected Approach**: NextAuth.js v4+ with Google provider integration

**Rationale**: 
- Production-ready security implementation with regular updates
- Built-in Google Identity Services integration with proper token handling
- Comprehensive session management with configurable persistence
- Active community support and extensive documentation
- Native support for Next.js App Router patterns

**Configuration Requirements**:
```typescript
// Google Cloud Console Setup Required:
// 1. Client ID and Client Secret generation
// 2. Authorized domains configuration (localhost + production)
// 3. OAuth consent screen setup with team management scopes
```

**Alternatives Considered**:
- Custom Google Identity Services integration: Rejected due to security complexity and maintenance overhead
- Firebase Auth: Rejected to avoid vendor lock-in and unnecessary features
- Auth0: Rejected due to cost and over-engineering for current needs

## Session Management Implementation

### Decision: JWT Strategy with 7-Day Persistence  
**Selected Approach**: NextAuth.js JWT strategy with httpOnly cookies

**Rationale**:
- Meets exact 7-day session persistence requirement from FR-007
- Stateless architecture reduces infrastructure complexity
- Built-in security with httpOnly cookies preventing XSS attacks
- Cross-tab synchronization through localStorage event handling
- Automatic token refresh with Google OAuth refresh tokens

**Session Configuration**:
```typescript
// next-auth configuration
export const authOptions: NextAuthOptions = {
  providers: [GoogleProvider],
  session: {
    strategy: "jwt",
    maxAge: 7 * 24 * 60 * 60, // 7 days
  },
  jwt: {
    maxAge: 7 * 24 * 60 * 60,
  },
  callbacks: {
    jwt: async ({ token, account, user }) => {
      // Enhanced with role information
    },
    session: async ({ session, token }) => {
      // Include user roles and permissions
    }
  }
}
```

**Alternatives Considered**:
- Server-side sessions with Redis: Rejected due to infrastructure overhead and complexity
- Client-side localStorage: Rejected due to security vulnerabilities and cross-device limitations
- Custom JWT implementation: Rejected due to security complexity and available library maturity

## Role-Based Access Control Implementation

### Decision: Hierarchical Context-Based Permission System
**Selected Approach**: Role hierarchy with team-specific permissions using React Context

**Role Structure**:
- **System Administrator**: Global permissions across all teams and system functions
- **Team Manager**: Full permissions for owned teams, member permissions for joined teams  
- **Team Member**: Read-only permissions for joined teams
- **Authenticated User**: Base permission to create new teams (becoming manager of created teams)

**Implementation Pattern**:
```typescript
// Permission Context Provider
export const PermissionProvider = ({ children }) => {
  const { data: session } = useSession();
  const [permissions, setPermissions] = useState<UserPermissions>();
  
  // Load user permissions including team-specific roles
  const hasPermission = (resource: string, action: string, teamId?: string) => {
    // Centralized permission checking logic
  };
  
  return (
    <PermissionContext.Provider value={{ hasPermission, permissions }}>
      {children}
    </PermissionContext.Provider>
  );
};
```

**Rationale**:
- Aligns with FR-008 through FR-017 requirements for role differentiation
- Supports complex scenario where users have different roles per team
- Provides both component-level and API-level permission enforcement
- Integrates seamlessly with existing TeamContext provider
- Enables future expansion for additional roles without architectural changes

**Alternatives Considered**:
- Simple user-level roles: Rejected as doesn't support team-specific management requirements
- Database-stored permissions: Rejected to maintain client-side localStorage alignment with existing architecture
- Hook-based permission system: Rejected due to performance concerns with frequent permission checks

## Data Migration Strategy  

### Decision: Hybrid Lazy Migration with Progressive Disclosure
**Selected Approach**: Four-phase migration strategy with user choice and admin safety net

**Migration Phases**:
1. **Pre-Migration (60 days)**: User education and export functionality
2. **Lazy Migration (30 days)**: Post-authentication team claiming with immediate UX
3. **Bulk Migration (7 days)**: Final user opportunity with urgency messaging
4. **Post-Migration**: Admin assignment per FR-015 with dispute resolution

**User Experience Flow**:
```
User signs in → "Found 3 teams in browser" → [Claim All | Choose | Skip] → Teams migrate to account
```

**Rationale**:
- Minimizes user friction by providing choice and control
- Ensures zero data loss through comprehensive backup strategy  
- Addresses FR-015 requirement for System Administrator assignment of unclaimed teams
- Gradual transition maintains sports team continuity during migration
- Built-in rollback capability for first 30 days

**Technical Implementation**:
- Dual storage system during transition (localStorage + user association)
- Real-time data validation and integrity checking
- Export functionality for user peace of mind
- Administrative override capabilities for dispute resolution

**Alternatives Considered**:
- Immediate forced migration: Rejected due to user experience disruption
- Permanent localStorage fallback: Rejected as prevents full authentication benefit realization
- Manual admin assignment only: Rejected as creates unnecessary administrative burden

## Architecture Integration Decisions

### Authentication State Management
**Selected**: Enhanced TeamContext with authentication integration
```typescript
// Existing TeamContext enhanced with user permissions
export const TeamContextProvider = ({ children }) => {
  const { data: session } = useSession();
  const [teams, setTeams] = useState<TeamWithRoles[]>([]);
  
  // Filter teams based on user permissions
  const userTeams = useMemo(() => 
    teams.filter(team => hasTeamAccess(session?.user?.id, team))
  , [teams, session]);
};
```

### API Route Protection  
**Selected**: Middleware-based authentication with route-specific permission checking
```typescript
// middleware.ts - Global authentication check
export function middleware(request: NextRequest) {
  // Redirect anonymous users to signin page (FR-014)
}

// Individual API route permission validation
// api/teams/[id]/route.ts
export async function PATCH(request: Request, { params }) {
  const session = await getServerSession(authOptions);
  const canManage = await checkTeamManagementPermission(session.user.id, params.id);
  // FR-012: Restrict management to team managers and system admins
}
```

## Implementation Priorities

**Phase 1 (Week 1)**: Core Google authentication with NextAuth.js setup
**Phase 2 (Week 2)**: Role-based access control and permission enforcement  
**Phase 3 (Week 3)**: Data migration system and team claiming flow
**Phase 4 (Week 4)**: Advanced features, testing, and production deployment

**All NEEDS CLARIFICATION items resolved** ✅
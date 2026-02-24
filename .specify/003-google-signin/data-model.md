# Data Model: Google Identity Sign-In System

**Phase 1 Design** | **Date**: February 15, 2026  
**Source**: Feature specification entities + research decisions  

## Core Entities

### User
Represents an authenticated user with Google profile information and system role.

**Fields**:
```typescript
interface User {
  id: string;              // UUID - primary identifier
  googleId: string;        // Google account unique identifier
  email: string;           // Google account email (unique)
  name: string;           // Display name from Google profile  
  profilePicture?: string; // Google profile image URL
  isSystemAdmin: boolean;  // System-wide administrative role
  createdAt: string;      // ISO timestamp of account creation
  lastLoginAt: string;    // ISO timestamp of most recent authentication
}
```

**Relationships**:
- One-to-many with TeamRole (user permissions across teams)
- One-to-many with Team (teams created/owned by user)

**Validation Rules**:
- `googleId` must be unique across all users
- `email` must be valid email format and unique  
- `name` required, minimum 1 character
- `isSystemAdmin` defaults to false for new users
- Timestamps must be valid ISO 8601 format

**State Transitions**:
- Created → Active (on first successful Google sign-in)
- Active → Inactive (after extended period without login)
- Any → System Admin (manual promotion by existing admin)

---

### UserSession
Manages authentication state and session validity.

**Fields**:
```typescript
interface UserSession {
  userId: string;         // Reference to User.id
  accessToken: string;    // Google OAuth access token (encrypted)
  refreshToken: string;   // Google OAuth refresh token (encrypted)
  tokenExpiry: string;    // Access token expiration timestamp
  sessionStart: string;   // Session initiation timestamp
  sessionExpiry: string;  // Session expiration (7 days from start)
  isActive: boolean;      // Session active status
}
```

**Relationships**:
- Many-to-one with User (user can have multiple active sessions across devices)

**Validation Rules**:
- `sessionExpiry` must be exactly 7 days from `sessionStart` (FR-007)
- `tokenExpiry` must be before `sessionExpiry`
- `accessToken` and `refreshToken` must be encrypted at rest
- Only one active session per device/browser allowed

**State Transitions**:
- Created → Active (on successful authentication)
- Active → Expired (after 7 days or manual logout)
- Active → Refreshed (when access token renewed)
- Any → Revoked (user signs out or admin revocation)

---

### Team (Enhanced)
Extended version of existing Team entity with user association and role management.

**Fields** (additions to existing Team):
```typescript
interface TeamWithAuth extends Team {
  createdBy: string;      // User.id of team creator/owner
  isPublic: boolean;      // Team visibility (default: false)
  createdAt: string;      // Team creation timestamp
  lastModified: string;   // Last update timestamp
  modifiedBy: string;     // User.id who made last modification
}
```

**Relationships**:
- Many-to-one with User via `createdBy` (team creator)
- One-to-many with TeamRole (user permissions for this team)
- One-to-many with Player (existing relationship enhanced with permissions)

**Validation Rules**:
- `createdBy` must reference valid User.id
- Team creator automatically gets MANAGER role for this team
- `isPublic` controls visibility to non-members
- Only team managers or system admins can modify team settings

---

### TeamRole  
Links users to teams with specific role assignments for granular permission control.

**Fields**:
```typescript
interface TeamRole {
  id: string;            // UUID - primary identifier  
  userId: string;        // Reference to User.id
  teamId: string;        // Reference to Team.id
  role: 'MANAGER' | 'MEMBER'; // User role for this specific team
  assignedAt: string;    // Timestamp when role was granted
  assignedBy?: string;   // User.id who granted this role (optional for auto-assignments)
}
```

**Relationships**:
- Many-to-one with User (user can have roles in multiple teams)
- Many-to-one with Team (team can have multiple user roles)
- Many-to-one with User via `assignedBy` (audit trail)

**Validation Rules**:
- Combination of `userId` + `teamId` must be unique (one role per user per team)
- Team creator automatically gets MANAGER role (cannot be removed unless team deleted)
- Only existing team MANAGERs or SYSTEM_ADMINs can assign/modify roles
- MANAGER role includes all MEMBER permissions plus management capabilities

**State Transitions**:
- Created → Active (when user joins team or is assigned role)
- Active → Modified (when role changes from MEMBER to MANAGER or vice versa)
- Any → Removed (when user leaves team or is removed by manager)

---

### SystemAdministrator
Special designation for users with system-wide management capabilities.

**Fields**:
```typescript
interface SystemAdministrator {
  userId: string;        // Reference to User.id (also has isSystemAdmin: true)
  assignedAt: string;    // Timestamp when admin role was granted
  assignedBy: string;    // User.id who granted admin role
  level: 'FULL' | 'TEAM_MANAGEMENT'; // Admin capability scope
}
```

**Relationships**:
- One-to-one with User (admin designation)
- Many-to-one with User via `assignedBy` (audit trail)

**Validation Rules**:
- `userId` must have `User.isSystemAdmin` set to true
- System requires at least one FULL admin at all times
- Admin assignment requires existing system admin approval
- FULL admins can manage all teams regardless of ownership (FR-010)

## Entity Relationship & Permission Matrix

### Role Permissions by Entity

| Role | Team | Player | User | System |
|------|------|--------|------|---------|  
| **System Admin** | All operations on any team | All operations on any player | Manage any user | Full system control |
| **Team Manager** | Full control of owned teams | Full control within managed teams | View team members | Create teams |
| **Team Member** | View joined teams only | View players in joined teams | View own profile | Basic authenticated actions |
| **Authenticated User** | Create new teams | N/A | Manage own profile | Sign in/out |

### Data Access Patterns

**Team Access Control**:
```typescript
// Team visibility logic
function canAccessTeam(user: User, team: TeamWithAuth, teamRoles: TeamRole[]): boolean {
  // System admin can access any team
  if (user.isSystemAdmin) return true;
  
  // Team creator/manager can access their teams
  if (team.createdBy === user.id) return true;
  
  // Check if user has explicit role in team
  return teamRoles.some(role => 
    role.userId === user.id && role.teamId === team.id
  );
}
```

**Permission Inheritance**:
- SYSTEM_ADMIN inherits all permissions
- TEAM_MANAGER inherits TEAM_MEMBER permissions for managed teams  
- AUTHENTICATED_USER is base permission level for all signed-in users
- Anonymous users have no permissions (FR-014 redirect requirement)

## Migration Considerations

### Existing Data Integration
- Current localStorage teams need `createdBy` assignment during migration
- Unclaimed teams automatically assigned to first System Administrator (FR-015)
- Team modification history starts from migration point
- User profile data populated from Google Identity on first sign-in

### Data Consistency Rules
- All teams must have associated `createdBy` after migration complete
- Team creator always maintains MANAGER role (cannot be demoted)
- System must maintain at least one active System Administrator
- User sessions automatically expire after 7 days (FR-007)

### Storage Strategy  
- Client-side: Enhanced localStorage with user association during migration
- Session storage: NextAuth.js JWT tokens with role information
- Future expansion: Prepared for server-side database if needed for real-time features
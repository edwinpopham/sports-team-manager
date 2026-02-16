# Tasks: Google Identity Sign-In System

**Input**: Design documents from `/specs/003-google-signin/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts ✅

**Tests**: TDD is mandatory per constitution - all test tasks are REQUIRED and must be completed before implementation.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)  
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US5)
- Include exact file paths in descriptions

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and NextAuth.js foundation

- [ ] T001 Install NextAuth.js dependencies: next-auth, @next-auth/prisma-adapter
- [ ] T002 [P] Configure TypeScript types for NextAuth.js module augmentation in app/types/auth.ts
- [ ] T003 [P] Setup Google Cloud Console OAuth 2.0 credentials and domain verification
- [ ] T004 [P] Configure environment variables in .env.local for NextAuth.js and Google OAuth

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core authentication infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T005 Create NextAuth.js configuration in app/api/auth/[...nextauth]/route.ts with Google provider
- [ ] T006 [P] Implement session management with JWT strategy and 7-day persistence configuration
- [ ] T007 [P] Create base User and Session type definitions extending NextAuth interfaces
- [ ] T008 Create TeamRole data model and validation rules in app/types/auth.ts
- [ ] T009 [P] Implement core permission checking utilities in app/lib/permissions.ts
- [ ] T010 [P] Create authentication middleware in middleware.ts for route protection
- [ ] T011 Setup SessionProvider wrapper in app/layout.tsx for Next.js App Router
- [ ] T012 [P] Create base error handling and redirect logic for authentication failures

**Checkpoint**: NextAuth.js foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 5 - Anonymous User Signin Flow (Priority: P1) 🎯 MVP Foundation

**Goal**: Ensure anonymous users can only access signin page, establishing security boundary

**Independent Test**: Access application without signing in and verify only signin page is accessible

### Tests for User Story 5 (TDD - REQUIRED ⚠️)

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T013 [P] [US5] Integration test for anonymous redirect flow in __tests__/integration/anonymous-access.test.ts
- [ ] T014 [P] [US5] Middleware test for route protection in __tests__/middleware/auth-middleware.test.ts

### Implementation for User Story 5

- [ ] T015 [P] [US5] Create custom signin page component in app/signin/page.tsx with Google signin button
- [ ] T016 [US5] Configure NextAuth.js pages configuration to use custom signin page
- [ ] T017 [US5] Implement authentication middleware rule to redirect anonymous users to signin
- [ ] T018 [US5] Add signin page styling matching existing UI components and mobile responsiveness
- [ ] T019 [P] [US5] Add error handling for authentication failures on signin page

**Checkpoint**: At this point, anonymous users are properly redirected to signin and cannot access other pages

---

## Phase 4: User Story 1 - Basic Google Sign-In (Priority: P1) 🎯 MVP Core

**Goal**: Enable users to sign in with Google account and access application with session persistence

**Independent Test**: Sign in with Google account and verify access to teams section with 7-day session persistence

### Tests for User Story 1 (TDD - REQUIRED ⚠️)

- [ ] T020 [P] [US1] Contract test for Google OAuth callback in __tests__/api/auth.contract.test.ts
- [ ] T021 [P] [US1] Integration test for complete signin flow in __tests__/integration/google-signin.test.ts
- [ ] T022 [P] [US1] Session persistence test for 7-day requirement in __tests__/auth/session-management.test.ts

### Implementation for User Story 1

- [ ] T023 [P] [US1] Implement Google OAuth callback handling in NextAuth.js configuration
- [ ] T024 [P] [US1] Create user session creation logic with Google profile data extraction
- [ ] T025 [US1] Add JWT callback to store Google ID and system admin flag in session token
- [ ] T026 [US1] Configure session callback to include user permissions in session object
- [ ] T027 [P] [US1] Add first-time user account creation logic on successful Google authentication
- [ ] T028 [US1] Implement session validation and refresh token handling for 7-day persistence
- [ ] T029 [P] [US1] Add navigation integration showing signin/signout state in app/components/Navigation.tsx

**Checkpoint**: At this point, User Story 1 should be fully functional - users can sign in with Google and access the application

---

## Phase 5: User Story 2 - User Profile and Team Association (Priority: P2)

**Goal**: Display user profile information and show teams associated with authenticated user

**Independent Test**: Sign in and verify profile information is displayed correctly and teams are properly attributed

### Tests for User Story 2 (TDD - REQUIRED ⚠️)

- [ ] T030 [P] [US2] Unit test for UserProfile component in __tests__/components/auth/UserProfile.test.tsx
- [ ] T031 [P] [US2] API test for user profile endpoint in __tests__/api/users/profile.test.ts
- [ ] T032 [P] [US2] Integration test for team ownership display in __tests__/integration/team-association.test.ts

### Implementation for User Story 2

- [ ] T033 [P] [US2] Create UserProfile component in app/components/auth/UserProfile.tsx
- [ ] T034 [P] [US2] Implement user profile API endpoint in app/api/users/profile/route.ts
- [ ] T035 [US2] Create AuthContext provider in app/contexts/AuthContext.tsx for user state management
- [ ] T036 [US2] Enhance TeamContext in app/contexts/TeamContext.tsx to include user ownership information
- [ ] T037 [P] [US2] Add user profile display to main navigation or dashboard area
- [ ] T038 [US2] Implement team ownership indicators in team list and team detail views
- [ ] T039 [P] [US2] Add profile picture display with Google profile image integration

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently - users see their profile and team associations

---

## Phase 6: User Story 3 - Sign Out and Session Management (Priority: P2)

**Goal**: Enable secure sign out functionality with proper session cleanup and state management

**Independent Test**: Sign out and verify access restrictions are enforced and session is properly cleaned up

### Tests for User Story 3 (TDD - REQUIRED ⚠️)

- [ ] T040 [P] [US3] Unit test for SignOutButton component in __tests__/components/auth/SignOutButton.test.tsx
- [ ] T041 [P] [US3] Integration test for complete signout flow in __tests__/integration/signout.test.ts
- [ ] T042 [P] [US3] Session cleanup verification test in __tests__/auth/session-cleanup.test.ts

### Implementation for User Story 3

- [ ] T043 [P] [US3] Create SignOutButton component in app/components/auth/SignOutButton.tsx
- [ ] T044 [P] [US3] Implement signout API endpoint in app/api/auth/signout/route.ts
- [ ] T045 [US3] Add signout button to navigation component with proper placement and styling
- [ ] T046 [US3] Implement session cleanup logic to clear client-side authentication state
- [ ] T047 [P] [US3] Add post-signout redirect to signin page with success message
- [ ] T048 [US3] Ensure middleware properly handles post-signout access attempts
- [ ] T049 [P] [US3] Add browser session storage cleanup for complete signout

**Checkpoint**: All authentication lifecycle (signin, session, signout) should now be complete

---

## Phase 7: User Story 4 - Team Creation and Management (Priority: P2)

**Goal**: Enable authenticated users to create teams with automatic manager role assignment and proper permission enforcement

**Independent Test**: Create a team as authenticated user and verify manager permissions while retaining member permissions for other teams

### Tests for User Story 4 (TDD - REQUIRED ⚠️)

- [ ] T050 [P] [US4] Unit test for permission checking logic in __tests__/lib/permissions.test.ts
- [ ] T051 [P] [US4] API test for team creation with role assignment in __tests__/api/teams/create.test.ts
- [ ] T052 [P] [US4] Integration test for team management permissions in __tests__/integration/team-management.test.ts
- [ ] T053 [P] [US4] Component test for PermissionGate in __tests__/components/auth/PermissionGate.test.tsx

### Implementation for User Story 4

- [ ] T054 [P] [US4] Create PermissionGate component in app/components/auth/PermissionGate.tsx
- [ ] T055 [P] [US4] Implement PermissionService class in app/lib/permissions.ts with role-based logic
- [ ] T056 [US4] Enhance team creation API in app/api/teams/route.ts to assign creator as manager
- [ ] T057 [US4] Create team role management API endpoints in app/api/teams/[teamId]/roles/route.ts
- [ ] T058 [US4] Integrate permission checking in existing TeamForm component in app/components/forms/TeamForm.tsx
- [ ] T059 [US4] Add permission-based UI controls to team management interface
- [ ] T060 [P] [US4] Implement team member role display in team overview components
- [ ] T061 [US4] Add role-based filtering to team lists based on user permissions
- [ ] T062 [P] [US4] Create team settings page with manager-only controls

**Checkpoint**: All user stories should now be independently functional with proper role-based access control

---

## Phase 8: Migration & Data Integration

**Purpose**: Handle localStorage team claiming and existing data migration

### Tests for Migration (TDD - REQUIRED ⚠️)

- [ ] T063 [P] [MIG] Unit test for team claiming logic in __tests__/migration/team-claiming.test.ts
- [ ] T064 [P] [MIG] Integration test for migration flow in __tests__/integration/localStorage-migration.test.ts

### Migration Implementation

- [ ] T065 [P] [MIG] Create TeamClaimingFlow component in app/components/migration/TeamClaimingFlow.tsx
- [ ] T066 [P] [MIG] Implement team claiming API endpoint in app/api/migration/claim-teams/route.ts
- [ ] T067 [MIG] Add migration detection logic to main application layout
- [ ] T068 [P] [MIG] Create team export functionality in app/api/migration/export-teams/route.ts
- [ ] T069 [MIG] Implement localStorage team data validation and sanitization
- [ ] T070 [P] [MIG] Add migration success confirmation and data verification

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories and production readiness

- [ ] T071 [P] Add comprehensive error boundary components for authentication failures
- [ ] T072 [P] Implement authentication monitoring and logging throughout the system
- [ ] T073 Add loading states and skeleton components for authentication flows
- [ ] T074 [P] Performance optimization for permission checking across components
- [ ] T075 [P] Security hardening for session management and API endpoints
- [ ] T076 [P] Accessibility improvements for authentication UI components
- [ ] T077 [P] Add comprehensive JSDoc documentation for authentication utilities
- [ ] T078 Run quickstart.md validation and implementation verification
- [ ] T079 [P] Create deployment guide for Google OAuth production configuration
- [ ] T080 Setup authentication monitoring dashboard and alerting

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories  
- **User Story 5 (Phase 3)**: Depends on Foundational phase completion - MVP Foundation
- **User Story 1 (Phase 4)**: Depends on User Story 5 completion - MVP Core
- **User Story 2 (Phase 5)**: Depends on User Story 1 completion - builds on authentication
- **User Story 3 (Phase 6)**: Depends on User Story 1 completion - complements signin  
- **User Story 4 (Phase 7)**: Depends on User Stories 1 & 2 completion - requires user profiles and permissions
- **Migration (Phase 8)**: Depends on User Story 4 completion - needs team management
- **Polish (Phase 9)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 5 (P1)**: Essential security foundation - no other story dependencies
- **User Story 1 (P1)**: Depends on US5 for secure signin page - core authentication
- **User Story 2 (P2)**: Depends on US1 for user authentication state - independently testable
- **User Story 3 (P2)**: Depends on US1 for session management - independently testable  
- **User Story 4 (P2)**: Depends on US1 (users) and US2 (profiles) for team ownership - independently testable

### Within Each User Story

- Tests MUST be written first and FAIL before implementation (TDD requirement)
- Type definitions and utilities before components
- API endpoints before client components
- Core functionality before UI integration
- Story validation before moving to next priority

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel
- All Foundational tasks marked [P] can run in parallel within Phase 2
- Within each user story, tasks marked [P] can run simultaneously  
- Different user stories can be worked on in parallel by different team members once dependencies are met
- All test creation for a story can happen in parallel
- All independent component creation can happen in parallel

---

## Parallel Example: User Story 1

```bash
# Launch all tests for User Story 1 together:
Task T020: "Contract test for Google OAuth callback"
Task T021: "Integration test for complete signin flow"  
Task T022: "Session persistence test for 7-day requirement"

# Launch all parallel implementation tasks together:
Task T023: "Google OAuth callback handling"
Task T024: "User session creation logic"
Task T027: "First-time user account creation logic"
Task T029: "Navigation integration"
```

---

## Implementation Strategy

### MVP First (User Stories 5 + 1 Only)

1. Complete Phase 1: Setup  
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 5 (Anonymous protection)
4. Complete Phase 4: User Story 1 (Basic Google signin)
5. **STOP and VALIDATE**: Test signin flow independently
6. Deploy/demo if ready - users can now sign in with Google

### Incremental Delivery

1. Complete Setup + Foundational → Authentication foundation ready
2. Add User Story 5 → Anonymous protection active
3. Add User Story 1 → Basic signin working → Deploy/Demo (MVP!)
4. Add User Story 2 → Profile management → Deploy/Demo  
5. Add User Story 3 → Complete auth lifecycle → Deploy/Demo
6. Add User Story 4 → Team management with roles → Deploy/Demo
7. Add Migration → localStorage transition → Deploy/Demo
8. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers after Foundational phase completion:

1. **Developer A**: User Story 5 → User Story 1 (Critical path)
2. **Developer B**: Start on User Story 2 tests and components (once US1 foundations exist)
3. **Developer C**: Start on User Story 3 tests and components (once US1 foundations exist)
4. Stories integrate and validate independently

---

## Success Metrics

- **Task Count**: 80 total tasks across 8 phases
- **MVP Scope**: User Stories 5 + 1 (21 tasks) - Anonymous protection + Google signin  
- **Full Feature**: All user stories (68 tasks) - Complete authentication system
- **Parallel Opportunities**: 31 tasks marked [P] for concurrent execution
- **Independent Test Criteria**: Each user story has complete test coverage and can be validated independently
- **TDD Compliance**: All implementation tasks have corresponding test tasks that must be written first

---

## Notes

- **[P] tasks** = Different files, no dependencies within story - can run in parallel
- **[Story] labels** = Map tasks to specific user stories for traceability and independent delivery  
- **TDD Required**: Constitution mandates test-driven development - all test tasks are REQUIRED
- **Independent Stories**: Each user story should be completable and testable independently  
- **MVP Definition**: User Stories 5 + 1 provide complete basic authentication (signin, session, protection)
- **File Paths**: All tasks include specific Next.js App Router file paths for immediate implementation
- **Checkpoints**: Each story phase has validation criteria for independent verification
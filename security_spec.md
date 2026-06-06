# Security Specification: Multiuser Task Manager Security Rules

This security specification defines the data invariants, secure path validation guards, and a suite of "Dirty Dozen" payloads attempting to violate security boundaries, followed by the test suite outline.

## 1. Core Data Invariants & Access Control Policy

- **Users (`/users/{userId}`)**:
  - Anyone can create or sign up for a profile matching their authenticated UID (`request.auth.uid == userId`).
  - Read access is allowed for authenticated users so they can see team member profiles.
  - Updates are allowed only by the owner of the profile (`request.auth.uid == userId`) and cannot mutate immutable fields like `uid`.

- **Boards (`/boards/{boardId}`)**:
  - Any authenticated user can create a board.
  - Read access to a board is restricted to members of the board (`exists(/databases/$(database)/documents/boards/$(boardId)/members/$(request.auth.uid))`).
  - Updates are allowed only by members, and some administrative fields can only be changed by board owners.

- **Board Members (`/boards/{boardId}/members/{memberId}`)**:
  - Read access is limited to existing board members.
  - Any signed-in user can join a board or add members, but they must be validated.
  - A member profile can only be modified by the user themselves or the board owner.

- **Tasks (`/boards/{boardId}/tasks/{taskId}`)**:
  - Read access is strictly restricted to members of the parent board (verifying board-level membership).
  - Create and Delete are only allowed for members of the parent board.
  - Update is restricted to members of the parent board.

- **Board Activity Logs (`/boards/{boardId}/activity/{activityId}`)**:
  - Read-only access for members of the board. No client-side modifications (activity logs are written under board context when performing board/task operations; for direct writing, only self-authored event logging is supported).

- **User Notifications (`/users/{userId}/notifications/{notificationId}`)**:
  - Read-write access is restricted exclusively to the owner of the notifications (`request.auth.uid == userId`).
  - System or other users can write notifications here, but users can only read their own.

---

## 2. The "Dirty Dozen" Malicious Payloads

The following payloads represent specific attacks against the data structures and security policies.

### Payload 1: Board Spoofer (Identity Spoofing)
- **Path**: `/boards/board123`
- **Action**: `create`
- **Payload**: `{ "boardId": "board123", "name": "Fake Board", "creatorId": "victim_user_id", "createdAt": "2026-06-05T16:30:38Z", "updatedAt": "2026-06-05T16:30:38Z" }`
- **Intent**: Create a board claiming someone else is the creator.
- **Expected Outcome**: `PERMISSION_DENIED` (creatorId must match `request.auth.uid`).

### Payload 2: Ghost Field Injector (Shadow Update)
- **Path**: `/boards/board123`
- **Action**: `update`
- **Payload**: `{ "boardId": "board123", "name": "Standard Update", "creatorId": "attacker_id", "createdAt": "2026-06-05T16:30:38Z", "updatedAt": "2026-06-05T16:30:38Z", "isPremiumSystemAdmin": true }`
- **Intent**: Add an un-whitelisted "ghost field" containing administrative rights.
- **Expected Outcome**: `PERMISSION_DENIED` (blocked by strict key limits).

### Payload 3: Unauthenticated Reader (Blanket Read Scrape)
- **Path**: `/boards/secretboard/tasks/task123`
- **Action**: `get`
- **Payload**: (None)
- **Intent**: An unauthenticated user attempts to read sensitive task descriptions.
- **Expected Outcome**: `PERMISSION_DENIED` (auth.uid must be a board member).

### Payload 4: Orphaned Task Creation (Relational Integrity Violation)
- **Path**: `/boards/nonexistent_board/tasks/task123`
- **Action**: `create`
- **Payload**: `{ "taskId": "task123", "boardId": "nonexistent_board", "title": "Orphaned Task", "status": "todo", "priority": "high", "creatorId": "attacker_id", "createdAt": "2026-06-05T16:30:38Z", "updatedAt": "2026-06-05T16:30:38Z" }`
- **Intent**: Create a task referencing a board that does not exist to cause systemic corruption.
- **Expected Outcome**: `PERMISSION_DENIED` (must verify existing parent board).

### Payload 5: Deny-of-Wallet Path Poisoning (Resource Exhaustion)
- **Path**: `/boards/board123/tasks/very_long_junk_id_forty_thousand_characters_long_01234567890123456789012345678901234567890123456789...`
- **Action**: `create`
- **Payload**: `{ "id": "very_long_id..." }`
- **Intent**: Post huge ID strings to trigger storage/indexing cost exhaustion.
- **Expected Outcome**: `PERMISSION_DENIED` (`isValidId` limits characters/length).

### Payload 6: Client-Provided Spoofed Timestamp (Temporal Integrity Breach)
- **Path**: `/boards/board123/tasks/task123`
- **Action**: `create`
- **Payload**: `{ "taskId": "task123", "boardId": "board123", "title": "Spoofed Date", "status": "todo", "priority": "medium", "creatorId": "attacker_id", "createdAt": "2010-01-01T00:00:00Z", "updatedAt": "2026-06-05T16:30:38Z" }`
- **Intent**: Backdate task creation to falsify records or cheat analytics.
- **Expected Outcome**: `PERMISSION_DENIED` (`createdAt` must match server time `request.time`).

### Payload 7: State Lock Bypass (Terminal State Modification)
- **Path**: `/boards/board123/tasks/task123` (already in `status: done` or terminal state)
- **Action**: `update`
- **Payload**: Changing status back to `todo` or renaming the task after closure.
- **Intent**: Re-open/modify locked items.
- **Expected Outcome**: `PERMISSION_DENIED` (guards enforce final status immutability).

### Payload 8: Cross-Tenant Notification Injection (Identity Boundary Failure)
- **Path**: `/users/victim_uid/notifications/notif123`
- **Action**: `create`
- **Payload**: `{ "notificationId": "notif123", "boardId": "board123", "boardName": "Some Board", "title": "Injected Notification", "message": "You owe money", "read": false, "type": "assignment", "createdAt": "2026-06-05T16:30:38Z" }`
- **Intent**: Inject fake notifications directly into another user's notifier feed.
- **Expected Outcome**: `PERMISSION_DENIED` (system writes only or scoped validation).

### Payload 9: Self-Elevated Privilege Allocation (RBAC Escalation)
- **Path**: `/boards/board123/members/attacker_uid`
- **Action**: `update`
- **Payload**: `{ "uid": "attacker_uid", "email": "attacker@gmail.com", "displayName": "Attacker", "role": "owner", "joinedAt": "2026-06-05T16:30:38Z" }`
- **Intent**: Elevate role from `member` to `owner` to hijack board control.
- **Expected Outcome**: `PERMISSION_DENIED` (role is immutable except by board owners).

### Payload 10: Task Duplication / Creation by Non-Member (Board Infiltration)
- **Path**: `/boards/secretboard/tasks/task_attack`
- **Action**: `create`
- **Payload**: `{ "taskId": "task_attack", "boardId": "secretboard", "title": "Injected Task", "status": "todo", "priority": "high", "creatorId": "attacker_uid", "createdAt": "2026-06-05T16:30:38Z", "updatedAt": "2026-06-05T16:30:38Z" }`
- **Intent**: Write tasks into a private board the attacker has not joined.
- **Expected Outcome**: `PERMISSION_DENIED` (user must be a member of `secretboard`).

### Payload 11: Notification Data Scrape (PII Leakage)
- **Path**: `/users/victim_uid/notifications`
- **Action**: `list`
- **Payload**: (None - query)
- **Intent**: Scrape victim's personal, highly sensitive inbox list.
- **Expected Outcome**: `PERMISSION_DENIED` (queries are authenticated and restricted strictly to `request.auth.uid == userId`).

### Payload 12: Board Hijacking (Value Poisoning)
- **Path**: `/boards/board123`
- **Action**: `update`
- **Payload**: `{ "boardId": "board123", "name": { "malicious_obj": 123 }, "creatorId": "attacker_id", "createdAt": "2026-06-05T16:30:38Z", "updatedAt": "2026-06-05T16:30:38Z" }`
- **Intent**: Replace string board title with sub-objects / non-strings to break layouts.
- **Expected Outcome**: `PERMISSION_DENIED` (`name` must be a valid string).

---

## 3. Test Runner Outline & Assertions

Our `firestore.rules.test.ts` or actual Firebase implementation maintains these core rules. In our manual and integration deployments, we confirm:
- `getDoc` / `setDoc` calls strictly fail for any payload matching the Dirty Dozen patterns.
- Errors are cleanly processed and bubbled via our custom `handleFirestoreError()` utility.

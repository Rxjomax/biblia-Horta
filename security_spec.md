# Security Specification — IEB Horta (`security_spec.md`)

## 1. Data Invariants

1. **Default Deny & Verified Identity**: Every path outside explicitly matched collections is unconditionally denied (`allow read, write: if false`). All write operations require an authenticated Google user with `request.auth.token.email_verified == true`.
2. **Master Gate for Personal Subcollections**: Every document inside `/users/{userId}/sermonNotes/{noteId}`, `/users/{userId}/verseNotes/{noteId}`, `/users/{userId}/bookmarks/{bookmarkId}`, `/users/{userId}/highlights/{highlightId}`, `/users/{userId}/planProgress/{planId}`, and `/users/{userId}/visitorCards/{cardId}` requires `request.auth.uid == userId`, `incoming().ownerId == userId`, and an existing parent workspace `/users/{userId}` (`exists(/databases/$(database)/documents/users/$(userId))`).
3. **PII Isolation**: Visitor welcome cards containing phone numbers or emails (`contact`) are stored exclusively in `/users/{userId}/visitorCards/{cardId}` and are readable ONLY by `isOwner(userId)` or `isAdmin()`. No PII is stored in `/users/{userId}`, `/prayerRequests`, or `/challengeComments`.
4. **Strict Key & Size Boundaries**: Every `create` and `update` invokes `isValid[Entity](incoming())`, enforcing `keys().hasAll(...)` and `keys().hasOnly(...)`, regex ID patterns (`^[a-zA-Z0-9_\-]+$`), string `.size()` bounds, array `.size()` bounds, and server timestamps (`request.time`).
5. **Tiered Updates & Immutable Ownership**: `ownerId`, `authorId`, `churchId`, and `createdAt` are immutable across all updates. On `/prayerRequests/{requestId}`, non-authors can ONLY perform the `pray` counter action (`affectedKeys().hasOnly(['prayingCount', 'updatedAt'])` with a `±1` delta).
6. **Secure List Queries**: Every `allow list` rule evaluates `resource.data` against `request.auth.uid` or verified congregation visibility (`resource.data.churchId == 'iebhorta' && (resource.data.isPublic == true || resource.data.authorId == request.auth.uid)`).

---

## 2. The "Dirty Dozen" Payloads

1. **Shadow Field Injection on `UserWorkspace`**: Adding `"isAdmin": true` to `/users/{uid}`. Rejected by `keys().hasOnly(...)`.
2. **Identity Spoofing on `SermonNoteDoc`**: Writing a note with `ownerId: "victim-uid"` under `/users/{attackerUid}/sermonNotes/note1`. Rejected by `incoming().ownerId == request.auth.uid`.
3. **Orphaned Subcollection Write**: Creating `/users/{uid}/sermonNotes/note1` when `/users/{uid}` does not exist. Rejected by Master Gate `exists(/databases/$(database)/documents/users/$(userId))`.
4. **Unverified Email Write**: Attempting to create a `PrayerRequestDoc` with `email_verified: false`. Rejected by `isVerifiedUser()`.
5. **Cross-User PII Read on `VisitorCardDoc`**: User B attempting `get` or `list` on `/users/userA/visitorCards/card1`. Rejected by `isOwner(userId) || isAdmin()`.
6. **ID Poisoning Attack**: Creating `/prayerRequests/bad id with spaces!`. Rejected by `isValidId(requestId)`.
7. **Denial-of-Wallet Oversized String**: Creating a `SermonNoteDoc` with `content` > 8000 characters. Rejected by `data.content.size() <= 8000`.
8. **Unbounded Array Poisoning on `PlanProgressDoc`**: Writing `completedDays` with 500 elements (> 366 days). Rejected by `data.completedDays.size() <= 366`.
9. **Unauthorized Prayer Request Content Tampering**: User B attempting to modify `content` of User A's `PrayerRequestDoc`. Rejected because Tier 2 `pray` action only allows `['prayingCount', 'updatedAt']` with `±1` delta.
10. **Arbitrary Vote Jump on `PrayerRequestDoc`**: User B attempting to increment `prayingCount` by +500 in one write. Rejected by `incoming().prayingCount == existing().prayingCount + 1 || incoming().prayingCount == existing().prayingCount - 1`.
11. **Timestamp Forgery**: Client passing a past or future timestamp instead of `serverTimestamp()` (`request.time`). Rejected by `incoming().createdAt == request.time` and `incoming().updatedAt == request.time`.
12. **Immutable Field Mutation**: Owner attempting to change `createdAt` or `ownerId` during `update`. Rejected by `incoming().createdAt == existing().createdAt && incoming().ownerId == existing().ownerId`.

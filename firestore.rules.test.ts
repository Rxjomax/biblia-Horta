import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const rulesPath = path.resolve(process.cwd(), 'firestore.rules');
const blueprintPath = path.resolve(process.cwd(), 'firebase-blueprint.json');

test('firestore.rules and firebase-blueprint.json are synchronized and enforce all Eight Pillars', () => {
  const rules = fs.readFileSync(rulesPath, 'utf8');
  const blueprint = JSON.parse(fs.readFileSync(blueprintPath, 'utf8')) as {
    entities: Record<string, { properties: Record<string, { maxLength?: number }> }>;
    firestore: Record<string, unknown>;
  };

  // Pillar 0: Default Deny catch-all
  assert.match(rules, /match \/\{document=\*\*\} \{\s*allow read, write: if false;/);

  // Pillar 1: Master Gate parent workspace check on every subcollection
  assert.match(rules, /function userWorkspaceExists\(userId\)/);
  assert.match(rules, /match \/sermonNotes\/\{noteId\}[\s\S]*?userWorkspaceExists\(userId\)/);
  assert.match(rules, /match \/verseNotes\/\{noteId\}[\s\S]*?userWorkspaceExists\(userId\)/);
  assert.match(rules, /match \/bookmarks\/\{bookmarkId\}[\s\S]*?userWorkspaceExists\(userId\)/);
  assert.match(rules, /match \/highlights\/\{highlightId\}[\s\S]*?userWorkspaceExists\(userId\)/);
  assert.match(rules, /match \/planProgress\/\{planId\}[\s\S]*?userWorkspaceExists\(userId\)/);
  assert.match(rules, /match \/visitorCards\/\{cardId\}[\s\S]*?userWorkspaceExists\(userId\)/);

  // Pillar 2 & 3: Anti-Update-Gap & Path Variable Hardening
  assert.match(rules, /function isValidId\(id\)/);
  assert.match(rules, /isValidUserWorkspace\(incoming\(\), userId\)/);
  assert.match(rules, /isValidSermonNoteDoc\(incoming\(\), userId, noteId\)/);
  assert.match(rules, /isValidPrayerRequestDoc\(incoming\(\), requestId\)/);
  assert.match(rules, /isValidChallengeCommentDoc\(incoming\(\), commentId\)/);

  // Pillar 4 & 5: Tiered Identity & Total Array Guarding (366 days max)
  assert.match(rules, /data\.completedDays is list && data\.completedDays\.size\(\) <= 366/);
  assert.match(rules, /incoming\(\)\.prayingCount == existing\(\)\.prayingCount \+ 1/);

  // Pillar 6: PII Isolation on visitorCards
  assert.match(
    rules,
    /match \/visitorCards\/\{cardId\}[\s\S]*?\(isOwner\(userId\) && userWorkspaceExists\(userId\)\) \|\| isAdmin\(\)/
  );

  // Pillar 8: Secure List Queries without client delegation
  assert.match(rules, /allow list: if isOwner\(userId\) && resource\.data\.ownerId == request\.auth\.uid;/);
  assert.match(
    rules,
    /allow list: if isVerifiedUser\(\) &&\s*resource\.data\.churchId == 'iebhorta'/
  );

  // Blueprint synchronicity: maxLength constants in blueprint match rules
  assert.equal(blueprint.entities.SermonNoteDoc.properties.content.maxLength, 8000);
  assert.match(rules, /data\.content\.size\(\) <= 8000/);
  assert.equal(blueprint.entities.PrayerRequestDoc.properties.content.maxLength, 1200);
  assert.match(rules, /data\.content\.size\(\) <= 1200/);
});

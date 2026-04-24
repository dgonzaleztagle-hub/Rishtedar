@AGENTS.md

---

# Rishtedar Project Guidelines

**Status:** 🔴 SECURITY BLOCKER (2026-04-21)  
**See:** `memory/SECURITY_AUDIT.md` + `/REMEDIATION_PLAN.md`

## 🔴 BEFORE ANYTHING ELSE

**DO NOT make any changes or deploy until you read:**

1. `/d/proyectos/rishtedar/memory/SECURITY_AUDIT.md` — 6 P0 critical findings
2. `/d/proyectos/rishtedar/REMEDIATION_PLAN.md` — Detailed remediation with PRs

**Current state:** Production-looking UI with 6 critical auth/security holes underneath. This MUST be fixed before any commercial push.

---

## Verification Protocol (STRICT)

Every change must pass this checklist **before** "LISTO":

### For API Changes:
```
[ ] Endpoint has requireStaffSession OR requireBranchAccess?
[ ] If GET → validates user owns/has access to returned data?
[ ] If POST → validates amounts/prices server-side?
[ ] If webhook → validates signature (HMAC/webhook secret)?
[ ] If affects loyalty/payments → idempotent (no double-counting)?
[ ] No "business_id=admin" tricks or magic strings?
[ ] ESLint pass (0 errors)
[ ] Build success (npm run build)
[ ] Manual test with curl (documented in PR)
```

### For Components:
```
[ ] If shows data → is it real or demo? (mark explicitly if demo)
[ ] If modifies state → goes through API, not direct Supabase?
[ ] No unused imports (ESLint check)
[ ] No <img> tags without next/image?
```

### For Schema/DB:
```
[ ] Change reflected in schema-v2.sql?
[ ] Migration created and tested?
[ ] RLS policy reviewed (not permissive by default)?
```

### Final:
```
[ ] npm run lint → 0 errors (warnings acceptable)
[ ] npm run build → successful
[ ] Manual test shows change works
[ ] NO "listo" without all above ✓
```

---

## When You're Done with a Task

**If I (Claude) say "listo" without showing:**
- ESLint output (0 errors)
- Build success
- Manual test result
- Verification checklist ✓

**Then ask me:** "Show the verification checklist, or I'm not accepting this."

This is YOUR protection. I can miss things. The checklist doesn't.

---

## Key Files & Decisions

- **Auth:** `lib/auth/session.ts` (requireStaffSession, requireBranchAccess)
- **Security audit:** `memory/SECURITY_AUDIT.md`
- **Remediation:** `REMEDIATION_PLAN.md`
- **All memory:** `memory/MEMORY.md`

---

## Stack

- Next.js 16 + React 19 + TypeScript strict
- Supabase PostgreSQL + RLS
- Tailwind + Framer Motion

---

## Before Deploying to Production

1. ✅ All P0 from SECURITY_AUDIT closed
2. ✅ All P1 planned (at least analyzed)
3. ✅ Schema-v2.sql synced with migrations
4. ✅ ESLint 0 errors
5. ✅ Build success
6. ✅ Manual test of critical paths
7. ✅ Staff trained on auth changes

If ANY of the above is red, do NOT deploy.

---

## Questions?

See `memory/SECURITY_AUDIT.md` or `REMEDIATION_PLAN.md`.

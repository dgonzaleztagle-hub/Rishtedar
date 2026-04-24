# Remediation Plan — Rishtedar Security (P0 → P2)

**Status:** 🔴 BLOCKED (no deployments until P0 closed)  
**Total Time:** ~20-30h (Fase 0: 4h, Fase 1: 16h, Fase 2: 10h)  
**Owner:** TBD

---

## Phase 0: BLOCKER (4h) — Deploy ONLY after this

**Do NOT deploy anything to production until all P0 items are closed.**

### P0.1: Orders GET Without Auth (2h)
**File:** `app/api/orders/route.ts`  
**Current Issue:**
```typescript
// Line 114: no requireStaffSession
export async function GET(req: Request) {
  const branch = req.nextUrl.searchParams.get('branch');
  const business_id = req.nextUrl.searchParams.get('business_id') || branch;
  // ❌ If business_id=admin, bypasses branch filter
  // ❌ Returns phone, address, tracking
}
```

**Required Fixes:**
1. Add `const { user, branch } = await requireStaffSession(req);` at start
2. Remove `business_id` parameter (use staff's authorized branch only)
3. Remove demo backdoor if exists
4. Add branch filter: `WHERE branch_id = $1`

**Verification:**
```bash
# Should 401 without auth
curl http://localhost:3000/api/orders
# Should 403 if accessing different branch
# Should only see orders for staff's branch
```

**Acceptance:** GET without header → 401, with header → only own branch

---

### P0.2: Orders [orderId] Without Auth (1h)
**File:** `app/api/orders/[orderId]/route.ts`  
**Current Issue:**
```typescript
// Line 14: no auth, line 20: demo backdoor
if (params.orderId === 'demo') {
  // ❌ Anyone can get demo data
  return demoData;
}
// ❌ Any ID returns order
```

**Required Fixes:**
1. Add `requireStaffSession`
2. Remove demo backdoor OR wrap in admin check
3. Verify staff has access to this order's branch

---

### P0.3: Reservations Update-Status Validation Hole (1h)
**File:** `app/api/reservations/update-status/route.ts`  
**Current Issue:**
```typescript
// Lines 19-24: conditional validation
if (token && branch) {
  // validate token
} else {
  // ❌ Still updates if token/branch missing!
  // Line 32: PATCH goes through
}
```

**Required Fix:**
```typescript
// MUST be requireStaffSession, always
const { user, branch } = await requireStaffSession(req);
const { reservation_id, status } = body;

// THEN validate
const reservation = await getReservation(reservation_id);
if (reservation.branch_id !== branch) return 403;

await updateReservationStatus(reservation_id, status);
```

---

### P0.4: Delivery Assign Without Auth (2h)
**File:** `app/api/delivery/assign/route.ts`  
**Current Issue:**
```typescript
// Line 8: no requireStaffSession
export async function POST(req: Request) {
  const { order_id, driver_id } = body;
  // ❌ Anyone can assign driver
  // ❌ Generates token without validation
}
```

**And:** `app/api/delivery/[token]/route.ts`
```typescript
// Returns full order details + allows PATCH to "delivered"
// ❌ Token is only credential, bearer-token style
```

**Required Fixes:**
1. `POST /api/delivery/assign` → `requireStaffSession`
2. `GET /api/delivery/[token]` → driver must authenticate via Supabase (not just token)
3. `PATCH /api/delivery/[token]` → require:
   - GPS coordinates (geolocation)
   - Photo of delivery (multipart)
   - Timestamp from device
   - Driver session token

**Security Pattern:** Token is lookup key, not credential. Real auth is Supabase session.

---

### P0.5: Mercado Pago Webhook (3h)
**File:** `app/api/webhooks/mercadopago/route.ts`  
**Current Issue:**
```typescript
// Line 5: No signature verification
export async function POST(req: Request) {
  const body = await req.json();
  if (body.type === 'payment.created' && body.data.status === 'approved') {
    // ❌ No HMAC check
    // ❌ No idempotency check
    await awardPoints(order_id); // Can be called multiple times
  }
}
```

**And:** `lib/services/loyaltyService.ts`
```typescript
// Line 53: Sum without deduplicating by order_id
const existing = await checkLoyaltyTransaction(order_id);
if (existing) {
  // ❌ Still adds points again
}
```

**Required Fixes:**
1. **Verify Mercado Pago signature:**
```typescript
const signature = req.headers['x-signature'];
const ts = req.headers['x-request-id'];
const valid = verifyMercadoPagoHMAC(body, signature, ts, MERCADOPAGO_SECRET);
if (!valid) return 401;
```

2. **Add idempotency by order_id:**
```typescript
const txn = await db.loyaltyTransactions.findUnique({
  where: { payment_id: body.data.id } // Mercado Pago transaction ID
});
if (txn) return 200; // Already processed

// THEN award points and insert transaction
```

**Test:** Send same webhook twice, points should increase only once

---

### P0.6: Checkout Recalculation + No Auto-Paid Bypass (3h)
**File:** `app/api/orders/create/route.ts`  
**Current Issue:**
```typescript
// Line 22: Trust client amounts
const { subtotal, discountApplied, finalPrice, unitPrice } = body;

// Lines 104-123: Auto-paid bypass
if (!MERCADOPAGO_ACCESS_TOKEN) {
  payment_status = 'paid';
  payment_method = 'bypass';
  // ❌ No token? Order is marked paid without payment
}
```

**Required Fixes:**
1. **Recalculate server-side:**
```typescript
// Fetch items from DB, not trust client
const items = await Promise.all(
  body.items.map(item =>
    db.menuItems.findUnique({ where: { id: item.id } })
  )
);

// Verify item exists, quantity reasonable
const subtotal = items.reduce((sum, item, i) => {
  const qty = body.items[i].quantity;
  return sum + (item.price * qty);
}, 0);

// Validate promotion (if exists)
const promotion = body.promoCode 
  ? await db.promotions.findUnique({ where: { code: body.promoCode } })
  : null;
  
if (promotion && !isPromotionValid(promotion)) return 400;

const discount = promotion ? (subtotal * promotion.percentOff) / 100 : 0;
const finalPrice = subtotal - discount;

// NEVER trust client's finalPrice
if (body.finalPrice !== finalPrice) {
  return 400; // Price mismatch, reject
}
```

2. **No auto-paid bypass:**
```typescript
if (!MERCADOPAGO_ACCESS_TOKEN) {
  return 500; // Server error, config issue
  // NOT: payment_status = 'paid'
}

payment_status = 'pending'; // Always pending until MP confirms
payment_method = 'mercadopago';
```

---

### P0.7: Staff Tokens → Real Session Auth (2h)
**File:** `lib/staff-tokens.ts` + `app/api/staff/award/route.ts` + `app/api/staff/customer/route.ts`  
**Current Issue:**
```typescript
// staff-tokens.ts
const VALID_TOKENS = {
  'RSH-PROV-2024': 'manager',      // ❌ Predictable
  'RSH-ADMIN-2024': 'admin',       // ❌ Predictable
};

// staff/award/route.ts
const token = req.headers['x-staff-token'];
if (token === 'dashboard' || token in VALID_TOKENS) {
  // ❌ Magic string, no session
}
```

**Required Fixes:**
1. Replace magic strings with `requireStaffSession`:
```typescript
const { user, role } = await requireStaffSession(req);
if (role !== 'admin') return 403;

// Now award points using real staff identity
await awardPoints(customer_id, points, { awarded_by: user.id });
```

2. Delete `staff-tokens.ts` (legacy)
3. Audit all endpoints using it (grep `x-staff-token`)

---

## Verification Checklist (Phase 0)

```bash
# After all P0 fixes:

# 1. ESLint must pass
npm run lint
# Expected: No errors (warnings OK)

# 2. Build must succeed
npm run build
# Expected: ✓ Compiled successfully

# 3. Manual tests:
# GET /api/orders without auth → 401
curl -X GET http://localhost:3000/api/orders
# Expected: { "error": "Unauthorized" }

# GET /api/orders/demo → 404 or 401
curl -X GET http://localhost:3000/api/orders/demo
# Expected: Not found or Unauthorized

# POST /api/reservations/update-status without token → 401
curl -X PATCH http://localhost:3000/api/reservations/update-status \
  -H "Content-Type: application/json" \
  -d '{ "reservation_id": 1, "status": "cancelled" }'
# Expected: { "error": "Unauthorized" }

# POST /api/delivery/assign without auth → 401
curl -X POST http://localhost:3000/api/delivery/assign \
  -H "Content-Type: application/json" \
  -d '{ "order_id": 1, "driver_id": 1 }'
# Expected: { "error": "Unauthorized" }
```

---

## PR Strategy (Phase 0)

**Create 6 separate PRs** (one per P0):
1. `security/orders-auth`
2. `security/reservations-validation`
3. `security/delivery-auth`
4. `security/mercadopago-signature`
5. `security/checkout-calculation`
6. `security/staff-tokens`

**Why separate:**
- Easy to bisect if issue arises
- Easier review/audit
- Can revert one without affecting others

**Review process (for each PR):**
1. Code review (logic correct?)
2. Security review (inputs validated?)
3. Manual test (curl tests pass?)
4. ESLint pass
5. Build success

---

## Phase 1: HIGH Priority (24-48h after P0)

Once P0 is closed, do Phase 1:

```
[ ] P1.1: Apply requireBranchAccess to all staff endpoints
[ ] P1.2: Freeze dashboard demo data (explicit beta markers or remove)
[ ] P1.3: Sync schema-v2.sql with actual migrations
[ ] P1.4: Audit KPI queries (party vs party_size, created_at vs reserved_at)
[ ] P1.5: Add rate limiting (analytics, push, newsletter)
[ ] P1.6: Review RLS policies (less permissive)
```

**Timeline:** Each takes 2-4h, total ~16-20h spread over 2 days

---

## Phase 2: MEDIUM Priority (1 week)

- Implement delivery request external (Toteat/Uber Direct)
- Add audit logging (who changed what, when)
- Document security model (authz matrix)

---

## Success Criteria

✅ **Can go to production when:**
- All P0 closed
- All P1 at least analyzed (plan created, even if not all fixed)
- ESLint passes
- Manual tests pass
- Schema-v2.sql synced with migrations
- Staff is trained on new auth patterns

---

## Timeline Summary

| Phase | Work | Hours | Days | Status |
|-------|------|-------|------|--------|
| P0 | Close 6 critical auth issues | 4h | Today | 🔴 BLOCKER |
| P1 | High-priority hardening | 16h | 2 days | 🟡 Next |
| P2 | Medium features + docs | 10h | 1 week | 🟢 After |

---

## Owner & Handoff

**Who does this?** TBD (You? Claude? contractor?)

**If Claude:** I can work on any PR, but YOU verify each one with the checklist above.  
**If You:** I can review + spot-check security.  
**If Contractor:** Code + security audit required before merge.

---

## Questions?

- Want me to start with P0.1 (Orders auth)?
- Need help with any specific PR?
- Want detailed test cases for each endpoint?

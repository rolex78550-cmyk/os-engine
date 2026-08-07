# Payment vs Access Audit Report (as of 2026-06-17)

## Current State Summary

### Real Payment Flow (Razorpay)
When a user pays successfully:
1. `/api/subscription/activate` writes to **users/{uid}**:
   - `currentPlan`: "monthly" | "yearly" | "lifetime"
   - `subscriptionStatus`: "active" | "lifetime"
   - `purchaseDate`
   - `expiryDate` (for monthly/yearly)
   - `lifetimeAccess: true` (for lifetime)

2. Also creates a record in **`payments`** collection (real one).

### hasActiveAccess() Logic (Correct)
```ts
if (lifetimeAccess || subscriptionStatus === 'lifetime') → Premium
if (subscriptionStatus === 'active' && expiryDate > now) → Premium
else → No access
```

### The Problem (Big Mismatch)

**AdminPanel is completely blind to real payments:**

- AdminPanel only reads from `simulated_payments` (fake/old collection)
- AdminPanel only checks `subscriptionStatus === "premium"`
- Real flow never sets `subscriptionStatus = "premium"` → it sets `"active"` or `"lifetime"`
- Result: Real paying users do **NOT** appear as premium in Admin panel.

### Status Value Inconsistency

| Flow                  | Value used for paid users      |
|-----------------------|--------------------------------|
| Old / Admin manual    | `"premium"`                    |
| Real Razorpay         | `"active"` or `"lifetime"`     |

This is why many users who paid are probably **not** getting access in some places, or at least not visible in admin.

## What We Need to Check (for real users)

To answer "jis jisne payment kiya, usko access mila ya nahi":

We need to:
1. Look at `payments` collection (real)
2. For each payment, check the corresponding `users/{uid}` document
3. Verify if `hasActiveAccess()` would return true
4. Flag any "Paid but No Access" cases

## Recommended Immediate Fixes

1. **Fix AdminPanel** to read from real `payments` collection + cross check user docs.
2. **Make AdminPanel use correct logic** (`currentPlan` + `lifetimeAccess` + `subscriptionStatus`).
3. **Add an "Audit" section** that explicitly shows:
   - Paid users
   - Their subscription fields
   - Access status (yes/no)
   - Mismatches

4. (Future) Add a Cloud Function or script that auto-fixes broken users.


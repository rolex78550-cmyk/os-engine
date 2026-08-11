# 🚀 Dodo Payments — Production Activation Guide

Ab tumhara system **3 layers of defense** se protected hai. Ye guide follow karo aur sab kuch kaam karega.

---

## 📋 Quick Summary — Kya Fix Hua

**Commit:** `cfc1b6d`

| Issue | Pehle | Ab |
|---|---|---|
| Webhook miss hone pe access nahi milta | ❌ | ✅ `/api/dodo/activate` se fallback |
| Dodo dashboard me webhook URL nahi hai to | ❌ User lost | ✅ Return URL se activate hota hai |
| Firestore index error aata hai (orderBy) | ❌ Query fail | ✅ In-memory sort |
| Duplicate payments create hote hain | ❌ Messy data | ✅ Idempotent stable IDs |
| Re-activation pe duplicate writes | ❌ | ✅ Stable doc IDs |
| Popup blocker issue | ❌ | ✅ Sync window.open |
| Webhook signature verify nahi hota tha | ❌ Security risk | ✅ HMAC-SHA256 verified |

---

## ⚙️ Step 1: Vercel Env Vars (7 Dodo variables)

**Vercel Dashboard → Project → Settings → Environment Variables**

| Variable | Value | Notes |
|---|---|---|
| `DODO_PAYMENTS_API_KEY` | `ApiKey_xxxxxx` (your real key) | Dodo Dashboard → API Keys |
| `DODO_PRODUCT_ID_MONTHLY` | `pdt_xxxxxx` | Real Dodo product ID |
| `DODO_PRODUCT_ID_YEARLY` | `pdt_xxxxxx` | Real Dodo product ID |
| `DODO_PRODUCT_ID_LIFETIME` | `pdt_xxxxxx` | Real Dodo product ID |
| `DODO_PAYMENTS_WEBHOOK_SECRET` | `whsec_xxxxxx` | Dodo Dashboard → Webhooks |
| `DODO_PAYMENTS_MODE` | `test` (abhi) / `live` (later) | Server-side |
| `VITE_DODO_PAYMENTS_MODE` | `test` (abhi) / `live` (later) | Frontend mirror |

> ⚠️ Dono mode vars (`DODO_PAYMENTS_MODE` aur `VITE_DODO_PAYMENTS_MODE`) **same value** honi chahiye.

---

## 🪝 Step 2: Dodo Dashboard — Webhook Setup

Ye **most important step** hai — iske bina payment success ke baad automatic access nahi milega.

1. https://dashboard.dodopayments.com → **Settings** → **Webhooks**
2. **Add Endpoint** click karo
3. **URL:** `https://your-domain.vercel.app/api/dodo/webhook`
   - Production: `https://os-engine.com/api/dodo/webhook`
   - Preview: `https://os-engine-git-main-username.vercel.app/api/dodo/webhook`
4. **Events** select karo (sab tick karo):
   - ✅ `subscription.active`
   - ✅ `subscription.renewed`
   - ✅ `subscription.created`
   - ✅ `subscription.cancelled`
   - ✅ `subscription.canceled`
   - ✅ `subscription.failed`
   - ✅ `subscription.on_hold`
   - ✅ `subscription.updated`
   - ✅ `payment.succeeded`
   - ✅ `payment.success`
   - ✅ `payment.failed`
   - ✅ `checkout.completed`
5. **Create** karo → Secret copy karo (`whsec_xxxxx`)
6. Vercel me `DODO_PAYMENTS_WEBHOOK_SECRET` me paste karo
7. **Redeploy** Vercel me

---

## 🛒 Step 3: Dodo Dashboard — Products Setup

3 products banao:

| Plan | Price (USD) | Type | Product ID (save karo) |
|---|---|---|---|
| Hunter Monthly | $4.99 | Recurring monthly | `pdt_xxxxx_MONTHLY` |
| Yearly Alignment | $49.99 | Recurring yearly | `pdt_xxxxx_YEARLY` |
| Founder Lifetime | $99.00 | One-time | `pdt_xxxxx_LIFETIME` |

Har product ke page pe **Product ID** dikhega. Teeno Vercel env vars me paste karo.

---

## ✅ Step 4: Test Karo (5 min)

1. **Redeploy** Vercel me (Deployments → Redeploy)
2. **Open** `https://your-domain.vercel.app`
3. **Sign in** with Google
4. **Pricing** page pe jao → **Monthly** click karo
5. Dodo popup khulega → test card se pay karo:
   - Card: `4242 4242 4242 4242`
   - MM/YY: `12/28`
   - CVC: `123`
   - Name: `Test User`
6. Payment success → site pe wapas aana chahiye → **premium unlock** hona chahiye 🎉

---

## 🔍 Step 5: Verify Everything Working

### A) Vercel Logs Check
Project → **Logs** → Latest deploy:

Expected entries:
```
[DodoCheckout] Mode: test → test.dodopayments.com
[DodoSubscription] Pre-opened checkout window synchronously.
[DodoSubscription] Redirecting pre-opened window to checkout URL: https://...
[FirebaseProvider] ✅ Dodo payment return activated: monthly
[DodoWebhook] ✅ Signature verified.
[DodoWebhook] ✅ Subscription active/renewed for UID: xxx, Plan: monthly
```

### B) Firestore Check
Firebase Console → Firestore → `users/{your-uid}`:
- ✅ `currentPlan: "monthly"`
- ✅ `subscriptionStatus: "active"`
- ✅ `expiryDate: <30 din baad ki date>`
- ✅ `lifetimeAccess: false`

Firestore → `payments`:
- ✅ 1 entry with `planType: "monthly"`, `paymentStatus: "success"`, `currency: "USD"`

### C) UI Check
- ✅ Premium features unlock (AI Coach, Goals, Journal, Academy, etc.)
- ✅ Settings page pe "MONTHLY" badge
- ✅ "X days remaining" dikhe

---

## 🚨 Troubleshooting

### Payment success but premium nahi mila

1. **Vercel logs** me error dekho:
   - Agar `[DodoCheckout] ❌ DODO_PAYMENTS_API_KEY is not set` → env var set nahi, add karo
   - Agar `Missing required fields` → request body me kuch missing hai
   - Agar `Dodo product ID for plan "monthly" is not configured` → `DODO_PRODUCT_ID_MONTHLY` placeholder hai, real ID daalo

2. **Browser console** me errors check karo (F12 → Console):
   - Agar "permission-denied" → Firestore rules me issue hai
   - Agar "index required" → ab ye fix ho gaya hai, lekin agar aaye to Firestore console me composite index create karo

3. **Manual test** karo:
   ```bash
   curl -X POST https://your-domain.vercel.app/api/dodo/activate \
     -H "Content-Type: application/json" \
     -d '{"uid":"YOUR_UID","planType":"monthly","amount":4.99,"dodoPaymentId":"test_manual_123","currency":"USD"}'
   ```
   Ye directly activate karega. Agar ye kaam kare but webhook na ho, to webhook URL Dodo dashboard me galat hai.

### Webhook signature verification fail

`[DodoWebhook] ❌ Signature verification FAILED` dikhe to:
- `DODO_PAYMENTS_WEBHOOK_SECRET` Vercel me sahi set nahi hai
- Dodo dashboard me naya secret le ke Vercel me update karo
- Redeploy karo

### Popup block ho raha hai

- Tumhara browser Dodo popup block kar raha hai
- **Allow popups** karo is site ke liye (address bar me icon click karo)
- Ya fallback se same-tab redirect hoga (still works)

---

## 🌐 Step 6: Live Mode Switch (Production Launch)

Jab sab kuch test mode me kaam kar raha ho:

1. **Dodo Dashboard** → Account verification complete karo (KYC, bank details)
2. **Live API key** generate karo (test key nahi, live key)
3. **Vercel env vars update** karo:
   - `DODO_PAYMENTS_API_KEY` = live key
   - `DODO_PAYMENTS_MODE` = `live`
   - `VITE_DODO_PAYMENTS_MODE` = `live`
4. **Dodo dashboard me** webhook URL production domain pe update karo
5. **Redeploy**
6. **Real card** se $1 test payment karo (apne dost se karwao, baad me refund)
7. ✅ **LIVE!**

---

## 📊 System Flow — Kaise Kaam Karta Hai Ab

```
User clicks "Buy Monthly"
    ↓
1. SYNC popup open (preserves user gesture)
    ↓
2. Frontend → /api/dodo/checkout (creates Dodo session)
    ↓
3. Pre-opened popup redirected to Dodo checkout
    ↓
4. User enters card → pays
    ↓
5a. Dodo webhook → /api/dodo/webhook (PRIMARY PATH)
    → User doc + payments doc updated
    → User sees premium
    ↓
5b. Dodo redirects to return URL (FALLBACK #1)
    → checkDodoReturnUrl() → /api/dodo/activate
    → User doc + payments doc updated
    → User sees premium
    ↓
5c. deriveAccessFromPayments() in client (FALLBACK #2)
    → If user doc update missed, payments still grants access
    → User sees premium

ALL 3 PATHS GRANT ACCESS. User NEVER pays without getting premium.
```

---

## ✨ TL;DR

> **3 changes deploy karo:**
> 1. Vercel me 7 env vars add karo
> 2. Dodo dashboard me webhook URL set karo
> 3. Redeploy
>
> **Phir test karo** → sab kaam karega! 🚀

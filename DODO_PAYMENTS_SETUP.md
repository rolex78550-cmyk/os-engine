# 🚀 Dodo Payments — Vercel Setup Guide

Production-ready Dodo Payments integration ke liye **5 env vars** Vercel me add karo. Bina iske checkout "kaam nahi karega".

---

## ✅ Step 1: Vercel me Environment Variables Add Karo

Vercel Dashboard → Project → **Settings** → **Environment Variables**

Neeche diye gaye sab variables add karo. **Production, Preview, Development** teeno me tick karo.

### Required Variables (Dodo Payments ke liye)

| Variable | Example Value | Kahan se milega |
|---|---|---|
| `DODO_PAYMENTS_API_KEY` | `ApiKey_yourkey...` | Dodo Dashboard → Settings → API Keys |
| `DODO_PRODUCT_ID_MONTHLY` | `pdt_xxxxxxxxxx` | Dodo Dashboard → Products → Monthly plan |
| `DODO_PRODUCT_ID_YEARLY` | `pdt_xxxxxxxxxx` | Dodo Dashboard → Products → Yearly plan |
| `DODO_PRODUCT_ID_LIFETIME` | `pdt_xxxxxxxxxx` | Dodo Dashboard → Products → Lifetime plan |
| `DODO_PAYMENTS_WEBHOOK_SECRET` | `whsec_xxxxxxxxxx` | Dodo Dashboard → Settings → Webhooks |
| `DODO_PAYMENTS_MODE` | `test` or `live` | `test` for development, `live` for production |
| `VITE_DODO_PAYMENTS_MODE` | `test` or `live` | Same as above (frontend mirror) |

---

## 🔑 Step 2: Dodo Dashboard se Keys Kaise Nikalen

### A) API Key
1. https://dashboard.dodopayments.com → **Settings** → **API Keys**
2. **Create API Key** click karo
3. Mode select karo (Test ya Live)
4. Key copy karo → Vercel me `DODO_PAYMENTS_API_KEY` me paste karo

### B) Product IDs
1. https://dashboard.dodopayments.com → **Products**
2. 3 products banao:
   - **Hunter Monthly** — $4.99 USD, recurring monthly
   - **Yearly Alignment** — $49.99 USD, recurring yearly
   - **Founder Lifetime** — $99.00 USD, one-time
3. Har product ke details page pe **Product ID** dikhega (`pdt_xxxxx` format)
4. Teeno IDs copy karo → Vercel me respective env vars me paste karo

### C) Webhook Secret
1. https://dashboard.dodopayments.com → **Settings** → **Webhooks**
2. **Add Endpoint** click karo
3. URL: `https://your-vercel-domain.vercel.app/api/dodo/webhook`
4. Events select karo:
   - `subscription.active`
   - `subscription.renewed`
   - `subscription.cancelled`
   - `subscription.on_hold`
   - `subscription.failed`
   - `payment.succeeded`
   - `payment.failed`
   - `checkout.completed`
5. **Create** karo → Secret dikhega (`whsec_xxxxx`)
6. Copy karo → Vercel me `DODO_PAYMENTS_WEBHOOK_SECRET` me paste karo

---

## 🧪 Step 3: Test Karo

1. Vercel me sab vars add karne ke baad **redeploy** karo (Deployments tab → latest → Redeploy)
2. Site open karo → sign in karo
3. Pricing page pe jao → koi bhi plan (e.g. Monthly) click karo
4. **Expected flow:**
   - Loading popup khulega (blank tab)
   - 1-2 sec me Dodo checkout page pe redirect hoga
   - Dodo ka test card use karo: `4242 4242 4242 4242`, any future expiry, any CVC
   - Payment success → wapas site pe redirect → premium activate hona chahiye
5. **Vercel Logs me check karo** (Project → Logs):
   - `[DodoCheckout] Mode: test → test.dodopayments.com` ← ye dikhna chahiye
   - `[DodoWebhook] ✅ Signature verified.` ← payment ke baad ye dikhega

---

## 🚨 Troubleshooting

### "Dodo Payments is not configured on the server"
→ Vercel me `DODO_PAYMENTS_API_KEY` set nahi hai. Add karo, redeploy karo.

### "Dodo product ID for plan 'monthly' is not configured"
→ `DODO_PRODUCT_ID_MONTHLY` ya toh set nahi hai ya placeholder value hai (`prod_monthly` matlab set nahi hai). Real `pdt_xxxxx` value daal do.

### Popup blank khulta hai but redirect nahi hota
→ Vercel logs me `/api/dodo/checkout` response dekho. Agar 500 aa raha hai, error message me likha hoga kya missing hai.

### Payment success but premium activate nahi hota
→ Vercel logs me `[DodoWebhook]` entries check karo. Agar `❌ Signature verification FAILED` dikhe, toh `DODO_PAYMENTS_WEBHOOK_SECRET` galat hai. Dodo dashboard se naya secret le ke Vercel me update karo.

### Mode mismatch (test/live)
→ `DODO_PAYMENTS_MODE` (server) aur `VITE_DODO_PAYMENTS_MODE` (frontend) dono me **same value** honi chahiye.

---

## 🔒 Security Notes

- ❌ **KABHI** webhook secret ya API key ko GitHub pe commit mat karo
- ✅ Production me dono env vars set hone chahiye — warna webhook fail-open ho jayega (security risk)
- ✅ Test mode me test cards use karo (`4242 4242 4242 4242`)
- ✅ Live mode switch karne se pehle:
  1. Real Dodo account verify karo
  2. Real API key + product IDs add karo
  3. `DODO_PAYMENTS_MODE=live` aur `VITE_DODO_PAYMENTS_MODE=live` set karo
  4. Webhook URL production domain pe update karo Dodo dashboard me
  5. Ek real test payment karo chhoti amount se

---

## 📋 Quick Checklist

- [ ] Vercel me 7 Dodo env vars add kiye
- [ ] Dodo dashboard me 3 products banaye
- [ ] Dodo dashboard me webhook endpoint set kiya
- [ ] Redeploy kiya
- [ ] Test payment kiya → success
- [ ] Vercel logs me `[DodoWebhook] ✅ Signature verified` dikha
- [ ] Premium features unlock ho gaye

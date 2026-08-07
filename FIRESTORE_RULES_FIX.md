# 🔥 Firestore Permission Fix (Fable 5 Style - Permissive)

## Current Rules (Pushed)
We are now using the **simple permissive rule** you asked for (Fable 5 style):

```js
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

This gives **full access to every logged-in user**.

---

## ⚠️ CRITICAL: This is the MOST COMMON MISTAKE

Pushing to GitHub **does NOT** update your Firestore rules.

You **MUST** manually publish the rules in Firebase Console.

---

## Step-by-Step (Do This Exactly)

### 1. Go to Firebase Console
→ https://console.firebase.google.com

### 2. Select the CORRECT Project
**Project ID:** `gen-lang-client-0876553272`

> This is the project your Vercel app is actually using (from `firebase-applet-config.json`)

### 3. Open Firestore Rules
- Left menu → **Firestore Database**
- Click the **Rules** tab at the top

### 4. Replace the Rules
1. Delete everything currently in the editor
2. Copy **all** content from this file in your repo:
   ```
   firestore.rules
   ```
3. Paste it completely

### 5. Publish
Click the big **Publish** button (top right)

---

## After Publishing the Rules

1. Open your Vercel site
2. Press **hard refresh**:
   - `Ctrl + Shift + R` (Windows/Linux)
   - `Cmd + Shift + R` (Mac)
3. If still logged in, **Log out completely** → then Log in again

---

## How to Confirm Rules Are Applied

After publishing, open browser console and look for:
- No more `permission-denied` errors
- You should see successful snapshot listeners

---

## Still Getting Errors?

Please reply with these answers:

1. Did you click **Publish** in Firebase Console?
2. Which project ID did you select? (`gen-lang-client-0876553272` or something else?)
3. After publishing, did you do hard refresh + logout/login?
4. Paste the **new** error (if any) from console

---

## Files
- `firestore.rules` ← Current permissive version (use this)
- `firestore.rules.permissive` ← Backup copy

This should fix the error completely if the rules are published correctly.

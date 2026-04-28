# Vercel Deployment Quick Setup

## Quick Summary of Fixes

✅ **Fixed Issue 1: Email Confirmation 404**

- Created `AuthCallbackPage.jsx` to handle `/auth/callback` route
- Updated `App.jsx` to route to callback handler
- Supabase will now redirect users here after email confirmation

✅ **Fixed Issue 2: Build Failure**

- Modified `supabase.js` to not throw error at build time
- Updated `useAuth.js` to handle null Supabase gracefully
- Fixed `vercel.json` to specify correct output directory

✅ **Fixed Issue 3: Profile Not Found in Billing**

- BillingPage already has proper Supabase reading (was already implemented)

---

## Step-by-Step Vercel Setup

### 1. Push Your Code to GitHub

```bash
git add .
git commit -m "Fix: Email confirmation routing, build config, and error handling"
git push origin main
```

### 2. Create Vercel Project (if not already done)

- Go to [vercel.com](https://vercel.com)
- Click "New Project"
- Import your GitHub repository
- Select your repository
- Click "Import"

### 3. Set Environment Variables in Vercel

In your Vercel dashboard:

1. Go to your project
2. Click **Settings** → **Environment Variables**
3. Add these variables:

| Variable                 | Value                              | Source                                |
| ------------------------ | ---------------------------------- | ------------------------------------- |
| `VITE_SUPABASE_URL`      | `https://your-project.supabase.co` | Supabase > Settings > API             |
| `VITE_SUPABASE_ANON_KEY` | Your anon key                      | Supabase > Settings > API             |
| `VITE_API_URL`           | Your backend API URL               | Where your Express server is deployed |

**Finding these values:**

- **VITE_SUPABASE_URL**: Go to Supabase dashboard > Settings > API > Project URL
- **VITE_SUPABASE_ANON_KEY**: Go to Supabase dashboard > Settings > API > Anon Key
- **VITE_API_URL**: For now, use `https://localhost:3001` or your actual backend URL

4. Click "Save" for each variable

### 4. Update Supabase Redirect URL

In your **Supabase Dashboard**:

1. Go to **Authentication** → **URL Configuration**
2. Under "Redirect URLs", add:

   ```
   https://your-vercel-app.vercel.app/auth/callback
   ```

   (Replace `your-vercel-app` with your actual Vercel project name)

3. Click "Save"

### 5. Deploy

Option A: **Automatic** (recommended)

- Vercel automatically deploys when you push to main branch
- Check the Deployments tab to see progress

Option B: **Manual**

- In Vercel dashboard, click "Redeploy" button

---

## Testing the Flow

### Test 1: Email Confirmation

1. Go to your app: `https://your-vercel-app.vercel.app`
2. Sign up with a test email
3. Check your email inbox for confirmation link
4. Click the link
5. **Expected**: You should see "Verifying your email..." then redirect to dashboard

### Test 2: Login

1. Go to login page
2. Use credentials you just created
3. **Expected**: Successfully logged in, see dashboard

### Test 3: Billing Page

1. Click on "Billing" in sidebar
2. **Expected**: Should load your plan, no "Profile not found" error

---

## Troubleshooting

### Build Still Failing?

**Check Vercel Logs:**

1. Go to Vercel dashboard
2. Click on recent deployment
3. Click "View Logs"
4. Look for the error message

**Common Errors:**

- `VITE_SUPABASE_URL not set` → Add environment variables in Vercel
- `ERR_MODULE_NOT_FOUND` → Run `npm install` locally, commit package-lock.json
- `ESLint error` → Run `cd frontend && npm run lint` to see errors

### Email Link Returns Blank Page?

1. Check browser console for errors (F12 → Console)
2. Verify Supabase redirect URL is correct
3. Clear browser cache and try again
4. Check that Supabase URL env var is correct

### Can't Access Dashboard After Login?

1. Check browser console for errors
2. Verify `VITE_API_URL` env var is correct
3. Make sure backend is running/deployed
4. Check that Auth token is being sent correctly

---

## File Changes

**Modified Files:**

- `vercel.json` - Fixed build config
- `frontend/src/lib/supabase.js` - Fixed build-time error handling
- `frontend/src/hooks/useAuth.js` - Added Supabase null check
- `frontend/src/App.jsx` - Added auth callback route

**New Files:**

- `frontend/src/components/pages/AuthCallbackPage.jsx` - Handles email confirmation
- `frontend/.env.example` - Environment template
- `DEPLOYMENT_GUIDE.md` - Detailed documentation

---

## Backend Deployment (Separate)

If deploying backend to Vercel Serverless Functions or another platform:

Update your `VITE_API_URL` environment variable to point to your backend:

- Vercel Functions: `https://your-app.vercel.app/api`
- Heroku: `https://your-app.herokuapp.com`
- Other: Your actual backend URL

---

## Need Help?

Check these docs:

1. `DEPLOYMENT_GUIDE.md` - Comprehensive troubleshooting
2. [Supabase Auth Docs](https://supabase.com/docs/guides/auth)
3. [Vercel Docs](https://vercel.com/docs)
4. Check Vercel/Supabase dashboards for error logs

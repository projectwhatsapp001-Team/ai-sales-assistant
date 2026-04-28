# Deployment Guide: AI Sales Assistant

## Issues Fixed

### 1. **Email Confirmation 404 Error**

**Problem**: When users click the email confirmation link from Supabase, they get a 404 error.

**Root Cause**: There was no route handler for `/auth/callback` where Supabase redirects after email confirmation.

**Solution**:

- Created `AuthCallbackPage.jsx` component that handles the callback from Supabase
- Updated `App.jsx` to detect `/auth/callback` path and render the callback handler
- The component processes the session and redirects to the dashboard

### 2. **BillingPage Profile Not Found Error**

**Problem**: `profileId` is undefined when BillingPage loads, causing payment to fail.

**Solution** (Already implemented in your code):

- BillingPage now reads profile directly from Supabase instead of relying on props
- Has fallback logic to fetch profile if needed
- Uses `profileRef.current` to cache the profile data

### 3. **Vercel Build Configuration**

**Problem**: Build was failing with `exited with 1` error.

**Solution**:

- Updated `vercel.json` to properly specify:
  - `buildCommand`: `cd frontend && npm install && npm run build`
  - `outputDirectory`: `frontend/dist` (corrected path)
  - Added environment variable references

---

## Vercel Deployment Steps

### Step 1: Configure Supabase Email Redirect URL

In your Supabase project settings:

1. Go to **Authentication > URL Configuration**
2. Add your Vercel domain to **Redirect URLs**:
   ```
   https://your-app.vercel.app/auth/callback
   ```
3. Make sure you include the `/auth/callback` path exactly as shown

### Step 2: Set Environment Variables in Vercel

1. Go to your Vercel project dashboard
2. Navigate to **Settings > Environment Variables**
3. Add these variables:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-from-supabase
VITE_API_URL=https://your-backend-api.com
```

**Note**: Replace the values with your actual credentials from:

- Supabase: Settings > API > Project URL and Anon Key
- Your backend API endpoint (where your Express server is deployed)

### Step 3: Verify vercel.json

Your `vercel.json` should look like:

```json
{
  "buildCommand": "cd frontend && npm install && npm run build",
  "outputDirectory": "frontend/dist",
  "framework": "vite",
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }],
  "env": {
    "VITE_SUPABASE_URL": "@vite_supabase_url",
    "VITE_SUPABASE_ANON_KEY": "@vite_supabase_anon_key",
    "VITE_API_URL": "@vite_api_url"
  }
}
```

### Step 4: Backend API Configuration

**Important**: Your Express backend needs CORS configured to accept requests from Vercel:

```javascript
const allowedOrigins = [
  process.env.APP_URL, // Set to https://your-app.vercel.app
  "http://localhost:5173",
  "http://localhost:3000",
].filter(Boolean);
```

Set `APP_URL` environment variable in your backend deployment to your Vercel domain.

---

## Troubleshooting

### Build Failing with "exited with 1"

**Check these in order:**

1. **Environment Variables**: Verify `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are set in Vercel
2. **ESLint Errors**: Run locally: `cd frontend && npm run lint`
3. **Package Installation**: Try `npm install` in frontend folder
4. **Syntax Errors**: Check for any syntax errors in new components

To debug locally:

```bash
cd frontend
npm install
npm run build
```

This will show the exact error causing the build to fail.

### Email Confirmation Link Still Returns 404

1. Verify the redirect URL in Supabase matches your Vercel domain:

   ```
   https://your-app.vercel.app/auth/callback
   ```

2. Check that Vercel's SPA rewrite is working:
   - Navigate to `https://your-app.vercel.app/auth/callback` directly
   - You should see the app loading (not a 404 page)

3. Check browser console for any errors when on the callback page

### Payment Page Showing "Profile not Found"

1. Verify the user's profile was created in Supabase on signup
2. Check that `user.id` matches the `user_id` in the profiles table
3. Try refreshing the page (the component will retry fetching)

---

## Architecture

### Frontend (Vercel)

- React + Vite SPA
- Routes all unmatched URLs to `/index.html` via rewrite
- Handles `/auth/callback` internally with `AuthCallbackPage`
- Makes API calls to backend for data operations

### Backend (Separate Deployment)

- Express.js server
- Handles all API endpoints (`/api/conversations`, `/api/billing`, etc.)
- Validates auth tokens from Supabase
- Interacts with Supabase database

### Authentication Flow (Supabase)

1. User signs up → Supabase sends confirmation email
2. User clicks link → Redirected to `https://your-app.vercel.app/auth/callback?type=signup&code=...`
3. `AuthCallbackPage` processes the callback
4. Session is established → Redirects to dashboard

---

## Files Modified

- ✅ `frontend/src/components/pages/AuthCallbackPage.jsx` - NEW
- ✅ `frontend/src/App.jsx` - Added auth callback route
- ✅ `vercel.json` - Updated build config
- ✅ `frontend/.env.example` - Created template

---

## Next Steps

1. Push changes to Git
2. Verify environment variables are set in Vercel
3. Verify Supabase redirect URL
4. Redeploy to Vercel
5. Test signup → email confirmation → login flow

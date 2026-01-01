# Deploy to Netlify Guide

This guide explains how to deploy your BrewLogic application to Netlify.

## Prerequisites

1.  **GitHub Account**: Your code must be pushed to a GitHub repository.
2.  **Netlify Account**: Sign up at [netlify.com](https://www.netlify.com).

## Steps for Deployment

### 1. Push Code to GitHub
Ensure all your latest changes are committed and pushed to your GitHub repository.

```bash
git add .
git commit -m "Ready for deployment"
git push origin main
```

### 2. Create New Site in Netlify
1.  Log in to Netlify.
2.  Click **"Add new site"** > **"Import from existing project"**.
3.  Select **GitHub**.
4.  Authorize Netlify to access your GitHub account if asked.
5.  Select your `brewlogic-brewing-recipe` repository.

### 3. Configure Build Settings
Netlify should detect the settings automatically from `netlify.toml`, but verify them:
*   **Build command**: `npm run build`
*   **Publish directory**: `dist`
*   **Functions directory**: `netlify/functions` (auto-detected)

### 4. Set Environment Variables
**CRITICAL STEP**: The app will fail without these variables.
Go to **Site configuration** > **Environment variables** and add the following:

| Key | Value | Description |
| :--- | :--- | :--- |
| `VITE_SUPABASE_URL` | `your_supabase_url` | Copy from Supabase Dashboard > Settings > API |
| `VITE_SUPABASE_ANON_KEY` | `your_supabase_anon_key` | Copy from Supabase Dashboard > Settings > API |
| `MIDTRANS_SERVER_KEY` | `your_midtrans_server_key` | From Midtrans Dashboard (Sandbox/Prod) |
| `VITE_MIDTRANS_CLIENT_KEY` | `your_midtrans_client_key` | From Midtrans Dashboard (Sandbox/Prod) |
| `NODE_VERSION` | `20` | Optional, ensures Node 20 usage |

### 5. Deploy
Click **"Deploy site"**. Netlify will install dependencies, build your React frontend, and deploy the serverless functions.

## Troubleshooting

### "Failed to save product" or API Errors
*   Check the **Function Logs** in Netlify (Deploys > Select Deploy > Functions > api).
*   Ensure all Env Variables are exact matches.

### Page Not Found / 404 on Refresh
*   This is handled by the `netlify.toml` redirects. If it fails, ensure `netlify.toml` is in the root directory.

### Build Failed on Lint Errors
*   If the build fails due to TypeScript/ESLint errors, update your build command to ignore them temporarily:
    *   Change Build Command to: `CI=false npm run build`

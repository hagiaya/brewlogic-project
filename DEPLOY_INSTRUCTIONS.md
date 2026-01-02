# Deployment Instructions

## 1. GitHub Deployment
I have already committed the changes. To push to GitHub, run:

```bash
git push origin HEAD
```

If that fails due to authentication, you may need to update your remote URL or login.

## 2. Vercel Deployment
To deploy to Vercel, you need to use the Vercel CLI.

1.  **Install Vercel CLI** (if not installed):
    ```bash
    npm i -g vercel
    ```

2.  **Deploy**:
    Run the following command in your terminal:
    ```bash
    vercel --prod
    ```

    - If asked to set up and deploy, select **Yes**.
    - Select the scope (your account).
    - Link to existing project? **No** (unless you already created one for this specific folder).
    - Project Name: `brewlogic-brewing-recipe` (or your choice).
    - Directory: `./` (default).
    - **Build Settings**: Vercel should auto-detect Vite. The default settings (`vite build`) are correct.
    - **Environment Variables**:
      - You MUST add your `.env` variables to the Vercel Project Settings on the Vercel Dashboard.
      - Go to **Settings > Environment Variables** on Vercel.
      - Add:
        - `VITE_SUPABASE_URL`
        - `VITE_SUPABASE_ANON_KEY`
        - `VITE_SUPABASE_SERVICE_ROLE_KEY`
        - `GEMINI_API_KEY` (or `API_KEY`)
        - `EMAILJS_PRIVATE_KEY`
        - etc.

## 3. Important Changes Made
- Moved `server.js` to `api/index.js` to support Vercel Serverless Functions (Zero Config).
- Updated `vercel.json` to route `/api/*` requests to this new function.
- Updated `package.json` to run the server from the new location locally.

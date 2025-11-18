# 🚂 Railway Deployment Guide for CodeXplain

This guide walks you through deploying CodeXplain to Railway.app - the easiest way to get your app live on the internet!

## Why Railway?

✅ **Automatic SSL** - Free HTTPS certificates  
✅ **Automatic DNS** - Get a `.railway.app` domain instantly  
✅ **Zero Configuration** - No server management needed  
✅ **Easy Scaling** - Scale up/down with a click  
✅ **Built-in Database** - PostgreSQL and Redis available  
✅ **GitHub Integration** - Auto-deploy on push  

## Prerequisites

1. ✅ Railway account (you have this!)
2. GitHub account with your code repository
3. OpenAI API key

## Step 1: Prepare Your Repository

### Option A: If your code is already on GitHub
Skip to Step 2!

### Option B: If your code is only local

1. **Create a GitHub repository:**
   ```bash
   # In your project directory
   git init
   git add .
   git commit -m "Initial commit"
   
   # Create repo on GitHub, then:
   git remote add origin https://github.com/your-username/code-explain.git
   git branch -M main
   git push -u origin main
   ```

2. **Create `.railwayignore` file** (optional, to exclude files):
   ```
   node_modules/
   .env
   venv/
   __pycache__/
   *.pyc
   .git/
   ```

## Step 2: Create Railway Project

1. Go to [Railway.app](https://railway.app) and log in
2. Click **"New Project"** button
3. Select **"Deploy from GitHub repo"**
4. Choose your `code-explain` repository
5. Railway will create a new project

## Step 3: Add PostgreSQL Database

1. In your Railway project, click **"+ New"**
2. Select **"Database"** → **"Add PostgreSQL"**
3. Railway will create a PostgreSQL database
4. **Note the connection details** (you'll need them later)

## Step 4: Add Redis

1. Click **"+ New"** again
2. Select **"Database"** → **"Add Redis"**
3. Railway will create a Redis instance
4. **Note the connection details**

## Step 5: Configure Backend Service

### 5.1: Create Backend Service

1. Click **"+ New"** → **"GitHub Repo"**
2. Select your `code-explain` repository
3. Railway will detect it's a repository

### 5.2: Configure Service Settings

1. Click on the service (it might be named after your repo)
2. Go to **"Settings"** tab
3. **IMPORTANT - Set Root Directory:**
   - Find **"Root Directory"** field (might be under "Source" or "Build" section)
   - **Try one of these formats:**
     - `backend` (without slash)
     - `/backend` (with leading slash - Railway sometimes uses this)
     - `./backend` (with dot-slash)
   - This tells Railway to use `backend/` as the build context
   - This is critical - without this, Railway will look for files in the repo root
   - **If you see "/backend" as an option, select that**
4. Configure other settings:
   - **Build Command**: Leave empty (Railway will use Dockerfile)
   - **Start Command**: Leave empty (Railway will use Dockerfile CMD)

### 5.3: Add Environment Variables

**⚠️ CRITICAL: You MUST set these environment variables or the backend will fail to start!**

1. Go to your **Backend service** in Railway
2. Click on **"Variables"** tab (or **"Environment"** tab)
3. Click **"+ New Variable"** for each variable below

**Option A: Set Variables Per Service (Recommended for first-time setup)**

Add these variables one by one:

```env
# Application
APP_NAME=CodeXplain
ENV=production
DEBUG=False

# Database (use Railway's PostgreSQL connection string)
# Format: postgresql://postgres:PASSWORD@HOST:PORT/railway
# Get this from your PostgreSQL service → "Connect" tab
DATABASE_URL=postgresql://postgres:PASSWORD@HOST:PORT/railway
# Note: The code will automatically convert postgresql:// to postgresql+asyncpg://

# Redis (use Railway's Redis connection string)
# Format: redis://default:PASSWORD@HOST:PORT
# Get this from your Redis service → "Connect" tab
REDIS_URL=redis://default:PASSWORD@HOST:PORT

# Security (IMPORTANT: Generate strong secrets!)
SECRET_KEY=your-strong-secret-key-minimum-32-characters
JWT_SECRET=your-jwt-secret-minimum-32-characters

# OpenAI API
OPENAI_API_KEY=sk-your-openai-api-key-here

# OpenAI Models
OPENAI_MODEL_GPT4=gpt-4o
OPENAI_MODEL_GPT4_MINI=gpt-4o-mini

# CORS - Use your Railway domain (we'll update this after frontend deploys)
# Format: https://your-app-name.railway.app
CORS_ORIGINS=["https://your-frontend-name.railway.app"]

# Security Settings
ACCESS_TOKEN_EXPIRE_MINUTES=15

# Rate Limiting
RATE_LIMIT_PER_MINUTE=60
MAX_FILE_SIZE_MB=25
```

**Option B: Use Railway's Shared Variables (Advanced)**

1. Go to your **Project** (not the service)
2. Click **"Variables"** tab
3. Add variables here to share across all services
4. Service-specific variables will override shared ones

**To get database connection strings:**
1. Click on your **PostgreSQL** service
2. Go to **"Connect"** tab
3. Copy the **"Postgres Connection URL"**
4. **Important**: You can use it as-is (`postgresql://...`) - the code will automatically convert it to `postgresql+asyncpg://`

**To get Redis connection string:**
1. Click on your **Redis** service
2. Go to **"Connect"** tab
3. Copy the **"Redis Connection URL"**

**Generate secrets:**
```bash
# On your local machine or use Railway's terminal
openssl rand -hex 32  # For SECRET_KEY
openssl rand -hex 32  # For JWT_SECRET
```

**⚠️ IMPORTANT NOTES:**
- **DATABASE_URL is REQUIRED** - Without it, the backend will crash on startup
- Railway provides `postgresql://` URLs - the code handles the conversion automatically
- After adding variables, Railway will automatically redeploy the service
- If you see errors about missing environment variables, double-check the Variables tab
- Variable names are case-sensitive: `DATABASE_URL` not `database_url`

### 5.4: Verify Build Settings

1. Go to **"Settings"** tab → **"Build"** section
2. **IMPORTANT - Configure Build Settings:**
   - **Root Directory**: Set to `/backend` (or `backend` - use what Railway shows)
   - **Dockerfile Path**: Leave empty OR set to `Dockerfile` (Railway should auto-detect)
   - **Build Command**: Leave empty
   - **Start Command**: Leave empty (uses Dockerfile CMD)
3. **If Railway still can't find Dockerfile:**
   - In **"Build"** section, look for **"Dockerfile Path"** or **"Dockerfile"** field
   - Set it to: `Dockerfile` (relative to Root Directory)
   - Or try: `./Dockerfile`
4. Railway will use `backend/` as build context when Root Directory is set
5. The Dockerfile is already configured to use Railway's `$PORT` variable

**Troubleshooting:** If you get `Dockerfile does not exist`:
- **Check Root Directory**: Must be set to `/backend` or `backend` in Settings → Build
- **Check Dockerfile Path**: In Settings → Build, explicitly set Dockerfile Path to `Dockerfile`
- **Remove root railway.json**: If there's a `railway.json` in the repo root, it might conflict - delete it
- **Verify files exist**: Make sure `backend/Dockerfile` and `backend/requirements.txt` exist in Git
- **Check Git commit**: Files must be committed to Git (not just local)
- **Alternative**: Try setting Dockerfile Path to `./Dockerfile` or just `Dockerfile`

### 5.5: Configure Port

1. Go to **"Settings"** → **"Networking"**
2. Railway will show port configuration options:
   - **Option A (Recommended)**: Let Railway auto-detect (it will set `$PORT` automatically)
   - **Option B**: Manually set port to `8000` for backend
3. Railway will generate a public URL like: `https://your-backend-name.railway.app`
4. **Important**: 
   - If Railway auto-detects, it sets `$PORT` environment variable automatically
   - If you manually set port to 8000, Railway will still work, but `$PORT` may not be set
   - Our Dockerfile uses `${PORT:-8000}` which defaults to 8000 if `$PORT` is not set

## Step 6: Deploy Frontend Service

### 6.1: Create Frontend Service

1. Click **"+ New"** → **"GitHub Repo"**
2. Select the same repository
3. Railway will create another service

### 6.2: Configure Frontend Settings

1. Click on the frontend service
2. Go to **"Settings"** tab
3. **IMPORTANT - Set Root Directory:**
   - Find **"Root Directory"** field
   - **Try one of these formats:**
     - `frontend` (without slash)
     - `/frontend` (with leading slash - Railway sometimes uses this)
     - `./frontend` (with dot-slash)
   - **If you see "/frontend" as an option, select that**
4. Configure other settings:
   - **Build Command**: Leave empty (Railway will use Dockerfile)
   - **Start Command**: Leave empty (Railway will use Dockerfile CMD)

### 6.3: Update Frontend Dockerfile for Railway

Railway works best with the existing Dockerfile. Make sure `frontend/Dockerfile` exists (it should from our earlier setup).

### 6.4: Add Frontend Environment Variables

**⚠️ CRITICAL: VITE_API_BASE_URL must be set BEFORE building!**

Vite replaces environment variables at BUILD time, not runtime. You MUST set this variable before Railway builds the frontend.

**⚠️ IMPORTANT: Use Public Domain, NOT Private Network!**

Since your frontend runs in the browser (client-side), it cannot access Railway's private network (`*.railway.internal`). You MUST use the backend's public domain.

1. Go to your **Frontend service** in Railway
2. Click on **"Variables"** tab
3. Click **"+ New Variable"**
4. Add this variable using Railway's reference variable:

```env
# API Base URL - Use Railway's reference variable for backend public domain
# This automatically updates when backend redeploys
VITE_API_BASE_URL=https://${{Backend.RAILWAY_PUBLIC_DOMAIN}}
```

**Alternative (Manual):** If you prefer to set it manually:

```env
# Get this from backend service → "Settings" → "Networking" → Copy public URL
VITE_API_BASE_URL=https://your-backend-name.railway.app
```

**Important Notes:**
- **Use `https://` NOT `http://`** - Railway provides HTTPS
- **Use `RAILWAY_PUBLIC_DOMAIN` NOT `RAILWAY_PRIVATE_DOMAIN`** - Browser can't access private network
- **No trailing slash**
- **Set this BEFORE building** - If you've already built, Railway will rebuild automatically when you add/update the variable

**Why not private network?**
- Frontend runs in the browser (client-side)
- Browser is on the public internet, outside Railway's private network
- Private network (`*.railway.internal`) only works for server-to-server communication
- See: https://docs.railway.com/guides/private-networking#faq

**After setting the variable:**
- Railway will automatically trigger a new build
- The build will include the API URL in the compiled JavaScript
- The frontend will use this URL for all API calls

### 6.5: Configure Frontend Build Settings

1. Go to **"Settings"** tab → **"Build"** section
2. **Configure Build Settings:**
   - **Root Directory**: Set to `/frontend` (or `frontend` - use what Railway shows)
   - **Dockerfile Path**: Leave empty OR set to `Dockerfile` (Railway should auto-detect)
   - **Build Command**: Leave empty
   - **Start Command**: Leave empty (uses Dockerfile CMD)
3. **If Railway can't find Dockerfile:**
   - In **"Build"** section, explicitly set **"Dockerfile Path"** to: `Dockerfile`
4. Railway will build the frontend using Docker
5. The frontend Dockerfile uses Nginx which will serve on port 80

### 6.6: Configure Frontend Port

**⚠️ IMPORTANT: Let Railway auto-detect the port!**

1. Go to **"Settings"** → **"Networking"**
2. **CRITICAL**: Do NOT manually set a port - let Railway auto-detect
3. Railway will:
   - Read the `EXPOSE 80` directive from your Dockerfile
   - Automatically assign a port (usually 8080 or similar)
   - Set the `$PORT` environment variable
   - Your startup script will use this `$PORT` value
4. Railway will generate a public URL like: `https://your-frontend-name.railway.app`

**If you manually set a port:**
- Railway's load balancer will try to connect to your manually set port
- But nginx will be listening on the `$PORT` value Railway provides
- This causes "connection refused" errors (502 Bad Gateway)
- **Solution**: Remove the manual port setting and let Railway auto-detect

## Step 7: Update CORS After Deployment

Once both services are deployed:

1. **Get your frontend URL:**
   - Go to **Frontend Service** → **"Settings"** → **"Networking"**
   - Copy the public URL (e.g., `https://your-frontend-name.railway.app`)

2. **Update CORS in backend:**
   - Go to **Backend Service** → **"Variables"** tab
   - Find `CORS_ORIGINS` variable
   - Update it with your frontend URL using Railway's reference variable:
     ```env
     CORS_ORIGINS=["https://${{Frontend.RAILWAY_PUBLIC_DOMAIN}}"]
     ```
   - **Or manually:**
     ```env
     CORS_ORIGINS=["https://your-frontend-name.railway.app"]
     ```
   - **Important**: 
     - Use `https://` (not `http://`)
     - Use `RAILWAY_PUBLIC_DOMAIN` (not private domain - browser can't access private network)
     - No trailing slash
     - Format: JSON array: `["https://url1.com","https://url2.com"]`

3. **Save changes** - Railway will automatically redeploy the backend

4. **Verify CORS is working:**
   - Open browser DevTools → Console
   - Visit your frontend URL
   - Check for any CORS errors

## Step 8: Run Database Migrations

After backend is deployed:

1. Go to **Backend Service** → **"Deployments"** tab
2. Click on the latest deployment
3. Go to **"Logs"** tab
4. Check if migrations ran automatically (they should from Dockerfile)

**If migrations didn't run automatically:**

1. Go to **Backend Service** → **"Settings"** → **"Deploy"**
2. Add a **"Deploy Command"**:
   ```bash
   alembic upgrade head && gunicorn app.main:app --workers 4 --worker-class uvicorn.workers.UvicornWorker --bind 0.0.0.0:$PORT
   ```

Or use Railway's terminal:
1. Go to **Backend Service** → **"Deployments"**
2. Click **"View Logs"** → **"Open Shell"**
3. Run:
   ```bash
   cd /app
   alembic upgrade head
   ```

## Step 9: Custom Domain (Optional)

### 9.1: Add Custom Domain

1. Go to **Frontend Service** → **"Settings"** → **"Networking"**
2. Click **"Generate Domain"** (if not already generated)
3. Click **"Custom Domain"**
4. Enter your domain (e.g., `app.yourdomain.com`)
5. Follow Railway's DNS instructions

### 9.2: Update DNS

Add a CNAME record in your domain's DNS:
```
Type: CNAME
Name: app (or www, or @)
Value: your-frontend-name.railway.app
```

### 9.3: Update Environment Variables

After custom domain is active:
1. Update `CORS_ORIGINS` in backend:
   ```env
   CORS_ORIGINS=["https://app.yourdomain.com","https://your-frontend-name.railway.app"]
   ```
2. Update `VITE_API_BASE_URL` in frontend:
   ```env
   VITE_API_BASE_URL=https://api.yourdomain.com
   ```
   (Or use your backend's Railway URL)

## Step 10: Verify Deployment

### 10.1: Check Backend

1. Go to backend service → **"Settings"** → **"Networking"**
2. Copy the public URL
3. Visit: `https://your-backend-url.railway.app/health`
4. Should return: `{"status": "healthy", ...}`

### 10.2: Check Frontend

1. Go to frontend service → **"Settings"** → **"Networking"**
2. Copy the public URL
3. Visit the URL in browser
4. Should see the login page

### 10.3: Test API

Visit: `https://your-backend-url.railway.app/docs`
Should see FastAPI Swagger documentation

## Step 11: Set Up Auto-Deploy (Optional)

Railway auto-deploys by default, but you can configure:

1. Go to **Service** → **"Settings"** → **"Deploy"**
2. Configure:
   - **Auto Deploy**: Enabled (default)
   - **Branch**: `main` (or your default branch)
   - Railway will deploy on every push to main

## Troubleshooting

### Backend won't start

1. **Check logs:**
   - Go to **Backend Service** → **"Deployments"** → **"View Logs"**
   - Look for error messages

2. **Common issues:**
   - Missing environment variables
   - Database connection string incorrect
   - Port not exposed correctly

3. **Fix:**
   - Verify all environment variables are set
   - Check DATABASE_URL format (should use `postgresql+asyncpg://`)
   - Ensure Dockerfile exposes port 8000

### Frontend can't connect to backend

1. **Check CORS:**
   - Verify `CORS_ORIGINS` includes frontend URL
   - Must include `https://` protocol
   - No trailing slashes
   - Format: `["https://your-frontend-url.railway.app"]`

2. **Check API URL:**
   - Verify `VITE_API_BASE_URL` in frontend variables
   - Should match backend Railway URL (e.g., `https://your-backend-name.railway.app`)
   - Must include `https://` protocol
   - No trailing slash

3. **Check browser console:**
   - Open browser DevTools → Console
   - Look for CORS errors or network errors
   - The frontend makes direct API calls (no nginx proxy on Railway)

4. **Verify backend is running:**
   - Check backend service logs
   - Visit backend URL directly: `https://your-backend-url.railway.app/health`

### Database connection errors

1. **Verify connection string:**
   - Get fresh connection string from PostgreSQL service
   - Ensure it uses `postgresql+asyncpg://` prefix
   - Check password is correct

2. **Check database is running:**
   - Go to PostgreSQL service → **"Metrics"**
   - Should show active connections

### Frontend shows error or blank page

1. **Check browser console:**
   - Open browser DevTools (F12)
   - Go to **Console** tab
   - Look for errors (especially CORS or network errors)

2. **Common issues and fixes:**

   **Issue: "Failed to fetch" or CORS errors**
   - **Cause**: Backend CORS not configured for frontend URL
   - **Fix**: 
     1. Get your frontend URL: `https://code-xplain.up.railway.app`
     2. Go to **Backend Service** → **Variables** tab
     3. Update `CORS_ORIGINS` to: `["https://code-xplain.up.railway.app"]`
     4. Railway will redeploy automatically

   **Issue: "Network Error" or API calls failing**
   - **Cause**: `VITE_API_BASE_URL` not set or incorrect
   - **Fix**:
     1. Go to **Frontend Service** → **Variables** tab
     2. Check if `VITE_API_BASE_URL` exists
     3. If missing or wrong, add/update it to your backend URL: `https://your-backend-name.railway.app`
     4. **Important**: Railway will rebuild the frontend automatically
     5. Wait for rebuild to complete (can take a few minutes)

   **Issue: Frontend loads but shows "localhost:8000" in network requests**
   - **Cause**: Build is using cached layers, so the new `VITE_API_BASE_URL` wasn't used
   - **Fix**: 
     1. **Verify variable is set:**
        - Go to Frontend service → Variables tab
        - Check `VITE_API_BASE_URL` exists and has correct value: `https://melodious-empathy-production-6b50.up.railway.app`
        - **Do NOT use reference variables** (`${{Backend.RAILWAY_PUBLIC_DOMAIN}}`) - they don't work with Vite builds
     2. **Force a rebuild (bust the cache):**
        - **Option A (Recommended)**: Make a small change to trigger a fresh build
          - Edit any file in `frontend/` (like add a comment to `package.json`)
          - Commit and push to trigger a new build
        - **Option B**: Use Railway's "Clear Build Cache" option (if available)
          - Go to Deployments tab → Settings → Clear Build Cache
        - **Option C**: Temporarily change Dockerfile to force rebuild
          - Add a comment or whitespace to the Dockerfile
          - Commit and push
     3. **Verify the build used the variable:**
        - Check build logs - you should see: `Building with VITE_API_BASE_URL=https://...`
        - If you see `Building with VITE_API_BASE_URL=` (empty), the variable isn't being passed
     4. **After deployment:**
        - Open browser DevTools → Network tab
        - Try to register/login
        - Check request URL - should be `https://melodious-empathy-production-6b50.up.railway.app/...`, not `localhost:8000`
     5. **Important**: 
        - Vite variables are embedded at BUILD time, not runtime
        - If build logs show "cached", the build didn't actually run - you need to bust the cache
        - Railway's Docker layer caching can prevent rebuilds even when variables change

   **Issue: 502 Bad Gateway**
   - **Cause**: Frontend service not running or nginx misconfigured
   - **Fix**:
     1. Check frontend service logs in Railway
     2. Verify nginx is starting correctly
     3. Check if port configuration is correct

3. **Verify configuration:**
   - [ ] Frontend service has `VITE_API_BASE_URL` set to backend URL
   - [ ] Backend service has `CORS_ORIGINS` set to frontend URL
   - [ ] Both services show as "Active" in Railway
   - [ ] Both services have public URLs

### Build fails

1. **Check build logs:**
   - Go to **Service** → **"Deployments"** → **"View Logs"**
   - Look for build errors

2. **Common fixes:**
   - Ensure Dockerfile exists and is correct
   - **Verify Root Directory is set correctly:**
     - Backend: `backend`
     - Frontend: `frontend`
   - Check that files exist in the root directory (requirements.txt for backend, package.json for frontend)
   - Verify all dependencies in requirements.txt/package.json

3. **"File not found" or "Dockerfile does not exist" errors:**
   - **Root Directory**: Set to `/backend` in Settings → Build section
   - **Dockerfile Path**: In Settings → Build, explicitly set to `Dockerfile`
   - **Remove root railway.json**: Delete any `railway.json` in repo root (it conflicts with service-specific configs)
   - **Verify files**: Check `backend/Dockerfile` and `backend/requirements.txt` exist in Git
   - **Check Git**: Files must be committed (not just local, not in .gitignore)
   - **Railway UI**: After setting Root Directory, Railway should show the Dockerfile path
   - **If still not working**: Try setting Dockerfile Path to `./Dockerfile` or just `Dockerfile`

## Railway-Specific Tips

### 1. Environment Variables Priority

Railway uses this order:
1. Service-specific variables (highest priority)
2. Shared variables (project-level)
3. Default values

### 2. Port Configuration

**How Railway handles ports:**

1. **Auto-detection (Recommended)**:
   - Railway reads the `EXPOSE` directive in your Dockerfile
   - Automatically sets `$PORT` environment variable
   - Maps traffic to your service

2. **Manual port setting**:
   - Go to **Service** → **"Settings"** → **"Networking"**
   - You can manually set a port (e.g., 8000 for backend, 80 for frontend)
   - Railway will still work, but `$PORT` may not be automatically set

3. **Our Dockerfile configuration**:
   ```dockerfile
   EXPOSE 8000
   CMD ["sh", "-c", "... --bind 0.0.0.0:${PORT:-8000} ..."]
   ```
   - Uses `${PORT:-8000}` which defaults to 8000 if `$PORT` is not set
   - Works with both auto-detection and manual port configuration

**For Backend:**
- Port 8000 is standard
- Railway will auto-detect from `EXPOSE 8000` in Dockerfile

**For Frontend:**
- Port 80 is standard for Nginx
- Railway will auto-detect from `EXPOSE 80` in Dockerfile

### 3. Resource Limits

Railway free tier includes:
- 500 hours/month compute time
- $5 credit/month
- Sufficient for small to medium apps

Upgrade for:
- More resources
- Better performance
- Higher limits

### 4. Monitoring

Railway provides:
- **Metrics**: CPU, Memory, Network usage
- **Logs**: Real-time application logs
- **Deployments**: History of all deployments

Access via service dashboard.

## Cost Estimation

**Free Tier:**
- $5 credit/month
- ~500 hours compute time
- Good for development/testing

**Hobby Plan ($5/month):**
- $5 credit + $5 monthly
- Better for small production apps

**Pro Plan ($20/month):**
- $20 credit + $20 monthly
- Better performance, more resources

**Your setup:**
- Backend service: ~$0.01-0.02/hour
- Frontend service: ~$0.01/hour
- PostgreSQL: ~$0.01/hour
- Redis: ~$0.01/hour
- **Total**: ~$0.04-0.05/hour = ~$30-35/month for 24/7

## Next Steps

1. ✅ Set up monitoring alerts
2. ✅ Configure custom domain
3. ✅ Set up automated backups (Railway handles this)
4. ✅ Enable Railway's analytics
5. ✅ Set up staging environment

## Quick Start Checklist

Follow these steps in order:

1. ✅ **Create Railway project** → Connect GitHub repo
2. ✅ **Add PostgreSQL** → Get connection string
3. ✅ **Add Redis** → Get connection string
4. ✅ **Create Backend Service**:
   - **Root Directory**: `backend` (CRITICAL - set this first!)
   - Add environment variables (see Step 5.3)
   - Configure port (8000 or auto-detect)
   - Deploy and get backend URL
5. ✅ **Create Frontend Service**:
   - **Root Directory**: `frontend` (CRITICAL - set this first!)
   - Set `VITE_API_BASE_URL` to backend URL
   - Configure port (80 or auto-detect)
   - Deploy and get frontend URL
6. ✅ **Update CORS** in backend with frontend URL (see Step 7)
7. ✅ **Test deployment** → Visit frontend URL

## ⚡ Quick CORS Update (After Both Services Deploy)

If you already have both services deployed and just need to update CORS:

1. **Get Frontend URL:**
   - Frontend Service → Settings → Networking
   - Copy the URL (e.g., `https://codexplain-frontend.railway.app`)

2. **Update Backend CORS:**
   - Backend Service → Variables tab
   - Find `CORS_ORIGINS`
   - Set to: `["https://your-frontend-url.railway.app"]`
   - Format: JSON array with quotes, no trailing slash
   - Save → Railway auto-redeploys

## Quick Reference

**Railway Dashboard**: https://railway.app/dashboard

**Service URLs:**
- Backend: `https://your-backend-name.railway.app`
- Frontend: `https://your-frontend-name.railway.app`
- API Docs: `https://your-backend-name.railway.app/docs`

**Important Environment Variables:**
- `DATABASE_URL` - From PostgreSQL service (use `postgresql+asyncpg://` prefix)
- `REDIS_URL` - From Redis service
- `CORS_ORIGINS` - Frontend URL(s) with `https://`
- `VITE_API_BASE_URL` - Backend URL
- `SECRET_KEY` - Generate with `openssl rand -hex 32`
- `JWT_SECRET` - Generate with `openssl rand -hex 32`

**Key Settings:**
- Backend Root Directory: `backend`
- Frontend Root Directory: `frontend`
- Both use Dockerfiles (already configured)

## Support

- **Railway Docs**: https://docs.railway.app
- **Railway Discord**: https://discord.gg/railway
- **Railway Status**: https://status.railway.app

Happy deploying! 🚂


# 🔧 Railway Troubleshooting Guide

## "Dockerfile does not exist" Error

### Problem
Railway can't find the Dockerfile even though it exists in your repository.

### Solution Steps

#### Step 1: Check Root Directory Setting

1. Go to your **Backend Service** → **"Settings"** tab
2. Find **"Build"** section (or look for "Source" section)
3. Look for **"Root Directory"** field
4. Set it to: `/backend` (with leading slash) or `backend` (whichever Railway shows as an option)
5. **Save** the settings

#### Step 2: Explicitly Set Dockerfile Path

1. In the same **"Build"** section
2. Look for **"Dockerfile Path"** or **"Dockerfile"** field
3. Set it to: `Dockerfile` (just the filename, no path)
4. This tells Railway: "Look for Dockerfile in the Root Directory"
5. **Save** the settings

#### Step 3: Remove Conflicting railway.json

If you have a `railway.json` file in the **root** of your repository:
1. Delete it (or move it out of the repo)
2. Railway should use service-specific settings instead
3. The `backend/railway.json` is fine to keep (it's service-specific)

#### Step 4: Verify Files in Git

1. Make sure `backend/Dockerfile` exists in your Git repository
2. Make sure `backend/requirements.txt` exists
3. Check they're committed:
   ```bash
   git ls-files backend/Dockerfile
   git ls-files backend/requirements.txt
   ```
4. If not listed, commit them:
   ```bash
   git add backend/Dockerfile backend/requirements.txt
   git commit -m "Add Dockerfile and requirements.txt"
   git push
   ```

#### Step 5: Force Rebuild

1. In Railway, go to your service
2. Go to **"Deployments"** tab
3. Click **"Redeploy"** or **"Deploy"** button
4. Railway will rebuild with the new settings

### Alternative: Use Railway's Build Settings UI

If the above doesn't work:

1. **Backend Service** → **Settings** → **Build**
2. **Root Directory**: `/backend`
3. **Dockerfile Path**: `Dockerfile`
4. **Build Command**: (leave empty)
5. **Start Command**: (leave empty)

### Still Not Working?

1. **Check Railway logs**: Service → Deployments → View Logs
2. **Verify file paths**: Make sure files are at:
   - `backend/Dockerfile` (not `backend/dockerfile` or `backend/Dockerfile.txt`)
   - `backend/requirements.txt`
3. **Try different Root Directory formats**:
   - `/backend`
   - `backend`
   - `./backend`
4. **Contact Railway support**: They can check your specific project configuration

## Frontend Nginx "backend host not found" Error

### Problem
Nginx tries to proxy to `http://backend:8000` but can't resolve the hostname.

### Solution
This is already fixed! The nginx.conf has been updated to remove the proxy. The frontend makes direct API calls using `VITE_API_BASE_URL`.

**Verify:**
1. Check `frontend/nginx.conf` - should NOT have `proxy_pass http://backend:8000`
2. Frontend uses `VITE_API_BASE_URL` environment variable for API calls
3. Set `VITE_API_BASE_URL` to your backend Railway URL in frontend service variables

## Quick Fix Checklist

- [ ] Root Directory set to `/backend` in backend service
- [ ] Dockerfile Path set to `Dockerfile` in backend service
- [ ] Root Directory set to `/frontend` in frontend service  
- [ ] Dockerfile Path set to `Dockerfile` in frontend service
- [ ] No `railway.json` in repo root (only in `backend/` and `frontend/` if needed)
- [ ] `backend/Dockerfile` exists and is committed to Git
- [ ] `backend/requirements.txt` exists and is committed to Git
- [ ] `frontend/Dockerfile` exists and is committed to Git
- [ ] Redeployed after changing settings


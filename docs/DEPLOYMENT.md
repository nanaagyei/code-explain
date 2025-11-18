# Documentation Deployment Guide

This guide covers deploying the CodeXplain documentation site built with Docusaurus.

## Option 1: Deploy to Railway (Recommended - Same Platform)

Since you're already using Railway for your app, this is the easiest option.

### Step 1: Create Railway Service

1. Go to your Railway project
2. Click **"+ New"** → **"GitHub Repo"**
3. Select the same repository (`code-explain`)
4. Railway will create a new service

### Step 2: Configure Service Settings

1. Click on the new service
2. Go to **"Settings"** tab
3. Set **Root Directory** to: `docs`
4. Configure **Build Command**: `npm ci && npm run build`
5. Configure **Start Command**: `npx serve -s build -l tcp://0.0.0.0:${PORT:-3000}`
6. **Output Directory**: `build` (Docusaurus outputs to `build/`)

### Step 3: Add Environment Variables

Add these (optional) variables so the docs site can adjust URL/baseUrl automatically:

```
DOCS_SITE_URL=https://code-xplain-docs.up.railway.app
DOCS_BASE_URL=/
```

If you leave them unset, the docs will default to the GitHub Pages configuration (`https://nanaagyei.github.io/code-explain/`).

### Step 4: Configure Port

1. Go to **"Settings"** → **"Networking"**
2. Let Railway auto-detect the port
3. Railway will generate a public URL like: `https://code-xplain-docs.up.railway.app`

### Step 5: Update Docusaurus Config (Optional)

If you want to use a custom domain, update `docs/docusaurus.config.ts`:

```typescript
url: 'https://your-docs-domain.com',
baseUrl: '/',
```

## Option 2: Deploy to GitHub Pages

### Step 1: Update Docusaurus Config

Update `docs/docusaurus.config.ts`:

```typescript
const config: Config = {
  url: 'https://nanaagyei.github.io', // Your GitHub username
  baseUrl: '/code-explain/', // Repository name
  // ... rest of config
};
```

### Step 2: Create GitHub Actions Workflow

Create `.github/workflows/deploy-docs.yml`:

```yaml
name: Deploy Documentation

on:
  push:
    branches:
      - main
    paths:
      - 'docs/**'
      - '.github/workflows/deploy-docs.yml'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: docs/package-lock.json
      
      - name: Install dependencies
        working-directory: docs
        run: npm ci
      
      - name: Build documentation
        working-directory: docs
        run: npm run build
      
      - name: Deploy to GitHub Pages
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./docs/build
          cname: codeexplain.dev  # Optional: if using custom domain
```

### Step 3: Enable GitHub Pages

1. Go to your repository on GitHub
2. Click **Settings** → **Pages**
3. Under **Source**, select **GitHub Actions**
4. Save changes

### Step 4: Deploy

1. Commit and push the workflow file
2. GitHub Actions will automatically build and deploy on every push to `main`
3. Your docs will be available at: `https://nanaagyei.github.io/code-explain/`

## Option 3: Deploy to Vercel (Easiest)

### Step 1: Install Vercel CLI

```bash
npm i -g vercel
```

### Step 2: Deploy

```bash
cd docs
vercel
```

Follow the prompts. Vercel will automatically detect Docusaurus and configure everything.

### Step 3: Configure Build Settings

In Vercel dashboard:
- **Framework Preset**: Docusaurus
- **Root Directory**: `docs`
- **Build Command**: `npm run build`
- **Output Directory**: `build`

## Option 4: Deploy to Netlify

### Step 1: Create `netlify.toml` in `docs/` directory

```toml
[build]
  base = "docs"
  command = "npm ci && npm run build"
  publish = "build"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

### Step 2: Deploy

1. Go to [Netlify](https://netlify.com)
2. Click **"Add new site"** → **"Import an existing project"**
3. Connect your GitHub repository
4. Configure:
   - **Base directory**: `docs`
   - **Build command**: `npm ci && npm run build`
   - **Publish directory**: `docs/build`
5. Click **"Deploy site"**

## Local Testing

Before deploying, test locally:

```bash
cd docs
npm install
npm run build
npm run serve
```

Visit `http://localhost:3000` to preview.

## Troubleshooting

### Build Fails

- Check Node.js version (requires >= 18)
- Clear cache: `npm run clear && npm install`
- Check for broken links: `npm run build` will fail if `onBrokenLinks: 'throw'`

### GitHub Pages 404

- Ensure `baseUrl` matches your repository name
- Check that GitHub Actions workflow completed successfully
- Verify `publish_dir` in workflow matches Docusaurus output directory

### Railway Deployment Issues

- Verify Root Directory is set to `docs`
- Check build logs for errors
- Ensure `serve` package is available (install if needed: `npm install -g serve`)

## Custom Domain

To use a custom domain (e.g., `docs.codexplain.com`):

1. **Railway**: Add custom domain in Settings → Networking
2. **GitHub Pages**: Add `CNAME` file to `docs/static/` with your domain
3. **Vercel/Netlify**: Configure in domain settings

Then update `docusaurus.config.ts`:

```typescript
url: 'https://docs.codexplain.com',
baseUrl: '/',
```


# 🚀 GitHub Pages Deployment Guide

**Date**: May 5, 2026

---

## ✅ TaskFlow is Ready for GitHub Pages!

Your TaskFlow app is now configured for automatic deployment to GitHub Pages.

---

## 🎯 Deployment Methods

### Method 1: Automatic Deployment (Recommended) ⭐

**Deploys automatically on every push to main branch**

### Method 2: Manual Deployment

**Deploy manually using npm command**

---

## 📋 Step-by-Step Setup

### Step 1: Create GitHub Repository

1. **Go to GitHub**: https://github.com
2. **Click "New repository"**
3. **Repository name**: `taskflow` (or your preferred name)
4. **Visibility**: Public or Private
5. **Click "Create repository"**

### Step 2: Update Repository Name in Config

**Important**: Update the base path in `vite.config.js`:

```javascript
// Change 'taskflow' to YOUR repository name
base: process.env.GITHUB_PAGES === 'true' ? '/YOUR-REPO-NAME/' : '/',
```

Example:
- If repo is `my-taskflow` → use `/my-taskflow/`
- If repo is `task-manager` → use `/task-manager/`
- If repo is `taskflow` → use `/taskflow/`

### Step 3: Initialize Git (if not already done)

```bash
git init
git add .
git commit -m "Initial commit"
```

### Step 4: Connect to GitHub

```bash
# Replace with your repository URL
git remote add origin https://github.com/YOUR-USERNAME/taskflow.git
git branch -M main
git push -u origin main
```

### Step 5: Enable GitHub Pages

1. **Go to your repository** on GitHub
2. **Click "Settings"**
3. **Click "Pages"** (in left sidebar)
4. **Source**: Select "GitHub Actions"
5. **Save**

### Step 6: Deploy!

**Automatic Deployment:**
```bash
# Just push to main branch
git add .
git commit -m "Deploy to GitHub Pages"
git push
```

**Manual Deployment:**
```bash
npm run deploy
```

---

## 🌐 Your Live URL

After deployment, your app will be available at:

```
https://YOUR-USERNAME.github.io/YOUR-REPO-NAME/
```

Example:
- Username: `john`
- Repo: `taskflow`
- URL: `https://john.github.io/taskflow/`

---

## 🔧 Configuration Files

### 1. **vite.config.js** - Base Path

```javascript
export default defineConfig({
  // GitHub Pages base path
  base: process.env.GITHUB_PAGES === 'true' ? '/taskflow/' : '/',
  // ... rest of config
})
```

### 2. **package.json** - Deploy Scripts

```json
{
  "scripts": {
    "build:github": "cross-env GITHUB_PAGES=true vite build",
    "deploy": "npm run build:github && gh-pages -d dist"
  }
}
```

### 3. **.github/workflows/deploy.yml** - Auto Deploy

Automatically deploys on push to main branch.

---

## 📊 Deployment Process

### Automatic Deployment Flow:

```
1. You push code to GitHub
   ↓
2. GitHub Actions triggers
   ↓
3. Installs dependencies (npm ci)
   ↓
4. Builds project (npm run build:github)
   ↓
5. Deploys to GitHub Pages
   ↓
6. Your site is live! ✅
```

### Manual Deployment Flow:

```
1. You run: npm run deploy
   ↓
2. Builds project locally
   ↓
3. Pushes to gh-pages branch
   ↓
4. Your site is live! ✅
```

---

## 🎯 Commands

```bash
# Build for GitHub Pages
npm run build:github

# Deploy manually
npm run deploy

# Build for local/other hosting
npm run build

# Preview build locally
npm run preview
```

---

## 🔍 Checking Deployment Status

### On GitHub:

1. Go to your repository
2. Click "Actions" tab
3. See deployment status
4. Click on workflow run for details

### Deployment States:

- 🟡 **In Progress** - Building/deploying
- ✅ **Success** - Deployed successfully
- ❌ **Failed** - Check logs for errors

---

## 🛠️ Troubleshooting

### Issue 1: 404 Page Not Found

**Problem**: Site shows 404 error

**Solution**: Check base path in `vite.config.js`
```javascript
// Must match your repository name
base: '/YOUR-REPO-NAME/'
```

### Issue 2: Blank Page

**Problem**: Page loads but shows blank screen

**Solutions**:
1. Check browser console for errors
2. Verify base path is correct
3. Check if assets are loading (Network tab)
4. Ensure Supabase credentials are correct

### Issue 3: Deployment Failed

**Problem**: GitHub Actions workflow fails

**Solutions**:
1. Check Actions tab for error logs
2. Verify `package.json` scripts are correct
3. Ensure all dependencies are in `package.json`
4. Check Node.js version compatibility

### Issue 4: Assets Not Loading

**Problem**: CSS/JS files return 404

**Solution**: Base path issue
```javascript
// In vite.config.js
base: '/taskflow/'  // Must end with /
```

### Issue 5: Router Issues

**Problem**: Direct URLs don't work (e.g., `/dashboard`)

**Solution**: GitHub Pages doesn't support SPA routing by default

Add `404.html` that redirects to `index.html`:
```html
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <title>TaskFlow</title>
    <script>
      sessionStorage.redirect = location.href;
    </script>
    <meta http-equiv="refresh" content="0;URL='/taskflow/'">
  </head>
  <body></body>
</html>
```

---

## 🔒 Environment Variables

### Supabase Credentials

**Important**: Your Supabase credentials are in the code!

**Current Setup** (in `src/services/supabase.js`):
```javascript
const supabaseUrl = 'YOUR_SUPABASE_URL'
const supabaseAnonKey = 'YOUR_SUPABASE_ANON_KEY'
```

**Security Notes**:
- ✅ Anon key is safe to expose (public)
- ✅ RLS policies protect your data
- ❌ Never commit service role key
- ✅ GitHub Pages is HTTPS (secure)

**For Extra Security** (Optional):

Use environment variables:
```javascript
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
```

Create `.env`:
```
VITE_SUPABASE_URL=your_url
VITE_SUPABASE_ANON_KEY=your_key
```

Add to `.gitignore`:
```
.env
```

---

## 📱 PWA on GitHub Pages

### HTTPS Requirement

✅ **GitHub Pages provides HTTPS automatically!**

Your PWA will work perfectly:
- ✅ Service Worker enabled
- ✅ Offline support
- ✅ Install prompt
- ✅ Push notifications (if implemented)

### Testing PWA:

1. Open your GitHub Pages URL
2. Open DevTools (F12)
3. Go to Application tab
4. Check Service Worker status
5. Test "Add to Home Screen"

---

## 🎨 Custom Domain (Optional)

### Use Your Own Domain

1. **Buy a domain** (e.g., taskflow.com)
2. **Add CNAME file** to `public/` folder:
   ```
   taskflow.com
   ```
3. **Configure DNS** at your domain provider:
   ```
   Type: CNAME
   Name: @
   Value: YOUR-USERNAME.github.io
   ```
4. **Enable in GitHub**:
   - Settings → Pages
   - Custom domain: `taskflow.com`
   - Save

---

## 📊 Deployment Checklist

### Before First Deploy:

- [ ] Update base path in `vite.config.js`
- [ ] Create GitHub repository
- [ ] Push code to GitHub
- [ ] Enable GitHub Pages in settings
- [ ] Set source to "GitHub Actions"

### For Each Deploy:

- [ ] Test locally (`npm run dev`)
- [ ] Build successfully (`npm run build:github`)
- [ ] Commit changes
- [ ] Push to GitHub
- [ ] Check Actions tab for status
- [ ] Test live site

---

## 🌟 Best Practices

### 1. **Test Before Deploy**
```bash
# Build and preview locally
npm run build:github
npm run preview
```

### 2. **Use Branches**
```bash
# Develop in feature branch
git checkout -b feature/new-feature

# Merge to main when ready
git checkout main
git merge feature/new-feature
git push  # Auto-deploys!
```

### 3. **Monitor Deployments**
- Check Actions tab regularly
- Review deployment logs
- Test after each deploy

### 4. **Version Control**
```bash
# Tag releases
git tag -a v1.0.0 -m "Version 1.0.0"
git push --tags
```

---

## 🚀 Quick Deploy Guide

### First Time Setup:

```bash
# 1. Update vite.config.js with your repo name
# 2. Create GitHub repo
# 3. Initialize git
git init
git add .
git commit -m "Initial commit"

# 4. Connect to GitHub
git remote add origin https://github.com/YOUR-USERNAME/taskflow.git
git branch -M main
git push -u origin main

# 5. Enable GitHub Pages (Settings → Pages → GitHub Actions)
# 6. Done! Your site will deploy automatically
```

### Subsequent Deploys:

```bash
# Make changes
git add .
git commit -m "Update feature"
git push

# That's it! Auto-deploys to GitHub Pages
```

### Manual Deploy:

```bash
npm run deploy
```

---

## 📖 Resources

- [GitHub Pages Docs](https://docs.github.com/en/pages)
- [Vite Deployment Guide](https://vitejs.dev/guide/static-deploy.html)
- [GitHub Actions Docs](https://docs.github.com/en/actions)

---

## 🎉 Summary

### What You Get:

✅ **Automatic deployment** - Push to deploy
✅ **HTTPS enabled** - Secure by default
✅ **PWA support** - Full offline capabilities
✅ **Free hosting** - No cost
✅ **Custom domain** - Optional
✅ **CI/CD pipeline** - GitHub Actions

### Your Live URL:

```
https://YOUR-USERNAME.github.io/YOUR-REPO-NAME/
```

### To Deploy:

**Automatic:**
```bash
git push
```

**Manual:**
```bash
npm run deploy
```

---

## 🎊 Next Steps

1. **Update `vite.config.js`** with your repo name
2. **Create GitHub repository**
3. **Push your code**
4. **Enable GitHub Pages**
5. **Watch it deploy!** ✨

**Your TaskFlow will be live on GitHub Pages!** 🚀

---

## 📝 Important Files

- `.github/workflows/deploy.yml` - Auto-deployment workflow
- `vite.config.js` - Base path configuration
- `package.json` - Deploy scripts
- `dist/` - Built files (auto-generated)

---

**Ready to deploy? Follow the steps above!** 🎉

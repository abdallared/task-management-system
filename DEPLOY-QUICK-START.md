# 🚀 Deploy to GitHub Pages - Quick Start

---

## ⚡ 5-Minute Deployment

### Step 1: Update Repository Name

**Edit `vite.config.js`** (line 6):

```javascript
// Change 'taskflow' to YOUR repository name
base: process.env.GITHUB_PAGES === 'true' ? '/YOUR-REPO-NAME/' : '/',
```

Example:
- If your repo is `my-app` → use `/my-app/`
- If your repo is `taskflow` → use `/taskflow/`

### Step 2: Create GitHub Repository

1. Go to: https://github.com/new
2. Repository name: `taskflow` (or your choice)
3. Click "Create repository"

### Step 3: Push to GitHub

```bash
# Initialize git (if not done)
git init
git add .
git commit -m "Initial commit"

# Connect to GitHub (replace with your URL)
git remote add origin https://github.com/YOUR-USERNAME/taskflow.git
git branch -M main
git push -u origin main
```

### Step 4: Enable GitHub Pages

1. Go to your repository on GitHub
2. Click **Settings**
3. Click **Pages** (left sidebar)
4. Under "Source", select **GitHub Actions**
5. Click **Save**

### Step 5: Deploy!

**Automatic** (Recommended):
```bash
# Just push to main branch
git push
```

**Manual**:
```bash
npm run deploy
```

---

## 🌐 Your Live URL

After deployment (takes 2-3 minutes):

```
https://YOUR-USERNAME.github.io/YOUR-REPO-NAME/
```

Example:
```
https://john.github.io/taskflow/
```

---

## ✅ Verification

### Check Deployment Status:

1. Go to your repository
2. Click **Actions** tab
3. See the deployment workflow
4. Wait for green checkmark ✅

### Test Your Site:

1. Open your GitHub Pages URL
2. Test login/features
3. Check PWA installation
4. Test on mobile

---

## 🔧 Commands

```bash
# Build for GitHub Pages
npm run build:github

# Deploy manually
npm run deploy

# Test locally before deploy
npm run build:github && npm run preview
```

---

## ⚠️ Common Issues

### Issue: 404 Page Not Found

**Fix**: Check base path in `vite.config.js`
```javascript
base: '/YOUR-REPO-NAME/'  // Must match exactly!
```

### Issue: Blank Page

**Fix**: Open browser console (F12)
- Check for errors
- Verify Supabase credentials
- Check Network tab for failed requests

### Issue: Deployment Failed

**Fix**: Check Actions tab
- Click on failed workflow
- Read error logs
- Fix issues and push again

---

## 📱 PWA on GitHub Pages

✅ **Works perfectly!**
- HTTPS enabled automatically
- Service Worker active
- Offline support working
- Install prompt available

---

## 🎯 Quick Reference

| Action | Command |
|--------|---------|
| Deploy (Auto) | `git push` |
| Deploy (Manual) | `npm run deploy` |
| Build | `npm run build:github` |
| Preview | `npm run preview` |
| Check Status | GitHub → Actions tab |

---

## 🎉 That's It!

Your TaskFlow is now live on GitHub Pages!

**Next time you want to deploy:**
```bash
git add .
git commit -m "Update"
git push
```

**Done!** ✨

---

## 📖 Full Guide

For detailed information, see: `GITHUB-PAGES-DEPLOYMENT.md`

---

**Your TaskFlow is ready for the world!** 🌍🚀

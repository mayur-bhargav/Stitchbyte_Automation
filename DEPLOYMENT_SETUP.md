# 🚀 Stitchbyte Automation - Deployment Configuration

## ✅ Completed Setup

### 1. **Backend API Configuration**
- **Production API URL:** `https://automationwhats.stitchbyte.in`
- **Environment Variable:** `NEXT_PUBLIC_API_BASE_URL` (set in `.env.local`)
- **Configuration File:** `src/app/config/backend.ts`

### 2. **Environment Files Created**
- ✅ `.env.local` - Local/production environment variables (not committed to git)
- ✅ `.env.example` - Template for environment variables (committed to git)

### 3. **Git Configuration**
- ✅ Removed large `demo-video.mp4` file from git history (118.93 MB)
- ✅ Added video files to `.gitignore`
- ✅ Created `public/DEMO_VIDEO_README.md` with setup instructions

### 4. **Code Updates**
- ✅ Updated `paymentService.ts` to use dynamic API URL
- ✅ Updated `broadcasts/page.tsx` to use dynamic API URL
- ✅ Updated `chats/page.tsx` to use dynamic API URL
- ✅ Added `getApiBaseUrl()` helper function in `backend.ts`

---

## 📋 Next Steps

### 1. **Update Environment Variables**

Edit `.env.local` and add your production values:

```env
# Backend API
NEXT_PUBLIC_API_BASE_URL=https://automationwhats.stitchbyte.in

# Payment Gateway Keys
NEXT_PUBLIC_RAZORPAY_KEY_ID=your_production_razorpay_key
NEXT_PUBLIC_STRIPE_PUBLIC_KEY=your_production_stripe_key
```

### 2. **Add Demo Video (Optional)**

The demo video is NOT included in the repository. To add it:

1. Place your video file: `public/demo-video.mp4`
2. Recommended: Keep file size under 50MB
3. See `public/DEMO_VIDEO_README.md` for optimization tips

### 3. **Update Remaining Files**

Some files may still have hardcoded `http://localhost:8000` URLs. To update them:

```bash
# Run from the Stitchbyte_Automation directory
chmod +x replace-urls.sh
./replace-urls.sh
```

Then manually add imports where needed:
```typescript
import { getApiBaseUrl } from '../config/backend';
```

### 4. **Deploy to Production**

#### Option A: Vercel (Recommended for Next.js)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
cd Stitchbyte_Automation
vercel

# Set environment variables in Vercel dashboard
# NEXT_PUBLIC_API_BASE_URL=https://automationwhats.stitchbyte.in
```

#### Option B: Manual Server Deployment
```bash
# Build the application
npm run build

# Start production server
npm start
```

### 5. **Backend Server Requirements**

Ensure your backend server (`https://automationwhats.stitchbyte.in`) has:
- ✅ CORS configured to allow your frontend domain
- ✅ SSL/HTTPS enabled
- ✅ All required API endpoints available
- ✅ Python dependencies installed (see `requirements.txt`)

---

## 🔧 Files Modified

### Configuration Files
- `src/app/config/backend.ts` - Added `getApiBaseUrl()` function
- `.env.local` - Created with production API URL
- `.env.example` - Created as template
- `.gitignore` - Added demo video exclusion

### Service Files
- `src/app/services/paymentService.ts` - Updated API calls
- `src/app/broadcasts/page.tsx` - Updated API calls
- `src/app/chats/page.tsx` - Updated API calls

### Documentation
- `public/DEMO_VIDEO_README.md` - Video setup instructions
- `replace-urls.sh` - Bulk URL replacement script

---

## 📝 Important Notes

### Security
- ⚠️ **Never commit `.env.local`** - It contains sensitive API keys
- ✅ `.env.example` is safe to commit (no actual keys)
- ✅ Use environment variables for all API URLs and keys

### Git Best Practices
- Large files (>100MB) cannot be pushed to GitHub
- Use `.gitignore` for large media files
- Consider using Git LFS for large assets if needed

### API URL Configuration
The app now uses:
- **Local Development:** `http://localhost:8000`
- **Production:** `https://automationwhats.stitchbyte.in`

Switch by changing `NEXT_PUBLIC_API_BASE_URL` in `.env.local`

---

## 🆘 Troubleshooting

### "Failed to fetch" errors
- ✅ Check if backend server is running at configured URL
- ✅ Verify CORS is properly configured on backend
- ✅ Check browser console for specific error messages

### Environment variables not working
- ✅ Restart Next.js dev server after changing `.env.local`
- ✅ Ensure variable name starts with `NEXT_PUBLIC_`
- ✅ Check that `.env.local` is in the root directory

### Git push still failing
- ✅ Verify demo video is in `.gitignore`
- ✅ Check file isn't staged: `git status`
- ✅ Clear git cache: `git rm --cached public/demo-video.mp4`

---

## 📞 Support

For issues or questions:
1. Check the error logs in browser console
2. Verify backend server is accessible
3. Review configuration in `src/app/config/backend.ts`
4. Check environment variables in `.env.local`

---

**Last Updated:** October 25, 2025
**Version:** 2.0.0

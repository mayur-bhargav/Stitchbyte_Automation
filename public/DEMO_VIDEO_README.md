# Demo Video Setup

## Important: Video File Not Included

The `demo-video.mp4` file is **not included** in the repository due to its large size (>100MB exceeds GitHub's limit).

## How to Add Your Demo Video

1. **Place your demo video** in this folder (`/public/`) with the name `demo-video.mp4`
2. **Recommended video specifications:**
   - **Format:** MP4 (H.264 codec)
   - **Resolution:** 1920x1080 (Full HD) or 1280x720 (HD)
   - **File size:** Under 50MB for better performance
   - **Duration:** 1-3 minutes

## Video Optimization Tips

If your video is too large, use these tools to compress it:

### Option 1: HandBrake (Free, Cross-platform)
1. Download from https://handbrake.fr/
2. Open your video file
3. Use "Fast 1080p30" or "Fast 720p30" preset
4. Click "Start Encode"

### Option 2: FFmpeg (Command line)
```bash
# Compress video to ~10MB
ffmpeg -i input.mp4 -vcodec h264 -crf 28 -preset fast -vf scale=1280:720 public/demo-video.mp4
```

### Option 3: Online Tools
- CloudConvert: https://cloudconvert.com/
- Online-Convert: https://www.online-convert.com/

## Creating a Thumbnail (Optional)

The landing page also looks for `demo-thumbnail.jpg`. To create one:

```bash
# Extract frame at 5 seconds
ffmpeg -i public/demo-video.mp4 -ss 00:00:05 -vframes 1 public/demo-thumbnail.jpg
```

## Alternative: Host Video Externally

Instead of including the video file, you can:
1. Upload to YouTube/Vimeo
2. Get the embed URL
3. Update the video modal component to use the external URL

## File Locations

- **Video:** `public/demo-video.mp4` (add this file)
- **Thumbnail:** `public/demo-thumbnail.jpg` (optional)
- **Component:** `src/app/page.tsx` (VideoModal component)

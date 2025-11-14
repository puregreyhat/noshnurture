# 📱 Camera Permission Setup - Android & iOS

## Problem Fixed

**Error:** "Cannot read properties of undefined (reading 'getUserMedia')"

**Cause:** `navigator.mediaDevices` was not available on Android/iOS, or permission was not requested properly.

**Solution:** Added comprehensive browser detection, fallback constraints, and user-friendly error messages.

---

## Android Setup

### Step 1: Grant Camera Permission

When you click **"Start Scanning"**, your browser will show a permission prompt:

```
NoshNurture wants to access your camera
[Allow]  [Deny]
```

✅ **Tap "Allow"** to grant camera access.

### Step 2: If Permission is Already Denied

If you previously denied camera permission, follow these steps:

1. **Open Settings** on your Android phone
2. **Search for "NoshNurture"** or scroll to find the app
3. **Tap App Info**
4. **Select "Permissions"**
5. **Find "Camera"** and toggle it **ON** (green)
6. **Go back** to the app and try again

### Step 3: Verify Camera Works

- You should see a **live video feed** in the modal
- The **corner guides** (amber/blue) should be visible
- The video should update in real-time

### Troubleshooting Android

| Issue | Solution |
|-------|----------|
| **No permission popup** | Browser might have camera disabled. Check browser settings → Permissions → Camera |
| **Camera shows black** | Wait 2-3 seconds for camera to initialize |
| **"Camera already in use"** | Close other apps using camera (video call, other apps) |
| **Permission still denied** | Uninstall and reinstall the app |
| **HTTPS required warning** | The app is running on localhost:3000, which is OK for development |

---

## iOS / Safari Setup

### Step 1: Grant Camera Permission

When you click **"Start Scanning"**, Safari will show a permission prompt:

```
Allow "NoshNurture" to access your camera?
[Don't Allow]  [Allow]
```

✅ **Tap "Allow"** to grant camera access.

### Step 2: If Permission is Already Denied

If you previously denied camera permission:

1. **Open Settings** on your iPhone
2. **Scroll down** and find **Safari**
3. **Tap Camera** and select **"Ask"** or **"Allow"**
4. **Go back** to Safari and refresh the page
5. Click **"Start Scanning"** again

### Step 3: Verify Camera Works

- You should see a **live video feed** in the modal
- The **corner guides** should be visible
- Video should be clear and real-time

### Troubleshooting iOS

| Issue | Solution |
|-------|----------|
| **No permission popup** | Safari permissions might be restricted. Check Settings → Screen Time → Restrictions |
| **Camera shows black** | Wait 3-5 seconds for camera to initialize (iOS is slower) |
| **"Not allowed" error** | Grant permission again in Settings → Safari → Camera |
| **Camera very slow** | This is normal on older iPhones. Try taking the photo anyway |
| **Landscape mode issues** | Rotate phone to portrait mode for best results |

---

## Technical Details

### What Changed

The improved `startCamera()` function now:

1. **Checks if API exists** - Verifies `navigator.mediaDevices` is available
2. **Detects browser type** - Works on Chrome, Safari, Firefox, Edge
3. **Requests permission** - Shows native permission popup on Android/iOS
4. **Handles errors gracefully** - Provides specific error messages
5. **Fallback constraints** - Uses basic constraints if advanced ones fail
6. **Delay before setting active** - Gives video stream time to start

### Browser Compatibility

| Browser | Android | iOS | Desktop |
|---------|---------|-----|---------|
| **Chrome** | ✅ Full | ✅ Limited | ✅ Full |
| **Safari** | N/A | ✅ Full | ⚠️ Partial |
| **Firefox** | ✅ Full | N/A | ✅ Full |
| **Edge** | ✅ Full | N/A | ✅ Full |

### Permission Popup Behavior

**First Time:**
- App requests permission
- Native OS dialog shows
- User taps "Allow" or "Deny"
- Browser remembers choice

**Subsequent Times:**
- Permission is cached
- No popup shown
- Camera access works immediately (if previously allowed)

### Why HTTPS or Localhost?

Web browsers restrict camera access to:
- ✅ HTTPS connections (secure)
- ✅ localhost (development only)
- ❌ HTTP (insecure - not allowed)

For production deployment, your app must use HTTPS.

---

## Error Messages Guide

### "Camera not supported on this device"
- Device doesn't have camera hardware
- **Solution:** Use gallery upload instead

### "Camera permission denied"
- User tapped "Deny" on permission popup
- **Solution:** Grant permission in Settings (see steps above)

### "No camera found on this device"
- Device has no camera
- **Solution:** Use gallery upload instead

### "Camera is already in use"
- Another app is using the camera
- **Solution:** Close other apps (video call, Snapchat, etc.)

### "Unable to access camera"
- Network issue or browser restriction
- **Solution:** Ensure you're on localhost/HTTPS, not HTTP

---

## Step-by-Step: First Time Setup

### On Android

```
1. Open NoshNurture app in browser
2. Navigate to Scanner page
3. Click "Scan Label" button (blue 📸)
4. Click "Start Scanning" button
   ↓
   [PERMISSION POPUP APPEARS]
   "NoshNurture wants to access your camera"
   [Allow]  [Deny]
   ↓
5. Tap "Allow"
6. Wait 2-3 seconds
7. Camera feed should appear
8. Frame your product
9. Click "Capture Front"
```

### On iOS (Safari)

```
1. Open NoshNurture app in Safari
2. Navigate to Scanner page
3. Click "Scan Label" button (blue 📸)
4. Click "Start Scanning" button
   ↓
   [PERMISSION POPUP APPEARS]
   "Allow "NoshNurture" to access your camera?"
   [Don't Allow]  [Allow]
   ↓
5. Tap "Allow"
6. Wait 3-5 seconds (iOS is slower)
7. Camera feed should appear
8. Frame your product
9. Click "Capture Front"
```

---

## Testing the Camera

### Test 1: Permission Request
- ✅ Click "Start Scanning"
- ✅ Permission popup appears
- ✅ Tap "Allow"
- ✅ No error message shown

### Test 2: Camera Feed
- ✅ Video feed appears after permission
- ✅ Feed shows real-time video (not frozen)
- ✅ Corners have amber/blue guides
- ✅ Can see yourself or objects through camera

### Test 3: Camera Capture
- ✅ Click "Capture Front"
- ✅ Image is captured (not blurry)
- ✅ Preview shows the captured image
- ✅ Can "Confirm" or "Retake"

### Test 4: Error Handling
- ✅ If denied, error message appears
- ✅ User can switch to gallery mode
- ✅ App doesn't crash

---

## FAQ

### Q: Why do I see a black screen?
**A:** The camera is initializing. Wait 2-3 seconds. If it's still black, check if you granted camera permission.

### Q: Can I revoke camera permission?
**A:** Yes, anytime:
- **Android:** Settings → Apps → NoshNurture → Permissions → Camera OFF
- **iOS:** Settings → Safari → Camera → Select "Ask" or deny for specific sites

### Q: Will the app work without camera?
**A:** Yes! You can always use **"Choose from Gallery"** to upload photos instead.

### Q: Is my camera data safe?
**A:** Yes! The camera feed only exists in your browser. We don't store or transmit the video stream—only the captured images are sent to the AI.

### Q: What if camera permission is broken?
**A:** 
1. Close all browser tabs
2. Close the browser completely
3. Reopen the app
4. Try again

### Q: Can I use this on a tablet?
**A:** Yes! Tablets work with both front and back cameras. Use the back camera for better results.

---

## Production Deployment

When deploying to production:

1. **Use HTTPS** - All production sites must use HTTPS
2. **Update manifests** - Add camera permission to app manifest
3. **Test on devices** - Test camera on Android and iOS devices
4. **Consider PWA** - Install as Progressive Web App for better permissions

Example PWA manifest (`public/manifest.json`):
```json
{
  "name": "NoshNurture",
  "short_name": "NoshNurture",
  "permissions": ["camera"],
  "scope": "/",
  "start_url": "/",
  "display": "standalone"
}
```

---

## Debug Commands

In browser DevTools console:

```javascript
// Check if camera API available
console.log('Camera API available:', !!navigator.mediaDevices?.getUserMedia);

// List all cameras
navigator.mediaDevices.enumerateDevices()
  .then(devices => {
    devices.forEach(device => console.log(device.kind, device.label));
  });

// Test camera directly
navigator.mediaDevices.getUserMedia({ video: true })
  .then(stream => {
    console.log('✅ Camera working!');
    stream.getTracks().forEach(track => track.stop());
  })
  .catch(err => console.error('❌ Camera error:', err));
```

---

## Still Having Issues?

**Check these:**
1. ✅ Camera permission is granted in Settings
2. ✅ No other app is using the camera
3. ✅ Browser is up-to-date
4. ✅ Device has sufficient storage
5. ✅ You're on localhost or HTTPS (not HTTP)
6. ✅ Try a different browser
7. ✅ Restart the device

**If still stuck:**
- Use **"Choose from Gallery"** instead (always works)
- Take photos with your camera app and upload them
- Upload multiple images for better accuracy

---

**Last Updated:** November 14, 2025
**Component:** `src/components/OCRScanner.tsx`
**Version:** 2.1 (Android/iOS Camera Support)

# Native Application Conversion Plan

## Current Stack Analysis
- **Framework**: Next.js 15.5.6 (React 19)
- **Auth**: Supabase Auth (OAuth, Email/Password)
- **Database**: Supabase PostgreSQL
- **APIs**: Web Speech API, MediaDevices API (Camera)
- **Build**: Next.js with Turbopack

## Recommended Approach: **Tauri** (Best for your use case)

### Why Tauri over Electron or React Native?

| Feature | Tauri | Electron | React Native |
|---------|-------|----------|--------------|
| Bundle Size | ~3-5 MB | ~100-150 MB | ~30-50 MB |
| Memory Usage | Low (uses system WebView) | High (bundles Chromium) | Medium |
| Web Code Reuse | 95%+ | 95%+ | 60-70% |
| Camera/Mic APIs | ✅ Native + Web APIs | ✅ Web APIs work | ⚠️ Needs native modules |
| OAuth Support | ✅ Deep linking | ✅ Works | ⚠️ Requires setup |
| Desktop Support | ✅ Win/Mac/Linux | ✅ Win/Mac/Linux | ❌ Mobile only |
| Development | Rust + Web | JavaScript | React Native |

**Verdict**: Tauri is perfect because:
- You can keep 95% of your Next.js code
- Small binary size (~3-5 MB vs 100+ MB Electron)
- Native performance
- Works with all your existing APIs

---

## 🚨 Problems to Solve

### 1. **OAuth Authentication Issues**

#### Problem:
```typescript
// Browser OAuth works with redirects
supabase.auth.signInWithOAuth({ provider: 'google' })
// ❌ In desktop app: Opens browser, redirects to http://localhost:3000
// App doesn't capture the callback
```

#### Solutions:

**Option A: Custom URL Scheme (Recommended)**
```typescript
// In Tauri app
const { invoke } = require('@tauri-apps/api/tauri');

// 1. Register custom protocol: noshnurture://
// 2. Configure Supabase OAuth redirect
async function signInWithGoogle() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: 'noshnurture://auth/callback' // Custom scheme
    }
  });
}

// 3. Handle callback in Tauri
// src-tauri/src/main.rs
tauri::Builder::default()
  .register_uri_scheme_protocol("noshnurture", |_app, request| {
    // Parse callback and send to frontend
  })
```

**Option B: Localhost Server**
```typescript
// Start local server on random port
const server = http.createServer((req, res) => {
  if (req.url.startsWith('/auth/callback')) {
    const params = new URLSearchParams(req.url.split('?')[1]);
    const access_token = params.get('access_token');
    // Send to renderer process
    window.postMessage({ type: 'AUTH_SUCCESS', access_token });
  }
});
```

**Option C: Email Magic Link (Fallback)**
```typescript
// No OAuth needed - simpler for desktop
await supabase.auth.signInWithOtp({
  email: 'user@example.com'
});
```

---

### 2. **Camera & Microphone Permissions**

#### Problem:
```typescript
// Web browser: Shows permission prompt
navigator.mediaDevices.getUserMedia({ video: true })

// Desktop app: Needs OS-level permissions
// - macOS: Info.plist entries
// - Windows: Manifest entries
```

#### Solution:

**A. Update Tauri Configuration**
```json
// src-tauri/tauri.conf.json
{
  "tauri": {
    "allowlist": {
      "all": false,
      "shell": {
        "open": true
      },
      "window": {
        "all": true
      },
      "fs": {
        "readFile": true,
        "writeFile": true,
        "scope": ["$APPDATA/*"]
      },
      "dialog": {
        "all": true
      },
      "http": {
        "all": true,
        "scope": ["https://*", "http://localhost:*"]
      }
    },
    "bundle": {
      "macOS": {
        "entitlements": "entitlements.plist"
      }
    }
  }
}
```

**B. Create macOS entitlements.plist**
```xml
<!-- src-tauri/entitlements.plist -->
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>com.apple.security.device.camera</key>
  <true/>
  <key>com.apple.security.device.microphone</key>
  <true/>
  <key>com.apple.security.network.client</key>
  <true/>
</dict>
</plist>
```

**C. Update Info.plist for macOS**
```xml
<!-- Add to bundle resources -->
<key>NSCameraUsageDescription</key>
<string>NoshNurture needs camera access to scan product labels</string>
<key>NSMicrophoneUsageDescription</key>
<string>NoshNurture needs microphone access for voice input</string>
```

**D. Windows Manifest**
```xml
<!-- src-tauri/resources/app.manifest -->
<assembly>
  <trustInfo>
    <security>
      <requestedPrivileges>
        <requestedExecutionLevel level="asInvoker" />
      </requestedPrivileges>
    </security>
  </trustInfo>
</assembly>
```

---

### 3. **Web APIs Compatibility**

#### Speech Recognition API

**Problem**: `SpeechRecognition` not available in native WebView

**Solution**: Use Tauri plugin or fallback
```typescript
// src/lib/speech-recognition.ts
export async function initSpeechRecognition() {
  // Check if native Web Speech API is available
  const SpeechRecognition = window.SpeechRecognition || (window as any).webkitSpeechRecognition;
  
  if (SpeechRecognition) {
    return new SpeechRecognition();
  }
  
  // Fallback: Use Tauri plugin for speech
  const { invoke } = await import('@tauri-apps/api/tauri');
  return {
    start: () => invoke('start_speech_recognition'),
    stop: () => invoke('stop_speech_recognition'),
    onresult: null
  };
}
```

#### Camera Access

**No changes needed** - `navigator.mediaDevices.getUserMedia()` works in Tauri's WebView with proper permissions.

---

### 4. **File System Access**

#### Problem:
Web apps use browser storage (localStorage, IndexedDB).
Desktop apps can use native file system.

**Solution**: Create storage abstraction
```typescript
// src/lib/storage.ts
import { invoke } from '@tauri-apps/api/tauri';

export const storage = {
  async get(key: string) {
    if (typeof window !== 'undefined' && window.__TAURI__) {
      // Desktop app - use Tauri fs
      return invoke('read_config', { key });
    } else {
      // Web - use localStorage
      return localStorage.getItem(key);
    }
  },
  
  async set(key: string, value: string) {
    if (typeof window !== 'undefined' && window.__TAURI__) {
      return invoke('write_config', { key, value });
    } else {
      localStorage.setItem(key, value);
    }
  }
};
```

---

### 5. **Network Requests & CORS**

#### Problem:
Desktop apps may face CORS issues with Supabase API.

**Solution**: Proxy through Tauri backend
```rust
// src-tauri/src/main.rs
#[tauri::command]
async fn api_request(url: String, method: String, body: Option<String>) -> Result<String, String> {
    let client = reqwest::Client::new();
    let mut request = match method.as_str() {
        "GET" => client.get(&url),
        "POST" => client.post(&url),
        _ => return Err("Invalid method".to_string()),
    };
    
    if let Some(b) = body {
        request = request.body(b);
    }
    
    let response = request.send().await.map_err(|e| e.to_string())?;
    let text = response.text().await.map_err(|e| e.to_string())?;
    Ok(text)
}
```

---

## 📋 Step-by-Step Conversion Process

### Phase 1: Setup Tauri (Week 1)

```bash
# 1. Install Tauri CLI
npm install --save-dev @tauri-apps/cli

# 2. Initialize Tauri
npm install @tauri-apps/api
npx tauri init

# Answer prompts:
# - App name: NoshNurture
# - Window title: NoshNurture
# - Web assets: ../out (Next.js export)
# - Dev server: http://localhost:3000
# - Before dev command: npm run dev
# - Before build command: npm run build && npm run export
```

**Update package.json:**
```json
{
  "scripts": {
    "dev": "next dev --turbopack",
    "build": "next build --turbopack",
    "export": "next export",
    "tauri": "tauri",
    "tauri:dev": "tauri dev",
    "tauri:build": "tauri build"
  }
}
```

**Update next.config.ts for static export:**
```typescript
const nextConfig = {
  output: 'export', // Enable static HTML export
  images: {
    unoptimized: true // Required for static export
  },
  // ... rest of config
};
```

---

### Phase 2: Fix Authentication (Week 1-2)

**File: `src/lib/auth/oauth-handler.ts`**
```typescript
export async function handleOAuthSignIn(provider: 'google' | 'github') {
  const isDesktop = window.__TAURI__ !== undefined;
  
  if (isDesktop) {
    // Desktop: Use custom URL scheme
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: 'noshnurture://auth/callback',
        skipBrowserRedirect: false
      }
    });
  } else {
    // Web: Normal OAuth
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    });
  }
}
```

**Configure Supabase Redirect URLs:**
1. Go to Supabase Dashboard → Authentication → URL Configuration
2. Add: `noshnurture://auth/callback`
3. Add: `http://localhost:3000/auth/callback`

---

### Phase 3: Handle Permissions (Week 2)

**Create permission checker:**
```typescript
// src/lib/permissions.ts
export async function requestCameraPermission() {
  if (window.__TAURI__) {
    // Desktop - permissions handled by entitlements
    return true;
  }
  
  // Web - request permission
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    stream.getTracks().forEach(track => track.stop());
    return true;
  } catch {
    return false;
  }
}

export async function requestMicPermission() {
  // Similar implementation
}
```

---

### Phase 4: Test & Polish (Week 3)

**Checklist:**
- ✅ OAuth login works (Google)
- ✅ Camera scanning works
- ✅ Voice input works
- ✅ All API calls succeed
- ✅ Data persists correctly
- ✅ App icon and branding
- ✅ Auto-update mechanism

---

## 🎯 Alternative: Progressive Web App (PWA)

If you want to avoid native builds:

```bash
npm install next-pwa
```

**Benefits:**
- Works on mobile (installable)
- No app store approval needed
- Offline support
- Push notifications
- All Web APIs work

**Limitations:**
- Still needs browser (not true native)
- Limited OS integration

---

## 📦 Build Outputs

After running `npm run tauri:build`:

```
src-tauri/target/release/bundle/
├── macos/
│   └── NoshNurture.app (3-5 MB)
├── windows/
│   └── NoshNurture.exe (3-5 MB)
└── linux/
    └── noshnurture.AppImage (3-5 MB)
```

---

## 🔑 Key Files to Create/Modify

### New Files:
```
src-tauri/
├── Cargo.toml
├── tauri.conf.json
├── src/main.rs
├── entitlements.plist (macOS)
└── icons/ (app icons)

src/lib/
├── auth/oauth-handler.ts (OAuth wrapper)
├── permissions.ts (Permission checker)
└── storage.ts (Storage abstraction)
```

### Modified Files:
```
next.config.ts (add output: 'export')
package.json (add Tauri scripts)
src/lib/supabase/client.ts (detect desktop mode)
```

---

## 🚀 Quick Start Commands

```bash
# 1. Install Tauri
npm install --save-dev @tauri-apps/cli
npm install @tauri-apps/api

# 2. Initialize
npx tauri init

# 3. Run in dev mode
npm run tauri:dev

# 4. Build for production
npm run tauri:build
```

---

## 💡 Recommended Next Steps

1. **Start with Tauri setup** (1-2 hours)
2. **Fix OAuth first** - most critical (1-2 days)
3. **Test camera/mic** - should work out of box (2-3 hours)
4. **Test on all platforms** (1 day)
5. **Create installer** (2-3 hours)

Would you like me to start implementing Tauri setup?

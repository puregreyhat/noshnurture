# 🚀 Translation - FREE & Easy Setup

## The Simplest Way to Get Started

### One-Time Setup (2 minutes)

1. **Install Docker** (if not already installed)
   - Go to https://www.docker.com/products/docker-desktop/
   - Download and install

2. **Start translation server**
   ```bash
   cd /Users/akash/Desktop/EDI\ Project/nosh
   docker-compose up
   ```
   
   Wait for: `Listening on 0.0.0.0:5000` ✅

3. **In another terminal, start your app**
   ```bash
   npm run dev
   ```

### Test It (10 seconds)
1. Open http://localhost:3000
2. Click on a recipe
3. Click the language selector (top right)
4. Select any language → Watch recipe instructions translate! 🎉

---

## That's It! 

**Cost:** $0  
**Time:** 2 minutes  
**Features:** All 8 Indian languages  

### Commands to Remember
```bash
docker-compose up           # Start translation server
docker-compose down         # Stop translation server
npm run dev                 # Start app (separate terminal)
```

---

## Troubleshooting

**Q: I see "Connection refused"**  
A: Make sure you ran `docker-compose up` first and waited for the "Listening" message

**Q: Translations aren't showing**  
A: Check browser console for errors. Restart both docker and npm.

**Q: Docker not installed**  
A: Download from https://www.docker.com/products/docker-desktop/

---

For detailed setup, see: `LIBRETRANSLATE_FREE_SETUP.md`

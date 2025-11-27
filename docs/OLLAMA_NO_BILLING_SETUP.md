# 🚀 Ollama - FREE Translation (No Billing!)

## What is Ollama?
Free AI that runs on your computer. No internet needed, no APIs, no billing.

---

## Setup (5 minutes)

### Step 1: Download Ollama
Go to https://ollama.ai and download for your OS:
- Mac: Click "Download"
- Windows: Click "Download"
- Linux: See instructions

Install like any other app.

### Step 2: Start Ollama Server
Open Terminal and run:
```bash
ollama serve
```

Wait for this message:
```
Listening on 127.0.0.1:11434
```

✅ Now you have a local translation server running!

### Step 3: Download Translation Model
Open a NEW terminal (keep the first one running) and run:
```bash
ollama pull mistral
```

This downloads a fast AI model (~4GB). Takes 2-5 minutes depending on your internet.

### Step 4: Test Ollama
```bash
curl http://localhost:11434/api/generate -X POST -H "Content-Type: application/json" \
  -d '{"model":"mistral","prompt":"What is 2+2?"}'
```

If you see a response, ✅ you're good!

### Step 5: Start Your App (NEW terminal)
```bash
cd /Users/akash/Desktop/EDI\ Project/nosh
npm run dev
```

### Step 6: Test Translation
1. Open http://localhost:3000
2. Click on recipe
3. Click language selector
4. Select Hindi/Marathi
5. Watch it translate! 🎉

---

## That's It!

Now you have:
- ✅ Ingredient translation (free, offline)
- ✅ UI translation (free, offline)
- ✅ Recipe instruction translation (free, offline)

**Cost:** $0  
**Data:** Stays on your computer  
**Billing:** None required  

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| "Connection refused" | Run `ollama serve` first |
| Translations very slow | First load is normal (5-10s), wait |
| Ollama not installed | Download from ollama.ai |
| Model download failed | Check internet connection |
| Port 11434 in use | Change in `.env.local`: `NEXT_PUBLIC_OLLAMA_URL=http://localhost:11435` |

---

## Commands Reference

```bash
# Start server (Terminal 1)
ollama serve

# Download model (Terminal 2)
ollama pull mistral

# List available models
ollama list

# Start app (Terminal 3)
npm run dev

# View logs
ollama logs
```

---

## What's Happening

```
1. You type: "Cook the rice"
2. Browser sends to Ollama (localhost)
3. Ollama runs AI model locally
4. Returns: "चावल पकाएं" (Hindi)
5. Displayed on screen ✅
```

Everything happens on your computer. No data sent anywhere. ✅

---

## Performance

**First translation:** 5-10 seconds (model warming up)  
**Cached translations:** <100ms (instant)  
**Memory usage:** ~3GB for model + app  
**CPU:** 1-2 cores while translating  

After first use, things get fast! 🚀

---

## Models Available

You can use other models too:
```bash
ollama pull llama2          # Better quality
ollama pull neural-chat     # Faster
ollama pull starling-lm     # Very good
```

Edit `src/lib/translate.ts` to change the model name.

---

## Supported Languages

Ollama supports all languages including:
- 🇮🇳 हिंदी Hindi
- 🇮🇳 मराठी Marathi
- 🇮🇳 தமிழ் Tamil
- 🇮🇳 తెలుగు Telugu
- 🇮🇳 ಕನ್ನಡ Kannada
- 🇮🇳 ગુજરાતી Gujarati
- 🇧🇩 বাংলা Bengali

And 100+ more!

---

## Upgrading Your Setup

Want faster translations?
1. Get a GPU (NVIDIA with CUDA)
2. Ollama will use it automatically
3. Translations become 10x faster!

---

## Getting Help

- Ollama docs: https://ollama.ai
- Models: https://ollama.ai/library
- Issues: https://github.com/ollama/ollama/issues

---

## Summary

```
1. Download Ollama from ollama.ai
2. Run: ollama serve
3. Run: ollama pull mistral
4. Run: npm run dev
5. Done! Full translations, no billing ✅
```

That's it! Enjoy free translation! 🎉

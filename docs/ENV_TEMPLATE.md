# Environment Variables Template
# Copy this file to .env.local and fill in your values

# ===== Gemini AI Configuration =====
# Get your API key from: https://aistudio.google.com/app/apikeys
# IMPORTANT: This key will be exposed to the browser (NEXT_PUBLIC_ prefix)
# For production, move to backend and create API routes instead
NEXT_PUBLIC_GEMINI_API_KEY=your_gemini_api_key_here

# ===== Optional: Backend Configuration =====
# If using backend for API calls (recommended for production)
# GEMINI_API_KEY=your_gemini_api_key_here

# ===== Optional: Supabase Configuration =====
# For family sharing and multi-user features
# NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
# NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# ===== Optional: Notification Service =====
# For push notifications
# NEXT_PUBLIC_NOTIFICATION_SERVICE_KEY=your_service_key

# ===== Email Service (Resend) =====
# For expiry reminder emails
# Get your API key from: https://resend.com/api-keys
RESEND_API_KEY=your_resend_api_key_here

# ===== Cron Job Security =====
# Secret for protecting cron endpoints (generate a random string)
CRON_SECRET=your_random_secret_string_here

# ===== Supabase Service Role Key =====
# For admin operations (cron jobs, etc.)
# Get from: Supabase Dashboard → Settings → API
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here

# ===== V-Kart Integration =====
# For order syncing
VKART_BASE_URL=https://v-it.netlify.app
VKART_API_KEY=optional_key_if_needed

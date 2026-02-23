import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Configuration
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

export async function POST(request: Request) {
    try {
        // 1. Authenticate the ESP32 (or user)
        // The ESP32 sends a Bearer token. You can validate this against your user DB.
        // For now, we will use the Authorization header as a simple check or fetch a generic user
        const authHeader = request.headers.get('Authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized ESP32 Device' }, { status: 401 });
        }
        const token = authHeader.split(' ')[1]; // E.g. "TEST_TOKEN_OR_USER_ID"

        // 2. Parse the Input (from HTTP body)
        let bodyText = '';
        const contentType = request.headers.get('Content-Type') || '';

        if (contentType.includes('application/json')) {
            const json = await request.json();
            bodyText = json.text || '';
        } else {
            // If it's raw text or binary (like from ESP32 streaming)
            bodyText = await request.text();
        }

        if (!bodyText || bodyText === 'simulate_audio_payload_or_text') {
            // Fallback for the ESP32 simulation
            bodyText = "What do I have in my inventory?";
        }

        // Since we need to use the user's Supabase session to get inventory data,
        // we assume the token is the user ID or we bypass auth for the specific user
        // For standard NoshNurture, we use the server client
        const supabase = await createClient();

        // Attempt real auth if cookies are present, otherwise fallback to the token as userId
        const { data: { user } } = await supabase.auth.getUser();
        const userId = user?.id || (token !== 'TEST_TOKEN_OR_USER_ID' ? token : null);

        if (!userId && !user) {
            // In a real device you'd link the device to a user in Supabase and fetch the linked user ID.
            // We will proceed but the query might fail if it relies heavily on user ID.
            console.warn("HeyNosh Warn: No authenticated user found. Data may be empty.");
        }

        // 3. Determine the Intent deterministically
        const q = String(bodyText || '').trim().toLowerCase();
        const has = (phrases: string[]) => phrases.some((p) => q.includes(p));

        const weekPhrases = ['this week', 'next 7 days', 'go bad this week', 'expiring this week'];
        const cookTodayPhrases = ['cook today', "today's meal", 'make today', 'today', 'whip up today', 'prepare for today'];

        let intentData = { intent: 'smalltalk', parameters: {} };

        if ((has(['expire', 'expiring', 'expiry', 'go bad', 'expired']) && has(weekPhrases)) || has(['expiring this week', 'go bad this week']) || has(['already expired', 'are expired'])) {
            intentData = { intent: 'get_expiring_items', parameters: { days: 7, timeframe: 'this_week' } as any };
        } else if (
            has(['what can i cook', 'suggest a dish', 'recipe ideas', 'what should i prepare', 'what can i make', 'recipes can i make']) ||
            has(cookTodayPhrases) ||
            (has(['recipe', 'recipes']) && has(['make', 'cook', 'prepare', 'can']))
        ) {
            intentData = { intent: 'get_makeable_recipes', parameters: { timeframe: 'today' } };
        } else if (has(['inventory', 'what do i have', 'what i have', 'how much', 'how many', 'do i have', 'is there any', 'are there any'])) {
            intentData = { intent: 'get_inventory', parameters: {} };
        }

        console.log("HeyNosh Route -> Resolved Intent directly:", intentData);

        // 4. Fetch the data based on intent directly using Service Role to bypass browser cookies
        // We must import the raw client to use the service key
        const { createClient: createSupabaseClient } = await import('@supabase/supabase-js');
        const supabaseService = createSupabaseClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        let rawContext: any = null;

        if (intentData.intent === 'get_inventory' || intentData.intent === 'get_expiring_items') {
            // For the sake of the IoT demo, if we don't have a reliable userId from a cookie, 
            // we will just fetch the first few items from the database. 
            // In a real production app, the ESP32 Bearer token would map to a specific user.

            let query = supabaseService.from('inventory_items').select('product_name, quantity, unit, expiry_date').eq('is_consumed', false);

            // If the user provided a real token (not our simulation token), use it to filter
            // In a real device you'd link the ESP32 token to their user_id. 
            // For now, if the token is passed, use it. Otherwise, return all to simulate hardware logic.
            if (userId && userId !== 'test_token_simulation') {
                query = query.eq('user_id', userId);
            }

            const { data, error } = await query;

            if (error) {
                console.error("Supabase Admin Fetch Error:", error);
            }
            rawContext = data || [];
        } else if (intentData.intent === 'get_makeable_recipes') {
            // Bypass user auth cookies for the ESP32 and fetch from the global recipe API
            try {
                const SUGRAN = process.env.SUGRAN_URL || process.env.RECIPES_SITE_URL || 'https://sugran.vercel.app';
                const sugranUrl = `${SUGRAN.replace(/\/$/, '')}/api/recipes?limit=5`;

                const recipeRes = await fetch(sugranUrl);
                if (recipeRes.ok) {
                    const recipeData = await recipeRes.json();

                    // Filter down to just the titles so we don't overwhelm Gemini tokens
                    rawContext = (recipeData.results || []).map((r: any) => ({
                        title: r.name || r.title,
                        cuisine: r.cuisine || "Various",
                        ingredients: (r.ingredients || []).map((i: any) => typeof i === 'string' ? i : i.name).slice(0, 3)
                    }));
                } else {
                    rawContext = "Could not fetch recipes at this time.";
                }
            } catch (err) {
                rawContext = "Error fetching recipes.";
            }

        } else {
            // Fallback to calling the query endpoint for other complex intents if needed
            // This might fail for ESP32 without cookies, but covers smalltalk
            const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
            const queryRes = await fetch(`${siteUrl}/api/voice-assistant/query`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'cookie': request.headers.get('cookie') || ''
                },
                body: JSON.stringify(intentData)
            });
            const queryData = await queryRes.json();
            rawContext = queryData.data;
        }

        console.log("HeyNosh - Raw DB Context fetched:", JSON.stringify(rawContext, null, 2));

        // 5. Generate a conversational response using Gemini AI
        if (!GEMINI_API_KEY) {
            // Fallback if no AI key is found
            let fallbackResponse = "I found some info, but I'm currently unable to speak playfully without my AI key.";
            if (intentData.intent === 'get_inventory') {
                fallbackResponse = `You have ${rawContext?.length || 0} items in your inventory.`;
            }
            return NextResponse.json({
                response: fallbackResponse,
                data: rawContext
            });
        }

        const systemPrompt = `You are HeyNosh, a friendly, witty, and concise smart kitchen assistant for the app NoshNurture. 
Response Guidelines:
- Keep it under 2 sentences so it's easy to listen to.
- Use the provided 'Data found in DB' to answer the query accurately. 
- The current date is ${new Date().toDateString()}. Use this to determine if items are already expired or nearing expiration!
- If the intent is 'get_inventory', and the user asks about a specific item, explicitly state if it is found, its quantity, and MOST IMPORTANTLY: check its 'expiry_date' against the current date and explicitly tell the user if it is expired. If it's a general query, briefly summarize the items found.
- If the intent is 'get_makeable_recipes', you MUST name 1 or 2 of the specific dish titles found in the data (e.g., "You can make Butter Chicken or Paneer Tikka!").
- Add a tiny bit of personality (like a lighthearted culinary remark about cooking).
- Output ONLY the spoken text, without markdown, emojis, or formatting.`;

        const promptText = `User Query: "${bodyText}"
Determined Intent: ${intentData.intent}
Data found in DB: ${JSON.stringify(rawContext)}

Generate the voice response:`;

        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;
        let finalSpokenText = "Sorry, I couldn't process that request right now.";

        try {
            const aiRes = await fetch(geminiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{
                        role: "user",
                        parts: [{ text: `${systemPrompt}\n\n${promptText}` }]
                    }],
                    generationConfig: {
                        temperature: 0.7,
                        maxOutputTokens: 800
                    }
                })
            });

            if (!aiRes.ok) {
                console.warn(`[HeyNosh] Gemini Error: ${aiRes.statusText}. Attempting fallback...`);
                throw new Error(`Gemini API Error: ${aiRes.statusText}`);
            }

            const aiData = await aiRes.json();
            finalSpokenText = aiData?.candidates?.[0]?.content?.parts?.[0]?.text || finalSpokenText;

        } catch (geminiError) {
            // Fallback to OpenRouter (Llama-3) if Gemini fails (e.g. 429 Too Many Requests)
            const openRouterKey = process.env.OPENROUTER_API_KEY;

            if (openRouterKey) {
                console.log("[HeyNosh] Falling back to OpenRouter free models...");

                const freeModels = [
                    "google/gemma-3-12b-it:free",
                    "google/gemma-3n-e4b-it:free",
                    "meta-llama/llama-3.2-3b-instruct:free",
                    "qwen/qwen3-next-80b-a3b-instruct:free"
                ];

                let orSuccess = false;

                for (const modelId of freeModels) {
                    try {
                        console.log(`[HeyNosh] Trying OpenRouter model: ${modelId}`);
                        const orRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                            method: 'POST',
                            headers: {
                                'Authorization': `Bearer ${openRouterKey}`,
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({
                                model: modelId,
                                messages: [
                                    { role: "user", content: `${systemPrompt}\n\n${promptText}` }
                                ]
                            })
                        });

                        if (orRes.ok) {
                            const orData = await orRes.json();
                            finalSpokenText = orData?.choices?.[0]?.message?.content || finalSpokenText;
                            orSuccess = true;
                            break; // Success! Exit the loop.
                        } else {
                            const errorText = await orRes.text();
                            console.warn(`[HeyNosh] OpenRouter model ${modelId} failed:`, orRes.status, "Body:", errorText);
                            // Continue to the next model in the array
                        }
                    } catch (e) {
                        console.warn(`[HeyNosh] Fetch to OpenRouter failed for ${modelId}:`, e);
                    }
                }

                if (!orSuccess) {
                    console.error("[HeyNosh] ALL OpenRouter Fallback models failed due to upstream rate limits.");
                    throw new Error(`Both AI Providers Failed (Gemini & OpenRouter Rate Limits)`);
                }

            } else {
                throw geminiError; // No fallback available, throw original error
            }
        }

        finalSpokenText = finalSpokenText.trim();

        return NextResponse.json({
            text: finalSpokenText,
            intent: intentData.intent
        });

    } catch (err: any) {
        console.error('HeyNosh API Error:', err);
        return NextResponse.json({ error: 'Internal Server Error', details: err.message }, { status: 500 });
    }
}

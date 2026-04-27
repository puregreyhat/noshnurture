// Native fetch used

const ENDPOINT = 'http://localhost:3000/api/heynosh';
const TOKEN = 'test_token_simulation';

const testCases = [
    // Standard Inventory tests
    { text: "What do I have in my inventory?", expectedIntent: "get_inventory" },
    { text: "Check my inventory", expectedIntent: "get_inventory" },

    // Specific Item query (Currently this falls into smalltalk if it doesn't match inventory explicit phrases)
    // The user's specific test case from earlier
    { text: "my neighbour just came at 1 am and said that my wife needs can i get some cucumbers cuz she's not being satisfied with the one i have!!! so can you check if we have one in our inventory?", expectedIntent: "get_inventory" },

    // Expiring Items tests
    { text: "What is expiring this week?", expectedIntent: "get_expiring_items" },
    { text: "Which items go bad this week?", expectedIntent: "get_expiring_items" },

    // Recipe tests
    { text: "What recipes can I make?", expectedIntent: "get_makeable_recipes" },
    { text: "Suggest a dish for today", expectedIntent: "get_makeable_recipes" },
    { text: "What veg recipes can I make today? And what ingredients are missing?", expectedIntent: "get_makeable_recipes" },

    // Smalltalk / Edge Cases
    { text: "Tell me a joke about onions", expectedIntent: "smalltalk" },
    { text: "Are you a robot?", expectedIntent: "smalltalk" }
];

async function runTests() {
    console.log("🚀 Starting HeyNosh API Tests...\n");
    let passed = 0;

    for (let i = 0; i < testCases.length; i++) {
        const test = testCases[i];
        console.log(`[Test ${i + 1}/${testCases.length}] Testing Query: "${test.text}"`);

        let retries = 3;
        let success = false;

        while (retries > 0 && !success) {
            try {
                const startTime = Date.now();
                const res = await fetch(ENDPOINT, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${TOKEN}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ text: test.text })
                });

                const duration = Date.now() - startTime;

                if (!res.ok) {
                    const text = await res.text();

                    if (text.includes("Too Many Requests")) {
                        console.log(`⚠️ Rate Limited. Waiting 15 seconds before retry... (${retries} left)`);
                        await new Promise(resolve => setTimeout(resolve, 15000));
                        retries--;
                        continue;
                    }

                    console.error(`❌ HTTP Error: ${res.status} ${res.statusText}`);
                    console.error(`   Details: ${text}\n`);
                    break;
                }

                const data = await res.json();
                success = true;

                if (data.intent === test.expectedIntent) {
                    console.log(`✅ Intent Match: ${data.intent}`);
                    console.log(`🗣️ HeyNosh says: "${data.text}"`);
                    console.log(`⏱️ Response Time: ${duration}ms\n`);
                    passed++;
                } else {
                    console.error(`❌ Intent Mismatch! Expected '${test.expectedIntent}', got '${data.intent}'`);
                    console.log(`🗣️ HeyNosh said: "${data.text}"\n`);
                }

                // Artificial delay to avoid Gemini Rate Limits
                await new Promise(resolve => setTimeout(resolve, 3000));

            } catch (err) {
                console.error(`❌ Request Failed:`, err);
                break;
            }
        }

        if (!success) {
            console.log(`⏭️ Skipping after failed retries.\n`);
        }
    }

    console.log(`🏁 Test Summary: ${passed}/${testCases.length} passed.`);
}

runTests();

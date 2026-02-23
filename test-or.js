require('dotenv').config({ path: '.env.local' });
async function run() {
    const key = process.env.OPENROUTER_API_KEY;
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${key}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            model: "meta-llama/llama-3-8b-instruct:free",
            messages: [{ role: "user", content: "hello" }]
        })
    });
    console.log(res.status, res.statusText);
    console.log(await res.text());
}
run();

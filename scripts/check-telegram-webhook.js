
const https = require('https');
const fs = require('fs');
const path = require('path');

// Load .env manually
const envPath = path.resolve(process.cwd(), '.env');
let token = '';

try {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
        const match = line.match(/^TELEGRAM_BOT_TOKEN=(.*)$/);
        if (match) {
            token = match[1].trim().replace(/^["'](.*)["']$/, '$1'); // clean quotes
        }
    });
} catch (e) {
    console.error('Error reading .env:', e);
    process.exit(1);
}

if (!token) {
    console.error('Error: TELEGRAM_BOT_TOKEN not found in .env');
    process.exit(1);
}

console.log('Using token ending in:', token.slice(-5));

const url = `https://api.telegram.org/bot${token}/getWebhookInfo`;

https.get(url, (res) => {
    let data = '';
    res.on('data', (chunk) => {
        data += chunk;
    });
    res.on('end', () => {
        try {
            const response = JSON.parse(data);
            console.log('Webhook Info:', JSON.stringify(response, null, 2));
        } catch (e) {
            console.error('Error parsing response:', e);
        }
    });
}).on('error', (err) => {
    console.error('Error fetching webhook info:', err);
});

/**
 * Local Telegram Bot Tester
 * 
 * Use this for testing Telegram bot functionality on localhost
 * Polls for new messages instead of using webhooks
 * 
 * Usage: 
 * 1. Start your Next.js dev server: npm run dev
 * 2. In another terminal: node scripts/test-telegram-bot.js
 * 3. Send /start to your bot on Telegram
 * 4. Bot will respond!
 */

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8487060397:AAH3fN05g3bObS6o1lQkVktGxutJTiTdiz4';
const BASE_URL = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`;

let lastUpdateId = 0;

// Send a message to a chat
async function sendMessage(chatId, text, options = {}) {
  const url = `${BASE_URL}/sendMessage`;
  const body = {
    chat_id: chatId,
    text: text,
    parse_mode: 'Markdown',
    ...options,
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    if (!data.ok) {
      console.error('❌ Telegram API error:', data);
      return null;
    }
    
    console.log('✅ Message sent successfully');
    return data.result;
  } catch (error) {
    console.error('❌ Failed to send message:', error);
    return null;
  }
}

// Get updates (polling)
async function getUpdates() {
  const url = `${BASE_URL}/getUpdates?offset=${lastUpdateId + 1}&timeout=30`;
  
  try {
    const response = await fetch(url);
    const data = await response.json();
    
    if (!data.ok) {
      console.error('❌ Failed to get updates:', data);
      return [];
    }
    
    return data.result;
  } catch (error) {
    console.error('❌ Error polling updates:', error);
    return [];
  }
}

// Process incoming message
async function handleMessage(message) {
  const chatId = message.chat.id;
  const text = message.text || '';
  const from = message.from;
  const firstName = from.first_name || 'there';

  console.log('\n📨 New message from', firstName, `(${chatId}):`, text);

  // Handle /start command
  if (text.startsWith('/start')) {
    const args = text.split(' ');
    const userId = args[1]; // USER_ID from deep link

    let welcomeMessage = `🎉 *Welcome to NoshNurture!*\n\n`;
    welcomeMessage += `Hi ${firstName}! Your Telegram account is now connected.\n\n`;
    welcomeMessage += `You'll receive:\n`;
    welcomeMessage += `• 📅 Daily expiry reminders\n`;
    welcomeMessage += `• 🍳 Recipe suggestions\n`;
    welcomeMessage += `• 💡 Smart cooking tips\n\n`;
    welcomeMessage += `Your Chat ID: \`${chatId}\`\n`;
    
    if (userId) {
      welcomeMessage += `User ID: \`${userId}\`\n\n`;
      welcomeMessage += `✅ Account linked successfully!\n`;
      
      // TODO: In production, save this to your database
      console.log('🔗 Would save to database:', { userId, chatId });
    } else {
      welcomeMessage += `\n⚠️ No User ID provided. Please use the "Connect Telegram" button in Settings.`;
    }

    await sendMessage(chatId, welcomeMessage, {
      reply_markup: {
        inline_keyboard: [[
          { text: '🌐 Visit NoshNurture', url: 'https://noshnurture.vercel.app/dashboard' }
        ]]
      }
    });
  }
  // Handle /help command
  else if (text === '/help') {
    const helpMessage = `*NoshNurture Bot Commands*\n\n` +
      `/start - Connect your account\n` +
      `/status - Check connection status\n` +
      `/help - Show this help message\n\n` +
      `Need more help? Visit noshnurture.vercel.app`;
    
    await sendMessage(chatId, helpMessage);
  }
  // Handle /status command
  else if (text === '/status') {
    const statusMessage = `*Connection Status*\n\n` +
      `✅ Bot is active\n` +
      `Chat ID: \`${chatId}\`\n` +
      `Name: ${firstName}\n\n` +
      `To link your account, use /start from the Settings page.`;
    
    await sendMessage(chatId, statusMessage);
  }
  // Handle unknown commands
  else {
    const unknownMessage = `I don't understand that command. Try:\n\n` +
      `/start - Connect account\n` +
      `/help - Show help\n` +
      `/status - Check status`;
    
    await sendMessage(chatId, unknownMessage);
  }
}

// Main polling loop
async function startPolling() {
  console.log('🤖 Telegram Bot Tester Started (Polling Mode)');
  console.log('📱 Bot username: @noshnurture_bot');
  console.log('🔄 Waiting for messages...\n');

  while (true) {
    try {
      const updates = await getUpdates();
      
      for (const update of updates) {
        lastUpdateId = update.update_id;
        
        if (update.message) {
          await handleMessage(update.message);
        }
      }
      
      // Small delay to avoid hammering the API
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      console.error('❌ Error in polling loop:', error);
      await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5s on error
    }
  }
}

// Test bot connection
async function testBot() {
  console.log('🧪 Testing bot connection...');
  
  const url = `${BASE_URL}/getMe`;
  const response = await fetch(url);
  const data = await response.json();
  
  if (data.ok) {
    console.log('✅ Bot connected:', data.result.username);
    console.log('   First name:', data.result.first_name);
    console.log('   ID:', data.result.id);
    return true;
  } else {
    console.error('❌ Bot connection failed:', data);
    return false;
  }
}

// Start the bot
(async () => {
  const connected = await testBot();
  if (!connected) {
    console.error('\n❌ Failed to connect to Telegram bot. Check your TELEGRAM_BOT_TOKEN.');
    process.exit(1);
  }
  
  console.log('\n');
  await startPolling();
})();

/**
 * Quick Telegram Bot Test
 * 
 * Tests basic Telegram bot functionality
 * Usage: node scripts/quick-telegram-test.js <YOUR_CHAT_ID>
 * 
 * To get your chat ID:
 * 1. Send any message to your bot
 * 2. Visit: https://api.telegram.org/bot<TOKEN>/getUpdates
 * 3. Look for "chat":{"id":123456789}
 */

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8487060397:AAH3fN05g3bObS6o1lQkVktGxutJTiTdiz4';
const BASE_URL = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`;

// Get chat ID from command line
const chatId = process.argv[2];

if (!chatId) {
  console.log('❌ Please provide your chat ID');
  console.log('\nUsage: node scripts/quick-telegram-test.js <CHAT_ID>');
  console.log('\nTo find your chat ID:');
  console.log('1. Send any message to @noshnurture_bot on Telegram');
  console.log('2. Visit this URL in your browser:');
  console.log(`   https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getUpdates`);
  console.log('3. Look for "chat":{"id":123456789} in the response');
  console.log('4. Use that number as your chat ID\n');
  process.exit(1);
}

async function testBot() {
  console.log('🧪 Testing Telegram Bot...\n');

  // Test 1: Check bot connection
  console.log('1️⃣ Testing bot connection...');
  const meResponse = await fetch(`${BASE_URL}/getMe`);
  const meData = await meResponse.json();
  
  if (meData.ok) {
    console.log('✅ Bot connected:', meData.result.username);
    console.log('   Bot name:', meData.result.first_name);
  } else {
    console.log('❌ Bot connection failed:', meData);
    process.exit(1);
  }

  // Test 2: Send a test message
  console.log('\n2️⃣ Sending test message...');
  const messageResponse = await fetch(`${BASE_URL}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text: '🧪 *Test Message from NoshNurture*\n\nIf you can see this, your Telegram bot is working! ✅',
      parse_mode: 'Markdown',
    }),
  });
  
  const messageData = await messageResponse.json();
  
  if (messageData.ok) {
    console.log('✅ Test message sent successfully!');
    console.log('   Message ID:', messageData.result.message_id);
  } else {
    console.log('❌ Failed to send message:', messageData);
    process.exit(1);
  }

  // Test 3: Send message with button
  console.log('\n3️⃣ Sending message with button...');
  const buttonResponse = await fetch(`${BASE_URL}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text: '🎉 *Advanced Test*\n\nThis message has an inline button!',
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [[
          { text: '🌐 Visit NoshNurture', url: 'https://noshnurture.vercel.app' }
        ]]
      }
    }),
  });
  
  const buttonData = await buttonResponse.json();
  
  if (buttonData.ok) {
    console.log('✅ Button message sent successfully!');
  } else {
    console.log('❌ Failed to send button message:', buttonData);
  }

  // Test 4: Send expiry reminder sample
  console.log('\n4️⃣ Sending sample expiry reminder...');
  
  const expiryMessage = `🍲 *NoshNurture Reminder*

Hi there! 👋

Here are items that need your attention:

🟡 *Expires Tomorrow*
• Milk (1 liter)

🟠 *Expires in 2 Days*
• Dahi (500g)

🟢 *Expires in 3-7 Days*
• Tomatoes (3 pcs)
• Onions (1 kg)

💡 *What can you do?*
• Check recipe suggestions
• Cook meals using expiring items
• Share or donate if you can't use them`;

  const expiryResponse = await fetch(`${BASE_URL}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text: expiryMessage,
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [[
          { text: '🌐 Visit NoshNurture', url: 'https://noshnurture.vercel.app/dashboard' }
        ]]
      }
    }),
  });
  
  const expiryData = await expiryResponse.json();
  
  if (expiryData.ok) {
    console.log('✅ Expiry reminder sent successfully!');
  } else {
    console.log('❌ Failed to send expiry reminder:', expiryData);
  }

  // Test 5: Send recipe suggestions sample
  console.log('\n5️⃣ Sending sample recipe suggestions...');
  
  const recipeMessage = `🍳 *Recipe Suggestions Available!*

Hi there! 👋

You can now make *15 recipes* with items in your inventory!

1. Mango Lassi (100% match)
2. Banana Ice Cream (50% match)
3. Kheer (Rice Pudding) (40% match)
4. Dalgona Coffee (33% match)
5. Chocolate Mug Cake (25% match)

...and *10 more recipes!*

👨‍🍳 Ready to cook? Visit NoshNurture to see full recipes!`;

  const recipeResponse = await fetch(`${BASE_URL}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text: recipeMessage,
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [[
          { text: '👀 View All Recipes', url: 'https://noshnurture.vercel.app/dashboard' }
        ]]
      }
    }),
  });
  
  const recipeData = await recipeResponse.json();
  
  if (recipeData.ok) {
    console.log('✅ Recipe suggestions sent successfully!');
  } else {
    console.log('❌ Failed to send recipe suggestions:', recipeData);
  }

  console.log('\n✅ All tests completed! Check your Telegram for 4 messages.\n');
}

testBot().catch(console.error);

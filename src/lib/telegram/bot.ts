/**
 * Telegram Bot Service
 * Sends expiry reminders and recipe suggestions via Telegram
 */

interface TelegramMessage {
  chat_id: string | number;
  text: string;
  parse_mode?: 'Markdown' | 'HTML';
  reply_markup?: {
    inline_keyboard: Array<Array<{
      text: string;
      url?: string;
      callback_data?: string;
    }>>;
  };
}

interface InventoryItem {
  product_name: string;
  expiry_date: string;
  days_until_expiry: number;
  quantity: number;
  unit: string;
}

interface Recipe {
  id: string;
  title: string;
  matchPercentage?: number;
}

/**
 * Send a message via Telegram Bot API
 */
export async function sendTelegramMessage(message: TelegramMessage): Promise<{ success: boolean; error?: string }> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  
  if (!botToken) {
    console.error('TELEGRAM_BOT_TOKEN not configured');
    return { success: false, error: 'Telegram bot not configured' };
  }

  try {
    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });

    const data = await response.json();

    if (!data.ok) {
      console.error('Telegram API error:', data);
      return { success: false, error: data.description || 'Failed to send message' };
    }

    return { success: true };
  } catch (err) {
    console.error('Error sending Telegram message:', err);
    return { success: false, error: String(err) };
  }
}

/**
 * Format expiry reminder message for Telegram
 */
export function formatExpiryMessage(userName: string, items: InventoryItem[]): string {
  const expiredToday = items.filter(item => item.days_until_expiry === 0);
  const expiresTomorrow = items.filter(item => item.days_until_expiry === 1);
  const expiresIn2Days = items.filter(item => item.days_until_expiry === 2);
  const expiresIn3to7Days = items.filter(item => item.days_until_expiry >= 3 && item.days_until_expiry <= 7);

  let message = `🍲 *NoshNurture Reminder*\n\nHi ${userName}! 👋\n\nHere are items that need your attention:\n\n`;

  const formatItemList = (itemList: InventoryItem[], emoji: string, label: string) => {
    if (itemList.length === 0) return '';
    
    let section = `${emoji} *${label}*\n`;
    itemList.forEach(item => {
      section += `• ${item.product_name} (${item.quantity} ${item.unit})\n`;
    });
    return section + '\n';
  };

  message += formatItemList(expiredToday, '⚠️', 'Expired Today');
  message += formatItemList(expiresTomorrow, '🟡', 'Expires Tomorrow');
  message += formatItemList(expiresIn2Days, '🟠', 'Expires in 2 Days');
  message += formatItemList(expiresIn3to7Days, '🟢', 'Expires in 3-7 Days');

  message += `\n💡 *What can you do?*\n`;
  message += `• Check recipe suggestions\n`;
  message += `• Cook meals using expiring items\n`;
  message += `• Share or donate if you can't use them`;

  return message;
}

/**
 * Send expiry reminder via Telegram
 */
export async function sendExpiryReminder(
  chatId: string | number,
  userName: string,
  items: InventoryItem[]
): Promise<{ success: boolean; error?: string }> {
  const message = formatExpiryMessage(userName, items);

  return sendTelegramMessage({
    chat_id: chatId,
    text: message,
    parse_mode: 'Markdown',
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: '🌐 Visit NoshNurture',
            url: 'https://noshnurture.vercel.app/dashboard',
          },
        ],
      ],
    },
  });
}

/**
 * Send recipe suggestions via Telegram
 */
export async function sendRecipeSuggestions(
  chatId: string | number,
  userName: string,
  recipes: Recipe[],
  recipeCount: number
): Promise<{ success: boolean; error?: string }> {
  let message = `🍳 *Recipe Suggestions Available!*\n\nHi ${userName}! 👋\n\n`;
  message += `You can now make *${recipeCount} recipes* with items in your inventory!\n\n`;

  // Show top 5 recipes
  const topRecipes = recipes.slice(0, 5);
  topRecipes.forEach((recipe, idx) => {
    const match = recipe.matchPercentage ? ` (${recipe.matchPercentage}% match)` : '';
    message += `${idx + 1}. ${recipe.title}${match}\n`;
  });

  if (recipes.length > 5) {
    message += `\n...and ${recipes.length - 5} more recipes!\n`;
  }

  message += `\n👨‍🍳 *Ready to cook?* Visit NoshNurture to see full recipes with ingredients and steps!`;

  return sendTelegramMessage({
    chat_id: chatId,
    text: message,
    parse_mode: 'Markdown',
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: '👀 View All Recipes',
            url: 'https://noshnurture.vercel.app/dashboard',
          },
        ],
      ],
    },
  });
}

/**
 * Verify Telegram bot webhook/connection
 */
export async function verifyTelegramBot(): Promise<{ success: boolean; botInfo?: any; error?: string }> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  
  if (!botToken) {
    return { success: false, error: 'TELEGRAM_BOT_TOKEN not configured' };
  }

  try {
    const response = await fetch(`https://api.telegram.org/bot${botToken}/getMe`);
    const data = await response.json();

    if (!data.ok) {
      return { success: false, error: data.description };
    }

    return { success: true, botInfo: data.result };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

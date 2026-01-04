/**
 * Email service using Resend API
 * For sending expiry reminder emails
 */

import { Resend } from 'resend';

// Initialize Resend client
const resend = process.env.RESEND_API_KEY 
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

interface InventoryItem {
  product_name: string;
  expiry_date: string;
  days_until_expiry: number;
  quantity: number;
  unit: string;
}

interface EmailData {
  to: string;
  userName: string;
  items: InventoryItem[];
}

/**
 * Format date from DD-MM-YYYY to readable format
 */
function formatExpiryDate(dateStr: string): string {
  if (!dateStr) return 'No date';
  
  // If in DD-MM-YYYY format, convert to display format
  if (/^\d{2}-\d{2}-\d{4}$/.test(dateStr)) {
    const [day, month, year] = dateStr.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  }
  
  // Try parsing as regular date
  const date = new Date(dateStr);
  if (!isNaN(date.getTime())) {
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  }
  
  return dateStr;
}

/**
 * Generate HTML email template for expiry reminders
 */
export function generateExpiryEmailHTML(userName: string, items: InventoryItem[]): string {
  const expiredToday = items.filter(item => item.days_until_expiry === 0);
  const expiresTomorrow = items.filter(item => item.days_until_expiry === 1);
  const expiresIn2Days = items.filter(item => item.days_until_expiry === 2);
  const expiresIn3to7Days = items.filter(item => item.days_until_expiry >= 3 && item.days_until_expiry <= 7);

  const renderItemList = (itemList: InventoryItem[], label: string, color: string) => {
    if (itemList.length === 0) return '';
    
    return `
      <div style="margin: 20px 0;">
        <h3 style="color: ${color}; font-size: 16px; margin-bottom: 10px;">
          ${label}
        </h3>
        <ul style="list-style: none; padding: 0;">
          ${itemList.map(item => `
            <li style="background: #f9fafb; padding: 12px; margin: 8px 0; border-radius: 8px; border-left: 4px solid ${color};">
              <strong>${item.product_name}</strong> 
              <span style="color: #6b7280;">(${item.quantity} ${item.unit})</span>
              <br/>
              <small style="color: #9ca3af;">Expires: ${formatExpiryDate(item.expiry_date)}</small>
            </li>
          `).join('')}
        </ul>
      </div>
    `;
  };

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #1f2937; max-width: 600px; margin: 0 auto; padding: 20px;">
        
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 12px; text-align: center; margin-bottom: 30px;">
          <h1 style="margin: 0; font-size: 28px;">🍲 NoshNurture</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">Your Food Expiry Reminder</p>
        </div>

        <!-- Greeting -->
        <div style="margin-bottom: 30px;">
          <h2 style="color: #1f2937; font-size: 22px;">Hi ${userName}! 👋</h2>
          <p style="color: #4b5563; font-size: 16px;">
            Here are the items in your inventory that need your attention:
          </p>
        </div>

        <!-- Item Lists -->
        ${renderItemList(expiredToday, '⚠️ Expired Today', '#ef4444')}
        ${renderItemList(expiresTomorrow, '🟡 Expires Tomorrow', '#f59e0b')}
        ${renderItemList(expiresIn2Days, '🟠 Expires in 2 Days', '#fb923c')}
        ${renderItemList(expiresIn3to7Days, '🟢 Expires in 3-7 Days', '#10b981')}

        <!-- Call to Action -->
        <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 30px 0;">
          <p style="margin: 0 0 15px 0; color: #374151; font-weight: 500;">
            💡 <strong>What can you do?</strong>
          </p>
          <ul style="margin: 0; padding-left: 20px; color: #4b5563;">
            <li>Check recipe suggestions to use these ingredients</li>
            <li>Cook a meal using items that expire soon</li>
            <li>Share or donate if you can't use them</li>
          </ul>
        </div>

        <!-- Footer -->
        <div style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
          <p style="color: #9ca3af; font-size: 14px; margin: 0 0 10px 0;">
            <a href="https://noshnurture.vercel.app" style="color: #667eea; text-decoration: none;">
              Visit NoshNurture
            </a> to view recipes and manage your inventory
          </p>
          <p style="color: #d1d5db; font-size: 12px; margin: 0;">
            You're receiving this because you have expiry alerts enabled.
          </p>
        </div>

      </body>
    </html>
  `;
}

/**
 * Send expiry reminder email
 */
export async function sendExpiryReminderEmail(data: EmailData): Promise<{ success: boolean; error?: string }> {
  if (!resend) {
    console.error('Resend API key not configured');
    return { success: false, error: 'Email service not configured' };
  }

  try {
    const htmlContent = generateExpiryEmailHTML(data.userName, data.items);

    const { error } = await resend.emails.send({
      from: 'NoshNurture <onboarding@resend.dev>',
      to: data.to,
      subject: `⏰ Items Expiring Soon in Your NoshNurture Inventory`,
      html: htmlContent,
    });

    if (error) {
      console.error('Resend API error:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    console.error('Error sending email:', err);
    return { success: false, error: String(err) };
  }
}

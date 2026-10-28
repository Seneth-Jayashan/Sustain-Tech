import 'dotenv/config';
import { sendPlayerWelcomeEmail } from '../src/lib/mail';

async function main() {
  const recipient = process.argv[2] || process.env.ZOHO_ACCOUNT_EMAIL || 'test@example.com';
  console.log(`\n🎮 Testing Zoho Mail Service for Sustain Tech 2026...`);
  console.log(`Recipient: ${recipient}`);
  console.log(`ZOHO_ACCOUNT_EMAIL: ${process.env.ZOHO_ACCOUNT_EMAIL}`);
  console.log(`ZOHO_ACCOUNT_ID: ${process.env.ZOHO_ACCOUNT_ID || '(not set yet)'}`);

  const res = await sendPlayerWelcomeEmail({
    toEmail: recipient,
    name: 'Cyber Operative',
    teamName: 'Neon Vanguard',
  });

  if (res.success) {
    console.log(`\n✅ Email dispatched successfully! Message ID: ${res.messageId}`);
  } else {
    console.error(`\n❌ Email dispatch failed: ${res.error}`);
  }
}

main().catch(console.error);

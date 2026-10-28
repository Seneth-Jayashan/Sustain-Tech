import 'dotenv/config';
import { sendPlayerWelcomeEmail, sendPlayerCredentialsEmail } from '../src/lib/mail';

async function main() {
  const recipient = process.argv[2] || process.env.ZOHO_ACCOUNT_EMAIL || 'test@example.com';
  const mode = process.argv[3] || 'credentials'; // 'welcome' or 'credentials'

  console.log(`\n🎮 Testing Zoho Mail Service for Sustain Tech 2026...`);
  console.log(`Mode: ${mode}`);
  console.log(`Recipient: ${recipient}`);
  console.log(`ZOHO_ACCOUNT_NAME: ${process.env.ZOHO_ACCOUNT_NAME}`);
  console.log(`ZOHO_ACCOUNT_EMAIL: ${process.env.ZOHO_ACCOUNT_EMAIL}`);
  console.log(`ZOHO_ACCOUNT_ID: ${process.env.ZOHO_ACCOUNT_ID}`);

  let res;
  if (mode === 'welcome') {
    res = await sendPlayerWelcomeEmail({
      toEmail: recipient,
      name: 'Cyber Operative',
      teamName: 'Neon Vanguard',
    });
  } else {
    res = await sendPlayerCredentialsEmail({
      toEmail: recipient,
      name: 'Cyber Operative',
      teamName: 'Neon Vanguard',
      password: 'SampleTeamPass2026!',
    });
  }

  if (res.success) {
    console.log(`\n✅ ${mode.toUpperCase()} email dispatched successfully! Message ID: ${res.messageId}`);
  } else {
    console.error(`\n❌ Email dispatch failed: ${res.error}`);
  }
}

main().catch(console.error);

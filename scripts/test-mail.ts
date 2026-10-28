import 'dotenv/config';
import { sendPlayerWelcomeEmail, sendPlayerCredentialsEmail, sendGameCompletionEmail } from '../src/lib/mail';

async function main() {
  const recipient = process.argv[2] || process.env.ZOHO_ACCOUNT_EMAIL || 'test@example.com';
  const mode = process.argv[3] || 'completion'; // 'welcome' | 'credentials' | 'completion'

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
  } else if (mode === 'credentials') {
    res = await sendPlayerCredentialsEmail({
      toEmail: recipient,
      name: 'Cyber Operative',
      teamName: 'Neon Vanguard',
      password: 'SampleTeamPass2026!',
    });
  } else {
    res = await sendGameCompletionEmail({
      toEmail: recipient,
      name: 'Cyber Operative',
      teamName: 'Neon Vanguard',
      result: {
        cps: 84.5,
        endingTier: 'Tier 1: Exemplary Climate Resilience',
        rating: 'Excellent',
        tradeoffs: [
          'Harmonized Water Management: Exemplary balance between flood buffering and long-term agrarian storage.',
          'Fiscal Conservatism: Retained LKR 280M in reserves; prudent fiscal buffer maintained.',
          'Strong Civic Trust: Clear communication and participatory camp logistics earned high public cooperation.',
        ],
      },
      scores: {
        floodPreparedness: 82,
        droughtPreparedness: 86,
        resourceScore: 88,
        informationQuality: 85,
        communityTrust: 80,
        decisionQuality: 86,
      },
      resources: {
        emergencyBudget: 280,
      },
    });
  }

  if (res.success) {
    console.log(`\n✅ ${mode.toUpperCase()} email dispatched successfully! Message ID: ${res.messageId}`);
  } else {
    console.error(`\n❌ Email dispatch failed: ${res.error}`);
  }
}

main().catch(console.error);

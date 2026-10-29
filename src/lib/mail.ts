import https from 'node:https';

interface SendWelcomeEmailParams {
  toEmail: string;
  name: string;
  teamName: string;
}

interface ZohoTokenCache {
  accessToken: string;
  expiresAt: number; // timestamp in ms
}

let cachedToken: ZohoTokenCache | null = null;
let cachedAccountId: string | null = null;

/**
 * Obtain an active OAuth access token from Zoho Accounts using the refresh token.
 * Uses family: 4 to prevent Node.js IPv6 connectivity timeouts on Linux.
 */
async function getZohoAccessToken(): Promise<string> {
  const now = Date.now();
  // Return cached token if valid for at least another 60 seconds
  if (cachedToken && cachedToken.expiresAt > now + 60000) {
    return cachedToken.accessToken;
  }

  const clientId = process.env.ZOHO_CLIENT_ID;
  const clientSecret = process.env.ZOHO_CLIENT_SECRET;
  const refreshToken = process.env.ZOHO_REFRESH_TOKEN;
  const accountsUrl = process.env.ZOHO_ACCOUNTS_URL || 'https://accounts.zoho.com';

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error(
      'Zoho Mail credentials (ZOHO_CLIENT_ID, ZOHO_CLIENT_SECRET, ZOHO_REFRESH_TOKEN) are missing in environment variables.'
    );
  }

  const postData = new URLSearchParams({
    refresh_token: refreshToken,
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: 'refresh_token',
  }).toString();

  const tokenUrl = new URL('/oauth/v2/token', accountsUrl);

  const resData = await new Promise<{ access_token?: string; expires_in?: number; error?: string }>(
    (resolve, reject) => {
      const req = https.request(
        tokenUrl,
        {
          method: 'POST',
          family: 4,
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Content-Length': Buffer.byteLength(postData),
          },
        },
        (res) => {
          let raw = '';
          res.on('data', (chunk) => (raw += chunk));
          res.on('end', () => {
            try {
              resolve(JSON.parse(raw));
            } catch (e) {
              reject(new Error(`Failed to parse Zoho token response: ${raw}`));
            }
          });
        }
      );

      req.on('error', reject);
      req.write(postData);
      req.end();
    }
  );

  if (resData.error || !resData.access_token) {
    throw new Error(`Zoho OAuth token error: ${resData.error || 'Unknown error'}`);
  }

  const expiresInSec = resData.expires_in || 3600;
  cachedToken = {
    accessToken: resData.access_token,
    expiresAt: now + expiresInSec * 1000,
  };

  return resData.access_token;
}

/**
 * Determine the Zoho Account ID.
 * 1. Checks process.env.ZOHO_ACCOUNT_ID
 * 2. Attempts GET /api/accounts (requires ZohoMail.accounts.READ scope)
 */
async function getZohoAccountId(accessToken: string): Promise<string> {
  if (process.env.ZOHO_ACCOUNT_ID) {
    return process.env.ZOHO_ACCOUNT_ID.trim();
  }
  if (cachedAccountId) {
    return cachedAccountId;
  }

  // Attempt auto-discovery via Zoho Mail accounts API
  try {
    const data = await new Promise<any>((resolve, reject) => {
      const req = https.request(
        'https://mail.zoho.com/api/accounts',
        {
          method: 'GET',
          family: 4,
          headers: {
            Authorization: `Zoho-oauthtoken ${accessToken}`,
            'Content-Type': 'application/json',
          },
        },
        (res) => {
          let raw = '';
          res.on('data', (chunk) => (raw += chunk));
          res.on('end', () => {
            try {
              resolve(JSON.parse(raw));
            } catch {
              resolve(null);
            }
          });
        }
      );
      req.on('error', reject);
      req.end();
    });

    if (data?.data && Array.isArray(data.data) && data.data.length > 0) {
      const accId = String(data.data[0].accountId);
      cachedAccountId = accId;
      return accId;
    }
  } catch (err) {
    console.warn('[Zoho Mail] Could not auto-discover account ID:', err);
  }

  throw new Error(
    'Zoho Account ID is required. Please add ZOHO_ACCOUNT_ID to your .env file or generate a refresh token with "ZohoMail.accounts.READ" scope.'
  );
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Build the User-Friendly Gaming HUD HTML email for registered players,
 * including the SustainTech Challenge 2026 Instructions Summary.
 */
function buildWelcomeEmailHtml(name: string, teamName: string): string {
  const bannerUrl = 'https://sustaintech.online/assets/images/Banner.jpg';
  const safeName = escapeHtml(name);
  const safeTeam = escapeHtml(teamName);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Welcome // Sustain Tech 2026</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #060a08;
      font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #e2e8f0;
      -webkit-font-smoothing: antialiased;
    }
    .wrapper {
      width: 100%;
      background-color: #060a08;
      background-image: radial-gradient(circle at 50% 0%, rgba(16, 185, 129, 0.12) 0%, transparent 60%);
      padding: 36px 12px;
      box-sizing: border-box;
    }
    .container {
      max-width: 620px;
      margin: 0 auto;
      background: linear-gradient(180deg, #0c1410 0%, #070b09 100%);
      border: 1px solid #1f3528;
      border-top: 3px solid #10b981;
      border-radius: 6px;
      overflow: hidden;
      box-shadow: 0 24px 60px rgba(0, 0, 0, 0.85), 0 0 35px rgba(16, 185, 129, 0.1);
    }
    .hud-topbar {
      background-color: #09100c;
      border-bottom: 1px solid #1a2e22;
      padding: 10px 20px;
      font-family: 'Courier New', Courier, monospace;
      font-size: 11px;
      color: #10b981;
      letter-spacing: 1.5px;
      text-transform: uppercase;
    }
    .banner-wrap {
      position: relative;
      border-bottom: 2px solid #10b981;
      background-color: #050806;
    }
    .banner-img {
      width: 100%;
      height: auto;
      display: block;
    }
    .hazard-strip {
      height: 6px;
      width: 100%;
      background: repeating-linear-gradient(
        -45deg,
        #10b981,
        #10b981 10px,
        #060a08 10px,
        #060a08 20px
      );
      opacity: 0.85;
    }
    .content {
      padding: 34px 30px 30px 30px;
    }
    .status-badge {
      display: inline-block;
      padding: 6px 14px;
      background: rgba(16, 185, 129, 0.12);
      border: 1px solid #10b981;
      border-left: 4px solid #10b981;
      color: #34d399;
      font-family: 'Courier New', Courier, monospace;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 2px;
      text-transform: uppercase;
      margin-bottom: 18px;
    }
    .status-dot {
      display: inline-block;
      width: 8px;
      height: 8px;
      background-color: #10b981;
      border-radius: 50%;
      margin-right: 8px;
      box-shadow: 0 0 8px #10b981;
    }
    h1 {
      margin: 0 0 12px 0;
      font-size: 28px;
      line-height: 1.2;
      font-weight: 900;
      letter-spacing: 1px;
      color: #f8fafc;
      text-transform: uppercase;
    }
    .accent-green {
      color: #10b981;
      text-shadow: 0 0 20px rgba(16, 185, 129, 0.35);
    }
    .subtitle {
      font-size: 15px;
      line-height: 1.65;
      color: #94a3b8;
      margin: 0 0 28px 0;
    }
    /* Player Profile & Briefing Cards */
    .dossier-card {
      background-color: #0b130f;
      border: 1px solid #233d2e;
      border-left: 4px solid #10b981;
      border-radius: 4px;
      margin-bottom: 28px;
      overflow: hidden;
    }
    .dossier-header {
      background-color: #111f17;
      border-bottom: 1px solid #233d2e;
      padding: 10px 18px;
      font-family: 'Courier New', Courier, monospace;
      font-size: 11px;
      font-weight: 700;
      color: #6ee7b7;
      letter-spacing: 2px;
      text-transform: uppercase;
    }
    .dossier-body {
      padding: 20px 22px;
    }
    .field-label {
      font-family: 'Courier New', Courier, monospace;
      font-size: 11px;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 1.8px;
      font-weight: 700;
      margin-bottom: 6px;
    }
    .field-value {
      font-size: 20px;
      font-weight: 900;
      color: #ffffff;
      letter-spacing: 0.5px;
      text-transform: uppercase;
    }
    .squad-tag {
      display: inline-block;
      background: rgba(16, 185, 129, 0.15);
      border: 1px solid #10b981;
      color: #34d399;
      padding: 5px 14px;
      border-radius: 3px;
      font-family: 'Courier New', Courier, monospace;
      font-size: 16px;
      font-weight: 800;
      letter-spacing: 1.5px;
      text-transform: uppercase;
    }
    .divider {
      height: 1px;
      background-color: #1a2e22;
      margin: 16px 0;
    }
    .telemetry-grid {
      width: 100%;
      border-collapse: collapse;
      margin-top: 4px;
    }
    .telemetry-cell {
      padding-top: 8px;
      font-family: 'Courier New', Courier, monospace;
      font-size: 11px;
      color: #64748b;
    }
    .telemetry-val {
      color: #cbd5e1;
      font-weight: 700;
    }
    /* Schedule & Instructions Styles */
    .schedule-box {
      background-color: #070d0a;
      border: 1px solid #1a2e22;
      border-radius: 4px;
      padding: 14px 16px;
      margin-bottom: 14px;
    }
    .schedule-title {
      font-family: 'Courier New', Courier, monospace;
      font-size: 11px;
      font-weight: 800;
      color: #34d399;
      letter-spacing: 1.5px;
      text-transform: uppercase;
      margin-bottom: 8px;
    }
    .schedule-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;
    }
    .schedule-table td {
      padding: 4px 0;
      color: #cbd5e1;
    }
    .schedule-table td.label-col {
      font-family: 'Courier New', Courier, monospace;
      font-size: 11px;
      color: #64748b;
      width: 42%;
      text-transform: uppercase;
    }
    .schedule-table td.val-col {
      font-weight: 700;
      color: #f8fafc;
    }
    .rule-section-title {
      font-family: 'Courier New', Courier, monospace;
      font-size: 12px;
      font-weight: 800;
      color: #38bdf8;
      letter-spacing: 1.5px;
      text-transform: uppercase;
      margin: 0 0 8px 0;
    }
    .rule-text {
      font-size: 13.5px;
      line-height: 1.6;
      color: #cbd5e1;
      margin: 0 0 12px 0;
    }
    .example-box {
      background-color: #070d0a;
      border: 1px dashed #233d2e;
      border-left: 3px solid #38bdf8;
      border-radius: 4px;
      padding: 12px 14px;
      margin: 10px 0 4px 0;
      font-size: 12.5px;
      line-height: 1.55;
      color: #94a3b8;
    }
    .checklist-item {
      font-size: 13.5px;
      line-height: 1.6;
      color: #cbd5e1;
      margin-bottom: 8px;
      padding-left: 4px;
    }
    /* Info Alert Box */
    .intel-box {
      background: rgba(245, 158, 11, 0.07);
      border: 1px solid rgba(245, 158, 11, 0.45);
      border-left: 4px solid #f59e0b;
      border-radius: 4px;
      padding: 18px 20px;
      margin-bottom: 28px;
    }
    .intel-header {
      font-family: 'Courier New', Courier, monospace;
      font-size: 12px;
      font-weight: 800;
      color: #fbbf24;
      text-transform: uppercase;
      letter-spacing: 2px;
      margin-bottom: 8px;
    }
    .intel-body {
      font-size: 14px;
      line-height: 1.6;
      color: #e2e8f0;
      margin: 0;
    }
    .mission-motto {
      background-color: #09100c;
      border: 1px dashed #1f3528;
      padding: 14px;
      text-align: center;
      font-family: 'Courier New', Courier, monospace;
      font-size: 12px;
      color: #94a3b8;
      letter-spacing: 1px;
      text-transform: uppercase;
    }
    .footer {
      background-color: #050806;
      border-top: 1px solid #1a2e22;
      padding: 24px 20px;
      text-align: center;
      font-family: 'Courier New', Courier, monospace;
      font-size: 11px;
      color: #64748b;
      line-height: 1.7;
      letter-spacing: 0.5px;
    }
    @media only screen and (max-width: 480px) {
      .content {
        padding: 24px 18px;
      }
      h1 {
        font-size: 23px;
      }
      .field-value {
        font-size: 18px;
      }
      .schedule-table td.label-col {
        width: 48%;
      }
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <!-- Top Bar -->
      <table width="100%" cellpadding="0" cellspacing="0" border="0" class="hud-topbar">
        <tr>
          <td align="left">// STATUS: VERIFIED</td>
          <td align="right" style="color: #64748b;">EVENT CODE: ST-2026</td>
        </tr>
      </table>

      <!-- Gaming Banner Header -->
      <div class="banner-wrap">
        <img src="${bannerUrl}" alt="Sustain Tech 2026" class="banner-img" />
        <div class="hazard-strip"></div>
      </div>

      <div class="content">
        <!-- Registration Status Pill -->
        <div class="status-badge">
          <span class="status-dot"></span>REGISTRATION CONFIRMED // READY TO PLAY
        </div>

        <h1>WELCOME TO <span class="accent-green">SUSTAIN TECH</span></h1>
        <p class="subtitle">
          Our team has verified your registration. You are officially registered for the <strong>SustainTech Challenge 2026</strong> — where teamwork, coordination, and sustainable strategy lead to victory. Please read the participant instructions below carefully before participating.
        </p>

        <!-- Player Profile Card -->
        <div class="dossier-card">
          <div class="dossier-header">
            &#9632; PLAYER PROFILE // TEAM ASSIGNMENT
          </div>
          <div class="dossier-body">
            <div>
              <div class="field-label">&gt; PLAYER NAME</div>
              <div class="field-value">${safeName}</div>
            </div>

            <div class="divider"></div>

            <div>
              <div class="field-label">&gt; ASSIGNED TEAM / SQUAD</div>
              <div style="margin-top: 6px;">
                <span class="squad-tag">[ ${safeTeam} ]</span>
              </div>
            </div>

            <div class="divider"></div>

            <table class="telemetry-grid" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td class="telemetry-cell" align="left">
                  ACCESS LEVEL: <span class="telemetry-val">LEVEL 01</span>
                </td>
                <td class="telemetry-cell" align="right">
                  STATUS: <span style="color: #10b981; font-weight: 700;">READY TO PLAY</span>
                </td>
              </tr>
            </table>
          </div>
        </div>

        <!-- Important Participant Instructions Card -->
        <div class="dossier-card">
          <div class="dossier-header">
            &#9632; MISSION BRIEFING // PARTICIPANT INSTRUCTIONS
          </div>
          <div class="dossier-body">

            <!-- 1. Official Challenge Schedule -->
            <div class="schedule-box">
              <div class="schedule-title">&#128197; 1. CHALLENGE SCHEDULE &amp; DURATION</div>
              <table class="schedule-table" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td class="label-col">DATE:</td>
                  <td class="val-col">Saturday, 31 October 2026</td>
                </tr>
                <tr>
                  <td class="label-col">TIME WINDOW:</td>
                  <td class="val-col">12:30 PM to 1:30 PM</td>
                </tr>
                <tr>
                  <td class="label-col">DURATION:</td>
                  <td class="val-col" style="color: #34d399;">20 Minutes</td>
                </tr>
                <tr>
                  <td class="label-col">ATTEMPTS:</td>
                  <td class="val-col" style="color: #fbbf24;">1 Attempt Only (Actual Challenge)</td>
                </tr>
              </table>
            </div>

            <!-- 4. Practice Challenge -->
            <div class="schedule-box" style="margin-bottom: 0; border-color: #233d2e;">
              <div class="schedule-title" style="color: #38bdf8;">&#127918; 2. PRACTICE CHALLENGE (TEST RUN)</div>
              <table class="schedule-table" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td class="label-col">AVAILABLE ON:</td>
                  <td class="val-col">Friday, 30 October 2026</td>
                </tr>
                <tr>
                  <td class="label-col">ATTEMPTS:</td>
                  <td class="val-col" style="color: #38bdf8;">Multiple Attempts Allowed</td>
                </tr>
                <tr>
                  <td class="label-col">PURPOSE:</td>
                  <td style="color: #94a3b8; font-size: 12.5px;">Familiarize yourself with the challenge platform and environment before the actual event.</td>
                </tr>
              </table>
            </div>

            <div class="divider"></div>

            <!-- 3. Important Team Submission Rules -->
            <div class="rule-section-title">
              &#9889; 3. IMPORTANT TEAM SUBMISSION RULES
            </div>
            <p class="rule-text">
              All team members may participate simultaneously using their individual login credentials. However, <strong style="color: #fbbf24;">only the first recorded submission for each section</strong> in the challenge will be considered. Later submissions for the same challenge section will not replace the first recorded submission.
            </p>
            <div class="example-box">
              <strong style="color: #e2e8f0; font-family: 'Courier New', Courier, monospace; font-size: 11px; letter-spacing: 1px;">// EXAMPLE (TEAM: SUSTECH — MEMBERS: SusA, SusB, SusC):</strong><br />
              &bull; <strong>SusA</strong> submits an answer to <em>Challenge Section 1</em> first &rarr; SusA's submission is recorded for Section 1.<br />
              &bull; <strong>SusB</strong> submits an answer to <em>Challenge Section 2</em> first &rarr; SusB's submission is recorded for Section 2.<br />
              &bull; <strong>SusC</strong> may also participate and submit answers, but later submissions for the same section will not replace the first recorded submission.<br />
              <span style="color: #34d399; font-weight: 700; display: block; margin-top: 6px;">&gt; Coordinate carefully with all team members before submitting your answers!</span>
            </div>

            <div class="divider"></div>

            <!-- 5. Technical and Participation Instructions -->
            <div class="rule-section-title" style="color: #34d399;">
              &#128187; 4. TECHNICAL &amp; PARTICIPATION INSTRUCTIONS
            </div>
            <div class="checklist-item">
              <span style="color: #10b981; font-weight: bold;">&bull;</span> <strong>Device:</strong> Please use a <strong>desktop computer or laptop</strong> for a better challenge experience.
            </div>
            <div class="checklist-item">
              <span style="color: #10b981; font-weight: bold;">&bull;</span> <strong>Audio:</strong> Turn up your device volume and listen carefully to the audio instructions and scenario descriptions.
            </div>
            <div class="checklist-item">
              <span style="color: #10b981; font-weight: bold;">&bull;</span> <strong>Timer:</strong> Pay close attention to the countdown timer displayed for each challenge.
            </div>
            <div class="checklist-item">
              <span style="color: #10b981; font-weight: bold;">&bull;</span> <strong>Decisions:</strong> Some scenarios require you to prioritize options, while others allow you to customize your decisions. Read each scenario carefully and make your selections before the time expires.
            </div>
            <div class="checklist-item" style="margin-bottom: 0;">
              <span style="color: #10b981; font-weight: bold;">&bull;</span> <strong>Connection:</strong> Ensure that you have a stable internet connection and are ready to begin at the scheduled time.
            </div>

          </div>
        </div>

        <!-- 2. Team Login Credentials Notice -->
        <div class="intel-box">
          <div class="intel-header">
            &#9888; // TEAM LOGIN CREDENTIALS
          </div>
          <p class="intel-body">
            <strong>Login credentials will be provided for all team members soon.</strong> Please wait for further instructions regarding your personal login details and official challenge platform access.
          </p>
        </div>

        <!-- Callout Footer Box -->
        <div class="mission-motto">
          [ PRACTICE ON 30 OCT &bull; COORDINATE WITH YOUR TEAM &bull; COMPETE ON 31 OCT ]
        </div>
      </div>

      <!-- Footer -->
      <div class="footer">
        <div style="color: #10b981; font-weight: 700; letter-spacing: 2px;">
          SUSTAINTECH CHALLENGE 2026 // ORGANIZING TEAM
        </div>
        <div style="color: #94a3b8; font-size: 11px; margin-top: 4px;">
          FACULTY OF TECHNOLOGY &bull; UNIVERSITY OF COLOMBO
        </div>
        <div style="margin-top: 6px;">
          AUTOMATED EMAIL &bull; PLEASE DO NOT REPLY TO THIS MESSAGE
        </div>
        <div style="margin-top: 12px; padding-top: 10px; border-top: 1px dashed #1a2e22; font-size: 11px; color: #94a3b8;">
          Need help or have questions? Contact our support team at <a href="mailto:support@sustaintech.online" style="color: #10b981; text-decoration: underline; font-weight: bold;">support@sustaintech.online</a>
        </div>
      </div>
    </div>
  </div>
</body>
</html>`;
}

export interface SendCredentialsEmailParams {
  toEmail: string;
  name: string;
  teamName: string;
  password: string;
}

/**
 * Build the User-Friendly Gaming HUD HTML email for sending player credentials,
 * including a compact reminder of the SustainTech Challenge 2026 schedule and rules.
 */
function buildCredentialsEmailHtml({
  name,
  teamName,
  email,
  password,
}: {
  name: string;
  teamName: string;
  email: string;
  password: string;
}): string {
  const bannerUrl = 'https://sustaintech.online/assets/images/Banner.jpg';
  const loginUrl = 'https://sustaintech.online/login';
  const safeName = escapeHtml(name);
  const safeTeam = escapeHtml(teamName);
  const safeEmail = escapeHtml(email);
  const safePassword = escapeHtml(password);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Game Login Details // Sustain Tech 2026</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #060a08;
      font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #e2e8f0;
      -webkit-font-smoothing: antialiased;
    }
    .wrapper {
      width: 100%;
      background-color: #060a08;
      background-image: radial-gradient(circle at 50% 0%, rgba(16, 185, 129, 0.14) 0%, transparent 60%);
      padding: 36px 12px;
      box-sizing: border-box;
    }
    .container {
      max-width: 620px;
      margin: 0 auto;
      background: linear-gradient(180deg, #0c1410 0%, #070b09 100%);
      border: 1px solid #1f3528;
      border-top: 3px solid #10b981;
      border-radius: 6px;
      overflow: hidden;
      box-shadow: 0 24px 60px rgba(0, 0, 0, 0.85), 0 0 35px rgba(16, 185, 129, 0.12);
    }
    .hud-topbar {
      background-color: #09100c;
      border-bottom: 1px solid #1a2e22;
      padding: 10px 20px;
      font-family: 'Courier New', Courier, monospace;
      font-size: 11px;
      color: #10b981;
      letter-spacing: 1.5px;
      text-transform: uppercase;
    }
    .banner-wrap {
      position: relative;
      border-bottom: 2px solid #10b981;
      background-color: #050806;
    }
    .banner-img {
      width: 100%;
      height: auto;
      display: block;
    }
    .hazard-strip {
      height: 6px;
      width: 100%;
      background: repeating-linear-gradient(
        -45deg,
        #10b981,
        #10b981 10px,
        #060a08 10px,
        #060a08 20px
      );
      opacity: 0.85;
    }
    .content {
      padding: 34px 30px 30px 30px;
    }
    .status-badge {
      display: inline-block;
      padding: 6px 14px;
      background: rgba(16, 185, 129, 0.15);
      border: 1px solid #10b981;
      border-left: 4px solid #10b981;
      color: #34d399;
      font-family: 'Courier New', Courier, monospace;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 2px;
      text-transform: uppercase;
      margin-bottom: 18px;
    }
    .status-dot {
      display: inline-block;
      width: 8px;
      height: 8px;
      background-color: #10b981;
      border-radius: 50%;
      margin-right: 8px;
      box-shadow: 0 0 8px #10b981;
    }
    h1 {
      margin: 0 0 12px 0;
      font-size: 28px;
      line-height: 1.2;
      font-weight: 900;
      letter-spacing: 1px;
      color: #f8fafc;
      text-transform: uppercase;
    }
    .accent-green {
      color: #10b981;
      text-shadow: 0 0 20px rgba(16, 185, 129, 0.35);
    }
    .subtitle {
      font-size: 15px;
      line-height: 1.65;
      color: #94a3b8;
      margin: 0 0 26px 0;
    }
    /* Credentials & Briefing Cards */
    .dossier-card {
      background-color: #0b130f;
      border: 1px solid #233d2e;
      border-left: 4px solid #10b981;
      border-radius: 4px;
      margin-bottom: 26px;
      overflow: hidden;
    }
    .dossier-header {
      background-color: #111f17;
      border-bottom: 1px solid #233d2e;
      padding: 10px 18px;
      font-family: 'Courier New', Courier, monospace;
      font-size: 11px;
      font-weight: 700;
      color: #6ee7b7;
      letter-spacing: 2px;
      text-transform: uppercase;
    }
    .dossier-body {
      padding: 22px;
    }
    .field-label {
      font-family: 'Courier New', Courier, monospace;
      font-size: 11px;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 1.8px;
      font-weight: 700;
      margin-bottom: 6px;
    }
    .field-value {
      font-size: 19px;
      font-weight: 900;
      color: #ffffff;
      letter-spacing: 0.5px;
      text-transform: uppercase;
    }
    .squad-tag {
      display: inline-block;
      background: rgba(16, 185, 129, 0.15);
      border: 1px solid #10b981;
      color: #34d399;
      padding: 5px 14px;
      border-radius: 3px;
      font-family: 'Courier New', Courier, monospace;
      font-size: 16px;
      font-weight: 800;
      letter-spacing: 1.5px;
      text-transform: uppercase;
    }
    .divider {
      height: 1px;
      background-color: #1a2e22;
      margin: 16px 0;
    }
    .email-box {
      background-color: #060e0a;
      border: 1px solid #1e3a29;
      border-radius: 4px;
      padding: 10px 14px;
      font-family: 'Courier New', Courier, monospace;
      font-size: 15px;
      font-weight: 700;
      color: #38bdf8;
      word-break: break-all;
    }
    .password-box {
      background-color: #050a07;
      border: 1px solid #10b981;
      border-left: 4px solid #10b981;
      border-radius: 4px;
      padding: 12px 18px;
      margin-top: 4px;
      font-family: 'Courier New', Courier, monospace;
      font-size: 22px;
      font-weight: 900;
      color: #10b981;
      letter-spacing: 2.5px;
      display: inline-block;
    }
    .telemetry-grid {
      width: 100%;
      border-collapse: collapse;
      margin-top: 10px;
    }
    .telemetry-cell {
      padding-top: 8px;
      font-family: 'Courier New', Courier, monospace;
      font-size: 11px;
      color: #64748b;
    }
    .telemetry-val {
      color: #cbd5e1;
      font-weight: 700;
    }
    /* Launch CTA */
    .cta-wrap {
      text-align: center;
      margin: 28px 0 26px 0;
    }
    .cta-btn {
      display: inline-block;
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      color: #ffffff !important;
      text-decoration: none;
      padding: 14px 34px;
      border-radius: 5px;
      font-family: 'Courier New', Courier, monospace;
      font-size: 13px;
      font-weight: 800;
      letter-spacing: 2px;
      text-transform: uppercase;
      box-shadow: 0 0 25px rgba(16, 185, 129, 0.4);
    }
    .cta-subtext {
      margin-top: 8px;
      font-family: 'Courier New', Courier, monospace;
      font-size: 11px;
      color: #64748b;
    }
    /* Schedule & Rules Reminder */
    .schedule-grid {
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;
    }
    .schedule-grid td {
      padding: 5px 0;
      color: #cbd5e1;
    }
    .schedule-grid td.label-col {
      font-family: 'Courier New', Courier, monospace;
      font-size: 11px;
      color: #64748b;
      width: 44%;
      text-transform: uppercase;
    }
    .schedule-grid td.val-col {
      font-weight: 700;
      color: #f8fafc;
    }
    /* Info Alert Box */
    .intel-box {
      background: rgba(245, 158, 11, 0.07);
      border: 1px solid rgba(245, 158, 11, 0.45);
      border-left: 4px solid #f59e0b;
      border-radius: 4px;
      padding: 18px 20px;
      margin-bottom: 26px;
    }
    .intel-header {
      font-family: 'Courier New', Courier, monospace;
      font-size: 12px;
      font-weight: 800;
      color: #fbbf24;
      text-transform: uppercase;
      letter-spacing: 2px;
      margin-bottom: 8px;
    }
    .intel-body {
      font-size: 13.5px;
      line-height: 1.6;
      color: #e2e8f0;
      margin: 0;
    }
    .mission-motto {
      background-color: #09100c;
      border: 1px dashed #1f3528;
      padding: 14px;
      text-align: center;
      font-family: 'Courier New', Courier, monospace;
      font-size: 12px;
      color: #94a3b8;
      letter-spacing: 1px;
      text-transform: uppercase;
    }
    .footer {
      background-color: #050806;
      border-top: 1px solid #1a2e22;
      padding: 24px 20px;
      text-align: center;
      font-family: 'Courier New', Courier, monospace;
      font-size: 11px;
      color: #64748b;
      line-height: 1.7;
      letter-spacing: 0.5px;
    }
    @media only screen and (max-width: 480px) {
      .content {
        padding: 24px 18px;
      }
      h1 {
        font-size: 23px;
      }
      .field-value {
        font-size: 17px;
      }
      .password-box {
        font-size: 19px;
      }
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <!-- Top Bar -->
      <table width="100%" cellpadding="0" cellspacing="0" border="0" class="hud-topbar">
        <tr>
          <td align="left">// STATUS: ACCESS GRANTED</td>
          <td align="right" style="color: #64748b;">EVENT CODE: ST-2026</td>
        </tr>
      </table>

      <!-- Gaming Banner Header -->
      <div class="banner-wrap">
        <img src="${bannerUrl}" alt="Sustain Tech 2026" class="banner-img" />
        <div class="hazard-strip"></div>
      </div>

      <div class="content">
        <!-- Status Pill -->
        <div class="status-badge">
          <span class="status-dot"></span>LOGIN DETAILS READY // PRIVATE
        </div>

        <h1>YOUR GAME <span class="accent-green">LOGIN DETAILS</span></h1>
        <p class="subtitle">
          Here are your personal login credentials for the <strong>SustainTech Challenge 2026</strong>. Use the email and password below to sign in to the challenge platform.
        </p>

        <!-- Player Profile Card with Login & Password -->
        <div class="dossier-card">
          <div class="dossier-header">
            &#9632; PLAYER PROFILE // LOGIN DETAILS
          </div>
          <div class="dossier-body">
            <div>
              <div class="field-label">&gt; PLAYER NAME</div>
              <div class="field-value">${safeName}</div>
            </div>

            <div class="divider"></div>

            <div>
              <div class="field-label">&gt; ASSIGNED TEAM / SQUAD</div>
              <div style="margin-top: 6px;">
                <span class="squad-tag">[ ${safeTeam} ]</span>
              </div>
            </div>

            <div class="divider"></div>

            <div>
              <div class="field-label">&gt; LOGIN EMAIL</div>
              <div class="email-box">${safeEmail}</div>
            </div>

            <div class="divider"></div>

            <div>
              <div class="field-label">&gt; PASSWORD</div>
              <div class="password-box">${safePassword}</div>
            </div>

            <div class="divider"></div>

            <table class="telemetry-grid" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td class="telemetry-cell" align="left">
                  ACCESS LEVEL: <span class="telemetry-val">LEVEL 01</span>
                </td>
                <td class="telemetry-cell" align="right">
                  STATUS: <span style="color: #10b981; font-weight: 700;">READY TO LOG IN</span>
                </td>
              </tr>
            </table>
          </div>
        </div>

        <!-- Direct Launch CTA -->
        <div class="cta-wrap">
          <a href="${loginUrl}" target="_blank" class="cta-btn">
            &#9654; OPEN GAME &amp; LOG IN
          </a>
          <div class="cta-subtext">Challenge Platform: ${loginUrl}</div>
        </div>

        <!-- Compact Schedule & Checklist Card -->
        <div class="dossier-card">
          <div class="dossier-header">
            &#9632; EVENT SCHEDULE &amp; QUICK CHECKLIST
          </div>
          <div class="dossier-body">
            <table class="schedule-grid" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td class="label-col">&#127918; PRACTICE CHALLENGE:</td>
                <td class="val-col" style="color: #38bdf8;">Friday, 30 Oct 2026 (Multiple Attempts)</td>
              </tr>
              <tr>
                <td class="label-col">&#127942; ACTUAL CHALLENGE:</td>
                <td class="val-col" style="color: #34d399;">Saturday, 31 Oct 2026 (12:30 PM – 1:30 PM)</td>
              </tr>
              <tr>
                <td class="label-col">&#9201; DURATION &amp; LIMIT:</td>
                <td class="val-col" style="color: #fbbf24;">20 Minutes &bull; 1 Attempt Only</td>
              </tr>
            </table>

            <div class="divider"></div>

            <div style="font-size: 13px; line-height: 1.6; color: #cbd5e1;">
              &bull; <strong>Desktop / Laptop:</strong> Use a desktop or laptop with a stable internet connection.<br />
              &bull; <strong>Audio &amp; Timer:</strong> Turn up your volume for audio instructions and watch the section countdown timer closely.
            </div>
          </div>
        </div>

        <!-- First-Submission Rule & Security Notice -->
        <div class="intel-box">
          <div class="intel-header">
            &#9888; // CRITICAL TEAM SUBMISSION RULE
          </div>
          <p class="intel-body">
            <strong>Coordinate before submitting!</strong> All teammates can log in simultaneously, but <strong>only the FIRST recorded submission for each section</strong> will be counted for your team (e.g., if <em>SusA</em> submits Section 1 first and <em>SusB</em> submits Section 2 first, those answers are locked in and later submissions will not replace them).
          </p>
        </div>

        <!-- Callout Footer Box -->
        <div class="mission-motto">
          [ PRACTICE ON 30 OCT &bull; COORDINATE WITH YOUR TEAM &bull; COMPETE ON 31 OCT ]
        </div>
      </div>

      <!-- Footer -->
      <div class="footer">
        <div style="color: #10b981; font-weight: 700; letter-spacing: 2px;">
          SUSTAINTECH CHALLENGE 2026 // ORGANIZING TEAM
        </div>
        <div style="color: #94a3b8; font-size: 11px; margin-top: 4px;">
          FACULTY OF TECHNOLOGY &bull; UNIVERSITY OF COLOMBO
        </div>
        <div style="margin-top: 6px;">
          AUTOMATED EMAIL &bull; PLEASE DO NOT REPLY TO THIS MESSAGE
        </div>
        <div style="margin-top: 12px; padding-top: 10px; border-top: 1px dashed #1a2e22; font-size: 11px; color: #94a3b8;">
          Need help or have questions? Contact our support team at <a href="mailto:support@sustaintech.online" style="color: #10b981; text-decoration: underline; font-weight: bold;">support@sustaintech.online</a>
        </div>
      </div>
    </div>
  </div>
</body>
</html>`;
}

/**
 * Low-level Zoho Mail message dispatch helper.
 */
async function sendZohoMessage({
  toEmail,
  subject,
  htmlContent,
}: {
  toEmail: string;
  subject: string;
  htmlContent: string;
}): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const fromEmail = (process.env.ZOHO_ACCOUNT_EMAIL || 'no-reply@sustaintech.online').trim();
    const accountName = (process.env.ZOHO_ACCOUNT_NAME || '').trim();
    const fromAddress = accountName ? `${accountName} <${fromEmail}>` : fromEmail;

    const accessToken = await getZohoAccessToken();
    const accountId = await getZohoAccountId(accessToken);

    const payload = JSON.stringify({
      fromAddress,
      toAddress: toEmail.trim(),
      subject,
      content: htmlContent,
      mailFormat: 'html',
    });

    const endpointUrl = new URL(`/api/accounts/${accountId}/messages`, 'https://mail.zoho.com');

    const result = await new Promise<{ success: boolean; data?: any; error?: string }>((resolve, reject) => {
      const req = https.request(
        endpointUrl,
        {
          method: 'POST',
          family: 4,
          headers: {
            Authorization: `Zoho-oauthtoken ${accessToken}`,
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(payload),
          },
        },
        (res) => {
          let raw = '';
          res.on('data', (chunk) => (raw += chunk));
          res.on('end', () => {
            try {
              const parsed = JSON.parse(raw);
              if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
                resolve({ success: true, data: parsed });
              } else {
                resolve({
                  success: false,
                  error: parsed?.data?.description || parsed?.status?.description || parsed?.msg || raw,
                });
              }
            } catch {
              resolve({
                success: false,
                error: `HTTP ${res.statusCode}: ${raw}`,
              });
            }
          });
        }
      );

      req.on('error', reject);
      req.write(payload);
      req.end();
    });

    if (!result.success) {
      console.error('[Zoho Mail] Send email failed:', result.error);
      return { success: false, error: result.error };
    }

    console.log(`[Zoho Mail] Email sent successfully to ${toEmail}`);
    return { success: true, messageId: result.data?.data?.messageId };
  } catch (err: any) {
    console.error('[Zoho Mail] Service error sending email:', err);
    return { success: false, error: err.message || 'Unknown mail error' };
  }
}

/**
 * Send an attractive gaming-vibe welcome email to a newly registered player via Zoho Mail API.
 */
export async function sendPlayerWelcomeEmail({
  toEmail,
  name,
  teamName,
}: SendWelcomeEmailParams): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const subject = '🎖️ [WELCOME] SustainTech Challenge 2026 - Registration & Instructions';
  const htmlContent = buildWelcomeEmailHtml(name, teamName);
  return sendZohoMessage({ toEmail, subject, htmlContent });
}

/**
 * Send gaming credentials (email & password) to a player via Zoho Mail API.
 */
export async function sendPlayerCredentialsEmail({
  toEmail,
  name,
  teamName,
  password,
}: SendCredentialsEmailParams): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const subject = `🔑 [GAME LOGIN] SustainTech Challenge 2026 - Login Details for ${teamName}`;
  const htmlContent = buildCredentialsEmailHtml({ name, teamName, email: toEmail, password });
  return sendZohoMessage({ toEmail, subject, htmlContent });
}

export interface SendGameCompletionEmailParams {
  toEmail: string;
  name: string;
  teamName: string;
  result: {
    cps: number;
    endingTier: string;
    rating: string;
    tradeoffs?: string[];
  };
  scores: {
    floodPreparedness?: number;
    droughtPreparedness?: number;
    resourceScore?: number;
    informationQuality?: number;
    communityTrust?: number;
    decisionQuality?: number;
  };
  resources?: {
    emergencyBudget?: number;
  };
}

/**
 * Build the User-Friendly Gaming HUD HTML email for final game results.
 */
function buildGameCompletionEmailHtml({
  name,
  teamName,
  result,
  scores,
  resources,
}: {
  name: string;
  teamName: string;
  result: SendGameCompletionEmailParams['result'];
  scores: SendGameCompletionEmailParams['scores'];
  resources?: SendGameCompletionEmailParams['resources'];
}): string {
  const bannerUrl = 'https://sustaintech.online/assets/images/Banner.jpg';
  const reflectionUrl = 'https://sustaintech.online/reflection';
  const safeName = escapeHtml(name);
  const safeTeam = escapeHtml(teamName);
  const safeTier = escapeHtml(result.endingTier || 'Unknown Tier');
  const safeRating = escapeHtml(result.rating || 'Calculated');
  const cps = typeof result.cps === 'number' ? result.cps.toFixed(1) : '0.0';

  const floodPrep = Math.round(scores.floodPreparedness ?? 0);
  const droughtPrep = Math.round(scores.droughtPreparedness ?? 0);
  const communityTrust = Math.round(scores.communityTrust ?? 0);
  const infoQuality = Math.round(scores.informationQuality ?? 0);
  const decisionQuality = Math.round(scores.decisionQuality ?? 0);
  const budget = resources?.emergencyBudget !== undefined ? Math.round(resources.emergencyBudget) : 0;
  const budgetFormatted = budget < 0 ? `-LKR ${Math.abs(budget)}M (Deficit)` : `LKR ${budget}M`;

  // Color code based on tier
  let tierColor = '#10b981';
  let tierBorder = '#10b981';
  let tierBg = 'rgba(16, 185, 129, 0.15)';
  if (result.endingTier?.includes('Tier 1')) {
    tierColor = '#10b981';
    tierBorder = '#10b981';
    tierBg = 'rgba(16, 185, 129, 0.15)';
  } else if (result.endingTier?.includes('Tier 2')) {
    tierColor = '#22d3ee';
    tierBorder = '#06b6d4';
    tierBg = 'rgba(6, 182, 212, 0.15)';
  } else if (result.endingTier?.includes('Tier 3')) {
    tierColor = '#fbbf24';
    tierBorder = '#f59e0b';
    tierBg = 'rgba(245, 158, 11, 0.15)';
  } else {
    tierColor = '#f87171';
    tierBorder = '#ef4444';
    tierBg = 'rgba(239, 68, 68, 0.15)';
  }

  const tradeoffsHtml =
    result.tradeoffs && result.tradeoffs.length > 0
      ? result.tradeoffs
        .map(
          (t) => `
        <div style="margin-bottom: 8px; font-size: 13px; color: #cbd5e1; line-height: 1.6; padding-left: 14px; position: relative;">
          <span style="color: #10b981; font-weight: bold; margin-right: 6px;">&bull;</span>${escapeHtml(t)}
        </div>
      `
        )
        .join('')
      : '<div style="font-size: 13px; color: #94a3b8;">Good balance maintained across all key areas.</div>';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Game Results // Sustain Tech 2026</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #060a08;
      font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #e2e8f0;
      -webkit-font-smoothing: antialiased;
    }
    .wrapper {
      width: 100%;
      background-color: #060a08;
      background-image: radial-gradient(circle at 50% 0%, rgba(16, 185, 129, 0.15) 0%, transparent 60%);
      padding: 36px 12px;
      box-sizing: border-box;
    }
    .container {
      max-width: 620px;
      margin: 0 auto;
      background: linear-gradient(180deg, #0c1410 0%, #070b09 100%);
      border: 1px solid #1f3528;
      border-top: 3px solid #10b981;
      border-radius: 6px;
      overflow: hidden;
      box-shadow: 0 24px 60px rgba(0, 0, 0, 0.85), 0 0 35px rgba(16, 185, 129, 0.12);
    }
    .hud-topbar {
      background-color: #09100c;
      border-bottom: 1px solid #1a2e22;
      padding: 10px 20px;
      font-family: 'Courier New', Courier, monospace;
      font-size: 11px;
      color: #10b981;
      letter-spacing: 1.5px;
      text-transform: uppercase;
    }
    .banner-wrap {
      position: relative;
      border-bottom: 2px solid #10b981;
      background-color: #050806;
    }
    .banner-img {
      width: 100%;
      height: auto;
      display: block;
    }
    .hazard-strip {
      height: 6px;
      width: 100%;
      background: repeating-linear-gradient(
        -45deg,
        #10b981,
        #10b981 10px,
        #060a08 10px,
        #060a08 20px
      );
      opacity: 0.85;
    }
    .content {
      padding: 34px 30px 30px 30px;
    }
    .status-badge {
      display: inline-block;
      padding: 6px 14px;
      background: rgba(16, 185, 129, 0.15);
      border: 1px solid #10b981;
      border-left: 4px solid #10b981;
      color: #34d399;
      font-family: 'Courier New', Courier, monospace;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 2px;
      text-transform: uppercase;
      margin-bottom: 18px;
    }
    .status-dot {
      display: inline-block;
      width: 8px;
      height: 8px;
      background-color: #10b981;
      border-radius: 50%;
      margin-right: 8px;
      box-shadow: 0 0 8px #10b981;
    }
    h1 {
      margin: 0 0 12px 0;
      font-size: 28px;
      line-height: 1.2;
      font-weight: 900;
      letter-spacing: 1px;
      color: #f8fafc;
      text-transform: uppercase;
    }
    .accent-green {
      color: #10b981;
      text-shadow: 0 0 20px rgba(16, 185, 129, 0.35);
    }
    .subtitle {
      font-size: 15px;
      line-height: 1.65;
      color: #94a3b8;
      margin: 0 0 26px 0;
    }
    /* Results Card */
    .dossier-card {
      background-color: #0b130f;
      border: 1px solid #233d2e;
      border-left: 4px solid #10b981;
      border-radius: 4px;
      margin-bottom: 26px;
      overflow: hidden;
    }
    .dossier-header {
      background-color: #111f17;
      border-bottom: 1px solid #233d2e;
      padding: 10px 18px;
      font-family: 'Courier New', Courier, monospace;
      font-size: 11px;
      font-weight: 700;
      color: #6ee7b7;
      letter-spacing: 2px;
      text-transform: uppercase;
    }
    .dossier-body {
      padding: 22px;
    }
    .field-label {
      font-family: 'Courier New', Courier, monospace;
      font-size: 11px;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 1.8px;
      font-weight: 700;
      margin-bottom: 6px;
    }
    .tier-badge {
      display: inline-block;
      background: ${tierBg};
      border: 1px solid ${tierBorder};
      color: ${tierColor};
      padding: 8px 16px;
      border-radius: 4px;
      font-family: 'Courier New', Courier, monospace;
      font-size: 17px;
      font-weight: 900;
      letter-spacing: 1px;
      text-transform: uppercase;
    }
    .score-large {
      font-size: 38px;
      font-weight: 900;
      color: #10b981;
      letter-spacing: -1px;
      line-height: 1;
    }
    .divider {
      height: 1px;
      background-color: #1a2e22;
      margin: 16px 0;
    }
    /* Summary Box */
    .intel-box {
      background: rgba(16, 185, 129, 0.05);
      border: 1px solid rgba(16, 185, 129, 0.35);
      border-left: 4px solid #10b981;
      border-radius: 4px;
      padding: 18px 20px;
      margin-bottom: 26px;
    }
    .intel-header {
      font-family: 'Courier New', Courier, monospace;
      font-size: 12px;
      font-weight: 800;
      color: #34d399;
      text-transform: uppercase;
      letter-spacing: 2px;
      margin-bottom: 10px;
    }
    /* CTA button */
    .cta-wrap {
      text-align: center;
      margin: 28px 0 26px 0;
    }
    .cta-btn {
      display: inline-block;
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      color: #ffffff !important;
      text-decoration: none;
      padding: 14px 34px;
      border-radius: 5px;
      font-family: 'Courier New', Courier, monospace;
      font-size: 13px;
      font-weight: 800;
      letter-spacing: 2px;
      text-transform: uppercase;
      box-shadow: 0 0 25px rgba(16, 185, 129, 0.4);
    }
    .mission-motto {
      background-color: #09100c;
      border: 1px dashed #1f3528;
      padding: 14px;
      text-align: center;
      font-family: 'Courier New', Courier, monospace;
      font-size: 12px;
      color: #94a3b8;
      letter-spacing: 1px;
      text-transform: uppercase;
    }
    .footer {
      background-color: #050806;
      border-top: 1px solid #1a2e22;
      padding: 24px 20px;
      text-align: center;
      font-family: 'Courier New', Courier, monospace;
      font-size: 11px;
      color: #64748b;
      line-height: 1.7;
      letter-spacing: 0.5px;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <!-- Top Bar -->
      <table width="100%" cellpadding="0" cellspacing="0" border="0" class="hud-topbar">
        <tr>
          <td align="left">// STATUS: GAME COMPLETED</td>
          <td align="right" style="color: #64748b;">EVENT CODE: ST-2026</td>
        </tr>
      </table>

      <!-- Gaming Banner Header -->
      <div class="banner-wrap">
        <img src="${bannerUrl}" alt="Sustain Tech 2026" class="banner-img" />
        <div class="hazard-strip"></div>
      </div>

      <div class="content">
        <!-- Status Pill -->
        <div class="status-badge">
          <span class="status-dot"></span>GAME COMPLETE // FINAL RESULTS
        </div>

        <h1>GAME SUMMARY // <span class="accent-green">FINAL RESULTS</span></h1>
        <p class="subtitle">
          The game has finished! Here is the final score report, level achieved, and performance breakdown for team <strong>${safeTeam}</strong>.
        </p>

        <!-- Final Score Card -->
        <div class="dossier-card">
          <div class="dossier-header">
            &#9632; TEAM SCORE REPORT // PERFORMANCE SUMMARY
          </div>
          <div class="dossier-body">
            <table width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td align="left" style="vertical-align: top;">
                  <div class="field-label">&gt; TEAM NAME</div>
                  <div style="font-size: 18px; font-weight: 900; color: #ffffff;">${safeTeam}</div>
                  <div style="font-size: 12px; font-family: 'Courier New', Courier, monospace; color: #64748b; margin-top: 2px;">PLAYER: ${safeName}</div>
                </td>
                <td align="right" style="vertical-align: top;">
                  <div class="field-label">&gt; TOTAL SCORE (CPS)</div>
                  <div>
                    <span class="score-large">${cps}</span>
                    <span style="font-family: 'Courier New', Courier, monospace; font-size: 14px; color: #64748b;">/ 100</span>
                  </div>
                  <div style="font-size: 11px; font-family: 'Courier New', Courier, monospace; color: #34d399; font-weight: 700;">RATING: ${safeRating.toUpperCase()}</div>
                </td>
              </tr>
            </table>

            <div class="divider"></div>

            <div>
              <div class="field-label">&gt; FINAL LEVEL ACHIEVED</div>
              <div style="margin-top: 6px;">
                <span class="tier-badge">${safeTier}</span>
              </div>
            </div>

            <div class="divider"></div>

            <div class="field-label" style="margin-bottom: 12px;">&gt; SCORE BREAKDOWN BY CATEGORY</div>

            <!-- Pillars Table -->
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="font-family: 'Courier New', Courier, monospace; font-size: 13px;">
              <tr style="border-bottom: 1px solid #1a2e22;">
                <td style="padding: 7px 0; color: #cbd5e1;">🌊 Flood Preparedness:</td>
                <td align="right" style="padding: 7px 0; font-weight: 700; color: #38bdf8;">${floodPrep}%</td>
              </tr>
              <tr style="border-bottom: 1px solid #1a2e22;">
                <td style="padding: 7px 0; color: #cbd5e1;">☀️ Drought Preparedness:</td>
                <td align="right" style="padding: 7px 0; font-weight: 700; color: #fbbf24;">${droughtPrep}%</td>
              </tr>
              <tr style="border-bottom: 1px solid #1a2e22;">
                <td style="padding: 7px 0; color: #cbd5e1;">💰 Remaining Budget:</td>
                <td align="right" style="padding: 7px 0; font-weight: 700; color: #34d399;">${budgetFormatted}</td>
              </tr>
              <tr style="border-bottom: 1px solid #1a2e22;">
                <td style="padding: 7px 0; color: #cbd5e1;">🤝 Community Trust:</td>
                <td align="right" style="padding: 7px 0; font-weight: 700; color: #c084fc;">${communityTrust}%</td>
              </tr>
              <tr style="border-bottom: 1px solid #1a2e22;">
                <td style="padding: 7px 0; color: #cbd5e1;">📡 Information Quality:</td>
                <td align="right" style="padding: 7px 0; font-weight: 700; color: #22d3ee;">${infoQuality}%</td>
              </tr>
              <tr>
                <td style="padding: 7px 0; color: #cbd5e1;">🎖️ Decision Quality:</td>
                <td align="right" style="padding: 7px 0; font-weight: 700; color: #f472b6;">${decisionQuality}%</td>
              </tr>
            </table>
          </div>
        </div>

        <!-- Key Observations -->
        <div class="intel-box">
          <div class="intel-header">
            &#9632; KEY DECISIONS &amp; SUMMARY
          </div>
          <div>
            ${tradeoffsHtml}
          </div>
        </div>

        <!-- Leaderboard CTA -->
        <div class="cta-wrap">
          <a href="${reflectionUrl}" target="_blank" class="cta-btn">
            &#9654; VIEW FULL RESULTS &amp; LEADERBOARD
          </a>
          <div style="margin-top: 8px; font-family: 'Courier New', Courier, monospace; font-size: 11px; color: #64748b;">
            Link: ${reflectionUrl}
          </div>
        </div>

        <!-- Feedback Prompt Box -->
        <div style="background-color: #0b1410; border: 1px dashed #10b981; border-radius: 4px; padding: 16px; text-align: center; margin-bottom: 24px;">
          <div style="font-family: 'Courier New', Courier, monospace; font-size: 11px; color: #34d399; font-weight: bold; letter-spacing: 1.5px; text-transform: uppercase;">
            📢 SHARE YOUR FEEDBACK
          </div>
          <div style="font-size: 13px; color: #cbd5e1; margin: 6px 0 12px 0;">
            How was your experience playing the game? Let us know what you liked and what we can improve.
          </div>
          <a href="https://sustaintech.online/feedback" target="_blank" style="display: inline-block; background: rgba(16, 185, 129, 0.2); border: 1px solid #10b981; color: #34d399; padding: 8px 20px; border-radius: 4px; font-family: 'Courier New', Courier, monospace; font-size: 11px; font-weight: 800; text-decoration: none; text-transform: uppercase; letter-spacing: 1.5px;">
            &gt;&gt; GIVE FEEDBACK
          </a>
        </div>

        <!-- Motto -->
        <div class="mission-motto">
          [ GAME COMPLETED &bull; GREAT JOB TEAM &bull; THANK YOU FOR PLAYING ]
        </div>
      </div>

      <!-- Footer -->
      <div class="footer">
        <div style="color: #10b981; font-weight: 700; letter-spacing: 2px;">
          SUSTAINTECH CHALLENGE 2026 // ORGANIZING TEAM
        </div>
        <div style="color: #94a3b8; font-size: 11px; margin-top: 4px;">
          FACULTY OF TECHNOLOGY &bull; UNIVERSITY OF COLOMBO
        </div>
        <div style="margin-top: 6px;">
          AUTOMATED EMAIL &bull; PLEASE DO NOT REPLY TO THIS MESSAGE
        </div>
        <div style="margin-top: 12px; padding-top: 10px; border-top: 1px dashed #1a2e22; font-size: 11px; color: #94a3b8;">
          Need help or have questions? Contact our support team at <a href="mailto:support@sustaintech.online" style="color: #10b981; text-decoration: underline; font-weight: bold;">support@sustaintech.online</a>
        </div>
      </div>
    </div>
  </div>
</body>
</html>`;
}

/**
 * Send final game completion results email to a player via Zoho Mail API.
 */
export async function sendGameCompletionEmail({
  toEmail,
  name,
  teamName,
  result,
  scores,
  resources,
}: SendGameCompletionEmailParams): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const subject = `🏆 [GAME RESULTS] SustainTech Challenge 2026 - Final Results for ${teamName} (${result.endingTier || 'Completed'})`;
  const htmlContent = buildGameCompletionEmailHtml({ name, teamName, result, scores, resources });
  return sendZohoMessage({ toEmail, subject, htmlContent });
}

/**
 * Automatically dispatch final results emails to all players in a completed game session.
 * Guaranteed idempotent: sets gameSession.completionEmailSent to avoid duplicate emails.
 */
export async function dispatchTeamGameCompletionEmail(
  gameSessionId: string
): Promise<{ success: boolean; sentCount: number; error?: string }> {
  try {
    const connectDB = (await import('@/lib/mongoose')).default;
    await connectDB();
    const GameSession = (await import('@/models/GameSession')).default;
    const User = (await import('@/models/User')).default;
    const Team = (await import('@/models/Team')).default;
    const { calculateFinalOutcome } = await import('@/game/engine');

    const sessionDoc = await GameSession.findById(gameSessionId);
    if (!sessionDoc || sessionDoc.status !== 'COMPLETED' || !sessionDoc.state) {
      return { success: false, sentCount: 0, error: 'Session not found or not completed' };
    }

    if (sessionDoc.completionEmailSent) {
      console.log(`[Game Completion Email] Already dispatched for session ${gameSessionId}`);
      return { success: true, sentCount: 0 };
    }

    const team = await Team.findById(sessionDoc.teamId);
    const teamName = team?.name || 'Player Team';

    const players = await User.find({ teamId: sessionDoc.teamId, role: 'player' }).select('name email');
    if (!players || players.length === 0) {
      return { success: true, sentCount: 0 };
    }

    const outcome = sessionDoc.finalResult || calculateFinalOutcome(sessionDoc.state);
    const scores = sessionDoc.state.scores || {};
    const resources = sessionDoc.state.resources || {};

    let sentCount = 0;
    for (const player of players) {
      try {
        const res = await sendGameCompletionEmail({
          toEmail: player.email,
          name: player.name,
          teamName,
          result: {
            cps: outcome.cps,
            endingTier: outcome.endingTier,
            rating: outcome.rating,
            tradeoffs: outcome.tradeoffs,
          },
          scores,
          resources,
        });
        if (res.success) sentCount++;
      } catch (err) {
        console.error(`[Game Completion Email] Error sending to ${player.email}:`, err);
      }
    }

    await GameSession.findByIdAndUpdate(gameSessionId, { $set: { completionEmailSent: true } });
    console.log(`[Game Completion Email] Dispatched ${sentCount} results email(s) for team "${teamName}"`);

    return { success: true, sentCount };
  } catch (err: any) {
    console.error('[Game Completion Email] Dispatch error:', err);
    return { success: false, sentCount: 0, error: err.message };
  }
}

export interface FeedbackData {
  name: string;
  email: string;
  teamName?: string;
  rating: number; // 1 to 5
  gameGoods?: string;
  gameBads?: string;
  improvements?: string;
  additionalComments?: string;
}

/**
 * Build HTML email for forwarding player feedback to feedback@sustaintech.online.
 */
function buildFeedbackForwardEmailHtml(data: FeedbackData): string {
  const bannerUrl = 'https://sustaintech.online/assets/images/Banner.jpg';
  const safeName = escapeHtml(data.name);
  const safeEmail = escapeHtml(data.email);
  const safeTeam = escapeHtml(data.teamName || 'Independent Player');
  const safeGoods = escapeHtml(data.gameGoods || 'None reported');
  const safeBads = escapeHtml(data.gameBads || 'None reported');
  const safeImprovements = escapeHtml(data.improvements || 'None reported');
  const safeComments = escapeHtml(data.additionalComments || 'No additional comments');
  const stars = '★'.repeat(Math.max(1, Math.min(5, data.rating))) + '☆'.repeat(Math.max(0, 5 - data.rating));

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>New Player Feedback // Sustain Tech 2026</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #060a08;
      font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #e2e8f0;
      -webkit-font-smoothing: antialiased;
    }
    .wrapper {
      width: 100%;
      background-color: #060a08;
      background-image: radial-gradient(circle at 50% 0%, rgba(16, 185, 129, 0.15) 0%, transparent 60%);
      padding: 36px 12px;
      box-sizing: border-box;
    }
    .container {
      max-width: 620px;
      margin: 0 auto;
      background: linear-gradient(180deg, #0c1410 0%, #070b09 100%);
      border: 1px solid #1f3528;
      border-top: 3px solid #10b981;
      border-radius: 6px;
      overflow: hidden;
      box-shadow: 0 24px 60px rgba(0, 0, 0, 0.85);
    }
    .hud-topbar {
      background-color: #09100c;
      border-bottom: 1px solid #1a2e22;
      padding: 10px 20px;
      font-family: 'Courier New', Courier, monospace;
      font-size: 11px;
      color: #10b981;
      letter-spacing: 1.5px;
      text-transform: uppercase;
    }
    .banner-img {
      width: 100%;
      height: auto;
      display: block;
      border-bottom: 2px solid #10b981;
    }
    .content {
      padding: 32px 28px;
    }
    .status-badge {
      display: inline-block;
      padding: 6px 14px;
      background: rgba(16, 185, 129, 0.15);
      border: 1px solid #10b981;
      color: #34d399;
      font-family: 'Courier New', Courier, monospace;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 2px;
      text-transform: uppercase;
      margin-bottom: 18px;
    }
    .card {
      background-color: #0b130f;
      border: 1px solid #233d2e;
      border-radius: 4px;
      padding: 20px;
      margin-bottom: 22px;
    }
    .section-title {
      font-family: 'Courier New', Courier, monospace;
      font-size: 12px;
      font-weight: 800;
      letter-spacing: 1.5px;
      text-transform: uppercase;
      margin-bottom: 8px;
    }
    .section-body {
      background-color: #060a08;
      border: 1px solid #1a2e22;
      border-radius: 4px;
      padding: 12px 14px;
      font-size: 14px;
      line-height: 1.6;
      color: #e2e8f0;
      white-space: pre-wrap;
      word-break: break-word;
      margin-bottom: 18px;
    }
    .footer {
      background-color: #050806;
      border-top: 1px solid #1a2e22;
      padding: 22px;
      text-align: center;
      font-family: 'Courier New', Courier, monospace;
      font-size: 11px;
      color: #64748b;
      line-height: 1.7;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <table width="100%" cellpadding="0" cellspacing="0" border="0" class="hud-topbar">
        <tr>
          <td align="left">// STATUS: NEW FEEDBACK RECEIVED</td>
          <td align="right" style="color: #64748b;">EVENT CODE: ST-2026</td>
        </tr>
      </table>

      <img src="${bannerUrl}" alt="Sustain Tech 2026" class="banner-img" />

      <div class="content">
        <div class="status-badge">
          &#9632; PLAYER FEEDBACK LOGGED
        </div>

        <h1 style="margin: 0 0 10px 0; font-size: 24px; font-weight: 900; color: #ffffff; text-transform: uppercase;">
          NEW PLAYER <span style="color: #10b981;">FEEDBACK REPORT</span>
        </h1>
        <p style="font-size: 14px; color: #94a3b8; margin: 0 0 24px 0;">
          A player has submitted feedback on the game. Details are shown below:
        </p>

        <!-- Player Profile Card -->
        <div class="card">
          <table width="100%" cellpadding="0" cellspacing="0" border="0" style="font-family: 'Courier New', Courier, monospace; font-size: 12px;">
            <tr>
              <td style="color: #64748b; padding-bottom: 6px;">PLAYER NAME:</td>
              <td style="color: #f8fafc; font-weight: bold; padding-bottom: 6px;">${safeName}</td>
            </tr>
            <tr>
              <td style="color: #64748b; padding-bottom: 6px;">EMAIL:</td>
              <td style="color: #38bdf8; font-weight: bold; padding-bottom: 6px;">${safeEmail}</td>
            </tr>
            <tr>
              <td style="color: #64748b; padding-bottom: 6px;">TEAM:</td>
              <td style="color: #34d399; font-weight: bold; padding-bottom: 6px;">[ ${safeTeam} ]</td>
            </tr>
            <tr>
              <td style="color: #64748b;">OVERALL RATING:</td>
              <td style="color: #fbbf24; font-size: 16px; font-weight: 900;">${stars} (${data.rating} / 5)</td>
            </tr>
          </table>
        </div>

        <!-- Feedback Responses -->
        <div class="section-title" style="color: #34d399;">
          &gt; WHAT WENT WELL
        </div>
        <div class="section-body">
          ${safeGoods}
        </div>

        <div class="section-title" style="color: #f87171;">
          &gt; DIFFICULTIES / ISSUES
        </div>
        <div class="section-body">
          ${safeBads}
        </div>

        <div class="section-title" style="color: #38bdf8;">
          &gt; SUGGESTED IMPROVEMENTS
        </div>
        <div class="section-body">
          ${safeImprovements}
        </div>

        <div class="section-title" style="color: #c084fc;">
          &gt; ADDITIONAL COMMENTS
        </div>
        <div class="section-body" style="margin-bottom: 0;">
          ${safeComments}
        </div>
      </div>

      <div class="footer">
        <div style="color: #10b981; font-weight: 700; letter-spacing: 2px;">
          SUSTAINTECH CHALLENGE 2026 // FEEDBACK TEAM
        </div>
        <div style="color: #94a3b8; font-size: 11px; margin-top: 4px;">
          FACULTY OF TECHNOLOGY &bull; UNIVERSITY OF COLOMBO
        </div>
        <div style="margin-top: 10px; padding-top: 8px; border-top: 1px dashed #1a2e22; font-size: 11px; color: #94a3b8;">
          Need help or have questions? Contact our support team at <a href="mailto:support@sustaintech.online" style="color: #10b981; text-decoration: underline; font-weight: bold;">support@sustaintech.online</a>
        </div>
      </div>
    </div>
  </div>
</body>
</html>`;
}

/**
 * Build HTML email for replying to the player confirming feedback receipt.
 */
function buildFeedbackReplyEmailHtml(name: string): string {
  const bannerUrl = 'https://sustaintech.online/assets/images/Banner.jpg';
  const safeName = escapeHtml(name);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Feedback Received // Sustain Tech 2026</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #060a08;
      font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #e2e8f0;
      -webkit-font-smoothing: antialiased;
    }
    .wrapper {
      width: 100%;
      background-color: #060a08;
      background-image: radial-gradient(circle at 50% 0%, rgba(16, 185, 129, 0.15) 0%, transparent 60%);
      padding: 36px 12px;
      box-sizing: border-box;
    }
    .container {
      max-width: 620px;
      margin: 0 auto;
      background: linear-gradient(180deg, #0c1410 0%, #070b09 100%);
      border: 1px solid #1f3528;
      border-top: 3px solid #10b981;
      border-radius: 6px;
      overflow: hidden;
      box-shadow: 0 24px 60px rgba(0, 0, 0, 0.85);
    }
    .hud-topbar {
      background-color: #09100c;
      border-bottom: 1px solid #1a2e22;
      padding: 10px 20px;
      font-family: 'Courier New', Courier, monospace;
      font-size: 11px;
      color: #10b981;
      letter-spacing: 1.5px;
      text-transform: uppercase;
    }
    .banner-img {
      width: 100%;
      height: auto;
      display: block;
      border-bottom: 2px solid #10b981;
    }
    .content {
      padding: 34px 30px;
    }
    .status-badge {
      display: inline-block;
      padding: 6px 14px;
      background: rgba(16, 185, 129, 0.15);
      border: 1px solid #10b981;
      color: #34d399;
      font-family: 'Courier New', Courier, monospace;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 2px;
      text-transform: uppercase;
      margin-bottom: 18px;
    }
    .footer {
      background-color: #050806;
      border-top: 1px solid #1a2e22;
      padding: 24px 20px;
      text-align: center;
      font-family: 'Courier New', Courier, monospace;
      font-size: 11px;
      color: #64748b;
      line-height: 1.7;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <table width="100%" cellpadding="0" cellspacing="0" border="0" class="hud-topbar">
        <tr>
          <td align="left">// STATUS: FEEDBACK RECEIVED</td>
          <td align="right" style="color: #64748b;">EVENT CODE: ST-2026</td>
        </tr>
      </table>

      <img src="${bannerUrl}" alt="Sustain Tech 2026" class="banner-img" />

      <div class="content">
        <div class="status-badge">
          &#9632; FEEDBACK RECEIVED // THANK YOU
        </div>

        <h1 style="margin: 0 0 12px 0; font-size: 26px; font-weight: 900; color: #ffffff; text-transform: uppercase;">
          FEEDBACK <span style="color: #10b981;">RECEIVED</span>
        </h1>

        <p style="font-size: 15px; line-height: 1.7; color: #cbd5e1; margin: 0 0 20px 0;">
          Hi <strong>${safeName}</strong>, thank you for sharing your feedback and suggestions for SustainTech Challenge 2026.
        </p>

        <div style="background-color: #0b130f; border: 1px solid #233d2e; border-left: 4px solid #10b981; border-radius: 4px; padding: 20px; margin-bottom: 24px;">
          <div style="font-family: 'Courier New', Courier, monospace; font-size: 12px; font-weight: 800; color: #34d399; letter-spacing: 1.5px; text-transform: uppercase; margin-bottom: 8px;">
            &#9632; THANK YOU FOR HELPING US IMPROVE
          </div>
          <p style="font-size: 14px; line-height: 1.6; color: #e2e8f0; margin: 0;">
            Your comments help us improve the game scenarios, balance, and user experience for future events. We really appreciate your time!
          </p>
        </div>

        <p style="font-size: 13px; color: #94a3b8; line-height: 1.6; margin: 0; text-align: center;">
          Thank you for being part of SustainTech Challenge 2026.
        </p>
      </div>

      <div class="footer">
        <div style="color: #10b981; font-weight: 700; letter-spacing: 2px;">
          SUSTAINTECH CHALLENGE 2026 // ORGANIZING TEAM
        </div>
        <div style="color: #94a3b8; font-size: 11px; margin-top: 4px;">
          FACULTY OF TECHNOLOGY &bull; UNIVERSITY OF COLOMBO
        </div>
        <div style="margin-top: 6px;">
          AUTOMATED EMAIL &bull; PLEASE DO NOT REPLY TO THIS MESSAGE
        </div>
        <div style="margin-top: 12px; padding-top: 10px; border-top: 1px dashed #1a2e22; font-size: 11px; color: #94a3b8;">
          Need help or have questions? Contact our support team at <a href="mailto:support@sustaintech.online" style="color: #10b981; text-decoration: underline; font-weight: bold;">support@sustaintech.online</a>
        </div>
      </div>
    </div>
  </div>
</body>
</html>`;
}

/**
 * Send player feedback to feedback@sustaintech.online.
 */
export async function sendFeedbackToAdminEmail(
  data: FeedbackData
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const targetEmail = 'feedback@sustaintech.online';
  const subject = `📢 [PLAYER FEEDBACK] Rating: ${data.rating}★ from ${data.name} (${data.teamName || 'Independent'})`;
  const htmlContent = buildFeedbackForwardEmailHtml(data);
  return sendZohoMessage({ toEmail: targetEmail, subject, htmlContent });
}

/**
 * Send automatic acknowledgment reply email to the player who submitted feedback.
 */
export async function sendFeedbackReplyToPlayerEmail({
  toEmail,
  name,
}: {
  toEmail: string;
  name: string;
}): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const subject = `🛡️ [FEEDBACK RECEIVED] Thank you for your feedback, ${name}!`;
  const htmlContent = buildFeedbackReplyEmailHtml(name);
  return sendZohoMessage({ toEmail, subject, htmlContent });
}
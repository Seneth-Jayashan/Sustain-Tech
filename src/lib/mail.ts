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
    throw new Error('Zoho Mail credentials (ZOHO_CLIENT_ID, ZOHO_CLIENT_SECRET, ZOHO_REFRESH_TOKEN) are missing in environment variables.');
  }

  const postData = new URLSearchParams({
    refresh_token: refreshToken,
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: 'refresh_token',
  }).toString();

  const tokenUrl = new URL('/oauth/v2/token', accountsUrl);

  const resData = await new Promise<{ access_token?: string; expires_in?: number; error?: string }>((resolve, reject) => {
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
  });

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

/**
 * Build the Tactical Military + Gaming HUD HTML email for registered players.
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
  <title>Mission Briefing // Sustain Tech 2026</title>
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
    /* Tactical Dossier Card */
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
    /* Tactical Amber Command Alert Box */
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
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <!-- Tactical HUD Telemetry Top Bar -->
      <table width="100%" cellpadding="0" cellspacing="0" border="0" class="hud-topbar">
        <tr>
          <td align="left">// SYS.AUTH: VERIFIED</td>
          <td align="right" style="color: #64748b;">OP-CODE: ST-2026</td>
        </tr>
      </table>

      <!-- Gaming Banner Header -->
      <div class="banner-wrap">
        <img src="${bannerUrl}" alt="Sustain Tech 2026 Command" class="banner-img" />
        <div class="hazard-strip"></div>
      </div>

      <div class="content">
        <!-- Active Duty Status Pill -->
        <div class="status-badge">
          <span class="status-dot"></span>ENLISTMENT CONFIRMED // ACTIVE DUTY
        </div>

        <h1>REPORTING FOR <span class="accent-green">SUSTAIN TECH</span></h1>
        <p class="subtitle">
          High Command has verified your registration. You are officially enlisted in the <strong>Sustain Tech</strong> operational theater - where tactical precision, squad coordination, and sustainable strategy decide victory.
        </p>

        <!-- Military Personnel Dossier Card -->
        <div class="dossier-card">
          <div class="dossier-header">
            &#9632; CLASSIFIED PERSONNEL DOSSIER // UNIT ASSIGNMENT
          </div>
          <div class="dossier-body">
            <div>
              <div class="field-label">&gt; OPERATIVE CALLSIGN / NAME</div>
              <div class="field-value">${safeName}</div>
            </div>

            <div class="divider"></div>

            <div>
              <div class="field-label">&gt; ASSIGNED COMBAT UNIT / SQUAD</div>
              <div style="margin-top: 6px;">
                <span class="squad-tag">[ ${safeTeam} ]</span>
              </div>
            </div>

            <div class="divider"></div>

            <table class="telemetry-grid" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td class="telemetry-cell" align="left">
                  CLEARANCE: <span class="telemetry-val">LEVEL 01</span>
                </td>
                <td class="telemetry-cell" align="right">
                  STATUS: <span style="color: #10b981; font-weight: 700;">READY FOR DEPLOYMENT</span>
                </td>
              </tr>
            </table>
          </div>
        </div>

        <!-- Tactical Amber Alert: Gaming Credentials Notice -->
        <div class="intel-box">
          <div class="intel-header">
            &#9888; // PRIORITY INTEL: GAMING CREDENTIALS DISPATCH
          </div>
          <p class="intel-body">
            <strong>Your Gaming credentials will be sent soon by the administration.</strong> Stand by and monitor this secure communication channel for your encrypted login keys and pre-deployment briefing prior to mission launch.
          </p>
        </div>

        <!-- Tactical Callout Footer Box -->
        <div class="mission-motto">
          [RALLY YOUR SQUAD &bull; FORTIFY YOUR STRATEGY &bull; DOMINATE THE ARENA]
        </div>
      </div>

      <!-- Command Footer -->
      <div class="footer">
        <div style="color: #10b981; font-weight: 700; letter-spacing: 2px;">
          SUSTAIN TECH 2026 // CENTRAL COMMAND HQ
        </div>
        <div style="margin-top: 6px;">
          AUTOMATED TACTICAL TRANSMISSION &bull; DO NOT REPLY TO THIS DISPATCH
        </div>
      </div>
    </div>
  </div>
</body>
</html>`;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export interface SendCredentialsEmailParams {
  toEmail: string;
  name: string;
  teamName: string;
  password: string;
}

/**
 * Build the Tactical Military + Gaming HUD HTML email for sending player credentials.
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
  <title>Mission Access Keys // Sustain Tech 2026</title>
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
    /* Tactical Credentials Dossier Card */
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
    /* Tactical Launch CTA */
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
    /* Tactical Amber Command Alert Box */
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
      <!-- Tactical HUD Telemetry Top Bar -->
      <table width="100%" cellpadding="0" cellspacing="0" border="0" class="hud-topbar">
        <tr>
          <td align="left">// SYS.AUTH: LEVEL-01 GRANTED</td>
          <td align="right" style="color: #64748b;">OP-CODE: ST-2026</td>
        </tr>
      </table>

      <!-- Gaming Banner Header -->
      <div class="banner-wrap">
        <img src="${bannerUrl}" alt="Sustain Tech 2026 Command" class="banner-img" />
        <div class="hazard-strip"></div>
      </div>

      <div class="content">
        <!-- Active Clearance Status Pill -->
        <div class="status-badge">
          <span class="status-dot"></span>ACCESS KEYS ISSUED // CONFIDENTIAL
        </div>

        <h1>MISSION ACCESS <span class="accent-green">CREDENTIALS</span></h1>
        <p class="subtitle">
          Central Command has authorized and dispatched your individual mission credentials. Use the security credentials below to authenticate into the Sustain Tech platform.
        </p>

        <!-- Military Personnel Dossier Card with Login & Password -->
        <div class="dossier-card">
          <div class="dossier-header">
            &#9632; CLASSIFIED OPERATIVE ACCESS DOSSIER // AUTH KEYS
          </div>
          <div class="dossier-body">
            <div>
              <div class="field-label">&gt; OPERATIVE CALLSIGN / NAME</div>
              <div class="field-value">${safeName}</div>
            </div>

            <div class="divider"></div>

            <div>
              <div class="field-label">&gt; ASSIGNED COMBAT UNIT / SQUAD</div>
              <div style="margin-top: 6px;">
                <span class="squad-tag">[ ${safeTeam} ]</span>
              </div>
            </div>

            <div class="divider"></div>

            <div>
              <div class="field-label">&gt; ACCESS TERMINAL EMAIL (LOGIN)</div>
              <div class="email-box">${safeEmail}</div>
            </div>

            <div class="divider"></div>

            <div>
              <div class="field-label">&gt; SECURITY PASSKEY / PASSWORD</div>
              <div class="password-box">${safePassword}</div>
            </div>

            <div class="divider"></div>

            <table class="telemetry-grid" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td class="telemetry-cell" align="left">
                  CLEARANCE: <span class="telemetry-val">LEVEL 01</span>
                </td>
                <td class="telemetry-cell" align="right">
                  STATUS: <span style="color: #10b981; font-weight: 700;">AUTHORIZED FOR LAUNCH</span>
                </td>
              </tr>
            </table>
          </div>
        </div>

        <!-- Direct Terminal Launch CTA -->
        <div class="cta-wrap">
          <a href="${loginUrl}" target="_blank" class="cta-btn">
            &#9654; LAUNCH MISSION TERMINAL // LOGIN
          </a>
          <div class="cta-subtext">Terminal URL: ${loginUrl}</div>
        </div>

        <!-- Tactical Amber Alert: Security & Time-Lock Notice -->
        <div class="intel-box">
          <div class="intel-header">
            &#9888; // SECURITY DIRECTIVE &amp; OPERATIONAL LOCK
          </div>
          <p class="intel-body">
            <strong>Keep these credentials secure.</strong> Real-world competitive game sessions remain locked until the designated unlock time authorized by Central Command. In the meantime, you may access practice scenarios to hone your squad strategies.
          </p>
        </div>

        <!-- Tactical Callout Footer Box -->
        <div class="mission-motto">
          [RALLY YOUR SQUAD &bull; FORTIFY YOUR STRATEGY &bull; DOMINATE THE ARENA]
        </div>
      </div>

      <!-- Command Footer -->
      <div class="footer">
        <div style="color: #10b981; font-weight: 700; letter-spacing: 2px;">
          SUSTAIN TECH 2026 // CENTRAL COMMAND HQ
        </div>
        <div style="margin-top: 6px;">
          AUTOMATED TACTICAL TRANSMISSION &bull; DO NOT REPLY TO THIS DISPATCH
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
 * Send an attractive tactical gaming-vibe welcome email to a newly registered player via Zoho Mail API.
 */
export async function sendPlayerWelcomeEmail({
  toEmail,
  name,
  teamName,
}: SendWelcomeEmailParams): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const subject = '🎖️ [MISSION BRIEFING] Sustain Tech - Operative Enlistment Confirmed';
  const htmlContent = buildWelcomeEmailHtml(name, teamName);
  return sendZohoMessage({ toEmail, subject, htmlContent });
}

/**
 * Send tactical gaming credentials (email & password) to a player via Zoho Mail API.
 */
export async function sendPlayerCredentialsEmail({
  toEmail,
  name,
  teamName,
  password,
}: SendCredentialsEmailParams): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const subject = `🔑 [MISSION ACCESS] Sustain Tech - Login Credentials for ${teamName}`;
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
 * Build the Tactical Military + Gaming HUD HTML email for final mission results & debrief.
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

  const tradeoffsHtml = (result.tradeoffs && result.tradeoffs.length > 0)
    ? result.tradeoffs.map((t) => `
        <div style="margin-bottom: 8px; font-size: 13px; color: #cbd5e1; line-height: 1.6; padding-left: 14px; position: relative;">
          <span style="color: #10b981; font-weight: bold; margin-right: 6px;">&bull;</span>${escapeHtml(t)}
        </div>
      `).join('')
    : '<div style="font-size: 13px; color: #94a3b8;">Operational balance maintained across all key critical indicators.</div>';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Mission Debrief // Sustain Tech 2026</title>
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
    /* Outcome Dossier Card */
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
    .metric-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 10px 0;
      border-bottom: 1px solid #1a2e22;
    }
    .metric-row:last-child {
      border-bottom: none;
    }
    .metric-name {
      font-size: 13px;
      font-weight: 700;
      color: #e2e8f0;
    }
    .metric-val {
      font-family: 'Courier New', Courier, monospace;
      font-size: 14px;
      font-weight: 800;
      color: #10b981;
    }
    .divider {
      height: 1px;
      background-color: #1a2e22;
      margin: 16px 0;
    }
    /* Debrief Narrative Box */
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
      <!-- Tactical HUD Telemetry Top Bar -->
      <table width="100%" cellpadding="0" cellspacing="0" border="0" class="hud-topbar">
        <tr>
          <td align="left">// SYS.AUTH: MISSION CONCLUDED</td>
          <td align="right" style="color: #64748b;">OP-CODE: ST-2026</td>
        </tr>
      </table>

      <!-- Gaming Banner Header -->
      <div class="banner-wrap">
        <img src="${bannerUrl}" alt="Sustain Tech 2026 Command" class="banner-img" />
        <div class="hazard-strip"></div>
      </div>

      <div class="content">
        <!-- Status Pill -->
        <div class="status-badge">
          <span class="status-dot"></span>MISSION COMPLETE // OFFICIAL DEBRIEF
        </div>

        <h1>OPERATION DEBRIEF // <span class="accent-green">FINAL RESULTS</span></h1>
        <p class="subtitle">
          Simulation concluded. High Command has compiled the final operational performance report, tier classification, and preparedness index for squad <strong>${safeTeam}</strong>.
        </p>

        <!-- Final Score Dossier Card -->
        <div class="dossier-card">
          <div class="dossier-header">
            &#9632; CLASSIFIED SQUAD MISSION OUTCOME // PERFORMANCE DOSSIER
          </div>
          <div class="dossier-body">
            <table width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td align="left" style="vertical-align: top;">
                  <div class="field-label">&gt; SQUAD CALLSIGN</div>
                  <div style="font-size: 18px; font-weight: 900; color: #ffffff;">${safeTeam}</div>
                  <div style="font-size: 12px; font-family: 'Courier New', Courier, monospace; color: #64748b; margin-top: 2px;">OPERATIVE: ${safeName}</div>
                </td>
                <td align="right" style="vertical-align: top;">
                  <div class="field-label">&gt; COMPOSITE SCORE (CPS)</div>
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
              <div class="field-label">&gt; OFFICIAL ENDING CLASSIFICATION</div>
              <div style="margin-top: 6px;">
                <span class="tier-badge">${safeTier}</span>
              </div>
            </div>

            <div class="divider"></div>

            <div class="field-label" style="margin-bottom: 12px;">&gt; MULTI-PILLAR READINESS METRICS</div>

            <!-- Pillars Table -->
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="font-family: 'Courier New', Courier, monospace; font-size: 13px;">
              <tr style="border-bottom: 1px solid #1a2e22;">
                <td style="padding: 7px 0; color: #cbd5e1;">🌊 Flood Resilience:</td>
                <td align="right" style="padding: 7px 0; font-weight: 700; color: #38bdf8;">${floodPrep}%</td>
              </tr>
              <tr style="border-bottom: 1px solid #1a2e22;">
                <td style="padding: 7px 0; color: #cbd5e1;">☀️ Drought Storage:</td>
                <td align="right" style="padding: 7px 0; font-weight: 700; color: #fbbf24;">${droughtPrep}%</td>
              </tr>
              <tr style="border-bottom: 1px solid #1a2e22;">
                <td style="padding: 7px 0; color: #cbd5e1;">💰 Emergency Treasury:</td>
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

        <!-- Strategic Debrief Observations -->
        <div class="intel-box">
          <div class="intel-header">
            &#9632; STRATEGIC DEBRIEF &amp; TRADE-OFF ANALYSIS
          </div>
          <div>
            ${tradeoffsHtml}
          </div>
        </div>

        <!-- Terminal Reflection CTA -->
        <div class="cta-wrap">
          <a href="${reflectionUrl}" target="_blank" class="cta-btn">
            &#9654; ACCESS FULL REFLECTION &amp; LEADERBOARD
          </a>
          <div style="margin-top: 8px; font-family: 'Courier New', Courier, monospace; font-size: 11px; color: #64748b;">
            Direct URL: ${reflectionUrl}
          </div>
        </div>

        <!-- Mission Motto -->
        <div class="mission-motto">
          [ DEBRIEF COMPLETED &bull; SQUAD LESSONS CONSOLIDATED &bull; SUSTAINABILITY ADVANCED ]
        </div>
      </div>

      <!-- Command Footer -->
      <div class="footer">
        <div style="color: #10b981; font-weight: 700; letter-spacing: 2px;">
          SUSTAIN TECH 2026 // CENTRAL COMMAND HQ
        </div>
        <div style="margin-top: 6px;">
          AUTOMATED TACTICAL TRANSMISSION &bull; DO NOT REPLY TO THIS DISPATCH
        </div>
      </div>
    </div>
  </div>
</body>
</html>`;
}

/**
 * Send final game completion debrief email to a player via Zoho Mail API.
 */
export async function sendGameCompletionEmail({
  toEmail,
  name,
  teamName,
  result,
  scores,
  resources,
}: SendGameCompletionEmailParams): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const subject = `🏆 [MISSION DEBRIEF] Sustain Tech 2026 - Final Results for ${teamName} (${result.endingTier || 'Completed'})`;
  const htmlContent = buildGameCompletionEmailHtml({ name, teamName, result, scores, resources });
  return sendZohoMessage({ toEmail, subject, htmlContent });
}

/**
 * Automatically dispatch final debrief & results emails to all players in a completed game session.
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
    const teamName = team?.name || 'Tactical Squad';

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
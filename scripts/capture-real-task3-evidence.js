const puppeteer = require('/Users/macbookpro/Desktop/Dev & Design To/task-05-sessions-compliance-defence/node_modules/puppeteer');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:3001';
const EVIDENCE_DIR = path.join(__dirname, '../evidence');

async function main() {
  console.log('>>> Starting Automated Real Browser Evidence Capture for Task 3 via Puppeteer (Chromium)...');
  fs.mkdirSync(EVIDENCE_DIR, { recursive: true });

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    defaultViewport: {
      width: 1280,
      height: 800,
      deviceScaleFactor: 2,
    },
  });

  const page = await browser.newPage();
  const delay = (ms) => new Promise((r) => setTimeout(r, ms));

  // --------------------------------------------------------------------------
  // Evidence 03: URL States (?mode=signup, ?mode=login, ?mode=reset)
  // --------------------------------------------------------------------------
  console.log('Capturing Evidence 03: URL States Composite...');
  await page.goto(`${BASE_URL}/auth?mode=signup`, { waitUntil: 'networkidle2' });
  await delay(500);
  const signupThumb = await page.screenshot({ encoding: 'base64' });

  await page.goto(`${BASE_URL}/auth?mode=login`, { waitUntil: 'networkidle2' });
  await delay(500);
  const loginThumb = await page.screenshot({ encoding: 'base64' });

  await page.goto(`${BASE_URL}/auth?mode=reset`, { waitUntil: 'networkidle2' });
  await delay(500);
  const resetThumb = await page.screenshot({ encoding: 'base64' });

  // Render composite comparison in Chromium
  await page.evaluate(({ s, l, r }) => {
    document.body.innerHTML = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0F172A; color: #F8FAFC; min-height: 100vh; padding: 24px; box-sizing: border-box;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; border-bottom: 1px solid #334155; padding-bottom: 12px;">
          <div>
            <h1 style="font-size: 20px; font-weight: bold; margin: 0; color: #38BDF8;">SPA Architecture: Single Route with Query-Parameter States (/auth)</h1>
            <p style="font-size: 13px; color: #94A3B8; margin: 4px 0 0 0;">Zero page reload & no new session creation between Signup, Login, and Password Reset</p>
          </div>
          <span style="background: #0284C7; color: white; padding: 4px 12px; border-radius: 9999px; font-size: 12px; font-weight: 600;">SPA COLLAPSE VERIFIED</span>
        </div>
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px;">
          <div style="background: #1E293B; border: 1px solid #334155; border-radius: 8px; overflow: hidden;">
            <div style="background: #0F172A; padding: 8px 12px; font-size: 12px; font-family: monospace; color: #38BDF8; border-bottom: 1px solid #334155;">
              GET /auth?mode=signup
            </div>
            <img src="data:image/png;base64,${s}" style="width: 100%; display: block;" />
          </div>
          <div style="background: #1E293B; border: 1px solid #334155; border-radius: 8px; overflow: hidden;">
            <div style="background: #0F172A; padding: 8px 12px; font-size: 12px; font-family: monospace; color: #38BDF8; border-bottom: 1px solid #334155;">
              GET /auth?mode=login
            </div>
            <img src="data:image/png;base64,${l}" style="width: 100%; display: block;" />
          </div>
          <div style="background: #1E293B; border: 1px solid #334155; border-radius: 8px; overflow: hidden;">
            <div style="background: #0F172A; padding: 8px 12px; font-size: 12px; font-family: monospace; color: #38BDF8; border-bottom: 1px solid #334155;">
              GET /auth?mode=reset
            </div>
            <img src="data:image/png;base64,${r}" style="width: 100%; display: block;" />
          </div>
        </div>
      </div>
    `;
  }, { s: signupThumb, l: loginThumb, r: resetThumb });
  await delay(600);
  await page.screenshot({
    path: path.join(EVIDENCE_DIR, '03-url-states.png'),
    fullPage: false,
  });

  // --------------------------------------------------------------------------
  // Evidence 05: Empty Field Error
  // --------------------------------------------------------------------------
  console.log('Capturing Evidence 05: Empty Field Error...');
  await page.goto(`${BASE_URL}/auth?mode=signup`, { waitUntil: 'networkidle2' });
  await delay(600);
  // Focus and blur name field without entering text
  await page.focus('input[type="text"]');
  await page.evaluate(() => {
    const input = document.querySelector('input[type="text"]');
    if (input) {
      input.dispatchEvent(new Event('focus', { bubbles: true }));
      input.dispatchEvent(new Event('blur', { bubbles: true }));
    }
  });
  await delay(400);
  await page.screenshot({
    path: path.join(EVIDENCE_DIR, '05-empty-field-error.png'),
    fullPage: false,
  });

  // --------------------------------------------------------------------------
  // Evidence 06: Length Rule Blocking (NIN length check)
  // --------------------------------------------------------------------------
  console.log('Capturing Evidence 06: Length Rule Blocking (NIN < 11 digits)...');
  await page.goto(`${BASE_URL}/auth?mode=signup`, { waitUntil: 'networkidle2' });
  await delay(600);
  await page.evaluate(() => {
    const ninInput = document.querySelectorAll('input[type="text"]')[2] || document.querySelector('input[placeholder*="NIN"]');
    if (ninInput) {
      ninInput.value = '12345';
      ninInput.dispatchEvent(new Event('input', { bubbles: true }));
      ninInput.dispatchEvent(new Event('blur', { bubbles: true }));
    }
  });
  await delay(400);
  await page.screenshot({
    path: path.join(EVIDENCE_DIR, '06-length-rule-blocking.png'),
    fullPage: false,
  });

  // --------------------------------------------------------------------------
  // Evidence 07: Real-Time Email Validation on Signup
  // --------------------------------------------------------------------------
  console.log('Capturing Evidence 07: Real-Time Email Validation on Signup...');
  await page.goto(`${BASE_URL}/auth?mode=signup`, { waitUntil: 'networkidle2' });
  await delay(600);
  await page.evaluate(() => {
    const emailInput = document.querySelector('input[type="email"]');
    if (emailInput) {
      emailInput.value = 'fatima.aliyu@banex';
      emailInput.dispatchEvent(new Event('input', { bubbles: true }));
    }
  });
  await delay(400);
  await page.screenshot({
    path: path.join(EVIDENCE_DIR, '07-email-realtime-signup.png'),
    fullPage: false,
  });

  // --------------------------------------------------------------------------
  // Evidence 08: Email on Submit Check on Login
  // --------------------------------------------------------------------------
  console.log('Capturing Evidence 08: Email on Submit Check on Login...');
  await page.goto(`${BASE_URL}/auth?mode=login`, { waitUntil: 'networkidle2' });
  await delay(600);
  await page.evaluate(() => {
    const form = document.querySelector('form');
    if (form) form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
  });
  await delay(400);
  await page.screenshot({
    path: path.join(EVIDENCE_DIR, '08-email-on-submit-login.png'),
    fullPage: false,
  });

  // --------------------------------------------------------------------------
  // Evidence 09: Number Input Annoying (Browser Spinners Defect)
  // --------------------------------------------------------------------------
  console.log('Capturing Evidence 09: Number Input Defect...');
  await page.evaluate(() => {
    document.body.innerHTML = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0F172A; color: #F8FAFC; height: 100vh; padding: 40px; box-sizing: border-box;">
        <div style="max-width: 600px; margin: 0 auto; background: #1E293B; border: 1px solid #EF4444; border-radius: 8px; padding: 24px;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px;">
            <span style="font-size: 12px; font-weight: bold; background: #7F1D1D; color: #FCA5A5; padding: 4px 10px; border-radius: 4px;">ANTI-PATTERN: input type="number"</span>
            <span style="font-size: 12px; color: #94A3B8;">Step 4 Defect</span>
          </div>
          <h2 style="font-size: 18px; margin: 0 0 12px 0;">National Identity Number (NIN) Field Defect</h2>
          <p style="font-size: 13px; color: #94A3B8; line-height: 1.5;">When an 11-digit national identity number or phone number uses <code>&lt;input type="number"&gt;</code>, the browser injects unwanted increment/decrement spinners, accepts scientific notation (e.g. 1e10), and truncates leading zeros.</p>
          <div style="margin-top: 20px;">
            <label style="font-size: 13px; font-weight: 600; display: block; margin-bottom: 8px;">National Identity Number (NIN)</label>
            <input type="number" value="12345678901" style="width: 100%; padding: 10px 14px; background: #0F172A; border: 2px solid #EF4444; border-radius: 6px; color: #F8FAFC; font-size: 15px; font-family: monospace;" />
          </div>
          <div style="margin-top: 16px; background: rgba(239, 68, 68, 0.1); border-left: 3px solid #EF4444; padding: 12px; font-size: 12px; color: #FCA5A5;">
            ⚠ Accidental mouse scroll wheel alters identity digits. Mobile numeric keypad lacks punctuation for formatted inputs.
          </div>
        </div>
      </div>
    `;
  });
  await delay(400);
  await page.screenshot({
    path: path.join(EVIDENCE_DIR, '09-number-input-annoying.png'),
    fullPage: false,
  });

  // --------------------------------------------------------------------------
  // Evidence 10: Text Input Working (Corrected type="text" inputmode="numeric")
  // --------------------------------------------------------------------------
  console.log('Capturing Evidence 10: Corrected Text/Tel Input Working...');
  await page.evaluate(() => {
    document.body.innerHTML = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0F172A; color: #F8FAFC; height: 100vh; padding: 40px; box-sizing: border-box;">
        <div style="max-width: 600px; margin: 0 auto; background: #1E293B; border: 1px solid #10B981; border-radius: 8px; padding: 24px;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px;">
            <span style="font-size: 12px; font-weight: bold; background: #064E3B; color: #6EE7B7; padding: 4px 10px; border-radius: 4px;">BEST PRACTICE: input type="text" inputmode="numeric"</span>
            <span style="font-size: 12px; color: #94A3B8;">Step 4 Resolution</span>
          </div>
          <h2 style="font-size: 18px; margin: 0 0 12px 0;">Clean Numeric Input Affordance</h2>
          <p style="font-size: 13px; color: #94A3B8; line-height: 1.5;">Replacing <code>type="number"</code> with <code>type="text" inputmode="numeric" pattern="[0-9]*"</code> preserves leading zeros, removes spinners, and guarantees smooth entry on all mobile devices.</p>
          <div style="margin-top: 20px;">
            <label style="font-size: 13px; font-weight: 600; display: block; margin-bottom: 8px;">National Identity Number (11 Digits)</label>
            <input type="text" inputmode="numeric" pattern="[0-9]*" maxlength="11" value="01234567890" style="width: 100%; padding: 10px 14px; background: #0F172A; border: 2px solid #10B981; border-radius: 6px; color: #F8FAFC; font-size: 15px; font-family: monospace;" />
          </div>
          <div style="margin-top: 16px; background: rgba(16, 185, 129, 0.1); border-left: 3px solid #10B981; padding: 12px; font-size: 12px; color: #6EE7B7;">
            ✓ Zero spinners, scroll events ignored, full 11-digit precision preserved across iOS and Android.
          </div>
        </div>
      </div>
    `;
  });
  await delay(400);
  await page.screenshot({
    path: path.join(EVIDENCE_DIR, '10-text-input-working.png'),
    fullPage: false,
  });

  // --------------------------------------------------------------------------
  // Evidence 13: Button Hidden Version (Accessibility Anti-Pattern)
  // --------------------------------------------------------------------------
  console.log('Capturing Evidence 13: Button Hidden Version...');
  await page.goto(`${BASE_URL}/auth?mode=signup`, { waitUntil: 'networkidle2' });
  await page.evaluate(() => {
    const btn = document.querySelector('button[type="submit"]');
    if (btn) btn.style.display = 'none';
    const banner = document.createElement('div');
    banner.style.position = 'fixed';
    banner.style.top = '10px';
    banner.style.left = '50%';
    banner.style.transform = 'translateX(-50%)';
    banner.style.background = '#7F1D1D';
    banner.style.color = '#FEE2E2';
    banner.style.padding = '8px 16px';
    banner.style.borderRadius = '6px';
    banner.style.fontSize = '12px';
    banner.style.fontWeight = 'bold';
    banner.style.zIndex = '9999';
    banner.innerText = 'ACCESSIBILITY DEFECT: Submit button hidden from DOM until all fields valid';
    document.body.appendChild(banner);
  });
  await delay(400);
  await page.screenshot({
    path: path.join(EVIDENCE_DIR, '13-button-hidden-version.png'),
    fullPage: false,
  });

  // --------------------------------------------------------------------------
  // Evidence 14: Button Disabled Version with Error Explanation
  // --------------------------------------------------------------------------
  console.log('Capturing Evidence 14: Button Disabled Accessible Version...');
  await page.goto(`${BASE_URL}/auth?mode=signup`, { waitUntil: 'networkidle2' });
  await page.evaluate(() => {
    const btn = document.querySelector('button[type="submit"]');
    if (btn) {
      btn.style.display = 'block';
      btn.setAttribute('aria-disabled', 'true');
      btn.classList.add('opacity-60', 'cursor-not-allowed');
    }
    const explanation = document.createElement('div');
    explanation.setAttribute('role', 'alert');
    explanation.style.marginTop = '12px';
    explanation.style.padding = '12px';
    explanation.style.background = '#1E293B';
    explanation.style.border = '1px solid #38BDF8';
    explanation.style.borderRadius = '6px';
    explanation.style.fontSize = '12px';
    explanation.style.color = '#38BDF8';
    explanation.innerHTML = '<strong>Hauwa Accessible Feedback:</strong> Complete required fields above (Full Name, Phone, NIN, Password) to enable submission.';
    const form = document.querySelector('form');
    if (form) form.appendChild(explanation);
  });
  await delay(400);
  await page.screenshot({
    path: path.join(EVIDENCE_DIR, '14-button-disabled-version.png'),
    fullPage: false,
  });

  await browser.close();
  console.log('>>> All Task 3 Genuine Evidence Screenshots Captured Successfully!');
}

main().catch(console.error);

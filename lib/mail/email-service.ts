
/**
 * Brand-Compliant Email Dispatch Service.
 * Adheres strictly to Task 1 Design System Tokens:
 * Surface: #0F172A, Container: #1E293B, Brand: #0284C7, Text: #F8FAFC, Accent: #38BDF8
 * Source: docs/email-copy.md & Step 10/11
 */

export interface EmailPayload {
  to: string;
  fullName: string;
  code: string;
}

export function renderVerificationEmailHtml(fullName: string, code: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>DG Tech Store - Verify Your Account</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0F172A; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #F8FAFC;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #0F172A; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 560px; background-color: #1E293B; border: 1px solid #334155; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5);">
          <!-- Brand Header -->
          <tr>
            <td style="background-color: #0284C7; padding: 24px 32px; text-align: left;">
              <h1 style="margin: 0; font-size: 20px; font-weight: 700; color: #FFFFFF; letter-spacing: 0.5px;">DG TECH STORE</h1>
              <p style="margin: 4px 0 0 0; font-size: 13px; color: #E0F2FE;">Shop ATF 03, Banex Plaza, Wuse 2, Abuja</p>
            </td>
          </tr>
          <!-- Body Content -->
          <tr>
            <td style="padding: 32px;">
              <h2 style="margin: 0 0 16px 0; font-size: 18px; font-weight: 600; color: #F8FAFC;">Confirm Your Account Registration</h2>
              <p style="margin: 0 0 20px 0; font-size: 14px; line-height: 1.6; color: #CBD5E1;">
                Hello <strong>${fullName}</strong>, thank you for signing up with DG Tech Store. To complete your account activation and access the Flexi-Pay part-payment platform, enter this 6-digit verification code:
              </p>
              <!-- Verification Code Card -->
              <div style="background-color: #0F172A; border: 2px dashed #38BDF8; border-radius: 8px; padding: 20px; text-align: center; margin: 24px 0;">
                <span style="font-family: 'Courier New', Courier, monospace; font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #38BDF8;">${code}</span>
                <p style="margin: 8px 0 0 0; font-size: 12px; color: #94A3B8;">Valid for 10 minutes • Single-use only</p>
              </div>
              <p style="margin: 0 0 16px 0; font-size: 13px; line-height: 1.5; color: #94A3B8;">
                If you did not request this registration, please disregard this email. Never share this code with anyone; DG Tech Store staff will never ask for your verification code.
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color: #0F172A; padding: 20px 32px; border-top: 1px solid #334155; text-align: center;">
              <p style="margin: 0; font-size: 12px; color: #64748B;">
                © 2026 DG Tech Store. Banex Plaza, Wuse 2, Abuja, Nigeria.<br>
                Licensed Hire-Purchase and Retail Device Distribution.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// Background Job Queue simulator (In-memory asynchronous task dispatcher)
type JobHandler = () => Promise<void>;
const backgroundQueue: JobHandler[] = [];
let isWorkerRunning = false;

function processQueue() {
  if (isWorkerRunning || backgroundQueue.length === 0) return;
  isWorkerRunning = true;

  setImmediate(async () => {
    while (backgroundQueue.length > 0) {
      const job = backgroundQueue.shift();
      if (job) {
        try {
          await job();
        } catch (err) {
          console.error('[Background Worker Error]:', err);
        }
      }
    }
    isWorkerRunning = false;
  });
}

export async function sendEmailDirectSync(payload: EmailPayload): Promise<{ success: boolean; durationMs: number }> {
  const start = Date.now();
  // Simulates external SMTP handshake and transmission latency
  console.log(`[SMTP Direct] Dispatching verification code to ${payload.to}`);
  await new Promise((resolve) => setTimeout(resolve, 850));
  const durationMs = Date.now() - start;
  return { success: true, durationMs };
}

export function enqueueEmailJob(payload: EmailPayload): { success: boolean; enqueued: boolean } {
  backgroundQueue.push(async () => {
    // Background worker handles external mail dispatch asynchronously
    console.log(`[Background Worker] Asynchronously processing email to ${payload.to}`);
    await new Promise((resolve) => setTimeout(resolve, 850));
  });
  processQueue();
  return { success: true, enqueued: true };
}

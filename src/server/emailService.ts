import nodemailer from 'nodemailer';

export interface EmailDispatchResult {
  sent: boolean;
  provider: 'resend' | 'sendgrid' | 'brevo' | 'gmail' | 'smtp' | 'none';
  messageId?: string;
  error?: string;
  devCode?: string;
}

export interface EmailProviderStatus {
  configured: boolean;
  provider: 'resend' | 'sendgrid' | 'brevo' | 'gmail' | 'smtp' | 'none';
  fromAddress: string;
  details: string;
  instructions?: string;
}

/**
 * Inspects active environment variables to report email configuration status.
 */
export function getEmailProviderStatus(): EmailProviderStatus {
  const from = process.env.EMAIL_FROM || process.env.GMAIL_USER || 'TrafficPulse <no-reply@trafficpulse.io>';

  if (process.env.RESEND_API_KEY) {
    return {
      configured: true,
      provider: 'resend',
      fromAddress: from,
      details: 'Active via Resend REST API (HTTPS port 443)',
    };
  }

  if (process.env.SENDGRID_API_KEY) {
    return {
      configured: true,
      provider: 'sendgrid',
      fromAddress: from,
      details: 'Active via SendGrid v3 Web API',
    };
  }

  if (process.env.BREVO_API_KEY) {
    return {
      configured: true,
      provider: 'brevo',
      fromAddress: from,
      details: 'Active via Brevo / Sendinblue REST API',
    };
  }

  const gmailUser = process.env.GMAIL_USER || (process.env.SMTP_USER?.includes('@gmail.com') ? process.env.SMTP_USER : '');
  const gmailPass = process.env.GMAIL_APP_PASSWORD || process.env.SMTP_PASS;

  if (gmailUser && gmailPass) {
    return {
      configured: true,
      provider: 'gmail',
      fromAddress: gmailUser,
      details: `Active via Gmail SMTP (${gmailUser})`,
    };
  }

  const smtpHost = process.env.SMTP_HOST;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;

  if (smtpHost && smtpUser && smtpPass) {
    const port = process.env.SMTP_PORT || '587';
    return {
      configured: true,
      provider: 'smtp',
      fromAddress: from,
      details: `Active via Custom SMTP (${smtpHost}:${port})`,
    };
  }

  return {
    configured: false,
    provider: 'none',
    fromAddress: from,
    details: 'No live outbound email provider configured yet.',
    instructions: 'Configure GMAIL_USER + GMAIL_APP_PASSWORD, RESEND_API_KEY, or SMTP_HOST + SMTP_USER + SMTP_PASS in your environment / Settings to dispatch real verification emails to recipients.',
  };
}

/**
 * Builds standard HTML template for verification OTP emails.
 */
function buildVerificationHtml(name: string, code: string): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>TrafficPulse Email Verification</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #090d16; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f8fafc;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #090d16; padding: 40px 10px;">
          <tr>
            <td align="center">
              <table role="presentation" width="100%" style="max-width: 560px; background-color: #0f172a; border-radius: 16px; border: 1px solid #1e293b; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.5);">
                <!-- Header -->
                <tr>
                  <td style="padding: 32px 32px 20px 32px; text-align: center; background: linear-gradient(180deg, #131c31 0%, #0f172a 100%); border-bottom: 1px solid #1e293b;">
                    <div style="display: inline-block; padding: 8px 16px; border-radius: 9999px; background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.3); margin-bottom: 12px;">
                      <span style="color: #34d399; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 2px;">Account Security</span>
                    </div>
                    <h1 style="color: #ffffff; margin: 0; font-size: 26px; font-weight: 800; letter-spacing: -0.5px;">TrafficPulse</h1>
                    <p style="color: #94a3b8; font-size: 13px; margin: 6px 0 0 0;">High-Concurrency Traffic Simulation Platform</p>
                  </td>
                </tr>

                <!-- Content -->
                <tr>
                  <td style="padding: 32px;">
                    <p style="margin: 0 0 16px; font-size: 16px; color: #e2e8f0; font-weight: 600;">
                      Hello ${name ? escapeHtml(name) : 'there'},
                    </p>
                    <p style="margin: 0 0 24px; font-size: 14px; color: #94a3b8; line-height: 1.6;">
                      Thank you for registering. Please enter the 6-digit confirmation code below to verify your email address and immediately unlock your <strong>500 Free Trial Traffic Credits</strong>.
                    </p>

                    <!-- OTP Code Box -->
                    <div style="background-color: #090d16; border: 2px dashed #10b981; border-radius: 12px; padding: 24px 16px; text-align: center; margin: 24px 0;">
                      <span style="font-family: 'SF Mono', Consolas, Monaco, monospace; font-size: 38px; font-weight: 800; letter-spacing: 12px; color: #10b981; display: inline-block;">
                        ${code}
                      </span>
                    </div>

                    <p style="margin: 0 0 16px; font-size: 12px; color: #64748b; text-align: center;">
                      ⏱ This code will expire in <strong>15 minutes</strong>.
                    </p>

                    <div style="background-color: #1e293b; border-radius: 10px; padding: 14px 18px; margin-top: 24px; border-left: 4px solid #10b981;">
                      <p style="margin: 0; font-size: 12px; color: #cbd5e1; line-height: 1.5;">
                        <strong>Quick Tip:</strong> Once verified, you can immediately configure custom target URLs, test residential proxy cascades, and launch live simulation campaigns.
                      </p>
                    </div>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="padding: 20px 32px; background-color: #090d16; border-top: 1px solid #1e293b; text-align: center;">
                    <p style="margin: 0; font-size: 11px; color: #475569; line-height: 1.5;">
                      If you did not initiate this registration request, please disregard this email.<br/>
                      © TrafficPulse. All rights reserved.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
}

function escapeHtml(str: string): string {
  return str.replace(/[&<>'"]/g, (tag: string) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    "'": '&#39;',
    '"': '&quot;',
  }[tag] || tag));
}

/**
 * Dispatches verification email using configured provider, or returns diagnostic information.
 */
export async function sendVerificationOtpEmail(
  toEmail: string,
  code: string,
  name: string
): Promise<EmailDispatchResult> {
  const cleanEmail = toEmail.trim().toLowerCase();
  console.log(`[EMAIL-SERVICE] Preparing OTP delivery for ${cleanEmail}: ${code}`);

  const subject = `Your TrafficPulse Verification Code: ${code}`;
  const text = `Hello ${name || 'there'},\n\nYour TrafficPulse verification code is: ${code}\n\nThis code expires in 15 minutes.\nUse it to activate your account and claim 500 Free Trial Traffic Credits.`;
  const html = buildVerificationHtml(name, code);
  const from = process.env.EMAIL_FROM || '"TrafficPulse" <no-reply@trafficpulse.io>';

  // 1. Resend REST API (HTTPS - completely firewall-free on Cloud Run)
  if (process.env.RESEND_API_KEY) {
    try {
      const resp = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: process.env.EMAIL_FROM || 'TrafficPulse <onboarding@resend.dev>',
          to: [cleanEmail],
          subject,
          html,
          text,
        }),
      });
      const data = await resp.json();
      if (resp.ok && data?.id) {
        console.log(`[EMAIL-SERVICE] Resend delivery succeeded for ${cleanEmail} (ID: ${data.id})`);
        return { sent: true, provider: 'resend', messageId: data.id };
      }
      console.warn(`[EMAIL-SERVICE] Resend API error:`, data);
      return { sent: false, provider: 'resend', error: data?.message || 'Resend API returned error', devCode: code };
    } catch (err: any) {
      console.warn(`[EMAIL-SERVICE] Resend fetch failed:`, err?.message);
      return { sent: false, provider: 'resend', error: err?.message, devCode: code };
    }
  }

  // 2. SendGrid v3 API (HTTPS)
  if (process.env.SENDGRID_API_KEY) {
    try {
      const resp = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.SENDGRID_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: cleanEmail }] }],
          from: { email: process.env.EMAIL_FROM || 'no-reply@trafficpulse.io', name: 'TrafficPulse' },
          subject,
          content: [
            { type: 'text/plain', value: text },
            { type: 'text/html', value: html },
          ],
        }),
      });
      if (resp.ok) {
        console.log(`[EMAIL-SERVICE] SendGrid delivery succeeded for ${cleanEmail}`);
        return { sent: true, provider: 'sendgrid' };
      }
      const errText = await resp.text();
      return { sent: false, provider: 'sendgrid', error: errText, devCode: code };
    } catch (err: any) {
      return { sent: false, provider: 'sendgrid', error: err?.message, devCode: code };
    }
  }

  // 3. Brevo REST API (HTTPS)
  if (process.env.BREVO_API_KEY) {
    try {
      const resp = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'api-key': process.env.BREVO_API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sender: { name: 'TrafficPulse', email: process.env.EMAIL_FROM || 'no-reply@trafficpulse.io' },
          to: [{ email: cleanEmail, name: name || cleanEmail.split('@')[0] }],
          subject,
          htmlContent: html,
          textContent: text,
        }),
      });
      const data = await resp.json();
      if (resp.ok) {
        console.log(`[EMAIL-SERVICE] Brevo delivery succeeded for ${cleanEmail} (ID: ${data?.messageId})`);
        return { sent: true, provider: 'brevo', messageId: data?.messageId };
      }
      return { sent: false, provider: 'brevo', error: data?.message || 'Brevo API error', devCode: code };
    } catch (err: any) {
      return { sent: false, provider: 'brevo', error: err?.message, devCode: code };
    }
  }

  // 4. Gmail SMTP with App Password (Nodemailer service: 'gmail')
  const gmailUser = process.env.GMAIL_USER || (process.env.SMTP_USER?.includes('@gmail.com') ? process.env.SMTP_USER : '');
  const gmailPass = process.env.GMAIL_APP_PASSWORD || (gmailUser ? process.env.SMTP_PASS : '');

  if (gmailUser && gmailPass) {
    try {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: gmailUser,
          pass: gmailPass,
        },
      });

      const info = await transporter.sendMail({
        from: `TrafficPulse <${gmailUser}>`,
        to: cleanEmail,
        subject,
        text,
        html,
      });

      console.log(`[EMAIL-SERVICE] Gmail SMTP delivery succeeded for ${cleanEmail} (ID: ${info.messageId})`);
      return { sent: true, provider: 'gmail', messageId: info.messageId };
    } catch (err: any) {
      console.warn(`[EMAIL-SERVICE] Gmail SMTP error:`, err?.message);
      return { sent: false, provider: 'gmail', error: err?.message, devCode: code };
    }
  }

  // 5. Custom SMTP (Nodemailer)
  const smtpHost = process.env.SMTP_HOST;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;

  if (smtpHost && smtpUser && smtpPass) {
    try {
      const port = parseInt(process.env.SMTP_PORT || '587', 10);
      const secure = process.env.SMTP_SECURE === 'true' || port === 465;

      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port,
        secure,
        auth: { user: smtpUser, pass: smtpPass },
        connectionTimeout: 8000,
        greetingTimeout: 5000,
      });

      const info = await transporter.sendMail({
        from,
        to: cleanEmail,
        subject,
        text,
        html,
      });

      console.log(`[EMAIL-SERVICE] Custom SMTP delivery succeeded for ${cleanEmail} (ID: ${info.messageId})`);
      return { sent: true, provider: 'smtp', messageId: info.messageId };
    } catch (err: any) {
      console.warn(`[EMAIL-SERVICE] Custom SMTP error:`, err?.message);
      return { sent: false, provider: 'smtp', error: err?.message, devCode: code };
    }
  }

  // 6. No email provider configured on server
  console.log(`[EMAIL-SERVICE] No live email provider configured in environment. Generated OTP code for ${cleanEmail}: ${code}`);
  return {
    sent: false,
    provider: 'none',
    devCode: code,
    error: 'No outbound email credentials configured on server (SMTP_HOST/SMTP_USER/SMTP_PASS, GMAIL_USER/GMAIL_APP_PASSWORD, or RESEND_API_KEY).',
  };
}

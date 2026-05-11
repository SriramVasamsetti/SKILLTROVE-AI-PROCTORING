const nodemailer = require('nodemailer');

/**
 * @function getTransporter
 * @description Configures and returns a secure nodemailer transporter using environment variables.
 * @returns {Object} - Nodemailer transporter instance.
 */
const getTransporter = () => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.error('[SMTP Warning] EMAIL_USER or EMAIL_PASS environment variables are missing. Emails will not be sent.');
    return null;
  }

  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
};

/**
 * @function sendVerificationEmail
 * @description Sends a professional HTML email with the SkillTrove brand identity.
 * @param {string} toEmail - Recipient email address.
 * @param {string} verificationLink - Complete URL for account activation.
 */
async function sendVerificationEmail(toEmail, verificationLink) {
  const transporter = getTransporter();
  if (!transporter) return;

  const mailOptions = {
    from: `"SkillTrove Security" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: 'Action Required: Activate Your SkillTrove Identity',
    html: `
      <div style="font-family: 'Inter', -apple-system, sans-serif; max-width: 600px; margin: auto; padding: 40px; border-radius: 24px; background-color: #ffffff; border: 1px solid #eef2f6;">
        <div style="text-align: center; margin-bottom: 32px;">
           <div style="display: inline-block; background-color: #f97316; padding: 12px; border-radius: 14px; margin-bottom: 12px;">
              <span style="color: white; font-weight: 900; font-style: italic; font-size: 24px;">ST</span>
           </div>
           <h1 style="color: #0f172a; margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -1px;">SKILL<span style="color: #f97316;">TROVE</span></h1>
           <p style="color: #94a3b8; font-size: 10px; text-transform: uppercase; letter-spacing: 2px; margin-top: 4px; font-weight: 700;">AI Proctoring Excellence</p>
        </div>
        
        <h2 style="color: #1e293b; font-size: 20px; font-weight: 700; margin-bottom: 16px;">Finalize your registration</h2>
        <p style="color: #475569; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
          To ensure the integrity of the SkillTrove assessment environment, please verify your email address to activate your biometric profile.
        </p>
        
        <div style="text-align: center; margin: 40px 0;">
          <a href="${verificationLink}" style="background-color: #f97316; color: #ffffff; padding: 16px 32px; border-radius: 12px; text-decoration: none; font-weight: 700; font-size: 16px; box-shadow: 0 4px 12px rgba(249, 115, 22, 0.2);">
            Verify Account
          </a>
        </div>
        
        <p style="color: #94a3b8; font-size: 14px; line-height: 1.6; text-align: center;">
          If the button doesn't work, copy and paste this link into your browser:<br/>
          <a href="${verificationLink}" style="color: #f97316; text-decoration: none;">${verificationLink}</a>
        </p>
        
        <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 32px 0;"/>
        
        <p style="color: #94a3b8; font-size: 12px; text-align: center;">
          &copy; 2026 SkillTrove AI. This is a security-critical communication.
        </p>
      </div>
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`[Email] Verification dispatched to ${toEmail}: ${info.messageId}`);
  } catch (error) {
    console.error(`[Email Error] Failed to send to ${toEmail}:`, error.message);
  }
}

module.exports = { sendVerificationEmail };

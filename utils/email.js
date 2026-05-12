const nodemailer = require('nodemailer');

/**
 * @function getTransporter
 * @description Configures and returns a secure nodemailer transporter using environment variables.
 * @returns {Object} - Nodemailer transporter instance.
 */
const getTransporter = () => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn('[SMTP Warning] EMAIL_USER or EMAIL_PASS environment variables are missing. Emails will not be sent.');
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
 * @description Sends a professional HTML email with the 6-digit OTP for account activation.
 * @param {string} toEmail - Recipient email address.
 * @param {string} otp - 6-digit verification code.
 */
async function sendVerificationEmail(toEmail, otp) {
  const transporter = getTransporter();
  if (!transporter) return;

  const mailOptions = {
    from: `"SkillTrove Security" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: 'SkillTrove: Your 6-Digit Verification Code',
    html: `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: auto; padding: 40px; border-radius: 30px; background-color: #0f172a; border: 1px solid rgba(255,255,255,0.1); color: #ffffff;">
        <div style="text-align: center; margin-bottom: 30px;">
           <div style="display: inline-block; background: linear-gradient(135deg, #f97316, #facc15); padding: 15px; border-radius: 18px; margin-bottom: 10px;">
              <span style="color: #0f172a; font-weight: 900; font-style: italic; font-size: 28px;">ST</span>
           </div>
           <h1 style="color: #ffffff; margin: 0; font-size: 32px; font-weight: 900; letter-spacing: -1.5px;">SKILL<span style="color: #f97316;">TROVE</span></h1>
           <p style="color: #64748b; font-size: 11px; text-transform: uppercase; letter-spacing: 4px; margin-top: 6px; font-weight: 800;">AI Proctoring Excellence</p>
        </div>
        
        <div style="background: rgba(255,255,255,0.03); border-radius: 24px; padding: 30px; border: 1px solid rgba(255,255,255,0.05);">
          <h2 style="color: #f8fafc; font-size: 22px; font-weight: 800; margin-bottom: 15px; text-align: center;">Verify Your Identity</h2>
          <p style="color: #94a3b8; font-size: 15px; line-height: 1.6; margin-bottom: 30px; text-align: center;">
            To complete your biometric profile registration and access the SkillTrove environment, please enter the following 6-digit activation code.
          </p>
          
          <div style="text-align: center; margin: 40px 0;">
            <div style="display: inline-block; background: #f97316; color: #ffffff; padding: 20px 40px; border-radius: 20px; font-weight: 900; font-size: 42px; letter-spacing: 12px; box-shadow: 0 10px 30px rgba(249, 115, 22, 0.3);">
              ${otp}
            </div>
          </div>
          
          <p style="color: #64748b; font-size: 13px; text-align: center; margin-top: 20px;">
            This code expires in 10 minutes. If you did not request this code, please ignore this email.
          </p>
        </div>
        
        <p style="color: #475569; font-size: 12px; line-height: 1.6; text-align: center; margin-top: 40px;">
          &copy; 2026 SkillTrove AI Systems. Powered by Advanced Biometrics.<br/>
          Securing the future of academic integrity.
        </p>
      </div>
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`[Email] OTP ${otp} dispatched to ${toEmail}: ${info.messageId}`);
  } catch (error) {
    console.error(`[Email Error] Failed to send to ${toEmail}:`, error.message);
  }
}

module.exports = { sendVerificationEmail };

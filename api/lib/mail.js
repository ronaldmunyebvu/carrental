const nodemailer = require('nodemailer');

const SITE_URL = process.env.SITE_URL || (process.env.VERCEL_URL ? 'https://' + process.env.VERCEL_URL : 'http://localhost:3000');

function createTransporter() {
  return nodemailer.createTransport({
    host: process.env.BREVO_HOST || 'smtp-relay.brevo.com',
    port: parseInt(process.env.BREVO_PORT || '587'),
    secure: false,
    auth: {
      user: process.env.BREVO_USER,
      pass: process.env.BREVO_PASS,
    },
  });
}

async function sendConfirmationEmail(user, token) {
  const link = `${SITE_URL}/pages/login.html?token=${token}`;
  console.log('Sending confirmation email to:', user.email, 'Link:', link);
  const transporter = createTransporter();
  await transporter.sendMail({
    from: process.env.EMAIL_FROM || 'rmmunyebvu@gmail.com',
    to: user.email,
    subject: 'DriveShare - Confirm Your Email',
    html: `
      <h2>Welcome to DriveShare, ${user.firstName}!</h2>
      <p>Please confirm your email address by clicking the link below:</p>
      <a href="${link}" style="display:inline-block;padding:12px 24px;background:#e8371d;color:#fff;text-decoration:none;border-radius:8px;">Confirm Email</a>
      <p style="margin-top:16px;color:#666;">This link expires in 24 hours.</p>
      <p style="color:#666;">If you did not create an account, please ignore this email.</p>
    `,
  });
  console.log('Confirmation email sent successfully to:', user.email);
}

async function sendPasswordResetEmail(user, code) {
  const transporter = createTransporter();
  await transporter.sendMail({
    from: process.env.EMAIL_FROM || 'rmmunyebvu@gmail.com',
    to: user.email,
    subject: 'DriveShare - Reset Your Password',
    html: `
      <h2>Password Reset Request</h2>
      <p>Hi ${user.firstName}, here is your 6-digit reset code:</p>
      <p style="font-size:28px;font-weight:bold;letter-spacing:8px;padding:20px;background:#f5f5f5;text-align:center;border-radius:8px;margin:20px 0;">${code}</p>
      <p style="color:#666;">This code expires in 15 minutes.</p>
      <p style="color:#666;">If you did not request a password reset, please ignore this email.</p>
    `,
  });
}

module.exports = { sendConfirmationEmail, sendPasswordResetEmail };
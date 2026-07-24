const { Resend } = require('resend');

const SITE_URL = process.env.SITE_URL || (process.env.VERCEL_URL ? 'https://' + process.env.VERCEL_URL : 'http://localhost:3000');
const FROM_EMAIL = process.env.EMAIL_FROM || 'DriveShare <onboarding@resend.dev>';

let resend;
function getClient() {
  if (!resend) {
    if (!process.env.RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY environment variable is not set');
    }
    resend = new Resend(process.env.RESEND_API_KEY);
  }
  return resend;
}

async function sendConfirmationEmail(user, token) {
  const link = `${SITE_URL}/pages/login.html?token=${token}`;
  console.log('Sending confirmation email to:', user.email, 'Link:', link);
  const { data, error } = await getClient().emails.send({
    from: FROM_EMAIL,
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
  if (error) throw new Error(error.message);
  console.log('Confirmation email sent:', data.id);
}

async function sendPasswordResetEmail(user, token) {
  const { data, error } = await getClient().emails.send({
    from: FROM_EMAIL,
    to: user.email,
    subject: 'DriveShare - Reset Your Password',
    html: `
      <h2>Password Reset Request</h2>
      <p>Hi ${user.firstName}, use this code to reset your password:</p>
      <p style="font-size:24px;font-weight:bold;letter-spacing:4px;padding:16px;background:#f5f5f5;text-align:center;border-radius:8px;">${token}</p>
      <p style="color:#666;">This code expires in 15 minutes.</p>
      <p style="color:#666;">If you did not request a password reset, please ignore this email.</p>
    `,
  });
  if (error) throw new Error(error.message);
}

async function sendBookingConfirmationEmail(user, booking, car) {
  const { data, error } = await getClient().emails.send({
    from: FROM_EMAIL,
    to: user.email,
    subject: 'DriveShare - Booking Confirmed',
    html: `
      <h2>Booking Confirmed!</h2>
      <p>Hi ${user.firstName}, your booking for <strong>${car.make} ${car.model}</strong> has been confirmed.</p>
      <p><strong>Pickup:</strong> ${booking.pickupDate}<br>
      <strong>Return:</strong> ${booking.returnDate}<br>
      <strong>Total:</strong> $${booking.totalPrice.toFixed(2)}</p>
    `,
  });
  if (error) throw new Error(error.message);
}

module.exports = { sendConfirmationEmail, sendPasswordResetEmail, sendBookingConfirmationEmail };

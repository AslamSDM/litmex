import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

interface SendVerificationEmailParams {
  email: string;
  name: string | null;
  token: string;
}

interface SendPasswordResetEmailParams {
  email: string;
  name: string | null;
  token: string;
}

export async function sendVerificationEmail({
  email,
  name,
  token,
}: SendVerificationEmailParams) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const verificationUrl = `${baseUrl}/auth/verify?token=${token}`;

  // Debug log to help troubleshoot
  console.log("Generated verification URL:", verificationUrl);
  console.log("Base URL from env:", process.env.NEXT_PUBLIC_APP_URL);

  const { data, error } = await resend.emails.send({
    from:
      process.env.RESEND_FROM_EMAIL ||
      "Verify Litmex Account<verify@litmexpresale.com>",
    to: email,
    subject: "Verify your Litmex account",
    html: `
      <div>
        <h1>Email Verification</h1>
        <p>Hello ${name || "there"},</p>
        <p>Thank you for signing up for Litmex. Please verify your email address by clicking the button below:</p>
        <a href="${verificationUrl}" style="padding: 10px 20px; background-color: #4a56e2; color: white; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0;">
          Verify Email
        </a>
        <p>If the button doesn't work, copy and paste this URL into your browser:</p>
        <p>${verificationUrl}</p>
        <p>If you did not create an account, please ignore this email.</p>
        <p>This link will expire in 24 hours.</p>
      </div>
    `,
  });
  console.log("Email sent:", data);
  console.error(error);
  if (error) {
    throw new Error(
      `Failed to send verification email: ${error.name} - ${error.message}`
    );
  }

  return data;
}

export async function sendPasswordResetEmail({
  email,
  name,
  token,
}: SendPasswordResetEmailParams) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const resetUrl = `${baseUrl}/auth/reset-password?token=${token}`;

  const { data, error } = await resend.emails.send({
    from:
      process.env.RESEND_FROM_EMAIL ||
      "Reset Password<support@litmexpresale.com>",
    to: email,
    subject: "Reset your Litmex password",
    html: `
      <div>
        <h1>Password Reset</h1>
        <p>Hello ${name || "there"},</p>
        <p>We received a request to reset your password. Click the button below to set a new password:</p>
        <a href="${resetUrl}" style="padding: 10px 20px; background-color: #4a56e2; color: white; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0;">
          Reset Password
        </a>
        <p>If the button doesn't work, copy and paste this URL into your browser:</p>
        <p>${resetUrl}</p>
        <p>If you did not request a password reset, please ignore this email.</p>
        <p>This link will expire in 1 hour.</p>
      </div>
    `,
  });
  console.log("Password reset email sent:", data);
  console.error(error);
  if (error) {
    throw new Error(`Failed to send password reset email: ${error.message}`);
  }

  return data;
}

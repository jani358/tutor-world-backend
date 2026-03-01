import nodemailer from "nodemailer";
import { logger } from "./logger";

// ─── Config ──────────────────────────────────────────────────────────────────
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || "smtp.gmail.com",
  port: parseInt(process.env.EMAIL_PORT || "587"),
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

const FROM = process.env.EMAIL_FROM || "noreply@tutorworld.com";
const COMPANY_NAME = "Tutor World";
const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL || "support@tutorworld.com";
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";
const BRAND_COLOR = "#667eea";
const YEAR = new Date().getFullYear();

// ─── Shared HTML builder ──────────────────────────────────────────────────────
function buildEmail({
  firstName,
  title,
  description,
  codeLabel,
  code,
  expiresText,
  warningText,
  ctaLabel,
  ctaUrl,
  footerNote,
  customSection,
}: {
  firstName: string;
  title: string;
  description: string;
  codeLabel?: string;
  code?: string;
  expiresText?: string;
  warningText?: string;
  ctaLabel?: string;
  ctaUrl?: string;
  footerNote: string;
  customSection?: string;
}): string {
  const codeSection = customSection ?? (code
    ? `
      <div class="code-wrapper">
        <div class="code-container">
          ${codeLabel ? `<div class="code-label">${codeLabel}</div>` : ""}
          <div class="code-display">${code}</div>
        </div>
      </div>
      ${expiresText ? `<p class="warning-text">${expiresText}</p>` : ""}
    `
    : "");

  const ctaSection =
    ctaLabel && ctaUrl
      ? `<a href="${ctaUrl}" class="cta-button">${ctaLabel}</a>`
      : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
      background-color: #ffffff;
      -webkit-text-size-adjust: 100%;
      -ms-text-size-adjust: 100%;
    }
    table {
      border-collapse: collapse;
      mso-table-lspace: 0pt;
      mso-table-rspace: 0pt;
    }
    .email-wrapper { width: 100%; background-color: #ffffff; }
    .email-container { width: 600px; margin: 0 auto; background-color: #ffffff; }
    .content-wrapper { padding: 40px 32px; text-align: center; }
    .logo { margin-bottom: 40px; }
    .logo-text {
      font-size: 28px;
      font-weight: 800;
      color: ${BRAND_COLOR};
      letter-spacing: -0.5px;
      text-decoration: none;
    }
    .greeting {
      font-size: 32px;
      font-weight: 700;
      color: #000000;
      margin: 0 0 20px 0;
      line-height: 1.2;
    }
    .description {
      font-size: 18px;
      font-weight: 400;
      color: #333333;
      margin: 0 0 40px 0;
      line-height: 1.5;
    }
    .code-wrapper { margin-bottom: 40px; }
    .code-container {
      background-color: #f5f5f5;
      border-radius: 16px;
      padding: 32px;
      display: inline-block;
      max-width: 380px;
      box-sizing: border-box;
    }
    .code-label {
      font-size: 16px;
      font-weight: 600;
      color: #333333;
      margin: 0 0 14px 0;
    }
    .code-display {
      font-size: 48px;
      font-weight: 700;
      color: ${BRAND_COLOR};
      letter-spacing: 8px;
      margin: 0;
      font-family: 'Courier New', monospace;
    }
    .warning-text {
      font-size: 15px;
      color: #666666;
      margin: 0 0 36px 0;
      line-height: 1.5;
    }
    .cta-button {
      background-color: ${BRAND_COLOR};
      color: #ffffff !important;
      font-size: 17px;
      font-weight: 600;
      padding: 15px 36px;
      border-radius: 8px;
      text-decoration: none;
      display: inline-block;
    }
    .creds-box {
      background-color: #f5f5f5;
      border-radius: 12px;
      padding: 24px 28px;
      text-align: left;
      margin: 0 0 32px 0;
    }
    .creds-box p {
      margin: 0 0 10px 0;
      font-size: 16px;
      color: #333333;
    }
    .creds-box p:last-child { margin: 0; }
    .creds-box strong { color: #000000; }
    .security-note {
      font-size: 13px;
      color: #999999;
      margin: 28px 0 0 0;
      line-height: 1.5;
    }
    .footer {
      border-top: 1px solid #e8e8e8;
      margin-top: 40px;
      padding-top: 28px;
    }
    .footer p {
      font-size: 13px;
      color: #999999;
      margin: 0 0 8px 0;
      line-height: 1.5;
    }
    .footer a { color: ${BRAND_COLOR}; text-decoration: none; }
    .footer-copy { font-size: 12px; color: #cccccc; margin: 0 !important; }
    @media screen and (max-width: 640px) {
      .email-container { width: 100% !important; }
      .content-wrapper { padding: 28px 20px !important; }
      .greeting { font-size: 26px !important; }
      .description { font-size: 16px !important; }
      .code-container { max-width: 100% !important; padding: 24px !important; }
      .code-display { font-size: 36px !important; letter-spacing: 6px !important; }
      .cta-button { font-size: 15px !important; padding: 13px 28px !important; }
    }
  </style>
</head>
<body>
  <div class="email-wrapper">
    <div class="email-container">
      <div class="content-wrapper">

        <!-- Logo -->
        <div class="logo">
          <span class="logo-text">${COMPANY_NAME}</span>
        </div>

        <!-- Greeting -->
        <h1 class="greeting">Hi ${firstName},</h1>

        <!-- Description -->
        <p class="description">${description}</p>

        <!-- Code / Credentials section -->
        ${codeSection}

        <!-- CTA Button -->
        ${ctaSection}

        <!-- Security note -->
        ${warningText ? `<p class="security-note">${warningText}</p>` : ""}

        <!-- Footer -->
        <div class="footer">
          <p>${footerNote}</p>
          <p>Support: <a href="mailto:${SUPPORT_EMAIL}">${SUPPORT_EMAIL}</a></p>
          <p class="footer-copy">© ${YEAR} ${COMPANY_NAME}. All rights reserved.</p>
        </div>

      </div>
    </div>
  </div>
</body>
</html>`;
}

// ─── Email functions ──────────────────────────────────────────────────────────

/**
 * Send email verification code (US-022)
 */
export const sendVerificationEmail = async (
  email: string,
  firstName: string,
  code: string
): Promise<void> => {
  try {
    await transporter.sendMail({
      from: FROM,
      to: email,
      subject: "Verify Your Email — Tutor World",
      html: buildEmail({
        firstName,
        title: "Verify Your Email",
        description: "Here's your verification code to complete your registration:",
        codeLabel: "Verification Code",
        code,
        expiresText: "This code will expire in 24 hours.",
        warningText:
          "If you didn't create a Tutor World account, please ignore this email.",
        footerNote:
          "You received this email because a Tutor World account was created with your address.",
      }),
    });
    logger.info(`Verification email sent to ${email}`);
  } catch (error) {
    logger.error(`Failed to send verification email to ${email}:`, error);
    throw new Error("Failed to send verification email");
  }
};

/**
 * Send password reset OTP email
 */
export const sendPasswordResetEmail = async (
  email: string,
  firstName: string,
  code: string
): Promise<void> => {
  try {
    await transporter.sendMail({
      from: FROM,
      to: email,
      subject: "Reset Your Password — Tutor World",
      html: buildEmail({
        firstName,
        title: "Reset Your Password",
        description:
          "We received a request to reset your password. Use the code below:",
        codeLabel: "Reset Code",
        code,
        expiresText: "This code will expire in 15 minutes.",
        warningText:
          "If you didn't request a password reset, please contact support immediately.",
        footerNote:
          "You received this email because a password reset was requested for your Tutor World account.",
      }),
    });
    logger.info(`Password reset email sent to ${email}`);
  } catch (error) {
    logger.error(`Failed to send password reset email to ${email}:`, error);
    throw new Error("Failed to send password reset email");
  }
};

/**
 * Send teacher account invite email (admin-created)
 */
export const sendTeacherInviteEmail = async (
  email: string,
  firstName: string,
  temporaryPassword: string
): Promise<void> => {
  try {
    const loginUrl = `${FRONTEND_URL}/auth`;

    const credsHtml = `
      <div class="creds-box">
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Temporary Password:</strong> ${temporaryPassword}</p>
      </div>
      <p style="font-size:15px;color:#666666;margin:0 0 32px 0;">
        Please log in and change your password immediately.
      </p>
    `;

    const html = buildEmail({
      firstName,
      title: "Welcome to Tutor World",
      description:
        "An admin has created a teacher account for you. Here are your login credentials:",
      customSection: credsHtml,
      warningText: undefined,
      footerNote:
        "You received this email because a Tutor World teacher account was created for you.",
      ctaLabel: "Login to Tutor World",
      ctaUrl: loginUrl,
    });

    await transporter.sendMail({
      from: FROM,
      to: email,
      subject: "Welcome to Tutor World — Your Teacher Account",
      html,
    });
    logger.info(`Teacher invite email sent to ${email}`);
  } catch (error) {
    logger.error(`Failed to send teacher invite email to ${email}:`, error);
    throw new Error("Failed to send teacher invite email");
  }
};

/**
 * Send quiz assignment notification
 */
export const sendQuizAssignmentEmail = async (
  email: string,
  firstName: string,
  quizTitle: string
): Promise<void> => {
  try {
    await transporter.sendMail({
      from: FROM,
      to: email,
      subject: `New Quiz Assigned: ${quizTitle}`,
      html: buildEmail({
        firstName,
        title: "New Quiz Assigned",
        description: `A new quiz has been assigned to you: <strong>${quizTitle}</strong><br>Log in to your dashboard to start the quiz and test your knowledge!`,
        ctaLabel: "Go to Dashboard",
        ctaUrl: `${FRONTEND_URL}/dashboard`,
        warningText: undefined,
        footerNote:
          "You received this email because a quiz was assigned to your Tutor World account.",
      }),
    });
    logger.info(`Quiz assignment email sent to ${email}`);
  } catch (error) {
    logger.error(`Failed to send quiz assignment email to ${email}:`, error);
  }
};

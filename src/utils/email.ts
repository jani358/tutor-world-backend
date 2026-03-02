import nodemailer from "nodemailer";
import { logger } from "./logger";

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
const BRAND_COLOR = "#44A194";
const BG_PRIMARY = "#FDFBF7";
const BG_SECONDARY = "#F4F0E4";
const FG_PRIMARY = "#1a1f2e";
const FG_SECONDARY = "#537D96";
const FG_MUTED = "#7a8a96";
const BORDER_COLOR = "#e5e0d0";
const YEAR = new Date().getFullYear();

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
  <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700;800&display=swap" rel="stylesheet">
  <title>${title}</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: 'Montserrat', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
      background-color: ${BG_PRIMARY};
      -webkit-text-size-adjust: 100%;
      -ms-text-size-adjust: 100%;
    }
    table {
      border-collapse: collapse;
      mso-table-lspace: 0pt;
      mso-table-rspace: 0pt;
    }
    .email-wrapper { width: 100%; background-color: ${BG_PRIMARY}; }
    .email-container { width: 600px; margin: 0 auto; background-color: ${BG_PRIMARY}; }
    .content-wrapper { padding: 40px 32px; text-align: center; }
    .logo { margin-bottom: 40px; }
    .logo img {
      height: 48px;
      width: auto;
    }
    .greeting {
      font-size: 32px;
      font-weight: 700;
      color: ${FG_PRIMARY};
      margin: 0 0 20px 0;
      line-height: 1.2;
    }
    .description {
      font-size: 18px;
      font-weight: 400;
      color: ${FG_SECONDARY};
      margin: 0 0 40px 0;
      line-height: 1.5;
    }
    .code-wrapper { margin-bottom: 40px; }
    .code-container {
      background-color: ${BG_SECONDARY};
      border-radius: 16px;
      padding: 32px;
      display: inline-block;
      max-width: 380px;
      box-sizing: border-box;
    }
    .code-label {
      font-size: 16px;
      font-weight: 600;
      color: ${FG_PRIMARY};
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
      color: ${FG_MUTED};
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
      background-color: ${BG_SECONDARY};
      border-radius: 12px;
      padding: 24px 28px;
      text-align: left;
      margin: 0 0 32px 0;
    }
    .creds-box p {
      margin: 0 0 10px 0;
      font-size: 16px;
      color: ${FG_SECONDARY};
    }
    .creds-box p:last-child { margin: 0; }
    .creds-box strong { color: ${FG_PRIMARY}; }
    .security-note {
      font-size: 13px;
      color: ${FG_MUTED};
      margin: 28px 0 0 0;
      line-height: 1.5;
    }
    .footer {
      border-top: 1px solid ${BORDER_COLOR};
      margin-top: 40px;
      padding-top: 28px;
    }
    .footer p {
      font-size: 13px;
      color: ${FG_MUTED};
      margin: 0 0 8px 0;
      line-height: 1.5;
    }
    .footer a { color: ${BRAND_COLOR}; text-decoration: none; }
    .footer-copy { font-size: 12px; color: ${BORDER_COLOR}; margin: 0 !important; }
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

        <div class="logo">
          <img src="https://res.cloudinary.com/dtn5lbqrp/image/upload/v1772449677/Tutor-Logo_mbg2qj.gif" alt="${COMPANY_NAME}" style="height:48px;width:auto;" />
        </div>

        <h1 class="greeting">Hi ${firstName},</h1>

        <p class="description">${description}</p>

        ${codeSection}

        ${ctaSection}

        ${warningText ? `<p class="security-note">${warningText}</p>` : ""}

        <div class="footer">
          <p>${footerNote}</p>
          <p>Support: <a href="mailto:${SUPPORT_EMAIL}">${SUPPORT_EMAIL}</a></p>
          <p class="footer-copy">&copy; ${YEAR} ${COMPANY_NAME}. All rights reserved.</p>
        </div>

      </div>
    </div>
  </div>
</body>
</html>`;
}

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
      <p style="font-size:15px;color:${FG_MUTED};margin:0 0 32px 0;">
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

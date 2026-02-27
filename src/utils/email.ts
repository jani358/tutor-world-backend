import nodemailer from "nodemailer";
import { logger } from "./logger";

// Create reusable transporter
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || "smtp.gmail.com",
  port: parseInt(process.env.EMAIL_PORT || "587"),
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

/**
 * Send verification email (US-022)
 */
export const sendVerificationEmail = async (
  email: string,
  firstName: string,
  code: string
): Promise<void> => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_FROM || "noreply@tutorworld.com",
      to: email,
      subject: "Verify Your Email - Tutor World",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .code { font-size: 32px; font-weight: bold; color: #667eea; text-align: center; padding: 20px; background: white; border-radius: 8px; margin: 20px 0; letter-spacing: 5px; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Welcome to Tutor World! 🎓</h1>
            </div>
            <div class="content">
              <p>Hi ${firstName},</p>
              <p>Thank you for registering with Tutor World! To complete your registration, please verify your email address using the code below:</p>
              <div class="code">${code}</div>
              <p>This code will expire in 24 hours.</p>
              <p>If you didn't create an account with us, please ignore this email.</p>
              <p>Happy learning!<br>The Tutor World Team</p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} Tutor World. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    await transporter.sendMail(mailOptions);
    logger.info(`Verification email sent to ${email}`);
  } catch (error) {
    logger.error(`Failed to send verification email to ${email}:`, error);
    throw new Error("Failed to send verification email");
  }
};

/**
 * Send password reset email
 */
export const sendPasswordResetEmail = async (
  email: string,
  firstName: string,
  token: string
): Promise<void> => {
  try {
    const resetUrl = `${process.env.FRONTEND_URL}/auth/reset-password?token=${token}`;

    const mailOptions = {
      from: process.env.EMAIL_FROM || "noreply@tutorworld.com",
      to: email,
      subject: "Reset Your Password - Tutor World",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; padding: 15px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Reset Your Password 🔒</h1>
            </div>
            <div class="content">
              <p>Hi ${firstName},</p>
              <p>We received a request to reset your password. Click the button below to create a new password:</p>
              <div style="text-align: center;">
                <a href="${resetUrl}" class="button">Reset Password</a>
              </div>
              <p>This link will expire in 1 hour.</p>
              <p>If you didn't request this, please ignore this email and your password will remain unchanged.</p>
              <p>For security reasons, if you're having trouble, please contact support.</p>
              <p>Best regards,<br>The Tutor World Team</p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} Tutor World. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    await transporter.sendMail(mailOptions);
    logger.info(`Password reset email sent to ${email}`);
  } catch (error) {
    logger.error(`Failed to send password reset email to ${email}:`, error);
    throw new Error("Failed to send password reset email");
  }
};

/**
 * Send quiz assigned notification
 */
export const sendQuizAssignmentEmail = async (
  email: string,
  firstName: string,
  quizTitle: string
): Promise<void> => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_FROM || "noreply@tutorworld.com",
      to: email,
      subject: `New Quiz Assigned: ${quizTitle}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; padding: 15px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>New Quiz Available! 📝</h1>
            </div>
            <div class="content">
              <p>Hi ${firstName},</p>
              <p>A new quiz has been assigned to you: <strong>${quizTitle}</strong></p>
              <p>Log in to your dashboard to start the quiz and test your knowledge!</p>
              <div style="text-align: center;">
                <a href="${process.env.FRONTEND_URL}/dashboard" class="button">Go to Dashboard</a>
              </div>
              <p>Good luck! 🎯</p>
              <p>The Tutor World Team</p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    await transporter.sendMail(mailOptions);
    logger.info(`Quiz assignment email sent to ${email}`);
  } catch (error) {
    logger.error(`Failed to send quiz assignment email to ${email}:`, error);
  }
};

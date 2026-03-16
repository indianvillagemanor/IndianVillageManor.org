import nodemailer from 'nodemailer';

function getEmailPassword(): string | undefined {
  return process.env.EMAIL_PASSWORD || process.env.EMAIL_PASS;
}

// Validate email configuration on startup
function validateEmailConfig() {
  const missingVars: string[] = [];

  // Check if using EMAIL_SERVER connection string format
  if (process.env.EMAIL_SERVER) {
    console.log('✅ Email configuration loaded successfully (using EMAIL_SERVER connection string)');

    // Validate EMAIL_SERVER format
    if (!process.env.EMAIL_SERVER.includes('@') || !process.env.EMAIL_SERVER.includes('://')) {
      console.error('❌ EMAIL_SERVER format appears invalid. Expected format: smtp://user:pass@host:port');
      return false;
    }

    if (!process.env.EMAIL_FROM) {
      console.error('❌ Missing EMAIL_FROM environment variable');
      return false;
    }

    return true;
  }

  // Otherwise check individual fields
  if (!process.env.EMAIL_HOST) missingVars.push('EMAIL_HOST');
  if (!process.env.EMAIL_USER) missingVars.push('EMAIL_USER');
  if (!getEmailPassword()) missingVars.push('EMAIL_PASSWORD (or EMAIL_PASS)');
  if (!process.env.EMAIL_FROM) missingVars.push('EMAIL_FROM');

  if (missingVars.length > 0) {
    console.error('❌ Missing email configuration environment variables:', missingVars.join(', '));
    console.error('📧 Please use either:');
    console.error('   1. EMAIL_SERVER="smtp://user:pass@host:port" + EMAIL_FROM');
    console.error('   2. EMAIL_HOST, EMAIL_USER, EMAIL_PASSWORD, EMAIL_FROM (individual fields)');
    return false;
  }

  console.log('✅ Email configuration loaded successfully (using individual fields)');
  return true;
}

// Create nodemailer transporter based on configuration format
const emailConfig = process.env.EMAIL_SERVER
  ? process.env.EMAIL_SERVER  // Use connection string directly
  : {
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.EMAIL_PORT || '587'),
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER,
        pass: getEmailPassword(),
      },
    };

export const transporter = nodemailer.createTransport(emailConfig);

export interface EmailOptions {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
}

export async function sendEmail(options: EmailOptions): Promise<void> {
  const isConfigValid = validateEmailConfig();

  if (!isConfigValid) {
    const error = new Error('Email configuration is invalid. Please check your environment variables (EMAIL_HOST, EMAIL_USER, EMAIL_PASSWORD or EMAIL_PASS, EMAIL_FROM).');
    console.error('❌ Email send failed:', error.message);
    throw error;
  }

  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || 'Indian Village Manor <noreply@indianvillagemanor.com>',
      ...options,
    });
    console.log('✅ Email sent successfully:', { to: options.to, subject: options.subject, messageId: info.messageId });
  } catch (error) {
    console.error('❌ Error sending email:', error);

    // Provide more specific error messages
    if (error instanceof Error) {
      if (error.message.includes('Missing credentials')) {
        throw new Error('Email authentication failed. Please check EMAIL_USER and EMAIL_PASSWORD in your .env file.');
      }
      if (error.message.includes('EAUTH')) {
        throw new Error('Email authentication failed. Your email credentials may be incorrect or your email provider may require an app-specific password.');
      }
      if (error.message.includes('ETIMEDOUT') || error.message.includes('ECONNECTION')) {
        throw new Error('Failed to connect to email server. Please check your EMAIL_HOST and EMAIL_PORT settings.');
      }
      // Re-throw the original error with context
      throw new Error(`Failed to send email: ${error.message}`);
    }

    throw new Error('Failed to send email due to an unknown error.');
  }
}

export function replaceTemplateVariables(
  template: string,
  variables: Record<string, string>
): string {
  let result = template;
  for (const [key, value] of Object.entries(variables)) {
    result = result.replace(new RegExp(`{{${key}}}`, 'g'), value);
  }
  return result;
}

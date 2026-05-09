import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

// Configure your sender email here
// You need to verify this in Resend dashboard first
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';

export async function sendWelcomeEmail(
  email: string,
  setupLink: string,
  name: string
) {
  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: 'Welcome to DeviceCare! Complete Your Account Setup',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #009B4D 0%, #006B35 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 28px;">Welcome to DeviceCare!</h1>
            </div>
            
            <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e5e5; border-top: none; border-radius: 0 0 10px 10px;">
              <p style="font-size: 18px; margin-bottom: 20px;">Hi ${name},</p>
              
              <p style="margin-bottom: 20px;">
                Thank you for joining DeviceCare Membership! Your payment has been processed successfully.
              </p>
              
              <p style="margin-bottom: 20px;">
                <strong>Next step:</strong> Complete your account setup by creating a password and adding your profile details.
              </p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${setupLink}" 
                   style="background: #009B4D; color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold; font-size: 16px;">
                  Complete Account Setup
                </a>
              </div>
              
              <div style="background: #f8f9fa; border-left: 4px solid #009B4D; padding: 15px; margin: 20px 0;">
                <p style="margin: 0; font-size: 14px;">
                  <strong>What you'll do:</strong>
                </p>
                <ul style="margin: 10px 0; padding-left: 20px; font-size: 14px;">
                  <li>Set your password</li>
                  <li>Upload your profile photo</li>
                  <li>Add your contact details</li>
                  <li>Access your membership card</li>
                </ul>
              </div>
              
              <p style="margin-top: 30px; font-size: 14px; color: #666;">
                This link expires in 24 hours. If you didn't sign up for DeviceCare, please ignore this email.
              </p>
              
              <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 30px 0;">
              
              <p style="font-size: 14px; color: #666; margin: 0;">
                Questions? Reply to this email or visit our website.<br>
                <strong>New Forest Device Repairs</strong>
              </p>
            </div>
          </body>
        </html>
      `,
    });
    
    return { success: true };
  } catch (error) {
    console.error('Failed to send welcome email:', error);
    return { success: false, error };
  }
}

export async function sendPasswordResetEmail(
  email: string,
  resetLink: string
) {
  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: 'Reset Your DeviceCare Password',
      html: `
        <!DOCTYPE html>
        <html>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2>Reset Your Password</h2>
            <p>Click the button below to reset your DeviceCare password:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetLink}" 
                 style="background: #009B4D; color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold;">
                Reset Password
              </a>
            </div>
            <p style="font-size: 14px; color: #666;">
              This link expires in 1 hour. If you didn't request this, please ignore this email.
            </p>
          </body>
        </html>
      `,
    });
    
    return { success: true };
  } catch (error) {
    console.error('Failed to send password reset email:', error);
    return { success: false, error };
  }
}

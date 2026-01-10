import * as nodemailer from 'nodemailer';

// Email transporter configuration
const createTransporter = () => {
    // For development, use ethereal email for testing
    // For production, use actual SMTP credentials from environment variables

    if (process.env.NODE_ENV === 'production') {
        return nodemailer.createTransport({
            host: process.env.EMAIL_HOST || 'smtp.gmail.com',
            port: parseInt(process.env.EMAIL_PORT || '587'),
            secure: false, // true for 465, false for other ports
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASSWORD,
            },
        });
    }

    // Development - log emails to console
    return nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
            user: 'test@ethereal.email',
            pass: 'test123',
        },
    });
};

export const sendPasswordResetEmail = async (
    email: string,
    resetToken: string,
    userName: string
): Promise<void> => {
    const transporter = createTransporter();

    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/auth/reset-password?token=${resetToken}`;

    const mailOptions = {
        from: `"Let's L-Earn and Lead" <${process.env.EMAIL_USER || 'noreply@letslean.com'}>`,
        to: email,
        subject: 'Password Reset Request',
        html: `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <style>
                    body {
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                        line-height: 1.6;
                        color: #333;
                        background-color: #f5f5f5;
                        margin: 0;
                        padding: 0;
                    }
                    .container {
                        max-width: 600px;
                        margin: 40px auto;
                        background-color: #ffffff;
                        border-radius: 8px;
                        overflow: hidden;
                        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                    }
                    .header {
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        padding: 40px 20px;
                        text-align: center;
                    }
                    .header h1 {
                        color: #ffffff;
                        margin: 0;
                        font-size: 28px;
                    }
                    .content {
                        padding: 40px 30px;
                    }
                    .content h2 {
                        color: #333;
                        margin-top: 0;
                    }
                    .button {
                        display: inline-block;
                        padding: 14px 32px;
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        color: #ffffff !important;
                        text-decoration: none;
                        border-radius: 6px;
                        margin: 20px 0;
                        font-weight: 600;
                    }
                    .footer {
                        background-color: #f9f9f9;
                        padding: 20px 30px;
                        text-align: center;
                        font-size: 14px;
                        color: #666;
                    }
                    .warning {
                        background-color: #fff3cd;
                        border-left: 4px solid #ffc107;
                        padding: 12px;
                        margin: 20px 0;
                        border-radius: 4px;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>🎓 Let's L-Earn and Lead</h1>
                    </div>
                    <div class="content">
                        <h2>Hello ${userName},</h2>
                        <p>We received a request to reset your password. Click the button below to create a new password:</p>
                        
                        <center>
                            <a href="${resetUrl}" class="button">Reset Password</a>
                        </center>
                        
                        <p>Or copy and paste this link into your browser:</p>
                        <p style="word-break: break-all; color: #667eea;">${resetUrl}</p>
                        
                        <div class="warning">
                            <strong>⚠️ Security Notice:</strong>
                            <ul style="margin: 8px 0;">
                                <li>This link will expire in <strong>1 hour</strong></li>
                                <li>If you didn't request this, please ignore this email</li>
                                <li>Never share this link with anyone</li>
                            </ul>
                        </div>
                        
                        <p>If you have any questions, feel free to contact our support team.</p>
                        
                        <p>Best regards,<br><strong>Let's L-Earn and Lead Team</strong></p>
                    </div>
                    <div class="footer">
                        <p>© ${new Date().getFullYear()} Let's L-Earn and Lead. All rights reserved.</p>
                        <p>This is an automated email. Please do not reply.</p>
                    </div>
                </div>
            </body>
            </html>
        `,
        text: `
Hello ${userName},

We received a request to reset your password.

Click this link to reset your password: ${resetUrl}

This link will expire in 1 hour.

If you didn't request this, please ignore this email.

Best regards,
Let's L-Earn and Lead Team
        `,
    };

    try {
        // In development, just log the reset URL instead of sending email
        if (process.env.NODE_ENV !== 'production') {
            console.log('\n================================');
            console.log('📧 PASSWORD RESET EMAIL');
            console.log('================================');
            console.log('To:', email);
            console.log('Subject:', mailOptions.subject);
            console.log('\n🔗 Reset URL:');
            console.log(resetUrl);
            console.log('\n💡 Copy this URL and paste in browser to reset password');
            console.log('================================\n');
            return;
        }

        // In production, actually send the email
        const transporter = createTransporter();
        const info = await transporter.sendMail(mailOptions);
        console.log('Password reset email sent:', info.messageId);
    } catch (error) {
        console.error('Error sending password reset email:', error);
        throw new Error('Failed to send password reset email');
    }
};

export const sendInvoiceEmail = async (
    email: string,
    userName: string,
    invoiceUrl: string,
    invoiceNumber: string
): Promise<void> => {
    const transporter = createTransporter();

    const mailOptions = {
        from: `"Let's L-Earn and Lead" <${process.env.EMAIL_USER || 'noreply@letslean.com'}>`,
        to: email,
        subject: `Invoice ${invoiceNumber} - Payment Confirmation`,
        html: `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        line-height: 1.6;
                        color: #333;
                    }
                    .container {
                        max-width: 600px;
                        margin: 0 auto;
                        padding: 20px;
                    }
                    .header {
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        color: white;
                        padding: 20px;
                        text-align: center;
                        border-radius: 8px 8px 0 0;
                    }
                    .content {
                        background: #f9f9f9;
                        padding: 20px;
                        border-radius: 0 0 8px 8px;
                    }
                    .button {
                        display: inline-block;
                        padding: 12px 24px;
                        background-color: #667eea;
                        color: white !important;
                        text-decoration: none;
                        border-radius: 6px;
                        margin: 10px 0;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>Payment Successful! 🎉</h1>
                    </div>
                    <div class="content">
                        <p>Hello ${userName},</p>
                        <p>Thank you for your purchase! Your payment has been successfully processed.</p>
                        <p><strong>Invoice Number:</strong> ${invoiceNumber}</p>
                        <p>You can download your invoice using the button below:</p>
                        <center>
                            <a href="${invoiceUrl}" class="button">Download Invoice</a>
                        </center>
                        <p>Best regards,<br>Let's L-Earn and Lead Team</p>
                    </div>
                </div>
            </body>
            </html>
        `,
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log('Invoice email sent to:', email);
    } catch (error) {
        console.error('Error sending invoice email:', error);
        // Don't throw error - invoice email is optional
    }
};

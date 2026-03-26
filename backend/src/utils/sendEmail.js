const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
    // Validate SMTP credentials exist
    if (!process.env.SMTP_EMAIL || !process.env.SMTP_PASSWORD) {
        console.error('❌ EMAIL CONFIG ERROR: SMTP_EMAIL or SMTP_PASSWORD environment variables are missing!');
        console.error('   SMTP_EMAIL:', process.env.SMTP_EMAIL ? '✅ Set' : '❌ MISSING');
        console.error('   SMTP_PASSWORD:', process.env.SMTP_PASSWORD ? '✅ Set' : '❌ MISSING');
        throw new Error('Email service not configured: SMTP credentials missing');
    }

    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.SMTP_EMAIL,
            pass: process.env.SMTP_PASSWORD
        }
    });

    const message = {
        from: `${process.env.FROM_NAME || 'Youth Action Network'} <${process.env.FROM_EMAIL || process.env.SMTP_EMAIL}>`,
        to: options.email,
        subject: options.subject,
        text: options.message,
        html: options.html
    };

    console.log(`📧 Sending email to ${options.email} | Subject: "${options.subject}"`);
    const info = await transporter.sendMail(message);
    console.log('✅ Email sent successfully: %s', info.messageId);

    return info;
};

module.exports = sendEmail;

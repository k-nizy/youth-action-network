const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
    const smtpUser = process.env.SMTP_EMAIL;
    const smtpPass = process.env.SMTP_PASSWORD;

    if (!smtpUser || !smtpPass) {
        throw new Error('SMTP credentials are missing. Set SMTP_EMAIL and SMTP_PASSWORD.');
    }

    // Support both explicit SMTP host/port and Gmail service fallback.
    const transporterConfig = process.env.SMTP_HOST
        ? {
            host: process.env.SMTP_HOST,
            port: Number(process.env.SMTP_PORT || 587),
            secure: String(process.env.SMTP_SECURE || 'false') === 'true',
            auth: { user: smtpUser, pass: smtpPass }
        }
        : {
            service: 'gmail',
            auth: { user: smtpUser, pass: smtpPass }
        };

    const transporter = nodemailer.createTransport(transporterConfig);

    const message = {
        from: `${process.env.FROM_NAME || 'Youth Action Network'} <${process.env.FROM_EMAIL || smtpUser}>`,
        to: options.email,
        subject: options.subject,
        text: options.message,
        html: options.html
    };

    const info = await transporter.sendMail(message);
    console.log('Message sent: %s', info.messageId);
    return info;
};

module.exports = sendEmail;

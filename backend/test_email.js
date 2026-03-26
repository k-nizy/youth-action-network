require('dotenv').config();
const sendEmail = require('./src/utils/sendEmail');

console.log('=== EMAIL DELIVERY TEST ===');
console.log('SMTP_EMAIL:', process.env.SMTP_EMAIL || 'NOT SET');
console.log('SMTP_PASSWORD:', process.env.SMTP_PASSWORD ? '****' + process.env.SMTP_PASSWORD.slice(-4) : 'NOT SET');
console.log('FROM_NAME:', process.env.FROM_NAME || 'NOT SET');
console.log('FROM_EMAIL:', process.env.FROM_EMAIL || 'NOT SET');
console.log('');

(async () => {
    try {
        console.log('Test 1: Sending test email to admin...');
        await sendEmail({
            email: 'yaneip26@gmail.com',
            subject: 'YAN Email Test - ' + new Date().toISOString(),
            message: 'This is a test email from the YAN platform to verify SMTP works.',
            html: '<div style="font-family:Arial;padding:20px;"><h2 style="color:#03045E;">YAN Email Test</h2><p>If you see this, emails are working! ✅</p><p>Time: ' + new Date().toISOString() + '</p></div>'
        });
        console.log('✅ TEST PASSED: Email sent successfully!');
    } catch (err) {
        console.error('❌ TEST FAILED:', err.message);
        if (err.code) console.error('   Error code:', err.code);
        if (err.response) console.error('   SMTP Response:', err.response);
    }
})();

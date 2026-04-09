const nodemailer = require("nodemailer");

const MAIL_TIMEOUT_MS = Number(process.env.MAIL_TIMEOUT_MS || 15000);

if (!process.env.MAIL_USER || !process.env.MAIL_PASS) {
    console.error("❌ MAIL_USER / MAIL_PASS missing. Email features will fail until configured.");
}

const transporter = nodemailer.createTransport({
    service: "gmail",
    connectionTimeout: MAIL_TIMEOUT_MS,
    greetingTimeout: MAIL_TIMEOUT_MS,
    socketTimeout: MAIL_TIMEOUT_MS,
    auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
    },
});

// Verify connection on startup
transporter.verify((err, success) => {
    if (err) {
        console.error("❌ Mail transporter FAILED to connect:");
        console.error("   Reason:", err.message);
        console.error("   Code:", err.code);
    } else {
        console.log("✅ Mail transporter connected — ready to send emails");
    }
});

const sendMail = async ({ to, subject, html }) => {
    try {
        console.log(`📤 Attempting to send mail to: ${to}`);
        console.log(`   Subject: ${subject}`);
        console.log(`   From: ${process.env.MAIL_USER}`);
        console.log(`   Timeout: ${MAIL_TIMEOUT_MS}ms`);

        const info = await Promise.race([
            transporter.sendMail({
                from: `"MyLibrary" <${process.env.MAIL_USER}>`,
                to,
                subject,
                html,
            }),
            new Promise((_, reject) => {
                setTimeout(() => reject(new Error(`Mail send timed out after ${MAIL_TIMEOUT_MS}ms`)), MAIL_TIMEOUT_MS);
            }),
        ]);

        console.log(`✅ Mail ACCEPTED by Gmail`);
        console.log(`   Message ID: ${info.messageId}`);
        console.log(`   Response:   ${info.response}`);
        return info;
    } catch (err) {
        console.error(`❌ Mail FAILED`);
        console.error(`   To:      ${to}`);
        console.error(`   Error:   ${err.message}`);
        console.error(`   Code:    ${err.code}`);
        console.error(`   Full:    ${JSON.stringify(err, null, 2)}`);
        throw err;
    }
};

module.exports = sendMail;

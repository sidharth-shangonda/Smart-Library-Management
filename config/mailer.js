const nodemailer = require("nodemailer");

const MAIL_TIMEOUT_MS = Number(process.env.MAIL_TIMEOUT_MS || 15000);
const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = Number(process.env.SMTP_PORT || 0);
const SMTP_SECURE = String(process.env.SMTP_SECURE || "").toLowerCase() === "true";
const MAIL_FROM = process.env.MAIL_FROM?.trim() || process.env.MAIL_USER;

if (!process.env.MAIL_USER || !process.env.MAIL_PASS) {
    console.error("❌ MAIL_USER / MAIL_PASS missing. Email features will fail until configured.");
}

const transportConfig = {
    connectionTimeout: MAIL_TIMEOUT_MS,
    greetingTimeout: MAIL_TIMEOUT_MS,
    socketTimeout: MAIL_TIMEOUT_MS,
    auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
    },
};

if (SMTP_HOST) {
    transportConfig.host = SMTP_HOST;
    transportConfig.port = SMTP_PORT || 587;
    transportConfig.secure = SMTP_PORT ? SMTP_SECURE : false;
} else {
    // Backward-compatible fallback for existing Gmail config
    transportConfig.host = "smtp.gmail.com";
    transportConfig.port = 465;
    transportConfig.secure = true;
}

const transporter = nodemailer.createTransport(transportConfig);

// Verify connection on startup
transporter.verify((err, success) => {
    if (err) {
        console.error("❌ Mail transporter FAILED to connect:");
        console.error("   Host:", transportConfig.host);
        console.error("   Port:", transportConfig.port);
        console.error("   Reason:", err.message);
        console.error("   Code:", err.code);
    } else {
        console.log(`✅ Mail transporter connected — ${transportConfig.host}:${transportConfig.port}`);
    }
});

const sendMail = async ({ to, subject, html }) => {
    try {
        console.log(`📤 Attempting to send mail to: ${to}`);
        console.log(`   Subject: ${subject}`);
        console.log(`   From: ${MAIL_FROM}`);
        console.log(`   Timeout: ${MAIL_TIMEOUT_MS}ms`);

        const info = await Promise.race([
            transporter.sendMail({
                from: `"MyLibrary" <${MAIL_FROM}>`,
                to,
                subject,
                html,
            }),
            new Promise((_, reject) => {
                setTimeout(() => reject(new Error(`Mail send timed out after ${MAIL_TIMEOUT_MS}ms`)), MAIL_TIMEOUT_MS);
            }),
        ]);

        console.log(`✅ Mail accepted by SMTP provider`);
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

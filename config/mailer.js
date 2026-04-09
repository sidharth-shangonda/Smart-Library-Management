const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
    service: "gmail",
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

        const info = await transporter.sendMail({
            from: `"MyLibrary" <${process.env.MAIL_USER}>`,
            to,
            subject,
            html,
        });

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

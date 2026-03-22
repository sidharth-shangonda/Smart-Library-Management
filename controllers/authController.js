const User      = require("../models/User");
const sendMail  = require("../config/mailer");
const templates = require("../config/emailTemplates");

// GET /signup
const getSignup = (req, res) => res.render("signup", { message: null, type: null });

// POST /signup
const postSignup = async (req, res) => {
    const { username, email, password, confirmPassword } = req.body;
    if (!username || !email || !password || !confirmPassword)
        return res.render("signup", { message: "All fields are required.", type: "error" });
    if (password !== confirmPassword)
        return res.render("signup", { message: "Passwords do not match.", type: "error" });
    try {
        if (await User.findOne({ username }))
            return res.render("signup", { message: "Username already exists.", type: "error" });
        if (await User.findOne({ email }))
            return res.render("signup", { message: "Email already registered.", type: "error" });

        const newUser = new User({ username, email, password });
        const token   = newUser.generateVerifyToken();
        await newUser.save();

        const verifyLink = `${process.env.APP_URL}/verify-email?token=${token}`;
        await sendMail({ to: email, ...templates.verifyEmail(username, verifyLink) });

        res.render("signup", {
            message: `A verification link has been sent to ${email}. Please check your inbox.`,
            type: "success",
        });
    } catch (err) {
        console.error("Signup error:", err);
        res.render("signup", { message: "Signup failed. Please try again.", type: "error" });
    }
};

// GET /verify-email?token=xxx
const verifyEmail = async (req, res) => {
    const { token } = req.query;
    if (!token) return res.render("verify_status", { success: false, message: "Invalid link." });
    try {
        const user = await User.findOne({ verifyToken: token, verifyExpires: { $gt: new Date() } });
        if (!user) return res.render("verify_status", { success: false, message: "Link is invalid or expired. Please sign up again." });

        user.isVerified    = true;
        user.verifyToken   = null;
        user.verifyExpires = null;
        await user.save();

        await sendMail({ to: user.email, ...templates.verifySuccess(user.username, process.env.APP_URL) });
        res.render("verify_status", { success: true, message: "Email verified! You can now log in." });
    } catch (err) {
        console.error("Verify error:", err);
        res.render("verify_status", { success: false, message: "Something went wrong." });
    }
};

// GET /login
const getLogin = (req, res) => res.render("login", { message: null });

// POST /login
const postLogin = async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password)
        return res.render("login", { message: "All fields are required." });
    try {
        const user = await User.findOne({ username });
        if (!user) return res.render("login", { message: "Invalid credentials." });
        if (!user.isVerified) return res.render("login", { message: "Please verify your email before logging in. Check your inbox." });

        const isMatch = await user.comparePassword(password);
        if (!isMatch) return res.render("login", { message: "Invalid credentials." });

        req.session.user_id  = user._id.toString();
        req.session.username = user.username;
        req.session.isAdmin  = user.isAdmin;

        res.redirect(user.isAdmin ? "/admin" : "/dashboard");
    } catch (err) {
        console.error("Login error:", err);
        res.render("login", { message: "Login failed. Please try again." });
    }
};

// POST /logout
const postLogout = (req, res) => {
    req.session.destroy(() => res.redirect("/"));
};

// GET /profile (JSON)
const getProfile = async (req, res) => {
    if (!req.session.user_id) return res.status(401).json({ error: "Not logged in" });
    try {
        const user = await User.findById(req.session.user_id).select("-password");
        if (!user) return res.status(404).json({ error: "User not found" });
        res.json({ user_id: user._id, username: user.username, email: user.email });
    } catch (err) {
        res.status(500).json({ error: "Server error" });
    }
};

// GET /forgot-password
const getForgotPassword = (req, res) => res.render("forgot_password", { message: null, type: null });

// POST /forgot-password
const postForgotPassword = async (req, res) => {
    const { email } = req.body;
    if (!email) return res.render("forgot_password", { message: "Email is required.", type: "error" });
    try {
        const user = await User.findOne({ email });
        // Always show success to prevent email enumeration
        if (!user) return res.render("forgot_password", {
            message: "If that email exists, a reset link has been sent.",
            type: "success",
        });

        const token = user.generateResetToken();
        await user.save();

        const resetLink = `${process.env.APP_URL}/reset-password?token=${token}`;
        await sendMail({ to: user.email, ...templates.forgotPassword(user.username, resetLink) });

        res.render("forgot_password", {
            message: "A password reset link has been sent to your email.",
            type: "success",
        });
    } catch (err) {
        console.error("Forgot password error:", err);
        res.render("forgot_password", { message: "Something went wrong.", type: "error" });
    }
};

// GET /reset-password?token=xxx
const getResetPassword = async (req, res) => {
    const { token } = req.query;
    try {
        const user = await User.findOne({ resetToken: token, resetExpires: { $gt: new Date() } });
        if (!user) return res.render("verify_status", { success: false, message: "Reset link is invalid or expired." });
        res.render("reset_password", { token, message: null, type: null });
    } catch (err) {
        res.render("verify_status", { success: false, message: "Something went wrong." });
    }
};

// POST /reset-password
const postResetPassword = async (req, res) => {
    const { token, password, confirmPassword } = req.body;
    if (!password || !confirmPassword)
        return res.render("reset_password", { token, message: "All fields are required.", type: "error" });
    if (password !== confirmPassword)
        return res.render("reset_password", { token, message: "Passwords do not match.", type: "error" });
    try {
        const user = await User.findOne({ resetToken: token, resetExpires: { $gt: new Date() } });
        if (!user) return res.render("verify_status", { success: false, message: "Reset link is invalid or expired." });

        user.password     = password; // pre-save hook will hash it
        user.resetToken   = null;
        user.resetExpires = null;
        await user.save();

        await sendMail({ to: user.email, ...templates.passwordChanged(user.username) });
        res.render("verify_status", { success: true, message: "Password changed successfully! You can now log in." });
    } catch (err) {
        console.error("Reset password error:", err);
        res.render("reset_password", { token, message: "Something went wrong.", type: "error" });
    }
};

module.exports = {
    getSignup, postSignup,
    verifyEmail,
    getLogin, postLogin,
    postLogout, getProfile,
    getForgotPassword, postForgotPassword,
    getResetPassword, postResetPassword,
};

// POST /resend-verification
const resendVerification = async (req, res) => {
    const { email } = req.body;
    if (!email) return res.render("login", { message: "Please enter your email to resend verification." });
    try {
        const user = await User.findOne({ email, isVerified: false });
        if (!user) return res.render("login", { message: "Email not found or already verified." });

        const token = user.generateVerifyToken();
        await user.save();

        const verifyLink = `${process.env.APP_URL}/verify-email?token=${token}`;
        await sendMail({ to: user.email, ...templates.verifyEmail(user.username, verifyLink) });

        res.render("login", { message: `Verification email resent to ${email}. Check your inbox.` });
    } catch (err) {
        console.error("Resend verify error:", err);
        res.render("login", { message: "Failed to resend. Try again." });
    }
};

module.exports.resendVerification = resendVerification;

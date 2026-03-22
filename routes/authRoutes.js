const express = require("express");
const router  = express.Router();
const {
    getSignup, postSignup, verifyEmail,
    getLogin, postLogin, postLogout, getProfile,
    getForgotPassword, postForgotPassword,
    getResetPassword, postResetPassword,
    resendVerification,
} = require("../controllers/authController");

router.get("/signup",              getSignup);
router.post("/signup",             postSignup);
router.get("/verify-email",        verifyEmail);
router.get("/login",               getLogin);
router.post("/login",              postLogin);
router.post("/logout",             postLogout);
router.get("/profile",             getProfile);
router.get("/forgot-password",     getForgotPassword);
router.post("/forgot-password",    postForgotPassword);
router.get("/reset-password",      getResetPassword);
router.post("/reset-password",     postResetPassword);
router.post("/resend-verification",resendVerification);

module.exports = router;

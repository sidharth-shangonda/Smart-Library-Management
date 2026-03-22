// GET /
const getHome = (req, res) => {
    res.render("index");
};

// GET /dashboard
const getDashboard = (req, res) => {
    if (!req.session.user_id) return res.redirect("/login");

    res.render("dashboard", {
        username: req.session.username,
        user_id: req.session.user_id,
    });
};

module.exports = { getHome, getDashboard };

require("dotenv").config();
const express    = require("express");
const path       = require("path");
const cors       = require("cors");
const session    = require("express-session");
const MongoStore = require("connect-mongo");

const connectDB         = require("./config/db");
const { startCronJobs } = require("./config/cronJobs");
const authRoutes        = require("./routes/authRoutes");
const bookRoutes        = require("./routes/bookRoutes");
const pageRoutes        = require("./routes/pageRoutes");
const adminRoutes       = require("./routes/adminRoutes");

const app = express();

connectDB().then(() => startCronJobs());

app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(session({
    secret:            process.env.SESSION_SECRET,
    resave:            false,
    saveUninitialized: false,
    store:             MongoStore.create({ mongoUrl: process.env.MONGO_URI }),
    cookie:            { maxAge: 1000 * 60 * 60 * 24 },
}));

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));

app.use("/",      pageRoutes);
app.use("/",      authRoutes);
app.use("/",      bookRoutes);
app.use("/admin", adminRoutes);

app.use((req, res) => res.status(404).send("404 - Page Not Found"));

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));

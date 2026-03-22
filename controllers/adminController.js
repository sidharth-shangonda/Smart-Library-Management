const User       = require("../models/User");
const Book       = require("../models/Book");
const IssuedBook = require("../models/IssuedBook");

const formatDate = (dateVal) => {
    if (!dateVal) return "N/A";
    const d = new Date(dateVal);
    return `${String(d.getDate()).padStart(2,"0")}-${String(d.getMonth()+1).padStart(2,"0")}-${d.getFullYear()}`;
};

// GET /admin
const getAdminDashboard = async (req, res) => {
    try {
        const totalUsers   = await User.countDocuments({ isAdmin: false });
        const totalBooks   = await Book.countDocuments();
        const totalIssued  = await IssuedBook.countDocuments({ returned: false });
        const overdueBooks = await IssuedBook.countDocuments({ returned: false, due_date: { $lt: new Date() } });
        res.render("admin/dashboard", { totalUsers, totalBooks, totalIssued, overdueBooks });
    } catch (err) {
        console.error("Admin dashboard error:", err);
        res.status(500).send("Server Error");
    }
};

// GET /admin/books
const getAdminBooks = async (req, res) => {
    try {
        const q     = req.query.q || "";
        const page  = parseInt(req.query.page) || 1;
        const limit = 20;
        const skip  = (page - 1) * limit;
        const filter = q ? { $or: [{ title: { $regex: q, $options: "i" } }, { author: { $regex: q, $options: "i" } }] } : {};
        const books     = await Book.find(filter).skip(skip).limit(limit).lean();
        const total     = await Book.countDocuments(filter);
        const totalPages = Math.ceil(total / limit);
        res.render("admin/books", { books, q, page, totalPages, message: req.query.message || null });
    } catch (err) {
        res.status(500).send("Server Error");
    }
};

// POST /admin/books/add
const addBook = async (req, res) => {
    const { title, author, publisher, published_year, totalStock } = req.body;
    try {
        const lastBook = await Book.findOne().sort({ book_id: -1 });
        const newId    = lastBook ? lastBook.book_id + 1 : 1;
        const stock    = parseInt(totalStock) || 1;
        await Book.create({ book_id: newId, title, author, publisher, published_year: parseInt(published_year) || null, totalStock: stock, availableStock: stock });
        res.redirect("/admin/books?message=Book added successfully");
    } catch (err) {
        console.error("Add book error:", err);
        res.redirect("/admin/books?message=Failed to add book");
    }
};

// POST /admin/books/edit/:id
const editBook = async (req, res) => {
    const { title, author, publisher, published_year, totalStock } = req.body;
    try {
        const book    = await Book.findById(req.params.id);
        const oldStock = book.totalStock;
        const newStock = parseInt(totalStock) || 1;
        const diff     = newStock - oldStock;
        await Book.findByIdAndUpdate(req.params.id, {
            title, author, publisher,
            published_year: parseInt(published_year) || null,
            totalStock: newStock,
            availableStock: Math.max(0, book.availableStock + diff),
        });
        res.redirect("/admin/books?message=Book updated successfully");
    } catch (err) {
        res.redirect("/admin/books?message=Failed to update book");
    }
};

// POST /admin/books/delete/:id
const deleteBook = async (req, res) => {
    try {
        const book = await Book.findById(req.params.id);
        if (!book) return res.redirect("/admin/books?message=Book not found");
        // Don't delete if currently issued
        const isIssued = await IssuedBook.findOne({ book_id: book.book_id, returned: false });
        if (isIssued) return res.redirect("/admin/books?message=Cannot delete — book is currently borrowed");
        await Book.findByIdAndDelete(req.params.id);
        res.redirect("/admin/books?message=Book deleted successfully");
    } catch (err) {
        res.redirect("/admin/books?message=Failed to delete book");
    }
};

// GET /admin/users
const getAdminUsers = async (req, res) => {
    try {
        const q      = req.query.q || "";
        const filter = q ? { isAdmin: false, $or: [{ username: { $regex: q, $options: "i" } }, { email: { $regex: q, $options: "i" } }] } : { isAdmin: false };
        const users  = await User.find(filter).select("-password").lean();
        res.render("admin/users", { users, q, message: req.query.message || null });
    } catch (err) {
        res.status(500).send("Server Error");
    }
};

// GET /admin/issued
const getAdminIssued = async (req, res) => {
    try {
        const records = await IssuedBook.find({ returned: false }).lean();
        const now     = new Date(); now.setHours(0,0,0,0);

        const issuedBooks = records.map(r => {
            const due      = new Date(r.due_date); due.setHours(0,0,0,0);
            const daysLeft = Math.floor((due - now) / (1000*60*60*24));
            const overdue  = daysLeft < 0;
            const fine     = overdue ? Math.abs(daysLeft) * 10 : 0;
            return { ...r, issue_date: formatDate(r.issue_date), due_date: formatDate(r.due_date), daysLeft, overdue, fine };
        });

        res.render("admin/issued", { issuedBooks, message: req.query.message || null });
    } catch (err) {
        res.status(500).send("Server Error");
    }
};

// POST /admin/fine/mark-paid/:id
const markFinePaid = async (req, res) => {
    try {
        await IssuedBook.findByIdAndUpdate(req.params.id, { finePaid: true });
        res.redirect("/admin/issued?message=Fine marked as paid");
    } catch (err) {
        res.redirect("/admin/issued?message=Failed to update fine");
    }
};

module.exports = { getAdminDashboard, getAdminBooks, addBook, editBook, deleteBook, getAdminUsers, getAdminIssued, markFinePaid };

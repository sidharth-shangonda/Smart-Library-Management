const express = require("express");
const router  = express.Router();
const { requireAdmin } = require("../middleware/auth");
const {
    getAdminDashboard, getAdminBooks, addBook, editBook, deleteBook,
    getAdminUsers, getAdminIssued, markFinePaid,
} = require("../controllers/adminController");

router.use(requireAdmin);

router.get("/",                    getAdminDashboard);
router.get("/books",               getAdminBooks);
router.post("/books/add",          addBook);
router.post("/books/edit/:id",     editBook);
router.post("/books/delete/:id",   deleteBook);
router.get("/users",               getAdminUsers);
router.get("/issued",              getAdminIssued);
router.post("/fine/mark-paid/:id", markFinePaid);

module.exports = router;

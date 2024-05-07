const express = require("express");
const router = express.Router();
const { createUser, loginUser, dashboard, emailLink, resetPassword } = require("../Controllers/User.Controller");

router.post("/createUser", createUser);
router.post("/loginUser", loginUser);
router.get("/dashboard", dashboard);
router.post("/email", emailLink);
router.post("/reset_password", resetPassword);


module.exports = router;
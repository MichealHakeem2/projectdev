const router = require("express").Router();
const { login } = require("../controllers/login.auth");
const { signup } = require("../controllers/registration.auth");
router.post("/signup", signup);
router.post("/login", login);

module.exports = router;

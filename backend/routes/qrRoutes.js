const router = require("express").Router();
const auth = require("../middleware/auth");
const { generateQR, validateQR } = require("../controllers/qrController");

router.get("/generate", auth, generateQR);
router.post("/validate", validateQR);

module.exports = router;

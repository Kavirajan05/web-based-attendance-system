const router = require("express").Router();
const auth = require("../middleware/auth");
const { generateQR, validateQR } = require("../controllers/qrController");

// Test route without authentication for now
router.get("/generate-test", (req, res) => {
  // Mock user for testing
  req.user = { user_id: "test-user-123" };
  generateQR(req, res);
});

router.get("/generate", auth, generateQR);
router.post("/validate", validateQR);

module.exports = router;

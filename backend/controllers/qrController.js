const QrToken = require("../models/QrToken");
const crypto = require("crypto-js");
const { v4: uuidv4 } = require("uuid");

exports.generateQR = async (req, res) => {
  try {
    const user_id = req.user.user_id; // from JWT auth

    const qr_id = uuidv4();
    const issued_at = new Date();
    const expires_at = new Date(issued_at.getTime() + 60 * 1000); // 60 seconds validity

    // Create secure signature
    const signature = crypto.HmacSHA256(
      `${qr_id}|${user_id}|${issued_at}`,
      process.env.JWT_SECRET
    ).toString();

    // Save QR token
    await QrToken.create({
      qr_id,
      user_id,
      issued_at,
      expires_at,
      signature,
      window: "entry"
    });

    // Send QR Data to mobile
    res.json({
      qr_id,
      user_id,
      issued_at,
      expires_at,
      signature
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
exports.validateQR = async (req, res) => {
  try {
    const { qr_id, signature } = req.body;

    const token = await QrToken.findOne({ qr_id });
    if (!token) return res.status(400).json({ msg: "Invalid QR" });

    if (new Date() > token.expires_at) {
      return res.status(400).json({ msg: "QR expired" });
    }

    const expectedSignature = crypto.HmacSHA256(
      `${token.qr_id}|${token.user_id}|${token.issued_at}`,
      process.env.JWT_SECRET
    ).toString();

    if (signature !== expectedSignature) {
      return res.status(400).json({ msg: "QR tampered / invalid signature" });
    }

    return res.json({
      msg: "QR valid",
      user_id: token.user_id,
      window: token.window
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

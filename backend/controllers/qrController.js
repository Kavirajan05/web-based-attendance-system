const QrToken = require("../models/QrToken");
const crypto = require("crypto-js");
const { v4: uuidv4 } = require("uuid");

// In-memory storage for testing (replace with database in production)
const qrTokens = new Map();

exports.generateQR = async (req, res) => {
  try {
    const user_id = req.user.user_id; // from JWT auth

    const qr_id = uuidv4();
    const issued_at = new Date();
    const expires_at = new Date(issued_at.getTime() + 60 * 1000); // 60 seconds validity

    // Create secure signature
    const signature = crypto.HmacSHA256(
      `${qr_id}|${user_id}|${issued_at.toISOString()}`,
      process.env.JWT_SECRET || "fallback-secret-key"
    ).toString();

    // Store QR token in memory for testing
    qrTokens.set(qr_id, {
      qr_id,
      user_id,
      issued_at,
      expires_at,
      signature,
      window: "entry"
    });

    // Clean up expired tokens
    for (const [id, token] of qrTokens) {
      if (new Date() > token.expires_at) {
        qrTokens.delete(id);
      }
    }

    console.log(`Generated QR: ${qr_id} for user: ${user_id}`);

    // Send QR Data to mobile
    res.json({
      qr_id,
      user_id,
      issued_at,
      expires_at,
      signature
    });

  } catch (err) {
    console.error('QR Generation Error:', err);
    res.status(500).json({ error: err.message });
  }
};
exports.validateQR = async (req, res) => {
  try {
    const { qr_id, signature } = req.body;
    
    console.log(`Validating QR: ${qr_id}`);
    console.log(`Available QRs: ${Array.from(qrTokens.keys())}`);

    const token = qrTokens.get(qr_id);
    if (!token) {
      console.log('QR not found in memory store');
      return res.status(400).json({ msg: "Invalid QR" });
    }

    if (new Date() > token.expires_at) {
      qrTokens.delete(qr_id); // Clean up expired token
      console.log('QR expired');
      return res.status(400).json({ msg: "QR expired" });
    }

    const expectedSignature = crypto.HmacSHA256(
      `${token.qr_id}|${token.user_id}|${token.issued_at.toISOString()}`,
      process.env.JWT_SECRET || "fallback-secret-key"
    ).toString();

    if (signature !== expectedSignature) {
      console.log('Signature mismatch');
      console.log('Expected:', expectedSignature);
      console.log('Received:', signature);
      return res.status(400).json({ msg: "QR tampered / invalid signature" });
    }

    console.log('QR validation successful');
    return res.json({
      msg: "QR valid",
      user_id: token.user_id,
      window: token.window
    });

  } catch (err) {
    console.error('QR Validation Error:', err);
    res.status(500).json({ error: err.message });
  }
};

const mongoose = require("mongoose");

const QrTokenSchema = new mongoose.Schema({
  qr_id: { type: String, required: true },
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  window: { type: String, default: "entry" }, 
  issued_at: { type: Date },
  expires_at: { type: Date },
  signature: { type: String }
});

module.exports = mongoose.model("QrToken", QrTokenSchema);

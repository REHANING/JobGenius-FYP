const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: function() { return !this.googleId; } }, // Required only if not OAuth user
  googleId: { type: String, unique: true, sparse: true }, // For Google OAuth users
  profilePicture: { type: String }, // URL to profile picture
  role: { type: String, enum: ["jobseeker", "recruiter", "admin"], default: "jobseeker" },
  status: { type: String, enum: ["active", "suspended", "terminated"], default: "active" },
  warnings: { type: Number, default: 0 },
  terminationReason: { type: String },
  termsAccepted: { type: Boolean, default: false },
  termsAcceptedAt: { type: Date },
  isPaid: { type: Boolean, default: false }, // Subscription status
  subscriptionPlan: { type: String, enum: ["basic", "standard", "premium", "enterprise"], default: null },
  subscriptionDate: { type: Date }, // When subscription was activated
  analysisCount: { type: Number, default: 0 } // Track number of CV analyses done
}, { timestamps: true });

// Pre-save hook to normalize email (additional safety)
userSchema.pre('save', function(next) {
  if (this.email) {
    this.email = this.email.toLowerCase().trim();
  }
  next();
});

// Prevent model overwrite error during hot reloads
module.exports = mongoose.models.User || mongoose.model("User", userSchema);

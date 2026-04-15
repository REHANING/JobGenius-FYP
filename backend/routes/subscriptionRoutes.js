const express = require("express");
const User = require("../models/User");
const router = express.Router();

// Helper function to get analysis limit based on plan
const getAnalysisLimit = (plan) => {
  switch (plan) {
    case 'basic':
      return 1;
    case 'standard':
      return 5;
    case 'premium':
    case 'enterprise':
      return Infinity; // Unlimited
    default:
      return 0;
  }
};

// Activate subscription (mark user as paid)
router.post("/activate", async (req, res) => {
  try {
    const { userId, plan } = req.body;

    if (!userId) {
      return res.status(400).json({ success: false, error: "User ID is required" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, error: "User not found" });
    }

    // Mark user as paid
    const previousPlan = user.subscriptionPlan;
    user.isPaid = true;
    user.subscriptionPlan = plan || "premium";
    user.subscriptionDate = new Date();
    
    // Reset analysis count if plan changed (upgrade/downgrade)
    if (previousPlan !== user.subscriptionPlan) {
      user.analysisCount = 0;
    }
    
    await user.save();

    res.json({
      success: true,
      message: "Subscription activated successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isPaid: user.isPaid,
        subscriptionPlan: user.subscriptionPlan,
        subscriptionDate: user.subscriptionDate
      }
    });
  } catch (err) {
    console.error("Subscription activation error:", err);
    res.status(500).json({ success: false, error: "Failed to activate subscription", details: err.message });
  }
});

// Get subscription status
router.get("/status/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ success: false, error: "User not found" });
    }

    const analysisLimit = getAnalysisLimit(user.subscriptionPlan);
    
    res.json({
      success: true,
      isPaid: user.isPaid || false,
      subscriptionPlan: user.subscriptionPlan || null,
      subscriptionDate: user.subscriptionDate || null,
      analysisCount: user.analysisCount || 0,
      analysisLimit: analysisLimit,
      remainingAnalyses: analysisLimit === Infinity ? Infinity : Math.max(0, analysisLimit - (user.analysisCount || 0))
    });
  } catch (err) {
    console.error("Get subscription status error:", err);
    res.status(500).json({ success: false, error: "Failed to get subscription status", details: err.message });
  }
});

module.exports = router;


import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import { CheckCircleIcon } from "@heroicons/react/24/outline";

const Subscription: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState<string | null>(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState<{ isPaid: boolean; plan: string | null } | null>(null);

  useEffect(() => {
    if (user && user.role === 'jobseeker') {
      checkSubscriptionStatus();
    }
  }, [user]);

  const checkSubscriptionStatus = async () => {
    try {
      const userId = user?._id || user?.id;
      if (!userId) return;

      const response = await fetch(`http://localhost:5000/api/subscription/status/${userId}`);
      const data = await response.json();
      if (data.success) {
        setSubscriptionStatus({ isPaid: data.isPaid, plan: data.subscriptionPlan });
      }
    } catch (error) {
      console.error("Error checking subscription status:", error);
    }
  };

  const handleSubscribe = async (planName: string) => {
    if (!user || user.role !== 'jobseeker') {
      alert('Please log in as a job seeker to subscribe');
      return;
    }

    const userId = user._id || user.id;
    if (!userId) {
      alert('User ID not found');
      return;
    }

    setLoading(planName);
    try {
      const response = await fetch('http://localhost:5000/api/subscription/activate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: userId,
          plan: planName.toLowerCase()
        })
      });

      const data = await response.json();
      if (data.success) {
        // Update user in localStorage
        const updatedUser = { ...user, isPaid: true, subscriptionPlan: data.user.subscriptionPlan };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        
        // Reload page to update auth context
        window.location.reload();
        alert('Subscription activated successfully! All features are now available.');
      } else {
        alert(data.error || 'Failed to activate subscription');
      }
    } catch (error: any) {
      console.error('Subscription error:', error);
      alert('Error: ' + (error.message || 'Failed to process subscription'));
    } finally {
      setLoading(null);
    }
  };

  const plans = [
    {
      name: "Basic",
      id: "basic",
      price: "PKR 500 / month",
      features: ["1 CV Analysis", "Limited Job Matches", "Basic Support"],
    },
    {
      name: "Standard",
      id: "standard",
      price: "PKR 1000 / month",
      features: ["5 CV Analyses", "Priority Job Matches", "Email Support"],
    },
    {
      name: "Premium",
      id: "premium",
      price: "PKR 2000 / month",
      features: ["Unlimited CV Analyses", "AI Job Matching", "24/7 Support", "Dashboard Access", "AI Recommendations"],
    },
    {
      name: "Enterprise",
      id: "enterprise",
      price: "Custom",
      features: ["Team Access", "Dedicated Consultant", "Custom Features"],
    },
  ];

  if (user?.role !== 'jobseeker') {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#FFFFFF' }}>
        <Card className="p-8 text-center">
          <p className="text-saas-text-heading-secondary" style={{ fontFamily: 'Inter, sans-serif' }}>
            Subscription plans are only available for job seekers.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <section className="py-12 px-6 min-h-screen" style={{ background: '#FFFFFF' }}>
      <div className="w-full max-w-7xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-saas-text-heading font-semibold mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>
            Subscription Plans
          </h2>
          <p className="text-saas-text-heading-secondary" style={{ fontFamily: 'Inter, sans-serif' }}>
            Unlock AI-powered features and advanced job matching
          </p>
          {subscriptionStatus?.isPaid && (
            <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-[#22C55E]/20 text-[#22C55E] border border-[#22C55E]/30 rounded-lg">
              <CheckCircleIcon className="h-5 w-5" />
              <span className="font-semibold" style={{ fontFamily: 'Inter, sans-serif' }}>
                Active Subscription: {subscriptionStatus.plan?.charAt(0).toUpperCase() + subscriptionStatus.plan?.slice(1)}
              </span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans.map((plan) => (
            <Card
              key={plan.name}
              className={`p-6 flex flex-col h-full ${subscriptionStatus?.plan === plan.id ? 'border-2 border-primary-accent' : ''}`}
            >
              <h3 className="text-xl font-semibold mb-2 text-center text-saas-text-heading" style={{ fontFamily: 'Inter, sans-serif' }}>
                {plan.name}
              </h3>
              <p className="text-2xl font-bold mb-4 text-center text-primary-accent" style={{ fontFamily: 'Inter, sans-serif' }}>
                {plan.price}
              </p>
              <ul className="mb-6 space-y-2 flex-1">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className="flex items-center space-x-2" style={{ fontFamily: 'Inter, sans-serif' }}>
                    <CheckCircleIcon className="h-5 w-5 text-[#22C55E] flex-shrink-0" />
                    <span className="text-sm text-saas-text-heading">{feature}</span>
                  </li>
                ))}
              </ul>
              <Button
                variant={subscriptionStatus?.plan === plan.id ? "outline" : "primary"}
                className="w-full"
                onClick={() => handleSubscribe(plan.id)}
                disabled={loading !== null || (subscriptionStatus?.plan === plan.id)}
              >
                {loading === plan.id 
                  ? 'Processing...' 
                  : subscriptionStatus?.plan === plan.id 
                    ? 'Current Plan' 
                    : subscriptionStatus?.isPaid 
                      ? 'Upgrade Plan' 
                      : 'Pay Now'}
              </Button>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Subscription;

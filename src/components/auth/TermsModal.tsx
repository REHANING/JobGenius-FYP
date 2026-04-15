import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XMarkIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import Button from '../ui/Button';

interface TermsModalProps {
  isOpen: boolean;
  onAccept: () => void;
  onReject: () => void;
}

const TermsModal: React.FC<TermsModalProps> = ({ isOpen, onAccept, onReject }) => {
  const [hasScrolled, setHasScrolled] = useState(false);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement;
    const scrollPercentage = (target.scrollTop / (target.scrollHeight - target.clientHeight)) * 100;
    if (scrollPercentage > 80) {
      setHasScrolled(true);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={onReject}
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-4xl max-h-[90vh] glass-card overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-saas-border">
            <div className="flex items-center space-x-3">
              <ExclamationTriangleIcon className="h-6 w-6 text-saas-cyan" />
              <h2 className="text-2xl font-semibold text-saas-text-heading" style={{ fontFamily: 'Inter, sans-serif' }}>
                Terms & Conditions
              </h2>
            </div>
            <button
              onClick={onReject}
              className="p-2 hover:bg-saas-bg-secondary/20 rounded-lg transition-colors"
            >
              <XMarkIcon className="h-5 w-5 text-saas-text-heading-secondary" />
            </button>
          </div>

          {/* Content */}
          <div
            className="flex-1 overflow-y-auto p-6 space-y-6"
            onScroll={handleScroll}
          >
            <div className="prose prose-invert max-w-none text-saas-text-heading-secondary" style={{ fontFamily: 'Inter, sans-serif' }}>
              <p className="text-sm mb-4 text-saas-text-heading">
                Please read and understand the following terms before creating your account. By proceeding, you agree to comply with these terms.
              </p>

              <section>
                <h3 className="text-lg font-semibold text-saas-text-heading mb-3">1. Account Responsibilities</h3>
                <ul className="list-disc list-inside space-y-2 text-sm">
                  <li>You are responsible for maintaining the confidentiality of your account credentials.</li>
                  <li>You must provide accurate and truthful information during registration and profile setup.</li>
                  <li>You are responsible for all activities that occur under your account.</li>
                </ul>
              </section>

              <section>
                <h3 className="text-lg font-semibold text-saas-text-heading mb-3">2. Acceptable Use</h3>
                <ul className="list-disc list-inside space-y-2 text-sm">
                  <li>You agree not to use the platform for any illegal, fraudulent, or harmful purposes.</li>
                  <li>You will not post false, misleading, or deceptive information.</li>
                  <li>You will not harass, abuse, or harm other users.</li>
                  <li>You will not attempt to gain unauthorized access to the platform or other users' accounts.</li>
                </ul>
              </section>

              <section>
                <h3 className="text-lg font-semibold text-saas-text-heading mb-3">3. Account Termination</h3>
                <p className="text-sm mb-2">
                  Your account may be terminated, suspended, or warned if you violate these terms. Reasons for termination include but are not limited to:
                </p>
                <ul className="list-disc list-inside space-y-2 text-sm">
                  <li>Violation of platform policies or terms of service</li>
                  <li>Fraudulent or deceptive behavior</li>
                  <li>Harassment or abuse of other users</li>
                  <li>Posting inappropriate, offensive, or illegal content</li>
                  <li>Multiple warnings for policy violations</li>
                  <li>Any activity that harms the platform or its users</li>
                </ul>
              </section>

              <section>
                <h3 className="text-lg font-semibold text-saas-text-heading mb-3">4. Warnings and Suspensions</h3>
                <ul className="list-disc list-inside space-y-2 text-sm">
                  <li>Administrators may issue warnings for policy violations.</li>
                  <li>Repeated violations may result in account suspension or termination.</li>
                  <li>You will be notified of any warnings or actions taken on your account.</li>
                  <li>You have the right to appeal decisions, but the administrator's decision is final.</li>
                </ul>
              </section>

              <section>
                <h3 className="text-lg font-semibold text-saas-text-heading mb-3">5. Data and Privacy</h3>
                <ul className="list-disc list-inside space-y-2 text-sm">
                  <li>We collect and process your data in accordance with our Privacy Policy.</li>
                  <li>Your profile information may be visible to other users as appropriate.</li>
                  <li>You consent to the use of your data for platform functionality and improvements.</li>
                </ul>
              </section>

              <section>
                <h3 className="text-lg font-semibold text-saas-text-heading mb-3">6. Job Listings and Applications</h3>
                <ul className="list-disc list-inside space-y-2 text-sm">
                  <li>Recruiters must post accurate job listings and respond appropriately to applicants.</li>
                  <li>Job seekers must provide truthful information in applications.</li>
                  <li>The platform is not responsible for the outcome of job applications or hiring decisions.</li>
                </ul>
              </section>

              <section>
                <h3 className="text-lg font-semibold text-saas-text-heading mb-3">7. Intellectual Property</h3>
                <ul className="list-disc list-inside space-y-2 text-sm">
                  <li>You retain ownership of content you post, but grant the platform a license to use it.</li>
                  <li>You will not infringe on the intellectual property rights of others.</li>
                </ul>
              </section>

              <section>
                <h3 className="text-lg font-semibold text-saas-text-heading mb-3">8. Limitation of Liability</h3>
                <p className="text-sm">
                  The platform is provided "as is" without warranties. We are not liable for any damages arising from your use of the platform.
                </p>
              </section>

              <section>
                <h3 className="text-lg font-semibold text-saas-text-heading mb-3">9. Changes to Terms</h3>
                <p className="text-sm">
                  We reserve the right to modify these terms at any time. Continued use of the platform constitutes acceptance of modified terms.
                </p>
              </section>

              <div className="bg-saas-cyan/10 border border-saas-cyan/30 rounded-lg p-4 mt-6">
                <p className="text-sm text-saas-text-heading font-semibold mb-2">Important Notice:</p>
                <p className="text-sm text-saas-text-heading-secondary">
                  By clicking "I Accept", you acknowledge that you have read, understood, and agree to be bound by these Terms and Conditions. 
                  Failure to comply may result in warnings, suspension, or termination of your account without refund.
                </p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-saas-border bg-saas-bg-secondary/20">
            <div className="flex items-center justify-between gap-4">
              <Button
                variant="secondary"
                onClick={onReject}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={onAccept}
                className="flex-1"
                disabled={!hasScrolled}
              >
                I Accept & Continue
              </Button>
            </div>
            {!hasScrolled && (
              <p className="text-xs text-saas-text-heading-muted text-center mt-3">
                Please scroll to the bottom to enable the accept button
              </p>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default TermsModal;




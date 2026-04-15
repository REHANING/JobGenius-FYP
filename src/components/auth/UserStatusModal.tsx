import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XMarkIcon, ExclamationTriangleIcon, NoSymbolIcon, XCircleIcon } from '@heroicons/react/24/outline';
import Button from '../ui/Button';

interface UserStatusModalProps {
  isOpen: boolean;
  status: 'suspended' | 'terminated';
  warnings?: number;
  reason?: string;
  onClose: () => void;
}

const UserStatusModal: React.FC<UserStatusModalProps> = ({ isOpen, status, warnings, reason, onClose }) => {
  if (!isOpen) return null;

  const getStatusInfo = () => {
    if (status === 'suspended') {
      return {
        icon: NoSymbolIcon,
        title: 'Account Suspended',
        message: 'Your account has been suspended by an administrator.',
        color: 'yellow',
        bgColor: 'bg-yellow-500/20',
        borderColor: 'border-yellow-500/30',
        iconColor: 'text-yellow-400'
      };
    } else {
      return {
        icon: XCircleIcon,
        title: 'Account Terminated',
        message: 'Your account has been terminated by an administrator.',
        color: 'red',
        bgColor: 'bg-red-500/20',
        borderColor: 'border-red-500/30',
        iconColor: 'text-red-400'
      };
    }
  };

  const statusInfo = getStatusInfo();
  const Icon = statusInfo.icon;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-md glass-card overflow-hidden"
        >
          {/* Header */}
          <div className={`p-6 border-b ${statusInfo.borderColor}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className={`p-3 ${statusInfo.bgColor} border ${statusInfo.borderColor} rounded-lg`}>
                  <Icon className={`h-6 w-6 ${statusInfo.iconColor}`} />
                </div>
                <h2 className="text-2xl font-semibold text-saas-text-heading" style={{ fontFamily: 'Inter, sans-serif' }}>
                  {statusInfo.title}
                </h2>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-saas-bg-secondary/20 rounded-lg transition-colors"
              >
                <XMarkIcon className="h-5 w-5 text-saas-text-heading-secondary" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 space-y-4">
            <p className="text-saas-text-heading-secondary" style={{ fontFamily: 'Inter, sans-serif' }}>
              {statusInfo.message}
            </p>

            {warnings !== undefined && warnings > 0 && (
              <div className="glass-card-sm p-4 border border-yellow-500/30 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400" />
                  <span className="text-sm font-semibold text-saas-text-heading" style={{ fontFamily: 'Inter, sans-serif' }}>
                    Warnings: {warnings}
                  </span>
                </div>
                <p className="text-xs text-saas-text-heading-secondary" style={{ fontFamily: 'Inter, sans-serif' }}>
                  Your account received {warnings} warning{warnings > 1 ? 's' : ''} before this action was taken.
                </p>
              </div>
            )}

            {reason && (
              <div className="glass-card-sm p-4 border border-saas-border rounded-lg">
                <p className="text-xs font-semibold text-saas-text-heading mb-1" style={{ fontFamily: 'Inter, sans-serif' }}>
                  Reason:
                </p>
                <p className="text-sm text-saas-text-heading-secondary" style={{ fontFamily: 'Inter, sans-serif' }}>
                  {reason}
                </p>
              </div>
            )}

            <div className="glass-card-sm p-4 border border-saas-border rounded-lg bg-blue-500/10">
              <p className="text-sm text-saas-text-heading" style={{ fontFamily: 'Inter, sans-serif' }}>
                <strong>What can you do?</strong>
              </p>
              <p className="text-xs text-saas-text-heading-secondary mt-2" style={{ fontFamily: 'Inter, sans-serif' }}>
                If you believe this action was taken in error, please contact our support team for assistance.
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-saas-border bg-saas-bg-secondary/20">
            <Button
              variant="primary"
              onClick={onClose}
              className="w-full"
            >
              I Understand
            </Button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default UserStatusModal;




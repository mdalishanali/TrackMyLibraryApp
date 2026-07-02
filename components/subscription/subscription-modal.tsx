import React from 'react';
import { Modal } from 'react-native';
import { CustomPaywall } from '@/components/subscription/custom-paywall';
import type { PaywallReason } from '@/providers/subscription-provider';

interface SubscriptionModalProps {
  visible: boolean;
  isBlocked: boolean;
  reason?: PaywallReason;
  onClose: () => void;
  onPurchaseSuccess: () => void;
}

export const SubscriptionModal: React.FC<SubscriptionModalProps> = ({
  visible,
  isBlocked,
  reason,
  onClose,
  onPurchaseSuccess,
}) => {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={() => !isBlocked && onClose()}
    >
      <CustomPaywall
        isBlocked={isBlocked}
        reason={reason}
        onClose={onClose}
        onPurchaseSuccess={onPurchaseSuccess}
      />
    </Modal>
  );
};

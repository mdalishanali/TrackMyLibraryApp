import React from 'react';
import { Modal } from 'react-native';
import { CustomPaywall } from '@/components/subscription/custom-paywall';

interface SubscriptionModalProps {
  visible: boolean;
  isBlocked: boolean;
  onClose: () => void;
  onPurchaseSuccess: () => void;
}

export const SubscriptionModal: React.FC<SubscriptionModalProps> = ({
  visible,
  isBlocked,
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
        onClose={onClose}
        onPurchaseSuccess={onPurchaseSuccess}
      />
    </Modal>
  );
};

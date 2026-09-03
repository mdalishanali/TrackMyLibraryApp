import { useEffect, useRef, useState } from 'react';
import { Linking, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { AppButton } from '@/components/ui/app-button';
import { SUPPORT } from '@/constants/config';
import { radius, spacing, themeFor, typography } from '@/constants/design';
import { useColorScheme } from '@/hooks/use-color-scheme';
import type { LeaveReason } from '@/hooks/use-profile';

type Step = 'reason' | 'retain' | 'confirm';

type LeaveAction = { reason: LeaveReason; feedback?: string };

type Props = {
  visible: boolean;
  onClose: () => void;
  onDeactivate: (payload: LeaveAction) => Promise<void>;
  onDelete: (payload: LeaveAction) => Promise<void>;
  deactivating?: boolean;
  deleting?: boolean;
};

type ReasonOption = { key: LeaveReason; label: string; icon: keyof typeof Ionicons.glyphMap };

const REASON_OPTIONS: ReasonOption[] = [
  { key: 'too_expensive', label: 'Too expensive', icon: 'pricetag-outline' },
  { key: 'just_testing', label: 'Just testing / not ready yet', icon: 'flask-outline' },
  { key: 'missing_feature', label: 'Missing a feature I need', icon: 'extension-puzzle-outline' },
  { key: 'too_complicated', label: 'Too complicated to use', icon: 'help-circle-outline' },
  { key: 'found_another_app', label: 'Found another app', icon: 'swap-horizontal-outline' },
  { key: 'other', label: 'Something else', icon: 'ellipsis-horizontal-circle-outline' },
];

// Reasons where a quick chat is most likely to change the outcome.
const RETAINABLE_REASONS: LeaveReason[] = ['too_expensive', 'just_testing', 'too_complicated', 'missing_feature'];

const RETENTION_COPY: Partial<Record<LeaveReason, { title: string; body: string }>> = {
  too_expensive: {
    title: 'Let’s find a plan that works',
    body: 'Price shouldn’t be the reason you leave. Message us and we’ll sort out an option that fits you.',
  },
  just_testing: {
    title: 'No rush — keep exploring',
    body: 'You can pause your account instead of deleting it, and pick up right where you left off later.',
  },
  too_complicated: {
    title: 'We can walk you through it',
    body: 'Most things take a minute once someone shows you. Message us and we’ll get you set up.',
  },
  missing_feature: {
    title: 'Tell us what’s missing',
    body: 'We ship fast. Message us the feature you need — it might be closer than you think.',
  },
};

const DEFAULT_RETENTION = {
  title: 'Before you go',
  body: 'A quick chat with us might help. We read every message.',
};

// A deliberate pause before an irreversible delete. Long enough to break an
// impulse, short enough not to feel like a punishment.
const DELETE_COOLDOWN_SECONDS = 30;
const ONE_SECOND_MS = 1000;

/**
 * Counts down from DELETE_COOLDOWN_SECONDS whenever `active` turns true.
 * Returns seconds remaining; 0 means the delete action is unlocked.
 */
function useDeleteCooldown(active: boolean) {
  const [secondsLeft, setSecondsLeft] = useState(DELETE_COOLDOWN_SECONDS);
  const deadlineRef = useRef<number | null>(null);

  useEffect(() => {
    if (!active) {
      deadlineRef.current = null;
      setSecondsLeft(DELETE_COOLDOWN_SECONDS);
      return;
    }

    // Anchor to a wall-clock deadline so a backgrounded app doesn't freeze the
    // countdown and strand the user on a permanently locked button.
    deadlineRef.current = Date.now() + DELETE_COOLDOWN_SECONDS * ONE_SECOND_MS;

    const tick = () => {
      const remainingMs = (deadlineRef.current ?? 0) - Date.now();
      setSecondsLeft(Math.max(0, Math.ceil(remainingMs / ONE_SECOND_MS)));
    };

    tick();
    const interval = setInterval(tick, ONE_SECOND_MS);
    return () => clearInterval(interval);
  }, [active]);

  return secondsLeft;
}

export function LeaveAccountSheet({
  visible,
  onClose,
  onDeactivate,
  onDelete,
  deactivating,
  deleting,
}: Props) {
  const colorScheme = useColorScheme();
  const theme = themeFor(colorScheme);

  const [step, setStep] = useState<Step>('reason');
  const [reason, setReason] = useState<LeaveReason | null>(null);

  const busy = !!deactivating || !!deleting;

  // The cooldown runs only while the permanent-delete step is on screen.
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const cooldownLeft = useDeleteCooldown(confirmingDelete);
  const isDeleteUnlocked = cooldownLeft === 0;

  const reset = () => {
    setStep('reason');
    setReason(null);
    setConfirmingDelete(false);
  };

  const handleClose = () => {
    if (busy) return;
    reset();
    onClose();
  };

  const handlePickReason = (picked: LeaveReason) => {
    setReason(picked);
    setStep(RETAINABLE_REASONS.includes(picked) ? 'retain' : 'confirm');
  };

  const openWhatsApp = (context?: string) => {
    const message = context ?? 'Hi TrackMyLibrary, I was about to leave the app and wanted to talk first.';
    Linking.openURL(`https://wa.me/${SUPPORT.whatsappNumber}?text=${encodeURIComponent(message)}`);
  };

  const runDeactivate = async () => {
    if (!reason) return;
    await onDeactivate({ reason });
    reset();
  };

  const runDelete = async () => {
    if (!reason || !isDeleteUnlocked) return;
    await onDelete({ reason });
    reset();
  };

  const retention = (reason && RETENTION_COPY[reason]) || DEFAULT_RETENTION;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <View style={styles.backdrop}>
        <View style={[styles.sheet, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={styles.handle} />

          {step === 'reason' && (
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={[styles.title, { color: theme.text }]}>Before you go</Text>
              <Text style={[styles.subtitle, { color: theme.muted }]}>
                What’s making you leave? This helps us fix it for you and others.
              </Text>
              <View style={styles.optionList}>
                {REASON_OPTIONS.map((option) => (
                  <Pressable
                    key={option.key}
                    onPress={() => handlePickReason(option.key)}
                    style={({ pressed }) => [
                      styles.optionRow,
                      { borderColor: theme.border, backgroundColor: theme.surfaceAlt },
                      pressed && { opacity: 0.7 },
                    ]}>
                    <Ionicons name={option.icon} size={20} color={theme.muted} />
                    <Text style={[styles.optionLabel, { color: theme.text }]}>{option.label}</Text>
                    <Ionicons name="chevron-forward" size={18} color={theme.muted} />
                  </Pressable>
                ))}
              </View>
              <AppButton variant="ghost" onPress={handleClose} fullWidth>
                Never mind, stay
              </AppButton>
            </ScrollView>
          )}

          {step === 'retain' && (
            <View>
              <View style={[styles.iconBadge, { backgroundColor: theme.primary + '18' }]}>
                <Ionicons name="chatbubbles-outline" size={26} color={theme.primary} />
              </View>
              <Text style={[styles.title, { color: theme.text }]}>{retention.title}</Text>
              <Text style={[styles.subtitle, { color: theme.muted }]}>{retention.body}</Text>

              <View style={styles.actions}>
                <AppButton icon="logo-whatsapp" tone="success" onPress={() => openWhatsApp()} fullWidth>
                  Chat with us on WhatsApp
                </AppButton>
                <AppButton variant="ghost" onPress={handleClose} fullWidth>
                  Keep my account
                </AppButton>
                <Pressable onPress={() => setStep('confirm')} disabled={busy} style={styles.textLink}>
                  <Text style={[styles.textLinkLabel, { color: theme.muted }]}>
                    No thanks, continue leaving
                  </Text>
                </Pressable>
              </View>
            </View>
          )}

          {step === 'confirm' && (
            <View>
              <Text style={[styles.title, { color: theme.text }]}>Leave TrackMyLibrary</Text>
              <Text style={[styles.subtitle, { color: theme.muted }]}>
                Choose how you want to leave. Pausing is reversible — just log back in anytime.
              </Text>

              <View style={[styles.recommendCard, { borderColor: theme.success + '40', backgroundColor: theme.success + '10' }]}>
                <View style={styles.recommendHeader}>
                  <Ionicons name="pause-circle-outline" size={20} color={theme.success} />
                  <Text style={[styles.recommendTitle, { color: theme.text }]}>Pause my account</Text>
                  <View style={[styles.pill, { backgroundColor: theme.success }]}>
                    <Text style={styles.pillText}>Recommended</Text>
                  </View>
                </View>
                <Text style={[styles.recommendBody, { color: theme.muted }]}>
                  Your data is kept safe. Log in whenever you’re ready to continue.
                </Text>
                <AppButton
                  tone="success"
                  onPress={runDeactivate}
                  loading={deactivating}
                  disabled={busy}
                  fullWidth>
                  Pause account
                </AppButton>
              </View>

              {!confirmingDelete && (
                <Pressable
                  onPress={() => setConfirmingDelete(true)}
                  disabled={busy}
                  style={styles.deleteLink}>
                  <Text style={[styles.deleteLinkLabel, { color: theme.danger }]}>
                    Delete permanently instead
                  </Text>
                </Pressable>
              )}

              {confirmingDelete && (
                <View style={[styles.dangerCard, { borderColor: theme.danger + '40', backgroundColor: theme.danger + '0D' }]}>
                  <View style={styles.recommendHeader}>
                    <Ionicons name="warning-outline" size={20} color={theme.danger} />
                    <Text style={[styles.recommendTitle, { color: theme.text }]}>
                      This can’t be undone
                    </Text>
                  </View>

                  <Text style={[styles.recommendBody, { color: theme.muted }]}>
                    Deleting removes your students, seats, payment history and invoices for good.
                    We can’t bring any of it back.
                  </Text>

                  <AppButton
                    icon="logo-whatsapp"
                    tone="success"
                    onPress={() =>
                      openWhatsApp(
                        'Hi TrackMyLibrary, I’m about to delete my account. Can you help before I do?',
                      )
                    }
                    fullWidth>
                    Talk to us first
                  </AppButton>

                  <AppButton
                    variant="danger"
                    onPress={runDelete}
                    loading={deleting}
                    disabled={busy || !isDeleteUnlocked}
                    fullWidth>
                    {isDeleteUnlocked
                      ? 'Delete my account forever'
                      : `Delete my account (${cooldownLeft}s)`}
                  </AppButton>

                  {!isDeleteUnlocked && (
                    <Text style={[styles.cooldownHint, { color: theme.muted }]}>
                      Take a moment — this button unlocks in {cooldownLeft}s.
                    </Text>
                  )}
                </View>
              )}

              <AppButton variant="ghost" onPress={handleClose} disabled={busy} fullWidth>
                Cancel
              </AppButton>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    borderWidth: 1,
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
    maxHeight: '86%',
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(128,128,128,0.4)',
    marginBottom: spacing.md,
  },
  iconBadge: {
    alignSelf: 'center',
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  title: {
    fontSize: typography.size.xl,
    fontWeight: '700',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: typography.size.md,
    textAlign: 'center',
    marginTop: spacing.xs,
    marginBottom: spacing.md,
    lineHeight: 22,
  },
  optionList: {
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  optionLabel: {
    flex: 1,
    fontSize: typography.size.md,
    fontWeight: '600',
  },
  actions: {
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  textLink: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  textLinkLabel: {
    fontSize: typography.size.sm,
    fontWeight: '600',
  },
  recommendCard: {
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  recommendHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  recommendTitle: {
    flex: 1,
    fontSize: typography.size.md,
    fontWeight: '700',
  },
  pill: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.xs,
  },
  pillText: {
    color: '#fff',
    fontSize: typography.size.xs,
    fontWeight: '700',
  },
  recommendBody: {
    fontSize: typography.size.sm,
    lineHeight: 20,
  },
  dangerCard: {
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  cooldownHint: {
    fontSize: typography.size.sm,
    textAlign: 'center',
    lineHeight: 18,
  },
  deleteLink: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  deleteLinkLabel: {
    fontSize: typography.size.md,
    fontWeight: '600',
  },
});

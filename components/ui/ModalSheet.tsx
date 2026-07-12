import type { ReactNode } from 'react';
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors, fonts, layout, radius, spacing, typography } from '@/constants/theme';
import { useIsCompact } from '@/hooks/useIsCompact';

type Props = {
  visible: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
};

export function ModalSheet({ visible, title, onClose, children }: Props) {
  const compact = useIsCompact();
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={[styles.overlay, compact && styles.overlayCompact]}>
        <View style={[styles.sheet, compact && styles.sheetCompact]}>
          <View style={styles.header}>
            <Text style={[styles.title, compact && styles.titleCompact]} numberOfLines={2}>
              {title}
            </Text>
            <TouchableOpacity onPress={onClose} hitSlop={16} style={styles.closeBtn}>
              <Text style={styles.close}>×</Text>
            </TouchableOpacity>
          </View>
          <ScrollView
            style={styles.body}
            contentContainerStyle={styles.bodyContent}
            keyboardShouldPersistTaps="handled">
            {children}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  overlayCompact: {
    padding: spacing.xs,
    justifyContent: 'flex-end',
  },
  sheet: {
    width: '100%',
    maxWidth: 560,
    maxHeight: '85%',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.hairline,
    overflow: 'hidden',
  },
  sheetCompact: {
    maxWidth: '100%',
    maxHeight: '92%',
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.hairline,
    minHeight: layout.touchTarget + 8,
  },
  title: {
    fontFamily: fonts.sans,
    fontSize: typography.displaySm.fontSize,
    fontWeight: typography.displaySm.fontWeight,
    letterSpacing: typography.displaySm.letterSpacing,
    color: colors.ink,
    flex: 1,
  },
  titleCompact: {
    fontSize: typography.titleMd.fontSize,
    letterSpacing: 0,
  },
  closeBtn: {
    width: layout.touchTarget,
    height: layout.touchTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
  close: {
    fontSize: 28,
    color: colors.muted,
    lineHeight: 28,
  },
  body: { flexGrow: 0 },
  bodyContent: { padding: spacing.base, gap: spacing.base, paddingBottom: spacing.xl },
});

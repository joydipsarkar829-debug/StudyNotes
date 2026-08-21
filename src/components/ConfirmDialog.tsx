import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../theme';
import Modal from './Modal';
import Button from './Button';

interface ConfirmDialogProps {
  visible: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  variant?: 'danger' | 'warning';
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  visible,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  variant = 'danger',
}) => {
  const theme = useTheme();

  const accentColor = variant === 'danger' ? theme.colors.error : theme.colors.warning;
  const icon = variant === 'danger' ? 'alert-circle' : 'alert';

  return (
    <Modal visible={visible} onClose={onCancel} title="">
      <View style={styles.container}>
        <View
          style={[
            styles.iconContainer,
            { backgroundColor: accentColor + '15', borderRadius: theme.borderRadius.xl },
          ]}
        >
          <MaterialCommunityIcons name={icon as any} size={40} color={accentColor} />
        </View>

        <Text
          style={[
            styles.title,
            { color: theme.colors.text, fontSize: theme.fontSize.xl, fontWeight: theme.fontWeight.bold },
          ]}
        >
          {title}
        </Text>

        <Text
          style={[
            styles.message,
            { color: theme.colors.textSecondary, fontSize: theme.fontSize.md },
          ]}
        >
          {message}
        </Text>

        <View style={styles.actions}>
          <Button
            title={cancelText}
            onPress={onCancel}
            variant="outline"
            size="md"
            style={styles.cancelButton}
          />
          <Button
            title={confirmText}
            onPress={onConfirm}
            variant={variant === 'danger' ? 'danger' : 'primary'}
            size="md"
            style={styles.confirmButton}
          />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  iconContainer: {
    width: 72,
    height: 72,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    textAlign: 'center',
    marginBottom: 8,
  },
  message: {
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
  },
  confirmButton: {
    flex: 1,
  },
});

export default React.memo(ConfirmDialog);

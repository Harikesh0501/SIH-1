import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { THEME } from '../constants/theme';
import { useAuth } from '../context/AuthContext';

// Card Component
export const MonochromeCard: React.FC<{
  children: React.ReactNode;
  style?: ViewStyle;
  highlight?: boolean;
}> = ({ children, style, highlight = false }) => (
  <View
    style={[
      styles.card,
      highlight && styles.cardHighlight,
      style,
    ]}
  >
    {children}
  </View>
);

// Tactical Button Component
export const MonochromeButton: React.FC<{
  title: string;
  onPress: () => void;
  variant?: 'solid' | 'outline' | 'secondary' | 'amber';
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: React.ReactNode;
}> = ({ title, onPress, variant = 'solid', disabled = false, style, textStyle, icon }) => {
  const isSolid = variant === 'solid';
  const isOutline = variant === 'outline';
  const isSecondary = variant === 'secondary';
  const isAmber = variant === 'amber';

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      disabled={disabled}
      style={[
        styles.button,
        isSolid && styles.buttonSolid,
        isOutline && styles.buttonOutline,
        isSecondary && styles.buttonSecondary,
        isAmber && styles.buttonAmber,
        disabled && styles.buttonDisabled,
        style,
      ]}
    >
      <View style={styles.buttonInner}>
        {icon && <View style={{ marginRight: 8 }}>{icon}</View>}
        <Text
          style={[
            styles.buttonText,
            isSolid && styles.buttonTextSolid,
            isOutline && styles.buttonTextOutline,
            isSecondary && styles.buttonTextSecondary,
            isAmber && styles.buttonTextAmber,
            textStyle,
          ]}
        >
          {title}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

// Tactical Badge
export const MonochromeBadge: React.FC<{
  label: string;
  variant?: 'primary' | 'gold' | 'outline' | 'subtle' | 'green' | 'inverse';
  style?: ViewStyle;
}> = ({ label, variant = 'outline', style }) => (
  <View
    style={[
      styles.badge,
      (variant === 'primary' || variant === 'inverse') && styles.badgePrimary,
      variant === 'gold' && styles.badgeGold,
      variant === 'green' && styles.badgeGreen,
      variant === 'subtle' && styles.badgeSubtle,
      style,
    ]}
  >
    <Text
      style={[
        styles.badgeText,
        (variant === 'primary' || variant === 'inverse') && styles.badgeTextPrimary,
        variant === 'gold' && styles.badgeTextGold,
        variant === 'green' && styles.badgeTextGreen,
      ]}
    >
      {label}
    </Text>
  </View>
);

// 1-to-5 Step Selector
export const StepSelector: React.FC<{
  value: number;
  onChange: (val: number) => void;
  min?: number;
  max?: number;
  labels?: Record<number, string>;
}> = ({ value, onChange, min = 1, max = 5, labels }) => {
  const steps = [];
  for (let i = min; i <= max; i++) {
    steps.push(i);
  }

  return (
    <View style={styles.stepContainer}>
      <View style={styles.stepButtonsRow}>
        {steps.map((num) => {
          const isSelected = value === num;
          return (
            <TouchableOpacity
              key={num}
              activeOpacity={0.7}
              onPress={() => onChange(num)}
              style={[
                styles.stepButton,
                isSelected && styles.stepButtonSelected,
              ]}
            >
              <Text
                style={[
                  styles.stepButtonText,
                  isSelected && styles.stepButtonTextSelected,
                ]}
              >
                {num}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
      {labels && labels[value] && (
        <Text style={styles.stepCaption}>{labels[value]}</Text>
      )}
    </View>
  );
};

export const TacticalHeader: React.FC<{
  onPressSync?: () => void;
  pendingCount?: number;
  isTrenchMode?: boolean;
}> = ({ onPressSync, pendingCount = 0, isTrenchMode = false }) => {
  const { user, lang, setLanguage, logout } = useAuth();

  return (
    <View style={styles.header}>
      <View style={styles.headerLeft}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text style={styles.headerTitle}>RAKSHAK-AAYUSH</Text>
          <View style={styles.hologramTag}>
            <Text style={styles.hologramText}>104 BN</Text>
          </View>
        </View>
        <Text style={styles.headerSubtitle} numberOfLines={1}>
          {user ? `${user.rank} ${user.full_name}` : 'DEFENSE MEDICAL SUITE'}
        </Text>
      </View>

      <View style={styles.headerRight}>
        {/* Trench / Offline Sync Pill */}
        {onPressSync && (
          <TouchableOpacity
            activeOpacity={0.7}
            style={[
              styles.syncStatusPill,
              isTrenchMode && styles.syncStatusPillTrench,
              pendingCount > 0 && styles.syncStatusPillPending,
            ]}
            onPress={onPressSync}
          >
            <Ionicons
              name={isTrenchMode ? 'radio' : pendingCount > 0 ? 'cloud-upload' : 'cloud-done-outline'}
              size={12}
              color={isTrenchMode || pendingCount > 0 ? '#D97706' : '#16A34A'}
              style={{ marginRight: 4 }}
            />
            <Text
              style={[
                styles.syncStatusText,
                (isTrenchMode || pendingCount > 0) && styles.syncStatusTextWarning,
              ]}
            >
              {pendingCount > 0 ? `SYNC (${pendingCount})` : 'SYNC'}
            </Text>
          </TouchableOpacity>
        )}

        {/* Language Toggle */}
        <TouchableOpacity
          style={styles.langButton}
          onPress={() => setLanguage(lang === 'hi' ? 'en' : 'hi')}
        >
          <Text style={styles.langButtonText}>{lang === 'hi' ? 'ENG' : 'हिंदी'}</Text>
        </TouchableOpacity>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutButton} onPress={logout}>
          <Ionicons name="log-out-outline" size={13} color="#64748B" style={{ marginRight: 3 }} />
          <Text style={styles.logoutText}>EXIT</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    borderWidth: 1,
    borderRadius: THEME.radius.md,
    padding: THEME.spacing.lg,
    marginBottom: THEME.spacing.md,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  cardHighlight: {
    borderColor: '#0F172A',
    backgroundColor: '#FFFFFF',
  },
  button: {
    borderRadius: THEME.radius.sm,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonSolid: {
    backgroundColor: '#0F172A',
  },
  buttonOutline: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#0F172A',
  },
  buttonSecondary: {
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  buttonAmber: {
    backgroundColor: '#D97706',
  },
  buttonDisabled: {
    opacity: 0.45,
  },
  buttonText: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  buttonTextSolid: {
    color: '#FFFFFF',
  },
  buttonTextOutline: {
    color: '#0F172A',
  },
  buttonTextSecondary: {
    color: '#0F172A',
  },
  buttonTextAmber: {
    color: '#FFFFFF',
  },
  badge: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  badgePrimary: {
    backgroundColor: '#0F172A',
    borderColor: '#0F172A',
  },
  badgeGold: {
    backgroundColor: '#FEF3C7',
    borderColor: '#FDE68A',
  },
  badgeGreen: {
    backgroundColor: '#DCFCE7',
    borderColor: '#86EFAC',
  },
  badgeSubtle: {
    backgroundColor: '#F1F5F9',
    borderColor: '#E2E8F0',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#334155',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  badgeTextPrimary: {
    color: '#FFFFFF',
  },
  badgeTextGold: {
    color: '#92400E',
  },
  badgeTextGreen: {
    color: '#166534',
  },
  stepContainer: {
    marginVertical: THEME.spacing.sm,
  },
  stepButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 6,
  },
  stepButton: {
    flex: 1,
    height: 44,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: THEME.radius.sm,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepButtonSelected: {
    backgroundColor: '#0F172A',
    borderColor: '#0F172A',
  },
  stepButtonText: {
    color: '#475569',
    fontSize: 15,
    fontWeight: '700',
  },
  stepButtonTextSelected: {
    color: '#FFFFFF',
    fontWeight: '900',
  },
  stepCaption: {
    marginTop: 6,
    fontSize: 11,
    color: '#64748B',
    fontStyle: 'italic',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  headerLeft: {
    flex: 1,
    paddingRight: 10,
  },
  hologramTag: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
  },
  hologramText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#92400E',
    letterSpacing: 0.5,
  },
  headerTitle: {
    color: '#0F172A',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  langButton: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 6,
  },
  langButtonText: {
    color: '#0F172A',
    fontSize: 10,
    fontWeight: '800',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 6,
  },
  logoutText: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: '800',
  },
  syncStatusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 6,
  },
  syncStatusPillTrench: {
    borderColor: '#FDE68A',
    backgroundColor: '#FFFBEB',
  },
  syncStatusPillPending: {
    borderColor: '#FDE68A',
    backgroundColor: '#FEF3C7',
  },
  syncStatusText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#166534',
    letterSpacing: 0.3,
  },
  syncStatusTextWarning: {
    color: '#92400E',
  },
});

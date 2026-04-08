import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/hooks/useAuth';
import { useUser } from '@/contexts/UserContext';
import { Toast } from 'toastify-react-native';
import { AppText } from '@/components/ui/AppText';
import { Avatar } from '@/components/ui/Avatar';
import { BorderRadius, Shadow, Spacing } from '@/constants/Spacing';
import { FontSize, FontWeight } from '@/constants/Typography';

const DRAWER_WIDTH = Dimensions.get('window').width * 0.78;

type IconName = React.ComponentProps<typeof Ionicons>['name'];

interface NavItem {
  key: string;
  label: string;
  icon: IconName;
  route: string;
  requireAuth?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { key: 'home', label: 'Accueil', icon: 'home-outline', route: '/(app)/' },
  { key: 'resources', label: 'Ressources', icon: 'book-outline', route: '/(app)/resources' },
  {
    key: 'profile',
    label: 'Mon profil',
    icon: 'person-outline',
    route: '/(app)/profile',
    requireAuth: true,
  },
  {
    key: 'settings',
    label: 'Paramètres',
    icon: 'settings-outline',
    route: '/(app)/settings',
  },
];

interface DrawerMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DrawerMenu({ isOpen, onClose }: DrawerMenuProps) {
  const { colors } = useTheme();
  const { logout, isAuthenticated } = useAuth();
  const { user } = useUser();
  const insets = useSafeAreaInsets();
  const [visible, setVisible] = useState(false);

  const translateX = useRef(new Animated.Value(-DRAWER_WIDTH)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isOpen) {
      setVisible(true);
      Animated.parallel([
        Animated.timing(translateX, { toValue: 0, duration: 280, useNativeDriver: true }),
        Animated.timing(backdropOpacity, { toValue: 1, duration: 280, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(translateX, {
          toValue: -DRAWER_WIDTH,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, { toValue: 0, duration: 250, useNativeDriver: true }),
      ]).start(() => setVisible(false));
    }
  }, [isOpen, translateX, backdropOpacity]);

  if (!visible) return null;

  const handleNav = (item: NavItem) => {
    onClose();
    const target =
      item.requireAuth && !isAuthenticated ? '/(auth)/login' : item.route;
    router.push(target as Parameters<typeof router.push>[0]);
  };

  const handleLogout = async () => {
    onClose();
    await logout();
    Toast.success('Vous avez été déconnecté.');
  };

  const handleLogin = () => {
    onClose();
    router.push('/(auth)/login');
  };

  return (
    <>
      {/* Backdrop */}
      <Animated.View
        style={[styles.backdrop, { opacity: backdropOpacity }]}
        pointerEvents={isOpen ? 'auto' : 'none'}
      >
        <Pressable style={StyleSheet.absoluteFillObject} onPress={onClose} />
      </Animated.View>

      {/* Panel */}
      <Animated.View
        style={[
          styles.drawer,
          {
            transform: [{ translateX }],
            backgroundColor: colors.surface,
            paddingTop: insets.top,
            paddingBottom: insets.bottom + Spacing.sm,
            ...Shadow.lg,
          },
        ]}
      >
        {/* Header */}
        <View style={[styles.drawerHeader, { borderBottomColor: colors.divider }]}>
          <View style={[styles.logoMark, { backgroundColor: colors.primary }]}>
            <AppText
              style={{
                color: colors.textOnPrimary,
                fontWeight: FontWeight.bold,
                fontSize: FontSize.lg,
              }}
            >
              RL
            </AppText>
          </View>

          <View style={{ flex: 1 }}>
            {isAuthenticated && user ? (
              <>
                <AppText variant="label" numberOfLines={1}>
                  {user.first_name} {user.last_name}
                </AppText>
                <AppText variant="caption" muted numberOfLines={1}>
                  {user.email}
                </AppText>
              </>
            ) : (
              <>
                <AppText variant="label">Invité</AppText>
                <AppText variant="caption" muted numberOfLines={2}>
                  Connectez-vous pour accéder à toutes les fonctionnalités
                </AppText>
              </>
            )}
          </View>

          <Pressable onPress={onClose} style={styles.iconButton} hitSlop={8}>
            <Ionicons name="close" size={24} color={colors.textMuted} />
          </Pressable>
        </View>

        {/* Navigation */}
        <View style={styles.navList}>
          {NAV_ITEMS.map((item) => (
            <Pressable
              key={item.key}
              style={({ pressed }) => [
                styles.navItem,
                { borderRadius: BorderRadius.sm },
                pressed && { backgroundColor: colors.primaryLight },
              ]}
              onPress={() => handleNav(item)}
            >
              <Ionicons name={item.icon} size={22} color={colors.primary} />
              <AppText
                variant="body"
                style={{ color: colors.text, fontWeight: FontWeight.medium }}
              >
                {item.label}
              </AppText>
              {item.requireAuth && !isAuthenticated && (
                <Ionicons
                  name="lock-closed-outline"
                  size={14}
                  color={colors.textLight}
                  style={{ marginLeft: 'auto' }}
                />
              )}
            </Pressable>
          ))}
        </View>

        {/* Footer */}
        <View style={[styles.drawerFooter, { borderTopColor: colors.divider }]}>
          {isAuthenticated ? (
            <Pressable
              style={({ pressed }) => [
                styles.navItem,
                { borderRadius: BorderRadius.sm },
                pressed && { backgroundColor: colors.errorLight },
              ]}
              onPress={handleLogout}
            >
              <Ionicons name="log-out-outline" size={22} color={colors.error} />
              <AppText
                variant="body"
                style={{ color: colors.error, fontWeight: FontWeight.medium }}
              >
                Se déconnecter
              </AppText>
            </Pressable>
          ) : (
            <Pressable
              style={({ pressed }) => [
                styles.navItem,
                { borderRadius: BorderRadius.sm },
                pressed && { backgroundColor: colors.primaryLight },
              ]}
              onPress={handleLogin}
            >
              <Ionicons name="log-in-outline" size={22} color={colors.primary} />
              <AppText
                variant="body"
                style={{ color: colors.primary, fontWeight: FontWeight.medium }}
              >
                Se connecter
              </AppText>
            </Pressable>
          )}
        </View>
      </Animated.View>
    </>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    zIndex: 10,
  },
  drawer: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: DRAWER_WIDTH,
    zIndex: 20,
  },
  drawerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderBottomWidth: 1,
    gap: Spacing.sm,
  },
  logoMark: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconButton: {
    padding: Spacing.xs,
  },
  navList: {
    flex: 1,
    paddingHorizontal: Spacing.sm,
    paddingTop: Spacing.md,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm + 2,
    paddingHorizontal: Spacing.md,
    gap: Spacing.md,
    marginBottom: Spacing.xs,
  },
  drawerFooter: {
    paddingHorizontal: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
  },
});

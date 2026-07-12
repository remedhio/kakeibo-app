import React from 'react';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Link, Redirect, Tabs } from 'expo-router';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { LoadingState } from '@/components/ui';
import { colors, fonts, spacing } from '@/constants/theme';
import { useClientOnlyValue } from '@/components/useClientOnlyValue';
import { useAuth } from '@/providers/AuthProvider';

const TAB_META: Record<
  string,
  { label: string; icon: React.ComponentProps<typeof FontAwesome>['name'] }
> = {
  index: { label: 'ホーム', icon: 'home' },
  add: { label: '追加', icon: 'plus-circle' },
  entries: { label: '収支', icon: 'money' },
  categories: { label: 'カテゴリ', icon: 'list' },
};

function AppTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const bottomPad = Math.max(insets.bottom, Platform.OS === 'web' ? 16 : 8);

  return (
    <View style={[styles.bar, { paddingBottom: bottomPad }]}>
      {state.routes.map((route, index) => {
        const focused = state.index === index;
        const { options } = descriptors[route.key];
        const meta = TAB_META[route.name] ?? {
          label: options.title ?? route.name,
          icon: 'circle' as const,
        };
        const color = focused ? colors.primary : colors.tabInactive;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });
          if (!focused && !event.defaultPrevented) {
            navigation.navigate(route.name, route.params);
          }
        };

        return (
          <Pressable
            key={route.key}
            accessibilityRole="button"
            accessibilityState={focused ? { selected: true } : {}}
            accessibilityLabel={meta.label}
            onPress={onPress}
            style={styles.item}>
            <FontAwesome name={meta.icon} size={22} color={color} />
            <Text style={[styles.label, { color }]}>{meta.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export default function TabLayout() {
  const { session, loading } = useAuth();
  const headerShown = useClientOnlyValue(false, true);

  if (loading) {
    return <LoadingState message="認証を確認中..." />;
  }

  if (!session) {
    return <Redirect href="/sign-in" />;
  }

  return (
    <Tabs
      initialRouteName="add"
      tabBar={(props) => <AppTabBar {...props} />}
      screenOptions={{
        headerShown,
        headerTintColor: colors.ink,
        headerStyle: { backgroundColor: colors.canvas },
        headerShadowVisible: false,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'ホーム',
          headerTitle: 'ダッシュボード',
          headerRight: () => (
            <Link href="/modal" asChild>
              <Pressable>
                {({ pressed }) => (
                  <FontAwesome
                    name="info-circle"
                    size={20}
                    color={colors.ink}
                    style={{ marginRight: 16, opacity: pressed ? 0.5 : 1 }}
                  />
                )}
              </Pressable>
            </Link>
          ),
        }}
      />
      <Tabs.Screen name="add" options={{ title: '追加' }} />
      <Tabs.Screen name="entries" options={{ title: '収支' }} />
      <Tabs.Screen name="categories" options={{ title: 'カテゴリ' }} />
    </Tabs>
  );
}

export const unstable_settings = {
  initialRouteName: 'add',
};

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    backgroundColor: colors.canvas,
    borderTopWidth: 1,
    borderTopColor: colors.hairline,
    paddingTop: spacing.xs,
  },
  item: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    minHeight: 52,
    paddingVertical: 6,
  },
  label: {
    fontFamily: fonts.sans,
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
});

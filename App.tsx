import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import { ActivityIndicator, Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';

import { CaptureScreen } from './src/screens/CaptureScreen';
import { InboxScreen } from './src/screens/InboxScreen';
import { PartnerScreen } from './src/screens/PartnerScreen';
import { TodayScreen } from './src/screens/TodayScreen';
import { YouScreen } from './src/screens/YouScreen';
import { AppProvider, useApp } from './src/store/AppContext';
import { colors, spacing } from './src/theme';

type Tab = 'capture' | 'today' | 'inbox' | 'partner' | 'you';

const TABS: { key: Tab; label: string; icon: string }[] = [
  { key: 'capture', label: 'Capture', icon: '✎' },
  { key: 'today', label: 'Today', icon: '◷' },
  { key: 'inbox', label: 'Inbox', icon: '❖' },
  { key: 'partner', label: 'Partner', icon: '✺' },
  { key: 'you', label: 'You', icon: '☺' },
];

function Root() {
  const { ready } = useApp();
  const [tab, setTab] = useState<Tab>('capture');

  if (!ready) {
    return (
      <View style={[styles.flex, styles.center]}>
        <ActivityIndicator color={colors.accent} size="large" />
      </View>
    );
  }

  return (
    <View style={styles.flex}>
      <View style={styles.flex}>
        {tab === 'capture' ? <CaptureScreen /> : null}
        {tab === 'today' ? <TodayScreen /> : null}
        {tab === 'inbox' ? <InboxScreen /> : null}
        {tab === 'partner' ? <PartnerScreen /> : null}
        {tab === 'you' ? <YouScreen /> : null}
      </View>

      <View style={styles.tabBar}>
        {TABS.map((t) => {
          const active = tab === t.key;
          return (
            <Pressable key={t.key} style={styles.tab} onPress={() => setTab(t.key)}>
              <Text style={[styles.tabIcon, active && styles.tabActive]}>{t.icon}</Text>
              <Text style={[styles.tabLabel, active && styles.tabActive]}>{t.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export default function App() {
  return (
    <AppProvider>
      <SafeAreaView style={styles.safe}>
        <StatusBar style="dark" />
        <Root />
      </SafeAreaView>
    </AppProvider>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  flex: { flex: 1, backgroundColor: colors.bg },
  center: { alignItems: 'center', justifyContent: 'center' },
  tabBar: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
    paddingTop: spacing.sm,
    paddingBottom: spacing.lg,
  },
  tab: { flex: 1, alignItems: 'center', gap: 3 },
  tabIcon: { fontSize: 18, color: colors.textFaint },
  tabLabel: { color: colors.textFaint, fontSize: 9.5, fontWeight: '800', letterSpacing: 0.8, textTransform: 'uppercase' },
  tabActive: { color: colors.text },
});

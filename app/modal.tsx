import { StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Screen } from '@/components/ui';
import { colors, fonts, spacing, typography } from '@/constants/theme';

export default function ModalScreen() {
  return (
    <Screen>
      <View style={styles.content}>
        <Text style={styles.title}>使い方</Text>
        <Text style={styles.body}>
          このアプリは家計の収入・支出を記録し、月ごとのバランスを把握するためのものです。
        </Text>
        <View style={styles.section}>
          <Text style={styles.heading}>1. 追加</Text>
          <Text style={styles.body}>
            収入または支出を選び、カテゴリと金額を入力して保存します。固定費は期間を指定すると各月に一括登録できます。
          </Text>
        </View>
        <View style={styles.section}>
          <Text style={styles.heading}>2. ダッシュボード</Text>
          <Text style={styles.body}>カレンダーと月次サマリーで、日ごとの収支を確認できます。</Text>
        </View>
        <View style={styles.section}>
          <Text style={styles.heading}>3. 収支</Text>
          <Text style={styles.body}>一覧の編集・削除、カテゴリ別集計、月次グラフを確認できます。</Text>
        </View>
        <View style={styles.section}>
          <Text style={styles.heading}>4. カテゴリ</Text>
          <Text style={styles.body}>
            子カテゴリの追加・並び替えができます。親カテゴリ（固定費など）は編集できません。
          </Text>
        </View>
      </View>
      <StatusBar style="dark" />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { gap: spacing.base, paddingTop: spacing.xs },
  title: {
    fontFamily: fonts.sans,
    fontSize: typography.displayMd.fontSize,
    fontWeight: typography.displayMd.fontWeight,
    letterSpacing: typography.displayMd.letterSpacing,
    color: colors.ink,
  },
  heading: {
    fontFamily: fonts.sans,
    fontSize: typography.titleMd.fontSize,
    fontWeight: typography.titleMd.fontWeight,
    color: colors.ink,
    marginBottom: spacing.xxs,
  },
  body: {
    fontFamily: fonts.sans,
    fontSize: typography.bodyMd.fontSize,
    color: colors.body,
    lineHeight: 24,
  },
  section: { gap: 2, marginTop: spacing.xs },
});

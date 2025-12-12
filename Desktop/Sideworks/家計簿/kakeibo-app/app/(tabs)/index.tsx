import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, Alert, TextInput } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Platform } from 'react-native';

import { Text, View } from '@/components/Themed';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/providers/AuthProvider';

type Entry = {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  happened_on: string;
  note?: string | null;
  categories?: { name: string } | null;
};

type CategorySummary = {
  category_id: string | null;
  category_name: string | null;
  type: 'income' | 'expense';
  total: number;
};

type DailySummary = {
  date: string;
  income: number;
  expense: number;
};

export default function DashboardScreen() {
  const { session, signOut } = useAuth();
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [viewMode, setViewMode] = useState<'summary' | 'calendar' | 'category'>('summary');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  const year = selectedMonth.getFullYear();
  const month = selectedMonth.getMonth() + 1;
  const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
  const endDate = `${year}-${String(month).padStart(2, '0')}-${new Date(year, month, 0).getDate()}`;

  const { data: entries = [], isLoading } = useQuery<Entry[]>({
    queryKey: ['entries', 'dashboard', year, month],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('entries')
        .select('id, type, amount, happened_on, note, categories(name)')
        .gte('happened_on', startDate)
        .lte('happened_on', endDate)
        .order('happened_on', { ascending: false });
      if (error) throw error;
      return (data ?? []).map((entry: any) => ({
        ...entry,
        categories: Array.isArray(entry.categories) && entry.categories.length > 0
          ? entry.categories[0]
          : entry.categories,
      })) as Entry[];
    },
    enabled: !!session,
  });

  const monthlySummary = useMemo(() => {
    const income = entries.filter((e) => e.type === 'income').reduce((sum, e) => sum + e.amount, 0);
    const expense = entries.filter((e) => e.type === 'expense').reduce((sum, e) => sum + e.amount, 0);
    return { income, expense, balance: income - expense };
  }, [entries]);

  const categorySummary = useMemo<CategorySummary[]>(() => {
    const map = new Map<string, { name: string | null; type: 'income' | 'expense'; total: number }>();
    entries.forEach((entry) => {
      const key = entry.categories?.name || '未分類';
      const existing = map.get(key) || { name: key, type: entry.type, total: 0 };
      existing.total += entry.amount;
      map.set(key, existing);
    });
    return Array.from(map.entries())
      .map(([_, value]) => ({
        category_id: null,
        category_name: value.name,
        type: value.type,
        total: value.total,
      }))
      .sort((a, b) => b.total - a.total);
  }, [entries]);

  const dailySummary = useMemo<DailySummary[]>(() => {
    const map = new Map<string, { income: number; expense: number }>();
    entries.forEach((entry) => {
      const date = entry.happened_on;
      const existing = map.get(date) || { income: 0, expense: 0 };
      if (entry.type === 'income') {
        existing.income += entry.amount;
      } else {
        existing.expense += entry.amount;
      }
      map.set(date, existing);
    });
    return Array.from(map.entries())
      .map(([date, values]) => ({ date, ...values }))
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [entries]);

  const calendarDays = useMemo(() => {
    const daysInMonth = new Date(year, month, 0).getDate();
    const firstDay = new Date(year, month - 1, 1).getDay();
    const days: Array<{ date: number; fullDate: string; income: number; expense: number } | null> = [];

    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const fullDate = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const dayData = dailySummary.find((d) => d.date === fullDate);
      days.push({
        date: day,
        fullDate,
        income: dayData?.income || 0,
        expense: dayData?.expense || 0,
      });
    }

    return days;
  }, [year, month, dailySummary]);

  const formatCurrency = (amount: number) => {
    return `¥${amount.toLocaleString()}`;
  };

  const formatMonth = (date: Date) => {
    return `${date.getFullYear()}年${date.getMonth() + 1}月`;
  };

  const changeMonth = (delta: number) => {
    const newDate = new Date(selectedMonth);
    newDate.setMonth(newDate.getMonth() + delta);
    setSelectedMonth(newDate);
  };

  const toggleCategory = (categoryName: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryName)) {
      newExpanded.delete(categoryName);
    } else {
      newExpanded.add(categoryName);
    }
    setExpandedCategories(newExpanded);
  };

  const getCategoryEntries = (categoryName: string | null) => {
    return entries.filter((entry) => {
      const entryCategoryName = entry.categories?.name || '未分類';
      return entryCategoryName === categoryName;
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>ダッシュボード</Text>
        <TouchableOpacity onPress={signOut} style={styles.signOut}>
          <Text style={styles.signOutText}>ログアウト</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.monthSelector}>
        <TouchableOpacity onPress={() => changeMonth(-1)} style={styles.monthButton}>
          <Text style={styles.monthButtonText}>‹</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setShowMonthPicker(true)} style={styles.monthLabel}>
          <Text style={styles.monthLabelText}>{formatMonth(selectedMonth)}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => changeMonth(1)} style={styles.monthButton}>
          <Text style={styles.monthButtonText}>›</Text>
        </TouchableOpacity>
      </View>

      {showMonthPicker && (
        <>
          {Platform.OS === 'web' ? (
            <View style={styles.monthPickerWeb}>
              <TextInput
                {...({ type: 'month' } as any)}
                value={`${selectedMonth.getFullYear()}-${String(selectedMonth.getMonth() + 1).padStart(2, '0')}`}
                onChangeText={(text) => {
                  if (text) {
                    const [year, month] = text.split('-');
                    setSelectedMonth(new Date(parseInt(year), parseInt(month) - 1));
                    setShowMonthPicker(false);
                  }
                }}
                style={styles.monthInputWeb}
              />
            </View>
          ) : (
            <DateTimePicker
              value={selectedMonth}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={(event, date) => {
                setShowMonthPicker(Platform.OS === 'ios');
                if (date) setSelectedMonth(date);
              }}
            />
          )}
        </>
      )}

      <View style={styles.summary}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>収入</Text>
          <Text style={[styles.summaryAmount, styles.incomeAmount]}>{formatCurrency(monthlySummary.income)}</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>支出</Text>
          <Text style={[styles.summaryAmount, styles.expenseAmount]}>{formatCurrency(monthlySummary.expense)}</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>差額</Text>
          <Text
            style={[
              styles.summaryAmount,
              monthlySummary.balance >= 0 ? styles.incomeAmount : styles.expenseAmount,
            ]}>
            {formatCurrency(monthlySummary.balance)}
          </Text>
        </View>
      </View>

      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, viewMode === 'summary' && styles.tabActive]}
          onPress={() => setViewMode('summary')}>
          <Text style={[styles.tabText, viewMode === 'summary' && styles.tabTextActive]}>サマリー</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, viewMode === 'calendar' && styles.tabActive]}
          onPress={() => setViewMode('calendar')}>
          <Text style={[styles.tabText, viewMode === 'calendar' && styles.tabTextActive]}>カレンダー</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, viewMode === 'category' && styles.tabActive]}
          onPress={() => setViewMode('category')}>
          <Text style={[styles.tabText, viewMode === 'category' && styles.tabTextActive]}>カテゴリ別</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {isLoading ? (
          <View style={styles.empty}>
            <Text>読み込み中...</Text>
          </View>
        ) : viewMode === 'summary' ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>日別サマリー</Text>
            {dailySummary.length === 0 ? (
              <Text style={styles.emptyText}>データがありません</Text>
            ) : (
              dailySummary.map((day) => (
                <View key={day.date} style={styles.dailyItem}>
                  <Text style={styles.dailyDate}>{day.date}</Text>
                  <View style={styles.dailyAmounts}>
                    <Text style={[styles.dailyAmount, styles.incomeAmount]}>
                      +{formatCurrency(day.income)}
                    </Text>
                    <Text style={[styles.dailyAmount, styles.expenseAmount]}>
                      -{formatCurrency(day.expense)}
                    </Text>
                    <Text
                      style={[
                        styles.dailyBalance,
                        day.income - day.expense >= 0 ? styles.incomeAmount : styles.expenseAmount,
                      ]}>
                      {formatCurrency(day.income - day.expense)}
                    </Text>
                  </View>
                </View>
              ))
            )}
          </View>
        ) : viewMode === 'calendar' ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>カレンダー表示</Text>
            <View style={styles.calendar}>
              <View style={styles.calendarHeader}>
                {['日', '月', '火', '水', '木', '金', '土'].map((day) => (
                  <View key={day} style={styles.calendarHeaderDay}>
                    <Text style={styles.calendarHeaderText}>{day}</Text>
                  </View>
                ))}
              </View>
              <View style={styles.calendarGrid}>
                {calendarDays.map((day, index) => (
                  <View key={index} style={styles.calendarDay}>
                    {day ? (
                      <>
                        <Text style={styles.calendarDayNumber}>{day.date}</Text>
                        {day.income > 0 && (
                          <Text style={[styles.calendarDayAmount, styles.incomeAmount]}>
                            +{formatCurrency(day.income)}
                          </Text>
                        )}
                        {day.expense > 0 && (
                          <Text style={[styles.calendarDayAmount, styles.expenseAmount]}>
                            -{formatCurrency(day.expense)}
                          </Text>
                        )}
                        {day.income === 0 && day.expense === 0 && (
                          <Text style={styles.calendarDayEmpty}>-</Text>
                        )}
                      </>
                    ) : (
                      <View />
                    )}
                  </View>
                ))}
              </View>
            </View>
          </View>
        ) : (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>カテゴリ別集計</Text>
            {categorySummary.length === 0 ? (
              <Text style={styles.emptyText}>データがありません</Text>
            ) : (
              categorySummary.map((cat, index) => {
                const isExpanded = expandedCategories.has(cat.category_name || '');
                const categoryEntries = getCategoryEntries(cat.category_name);
                return (
                  <View key={index} style={styles.categoryContainer}>
                    <TouchableOpacity
                      style={styles.categoryItem}
                      onPress={() => toggleCategory(cat.category_name || '')}>
                      <View style={styles.categoryItemLeft}>
                        <Text style={styles.toggleIcon}>{isExpanded ? '▼' : '▶'}</Text>
                        <Text style={styles.categoryName}>{cat.category_name}</Text>
                      </View>
                      <View style={styles.categoryItemRight}>
                        <Text style={styles.categoryType}>{cat.type === 'income' ? '収入' : '支出'}</Text>
                        <Text
                          style={[
                            styles.categoryAmount,
                            cat.type === 'income' ? styles.incomeAmount : styles.expenseAmount,
                          ]}>
                          {formatCurrency(cat.total)}
                        </Text>
                      </View>
                    </TouchableOpacity>
                    {isExpanded && categoryEntries.length > 0 && (
                      <View style={styles.categoryDetails}>
                        {categoryEntries.map((entry) => (
                          <View key={entry.id} style={styles.categoryDetailItem}>
                            <View style={styles.categoryDetailLeft}>
                              <Text style={styles.categoryDetailDate}>{entry.happened_on}</Text>
                              {entry.note && <Text style={styles.categoryDetailNote}>{entry.note}</Text>}
                            </View>
                            <Text
                              style={[
                                styles.categoryDetailAmount,
                                entry.type === 'income' ? styles.incomeAmount : styles.expenseAmount,
                              ]}>
                              {entry.type === 'income' ? '+' : '-'}
                              {formatCurrency(entry.amount)}
                            </Text>
                          </View>
                        ))}
                      </View>
                    )}
                  </View>
                );
              })
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
  },
  signOut: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#eee',
    borderRadius: 8,
  },
  signOutText: {
    fontWeight: '600',
    fontSize: 12,
  },
  monthSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    gap: 12,
  },
  monthButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
  },
  monthButtonText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#2f95dc',
  },
  monthLabel: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  monthLabelText: {
    fontSize: 18,
    fontWeight: '600',
  },
  summary: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
    gap: 8,
  },
  summaryCard: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    gap: 4,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#666',
  },
  summaryAmount: {
    fontSize: 18,
    fontWeight: '700',
  },
  incomeAmount: {
    color: '#2e7d32',
  },
  expenseAmount: {
    color: '#c62828',
  },
  tabs: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  tabActive: {
    backgroundColor: '#2f95dc',
    borderColor: '#2f95dc',
  },
  tabText: {
    fontSize: 14,
    color: '#333',
  },
  tabTextActive: {
    color: 'white',
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  empty: {
    alignItems: 'center',
    padding: 24,
  },
  emptyText: {
    color: '#999',
    textAlign: 'center',
    padding: 24,
  },
  dailyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 10,
    marginBottom: 8,
  },
  dailyDate: {
    fontSize: 16,
    fontWeight: '600',
  },
  dailyAmounts: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  dailyAmount: {
    fontSize: 14,
    fontWeight: '600',
  },
  dailyBalance: {
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 8,
  },
  calendar: {
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 12,
    overflow: 'hidden',
  },
  calendarHeader: {
    flexDirection: 'row',
    backgroundColor: '#f5f5f5',
  },
  calendarHeaderDay: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
  },
  calendarHeaderText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calendarDay: {
    width: '14.28%',
    aspectRatio: 1,
    borderWidth: 0.5,
    borderColor: '#eee',
    padding: 4,
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  calendarDayNumber: {
    fontSize: 10,
    fontWeight: '600',
    marginBottom: 2,
  },
  calendarDayAmount: {
    fontSize: 8,
    fontWeight: '600',
  },
  calendarDayEmpty: {
    fontSize: 8,
    color: '#ccc',
  },
  categoryContainer: {
    marginBottom: 8,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 10,
    backgroundColor: '#ffffff',
  },
  categoryItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 8,
  },
  categoryItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  toggleIcon: {
    fontSize: 12,
    color: '#666',
    width: 16,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  categoryType: {
    fontSize: 12,
    color: '#666',
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
  },
  categoryAmount: {
    fontSize: 16,
    fontWeight: '700',
  },
  categoryDetails: {
    marginTop: 4,
    marginLeft: 24,
    borderLeftWidth: 2,
    borderLeftColor: '#e0e0e0',
    paddingLeft: 12,
    gap: 8,
  },
  categoryDetailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#fafafa',
    borderRadius: 8,
    marginBottom: 4,
  },
  categoryDetailLeft: {
    flex: 1,
    gap: 4,
  },
  categoryDetailDate: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },
  categoryDetailNote: {
    fontSize: 12,
    color: '#999',
  },
  categoryDetailAmount: {
    fontSize: 15,
    fontWeight: '700',
    marginLeft: 12,
  },
  monthPickerWeb: {
    padding: 16,
    alignItems: 'center',
  },
  monthInputWeb: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 8,
    fontSize: 16,
    width: '100%',
    maxWidth: 200,
  },
});

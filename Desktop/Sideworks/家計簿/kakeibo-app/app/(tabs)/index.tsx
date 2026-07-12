import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, Alert, TextInput, Modal } from 'react-native';
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

type DailySummary = {
  date: string;
  income: number;
  expense: number;
};

export default function DashboardScreen() {
  const { session, signOut } = useAuth();
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [showDateDetail, setShowDateDetail] = useState(false);

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

    // カテゴリ別の内訳を計算
    const incomeByCategory = new Map<string, number>();
    const expenseByCategory = new Map<string, number>();

    entries.forEach((entry) => {
      const categoryName = entry.categories?.name || '未分類';
      if (entry.type === 'income') {
        incomeByCategory.set(categoryName, (incomeByCategory.get(categoryName) || 0) + entry.amount);
      } else {
        expenseByCategory.set(categoryName, (expenseByCategory.get(categoryName) || 0) + entry.amount);
      }
    });

    const incomeBreakdown = Array.from(incomeByCategory.entries())
      .map(([name, amount]) => ({ name, amount }))
      .sort((a, b) => b.amount - a.amount);

    const expenseBreakdown = Array.from(expenseByCategory.entries())
      .map(([name, amount]) => ({ name, amount }))
      .sort((a, b) => b.amount - a.amount);

    return {
      income,
      expense,
      balance: income - expense,
      incomeBreakdown,
      expenseBreakdown,
    };
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

  const formatCurrencyShort = (amount: number) => {
    if (amount >= 10000) {
      return `${(amount / 10000).toFixed(1)}万`;
    }
    return amount.toString();
  };

  const formatMonth = (date: Date) => {
    return `${date.getFullYear()}年${date.getMonth() + 1}月`;
  };

  const changeMonth = (delta: number) => {
    const newDate = new Date(selectedMonth);
    newDate.setMonth(newDate.getMonth() + delta);
    setSelectedMonth(newDate);
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

      <ScrollView style={styles.content}>
        {isLoading ? (
          <View style={styles.empty}>
            <Text>読み込み中...</Text>
          </View>
        ) : (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>カレンダー</Text>
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
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.calendarDay,
                      day && (day.income > 0 || day.expense > 0) && styles.calendarDayActive,
                    ]}
                    onPress={() => {
                      if (day && (day.income > 0 || day.expense > 0)) {
                        setSelectedDate(day.fullDate);
                        setShowDateDetail(true);
                      }
                    }}
                    disabled={!day || (day.income === 0 && day.expense === 0)}>
                    {day ? (
                      <>
                        <Text style={styles.calendarDayNumber}>{day.date}</Text>
                        {day.income > 0 && (
                          <Text style={[styles.calendarDayAmount, styles.incomeAmount]}>
                            +{formatCurrencyShort(day.income)}
                          </Text>
                        )}
                        {day.expense > 0 && (
                          <Text style={[styles.calendarDayAmount, styles.expenseAmount]}>
                            -{formatCurrencyShort(day.expense)}
                          </Text>
                        )}
                        {day.income === 0 && day.expense === 0 && (
                          <Text style={styles.calendarDayEmpty}>-</Text>
                        )}
                      </>
                    ) : (
                      <View />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            {dailySummary.length > 0 && (
              <View style={styles.dailySummarySection}>
                <Text style={styles.sectionTitle}>日別サマリー</Text>
                {dailySummary.slice(0, 7).map((day) => (
                  <View key={day.date} style={styles.dailyItem}>
                    <Text style={styles.dailyDate}>{day.date}</Text>
                    <View style={styles.dailyAmounts}>
                      {day.income > 0 && (
                        <Text style={[styles.dailyAmount, styles.incomeAmount]}>
                          +{formatCurrency(day.income)}
                        </Text>
                      )}
                      {day.expense > 0 && (
                        <Text style={[styles.dailyAmount, styles.expenseAmount]}>
                          -{formatCurrency(day.expense)}
                        </Text>
                      )}
                      <Text
                        style={[
                          styles.dailyBalance,
                          day.income - day.expense >= 0 ? styles.incomeAmount : styles.expenseAmount,
                        ]}>
                        {formatCurrency(day.income - day.expense)}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* 日付詳細モーダル */}
      <Modal
        visible={showDateDetail}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowDateDetail(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {selectedDate ? `${selectedDate.split('-')[0]}年${selectedDate.split('-')[1]}月${selectedDate.split('-')[2]}日` : ''}
              </Text>
              <TouchableOpacity onPress={() => setShowDateDetail(false)}>
                <Text style={styles.modalCloseButton}>×</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalBody}>
              {selectedDate && (() => {
                const dateEntries = entries.filter(e => e.happened_on === selectedDate);
                const dateIncome = dateEntries.filter(e => e.type === 'income');
                const dateExpense = dateEntries.filter(e => e.type === 'expense');
                const incomeTotal = dateIncome.reduce((sum, e) => sum + e.amount, 0);
                const expenseTotal = dateExpense.reduce((sum, e) => sum + e.amount, 0);

                // カテゴリ別に集計
                const incomeByCategory = new Map<string, { amount: number; entries: Entry[] }>();
                const expenseByCategory = new Map<string, { amount: number; entries: Entry[] }>();

                dateIncome.forEach(entry => {
                  const categoryName = entry.categories?.name || '未分類';
                  const existing = incomeByCategory.get(categoryName) || { amount: 0, entries: [] };
                  existing.amount += entry.amount;
                  existing.entries.push(entry);
                  incomeByCategory.set(categoryName, existing);
                });

                dateExpense.forEach(entry => {
                  const categoryName = entry.categories?.name || '未分類';
                  const existing = expenseByCategory.get(categoryName) || { amount: 0, entries: [] };
                  existing.amount += entry.amount;
                  existing.entries.push(entry);
                  expenseByCategory.set(categoryName, existing);
                });

                return (
                  <View style={styles.dateDetailContent}>
                    <View style={styles.dateSummary}>
                      <View style={styles.dateSummaryItem}>
                        <Text style={styles.dateSummaryLabel}>収入</Text>
                        <Text style={[styles.dateSummaryAmount, styles.incomeAmount]}>
                          {formatCurrency(incomeTotal)}
                        </Text>
                      </View>
                      <View style={styles.dateSummaryItem}>
                        <Text style={styles.dateSummaryLabel}>支出</Text>
                        <Text style={[styles.dateSummaryAmount, styles.expenseAmount]}>
                          {formatCurrency(expenseTotal)}
                        </Text>
                      </View>
                      <View style={styles.dateSummaryItem}>
                        <Text style={styles.dateSummaryLabel}>差額</Text>
                        <Text style={[
                          styles.dateSummaryAmount,
                          incomeTotal - expenseTotal >= 0 ? styles.incomeAmount : styles.expenseAmount,
                        ]}>
                          {formatCurrency(incomeTotal - expenseTotal)}
                        </Text>
                      </View>
                    </View>

                    {incomeTotal > 0 && (
                      <View style={styles.dateDetailSection}>
                        <Text style={styles.dateDetailSectionTitle}>収入の内訳</Text>
                        {Array.from(incomeByCategory.entries())
                          .sort((a, b) => b[1].amount - a[1].amount)
                          .map(([categoryName, data]) => (
                            <View key={categoryName} style={styles.dateDetailCategory}>
                              <View style={styles.dateDetailCategoryHeader}>
                                <Text style={styles.dateDetailCategoryName}>{categoryName}</Text>
                                <Text style={[styles.dateDetailCategoryAmount, styles.incomeAmount]}>
                                  {formatCurrency(data.amount)}
                                </Text>
                              </View>
                              {data.entries.map((entry) => (
                                <View key={entry.id} style={styles.dateDetailEntry}>
                                  <View style={styles.dateDetailEntryLeft}>
                                    {entry.note && (
                                      <Text style={styles.dateDetailEntryNote}>{entry.note}</Text>
                                    )}
                                  </View>
                                  <Text style={[styles.dateDetailEntryAmount, styles.incomeAmount]}>
                                    +{formatCurrency(entry.amount)}
                                  </Text>
                                </View>
                              ))}
                            </View>
                          ))}
                      </View>
                    )}

                    {expenseTotal > 0 && (
                      <View style={styles.dateDetailSection}>
                        <Text style={styles.dateDetailSectionTitle}>支出の内訳</Text>
                        {Array.from(expenseByCategory.entries())
                          .sort((a, b) => b[1].amount - a[1].amount)
                          .map(([categoryName, data]) => (
                            <View key={categoryName} style={styles.dateDetailCategory}>
                              <View style={styles.dateDetailCategoryHeader}>
                                <Text style={styles.dateDetailCategoryName}>{categoryName}</Text>
                                <Text style={[styles.dateDetailCategoryAmount, styles.expenseAmount]}>
                                  {formatCurrency(data.amount)}
                                </Text>
                              </View>
                              {data.entries.map((entry) => (
                                <View key={entry.id} style={styles.dateDetailEntry}>
                                  <View style={styles.dateDetailEntryLeft}>
                                    {entry.note && (
                                      <Text style={styles.dateDetailEntryNote}>{entry.note}</Text>
                                    )}
                                  </View>
                                  <Text style={[styles.dateDetailEntryAmount, styles.expenseAmount]}>
                                    -{formatCurrency(entry.amount)}
                                  </Text>
                                </View>
                              ))}
                            </View>
                          ))}
                      </View>
                    )}

                    {dateEntries.length === 0 && (
                      <View style={styles.dateDetailEmpty}>
                        <Text style={styles.dateDetailEmptyText}>この日の記録はありません</Text>
                      </View>
                    )}
                  </View>
                );
              })()}
            </ScrollView>
          </View>
        </View>
      </Modal>
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
    marginBottom: 24,
    gap: 8,
    padding: 16,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  summaryCard: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  modalCloseButton: {
    fontSize: 32,
    color: '#9ca3af',
    fontWeight: '300',
    lineHeight: 32,
  },
  modalBody: {
    flex: 1,
    padding: 20,
  },
  dateDetailContent: {
    gap: 20,
  },
  dateSummary: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 16,
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    gap: 12,
  },
  dateSummaryItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  dateSummaryLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
  dateSummaryAmount: {
    fontSize: 16,
    fontWeight: '700',
  },
  dateDetailSection: {
    gap: 12,
  },
  dateDetailSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  dateDetailCategory: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  dateDetailCategoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  dateDetailCategoryName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  dateDetailCategoryAmount: {
    fontSize: 16,
    fontWeight: '700',
  },
  dateDetailEntry: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    marginBottom: 4,
  },
  dateDetailEntryLeft: {
    flex: 1,
  },
  dateDetailEntryNote: {
    fontSize: 13,
    color: '#6b7280',
  },
  dateDetailEntryAmount: {
    fontSize: 15,
    fontWeight: '700',
  },
  dateDetailEmpty: {
    padding: 40,
    alignItems: 'center',
  },
  dateDetailEmptyText: {
    fontSize: 16,
    color: '#9ca3af',
  },
  incomeAmount: {
    color: '#2e7d32',
  },
  expenseAmount: {
    color: '#c62828',
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
    borderColor: '#e5e7eb',
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  calendarHeader: {
    flexDirection: 'row',
    backgroundColor: '#f9fafb',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  calendarHeaderDay: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  calendarHeaderText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calendarDay: {
    width: '14.28%',
    minHeight: 70,
    borderWidth: 0.5,
    borderColor: '#e5e7eb',
    padding: 8,
    justifyContent: 'flex-start',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  calendarDayActive: {
    backgroundColor: '#f0f9ff',
    borderColor: '#3b82f6',
    borderWidth: 1.5,
  },
  calendarDayNumber: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 4,
    color: '#1f2937',
  },
  calendarDayAmount: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
  },
  calendarDayEmpty: {
    fontSize: 10,
    color: '#d1d5db',
    marginTop: 4,
  },
  dailySummarySection: {
    marginTop: 24,
    gap: 8,
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

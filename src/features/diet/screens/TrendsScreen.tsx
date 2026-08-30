import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { CalendarDays, TrendingUp } from 'lucide-react-native';

import {
  AppButton,
  AppScreen,
  EmptyState,
  GlassCard,
  SectionTitle,
  StatCell,
  Tag,
} from '../../../shared/components';
import { colors, fonts, radii, spacing } from '../../../shared/theme/tokens';
import { nutriApi } from '../api/nutriApi';
import type { DailyNutritionSummary, DailyNutritionTrend } from '../api/nutriTypes';
import {
  dailyTrendNutrient,
  formatTrendValue,
  nutritionTrendDateRange,
  summarizeNutritionTrend,
  type NutritionTrendRange,
  type TrendNutrientCode,
} from '../services/nutritionTrend';

const ranges: Array<{ days: NutritionTrendRange; label: string }> = [
  { days: 7, label: '7 日' },
  { days: 30, label: '30 日' },
  { days: 90, label: '90 日' },
];
const nutrients: Array<{
  code: TrendNutrientCode;
  label: string;
  unit: string;
  color: string;
}> = [
  { code: 'ENERGY_KCAL', label: '热量', unit: 'kcal', color: colors.blue },
  { code: 'PROTEIN', label: '蛋白质', unit: 'g', color: colors.green },
  { code: 'CARBOHYDRATE', label: '碳水', unit: 'g', color: colors.blue },
  { code: 'FAT', label: '脂肪', unit: 'g', color: colors.amber },
];

export function TrendsScreen() {
  const [range, setRange] = useState<NutritionTrendRange>(7);
  const [nutrientCode, setNutrientCode] = useState<TrendNutrientCode>('ENERGY_KCAL');
  const [trend, setTrend] = useState<DailyNutritionTrend | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setFailed(false);
    setTrend(null);
    const dates = nutritionTrendDateRange(range);
    try {
      setTrend(await nutriApi.getDailyTrend(dates.dateFrom, dates.dateTo));
    } catch {
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }, [range]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const nutrient = nutrients.find(item => item.code === nutrientCode) ?? nutrients[0];
  const summary = trend ? summarizeNutritionTrend(trend, nutrientCode) : null;
  return (
    <AppScreen>
      <View style={styles.pageHeading}>
        <View style={styles.eyebrowRow}>
          <View style={styles.eyebrowIcon}>
            <TrendingUp color={colors.blue} size={15} />
          </View>
          <Text style={styles.eyebrow}>NUTRIMEMO 数据统计</Text>
        </View>
        <Text style={styles.pageTitle}>营养趋势</Text>
        <Text style={styles.pageDescription}>
          按真实餐食记录查看每日营养变化；无记录或尚未完成分析的数据不会被估算。
        </Text>
      </View>

      <View style={styles.rangeSwitch}>
        {ranges.map(item => (
          <Pressable
            key={item.days}
            accessibilityRole="button"
            onPress={() => setRange(item.days)}
            style={[styles.rangeItem, range === item.days && styles.rangeItemActive]}
          >
            <Text style={[styles.rangeText, range === item.days && styles.rangeTextActive]}>
              {item.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.nutrientSwitch}>
        {nutrients.map(item => (
          <Pressable
            key={item.code}
            accessibilityRole="button"
            onPress={() => setNutrientCode(item.code)}
            style={[styles.nutrientItem, nutrientCode === item.code && styles.nutrientItemActive]}
          >
            <Text
              style={[styles.nutrientText, nutrientCode === item.code && styles.nutrientTextActive]}
            >
              {item.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {loading ? (
        <GlassCard style={styles.stateCard}>
          <ActivityIndicator color={colors.blue} size="large" />
          <Text style={styles.stateText}>正在读取营养趋势…</Text>
        </GlassCard>
      ) : failed ? (
        <EmptyState
          title="营养趋势暂时无法加载"
          description="请检查网络或服务状态后重试。"
          action={<AppButton label="重新加载" variant="secondary" onPress={load} />}
        />
      ) : !trend || summary?.recordedDays === 0 ? (
        <EmptyState
          title="本周期还没有饮食记录"
          description="提交餐食并完成分析后，这里会显示真实的每日营养变化。"
        />
      ) : (
        <>
          <GlassCard>
            <View style={styles.chartHead}>
              <View>
                <Text style={styles.chartTitle}>{nutrient.label}每日变化</Text>
                <Text style={styles.chartDescription}>
                  日均 {formatTrendValue(summary?.average ?? null)} {nutrient.unit}
                </Text>
              </View>
              <Tag label={(summary?.recordedDays ?? 0) + ' 天有记录'} tone="green" />
            </View>
            <NutritionChart
              days={trend.days}
              code={nutrientCode}
              color={nutrient.color}
              range={range}
              unit={nutrient.unit}
            />
          </GlassCard>

          <SectionTitle title="本周期记录概况" detail="仅统计 NutriMemo 已保存的数据" />
          <View style={styles.statGrid}>
            <StatCell
              label="记录天数"
              value={String(summary?.recordedDays ?? 0)}
              unit="天"
              style={styles.statCell}
            />
            <StatCell
              label="餐食总数"
              value={String(summary?.totalMeals ?? 0)}
              unit="餐"
              style={styles.statCell}
            />
            <StatCell
              label={nutrient.label + '日均'}
              value={formatTrendValue(summary?.average ?? null)}
              unit={nutrient.unit}
              style={styles.statCell}
            />
          </View>

          <GlassCard style={styles.insight}>
            <CalendarDays color={colors.blue} size={20} />
            <View style={styles.insightCopy}>
              <Text style={styles.insightTitle}>记录说明</Text>
              <Text style={styles.insightText}>
                最近 {range} 天中有 {summary?.recordedDays ?? 0} 天记录，共{' '}
                {summary?.totalMeals ?? 0}{' '}
                餐。日均值只使用包含该营养素的记录日，不代表目标达标率或医疗结论。
              </Text>
            </View>
          </GlassCard>
        </>
      )}
    </AppScreen>
  );
}

function NutritionChart({
  days,
  code,
  color,
  range,
  unit,
}: {
  days: DailyNutritionSummary[];
  code: TrendNutrientCode;
  color: string;
  range: NutritionTrendRange;
  unit: string;
}) {
  const values = days.map(day => dailyTrendNutrient(day, code));
  const max = Math.max(0, ...values.filter((value): value is number => value !== null));
  const columnWidth = range === 7 ? 42 : range === 30 ? 24 : 14;
  const labelStride = range === 7 ? 1 : range === 30 ? 5 : 15;
  return (
    <ScrollView
      horizontal
      nestedScrollEnabled
      contentContainerStyle={styles.chartContent}
      showsHorizontalScrollIndicator={false}
    >
      {days.map((day, index) => {
        const value = values[index];
        const barHeight = value === null || max === 0 ? 6 : Math.max(8, (value / max) * 126);
        const showLabel = index % labelStride === 0 || index === days.length - 1;
        const showValue = range === 7 || index === days.length - 1;
        return (
          <View key={day.localDate} style={[styles.barColumn, { width: columnWidth }]}>
            <Text numberOfLines={1} style={styles.barValue}>
              {showValue && value !== null ? formatTrendValue(value) : ''}
            </Text>
            <View
              style={[
                styles.bar,
                {
                  height: barHeight,
                  backgroundColor: value === null ? colors.line : color,
                },
              ]}
            />
            <Text numberOfLines={1} style={styles.barLabel}>
              {showLabel ? day.localDate.slice(5).replace('-', '/') : ''}
            </Text>
            {showValue && value !== null && range === 7 ? (
              <Text style={styles.barUnit}>{unit}</Text>
            ) : null}
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  pageHeading: { gap: 6 },
  eyebrowRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  eyebrowIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.blueSoft,
  },
  eyebrow: { color: colors.blue, fontFamily: fonts.body, fontSize: 12, fontWeight: '800' },
  pageTitle: {
    color: colors.ink,
    fontFamily: fonts.display,
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.8,
  },
  pageDescription: { color: colors.muted, fontFamily: fonts.body, fontSize: 13, lineHeight: 20 },
  rangeSwitch: {
    flexDirection: 'row',
    alignSelf: 'flex-start',
    backgroundColor: colors.surfaceMuted,
    borderRadius: radii.pill,
    padding: 3,
  },
  rangeItem: {
    minWidth: 62,
    alignItems: 'center',
    borderRadius: radii.pill,
    paddingVertical: 7,
    paddingHorizontal: spacing.sm,
  },
  rangeItemActive: { backgroundColor: colors.surface },
  rangeText: { color: colors.muted, fontFamily: fonts.body, fontSize: 12, fontWeight: '700' },
  rangeTextActive: { color: colors.blue },
  nutrientSwitch: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  nutrientItem: {
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: spacing.md,
    paddingVertical: 7,
    backgroundColor: colors.surface,
  },
  nutrientItemActive: { borderColor: colors.blue, backgroundColor: colors.blueSoft },
  nutrientText: { color: colors.muted, fontFamily: fonts.body, fontSize: 12, fontWeight: '700' },
  nutrientTextActive: { color: colors.blue },
  stateCard: { minHeight: 220, alignItems: 'center', justifyContent: 'center', gap: spacing.md },
  stateText: { color: colors.muted, fontFamily: fonts.body, fontSize: 13 },
  chartHead: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.sm },
  chartTitle: { color: colors.ink, fontFamily: fonts.display, fontSize: 17, fontWeight: '800' },
  chartDescription: { color: colors.muted, fontFamily: fonts.body, fontSize: 11, marginTop: 4 },
  chartContent: {
    minWidth: '100%',
    height: 190,
    alignItems: 'flex-end',
    paddingTop: spacing.lg,
    paddingHorizontal: spacing.xs,
    borderBottomWidth: 1,
    borderColor: colors.line,
  },
  barColumn: { height: '100%', justifyContent: 'flex-end', alignItems: 'center', gap: 3 },
  bar: { width: '62%', minWidth: 5, borderTopLeftRadius: 6, borderTopRightRadius: 6 },
  barValue: { minHeight: 13, color: colors.muted, fontFamily: fonts.mono, fontSize: 9 },
  barLabel: { minHeight: 13, color: colors.muted, fontFamily: fonts.body, fontSize: 9 },
  barUnit: { color: colors.placeholder, fontFamily: fonts.body, fontSize: 8 },
  statGrid: { flexDirection: 'row', gap: spacing.sm },
  statCell: { flex: 1 },
  insight: { flexDirection: 'row', gap: spacing.md, backgroundColor: colors.blueSoft },
  insightCopy: { flex: 1 },
  insightTitle: { color: colors.ink, fontFamily: fonts.body, fontWeight: '800', fontSize: 14 },
  insightText: {
    color: colors.muted,
    fontFamily: fonts.body,
    fontSize: 12,
    lineHeight: 19,
    marginTop: 4,
  },
});

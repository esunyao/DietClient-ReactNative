import type { DailyNutritionSummary, DailyNutritionTrend } from '../api/nutriTypes';
import { localDateFromDate } from './mealCapture/captureUtils';

export type NutritionTrendRange = 7 | 30 | 90;
export type TrendNutrientCode = 'ENERGY_KCAL' | 'PROTEIN' | 'CARBOHYDRATE' | 'FAT';

export type NutritionTrendSummary = {
  recordedDays: number;
  totalMeals: number;
  average: number | null;
};

export function nutritionTrendDateRange(
  days: NutritionTrendRange,
  now = new Date(),
): { dateFrom: string; dateTo: string } {
  const from = new Date(now);
  from.setDate(from.getDate() - days + 1);
  return {
    dateFrom: localDateFromDate(from),
    dateTo: localDateFromDate(now),
  };
}

export function dailyTrendNutrient(
  day: DailyNutritionSummary,
  code: TrendNutrientCode,
): number | null {
  return day.nutrients.find(item => item.nutrientCode === code)?.amount ?? null;
}

export function summarizeNutritionTrend(
  trend: DailyNutritionTrend,
  code: TrendNutrientCode,
): NutritionTrendSummary {
  const recorded = trend.days.filter(day => day.mealCount > 0);
  const values = recorded
    .map(day => dailyTrendNutrient(day, code))
    .filter((value): value is number => value !== null);
  return {
    recordedDays: recorded.length,
    totalMeals: recorded.reduce((total, day) => total + day.mealCount, 0),
    average: values.length
      ? values.reduce((total, value) => total + value, 0) / values.length
      : null,
  };
}

export function formatTrendValue(value: number | null): string {
  if (value === null) return '—';
  return Number.isInteger(value) ? String(value) : value.toFixed(1).replace(/\.0$/, '');
}

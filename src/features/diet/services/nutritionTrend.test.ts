import type { DailyNutritionSummary, DailyNutritionTrend } from '../api/nutriTypes';
import {
  dailyTrendNutrient,
  formatTrendValue,
  nutritionTrendDateRange,
  summarizeNutritionTrend,
} from './nutritionTrend';

function day(localDate: string, mealCount: number, energy: number | null): DailyNutritionSummary {
  return {
    localDate,
    mealCount,
    nutrients:
      energy === null
        ? []
        : [{ nutrientCode: 'ENERGY_KCAL', nutrientName: '能量', unit: 'kcal', amount: energy }],
    mealBreakdown: [],
    updatedAt: localDate + 'T12:00:00Z',
  };
}

function trend(days: DailyNutritionSummary[]): DailyNutritionTrend {
  return { dateFrom: days[0]?.localDate ?? '', dateTo: days.at(-1)?.localDate ?? '', days };
}

describe('nutrition trend', () => {
  it('builds inclusive local date ranges', () => {
    expect(nutritionTrendDateRange(7, new Date(2026, 7, 30, 12))).toEqual({
      dateFrom: '2026-08-24',
      dateTo: '2026-08-30',
    });
    expect(nutritionTrendDateRange(30, new Date(2026, 7, 30, 12)).dateFrom).toBe('2026-08-01');
    expect(nutritionTrendDateRange(90, new Date(2026, 7, 30, 12)).dateFrom).toBe('2026-06-02');
  });

  it('summarizes recorded days and averages only available nutrient values', () => {
    const result = summarizeNutritionTrend(
      trend([
        day('2026-08-28', 2, 1800),
        day('2026-08-29', 0, null),
        day('2026-08-30', 1, 1200),
        day('2026-08-31', 1, null),
      ]),
      'ENERGY_KCAL',
    );
    expect(result).toEqual({ recordedDays: 3, totalMeals: 4, average: 1500 });
  });

  it('keeps missing nutrients distinct from zero', () => {
    expect(dailyTrendNutrient(day('2026-08-30', 1, null), 'ENERGY_KCAL')).toBeNull();
    expect(
      summarizeNutritionTrend(trend([day('2026-08-30', 1, null)]), 'PROTEIN').average,
    ).toBeNull();
    expect(formatTrendValue(null)).toBe('—');
    expect(formatTrendValue(12.25)).toBe('12.3');
  });

  it('handles a completely empty range', () => {
    expect(summarizeNutritionTrend(trend([]), 'FAT')).toEqual({
      recordedDays: 0,
      totalMeals: 0,
      average: null,
    });
  });
});

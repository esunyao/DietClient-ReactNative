import type { MealAnalysisStatus, NutrientValue } from '../api/nutriTypes';

export type MealStatusPresentation = {
  label: string;
  tone: 'green' | 'blue' | 'red';
};

export function mealStatusPresentation(status: MealAnalysisStatus): MealStatusPresentation {
  if (status === 'completed') return { label: '分析完成', tone: 'green' };
  if (status === 'analysing') return { label: 'AI 分析中', tone: 'blue' };
  if (status === 'failed') return { label: '分析失败', tone: 'red' };
  return { label: '等待 AI 分析', tone: 'blue' };
}

export function isMealAnalysisPending(status: MealAnalysisStatus): boolean {
  return status === 'queued' || status === 'analysing';
}

export function nutrientAmount(nutrients: NutrientValue[], code: string): number | null {
  return nutrients.find(item => item.nutrientCode === code)?.amount ?? null;
}

export function formatNutrientAmount(value: number | null): string {
  if (value === null) return '—';
  return Number.isInteger(value) ? String(value) : value.toFixed(1).replace(/\.0$/, '');
}

export function mealEnergySummary(status: MealAnalysisStatus, nutrients: NutrientValue[]): string {
  if (status !== 'completed') return mealStatusPresentation(status).label;
  const energy = nutrientAmount(nutrients, 'ENERGY_KCAL');
  return energy === null ? '分析完成' : formatNutrientAmount(energy) + ' kcal';
}

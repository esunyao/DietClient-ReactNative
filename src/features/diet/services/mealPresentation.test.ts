import {
  formatNutrientAmount,
  isMealAnalysisPending,
  mealEnergySummary,
  mealStatusPresentation,
  nutrientAmount,
} from './mealPresentation';

const nutrients = [
  { nutrientCode: 'ENERGY_KCAL', nutrientName: '能量', unit: 'kcal', amount: 612.5 },
];

describe('meal presentation', () => {
  it('maps every asynchronous analysis status truthfully', () => {
    expect(mealStatusPresentation('queued')).toEqual({ label: '等待 AI 分析', tone: 'blue' });
    expect(mealStatusPresentation('analysing')).toEqual({ label: 'AI 分析中', tone: 'blue' });
    expect(mealStatusPresentation('completed')).toEqual({ label: '分析完成', tone: 'green' });
    expect(mealStatusPresentation('failed')).toEqual({ label: '分析失败', tone: 'red' });
  });

  it('polls only non-terminal states', () => {
    expect(isMealAnalysisPending('queued')).toBe(true);
    expect(isMealAnalysisPending('analysing')).toBe(true);
    expect(isMealAnalysisPending('completed')).toBe(false);
    expect(isMealAnalysisPending('failed')).toBe(false);
  });

  it('never fabricates energy before analysis completes', () => {
    expect(mealEnergySummary('queued', nutrients)).toBe('等待 AI 分析');
    expect(mealEnergySummary('failed', [])).toBe('分析失败');
    expect(mealEnergySummary('completed', nutrients)).toBe('612.5 kcal');
    expect(mealEnergySummary('completed', [])).toBe('分析完成');
  });

  it('formats missing and decimal nutrient values', () => {
    expect(nutrientAmount(nutrients, 'PROTEIN')).toBeNull();
    expect(formatNutrientAmount(null)).toBe('—');
    expect(formatNutrientAmount(12)).toBe('12');
    expect(formatNutrientAmount(12.25)).toBe('12.3');
  });
});

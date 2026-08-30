import {
  AI_NUTRITION_CONSENT_POLICY_VERSION,
  AI_NUTRITION_CONSENT_TYPE,
  canSubmitAiNutritionAnalysis,
  consentSourceForPlatform,
  resolveAiNutritionConsent,
} from './aiNutritionConsent';
import type { UserConsent } from '../../features/profile/api/profileTypes';

function consent(overrides: Partial<UserConsent> = {}): UserConsent {
  return {
    consentId: '2086475596958904300',
    userId: '0d8c9f4b-aac6-4791-97d0-796e6f0a1f7d',
    consentType: AI_NUTRITION_CONSENT_TYPE,
    policyVersion: AI_NUTRITION_CONSENT_POLICY_VERSION,
    granted: true,
    recordedAt: '2026-08-30T08:00:00Z',
    source: 'mobile',
    clientIp: null,
    userAgent: null,
    createdAt: '2026-08-30T08:00:00Z',
    ...overrides,
  };
}

describe('AI nutrition consent', () => {
  it('uses the latest matching append-only record', () => {
    const result = resolveAiNutritionConsent([
      consent({ granted: true, recordedAt: '2026-08-30T08:00:00Z' }),
      consent({
        consentId: '2086475596958904301',
        granted: false,
        recordedAt: '2026-08-30T09:00:00Z',
      }),
      consent({ consentType: 'marketing', recordedAt: '2026-08-30T10:00:00Z' }),
    ]);

    expect(result.status).toBe('denied');
    expect(result.latest?.consentId).toBe('2086475596958904301');
  });

  it('requires renewed consent when the policy version changes', () => {
    expect(resolveAiNutritionConsent([consent({ policyVersion: '0.9' })]).status).toBe(
      'needs_review',
    );
    expect(resolveAiNutritionConsent([])).toEqual({ status: 'denied', latest: null });
  });

  it('only permits an explicit current grant', () => {
    expect(canSubmitAiNutritionAnalysis('granted')).toBe(true);
    for (const status of ['idle', 'loading', 'denied', 'needs_review', 'error'] as const) {
      expect(canSubmitAiNutritionAnalysis(status)).toBe(false);
    }
  });

  it('maps native and web platforms to Orion sources', () => {
    expect(consentSourceForPlatform('web')).toBe('web');
    expect(consentSourceForPlatform('android')).toBe('mobile');
    expect(consentSourceForPlatform('ios')).toBe('mobile');
  });
});

import type { ConsentSource, UserConsent } from '../../features/profile/api/profileTypes';

export const AI_NUTRITION_CONSENT_TYPE = 'ai_nutrition_analysis';
export const AI_NUTRITION_CONSENT_POLICY_VERSION = '1.0';

export type AiNutritionConsentStatus =
  | 'idle'
  | 'loading'
  | 'granted'
  | 'denied'
  | 'needs_review'
  | 'error';

export type AiNutritionConsentResolution = {
  status: Exclude<AiNutritionConsentStatus, 'idle' | 'loading' | 'error'>;
  latest: UserConsent | null;
};

/** Orion 的授权记录只追加；AI 只依据同类型的最新记录决定能否读取健康上下文。 */
export function resolveAiNutritionConsent(records: UserConsent[]): AiNutritionConsentResolution {
  const latest = records
    .filter(record => record.consentType === AI_NUTRITION_CONSENT_TYPE)
    .sort((left, right) => right.recordedAt.localeCompare(left.recordedAt))[0];

  if (!latest) return { status: 'denied', latest: null };
  if (latest.policyVersion !== AI_NUTRITION_CONSENT_POLICY_VERSION) {
    return { status: 'needs_review', latest };
  }
  return { status: latest.granted ? 'granted' : 'denied', latest };
}

export function consentSourceForPlatform(platform: string): ConsentSource {
  return platform === 'web' ? 'web' : 'mobile';
}

export function canSubmitAiNutritionAnalysis(status: AiNutritionConsentStatus): boolean {
  return status === 'granted';
}

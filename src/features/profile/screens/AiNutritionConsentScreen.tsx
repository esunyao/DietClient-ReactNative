import React, { useCallback, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { ShieldCheck } from 'lucide-react-native';

import type { ProfileStackParamList } from '../../../navigation/types';
import { getErrorMessage } from '../../../shared/api/client';
import {
  AppButton,
  AppScreen,
  GlassCard,
  ScreenHeader,
  SectionTitle,
  Tag,
  useToast,
} from '../../../shared/components';
import { colors, fonts, spacing } from '../../../shared/theme/tokens';
import { useSessionStore } from '../../../app/session/sessionStore';
import type { AiNutritionConsentStatus } from '../../../app/session/aiNutritionConsent';

type Props = NativeStackScreenProps<ProfileStackParamList, 'AiNutritionConsent'>;

function consentPresentation(status: AiNutritionConsentStatus): {
  label: string;
  tone: 'green' | 'amber' | 'red' | 'blue';
  detail: string;
} {
  if (status === 'granted')
    return {
      label: '已授权',
      tone: 'green',
      detail: 'AI 营养分析可以读取本次分析所需的最小健康上下文。',
    };
  if (status === 'needs_review')
    return { label: '需重新确认', tone: 'amber', detail: '授权政策已更新，请重新阅读并确认。' };
  if (status === 'error')
    return {
      label: '读取失败',
      tone: 'red',
      detail: '暂时无法确认授权状态，新的 AI 分析将保持关闭。',
    };
  if (status === 'loading' || status === 'idle')
    return { label: '检查中', tone: 'blue', detail: '正在从 Orion 读取最新授权记录。' };
  return {
    label: '未授权',
    tone: 'amber',
    detail: '新的餐食可以保存为草稿，但不能提交 AI 营养分析。',
  };
}

export function AiNutritionConsentScreen({ navigation }: Props) {
  const { show } = useToast();
  const status = useSessionStore(state => state.aiNutritionConsentStatus);
  const updating = useSessionStore(state => state.aiNutritionConsentUpdating);
  const refreshConsent = useSessionStore(state => state.refreshAiNutritionConsent);
  const updateConsent = useSessionStore(state => state.updateAiNutritionConsent);
  const [confirmingRevoke, setConfirmingRevoke] = useState(false);

  useFocusEffect(
    useCallback(() => {
      refreshConsent().catch(() => undefined);
    }, [refreshConsent]),
  );

  const changeConsent = useCallback(
    async (granted: boolean) => {
      try {
        await updateConsent(granted);
        setConfirmingRevoke(false);
        show(granted ? '已开启 AI 营养分析授权。' : '已撤回 AI 营养分析授权。', 'success');
      } catch (error) {
        show(getErrorMessage(error), 'error');
      }
    },
    [show, updateConsent],
  );

  const presentation = consentPresentation(status);
  return (
    <AppScreen
      header={
        <ScreenHeader
          title="AI 数据与隐私"
          subtitle="管理营养分析授权"
          onBack={() => navigation.goBack()}
        />
      }
    >
      <GlassCard style={styles.statusCard}>
        <View style={styles.statusHead}>
          <View style={styles.iconWrap}>
            <ShieldCheck color={colors.blue} size={22} />
          </View>
          <View style={styles.statusCopy}>
            <Text style={styles.title}>AI 营养分析</Text>
            <Text style={styles.detail}>{presentation.detail}</Text>
          </View>
          <Tag label={presentation.label} tone={presentation.tone} />
        </View>
      </GlassCard>

      <SectionTitle title="授权后会使用" detail="仅在执行餐食分析时读取" />
      <GlassCard style={styles.listCard}>
        <Disclosure text="年龄、性别、身高和最近体测" />
        <Disclosure text="有效健康目标、过敏、病史和饮食限制" />
        <Disclosure text="口味偏好，以及本次已确认的餐食图片" last />
      </GlassCard>

      <SectionTitle title="数据边界" />
      <GlassCard style={styles.copyCard}>
        <Text style={styles.body}>
          HealthMind 负责任务编排和结果校验，不保存餐食图片、完整用户画像、完整 Prompt
          或原始模型输出。图片通过短时地址提供给工作流，结构化结果写回 NutriMemo。
        </Text>
      </GlassCard>

      {confirmingRevoke ? (
        <GlassCard style={styles.warningCard}>
          <Text style={styles.warningTitle}>确认撤回授权？</Text>
          <Text style={styles.body}>
            撤回后新的分析将无法读取健康上下文；已经进入处理的任务仍可能继续完成。
          </Text>
          <View style={styles.actions}>
            <AppButton
              label="暂不撤回"
              variant="secondary"
              disabled={updating}
              onPress={() => setConfirmingRevoke(false)}
              style={styles.action}
            />
            <AppButton
              label="确认撤回"
              variant="danger"
              loading={updating}
              onPress={() => changeConsent(false)}
              style={styles.action}
            />
          </View>
        </GlassCard>
      ) : status === 'granted' ? (
        <AppButton label="撤回授权" variant="danger" onPress={() => setConfirmingRevoke(true)} />
      ) : (
        <AppButton
          label={status === 'error' ? '重新读取授权' : '同意并开启 AI 营养分析'}
          loading={updating || status === 'loading'}
          onPress={() =>
            status === 'error' ? refreshConsent().catch(() => undefined) : changeConsent(true)
          }
        />
      )}
    </AppScreen>
  );
}

function Disclosure({ text, last = false }: { text: string; last?: boolean }) {
  return (
    <View style={[styles.disclosure, last && styles.disclosureLast]}>
      <View style={styles.dot} />
      <Text style={styles.disclosureText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  statusCard: { gap: spacing.md },
  statusHead: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.blueSoft,
  },
  statusCopy: { flex: 1 },
  title: { color: colors.ink, fontFamily: fonts.display, fontSize: 18, fontWeight: '800' },
  detail: {
    color: colors.muted,
    fontFamily: fonts.body,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 4,
  },
  listCard: { paddingVertical: 4 },
  disclosure: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  disclosureLast: { borderBottomWidth: 0 },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.green },
  disclosureText: { flex: 1, color: colors.ink, fontFamily: fonts.body, fontSize: 13 },
  copyCard: { gap: spacing.sm },
  body: { color: colors.muted, fontFamily: fonts.body, fontSize: 13, lineHeight: 20 },
  warningCard: { gap: spacing.sm, backgroundColor: colors.redSoft },
  warningTitle: { color: colors.ink, fontFamily: fonts.body, fontSize: 15, fontWeight: '800' },
  actions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  action: { flex: 1 },
});

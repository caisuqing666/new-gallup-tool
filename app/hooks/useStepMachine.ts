/**
 * 流程状态机 Hook
 *
 * 使用 XState 实现状态管理，替换原来的 useReducer
 * 提供类型安全的状态和事件处理
 */

import { useMachine } from '@xstate/react';
import { useEffect, useMemo, useCallback } from 'react';
import { flowMachine } from '@/lib/machines/flowMachine';
import type { PathId, ScenarioId, StrengthId, GallupResult, StrengthGuideResult, CareerMatchResult, ReportInterpretResult } from '@/lib/types';

// ============================================================
// 类型导出（兼容旧接口）
// ============================================================

export type { FlowEvent } from '@/lib/machines/flowMachine';

/** 步骤类型 */
export type Step = 'landing' | 'path-selection' | 'scenario' | 'strengths' | 'input' | 'loading' | 'result' | 'guide-result' | 'career-result' | 'ocr-upload' | 'report-result';

// ============================================================
// Hook 实现
// ============================================================

export function useStepMachine() {
  const [snapshot, send, actor] = useMachine(flowMachine, {
    // 测试模式下禁用持久化
    snapshot: typeof window === 'undefined' ? undefined : undefined,
  });

  // 从快照提取状态
  const state = useMemo(() => {
    // XState v5 使用 snapshot.value 获取状态
    const value = snapshot.value;
    let step: Step = 'landing';

    if (typeof value === 'string') {
      // 扁平状态机：value 直接是状态名
      step = value as Step;
    } else if (value && typeof value === 'object') {
      // 嵌套状态机：value 是 { flow: 'state-name' }
      const flowValue = (value as { flow: string }).flow;
      step = (typeof flowValue === 'string' ? flowValue : 'landing') as Step;
    }

    const context = snapshot.context;

    return {
      step,
      path: context.path,
      formData: context.formData,
      resultData: context.resultData.breakthrough,
      guideData: context.resultData.guide,
      careerData: context.resultData.career,
      reportData: context.resultData.report,
      isLoading: context.isLoading,
      error: context.error,
      isMockResult: context.isMockResult,
    };
  }, [snapshot]);

  // 保存状态到 localStorage（仅在客户端）
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // 不保存 loading 和 result 状态
    const savingSteps = ['loading', 'result', 'guide-result', 'career-result'];
    if (savingSteps.includes(state.step)) return;

    try {
      const stateToSave = {
        step: state.step,
        path: state.path,
        formData: state.formData,
      };
      localStorage.setItem('gallup-tool-state', JSON.stringify(stateToSave));
    } catch (error) {
      console.error('保存状态失败:', error);
    }
  }, [state.step, state.path, state.formData]);

  // 清除保存的状态
  const clearSavedState = useCallback(() => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.removeItem('gallup-tool-state');
    } catch (error) {
      console.error('清除状态失败:', error);
    }
  }, []);

  // Actions（兼容旧接口）
  const actions = useMemo(() => ({
    start: () => send({ type: 'START' }),

    selectPath: (pathId: PathId) => {
      send({ type: 'SELECT_PATH', path: pathId });
    },

    selectScenario: (scenarioId: ScenarioId) => {
      send({ type: 'SELECT_SCENARIO', scenario: scenarioId });
    },

    nextToStrengths: () => {
      send({ type: 'NEXT' });
    },

    selectStrength: (strengthId: StrengthId) => {
      send({ type: 'SELECT_STRENGTH', strengthId });
    },

    deselectStrength: (strengthId: StrengthId) => {
      send({ type: 'DESELECT_STRENGTH', strengthId });
    },

    moveStrengthUp: (index: number) => {
      send({ type: 'MOVE_STRENGTH_UP', index });
    },

    moveStrengthDown: (index: number) => {
      send({ type: 'MOVE_STRENGTH_DOWN', index });
    },

    nextToInput: () => {
      send({ type: 'NEXT' });
    },

    nextToLoading: () => {
      send({ type: 'NEXT' });
    },

    updateConfusion: (confusion: string) => {
      send({ type: 'UPDATE_CONFUSION', confusion });
    },

    submit: () => {
      send({ type: 'SUBMIT' });
    },

    submitSuccess: (result: GallupResult, isMock: boolean = false) => {
      send({ type: 'BREAKTHROUGH_SUCCESS', result, isMock });
    },

    guideSuccess: (result: StrengthGuideResult, isMock: boolean = false) => {
      send({ type: 'GUIDE_SUCCESS', result, isMock });
    },

    careerSuccess: (result: CareerMatchResult, isMock: boolean = false) => {
      send({ type: 'CAREER_SUCCESS', result, isMock });
    },

    reportSuccess: (result: ReportInterpretResult, isMock: boolean = false) => {
      send({ type: 'REPORT_SUCCESS', result, isMock });
    },

    submitError: (error: string) => {
      send({ type: 'ERROR', message: error });
    },

    back: () => {
      send({ type: 'BACK' });
    },

    regenerate: () => {
      send({ type: 'REGENERATE' });
    },

    reset: () => {
      clearSavedState();
      send({ type: 'RESET' });
    },
  }), [send, clearSavedState]);

  return {
    state,
    actions,
    actor,
  };
}

// ============================================================
// 便捷 Hook：获取当前步骤
// ============================================================

export function useCurrentStep() {
  const { state } = useStepMachine();
  return state.step;
}

// ============================================================
// 便捷 Hook：检查是否可以提交
// ============================================================

export function useCanSubmit() {
  const { state } = useStepMachine();
  return (
    state.formData.strengths.length >= 3 &&
    state.formData.strengths.length <= 5 &&
    (state.path !== 'breakthrough' || state.formData.confusion.trim().length > 0)
  );
}

/**
 * 流程状态机
 *
 * 使用 XState 实现前端流程状态管理
 * 状态图清晰可见，事件驱动，易于测试和扩展
 */

import { setup, assign, SnapshotFrom } from 'xstate';
import type { PathId, ScenarioId, StrengthId } from '../types';
import type { GallupResult, StrengthGuideResult, CareerMatchResult, ReportInterpretResult } from '../schema';
import { isValidScenarioId } from '../scenarios';

// ============================================================
// 类型定义
// ============================================================

/** 表单数据 */
export interface FormData {
  scenario?: ScenarioId;
  strengths: StrengthId[];
  confusion: string;
}

/** 所有结果数据 */
export interface ResultData {
  breakthrough: GallupResult | null;
  guide: StrengthGuideResult | null;
  career: CareerMatchResult | null;
  report: ReportInterpretResult | null;
}

/** 机器上下文 */
export interface FlowContext {
  path: PathId;
  formData: FormData;
  resultData: ResultData;
  isLoading: boolean;
  error: string | null;
  isMockResult: boolean;
}

// ============================================================
// 事件定义
// ============================================================

// 导航事件
export type NavigationEvent =
  | { type: 'START' }
  | { type: 'BACK' }
  | { type: 'RESET' }
  | { type: 'REGENERATE' };

// 路径选择事件
export type PathEvent = { type: 'SELECT_PATH'; path: PathId };

// 表单事件
export type FormEvent =
  | { type: 'SELECT_SCENARIO'; scenario: ScenarioId }
  | { type: 'SELECT_STRENGTH'; strengthId: StrengthId }
  | { type: 'DESELECT_STRENGTH'; strengthId: StrengthId }
  | { type: 'MOVE_STRENGTH_UP'; index: number }
  | { type: 'MOVE_STRENGTH_DOWN'; index: number }
  | { type: 'UPDATE_CONFUSION'; confusion: string };

// 提交事件
export type SubmitEvent =
  | { type: 'SUBMIT' }
  | { type: 'NEXT' }; // 直接跳转到 loading（用于不需要 input 的路径）

// 成功事件
export type SuccessEvent =
  | { type: 'BREAKTHROUGH_SUCCESS'; result: GallupResult; isMock: boolean }
  | { type: 'GUIDE_SUCCESS'; result: StrengthGuideResult; isMock: boolean }
  | { type: 'CAREER_SUCCESS'; result: CareerMatchResult; isMock: boolean }
  | { type: 'REPORT_SUCCESS'; result: ReportInterpretResult; isMock: boolean };

// 错误事件
export type ErrorEvent = { type: 'ERROR'; message: string };

// 所有事件联合类型
export type FlowEvent =
  | NavigationEvent
  | PathEvent
  | FormEvent
  | SubmitEvent
  | SuccessEvent
  | ErrorEvent;

// ============================================================
// 辅助函数
// ============================================================

// ============================================================
// XState 机器定义
// ============================================================

export const flowMachine = setup({
  types: {
    context: {} as FlowContext,
    events: {} as FlowEvent,
  },
  actions: {
    setPath: assign({
      path: ({ event }) => {
        if (event.type !== 'SELECT_PATH') return 'breakthrough';
        return event.path;
      },
    }),
    setStepToPathSelection: assign({
      path: () => 'breakthrough',
    }),
    setScenario: assign({
      formData: ({ context, event }) => {
        if (event.type !== 'SELECT_SCENARIO' || !isValidScenarioId(event.scenario)) {
          return context.formData;
        }
        return { ...context.formData, scenario: event.scenario };
      },
    }),
    addStrength: assign({
      formData: ({ context, event }) => {
        if (event.type !== 'SELECT_STRENGTH') return context.formData;
        const { strengthId } = event;
        const strengths = context.formData.strengths || [];
        if (strengths.includes(strengthId)) return context.formData;
        if (strengths.length >= 5) return context.formData;
        return {
          ...context.formData,
          strengths: [...strengths, strengthId],
        };
      },
    }),
    removeStrength: assign({
      formData: ({ context, event }) => {
        if (event.type !== 'DESELECT_STRENGTH') return context.formData;
        const strengths = context.formData.strengths || [];
        return {
          ...context.formData,
          strengths: strengths.filter(id => id !== event.strengthId),
        };
      },
    }),
    moveStrengthUp: assign({
      formData: ({ context, event }) => {
        if (event.type !== 'MOVE_STRENGTH_UP') return context.formData;
        const { index } = event;
        const strengths = context.formData.strengths || [];
        if (index <= 0 || index >= strengths.length) return context.formData;
        const newStrengths = [...strengths];
        [newStrengths[index - 1], newStrengths[index]] = [newStrengths[index], newStrengths[index - 1]];
        return { ...context.formData, strengths: newStrengths };
      },
    }),
    moveStrengthDown: assign({
      formData: ({ context, event }) => {
        if (event.type !== 'MOVE_STRENGTH_DOWN') return context.formData;
        const { index } = event;
        const strengths = context.formData.strengths || [];
        if (index < 0 || index >= strengths.length - 1) return context.formData;
        const newStrengths = [...strengths];
        [newStrengths[index], newStrengths[index + 1]] = [newStrengths[index + 1], newStrengths[index]];
        return { ...context.formData, strengths: newStrengths };
      },
    }),
    updateConfusion: assign({
      formData: ({ context, event }) => {
        if (event.type !== 'UPDATE_CONFUSION') return context.formData;
        return { ...context.formData, confusion: event.confusion };
      },
    }),
    setLoading: assign({
      isLoading: true,
      error: null,
    }),
    clearLoading: assign({
      isLoading: false,
    }),
    setError: assign({
      error: ({ event }) => event.type === 'ERROR' ? event.message : null,
      isLoading: false,
    }),
    setBreakthroughResult: assign({
      resultData: ({ context, event }) => {
        if (event.type !== 'BREAKTHROUGH_SUCCESS') return context.resultData;
        return { ...context.resultData, breakthrough: event.result };
      },
      isLoading: false,
      isMockResult: ({ event }) => event.type === 'BREAKTHROUGH_SUCCESS' ? event.isMock : false,
      error: null,
    }),
    setGuideResult: assign({
      resultData: ({ context, event }) => {
        if (event.type !== 'GUIDE_SUCCESS') return context.resultData;
        return { ...context.resultData, guide: event.result };
      },
      isLoading: false,
      isMockResult: ({ event }) => event.type === 'GUIDE_SUCCESS' ? event.isMock : false,
      error: null,
    }),
    setCareerResult: assign({
      resultData: ({ context, event }) => {
        if (event.type !== 'CAREER_SUCCESS') return context.resultData;
        return { ...context.resultData, career: event.result };
      },
      isLoading: false,
      isMockResult: ({ event }) => event.type === 'CAREER_SUCCESS' ? event.isMock : false,
      error: null,
    }),
    setReportResult: assign({
      resultData: ({ context, event }) => {
        if (event.type !== 'REPORT_SUCCESS') return context.resultData;
        return { ...context.resultData, report: event.result };
      },
      isLoading: false,
      isMockResult: ({ event }) => event.type === 'REPORT_SUCCESS' ? event.isMock : false,
      error: null,
    }),
    clearResults: assign({
      resultData: {
        breakthrough: null,
        guide: null,
        career: null,
        report: null,
      },
    }),
    resetToInitial: assign({
      path: 'breakthrough',
      formData: { strengths: [], confusion: '' },
      resultData: { breakthrough: null, guide: null, career: null, report: null },
      isLoading: false,
      error: null,
      isMockResult: false,
    }),
  },
  guards: {
    canGoToStrengths: ({ context }) => {
      if (context.path === 'breakthrough') {
        return !!context.formData.scenario;
      }
      return true;
    },
    canSubmit: ({ context }) => {
      const strengths = context.formData.strengths || [];
      if (strengths.length < 3) return false;
      if (strengths.length > 5) return false;
      if (context.path === 'breakthrough' && !context.formData.confusion?.trim()) return false;
      return true;
    },
    canGoToInput: ({ context }) => {
      const strengths = context.formData.strengths || [];
      return strengths.length >= 3 && strengths.length <= 5;
    },
    hasBreakthroughResult: ({ context }) => context.resultData.breakthrough !== null,
    hasGuideResult: ({ context }) => context.resultData.guide !== null,
    hasCareerResult: ({ context }) => context.resultData.career !== null,
    hasReportResult: ({ context }) => context.resultData.report !== null,
  },
}).createMachine({
  id: 'flow',
  initial: 'landing',
  context: {
    path: 'breakthrough',
    formData: { strengths: [], confusion: '' },
    resultData: { breakthrough: null, guide: null, career: null, report: null },
    isLoading: false,
    error: null,
    isMockResult: false,
  },
  states: {
    landing: {
      on: {
        START: { target: 'path-selection' },
        SELECT_PATH: {
          target: 'strengths',
          actions: 'setPath',
          guard: ({ event }: { event: PathEvent }) => event.path !== 'report-interpret',
        },
        SELECT_PATH_report: {
          target: 'ocr-upload',
          actions: 'setPath',
          guard: ({ event }: { event: PathEvent }) => event.path === 'report-interpret',
        },
      },
    },
    'path-selection': {
      on: {
        SELECT_PATH: [
          {
            target: 'strengths',
            actions: 'setPath',
            guard: ({ event }: { event: PathEvent }) => event.path !== 'report-interpret',
          },
          {
            target: 'ocr-upload',
            actions: 'setPath',
            guard: ({ event }: { event: PathEvent }) => event.path === 'report-interpret',
          },
        ],
        BACK: { target: 'landing' },
      },
    },
    scenario: {
      on: {
        SELECT_SCENARIO: { actions: 'setScenario' },
        NEXT: { target: 'strengths' },
        BACK: { target: 'path-selection' },
      },
    },
    strengths: {
      on: {
        SELECT_STRENGTH: { actions: 'addStrength' },
        DESELECT_STRENGTH: { actions: 'removeStrength' },
        MOVE_STRENGTH_UP: { actions: 'moveStrengthUp' },
        MOVE_STRENGTH_DOWN: { actions: 'moveStrengthDown' },
        NEXT: {
          target: 'loading',
          actions: 'setLoading',
          guard: 'canGoToInput',
        },
        BACK: [
          { target: 'scenario', guard: ({ context }) => context.path === 'breakthrough' },
          { target: 'path-selection' },
        ],
      },
    },
    input: {
      on: {
        UPDATE_CONFUSION: { actions: 'updateConfusion' },
        SUBMIT: {
          target: 'loading',
          actions: 'setLoading',
          guard: 'canSubmit',
        },
        BACK: { target: 'strengths' },
      },
    },
    loading: {
      entry: 'setLoading',
      on: {
        BREAKTHROUGH_SUCCESS: {
          target: 'result',
          actions: 'setBreakthroughResult',
        },
        GUIDE_SUCCESS: {
          target: 'guide-result',
          actions: 'setGuideResult',
        },
        CAREER_SUCCESS: {
          target: 'career-result',
          actions: 'setCareerResult',
        },
        REPORT_SUCCESS: {
          target: 'report-result',
          actions: 'setReportResult',
        },
        ERROR: {
          target: 'input',
          actions: 'setError',
        },
        BACK: {
          target: 'input',
          actions: 'clearLoading',
        },
      },
    },
    result: {
      on: {
        REGENERATE: {
          target: 'input',
          actions: ['clearResults', 'clearLoading'],
        },
        BACK: {
          target: 'loading',
          actions: 'clearLoading',
        },
        RESET: { target: 'landing', actions: 'resetToInitial' },
      },
    },
    'guide-result': {
      on: {
        REGENERATE: {
          target: 'strengths',
          actions: ['clearResults', 'clearLoading'],
        },
        BACK: {
          target: 'loading',
          actions: 'clearLoading',
        },
        RESET: { target: 'landing', actions: 'resetToInitial' },
      },
    },
    'career-result': {
      on: {
        REGENERATE: {
          target: 'strengths',
          actions: ['clearResults', 'clearLoading'],
        },
        BACK: {
          target: 'loading',
          actions: 'clearLoading',
        },
        RESET: { target: 'landing', actions: 'resetToInitial' },
      },
    },
    'ocr-upload': {
      on: {
        REPORT_SUCCESS: {
          target: 'report-result',
          actions: 'setReportResult',
        },
        BACK: { target: 'path-selection' },
      },
    },
    'report-result': {
      on: {
        BACK: { target: 'ocr-upload' },
        RESET: { target: 'landing', actions: 'resetToInitial' },
      },
    },
  },
});

// ============================================================
// 状态类型导出（供 UI 使用）
// ============================================================

export type FlowState = typeof flowMachine;
export type FlowSnapshot = SnapshotFrom<typeof flowMachine>;

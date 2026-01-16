/**
 * Schema 测试
 *
 * 测试 schema.ts 中的类型和类型守卫
 */

import { describe, it, expect } from '@jest/globals';
import type {
  ApiResponse,
  ResultData,
  GuideResultData,
  CareerResultData,
  ReportResultData,
  ExplainData,
  DecideData,
  GallupResult,
  PathDecision,
} from '@/lib/schema';
import {
  isApiResponse,
  isValidResultData,
  extractResultData,
} from '@/lib/schema';

describe('Schema 测试', () => {
  describe('ApiResponse 类型', () => {
    it('应该接受有效的 API 响应', () => {
      const response: ApiResponse<{ value: string }> = {
        success: true,
        data: { value: 'test' },
      };
      expect(response.success).toBe(true);
      expect(response.data.value).toBe('test');
    });
  });

  describe('isApiResponse', () => {
    it('应该返回 true 给有效的 API 响应', () => {
      const response = {
        success: true,
        data: { value: 'test' },
      };
      expect(isApiResponse(response)).toBe(true);
    });

    it('应该返回 false 给无效的响应', () => {
      expect(isApiResponse(null)).toBe(false);
      expect(isApiResponse(undefined)).toBe(false);
      expect(isApiResponse({})).toBe(false);
      expect(isApiResponse({ success: false })).toBe(false);
      expect(isApiResponse({ success: true })).toBe(false);
    });
  });

  describe('ResultData 类型', () => {
    it('应该接受完整的 ResultData', () => {
      const result: ResultData = {
        explain: {
          strengthManifestations: [
            { strengthId: 'focus', behaviors: '你会专注做一件事' },
          ],
          strengthInteractions: '你的专注和分析在互相配合',
          blindspots: '你可能会过度分析',
          summary: '你是一个专注的人',
        },
        decide: {
          pathDecision: 'Narrow' as PathDecision,
          problemFocus: '如何确定优先级？',
          pathLogic: '基于你的优势组合...',
          pathReason: '因为...',
          doMore: [
            { action: '聚焦一件事', timing: '今天', criteria: '最重要的那件', consequence: '否则会分散精力' },
          ],
          doLess: [
            { action: '不再多任务', replacement: '单任务专注', timing: '立即' },
          ],
          boundaries: [
            { responsibleFor: '核心任务', notResponsibleFor: '次要任务' },
          ],
          checkRule: '今天是否只做了一件事？',
        },
        scenario: 'work-decision',
        strengths: ['focus', 'achiever'],
        isMock: true,
      };
      expect(result.explain).toBeDefined();
      expect(result.decide).toBeDefined();
      expect(result.isMock).toBe(true);
    });
  });

  describe('isValidResultData', () => {
    it('应该返回 true 给有效的 ResultData', () => {
      const data = {
        explain: {
          strengthManifestations: [{ strengthId: 'focus', behaviors: 'test' }],
          strengthInteractions: 'test',
          blindspots: 'test',
          summary: 'test',
        },
        decide: {
          pathDecision: 'Narrow',
          problemFocus: 'test?',
          pathLogic: 'test',
          pathReason: 'test',
          doMore: [{ action: 'test', timing: 'test', criteria: 'test', consequence: 'test' }],
          doLess: [{ action: 'test', replacement: 'test', timing: 'test' }],
          boundaries: [{ responsibleFor: 'test', notResponsibleFor: 'test' }],
          checkRule: 'test',
        },
      };
      expect(isValidResultData(data)).toBe(true);
    });

    it('应该返回 false 给 null', () => {
      expect(isValidResultData(null)).toBe(false);
    });
  });

  describe('extractResultData', () => {
    it('应该返回有效的 ResultData', () => {
      const data = {
        explain: {
          strengthManifestations: [{ strengthId: 'focus', behaviors: 'test' }],
          strengthInteractions: 'test',
          blindspots: 'test',
          summary: 'test',
        },
        decide: {
          pathDecision: 'Narrow',
          problemFocus: 'test?',
          pathLogic: 'test',
          pathReason: 'test',
          doMore: [{ action: 'test', timing: 'test', criteria: 'test', consequence: 'test' }],
          doLess: [{ action: 'test', replacement: 'test', timing: 'test' }],
          boundaries: [{ responsibleFor: 'test', notResponsibleFor: 'test' }],
          checkRule: 'test',
        },
      };
      const result = extractResultData(data);
      expect(result).not.toBeNull();
      expect(result?.explain).toBeDefined();
    });

    it('应该对 null 返回 null', () => {
      const result = extractResultData(null);
      expect(result).toBeNull();
    });
  });

  describe('ExplainData 类型', () => {
    it('应该接受有效的 ExplainData', () => {
      const explain: ExplainData = {
        strengthManifestations: [
          { strengthId: 'focus', behaviors: '你会专注做一件事' },
        ],
        strengthInteractions: '你的专注和分析在互相配合',
        blindspots: '你可能会过度分析',
        summary: '你是一个专注的人',
      };
      expect(explain.strengthManifestations).toHaveLength(1);
      expect(explain.strengthInteractions.length).toBeGreaterThan(0);
    });
  });

  describe('DecideData 类型', () => {
    it('应该接受有效的 DecideData', () => {
      const decide: DecideData = {
        pathDecision: 'Narrow',
        problemFocus: '如何确定优先级？',
        pathLogic: '基于你的优势组合...',
        pathReason: '因为...',
        doMore: [
          { action: '聚焦一件事', timing: '今天', criteria: '最重要的那件', consequence: '否则会分散精力' },
        ],
        doLess: [
          { action: '不再多任务', replacement: '单任务专注', timing: '立即' },
        ],
        boundaries: [
          { responsibleFor: '核心任务', notResponsibleFor: '次要任务' },
        ],
        checkRule: '今天是否只做了一件事？',
      };
      expect(decide.pathDecision).toBe('Narrow');
      expect(decide.doMore).toHaveLength(1);
      expect(decide.doLess).toHaveLength(1);
    });
  });

  describe('GallupResult 类型', () => {
    it('应该接受有效的 GallupResult', () => {
      const result: GallupResult = {
        explain: {
          strengthManifestations: [{ strengthId: 'focus', behaviors: 'test' }],
          strengthInteractions: 'test',
          blindspots: 'test',
          summary: 'test',
        },
        decide: {
          pathDecision: 'Narrow',
          problemFocus: 'test?',
          pathLogic: 'test',
          pathReason: 'test',
          doMore: [{ action: 'test', timing: 'test', criteria: 'test', consequence: 'test' }],
          doLess: [{ action: 'test', replacement: 'test', timing: 'test' }],
          boundaries: [{ responsibleFor: 'test', notResponsibleFor: 'test' }],
          checkRule: 'test',
        },
      };
      expect(result.explain).toBeDefined();
      expect(result.decide).toBeDefined();
    });
  });
});

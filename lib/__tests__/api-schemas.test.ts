/**
 * API Schema 测试
 * 
 * 验证：
 * 1. 有效的请求能通过校验
 * 2. 无效的请求被正确拒绝
 * 3. 错误信息清晰易懂
 */

import {
  GenerateRequestSchema,
  GuideRequestSchema,
  CareerRequestSchema,
  InterpretRequestSchema,
  validateRequest,
  formatValidationError,
  type GenerateRequest,
  type GuideRequest,
} from '../api-schemas';

describe('API Schemas', () => {
  describe('GenerateRequestSchema', () => {
    it('should accept valid generate request', () => {
      const validData = {
        scenario: 'work-decision',
        strengths: ['focus', 'belief', 'consistency'],
        confusion: 'I am confused about my career path and what to do next',
        locale: 'zh',
      };

      const result = validateRequest(GenerateRequestSchema, validData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.scenario).toBe('work-decision');
        expect(result.data.strengths).toHaveLength(3);
      }
    });

    it('should require confusion to be at least 10 characters', () => {
      const invalidData = {
        scenario: 'work-decision',
        strengths: ['focus', 'belief', 'consistency'],
        confusion: 'short',
        locale: 'zh',
      };

      const result = validateRequest(GenerateRequestSchema, invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors.some((e) => String(e.path).includes('confusion'))).toBe(true);
      }
    });

    it('should require 3-5 strengths', () => {
      const tooFew = {
        scenario: 'work-decision',
        strengths: ['focus', 'belief'],
        confusion: 'I am very confused about what to do',
        locale: 'zh',
      };

      const result = validateRequest(GenerateRequestSchema, tooFew);

      expect(result.success).toBe(false);
    });

    it('should reject invalid strength IDs', () => {
      const invalidData = {
        scenario: 'work-decision',
        strengths: ['invalid-id', 'belief', 'consistency'],
        confusion: 'I am very confused about what to do',
        locale: 'zh',
      };

      const result = validateRequest(GenerateRequestSchema, invalidData);

      expect(result.success).toBe(false);
    });

    it('should support optional problemType and problemFocus', () => {
      const dataWithOptionals = {
        scenario: 'work-decision',
        strengths: ['focus', 'belief', 'consistency'],
        confusion: 'I am very confused about what to do',
        problemType: 'P1' as const,
        problemFocus: 'How can I make a decision?',
        locale: 'zh',
      };

      const result = validateRequest(GenerateRequestSchema, dataWithOptionals);

      expect(result.success).toBe(true);
    });

    it('should provide detailed error messages', () => {
      const invalidData = {
        scenario: 'work-decision',
        strengths: ['focus', 'belief'],
        confusion: 'I am very confused',
        locale: 'zh',
      };

      const result = validateRequest(GenerateRequestSchema, invalidData);

      if (!result.success) {
        const formatted = formatValidationError(result.errors);
        expect(formatted.error).toBe('Request validation failed');
        expect(formatted.details.length).toBeGreaterThan(0);
        expect(formatted.details[0]).toHaveProperty('field');
        expect(formatted.details[0]).toHaveProperty('message');
      }
    });
  });

  describe('GuideRequestSchema', () => {
    it('should accept valid guide request', () => {
      const validData = {
        strengths: ['focus', 'belief', 'consistency'],
        locale: 'en',
      };

      const result = validateRequest(GuideRequestSchema, validData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.locale).toBe('en');
      }
    });

    it('should require 3-5 strengths for guide', () => {
      const onlyOne = {
        strengths: ['focus'],
        locale: 'zh',
      };

      const result = validateRequest(GuideRequestSchema, onlyOne);

      expect(result.success).toBe(false);
    });

    it('should default locale to zh', () => {
      const dataWithoutLocale = {
        strengths: ['focus', 'belief', 'consistency'],
      };

      const result = validateRequest(GuideRequestSchema, dataWithoutLocale);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.locale).toBe('zh');
      }
    });
  });

  describe('CareerRequestSchema', () => {
    it('should accept valid career request', () => {
      const validData = {
        strengths: ['focus', 'belief', 'consistency'],
        locale: 'zh',
      };

      const result = validateRequest(CareerRequestSchema, validData);

      expect(result.success).toBe(true);
    });

    it('should reject if strengths is empty', () => {
      const emptyStrengths = {
        strengths: [],
        locale: 'zh',
      };

      const result = validateRequest(CareerRequestSchema, emptyStrengths);

      expect(result.success).toBe(false);
    });
  });

  describe('InterpretRequestSchema', () => {
    it('should accept valid interpret request', () => {
      const validData = {
        strengths: [
          { rank: 1, name: '专注', domain: '执行力' },
          { rank: 2, name: '信仰', domain: '执行力' },
          { rank: 3, name: '公平', domain: '执行力' },
        ],
        useAi: true,
        locale: 'zh',
      };

      const result = validateRequest(InterpretRequestSchema, validData);

      expect(result.success).toBe(true);
    });

    it('should validate rank is between 1-5', () => {
      const invalidRank = {
        strengths: [
          { rank: 0, name: '专注', domain: '执行力' },
          { rank: 2, name: '信仰', domain: '执行力' },
        ],
        locale: 'zh',
      };

      const result = validateRequest(InterpretRequestSchema, invalidRank);

      expect(result.success).toBe(false);
    });

    it('should default useAi to true', () => {
      const dataWithoutUseAi = {
        strengths: [
          { rank: 1, name: '专注', domain: '执行力' },
          { rank: 2, name: '信仰', domain: '执行力' },
          { rank: 3, name: '公平', domain: '执行力' },
        ],
        locale: 'zh',
      };

      const result = validateRequest(InterpretRequestSchema, dataWithoutUseAi);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.useAi).toBe(true);
      }
    });
  });

  describe('formatValidationError', () => {
    it('should format errors with field names', () => {
      const validData = {
        scenario: 'work-decision',
        strengths: ['focus'],
        confusion: 'short',
        locale: 'zh',
      };

      const result = validateRequest(GenerateRequestSchema, validData);

      if (!result.success) {
        const formatted = formatValidationError(result.errors);
        expect(formatted.error).toBe('Request validation failed');
        expect(formatted.details.length).toBeGreaterThan(0);
        expect(formatted.details[0]).toHaveProperty('field');
        expect(formatted.details[0].field).not.toBe('body');
      }
    });
  });
});

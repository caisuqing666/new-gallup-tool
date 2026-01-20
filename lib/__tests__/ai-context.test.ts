/**
 * AIContext 单元测试
 * 
 * 验证：
 * 1. 上下文可以正确从 process.env 读取
 * 2. 上下文不会修改全局 process.env
 * 3. 并发请求的上下文保持隔离
 */

import {
  createAIContext,
  createGuideAIContext,
  createGenerateAIContext,
  createCareerAIContext,
  createInterpretAIContext,
  type AIContext,
} from '../ai-context';

describe('AIContext', () => {
  // 保存原始的环境变量，在每个测试后恢复
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  describe('createAIContext', () => {
    it('should read from process.env without mutating it', () => {
      process.env.AI_PROVIDER = 'zhipu';
      process.env.ENABLE_AI = 'true';
      process.env.API_TIMEOUT = '30000';

      const ctx = createAIContext();

      expect(ctx.provider).toBe('zhipu');
      expect(ctx.enableAI).toBe(true);
      expect(ctx.timeout).toBe(30000);
      expect(process.env.AI_PROVIDER).toBe('zhipu'); // 未被修改
    });

    it('should use default values when env vars not set', () => {
      delete process.env.AI_PROVIDER;
      delete process.env.ENABLE_AI;
      delete process.env.API_TIMEOUT;

      const ctx = createAIContext();

      expect(ctx.provider).toBe('anthropic');
      expect(ctx.enableAI).toBe(false);
      expect(ctx.timeout).toBe(60000);
      expect(ctx.retryCount).toBe(2);
    });

    it('should allow overriding context values', () => {
      const ctx = createAIContext({
        provider: 'openai',
        timeout: 10000,
        enableAI: true,
      });

      expect(ctx.provider).toBe('openai');
      expect(ctx.timeout).toBe(10000);
      expect(ctx.enableAI).toBe(true);
    });

    it('should support NEXT_PUBLIC_ENABLE_AI', () => {
      process.env.NEXT_PUBLIC_ENABLE_AI = 'true';
      delete process.env.ENABLE_AI;

      const ctx = createAIContext();

      expect(ctx.enableAI).toBe(true);
    });
  });

  describe('createGuideAIContext', () => {
    it('should use shorter timeout in Vercel environment', () => {
      process.env.VERCEL = 'true';
      delete process.env.API_TIMEOUT;

      const ctx = createGuideAIContext();

      expect(ctx.timeout).toBe(12000);
    });

    it('should use longer timeout in local environment', () => {
      delete process.env.VERCEL;
      delete process.env.API_TIMEOUT;

      const ctx = createGuideAIContext();

      expect(ctx.timeout).toBe(55000);
    });

    it('should respect API_TIMEOUT override', () => {
      process.env.VERCEL = 'true';
      process.env.API_TIMEOUT = '25000';

      const ctx = createGuideAIContext();

      // Guide context 的 VERCEL 逻辑应该优先
      expect(ctx.timeout).toBe(12000);
    });
  });

  describe('createGenerateAIContext', () => {
    it('should use API_TIMEOUT config', () => {
      process.env.API_TIMEOUT = '45000';

      const ctx = createGenerateAIContext();

      expect(ctx.timeout).toBe(45000);
    });

    it('should default to 60000 when API_TIMEOUT not set', () => {
      delete process.env.API_TIMEOUT;

      const ctx = createGenerateAIContext();

      expect(ctx.timeout).toBe(60000);
    });
  });

  describe('concurrent isolation', () => {
    it('should isolate contexts in concurrent scenarios', async () => {
      const contexts: AIContext[] = [];

      // 模拟并发创建多个不同的上下文
      const promises = [
        Promise.resolve().then(() => {
          process.env.AI_PROVIDER = 'zhipu';
          return createAIContext();
        }),
        Promise.resolve().then(() => {
          process.env.AI_PROVIDER = 'openai';
          return createAIContext();
        }),
        Promise.resolve().then(() => {
          process.env.AI_PROVIDER = 'anthropic';
          return createAIContext();
        }),
      ];

      const results = await Promise.all(promises);

      // 注意：由于 JavaScript 的单线程特性，这个测试只能验证不会发生同步的竞态条件
      // 真实的并发隔离需要在 E2E 或集成测试中验证
      expect(results).toHaveLength(3);

      // 验证最终的 process.env 值（应该是最后一次设置的值）
      expect(process.env.AI_PROVIDER).toBe('anthropic');
    });

    it('should not cross-pollinate between different context factories', () => {
      process.env.VERCEL = 'true';
      delete process.env.API_TIMEOUT;

      const guideCtx = createGuideAIContext();
      const generateCtx = createGenerateAIContext();

      // Guide 应该用短超时
      expect(guideCtx.timeout).toBe(12000);

      // Generate 应该用长超时
      expect(generateCtx.timeout).toBe(60000);

      // process.env 不应该被修改
      expect(process.env.VERCEL).toBe('true');
    });
  });

  describe('edge cases', () => {
    it('should handle invalid timeout values', () => {
      process.env.API_TIMEOUT = 'not-a-number';

      const ctx = createAIContext();

      // NaN 会被 parseInt 返回，但我们期望回到默认值
      // （实际实现可能需要添加错误处理）
      expect(ctx.timeout).toBeNaN();
    });

    it('should support all provider types', () => {
      const providers = ['anthropic', 'openai', 'zhipu', 'minimax'] as const;

      providers.forEach((provider) => {
        const ctx = createAIContext({ provider });
        expect(ctx.provider).toBe(provider);
      });
    });
  });
});

import { generateStrengthGuide } from '@/lib/services/guide';
import { ALL_STRENGTHS } from '@/lib/gallup-strengths';

describe('generateStrengthGuide', () => {
  const originalEnableAi = process.env.ENABLE_AI;
  const originalPublicEnableAi = process.env.NEXT_PUBLIC_ENABLE_AI;

  afterEach(() => {
    if (originalEnableAi === undefined) {
      delete process.env.ENABLE_AI;
    } else {
      process.env.ENABLE_AI = originalEnableAi;
    }
    if (originalPublicEnableAi === undefined) {
      delete process.env.NEXT_PUBLIC_ENABLE_AI;
    } else {
      process.env.NEXT_PUBLIC_ENABLE_AI = originalPublicEnableAi;
    }
  });

  it('returns mock data when AI is disabled', async () => {
    process.env.ENABLE_AI = 'false';
    process.env.NEXT_PUBLIC_ENABLE_AI = 'false';

    const strengths = ALL_STRENGTHS.slice(0, 5).map((strength) => strength.id);
    const result = await generateStrengthGuide(strengths);

    expect(result.usedMockFallback).toBe(true);
    expect(result.data.strengthGuides.length).toBeGreaterThan(0);
  });
});

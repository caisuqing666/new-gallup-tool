import type { ScenarioId, StrengthId, ProblemFocus, ProblemType } from '../types';
import type { GenerateResult, ProviderConfig } from '../services/action-plan';
import { generateActionPlan } from '../services/action-plan';

export type DiagnosisPath = 'breakthrough';

export interface DiagnosisRequest {
  path: DiagnosisPath;
  scenario: ScenarioId;
  strengths: StrengthId[];
  confusion: string;
  problemType?: ProblemType;
  problemFocus?: ProblemFocus;
  provider?: ProviderConfig;
  locale?: 'zh' | 'en';
}

export async function runDiagnosis(request: DiagnosisRequest): Promise<GenerateResult> {
  switch (request.path) {
    case 'breakthrough':
      return generateActionPlan({
        scenario: request.scenario,
        strengths: request.strengths,
        confusion: request.confusion,
        problemType: request.problemType,
        problemFocus: request.problemFocus,
        provider: request.provider,
        locale: request.locale,
      });
    default:
      throw new Error(`Unsupported diagnosis path: ${request.path}`);
  }
}

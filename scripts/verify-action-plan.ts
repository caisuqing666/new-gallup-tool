process.env.ENABLE_AI = 'false';

import { generateActionPlan } from '../lib/services/action-plan';

(async () => {
  const result = await generateActionPlan({
    scenario: 'work-decision',
    strengths: ['focus', 'responsibility'],
    confusion: '工作太忙',
  });

  console.log(result.metadata);
})();

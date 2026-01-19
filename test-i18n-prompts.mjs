/**
 * 多语言 Prompt 测试
 * 验证中文和英文 Prompt 生成是否正确
 */

import { buildPrompt } from './dist/lib/prompts.js';

console.log('\n═══════════════════════════════════════════════════════════');
console.log('🌍 多语言 Prompt 生成测试');
console.log('═══════════════════════════════════════════════════════════\n');

try {
  // 测试中文 Prompt
  console.log('📝 测试 1: 中文 Prompt (locale: "zh")');
  console.log('─────────────────────────────────────────────────────────\n');

  const zhConfig = {
    pathType: 'breakthrough-explain',
    params: {
      strengths: ['focus', 'achiever'],
      confusion: '我不知道应该在当前岗位深挖，还是寻求新的发展方向。',
      problemType: 'DIRECTION_UNCERTAINTY',
      problemFocus: '要不要转换职业方向',
      locale: 'zh'
    }
  };

  const zhPrompt = buildPrompt(zhConfig);

  console.log('✓ 中文 System Prompt 生成成功');
  console.log(`  长度: ${zhPrompt.systemPrompt.length} 字符`);
  console.log(`  包含「硬约束」: ${zhPrompt.systemPrompt.includes('硬约束') ? '✓' : '✗'}`);
  console.log(`  包含【: ${zhPrompt.systemPrompt.includes('【') ? '✓' : '✗'}`);
  console.log(`\n  首 150 字:\n  ${zhPrompt.systemPrompt.substring(0, 150)}...\n`);

  // 测试英文 Prompt
  console.log('📝 测试 2: 英文 Prompt (locale: "en")');
  console.log('─────────────────────────────────────────────────────────\n');

  const enConfig = {
    pathType: 'breakthrough-explain',
    params: {
      strengths: ['focus', 'achiever'],
      confusion: '我不知道应该在当前岗位深挖，还是寻求新的发展方向。',
      problemType: 'DIRECTION_UNCERTAINTY',
      problemFocus: '要不要转换职业方向',
      locale: 'en'
    }
  };

  const enPrompt = buildPrompt(enConfig);

  console.log('✓ 英文 System Prompt 生成成功');
  console.log(`  长度: ${enPrompt.systemPrompt.length} 字符`);
  console.log(`  包含 strength: ${enPrompt.systemPrompt.toLowerCase().includes('strength') ? '✓' : '✗'}`);
  console.log(`  不包含【: ${!enPrompt.systemPrompt.includes('【') ? '✓' : '✗'}`);
  console.log(`\n  首 150 字:\n  ${enPrompt.systemPrompt.substring(0, 150)}...\n`);

  // 对比验证
  console.log('📊 测试 3: 对比验证');
  console.log('─────────────────────────────────────────────────────────\n');

  const isDifferent = zhPrompt.systemPrompt !== enPrompt.systemPrompt;
  const zhHasChinese = zhPrompt.systemPrompt.includes('硬约束');
  const enHasEnglish = enPrompt.systemPrompt.toLowerCase().includes('strength') ||
                       enPrompt.systemPrompt.includes('System');
  const noChineseInEn = !enPrompt.systemPrompt.includes('【');

  console.log(`✓ 中英文 Prompt 内容不同: ${isDifferent ? '是' : '否'}`);
  console.log(`✓ 中文 Prompt 包含中文约束: ${zhHasChinese ? '是' : '否'}`);
  console.log(`✓ 英文 Prompt 包含英文内容: ${enHasEnglish ? '是' : '否'}`);
  console.log(`✓ 英文 Prompt 不包含中文符号: ${noChineseInEn ? '是' : '否'}\n`);

  if (isDifferent && zhHasChinese && enHasEnglish && noChineseInEn) {
    console.log('═══════════════════════════════════════════════════════════');
    console.log('✅ 所有测试通过！多语言 Prompt 生成正确！');
    console.log('═══════════════════════════════════════════════════════════\n');
    process.exit(0);
  } else {
    console.log('═══════════════════════════════════════════════════════════');
    console.log('❌ 某些测试未通过！');
    console.log('═══════════════════════════════════════════════════════════\n');
    process.exit(1);
  }

} catch (error) {
  console.error('\n❌ 测试失败:', error.message);
  console.error('详细错误:', error);
  process.exit(1);
}

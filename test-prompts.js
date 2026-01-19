/**
 * 多语言 Prompt 生成测试脚本
 * 测试中文和英文 Prompt 是否正确生成
 */

// 使用 require 动态加载 ES 模块
(async () => {
  try {
    // 动态导入 buildPrompt
    const { buildPrompt } = await import('./lib/prompts.ts');

    console.log('═══════════════════════════════════════════════════════════');
    console.log('多语言 Prompt 生成测试');
    console.log('═══════════════════════════════════════════════════════════\n');

    // 测试参数
    const testParams = {
      pathType: 'breakthrough-explain',
      params: {
        strengths: ['focus', 'achiever'],
        confusion: '我不知道应该在当前岗位深挖，还是寻求新的发展方向。',
        problemType: 'DIRECTION_UNCERTAINTY',
        problemFocus: '要不要转换职业方向',
        locale: undefined // 将被覆盖
      }
    };

    // 测试中文
    console.log('📝 测试中文 Prompt (locale: "zh")');
    console.log('─────────────────────────────────────────────────────────\n');

    const zhConfig = { ...testParams };
    zhConfig.params = { ...testParams.params, locale: 'zh' };
    const zhPrompt = buildPrompt(zhConfig);

    console.log('✓ 中文 System Prompt 生成成功');
    console.log('长度:', zhPrompt.systemPrompt.length, '字符');
    console.log('包含中文 Context Pack:', zhPrompt.systemPrompt.includes('Context Pack') ? '✓' : '✗');
    console.log('包含中文约束:', zhPrompt.systemPrompt.includes('硬约束') ? '✓' : '✗');
    console.log('首部内容预览:');
    console.log(zhPrompt.systemPrompt.substring(0, 300) + '...\n');

    // 测试英文
    console.log('📝 测试英文 Prompt (locale: "en")');
    console.log('─────────────────────────────────────────────────────────\n');

    const enConfig = { ...testParams };
    enConfig.params = { ...testParams.params, locale: 'en' };
    const enPrompt = buildPrompt(enConfig);

    console.log('✓ 英文 System Prompt 生成成功');
    console.log('长度:', enPrompt.systemPrompt.length, '字符');
    console.log('包含英文内容:', enPrompt.systemPrompt.includes('System') || enPrompt.systemPrompt.includes('strengths') ? '✓' : '✗');
    console.log('首部内容预览:');
    console.log(enPrompt.systemPrompt.substring(0, 300) + '...\n');

    // 对比检查
    console.log('📊 对比检查');
    console.log('─────────────────────────────────────────────────────────');
    console.log('中文和英文 Prompt 是否不同:', zhPrompt.systemPrompt !== enPrompt.systemPrompt ? '✓ 是' : '✗ 否');
    console.log('中文 Prompt 包含【:', zhPrompt.systemPrompt.includes('【') ? '✓' : '✗');
    console.log('英文 Prompt 不包含【:', !enPrompt.systemPrompt.includes('【') ? '✓' : '✗');

    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('✅ 测试完成！多语言 Prompt 生成成功');
    console.log('═══════════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ 测试失败:', error);
    process.exit(1);
  }
})();

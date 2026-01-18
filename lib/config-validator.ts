// 环境变量配置验证
// 用于在启动时检查环境变量配置是否正确

interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  config: {
    aiEnabled: boolean;
    aiProvider?: string;
    hasApiKey?: boolean;
    model?: string;
  };
}

/**
 * 验证环境变量配置
 */
export function validateConfig(): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // 检查 AI 配置
  const aiEnabled = process.env.ENABLE_AI === 'true' || process.env.NEXT_PUBLIC_ENABLE_AI === 'true';
  const aiProvider = process.env.AI_PROVIDER || 'zhipu';
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;
  const zhipuKey = process.env.ZHIPU_API_KEY || process.env.GLMS_API_KEY;
  const minimaxKey = process.env.MINIMAX_API_KEY;
  const minimaxGroupId = process.env.MINIMAX_GROUP_ID;

  if (aiEnabled) {
    // AI 启用时，必须有至少一个 API Key
    if (!anthropicKey && !openaiKey && !zhipuKey && !minimaxKey) {
      errors.push(
        'AI 已启用（ENABLE_AI=true），但未配置 API Key。' +
        '请在 .env.local 中设置 ZHIPU_API_KEY、ANTHROPIC_API_KEY、OPENAI_API_KEY 或 MINIMAX_API_KEY，' +
        '或设置 ENABLE_AI=false 使用 Mock 数据'
      );
    }

    // 检查指定的提供商是否有 API Key
    if (aiProvider === 'anthropic' && !anthropicKey) {
      if (openaiKey || zhipuKey || minimaxKey) {
        warnings.push(
          '指定了 AI_PROVIDER=anthropic，但未设置 ANTHROPIC_API_KEY。' +
          '将使用其他已配置的提供商作为备用方案。'
        );
      } else {
        errors.push(
          '指定了 AI_PROVIDER=anthropic，但未设置 ANTHROPIC_API_KEY。' +
          '请在 .env.local 中设置 ANTHROPIC_API_KEY，或切换到其他提供商。'
        );
      }
    }

    if (aiProvider === 'openai' && !openaiKey) {
      if (anthropicKey || zhipuKey || minimaxKey) {
        warnings.push(
          '指定了 AI_PROVIDER=openai，但未设置 OPENAI_API_KEY。' +
          '将使用其他已配置的提供商作为备用方案。'
        );
      } else {
        errors.push(
          '指定了 AI_PROVIDER=openai，但未设置 OPENAI_API_KEY。' +
          '请在 .env.local 中设置 OPENAI_API_KEY，或切换到其他提供商。'
        );
      }
    }

    if (aiProvider === 'zhipu' && !zhipuKey) {
      if (anthropicKey || openaiKey || minimaxKey) {
        warnings.push(
          '指定了 AI_PROVIDER=zhipu，但未设置 ZHIPU_API_KEY。' +
          '将使用其他已配置的提供商作为备用方案。'
        );
      } else {
        errors.push(
          '指定了 AI_PROVIDER=zhipu，但未设置 ZHIPU_API_KEY。' +
          '请在 .env.local 中设置 ZHIPU_API_KEY，或切换到其他提供商。'
        );
      }
    }

    if (aiProvider === 'minimax' && !minimaxKey) {
      if (anthropicKey || openaiKey || zhipuKey) {
        warnings.push(
          '指定了 AI_PROVIDER=minimax，但未设置 MINIMAX_API_KEY。' +
          '将使用其他已配置的提供商作为备用方案。'
        );
      } else {
        errors.push(
          '指定了 AI_PROVIDER=minimax，但未设置 MINIMAX_API_KEY。' +
          '请在 .env.local 中设置 MINIMAX_API_KEY，或切换到其他提供商。'
        );
      }
    }

    if (aiProvider === 'minimax' && minimaxKey && !minimaxGroupId) {
      errors.push(
        '指定了 AI_PROVIDER=minimax，但未设置 MINIMAX_GROUP_ID。' +
        '请在 .env.local 中设置 MINIMAX_GROUP_ID。'
      );
    }

    // 检查模型配置
    if (aiProvider === 'anthropic' && anthropicKey) {
      const model = process.env.ANTHROPIC_MODEL;
      const validModels = [
        'claude-3-5-sonnet-20241022',
        'claude-3-opus-20240229',
        'claude-3-haiku-20240307',
      ];
      if (model && !validModels.includes(model)) {
        warnings.push(
          `ANTHROPIC_MODEL="${model}" 不是有效值。` +
          `有效值: ${validModels.join(', ')}。将使用默认模型。`
        );
      }
    }

    if (aiProvider === 'openai' && openaiKey) {
      const model = process.env.OPENAI_MODEL;
      const validModels = ['gpt-4o', 'gpt-4-turbo', 'gpt-3.5-turbo'];
      if (model && !validModels.includes(model)) {
        warnings.push(
          `OPENAI_MODEL="${model}" 不是有效值。` +
          `有效值: ${validModels.join(', ')}。将使用默认模型。`
        );
      }
    }

    if (aiProvider === 'zhipu' && zhipuKey) {
      const model = process.env.ZHIPU_MODEL;
      const validModels = ['glm-4-plus', 'glm-4', 'glm-4-air', 'glm-4-flash'];
      if (model && !validModels.includes(model)) {
        warnings.push(
          `ZHIPU_MODEL="${model}" 不是有效值。` +
          `有效值: ${validModels.join(', ')}。将使用默认模型。`
        );
      }
    }

    if (aiProvider === 'minimax' && minimaxKey) {
      const model = process.env.MINIMAX_MODEL;
      const validModels = ['abab6.5-chat'];
      if (model && !validModels.includes(model)) {
        warnings.push(
          `MINIMAX_MODEL="${model}" 不是有效值。` +
          `有效值: ${validModels.join(', ')}。将使用默认模型。`
        );
      }
    }
  }

  // 检查应用 URL
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (appUrl && !appUrl.startsWith('http')) {
    warnings.push(
      'NEXT_PUBLIC_APP_URL 应该以 http:// 或 https:// 开头'
    );
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    config: {
      aiEnabled,
      aiProvider: aiEnabled ? aiProvider : undefined,
      hasApiKey: aiEnabled ? !!(anthropicKey || openaiKey || zhipuKey || minimaxKey) : undefined,
      model: aiProvider === 'anthropic'
        ? process.env.ANTHROPIC_MODEL
        : aiProvider === 'openai'
          ? process.env.OPENAI_MODEL
          : aiProvider === 'zhipu'
            ? process.env.ZHIPU_MODEL
            : process.env.MINIMAX_MODEL,
    },
  };
}

/**
 * 打印配置信息（开发环境）
 */
export function printConfigInfo(): void {
  if (process.env.NODE_ENV !== 'development') {
    return;
  }

  console.log('\n📋 Gallup Tool 配置信息');
  console.log('='.repeat(40));

  const validation = validateConfig();
  
  console.log(`✓ AI 生成: ${validation.config.aiEnabled ? '已启用' : '未启用（使用 Mock 数据）'}`);
  
  if (validation.config.aiEnabled) {
    console.log(`✓ AI 提供商: ${validation.config.aiProvider}`);
    console.log(`✓ API Key: ${validation.config.hasApiKey ? '已配置' : '未配置'}`);
    if (validation.config.model) {
      console.log(`✓ 模型: ${validation.config.model}`);
    }
  }

  if (validation.warnings.length > 0) {
    console.log('\n⚠️  警告:');
    validation.warnings.forEach(warning => console.log(`  - ${warning}`));
  }

  if (validation.errors.length > 0) {
    console.log('\n❌ 配置错误:');
    validation.errors.forEach(error => console.log(`  - ${error}`));
  }

  console.log('='.repeat(40) + '\n');
}

/**
 * 在客户端获取配置信息（仅公开信息）
 */
export function getPublicConfig(): {
  aiEnabled: boolean;
  appUrl?: string;
} {
  return {
    aiEnabled: process.env.NEXT_PUBLIC_ENABLE_AI === 'true',
    appUrl: process.env.NEXT_PUBLIC_APP_URL,
  };
}

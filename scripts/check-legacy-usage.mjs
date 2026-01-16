#!/usr/bin/env node
/**
 * CI 检查脚本：检测新代码是否使用了 legacy 类型
 *
 * 检查规则：
 * - ResultData 类型只能从 legacy 目录引用
 * - 新代码必须使用 ExplainData + DecideData + GallupResult
 *
 * 使用方式：
 *   node scripts/check-legacy-usage.mjs [--fix]
 *
 * 选项：
 *   --fix  自动修复：标记违规行为为警告而非错误
 */

import { readFileSync } from 'fs';
import { relative } from 'path';
import glob from 'glob';

const LEGACY_DIR = 'app/components/legacy';
const LEGACY_FILES = new Set([
  'lib/schema.ts',
]);

const LEGACY_TYPES = [
  'ResultData',
];

const IGNORE_PATTERNS = [
  '**/node_modules/**',
  '**/.next/**',
  '**/dist/**',
];

const args = process.argv.slice(2);
const fixMode = args.includes('--fix');

function getSourceFiles() {
  const patterns = ['app/**/*.{ts,tsx}', 'lib/**/*.{ts,tsx}', 'scripts/**/*.{ts,tsx}'];
  let files = [];
  for (const pattern of patterns) {
    files = files.concat(glob.sync(pattern, { ignore: IGNORE_PATTERNS }));
  }
  return [...new Set(files)].sort();
}

function isLegacyFile(filePath) {
  return filePath.startsWith(LEGACY_DIR + '/') || LEGACY_FILES.has(filePath);
}

function detectLegacyUsage(filePath) {
  const content = readFileSync(filePath, 'utf-8');
  const violations = [];

  for (const type of LEGACY_TYPES) {
    const importRegex = new RegExp(`import\\s+.*\\b${type}\\b.*from\\s+['"](.*)['"]`, 'g');
    let match;

    while ((match = importRegex.exec(content)) !== null) {
      const importPath = match[1];
      if (importPath === '@/lib/schema' || importPath === '@/lib/types') {
        violations.push({
          type,
          line: content.substring(0, match.index).split('\n').length,
          importPath,
          message: `从 ${importPath} 导入了已废弃的 ${type} 类型`,
        });
      }
    }

    const usageRegex = new RegExp(`\\b${type}\\b`, 'g');
    while ((match = usageRegex.exec(content)) !== null) {
      const lineNum = content.substring(0, match.index).split('\n').length;
      const lineStart = content.lastIndexOf('\n', match.index) + 1;
      const lineEnd = content.indexOf('\n', match.index);
      const line = content.substring(lineStart, lineEnd);

      if (!line.includes('import')) {
        if (!violations.some(v => v.line === lineNum && v.type === type)) {
          violations.push({
            type,
            line: lineNum,
            importPath: null,
            message: `使用了已废弃的 ${type} 类型`,
          });
        }
      }
    }
  }

  return violations;
}

function main() {
  console.log('🔍 检查 legacy 类型使用情况...\n');

  const files = getSourceFiles();
  const allViolations = [];

  for (const file of files) {
    const isLegacy = isLegacyFile(file);
    const violations = detectLegacyUsage(file);

    if (violations.length > 0 && !isLegacy) {
      allViolations.push({
        file,
        relativePath: relative(process.cwd(), file),
        violations,
      });
    }
  }

  if (allViolations.length === 0) {
    console.log('✅ 未发现 legacy 类型的违规使用');
    console.log('   - 所有新代码正确使用了 ExplainData + DecideData + GallupResult');
    process.exit(0);
  }

  console.log('⚠️  发现 legacy 类型的违规使用：\n');

  for (const { file, relativePath, violations } of allViolations) {
    console.log(`📁 ${relativePath}`);
    for (const v of violations) {
      console.log(`   L${v.line}: ${v.message}`);
    }
    console.log('');
  }

  const summary = {
    files: allViolations.length,
    violations: allViolations.reduce((sum, f) => sum + f.violations.length, 0),
  };

  console.log(`📊 总计: ${summary.violations} 处违规，涉及 ${summary.files} 个文件\n`);

  if (fixMode) {
    console.log('ℹ️  运行于 --fix 模式，已标记为警告');
    console.log('   请将这些文件中的 ResultData 迁移到 ExplainData + DecideData');
    process.exit(0);
  } else {
    console.log('❌ 请将新代码中的 ResultData 迁移到 ExplainData + DecideData');
    console.log('   legacy 目录下的文件不受此限制');
    console.log('');
    console.log('💡 提示：可以使用 --fix 模式将违规标记为警告');
    process.exit(1);
  }
}

main();

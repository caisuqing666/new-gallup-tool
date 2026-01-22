/**
 * Tesseract.js OCR 服务
 * 在浏览器中进行 OCR 识别
 */

import Tesseract from 'tesseract.js';
import { StrengthId, ALL_STRENGTHS } from './gallup-strengths';

// 盖洛普 34 个优势的完整列表
const GALLUP_STRENGTHS = [
  '专注', '信仰', '公平', '审慎', '成就', '排难', '纪律', '统筹', '责任',
  '取悦', '完美', '沟通', '竞争', '统率', '自信', '行动', '追求',
  '个别', '交往', '伯乐', '体谅', '关联', '包容', '和谐', '积极', '适应',
  '分析', '前瞻', '回顾', '学习', '思维', '战略', '搜集', '理念'
];

/**
 * OCR 识别结果接口
 */
export interface OcrResult {
  success: boolean;
  top5: string[];
  top5Ids: StrengthId[];
  allText: string;
  confidence: number;
}

export type OcrMode = 'client' | 'server' | 'auto';

/**
 * 从文本中提取 TOP5 优势
 */
function extractTop5FromText(text: string): string[] {
  const foundStrengths: string[] = [];

  // 方法1：查找编号格式（1. 专注 2. 信仰 等）
  const numberedPattern = /(\d+)[.、\s]*([\u4e00-\u9fa5]{2})/g;
  const numberedMatches = Array.from(text.matchAll(numberedPattern));
  for (const match of numberedMatches) {
    const name = match[2];
    if (GALLUP_STRENGTHS.includes(name) && !foundStrengths.includes(name)) {
      foundStrengths.push(name);
    }
  }

  // 方法2：直接搜索所有优势名称
  for (const strength of GALLUP_STRENGTHS) {
    if (text.includes(strength) && !foundStrengths.includes(strength)) {
      foundStrengths.push(strength);
    }
  }

  // 只返回前 5 个
  return foundStrengths.slice(0, 5);
}

/**
 * 将中文优势名转换为 StrengthId
 */
function convertToStrengthIds(names: string[]): StrengthId[] {
  return names
    .map(name => {
      const strength = ALL_STRENGTHS.find(s => s.name === name);
      return strength?.id || null;
    })
    .filter((id): id is StrengthId => id !== null);
}

async function fetchOcrFromServer(base64Image: string): Promise<OcrResult> {
  const response = await fetch('/api/ocr', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ image: base64Image }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data.success) {
    const errorMessage = data?.error || 'OCR 识别失败';
    throw new Error(errorMessage);
  }

  const top5 = data?.data?.top5 || [];
  const allText = data?.data?.all_text || data?.data?.allText || '';
  const confidence = data?.data?.confidence || 0;
  const top5Ids = convertToStrengthIds(top5);

  return {
    success: true,
    top5,
    top5Ids,
    allText,
    confidence,
  };
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('读取图片失败'));
    reader.readAsDataURL(file);
  });
}

/**
 * 执行 OCR 识别
 * 
 * @param imageFile - 图片文件对象
 * @param onProgress - 进度回调 (0-100)
 * @returns OCR 识别结果
 */
export async function performOcr(
  imageFile: File,
  onProgress?: (_progress: number) => void
): Promise<OcrResult> {
  try {
    // 使用 Tesseract.js 进行识别
    const result = await Tesseract.recognize(
      imageFile,
      'chi_sim', // 简体中文
      {
        logger: (m: any) => {
          // 处理进度
          if (m.status === 'recognizing text' && m.progress !== undefined) {
            const progress = Math.round(m.progress * 100);
            onProgress?.(progress);
          }
        },
      }
    );

    const allText = result.data.text;
    const confidence = result.data.confidence;

    // 提取 TOP5 优势
    const top5 = extractTop5FromText(allText);
    const top5Ids = convertToStrengthIds(top5);

    return {
      success: true,
      top5,
      top5Ids,
      allText,
      confidence,
    };
  } catch (error) {
    console.error('OCR 识别失败:', error);
    return {
      success: false,
      top5: [],
      top5Ids: [],
      allText: '',
      confidence: 0,
    };
  }
}

export async function performOcrUnified(options: {
  file?: File;
  base64Image?: string;
  mode?: OcrMode;
  onProgress?: (_progress: number) => void;
}): Promise<OcrResult> {
  const mode = options.mode || 'auto';
  const { file, base64Image, onProgress } = options;

  if (mode === 'server') {
    const imageData = base64Image || (file ? await readFileAsDataUrl(file) : '');
    if (!imageData) {
      throw new Error('缺少 OCR 图片数据');
    }
    return fetchOcrFromServer(imageData);
  }

  if (mode === 'client') {
    if (file) {
      return performOcr(file, onProgress);
    }
    if (base64Image) {
      return performOcrFromBase64(base64Image, onProgress);
    }
    throw new Error('缺少 OCR 图片数据');
  }

  try {
    const imageData = base64Image || (file ? await readFileAsDataUrl(file) : '');
    if (imageData) {
      return await fetchOcrFromServer(imageData);
    }
  } catch (error) {
    console.warn('OCR 服务不可用，切换到本地识别:', error);
  }

  if (file) {
    const clientResult = await performOcr(file, onProgress);
    if (clientResult.success) {
      return clientResult;
    }
  }

  if (base64Image) {
    const clientResult = await performOcrFromBase64(base64Image, onProgress);
    if (clientResult.success) {
      return clientResult;
    }
  }

  throw new Error('OCR 识别失败');
}

/**
 * 从 Base64 字符串执行 OCR 识别
 * 
 * @param base64Image - Base64 编码的图片（不含 data:image 前缀）
 * @param onProgress - 进度回调 (0-100)
 * @returns OCR 识别结果
 */
export async function performOcrFromBase64(
  base64Image: string,
  onProgress?: (_progress: number) => void
): Promise<OcrResult> {
  try {
    // 添加 data URL 前缀（如果没有）
    const dataUrl = base64Image.startsWith('data:')
      ? base64Image
      : `data:image/jpeg;base64,${base64Image}`;

    const result = await Tesseract.recognize(
      dataUrl,
      'chi_sim',
      {
        logger: (m: any) => {
          if (m.status === 'recognizing text' && m.progress !== undefined) {
            const progress = Math.round(m.progress * 100);
            onProgress?.(progress);
          }
        },
      }
    );

    const allText = result.data.text;
    const confidence = result.data.confidence;

    const top5 = extractTop5FromText(allText);
    const top5Ids = convertToStrengthIds(top5);

    return {
      success: true,
      top5,
      top5Ids,
      allText,
      confidence,
    };
  } catch (error) {
    console.error('OCR 识别失败:', error);
    return {
      success: false,
      top5: [],
      top5Ids: [],
      allText: '',
      confidence: 0,
    };
  }
}

/**
 * 获取 Tesseract.js 语言包下载状态
 * 注意：Tesseract.js v5 会在 recognize() 时自动下载语言包
 */
export async function checkLanguageStatus(): Promise<boolean> {
  // Tesseract.js v5 自动处理语言包加载，无需预检查
  return true;
}

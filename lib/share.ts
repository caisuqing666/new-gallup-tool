// 分享功能
// 支持生成分享链接、复制到剪贴板、社交媒体分享

/**
 * 复制文本到剪贴板
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  if (typeof window === 'undefined' || !navigator.clipboard) {
    // 降级方案
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    try {
      document.execCommand('copy');
      document.body.removeChild(textarea);
      return true;
    } catch {
      document.body.removeChild(textarea);
      return false;
    }
  }

  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

/**
 * 生成分享链接
 */
export function generateShareUrl(resultId: string, baseUrl?: string): string {
  const base = baseUrl || (typeof window !== 'undefined' ? window.location.origin : '');
  return `${base}?result=${resultId}`;
}

/**
 * 分享到社交媒体
 */
export interface ShareOptions {
  title: string;
  text: string;
  url?: string;
}

export async function shareToWeb(options: ShareOptions): Promise<boolean> {
  if (typeof window === 'undefined' || !navigator.share) {
    return false;
  }

  try {
    await navigator.share({
      title: options.title,
      text: options.text,
      url: options.url || window.location.href,
    });
    return true;
  } catch {
    return false;
  }
}

/**
 * 生成 Twitter 分享链接
 */
export function getTwitterShareUrl(options: ShareOptions): string {
  const text = encodeURIComponent(options.text);
  const url = options.url ? encodeURIComponent(options.url) : '';
  return `https://twitter.com/intent/tweet?text=${text}&url=${url}`;
}

/**
 * 生成 Facebook 分享链接
 */
export function getFacebookShareUrl(url: string): string {
  return `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
}

/**
 * 生成 LinkedIn 分享链接
 */
export function getLinkedInShareUrl(options: ShareOptions): string {
  const url = options.url ? encodeURIComponent(options.url) : '';
  return `https://www.linkedin.com/sharing/share-offsite/?url=${url}`;
}

/**
 * 生成二维码（需要外部库）
 */
export function generateQRCode(text: string): string {
  // 使用公共 API 生成二维码
  const encodedText = encodeURIComponent(text);
  return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodedText}`;
}

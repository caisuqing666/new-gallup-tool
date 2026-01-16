import { NextRequest, NextResponse } from 'next/server';

// Python OCR 服务地址
const OCR_SERVICE_URL = process.env.OCR_SERVICE_URL || 'http://localhost:5000';

export const runtime = 'nodejs';

/**
 * OCR API - 代理到 Python PaddleOCR 服务
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { image } = body;

    if (!image) {
      return NextResponse.json(
        { success: false, error: '缺少 image 参数' },
        { status: 400 }
      );
    }

    // 转发请求到 Python OCR 服务
    const response = await fetch(`${OCR_SERVICE_URL}/ocr`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ image }),
      // 设置超时时间（OCR 可能需要一些时间）
      signal: AbortSignal.timeout(30000), // 30秒超时
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'OCR 服务请求失败' }));
      return NextResponse.json(
        { 
          success: false, 
          error: errorData.error || 'OCR 服务请求失败',
          fallback: true // 标记可以使用备用方案
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error('OCR API 错误:', error);

    // 如果是超时错误，提供有用的错误信息
    if (error instanceof Error && error.name === 'AbortError') {
      return NextResponse.json(
        { 
          success: false, 
          error: 'OCR 识别超时，请重试或使用手动输入',
          fallback: true
        },
        { status: 408 }
      );
    }

    // 连接错误（Python 服务未启动）
    if (error instanceof Error && error.message.includes('ECONNREFUSED')) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'OCR 服务未启动，请先启动 Python OCR 服务',
          hint: '运行: cd ocr-service && python app.py',
          fallback: true
        },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { 
        success: false, 
        error: 'OCR 处理失败',
        fallback: true
      },
      { status: 500 }
    );
  }
}

/**
 * GET - 健康检查
 */
export async function GET() {
  try {
    const response = await fetch(`${OCR_SERVICE_URL}/health`, {
      signal: AbortSignal.timeout(5000),
    });

    if (response.ok) {
      return NextResponse.json({ 
        status: 'ok', 
        ocr_service: 'connected' 
      });
    }

    return NextResponse.json({ 
      status: 'degraded', 
      ocr_service: 'disconnected' 
    }, { status: 503 });
  } catch {
    return NextResponse.json({ 
      status: 'unhealthy', 
      ocr_service: 'disconnected',
      hint: 'Python OCR 服务未启动'
    }, { status: 503 });
  }
}

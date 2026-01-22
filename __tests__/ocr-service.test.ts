import * as ocrService from '@/lib/ocr-service';

jest.mock('tesseract.js', () => ({
  __esModule: true,
  default: {
    recognize: jest.fn().mockResolvedValue({
      data: {
        text: '专注',
        confidence: 88,
      },
    }),
  },
}));

describe('performOcrUnified', () => {
  beforeEach(() => {
    (global.fetch as jest.Mock | undefined) = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('uses server OCR when mode=server', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        data: {
          top5: ['专注'],
          all_text: 'ocr text',
          confidence: 88,
        },
      }),
    });

    const result = await ocrService.performOcrUnified({
      base64Image: 'data:image/png;base64,abc',
      mode: 'server',
    });

    expect(result.success).toBe(true);
    expect(result.top5).toEqual(['专注']);
    expect(result.top5Ids.length).toBe(1);
    expect(result.allText).toBe('ocr text');
  });

  it('falls back to client OCR in auto mode when server fails', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      json: async () => ({ success: false, error: 'server down' }),
    });

    const result = await ocrService.performOcrUnified({
      base64Image: 'data:image/png;base64,abc',
      mode: 'auto',
    });

    expect(result.success).toBe(true);
    expect(result.top5).toEqual(['专注']);
    expect(result.top5Ids.length).toBe(1);
  });
});

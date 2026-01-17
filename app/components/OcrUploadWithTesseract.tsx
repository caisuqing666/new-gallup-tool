'use client';

import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { StrengthId, ALL_STRENGTHS } from '@/lib/gallup-strengths';
import { performOcr, OcrResult } from '@/lib/ocr-service';

interface OcrUploadProps {
  onNext: (_strengths: StrengthId[]) => void;
  onBack: () => void;
}

type OcrStatus = 'idle' | 'uploading' | 'downloading' | 'recognizing' | 'success' | 'error';

export default function OcrUploadWithTesseract({
  onNext,
  onBack,
}: OcrUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [ocrStatus, setOcrStatus] = useState<OcrStatus>('idle');
  const [ocrResult, setOcrResult] = useState<OcrResult | null>(null);
  const [selectedStrengths, setSelectedStrengths] = useState<StrengthId[]>([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback(async (file: File) => {
    // 创建预览
    const reader = new FileReader();
    reader.onloadend = async () => {
      const imageData = reader.result as string;
      setUploadedImage(imageData);
      setOcrStatus('downloading');
      setProgress(0);

      // 执行 OCR 识别
      try {
        const result = await performOcr(file, (p) => {
          setProgress(p);
          setOcrStatus('recognizing');
        });

        if (result.success && result.top5.length > 0) {
          setOcrResult(result);
          setSelectedStrengths(result.top5Ids);
          setOcrStatus('success');
        } else {
          setOcrStatus('error');
          setErrorMessage('未能识别到足够优势，请手动选择或重试');
        }
      } catch (error) {
        console.error('OCR 错误:', error);
        setOcrStatus('error');
        setErrorMessage(error instanceof Error ? error.message : 'OCR 识别失败');
      }
    };
    reader.readAsDataURL(file);
  }, []);

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleRetry = () => {
    setOcrStatus('idle');
    setOcrResult(null);
    setSelectedStrengths([]);
    setErrorMessage('');
    setProgress(0);
  };

  const handleStrengthToggle = (strengthId: StrengthId) => {
    setSelectedStrengths(prev => {
      if (prev.includes(strengthId)) {
        return prev.filter(id => id !== strengthId);
      } else if (prev.length < 5) {
        return [...prev, strengthId];
      }
      return prev;
    });
  };

  const handleContinue = () => {
    if (selectedStrengths.length >= 3) {
      onNext(selectedStrengths);
    }
  };

  const getStatusMessage = () => {
    switch (ocrStatus) {
      case 'downloading':
        return '下载 OCR 引擎...';
      case 'recognizing':
        return `正在识别... ${progress}%`;
      case 'success':
        return `识别完成！找到 ${ocrResult?.top5.length || 0} 个优势`;
      case 'error':
        return '识别失败，请重试或手动选择';
      default:
        return '';
    }
  };

  return (
    <div className="min-h-screen bg-warm-gradient px-4 sm:px-6 py-8">
      <div className="max-w-4xl mx-auto">
        {/* 返回按钮 */}
        <motion.button
          onClick={onBack}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors duration-200 group bg-black/5 hover:bg-black/10 px-3 py-2 rounded-full mb-6"
        >
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-5 h-5 transition-transform duration-200 group-hover:-translate-x-1">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span>返回</span>
        </motion.button>

        {/* 页面标题 */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-h2 font-serif text-text-primary mb-2">
            上传你的盖洛普报告
          </h1>
          <p className="text-body-lg text-text-secondary">
            AI 将自动识别你的 TOP5 优势（首次使用需下载 OCR 引擎约 20MB）
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 左侧：上传区域 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {!uploadedImage ? (
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => fileInputRef.current?.click()}
                className={`
                  relative border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all shadow-card bg-white/60 backdrop-blur-md
                  ${isDragging
                    ? 'border-brand bg-brand/10'
                    : 'border-border-light hover:border-brand/50 hover:bg-white/70'
                  }
                  ${ocrStatus === 'downloading' || ocrStatus === 'recognizing' ? 'pointer-events-none opacity-60' : ''}
                `}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleInputChange}
                  className="hidden"
                  disabled={ocrStatus === 'downloading' || ocrStatus === 'recognizing'}
                />

                {/* 图标 */}
                {(ocrStatus === 'downloading' || ocrStatus === 'recognizing') ? (
                  <div className="w-16 h-16 mx-auto mb-4 text-brand">
                    <div className="w-full h-full border-4 border-brand border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : (
                  <div className="w-16 h-16 mx-auto mb-4 text-text-tertiary">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                )}

                {/* 提示文字 */}
                <p className="text-text-primary font-medium text-body mb-2">
                  {ocrStatus === 'idle' && '点击或拖拽上传报告图片'}
                  {(ocrStatus === 'downloading' || ocrStatus === 'recognizing') && '正在处理...'}
                </p>
                <p className="text-text-secondary text-body-sm">
                  请确保图片清晰，包含 TOP5 优势列表
                </p>

                {/* 进度条 */}
                {(ocrStatus === 'downloading' || ocrStatus === 'recognizing') && (
                  <div className="mt-4 p-3 bg-white/40 rounded-lg border border-white/50 shadow-inner-soft">
                    <div className="w-full bg-border-light rounded-full h-2 mb-2">
                      <div
                        className="bg-brand h-2 rounded-full transition-all duration-300"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <p className="text-xs text-text-secondary mt-2 font-medium">{getStatusMessage()}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="relative">
                {/* 预览图片 */}
                <div className="bg-white/60 backdrop-blur-md rounded-2xl p-4 mb-4 border border-white/80 shadow-card">
                  <Image
                    src={uploadedImage}
                    alt="上传的报告"
                    className="w-full h-auto rounded-lg"
                    width={800}
                    height={600}
                    unoptimized
                  />
                </div>

                {/* 重新上传按钮 */}
                <button
                  onClick={handleRetry}
                  disabled={ocrStatus === 'downloading' || ocrStatus === 'recognizing'}
                  className="w-full py-3 border border-border-light rounded-xl text-text-primary font-medium hover:bg-bg-secondary transition-colors disabled:opacity-50 shadow-soft"
                >
                  重新上传
                </button>
              </div>
            )}

            {/* 状态提示 */}
            <AnimatePresence>
              {ocrStatus !== 'idle' && ocrStatus !== 'uploading' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-4"
                >
                  <div className={`
                    rounded-xl p-4 bg-white/60 backdrop-blur-md border shadow-card
                    ${ocrStatus === 'error' ? 'bg-status-error/10 border-status-error/60' : ''}
                    ${(ocrStatus === 'downloading' || ocrStatus === 'recognizing') ? 'bg-brand/10 border-brand/60' : ''}
                    ${ocrStatus === 'success' ? 'bg-status-success/10 border-status-success/60' : ''}
                  `}>
                    <div className="flex items-center gap-3">
                      {(ocrStatus === 'downloading' || ocrStatus === 'recognizing') && (
                        <>
                          <div className="w-5 h-5 border-2 border-brand border-t-transparent rounded-full animate-spin" />
                          <p className="text-sm text-brand font-medium">{getStatusMessage()}</p>
                        </>
                      )}
                      {ocrStatus === 'success' && (
                        <>
                          <svg className="w-5 h-5 text-status-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <p className="text-sm text-status-success font-medium">{getStatusMessage()}</p>
                        </>
                      )}
                      {ocrStatus === 'error' && (
                        <>
                          <svg className="w-5 h-5 text-status-error" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                          <p className="text-sm text-status-error font-medium">{errorMessage || getStatusMessage()}</p>
                        </>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* 右侧：优势选择 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="bg-white/60 backdrop-blur-md rounded-2xl p-6 h-full border border-white/80 shadow-card">
              <h2 className="text-h4 font-serif text-text-primary mb-4">
                你的 TOP5 优势
              </h2>
              <p className="text-body-sm text-text-secondary mb-4">
                请选择 3-5 个优势（<span className="font-medium text-brand">{selectedStrengths.length}</span>/5）
              </p>

              {/* 优势列表 */}
              <div className="flex flex-wrap gap-2 max-h-96 overflow-y-auto pr-2 -mr-2">
                {ALL_STRENGTHS.map((strength) => {
                  const isSelected = selectedStrengths.includes(strength.id);
                  const wasRecognized = ocrResult?.top5Ids.includes(strength.id);

                  return (
                    <button
                      key={strength.id}
                      onClick={() => handleStrengthToggle(strength.id)}
                      disabled={!isSelected && selectedStrengths.length >= 5}
                      className={`
                        px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 border shadow-soft
                        ${isSelected
                          ? 'bg-brand text-white border-brand'
                          : wasRecognized
                            ? 'bg-brand/10 text-brand border-brand/30 hover:bg-brand/20'
                            : 'bg-bg-card text-text-secondary border-border-light hover:border-border-dark hover:bg-bg-secondary'
                        }
                        ${!isSelected && selectedStrengths.length >= 5 ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                      `}
                    >
                      {strength.name}
                      {wasRecognized && !isSelected && (
                        <span className="ml-1 text-caption text-brand/80">(AI)</span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* 继续/生成按钮 */}
              <div className="mt-6">
                <button
                  onClick={handleContinue}
                  disabled={selectedStrengths.length < 3}
                  className="w-full py-4 bg-brand hover:bg-brand-dark text-white rounded-xl font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-glow hover:shadow-glow-lg"
                >
                  {selectedStrengths.length < 3
                    ? '请至少选择 3 个优势'
                    : '生成报告解读'
                  }
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { StrengthId, ALL_STRENGTHS } from '@/lib/gallup-strengths';
import { performOcrUnified, OcrResult } from '@/lib/ocr-service';

interface OcrUploadProps {
  onNext: (_strengths: StrengthId[]) => void;
  onBack: () => void;
}

type OcrStatus = 'idle' | 'uploading' | 'recognizing' | 'success' | 'error';

export default function OcrUploadPlaceholder({
  onNext,
  onBack,
}: OcrUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [ocrStatus, setOcrStatus] = useState<OcrStatus>('idle');
  const [ocrResult, setOcrResult] = useState<OcrResult | null>(null);
  const [selectedStrengths, setSelectedStrengths] = useState<StrengthId[]>([]);
  const [errorMessage, setErrorMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 执行 OCR 识别
  const performOcr = useCallback(async (imageData: string) => {
    setOcrStatus('recognizing');
    setErrorMessage('');

    try {
      const result = await performOcrUnified({
        base64Image: imageData,
        mode: 'auto',
      });

      if (!result.success) {
        throw new Error('OCR 识别失败');
      }

      setOcrResult(result);
      setSelectedStrengths(result.top5Ids);
      setOcrStatus('success');
    } catch (error) {
      console.error('OCR 错误:', error);
      setErrorMessage(error instanceof Error ? error.message : 'OCR 识别失败');
      setOcrStatus('error');
    }
  }, []);

  const handleFileSelect = useCallback(async (file: File) => {
    // 创建预览
    const reader = new FileReader();
    reader.onloadend = async () => {
      const imageData = reader.result as string;
      setUploadedImage(imageData);
      
      // 自动执行 OCR
      await performOcr(imageData);
    };
    reader.readAsDataURL(file);
  }, [performOcr]);

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
      case 'recognizing':
        return '正在识别你的优势...';
      case 'success':
        return '识别完成！请确认或调整你的优势';
      case 'error':
        return '识别失败，请重试或手动选择';
      default:
        return '';
    }
  };

  return (
    <div className="min-h-screen bg-white px-4 sm:px-6 py-8">
      <div className="max-w-4xl mx-auto">
        {/* 返回按钮 */}
        <motion.button
          onClick={onBack}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          className="mb-6 text-gray-600 hover:text-gray-900 flex items-center gap-2 transition-colors"
        >
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-5 h-5">
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
          <h1 className="text-2xl sm:text-3xl font-bold text-black mb-2 font-serif">
            上传你的盖洛普报告
          </h1>
          <p className="text-gray-500 text-sm">
            支持 JPG、PNG 格式，AI 将自动识别你的 TOP5 优势
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
                  relative border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all
                  ${isDragging
                    ? 'border-[#5D4037] bg-[#5D4037]/5'
                    : 'border-gray-200 hover:border-[#5D4037]/50 hover:bg-gray-50'
                  }
                `}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleInputChange}
                  className="hidden"
                />

                {/* 图标 */}
                <div className="w-16 h-16 mx-auto mb-4 text-gray-400">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </div>

                {/* 提示文字 */}
                <p className="text-black font-medium mb-2">
                  点击或拖拽上传报告图片
                </p>
                <p className="text-gray-400 text-sm">
                  请确保图片清晰，包含 TOP5 优势列表
                </p>
              </div>
            ) : (
              <div className="relative">
                {/* 预览图片 */}
                <div className="bg-gray-50 rounded-2xl p-4 mb-4">
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
                  className="w-full py-3 border-2 border-gray-200 rounded-xl text-black font-medium hover:bg-gray-50 transition-colors"
                >
                  重新上传
                </button>
              </div>
            )}

            {/* 状态提示 */}
            <AnimatePresence>
              {ocrStatus !== 'idle' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-4"
                >
                  <div className={`
                    rounded-xl p-4
                    ${ocrStatus === 'error' ? 'bg-red-50 border border-red-200' : ''}
                    ${ocrStatus === 'recognizing' ? 'bg-blue-50 border border-blue-200' : ''}
                    ${ocrStatus === 'success' ? 'bg-green-50 border border-green-200' : ''}
                  `}>
                    <div className="flex items-center gap-3">
                      {ocrStatus === 'recognizing' && (
                        <>
                          <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                          <p className="text-sm text-blue-700">{getStatusMessage()}</p>
                        </>
                      )}
                      {ocrStatus === 'success' && (
                        <>
                          <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <p className="text-sm text-green-700">{getStatusMessage()}</p>
                        </>
                      )}
                      {ocrStatus === 'error' && (
                        <>
                          <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                          <p className="text-sm text-red-700">{errorMessage || getStatusMessage()}</p>
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
            <div className="bg-gray-50 rounded-2xl p-6 h-full">
              <h2 className="text-lg font-bold text-black mb-4">
                你的 TOP5 优势
              </h2>
              <p className="text-sm text-gray-500 mb-4">
                请选择 3-5 个优势（{selectedStrengths.length}/5）
              </p>

              {/* 优势列表 */}
              <div className="flex flex-wrap gap-2">
                {ALL_STRENGTHS.map((strength) => {
                  const isSelected = selectedStrengths.includes(strength.id);
                  const wasRecognized = ocrResult?.top5.some(name => name === strength.name);

                  return (
                    <button
                      key={strength.id}
                      onClick={() => handleStrengthToggle(strength.id)}
                      disabled={!isSelected && selectedStrengths.length >= 5}
                      className={`
                        px-3 py-2 rounded-lg text-sm font-medium transition-all
                        ${isSelected
                          ? 'bg-[#5D4037] text-white'
                          : wasRecognized
                            ? 'bg-[#5D4037]/10 text-[#5D4037] border border-[#5D4037]/30'
                            : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-300'
                        }
                        ${!isSelected && selectedStrengths.length >= 5 ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                      `}
                    >
                      {strength.name}
                      {wasRecognized && !isSelected && (
                        <span className="ml-1 text-xs">(AI)</span>
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
                  className="w-full py-4 bg-[#5D4037] hover:bg-[#4A3A2F] text-white rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {selectedStrengths.length < 3
                    ? '请至少选择 3 个优势'
                    : ocrStatus === 'success'
                      ? '生成适合你的职业方向'
                      : '继续'
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

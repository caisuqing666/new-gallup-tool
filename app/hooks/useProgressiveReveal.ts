import { useState, useEffect, useCallback } from 'react';

/**
 * 渐进式显示 Hook
 * 结合时间延迟和 Intersection Observer，实现最佳的渐进式显示体验
 * 
 * @param totalSteps - 总步骤数
 * @param options - 配置选项
 * @returns [visibleStep, markAsVisible]
 * 
 * @example
 * const [visibleStep, markAsVisible] = useProgressiveReveal(4, {
 *   baseDelay: 400,      // 基础延迟
 *   stepDelay: 400,      // 每步延迟
 *   autoPlay: true,      // 自动播放
 * });
 */
export function useProgressiveReveal(
  totalSteps: number,
  options: {
    baseDelay?: number;      // 基础延迟（ms）
    stepDelay?: number;      // 每步延迟（ms）
    autoPlay?: boolean;      // 是否自动播放
    startCondition?: boolean; // 启动条件（如打字机完成）
  } = {}
): [number, (_step: number) => void, () => void] {
  const {
    baseDelay = 400,
    stepDelay = 400,
    autoPlay = true,
    startCondition = true,
  } = options;

  const [visibleStep, setVisibleStep] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);

  // 标记某个步骤为可见
  const markAsVisible = useCallback((step: number) => {
    setVisibleStep(prev => Math.max(prev, step + 1));
  }, []);

  // 重置
  const reset = useCallback(() => {
    setVisibleStep(0);
    setHasStarted(false);
  }, []);

  // 自动播放逻辑
  useEffect(() => {
    if (!autoPlay || !startCondition || hasStarted) return;

    setHasStarted(true);

    const timers: NodeJS.Timeout[] = [];

    for (let i = 0; i < totalSteps; i++) {
      const timer = setTimeout(() => {
        setVisibleStep(i + 1);
      }, baseDelay + i * stepDelay);

      timers.push(timer);
    }

    return () => {
      timers.forEach(clearTimeout);
    };
  }, [autoPlay, startCondition, hasStarted, totalSteps, baseDelay, stepDelay]);

  return [visibleStep, markAsVisible, reset];
}

/**
 * 打字机完成检测 Hook
 * 检测打字机动画是否完成
 */
export function useTypewriterComplete(
  isTyping: boolean,
  text: string
): boolean {
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    if (!isTyping && text.length > 0) {
      // 打字机完成后延迟一小段时间再触发
      const timer = setTimeout(() => {
        setIsComplete(true);
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [isTyping, text]);

  return isComplete;
}

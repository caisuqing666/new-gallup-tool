import { useState, useEffect, useRef, RefObject } from 'react';

/**
 * 使用 Intersection Observer 实现元素的渐进式显示
 * @param options - Intersection Observer 配置项
 * @returns [isVisible, elementRef]
 * 
 * @example
 * const [isVisible, ref] = useIntersectionObserver({ threshold: 0.1 });
 * <div ref={ref} className={isVisible ? 'visible' : ''}>
 *   当元素进入视口时显示
 * </div>
 */
export function useIntersectionObserver<T extends HTMLElement = HTMLElement>(
  options: IntersectionObserverInit = {}
): [boolean, RefObject<T>] {
  const [isVisible, setIsVisible] = useState(false);
  const elementRef = useRef<T>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    // 检查浏览器是否支持 Intersection Observer
    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
      setIsVisible(true); // 降级：直接显示
      return;
    }

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsVisible(true);
        observer.disconnect(); // 只触发一次
      }
    }, {
      threshold: 0.1, // 元素 10% 可见时触发
      rootMargin: '0px 0px -50px 0px', // 提前 50px 触发
      ...options,
    });

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [elementRef, options]);

  return [isVisible, elementRef];
}

/**
 * 使用 Intersection Observer 实现多个元素的顺序渐进式显示
 * @param count - 元素数量
 * @param options - Intersection Observer 配置项
 * @returns [visibleIndexes, setRef] - 已可见元素的索引数组与 ref 绑定函数
 * 
 * @example
 * const visibleIndexes = useSequentialReveal(3);
 * // visibleIndexes: [] -> [0] -> [0, 1] -> [0, 1, 2]
 */
export function useSequentialReveal(
  count: number,
  options: IntersectionObserverInit = {}
): [number[], (_index: number) => (_el: HTMLElement | null) => void] {
  const [visibleIndexes, setVisibleIndexes] = useState<number[]>([]);
  const refs = useRef<(HTMLElement | null)[]>([]);

  useEffect(() => {
    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
      setVisibleIndexes(Array.from({ length: count }, (_, i) => i));
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const index = refs.current.indexOf(entry.target as HTMLElement);
          if (index !== -1 && !visibleIndexes.includes(index)) {
            setVisibleIndexes(prev => [...prev, index].sort((a, b) => a - b));
          }
        }
      });
    }, {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px',
      ...options,
    });

    refs.current.forEach((ref) => {
      if (ref) observer.observe(ref);
    });

    return () => {
      observer.disconnect();
    };
  }, [count, options, visibleIndexes]);

  const setRef = (index: number) => (el: HTMLElement | null) => {
    refs.current[index] = el;
  };

  return [visibleIndexes, setRef];
}

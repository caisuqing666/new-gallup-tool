// 结果历史记录管理
// 使用 localStorage 存储用户的历史生成记录

import { GallupResult } from './types';
import { ScenarioId } from './scenarios';
import { StrengthId } from './gallup-strengths';

export interface HistoryItem {
  id: string;
  timestamp: number;
  scenario: ScenarioId;
  strengths: StrengthId[];
  confusion: string;
  result: GallupResult;
}

const HISTORY_STORAGE_KEY = 'gallup_history';
const MAX_HISTORY_ITEMS = 50; // 最多保存 50 条记录

/**
 * 获取所有历史记录
 */
export function getHistory(): HistoryItem[] {
  if (typeof window === 'undefined') return [];
  
  try {
    const stored = localStorage.getItem(HISTORY_STORAGE_KEY);
    if (!stored) return [];
    
    const history: HistoryItem[] = JSON.parse(stored);
    // 按时间倒序排列
    return history.sort((a, b) => b.timestamp - a.timestamp);
  } catch (error) {
    console.error('读取历史记录失败:', error);
    return [];
  }
}

/**
 * 添加一条历史记录
 */
export function addHistory(item: Omit<HistoryItem, 'id' | 'timestamp'>): HistoryItem {
  const historyItem: HistoryItem = {
    ...item,
    id: generateId(),
    timestamp: Date.now(),
  };
  
  const history = getHistory();
  const newHistory = [historyItem, ...history].slice(0, MAX_HISTORY_ITEMS);
  
  try {
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(newHistory));
  } catch (error) {
    console.error('保存历史记录失败:', error);
  }
  
  return historyItem;
}

/**
 * 删除一条历史记录
 */
export function deleteHistory(id: string): void {
  const history = getHistory();
  const newHistory = history.filter(item => item.id !== id);
  
  try {
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(newHistory));
  } catch (error) {
    console.error('删除历史记录失败:', error);
  }
}

/**
 * 清空所有历史记录
 */
export function clearHistory(): void {
  try {
    localStorage.removeItem(HISTORY_STORAGE_KEY);
  } catch (error) {
    console.error('清空历史记录失败:', error);
  }
}

/**
 * 获取指定日期范围内的历史记录
 */
export function getHistoryByDateRange(startDate: Date, endDate: Date): HistoryItem[] {
  const history = getHistory();
  const start = startDate.getTime();
  const end = endDate.getTime();
  
  return history.filter(item => item.timestamp >= start && item.timestamp <= end);
}

/**
 * 根据场景筛选历史记录
 */
export function getHistoryByScenario(scenario: ScenarioId): HistoryItem[] {
  const history = getHistory();
  return history.filter(item => item.scenario === scenario);
}

/**
 * 搜索历史记录（搜索困惑描述、核心判词）
 */
export function searchHistory(keyword: string): HistoryItem[] {
  const history = getHistory();
  const lowerKeyword = keyword.toLowerCase();

  return history.filter(item =>
    item.confusion.toLowerCase().includes(lowerKeyword) ||
    item.result.decide.pathLogic.toLowerCase().includes(lowerKeyword)
  );
}

/**
 * 生成唯一 ID
 */
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom'

const originalConsole = {
  log: console.log,
  info: console.info,
  warn: console.warn,
  error: console.error,
};

const allowedLogSnippets = [
  '[schema]',
  '[优势指南]',
  'Guide provider selection',
  'OCR 服务不可用',
];

function shouldAllow(message) {
  if (typeof message !== 'string') {
    return false;
  }
  return allowedLogSnippets.some((snippet) => message.includes(snippet));
}

console.log = (...args) => {
  if (shouldAllow(args[0])) {
    originalConsole.log(...args);
  }
};

console.info = (...args) => {
  if (shouldAllow(args[0])) {
    originalConsole.info(...args);
  }
};

console.warn = (...args) => {
  if (shouldAllow(args[0])) {
    originalConsole.warn(...args);
  }
};

console.error = (...args) => {
  originalConsole.error(...args);
};

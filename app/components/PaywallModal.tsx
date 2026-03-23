'use client';

import { useState } from 'react';

interface PaywallModalProps {
  onSuccess: (email: string) => void;
  onClose: () => void;
}

export default function PaywallModal({ onSuccess, onClose }: PaywallModalProps) {
  const [loading, setLoading] = useState(false);
  const [verifyEmail, setVerifyEmail] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState('');
  const [showVerify, setShowVerify] = useState(false);

  // 发起 Creem 支付（跳转到 Creem 收银台）
  const handleCheckout = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/payment/checkout', { method: 'POST' });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setError(data.error || '创建支付失败，请重试');
        setLoading(false);
      }
    } catch {
      setError('网络错误，请重试');
      setLoading(false);
    }
  };

  // 已购买用邮箱验证
  const handleVerify = async () => {
    if (!verifyEmail || !verifyEmail.includes('@')) {
      setError('请输入有效邮箱');
      return;
    }
    setVerifying(true);
    setError('');
    try {
      const res = await fetch(`/api/payment/verify?email=${encodeURIComponent(verifyEmail)}`);
      const data = await res.json();
      if (data.paid) {
        localStorage.setItem('gallup_user_email', verifyEmail);
        localStorage.setItem('gallup_paid', 'true');
        onSuccess(verifyEmail);
      } else {
        setError('该邮箱尚未购买，请先完成支付');
      }
    } catch {
      setError('验证失败，请重试');
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="relative bg-white rounded-2xl max-w-sm w-full p-8 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-xl leading-none"
        >
          ×
        </button>

        <div className="text-center mb-6">
          <div className="text-4xl mb-3">🔓</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-1">解锁完整分析</h2>
          <p className="text-gray-500 text-sm">一次性买断，永久使用</p>
        </div>

        {/* 价格展示 */}
        <div className="bg-gray-50 rounded-xl p-4 mb-6 text-center">
          <span className="text-3xl font-bold text-gray-900">$5.99</span>
          <p className="text-gray-500 text-sm mt-1">终身会员 · 无限次使用</p>
        </div>

        {error && <p className="text-red-500 text-xs mb-3 text-center">{error}</p>}

        {/* 立即支付 */}
        {!showVerify ? (
          <>
            <button
              onClick={handleCheckout}
              disabled={loading}
              className="w-full bg-brand text-white py-3 rounded-xl font-medium mb-3 hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {loading ? '跳转中...' : '立即解锁 →'}
            </button>
            <button
              onClick={() => { setShowVerify(true); setError(''); }}
              className="w-full text-gray-500 text-sm py-2 hover:text-gray-700 transition-colors"
            >
              已购买？验证邮箱
            </button>
          </>
        ) : (
          <>
            <input
              type="email"
              placeholder="输入购买时的邮箱"
              value={verifyEmail}
              onChange={(e) => { setVerifyEmail(e.target.value); setError(''); }}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-brand/30"
            />
            <button
              onClick={handleVerify}
              disabled={verifying}
              className="w-full bg-brand text-white py-3 rounded-xl font-medium mb-3 hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {verifying ? '验证中...' : '验证解锁'}
            </button>
            <button
              onClick={() => { setShowVerify(false); setError(''); }}
              className="w-full text-gray-500 text-sm py-2 hover:text-gray-700 transition-colors"
            >
              ← 返回
            </button>
          </>
        )}
      </div>
    </div>
  );
}

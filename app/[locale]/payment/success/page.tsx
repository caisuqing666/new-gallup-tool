'use client';

import { Suspense, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

function SuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const email = searchParams.get('email') || '';

  useEffect(() => {
    if (email) {
      localStorage.setItem('gallup_user_email', email);
      localStorage.setItem('gallup_paid', 'true');
    }
  }, [email]);

  return (
    <div className="text-center max-w-md px-6">
      <div className="text-5xl mb-6">🎉</div>
      <h1 className="text-2xl font-semibold text-text-primary mb-3">
        支付成功，已永久解锁
      </h1>
      <p className="text-text-secondary mb-2">感谢你的支持！</p>
      {email && (
        <p className="text-text-secondary text-sm mb-8">
          解锁邮箱：<span className="text-brand font-medium">{email}</span>
        </p>
      )}
      <button
        onClick={() => router.push('/')}
        className="bg-brand text-white px-8 py-3 rounded-xl font-medium hover:opacity-90 transition-opacity"
      >
        开始使用
      </button>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-primary">
      <Suspense fallback={<div className="text-text-secondary">加载中...</div>}>
        <SuccessContent />
      </Suspense>
    </div>
  );
}

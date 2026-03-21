import Link from 'next/link';

export default async function PrivacyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const isZh = locale === 'zh';

  return (
    <div className="min-h-screen bg-warm-gradient py-16 px-6">
      <div className="max-w-2xl mx-auto">
        <Link
          href={`/${locale}`}
          className="text-sm text-text-secondary hover:text-brand transition-colors mb-8 inline-block"
        >
          ← {isZh ? '返回首页' : 'Back to Home'}
        </Link>

        <h1 className="text-3xl font-bold text-text-primary mb-2">
          {isZh ? '隐私政策' : 'Privacy Policy'}
        </h1>
        <p className="text-sm text-text-secondary mb-10">
          {isZh ? '最后更新：2026年3月21日' : 'Last updated: March 21, 2026'}
        </p>

        <div className="prose prose-sm max-w-none space-y-8 text-text-primary">

          <section>
            <h2 className="text-lg font-semibold mb-3">
              {isZh ? '1. 我们收集的信息' : '1. Information We Collect'}
            </h2>
            <p className="text-text-secondary leading-relaxed">
              {isZh
                ? '我们收集您主动提供的信息，包括：您输入的盖洛普优势编号、使用场景描述及相关问题。我们不收集您的姓名、电子邮件或任何个人身份信息，除非您在付款时主动提供。'
                : 'We collect information you actively provide, including your Gallup CliftonStrengths rankings, scenario descriptions, and related inputs. We do not collect your name, email, or any personally identifiable information unless you voluntarily provide it during payment.'}
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">
              {isZh ? '2. 信息的使用方式' : '2. How We Use Your Information'}
            </h2>
            <p className="text-text-secondary leading-relaxed">
              {isZh
                ? '您提供的优势和场景信息仅用于生成个性化的行动方案报告。我们不会将您的信息出售、出租或分享给第三方，除非法律要求。'
                : 'The strengths and scenario information you provide is used solely to generate your personalized action plan report. We do not sell, rent, or share your information with third parties, except as required by law.'}
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">
              {isZh ? '3. 支付信息' : '3. Payment Information'}
            </h2>
            <p className="text-text-secondary leading-relaxed">
              {isZh
                ? '付款通过第三方支付处理商（Creem、PayPal）处理。我们不存储您的信用卡或银行账户信息。支付处理商有其各自的隐私政策。'
                : 'Payments are processed through third-party payment processors (Creem, PayPal). We do not store your credit card or bank account information. Payment processors have their own privacy policies.'}
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">
              {isZh ? '4. Cookies' : '4. Cookies'}
            </h2>
            <p className="text-text-secondary leading-relaxed">
              {isZh
                ? '我们使用本地存储（localStorage）保存您的历史记录，以便您下次访问时可以查看之前的结果。您可以随时通过清除浏览器数据来删除这些信息。'
                : 'We use localStorage to save your history so you can review previous results on future visits. You can delete this data at any time by clearing your browser data.'}
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">
              {isZh ? '5. 联系我们' : '5. Contact Us'}
            </h2>
            <p className="text-text-secondary leading-relaxed">
              {isZh ? '如有任何隐私相关问题，请发送邮件至：' : 'For any privacy-related questions, please email us at:'}{' '}
              <a href="mailto:hello@gallup-tool.com" className="text-brand hover:underline">
                hello@gallup-tool.com
              </a>
            </p>
          </section>

        </div>
      </div>
    </div>
  );
}

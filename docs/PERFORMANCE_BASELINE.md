# 性能基线 (2025-01-20)

## 数据收集状态

### Bundle 信息
- **状态**: 待测试
- **初始 JS (gzip)**: [待运行 `ANALYZE=true npm run build`]
- **首屏必需代码比例**: [待分析]
- **Tesseract.js 大小**: [待分析]
- **其他大型库**: [待分析]

**验证命令**:
```bash
npm install --save-dev @next/bundle-analyzer
ANALYZE=true npm run build
# 打开 .next/analyze/__bundle_analysis.html 查看可视化报告
```

### 性能指标 (Lighthouse)
- **首次内容绘制 (FCP)**: [待测试]
- **最大内容绘制 (LCP)**: [待测试]
- **可交互时间 (TTI)**: [待测试]
- **总阻塞时间 (TBT)**: [待测试]

**验证命令**:
```bash
npm run build
npm run start

# 在生产环境或预览环境运行 lighthouse
npx lighthouse https://your-deployment-url --view
```

### API 响应时间 (P95)
- **GET /api/generate**: [待测试] ms
- **GET /api/guide**: [待测试] ms
- **GET /api/career**: [待测试] ms
- **GET /api/interpret**: [待测试] ms

**验证方法**:
1. 生产环境查看 Sentry/DataDog 日志
2. 或本地测试：
```bash
npm run dev
time curl -X POST http://localhost:3001/api/guide \
  -H "Content-Type: application/json" \
  -d '{"strengths": ["1", "2", "3"], "locale": "zh"}'
```

### 压缩配置状态
- **Gzip 启用**: ✓ (Next.js 15.0 默认启用)
- **Brotli 启用**: [待验证]
- **默认压缩率**: [待验证]

**验证方法**:
```bash
# 查看 HTTP 响应头
curl -I https://your-deployment-url/

# 期望看到：
# Content-Encoding: gzip
# 或
# Content-Encoding: br
```

## 后续步骤

1. [ ] 运行 `ANALYZE=true npm run build` 生成 bundle 分析
2. [ ] 记录上述所有指标
3. [ ] 基于数据更新本文档
4. [ ] 生成 `docs/PERFORMANCE_DECISION.md` 决策文档

---

**上次更新**: 2025-01-20  
**收集者**: Architecture Team

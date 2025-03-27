# Hexo AI Summary Plugin

[![npm](https://img.shields.io/npm/v/hexo-ai-summary)](https://www.npmjs.com/package/hexo-ai-summary)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

Hexo plugin that automatically generates professional article summaries using AI API.

👉 [中文文档](README_CN.md) | [Demo](https://yourblog.com)

## 功能特性

- ✅ 自动生成文章 AI 摘要
- ✅ 支持缓存避免重复生成
- ✅ 可配置的 API 参数和提示词
- ✅ 自动写回 Markdown Front Matter
- ✅ GitHub Action 自动化集成

## 安装

```bash
npm install hexo-ai-summary --save
```

## 配置

1. 在 Hexo 根目录的 _config.yml 中添加：

```yml
ai_summary:
  enable: true
  cache_path: "./ai-summary-cache.json"
  force_refresh: false
  target_titles:  # 指定需要生成的文章标题
    - "从 Java 锁到分布式锁"
  ai_service:
    endpoint: "https://api.deepseek.com/v1/chat/completions"
    headers:
      Authorization: "Bearer YOUR_API_KEY"
    params:
      model: "deepseek-chat"
      temperature: 0.7
      max_tokens: 200
      messages:
        - role: "system"
          content: "请用中文生成一篇不超过200字的专业摘要"
```

2. 在需要生成摘要的文章头部添加标识：
```markdown
---
title: 你的文章标题
ai_summary: "" # 插件会自动填充
---
```

## 使用示例
### 本地生成

```yaml
hexo clean && hexo generate --debug
```

### 集成到 GitHub Action

创建 `.github/workflows/ai-summary.yml`：
```yaml
name: AI Summary Generation

on:
  push:
    branches: [main]
    paths: 
      - 'source/_posts/**'

jobs:
  generate-summary:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 18
      - run: npm install
      - run: npx hexo generate
      - name: Commit changes
        run: |
          git config --global user.name "GitHub Actions"
          git config --global user.email "actions@github.com"
          git add source/_posts/*.md
          git commit -m "docs: auto-update AI summaries" || true
          git push
```

## 常见问题
### 如何强制重新生成摘要？
设置 force_refresh: true

### 摘要没有生成怎么办？

1. 检查 API 密钥有效性
2. 查看日志 hexo generate --debug
3. 确保文章内容超过 100 字

## 贡献指南
欢迎提交 Issue 和 PR！开发流程：

```bash
git clone https://github.com/yourname/hexo-ai-summary.git
cd hexo-ai-summary
npm install
# 修改代码后运行测试
```

## 许可证
MIT License © 2024 LiuZhihang
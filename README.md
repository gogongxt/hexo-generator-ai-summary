# Hexo AI Summary Plugin

[![npm](https://img.shields.io/npm/v/hexo-generator-ai-summary)](https://www.npmjs.com/package/hexo-generator-ai-summary)
[![GitHub](https://img.shields.io/github/stars/liuzhihang/hexo-generator-ai-summary)](https://github.com/liuzhihang/hexo-generator-ai-summary)

Hexo plugin for generating AI-powered article summaries.

👉 [中文文档](README_CN.md) | [Demo](https://yourblog.com)

## 功能特性

- ✅ 自动生成文章 AI 摘要
- ✅ 支持缓存避免重复生成
- ✅ 可配置的 API 参数和提示词
- ✅ 自动写回 Markdown Front Matter
- ✅ GitHub Action 自动化集成

## 安装

```bash
npm install hexo-generator-ai-summary --save
```

## 配置

1. 在 Hexo 根目录的 \_config.yml 中添加：

```yml
ai_summary:
  enable: true
  require_front_matter_ai: false # 是否要求front matter中包含ai字段才生成
  content_max_length: 0 # 传递给AI的内容长度限制，0表示不限制，单位：字符
  force_refresh: false
  target_titles: # 指定需要生成的文章标题（当require_front_matter_ai为false时生效）
    - "从 Java 锁到分布式锁"
  ai_service:
    endpoint: "https://api-inference.modelscope.cn/v1/chat/completions"
    headers:
      Authorization: "Bearer $API"
    params:
      model: "deepseek-ai/DeepSeek-V3.2-Exp"
      temperature: 0.7
      max_tokens: 200
      messages:
        - role: "system"
          content: "请用中文生成一篇不超过200字的专业摘要"
```

2. 根据配置方式选择文章标识方式：

**方式一：按需生成（推荐）**

- 设置 `require_front_matter_ai: true`
- 在需要生成摘要的文章头部添加：

```markdown
---
title: 你的文章标题
ai: "" # 插件会自动填充生成的摘要
---
```

**方式二：标题列表方式**

- 设置 `require_front_matter_ai: false`（默认）
- 在 `target_titles` 中配置文章标题，无需在文章中添加标识

## 使用示例

### 方式一：按需生成模式

```yml
# _config.yml
ai_summary:
  enable: true
  require_front_matter_ai: true
  content_max_length: 5000 # 可选：限制发送给AI的内容长度
  # ... 其他配置
```

然后在需要的文章中添加 `ai: ""` 字段。

### 方式二：标题列表模式

```yml
# _config.yml
ai_summary:
  enable: true
  require_front_matter_ai: false
  content_max_length: 0 # 可选：0表示不限制内容长度
  target_titles:
    - "从 Java 锁到分布式锁"
    - "你的文章标题"
  # ... 其他配置
```

### 内容长度控制

- `content_max_length: 0` - 不限制内容长度（默认）
- `content_max_length: 5000` - 只发送前 5000 个字符给 AI
- `content_max_length: 1000` - 只发送前 1000 个字符给 AI

**使用场景：**

- **不限制**：适用于文章较短或需要完整内容的场景
- **限制长度**：适用于长文章，可以节省 token 消耗和提高响应速度

### 本地生成

```bash
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
      - "source/_posts/**"

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
4. 检查配置是否正确：
   - 如果使用 `require_front_matter_ai: true`，确认文章 front matter 中包含 `ai` 字段
   - 如果使用标题列表方式，确认文章标题在 `target_titles` 列表中

## 贡献指南

欢迎提交 Issue 和 PR！开发流程：

```bash
git clone https://github.com/liuzhihang/hexo-generator-ai-summary.git
cd hexo-generator-ai-summary
npm install
# 修改代码后运行测试
```

---

### **注意事项**

1. **版本号管理**：  
   每次发布前通过 `npm version patch` 更新版本号。
2. **文档一致性**：  
   全局搜索 `hexo-ai-summary` 确保无残留旧名称。
3. **GitHub 同步**：  
   推送 README 更新到仓库：

```bash
git add README.md
git commit -m "docs: update for new package name"
git push origin main
```

## 许可证

MIT License © 2024 liuzhihang
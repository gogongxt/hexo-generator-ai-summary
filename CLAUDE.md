# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Hexo plugin that generates AI-powered article summaries by integrating with external AI services (like DeepSeek). The plugin automatically processes markdown posts during generation and adds AI summaries to the front matter.

## Architecture

### Core Components

- **index.js**: Main plugin entry point that registers Hexo filter hooks
  - Registers `before_post_render` filter to process posts
  - Handles configuration merging and validation
  - Manages post filtering and summary generation workflow

- **lib/ai.js**: AI service abstraction layer
  - `AIService` class handles API communication with rate limiting and concurrency control
  - Implements request queuing and error handling
  - Supports configurable AI endpoints and parameters

### Key Workflow

1. **Post Processing**: During `hexo generate`, posts are filtered through `before_post_render`
2. **Target Selection**: Only processes posts matching `target_titles` configuration
3. **Summary Generation**: Calls AI service via HTTP API to generate summaries
4. **Front Matter Update**: Writes generated summary back to markdown file as YAML array in `ai` field

## Development Commands

### Testing the Plugin
```bash
# Install dependencies
npm install

# Test with a Hexo site (requires test site setup)
cd /path/to/hexo-site
npm install /path/to/hexo-generator-ai-summary
hexo clean && hexo generate --debug
```

### Development Workflow
```bash
# After making changes
npm version patch  # Update version number
npm publish        # Publish to npm
```

## Configuration Structure

Plugin is configured in Hexo's `_config.yml` under `ai_summary` key:

```yaml
ai_summary:
  enable: true
  require_front_matter_ai: false  # 是否要求front matter中包含ai字段才生成
  content_max_length: 0  # 传递给AI的内容长度限制，0表示不限制
  target_titles: ["Article Title 1", "Article Title 2"]
  force_refresh: false
  debug_force: false
  request_delay: 1000
  max_concurrent: 1
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

## Important Implementation Details

### Rate Limiting & Concurrency
- `AIService` implements rate limiting with configurable delays
- Request queue manages concurrent connections to prevent API overload
- Default: 1 concurrent request with 1000ms delay between requests

### Error Handling
- API errors are categorized and logged appropriately
- Failed summary generation doesn't break the build process
- Timeout protection (30 seconds) for all API calls

### File Processing
- Direct file modification writes summaries back to source markdown files
- Uses gray-matter and js-yaml for front matter parsing/generation
- Preserves existing front matter structure while adding `ai` field

### Content Processing
- Only processes posts with layout 'post' and source starting with '_posts/'
- When `require_front_matter_ai: true`, only processes posts that have `ai` field in front matter
- Content length is controlled by `content_max_length` parameter (0 = no limit)
- Generated summaries are cleaned and formatted as YAML arrays
- Individual summary items limited to 200 characters

## Dependencies

- **openai**: Official OpenAI client library for API requests
- **fs-extra**: Enhanced file system operations
- **gray-matter**: Front matter parsing (used by Hexo internally)
- **js-yaml**: YAML parsing and generation
- **lodash.merge**: Object merging for configuration

## Testing Notes

Currently no formal test suite exists. Manual testing requires:
1. A Hexo site with the plugin installed
2. Valid API credentials configured
3. Test posts with `ai: ""` in front matter
4. Run `hexo generate --debug` to see processing logs
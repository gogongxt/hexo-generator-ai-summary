const AIService = require("./lib/ai");
const merge = require("lodash.merge");
const fs = require("fs-extra");
const yaml = require("js-yaml");
const path = require("path");

const config = merge(
    {
        content_max_length: 0,
        ai_service: {
            endpoint: "https://api.deepseek.com/v1/chat/completions",
            headers: {
                Authorization: "Bearer YOUR_API_KEY",
            },
            params: {
                model: "deepseek-chat",
                temperature: 0.7,
                max_tokens: 200,
                messages: [
                    { role: "system", content: "请用中文生成一篇不超过200字的专业摘要" },
                ],
            },
        },
    },
    hexo.config.ai_summary || {},
);

if (!config.enable) {
    hexo.log.info("ai_summary 插件未启用");
    return;
}

const aiService = new AIService(config);

hexo.extend.filter.register(
    "before_post_render",
    async function (post) {
        const log = hexo.log;
        try {
            // 1. 基础检查：跳过非文章或空内容
            if (
                post.layout !== "post" ||
                !post.raw ||
                !post.content ||
                !post.source.startsWith("_posts/")
            ) {
                log.debug(`[跳过] 非文章或内容为空: ${post.title}`);
                return post;
            }

            // 2. 检查是否要求 front matter 中包含 ai 参数
            const requireFrontMatterAi = config.require_front_matter_ai || false;
            if (requireFrontMatterAi) {
                const hasAiField = post.ai !== undefined;
                if (!hasAiField) {
                    log.info(`[跳过] front matter 中无 ai 参数: ${post.title}`);
                    return post;
                }
            }

            // 3. 标题过滤：仅处理配置中的目标文章
            const targetTitles = config.target_titles || [];
            if (targetTitles.length > 0 && !targetTitles.includes(post.title)) {
                log.info(`[跳过] 非目标文章: ${post.title}`);
                return post;
            }

            // 4. 检查是否已存在摘要（调试模式下强制刷新）
            const hasExistingSummary =
                post.ai && Array.isArray(post.ai) && post.ai.length > 0;
            if (hasExistingSummary && !config.debug_force) {
                log.info(`[跳过] 已存在摘要: ${post.title}`);
                return post;
            }

            // 5. 生成摘要
            log.info(`[开始] 生成摘要: ${post.title}`);
            let rawSummary;
            try {
                rawSummary = await aiService.generateSummary(post.content);
            } catch (e) {
                log.error(`[失败] AI生成错误: ${e.message}`);
                return post;
            }

            // 6. 转换为 YAML 列表
            const aiList = convertToYamlList(rawSummary);
            if (aiList.length < 1 || aiList.some((item) => item.length > 200)) {
                log.warn(`[失败] 摘要内容不符合要求`);
                return post;
            }

            // 7. 更新 Front Matter
            const filePath = path.join(hexo.base_dir, "source", post.source);
            if (!fs.existsSync(filePath)) {
                log.error(`[错误] 文件不存在: ${filePath}`);
                return post;
            }
            const fileContent = await fs.readFile(filePath, "utf8");
            const frontMatterMatch = fileContent.match(/^---\n([\s\S]+?)\n---/);
            if (!frontMatterMatch) {
                log.warn(`[错误] Front Matter 格式异常: ${post.title}`);
                return post;
            }

            const frontMatterObj = yaml.load(frontMatterMatch[1]);
            frontMatterObj.ai = aiList;
            const newFrontMatter = yaml.dump(frontMatterObj, { lineWidth: -1 });
            const newContent = fileContent.replace(
                /^---\n[\s\S]+?\n---/,
                `---\n${newFrontMatter}\n---`,
            );

            // 8. 写入文件
            await fs.writeFile(filePath, newContent, "utf8");
            log.info(`[成功] 摘要已写入: ${post.title}`);
            return post;
        } catch (e) {
            log.error(`[全局错误] 处理失败: ${e.stack}`);
            return post;
        }
    },
    1,
);

function convertToYamlList(rawText) {
    if (!rawText || typeof rawText !== "string") {
        return [];
    }

    // 移除列表符号和换行符，清理空格，限制长度
    const processedText = rawText
        .replace(/^- /gm, "") // 移除行首的 "- "
        .replace(/\n/g, " ") // 换行符替换为空格
        .trim()
        .substring(0, 200); // 截断至200字

    return [processedText];
}
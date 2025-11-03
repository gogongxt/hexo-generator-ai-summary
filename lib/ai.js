const OpenAI = require("openai");

class AIService {
    constructor(config) {
        this.config = config.ai_service;
        this.contentMaxLength = config.content_max_length || 0;
        this.requestDelay = config.request_delay || 1000;
        this.lastRequestTime = 0;
        this.maxConcurrent = config.max_concurrent || 1;
        this.currentRequests = 0;
        this.requestQueue = [];

        // 初始化 OpenAI 客户端
        this.client = new OpenAI({
            baseURL: this.config.endpoint.replace("/chat/completions", ""),
            apiKey: this.config.headers.Authorization.replace("Bearer ", ""),
        });

        console.log(`[AI服务] 初始化完成，模型: ${this.config.params.model}`);
        console.log(
            `[AI服务] 内容长度限制: ${this.contentMaxLength === 0 ? "不限制" : this.contentMaxLength + " 字符"}`,
        );
    }

    /**
     * 等待速率限制
     */
    async waitForRateLimit() {
        const now = Date.now();
        const timeSinceLastRequest = now - this.lastRequestTime;

        if (timeSinceLastRequest < this.requestDelay) {
            const waitTime = this.requestDelay - timeSinceLastRequest;
            await this.sleep(waitTime);
        }

        this.lastRequestTime = Date.now();
    }

    /**
     * 获取请求槽位（并发控制）
     */
    async acquireRequestSlot() {
        return new Promise((resolve) => {
            if (this.currentRequests < this.maxConcurrent) {
                this.currentRequests++;
                resolve();
            } else {
                this.requestQueue.push(resolve);
            }
        });
    }

    /**
     * 释放请求槽位
     */
    releaseRequestSlot() {
        this.currentRequests--;
        if (this.requestQueue.length > 0) {
            const nextRequest = this.requestQueue.shift();
            this.currentRequests++;
            nextRequest();
        }
    }

    /**
     * 工具函数：延时
     */
    async sleep(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }

    /**
     * 生成文章摘要
     * @param {string} content - 文章内容
     * @returns {Promise<string>} 生成的摘要
     */
    async generateSummary(content) {
        try {
            await this.acquireRequestSlot();
            await this.waitForRateLimit();

            // 应用内容长度限制
            let processedContent = content;
            if (this.contentMaxLength > 0 && content.length > this.contentMaxLength) {
                processedContent = content.substring(0, this.contentMaxLength);
                console.log(
                    `[AI服务] 内容已截断，原长度: ${content.length} 字符，截断后: ${processedContent.length} 字符`,
                );
            }

            const messages = [
                ...this.config.params.messages,
                {
                    role: "user",
                    content: processedContent,
                },
            ];

            console.log(
                `[AI服务] 生成摘要开始，发送内容长度: ${processedContent.length} 字符`,
            );

            const response = await this.client.chat.completions.create({
                model: this.config.params.model,
                messages: messages,
                temperature: this.config.params.temperature,
                max_tokens: this.config.params.max_tokens,
            });

            const result = response.choices[0].message.content;

            if (!result) {
                throw new Error("AI 服务返回空内容");
            }

            const trimmedContent = result.trim();

            console.log(`[AI服务] 摘要生成成功，长度: ${trimmedContent.length} 字符`);
            return trimmedContent;
        } catch (error) {
            console.error(`[AI服务] 生成摘要失败: ${error.message}`);

            // 统一错误处理
            let errorMessage;
            switch (error.status) {
                case 401:
                    errorMessage = "API 密钥无效";
                    break;
                case 429:
                    errorMessage = "请求频率过高，请稍后重试";
                    break;
                case 500:
                    errorMessage = "AI 服务内部错误";
                    break;
                default:
                    errorMessage = error.message || "未知错误";
            }

            throw new Error(`AI 服务错误: ${errorMessage}`);
        } finally {
            this.releaseRequestSlot();
        }
    }
}

module.exports = AIService;
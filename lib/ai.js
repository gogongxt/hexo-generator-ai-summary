const axios = require('axios');

class AIService {
    constructor(config) {
        this.config = config.ai_service;
        this.requestDelay = config.request_delay || 1000; // 使用配置中的延迟时间，默认1秒
        this.lastRequestTime = 0;
        this.maxConcurrent = config.max_concurrent || 1; // 最大并发数
        this.currentRequests = 0; // 当前请求计数
        this.requestQueue = []; // 请求队列
    }

    async sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async waitForRateLimit() {
        const now = Date.now();
        const timeSinceLastRequest = now - this.lastRequestTime;

        if (timeSinceLastRequest < this.requestDelay) {
            const waitTime = this.requestDelay - timeSinceLastRequest;
            // console.log(`[速率控制] 等待 ${waitTime}ms 避免触发限制`);
            await this.sleep(waitTime);
        }

        this.lastRequestTime = Date.now();
    }

    async acquireRequestSlot() {
        return new Promise((resolve) => {
            if (this.currentRequests < this.maxConcurrent) {
                this.currentRequests++;
                // console.log(`[并发控制] 获得请求槽位，当前请求数: ${this.currentRequests}/${this.maxConcurrent}`);
                resolve();
            } else {
                // console.log(`[并发控制] 请求队列，等待槽位...`);
                this.requestQueue.push(resolve);
            }
        });
    }

    releaseRequestSlot() {
        this.currentRequests--;
        // console.log(`[并发控制] 释放请求槽位，当前请求数: ${this.currentRequests}/${this.maxConcurrent}`);

        if (this.requestQueue.length > 0) {
            const nextRequest = this.requestQueue.shift();
            this.currentRequests++;
            nextRequest();
        }
    }

    async generateSummary(content) {
        try {
            // 等待并发控制槽位
            await this.acquireRequestSlot();

            // 等待速率限制
            await this.waitForRateLimit();

            const messages = [
                ...this.config.params.messages,
                {
                    role: "user",
                    content: content.substring(0, 4000)
                }
            ];

            const response = await axios.post(
                this.config.endpoint,
                {
                    model: this.config.params.model,
                    messages,
                    temperature: this.config.params.temperature,
                    max_tokens: this.config.params.max_tokens
                },
                {
                    headers: this.config.headers,
                    timeout: 30000,
                    signal: AbortSignal.timeout(30000)
                }
            );

            return response.data.choices[0].message.content.trim();
        } catch (e) {
            // 分类错误类型并抛出
            let errorMessage;
            if (e.code === 'ECONNABORTED') {
                errorMessage = '请求超时';
            } else if (e.response?.status === 401) {
                errorMessage = 'API 密钥无效';
            } else if (e.response?.status === 429) {
                errorMessage = '请求频率过高，请稍后重试';
            } else if (e.response?.data?.error?.message) {
                errorMessage = e.response.data.error.message;
            } else {
                errorMessage = e.message;
            }
            throw new Error(`AI 服务错误: ${errorMessage}`);
        } finally {
            // 释放并发控制槽位
            this.releaseRequestSlot();
        }
    }
}

module.exports = AIService;
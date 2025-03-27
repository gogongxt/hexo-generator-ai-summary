const axios = require('axios');

class AIService {
    constructor(config) {
        this.config = config.ai_service;
    }

    async generateSummary(content) {
        try {
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
                    timeout: 15000,
                    signal: AbortSignal.timeout(15000)
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
            } else if (e.response?.data?.error?.message) {
                errorMessage = e.response.data.error.message;
            } else {
                errorMessage = e.message;
            }
            throw new Error(`AI 服务错误: ${errorMessage}`);
        }
    }
}

module.exports = AIService;
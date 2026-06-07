import { HfInference } from '@huggingface/inference';
import { logger } from '@/lib/utils/logger';
import { retryWithBackoff } from '@/lib/utils/retry';
import { ExternalServiceError } from '@/lib/utils/errors';
import { getOrSetCache, CACHE_DURATIONS, createCacheKey } from '@/lib/utils/cache';

export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface LLMResponse {
  content: string;
  model: string;
  tokens: {
    prompt: number;
    completion: number;
    total: number;
  };
}

/**
 * LLM Client using Qwen 2.5 via Hugging Face Inference API
 */
export class LLMClient {
  private readonly SERVICE_NAME = 'LLM_CLIENT';
  private readonly MODEL = 'Qwen/Qwen2.5-7B-Instruct';
  private hf: HfInference | null = null;

  private getHF(): HfInference {
    if (!this.hf) {
      const apiKey = process.env.HF_TOKEN;
      if (!apiKey) {
        logger.warn(this.SERVICE_NAME, 'HF_TOKEN environment variable is not set');
        throw new Error('HF_TOKEN environment variable is not set');
      }
      this.hf = new HfInference(apiKey);
    }
    return this.hf;
  }

  /**
   * Chat completion with message history
   */
  async chat(messages: Message[], options: { temperature?: number; maxTokens?: number } = {}): Promise<LLMResponse> {
    logger.info(this.SERVICE_NAME, 'Processing chat request', { messageCount: messages.length });

    const cacheKey = createCacheKey('llm_chat', JSON.stringify(messages));

    return getOrSetCache(
      cacheKey,
      async () => {
        return retryWithBackoff(async () => {
          try {
            const prompt = this.formatMessages(messages);
            const hf = this.getHF();

            const response = await hf.textGeneration({
              model: this.MODEL,
              inputs: prompt,
              parameters: {
                temperature: options.temperature || 0.7,
                max_new_tokens: options.maxTokens || 512,
              },
            });

            const content = response.generated_text || '';
            const lastMessage = content.substring(prompt.length).trim();

            const result: LLMResponse = {
              content: lastMessage,
              model: this.MODEL,
              tokens: {
                prompt: Math.ceil(prompt.length / 4),
                completion: Math.ceil(lastMessage.length / 4),
                total: Math.ceil((prompt.length + lastMessage.length) / 4),
              },
            };

            logger.info(this.SERVICE_NAME, 'Chat completed', { tokens: result.tokens });
            return result;
          } catch (error) {
            logger.error(this.SERVICE_NAME, 'Chat request failed', error);
            throw new ExternalServiceError('Qwen LLM', error instanceof Error ? error.message : 'Unknown error', 500);
          }
        });
      },
      CACHE_DURATIONS.MEDIUM
    );
  }

  /**
   * Simple text completion
   */
  async complete(prompt: string, options: { temperature?: number; maxTokens?: number } = {}): Promise<string> {
    logger.info(this.SERVICE_NAME, 'Processing completion request');

    return retryWithBackoff(async () => {
      try {
        const hf = this.getHF();
        const response = await hf.textGeneration({
          model: this.MODEL,
          inputs: prompt,
          parameters: {
            temperature: options.temperature || 0.7,
            max_new_tokens: options.maxTokens || 512,
          },
        });

        const content = response.generated_text || '';
        logger.info(this.SERVICE_NAME, 'Completion completed');
        return content;
      } catch (error) {
        logger.error(this.SERVICE_NAME, 'Completion request failed', error);
        throw new ExternalServiceError('Qwen LLM', error instanceof Error ? error.message : 'Unknown error', 500);
      }
    });
  }

  /**
   * Financial analysis using LLM
   */
  async analyzeFinancials(data: string, context: string = ''): Promise<string> {
    const prompt = `You are a financial analyst. Analyze the following financial data and provide insights.

Context: ${context}

Data:
${data}

Provide a comprehensive analysis including:
1. Key metrics and ratios
2. Trends and patterns
3. Risks and opportunities
4. Recommendations

Be specific and use numbers where possible.`;

    return this.complete(prompt, { maxTokens: 1024 });
  }

  /**
   * GST guidance
   */
  async getGSTGuidance(question: string): Promise<string> {
    const prompt = `You are a GST (Goods and Services Tax) expert. Answer the following question about GST in India.

Question: ${question}

Provide a clear, accurate answer with:
1. Direct answer to the question
2. Relevant GST rules and rates
3. Important considerations
4. Examples if applicable`;

    return this.complete(prompt, { maxTokens: 1024 });
  }

  /**
   * Accounting guidance
   */
  async getAccountingGuidance(question: string): Promise<string> {
    const prompt = `You are an accounting expert. Answer the following accounting question.

Question: ${question}

Provide a clear answer with:
1. Accounting standards reference
2. How to record this in books
3. Important considerations
4. Related regulations`;

    return this.complete(prompt, { maxTokens: 1024 });
  }

  private formatMessages(messages: Message[]): string {
    return messages.map((msg) => `${msg.role.toUpperCase()}: ${msg.content}`).join('\n\n');
  }
}

export const llmClient = new LLMClient();

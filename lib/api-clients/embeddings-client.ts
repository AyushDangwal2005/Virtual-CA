import { HfInference } from '@huggingface/inference';
import { retryWithBackoff } from '@/lib/utils/retry';
import { ExternalServiceError } from '@/lib/utils/errors';
import { logger } from '@/lib/utils/logger';

export interface Embedding {
  text: string;
  vector: number[];
  dimension: number;
}

/**
 * Embeddings Client using BGE via Hugging Face
 */
export class EmbeddingsClient {
  private readonly SERVICE_NAME = 'EMBEDDINGS_CLIENT';
  private readonly MODEL = 'BAAI/bge-small-en-v1.5';
  private hf: HfInference | null = null;
  private embeddingCache = new Map<string, number[]>();

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
   * Generate embedding for text
   */
  async embed(text: string): Promise<Embedding> {
    logger.info(this.SERVICE_NAME, 'Generating embedding for text', { textLength: text.length });

    // Check cache first
    if (this.embeddingCache.has(text)) {
      logger.debug(this.SERVICE_NAME, 'Embedding found in cache');
      const vector = this.embeddingCache.get(text)!;
      return {
        text,
        vector,
        dimension: vector.length,
      };
    }

    return retryWithBackoff(async () => {
      try {
        const hf = this.getHF();
        const response = await hf.featureExtraction({
          model: this.MODEL,
          inputs: text,
        });

        const vector = Array.isArray(response[0]) ? response[0] : response;
        const embedding: Embedding = {
          text,
          vector: Array.from(vector as any),
          dimension: (vector as any[]).length,
        };

        // Cache the embedding
        this.embeddingCache.set(text, embedding.vector);

        logger.info(this.SERVICE_NAME, 'Embedding generated', { dimension: embedding.dimension });
        return embedding;
      } catch (error) {
        logger.error(this.SERVICE_NAME, 'Embedding generation failed', error);
        throw new ExternalServiceError('BGE Embeddings', error instanceof Error ? error.message : 'Unknown error', 500);
      }
    });
  }

  /**
   * Generate embeddings for multiple texts (batch)
   */
  async embedBatch(texts: string[]): Promise<Embedding[]> {
    logger.info(this.SERVICE_NAME, 'Generating batch embeddings', { count: texts.length });

    const embeddings: Embedding[] = [];

    // Process in batches of 10 to avoid rate limiting
    for (let i = 0; i < texts.length; i += 10) {
      const batch = texts.slice(i, i + 10);
      const batchEmbeddings = await Promise.all(batch.map((text) => this.embed(text)));
      embeddings.push(...batchEmbeddings);
    }

    logger.info(this.SERVICE_NAME, 'Batch embeddings completed');
    return embeddings;
  }

  /**
   * Calculate similarity between two embeddings (cosine similarity)
   */
  cosineSimilarity(vec1: number[], vec2: number[]): number {
    let dotProduct = 0;
    let magnitude1 = 0;
    let magnitude2 = 0;

    for (let i = 0; i < vec1.length; i++) {
      dotProduct += vec1[i] * vec2[i];
      magnitude1 += vec1[i] * vec1[i];
      magnitude2 += vec2[i] * vec2[i];
    }

    magnitude1 = Math.sqrt(magnitude1);
    magnitude2 = Math.sqrt(magnitude2);

    if (magnitude1 === 0 || magnitude2 === 0) {
      return 0;
    }

    return dotProduct / (magnitude1 * magnitude2);
  }

  /**
   * Find most similar text from a list
   */
  async findMostSimilar(query: string, candidates: string[]): Promise<{ text: string; similarity: number }[]> {
    logger.info(this.SERVICE_NAME, 'Finding most similar texts', { queryLength: query.length, candidateCount: candidates.length });

    const queryEmbedding = await this.embed(query);
    const candidateEmbeddings = await this.embedBatch(candidates);

    const similarities = candidateEmbeddings.map((candidate) => ({
      text: candidate.text,
      similarity: this.cosineSimilarity(queryEmbedding.vector, candidate.vector),
    }));

    return similarities.sort((a, b) => b.similarity - a.similarity);
  }

  /**
   * Clear embedding cache
   */
  clearCache(): void {
    this.embeddingCache.clear();
    logger.info(this.SERVICE_NAME, 'Embedding cache cleared');
  }
}

export const embeddingsClient = new EmbeddingsClient();

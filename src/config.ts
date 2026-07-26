import type { DataType, PretrainedModelOptions } from "@huggingface/transformers";

export interface TextSplitterConfig {
    chunkSize: number;
    chunkOverlap: number;
}

export const CONFIG = Object.freeze({
    neo4j: {
        url: process.env.NEO4J_URL!,
        username: process.env.NEO4J_USER!,
        password: process.env.NEO4J_PASSWORD!,
        indexName: "tensors_index",
        searchType: "vector" as const,
        textNodeProperties: ["text"],
        nodeLabel: "Chunk",
    },
    openRouter: {
        nlpModel: process.env.NLP_MODEL,
        url: "https://openrouter.ai/api/v1",
        apiKey: process.env.OPENROUTER_API_KEY,
        temperature: 0.3,
        maxRetries: 2,
        defaultHeaders: {
            "HTTP-Referer": process.env.OPENROUTER_SITE_URL,
            "X-Title": process.env.OPENROUTER_SITE_NAME,
        }
    },
    pdf: {
        path: "./tensores.pdf",
    },
    textSplitter: {
        // define aproximadamente o tamanho de cada pedaço.
        chunkSize: 1000,
        //faz os últimos 200/300 caracteres reaparecerem no próximo chunk.
        chunkOverlap: 300,
    },
    embedding: {
        modelName: process.env.EMBEDDING_MODEL!,
        pretrainedOptions: {
            dtype: "fp32" as DataType, // Options: 'fp32' (best quality), 'fp16' (faster), 'q8', 'q4', 'q4f16' (quantized)
        } satisfies PretrainedModelOptions,
    },
    similarity: {
        //isso significa que quando você fizer uma busca por similaridade, 
        // o sistema vai retornar os 3 documentos mais relevantes para a pergunta feita.
        topK: 3,
    },
});
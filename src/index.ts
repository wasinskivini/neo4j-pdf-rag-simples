import { HuggingFaceTransformersEmbeddings } from "@langchain/community/embeddings/huggingface_transformers";
import { CONFIG } from "./config.ts";
import { DocumentProcessor } from "./documentProcessor.ts";
import { type PretrainedOptions } from "@huggingface/transformers";
import { Neo4jVectorStore } from "@langchain/community/vectorstores/neo4j_vector";
import { displayResults } from "./util.ts";
// import { displayResults } from "./util.ts";

let _neo4jVectorStore = null

//metodo para limpar todos os documentos existentes no banco de dados Neo4j
async function clearAll(vectorStore: Neo4jVectorStore, nodeLabel: string): Promise<void> {
    console.log("🗑️  Removendo todos os documentos existentes...");
    //executa uma query Cypher para deletar todos os nós com o label especificado
    await vectorStore.query(
        `MATCH (n:\`${nodeLabel}\`) DETACH DELETE n`
    )
    console.log("✅ Documentos removidos com sucesso\n");
}


try {
    console.log("🚀 Inicializando sistema de Embeddings com Neo4j...\n");
    //cria uma instância do DocumentProcessor com o caminho do PDF e a configuração do textSplitter
    const documentProcessor = new DocumentProcessor(
        CONFIG.pdf.path,
        CONFIG.textSplitter,
    )
    //carrega e divide o PDF em chunks
    const documents = await documentProcessor.loadAndSplitPDF()
    // console.log(documents);
    //cria uma instância do HuggingFaceTransformersEmbeddings com o modelo e as opções pré-treinadas especificadas na configuração
    const embeddings = new HuggingFaceTransformersEmbeddings({
        model: CONFIG.embedding.modelName,
        pretrainedOptions: CONFIG.embedding.pretrainedOptions as PretrainedOptions
    })
    
    // const response = await embeddings.embedQuery("JavaScript")
    // console.log('response', response)

    //cria uma instância do Neo4jVectorStore a partir do grafo existente no banco de dados Neo4j
    _neo4jVectorStore = await Neo4jVectorStore.fromExistingGraph(
        embeddings,
        CONFIG.neo4j
    )
    //limpa todos os documentos existentes no banco de dados Neo4j antes de adicionar novos documentos
    clearAll(_neo4jVectorStore, CONFIG.neo4j.nodeLabel)

    for (const [index, doc] of documents.entries()) {
        console.log(`✅ Adicionando documento ${index + 1}/${documents.length}`);
        await _neo4jVectorStore.addDocuments([doc])
    }
    console.log("\n✅ Base de dados populada com sucesso!\n");


    // ==================== STEP 2: RUN SIMILARITY SEARCH ====================
    console.log("🔍 ETAPA 2: Executando buscas por similaridade...\n");
    const questions = [
        // "O que são tensores e como são representados em JavaScript?",
        // "Como converter objetos JavaScript em tensores?",
        // "O que é normalização de dados e por que é necessária?",
        // "Como funciona uma rede neural no TensorFlow.js?",
        // "O que significa treinar uma rede neural?",
        // "o que é hot enconding e quando usar?"
        "oque e um Componente standalone"
    ]

    for (const question of questions) {
        //aqui o console.log é usado para exibir a pergunta atual e separar visualmente as perguntas no console.
        // Esse repeat é usado para criar uma linha de separação visual no console, tornando mais fácil identificar onde cada pergunta começa e termina.
        console.log(`\n${'='.repeat(80)}`);
        console.log(`📌 PERGUNTA: ${question}`);
        console.log('='.repeat(80));

        const results = await _neo4jVectorStore.similaritySearch(
            question,
            CONFIG.similarity.topK
        )
        displayResults(results)
        // console.log(results)
    }


    // // Cleanup
    // console.log(`\n${'='.repeat(80)}`);
    // console.log("✅ Processamento concluído com sucesso!\n");

} catch (error) {
    console.error('error', error)
} 
finally {
    await _neo4jVectorStore?.close();
}
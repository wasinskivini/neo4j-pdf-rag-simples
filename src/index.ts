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
    // apaga os documentos
    //         ↓
    // espera terminar
    //         ↓
    // adiciona os documentos novos
    //         ↓
    // executa as pesquisas
    await clearAll(_neo4jVectorStore, CONFIG.neo4j.nodeLabel)

    for (const [index, doc] of documents.entries()) {
        console.log(`✅ Adicionando documento ${index + 1}/${documents.length}`);
        await _neo4jVectorStore.addDocuments([doc])
    }
    console.log("\n✅ Base de dados populada com sucesso!\n");


    // ==================== STEP 2: RUN SIMILARITY SEARCH ====================
    console.log("🔍 ETAPA 2: Executando buscas por similaridade...\n");
    //questions é um array de perguntas que serão usadas para buscar documentos relevantes no banco de dados Neo4j
    // esse question é do pdf tensores.pdf, mas pode ser alterado para qualquer pergunta que você queira fazer sobre o conteúdo do PDF carregado.
    // const questions = [
    //     // "O que são tensores e como são representados em JavaScript?",
    //     // "Como converter objetos JavaScript em tensores?",
    //     // "O que é normalização de dados e por que é necessária?",
    //     // "Como funciona uma rede neural no TensorFlow.js?",
    //     // "O que significa treinar uma rede neural?",
    //     // "o que é hot enconding e quando usar?"
    //     "oque e um Componente standalone"
    // ]

    //QUESTIONS do ANGULAR-19.PDF
    //COM BASE NESSAS PERGUNTAS AQUI, REFINEI O MINIMUM SCORE PARA 0.61, POIS COM 0.72 NÃO ESTAVA RETORNANDO NENHUM RESULTADO RELEVANTE.
    // ASSIM FICA MAIS FACIL DE ENTENDER COMO ISSO FUNCIONA... IR REFINANDO AOS POUCOS E VENDO O QUE FUNCIONA MELHOR PARA CADA CASO.
    const questions = [
        // Devem encontrar conteúdo
        "O que é um componente standalone?",
        // "O roteamento permite trocar de página sem recarregar o site?",
        // "Para que servem os signals?",

        // Devem ser rejeitadas
        // "Como preparar um bolo de chocolate?",
        // "Quem ganhou a Copa do Mundo?",
        // "Como treinar uma rede neural?"
    ];

    for (const question of questions) {
        //aqui o console.log é usado para exibir a pergunta atual e separar visualmente as perguntas no console.
        // Esse repeat é usado para criar uma linha de separação visual no console, tornando mais fácil identificar onde cada pergunta começa e termina.
        console.log(`\n${'='.repeat(80)}`);
        console.log(`📌 PERGUNTA: ${question}`);
        console.log('='.repeat(80));

        //aqui o método similaritySearchWithScore é chamado para buscar os documentos mais relevantes para a pergunta atual,
        // retornando também o score de similaridade de cada documento encontrado.
        const resultsWithScores = await _neo4jVectorStore.similaritySearchWithScore(
            question,
            CONFIG.similarity.topK
        )

        console.log("\n📊 Resultados encontrados:");

        //aqui o método forEach é usado para iterar sobre os resultados encontrados,
        // exibindo o score e os primeiros 300 caracteres do conteúdo de cada documento.
        // o score.toFixed(4) é usado para formatar o score com 4 casas decimais, tornando a exibição mais legível.
        resultsWithScores.forEach(([document, score], index) => {
            console.log(`\n${index + 1}. Score: ${score.toFixed(4)}`);
            console.log(document.pageContent.slice(0, 300));
        });

        //aqui o método filter é usado para filtrar os resultados encontrados, 
        // mantendo apenas aqueles que possuem um score maior ou igual ao valor mínimo definido.
        //dentro do filter, o score de cada documento é comparado com o valor mínimo definido na constante MINIMUM_SCORE. 
        // e o "_" é usado para ignorar o primeiro elemento do array (o documento em si), já que só precisamos do score para a filtragem.
        const relevantResults = resultsWithScores.filter(([_, score]) => score >= CONFIG.similarity.minimumScore);
        //aqui o método filter é usado para filtrar os resultados encontrados, 
        // mantendo apenas aqueles que possuem um score maior ou igual ao valor mínimo definido.
        if (relevantResults.length === 0) {
            console.log("\n❌ Nenhum resultado relevante encontrado para a pergunta atual.");
            continue;
        }
        
        console.log(`\n✅ ${relevantResults.length} resultados relevantes encontrados para a pergunta atual.`);

        //aqui o método map é usado para extrair apenas os documentos relevantes dos resultados filtrados, 
        // descartando os scores.
        // o "_" é usado para ignorar o segundo elemento do array (o score), já que só precisamos do documento em si.
        const relevantesDocuments = relevantResults.map(([document, _]) => document);

        displayResults(relevantesDocuments)

        //aqui o método similaritySearch é chamado para buscar os documentos mais relevantes para a pergunta atual.
        // const results = await _neo4jVectorStore.similaritySearch(
        //     question,
        //     CONFIG.similarity.topK
        // )
        // displayResults(results)
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
# neo4j-pdf-rag-simples
Busca Semântica em PDFs com Neo4j
Projeto de estudo que transforma o conteúdo de um arquivo PDF em embeddings e armazena esses vetores no Neo4j para permitir buscas por similaridade semântica.
Ao receber uma pergunta, a aplicação gera um embedding para a consulta e recupera os trechos do documento com significado mais próximo.

Este projeto implementa uma busca semântica vetorial. Ele ainda não é um RAG completo, pois não utiliza uma LLM para gerar uma resposta final a partir dos trechos recuperados.
Como funciona
PDF
  ↓
Extração do texto
  ↓
Divisão em chunks
  ↓
Geração de embeddings
  ↓
Armazenamento no Neo4j
  ↓
Embedding da pergunta
  ↓
Busca por similaridade
  ↓
Retorno dos chunks mais relevantes
1. Leitura do PDF
A aplicação carrega o documento e extrai seu conteúdo textual.
2. Divisão em chunks
O texto é dividido em trechos menores, chamados chunks.
Exemplo:

const splitter = new RecursiveCharacterTextSplitter({
  chunkSize: 1000,
  chunkOverlap: 300,
});
chunkSize: tamanho aproximado de cada trecho.
chunkOverlap: quantidade de conteúdo repetida entre chunks consecutivos para preservar contexto.
3. Geração de embeddings
Cada chunk é convertido em um vetor numérico. Esse vetor representa características semânticas do texto.
Exemplo de modelo:

EMBEDDING_MODEL=Xenova/paraphrase-multilingual-MiniLM-L12-v2
4. Armazenamento no Neo4j
Cada trecho é salvo no Neo4j com propriedades semelhantes a:
Chunk
├── id
├── text
├── source
└── embedding
5. Busca semântica
A pergunta também é transformada em embedding.
O Neo4j compara o vetor da pergunta com os vetores armazenados e devolve os chunks mais próximos semanticamente.

Isso significa que a busca não depende apenas de palavras idênticas. Uma pergunta pode recuperar um trecho relevante mesmo quando utiliza termos diferentes do documento.

Exemplo
Pergunta:
O que é um componente standalone?
Resultado esperado:
Trecho 1:
Um componente representa uma parte da interface. Em um projeto moderno,
ele pode funcionar sem precisar ser declarado manualmente em um NgModule.
A aplicação retorna os trechos encontrados, mas não escreve uma resposta final como faria uma LLM.
Tecnologias
Node.js
TypeScript
LangChain
Transformers.js
Neo4j
Docker
Docker Compose
Pré-requisitos
Node.js 22 ou superior
npm
Docker Desktop
Verifique as instalações:
node --version
npm --version
docker --version
docker compose version
Instalação
Clone o repositório:
git clone https://github.com/SEU_USUARIO/neo4j-pdf-rag-simples.git
cd neo4j-pdf-rag-simples
Instale as dependências:
npm install
Variáveis de ambiente
Crie um arquivo .env na raiz do projeto:
NEO4J_URL=bolt://localhost:7687
NEO4J_USERNAME=neo4j
NEO4J_PASSWORD=sua_senha

EMBEDDING_MODEL=Xenova/paraphrase-multilingual-MiniLM-L12-v2
Os nomes das variáveis devem corresponder exatamente aos nomes utilizados pelo código.
Não publique o arquivo .env.

Executando o Neo4j
Inicie a infraestrutura:
npm run infra:up
A interface do Neo4j normalmente estará disponível em:
http://localhost:7474
A aplicação se conecta ao banco pela porta Bolt:
bolt://localhost:7687
Executando a aplicação
Modo de desenvolvimento:
npm run dev
Execução normal:
npm start
Scripts
{
  "scripts": {
    "start": "node --env-file .env --experimental-strip-types src/index.ts",
    "dev": "node --no-warnings --env-file .env --watch --experimental-strip-types src/index.ts",
    "infra:up": "docker compose up -d --wait",
    "infra:stop": "docker compose stop",
    "infra:down": "docker compose down",
    "infra:reset": "docker compose down --volumes"
  }
}
Diferença entre os comandos da infraestrutura
npm run infra:stop
Para os containers sem apagar os dados.
npm run infra:down
Para e remove os containers, mas mantém os volumes.
npm run infra:reset
Remove containers e volumes. Esse comando pode apagar os dados armazenados no Neo4j.
Estrutura sugerida
.
├── src/
│   ├── index.ts
│   ├── config.ts
│   └── documentProcessor.ts
├── documents/
│   └── exemplo.pdf
├── compose.yaml
├── package.json
├── tsconfig.json
├── .env
├── .gitignore
└── README.md
A estrutura real pode variar conforme a implementação.
O que este projeto é
Este projeto é um:
Sistema de busca semântica em PDFs usando embeddings e Neo4j.
Ele executa a etapa de recuperação de informação, também chamada de retrieval.
O que este projeto ainda não é
Ele ainda não é um RAG completo.
Um RAG completo possui três etapas:

Retrieval
  ↓
Augmentation
  ↓
Generation
Neste projeto, a etapa de recuperação já existe:
Pergunta
  ↓
Busca vetorial
  ↓
Chunks relevantes
Para transformá-lo em RAG, os chunks recuperados precisam ser enviados a uma LLM, junto com a pergunta, para gerar uma resposta final.
Limitações
Processa uma quantidade limitada de documentos.
Não gera uma resposta textual final.
Pode sempre retornar algum chunk, mesmo quando a pergunta não tem relação com o PDF.
A qualidade depende do modelo de embeddings.
A qualidade também depende de chunkSize, chunkOverlap e topK.
PDFs com tabelas, imagens ou formatação complexa podem ter extração incompleta.
Os chunks ainda podem não possuir uma ordem explícita no grafo.
Possíveis melhorias
Adicionar pontuação mínima de similaridade.
Exibir o score de cada resultado.
Guardar página e posição de cada chunk.
Criar uma propriedade chunkIndex.
Criar relacionamentos NEXT entre chunks.
Processar vários PDFs.
Adicionar filtros por documento.
Implementar busca híbrida.
Criar uma API REST.
Criar uma interface web.
Integrar uma LLM e transformar o projeto em RAG.
Exibir fontes e páginas utilizadas.
Adicionar testes automatizados.
Exemplo de filtro por relevância
Uma melhoria importante é utilizar similaritySearchWithScore:
const results = await vectorStore.similaritySearchWithScore(
  question,
  topK
);

const minimumScore = 0.75;

const relevantResults = results.filter(
  ([, score]) => score >= minimumScore
);
Caso nenhum trecho alcance a pontuação mínima:
if (relevantResults.length === 0) {
  console.log("Não encontrei essa informação no documento.");
}
O valor ideal do score deve ser calibrado com perguntas relacionadas e não relacionadas ao conteúdo.
Cuidados com o Git
O .gitignore deve conter:
node_modules/
.env
dist/
.DS_Store
*.log

neo4j/data/
neo4j/logs/
Os arquivos internos do Neo4j não devem ser enviados ao GitHub.
Mesmo após adicionar uma pasta ao .gitignore, arquivos que já foram adicionados ao Git continuam sendo rastreados. Nesse caso, é necessário removê-los do índice do Git sem apagar os arquivos locais.

Objetivo educacional
Este projeto foi criado para estudar:
Extração de texto de PDFs
Chunking
Embeddings
Similaridade semântica
Busca vetorial
Neo4j Vector Index
LangChain
Persistência com Docker
Fundamentos necessários para a construção de um RAG
Próxima etapa
Uma evolução natural é criar um segundo projeto que reutilize esta base e adicione uma LLM:
PDF
  ↓
Chunks
  ↓
Embeddings
  ↓
Neo4j
  ↓
Busca semântica
  ↓
Contexto
  ↓
LLM
  ↓
Resposta final
Esse segundo projeto poderá ser descrito como um RAG simples com Neo4j.
Aviso
Os resultados representam os trechos considerados mais próximos da pergunta pelo modelo de embeddings. Isso não garante que todo resultado seja realmente relevante ou suficiente para responder à consulta.
Licença
Este projeto pode ser utilizado para estudos e experimentação.

import type { Document } from "@langchain/core/documents";

function displayResults(results: Array<Document<Record<string, any>>>): void {
    console.log(`\n📄 Encontrados ${results.length} trechos relevantes:\n`);
    //aqui o forEach é usado para iterar sobre cada documento encontrado na busca por similaridade.
    results.forEach((doc, index) => {
        console.log(`   ${index + 1}.`);
        console.log(`      ${formatContent(doc.pageContent)}`);
        if (doc.metadata?.pageNumber) {
            console.log(`      📄 (Página: ${doc.metadata.pageNumber})`);
        }
        console.log();
    });
}
//aqui a função formatContent é usada para formatar o conteúdo do documento,
//  limitando o tamanho do texto exibido e removendo espaços em branco desnecessários.
function formatContent(content: string, maxLength: number = 1000): string {
    //aqui o replace é usado para substituir múltiplos espaços em branco por um único espaço,
    //  e o trim remove espaços em branco no início e no final da string.
    const cleaned = content.replace(/\s+/g, ' ').trim();
    //aqui o substring é usado para limitar o tamanho do conteúdo exibido, 
    // e se o conteúdo for maior que maxLength, ele adiciona "..." no final.
    return cleaned.length > maxLength
        ? `${cleaned.substring(0, maxLength)}...`
        : cleaned;
}

export {
    displayResults
}
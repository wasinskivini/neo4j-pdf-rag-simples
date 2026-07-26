import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { type TextSplitterConfig } from "./config.ts";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";

export class DocumentProcessor {
    private textSplitterConfig: TextSplitterConfig;
    private pdfPath: string;

    constructor( pdfPath: string, textSplitterConfig: TextSplitterConfig,) {
        this.pdfPath = pdfPath;
        this.textSplitterConfig = textSplitterConfig;
    }

    async loadAndSplitPDF(){
        //vai iniciar o carregamento do PDF e dividir em chunks
        const loader = new PDFLoader(this.pdfPath);
        //guarda o resultado do carregamento do PDF em uma variável
        const rawdocuments = await loader.load();
        console.log(`✅ loaded ${rawdocuments.length} pages from pdf documents`);
        //vai iniciar o processo de divisão do PDF em chunks
        const splitter = new RecursiveCharacterTextSplitter(this.textSplitterConfig);
        //guarda o resultado da divisão do PDF em chunks em uma variável
        const documents = await splitter.splitDocuments(rawdocuments);
        console.log(`✅ loaded ${documents.length} chunks from pdf documents`);
        return documents.map(doc => ({
            ...doc,
            metadata: {
                source: doc.metadata.source,
                index: doc.metadata.index,
            }
        }))
    }   
}
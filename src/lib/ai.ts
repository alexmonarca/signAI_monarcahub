import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.mjs';
import { GoogleGenAI, Type } from "@google/genai";

// Configure worker for pdfjs - Use a fixed version that matches our package.json
const PDFJS_VERSION = '4.10.38';
pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDFJS_VERSION}/pdf.worker.min.mjs`;

export async function extractTextFromPDF(file: File): Promise<string> {
  try {
    console.log('Iniciando extração de texto do PDF:', file.name);
    const arrayBuffer = await file.arrayBuffer();
    
    // Create a loading task
    const loadingTask = pdfjs.getDocument({ 
      data: arrayBuffer,
      useWorkerFetch: true,
      isEvalSupported: false
    });
    
    const pdf = await loadingTask.promise;
    console.log('PDF carregado com sucesso, páginas:', pdf.numPages);
    let fullText = '';

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ');
      fullText += pageText + '\n';
    }

    console.log('Extração concluída, tamanho do texto:', fullText.length);
    return fullText;
  } catch (err: any) {
    console.error('Erro na extração do PDF:', err);
    // If extraction fails, we still want to return something or throw a clear error
    throw new Error(`Falha ao ler o PDF: ${err.message}`);
  }
}

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function analyzeContract(content: string) {
  try {
    console.log('Iniciando análise do contrato com IA...');
    if (!content || content.trim().length < 10) {
      console.warn('Conteúdo do contrato muito curto para análise.');
      return null;
    }

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Analise o seguinte contrato e forneça um resumo, pontos positivos e pontos de atenção. 
      Responda em JSON com o seguinte formato:
      {
        "summary": "resumo aqui",
        "positive_points": ["ponto 1", "ponto 2"],
        "attention_points": ["ponto 1", "ponto 2"]
      }
      
      Contrato:
      ${content}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            positive_points: { type: Type.ARRAY, items: { type: Type.STRING } },
            attention_points: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["summary", "positive_points", "attention_points"]
        }
      }
    });

    console.log('Análise da IA recebida com sucesso.');
    return JSON.parse(response.text || '{}');
  } catch (err) {
    console.error('Erro na análise da IA:', err);
    return null; // Return null so the upload can still proceed
  }
}

export async function generateContract(prompt: string) {
  try {
    console.log('Gerando contrato com IA...');
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Você é um advogado especialista em redação de contratos. 
      Crie um contrato completo e profissional em português baseado no seguinte pedido: "${prompt}".
      O contrato deve ser bem estruturado, com cláusulas claras, foro, e espaços para preenchimento de dados das partes.
      Retorne APENAS o texto do contrato, sem introduções ou conclusões.`,
    });

    return response.text;
  } catch (err) {
    console.error('Erro ao gerar contrato:', err);
    throw err;
  }
}

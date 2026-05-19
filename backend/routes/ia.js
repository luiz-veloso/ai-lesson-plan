import express from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { z } from 'zod';

const router = express.Router();

// Validação com Zod para garantir que o Frontend enviou os dados corretos
const iaQuerySchema = z.object({
  title: z.string().min(3),
  discipline: z.string().min(2).optional(),
  abstract: z.string().min(10).optional(),
});

router.post('/recomendar', async (req, res) => {
  const startTime = Date.now();
  let title = '';
  let discipline = '';

  try {
    // 1. Valida os dados de entrada
    const validatedData = iaQuerySchema.parse(req.body);
    title = validatedData.title;
    discipline = validatedData.discipline ?? '';

    // 2. Inicializa o Gemini usando a variável de ambiente
    if (!process.env.AI_API_KEY) {
      throw new Error('A variável de ambiente AI_API_KEY não foi configurada.');
    }
    const ai = new GoogleGenerativeAI(process.env.AI_API_KEY);
    const model = ai.getGenerativeModel({ model: 'gemini-2.5-flash' });

    // 3. Engenharia de Prompt atuando como Assistente Pedagógico
    const optionalContext = []
    if (validatedData.discipline) {
      optionalContext.push(`- Disciplina: "${validatedData.discipline}"`)
    }
    if (validatedData.abstract) {
      optionalContext.push(`- Ementa/Resumo: "${validatedData.abstract}"`)
    }

    const prompt = `
      Você é um Assistente Pedagógico especialista em design instrucional e planejamento de aulas.
      Com base nos dados da aula fornecidos abaixo, gere o restante do plano de aula e, quando possível, melhore o que já foi informado.

      Dados da Aula:
      - Título: "${title}"
      ${optionalContext.join('\n      ')}

      Sua resposta DEVE ser estritamente um JSON válido, sem formatação markdown, sem explicações antes ou depois.
      Siga exatamente esta estrutura:
      {
        "discipline": "Disciplina sugerida ou existente",
        "abstract": "Ementa ou resumo da aula",
        "objective": "Objetivo de aprendizagem",
        "contents": ["conteúdo 1", "conteúdo 2"],
        "supportResources": ["recurso 1", "recurso 2"],
        "tags": ["tag1", "tag2", "tag3"]
      }
    `;

    // 4. Chama a API do Gemini
    const result = await model.generateContent(prompt);
    const responseText = result.response.text().trim();

    // 5. Converte o texto da IA em objeto JSON real
    const parsedData = JSON.parse(responseText);
    const latency = ((Date.now() - startTime) / 1000).toFixed(1);

    // 6. Log Estruturado de Sucesso (Requisito de Observabilidade)
    console.log(`[INFO] AI Request: Title="${title}", Discipline="${discipline}", Latency=${latency}s`);

    return res.status(200).json(parsedData);

  } catch (error) {
    const latency = ((Date.now() - startTime) / 1000).toFixed(1);
    
    // Log Estruturado de Erro
    // Log full error for diagnostics (do not leak keys)
    console.error('[ERROR] AI Request Failed:', {
      title: title || 'N/A',
      latency: `${latency}s`,
      message: error.message,
      stack: error.stack,
      errorDetails: error.errorDetails || null,
    });

    // In development, return a more detailed error to help debugging.
    if (process.env.NODE_ENV !== 'production') {
      return res.status(500).json({ 
        error: 'Falha ao gerar recomendações com a IA.',
        details: error.message,
        errorDetails: error.errorDetails || null,
      });
    }

    return res.status(500).json({ 
      error: 'Falha ao gerar recomendações com a IA. Certifique-se de que a ementa está clara ou tente novamente mais tarde.' 
    });
  }
});

export default router;
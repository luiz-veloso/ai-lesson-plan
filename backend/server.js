import './loadEnv.js';
import rotasIA from './routes/ia.js';
import express from 'express';
import cors from 'cors';
import rotasPlanos from './routes/planos.js';

const app = express();

// parte complicada do prisma 7+ com PG, usando o adapter oficial

import pkg from '@prisma/client';
const { PrismaClient } = pkg;
import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

// Cria a conexão direta usando o pacote nativo do PG
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);

// Passa o adapter para o PrismaClient (exigência do Prisma 7+)
const prisma = new PrismaClient({ adapter });

/////////////////////////////////////////////////////////////////////////////

const PORT = process.env.PORT || 3000;

// Warn if AI API key is missing — useful when deploying or running locally
if (!process.env.AI_API_KEY) {
  console.warn('[WARN] AI_API_KEY is not set. AI endpoints will fail until the key is provided.');
}

// === Middlewares ===
// Permite que o frontend (React) consiga fazer requisições para esta API
app.use(cors()); 
// Ensina o Express a entender requisições que chegam no formato JSON
app.use(express.json()); 

// === Rotas Básicas ===
// Endpoint de Health Check (Requisito Bônus de DevOps)
app.get('/health', async (req, res) => {
  try {
    // Tenta fazer uma consulta super simples para garantir que o banco está vivo
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({ 
      status: 'OK', 
      database: 'Connected', 
      timestamp: new Date().toISOString() 
    });
  } catch (error) {
    console.error('[ERROR] Health Check Failed:', error.message);
    res.status(500).json({ 
      status: 'ERROR', 
      database: 'Disconnected',
      error: error.message 
    });
  }
});

app.get('/', (req, res) => {
  res.status(200).json({
    app: 'Lesson Plan Manager',
    description: 'API para cadastro e consulta de planos de aula com suporte a recomendações de IA.',
    routes: {
      planos: '/api/planos',
      ia: '/api/ia/recomendar',
      health: '/health'
    },
    note: 'Use /health only for backend monitoring or CI checks; the main app uses /api/planos and /api/ia.'
  });
});

app.use('/api/planos', rotasPlanos);
app.use('/api/ia', rotasIA);

// === Inicialização do Servidor ===
app.listen(PORT, () => {
  console.log(`[INFO] Servidor rodando na porta ${PORT}`);
});
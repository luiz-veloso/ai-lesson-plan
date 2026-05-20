import express from 'express';
import { z } from 'zod';

const router = express.Router();
import prisma from '../prismaClient.js';

// Schema de Validação
const planoSchema = z.object({
  title: z.string().min(3, "Título deve ter no mínimo 3 caracteres"),
  objective: z.string().min(5),
  abstract: z.string().min(10),
  expectedDate: z.string().optional().transform((str) => {
    if (!str || !str.trim()) {
      return new Date()
    }
    const date = new Date(str)
    return Number.isNaN(date.getTime()) ? new Date() : date
  }),
  discipline: z.string().min(2),
  contents: z.array(z.string()),
  supportResources: z.array(z.string()),
  tags: z.array(z.string()),
});

// 1. Criar Plano (POST)
router.post('/', async (req, res) => {
  try {
    const data = planoSchema.parse(req.body);
    const plano = await prisma.lessonPlan.create({ data });
    
    console.log(`[INFO] Created Plan: Title="${plano.title}", Discipline="${plano.discipline}"`);
    res.status(201).json(plano);
  } catch (error) {
    res.status(400).json({ error: error.errors || error.message });
  }
});

// 2. Listar com Filtros e Paginação (GET)
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, discipline, tags, title } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const tagFilters = tags ? tags.split(',').map((item) => item.trim().toLowerCase()).filter(Boolean) : [];

    // Constrói os filtros dinâmicos para os campos suportados pelo SQLite
    const where = {
      ...(discipline && { discipline: { contains: discipline, mode: 'insensitive' } }),
      ...(title && { title: { contains: title, mode: 'insensitive' } }),
    };

    const planos = await prisma.lessonPlan.findMany({
      where,
      orderBy: { createdAt: 'desc' }, // Ordenação padrão por data de cadastro
    });

    const filteredPlanos = tagFilters.length
      ? planos.filter((plano) => {
          const planoTags = Array.isArray(plano.tags)
            ? plano.tags.map((tag) => String(tag).toLowerCase())
            : [];
          return tagFilters.every((tag) => planoTags.includes(tag));
        })
      : planos;

    const total = filteredPlanos.length;
    const pagedPlanos = filteredPlanos.slice(skip, skip + Number(limit));

    res.json({
      data: pagedPlanos,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / Number(limit)),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 3. Buscar Plano Específico (GET)
router.get('/:id', async (req, res) => {
  try {
    const plano = await prisma.lessonPlan.findUnique({ where: { id: req.params.id } });
    if (!plano) return res.status(404).json({ error: 'Plano não encontrado' });
    res.json(plano);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 4. Atualizar Plano (PUT)
router.put('/:id', async (req, res) => {
  try {
    const data = planoSchema.partial().parse(req.body); // .partial() torna os campos opcionais na edição
    const plano = await prisma.lessonPlan.update({
      where: { id: req.params.id },
      data,
    });
    
    console.log(`[INFO] Updated Plan: ID="${plano.id}"`);
    res.json(plano);
  } catch (error) {
    res.status(400).json({ error: error.errors || error.message });
  }
});

// 5. Deletar Plano (DELETE)
router.delete('/:id', async (req, res) => {
  try {
    await prisma.lessonPlan.delete({ where: { id: req.params.id } });
    
    console.log(`[INFO] Deleted Plan: ID="${req.params.id}"`);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
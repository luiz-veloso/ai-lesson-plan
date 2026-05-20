# AI Lesson Plan Manager

Um sistema de gerenciamento de planos de aula com CRUD, filtros, paginação e suporte a recomendações de IA.

## Visão geral

O projeto é dividido em dois serviços:

- `backend/`: API Express em Node.js com Prisma + SQLite local e integração com Google Generative AI.
- `frontend/`: SPA React construída com Vite para cadastro, edição e listagem de planos de aula.

## Funcionalidades principais

- Cadastro, edição e exclusão de planos de aula.
- Listagem com filtros por título, disciplina, tags e data prevista.
- Ordenação por título ou data de cadastro.
- Botão de IA que sugere automaticamente campos de um plano de aula a partir do título (e dados parciais já preenchidos).
- Health check em `/health`.

## Tecnologias

- Backend: Node.js, Express, Prisma 7, SQLite local, Zod, dotenv.
- Frontend: React, Vite, Axios.
- IA: `@google/generative-ai`.

## Estrutura do projeto

- `backend/`
  - `server.js`: servidor Express e rotas principais.
  - `routes/planos.js`: CRUD de planos de aula.
  - `routes/ia.js`: rota de recomendação de IA.
  - `prismaClient.js`: cliente Prisma usando SQLite local.
  - `loadEnv.js`: carregamento explícito do `.env`.
  - `.env`: variáveis de ambiente locais (não comitado).
- `frontend/`
  - `src/App.jsx`: formulário e interface principal.
  - `src/App.css`: estilos da aplicação.
  - `vite.config.js`: configuração do Vite.

## Como rodar localmente

### Backend

1. Entre na pasta do backend:

```bash
cd backend
```

2. Instale as dependências:

```bash
npm install
```

3. Crie um arquivo `.env` em `backend/` com:

```env
DATABASE_URL="file:./dev.db"
AI_API_KEY="sua_chave_google_generative_ai"
PORT=3000
```

4. Inicie o servidor:

```bash
npm run dev
```

O backend ficará disponível em `http://localhost:3000`.

### Frontend

1. Entre na pasta do frontend:

```bash
cd frontend
```

2. Instale as dependências:

```bash
npm install
```

3. Inicie o frontend:

```bash
npm run dev
```

O frontend roda em `http://localhost:5173` por padrão.

### Executando com Docker

1. Copie o arquivo de exemplo e configure sua chave de IA:

```bash
cp .env.example .env
```

2. Preencha `AI_API_KEY` em `.env`.

3. O arquivo `.env` deve conter pelo menos:

```env
AI_API_KEY=YOUR_GOOGLE_AI_KEY
VITE_API_BASE=http://localhost:3000
DATABASE_URL=file:./dev.db
PORT=3000
```

4. Suba os serviços com Docker Compose:

```bash
docker compose up --build
```

> Alternativa mais simples: use `make up` no diretório raiz.

4. Para rodar em segundo plano, use:

```bash
docker compose up -d --build
```

5. Para parar e remover os serviços:

```bash
docker compose down
```

6. Acesse:

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:3000`

O `docker-compose.yml` usa SQLite local para o backend e expõe apenas os serviços `backend` e `frontend`.

### Observações sobre IA

- O backend usa `AI_API_KEY` para autenticar chamadas à API do Google Generative AI.
- O projeto exige que a chave tenha permissão para acessar `generativelanguage.googleapis.com`.
- Se a IA retornar erro de acesso, verifique as permissões do projeto Google Cloud.

## Endpoints principais

- `GET /health` — health check
- `GET /api/planos` — lista de planos com paginação e filtros
- `POST /api/planos` — cria um plano de aula
- `PUT /api/planos/:id` — atualiza plano
- `DELETE /api/planos/:id` — remove plano
- `POST /api/ia/recomendar` — gera recomendações com IA

## Notas

- O projeto ainda não possui configuração completa de Docker e CI, mas a estrutura do backend e frontend já está pronta para rodar localmente.
- Use `.env` para não expor chaves sensíveis no controle de versão.

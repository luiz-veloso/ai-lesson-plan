import { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import './App.css'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3000'

const emptyForm = {
  title: '',
  objective: '',
  abstract: '',
  expectedDate: '',
  discipline: '',
  contents: [''],
  supportResources: [''],
  tags: [''],
}

function App() {
  const [planos, setPlanos] = useState([])
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [limit] = useState(10)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [filterTitle, setFilterTitle] = useState('')
  const [filterDiscipline, setFilterDiscipline] = useState('')
  const [filterTags, setFilterTags] = useState('')
  const [filterDate, setFilterDate] = useState('')
  const [sortBy, setSortBy] = useState('createdAt')
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    const controller = new AbortController()

    const fetchPlanos = async () => {
      setLoading(true)
      setError('')

      try {
        const params = { page, limit }
        if (filterTitle) params.title = filterTitle
        if (filterDiscipline) params.discipline = filterDiscipline
        if (filterTags) params.tags = filterTags

        const response = await axios.get(`${API_BASE}/api/planos`, {
          params,
          signal: controller.signal,
        })

        setPlanos(response.data.data)
        setTotal(response.data.total)
      } catch (err) {
        if (err.name === 'CanceledError') return
        setError(err.response?.data?.error || err.message || 'Falha ao carregar planos')
      } finally {
        setLoading(false)
      }
    }

    fetchPlanos()
    return () => controller.abort()
  }, [page, filterTitle, filterDiscipline, filterTags, refreshKey])

  const visiblePlanos = useMemo(() => {
    return planos
      .filter((plan) => !filterDate || plan.expectedDate.slice(0, 10) === filterDate)
      .sort((a, b) => {
        if (sortBy === 'title') {
          return a.title.localeCompare(b.title)
        }
        return new Date(b.createdAt) - new Date(a.createdAt)
      })
  }, [planos, filterDate, sortBy])

  const updateForm = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const updateArrayField = (field, value) => {
    setForm((prev) => ({
      ...prev,
      [field]: value
        .split('\n')
        .map((item) => item.trim())
        .filter(Boolean),
    }))
  }

  const handleEdit = (plan) => {
    setForm({
      title: plan.title,
      objective: plan.objective,
      abstract: plan.abstract,
      expectedDate: plan.expectedDate.slice(0, 10),
      discipline: plan.discipline,
      contents: plan.contents || [],
      supportResources: plan.supportResources || [],
      tags: plan.tags || [],
    })
    setEditingId(plan.id)
    setSuccess('')
    setError('')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleCancel = () => {
    setForm(emptyForm)
    setEditingId(null)
    setSuccess('Novo plano iniciado. Preencha os campos ou gere um plano com IA.')
    setError('')
    setAiLoading(false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleApiError = (err, fallback) => {
    setError(err.response?.data?.error || err.message || fallback)
  }

  const handleSave = async (event) => {
    event.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')

    try {
      const payload = {
        title: form.title,
        objective: form.objective,
        abstract: form.abstract,
        discipline: form.discipline,
        contents: form.contents,
        supportResources: form.supportResources,
        tags: form.tags,
      }
      if (form.expectedDate) payload.expectedDate = form.expectedDate

      if (editingId) {
        await axios.put(`${API_BASE}/api/planos/${editingId}`, payload)
        setSuccess('Plano atualizado com sucesso.')
      } else {
        await axios.post(`${API_BASE}/api/planos`, payload)
        setSuccess('Plano cadastrado com sucesso.')
      }

      setForm(emptyForm)
      setEditingId(null)
      setRefreshKey((prev) => prev + 1)
    } catch (err) {
      handleApiError(err, 'Falha ao salvar o plano.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Deseja realmente excluir este plano?')) {
      return
    }

    setSaving(true)
    setError('')
    setSuccess('')

    try {
      await axios.delete(`${API_BASE}/api/planos/${id}`)
      setSuccess('Plano excluído com sucesso.')
      setRefreshKey((prev) => prev + 1)
    } catch (err) {
      handleApiError(err, 'Falha ao excluir o plano.')
    } finally {
      setSaving(false)
    }
  }

  const handleSmartAssist = async () => {
    if (!form.title) {
      setError('Título é obrigatório para gerar o plano com IA.')
      return
    }

    setAiLoading(true)
    setError('')
    setSuccess('')

    try {
      const payload = { title: form.title }
      if (form.discipline) payload.discipline = form.discipline
      if (form.abstract) payload.abstract = form.abstract

      const response = await axios.post(`${API_BASE}/api/ia/recomendar`, payload)

      const {
        discipline,
        abstract,
        objective,
        contents = [],
        supportResources = [],
        tags = [],
      } = response.data

      setForm((prev) => ({
        ...prev,
        discipline: discipline || prev.discipline,
        abstract: abstract || prev.abstract,
        objective: objective || prev.objective,
        contents: contents.length ? contents : prev.contents,
        supportResources: supportResources.length ? supportResources : prev.supportResources,
        tags: tags.length ? tags : prev.tags,
      }))
      setSuccess('Plano de aula gerado com a IA. Você pode ajustar os campos livremente.')
    } catch (err) {
      handleApiError(err, 'Erro ao gerar o plano com IA.')
    } finally {
      setAiLoading(false)
    }
  }

  const planCount = visiblePlanos.length
  const totalPages = Math.max(1, Math.ceil(total / limit))

  return (
    <div className="app-container">
      <header className="page-header">
        <div>
          <p className="tagline">Lesson Plan Manager</p>
          <h1>Gerencie seus planos de aula com IA</h1>
          <p className="subtitle">
            Cadastre, filtre e organize planos com recomendações pedagógicas e acompanhamento inteligente.
          </p>
          <div className="stats-banner">
            <div className="stat-card">
              <span className="stat-label">Total de planos</span>
              <strong>{total}</strong>
            </div>
            <div className="stat-card">
              <span className="stat-label">Planos visíveis</span>
              <strong>{visiblePlanos.length}</strong>
            </div>
            <div className="stat-card">
              <span className="stat-label">Página</span>
              <strong>{page}</strong>
            </div>
          </div>
        </div>
        <div className="header-actions">
          <button type="button" className="secondary-button" onClick={handleCancel}>
            Novo Plano
          </button>
          <button type="button" className="secondary-button" onClick={() => setRefreshKey((prev) => prev + 1)}>
            Atualizar lista
          </button>
        </div>
      </header>

      <main className="main-grid">
        <section className="panel form-panel">
          <div className="panel-title">{editingId ? 'Editar plano' : 'Cadastrar novo plano'}</div>

          <form onSubmit={handleSave} className="plan-form">
            <label>
              Título da Aula
              <input
                value={form.title}
                onChange={(event) => updateForm('title', event.target.value)}
                placeholder="Ex: Introdução à Programação"
                required
              />
              <small className="hint">
                Informe apenas o título e clique em "Gerar plano com IA". Os outros campos serão sugeridos automaticamente e podem ser editados livremente.
              </small>
            </label>

            <label>
              Disciplina
              <input
                value={form.discipline}
                onChange={(event) => updateForm('discipline', event.target.value)}
                placeholder="Ex: Matemática, Física, História"
              />
            </label>

            <label>
              Ementa / Resumo
              <textarea
                value={form.abstract}
                onChange={(event) => updateForm('abstract', event.target.value)}
                placeholder="Descreva o objetivo e os temas abordados"
                rows={4}
                required
              />
            </label>

            <label>
              Objetivo
              <textarea
                value={form.objective}
                onChange={(event) => updateForm('objective', event.target.value)}
                placeholder="O que o aluno deve aprender com essa aula"
                rows={3}
              />
            </label>

            <div className="row-two">
              <label>
                Data Prevista
                <input
                  type="date"
                  value={form.expectedDate}
                  onChange={(event) => updateForm('expectedDate', event.target.value)}
                />
              </label>
              <label>
                Tags (uma linha por tag)
                <textarea
                  value={form.tags.join('\n')}
                  onChange={(event) => updateArrayField('tags', event.target.value)}
                  rows={3}
                  placeholder="Ex: lógica, STEM, introdução"
                />
              </label>
            </div>

            <label>
              Conteúdos (uma linha por item)
              <textarea
                value={form.contents.join('\n')}
                onChange={(event) => updateArrayField('contents', event.target.value)}
                rows={4}
                placeholder="Ex: Funções, Arrays, Laços"
              />
            </label>

            <label>
              Recursos de Apoio (uma linha por item)
              <textarea
                value={form.supportResources.join('\n')}
                onChange={(event) => updateArrayField('supportResources', event.target.value)}
                rows={4}
                placeholder="Ex: Vídeo, Slides, Atividade"
              />
            </label>

            <div className="form-actions">
              <button type="button" className="secondary-button" onClick={handleSmartAssist} disabled={aiLoading || saving}>
                {aiLoading ? 'Gerando com IA...' : 'Gerar plano com IA'}
              </button>
              <button type="submit" className="primary-button" disabled={saving || aiLoading}>
                {saving ? 'Salvando...' : editingId ? 'Atualizar Plano' : 'Salvar Plano'}
              </button>
            </div>

            {error && <div className="message error">{error}</div>}
            {success && <div className="message success">{success}</div>}
          </form>
        </section>

        <section className="panel list-panel">
          <div className="panel-title">Planos de Aula</div>

          <div className="filters-row">
            <label>
              Buscar título
              <input value={filterTitle} onChange={(event) => setFilterTitle(event.target.value)} placeholder="Pesquisar..." />
            </label>
            <label>
              Disciplina
              <input value={filterDiscipline} onChange={(event) => setFilterDiscipline(event.target.value)} placeholder="Filtrar disciplina" />
            </label>
            <label>
              Tags
              <input value={filterTags} onChange={(event) => setFilterTags(event.target.value)} placeholder="Ex: STEM, lógica" />
            </label>
            <label>
              Data prevista
              <input type="date" value={filterDate} onChange={(event) => setFilterDate(event.target.value)} />
            </label>
          </div>

          <div className="toolbar">
            <div>{loading ? 'Carregando planos...' : `${planCount} plano(s) exibido(s)`}</div>
            <div className="sort-group">
              <label>Ordenar por</label>
              <select value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
                <option value="createdAt">Data de cadastro</option>
                <option value="title">Título</option>
              </select>
            </div>
          </div>

          <div className="plan-list">
            {visiblePlanos.length === 0 && !loading ? (
              <div className="empty-state">Nenhum plano encontrado com esses filtros.</div>
            ) : (
              visiblePlanos.map((plan) => (
                <article key={plan.id} className="plan-card">
                  <div className="plan-card-header">
                    <div>
                      <h2>{plan.title}</h2>
                      <p className="plan-meta">
                        <span>{plan.discipline}</span>
                        <span>{new Date(plan.expectedDate).toLocaleDateString()}</span>
                      </p>
                    </div>
                    <div className="card-actions">
                      <button type="button" className="secondary-small" onClick={() => handleEdit(plan)}>
                        Editar
                      </button>
                      <button type="button" className="danger-small" onClick={() => handleDelete(plan.id)}>
                        Excluir
                      </button>
                    </div>
                  </div>

                  {plan.objective && <p className="plan-objective"><strong>Objetivo:</strong> {plan.objective}</p>}
                  <p className="plan-description">{plan.abstract}</p>

                  <div className="tag-row">
                    {(plan.tags || []).map((tag) => (
                      <span key={tag} className="tag-pill">
                        {tag}
                      </span>
                    ))}
                  </div>

                  <div className="list-grid">
                    <div>
                      <h3>Conteúdos</h3>
                      <ul>
                        {(plan.contents || []).map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h3>Recursos</h3>
                      <ul>
                        {(plan.supportResources || []).map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </article>
              ))
            )}
          </div>

          <div className="pagination">
            <button type="button" onClick={() => setPage((prev) => Math.max(prev - 1, 1))} disabled={page === 1}>
              Anterior
            </button>
            <span>
              Página {page} de {totalPages}
            </span>
            <button type="button" onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))} disabled={page >= totalPages}>
              Próxima
            </button>
          </div>
        </section>
      </main>
    </div>
  )
}

export default App

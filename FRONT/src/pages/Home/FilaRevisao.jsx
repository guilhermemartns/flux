import React, { useEffect, useState, useCallback, useRef } from 'react';
import { usePageTitle } from '../../components/PageTitleContext';
import { SkLine, SkBlock, SkCard, SkCircle } from '../../components/Skeleton';
import api from '../../services/api';
import { useAuth } from '../../auth.jsx';
import { CheckCircle, XCircle, Archive, Trash2, Edit2, AlertCircle, Award, Filter, X as XIcon, HelpCircle } from 'react-feather';
import Modal from 'react-bootstrap/Modal';

const STATUS_LABELS = {
  pendente:  { label: 'Pendente',  color: '#FF2D55', bg: 'rgba(255,45,85,0.12)' },
  dominado:  { label: 'Dominado',  color: '#34C759', bg: 'rgba(52,199,89,0.12)' },
  arquivado: { label: 'Arquivado', color: '#8e8e93', bg: 'rgba(142,142,147,0.12)' },
};

const TIPO_LABELS = {
  erro:   { label: 'Erro',   color: '#FF2D55' },
  branco: { label: 'Branco', color: '#FF9500' },
  chute:  { label: 'Chute',  color: '#AF52DE' },
};

export default function FilaRevisao() {
  const { setTitle, setTitleExtra } = usePageTitle();
  const { user } = useAuth();
  const [itens, setItens] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filtroStatus, setFiltroStatus] = useState('pendente');
  const [filtroMateria, setFiltroMateria] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('');
  const [filtroFonte, setFiltroFonte] = useState('');
  const [filtroMotivoErro, setFiltroMotivoErro] = useState('');
  const [busca, setBusca] = useState('');
  const [counts, setCounts] = useState({ pendentes: 0, dominados: 0, arquivados: 0 });
  const [editandoAnotacao, setEditandoAnotacao] = useState(null); // id do item
  const [anotacaoTemp, setAnotacaoTemp] = useState('');
  const [showAnotacaoModal, setShowAnotacaoModal] = useState(false);
  const [selecionados, setSelecionados] = useState(new Set());
  const [acaoBatchLoading, setAcaoBatchLoading] = useState(false);
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [itensPorPagina, setItensPorPagina] = useState(20);
  const filterPanelRef = useRef(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [materias, setMaterias] = useState([]);
  const [novoItem, setNovoItem] = useState({ materiaNome: '', numeroQuestao: '', tipo: 'erro', editalItem: '', motivoErro: '', anotacao: '', chute: false });

  const projetoId = localStorage.getItem('projetoSelecionado') || '';
  const userId = user?.id || '';
  const [showHelpModal, setShowHelpModal] = useState(false);

  const fetchItens = useCallback(async () => {
    if (!userId || !projetoId) return;
    setLoading(true);
    try {
      const params = { userId, projetoId };
      if (filtroStatus) params.status = filtroStatus;
      if (filtroMateria) params.materiaId = filtroMateria;
      const res = await api.get('/fila-revisao', { params });
      setItens(res.data);
    } catch { setItens([]); }
    setLoading(false);
  }, [userId, projetoId, filtroStatus, filtroMateria]);

  const fetchCounts = useCallback(async () => {
    if (!userId || !projetoId) return;
    try {
      const res = await api.get('/fila-revisao/count', { params: { userId, projetoId } });
      setCounts(res.data);
    } catch { }
  }, [userId, projetoId]);

  const fetchMaterias = useCallback(async () => {
    if (!userId || !projetoId) return;
    try {
      const res = await api.get('/edital', { params: { userId, projetoId } });
      setMaterias((res.data || []).filter(m => m.projetoId === projetoId && m.nome && m.nome.trim() !== ''));
    } catch { }
  }, [userId, projetoId]);

  useEffect(() => {
    setTitle('Fila de Revisão');
    document.title = 'FLUX | Fila de Revisão';
    setTitleExtra(
      <button
        className="btn p-0 d-flex align-items-center gap-1"
        style={{ color: 'var(--text-light)', fontSize: '0.78em', fontWeight: 500, border: 'none', background: 'none', lineHeight: 1 }}
        onClick={() => setShowHelpModal(true)}
      >
        <HelpCircle size={14} />
      </button>
    );
    return () => setTitleExtra(null);
  }, [setTitle, setTitleExtra]);

  useEffect(() => { fetchItens(); fetchCounts(); fetchMaterias(); }, [fetchItens, fetchCounts, fetchMaterias]);

  async function handleAcertei(id) {
    await api.put(`/fila-revisao/${id}/acertei`);
    fetchItens(); fetchCounts();
    window.dispatchEvent(new Event('filaRevisaoAtualizada'));
  }

  async function handleErrei(id) {
    await api.put(`/fila-revisao/${id}/errei`);
    fetchItens(); fetchCounts();
    window.dispatchEvent(new Event('filaRevisaoAtualizada'));
  }

  async function handleArquivar(id) {
    await api.put(`/fila-revisao/${id}`, { status: 'arquivado' });
    fetchItens(); fetchCounts();
    window.dispatchEvent(new Event('filaRevisaoAtualizada'));
  }

  async function handleRemover(id) {
    if (!window.confirm('Remover este item da fila?')) return;
    await api.delete(`/fila-revisao/${id}`);
    fetchItens(); fetchCounts();
    window.dispatchEvent(new Event('filaRevisaoAtualizada'));
  }

  async function handleSalvarAnotacao(id) {
    await api.put(`/fila-revisao/${id}`, { anotacao: anotacaoTemp });
    setEditandoAnotacao(null);
    setShowAnotacaoModal(false);
    fetchItens();
  }

  function toggleSelecionado(id) {
    setSelecionados(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function toggleSelecionarTodos() {
    if (selecionados.size === itensFiltrados.length && itensFiltrados.length > 0) {
      setSelecionados(new Set());
    } else {
      setSelecionados(new Set(itensFiltrados.map(i => i.id)));
    }
  }

  async function handleBatchAcertei() {
    setAcaoBatchLoading(true);
    await Promise.all([...selecionados].map(id => api.put(`/fila-revisao/${id}/acertei`).catch(() => null)));
    setSelecionados(new Set());
    fetchItens(); fetchCounts();
    window.dispatchEvent(new Event('filaRevisaoAtualizada'));
    setAcaoBatchLoading(false);
  }

  async function handleBatchErrei() {
    setAcaoBatchLoading(true);
    await Promise.all([...selecionados].map(id => api.put(`/fila-revisao/${id}/errei`).catch(() => null)));
    setSelecionados(new Set());
    fetchItens(); fetchCounts();
    window.dispatchEvent(new Event('filaRevisaoAtualizada'));
    setAcaoBatchLoading(false);
  }

  async function handleBatchArquivar() {
    setAcaoBatchLoading(true);
    await Promise.all([...selecionados].map(id => api.put(`/fila-revisao/${id}`, { status: 'arquivado' }).catch(() => null)));
    setSelecionados(new Set());
    fetchItens(); fetchCounts();
    window.dispatchEvent(new Event('filaRevisaoAtualizada'));
    setAcaoBatchLoading(false);
  }

  async function handleBatchRemover() {
    if (!window.confirm(`Remover ${selecionados.size} item(ns) da fila?`)) return;
    setAcaoBatchLoading(true);
    await Promise.all([...selecionados].map(id => api.delete(`/fila-revisao/${id}`).catch(() => null)));
    setSelecionados(new Set());
    fetchItens(); fetchCounts();
    window.dispatchEvent(new Event('filaRevisaoAtualizada'));
    setAcaoBatchLoading(false);
  }

  async function handleAdicionarManual(e) {
    e.preventDefault();
    const mat = materias.find(m => m.nome === novoItem.materiaNome);
    await api.post('/fila-revisao', {
      userId,
      projetoId,
      materiaId: mat?.id || '',
      materiaNome: novoItem.materiaNome,
      simuladoId: '000000000000000000000000',
      numeroQuestao: parseInt(novoItem.numeroQuestao) || 0,
      tipo: novoItem.tipo,
      editalItem: novoItem.editalItem,
      motivoErro: novoItem.motivoErro,
      anotacao: novoItem.anotacao,
    });
    setShowAddModal(false);
    setNovoItem({ materiaNome: '', numeroQuestao: '', tipo: 'erro', editalItem: '', motivoErro: '', anotacao: '', chute: false });
    fetchItens(); fetchCounts();
  }

  const itensFiltrados = itens.filter(item => {
    if (filtroTipo && item.tipo !== filtroTipo) return false;
    if (filtroFonte && item.fonte !== filtroFonte) return false;
    if (filtroMotivoErro && item.motivoErro !== filtroMotivoErro) return false;
    if (!busca) return true;
    return (
      item.materiaNome?.toLowerCase().includes(busca.toLowerCase()) ||
      String(item.numeroQuestao).includes(busca) ||
      item.editalItem?.toLowerCase().includes(busca.toLowerCase())
    );
  });

  const todosSelecionados = itensFiltrados.length > 0 && selecionados.size === itensFiltrados.length;
  const algumSelecionado = selecionados.size > 0;

  const totalPaginas = itensPorPagina === 0 ? 1 : Math.max(1, Math.ceil(itensFiltrados.length / itensPorPagina));
  const paginaSegura = Math.min(paginaAtual, totalPaginas);
  const itensPaginados = itensPorPagina === 0
    ? itensFiltrados
    : itensFiltrados.slice((paginaSegura - 1) * itensPorPagina, paginaSegura * itensPorPagina);

  // Reset página ao mudar filtros
  useEffect(() => { setPaginaAtual(1); }, [filtroStatus, filtroMateria, filtroTipo, filtroFonte, filtroMotivoErro, busca]);

  // Fecha painel ao clicar fora
  useEffect(() => {
    function handleClickOutside(e) {
      if (filterPanelRef.current && !filterPanelRef.current.contains(e.target)) {
        setShowFilterPanel(false);
      }
    }
    if (showFilterPanel) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showFilterPanel]);

  const materiaNomeFiltro = materias.find(m => m.id === filtroMateria)?.nome || '';
  const MOTIVO_LABELS = { 'Falta de teoria': 'Falta de teoria', 'Falta de revisão': 'Falta de revisão', 'Falta de atenção': 'Falta de atenção', 'Desconhecimento': 'Desconhecimento', 'Interpretação': 'Interpretação' };

  const activeFilters = [
    filtroMateria && { key: 'materia', label: materiaNomeFiltro, clear: () => setFiltroMateria('') },
    filtroFonte && { key: 'fonte', label: filtroFonte === 'bateria' ? 'Bateria' : 'Simulado', clear: () => setFiltroFonte('') },
    filtroTipo && { key: 'tipo', label: TIPO_LABELS[filtroTipo]?.label || filtroTipo, clear: () => { setFiltroTipo(''); setFiltroMotivoErro(''); } },
    filtroMotivoErro && { key: 'motivo', label: filtroMotivoErro, clear: () => setFiltroMotivoErro('') },
    filtroStatus && { key: 'status', label: STATUS_LABELS[filtroStatus]?.label || filtroStatus, clear: () => setFiltroStatus('') },
  ].filter(Boolean);

  const labelStyle = { fontSize: '0.75em', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-light)', fontWeight: 600 };

  return (
    <div className="app-container">
    <div className="container-fluid px-3 pt-2 pb-4" style={{ maxWidth: 1100 }}>

      {/* Modal de ajuda */}
      <Modal show={showHelpModal} onHide={() => setShowHelpModal(false)} centered className="modal-fundo">
        <Modal.Body className="modal-estilo">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <Modal.Title className="fw-bold fs-5 m-0" style={{ color: 'var(--text-middle)' }}>Como funciona a Fila de Revisão?</Modal.Title>
            <button className="btn p-0" style={{ background: 'none', border: 'none', color: 'var(--text-light)' }} onClick={() => setShowHelpModal(false)}><XIcon size={18} /></button>
          </div>

          <div className="d-flex flex-column gap-3" style={{ fontSize: '0.88em' }}>
            <div>
              <div className="fw-bold mb-1" style={{ color: 'var(--text-middle)' }}>📥 Como as questões entram?</div>
              <p className="m-0" style={{ color: 'var(--text-light)' }}>Ao salvar um <strong>simulado</strong> ou uma <strong>bateria de questões</strong>, questões <span style={{ color: '#FF2D55', fontWeight: 600 }}>erradas</span>, <span style={{ color: '#FF9500', fontWeight: 600 }}>em branco</span> e <span style={{ color: '#AF52DE', fontWeight: 600 }}>chutadas (mesmo acertando)</span> são automaticamente adicionadas como <span style={{ color: 'var(--text-middle)', fontWeight: 600 }}>Pendentes</span>. Questões acertadas sem chute são removidas da fila.</p>
            </div>
            <div>
              <div className="fw-bold mb-1" style={{ color: 'var(--text-middle)' }}>🔄 Status das questões</div>
              <ul className="m-0 ps-3 d-flex flex-column gap-1" style={{ color: 'var(--text-light)' }}>
                <li><span style={{ color: '#FF2D55', fontWeight: 600 }}>Pendente</span> — precisa revisar</li>
                <li><span style={{ color: '#34C759', fontWeight: 600 }}>Dominado</span> — acertou na revisão 2x consecutivas</li>
                <li><span style={{ color: '#8e8e93', fontWeight: 600 }}>Arquivado</span> — removido da fila ativa sem dominar</li>
              </ul>
            </div>
            <div>
              <div className="fw-bold mb-1" style={{ color: 'var(--text-middle)' }}>✅ Acertei / ❌ Errei</div>
              <p className="m-0" style={{ color: 'var(--text-light)' }}>Clique <span style={{ color: '#34C759', fontWeight: 600 }}>Acertei</span> para registrar um acerto consecutivo — ao acertar 2x seguidas a questão vira <span style={{ color: '#34C759', fontWeight: 600 }}>Dominada</span> e sai da fila. Clicando <span style={{ color: '#FF2D55', fontWeight: 600 }}>Errei</span>, o contador é zerado.</p>
            </div>
            <div>
              <div className="fw-bold mb-1" style={{ color: 'var(--text-middle)' }}>📝 Tipos</div>
              <ul className="m-0 ps-3 d-flex flex-column gap-1" style={{ color: 'var(--text-light)' }}>
                <li><span style={{ color: '#FF2D55', fontWeight: 600 }}>Erro</span> — respondeu errado</li>
                <li><span style={{ color: '#FF9500', fontWeight: 600 }}>Branco</span> — não respondeu</li>
                <li><span style={{ color: '#AF52DE', fontWeight: 600 }}>Chute</span> — acertou mas marcou como chute</li>
              </ul>
            </div>
            <div>
              <div className="fw-bold mb-1" style={{ color: 'var(--text-middle)' }}>🏷️ Fonte</div>
              <p className="m-0" style={{ color: 'var(--text-light)' }}>Cada item indica se veio de um <span style={{ color: '#007AFF', fontWeight: 600 }}>Simulado</span> ou de uma <span style={{ color: '#AF52DE', fontWeight: 600 }}>Bateria</span>. Use o filtro de Fonte para focar em apenas um tipo.</p>
            </div>
            <div>
              <div className="fw-bold mb-1" style={{ color: 'var(--text-middle)' }}>🔍 Filtros e anotações</div>
              <p className="m-0" style={{ color: 'var(--text-light)' }}>Use o painel de filtros para segmentar por matéria, tipo, fonte ou motivo de erro. Clique no ícone de lápis para adicionar uma <strong>anotação</strong> a qualquer item — útil para registrar o raciocínio correto da questão.</p>
            </div>
          </div>

          <div className="d-flex justify-content-end mt-4">
            <button className="btn btn-primary-primary3" onClick={() => setShowHelpModal(false)}>Entendi</button>
          </div>
        </Modal.Body>
      </Modal>

      {/* Cards de contagem por status */}
      <div className="d-flex gap-3 mt-3 flex-wrap">
        {[
          { key: 'pendente', label: 'Pendentes', count: counts.pendentes, icon: <AlertCircle size={20} />, color: '#FF2D55' },
          { key: 'dominado', label: 'Dominados', count: counts.dominados, icon: <Award size={20} />, color: '#34C759' },
          { key: 'arquivado', label: 'Arquivados', count: counts.arquivados, icon: <Archive size={20} />, color: '#8e8e93' },
        ].map(({ key, label, count, icon, color }) => (
          <div
            key={key}
            className="card-padrao2 pointer d-flex align-items-center gap-3 px-4 py-3"
            style={{ flex: '1 1 140px', border: filtroStatus === key ? `1.5px solid ${color}` : '1.5px solid transparent', cursor: 'pointer', transition: 'border 0.15s' }}
            onClick={() => setFiltroStatus(key)}
          >
            <span style={{ color }}>{icon}</span>
            <div>
              <div style={{ fontSize: '1.5em', fontWeight: 700, lineHeight: 1, color }}>{count}</div>
              <div style={labelStyle}>{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Cards de filtro por tipo */}
      <div className="d-flex gap-2 mt-2 flex-wrap">
        {[
          { key: 'erro',   label: 'Erros',   color: '#FF2D55', bg: 'rgba(255,45,85,0.10)' },
          { key: 'branco', label: 'Brancos', color: '#FF9500', bg: 'rgba(255,149,0,0.10)' },
          { key: 'chute',  label: 'Chutes',  color: '#AF52DE', bg: 'rgba(175,82,222,0.10)' },
        ].map(({ key, label, color, bg }) => {
          const count = itens.filter(i => i.tipo === key).length;
          const active = filtroTipo === key;
          return (
            <div
              key={key}
              className="d-flex align-items-center gap-2 px-3 py-2"
              style={{
                background: active ? bg : 'var(--background-l-light)',
                border: `1.5px solid ${active ? color : 'var(--border)'}`,
                borderRadius: 10, cursor: 'pointer', transition: 'all 0.15s',
                userSelect: 'none',
              }}
              onClick={() => { setFiltroTipo(active ? '' : key); if (key !== 'erro') setFiltroMotivoErro(''); }}
            >
              <span style={{ fontSize: '1.1em', fontWeight: 700, color, lineHeight: 1 }}>{count}</span>
              <span style={{ fontSize: '0.78em', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: active ? color : 'var(--text-light)' }}>{label}</span>
            </div>
          );
        })}
      </div>

      {/* Filtros */}
      <div className="mb-3">
        <div className="d-flex gap-2 align-items-center">
          <input
            className="form-control linha"
            style={{ maxWidth: 280, fontSize: '0.88em' }}
            placeholder="Buscar por matéria, nº ou edital..."
            value={busca}
            onChange={e => setBusca(e.target.value)}
          />
          <div style={{ position: 'relative' }} ref={filterPanelRef}>
            <button
              className="btn btn-outline-primary-primary3 d-flex align-items-center gap-2"
              style={{ fontSize: '0.85em', position: 'relative' }}
              onClick={() => setShowFilterPanel(p => !p)}
            >
              <Filter size={14} />
              Filtros
              {activeFilters.length > 0 && (
                <span style={{
                  position: 'absolute', top: -7, right: -7,
                  background: 'var(--primary, #0070FF)', color: '#fff',
                  borderRadius: '50%', width: 18, height: 18,
                  fontSize: '0.72em', fontWeight: 700,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  lineHeight: 1,
                }}>
                  {activeFilters.length}
                </span>
              )}
            </button>

            {showFilterPanel && (
              <div style={{
                position: 'absolute', top: 'calc(100% + 8px)', left: 0, zIndex: 200,
                background: 'var(--background-l-light)', border: '1.5px solid var(--border)',
                borderRadius: 12, padding: '16px 18px', minWidth: 280,
                boxShadow: '0 8px 32px rgba(0,0,0,0.13)',
              }}>
                <div className="d-flex flex-column gap-3">
                  <div>
                    <div style={labelStyle} className="mb-1">Status</div>
                    <div className="d-flex gap-1 flex-wrap">
                      {[{ v: '', l: 'Todos' }, { v: 'pendente', l: 'Pendente' }, { v: 'dominado', l: 'Dominado' }, { v: 'arquivado', l: 'Arquivado' }].map(({ v, l }) => (
                        <button key={v} onClick={() => setFiltroStatus(v)}
                          className="btn btn-sm"
                          style={{ fontSize: '0.8em', fontWeight: 600, background: filtroStatus === v ? 'var(--primary, #0070FF)' : 'transparent', color: filtroStatus === v ? '#fff' : 'var(--text-secondary, #555)', border: '1px solid var(--border)', borderRadius: 8 }}>
                          {l}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div style={labelStyle} className="mb-1">Fonte</div>
                    <div className="d-flex gap-1 flex-wrap">
                      {[{ v: '', l: 'Todas' }, { v: 'simulado', l: 'Simulado' }, { v: 'bateria', l: 'Bateria' }].map(({ v, l }) => (
                        <button key={v} onClick={() => setFiltroFonte(v)}
                          className="btn btn-sm"
                          style={{ fontSize: '0.8em', fontWeight: 600, background: filtroFonte === v ? 'var(--primary, #0070FF)' : 'transparent', color: filtroFonte === v ? '#fff' : 'var(--text-secondary, #555)', border: '1px solid var(--border)', borderRadius: 8 }}>
                          {l}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div style={labelStyle} className="mb-1">Tipo</div>
                    <div className="d-flex gap-1 flex-wrap">
                      {[{ v: '', l: 'Todos' }, { v: 'erro', l: 'Erro' }, { v: 'branco', l: 'Branco' }, { v: 'chute', l: 'Chute' }].map(({ v, l }) => (
                        <button key={v} onClick={() => { setFiltroTipo(v); if (v !== 'erro') setFiltroMotivoErro(''); }}
                          className="btn btn-sm"
                          style={{ fontSize: '0.8em', fontWeight: 600, background: filtroTipo === v ? 'var(--primary, #0070FF)' : 'transparent', color: filtroTipo === v ? '#fff' : 'var(--text-secondary, #555)', border: '1px solid var(--border)', borderRadius: 8 }}>
                          {l}
                        </button>
                      ))}
                    </div>
                  </div>
                  {(filtroTipo === 'erro' || filtroTipo === '') && (
                    <div>
                      <div style={labelStyle} className="mb-1">Motivo do erro</div>
                      <div className="d-flex gap-1 flex-wrap">
                        {[{ v: '', l: 'Todos' }, { v: 'Falta de teoria', l: 'Falta de teoria' }, { v: 'Falta de revisão', l: 'Falta de revisão' }, { v: 'Falta de atenção', l: 'Falta de atenção' }, { v: 'Desconhecimento', l: 'Desconhecimento' }, { v: 'Interpretação', l: 'Interpretação' }].map(({ v, l }) => (
                          <button key={v} onClick={() => setFiltroMotivoErro(v)}
                            className="btn btn-sm"
                            style={{ fontSize: '0.8em', fontWeight: 600, background: filtroMotivoErro === v ? 'var(--primary, #0070FF)' : 'transparent', color: filtroMotivoErro === v ? '#fff' : 'var(--text-secondary, #555)', border: '1px solid var(--border)', borderRadius: 8 }}>
                            {l}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  <div>
                    <div style={labelStyle} className="mb-1">Matéria</div>
                    <select className="form-control linha" style={{ fontSize: '0.85em' }} value={filtroMateria} onChange={e => setFiltroMateria(e.target.value)}>
                      <option value="">Todas</option>
                      {materias.map(m => <option key={m.id} value={m.id}>{m.nome}</option>)}
                    </select>
                  </div>
                  {activeFilters.length > 0 && (
                    <button className="btn btn-sm" style={{ fontSize: '0.8em', color: 'var(--text-light)', border: 'none', textAlign: 'left', padding: 0 }}
                      onClick={() => { setFiltroStatus(''); setFiltroTipo(''); setFiltroFonte(''); setFiltroMotivoErro(''); setFiltroMateria(''); }}>
                      Limpar todos os filtros
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
          <span className="text-secondary ms-auto" style={{ fontSize: '0.82em' }}>{itensFiltrados.length} questão(ões)</span>
          <button
            className="btn btn-sm"
            style={{ fontSize: '0.8em', color: 'var(--text-light)', border: 'none', padding: '2px 6px', opacity: 0.7 }}
            onClick={() => setShowAddModal(true)}
          >+ adicionar manual</button>
        </div>

        {/* Chips de filtros ativos */}
        {activeFilters.length > 0 && (
          <div className="d-flex gap-2 mt-2 flex-wrap">
            {activeFilters.map(f => (
              <span key={f.key} className="d-flex align-items-center gap-1" style={{
                background: 'var(--primary, #0070FF)', border: 'none',
                borderRadius: 20, padding: '3px 10px 3px 12px', fontSize: '0.8em', fontWeight: 600,
                color: '#fff',
              }}>
                {f.label}
                <button onClick={f.clear} style={{ background: 'none', border: 'none', padding: '0 0 0 4px', cursor: 'pointer', color: 'rgba(255,255,255,0.8)', display: 'flex', alignItems: 'center' }}>
                  <XIcon size={11} />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Barra de ações em lote */}
      {algumSelecionado && (
        <div
          className="d-flex align-items-center gap-2 px-3 py-2 mb-2"
          style={{ background: 'var(--background-l-light)', border: '1.5px solid var(--border)', borderRadius: 10, flexWrap: 'wrap' }}
        >
          <span style={{ fontSize: '0.83em', fontWeight: 700, color: 'var(--text-light)' }}>
            {selecionados.size} selecionado(s)
          </span>
          <div className="d-flex gap-2 ms-2">
            <button
              className="btn btn-sm d-flex align-items-center gap-1"
              style={{ background: 'rgba(52,199,89,0.12)', color: '#34C759', border: 'none', fontWeight: 600, fontSize: '0.82em' }}
              onClick={handleBatchAcertei} disabled={acaoBatchLoading}
            >
              <CheckCircle size={14} /> Acertei
            </button>
            <button
              className="btn btn-sm d-flex align-items-center gap-1"
              style={{ background: 'rgba(255,45,85,0.10)', color: '#FF2D55', border: 'none', fontWeight: 600, fontSize: '0.82em' }}
              onClick={handleBatchErrei} disabled={acaoBatchLoading}
            >
              <XCircle size={14} /> Errei
            </button>
            <button
              className="btn btn-sm d-flex align-items-center gap-1"
              style={{ background: 'rgba(142,142,147,0.12)', color: '#8e8e93', border: 'none', fontWeight: 600, fontSize: '0.82em' }}
              onClick={handleBatchArquivar} disabled={acaoBatchLoading}
            >
              <Archive size={14} /> Arquivar
            </button>
            <button
              className="btn btn-sm d-flex align-items-center gap-1"
              style={{ background: 'rgba(255,45,85,0.08)', color: '#FF2D55', border: 'none', fontWeight: 600, fontSize: '0.82em' }}
              onClick={handleBatchRemover} disabled={acaoBatchLoading}
            >
              <Trash2 size={14} /> Remover
            </button>
          </div>
          <button
            className="btn-icon ms-auto"
            style={{ fontSize: '0.8em', color: 'var(--text-light)' }}
            onClick={() => setSelecionados(new Set())}
            title="Cancelar seleção"
          >✕ Cancelar</button>
        </div>
      )}

      {/* Tabela */}
      <div className="card-padrao2 p-0" style={{ overflowX: 'auto' }}>
        {loading ? (
          <div style={{ padding: '1rem' }}>
            {[...Array(6)].map((_, i) => (
              <div key={i} className="d-flex align-items-center gap-3" style={{ marginBottom: 14 }}>
                <SkCircle size={32} />
                <div style={{ flex: 1 }}>
                  <SkLine w="55%" h={13} mb={6} />
                  <SkLine w="35%" h={11} mb={0} />
                </div>
                <SkLine w={60} h={26} mb={0} style={{ borderRadius: 8 }} />
              </div>
            ))}
          </div>
        ) : itensFiltrados.length === 0 ? (
          <div className="text-center p-5" style={{ color: 'var(--text-light)' }}>
            <div style={{ fontSize: '0.88em' }}>
              {filtroStatus === 'pendente' ? 'Nenhuma questão pendente de revisão.' : 'Nenhum item encontrado.'}
            </div>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85em', tableLayout: 'fixed' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                <th style={{ padding: '10px 12px', textAlign: 'center', width: 36 }}>
                  <input
                    type="checkbox"
                    checked={todosSelecionados}
                    onChange={toggleSelecionarTodos}
                    title={todosSelecionados ? 'Desmarcar todos' : 'Selecionar todos'}
                    style={{ cursor: 'pointer', accentColor: 'var(--primary)' }}
                  />
                </th>
                <th style={{ padding: '10px 12px', fontWeight: 600, color: 'var(--text-light)', textAlign: 'left', width: 55 }}>Nº</th>
                <th style={{ padding: '10px 12px', fontWeight: 600, color: 'var(--text-light)', textAlign: 'left', width: '18%' }}>Matéria</th>
                <th style={{ padding: '10px 12px', fontWeight: 600, color: 'var(--text-light)', textAlign: 'left', width: '20%' }}>Tópico do Edital</th>
                <th style={{ padding: '10px 12px', fontWeight: 600, color: 'var(--text-light)', textAlign: 'center', width: 75 }}>Fonte</th>
                <th style={{ padding: '10px 12px', fontWeight: 600, color: 'var(--text-light)', textAlign: 'center', width: 70 }}>Tipo</th>
                <th style={{ padding: '10px 12px', fontWeight: 600, color: 'var(--text-light)', textAlign: 'center', width: 55 }}>Erros</th>
                <th style={{ padding: '10px 12px', fontWeight: 600, color: 'var(--text-light)', textAlign: 'center', width: 100 }}>Status</th>
                <th style={{ padding: '10px 12px', fontWeight: 600, color: 'var(--text-light)', textAlign: 'left', width: 75 }}>Anotação</th>
                <th style={{ padding: '10px 12px', fontWeight: 600, color: 'var(--text-light)', textAlign: 'center', width: 110 }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {itensPaginados.map((item, idx) => {
                const st = STATUS_LABELS[item.status] || STATUS_LABELS.pendente;
                const tp = TIPO_LABELS[item.tipo] || TIPO_LABELS.erro;
                const isSelecionado = selecionados.has(item.id);
                return (
                  <tr key={item.id} style={{ borderBottom: '1px solid var(--border)', background: isSelecionado ? 'rgba(var(--primary-rgb, 0,112,255),0.07)' : idx % 2 !== 0 ? 'rgba(0,0,0,0.05)' : 'transparent', transition: 'background 0.1s' }}>
                    <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                      <input
                        type="checkbox"
                        checked={isSelecionado}
                        onChange={() => toggleSelecionado(item.id)}
                        style={{ cursor: 'pointer', accentColor: 'var(--primary)' }}
                      />
                    </td>
                    <td style={{ padding: '10px 12px', fontWeight: 700 }}>#{item.numeroQuestao}</td>
                    <td style={{ padding: '10px 12px' }}>
                      <span className="fw-semibold" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>{item.materiaNome}</span>
                      {(item.pdfSimulado || item.pdfGabarito) && (
                        <div className="d-flex gap-1 mt-1">
                          {item.pdfSimulado && (
                            <a href={`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/pdf/${item.pdfSimulado}`} target="_blank" rel="noreferrer"
                              title="PDF do Simulado"
                              style={{ color: '#e74c3c', fontSize: '0.75em', display: 'flex', alignItems: 'center', gap: 2, textDecoration: 'none', fontWeight: 600, opacity: 0.85 }}
                            >
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm-1 1.5L18.5 9H13V3.5zM6 20V4h5v7h7v9H6z"/></svg>
                              Simulado
                            </a>
                          )}
                          {item.pdfGabarito && (
                            <a href={`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/pdf/${item.pdfGabarito}`} target="_blank" rel="noreferrer"
                              title="PDF do Gabarito"
                              style={{ color: '#27ae60', fontSize: '0.75em', display: 'flex', alignItems: 'center', gap: 2, textDecoration: 'none', fontWeight: 600, opacity: 0.85 }}
                            >
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm-1 1.5L18.5 9H13V3.5zM6 20V4h5v7h7v9H6z"/></svg>
                              Gabarito
                            </a>
                          )}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '10px 12px', color: 'var(--text-light)', fontSize: '0.9em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 0 }} title={item.editalItem || ''}>
                      {item.editalItem || <span style={{ opacity: 0.4 }}>—</span>}
                    </td>
                    <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                      <span className="badge" style={{
                        background: item.fonte === 'bateria' ? 'rgba(88,86,214,0.15)' : 'rgba(0,122,255,0.12)',
                        color: item.fonte === 'bateria' ? '#5856D6' : '#007AFF',
                        fontWeight: 600, fontSize: '0.78em'
                      }}>
                        {item.fonte === 'bateria' ? 'Bateria' : 'Simulado'}
                      </span>
                    </td>
                    <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                      <span className="badge" style={{ background: tp.color + '22', color: tp.color, fontWeight: 600, fontSize: '0.8em' }}>{tp.label}</span>
                    </td>
                    <td style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 700, color: '#FF2D55' }}>{item.totalErros}</td>
                    <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                      <span className="badge" style={{ background: st.bg, color: st.color, fontWeight: 600, fontSize: '0.8em' }}>
                        {st.label}
                        {item.status === 'pendente' && item.acertosConsecutivos > 0 && (
                          <span style={{ marginLeft: 4, opacity: 0.7 }}>({item.acertosConsecutivos}/2)</span>
                        )}
                      </span>
                    </td>
                    <td style={{ padding: '10px 12px', maxWidth: 0 }}>
                      <div className="d-flex align-items-center gap-1" style={{ overflow: 'hidden' }}
                        onClick={() => { setEditandoAnotacao(item.id); setAnotacaoTemp(item.anotacao || ''); setShowAnotacaoModal(true); }}
                      >
                        {item.anotacao && (
                          <span
                            style={{
                              display: 'inline-block', maxWidth: 120,
                              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                              background: 'rgba(255,204,0,0.18)', color: '#9a7000',
                              border: '1px solid rgba(255,190,0,0.35)',
                              borderRadius: 20, padding: '2px 9px',
                              fontSize: '0.78em', fontWeight: 600, cursor: 'pointer',
                            }}
                            title={item.anotacao}
                          >
                            {item.anotacao}
                          </span>
                        )}
                        <Edit2
                          size={13}
                          style={{ color: 'var(--text-light)', flexShrink: 0, cursor: 'pointer', opacity: 0.7 }}
                        />
                      </div>
                    </td>
                    <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                      <div className="d-flex gap-1 justify-content-center">
                        {item.status !== 'dominado' && (
                          <>
                            <button className="btn-icon" style={{ color: '#34C759', border: '1px solid var(--border)', borderRadius: 6, padding: '3px' }} title="Acertei! (+1 consecutivo)" onClick={() => handleAcertei(item.id)}>
                              <CheckCircle size={14} />
                            </button>
                            <button className="btn-icon" style={{ color: '#FF2D55', border: '1px solid var(--border)', borderRadius: 6, padding: '3px' }} title="Errei de novo" onClick={() => handleErrei(item.id)}>
                              <XCircle size={14} />
                            </button>
                          </>
                        )}
                        {item.status !== 'arquivado' && (
                          <button className="btn-icon" style={{ color: '#8e8e93', border: '1px solid var(--border)', borderRadius: 6, padding: '3px' }} title="Arquivar" onClick={() => handleArquivar(item.id)}>
                            <Archive size={14} />
                          </button>
                        )}
                        <button className="btn-icon" style={{ color: '#FF2D55', border: '1px solid var(--border)', borderRadius: 6, padding: '3px', marginRight: 4 }} title="Remover da fila" onClick={() => handleRemover(item.id)}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Paginação */}
      {itensFiltrados.length > 0 && (
        <div className="d-flex align-items-center justify-content-between mt-3 flex-wrap gap-2">
          <div className="d-flex align-items-center gap-2">
            <span style={{ fontSize: '0.82em', color: 'var(--text-light)' }}>Exibir</span>
            {[20, 50, 100, 0].map(n => (
              <button
                key={n}
                className="btn btn-sm"
                style={{
                  fontSize: '0.8em', fontWeight: 600, borderRadius: 8,
                  background: itensPorPagina === n ? 'var(--primary, #0070FF)' : 'transparent',
                  color: itensPorPagina === n ? '#fff' : 'var(--text-secondary, #555)',
                  border: '1px solid var(--border)',
                }}
                onClick={() => { setItensPorPagina(n); setPaginaAtual(1); }}
              >
                {n === 0 ? 'Todos' : n}
              </button>
            ))}
          </div>

          {itensPorPagina !== 0 && totalPaginas > 1 && (
            <div className="d-flex align-items-center gap-1">
              <button
                className="btn btn-sm"
                style={{ fontSize: '0.8em', border: '1px solid var(--border)', borderRadius: 8, background: 'transparent', color: 'var(--text-secondary, #555)' }}
                disabled={paginaSegura === 1}
                onClick={() => setPaginaAtual(p => Math.max(1, p - 1))}
              >‹</button>
              {Array.from({ length: totalPaginas }, (_, i) => i + 1)
                .filter(p => p === 1 || p === totalPaginas || Math.abs(p - paginaSegura) <= 1)
                .reduce((acc, p, i, arr) => {
                  if (i > 0 && p - arr[i - 1] > 1) acc.push('...');
                  acc.push(p);
                  return acc;
                }, [])
                .map((p, i) => p === '...' ? (
                  <span key={'e' + i} style={{ fontSize: '0.8em', color: 'var(--text-light)', padding: '0 4px' }}>...</span>
                ) : (
                  <button key={p} className="btn btn-sm"
                    style={{
                      fontSize: '0.8em', minWidth: 32, fontWeight: 600, borderRadius: 8,
                      background: paginaSegura === p ? 'var(--primary, #0070FF)' : 'transparent',
                      color: paginaSegura === p ? '#fff' : 'var(--text-secondary, #555)',
                      border: '1px solid var(--border)',
                    }}
                    onClick={() => setPaginaAtual(p)}
                  >{p}</button>
                ))}
              <button
                className="btn btn-sm"
                style={{ fontSize: '0.8em', border: '1px solid var(--border)', borderRadius: 8, background: 'transparent', color: 'var(--text-secondary, #555)' }}
                disabled={paginaSegura === totalPaginas}
                onClick={() => setPaginaAtual(p => Math.min(totalPaginas, p + 1))}
              >›</button>
            </div>
          )}

          <span style={{ fontSize: '0.82em', color: 'var(--text-light)' }}>
            {itensPorPagina === 0
              ? `${itensFiltrados.length} itens`
              : `${(paginaSegura - 1) * itensPorPagina + 1}–${Math.min(paginaSegura * itensPorPagina, itensFiltrados.length)} de ${itensFiltrados.length}`
            }
          </span>
        </div>
      )}

      {/* Modal de anotação */}
      <Modal show={showAnotacaoModal} onHide={() => { setShowAnotacaoModal(false); setEditandoAnotacao(null); }} centered backdrop="static" className="modal-fundo">
        <Modal.Body className="modal-estilo">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <span className="fw-bold">Anotação</span>
            <button className="btn-icon" onClick={() => { setShowAnotacaoModal(false); setEditandoAnotacao(null); }}>✕</button>
          </div>
          <textarea
            autoFocus
            className="form-control linha"
            rows={4}
            style={{ fontSize: '0.88em', resize: 'vertical' }}
            placeholder="Escreva sua anotação aqui..."
            value={anotacaoTemp}
            onChange={e => setAnotacaoTemp(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && e.ctrlKey) handleSalvarAnotacao(editandoAnotacao); }}
          />
          <div className="d-flex justify-content-end gap-2 mt-3">
            <button className="btn btn-outline-primary-primary3" onClick={() => { setShowAnotacaoModal(false); setEditandoAnotacao(null); }}>Cancelar</button>
            <button className="btn btn-primary-primary3" onClick={() => handleSalvarAnotacao(editandoAnotacao)}>Salvar</button>
          </div>
        </Modal.Body>
      </Modal>

      {/* Modal adicionar manual */}
      <Modal show={showAddModal} onHide={() => setShowAddModal(false)} centered backdrop="static" className="modal-fundo">
        <Modal.Body className="modal-estilo">
          <div className="d-flex justify-content-between align-items-center mb-1">
            <span className="fw-bold">Adicionar Questão à Fila</span>
            <button className="btn-icon" onClick={() => setShowAddModal(false)}>✕</button>
          </div>
          <p className="text-secondary mb-3" style={{ fontSize: '0.8em' }}>Adicione manualmente uma questão que precisa revisar.</p>
          <form onSubmit={handleAdicionarManual}>
            <div className="row g-2 mb-2">
              <div className="col-8">
                <label style={labelStyle}>Matéria</label>
                <select className="form-control linha mt-1" value={novoItem.materiaNome} onChange={e => setNovoItem({ ...novoItem, materiaNome: e.target.value })} required>
                  <option value="">Selecione...</option>
                  {materias.map(m => <option key={m.id} value={m.nome}>{m.nome}</option>)}
                </select>
              </div>
              <div className="col-4">
                <label style={labelStyle}>Nº Questão</label>
                <input className="form-control linha mt-1" type="number" min="1" value={novoItem.numeroQuestao} onChange={e => setNovoItem({ ...novoItem, numeroQuestao: e.target.value })} required />
              </div>
            </div>
            <div className="row g-2 mb-2">
              <div className="col-6">
                <label style={labelStyle}>Tipo</label>
                <select className="form-control linha mt-1" value={novoItem.tipo} onChange={e => setNovoItem({ ...novoItem, tipo: e.target.value })}>
                  <option value="erro">Erro</option>
                  <option value="branco">Branco</option>
                  <option value="chute">Chute</option>
                </select>
              </div>
              <div className="col-6">
                <label style={labelStyle}>Tópico do Edital</label>
                <input className="form-control linha mt-1" value={novoItem.editalItem} onChange={e => setNovoItem({ ...novoItem, editalItem: e.target.value })} placeholder="(opcional)" />
              </div>
            </div>
            <div className="mb-2">
              <label style={labelStyle}>Motivo do Erro</label>
              <input className="form-control linha mt-1" value={novoItem.motivoErro} onChange={e => setNovoItem({ ...novoItem, motivoErro: e.target.value })} placeholder="(opcional)" />
            </div>
            <div className="mb-3">
              <label style={labelStyle}>Anotação</label>
              <textarea className="form-control linha mt-1" rows={2} value={novoItem.anotacao} onChange={e => setNovoItem({ ...novoItem, anotacao: e.target.value })} placeholder="O que precisa estudar/revisar..." />
            </div>
            <div className="d-flex justify-content-end gap-2">
              <button type="button" className="btn btn-outline-primary-primary3" onClick={() => setShowAddModal(false)}>Cancelar</button>
              <button type="submit" className="btn btn-primary-primary3">Adicionar à Fila</button>
            </div>
          </form>
        </Modal.Body>
      </Modal>
    </div>
    </div>
  );
}

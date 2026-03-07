import React, { useEffect, useState, useRef } from 'react';
import ReactDOM from 'react-dom';
import { useNavigate } from 'react-router-dom';
import SelecaoBateria from './SelecaoBateria';
import api from '../../services/api';
import { Folder, FileText, Check, X, File, Edit2, Trash, HelpCircle } from 'react-feather';
import 'bootstrap/dist/css/bootstrap.min.css';
import { useAuth } from '../../auth.jsx';
import { Modal } from 'react-bootstrap';
import { SkeletonSimulados } from '../../components/Skeleton';
import { toast } from 'react-toastify';
import { usePageTitle } from '../../components/PageTitleContext';

const pdfUrl = url => {
  if (!url) return url;
  if (url.includes('drive.google.com')) return url;
  return `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/pdf-view?url=${encodeURIComponent(url)}`;
};

function Questoes() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { setTitle, setTitleExtra } = usePageTitle();
  const [showHelpModal, setShowHelpModal] = useState(false);

  const [baterias, setBaterias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [materiasProjeto, setMateriasProjeto] = useState([]);
  const [materiasLoading, setMateriasLoading] = useState(true);

  // Modal de adicionar
  const [showAddModal, setShowAddModal] = useState(false);
  const [inputTitulo, setInputTitulo] = useState('');
  const [inputQuanQuest, setInputQuanQuest] = useState('');
  const [inputDataBat, setInputDataBat] = useState('');

  // Correção
  const [selectedId, setSelectedId] = useState(null);
  const [showSelecao, setShowSelecao] = useState(false);

  // Stats por bateria: { [bateriaId]: { acertos, erros, branco, liquido } }
  const [stats, setStats] = useState({});

  useEffect(() => {
    setTitle('Baterias de Questões');
    document.title = 'FLUX | Questões';
    setTitleExtra(
      <button
        className="btn p-0 d-flex align-items-center"
        style={{ color: 'var(--text-light)', border: 'none', background: 'none', lineHeight: 1 }}
        onClick={() => setShowHelpModal(true)}
      >
        <HelpCircle size={14} />
      </button>
    );
    return () => setTitleExtra(null);
  }, [setTitle, setTitleExtra]);

  useEffect(() => {
    if (selectedId) setShowSelecao(true);
  }, [selectedId]);

  const projetoAnulatoria = localStorage.getItem('projetoAnulatoria') !== 'false';

  async function getBaterias() {
    try {
      const projetoId = localStorage.getItem('projetoSelecionado') || '';
      if (!projetoId) { setBaterias([]); return; }
      const res = await api.get('/baterias', { params: { userId: user?.id, projetoId } });
      const lista = res.data.filter(b => b.projetoId === projetoId);
      setBaterias(lista);

      // Buscar stats de cada bateria
      const statsObj = {};
      const projetoAnulatoria = localStorage.getItem('projetoAnulatoria') !== 'false';
      await Promise.all(lista.map(async (bat) => {
        try {
          const r = await api.get(`/respostas-bateria/${bat.id}`);
          const respostas = r.data || [];
          let acertos = 0, erros = 0, branco = 0;
          respostas.forEach(q => {
            if (q.resposta === 'S' || q.resposta === '') branco++;
            else if (q.acertou) acertos++;
            else erros++;
          });
          statsObj[bat.id] = { acertos, erros, branco, liquido: projetoAnulatoria ? (acertos - erros) : acertos };
        } catch { statsObj[bat.id] = { acertos: 0, erros: 0, branco: 0, liquido: 0 }; }
      }));
      setStats(statsObj);
    } catch (err) {
      console.error('Erro ao buscar baterias:', err);
    }
  }

  useEffect(() => {
    const projetoId = localStorage.getItem('projetoSelecionado');
    if (!projetoId) {
      setLoading(false);
      setMateriasLoading(false);
      setBaterias([]);
      setMateriasProjeto([]);
      return;
    }

    async function init() {
      try {
        const userId = JSON.parse(localStorage.getItem('user'))?.id;
        if (!userId) { setLoading(false); setMateriasLoading(false); return; }

        const [batRes, matRes] = await Promise.all([
          api.get('/baterias', { params: { userId, projetoId } }),
          api.get('/edital', { params: { userId, projetoId } })
        ]);

        const lista = batRes.data.filter(b => b.projetoId === projetoId);
        setBaterias(lista);
        setMateriasProjeto(matRes.data.filter(m => m.projetoId === projetoId && m.nome && m.nome.trim() !== ''));
        setMateriasLoading(false);

        // Stats
        const statsObj = {};
        const projetoAnulatoria = localStorage.getItem('projetoAnulatoria') !== 'false';
        await Promise.all(lista.map(async (bat) => {
          try {
            const r = await api.get(`/respostas-bateria/${bat.id}`);
            const respostas = r.data || [];
            let acertos = 0, erros = 0, branco = 0;
            respostas.forEach(q => {
              if (q.resposta === 'S' || q.resposta === '') branco++;
              else if (q.acertou) acertos++;
              else erros++;
            });
            statsObj[bat.id] = { acertos, erros, branco, liquido: projetoAnulatoria ? (acertos - erros) : acertos };
          } catch { statsObj[bat.id] = { acertos: 0, erros: 0, branco: 0, liquido: 0 }; }
        }));
        setStats(statsObj);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  async function createBateria() {
    try {
      const projetoId = localStorage.getItem('projetoSelecionado') || '';
      if (!projetoId) { alert('Selecione um projeto antes de adicionar uma bateria.'); return; }
      if (!inputTitulo.trim() || !inputQuanQuest || !inputDataBat) return;

      const res = await api.post('/baterias', {
        titulo: inputTitulo.trim(),
        quanQuest: Number(inputQuanQuest),
        dataBat: inputDataBat,
        projetoId,
        userId: user?.id,
      });

      setInputTitulo('');
      setInputQuanQuest('');
      setInputDataBat('');
      setShowAddModal(false);

      if (res.data && res.data.id) {
        setSelectedId(res.data.id);
        setShowSelecao(true);
      }
      getBaterias();
    } catch (err) {
      toast.error('Erro ao criar bateria!');
      console.error(err);
    }
  }

  async function deleteBateria(id) {
    if (!window.confirm('Deseja apagar esta bateria? Essa ação não pode ser desfeita.')) return;
    try {
      await api.delete(`/baterias/${id}`);
      getBaterias();
      toast.success('Bateria apagada com sucesso!');
    } catch (err) {
      toast.error('Erro ao apagar bateria!');
      console.error(err);
    }
  }

  const projetoSelecionado = localStorage.getItem('projetoSelecionado');

  if (loading) return <SkeletonSimulados />;

  if (!projetoSelecionado) {
    return (
      <div className="app-container d-flex flex-column justify-content-center align-items-center" style={{ minHeight: '80vh' }}>
        <div className="d-flex flex-column align-items-center text-center">
          <Folder size={56} className="mb-3 text-secondary" />
          <h4 className="mb-3 fs-6 text-secondary">Nenhum projeto selecionado.<br />Selecione ou crie um projeto para acessar as baterias.</h4>
          <button className="btn btn-primary-primary px-4 py-2" onClick={() => navigate('/projeto')}>
            Ir para Projetos
          </button>
        </div>
      </div>
    );
  }

  if (!materiasLoading && materiasProjeto.length === 0) {
    return (
      <div className="app-container d-flex flex-column justify-content-center align-items-center" style={{ minHeight: '80vh' }}>
        <div className="d-flex flex-column align-items-center text-center">
          <Folder size={56} className="mb-3 text-secondary" />
          <h4 className="mb-3 fs-6 text-secondary">
            Nenhuma matéria cadastrada.<br />
            Adicione matérias ao edital antes de cadastrar baterias.
          </h4>
          <button className="btn btn-primary-primary px-4 py-2" onClick={() => navigate('/edital')}>
            Ir para Edital
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <main className="container-fluid">
        {showSelecao && selectedId && ReactDOM.createPortal((
          <div style={{ zIndex: 1060, position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh' }}>
            <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 1050, backgroundColor: 'rgba(0,0,0,0.6)' }} />
            <div
              className="d-flex align-items-center justify-content-center"
              style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 1060 }}
            >
              <SelecaoBateria id={selectedId} onClose={() => {
                setShowSelecao(false);
                setSelectedId(null);
                getBaterias();
              }} tipo={localStorage.getItem('projetoTipo') || 'alternativas'} anulatoria={localStorage.getItem('projetoAnulatoria') !== 'false'} />
            </div>
          </div>
        ), document.body)}

        <div className="users-list mt-2">
          {/* Card para nova bateria */}
          <div
            className="pointer card-padrao-vazio fadein d-flex flex-row align-items-center justify-content-center mb-2 fs-6 cursor-pointer position-relative gap-2"
            style={{ padding: '0.9em 0.9em 0.9em 1.5em' }}
            onClick={() => setShowAddModal(true)}
          >
            <span className="fw-bold fs-6 text-secondary">+ Nova Bateria de Questões</span>
            <span className="fs-6 text-secondary">· Clique para registrar uma nova bateria</span>
          </div>

          {[...baterias].reverse().map((bat) => {
            const stat = stats[bat.id] || { acertos: 0, erros: 0, branco: 0, liquido: 0 };
            const totalQuestoes = bat.quanQuest || 0;
            const porcentagem = totalQuestoes > 0 ? ((stat.liquido / totalQuestoes) * 100).toFixed(1) : '0.0';
            const liquidoColor = stat.liquido > 0 ? '#22c55e' : stat.liquido < 0 ? '#ef4444' : 'var(--text-light)';
            const liquidoBg = stat.liquido > 0 ? 'rgba(34,197,94,0.12)' : stat.liquido < 0 ? 'rgba(239,68,68,0.1)' : 'rgba(0,0,0,0.06)';
            return (
              <div key={bat.id} className="card-padrao2 fadein card-padrao-hover mb-2 w-100 fs-6 pointer py-2">
                <div className="d-flex flex-row align-items-center justify-content-between gap-2">
                  <div className="flex-grow-1 d-flex align-items-center gap-2">
                    <span className="d-flex align-items-center text-secondary" title="Bateria">
                      <FileText size={16} />
                    </span>
                    <div className="d-flex align-items-center gap-2">
                      <span className="fw-bold">{bat.titulo}</span>
                      <span className="small text-secondary">
                        {(() => {
                          const d = new Date(bat.dataBat);
                          d.setHours(d.getHours() + d.getTimezoneOffset() / 60);
                          return d.toLocaleDateString('pt-BR');
                        })()}
                      </span>
                      <span className="badge bg-secondary rounded" style={{ fontSize: '0.78em' }}>{bat.quanQuest}q</span>
                    </div>
                    <div className="d-flex align-items-center gap-2 ms-auto">
                      <span title="Acertos" className="d-flex align-items-center gap-1" style={{ fontSize: '0.82em', color: '#22c55e' }}>
                        <Check size={11} strokeWidth={2.5} />
                        <span className="fw-semibold">{stat.acertos}</span>
                      </span>
                      <span style={{ color: 'var(--border)', lineHeight: 1 }}>·</span>
                      <span title="Erros" className="d-flex align-items-center gap-1" style={{ fontSize: '0.82em', color: '#ef4444' }}>
                        <X size={11} strokeWidth={2.5} />
                        <span className="fw-semibold">{stat.erros}</span>
                      </span>
                      <span style={{ color: 'var(--border)', lineHeight: 1 }}>·</span>
                      <span title="Brancos" className="d-flex align-items-center gap-1" style={{ fontSize: '0.82em', color: '#f59e0b' }}>
                        <File size={11} />
                        <span className="fw-semibold">{stat.branco}</span>
                      </span>
                      {projetoAnulatoria && <span className="badge rounded-pill px-2 py-1 ms-1" style={{ background: liquidoBg, color: liquidoColor, fontSize: '0.78em', fontWeight: 700 }} title="Nota Líquida">
                        Líq. {stat.liquido > 0 ? '+' : ''}{stat.liquido}
                      </span>}
                      <span className="badge rounded-pill px-2 py-1" style={{ background: 'rgba(59,130,246,0.1)', color: '#3b82f6', fontSize: '0.78em', fontWeight: 600 }} title={projetoAnulatoria ? 'Percentual Líquido' : 'Percentual de Acertos'}>
                        {porcentagem}%
                      </span>
                    </div>
                  </div>
                  <div className="edicao-card d-flex align-items-center gap-2">
                    {bat.pdf && (
                      <span
                        className="d-flex align-items-center cursor-pointer"
                        onClick={e => { e.stopPropagation(); window.open(pdfUrl(bat.pdf), '_blank'); }}
                        title="Abrir PDF da Bateria"
                      >
                        <FileText size={16} className="btn-icon p-0 text-primary-primary" />
                      </span>
                    )}
                    {bat.gabarito && (
                      <span
                        className="d-flex align-items-center cursor-pointer"
                        onClick={e => { e.stopPropagation(); window.open(pdfUrl(bat.gabarito), '_blank'); }}
                        title="Abrir PDF do Gabarito"
                      >
                        <FileText size={16} className="btn-icon p-0" />
                      </span>
                    )}
                    <span
                      className="d-flex align-items-center cursor-pointer"
                      onClick={() => setSelectedId(bat.id)}
                      title="Corrigir bateria"
                    >
                      <Edit2 size={16} className="btn-icon p-0" />
                    </span>
                    <button
                      className="btn-icon d-flex align-items-center justify-content-center p-0"
                      onClick={e => { e.stopPropagation(); deleteBateria(bat.id); }}
                      title="Apagar bateria"
                    >
                      <Trash size={16} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Modal nova bateria */}
        <Modal show={showAddModal} onHide={() => setShowAddModal(false)} centered backdrop="static" className="modal-fundo">
          <Modal.Body className="modal-estilo">
            <div className="d-flex justify-content-between align-items-center mb-1">
              <Modal.Title className="fw-bold fs-5 m-0">Nova Bateria de Questões</Modal.Title>
            </div>
            <p className="text-secondary mb-4" style={{ fontSize: '0.8em' }}>Informe o título, quantidade de questões e a data de realização.</p>
            <form className="form-modal needs-validation" noValidate onSubmit={e => {
              e.preventDefault();
              if (!inputTitulo.trim() || !inputQuanQuest || !inputDataBat) {
                e.target.classList.add('was-validated');
                return;
              }
              createBateria();
            }}>
              <div className="mb-3">
                <label className="form-label fw-semibold" style={{ fontSize: '0.78em', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-light)' }}>Título</label>
                <input
                  placeholder="Ex: Direito Administrativo — CEBRASPE"
                  type="text"
                  value={inputTitulo}
                  onChange={e => setInputTitulo(e.target.value)}
                  required
                  className="linha form-control"
                />
              </div>
              <div className="d-flex gap-4 mb-3">
                <div className="d-flex flex-column">
                  <label className="form-label fw-semibold" style={{ fontSize: '0.78em', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-light)' }}>Qtd. Questões</label>
                  <div className="d-flex flex-row align-items-center gap-2">
                    <input
                      placeholder="0"
                      type="number"
                      value={inputQuanQuest}
                      onChange={e => setInputQuanQuest(e.target.value)}
                      required
                      min={1}
                      max={500}
                      step={1}
                      className="linha form-control w-auto text-center"
                    />
                    <div className="d-flex flex-row gap-1 align-items-center h-38">
                      <button type="button" className="btn btn-outline-primary-primary3 fw-bold w-auto px-2 py-1 w-44 h-38" onClick={() => setInputQuanQuest('120')}>120</button>
                      <button type="button" className="btn btn-outline-primary-primary3 fw-bold w-auto px-2 py-1 w-44 h-38" onClick={() => setInputQuanQuest('80')}>80</button>
                      <button type="button" className="btn btn-outline-primary-primary3 fw-bold w-auto px-2 py-1 w-44 h-38" onClick={() => setInputQuanQuest('60')}>60</button>
                    </div>
                  </div>
                </div>
                <div className="d-flex flex-column">
                  <label className="form-label fw-semibold" style={{ fontSize: '0.78em', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-light)' }}>Data</label>
                  <div className="d-flex gap-2 align-items-center">
                    <input
                      type="date"
                      value={inputDataBat}
                      onChange={e => setInputDataBat(e.target.value)}
                      required
                      className="linha text-center form-control px-2 py-1 w-75"
                    />
                    <button type="button" className="btn btn-outline-primary-primary3 text-nowrap" onClick={() => {
                      const today = new Date();
                      const yyyy = today.getFullYear();
                      const mm = String(today.getMonth() + 1).padStart(2, '0');
                      const dd = String(today.getDate()).padStart(2, '0');
                      setInputDataBat(`${yyyy}-${mm}-${dd}`);
                    }}>Hoje</button>
                  </div>
                </div>
              </div>
              <div className="d-flex justify-content-end gap-3 mt-3">
                <button type="button" className="btn btn-outline-primary-primary3" onClick={() => setShowAddModal(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary-primary3">Cadastrar</button>
              </div>
            </form>
          </Modal.Body>
        </Modal>

        {/* Modal de ajuda */}
        <Modal show={showHelpModal} onHide={() => setShowHelpModal(false)} centered className="modal-fundo">
          <Modal.Body className="modal-estilo">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <Modal.Title className="fw-bold fs-5 m-0" style={{ color: 'var(--text-middle)' }}>Como usar Baterias de Questões?</Modal.Title>
              <button className="btn p-0" style={{ background: 'none', border: 'none', color: 'var(--text-light)' }} onClick={() => setShowHelpModal(false)}><X size={18} /></button>
            </div>
            <div className="d-flex flex-column gap-3" style={{ fontSize: '0.88em' }}>
              <div>
                <div className="fw-bold mb-1" style={{ color: 'var(--text-middle)' }}>📋 O que é uma bateria?</div>
                <p className="m-0" style={{ color: 'var(--text-light)' }}>Uma bateria é um conjunto de questões avulsas — listas de exercícios, questões de livros, plataformas ou provas anteriores que não são simulados completos. Ideal para registrar seu desempenho em treinos focados por matéria.</p>
              </div>
              <div>
                <div className="fw-bold mb-1" style={{ color: 'var(--text-middle)' }}>➕ Criando uma bateria</div>
                <p className="m-0" style={{ color: 'var(--text-light)' }}>Clique em <span style={{ color: 'var(--text-middle)', fontWeight: 600 }}>+ Nova Bateria</span>, informe um <strong>título</strong>, a <strong>quantidade de questões</strong> e a <strong>data</strong>. Após criar, o modal de correção abre automaticamente.</p>
              </div>
              <div>
                <div className="fw-bold mb-1" style={{ color: 'var(--text-middle)' }}>✏️ Preenchendo a correção</div>
                <ul className="m-0 ps-3 d-flex flex-column gap-1" style={{ color: 'var(--text-light)' }}>
                  <li>Para cada questão, selecione a <strong>Matéria</strong>, o <strong>Tópico do Edital</strong>, a <strong>Resposta</strong> e o <strong>Gabarito</strong>.</li>
                  <li>Marque <span style={{ color: '#AF52DE', fontWeight: 600 }}>Chutei?</span> para registrar respostas sem certeza.</li>
                  <li>Marque <span style={{ color: '#8e8e93', fontWeight: 600 }}>Anulada?</span> para excluir a questão do cálculo.</li>
                </ul>
              </div>
              <div>
                <div className="fw-bold mb-1" style={{ color: 'var(--text-middle)' }}>⚡ Preenchimento relâmpago</div>
                <p className="m-0" style={{ color: 'var(--text-light)' }}>Ative o ícone <span style={{ color: '#ffc107', fontWeight: 600 }}>⚡</span> na coluna Matéria. Com ele ativo, ao selecionar uma matéria, <strong>todas as linhas abaixo</strong> são preenchidas com o mesmo valor automaticamente.</p>
              </div>
              <div>
                <div className="fw-bold mb-1" style={{ color: 'var(--text-middle)' }}>🔄 Fila de Revisão</div>
                <p className="m-0" style={{ color: 'var(--text-light)' }}>Ao salvar, questões <span style={{ color: '#FF2D55', fontWeight: 600 }}>erradas</span>, <span style={{ color: '#FF9500', fontWeight: 600 }}>em branco</span> e <span style={{ color: '#AF52DE', fontWeight: 600 }}>chutadas</span> são enviadas automaticamente para a Fila de Revisão com a fonte identificada como <span style={{ color: '#AF52DE', fontWeight: 600 }}>Bateria</span>.</p>
              </div>
            </div>
            <div className="d-flex justify-content-end mt-4">
              <button className="btn btn-primary-primary3" onClick={() => setShowHelpModal(false)}>Entendi</button>
            </div>
          </Modal.Body>
        </Modal>
      </main>
    </div>
  );
}

export default Questoes;

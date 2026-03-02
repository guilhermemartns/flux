// Removido duplicateSimulado fora do componente Home
// Função duplicateSimulado será definida dentro do componente Home
import React, { useEffect, useState, useRef } from 'react';
import ReactDOM from 'react-dom';
import { useNavigate, useLocation } from 'react-router-dom';
import Selecao from './selecao';
import api from '../../services/api';
import { Folder, FileText, Check, X, File, Hash, Copy, Edit2, Trash, BookOpen } from 'react-feather';
import 'bootstrap/dist/css/bootstrap.min.css';
import { useAuth } from '../../auth.jsx';
import { getSimuladoStats } from '../../services/simuladoStats';
import { Modal, Button } from 'react-bootstrap';
import Spinner from 'react-bootstrap/Spinner';

import { CSSTransition } from 'react-transition-group';
import './simuladoCollapse.css';
import Swal from 'sweetalert2';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { usePageTitle } from '../../components/PageTitleContext';


function Home() {
  const [stats, setStats] = useState({});
  const { user } = useAuth();
  const [simulados, setSimulados] = useState([]);
  const [materiasProjeto, setMateriasProjeto] = useState([]);
  const [materiasLoading, setMateriasLoading] = useState(true);
  // Estado para modal de adicionar simulado
  const [showAddModal, setShowAddModal] = useState(false);
  // const inputnumSim = useRef();
  const [inputQuanQuest, setInputQuanQuest] = useState('');
  const [inputDataSim, setInputDataSim] = useState('');
  const navigate = useNavigate();
  const [selectedId, setSelectedId] = useState(null);
  const [showSelecao, setShowSelecao] = useState(false);
  const [creating, setCreating] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [closingId, setClosingId] = useState(null);
  const [respostasResumo, setRespostasResumo] = useState({});
  const collapseRefs = useRef([]);
  const contentRefs = useRef([]);
  const closingTimeout = useRef(null);
  const [cardHeights, setCardHeights] = useState({});
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const { setTitle } = usePageTitle();
  const toastShownRef = useRef(false);
  const [delays, setDelays] = useState([]);

  useEffect(() => {
    // Cria delays sequenciais para efeito cascata (simulados + card vazio)
    const totalCards = simulados.length + 1; // +1 para o card vazio
    setDelays(Array(totalCards).fill().map((_, idx) => `${idx * 0.1}s`));
  }, [simulados.length]);

  useEffect(() => {
    if (selectedId) {
      setShowSelecao(true);
    }
  }, [selectedId]);

  useEffect(() => {
    setTitle('Simulados');
    document.title = 'FLUX | Simulados';
  }, [setTitle]);

  useEffect(() => {
    const projetoSelecionado = localStorage.getItem('projetoSelecionado');
    // Remova o redirecionamento automático:
    // if (!projetoSelecionado && !toastShownRef.current) {
    //   toastShownRef.current = true;
    //   navigate('/projeto');
    //   setTimeout(() => {
    //     toast.warn('Insira um projeto para acessar os simulados', {
    //       position: "top-right",
    //       autoClose: 5000,
    //       hideProgressBar: false,
    //       closeOnClick: true,
    //       pauseOnHover: true,
    //       draggable: true,
    //     });
    //   }, 300);
    //   return;
    // }
  }, [navigate]);

  async function getSimulados() {
    try {
      const projetoSelecionado = localStorage.getItem('projetoSelecionado') || '';
      const simuladosFromApi = await api.get('/simulados', {
        params: { userId: user?.id, projetoId: projetoSelecionado }
      });
      // O backend já deve filtrar, mas se não filtrar, filtra aqui também:
      if (projetoSelecionado) {
        setSimulados(simuladosFromApi.data.filter(sim => sim.projetoId === projetoSelecionado));
        
        // Buscar estatísticas de cada simulado EM PARALELO
        const statsPromises = simuladosFromApi.data.map(async (sim) => {
          if (sim.id) {
            const stats = await getSimuladoStats(sim.id, user?.id, projetoSelecionado);
            return { id: sim.id, stats };
          }
          return null;
        });
        
        const statsResults = await Promise.all(statsPromises);
        const statsObj = {};
        statsResults.forEach(result => {
          if (result) {
            statsObj[result.id] = result.stats;
          }
        });
        
        setStats(statsObj);
      } else {
        setSimulados([]);
      }
    } catch (error) {
      console.error("Erro ao buscar simulados:", error);
    }
  }

  async function createSimulado() {
    try {
      const projetoSelecionado = localStorage.getItem('projetoSelecionado') || '';
      if (!projetoSelecionado) {
        alert('Selecione um projeto antes de adicionar um simulado.');
        return;
      }
      const simuladosFromApi = await api.get('/simulados', {
        params: { userId: user?.id, projetoId: projetoSelecionado }
      });
      const simuladosProjeto = simuladosFromApi.data.filter(sim => sim.projetoId === projetoSelecionado);
      const maiorNumSim = simuladosProjeto.reduce((max, sim) => Math.max(max, sim.numSim || 0), 0);
      const novoNumSim = maiorNumSim + 1;
      const res = await api.post('/simulados', {
        numSim: novoNumSim,
        quanQuest: inputQuanQuest,
        dataSim: inputDataSim,
        projetoId: projetoSelecionado,
        userId: user?.id
      });
      // Buscar estatísticas de cada simulado EM PARALELO
      const statsPromises = simuladosFromApi.data.map(async (sim) => {
        if (sim.id) {
          const stats = await getSimuladoStats(sim.id, user?.id, projetoSelecionado);
          return { id: sim.id, stats };
        }
        return null;
      });
      
      const statsResults = await Promise.all(statsPromises);
      const statsObj = {};
      statsResults.forEach(result => {
        if (result) {
          statsObj[result.id] = result.stats;
        }
      });
      setStats(statsObj);
      getSimulados();
      setInputQuanQuest('');
      setInputDataSim('');
      setShowAddModal(false);
      // Abrir tela de edição automaticamente para o novo simulado
      if (res.data && res.data.id) {
        setSelectedId(res.data.id);
        setShowSelecao(true);
      }
    } catch (error) {
      toast.error('Erro ao criar simulado!');
      console.error("Erro ao criar simulado:", error);
    }
  }

  async function deleteSimulado(id) {
    if (!window.confirm('Deseja apagar este simulado? Essa ação não pode ser desfeita.')) return;
    try {
      await api.delete(`/simulados/${id}`);
      getSimulados();
      toast.success('Simulado apagado com sucesso!');
    } catch (error) {
      toast.error('Erro ao apagar simulado!');
      console.error("Erro ao deletar usuário:", error);
    }
  }

  function handleSelectSimulado(id) {
    if (selectedId === id && showSelecao) {
      setShowSelecao(false);
      setSelectedId(null); // Limpa o ID ao fechar
      return;
    }
    setSelectedId(id);
  }

  function handleCloseSelecao() {
    const LOCAL_KEY = 'simulado_parcial_' + selectedId;
    const parcial = localStorage.getItem(LOCAL_KEY);
    let temDados = false;
    if (parcial) {
      try {
        const obj = JSON.parse(parcial);
        temDados = [obj.respostas, obj.gabaritos, obj.materias, obj.editalItens, obj.anuladas, obj.chutes, obj.motivosErro].some(arr => Array.isArray(arr) && arr.some(v => v !== '' && v !== false && v !== null && v !== undefined));
        console.log('Verificando dados do localStorage:', obj, 'temDados:', temDados);
      } catch (e) { console.log('Erro ao ler localStorage:', e); }
    }
    if (temDados) {
      if (!window.confirm('Você tem dados preenchidos que ainda não foram salvos no banco. Deseja fechar sem salvar?')) {
        return;
      }
    }
    setShowSelecao(false);
  }

  async function handleExpandSimulado(id) {
    if (expandedId === id) {
      setClosingId(id);
      setExpandedId(null);
      clearTimeout(closingTimeout.current);
      closingTimeout.current = setTimeout(() => {
        setClosingId(null);
      }, 200);
      return;
    }
    if (expandedId !== null) {
      setClosingId(expandedId);
      setExpandedId(null);
      clearTimeout(closingTimeout.current);
      closingTimeout.current = setTimeout(() => {
        setClosingId(null);
        setExpandedId(id);
        api.get(`/respostas/${id}`)
          .then(resp => setRespostasResumo(prev => ({ ...prev, [id]: resp.data })))
          .catch(() => setRespostasResumo(prev => ({ ...prev, [id]: [] })));
      }, 200);
    } else {
      clearTimeout(closingTimeout.current);
      setExpandedId(id);
      api.get(`/respostas/${id}`)
        .then(resp => setRespostasResumo(prev => ({ ...prev, [id]: resp.data })))
        .catch(() => setRespostasResumo(prev => ({ ...prev, [id]: [] })));
    }
  }

  async function duplicateSimulado(id) {
    if (!window.confirm('Deseja duplicar este simulado?')) return;
    try {
      // Busca o simulado original
      const simuladoResp = await api.get(`/simulados/${id}`);
      const simuladoOriginal = simuladoResp.data;
      // Cria novo simulado com os mesmos dados (exceto id, data e número)
      const projetoSelecionado = localStorage.getItem('projetoSelecionado') || '';
      const simuladosFromApi = await api.get('/simulados', {
        params: { userId: user?.id, projetoId: projetoSelecionado }
      });
      const simuladosProjeto = simuladosFromApi.data.filter(sim => sim.projetoId === projetoSelecionado);
      const maiorNumSim = simuladosProjeto.reduce((max, sim) => Math.max(max, sim.numSim || 0), 0);
      const novoNumSim = maiorNumSim + 1;
      // Data no formato YYYY-MM-DD
      const hoje = new Date();
      const yyyy = hoje.getFullYear();
      const mm = String(hoje.getMonth() + 1).padStart(2, '0');
      const dd = String(hoje.getDate()).padStart(2, '0');
      const dataSimFormatada = `${yyyy}-${mm}-${dd}`;
      const novoSimuladoBody = {
        numSim: novoNumSim,
        quanQuest: simuladoOriginal.quanQuest,
        dataSim: dataSimFormatada,
        projetoId: projetoSelecionado,
        userId: user?.id
      };
      console.log('Corpo do novo simulado:', novoSimuladoBody);
      const novoSimulado = await api.post('/simulados', novoSimuladoBody);
      // Busca respostas do simulado original
      const respostasResp = await api.get(`/respostas/${id}`);
      const respostasOriginal = respostasResp.data;
      // Duplica respostas para o novo simulado, removendo o campo id
      const respostasDuplicadas = respostasOriginal.map(q => {
        const { id, _id, ...rest } = q;
        return {
          ...rest,
          simuladoId: novoSimulado.data.id,
          numero: q.numero,
          userId: user?.id,
          projetoId: projetoSelecionado
        };
      });
      await api.post('/salvarRespostas', { dados: respostasDuplicadas });
      getSimulados();
    } catch (error) {
      toast.error('Erro ao duplicar simulado!');
      console.error('Erro ao duplicar simulado:', error);
    }
  }

  useEffect(() => {
    if (expandedId !== null) {
      const ref = contentRefs.current[expandedId];
      if (ref) {
        const height = ref.scrollHeight;
        setCardHeights(prev => ({ ...prev, [expandedId]: height }));
      }
    }
  }, [expandedId, respostasResumo, simulados]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const simId = params.get('id');
    if (simId) {
      setExpandedId(simId);
    }
  }, [location.search]);

  // Garante que o array de refs tenha o mesmo tamanho dos simulados
  if (collapseRefs.current.length !== simulados.length) {
    collapseRefs.current = Array(simulados.length).fill().map((_, i) => collapseRefs.current[i] || React.createRef());
  }

  useEffect(() => {
    const projetoSelecionado = localStorage.getItem('projetoSelecionado');
    
    // Se não há projeto selecionado, não carrega nada (apenas mostra mensagem)
    if (!projetoSelecionado) {
      setLoading(false);
      setMateriasLoading(false);
      setSimulados([]);
      setMateriasProjeto([]);
      return;
    }

    // Verificação rápida se há simulados antes do loading
    async function checkSimuladosRapido() {
      try {
        const userId = JSON.parse(localStorage.getItem('user'))?.id;
        if (!userId) {
          setLoading(false);
          setMateriasLoading(false);
          setSimulados([]);
          setMateriasProjeto([]);
          return;
        }

        const simuladosCheck = await api.get('/simulados', {
          params: { userId, projetoId: projetoSelecionado }
        });
        const simuladosFiltrados = simuladosCheck.data.filter(sim => sim.projetoId === projetoSelecionado);
        
        // Se não há simulados, não mostra loading
        if (simuladosFiltrados.length === 0) {
          setLoading(false);
          setSimulados([]);
          
          // Ainda precisa carregar matérias para validação
          api.get('/edital', { params: { userId, projetoId: projetoSelecionado } })
            .then(res => {
              setMateriasProjeto(res.data.filter(m => m.projetoId === projetoSelecionado && m.nome && m.nome.trim() !== ''));
              setMateriasLoading(false);
            })
            .catch(() => {
              setMateriasProjeto([]);
              setMateriasLoading(false);
            });
          return;
        }

        // Se há simulados, executa loading completo
        setLoading(true);
        const promises = [];
        
        promises.push(getSimulados());
        
        promises.push(
          api.get('/edital', { params: { userId, projetoId: projetoSelecionado } })
            .then(res => {
              setMateriasProjeto(res.data.filter(m => m.projetoId === projetoSelecionado && m.nome && m.nome.trim() !== ''));
              setMateriasLoading(false);
            })
            .catch(() => {
              setMateriasProjeto([]);
              setMateriasLoading(false);
            })
        );
        
        Promise.all(promises).finally(() => setLoading(false));
      } catch (error) {
        setLoading(false);
        setMateriasLoading(false);
        setSimulados([]);
        setMateriasProjeto([]);
      }
    }

    checkSimuladosRapido();
  }, []);

  const projetoSelecionado = localStorage.getItem('projetoSelecionado');
  if (loading) {
    return (
      <div style={{ width: '400px', height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: 'auto' }}>
        <Spinner animation="border" role="status" />
      </div>
    );
  }
  if (!projetoSelecionado) {
    return (
      <div className="app-container d-flex flex-column justify-content-center align-items-center" style={{ minHeight: '80vh' }}>
        <div className="text-center">
          <Folder size={56} className="mb-3 text-secondary" />
          <h4 className="mb-3 text-center fs-6">Nenhum projeto selecionado.<br />Selecione ou crie um projeto para acessar os simulados.</h4>
          <button className="btn btn-primary-primary px-4 py-2" onClick={() => navigate('/projeto')}>
            Ir para Projetos
          </button>
        </div>
      </div>
    );
  }

  // Corrigido: só exibe o aviso se realmente não houver matérias cadastradas E não estiver carregando
  if (!materiasLoading && materiasProjeto.length === 0) {
    return (
      <div className="app-container d-flex flex-column justify-content-center align-items-center" style={{ minHeight: '80vh' }}>
        <div className="text-center">
          <Folder size={56} className="mb-3 text-secondary" />
          <h4 className="mb-3 text-center fs-6">
            Nenhuma matéria cadastrada.<br />
            Adicione matérias ao edital antes de cadastrar simulados.
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
  {/* ToastContainer removido. Usar apenas o global em main.jsx */}
      <main className='container-fluid'>


        {showSelecao && selectedId && ReactDOM.createPortal((() => {
          return (
            <div style={{ zIndex: 1060, position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh' }}>
              <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 1050, backgroundColor: 'rgba(0,0,0,0.6)' }}></div>
              <div
                className="d-flex align-items-center justify-content-center"
                style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 1060 }}
              >
                <Selecao id={selectedId} onClose={() => {
                  setShowSelecao(false);
                  setSelectedId(null);
                  getSimulados();
                }} />
              </div>
            </div>
          );
        })(), document.body)}

        <div className="users-list mt-2">
          {/* Card vazio para adicionar novo simulado */}
          <div
            className="pointer card-padrao-vazio fadein d-flex flex-row align-items-center justify-content-center mb-2 p-3 fs-5 cursor-pointer position-relative gap-2"
            style={{ animationDelay: '0s' }}
            onClick={() => setShowAddModal(true)}
          >
            <span className="fw-bold fs-6 text-secondary">+ Corrigir Novo Simulado</span>
            <span className="fs-6 text-secondary">· Clique para corrigir um novo simulado</span>
          </div>
          {simulados.length > 0 ? (
            [...simulados].reverse().map((simulado, idx) => (
              <div key={simulado.id} className='card-padrao2 fadein card-padrao-hover mb-2 w-100 fs-6 pointer py-2' style={{ animationDelay: delays[idx] || '0s' }} onClick={() => handleExpandSimulado(simulado.id)}>
                <div
                  className={`d-flex flex-row align-items-center justify-content-between gap-2 ${selectedId === simulado.id && showSelecao ? '' : ''}`}
                  style={{ position: 'relative' }}
                >
                  <div className="flex-grow-1 d-flex align-items-center gap-2">
                    <span className="d-flex align-items-center text-secondary" title="Simulado">
                      <FileText size={16} />
                    </span>
                    <div className="d-flex align-items-center gap-2">
                      <span className="fw-bold">
                        Simulado #{simulado.numSim}
                      </span>
                      <span className="small text-secondary">
                        {(() => {
                          const d = new Date(simulado.dataSim);
                          d.setHours(d.getHours() + d.getTimezoneOffset() / 60);
                          return d.toLocaleDateString('pt-BR');
                        })()}
                      </span>
                    </div>
                    <div className="stats d-flex align-items-center gap-2 fw-bold ms-auto" style={{ fontSize: '0.85em' }}>
                      {(() => {
                        const stat = stats[simulado.id] || { acertos: 0, erros: 0, branco: 0, liquido: 0 };
                        const totalQuestoes = simulado.quanQuest || simulado.qtdQuestoes || simulado.qtd_questoes || 0;
                        const porcentagem = totalQuestoes > 0 ? ((stat.liquido / totalQuestoes) * 100).toFixed(1) : '0.0';
                        return (
                          <>
                            <span title="Acertos" className="text-success d-flex align-items-center gap-1" style={{ fontSize: '0.9em', minWidth: 32 }}>
                              <Check size={12} /> {stat.acertos}
                            </span>
                            <span title="Erros" className="text-danger d-flex align-items-center gap-1" style={{ fontSize: '0.9em', minWidth: 32 }}>
                              <X size={12} /> {stat.erros}
                            </span>
                            <span title="Brancos" className="text-warning d-flex align-items-center gap-1" style={{ fontSize: '0.9em', minWidth: 32 }}>
                              <File size={12} /> {stat.branco}
                            </span>
                            <span title="Líquido" className="badge bg-primary-primary4 text-primary-primary5 rounded d-flex align-items-center gap-1" style={{ fontSize: '0.85em', minWidth: 32 }}>
                              <Hash size={12} /> {stat.liquido}
                            </span>
                            <span title="Percentual Líquido" className="badge bg-info text-dark rounded d-flex align-items-center gap-1" style={{ fontSize: '0.8em', minWidth: 45 }}>
                              {porcentagem}%
                            </span>
                          </>
                        );
                      })()}
                    </div>
                  </div>
                  <div className="edicao-card d-flex align-items-center gap-2">
                    {simulado.simulado && (
                      <span
                        className="d-flex align-items-center cursor-pointer"
                        onClick={e => { e.stopPropagation(); window.open(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/pdf/${simulado.simulado}`, '_blank'); }}
                        title="Abrir PDF do Simulado"
                      >
                        <FileText size={16} className="btn-icon p-0 text-primary-primary" title="PDF do Simulado" />
                      </span>
                    )}
                    {simulado.gabarito && (
                      <span
                        className="d-flex align-items-center cursor-pointer"
                        onClick={e => { e.stopPropagation(); window.open(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/pdf/${simulado.gabarito}`, '_blank'); }}
                        title="Abrir PDF do Gabarito"
                      >
                        <FileText size={16} className="btn-icon p-0" title="PDF do Gabarito" />
                      </span>
                    )}
                    <span
                      className="d-flex align-items-center cursor-pointer"
                      onClick={e => { e.stopPropagation(); duplicateSimulado(simulado.id); }}
                      title="Duplicar simulado"
                    >
                      <Copy size={16} className="btn-icon p-0" title="Duplicar simulado" />
                    </span>
                    <span
                      className="d-flex align-items-center cursor-pointer"
                      onClick={e => { e.stopPropagation(); handleSelectSimulado(simulado.id); }}
                      title="Editar simulado"
                    >
                      <Edit2 size={16} className="btn-icon p-0" title="Editar simulado" />
                    </span>
                    <button
                      className="btn-icon d-flex align-items-center justify-content-center p-0"
                      onClick={e => { e.stopPropagation(); deleteSimulado(simulado.id); }}
                      title="Apagar simulado"
                    >
                      <Trash size={16} title="Apagar simulado" />
                    </button>
                  </div>
                </div>
                <div
                  style={{
                    height: expandedId === simulado.id ? (cardHeights[simulado.id] || 'auto') : 0,
                    overflow: 'hidden',
                    transition: 'height 0.2s ease-in-out',
                    boxSizing: 'border-box'
                  }}
                >
                  <div ref={el => contentRefs.current[simulado.id] = el}>
                    <div className="p-2">
                      <div className="p-2">
                        <table className="w-100 border-0 align-middle">
                          <thead>
                            <tr>
                              <th className="text-center" style={{ width: 'auto' }}><span title="Matéria">Matéria</span></th>
                              <th className="text-center" title="Quantidade de Questões" style={{ width: '100px' }}><FileText size={14} /></th>
                              <th className="text-center" title="Acertos" style={{ width: '32px' }}><Check size={14} className="text-success" /></th>
                              <th className="text-center" title="Erros" style={{ width: '32px' }}><X size={14} className="text-danger" /></th>
                              <th className="text-center" title="Brancos" style={{ width: '32px' }}><File size={14} className="text-warning" /></th>
                              <th className="text-center" title="Líquido" style={{ width: '32px' }}><Hash size={14} className="text-primary-primary5" /></th>
                              <th className="text-center" title="Percentual Líquido" style={{ width: '48px' }}><span className='badge bg-info text-dark rounded-pill align-items-center'>%</span></th>
                            </tr>
                          </thead>
                          <tbody>
                            {(() => {
                              const respostas = respostasResumo[simulado.id] || [];
                              const materiasResumo = {};
                              respostas.forEach(q => {
                                if (!materiasResumo[q.materia]) {
                                  materiasResumo[q.materia] = { total: 0, acertos: 0, erros: 0, branco: 0, liquido: 0 };
                                }
                                materiasResumo[q.materia].total++;
                                if (q.resposta === "S") {
                                  materiasResumo[q.materia].branco++;
                                } else if (q.resposta === q.gabarito) {
                                  materiasResumo[q.materia].acertos++;
                                  materiasResumo[q.materia].liquido++;
                                } else {
                                  materiasResumo[q.materia].erros++;
                                  materiasResumo[q.materia].liquido--;
                                }
                              });
                              // Cores para degradê
                              const colorMin = { r: 136, g: 52, b: 62 }; // vermelho
                              const colorMax = { r: 113, g: 221, b: 140 }; // verde
                              const liquidos = Object.values(materiasResumo).map(dados => dados.liquido);
                              const minLiquido = Math.min(...liquidos);
                              const maxLiquido = Math.max(...liquidos);
                              function getGradientColor(val) {
                                if (maxLiquido === minLiquido) {
                                  // Se todos iguais, retorna verde
                                  return `rgb(${colorMax.r},${colorMax.g},${colorMax.b})`;
                                }
                                const t = (val - minLiquido) / (maxLiquido - minLiquido);
                                const r = Math.round(colorMin.r + (colorMax.r - colorMin.r) * t);
                                const g = Math.round(colorMin.g + (colorMax.g - colorMin.g) * t);
                                const b = Math.round(colorMin.b + (colorMax.b - colorMin.b) * t);
                                return `rgb(${r},${g},${b})`;
                              }
                              return Object.entries(materiasResumo).map(([materia, dados], idx) => {
                                const perc = dados.total > 0 ? (dados.liquido / dados.total) * 100 : 0;
                                let percStr = dados.total > 0 ? perc % 1 === 0 ? perc.toFixed(0) : perc.toFixed(1).replace(/\.0$/, '') : '0';
                                const altBgStyle = idx % 2 !== 0 ? { backgroundColor: '#f8f9fa' } : {};
                                const bgColor = getGradientColor(dados.liquido);
                                return (
                                  <tr key={materia} style={{ ...altBgStyle }}>
                                    <td className="text-start">{materia}</td>
                                    <td className="text-center"><span className="badge p-1 bg-secondary">{dados.total}</span></td>
                                    <td className="text-center text-success"><span style={{ fontSize: '0.95em', minWidth: 32, display: 'inline-block', textAlign: 'center' }}>{dados.acertos}</span></td>
                                    <td className="text-center text-danger"><span style={{ fontSize: '0.95em', minWidth: 32, display: 'inline-block', textAlign: 'center' }}>{dados.erros}</span></td>
                                    <td className="text-center"><span style={{ fontSize: '0.95em', minWidth: 32, display: 'inline-block', textAlign: 'center', color: '#ffc107' }}>{dados.branco}</span></td>
                                    <td className="text-center text-primary-primary5"><span className="badge p-1 bg-primary-primary4 text-primary-primary5" >{dados.liquido}</span></td>
                                    <td className="text-center" style={{ background: bgColor, width: 48 }}><span style={{ fontSize: '0.85em', minWidth: 28, display: 'inline-block', textAlign: 'center', color: '#fff' }}>{percStr + '%'}</span></td>
                                  </tr>
                                );
                              });
                            })()}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : <p></p>}
        </div>

        {/* Modal para adicionar novo simulado */}
        <Modal show={showAddModal} onHide={() => setShowAddModal(false)} centered backdrop="static" className="modal-fundo">
              <Modal.Body className="modal-estilo">
                <div className="d-flex justify-content-between align-items-center mb-1">
                  <Modal.Title className="fw-bold fs-5 m-0">Corrigir novo simulado</Modal.Title>
                </div>
                <p className="text-secondary mb-4" style={{ fontSize: '0.8em' }}>Informe a quantidade de questões e a data de realização do simulado.</p>
                <form className="form-modal needs-validation" noValidate onSubmit={e => {
                  e.preventDefault();
                  if (!inputQuanQuest || !inputDataSim) {
                    e.target.classList.add('was-validated');
                    return;
                  }
                  createSimulado();
                }}>
                  <div className="d-flex gap-4 mb-3">
                    <div className="d-flex flex-column">
                      <label className="form-label fw-semibold" style={{ fontSize: '0.78em', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-light)' }}>Qtd. Questões</label>
                      <div className="d-flex flex-row align-items-center gap-2">
                        <input
                          placeholder="0"
                          name='quanQuest'
                          type='number'
                          value={inputQuanQuest}
                          onChange={e => setInputQuanQuest(e.target.value)}
                          required
                          min={1}
                          max={200}
                          step={1}
                          className="linha form-control w-auto text-center"
                        />
                        <div className="d-flex flex-row gap-1 align-items-center h-38">
                          <button size="sm" className="btn btn-outline-primary-primary3 fw-bold w-auto px-2 py-1 d-flex align-items-center justify-content-center w-44 h-38" onClick={e => { e.preventDefault(); setInputQuanQuest('120'); }}>120</button>
                          <button size="sm" className="btn btn-outline-primary-primary3 fw-bold w-auto px-2 py-1 d-flex align-items-center justify-content-center w-44 h-38" onClick={e => { e.preventDefault(); setInputQuanQuest('80'); }}>80</button>
                          <button size="sm" className="btn btn-outline-primary-primary3 fw-bold w-auto px-2 py-1 d-flex align-items-center justify-content-center w-44 h-38" onClick={e => { e.preventDefault(); setInputQuanQuest('60'); }}>60</button>
                        </div>
                      </div>
                    </div>
                    <div className="d-flex flex-column">
                      <label className="form-label fw-semibold" style={{ fontSize: '0.78em', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-light)' }}>Data</label>
                      <div className="d-flex gap-2 align-items-center">
                        <input
                          placeholder="Data"
                          name='dataSim'
                          type='date'
                          value={inputDataSim}
                          onChange={e => setInputDataSim(e.target.value)}
                          required
                          className="linha text-center form-control px-2 py-1 w-75"
                        />
                        <button size="sm" className="btn btn-outline-primary-primary3 text-nowrap" onClick={e => {
                          e.preventDefault();
                          const today = new Date();
                          const yyyy = today.getFullYear();
                          const mm = String(today.getMonth() + 1).padStart(2, '0');
                          const dd = String(today.getDate()).padStart(2, '0');
                          setInputDataSim(`${yyyy}-${mm}-${dd}`);
                        }}>Hoje</button>
                      </div>
                    </div>
                  </div>
                  <div className="d-none">
                    <input type="text" required value={inputQuanQuest.trim() && inputDataSim.trim() ? 'ok' : ''} readOnly />
                  </div>
                  <div className="d-flex justify-content-end gap-3 mt-3">
                    <button className='btn btn-outline-primary-primary3' onClick={() => setShowAddModal(false)}>
                      Cancelar
                    </button>
                    <button className='btn btn-primary-primary3' type="submit">
                      Cadastrar
                    </button>
                  </div>
                </form>
              </Modal.Body>
            </Modal>

      </main>
    </div>
  );
}

export default Home;
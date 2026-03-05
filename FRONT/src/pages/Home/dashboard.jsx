import React, { useEffect, useRef, useState } from 'react';
import api from '../../services/api';
import { Table } from 'react-bootstrap';
import { Line, Bar, Pie } from 'react-chartjs-2';
import { Chart, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Legend, Tooltip, Title, Filler, ArcElement } from 'chart.js';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import { Check, X, Circle, Hash, Calendar, TrendingUp, Folder, Frown, AlertTriangle } from 'react-feather';
import Navbar from '../../components/Navbar';
import { usePageTitle } from '../../components/PageTitleContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

import Spinner from 'react-bootstrap/Spinner';
import { SkeletonDashboard } from '../../components/Skeleton';

Chart.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Legend, Tooltip, Title, Filler, ArcElement);


const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const toastShownRef = useRef(false);
  const [simulados, setSimulados] = useState([]);
  const [resumos, setResumos] = useState({});
  const [materiasProjeto, setMateriasProjeto] = useState([]);
  const [expandedSimulado, setExpandedSimulado] = useState(null);
  const [mediaQtd, setMediaQtd] = useState('5'); // string: '1'-'5'
  const [materiaQtd, setMateriaQtd] = useState('5'); // string: '1'-'5'
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [analise, setAnalise] = useState(null);
  const [loadingAnalise, setLoadingAnalise] = useState(false);
  const [materiaSelecionada, setMateriaSelecionada] = useState(null);
  const [analiseQtd, setAnaliseQtd] = useState('all');
  const { setTitle } = usePageTitle();

  // CSS para estabilizar layout com tooltips do Bootstrap
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .tooltip {
        pointer-events: none !important;
      }
      .tooltip-inner {
        font-size: 11px !important;
        padding: 4px 8px !important;
        border-radius: 4px !important;
      }
      .card-padrao {
        will-change: auto !important;
        transform: translateZ(0) !important;
      }
      .resumo-scroll {
        scrollbar-width: none;
        -ms-overflow-style: none;
      }
      .resumo-scroll::-webkit-scrollbar {
        display: none;
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);
  useEffect(() => {
    setTitle('Dashboard');
    document.title = 'FLUX | Dashboard';
  }, [setTitle]);

  useEffect(() => {
    if (materiasProjeto.length > 0 && !materiaSelecionada) {
      setMateriaSelecionada(materiasProjeto[0].nome);
    }
  }, [materiasProjeto]);

  useEffect(() => {
    let isMounted = true;
    async function fetchData() {
      try {
        const projetoSelecionado = localStorage.getItem('projetoSelecionado') || '';

        // Se não há projeto selecionado, não carrega nada (apenas mostra mensagem)
        if (!projetoSelecionado) {
          if (isMounted) setLoading(false);
          return;
        }

        const userId = localStorage.getItem('userId') || '';

        // Primeiro verifica se há simulados (requisição rápida para decisão)
        const simuladosCheck = await api.get('/simulados', { params: { userId, projetoId: projetoSelecionado } });
        const simuladosFiltrados = simuladosCheck.data.filter(sim => sim.projetoId === projetoSelecionado);

        // Se não há simulados, não mostra loading
        if (simuladosFiltrados.length === 0) {
          if (isMounted) {
            setSimulados([]);
            setMateriasProjeto([]);
            setResumos({});
            setLoading(false);
          }
          return;
        }

        // Só executa loading se há projeto selecionado E há simulados
        if (isMounted) setLoading(true);

        // Dispara requisições restantes em paralelo
        const [materiasRes, resumoRes] = await Promise.all([
          api.get('/edital', { params: { userId, projetoId: projetoSelecionado } }),
          api.get('/dashboard/resumos', { params: { userId, projetoId: projetoSelecionado } })
        ]);

        const materiasFiltradas = materiasRes.data.filter(mat => mat.projetoId === projetoSelecionado);
        const resFiltrados = {};
        Object.keys(resumoRes.data || {}).forEach(id => {
          if (resumoRes.data[id].projetoId === projetoSelecionado) {
            resFiltrados[id] = resumoRes.data[id];
          }
        });
        if (isMounted) {
          setSimulados(simuladosFiltrados);
          setMateriasProjeto(materiasFiltradas);
          setResumos(resFiltrados);
        }
      } catch (err) {
        console.error('Erro ao carregar dashboard:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    // Inicia sem loading se não há projeto
    const projetoSelecionado = localStorage.getItem('projetoSelecionado') || '';
    if (!projetoSelecionado) {
      setLoading(false);
    } else {
      fetchData();
    }

    // Atualiza ao detectar alteração no localStorage
    const handleStorage = (e) => {
      if (e.key === 'atualizaDashboard') {
        fetchData();
      }
    };
    window.addEventListener('storage', handleStorage);

    return () => {
      isMounted = false;
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  useEffect(() => {
    if (analise) return; // já carregou
    const userId = JSON.parse(localStorage.getItem('user'))?.id || '';
    const projetoId = localStorage.getItem('projetoSelecionado') || '';
    if (!userId || !projetoId) return;
    setLoadingAnalise(true);
    api.get('/dashboard/analise', { params: { userId, projetoId } })
      .then(res => setAnalise(res.data))
      .catch(() => setAnalise({}))
      .finally(() => setLoadingAnalise(false));
  }, [analise]);

  useEffect(() => {
    const projetoSelecionado = localStorage.getItem('projetoSelecionado');
    // Remova o redirecionamento automático:
    // if (!projetoSelecionado && !toastShownRef.current) {
    //   toastShownRef.current = true;
    //   navigate('/projeto');
    //   setTimeout(() => {
    //     toast.warn('Insira um projeto para acessar o dashboard', {
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

  // Função para filtrar simulados pelo intervalo de datas
  function filtrarPorData(simulados) {
    if (!dataInicio && !dataFim) return simulados;
    return simulados.filter(sim => {
      const dataSim = new Date(sim.dataSim);
      const inicio = dataInicio ? new Date(dataInicio) : null;
      const fim = dataFim ? new Date(dataFim) : null;
      if (inicio && dataSim < inicio) return false;
      if (fim && dataSim > fim) return false;
      return true;
    });
  }

  // Use simulados filtrados em todo o dashboard
  const simuladosFiltrados = filtrarPorData(simulados);
  const simuladosOrdenados = [...simuladosFiltrados]
    .filter(sim => sim.dataSim && !isNaN(new Date(sim.dataSim).getTime())) // Remove simulados com datas inválidas
    .sort((a, b) => {
      // Ordenação primária por número do simulado (maior número = mais recente)
      const numA = parseInt(a.numSim) || 0;
      const numB = parseInt(b.numSim) || 0;
      if (numB !== numA) {
        return numB - numA;
      }
      // Ordenação secundária por ID caso os números sejam iguais (maior ID = mais recente)
      return (b.id || 0) - (a.id || 0);
    });
  const simuladosRecentes =
    String(materiaQtd) === 'all'
      ? [...simuladosOrdenados].reverse()
      : simuladosOrdenados.slice(0, Number(materiaQtd)).reverse(); // Ordem cronológica para tabelas
  const simuladosParaMedia =
    String(mediaQtd) === 'all'
      ? simuladosOrdenados
      : simuladosOrdenados.slice(0, Number(mediaQtd));

  // Calcula médias
  const total = simuladosParaMedia.length || 1;
  const mediaAcertos = (simuladosParaMedia.reduce((sum, sim) => sum + (resumos[sim.id]?.acertos ?? 0), 0) / total).toFixed(2);
  const mediaErros = (simuladosParaMedia.reduce((sum, sim) => sum + (resumos[sim.id]?.erros ?? 0), 0) / total).toFixed(2);
  const mediaBrancos = (simuladosParaMedia.reduce((sum, sim) => sum + (resumos[sim.id]?.brancos ?? 0), 0) / total).toFixed(2);
  const mediaLiquido = (simuladosParaMedia.reduce((sum, sim) => {
    const acertos = resumos[sim.id]?.acertos ?? 0;
    const erros = resumos[sim.id]?.erros ?? 0;
    return sum + (acertos - erros);
  }, 0) / total).toFixed(2);

  // Função para formatar data evitando problemas de timezone
  const formatarDataSegura = (dateString) => {
    if (!dateString) return 'Data inválida';
    try {
      // Tenta diferentes formatos de data
      let date;

      // Se já é um objeto Date válido
      if (dateString instanceof Date && !isNaN(dateString.getTime())) {
        date = dateString;
      }
      // Se é uma string ISO (YYYY-MM-DD ou YYYY-MM-DDTHH:mm:ss)
      else if (typeof dateString === 'string') {
        // Remove o horário se existir, mantém só a data
        const dateOnly = dateString.split('T')[0];
        date = new Date(dateOnly + 'T00:00:00');
      }
      // Fallback para new Date direto
      else {
        date = new Date(dateString);
      }

      if (isNaN(date.getTime())) return 'Data inválida';
      return date.toLocaleDateString('pt-BR');
    } catch (error) {
      console.error('Erro ao formatar data:', dateString, error);
      return 'Data inválida';
    }
  };

  // Dados para o gráfico de evolução geral (ordem cronológica crescente)
  const simuladosParaGrafico = (String(mediaQtd) === 'all' ? simuladosOrdenados : simuladosOrdenados.slice(0, Number(mediaQtd))).slice().reverse(); // Inverte para ordem cronológica
  const chartLabels = simuladosParaGrafico.map(sim => {
    return formatarDataSegura(sim.dataSim);
  });
  const acertosData = simuladosParaGrafico.map(sim => resumos[sim.id]?.acertos ?? 0);
  const errosData = simuladosParaGrafico.map(sim => resumos[sim.id]?.erros ?? 0);
  const brancosData = simuladosParaGrafico.map(sim => resumos[sim.id]?.brancos ?? 0);
  const liquidoData = simuladosParaGrafico.map(sim => {
    const acertos = resumos[sim.id]?.acertos ?? 0;
    const erros = resumos[sim.id]?.erros ?? 0;
    return acertos - erros;
  });
  const tendenciaLiquida = calcularLinhaTendencia(liquidoData);

  const chartData = {
    labels: chartLabels,
    datasets: [
      {
        label: 'Acertos',
        data: acertosData,
        borderColor: '#34C759',
        backgroundColor: '#71dd8c22',
        fill: false,
        tension: 0.2,
      },
      {
        label: 'Erros',
        data: errosData,
        borderColor: '#FF2D55',
        backgroundColor: '#83313e22',
        fill: false,
        tension: 0.2,
      },
      {
        label: 'Brancos',
        data: brancosData,
        borderColor: '#FF9500',
        backgroundColor: '#FF950022',
        fill: false,
        tension: 0.2,
      },
      {
        label: 'Líquido',
        data: liquidoData,
        borderColor: '#1b59f9',
        backgroundColor: '#1b59f933',
        fill: false,
        tension: 0.2,
      },
      {
        label: 'Tendência Líquida',
        data: tendenciaLiquida,
        borderColor: '#ff9800',
        backgroundColor: 'rgba(255,152,0,0.1)',
        borderDash: [6, 6],
        pointRadius: 0,
        fill: false,
        tension: 0,
        order: 10
      }
    ],
  };

  const handleExpand = (id) => {
    setExpandedSimulado(expandedSimulado === id ? null : id);
  };

  // Lista de todas as matérias do projeto
  const todasMaterias = materiasProjeto.map(mat => mat.nome);

  // Pega os N últimos simulados para gráfico de matérias
  const simuladosMateria = materiaQtd === 'all' ? simuladosOrdenados : simuladosOrdenados.slice(0, Number(materiaQtd));

  // Calcula porcentagem líquida somada por matéria
  const materiasPorcentagem = todasMaterias.map(materiaNome => {
    let liquidoTotal = 0;
    let totalQuestoes = 0;
    simuladosMateria.forEach(sim => {
      const mat = (resumos[sim.id]?.materias ?? []).find(m => m.nome === materiaNome);
      if (mat) {
        liquidoTotal += (mat.acertos - mat.erros);
        totalQuestoes += (mat.acertos + mat.erros + mat.brancos);
      }
    });
    const porcentagem = totalQuestoes > 0 ? ((liquidoTotal / totalQuestoes) * 100).toFixed(1) : 0;
    return {
      nome: materiaNome,
      porcentagem: Number(porcentagem)
    };
  });

  // Cálculo da linha de tendência (regressão linear) para nota líquida
  function calcularLinhaTendencia(yArray) {
    const n = yArray.length;
    if (n === 0) return [];
    const xArray = Array.from({ length: n }, (_, i) => i + 1);
    const xMean = xArray.reduce((a, b) => a + b, 0) / n;
    const yMean = yArray.reduce((a, b) => a + b, 0) / n;
    let num = 0, den = 0;
    for (let i = 0; i < n; i++) {
      num += (xArray[i] - xMean) * (yArray[i] - yMean);
      den += (xArray[i] - xMean) ** 2;
    }
    const m = den === 0 ? 0 : num / den;
    const b = yMean - m * xMean;
    return xArray.map(x => m * x + b);
  }

  // Mapeia nome da matéria para cor
  const materiasCoresMap = React.useMemo(() => {
    const map = {};
    materiasProjeto.forEach(m => { if (m.nome) map[m.nome] = m.cor || '#0d6efd'; });
    return map;
  }, [materiasProjeto]);

  // Cálculo das cores condicionais para o gráfico de barras
  const pontuacoes = materiasPorcentagem.map(m => m.porcentagem);
  const minPontuacao = Math.min(...pontuacoes);
  const maxPontuacao = Math.max(...pontuacoes);
  const barrasCores = pontuacoes.map(p => {
    const percentNorm = minPontuacao === maxPontuacao ? 0.5 : (p - minPontuacao) / (maxPontuacao - minPontuacao);
    // Interpolação entre #FF2D55 (vermelho) e #34C759 (verde)
    const r = Math.round(255 + (52 - 255) * percentNorm);
    const g = Math.round(45 + (199 - 45) * percentNorm);
    const b = Math.round(85 + (89 - 85) * percentNorm);
    return `rgb(${r},${g},${b})`;
  });
  const materiasChartData = {
    labels: materiasPorcentagem.map(m => m.nome),
    datasets: [
      {
        label: '% Líquido',
        data: pontuacoes,
        borderColor: barrasCores,
        backgroundColor: barrasCores,
        fill: true,
        tension: 0.2,
      }
    ]
  };

  // Adicione este bloco logo antes do return:
  const projetoSelecionado = localStorage.getItem('projetoSelecionado');
  if (loading) {
    return <SkeletonDashboard />;
  }
  if (!projetoSelecionado) {
    return (
      <div className="app-container d-flex flex-column justify-content-center align-items-center" style={{ minHeight: '80vh' }}>
        <div className="d-flex flex-column align-items-center text-center">
          <Folder size={48} className="mb-3 text-secondary" />
          <h4 className="mb-3 fs-6 text-secondary">Nenhum projeto selecionado.<br />Selecione ou crie um projeto para acessar o dashboard.</h4>
          <button className="btn btn-primary-primary px-4 py-2" onClick={() => navigate('/projeto')}>
            Ir para Projetos
          </button>
        </div>
      </div>
    );
  }
  if (simulados.length === 0) {
    return (
      <div className="app-container d-flex flex-column justify-content-center align-items-center" style={{ minHeight: '80vh' }}>
        <div className="text-center d-flex flex-column align-items-center gap-2">
          <Frown size={48} className="text-secondary" />
          <h4 className="text-center text-secondary fs-6 m-0">Não há nenhum simulado cadastrado.</h4>
          <button className="btn btn-primary-primary3 px-4 py-2" onClick={() => navigate('/simulados')}>
            Ir para Simulados
          </button>
        </div>
      </div>
    );
  }

  const MOTIVO_COLORS = ['#FF2D55', '#FF9500', '#FFCC00', '#34C759', '#007AFF', '#5856D6', '#AF52DE', '#FF3B30', '#8e8e93'];

  return (
    <div className="app-container">
      <main className="container-fluid gap-4 pt-3 pb-4 fadein" style={{ animationDelay: '0.05s' }}>

        {/* ─── BLOCO 1: VISÃO GERAL ─── */}
        <div className="m-0 w-100 p-3 fadein position-relative mb-4" style={{ borderRadius: '1em', animationDelay: '0.1s', border: '1px solid var(--border)', overflow: 'visible' }}>
          <div className="card-title-padrao position-absolute px-3" style={{ top: '-12px', left: '20px', zIndex: 1, backgroundColor: 'var(--background)' }}>VISÃO GERAL</div>
          <div className="position-absolute d-flex align-items-center gap-2 px-2" style={{ top: '-12px', right: '20px', zIndex: 1, backgroundColor: 'var(--background)', fontSize: '0.7rem', color: 'var(--text-light)' }}>
            <span className="text-muted">Últimos</span>
            <select
              className="form-select form-select-sm fw-bold"
              style={{ width: '58px', fontSize: '0.72rem', padding: '1px 4px', color: 'var(--text-middle)', backgroundColor: 'var(--background-light)', borderColor: 'var(--border)' }}
              value={mediaQtd}
              onChange={e => { setMediaQtd(e.target.value); setMateriaQtd(e.target.value); }}
            >
              {[1, 2, 3, 4, 5, 10].map(n => <option key={n} value={String(n)}>{n}</option>)}
              <option value="all">Todos</option>
            </select>
            <span className="text-muted">simulados</span>
          </div>
          <div style={{ padding: '1rem' }}>

            <div className='bloco-meio fadein d-flex w-100 align-items-stretch' style={{ animationDelay: '0.15s', gap: '1.5rem' }}>
              {/* Tabela resumo */}
              <div className='card-padrao2 parte-meio fadein' style={{ animationDelay: '0.25s', padding: '1rem', position: 'relative', flex: 2 }}>
                <div className="card-title-padrao">Resumo</div>
                <div className="card-content">
                  <div className="resumo-scroll" style={{ overflowX: 'auto', overflowY: 'auto', maxHeight: '280px' }}>
                    <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: '0.82rem' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                          <th style={{ padding: '8px 12px', fontWeight: 600, color: 'var(--text-light)', textAlign: 'left', borderRight: '1px solid rgba(255,255,255,0.06)' }}><span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Hash size={13} /> Sim.</span></th>
                          <th style={{ padding: '8px 12px', fontWeight: 600, color: 'var(--text-light)', textAlign: 'left', borderRight: '1px solid rgba(255,255,255,0.06)' }}><span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Calendar size={13} /> Data</span></th>
                          <th style={{ padding: '8px 12px', fontWeight: 600, color: '#34C759', textAlign: 'center', borderRight: '1px solid rgba(255,255,255,0.06)' }}><span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}><Check size={13} /> Acertos</span></th>
                          <th style={{ padding: '8px 12px', fontWeight: 600, color: '#FF2D55', textAlign: 'center', borderRight: '1px solid rgba(255,255,255,0.06)' }}><span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}><X size={13} /> Erros</span></th>
                          <th style={{ padding: '8px 12px', fontWeight: 600, color: '#FF9500', textAlign: 'center', borderRight: '1px solid rgba(255,255,255,0.06)' }}><span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}><Circle size={13} /> Brancos</span></th>
                          <th style={{ padding: '8px 12px', fontWeight: 600, color: '#1b59f9', textAlign: 'center' }}><span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}><TrendingUp size={13} /> Líquido</span></th>
                        </tr>
                      </thead>
                      <tbody>
                        {(() => {
                          const rowsToDisplay = Array(5).fill(null).map((_, idx) => simuladosRecentes[idx] || null);
                          return rowsToDisplay.map((sim, idx) => {
                            const resumo = sim ? resumos[sim.id] || {} : {};
                            const data = sim ? formatarDataSegura(sim.dataSim) : '-';
                            const acertos = sim ? (resumo.acertos ?? 0) : '-';
                            const erros = sim ? (resumo.erros ?? 0) : '-';
                            const brancos = sim ? (resumo.brancos ?? 0) : '-';
                            const liquido = sim ? (acertos - erros) : '-';
                            const rowBg = idx % 2 !== 0 ? 'rgba(0,0,0,0.05)' : 'transparent';
                            const sep = { borderRight: '1px solid rgba(255,255,255,0.06)' };
                            return (
                              <tr key={idx} style={{ backgroundColor: rowBg, borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                                <td style={{ padding: '7px 12px', verticalAlign: 'middle', ...sep }}>{sim ? <span className="badge" style={{ backgroundColor: 'rgba(255,255,255,0.07)', color: 'var(--text-light)', fontWeight: 600, fontSize: '0.75rem' }}>#{sim.numSim}</span> : '-'}</td>
                                <td style={{ padding: '7px 12px', verticalAlign: 'middle', color: 'var(--text-light)', ...sep }}>{data}</td>
                                <td style={{ padding: '7px 12px', verticalAlign: 'middle', textAlign: 'center', fontWeight: 700, color: sim ? '#34C759' : 'var(--text-light-light)', ...sep }}>{acertos}</td>
                                <td style={{ padding: '7px 12px', verticalAlign: 'middle', textAlign: 'center', fontWeight: 700, color: sim ? '#FF2D55' : 'var(--text-light-light)', ...sep }}>{erros}</td>
                                <td style={{ padding: '7px 12px', verticalAlign: 'middle', textAlign: 'center', fontWeight: 700, color: sim ? '#FF9500' : 'var(--text-light-light)', ...sep }}>{brancos}</td>
                                <td style={{ padding: '7px 12px', verticalAlign: 'middle', textAlign: 'center', fontWeight: 700, color: sim ? '#1b59f9' : 'var(--text-light-light)' }}>{liquido}</td>
                              </tr>
                            );
                          });
                        })()}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Gráfico evolução */}
              <div className="card-padrao2 parte-esquerda fadein" style={{ animationDelay: '0.2s', padding: '1rem', position: 'relative', flex: 1, display: 'flex', flexDirection: 'column' }}>
                <div className="card-title-padrao">Evolução da Pontuação</div>
                <div className="card-content" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', maxHeight: '200px' }}>
                    <Line data={chartData} options={{ interaction: { mode: 'index', intersect: false }, scales: { x: { grid: { color: '#bbb' }, ticks: { color: '#bbb' } }, y: { grid: { display: false }, ticks: { color: '#bbb' } } }, plugins: { legend: { display: false }, tooltip: { backgroundColor: 'rgba(30,30,30,0.95)', titleColor: '#fff', bodyColor: '#ccc', borderColor: 'rgba(255,255,255,0.12)', borderWidth: 1, padding: 8 } } }}
                      plugins={[{ beforeDatasetsDraw: (chart) => { const ctx = chart.ctx; const chartArea = chart.chartArea; if (!chartArea) return; const datasetIndex = chart.data.datasets.findIndex(ds => ds.label === 'Líquido'); if (datasetIndex === -1) return; const meta = chart.getDatasetMeta(datasetIndex); ctx.save(); const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom); gradient.addColorStop(0, '#1b59f9'); gradient.addColorStop(1, 'rgba(65,134,235,0.05)'); ctx.globalAlpha = 0.5; ctx.fillStyle = gradient; ctx.beginPath(); meta.data.forEach((point, i) => { if (i === 0) ctx.moveTo(point.x, chartArea.bottom); ctx.lineTo(point.x, point.y); }); meta.data.slice().reverse().forEach((point) => { ctx.lineTo(point.x, chartArea.bottom); }); ctx.closePath(); ctx.fill(); ctx.restore(); } }]}
                    />
                  </div>
                  <div style={{ paddingTop: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-light-light)', marginBottom: '0.5rem', fontWeight: 600 }}>Médias</div>
                    <div style={{ display: 'flex', justifyContent: 'space-around', gap: '0.5rem' }}>
                      {[{ label: 'Líquido', val: mediaLiquido, color: '#1b59f9' }, { label: 'Acertos', val: mediaAcertos, color: '#34C759' }, { label: 'Erros', val: mediaErros, color: '#FF2D55' }, { label: 'Brancos', val: mediaBrancos, color: '#FF9500' }].map(({ label, val, color }) => (
                        <div key={label} style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: '0.65rem', color: 'var(--text-light-light)', marginBottom: '0.25rem' }}>{label}</div>
                          <span className='badge' style={{ backgroundColor: color, color: '#fff', fontWeight: 600, fontSize: '0.75rem' }}>{val}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Comparação + Pontuação acumulada */}
            <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'stretch', marginTop: '1.5rem' }}>
              <div className="card-padrao2 fadein" style={{ animationDelay: '0.35s', padding: '1rem', position: 'relative', flex: 1 }}>
                <div className="card-title-padrao">Comparação das Notas Líquidas por Matéria</div>
                <div className="card-content">
                  <div className="resumo-scroll" style={{ overflowX: 'auto', overflowY: 'auto', maxHeight: '280px', scrollbarWidth: 'none', msOverflowStyle: 'none', marginBottom: '1rem', borderRadius: '0.5rem', overflow: 'hidden' }}>
                    {simuladosRecentes.length === 0 || todasMaterias.length === 0 ? (
                      <div style={{ textAlign: 'center', color: '#888', padding: '2em' }}>Nenhum dado para exibir.</div>
                    ) : (
                      <table className="tabela-simulado" style={{ borderCollapse: 'collapse', width: '100%', fontSize: '0.75rem' }}>
                        <thead>
                          <tr>
                            <th className="text-center" style={{ borderTop: 'none', borderLeft: 'none', borderRight: 'none', borderBottom: '1px solid var(--text-light-light)', padding: '6px 4px' }}>Matéria</th>
                            {simuladosRecentes.map(sim => (
                              <th key={sim.id} className="text-center" style={{ borderTop: 'none', borderLeft: 'none', borderRight: 'none', borderBottom: '1px solid var(--text-light-light)', padding: '6px 4px', fontSize: '0.7rem' }}>Sim. {sim.numSim}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {(() => {
                            const colPorcentagens = simuladosRecentes.map(sim =>
                              todasMaterias.map(materiaNome => {
                                const mat = (resumos[sim.id]?.materias ?? []).find(m => m.nome === materiaNome);
                                const totalMat = mat ? (mat.acertos + mat.erros + mat.brancos) : 0;
                                return totalMat > 0 ? (mat.acertos - mat.erros) / totalMat * 100 : null;
                              })
                            );
                            const colMinMax = colPorcentagens.map(col => {
                              const vals = col.filter(v => v !== null);
                              return { min: Math.min(...vals), max: Math.max(...vals) };
                            });
                            return todasMaterias.map((materiaNome, rowIdx) => (
                              <tr key={materiaNome}>
                                <td style={{ border: 'none', borderBottom: rowIdx === todasMaterias.length - 1 ? 'none' : '1px solid var(--text-light-light)', padding: '5px 4px', fontSize: '0.75rem' }}>{materiaNome}</td>
                                {simuladosRecentes.map((sim, colIdx) => {
                                  const mat = (resumos[sim.id]?.materias ?? []).find(m => m.nome === materiaNome);
                                  const totalMat = mat ? (mat.acertos + mat.erros + mat.brancos) : 0;
                                  const porcentagem = totalMat > 0 ? (mat.acertos - mat.erros) / totalMat * 100 : null;
                                  let bgColor = '';
                                  if (porcentagem !== null) {
                                    const { min, max } = colMinMax[colIdx];
                                    const percentNorm = min === max ? 0.5 : (porcentagem - min) / (max - min);
                                    const r = Math.round(255 + (52 - 255) * percentNorm);
                                    const g = Math.round(45 + (199 - 45) * percentNorm);
                                    const b = Math.round(85 + (89 - 85) * percentNorm);
                                    bgColor = `rgb(${r},${g},${b})`;
                                  }
                                  const isMin = porcentagem !== null && porcentagem === colMinMax[colIdx].min;
                                  return (
                                    <td className='p-1' key={sim.id} style={{ fontWeight: 'bold', color: '#fff', textAlign: 'center', border: 'none', borderBottom: rowIdx === todasMaterias.length - 1 ? 'none' : '1px solid var(--text-light-light)', background: bgColor, position: 'relative', padding: '5px 3px', fontSize: '0.7rem' }}>
                                      {totalMat > 0 ? porcentagem.toFixed(0) + '%' : '-'}
                                      {isMin && totalMat > 0 ? <AlertTriangle size={8} style={{ position: 'absolute', top: '2px', right: '2px', color: '#FF9500', filter: 'drop-shadow(0 0 2px rgba(0,0,0,0.5))' }} title="Dar atenção" /> : null}
                                    </td>
                                  );
                                })}
                              </tr>
                            ));
                          })()}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
              </div>

              <div className="card-padrao2 fadein" style={{ animationDelay: '0.4s', padding: '1rem', position: 'relative', flex: 1 }}>
                <div className="card-title-padrao">Pontuação Acumulada</div>
                <div className="card-content" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                  {materiasPorcentagem.length === 0 ? (
                    <div style={{ textAlign: 'center', color: '#888', padding: '2em' }}>Nenhum dado para exibir.</div>
                  ) : (
                    <div style={{ width: '100%', height: '250px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                      <Bar data={materiasChartData} options={{ interaction: { mode: 'index', intersect: false }, indexAxis: 'y', plugins: { legend: { display: false }, tooltip: { backgroundColor: 'rgba(30,30,30,0.95)', titleColor: '#fff', bodyColor: '#ccc', borderColor: 'rgba(255,255,255,0.12)', borderWidth: 1, padding: 8 } }, scales: { x: { title: { display: false }, grid: { color: '#bbb' }, ticks: { color: '#bbb', font: { size: 10 }, callback: v => v + '%' } }, y: { grid: { display: false }, ticks: { color: '#bbb', font: { size: 11 } } } } }} />
                    </div>
                  )}
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* ─── BLOCO 2: DESEMPENHO POR MATÉRIA ─── */}
        <div className="m-0 w-100 p-3 fadein position-relative mb-4" style={{ borderRadius: '1em', animationDelay: '0.2s', border: '1px solid var(--border)', overflow: 'visible' }}>
          <div className="card-title-padrao position-absolute px-3" style={{ top: '-12px', left: '20px', zIndex: 1, backgroundColor: 'var(--background)' }}>DESEMPENHO POR MATÉRIA</div>
          <div className="position-absolute d-flex align-items-center gap-2 px-2" style={{ top: '-12px', right: '20px', zIndex: 1, backgroundColor: 'var(--background)', fontSize: '0.7rem', color: 'var(--text-light)' }}>
            <span className="text-muted">Últimos</span>
            <select
              className="form-select form-select-sm fw-bold"
              style={{ width: '58px', fontSize: '0.72rem', padding: '1px 4px', color: 'var(--text-middle)', backgroundColor: 'var(--background-light)', borderColor: 'var(--border)' }}
              value={analiseQtd}
              onChange={e => setAnaliseQtd(e.target.value)}
            >
              {[1, 2, 3, 4, 5, 10].map(n => <option key={n} value={String(n)}>{n}</option>)}
              <option value="all">Todos</option>
            </select>
            <span className="text-muted">simulados</span>
          </div>
          <div style={{ padding: '1rem' }}>

            {/* Chips de seleção */}
            <div className="d-flex flex-wrap gap-2 mb-3">
              {materiasProjeto.map(mat => (
                <button key={mat.id} className="btn btn-sm"
                  onClick={() => setMateriaSelecionada(materiaSelecionada === mat.nome ? null : mat.nome)}
                  style={{ borderRadius: 20, border: `1.5px solid ${mat.cor || '#0d6efd'}`, background: materiaSelecionada === mat.nome ? (mat.cor || '#0d6efd') : 'transparent', color: materiaSelecionada === mat.nome ? '#fff' : 'var(--text-secondary)', fontWeight: 600, fontSize: '0.8rem', padding: '3px 14px', transition: 'all 0.15s' }}>
                  {mat.nome}
                </button>
              ))}
            </div>

            {!materiaSelecionada ? (
              <div className="text-secondary text-center py-3" style={{ fontSize: '0.85rem' }}>
                Selecione uma matéria para ver o desempenho detalhado.
              </div>
            ) : loadingAnalise ? (
              <div className="d-flex justify-content-center py-3"><Spinner animation="border" size="sm" /></div>
            ) : analise ? (
              (() => {
                const evolucaoBase = analiseQtd === 'all'
                  ? (analise.evolucaoSimulados || [])
                  : (analise.evolucaoSimulados || []).slice(-(Number(analiseQtd)));
                const desemp = (analise.desempenhoMaterias || []).find(m => m.materia === materiaSelecionada);
                const evolucao = evolucaoBase.map(sim => {
                  const pMat = sim.porMateria?.[materiaSelecionada];
                  if (!pMat) return { numSim: sim.numSim, pctLiquido: null };
                  const tot = pMat.acertos + pMat.erros + pMat.brancos;
                  return { numSim: sim.numSim, pctLiquido: tot > 0 ? Number(((pMat.acertos - pMat.erros) / tot * 100).toFixed(1)) : null };
                });
                const editalErros = (analise.editalErrosByMateria || {})[materiaSelecionada] || [];
                const motivosErroMat = (analise.motivosErroByMateria || {})[materiaSelecionada] || [];
                const corMat = materiasCoresMap[materiaSelecionada] || '#0d6efd';

                return (
                  <div className="fadein" style={{ animationDuration: '0.3s' }}>
                    {/* Cards de % */}
                    {desemp && (
                      <div className="d-flex gap-2 mb-3 flex-wrap">
                        {[
                          { label: 'Acertos', pct: desemp.pctAcertos, count: desemp.acertos, color: '#34C759', bg: 'rgba(52,199,89,0.1)' },
                          { label: 'Erros', pct: desemp.total > 0 ? Math.round(desemp.erros / desemp.total * 100) : 0, count: desemp.erros, color: '#FF2D55', bg: 'rgba(255,45,85,0.1)' },
                          { label: 'Brancos', pct: desemp.total > 0 ? Math.round(desemp.brancos / desemp.total * 100) : 0, count: desemp.brancos, color: '#FF9500', bg: 'rgba(255,149,0,0.1)' },
                          { label: 'Líquido', pct: desemp.pctLiquido, count: desemp.total, color: '#1b59f9', bg: 'rgba(27,89,249,0.1)', suffix: ' totais' },
                        ].map(({ label, pct, count, color, bg, suffix = ' q.' }) => (
                          <div key={label} style={{ flex: '1 1 70px', display: 'flex', alignItems: 'center', gap: 8, background: bg, borderRadius: 8, padding: '6px 10px' }}>
                            <div style={{ fontWeight: 700, color, fontSize: '1.1rem', lineHeight: 1 }}>{pct}%</div>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                              <div style={{ fontSize: '0.65rem', color: 'var(--text-light)', fontWeight: 600 }}>{label}</div>
                              <div style={{ fontSize: '0.65rem', color: 'var(--text-light)' }}>{count}{suffix}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Gráficos */}
                    <div className="d-flex gap-3 flex-wrap align-items-stretch">
                      {/* Evolução % Líquido */}
                      <div className="card-padrao2" style={{ flex: '1 1 0', minWidth: 220, height: 300, padding: '1rem', display: 'flex', flexDirection: 'column' }}>
                        <div className="card-title-padrao">Evolução % Líquido</div>
                        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {evolucao.filter(e => e.pctLiquido !== null).length < 2 ? (
                            <div className="text-secondary small">Dados insuficientes.</div>
                          ) : (
                            <div style={{ width: '100%', height: '100%' }}>
                              <Line data={{ labels: evolucao.map(e => `#${e.numSim}`), datasets: [{ label: '% Líquido', data: evolucao.map(e => e.pctLiquido), borderColor: corMat, backgroundColor: corMat + '22', fill: true, tension: 0.3, pointRadius: 4 }] }}
                                options={{ maintainAspectRatio: false, interaction: { mode: 'index', intersect: false }, plugins: { legend: { display: false }, tooltip: { backgroundColor: 'rgba(30,30,30,0.95)', titleColor: '#fff', bodyColor: '#ccc', borderColor: 'rgba(255,255,255,0.12)', borderWidth: 1, padding: 8 } }, scales: { x: { ticks: { color: '#aaa', font: { size: 10 } }, grid: { color: 'rgba(255,255,255,0.05)' } }, y: { ticks: { color: '#aaa', font: { size: 10 }, callback: v => v + '%' }, grid: { color: 'rgba(255,255,255,0.05)' } } } }} />
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Top Edital Erros */}
                      <div className="card-padrao2" style={{ flex: '1 1 0', minWidth: 220, height: 300, padding: '1rem', display: 'flex', flexDirection: 'column' }}>
                        <div className="card-title-padrao">Top Tópicos com Mais Erros</div>
                        <div style={{ flex: 1, overflowY: 'auto' }}>
                          {editalErros.length === 0 ? <div className="text-secondary small d-flex align-items-center justify-content-center h-100">Sem dados de edital.</div> : (
                            <div style={{ width: '100%', height: Math.max(220, editalErros.length * 28) }}>
                              <Bar data={{ labels: editalErros.map(e => e.item.length > 35 ? e.item.slice(0, 33) + '…' : e.item), datasets: [{ label: 'Erros', data: editalErros.map(e => e.erros), backgroundColor: corMat + '88', borderColor: corMat, borderWidth: 1 }] }}
                                options={{ maintainAspectRatio: false, interaction: { mode: 'index', intersect: false }, indexAxis: 'y', plugins: { legend: { display: false }, tooltip: { backgroundColor: 'rgba(30,30,30,0.95)', titleColor: '#fff', bodyColor: '#ccc', borderColor: 'rgba(255,255,255,0.12)', borderWidth: 1, padding: 8 } }, scales: { x: { ticks: { color: '#aaa', font: { size: 10 } }, grid: { color: 'rgba(255,255,255,0.05)' } }, y: { ticks: { color: '#ccc', font: { size: 10 } }, grid: { display: false } } } }} />
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Motivos de Erro */}
                      <div className="card-padrao2" style={{ flex: '1 1 0', minWidth: 220, height: 300, padding: '1rem', display: 'flex', flexDirection: 'column' }}>
                        <div className="card-title-padrao">Motivos de Erro</div>
                        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                          {motivosErroMat.length === 0 ? <div className="text-secondary small">Sem dados.</div> : (
                            <>
                              <div style={{ width: '110px', height: '110px', flexShrink: 0 }}>
                                <Pie data={{ labels: motivosErroMat.map(m => m.motivo), datasets: [{ data: motivosErroMat.map(m => m.count), backgroundColor: motivosErroMat.map((_, i) => MOTIVO_COLORS[i % MOTIVO_COLORS.length] + 'CC'), borderColor: motivosErroMat.map((_, i) => MOTIVO_COLORS[i % MOTIVO_COLORS.length]), borderWidth: 1 }] }}
                                  options={{ maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { backgroundColor: 'rgba(30,30,30,0.95)', titleColor: '#fff', bodyColor: '#ccc', borderColor: 'rgba(255,255,255,0.12)', borderWidth: 1, padding: 8 } } }} />
                              </div>
                              <div className="d-flex flex-column gap-1 mt-2 w-100">
                                {motivosErroMat.map((m, i) => (
                                  <div key={m.motivo} className="d-flex justify-content-between align-items-center" style={{ fontSize: '0.8em' }}>
                                    <span style={{ color: MOTIVO_COLORS[i % MOTIVO_COLORS.length] }}>●</span>
                                    <span className="flex-grow-1 ms-1" style={{ color: 'var(--text-secondary)' }}>{m.motivo}</span>
                                    <span className="fw-bold" style={{ color: '#ccc' }}>{m.count}</span>
                                  </div>
                                ))}
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()
            ) : null}

          </div>
        </div>

        {/* ─── BLOCO 3: ALERTAS ─── */}
        <div className="m-0 w-100 p-3 fadein position-relative mb-4" style={{ borderRadius: '1em', animationDelay: '0.3s', border: '1px solid var(--border)', overflow: 'visible' }}>
          <div className="card-title-padrao position-absolute px-3" style={{ top: '-12px', left: '20px', zIndex: 1, backgroundColor: 'var(--background)' }}>ALERTAS</div>
          <div style={{ padding: '1rem' }}>
            {loadingAnalise ? (
              <div className="d-flex justify-content-center py-3"><Spinner animation="border" size="sm" /></div>
            ) : analise ? (
              <div className="d-flex gap-3 flex-wrap">
                {/* Chutes acertados */}
                <div style={{ flex: '1 1 300px', minWidth: 260, background: 'var(--background-l-light)', border: '1px solid var(--border)', borderRadius: 14, padding: '1rem 1.2rem' }}>
                  <div style={{ fontSize: '0.72em', textTransform: 'uppercase', color: 'var(--text-light)', fontWeight: 700, marginBottom: 8 }}>Chutes que Acertaram por Matéria</div>
                  {(analise.chuteStats || []).filter(s => s.totalChutes > 0).length === 0 ? (
                    <div className="text-secondary small">Sem dados de chute.</div>
                  ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8em' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid var(--border)' }}>
                          <th style={{ padding: '6px 8px', color: 'var(--text-light)', fontWeight: 600 }}>Matéria</th>
                          <th style={{ padding: '6px 8px', color: 'var(--text-light)', fontWeight: 600, textAlign: 'center' }}>Acertos</th>
                          <th style={{ padding: '6px 8px', color: '#FF9500', fontWeight: 600, textAlign: 'center' }}>Chutes ✓</th>
                          <th style={{ padding: '6px 8px', color: '#FF9500', fontWeight: 600, textAlign: 'center' }}>% Chute</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(analise.chuteStats || []).filter(s => s.totalChutes > 0).slice(0, 10).map(s => (
                          <tr key={s.materia} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                            <td style={{ padding: '6px 8px', color: 'var(--text-secondary)' }}>{s.materia}</td>
                            <td style={{ padding: '6px 8px', textAlign: 'center' }}>{s.totalAcertos}</td>
                            <td style={{ padding: '6px 8px', textAlign: 'center', color: '#FF9500' }}>{s.chutesAcertos}</td>
                            <td style={{ padding: '6px 8px', textAlign: 'center' }}>
                              <span style={{ color: s.pctChute > 50 ? '#FF2D55' : s.pctChute > 25 ? '#FF9500' : '#34C759', fontWeight: 700 }}>{s.pctChute}%</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>

                {/* Retenção da fila */}
                <div style={{ flex: '1 1 300px', minWidth: 260, background: 'var(--background-l-light)', border: '1px solid var(--border)', borderRadius: 14, padding: '1rem 1.2rem' }}>
                  <div style={{ fontSize: '0.72em', textTransform: 'uppercase', color: 'var(--text-light)', fontWeight: 700, marginBottom: 8 }}>Retenção da Fila de Revisão</div>
                  {(analise.retencaoFila || []).length === 0 ? (
                    <div className="text-secondary small">Nenhum item na fila.</div>
                  ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8em' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid var(--border)' }}>
                          <th style={{ padding: '6px 8px', color: 'var(--text-light)', fontWeight: 600 }}>Matéria</th>
                          <th style={{ padding: '6px 8px', color: '#FF2D55', fontWeight: 600, textAlign: 'center' }}>Total Erros</th>
                          <th style={{ padding: '6px 8px', color: 'var(--text-light)', fontWeight: 600, textAlign: 'center' }}>Média/item</th>
                          <th style={{ padding: '6px 8px', color: '#FF9500', fontWeight: 600, textAlign: 'center' }}>Pendentes</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(analise.retencaoFila || []).slice(0, 10).map(r => (
                          <tr key={r.materia} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                            <td style={{ padding: '6px 8px', color: 'var(--text-secondary)' }}>{r.materia}</td>
                            <td style={{ padding: '6px 8px', textAlign: 'center', color: '#FF2D55', fontWeight: 700 }}>{r.totalErros}</td>
                            <td style={{ padding: '6px 8px', textAlign: 'center', color: '#ccc' }}>{r.mediaErros}×</td>
                            <td style={{ padding: '6px 8px', textAlign: 'center' }}>
                              <span style={{ background: 'rgba(255,149,0,0.15)', color: '#FF9500', borderRadius: 6, padding: '2px 8px', fontWeight: 700 }}>{r.pendentes}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            ) : null}
          </div>
        </div>

      </main>
    </div>
  );
}

export default Dashboard;
import React, { useEffect, useRef, useState } from 'react';
import api from '../../services/api';
import { Table } from 'react-bootstrap';
import { Line, Bar, Pie } from 'react-chartjs-2';
import { Chart, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Legend, Tooltip, Title, Filler, ArcElement } from 'chart.js';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faTimes, faCircle, faCalculator, faHeartCrack, faFolderOpen, faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';
import Navbar from '../../components/Navbar';
import { usePageTitle } from '../../components/PageTitleContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

import Spinner from 'react-bootstrap/Spinner';

Chart.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Legend, Tooltip, Title, Filler, ArcElement);


const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const toastShownRef = useRef(false);
  const [simulados, setSimulados] = useState([]);
  const [resumos, setResumos] = useState({});
  const [materiasProjeto, setMateriasProjeto] = useState([]);
  const [expandedSimulado, setExpandedSimulado] = useState(null);
  const [mediaQtd, setMediaQtd] = useState('5'); // string: '1'-'5' or 'all'
  const [materiaQtd, setMateriaQtd] = useState('5'); // string: '1'-'5' or 'all'
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
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
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  // Badge animation: force remount with a toggled key to always restart fadein
  const [badgeKey, setBadgeKey] = useState(0);
  useEffect(() => {
    setBadgeKey(k => k + 1);
  }, [mediaQtd]);

  useEffect(() => {
    // Breadcrumb-style title: Dashboard (ou Dashboard / Matéria)
    const materiaSelecionada = null; // Se quiser, pode buscar do contexto/props
    const breadcrumb = (
      <div className=" d-flex align-items-center gap-3">
        <span>Dashboard</span>
        {/* Se quiser adicionar mais níveis, adicione aqui */}
        <div
          key={badgeKey}
          className="  badge bg-primary-primary text-dark d-flex align-items-center gap-2 px-2 py-1"
          style={{
            fontSize: '0.7rem',
            fontWeight: 'bold',
            animationDelay: '0.12s',
            animationDuration: '0.6s',
            animationFillMode: 'both'
          }}
        >
          <span>ÚLTIMOS</span>
          <select
            id="simQtd"
            className=" form-select text-dark form-select-sm   text-start fw-bold"
            style={{ width: '60px', fontSize: '0.75rem', padding: '1px 2px' }}
            value={mediaQtd}
            onChange={e => { setMediaQtd(e.target.value); setMateriaQtd(e.target.value); }}
          >
            {[1, 2, 3, 4, 5].map(n => <option key={n} value={String(n)}>{n}</option>)}
           
          </select>
          <span>SIMULADOS</span>
        </div>
      </div>
    );
    setTitle(breadcrumb);
    document.title = 'FLUX | Dashboard';
  }, [setTitle, mediaQtd, badgeKey]);

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
  const simuladosParaGrafico = simuladosOrdenados.slice(0, mediaQtd).reverse(); // Inverte para ordem cronológica
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
        borderColor: '#71dd8c',
        backgroundColor: '#71dd8c22',
        fill: false,
        tension: 0.2,
      },
      {
        label: 'Erros',
        data: errosData,
        borderColor: '#83313e',
        backgroundColor: '#83313e22',
        fill: false,
        tension: 0.2,
      },
      {
        label: 'Brancos',
        data: brancosData,
        borderColor: '#fff',
        backgroundColor: '#fff',
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
    // Interpolação entre #83313e (vermelho) e #71dd8c (verde)
    const r = Math.round(131 + (113 - 131) * percentNorm);
    const g = Math.round(49 + (221 - 49) * percentNorm);
    const b = Math.round(62 + (140 - 62) * percentNorm);
    return `rgb(${r},${g},${b})`;
  });
  const materiasChartData = {
    labels: materiasPorcentagem.map(m => m.nome),
    datasets: [
      {
        label: '% Líquido (soma dos últimos N simulados)',
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
    return (
      <div style={{ width: '400px', height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: ' auto' }}>
        <Spinner animation="border" role="status" />
      </div>
    );
  }
  if (!projetoSelecionado) {
    return (
      <div className="app-container d-flex flex-column justify-content-center align-items-center" style={{ minHeight: '80vh' }}>
        <div className="text-center">
          <FontAwesomeIcon icon={faFolderOpen} size="4x" className="mb-3 text-secondary" />
          <h4 className="mb-3 text-center fs-6">Nenhum projeto selecionado.<br />Selecione ou crie um projeto para acessar o dashboard.</h4>
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
        <div className="text-center">
          <FontAwesomeIcon icon={faHeartCrack} size="4x" className="mb-3 text-secondary" />
          <h4 className="mb-3 text-center fs-6">Não há nenhum simulado cadastrado.</h4>
          <button className="btn btn-primary-primary px-4 py-2" onClick={() => navigate('/simulados')}>
            Ir para Simulados
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container ">
      <main className="container-fluid gap-4 pt-3 fadein" style={{ animationDelay: '0.05s' }}>
        {/* Removido título duplicado */}




        <div className='bloco-meio fadein d-flex w-100 align-items-stretch' style={{ animationDelay: '0.15s' }}>
          <div className='card-padrao2 parte-meio w-50 fadein me-4' style={{ animationDelay: '0.25s', padding: '1rem', position: 'relative' }}>
            <div className="card-title-padrao">RESUMO DOS SIMULADOS APRESENTADOS</div>
            <div className="card-content">
              <div className=' ' style={{ overflowX: 'auto' }}>
                <table className='text-center justify-content-center ' style={{ borderCollapse: 'collapse', width: '100%' }}>
                  <thead>
                    <tr>
                      <th style={{ verticalAlign: 'middle' }}>Simulado</th>
                      <th style={{ verticalAlign: 'middle' }}>Data</th>
                      <th style={{ verticalAlign: 'middle' }}><FontAwesomeIcon icon={faCheck} title='Acertos' /></th>
                      <th style={{ verticalAlign: 'middle' }}><FontAwesomeIcon icon={faTimes} title='Erros' /></th>
                      <th style={{ verticalAlign: 'middle' }}><FontAwesomeIcon icon={faCircle} title='Brancos' /></th>
                      <th style={{ verticalAlign: 'middle' }}><FontAwesomeIcon icon={faCalculator} title='Líquido' /></th>
                    </tr>
                  </thead>
                  <tbody>
                    {simuladosRecentes.map(sim => {
                      const resumo = resumos[sim.id] || {};
                      const data = formatarDataSegura(sim.dataSim);
                      const acertos = resumo.acertos ?? 0;
                      const erros = resumo.erros ?? 0;
                      const brancos = resumo.brancos ?? 0;
                      const liquido = acertos - erros;
                      return (
                        <tr key={sim.id}>
                          <td style={{ verticalAlign: 'middle' }}>{sim.numSim}</td>
                          <td style={{ verticalAlign: 'middle' }}>{data}</td>
                          <td style={{ verticalAlign: 'middle' }}>{acertos}</td>
                          <td style={{ verticalAlign: 'middle' }}>{erros}</td>
                          <td style={{ verticalAlign: 'middle' }}>{brancos}</td>
                          <td style={{ verticalAlign: 'middle' }}>{liquido}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="card-padrao2 parte-esquerda w-25 fadein me-4" style={{ animationDelay: '0.2s', padding: '1rem', position: 'relative' }}>
            <div className="card-title-padrao">EVOLUÇÃO DA PONTUAÇÃO</div>
            <div className="card-content">
              {simulados.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#888', padding: '2em' }}>
                  Nenhum simulado cadastrado ainda.
                </div>
              ) : (
                <>
                  <Line
                    data={chartData}
                    options={{
                      scales: {
                        x: {
                          grid: { color: '#bbb' },
                          ticks: { color: '#bbb' }
                        },
                        y: {
                          grid: { display: false },
                          ticks: { color: '#bbb' }
                        }
                      },
                      plugins: {
                        legend: { display: false }
                      }
                    }}
                    plugins={[{
                      beforeDatasetsDraw: (chart) => {
                        const ctx = chart.ctx;
                        const chartArea = chart.chartArea;
                        if (!chartArea) return;
                        const datasetIndex = chart.data.datasets.findIndex(ds => ds.label === 'Líquido');
                        if (datasetIndex === -1) return;
                        const meta = chart.getDatasetMeta(datasetIndex);
                        ctx.save();
                        const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
                        gradient.addColorStop(0, '#1b59f9');
                        gradient.addColorStop(1, 'rgba(65,134,235,0.05)');
                        ctx.globalAlpha = 0.5;
                        ctx.fillStyle = gradient;
                        ctx.beginPath();
                        meta.data.forEach((point, i) => {
                          if (i === 0) ctx.moveTo(point.x, chartArea.bottom);
                          ctx.lineTo(point.x, point.y);
                        });
                        meta.data.slice().reverse().forEach((point, i) => {
                          ctx.lineTo(point.x, chartArea.bottom);
                        });
                        ctx.closePath();
                        ctx.fill();
                        ctx.restore();
                      }
                    }]}
                  />
                </>
              )}
            </div>
          </div>





          <div className='card-padrao2 parte-direita w-25 fadein' style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: '220px', animationDelay: '0.3s', padding: '1rem', position: 'relative' }}>
            <div className="card-title-padrao">MÉDIA DOS SIMULADOS</div>
            <div className="card-content" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '1em', height: '100%' }}>
              <div className='badges d-flex justify-content-center gap-2'>
                <span title='Acertos' className='badge bg-primary-primary text-dark' >{mediaAcertos}</span>
                <span title='Erros' className='badge' style={{ backgroundColor: '#83313e' }} >{mediaErros}</span>
                <span title='Brancos' className='badge bg-white text-bg-warning ' >{mediaBrancos}</span>
                <span title='Líquido' className='badge bg-primary-primary3 text-dark' >{mediaLiquido}</span>
              </div>

              <div className='pizza' style={{ width: '100%', margin: '0 auto' }}>

                <div style={{ width: '100%', maxWidth: '100px', margin: '0 auto' }}>
                  <Pie
                    data={{
                      labels: ['Acertos', 'Erros', 'Brancos'],
                      datasets: [
                        {
                          data: [parseFloat(mediaAcertos), parseFloat(mediaErros), parseFloat(mediaBrancos)],
                          backgroundColor: [
                            '#71dd8c', // verde acertos
                            '#83313e', // vermelho erros
                            '#fff'  // amarelo brancos
                          ],
                          borderColor: '#fff',
                          borderWidth: 2,
                        }
                      ]
                    }}
                    options={{
                      plugins: {
                        legend: {
                          display: false
                        }
                      }
                    }}
                    width={100}
                    height={100}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>




  <div className="card-padrao2 fadein" style={{ animationDelay: '0.35s', padding: '1rem', position: 'relative' }}>
          <div className="card-title-padrao">COMPARAÇÃO DAS NOTAS LÍQUIDAS POR MATÉRIA</div>
          <div className="card-content">
            <div className="p-3" style={{ display: 'flex', gap: '2em', alignItems: 'flex-start' }}>
              <div className='p-3  m-auto'>
                {/* NOVO GRÁFICO DE PORCENTAGEM LÍQUIDA POR MATÉRIA */}
                <div style={{ marginBottom: '1em', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5em' }}>

                  </div>

                </div>
                {materiasPorcentagem.length === 0 ? (
                  <div style={{ textAlign: 'center', color: '#888', padding: '2em' }}>
                    Nenhum dado para exibir.
                  </div>
                ) : (
                  <Bar
                    data={materiasChartData}
                    options={{
                      indexAxis: 'y',
                      plugins: {
                        legend: { display: false },
                        title: {
                          display: true,
                          text: 'Pontuação Acumulada',
                          font: { size: 18 },
                          color: '#fff',
                          padding: { top: 10, bottom: 20 }
                        }
                      },
                      scales: {
                        x: {
                          beginAtZero: true,
                          max: 100,
                          title: { display: true, text: '% Líquido' },
                          grid: { color: '#bbb' },
                          ticks: { color: '#bbb' }
                        },
                        y: {
                          grid: { display: false },
                          ticks: { color: '#bbb' }
                        }
                      }
                    }}
                    height={320}
                  />
                )}
              </div>
              <div style={{ flex: 1, minWidth: 220 }}>
                {simuladosRecentes.length === 0 || todasMaterias.length === 0 ? (
                  <div style={{ textAlign: 'center', color: '#888', padding: '2em' }}>
                    Nenhum dado para exibir.
                  </div>
                ) : (
                  <table className="tabela-simulado" style={{ borderCollapse: 'collapse', width: '100%' }}>
                    <thead>
                      <tr>
                        <th className="text-center" style={{ borderTop: 'none', borderLeft: 'none', borderRight: 'none', borderBottom: '1px solid var(--text-light-light)' }}>Matéria</th>
                        {simuladosRecentes.map(sim => (
                          <th key={sim.id} className="text-center" style={{ borderTop: 'none', borderLeft: 'none', borderRight: 'none', borderBottom: '1px solid var(--text-light-light)' }}>
                            Simulado {sim.numSim}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {(() => {
                        // Para cada coluna (simulado), calcule min/max da porcentagem
                        const colPorcentagens = simuladosRecentes.map(sim =>
                          todasMaterias.map(materiaNome => {
                            const mat = (resumos[sim.id]?.materias ?? []).find(m => m.nome === materiaNome);
                            const totalMat = mat ? (mat.acertos + mat.erros + mat.brancos) : 0;
                            return totalMat > 0 ? (mat.acertos - mat.erros) / totalMat * 100 : null;
                          })
                        );
                        // Transpor para acessar por coluna
                        const colMinMax = colPorcentagens.map(col => {
                          const vals = col.filter(v => v !== null);
                          return {
                            min: Math.min(...vals),
                            max: Math.max(...vals)
                          };
                        });
                        return todasMaterias.map((materiaNome, rowIdx) => (
                          <tr key={materiaNome}>
                            <td style={{ border: 'none', borderBottom: '1px solid var(--text-light-light)' }}>{materiaNome}</td>
                            {simuladosRecentes.map((sim, colIdx) => {
                              const mat = (resumos[sim.id]?.materias ?? []).find(m => m.nome === materiaNome);
                              const totalMat = mat ? (mat.acertos + mat.erros + mat.brancos) : 0;
                              const porcentagem = totalMat > 0 ? (mat.acertos - mat.erros) / totalMat * 100 : null;
                              let bgColor = '';
                              if (porcentagem !== null) {
                                const { min, max } = colMinMax[colIdx];
                                // Interpolação entre #83313e (vermelho) e #71dd8c (verde)
                                const percentNorm = min === max ? 0.5 : (porcentagem - min) / (max - min);
                                // Interpolação RGB
                                const r = Math.round(131 + (113 - 131) * percentNorm);
                                const g = Math.round(49 + (221 - 49) * percentNorm);
                                const b = Math.round(62 + (140 - 62) * percentNorm);
                                bgColor = `rgb(${r},${g},${b})`;
                              }
                              // Verifica se é o menor valor da coluna
                              const isMin = porcentagem !== null && porcentagem === colMinMax[colIdx].min;
                              return (
                                <td className='p-2'
                                  key={sim.id}
                                  style={{
                                    fontWeight: 'bold',
                                    color: isMin ? '#fff' : '#fff',
                                    textAlign: 'center',
                                    border: 'none',
                                    borderBottom: '1px solid var(--text-light-light)',
                                    background: bgColor,
                                    position: 'relative',
                                  }}
                                >
                                  {totalMat > 0 ? porcentagem.toFixed(1) + '%' : '-'}
                                  {isMin && totalMat > 0 ? (
                                    <FontAwesomeIcon
                                      icon={faExclamationTriangle}
                                      style={{
                                        position: 'absolute',
                                        top: '4px',
                                        right: '4px',
                                        color: '#ffc107',
                                        fontSize: '0.7em',
                                        filter: 'drop-shadow(0 0 2px rgba(0,0,0,0.5))'
                                      }}
                                      title="Dar atenção"
                                    />
                                  ) : null}
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
        </div>


















        {/* Gráfico de desempenho por matéria agora está dentro de cada card em OVERVIEW DAS MATÉRIAS */}
  <div className='border rounded-4 pt-3 mb-5 fadein position-relative' style={{ paddingTop: '2rem', animationDelay: '0.45s' }}>
          <div className="card-title-padrao position-absolute  px-3" style={{ top: '-12px', left: '20px', zIndex: 1, backgroundColor: 'var(--background)' }}>OVERVIEW DAS MATÉRIAS</div>
          {/* Cards das matérias */}

          <div style={{ padding: '1rem' }}>
          <div className="card-content p-0">
            <div className="row g-3">
              {materiasProjeto.length > 0 ? (
                materiasProjeto.map((materia, idx) => {
                  // Calcula estatísticas da matéria através dos simulados
                  // Calcular estatísticas apenas dos simulados filtrados pelo select (mediaQtd)
                  const simuladosParaBadges = simuladosOrdenados.slice(0, Number(mediaQtd)).reverse();
                  let stats = { acertos: 0, erros: 0, brancos: 0 };
                  simuladosParaBadges.forEach(sim => {
                    const resumo = resumos[sim.id];
                    if (resumo && resumo.materias) {
                      const materiaStats = resumo.materias.find(m => m.nome === materia.nome);
                      if (materiaStats) {
                        stats.acertos += materiaStats.acertos || 0;
                        stats.erros += materiaStats.erros || 0;
                        stats.brancos += materiaStats.brancos || 0;
                      }
                    }
                  });

                  const totalQuestoes = stats.acertos + stats.erros + stats.brancos;
                  const pctAcertos = totalQuestoes > 0 ? Math.round((stats.acertos / totalQuestoes) * 100) : 0;
                  const pctErros = totalQuestoes > 0 ? Math.round((stats.erros / totalQuestoes) * 100) : 0;
                  const pctBrancos = totalQuestoes > 0 ? Math.round((stats.brancos / totalQuestoes) * 100) : 0;

                  // Gráfico de desempenho por matéria (mini Line)
                  const simuladosParaMateriaGrafico = simuladosOrdenados.slice(0, mediaQtd).reverse();
                  const materiaPorcentagens = simuladosParaMateriaGrafico.map(sim => {
                    const mat = (resumos[sim.id]?.materias ?? []).find(m => m.nome === materia.nome);
                    const totalMat = mat ? (mat.acertos + mat.erros + mat.brancos) : 0;
                    const liquido = mat ? (mat.acertos - mat.erros) : 0;
                    return totalMat > 0 ? ((liquido / totalMat) * 100) : null;
                  });
                  const tendenciaMateria = calcularLinhaTendencia(materiaPorcentagens.map(v => v === null ? 0 : Number(v)));
                  const simLabels = simuladosParaMateriaGrafico.map(sim => `Simulado #${sim.numSim}`);
                  const corMateria = materia.cor || '#0d6efd';

                  return (
                    <div className="col-12 col-sm-6 col-md-4 col-lg-3 d-flex" key={materia.id}>
                      <div
                        className="pointer card-padrao fadein card-padrao-hover w-100 d-flex flex-column position-relative"
                        style={{
                          height: 240,
                          borderLeft: materia.cor ? `4px solid ${materia.cor}` : '4px solid #0d6efd',
                          animationDelay: `${idx * 0.1}s`,
                          padding: 0,
                          overflow: 'hidden',
                          transition: 'border-left-color 0.3s ease'
                        }}
                        onClick={() => navigate(`/dashboard/materia/${materia.id}/overview`)}
                        onMouseEnter={e => {
                          e.currentTarget.style.borderLeftColor = '#71dd8c';
                          const rightIndicator = e.currentTarget.querySelector('.right-indicator');
                          if (rightIndicator) {
                            rightIndicator.style.backgroundColor = '#71dd8c';
                          }
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.borderLeftColor = materia.cor || '#0d6efd';
                          const rightIndicator = e.currentTarget.querySelector('.right-indicator');
                          if (rightIndicator) {
                            rightIndicator.style.backgroundColor = materia.cor || '#0d6efd';
                          }
                        }}
                      >
                        {/* Header do card */}
                        <div className="p-3 pb-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                          <div className="d-flex justify-content-between align-items-start gap-2">
                            <h6 className="m-0 fw-bold flex-grow-1" style={{ 
                              fontSize: '0.9rem', 
                              lineHeight: '1.3',
                              color: '#fff'
                            }}>
                              {materia.nome}
                            </h6>
                            <div className="d-flex flex-column align-items-end">
                              <span 
                                className="badge text-muted fw-bold mb-1 custom-tooltip"
                                style={{ 
                                  backgroundColor: materia.cor || '#0d6efd',
                                  fontSize: '0.7rem',
                                  cursor: 'help'
                                }}
                                data-tooltip="Total de questões resolvidas"
                              >
                                {totalQuestoes}
                              </span>
                              <span className="text-muted" style={{ fontSize: '0.6rem', whiteSpace: 'nowrap' }}>
                                questões resolvidas
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Conteúdo principal */}
                        <div className="flex-grow-1 p-3 pt-2 d-flex flex-column justify-content-center">
                          {/* Estatísticas principais */}
                          <div className="mb-2">
                            {/* Container centralizado para legendas e barra */}
                            <div className="d-flex flex-column align-items-center justify-content-center h-100">
                              {/* Legenda dos badges */}
                              <div className="d-flex justify-content-center gap-2 mb-2">
                                <span 
                                  className="badge text-muted fw-bold custom-tooltip" 
                                  style={{ 
                                    fontSize: '0.6rem', 
                                    backgroundColor: '#71dd8c',
                                    minWidth: '30px',
                                    cursor: 'help'
                                  }}
                                  data-tooltip="Porcentagem de acertos"
                                >
                                  {pctAcertos}%
                                </span>
                                <span 
                                  className="badge text-white fw-bold custom-tooltip" 
                                  style={{ 
                                    fontSize: '0.6rem', 
                                    backgroundColor: '#dc3545',
                                    minWidth: '30px',
                                    cursor: 'help'
                                  }}
                                  data-tooltip="Porcentagem de erros"
                                >
                                  {pctErros}%
                                </span>
                                <span 
                                  className="badge text-muted fw-bold custom-tooltip" 
                                  style={{ 
                                    fontSize: '0.6rem', 
                                    backgroundColor: '#ffc107',
                                    minWidth: '30px',
                                    cursor: 'help'
                                  }}
                                  data-tooltip="Porcentagem de questões em branco"
                                >
                                  {pctBrancos}%
                                </span>
                              </div>

                              {/* Barra de progresso visual */}
                              <div className="progress mb-2" style={{ height: '8px', backgroundColor: 'rgba(255,255,255,0.1)', width: '80%' }}>
                                <div 
                                  className="progress-bar" 
                                  style={{ 
                                    width: `${pctAcertos}%`, 
                                    backgroundColor: '#71dd8c',
                                    transition: 'width 0.5s ease'
                                  }}
                                ></div>
                                <div 
                                  className="progress-bar" 
                                  style={{ 
                                    width: `${pctErros}%`, 
                                    backgroundColor: '#dc3545',
                                    transition: 'width 0.5s ease'
                                  }}
                                ></div>
                                <div 
                                  className="progress-bar" 
                                  style={{ 
                                    width: `${pctBrancos}%`, 
                                    backgroundColor: '#ffc107',
                                    transition: 'width 0.5s ease'
                                  }}
                                ></div>
                              </div>
                            </div>
                          </div>
                          {/* Mini gráfico de desempenho por matéria */}
                          <div style={{ width: '100%', minHeight: 40, paddingBottom: 12 }}>
                              {/* Mini gráfico de desempenho por matéria */}
                              {(() => {
                                // Calcular min/max ignorando nulls
                                const yVals = materiaPorcentagens.filter(v => v !== null && !isNaN(v));
                                let minY = Math.min(...yVals);
                                let maxY = Math.max(...yVals);
                                if (minY === maxY) {
                                  // Se todos os valores são iguais, expanda um pouco para visualização
                                  minY = minY - 5;
                                  maxY = maxY + 5;
                                }
                                return (
                                  <Line
                                    data={{
                                      labels: simLabels,
                                      datasets: [
                                        {
                                          label: '% Líquido',
                                          data: materiaPorcentagens,
                                          borderColor: corMateria,
                                          backgroundColor: (context) => {
                                            const chart = context.chart;
                                            const { ctx, chartArea } = chart;
                                            if (!chartArea) return corMateria + '22';
                                            const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
                                            gradient.addColorStop(0, corMateria + '44');
                                            gradient.addColorStop(1, 'rgba(0,0,0,0)');
                                            return gradient;
                                          },
                                          fill: true,
                                          tension: 0.2,
                                          pointRadius: 4,
                                          pointHoverRadius: 7,
                                          borderWidth: 2,
                                        },
                                        {
                                          label: 'Tendência',
                                          data: tendenciaMateria,
                                          borderColor: '#ff9800',
                                          backgroundColor: 'rgba(255,152,0,0.1)',
                                          borderDash: [6, 6],
                                          pointRadius: 0,
                                          fill: false,
                                          tension: 0,
                                          order: 10
                                        }
                                      ]
                                    }}
                                    plugins={[{
                                      beforeDatasetsDraw: (chart) => {
                                        const ctx = chart.ctx;
                                        const chartArea = chart.chartArea;
                                        if (!chartArea) return;
                                        const datasetIndex = chart.data.datasets.findIndex(ds => ds.label === '% Líquido');
                                        if (datasetIndex === -1) return;
                                        const meta = chart.getDatasetMeta(datasetIndex);
                                        ctx.save();
                                        const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
                                        gradient.addColorStop(0, corMateria);
                                        gradient.addColorStop(1, corMateria + '05');
                                        ctx.globalAlpha = 0.5;
                                        ctx.fillStyle = gradient;
                                        ctx.beginPath();
                                        meta.data.forEach((point, i) => {
                                          if (i === 0) ctx.moveTo(point.x, chartArea.bottom);
                                          ctx.lineTo(point.x, point.y);
                                        });
                                        meta.data.slice().reverse().forEach((point, i) => {
                                          ctx.lineTo(point.x, chartArea.bottom);
                                        });
                                        ctx.closePath();
                                        ctx.fill();
                                        ctx.restore();
                                      }
                                    }]}
                                    options={{
                                      scales: {
                                        x: {
                                          grid: { display: false, drawBorder: false },
                                          ticks: { color: '#bbb', display: false }
                                        },
                                        y: {
                                          min: minY,
                                          max: maxY,
                                          title: { display: false },
                                          grid: {
                                            display: true,
                                            drawBorder: false,
                                            color: (context) => {
                                              if (context.tick.value === 0) {
                                                return '#dc3545'; // Vermelho para a linha do 0
                                              }
                                              return 'rgba(187, 187, 187, 0.1)'; // Cinza claro para outras linhas
                                            },
                                            lineWidth: (context) => {
                                              if (context.tick.value === 0) {
                                                return 2; // Linha mais grossa para o 0
                                              }
                                              return 1;
                                            }
                                          },
                                          ticks: { color: '#bbb', display: false }
                                        }
                                      },
                                      plugins: {
                                        legend: { display: false },
                                        tooltip: {
                                          callbacks: {
                                            title: (tooltipItems) => {
                                              return simLabels[tooltipItems[0].dataIndex];
                                            },
                                            label: (tooltipItem) => {
                                              // Mostra o valor exato do % Líquido
                                              const value = tooltipItem.parsed.y;
                                              return `% Líquido: ${value !== null && value !== undefined ? value.toFixed(1) + '%' : '-'}`;
                                            }
                                          }
                                        }
                                      }
                                    }}
                                    height={38}
                                    width={120}
                                  />
                                );
                              })()}
                          </div>
                        </div>

                        {/* Indicador de cor da matéria */}
                        <div 
                          className="position-absolute right-indicator"
                          style={{
                            top: 0,
                            right: 0,
                            width: '4px',
                            height: '100%',
                            backgroundColor: materia.cor || '#0d6efd',
                            opacity: 0.3,
                            transition: 'background-color 0.3s ease'
                          }}
                        ></div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="col-12 text-center text-secondary">
                  <FontAwesomeIcon icon={faFolderOpen} size="3x" className="mb-3" />
                  <p>Nenhuma matéria cadastrada ainda.<br />Vá para o Edital para adicionar matérias.</p>
                </div>
              )}
            </div>
            </div>
          </div>

        </div>










      </main>
    </div>
  );
}

export default Dashboard;
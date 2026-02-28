import React, { useState, useEffect, useRef } from 'react';
import api from '../../services/api';
import { usePageTitle } from '../../components/PageTitleContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useParams, useNavigate, Link } from 'react-router-dom';
import ErrosBarChart from './components/graficos/ErrosBarChart';
import MotivoErroBarChart from './components/graficos/MotivoErroBarChart';
import BrancosBarChart from './components/graficos/BrancosBarChart';
import MotivoBrancoBarChart from './components/graficos/MotivoBrancoBarChart';

// Simple Bootstrap spinner component
function LoadingSpinner() {
  return (
    <div className="d-flex justify-content-center align-items-center" style={{ minHeight: 200 }}>
      <div className="spinner-border text-secondary" role="status">
        <span className="visually-hidden">Carregando...</span>
      </div>
    </div>
  );
}




function MateriaOverview() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { setTitle } = usePageTitle();
  const [materia, setMateria] = useState(null);
  const [loading, setLoading] = useState(true);
  const [brancosMateria, setBrancosMateria] = useState([]);
  const [errosMateria, setErrosMateria] = useState([]);
  const [loadingBrancos, setLoadingBrancos] = useState(true);
  const [loadingErros, setLoadingErros] = useState(true);
  // Ordenação igual MateriaDetalhe
  const [brancoSortCol, setBrancoSortCol] = useState(null);
  const [brancoSortAsc, setBrancoSortAsc] = useState(true);
  const [erroSortCol, setErroSortCol] = useState(null);
  const [erroSortAsc, setErroSortAsc] = useState(true);
  // Quantidade de simulados a exibir nos dados
  const [simQtd, setSimQtd] = useState(5);
  // Paginação dos itens do edital com erro
  const [erroPage, setErroPage] = useState(0);
  // Paginação dos itens do edital com branco
  const [brancoPage, setBrancoPage] = useState(0);

  useEffect(() => {
    async function fetchMateria() {
      setLoading(true);
      try {
        const res = await api.get(`/materias/${id}`);
        setMateria(res.data);
        if (res.data?.nome) setTitle(
          <span className="d-flex align-items-center gap-2">
            <span className='' style={{ color: 'var(--text-light)' }}><Link to="/dashboard" className="">Dashboard</Link>{' / '}</span>
            <span className="fw-bold">{res.data.nome}</span>
            <div
              className=" badge bg-primary-primary text-dark d-flex align-items-center gap-2 px-2 py-1"
              style={{ fontSize: '0.7rem', fontWeight: 'bold', animationDelay: '0.12s', animationDuration: '0.6s', animationFillMode: 'both' }}
            >
              <span>ÚLTIMOS</span>
              <select
                id="simQtd"
                className="form-select text-dark form-select-sm text-start fw-bold"
                style={{ width: '60px', fontSize: '0.75rem', padding: '1px 2px' }}
                value={simQtd}
                onChange={e => setSimQtd(Number(e.target.value))}
              >
                {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n}</option>)}
              </select>
              <span>SIMULADOS</span>
            </div>
          </span>
        );
      } catch (e) {
        setMateria(null);
      }
      setLoading(false);
    }
    fetchMateria();
    // Remove qualquer estilo global de breadcrumb
    const prev = document.querySelector('style[data-breadcrumb]');
    if (prev) prev.remove();
  }, [id, setTitle, simQtd]);

  useEffect(() => {
    if (!materia?.nome) return;
    const fetchBrancosMateria = async () => {
      setLoadingBrancos(true);
      const projetoSelecionado = localStorage.getItem('projetoSelecionado') || '';
      const user = JSON.parse(localStorage.getItem('user'));
      const userId = user?.id || '';
      if (!userId || !projetoSelecionado || !id) {
        setBrancosMateria([]);
        setLoadingBrancos(false);
        return;
      }
      try {
        const res = await api.get('/dashboard/brancos-detalhados', { params: { userId, projetoId: projetoSelecionado } });
        const brancos = res.data[materia.nome] || [];
        setBrancosMateria(brancos);
      } catch (error) {
        setBrancosMateria([]);
      }
      setLoadingBrancos(false);
    };
    const fetchErrosMateria = async () => {
      setLoadingErros(true);
      const projetoSelecionado = localStorage.getItem('projetoSelecionado') || '';
      const user = JSON.parse(localStorage.getItem('user'));
      const userId = user?.id || '';
      if (!userId || !projetoSelecionado || !id) {
        setErrosMateria([]);
        setLoadingErros(false);
        return;
      }
      try {
        const res = await api.get('/dashboard/erros-detalhados', { params: { userId, projetoId: projetoSelecionado } });
        const erros = res.data[materia.nome] || [];
        setErrosMateria(erros);
      } catch (error) {
        setErrosMateria([]);
      }
      setLoadingErros(false);
    };
    fetchBrancosMateria();
    fetchErrosMateria();
  }, [materia?.nome, id]);

  // Ordenação igual MateriaDetalhe
  function getSortedBrancos(brancos) {
    if (!brancoSortCol) return brancos;
    const sorted = [...brancos].sort((a, b) => {
      let va = a[brancoSortCol], vb = b[brancoSortCol];
      if (brancoSortCol === 'dataSim') {
        va = va ? new Date(va).getTime() : 0;
        vb = vb ? new Date(vb).getTime() : 0;
      }
      if (va === undefined || va === null) va = '';
      if (vb === undefined || vb === null) vb = '';
      if (typeof va === 'string' && typeof vb === 'string') {
        return brancoSortAsc ? va.localeCompare(vb) : vb.localeCompare(va);
      }
      return brancoSortAsc ? va - vb : vb - va;
    });
    return sorted;
  }
  function getSortedErros(erros) {
    if (!erroSortCol) return erros;
    const sorted = [...erros].sort((a, b) => {
      let va = a[erroSortCol], vb = b[erroSortCol];
      if (erroSortCol === 'dataSim') {
        va = va ? new Date(va).getTime() : 0;
        vb = vb ? new Date(vb).getTime() : 0;
      }
      if (va === undefined || va === null) va = '';
      if (vb === undefined || vb === null) vb = '';
      if (typeof va === 'string' && typeof vb === 'string') {
        return erroSortAsc ? va.localeCompare(vb) : vb.localeCompare(va);
      }
      return erroSortAsc ? va - vb : vb - va;
    });
    return sorted;
  }

  if (loading) return <LoadingSpinner />;
  if (!materia) return <div>Matéria não encontrada.</div>;

  // Filtra para mostrar todos os erros/brancos dos últimos N simulados
  function getUltimosSimulados(arr, n) {
    // Ordena por dataSim (mais recente por último)
    const arrOrdenado = [...arr].sort((a, b) => {
      const da = a.dataSim ? new Date(a.dataSim).getTime() : 0;
      const db = b.dataSim ? new Date(b.dataSim).getTime() : 0;
      return da - db;
    });
    // Pega os N simulados mais recentes
    const simuladosUnicos = Array.from(new Set(arrOrdenado.map(e => e.simulado).filter(Boolean)));
    const ultimosSimulados = simuladosUnicos.slice(-n);
    // Filtra todos os itens que pertencem a esses simulados
    return arr.filter(e => ultimosSimulados.includes(e.simulado));
  }
  const errosFiltrados = getUltimosSimulados(errosMateria, simQtd);
  const brancosFiltrados = getUltimosSimulados(brancosMateria, simQtd);
  // Itens do edital que têm erro/branco cadastrado
  const pageSize = 5;
  const erroCountPorItem = {};
  errosFiltrados.forEach(e => {
    if (!e.editalItem) return;
    erroCountPorItem[e.editalItem] = (erroCountPorItem[e.editalItem] || 0) + 1;
  });
  const itensEditalOrdenados = Object.entries(erroCountPorItem)
    .sort((a, b) => b[1] - a[1])
    .map(([item]) => item);
  const totalErroPages = Math.ceil(itensEditalOrdenados.length / pageSize);
  const itensEditalComErro = itensEditalOrdenados.slice(erroPage * pageSize, (erroPage + 1) * pageSize);
  // Paginação para brancos por item do edital
  const brancoPageSize = 5;
  const brancoCountPorItem = {};
  brancosFiltrados.forEach(b => {
    if (!b.editalItem) return;
    brancoCountPorItem[b.editalItem] = (brancoCountPorItem[b.editalItem] || 0) + 1;
  });
  const itensEditalBrancoOrdenados = Object.entries(brancoCountPorItem)
    .sort((a, b) => b[1] - a[1])
    .map(([item]) => item);
  const totalBrancoPages = Math.ceil(itensEditalBrancoOrdenados.length / brancoPageSize);
  const itensEditalComBranco = itensEditalBrancoOrdenados.slice(brancoPage * brancoPageSize, (brancoPage + 1) * brancoPageSize);

  return (
    <div className="container-fluid app-container py-4">
      {/* Breadcrumb funcional está no título da página */}
      <main className="d-flex flex-wrap gap-4">
        <div className='card-padrao mapa-erros w-50 flex-grow-1 mb-4 d-flex flex-column'>
          <strong className="mb-3 text-center">MAPA DE ERROS</strong>
          {loadingErros ? (
            <div className="text-center text-secondary py-5">Carregando...</div>
          ) : (
            <>
              <div className="d-flex flex-row gap-3 w-50 mb-2 ">
                <div className="flex-fill">
                  <div className="fw-bold text-center mb-2" style={{fontSize: '1rem'}}>Erros por Item do Edital</div>
                  <ErrosBarChart erros={errosFiltrados} materia={materia} editalItens={itensEditalComErro} page={erroPage} totalPages={totalErroPages} />
                  <div className="d-flex justify-content-center align-items-center gap-2 mt-2">
                    <button className="btn btn-sm btn-outline-secondary" onClick={() => setErroPage(p => Math.max(0, p - 1))} disabled={erroPage === 0}>
                      &#8592; Anterior
                    </button>
                    <span style={{fontSize: '0.9rem'}}>Página {erroPage + 1} de {totalErroPages || 1}</span>
                    <button className="btn btn-sm btn-outline-secondary" onClick={() => setErroPage(p => Math.min(totalErroPages - 1, p + 1))} disabled={erroPage >= totalErroPages - 1}>
                      Próximo &#8594;
                    </button>
                  </div>
                </div>
                <div className="flex-fill">
                  <div className="fw-bold text-center mb-2" style={{fontSize: '1rem'}}>Motivo dos Erros</div>
                  <MotivoErroBarChart erros={errosFiltrados} materia={materia} />
                </div>
              </div>
              {errosFiltrados.length === 0 ? (
                <div className="text-secondary">Nenhum erro nesta matéria.</div>
              ) : <div className="overflow-auto mt-3 rounded-3">
                  <table className="w-100 border-0 rounded-3  ">
                    <thead>
                      <tr>
                        <th className="text-center p-1 pointer"
                          title="Clique para ordenar por Simulado"
                          onClick={() => {
                            setErroSortCol('simulado');
                            setErroSortAsc(erroSortCol === 'simulado' ? !erroSortAsc : true);
                          }}>Simulado {erroSortCol === 'simulado' ? (erroSortAsc ? '▲' : '▼') : ''}</th>
                        <th className="text-center p-1 pointer"
                          title="Clique para ordenar por Data"
                          onClick={() => {
                            setErroSortCol('dataSim');
                            setErroSortAsc(erroSortCol === 'dataSim' ? !erroSortAsc : true);
                          }}>Data {erroSortCol === 'dataSim' ? (erroSortAsc ? '▲' : '▼') : ''}</th>
                        <th className="text-center p-1 pointer"
                          title="Clique para ordenar por Nº Questão"
                          onClick={() => {
                            setErroSortCol('numeroQuestao');
                            setErroSortAsc(erroSortCol === 'numeroQuestao' ? !erroSortAsc : true);
                          }}>Nº Questão {erroSortCol === 'numeroQuestao' ? (erroSortAsc ? '▲' : '▼') : ''}</th>
                        <th className="text-center p-1 pointer"
                          title="Clique para ordenar por Motivo do Erro"
                          onClick={() => {
                            setErroSortCol('motivoErro');
                            setErroSortAsc(erroSortCol === 'motivoErro' ? !erroSortAsc : true);
                          }}>Motivo do Erro {erroSortCol === 'motivoErro' ? (erroSortAsc ? '▲' : '▼') : ''}</th>
                        <th className="text-center p-1 pointer"
                          title="Clique para ordenar por Item do Edital"
                          onClick={() => {
                            setErroSortCol('editalItem');
                            setErroSortAsc(erroSortCol === 'editalItem' ? !erroSortAsc : true);
                          }}>Item do Edital {erroSortCol === 'editalItem' ? (erroSortAsc ? '▲' : '▼') : ''}</th>
                        <th className="text-center p-1" >Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {getSortedErros(errosFiltrados).map((erro, idx) => (
                        <tr key={idx} className={idx % 2 === 1 ? 'bg-secondary bg-opacity-10' : ''} >
                          <td className="text-center p-1">{erro.simulado}</td>
                          <td className="text-center p-1">{erro.dataSim ? new Date(erro.dataSim).toLocaleDateString('pt-BR') : ''}</td>
                          <td className="text-center p-1">{erro.numeroQuestao}</td>
                          <td className="text-center p-1">{erro.motivoErro}</td>
                          <td className="text-center p-1">{erro.editalItem ? erro.editalItem.slice(0, 30) + (erro.editalItem.length > 30 ? '...' : '') : ''}</td>
                          <td className="text-center p-1">
                            <select
                              className="form-select form-select-sm"
                              value={erro.acao || ''}
                              onChange={async e => {
                                const novoAcao = e.target.value;
                                const respostaId = erro.id || erro._id;
                                try {
                                  await api.put(`/respostas/${respostaId}/acao`, { acao: novoAcao });
                                  setErrosMateria(prev => prev.map((item, i) => i === idx ? { ...item, acao: novoAcao } : item));
                                } catch (err) {
                                  alert('Erro ao atualizar ação.');
                                }
                              }}
                            >
                              <option value="">Selecione ação...</option>
                              <option value="questao_corrigida">Questão corrigida</option>
                              <option value="revisado">Revisado</option>
                              <option value="nao_revisavel">Não revisável</option>
                              <option value="revisar_depois">Revisar depois</option>
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>}
            </>
          )}
        </div>
        <div className='card-padrao mapa-brancos w-50 flex-grow-1 mb-4 d-flex flex-column'>
          <strong className="mb-3 text-center">MAPA DE BRANCOS</strong>
          {loadingBrancos ? (
            <div className="text-center text-secondary py-5">Carregando...</div>
          ) : (
            <>
              <div className="d-flex flex-row gap-3 w-50 mb-2">
                <div className="flex-fill">
                  <div className="fw-bold text-center mb-2" style={{fontSize: '1rem'}}>Brancos por Item do Edital</div>
                  <BrancosBarChart brancos={brancosFiltrados} materia={materia} editalItens={itensEditalComBranco} page={brancoPage} totalPages={totalBrancoPages} />
                  <div className="d-flex justify-content-center align-items-center gap-2 mt-2">
                    <button className="btn btn-sm btn-outline-secondary" onClick={() => setBrancoPage(p => Math.max(0, p - 1))} disabled={brancoPage === 0}>
                      &#8592; Anterior
                    </button>
                    <span style={{fontSize: '0.9rem'}}>Página {brancoPage + 1} de {totalBrancoPages || 1}</span>
                    <button className="btn btn-sm btn-outline-secondary" onClick={() => setBrancoPage(p => Math.min(totalBrancoPages - 1, p + 1))} disabled={brancoPage >= totalBrancoPages - 1}>
                      Próximo &#8594;
                    </button>
                  </div>
                </div>
                <div className="flex-fill">
                  <div className="fw-bold text-center mb-2" style={{fontSize: '1rem'}}>Motivo dos Brancos</div>
                  <MotivoBrancoBarChart brancos={brancosFiltrados} materia={materia} />
                </div>
              </div>
              {brancosFiltrados.length === 0 ? (
                <div className="text-secondary">Nenhuma questão em branco nesta matéria.</div>
              ) : <div className="overflow-auto mt-3 rounded-3">
                  <table className="w-100 border-0 rounded-3  ">
                    <thead>
                      <tr>
                        <th className="text-center p-1 pointer"
                          title="Clique para ordenar por Simulado"
                          onClick={() => {
                            setBrancoSortCol('simulado');
                            setBrancoSortAsc(brancoSortCol === 'simulado' ? !brancoSortAsc : true);
                          }}>Simulado {brancoSortCol === 'simulado' ? (brancoSortAsc ? '▲' : '▼') : ''}</th>
                        <th className="text-center p-1 pointer" 
                          title="Clique para ordenar por Data"
                          onClick={() => {
                            setBrancoSortCol('dataSim');
                            setBrancoSortAsc(brancoSortCol === 'dataSim' ? !brancoSortAsc : true);
                          }}>Data {brancoSortCol === 'dataSim' ? (brancoSortAsc ? '▲' : '▼') : ''}</th>
                        <th className="text-center p-1 pointer"
                          title="Clique para ordenar por Nº Questão"
                          onClick={() => {
                            setBrancoSortCol('numeroQuestao');
                            setBrancoSortAsc(brancoSortCol === 'numeroQuestao' ? !brancoSortAsc : true);
                          }}>Nº Questão {brancoSortCol === 'numeroQuestao' ? (brancoSortAsc ? '▲' : '▼') : ''}</th>
                        <th className="text-center p-1 pointer" 
                          title="Clique para ordenar por Motivo do Branco"
                          onClick={() => {
                            setBrancoSortCol('motivoBranco');
                            setBrancoSortAsc(brancoSortCol === 'motivoBranco' ? !brancoSortAsc : true);
                          }}>Motivo do Branco {brancoSortCol === 'motivoBranco' ? (brancoSortAsc ? '▲' : '▼') : ''}</th>
                        <th className="text-center p-1 pointer" 
                          title="Clique para ordenar por Item do Edital"
                          onClick={() => {
                            setBrancoSortCol('editalItem');
                            setBrancoSortAsc(brancoSortCol === 'editalItem' ? !brancoSortAsc : true);
                          }}>Item do Edital {brancoSortCol === 'editalItem' ? (brancoSortAsc ? '▲' : '▼') : ''}</th>
                        <th className="text-center p-1" >Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {getSortedBrancos(brancosFiltrados).map((branco, idx) => (
                        <tr key={idx} className={idx % 2 === 1 ? 'bg-secondary bg-opacity-10' : ''} >
                          <td className="text-center p-1">{branco.simulado}</td>
                          <td className="text-center p-1">{branco.dataSim ? new Date(branco.dataSim).toLocaleDateString('pt-BR') : ''}</td>
                          <td className="text-center p-1">{branco.numeroQuestao}</td>
                          <td className="text-center p-1">{branco.motivoBranco || '-'}</td>
                          <td className="text-center p-1">{branco.editalItem ? branco.editalItem.slice(0, 30) + (branco.editalItem.length > 30 ? '...' : '') : ''}</td>
                          <td className="text-center p-1">
                            <select
                              className="form-select form-select-sm"
                              value={branco.acao || ''}
                              onChange={async e => {
                                const novoAcao = e.target.value;
                                const respostaId = branco.id || branco._id;
                                try {
                                  await api.put(`/respostas/${respostaId}/acao`, { acao: novoAcao });
                                  setBrancosMateria(prev => prev.map((item, i) => i === idx ? { ...item, acao: novoAcao } : item));
                                } catch (err) {
                                  alert('Erro ao atualizar ação.');
                                }
                              }}
                            >
                              <option value="">Selecione ação...</option>
                              <option value="questao_corrigida">Questão corrigida</option>
                              <option value="revisado">Revisado</option>
                              <option value="nao_revisavel">Não revisável</option>
                              <option value="revisar_depois">Revisar depois</option>
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>}
            </>
          )}
        </div>
      </main>
    </div>
  );
}

export default MateriaOverview;

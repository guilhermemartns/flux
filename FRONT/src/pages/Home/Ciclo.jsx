
import React, { useState, useEffect, useRef } from 'react';
import api from '../../services/api';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash, faClone, faPenToSquare, faCheck, faArrowUp, faArrowDown, faFaceSadTear, faFolderOpen } from '@fortawesome/free-solid-svg-icons';
import { faOtter } from '@fortawesome/free-solid-svg-icons';
import { Doughnut } from 'react-chartjs-2';
import { Chart, ArcElement, Tooltip, Legend } from 'chart.js';
import { toast } from 'react-toastify';
import Swal from 'sweetalert2';
import { usePageTitle } from '../../components/PageTitleContext';
import Spinner from 'react-bootstrap/Spinner';
import { SkeletonCiclo } from '../../components/Skeleton';
import { useNavigate } from 'react-router-dom';
Chart.register(ArcElement, Tooltip, Legend);

// Plugin para mostrar texto centralizado
const centerTextPlugin = {
  id: 'centerText',
  afterDraw: (chart) => {
    if (chart.config.options.centerText) {
      const ctx = chart.ctx;
      const centerText = chart.config.options.centerText.text;
      ctx.save();
      ctx.font = 'bold 22px Arial';
      ctx.fillStyle = '#333';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const x = chart.getDatasetMeta(0).data[0].x;
      const y = chart.getDatasetMeta(0).data[0].y;
      ctx.fillText(centerText, x, y);
      ctx.restore();
    }
  }
};
Chart.register(centerTextPlugin);









const Ciclo = () => {
  // Função para finalizar o ciclo (agora dentro do componente, com acesso ao estado)
  function handleFinalizarCiclo() {
    if (!cicloSalvo || !cicloSalvo.id) return;
    const userId = JSON.parse(localStorage.getItem('user'))?.id;
    Swal.fire({
      title: 'Finalizar ciclo?',
      text: 'Tem certeza que deseja finalizar este ciclo? Esta ação não pode ser desfeita.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Finalizar',
      cancelButtonText: 'Cancelar',
      customClass: {
        container: 'alert-fundo',
        popup: 'text-white',
        title: 'text-white',
        content: 'text-white',
        confirmButton: 'btn m-2 btn-primary-primary',
        cancelButton: 'btn btn-outline-primary-primary',
      },
      buttonsStyling: false,
      background: 'transparent',
    }).then((result) => {
      if (result.isConfirmed) {
        // Chamada real para finalizar ciclo (endpoint correto do backend)
        api.post('/ciclo-finalizado', { cicloId: cicloSalvo.id, userId })
          .then(() => {
            toast.success('Ciclo finalizado com sucesso!');
            // Zera o progresso das matérias
            setProgressoCiclo({});
            setTempoEstudadoPorMateria({});
            setCiclosFinalizados(c => c + 1);
          })
          .catch(() => {
            toast.error('Erro ao finalizar ciclo.');
          });
      }
    });
  }
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const toastShownRef = useRef(false);
  const [nomeCiclo, setNomeCiclo] = useState('');
  const [materiasProjeto, setMateriasProjeto] = useState([]);
  const [itensCiclo, setItensCiclo] = useState([]);
  const [projetoSelecionado, setProjetoSelecionado] = useState(localStorage.getItem('projetoSelecionado') || '');
  const [cicloSalvo, setCicloSalvo] = useState(null);
  const [editando, setEditando] = useState(false);
  const [tempoEstudadoPorMateria, setTempoEstudadoPorMateria] = useState({});
  const [progressoCiclo, setProgressoCiclo] = useState({});
  const [ciclosFinalizados, setCiclosFinalizados] = useState(0);
  const [swapIdx, setSwapIdx] = useState(null);
  const [swapIdx2, setSwapIdx2] = useState(null);
  const [swapDirection, setSwapDirection] = useState(null);
  // Estado para hover do botão finalizar ciclo
  const [hoverFinalizar, setHoverFinalizar] = useState(false);
  const itemRefs = useRef([]);
  const editItemRefs = useRef([]);
  const { setTitle } = usePageTitle();

  useEffect(() => {
    setTitle('Ciclo');
    document.title = 'FLUX | Ciclo';
  }, [setTitle]);

  useEffect(() => {
    const handleStorage = () => {
      setProjetoSelecionado(localStorage.getItem('projetoSelecionado') || '');
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  useEffect(() => {
    if (!projetoSelecionado) {
      setMateriasProjeto([]);
      setLoading(false);
      return;
    }
    // Só executa loading se há projeto selecionado
    setLoading(true);
    const userId = JSON.parse(localStorage.getItem('user'))?.id;
    api.get('/edital', { params: { userId, projetoId: projetoSelecionado } })
      .then(res => {
        setMateriasProjeto(res.data.filter(m => m.projetoId === projetoSelecionado));
        setLoading(false); // <-- Coloque aqui
      })
      .catch(() => {
        setMateriasProjeto([]);
        setLoading(false); // <-- E aqui
      });
  }, [projetoSelecionado]);

  useEffect(() => {
    // Ao montar, busca ciclo cadastrado
    const userId = JSON.parse(localStorage.getItem('user'))?.id;
    if (!userId || !projetoSelecionado) {
      setLoading(false);
      setCicloSalvo(null);
      setCiclosFinalizados(0);
      return;
    }
    setLoading(true); // <-- Adicione aqui
    api.get('/ciclos', { params: { userId, projetoId: projetoSelecionado } })
      .then(res => {
        if (res.data && res.data.length > 0) {
          setCicloSalvo(res.data[res.data.length - 1]);
          setEditando(false);
          // Busca ciclos finalizados
          api.get('/ciclo-finalizado', { params: { userId } })
            .then(res2 => setCiclosFinalizados(res2.data?.count || 0))
            .catch(() => setCiclosFinalizados(0))
            .finally(() => setLoading(false)); // <-- Loading só termina aqui
        } else {
          setCicloSalvo(null);
          setCiclosFinalizados(0);
          setLoading(false);
        }
      })
      .catch(() => {
        setCicloSalvo(null);
        setCiclosFinalizados(0);
        setLoading(false);
      });
  }, [projetoSelecionado]);

  useEffect(() => {
    // Ao montar ou cicloSalvo mudar, busca tempo estudado
    const userId = JSON.parse(localStorage.getItem('user'))?.id;
    if (cicloSalvo && cicloSalvo.id) {
      const userId = JSON.parse(localStorage.getItem('user'))?.id;
      if (userId) {
        api.get('/ciclo-estudo', { params: { cicloId: cicloSalvo.id, userId } })
          .then(res => setProgressoCiclo(res.data || {}))
          .catch(() => setProgressoCiclo({}));
      }
    } else {
      setProgressoCiclo({});
    }
  }, [cicloSalvo]);

  useEffect(() => {
    const projetoSelecionado = localStorage.getItem('projetoSelecionado');
    // Remova o redirecionamento automático:
    // if (!projetoSelecionado && !toastShownRef.current) {
    //   toastShownRef.current = true;
    //   navigate('/projeto');
    //   setTimeout(() => {
    //     toast.warn('Insira um projeto para acessar os ciclos', {
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
    // ...existing code for fetching data...
  }, [navigate]);

  // --- TODOS OS HOOKS ACIMA DESTA LINHA ---

  if (loading) {
    return <SkeletonCiclo />;
  }

  // --- FUNÇÕES DO COMPONENTE ---
  function handleAddItem() {
    setItensCiclo([...itensCiclo, { materiaId: '', tempo: '' }]);
  }

  function handleChangeItem(idx, field, value) {
    setItensCiclo(itensCiclo => itensCiclo.map((item, i) => i === idx ? { ...item, [field]: value } : item));
  }
  function handleRemoveItem(idx) {
    setItensCiclo(itensCiclo => itensCiclo.filter((_, i) => i !== idx));
  }

  function handleDuplicateItem(idx) {
    setItensCiclo(itensCiclo => {
      const item = itensCiclo[idx];
      const newItens = [...itensCiclo];
      newItens.splice(idx + 1, 0, { ...item });
      return newItens;
    });
  }

  function handleSalvarCiclo() {
    const cicloMaterias = itensCiclo
      .filter(item => item.materiaId && item.tempo && !isNaN(item.tempo) && item.tempo > 0)
      .map((item, ordem) => ({ materiaId: item.materiaId, tempoMin: Number(item.tempo), ordem }));
    if (!nomeCiclo.trim() || cicloMaterias.length === 0) {
      toast.warning('Preencha o nome do ciclo e pelo menos uma matéria com tempo válido.');
      return;
    }
    const userId = JSON.parse(localStorage.getItem('user'))?.id;
    const projetoId = projetoSelecionado;
    if (cicloSalvo && cicloSalvo.id) {
      // Edita ciclo existente
      api.put(`/ciclos/${cicloSalvo.id}`, { nome: nomeCiclo, materias: cicloMaterias })
        .then(res => {
          setCicloSalvo(res.data);
          setEditando(false);
          setNomeCiclo('');
          setItensCiclo([]);
        })
        .catch(() => {
          toast.error('Erro ao atualizar ciclo.');
        });
    } else {
      // Cria novo ciclo
      api.post('/ciclos', { nome: nomeCiclo, materias: cicloMaterias, userId, projetoId })
        .then(() => {
          api.get('/ciclos', { params: { userId, projetoId } })
            .then(res => {
              if (res.data && res.data.length > 0) {
                setCicloSalvo(res.data[res.data.length - 1]);
                setEditando(false);
              }
            });
          setNomeCiclo('');
          setItensCiclo([]);
        })
        .catch(() => {
          toast.error('Erro ao salvar ciclo.');
        });
    }
  }

  function handleEditarCiclo() {
    // Preenche campos para edição
    if (cicloSalvo) {
      setNomeCiclo(cicloSalvo.nome);
      setItensCiclo(cicloSalvo.materias.map(m => ({
        materiaId: m.materiaId,
        tempo: m.tempoMin
      })));
      setEditando(true);
    }
  }

  const formatTempo = (minutos) => {
    const h = Math.floor(minutos / 60);
    const m = minutos % 60;
    return h > 0 ? `${h}h ${m}min` : `${m}min`;
  };

  const progressoMaterias = cicloSalvo?.materias?.map(m => {
    const tempoEstudado = tempoEstudadoPorMateria[m.materiaId] || 0;
    return {
      tempoEstudado,
      tempoRestante: Math.max(m.tempoMin - tempoEstudado, 0)
    };
  }) || [];

  // Agrupa matérias iguais por nome (planejado e estudado)
  const progressoAgrupado = {};
  if (cicloSalvo && cicloSalvo.materias) {
    cicloSalvo.materias.forEach(m => {
      const nome = m.materia?.nome || m.nome;
      if (!progressoAgrupado[nome]) {
        progressoAgrupado[nome] = { planejado: 0, estudado: 0 };
      }
      // Sempre soma o tempo planejado de cada ocorrência
      progressoAgrupado[nome].planejado += m.tempoMin;
      // Soma o tempo estudado de cada ocorrência
      const prog = progressoCiclo[m.materiaId] || {};
      progressoAgrupado[nome].estudado += prog.estudado ?? 0;
    });
  }

  // Função para calcular o tempo estudado distribuído por itens do ciclo
  function getEstudoDistribuido(materias, progressoCiclo) {
    const distribuido = [];
    const acumuladoPorNome = {};
    // Calcula o total estudado por nome
    const totalPorNome = {};
    materias.forEach(m => {
      const nome = m.materia?.nome || m.nome;
      if (!totalPorNome[nome]) {
        // Soma o tempo estudado de todos os itens dessa matéria
        totalPorNome[nome] = materias
          .filter(mat => (mat.materia?.nome || mat.nome) === nome)
          .reduce((acc, mat) => acc + (progressoCiclo[mat.materiaId]?.estudado ?? 0), 0);
      }
    });
    materias.forEach((m, idx) => {
      const nome = m.materia?.nome || m.nome;
      const planejado = m.tempoMin;
      if (!acumuladoPorNome[nome]) acumuladoPorNome[nome] = 0;
      // O tempo estudado para este item é o que falta para completar o planejado, descontando o que já foi distribuído
      const estudadoItem = Math.min(planejado, Math.max(0, totalPorNome[nome] - acumuladoPorNome[nome]));
      acumuladoPorNome[nome] += estudadoItem;
      distribuido.push({ idx, nome, planejado, estudadoItem });
    });
    return distribuido;
  }

  const userId = JSON.parse(localStorage.getItem('user'))?.id;
  const cicloCompleto = Object.values(progressoAgrupado).length > 0 && Object.values(progressoAgrupado).every(dados => dados.planejado > 0 && dados.estudado >= dados.planejado);

  const estudoDistribuido = cicloSalvo && cicloSalvo.materias ? getEstudoDistribuido(cicloSalvo.materias, progressoCiclo) : [];

  // Dados para o gráfico Donut interno: cada fatia = total planejado, usando cores das matérias
  const donutInternoData = cicloSalvo && cicloSalvo.materias
    ? {
      labels: cicloSalvo.materias.map(m => m.materia?.nome || m.nome),
      datasets: [
        {
          label: 'Progresso',
          data: cicloSalvo.materias.map((m, idx) => {
            const dist = estudoDistribuido[idx];
            return dist ? dist.estudadoItem : 0;
          }),
          backgroundColor: cicloSalvo.materias.map((m) => m.materia?.cor || m.cor || '#28a745'),
          borderWidth: 1.5,
          borderColor: '#fff',
        },
        {
          label: 'Restante',
          data: cicloSalvo.materias.map((m, idx) => {
            const dist = estudoDistribuido[idx];
            return dist ? dist.planejado - dist.estudadoItem : m.tempoMin;
          }),
          backgroundColor: cicloSalvo.materias.map((m) => m.materia?.cor || m.cor || '#28a745'),
          borderWidth: 1.5,
          borderColor: '#fff',
        }
      ]
    }
    : null;

  // Donut de progresso: cada fatia usa a cor da matéria
  const donutProgressoData = cicloSalvo && cicloSalvo.materias
    ? {
      labels: cicloSalvo.materias.map((item) => item.materia?.nome || item.nome),
      datasets: [
        {
          label: 'Progresso',
          data: cicloSalvo.materias.map((item) => item.tempoMin),
          backgroundColor: cicloSalvo.materias.map((item) => item.materia?.cor || item.cor || '#28a745'),
          borderWidth: 1.5,
          borderColor: '#fff',
        }
      ]
    }
    : null;

  function handleAddMaterias() {
    // Adiciona todas as matérias do projeto que ainda não estão no ciclo
    const idsExistentes = itensCiclo.map(item => item.materiaId);
    const novasMaterias = materiasProjeto.filter(m => !idsExistentes.includes(m.id));
    if (novasMaterias.length > 0) {
      setItensCiclo([...itensCiclo, ...novasMaterias.map(m => ({ materiaId: m.id, tempo: '' }))]);
    } else {
      // Se todas já estão, adiciona um campo vazio para preenchimento manual
      setItensCiclo([...itensCiclo, { materiaId: '', tempo: '' }]);
    }
  }

  if (!projetoSelecionado) {
    return (
      <div className="app-container d-flex flex-column justify-content-center align-items-center" style={{ minHeight: '80vh' }}>
        <div className="d-flex flex-column align-items-center text-center">
          <FontAwesomeIcon icon={faFolderOpen} size="4x" className="mb-3 text-secondary" />
          <h4 className="mb-3 fs-6 text-secondary">
            Nenhum projeto selecionado.<br />
            Selecione ou crie um projeto para acessar o ciclo de estudo.
          </h4>
          <button className="btn btn-primary-primary px-4 py-2" onClick={() => navigate('/projeto')}>
            Ir para Projetos
          </button>
        </div>
      </div>
    );
  }

  if (materiasProjeto.length === 0) {
    return (
      <div className="app-container d-flex flex-column justify-content-center align-items-center" style={{ minHeight: '80vh' }}>
        <div className="d-flex flex-column align-items-center text-center">
          <FontAwesomeIcon icon={faFolderOpen} size="4x" className="mb-3 text-secondary" />
          <h4 className="mb-3 fs-6 text-secondary">
            Nenhuma matéria cadastrada.<br />
            Adicione matérias ao edital antes de cadastrar ciclos de estudo.
          </h4>
          <button className="btn btn-primary-primary px-4 py-2" onClick={() => navigate('/edital')}>
            Ir para Edital
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container" style={{ height: '100vh' }}>
      <main className="container-fluid" style={{ height: '100%' }}>
        {/* Mensagem centralizada se não houver ciclo salvo e não estiver editando */}
        {!cicloSalvo && !editando && (
          <div className="d-flex flex-column justify-content-center align-items-center fadein" style={{ animationDelay: '0.1s' }}>
            <FontAwesomeIcon icon={faFaceSadTear} size="4x" className="mb-3 text-secondary" />
            <h4 className="mb-3 text-center fs-6 text-secondary">Não há um ciclo de estudo cadastrado.</h4>
            <button className="btn btn-primary-primary px-4 py-2" onClick={() => setEditando(true)}>
              Criar Ciclo de Estudo
            </button>
          </div>
        )}
        {(cicloSalvo || editando) && (
          <div className="row" style={{ height: '100%' }}>
            <div className="col-12 d-flex gap-4 p-0" style={{ height: '100%' }}>

              <div className="card-padrao flex-grow-1 d-flex flex-column fadein" style={{ height: '100%', animationDelay: '0.2s' }}>
                <div className="card-title-padrao mb-3" style={{ padding: '1rem 1rem 0 1rem' }}>SUA SEQUÊNCIA</div>
                {/* Nome do ciclo no topo da coluna esquerda */}
                {cicloSalvo && !editando && (
                  <div className="d-flex align-items-center justify-content-between mb-3 px-3">
                    <h5 className="mb-0 text-primary-primary text-uppercase" style={{ letterSpacing: '0.5px', fontWeight: 700 }}>
                      {cicloSalvo.nome}
                    </h5>
                    <div className="d-flex gap-2">
                      <button className="btn-icon" title="Editar ciclo" onClick={handleEditarCiclo}>
                        <FontAwesomeIcon icon={faPenToSquare} />
                      </button>
                      <button className="btn-icon" title="Apagar ciclo" onClick={async () => {
                          const result = await Swal.fire({
                            title: 'Deseja apagar este ciclo?',
                            text: 'Essa ação não pode ser desfeita.',
                            icon: 'warning',
                            showCancelButton: true,
                            confirmButtonText: 'Sim, apagar',
                            cancelButtonText: 'Cancelar',
                            reverseButtons: true,
                            customClass: {
                              container: 'alert-fundo',
                              popup: 'text-white',
                              title: 'text-white',
                              content: 'text-white',
                              confirmButton: 'btn m-2 btn-primary-primary',
                              cancelButton: 'btn btn-outline-primary-primary',
                            },
                            buttonsStyling: false,
                            background: 'transparent',
                          });
                          if (!result.isConfirmed) return;
                          api.delete(`/ciclos/${cicloSalvo.id}`)
                            .then(() => {
                              setCicloSalvo(null);
                              setEditando(true);
                            })
                            .catch(() => {
                              toast.error('Erro ao apagar ciclo.');
                            });
                        }}>
                          <FontAwesomeIcon icon={faTrash} />
                        </button>
                      </div>
                    </div>
                  )}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '0 1rem 1rem 1rem' }}>
                {editando ? (
                  <>
                    {/* Controles do ciclo (nome e botões) */}
                    <div className="d-flex align-items-end gap-3 mb-3">
                      <div className="d-flex flex-column">
                        <label htmlFor="nomeCicloInput" style={{ fontWeight: 500, fontSize: '1em' }}>Nome do Ciclo</label>
                        <input
                          id="nomeCicloInput"
                          type="text"
                          className="linha form-control"
                          style={{ minWidth: 220 }}
                          placeholder="Ex: Ciclo 1"
                          value={nomeCiclo}
                          onChange={e => setNomeCiclo(e.target.value)}
                          required
                        />
                      </div>
                      <div className="d-flex gap-2 ms-auto">
                        {(!cicloSalvo) && (
                          <button className="btn btn-outline-primary-primary" style={{ minWidth: 120 }} onClick={() => { setEditando(false); setNomeCiclo(''); setItensCiclo([]); }}>
                            Cancelar
                          </button>
                        )}
                        {cicloSalvo && (
                          <button className="btn btn-outline-primary-primary" style={{ minWidth: 120 }} onClick={() => setEditando(false)}>
                            Cancelar
                          </button>
                        )}
                        <button className="btn btn-primary-primary" style={{ minWidth: 120 }} onClick={handleSalvarCiclo}>Salvar</button>
                      </div>
                    </div>
                    <div className="d-flex flex-column" style={{ flexGrow: 1, overflowY: 'auto', maxHeight: 'calc(100vh - 340px)' }}>
                      <ul className="mb-2" style={{ flexGrow: 1 }}>
                        {itensCiclo.map((item, idx) => (
                          <li
                            key={idx}
                            ref={el => editItemRefs.current[idx] = el}
                            style={{
                              backgroundColor: 'var(--background)',
                              animationDelay: `${0.1 * idx}s`
                            }}
                            className="card-padrao fadein mt-2 mb-2 d-flex align-items-center gap-1"
                          >
                            {/* Círculo de cor da matéria, sempre presente */}
                            {(() => {
                              const materia = materiasProjeto.find(m => m.id === item.materiaId);
                              const cor = materia && materia.cor ? materia.cor : 'transparent';
                              return <span style={{ display: 'inline-block', width: 18, height: 18, borderRadius: '50%', background: cor, marginRight: 8, border: '1px solid #ccc' }}></span>;
                            })()}
                            <select
                              className="form-select linha"
                              style={{ maxWidth: '260px', fontSize: '0.97em', padding: '2px 6px' }}
                              value={item.materiaId}
                              onChange={e => handleChangeItem(idx, 'materiaId', e.target.value)}
                              required
                            >
                              <option value="">Selecione a matéria</option>
                              {materiasProjeto.map(m => (
                                <option key={m.id} value={m.id}>{m.nome}</option>
                              ))}
                            </select>
                            <input
                              type="number"
                              className="form-control linha mx-3"
                              style={{ maxWidth: '80px', fontSize: '0.97em', padding: '2px 6px' }}
                              placeholder="Minutos"
                              value={item.tempo}
                              onChange={e => handleChangeItem(idx, 'tempo', e.target.value)}
                              min={1}
                              required
                            />
                            <div className="d-flex ms-auto gap-1 align-items-center">
                              <button type="button" className="btn-icon" style={{ padding: '2px 6px' }} title="Duplicar" onClick={() => handleDuplicateItem(idx)}>
                                <FontAwesomeIcon icon={faClone} />
                              </button>
                              <button type="button" className="btn-icon" style={{ padding: '2px 6px' }} title="Remover" onClick={() => handleRemoveItem(idx)}>
                                <FontAwesomeIcon icon={faTrash} />
                              </button>
                              <button type="button" className="btn-icon" style={{ padding: '2px 6px' }} title="Mover para cima" disabled={idx === 0} onClick={() => {
                                if (idx > 0 && editItemRefs.current[idx] && editItemRefs.current[idx - 1]) {
                                  // FLIP animation
                                  const elementA = editItemRefs.current[idx];
                                  const elementB = editItemRefs.current[idx - 1];
                                  const firstRectA = elementA.getBoundingClientRect();
                                  const firstRectB = elementB.getBoundingClientRect();
                                  
                                  const novos = [...itensCiclo];
                                  [novos[idx - 1], novos[idx]] = [novos[idx], novos[idx - 1]];
                                  setItensCiclo(novos);
                                  
                                  // Aguarda o React atualizar o DOM
                                  setTimeout(() => {
                                    const newElementA = editItemRefs.current[idx - 1];
                                    const newElementB = editItemRefs.current[idx];
                                    if (newElementA && newElementB) {
                                      const lastRectA = newElementA.getBoundingClientRect();
                                      const lastRectB = newElementB.getBoundingClientRect();
                                      const deltaA = firstRectA.top - lastRectA.top;
                                      const deltaB = firstRectB.top - lastRectB.top;
                                      
                                      // Aplica transformação inicial
                                      newElementA.style.transition = 'none';
                                      newElementA.style.transform = `translateY(${deltaA}px)`;
                                      newElementB.style.transition = 'none';
                                      newElementB.style.transform = `translateY(${deltaB}px)`;
                                      
                                      // Anima para a posição final
                                      requestAnimationFrame(() => {
                                        newElementA.style.transition = 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
                                        newElementA.style.transform = 'translateY(0)';
                                        newElementB.style.transition = 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
                                        newElementB.style.transform = 'translateY(0)';
                                        
                                        // Limpa estilos após animação
                                        setTimeout(() => {
                                          newElementA.style.transition = '';
                                          newElementA.style.transform = '';
                                          newElementB.style.transition = '';
                                          newElementB.style.transform = '';
                                        }, 300);
                                      });
                                    }
                                  }, 0);
                                }
                              }}>
                                <FontAwesomeIcon icon={faArrowUp} />
                              </button>
                              <button type="button" className="btn-icon" style={{ padding: '2px 6px' }} title="Mover para baixo" disabled={idx === itensCiclo.length - 1} onClick={() => {
                                if (idx < itensCiclo.length - 1 && editItemRefs.current[idx] && editItemRefs.current[idx + 1]) {
                                  // FLIP animation
                                  const elementA = editItemRefs.current[idx];
                                  const elementB = editItemRefs.current[idx + 1];
                                  const firstRectA = elementA.getBoundingClientRect();
                                  const firstRectB = elementB.getBoundingClientRect();
                                  
                                  const novos = [...itensCiclo];
                                  [novos[idx], novos[idx + 1]] = [novos[idx + 1], novos[idx]];
                                  setItensCiclo(novos);
                                  
                                  // Aguarda o React atualizar o DOM
                                  setTimeout(() => {
                                    const newElementA = editItemRefs.current[idx + 1];
                                    const newElementB = editItemRefs.current[idx];
                                    if (newElementA && newElementB) {
                                      const lastRectA = newElementA.getBoundingClientRect();
                                      const lastRectB = newElementB.getBoundingClientRect();
                                      const deltaA = firstRectA.top - lastRectA.top;
                                      const deltaB = firstRectB.top - lastRectB.top;
                                      
                                      // Aplica transformação inicial
                                      newElementA.style.transition = 'none';
                                      newElementA.style.transform = `translateY(${deltaA}px)`;
                                      newElementB.style.transition = 'none';
                                      newElementB.style.transform = `translateY(${deltaB}px)`;
                                      
                                      // Anima para a posição final
                                      requestAnimationFrame(() => {
                                        newElementA.style.transition = 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
                                        newElementA.style.transform = 'translateY(0)';
                                        newElementB.style.transition = 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
                                        newElementB.style.transform = 'translateY(0)';
                                        
                                        // Limpa estilos após animação
                                        setTimeout(() => {
                                          newElementA.style.transition = '';
                                          newElementA.style.transform = '';
                                          newElementB.style.transition = '';
                                          newElementB.style.transform = '';
                                        }, 300);
                                      });
                                    }
                                  }, 0);
                                }
                              }}>
                                <FontAwesomeIcon icon={faArrowDown} />
                              </button>
                            </div>
                          </li>
                        ))}
                        {/* Adicionar matéria ao ciclo */}
                        <li className="card-padrao-vazio text-center mt-2 p-2 text-primary-primary fadein" style={{ cursor: 'pointer', fontSize: '0.97em', lineHeight: '1.2', animationDelay: `${0.1 * itensCiclo.length}s` }} onClick={handleAddMaterias}>
                          + Adicionar matérias ao ciclo
                        </li>
                      </ul>
                    </div>
                  </>
                ) : (
                  cicloSalvo && (
                    <>
                      <ul className="mb-2 gap-2" style={{flexGrow: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto', maxHeight: 'calc(100vh - 330px)' }}>
                        {cicloSalvo.materias.map((item, idx) => {
                          const nome = item.materia?.nome || item.nome;
                          const dist = estudoDistribuido[idx];
                          const completo = dist && dist.estudadoItem >= dist.planejado;
                          const progresso = dist && dist.planejado > 0 ? Math.min(100, Math.round((dist.estudadoItem / dist.planejado) * 100)) : 0;
                          const cor = item.materia?.cor || item.cor || 'transparent';
                          return (
                            <li
                              key={idx}
                              ref={el => itemRefs.current[idx] = el}
                              className="card-padrao fadein d-flex align-items-center gap-1 "
                              style={{
                                backgroundColor: 'var(--background)',
                                animationDelay: `${0.1 * idx}s`
                              }}
                            >
                              <span style={{ display: 'inline-block', width: 18, height: 18, borderRadius: '50%', background: cor, marginRight: 8, border: '1px solid #ccc' }}></span>
                              <span className="flex-grow-1" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {nome}
                                {completo && (
                                  <FontAwesomeIcon icon={faCheck} className="ms-1 text-success" title="Completo" />
                                )}
                                <div className="progress mt-1" style={{ height: '7px', background: 'var(--background-dark)', width: '100%' }}>
                                  <div
                                    className="progress-bar"
                                    role="progressbar"
                                    style={{ width: `${progresso}%`, background: '#7ad8a4' }}
                                    aria-valuenow={progresso}
                                    aria-valuemin="0"
                                    aria-valuemax="100"
                                  />
                                </div>
                              </span>
                              <span className="badge bg-secondary ms-1" style={{ fontSize: '0.93em', padding: '2px 7px' }}>{dist ? `${dist.estudadoItem}/${dist.planejado} min` : `0/${item.tempoMin} min`}</span>
                              <button className="btn-icon ms-1" style={{ padding: '2px 6px' }} title="Mover para cima" disabled={idx === 0} onClick={() => {
                                if (idx > 0 && itemRefs.current[idx] && itemRefs.current[idx - 1]) {
                                  // FLIP animation
                                  const elementA = itemRefs.current[idx];
                                  const elementB = itemRefs.current[idx - 1];
                                  const firstRectA = elementA.getBoundingClientRect();
                                  const firstRectB = elementB.getBoundingClientRect();
                                  
                                  const novasMaterias = [...cicloSalvo.materias];
                                  [novasMaterias[idx - 1], novasMaterias[idx]] = [novasMaterias[idx], novasMaterias[idx - 1]];
                                  setCicloSalvo({ ...cicloSalvo, materias: novasMaterias });
                                  
                                  // Aguarda o React atualizar o DOM
                                  setTimeout(() => {
                                    const newElementA = itemRefs.current[idx - 1];
                                    const newElementB = itemRefs.current[idx];
                                    if (newElementA && newElementB) {
                                      const lastRectA = newElementA.getBoundingClientRect();
                                      const lastRectB = newElementB.getBoundingClientRect();
                                      const deltaA = firstRectA.top - lastRectA.top;
                                      const deltaB = firstRectB.top - lastRectB.top;
                                      
                                      // Aplica transformação inicial
                                      newElementA.style.transition = 'none';
                                      newElementA.style.transform = `translateY(${deltaA}px)`;
                                      newElementB.style.transition = 'none';
                                      newElementB.style.transform = `translateY(${deltaB}px)`;
                                      
                                      // Anima para a posição final
                                      requestAnimationFrame(() => {
                                        newElementA.style.transition = 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
                                        newElementA.style.transform = 'translateY(0)';
                                        newElementB.style.transition = 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
                                        newElementB.style.transform = 'translateY(0)';
                                        
                                        // Limpa estilos após animação
                                        setTimeout(() => {
                                          newElementA.style.transition = '';
                                          newElementA.style.transform = '';
                                          newElementB.style.transition = '';
                                          newElementB.style.transform = '';
                                        }, 300);
                                      });
                                    }
                                  }, 0);
                                }
                              }}>
                                <FontAwesomeIcon icon={faArrowUp} />
                              </button>
                              <button className="btn-icon" style={{ padding: '2px 6px' }} title="Mover para baixo" disabled={idx === cicloSalvo.materias.length - 1} onClick={() => {
                                if (idx < cicloSalvo.materias.length - 1 && itemRefs.current[idx] && itemRefs.current[idx + 1]) {
                                  // FLIP animation
                                  const elementA = itemRefs.current[idx];
                                  const elementB = itemRefs.current[idx + 1];
                                  const firstRectA = elementA.getBoundingClientRect();
                                  const firstRectB = elementB.getBoundingClientRect();
                                  
                                  const novasMaterias = [...cicloSalvo.materias];
                                  [novasMaterias[idx], novasMaterias[idx + 1]] = [novasMaterias[idx + 1], novasMaterias[idx]];
                                  setCicloSalvo({ ...cicloSalvo, materias: novasMaterias });
                                  
                                  // Aguarda o React atualizar o DOM
                                  setTimeout(() => {
                                    const newElementA = itemRefs.current[idx + 1];
                                    const newElementB = itemRefs.current[idx];
                                    if (newElementA && newElementB) {
                                      const lastRectA = newElementA.getBoundingClientRect();
                                      const lastRectB = newElementB.getBoundingClientRect();
                                      const deltaA = firstRectA.top - lastRectA.top;
                                      const deltaB = firstRectB.top - lastRectB.top;
                                      
                                      // Aplica transformação inicial
                                      newElementA.style.transition = 'none';
                                      newElementA.style.transform = `translateY(${deltaA}px)`;
                                      newElementB.style.transition = 'none';
                                      newElementB.style.transform = `translateY(${deltaB}px)`;
                                      
                                      // Anima para a posição final
                                      requestAnimationFrame(() => {
                                        newElementA.style.transition = 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
                                        newElementA.style.transform = 'translateY(0)';
                                        newElementB.style.transition = 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
                                        newElementB.style.transform = 'translateY(0)';
                                        
                                        // Limpa estilos após animação
                                        setTimeout(() => {
                                          newElementA.style.transition = '';
                                          newElementA.style.transform = '';
                                          newElementB.style.transition = '';
                                          newElementB.style.transform = '';
                                        }, 300);
                                      });
                                    }
                                  }, 0);
                                }
                              }}>
                                <FontAwesomeIcon icon={faArrowDown} />
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    </>
                  )
                )}
                </div>
              </div>

              <div className="card-padrao fadein" style={{ minWidth: '300px', flexShrink: 0, animationDelay: '0.4s' }}>
                <div className="card-title-padrao mb-3" style={{ padding: '1rem 1rem 0 1rem' }}>RESUMO DO CICLO</div>
                <div style={{ padding: '0 1rem 1rem 1rem' }}>
                {cicloSalvo ? (
                  <>
                    <div className="summary-info card shadow-sm mb-3 p-3" style={{ borderRadius: '1em', background: 'linear-gradient(90deg, #f8fafc 60%, var(--primary-primary) 100%)', border: 'none' }}>
                      <div className="d-flex align-items-center">
                        <span className="me-2" style={{ fontSize: '1.3em', color: 'var(--primary-primary)' }}>
                          <FontAwesomeIcon icon={faClone} />
                        </span>
                        <span style={{ fontWeight: 600, color: 'var(--primary-primary)', fontSize: '1.08em' }}>Ciclos Finalizados</span>
                        <span className="ms-auto" style={{ fontWeight: 500, fontSize: '1.08em' }}>{ciclosFinalizados}</span>
                      </div>
                    </div>
                    <div className="position-relative d-flex flex-column align-items-center justify-content-center" style={{ height: '340px', minHeight: '240px' }}>
                      {/* Single Doughnut with two rings */}
                      {cicloSalvo && cicloSalvo.materias && (
                        <>
                          <div style={{position: 'relative', width: 280, height: 280, zIndex: 10}}>
                            <Doughnut
                              data={{
                                labels: cicloSalvo.materias.map(m => m.materia?.nome || m.nome),
                                datasets: [
                                  // Anel externo: Planejado (total de cada matéria)
                                  {
                                    label: 'Tempo Planejado',
                                    data: cicloSalvo.materias.map(m => m.tempoMin > 0 ? m.tempoMin : 1),
                                    backgroundColor: cicloSalvo.materias.map(m => m.materia?.cor || m.cor || '#28a745'),
                                    borderWidth: 1.5,
                                    borderColor: '#fff',
                                    weight: 1,
                                    circumference: 360,
                                  },
                                  // Anel interno: fatias duplicadas (estudado/cor, restante/cinza) para cada matéria
                                  {
                                    label: 'Tempo Estudado',
                                    // Fatias do mesmo tamanho do planejado
                                    data: cicloSalvo.materias.map(m => m.tempoMin > 0 ? m.tempoMin : 1),
                                    backgroundColor: cicloSalvo.materias.map(m => {
                                      const prog = progressoCiclo[m.materiaId] || {};
                                      const estudado = prog.estudado || 0;
                                      const total = m.tempoMin > 0 ? m.tempoMin : 1;
                                      const percent = Math.max(0, Math.min(estudado / total, 1));
                                      // Se não estudou, cinza
                                      if (percent === 0) return '#e0e0e0';
                                      // Se cor hex, converter para rgba
                                      let cor = m.materia?.cor || m.cor || '#28a745';
                                      if (cor.startsWith('#')) {
                                        // hex para rgb
                                        let hex = cor.replace('#', '');
                                        if (hex.length === 3) hex = hex.split('').map(x => x + x).join('');
                                        const r = parseInt(hex.substring(0,2), 16);
                                        const g = parseInt(hex.substring(2,4), 16);
                                        const b = parseInt(hex.substring(4,6), 16);
                                        return `rgba(${r},${g},${b},${0.3 + 0.7*percent})`;
                                      }
                                      // Se cor já for rgb/rgba, só aplica opacidade
                                      return cor;
                                    }),
                                    borderWidth: 1.5,
                                    borderColor: '#fff',
                                    weight: 1,
                                    circumference: 360,
                                  }
                                ]
                              }}
                              options={{
                                maintainAspectRatio: false,
                                responsive: true,
                                cutout: '60%',
                                plugins: {
                                  legend: { display: false },
                                  tooltip: {
                                    backgroundColor: 'rgba(30,30,30,0.95)',
                                    titleColor: '#fff',
                                    bodyColor: '#ccc',
                                    borderColor: 'rgba(255,255,255,0.12)',
                                    borderWidth: 1,
                                    padding: 8,
                                    callbacks: {
                                      label: (tooltipItem) => {
                                        const dataset = tooltipItem.dataset;
                                        const index = tooltipItem.dataIndex;
                                        if (dataset.label === 'Tempo Estudado') {
                                          const m = cicloSalvo.materias[index];
                                          const prog = progressoCiclo[m.materiaId] || {};
                                          const estudado = prog.estudado || 0;
                                          if (estudado > 0) {
                                            return `Estudado: ${estudado} min`;
                                          } else {
                                            return `Não estudado`;
                                          }
                                        }
                                        // Para o anel externo
                                        const value = dataset.data[index];
                                        const total = dataset.data.reduce((acc, val) => acc + val, 0);
                                        const percent = total > 0 ? Math.round((value / total) * 100) : 0;
                                        return `${dataset.label}: ${value} min (${percent}%)`;
                                      }
                                    }
                                  }
                                },
                                elements: {
                                  arc: {
                                    hoverBorderColor: '#fff',
                                    hoverBorderWidth: 1.5
                                  }
                                },
                              }}
                              height={280}
                              width={280}
                            />
                            {/* Tempo total, barra de progresso e texto centralizado */}
                            <div style={{
                              position: 'absolute',
                              left: '50%',
                              top: '50%',
                              transform: 'translate(-50%, -50%)',
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              justifyContent: 'center',
                              zIndex: -1, // atrás do donut
                              pointerEvents: 'none',
                              width: '160px',
                              gap: '8px'
                            }}>
                              {/* Tempo total */}
                              <span style={{
                                fontWeight: 700,
                                fontSize: '2.2em',
                                color: 'var(--primary-primary)',
                                textAlign: 'center',
                                letterSpacing: '0.5px',
                                userSelect: 'none',
                                lineHeight: '1'
                              }}>
                                {(() => {
                                  const totalMin = cicloSalvo.materias.reduce((acc, m) => acc + m.tempoMin, 0);
                                  const horas = Math.floor(totalMin / 60);
                                  const minutos = totalMin % 60;
                                  if (horas > 0 && minutos > 0) return `${horas}h ${minutos}min`;
                                  if (horas > 0) return `${horas}h`;
                                  return `${minutos}min`;
                                })()}
                              </span>
                              
                              {/* Barra de progresso */}
                              {(() => {
                                const totalPlanejado = cicloSalvo.materias.reduce((acc, m) => acc + m.tempoMin, 0);
                                const totalEstudado = Object.values(progressoCiclo).reduce((acc, prog) => acc + (prog.estudado || 0), 0);
                                const percentual = totalPlanejado > 0 ? Math.min(100, (totalEstudado / totalPlanejado) * 100) : 0;
                                
                                return (
                                  <div style={{
                                    width: '140px',
                                    height: '8px',
                                    backgroundColor: '#e0e0e0',
                                    borderRadius: '4px',
                                    overflow: 'hidden',
                                    border: '1px solid #ccc'
                                  }}>
                                    <div style={{
                                      width: `${percentual}%`,
                                      height: '100%',
                                      backgroundColor: '#7ad8a4',
                                      borderRadius: '3px',
                                      transition: 'width 0.3s ease'
                                    }} />
                                  </div>
                                );
                              })()}
                              
                              {/* Texto de progresso */}
                              <span style={{
                                fontSize: '0.9em',
                                color: '#666',
                                textAlign: 'center',
                                fontWeight: 500,
                                userSelect: 'none',
                                lineHeight: '1'
                              }}>
                                {(() => {
                                  const totalPlanejado = cicloSalvo.materias.reduce((acc, m) => acc + m.tempoMin, 0);
                                  const totalEstudado = Object.values(progressoCiclo).reduce((acc, prog) => acc + (prog.estudado || 0), 0);
                                  
                                  const formatarTempo = (minutos) => {
                                    const h = Math.floor(minutos / 60);
                                    const m = minutos % 60;
                                    if (h > 0 && m > 0) return `${h}h${m}min`;
                                    if (h > 0) return `${h}h`;
                                    return `${m}min`;
                                  };
                                  
                                  return `${formatarTempo(totalEstudado)} / ${formatarTempo(totalPlanejado)}`;
                                })()}
                              </span>
                            </div>
                          </div>
                          {/* Botão para finalizar ciclo */}
                         
                        </>
                      )}
                      {cicloCompleto && (
                        <div className="centered-text" style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          pointerEvents: 'none',
                          zIndex: 99,
                        }}>
                          <button
                            type="button"
                            className="badge pulse-badge ciclo-btn-finalizar"
                            style={{
                              background: 'linear-gradient(90deg, var(--primary-primary) 60%, var(--primary-primary3) 100%)',
                              color: '#fff',
                              fontWeight: 700,
                              fontSize: '1.15em',
                              padding: '0.7em 1.5em',
                              borderRadius: '2em',
                              boxShadow: '0 2px 8px 0 rgba(67,160,71,0.12)',
                              letterSpacing: '0.5px',
                              border: 'none',
                              display: 'inline-block',
                              cursor: 'pointer',
                              outline: 'none',
                              pointerEvents: 'auto',
                              transition: 'filter 0.15s, box-shadow 0.15s',
                            }}
                            onClick={handleFinalizarCiclo}
                            tabIndex={0}
                            title="Clique para finalizar o ciclo"
                            onMouseEnter={() => setHoverFinalizar(true)}
                            onMouseLeave={() => setHoverFinalizar(false)}
                          >
                            <FontAwesomeIcon icon={faCheck} className="me-2" />
                            {hoverFinalizar ? 'Finalizar ciclo' : 'Ciclo Completo!'}
                          </button>
                          <style>{`
                            @keyframes pulse-badge {
                              0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(67,160,71,0.25); }
                              70% { transform: scale(1.08); box-shadow: 0 0 0 10px rgba(67,160,71,0.08); }
                              100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(67,160,71,0.25); }
                            }
                            .pulse-badge {
                              animation: pulse-badge 1.3s infinite;
                              will-change: transform, box-shadow;
                            }
                            .ciclo-btn-finalizar:hover, .ciclo-btn-finalizar:focus {
                              filter: brightness(1.08) saturate(1.2);
                              box-shadow: 0 0 0 0 rgba(67,160,71,0.25), 0 4px 16px 0 rgba(67,160,71,0.18);
                            }
                          `}</style>
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="text-center text-muted" style={{ fontSize: '0.9em' }}>
                    Selecione ou crie um ciclo para ver o resumo aqui.
                  </div>
                )}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
      {/* ToastContainer removido. Usar apenas o global em main.jsx */}
    </div>
  );
}

export default Ciclo;



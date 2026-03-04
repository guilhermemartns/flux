import React, { useState, useEffect, useRef } from 'react';
import { Modal, Button } from 'react-bootstrap';
import api from '../../services/api';
import { Edit2, Archive, Folder, Trash } from 'react-feather';
import { useAuth } from '../../auth.jsx';
import Swal from 'sweetalert2';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import 'sweetalert2/dist/sweetalert2.min.css';
import { usePageTitle } from '../../components/PageTitleContext';
import Spinner from 'react-bootstrap/Spinner';

const Projeto = () => {
  // Estado para modal de mesclagem
  const [showMergeModal, setShowMergeModal] = useState(false);
  const [nomeProjetoMesclado, setNomeProjetoMesclado] = useState('');
  // Estado para projetos padrão
  const [projetosPadrao, setProjetosPadrao] = useState([]);
  // Permite seleção múltipla de projetos padrão
  // Armazena os projetos selecionados como objetos completos
  const [projetosPadraoSelecionados, setProjetosPadraoSelecionados] = useState([]);
  const [loadingProjetosPadrao, setLoadingProjetosPadrao] = useState(false);
  const [projetos, setProjetos] = useState([]);
  const [projetoSelecionado, setProjetoSelecionado] = useState('');
  const [novoProjeto, setNovoProjeto] = useState('');
  const [editandoId, setEditandoId] = useState(null);
  const [novoNomeProjeto, setNovoNomeProjeto] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showNovoProjetoForm, setShowNovoProjetoForm] = useState(false);
  const [carreiraSelecionada, setCarreiraSelecionada] = useState('');
  const [carreiras, setCarreiras] = useState([]);
  const [loadingCarreiras, setLoadingCarreiras] = useState(false);
  const [loading, setLoading] = useState(true);
  const [delays, setDelays] = useState([]);

  // Busca projetos padrão ao montar
  useEffect(() => {
    if (!carreiraSelecionada) {
      setProjetosPadrao([]);
      return;
    }
    setLoadingProjetosPadrao(true);
    api.get('/projetos-padrao', { params: { carreiraId: carreiraSelecionada } })
      .then(res => setProjetosPadrao(res.data))
      .catch(() => setProjetosPadrao([]))
      .finally(() => setLoadingProjetosPadrao(false));
  }, [carreiraSelecionada]);

  // Função para confirmar projeto padrão
  async function handleSelecionarProjetoPadrao(projetoPadraoId) {
    try {
      // Gera nome único para o novo projeto baseado no projeto padrão
      let nomeBase = 'Novo Projeto';
      let contador = 1;
      let nomeFinal = nomeBase;
      while (projetos.some(p => p.nome === nomeFinal)) {
        nomeFinal = `${nomeBase} (${contador})`;
        contador++;
      }
      const res = await api.post('/projetos', { nome: nomeFinal, userId: user.id });
      if (!res.data || !res.data.id) {
        toast.error('Erro ao criar novo projeto.');
        return;
      }
      // Copia o edital padrão para o novo projeto
      await api.post(`/usuarios/${user.id}/copiar-projeto-padrao/${projetoPadraoId}`, { projetoId: res.data.id });
      // Seleciona automaticamente o novo projeto
      setProjetoSelecionado(res.data.id);
      localStorage.setItem('projetoSelecionado', res.data.id);
      localStorage.setItem('projetoSelecionadoNome', res.data.nome);
      setProjetoSelecionadoNome(res.data.nome);
      window.dispatchEvent(new Event('storage'));
      window.dispatchEvent(new Event('projetosAtualizados'));
      window.dispatchEvent(new Event('projetoNomeAtualizado'));
      setShowAddModal(false); // Fecha o modal
      fetchProjetos();
    } catch (error) {
      toast.error('Erro ao criar projeto ou copiar edital padrão.');
    }
  }
  const { user } = useAuth();
  useEffect(() => {
    setLoadingCarreiras(true);
    api.get('/carreiras')
      .then(res => setCarreiras(res.data))
      .catch(() => setCarreiras([]))
      .finally(() => setLoadingCarreiras(false));
  }, []);
  const toastShownRef = useRef({ noProject: false, noSelection: false });
  const [projetoSelecionadoNome, setProjetoSelecionadoNome] = useState(localStorage.getItem('projetoSelecionadoNome') || '');
  const { setTitle } = usePageTitle();

  useEffect(() => {
    setTitle('Projetos');
    document.title = 'FLUX | Projetos';
  }, [setTitle]);

  async function handleEditarProjeto(id, nomeAtual) {
    setEditandoId(id);
    setNovoNomeProjeto(nomeAtual);
    setShowEditModal(true);
  }

  async function handleSalvarNomeProjeto(id) {
    if (!novoNomeProjeto.trim()) return;
    if (projetos.some(p => p.id !== id && p.nome.toLowerCase() === novoNomeProjeto.trim().toLowerCase())) {
      toast.error('Já existe um projeto com esse nome.');
      return;
    }
    try {
      await api.put(`/projetos/${id}`, { nome: novoNomeProjeto });
      setEditandoId(null);
      setNovoNomeProjeto('');
      setShowEditModal(false);
      const res = await api.get('/projetos', { params: { userId: user.id } });
      setProjetos(res.data);
      window.projetosSidebar = res.data;
      // Atualiza nome do projeto selecionado se necessário
      if (projetoSelecionado === id) {
        localStorage.setItem('projetoSelecionadoNome', novoNomeProjeto);
        setProjetoSelecionadoNome(novoNomeProjeto);
        setProjetoSelecionado(id); // força re-render
        window.dispatchEvent(new Event('projetoNomeAtualizado'));
      }
    } catch (err) {}
  }

  async function fetchProjetos() {
    if (!user) return;
    try {
      const res = await api.get('/projetos', { params: { userId: user.id } });
      setProjetos(res.data);
      window.projetosSidebar = res.data;
    } catch (err) {
      setProjetos([]);
      window.projetosSidebar = [];
    }
  }

  // Carrega projetos ao montar
  useEffect(() => {
    let isMounted = true;
    async function fetchAll() {
      setLoading(true);
      await fetchProjetos();
      if (isMounted) setLoading(false);
    }
    fetchAll();
    return () => { isMounted = false; };
  }, []);

  // Atualiza projetos ao trocar de usuário
  useEffect(() => {
    if (!user) return;
    fetchProjetos();
    // Só limpa seleção ao trocar de usuário, não ao entrar na aba
    const selecionadoId = localStorage.getItem('projetoSelecionado');
    setProjetoSelecionado(selecionadoId || '');
    setProjetoSelecionadoNome(localStorage.getItem('projetoSelecionadoNome') || '');
  }, [user]);

  useEffect(() => {
    if (!projetoSelecionado) return;
    const projeto = projetos.find(p => p.id === projetoSelecionado);
    if (projeto && projeto.nome) {
      localStorage.setItem('projetoSelecionadoNome', projeto.nome);
      setProjetoSelecionadoNome(projeto.nome);
    }
  }, [projetos, projetoSelecionado]);

  async function handleAddProjeto(e) {
    e.preventDefault();
    if (projetos.length >= 3) {
      toast.error('Limite de 3 projetos por usuário atingido. Exclua um projeto para criar outro.');
      return;
    }
    if (!novoProjeto.trim()) return;
    if (projetos.some(p => p.nome.toLowerCase() === novoProjeto.trim().toLowerCase())) {
      toast.error('Já existe um projeto com esse nome.');
      return;
    }
    try {
      const res = await api.post('/projetos', { nome: novoProjeto, userId: user.id });
      setNovoProjeto('');
      // Seleciona automaticamente o projeto recém-criado
      if (res.data && res.data.id) {
        setProjetoSelecionado(res.data.id);
        localStorage.setItem('projetoSelecionado', res.data.id);
        localStorage.setItem('projetoSelecionadoNome', res.data.nome);
        setProjetoSelecionadoNome(res.data.nome);
        window.projetosSidebar = [...(window.projetosSidebar || []), res.data];
        window.dispatchEvent(new Event('storage'));
        window.dispatchEvent(new Event('projetosAtualizados'));
        window.dispatchEvent(new Event('projetoNomeAtualizado'));
        setShowAddModal(false); // Fecha o modal
        setShowNovoProjetoForm(false); // Volta para lista de projetos
      }
      fetchProjetos();
    } catch (err) {
      toast.error('Erro ao criar projeto.');
    }
  }

  async function handleDeleteProjeto(id) {
    if (!window.confirm('Deseja apagar este projeto? Todos os dados relacionados serão perdidos.')) return;
    try {
      await api.delete(`/projetos/${id}`);
      await fetchProjetos();
      if (projetoSelecionado === id) {
        setProjetoSelecionado('');
        localStorage.removeItem('projetoSelecionado');
        window.dispatchEvent(new Event('storage'));
      }
      window.dispatchEvent(new Event('projetosSidebarAtualizar'));
      window.dispatchEvent(new Event('projetoNomeAtualizado'));
    } catch (err) {
      toast.error('Erro ao apagar projeto: ' + (err?.response?.data?.error || err?.message || 'Erro desconhecido'));
    }
  }

  function handleSelectProjeto(id) {
    setProjetoSelecionado(id);
    localStorage.setItem('projetoSelecionado', id);
    const projeto = projetos.find(p => p.id === id);
    if (projeto && projeto.nome) {
      localStorage.setItem('concursoSelecionado', projeto.nome);
      localStorage.setItem('projetoSelecionadoNome', projeto.nome);
      window.dispatchEvent(new Event('projetoNomeAtualizado'));
    } else {
      localStorage.removeItem('concursoSelecionado');
      localStorage.removeItem('projetoSelecionadoNome');
      window.dispatchEvent(new Event('projetoNomeAtualizado'));
    }
    window.dispatchEvent(new Event('storage'));
    // Força atualização visual do badge
    setProjetos([...projetos]);
  }

  useEffect(() => {
    console.log('Projetos padrão:', projetosPadrao);
  }, [projetosPadrao]);

  useEffect(() => {
    document.title = 'FLUX | Projetos';
  }, []);

  // Aviso removido conforme solicitado

  useEffect(() => {
    // Gera delays para projetos usando cálculo direto
    setDelays(projetos.map((_, idx) => `${idx * 0.1}s`));
  }, [projetos.length]);

  if (loading) {
    return (
      <div style={{ width: '400px', height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: 'auto' }}>
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Carregando...</span>
        </Spinner>
      </div>
    );
  }

  return (
    <div className="app-container">
      <main className="container-fluid">
  {/* ToastContainer removido. Usar apenas o global em main.jsx */}

        <div className="row g-3">
          {/* Select de carreira fora do card */}
          {showNovoProjetoForm && (
            <React.Fragment>
              <div className="col-12 mb-3">
                <div className="card-padrao2 card-padrao-hover fadein d-flex align-items-center gap-3 p-3 mb-2 w-25" style={{ cursor: 'pointer', minHeight: 60 }} onClick={() => setShowAddModal(true)}>
                  <Edit2 className="text-primary-primary" size={20} />
                  <span className="fw-bold fs-6">Criar projeto personalizado</span>
                </div>
              </div>
              <div className="col-12 mb-3 w-25">
                <label className="small mb-1">Carreira</label>
                <select
                  className="form-select linha mb-2"
                  value={carreiraSelecionada}
                  onChange={e => setCarreiraSelecionada(e.target.value)}
                  required
                  style={{ width: '100%' }}
                  disabled={loadingCarreiras}
                >
                  <option value="">Selecione a carreira</option>
                  {carreiras.map(c => (
                    <option key={c.id} value={c.id}>{c.nome}</option>
                  ))}
                </select>
              </div>
              {/* Cards de projetos padrão ao selecionar carreira */}
              <div className="d-flex flex-row w-100 gap-3">
                {/* Coluna esquerda: cards de projetos padrão */}
                <div className="d-flex flex-column flex-grow-1 gap-3">
                  {carreiraSelecionada && projetosPadrao.length > 0 ? (
                    projetosPadrao.map(p => {
                      const selecionado = projetosPadraoSelecionados.some(sel => sel.id === p.id);
                      return (
                        <div className="materia-padrao col-12" key={p.id}>
                          <div
                            className={`card-padrao2 fadein card-padrao-hover pointer position-relative`}
                            onClick={() => {
                              setProjetosPadraoSelecionados(sel => {
                                if (selecionado) {
                                  return sel.filter(proj => proj.id !== p.id);
                                } else {
                                  return [p];
                                }
                              });
                            }}
                            style={{ minHeight: '72px', height: '72px', width: '100%', transition: 'box-shadow 0.3s, border 0.3s',  display: 'flex', alignItems: 'stretch' }}
                          >
                            {/* Imagem ou ícone */}
                            <div style={{ flex: '0 0 56px', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 56, padding: '0 8px 8px 8px' }}>
                              {p.imagem ? (
                                <img
                                  src={p.imagem.startsWith('http') ? p.imagem : `http://localhost:3000/uploads/${p.imagem}`}
                                  alt="Imagem do projeto"
                                  style={{ width: 40, height: 40, borderRadius: '8px', objectFit: 'contain', marginRight: 4 }}
                                />
                              ) : (
                                <Archive className="fs-4 text-primary-primary" size={20} />
                              )}
                            </div>
                            {/* Informações */}
                            <div className='d-flex flex-column justify-content-center flex-grow-1' style={{ minWidth: 0 }}>
                              <div className="d-flex align-items-center mb-1" style={{ width: '100%' }}>
                                <div className="d-flex align-items-center gap-2" style={{ flex: '1 1 auto', minWidth: 0 }}>
                                  <span className="fw-bold fs-6 titulo" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '360px' }}>
                                    {p.nome.length > 20 ? `${p.nome.slice(0, 20)}...` : p.nome}
                                  </span>
                                </div>
                                <div style={{ flex: '0 0 auto', marginLeft: 'auto' }}>
                                  {selecionado ? (
                                    <span className="badge bg-primary-primary4 text-primary-primary5 ms-1 ">Selecionado</span>
                                  ) : (
                                    <span className="badge  bg-secondary ms-1 text-white">Não selecionado</span>
                                  )}
                                </div>
                              </div>
                              <div className="mb-1 text-secondary small d-flex flex-row align-items-center gap-3" style={{ lineHeight: 1.3 }}>
                                {p.cargo && (
                                  <span style={{ wordBreak: 'break-word', display: 'inline-block' }}>{p.cargo}</span>
                                )}
                                {p.descricao && (
                                  <span style={{ wordBreak: 'break-word', display: 'inline-block', color: 'var(--text-light)', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.descricao}</span>
                                )}
                                {p.ano && (
                                  <span style={{ wordBreak: 'break-word', maxWidth: '80px', display: 'inline-block' }}>Ano: {p.ano}</span>
                                )}
                                <span style={{  wordBreak: 'break-word', maxWidth: '100px', display: 'inline-block' }}>Matérias: {Array.isArray(p.Materias) ? p.Materias.length : '-'}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-secondary text-center mt-4">Selecione uma carreira para ver os projetos padrão.</div>
                  )}
                </div>
                {/* Coluna direita: projetos padrão selecionados SEMPRE visível */}
                <div className="d-flex  flex-column align-items-end gap-3 w-25" style={{   overflowY: 'auto'}}>
                  <div className="fw-bold mb-2 ">Projeto padrão selecionado:</div>
                  {projetosPadraoSelecionados.length === 0 ? (
                    <div className="text-secondary text-center">Nenhum projeto selecionado.</div>
                  ) : (
                    projetosPadraoSelecionados.map(p => (
                      <div className="card-padrao2 fadein w-100" key={p.id}>
                        <div className="d-flex align-items-center gap-3">
                          {p.imagem ? (
                            <img
                              src={p.imagem.startsWith('http') ? p.imagem : `http://localhost:3000/uploads/${p.imagem}`}
                              alt="Imagem do projeto"
                              style={{ width: 48, height: 48, borderRadius: '8px', objectFit: 'contain', marginRight: 4 }}
                            />
                          ) : (
                            <Archive className="fs-2 text-primary-primary" size={32} />
                          )}
                          <div className="d-flex flex-column flex-grow-1" style={{ minWidth: 0 }}>
                            <span className="fw-bold fs-6 titulo" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '360px' }}>
                              {p.nome && p.nome.length > 20 ? `${p.nome.slice(0, 20)}...` : p.nome}
                            </span>
                            <div className="d-flex flex-column justify-content-between mt-1" style={{ minHeight: 60 }}>
                              <span className="text-secondary small" style={{ wordBreak: 'break-word', maxWidth: '240px', display: 'block', marginBottom: 4 }}>
                                {p.cargo ? `Cargo: ${p.cargo}` : '\u00A0'}
                              </span>
                              <span className="text-secondary small" style={{ wordBreak: 'break-word', maxWidth: '80px', display: 'block', marginBottom: 4 }}>
                                {p.ano ? `Ano: ${p.ano}` : '\u00A0'}
                              </span>
                              <span className="text-secondary small" style={{ wordBreak: 'break-word', maxWidth: '120px', display: 'block' }}>
                                Matérias: {Array.isArray(p.Materias) ? p.Materias.length : 0}
                              </span>
                            </div>
                          </div>
                          <button type="button" className="btn-close ms-auto" aria-label="Remover" style={{ filter: 'invert(0.5)', fontSize: 10 }} onClick={e => {
                            e.stopPropagation();
                            setProjetosPadraoSelecionados(sel => sel.filter(proj => proj.id !== p.id));
                          }}></button>
                        </div>
                      </div>
                    ))
                  )}
                  <button
                    className="btn btn-primary-primary3 mt-3"
                    disabled={projetosPadraoSelecionados.length === 0}
                    onClick={() => {
                      if (!user) {
                        toast.error('Usuário não autenticado.');
                        return;
                      }
                      if (projetosPadraoSelecionados.length === 0) return;
                      setShowMergeModal(true);
                      setNomeProjetoMesclado(projetosPadraoSelecionados[0].nome);
                    }}
                  >Prosseguir</button>

      {/* Modal para nome do projeto mesclado */}
      <Modal className='modal-fundo' show={showMergeModal} onHide={() => setShowMergeModal(false)} centered backdrop="static">
        <Modal.Body className='modal-estilo'>
          <div className="d-flex justify-content-between align-items-center mb-1">
            <Modal.Title className='fw-bold fs-5 m-0'>Criar projeto</Modal.Title>
          </div>
          <p className="text-secondary mb-4" style={{ fontSize: '0.8em' }}>
            O projeto padrão selecionado será copiado para a sua conta. Defina um nome para identificá-lo.
          </p>
          <form className="needs-validation" noValidate onSubmit={async e => {
            e.preventDefault();
            if (!nomeProjetoMesclado.trim()) return;
            if (projetos.some(p => p.nome.toLowerCase() === nomeProjetoMesclado.trim().toLowerCase())) {
              toast.error('Já existe um projeto com esse nome.');
              return;
            }
            try {
              const projetoPadraoId = projetosPadraoSelecionados[0].id;
              const res = await api.post('/projetos', { nome: nomeProjetoMesclado.trim(), userId: user.id });
              if (!res.data || !res.data.id) {
                toast.error('Erro ao criar novo projeto.');
                return;
              }
              await api.post(`/usuarios/${user.id}/copiar-projeto-padrao/${projetoPadraoId}`, { projetoId: res.data.id });
              setProjetosPadraoSelecionados([]);
              setShowNovoProjetoForm(false);
              setProjetoSelecionado(res.data.id);
              localStorage.setItem('projetoSelecionado', res.data.id);
              localStorage.setItem('projetoSelecionadoNome', nomeProjetoMesclado.trim());
              setProjetoSelecionadoNome(nomeProjetoMesclado.trim());
              window.dispatchEvent(new Event('storage'));
              window.dispatchEvent(new Event('projetosAtualizados'));
              window.dispatchEvent(new Event('projetoNomeAtualizado'));
              fetchProjetos();
              setShowMergeModal(false);
            } catch (err) {
              toast.error('Erro ao criar projeto ou copiar edital padrão.');
            }
          }}>
            <label className="form-label fw-semibold" style={{ fontSize: '0.78em', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-light)' }}>Nome do projeto</label>
            <input
              type="text"
              value={nomeProjetoMesclado}
              onChange={e => setNomeProjetoMesclado(e.target.value)}
              className="form-control linha mb-2"
              required
            />
            <div className="d-flex justify-content-end gap-2 mt-3">
              <button type="button" className="btn btn-outline-primary-primary3" onClick={() => setShowMergeModal(false)}>Cancelar</button>
              <button type="submit" className="btn btn-primary-primary3">Criar</button>
            </div>
          </form>
        </Modal.Body>
      </Modal>
                </div>
              </div>
            </React.Fragment>
          )}
          {/* Cards de projetos existentes (fora do formulário de novo projeto) */}
          {!showNovoProjetoForm && projetos.length > 0 && projetos.map((p, idx) => (
            <div className="col-12 col-sm-6 col-md-4 col-lg-3" key={p.id}>
              <div
                className={"card-padrao2 card-padrao-hover fadein pointer position-relative"}
                style={{
                  minHeight: '160px',
                  height: '100%',
                  borderRadius: '18px',
                  padding: 0,
                  animationDelay: delays[idx] || '0s',
                  cursor: 'pointer',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  transition: 'box-shadow 0.3s, border 0.3s',
                }}
                onClick={e => {
                  if (
                    e.target.closest('button') ||
                    e.target.classList.contains('form-check-input')
                  ) return;
                  handleSelectProjeto(p.id);
                  setProjetoSelecionadoNome(p.nome);
                }}
              >
                {/* Botões de editar/apagar no topo direito, alinhados com o título */}
                <div style={{ position: 'absolute', top: 10, right: 10, zIndex: 10, display: 'flex', gap: 4 }}>
                  <button
                    className="d-flex align-items-center justify-content-center"
                    style={{
                      border: 'none',
                      background: 'none',
                      borderRadius: 8,
                      width: 32,
                      height: 32,
                      color: '#888',
                      padding: 0,
                      outline: 'none',
                      boxShadow: 'none',
                      cursor: 'pointer',
                      transition: 'none'
                    }}
                    onClick={e => { e.stopPropagation(); handleEditarProjeto(p.id, p.nome); }}
                    title="Editar projeto"
                  >
                    <Edit2 className="fs-6" size={16} />
                  </button>
                  <button
                    className="d-flex align-items-center justify-content-center"
                    style={{
                      border: 'none',
                      background: 'none',
                      borderRadius: 8,
                      width: 32,
                      height: 32,
                      color: '#888',
                      padding: 0,
                      outline: 'none',
                      boxShadow: 'none',
                      cursor: 'pointer',
                      transition: 'none'
                    }}
                    onClick={e => { e.stopPropagation(); handleDeleteProjeto(p.id); }}
                    title="Apagar projeto"
                  >
                    <Trash className="fs-6" size={16} />
                  </button>
                </div>
                {/* Badge de selecionado no canto inferior direito */}
                {projetoSelecionado === p.id && (
                  <div style={{ position: 'absolute', bottom: 10, right: 10, zIndex: 10 }}>
                    <span className="badge bg-primary-primary4 text-primary-primary5 fadein" style={{ fontSize: 10, padding: '4px 10px' }}>Selecionado</span>
                  </div>
                )}
                {/* Novo layout: ícone/imagem à esquerda do título e descrição */}
                <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'flex-start', padding: '18px 18px 10px 18px', flex: 1, gap: 12 }}>
                  <div style={{ flex: '0 0 50px', display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: 50, minHeight: 50, height: 50, position: 'relative' }}>
                    {Array.isArray(p.imagens) && p.imagens.length > 0 ? (
                      <div style={{ position: 'relative', width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {p.imagens.slice(0, 2).map((img, idx, arr) => (
                          <img
                            key={idx}
                            src={img && (img.startsWith('http') || img.startsWith('/')) ? img : `http://localhost:3000/uploads/${img}`}
                            alt={`Imagem do projeto ${idx+1}`}
                            style={{
                              width: 40,
                              height: 40,
                              borderRadius: '10px',
                              objectFit: 'contain',
                              position: arr.length === 2 ? 'absolute' : 'static',
                              left: arr.length === 2 ? (idx === 0 ? 0 : 12) : undefined,
                              top: arr.length === 2 ? (idx === 0 ? 0 : 8) : undefined,
                              zIndex: 2 - idx,
                              transform: arr.length === 2 ? (idx === 0 ? 'rotate(-8deg)' : 'rotate(8deg)') : 'none'
                            }}
                            onError={e => { e.target.onerror = null; e.target.src = 'https://via.placeholder.com/40?text=Sem+Imagem'; }}
                          />
                        ))}
                      </div>
                    ) : p.imagem ? (
                      <img
                        src={p.imagem && (p.imagem.startsWith('http') || p.imagem.startsWith('/')) ? p.imagem : `http://localhost:3000/uploads/${p.imagem}`}
                        alt="Imagem do projeto"
                        style={{ width: 40, height: 40, borderRadius: '10px', objectFit: 'contain', display: 'block', margin: '0 auto' }}
                        onError={e => { e.target.onerror = null; e.target.src = 'https://via.placeholder.com/40?text=Sem+Imagem'; }}
                      />
                    ) : (
                      <Folder className="text-primary-primary" size={24} style={{ display: 'block', margin: '0 auto' }} />
                    )}
                  </div>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div className="d-flex align-items-center gap-2 mb-1">
                      <span className="fw-bold fs-5 " style={{ color: 'var(--primary-primary)', letterSpacing: 0.2 }}>{p.nome.length > 20 ? `${p.nome.slice(0, 20)}...` : p.nome}</span>
                    </div>
                    {p.descricao && (
                      <div className="mb-1 text-secondary" style={{ wordBreak: 'break-word', maxWidth: 320, color: 'var(--text-light)', fontSize: '10px', lineHeight: 1.3 }}>
                        {p.descricao}
                      </div>
                    )}
                    <div className="d-flex flex-row gap-3 align-items-center  mb-1" style={{ fontSize: 10, color: 'var(--text-light)' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <div><b>Criado:</b> {p.createdAt ? new Date(p.createdAt).toLocaleDateString() : '-'}</div>
                        <div><b>Matérias:</b> {Array.isArray(p.materias) ? p.materias.length : '-'}</div>
                      </div>
                    </div>
                  </div>
                </div>
                {/* Rodapé: Ações (removido, agora os botões estão no topo direito) */}
              </div>
            </div>
          ))}
          <div className="col-12 col-sm-6 col-md-4 col-lg-3">
            {/* Card vazio para adicionar novo projeto */}
            {!showNovoProjetoForm && (
              <div className="pointer fadein" style={{ animationDelay: `${projetos.length * 0.1}s`, height: '100%' }}>
                <div
                  style={{ 
                    minHeight: '120px', 
                    height: '100%', 
                    opacity: projetos.length >= 3 ? 0.5 : 1, 
                    pointerEvents: projetos.length >= 3 ? 'none' : 'auto'
                  }}
                  className="card-padrao-vazio p-3 d-flex flex-column justify-content-center align-items-center  position-relative"
                  onClick={() => {
                    if (projetos.length < 3) setShowNovoProjetoForm(true);
                  }}
                >
                  <span className="fw-bold fs-6 text-secondary text-center"> + Adicionar Novo Projeto</span>
                  <span className="fs-6 text-secondary mt-2 text-center" >{projetos.length >= 3 ? 'Limite de 3 projetos atingido' : 'Clique para cadastrar um novo projeto'}</span>
                </div>
              </div>
            )}
          </div>

        </div>
        {/* ...nenhuma badge extra... */}
      </main>
      {/* Modal de edição do nome do projeto */}
      <Modal className='modal-fundo' show={showEditModal} onHide={() => setShowEditModal(false)} centered backdrop="static">
        <Modal.Body className='modal-estilo'>
          <div className="d-flex justify-content-between align-items-center mb-1">
            <Modal.Title className='fw-bold fs-5 m-0'>Editar Projeto</Modal.Title>
          </div>
          <p className="text-secondary mb-4" style={{ fontSize: '0.8em' }}>Altere o nome de identificação do projeto. Use iniciais ou siglas curtas (máx. 7 caracteres).</p>
          <form className="needs-validation" noValidate onSubmit={async e => {
            e.preventDefault();
            if (!novoNomeProjeto.trim() || projetos.some(p => p.nome === novoNomeProjeto && p.id !== editandoId)) {
              e.target.classList.add('was-validated');
              return;
            }
            await handleSalvarNomeProjeto(editandoId);
          }}>
            <label className="form-label fw-semibold" style={{ fontSize: '0.78em', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-light)' }}>Nome</label>
            <input
              type="text"
              className="linha form-control w-100 mb-2"
              value={novoNomeProjeto}
              onChange={e => setNovoNomeProjeto(e.target.value.slice(0, 7))}
              placeholder="Ex: PF, TRF, PCSP"
              required
              maxLength={9}
            />
            {novoNomeProjeto && projetos.some(p => p.nome === novoNomeProjeto && p.id !== editandoId) && (
              <div className="text-danger small mb-2">Já existe um projeto com esse nome.</div>
            )}
            <div className="d-flex justify-content-end gap-2 mt-3">
              <button type="button" onClick={() => setShowEditModal(false)} className="btn btn-outline-primary-primary3">
                Cancelar
              </button>
              <button type="submit" className="btn btn-primary-primary3" disabled={projetos.some(p => p.nome === novoNomeProjeto && p.id !== editandoId)}>
                Salvar
              </button>
            </div>
          </form>
        </Modal.Body>
      </Modal>
      {/* Modal para criar plano personalizado (nome do novo projeto) */}
      <Modal className='modal-fundo' show={showAddModal} onHide={() => setShowAddModal(false)} centered backdrop="static">
        <Modal.Body className='modal-estilo'>
          <div className="d-flex justify-content-between align-items-center mb-1">
            <Modal.Title className='fw-bold fs-5 m-0'>Criar projeto personalizado</Modal.Title>
          </div>
          <p className="text-secondary mb-4" style={{ fontSize: '0.8em' }}>Crie um projeto do zero para organizar suas matérias. Use iniciais ou siglas curtas para facilitar a identificação (máx. 9 caracteres).</p>
          <form className="needs-validation" noValidate onSubmit={handleAddProjeto}>
            <label className="form-label fw-semibold" style={{ fontSize: '0.78em', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-light)' }}>Nome do projeto</label>
            <input
              type="text"
              value={novoProjeto}
              onChange={e => setNovoProjeto(e.target.value.slice(0, 9))}
              placeholder="Ex: PF, PCSP, TRF"
              className="form-control linha mb-2"
              maxLength={9}
              required
            />
            {novoProjeto && projetos.some(p => p.nome === novoProjeto) && (
              <div className="text-danger small mb-2">Já existe um projeto com esse nome.</div>
            )}
            <div className="d-flex justify-content-end gap-2 mt-3">
              <button type="button" className="btn btn-outline-primary-primary3" onClick={() => setShowAddModal(false)}>Cancelar</button>
              <button type="submit" className="btn btn-primary-primary3" disabled={projetos.some(p => p.nome === novoProjeto)}>Adicionar</button>
            </div>
          </form>
        </Modal.Body>
      </Modal>
    </div>
  );
  // End of Projeto component
}
export default Projeto;

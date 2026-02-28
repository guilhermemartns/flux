import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPenToSquare } from '@fortawesome/free-solid-svg-icons';
import { PALETAS } from './edital';
import { useEffect as useEffect2 } from 'react';
import { usePageTitle } from '../../components/PageTitleContext';
import { Button, Modal, Form } from 'react-bootstrap';
import api from '../../services/api';


const Inserir = () => {
  const [descricaoProjetoPadrao, setDescricaoProjetoPadrao] = useState('');
  const dropdownRef = React.useRef();
  const [showCarreiraDropdown, setShowCarreiraDropdown] = useState(false);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowCarreiraDropdown(false);
      }
    }
    if (showCarreiraDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showCarreiraDropdown]);
  const [showEditarCarreiraModal, setShowEditarCarreiraModal] = useState(false);
  const [carreiraEditando, setCarreiraEditando] = useState(null);
  const [novoNomeCarreira, setNovoNomeCarreira] = useState('');
  // Estado para matérias do projeto padrão (nome, cor, edital)
  const [materiasProjeto, setMateriasProjeto] = useState([]);
  const [anoProjetoPadrao, setAnoProjetoPadrao] = useState('');
  const [cargoProjetoPadrao, setCargoProjetoPadrao] = useState('');
  const [imagemProjetoPadrao, setImagemProjetoPadrao] = useState(null);
  const [uploadingImagem, setUploadingImagem] = useState(false);
  // Estado para edição de edital de matéria
  const [editandoIdx, setEditandoIdx] = useState(null);
  const [novoEdital, setNovoEdital] = useState('');
  const [showMateriaModal, setShowMateriaModal] = useState(false);
  const [materiaNome, setMateriaNome] = useState('');
  const [materiaCor, setMateriaCor] = useState('#71dd8c');
  const [materiaEdital, setMateriaEdital] = useState('');
  const [editMateriaIdx, setEditMateriaIdx] = useState(null);
  const { setTitle } = usePageTitle();
  useEffect2(() => {
    setTitle('Painel de Inserção');
    // eslint-disable-next-line
  }, []);
  const [tipo, setTipo] = useState('projetoPadrao');
  const [showModal, setShowModal] = useState(false);
  // Projeto Padrão
  const [projetosPadrao, setProjetosPadrao] = useState([]);
  const [nomeProjetoPadrao, setNomeProjetoPadrao] = useState('');
  const [materias, setMaterias] = useState([]);
  const [editProjetoIdx, setEditProjetoIdx] = useState(null);
  // Dicas
  const [dicasSidebar, setDicasSidebar] = useState([]);
  const [showDicaModal, setShowDicaModal] = useState(false);
  const [dicasTexto, setDicasTexto] = useState('');
  const [categorias, setCategorias] = useState([]);
  const [categoriaId, setCategoriaId] = useState('');
  // Carreiras vindas do backend
  const [carreiras, setCarreiras] = useState([]);
  const [carreiraSelecionada, setCarreiraSelecionada] = useState(''); // filtro da tabela
  const [carreiraSelecionadaModal, setCarreiraSelecionadaModal] = useState(''); // seleção do modal
  const [showCarreiraModal, setShowCarreiraModal] = useState(false);
  const [novaCarreira, setNovaCarreira] = useState('');

  useEffect(() => {
    // Carregar projetos padrão
    api.get('/projetos-padrao').then(res => setProjetosPadrao(res.data || []));
    // Se estava editando, atualiza o campo de descrição do modal com o valor salvo
    if (editProjetoIdx !== null) {
      api.get('/projetos-padrao').then(atualizados => {
        const projetoEditado = atualizados.data[editProjetoIdx];
        setDescricaoProjetoPadrao(projetoEditado?.descricao || '');
      });
    }
    // Carregar dicas
    api.get('/dicas-sidebar').then(res => setDicasSidebar(res.data || []));
    // Carregar categorias de dica
    api.get('/categorias-dica-sidebar').then(res => setCategorias(res.data || []));
    // Carregar carreiras
    api.get('/carreiras')
      .then(res => setCarreiras(res.data || []))
      .catch(() => setCarreiras([]));
  }, []);

  // Inserir Projeto Padrão
  async function handleSalvarProjetoPadrao() {
    const token = JSON.parse(localStorage.getItem('user'))?.token;
    setUploadingImagem(true);
    try {
      const materiasCorrigidas = materiasProjeto.map(m => ({
        nome: m.nome || '',
        conteudos: Array.isArray(m.edital) ? m.edital : [],
        cor: m.cor || '#71dd8c'
      }));
      const carreiraId = carreiraSelecionadaModal ? carreiraSelecionadaModal : null;
      let imagemNome = '';
      let payload = { nome: nomeProjetoPadrao, descricao: descricaoProjetoPadrao, materias: materiasCorrigidas, carreiraId };
      if (anoProjetoPadrao) payload.ano = anoProjetoPadrao;
      if (cargoProjetoPadrao) payload.cargo = cargoProjetoPadrao;

      if (editProjetoIdx !== null) {
        // Editar projeto existente
        const id = projetosPadrao[editProjetoIdx].id;
        // Se o usuário selecionou uma nova imagem, faz upload e usa o novo nome
        if (imagemProjetoPadrao) {
          const formData = new FormData();
          formData.append('imagem', imagemProjetoPadrao);
          const res = await api.post('/upload-imagem-projeto', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
          imagemNome = res.data.filename;
          payload.imagem = imagemNome;
        } else if (projetosPadrao[editProjetoIdx]?.imagem) {
          // Se não selecionou nova imagem, mantém a anterior
          payload.imagem = projetosPadrao[editProjetoIdx].imagem;
        }
        await api.put(`/projetos-padrao/${id}`, payload, { headers: { Authorization: `Bearer ${token}` } });
        setProjetosPadrao(prev => prev.map((proj, idx) => idx === editProjetoIdx ? { ...proj, descricao: descricaoProjetoPadrao } : proj));
      } else {
        // Novo projeto
        if (imagemProjetoPadrao) {
          const formData = new FormData();
          formData.append('imagem', imagemProjetoPadrao);
          const res = await api.post('/upload-imagem-projeto', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
          imagemNome = res.data.filename;
          payload.imagem = imagemNome;
        }
        await api.post('/projetos-padrao', payload, { headers: { Authorization: `Bearer ${token}` } });
      }
      setNomeProjetoPadrao('');
      setCarreiraSelecionada('');
      setMaterias([]);
      setEditProjetoIdx(null);
      setAnoProjetoPadrao('');
      setCargoProjetoPadrao('');
      setShowModal(false);
      api.get('/projetos-padrao').then(res => setProjetosPadrao(res.data || []));
    } catch (error) {
      alert('Erro ao salvar projeto padrão');
    } finally {
      setUploadingImagem(false);
    }
  }

  // Inserir Dicas
  async function handleInserirDicas() {
    const token = JSON.parse(localStorage.getItem('user'))?.token;
    if (!dicasTexto || !categoriaId) return;
    const dicasArray = dicasTexto.split('\n').map(t => t.trim()).filter(t => t);
    await api.post('/dicas-sidebar', { dicas: dicasArray.map(texto => ({ texto, categoriaId })) }, { headers: { Authorization: `Bearer ${token}` } });
    setDicasTexto('');
    setCategoriaId('');
    setShowDicaModal(false);
    api.get('/dicas-sidebar').then(res => setDicasSidebar(res.data || []));
  }

  // Apagar Projeto Padrão
  async function handleApagarProjetoPadrao(id) {
    if (!window.confirm('Tem certeza que deseja apagar este projeto padrão? Essa ação não pode ser desfeita.')) return;
    const token = JSON.parse(localStorage.getItem('user'))?.token;
    try {
      await api.delete(`/projetos-padrao/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      setProjetosPadrao(projetosPadrao.filter(p => p.id !== id));
    } catch (error) {
      alert('Erro ao apagar projeto padrão');
    }
  }

  return (
    <div className="container mt-4">
      <div className="mb-3 d-flex gap-2">
        <Button variant={tipo === 'projetoPadrao' ? 'primary' : 'outline-primary'} onClick={() => setTipo('projetoPadrao')}>Projetos Padrão</Button>
        <Button variant={tipo === 'dicasSidebar' ? 'primary' : 'outline-primary'} onClick={() => setTipo('dicasSidebar')}>Dicas Sidebar</Button>
      </div>
      {tipo === 'projetoPadrao' && (
        <>
          <strong className="mb-2 d-block m-0 ">PROJETOS PADRÃO</strong>
          {/* Filtro de carreira */}
          <div className="d-flex align-items-center mb-3" style={{ gap: 12 }}>
            <span className="fw-bold fs-6">Filtrar por carreira</span>
            <Form.Select
              className="linha"
              style={{ maxWidth: 320 }}
              value={carreiraSelecionada || ''}
              onChange={e => setCarreiraSelecionada(e.target.value)}
            >
              <option value="">Todas as carreiras</option>
              {carreiras.map(c => (
                <option key={c.id} value={c.id}>{c.nome}</option>
              ))}
            </Form.Select>
          </div>
          <div className="rounded-3 overflow-hidden">
            <table className="table table-bordered flex-grow-1 m-0">
              <thead className="table-light">
                <tr>
                  <th className="text-center p-1">Nome</th>
                  <th className="text-center p-1">Matérias</th>
                  <th className="text-center p-1">Ações</th>
                </tr>
              </thead>
              <tbody>
                {projetosPadrao.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="text-secondary text-center p-3">Nenhum projeto padrão cadastrado.</td>
                  </tr>
                ) : (
                  projetosPadrao
                    .filter(p => !carreiraSelecionada || p.carreiraId === carreiraSelecionada)
                    .map((p, idx) => (
                      <tr key={p.id} className={idx % 2 === 1 ? 'bg-secondary bg-opacity-10' : ''}>
                        <td className="text-center align-middle p-1 fw-semibold text-primary">{p.nome}</td>
                        <td className="text-center align-middle p-1" >
                          {p.Materias && p.Materias.length > 0 ? (
                            <span>{p.Materias.map(m => m.nome.length > 20 ? m.nome.slice(0, 20) + '...' : m.nome).join(', ')}</span>
                          ) : (
                            <span>Nenhuma matéria</span>
                          )}
                        </td>
                        <td className="text-center align-middle p-1">
                          <div className="d-flex justify-content-center align-items-center gap-2">
                            <Button variant="outline-primary" size="sm" onClick={async () => {
                              // Limpa todos os campos antes de preencher com o novo projeto
                              setNomeProjetoPadrao('');
                              setDescricaoProjetoPadrao('');
                              setAnoProjetoPadrao('');
                              setCargoProjetoPadrao('');
                              setImagemProjetoPadrao(null);
                              setCarreiraSelecionadaModal('');
                              setMateriasProjeto([]);
                              setEditProjetoIdx(null);
                              // Agora preenche com os dados do projeto selecionado
                              setEditProjetoIdx(idx);
                              try {
                                const res = await api.get(`/projetos-padrao/${p.id}`);
                                const projeto = res.data;
                                setNomeProjetoPadrao(projeto.nome || '');
                                setDescricaoProjetoPadrao(
                                  projeto.descricao !== undefined ? projeto.descricao : (p.descricao || '')
                                );
                                setMateriasProjeto((projeto.materias || []).map(m => ({
                                  nome: m.nome || '',
                                  cor: m.cor || '#71dd8c',
                                  edital: Array.isArray(m.edital) ? m.edital : (m.conteudos || [])
                                })));
                                setAnoProjetoPadrao(projeto.ano || '');
                                setCargoProjetoPadrao(projeto.cargo || '');
                                if (projeto.carreiraId) setCarreiraSelecionadaModal(projeto.carreiraId);
                              } catch (err) {
                                setNomeProjetoPadrao(p.nome);
                                setDescricaoProjetoPadrao(p.descricao || '');
                                setMateriasProjeto((p.materias || []).map(m => typeof m === 'object' ? m : { nome: m, cor: '#71dd8c', edital: [] }));
                                setAnoProjetoPadrao(p.ano || '');
                                setCargoProjetoPadrao(p.cargo || '');
                                if (p.carreiraId) setCarreiraSelecionadaModal(p.carreiraId);
                              }
                              setShowModal(true);
                            }}>
                              Editar
                            </Button>
                            <Button variant="outline-danger" size="sm" onClick={() => handleApagarProjetoPadrao(p.id)}>
                              Apagar
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                )}
                <tr>
                  <td colSpan={3} className="p-0 ">
                    <div
                      className=" d-flex align-items-center justify-content-center my-2 py-2 px-3 pointer text-secondary fst-italic"
                      onClick={() => {
                        setShowModal(true);
                        setEditProjetoIdx(null);
                        setNomeProjetoPadrao('');
                        setDescricaoProjetoPadrao('');
                        setMaterias([]);
                        setMateriasProjeto([]);
                        setImagemProjetoPadrao(null);
                        setCarreiraSelecionadaModal('');
                      }}
                      onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.09)'}
                      onMouseOut={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
                    >
                      <span className="fw-semibold text-primary ">+ Inserir Projeto Padrão</span>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <Modal show={showModal} onHide={() => setShowModal(false)} centered size="lg">
            <Modal.Header closeButton>
              <Modal.Title>{editProjetoIdx !== null ? 'Editar Projeto Padrão' : 'Inserir Projeto Padrão'}</Modal.Title>
            </Modal.Header>
            <Modal.Body >
              <div>
                <div className="d-flex align-items-center mb-4" style={{ gap: 10 }}>
                  <span className="fw-bold fs-6">Nome:</span>
                  <Form.Control type="text" className='linha' value={nomeProjetoPadrao} onChange={e => setNomeProjetoPadrao(e.target.value)} size="sm" style={{ maxWidth: 180 }} />
                  <span className="fw-bold fs-6 ms-2">Ano:</span>
                  <Form.Control type="number" className='linha' value={anoProjetoPadrao} onChange={e => setAnoProjetoPadrao(e.target.value)} size="sm" style={{ maxWidth: 80 }} min="1900" max="2100" />
                  <span className="fw-bold fs-6 ms-2">Cargo:</span>
                  <Form.Control type="text" className='linha' value={cargoProjetoPadrao} onChange={e => setCargoProjetoPadrao(e.target.value)} size="sm" style={{ maxWidth: 120 }} />
                </div>

                <div className="d-flex align-items-center mb-4" style={{ gap: 10 }}>
                  <span className="fw-bold fs-6">Descrição:</span>
                  <Form.Control type="text" className='linha' value={descricaoProjetoPadrao} onChange={e => setDescricaoProjetoPadrao(e.target.value)} size="sm" style={{ maxWidth: 220 }} />


                  <span className="fw-bold fs-6 ">Carreira:</span>
                  <div style={{ position: 'relative', maxWidth: 320 }} ref={dropdownRef}>
                    <div className="dropdown-custom" style={{ position: 'relative' }}>
                      <button type="button" className="form-select linha text-start" style={{ minHeight: 38, width: '200px' }} onClick={() => setShowCarreiraDropdown(v => !v)}>
                        {carreiras.find(c => c.id === carreiraSelecionadaModal)?.nome || 'Selecione a carreira'}
                      </button>
                      <div className='text-dark' style={{ position: 'absolute', zIndex: 10, background: '#fff', border: '1px solid #ddd', borderRadius: 8, width: '100%', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', display: showCarreiraDropdown ? 'block' : 'none' }}>
                        {carreiras.map(opt => (
                          <div key={opt.id || opt.value} className="d-flex align-items-center justify-content-between px-2 py-2" style={{ cursor: 'pointer', borderBottom: '1px solid #f2f2f2' }}>
                            <span className="d-flex align-items-center" style={{ flex: 1 }}>
                              <span onClick={() => { setCarreiraSelecionadaModal(opt.id); setShowCarreiraDropdown(false); }}>{opt.nome || opt.label}</span>
                              <FontAwesomeIcon icon={faPenToSquare} style={{ color: 'var(--primary-primary)', marginLeft: 10, cursor: 'pointer' }} title="Editar carreira"
                                onClick={e => {
                                  e.stopPropagation();
                                  setCarreiraEditando(opt);
                                  setNovoNomeCarreira(opt.nome || '');
                                  setShowEditarCarreiraModal(true);
                                }} />
                            </span>
                            <span style={{ color: '#dc3545', marginLeft: 8 }} title={`Apagar carreira: ${opt.nome || opt.label}`}
                              onClick={async e => {
                                e.stopPropagation();
                                if (window.confirm('Deseja realmente apagar esta carreira? Todos os projetos padrão relacionados também serão apagados.')) {
                                  try {
                                    const token = JSON.parse(localStorage.getItem('user'))?.token;
                                    await api.delete(`/carreiras/${opt.id}`, { headers: { Authorization: `Bearer ${token}` } });
                                    setCarreiras(carreiras.filter(c => c.id !== opt.id));
                                    setProjetosPadrao(projetosPadrao.filter(p => p.carreiraId !== opt.id));
                                    if (carreiraSelecionada === opt.id) setCarreiraSelecionada('');
                                    setShowCarreiraDropdown(false);
                                  } catch (err) {
                                    alert('Erro ao apagar carreira');
                                  }
                                }
                              }}>
                              <span style={{ fontWeight: 'bold', fontSize: 18 }}>×</span>
                            </span>
                          </div>
                        ))}


                        {showEditarCarreiraModal && carreiraEditando && (
                          <Modal show={showEditarCarreiraModal} onHide={() => setShowEditarCarreiraModal(false)} centered>
                            <Modal.Header closeButton>
                              <Modal.Title>Editar nome da carreira</Modal.Title>
                            </Modal.Header>
                            <Modal.Body>
                              <Form.Group className="mb-3">
                                <Form.Label>Novo nome</Form.Label>
                                <Form.Control type="text" value={novoNomeCarreira} onChange={e => setNovoNomeCarreira(e.target.value)} />
                              </Form.Group>
                            </Modal.Body>
                            <Modal.Footer>
                              <Button variant="secondary" onClick={() => setShowEditarCarreiraModal(false)}>Cancelar</Button>
                              <Button variant="primary" onClick={async () => {
                                if (!novoNomeCarreira.trim()) return;
                                try {
                                  const token = JSON.parse(localStorage.getItem('user'))?.token;
                                  const res = await api.put(`/carreiras/${carreiraEditando.id}`, { nome: novoNomeCarreira }, { headers: { Authorization: `Bearer ${token}` } });
                                  setCarreiras(carreiras.map(c => c.id === carreiraEditando.id ? { ...c, nome: res.data.nome } : c));
                                  setShowEditarCarreiraModal(false);
                                } catch (err) {
                                  alert('Erro ao editar carreira');
                                }
                              }}>Salvar</Button>
                            </Modal.Footer>
                          </Modal>
                        )}
                        <div className="px-2 py-2" style={{ cursor: 'pointer', color: 'var(--primary-primary)' }} onClick={() => { setShowCarreiraModal(true); setShowCarreiraDropdown(false); }}>
                          + Inserir carreira
                        </div>
                      </div>
                    </div>
                  </div>


                </div>
                <div className="d-flex align-items-center mb-4" style={{ gap: 12 }}>
                  <span className="fw-bold fs-6">Imagem: </span>
                  <Form.Control type="file" accept="image/*" style={{ maxWidth: 320 }}
                    disabled={uploadingImagem}
                    onChange={e => {
                      if (e.target.files && e.target.files[0]) {
                        setImagemProjetoPadrao(e.target.files[0]);
                      } else {
                        setImagemProjetoPadrao(null);
                      }
                    }}
                  />
                  {/* Exibe prévia da imagem nova OU da imagem salva ao editar */}
                  {imagemProjetoPadrao ? (
                    <img src={URL.createObjectURL(imagemProjetoPadrao)} alt="Prévia" style={{ maxHeight: 60, marginLeft: 16, borderRadius: 8 }} />
                  ) : (editProjetoIdx !== null && projetosPadrao[editProjetoIdx]?.imagem ? (
                    <img src={projetosPadrao[editProjetoIdx].imagem} alt="Imagem salva" style={{ maxHeight: 60, marginLeft: 16, borderRadius: 8 }} />
                  ) : null)}
                </div>

                <Modal show={showCarreiraModal} onHide={() => setShowCarreiraModal(false)} centered>
                  <Modal.Header closeButton>
                    <Modal.Title>Inserir nova carreira</Modal.Title>
                  </Modal.Header>
                  <Modal.Body>
                    <Form.Group className="mb-3">
                      <Form.Label>Nome da carreira</Form.Label>
                      <Form.Control type="text" value={novaCarreira} onChange={e => setNovaCarreira(e.target.value)} />
                    </Form.Group>
                  </Modal.Body>
                  <Modal.Footer >
                    <Button variant="secondary" onClick={() => setShowCarreiraModal(false)}>Cancelar</Button>
                    <Button variant="primary" onClick={async () => {
                      if (!novaCarreira.trim()) return;
                      try {
                        const res = await api.post('/carreiras', { nome: novaCarreira });
                        setCarreiras([...carreiras, res.data]);
                        // Não altera o filtro da tabela ao inserir carreira
                        setNovaCarreira('');
                        setShowCarreiraModal(false);
                      } catch (err) {
                        alert('Erro ao inserir carreira');
                      }
                    }}>Salvar</Button>
                  </Modal.Footer>
                </Modal>
                <div className="mb-4  p-3 rounded-3" style={{ background: 'var(--background-light)' }}>
                  <div className="mb-2 fw-semibold fs-6">Adicionar Matéria</div>
                  <Form.Group className="mb-2">
                    <div className="d-flex align-items-center" style={{ gap: 12 }}>
                      <Form.Label className="mb-0">1º Nome da matéria:</Form.Label>
                      <Form.Control type="text" className='linha' value={materiaNome} onChange={e => setMateriaNome(e.target.value)} style={{ maxWidth: 260 }} />
                    </div>
                  </Form.Group>
                  <Form.Group className="mb-2">
                    <div className="d-flex align-items-center" style={{ gap: 12 }}>
                      <Form.Label className="mb-0">2º Cor:</Form.Label>
                      <div className="d-flex flex-wrap gap-2">
                        {Array.from(new Set(PALETAS.flat())).map((cor, idx) => (
                          <span key={idx} style={{ background: cor, width: 20, height: 20, borderRadius: '50%', display: 'inline-block', cursor: 'pointer', border: materiaCor === cor ? '2px solid #333' : '1px solid #fff', boxShadow: materiaCor === cor ? '0 0 6px #333' : 'none', transition: 'border 0.2s' }}
                            title={cor}
                            onClick={() => setMateriaCor(cor)}
                          />
                        ))}
                      </div>
                      <span className="ms-2 small text-muted">{materiaCor}</span>
                    </div>
                  </Form.Group>
                  <Form.Group className="mb-2">
                    <Form.Label>3º Edital:</Form.Label>
                    <Form.Control as="textarea" className='linha' rows={2} value={materiaEdital} onChange={e => setMateriaEdital(e.target.value)} />
                  </Form.Group>
                  <div className="mt-3 text-end">
                    <button className="btn btn-primary-primary" style={{ minWidth: 120 }} onClick={() => {
                      if (!materiaNome) return alert('Informe o nome da matéria');
                      const editalArray = materiaEdital.split('\n').map(e => e.trim()).filter(e => e);
                      setMateriasProjeto([...materiasProjeto, { nome: materiaNome, cor: materiaCor, edital: editalArray }]);
                      setMateriaNome('');
                      setMateriaCor('#71dd8c');
                      setMateriaEdital('');
                    }}>Adicionar</button>
                  </div>
                </div>
                <span className="fs-6 fw-bold mb-2 d-block">Matérias Adicionadas</span>
                <div className="overflow-auto rounded" style={{ maxHeight: '25vh' }}>

                  <table className="table table-bordered table-sm m-0" style={{ fontSize: '0.92em', minWidth: 400, width: '100%' }}>
                    <thead className="table-light">
                      <tr>
                        <th className="text-center">Matéria</th>
                        <th className="text-center">Cor</th>
                        <th className="text-center">Edital</th>
                        <th className="text-center">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {materiasProjeto.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="text-secondary text-center p-3">Nenhuma matéria cadastrada.</td>
                        </tr>
                      ) : (
                        materiasProjeto.map((mat, idx) => (
                          <tr key={idx} className={idx % 2 === 1 ? 'bg-light' : ''}>
                            {/* Nome da matéria */}
                            <td className="text-center align-middle fw-semibold text-primary">
                              <div className="d-flex align-items-center justify-content-center" style={{ gap: 8 }}>
                                {editandoIdx === `nome-${idx}` ? (
                                  <>
                                    <Form.Control
                                      type="text"
                                      value={novoEdital}
                                      onChange={e => setNovoEdital(e.target.value)}
                                      size="sm"
                                      style={{ maxWidth: 140, fontSize: '0.95em' }}
                                    />
                                    <Button variant="success" size="sm" style={{ padding: '2px 10px', fontSize: '0.95em' }} onClick={() => {
                                      const novas = materiasProjeto.map((m, i) => i === idx ? { ...m, nome: novoEdital } : m);
                                      setMateriasProjeto(novas);
                                      setEditandoIdx(null);
                                    }}>✔</Button>
                                    <Button variant="secondary" size="sm" style={{ padding: '2px 10px', fontSize: '0.95em' }} onClick={() => setEditandoIdx(null)}>✖</Button>
                                  </>
                                ) : (
                                  <>
                                    <span>{mat.nome}</span>
                                    <span style={{ cursor: 'pointer', marginLeft: 6, color: 'var(--text-light)', transition: 'color 0.2s' }} title="Editar nome" onClick={() => {
                                      setEditandoIdx(`nome-${idx}`);
                                      setNovoEdital(mat.nome);
                                    }}
                                      onMouseOver={e => e.currentTarget.style.color = 'var(--primary-primary)'}
                                      onMouseOut={e => e.currentTarget.style.color = 'var(--text-light)'}
                                    >
                                      <FontAwesomeIcon icon={faPenToSquare} />
                                    </span>
                                  </>
                                )}
                              </div>
                            </td>
                            {/* Cor da matéria */}
                            <td className="text-center align-middle">
                              <div className="d-flex align-items-center justify-content-center" style={{ gap: 8 }}>
                                {editandoIdx === `cor-${idx}` ? (
                                  <>
                                    <Form.Select
                                      value={novoEdital}
                                      onChange={e => setNovoEdital(e.target.value)}
                                      size="sm"
                                      style={{ maxWidth: 110, fontSize: '0.95em' }}
                                    >
                                      {Array.from(new Set(PALETAS.flat())).map((cor, i) => (
                                        <option key={i} value={cor}>{cor}</option>
                                      ))}
                                    </Form.Select>
                                    <Button variant="success" size="sm" style={{ padding: '2px 10px', fontSize: '0.95em' }} onClick={() => {
                                      const novas = materiasProjeto.map((m, i) => i === idx ? { ...m, cor: novoEdital } : m);
                                      setMateriasProjeto(novas);
                                      setEditandoIdx(null);
                                    }}>✔</Button>
                                    <Button variant="secondary" size="sm" style={{ padding: '2px 10px', fontSize: '0.95em' }} onClick={() => setEditandoIdx(null)}>✖</Button>
                                  </>
                                ) : (
                                  <>
                                    <span style={{ background: mat.cor, borderRadius: '6px', padding: '0.4em 1em', color: '#fff', fontWeight: 600 }}>{mat.cor}</span>
                                    <span style={{ cursor: 'pointer', marginLeft: 6, color: 'var(--text-light)', transition: 'color 0.2s' }} title="Editar cor" onClick={() => {
                                      setEditandoIdx(`cor-${idx}`);
                                      setNovoEdital(mat.cor);
                                    }}
                                      onMouseOver={e => e.currentTarget.style.color = 'var(--primary-primary)'}
                                      onMouseOut={e => e.currentTarget.style.color = 'var(--text-light)'}
                                    >
                                      <FontAwesomeIcon icon={faPenToSquare} />
                                    </span>
                                  </>
                                )}
                              </div>
                            </td>
                            {/* Edital da matéria */}
                            <td className="text-center align-middle">
                              <div className="d-flex align-items-center justify-content-center" style={{ gap: 8 }}>
                                {editandoIdx === `edital-${idx}` ? (
                                  <>
                                    <Form.Control
                                      as="textarea"
                                      rows={2}
                                      value={novoEdital}
                                      onChange={e => setNovoEdital(e.target.value)}
                                      placeholder="Itens do edital, um por linha"
                                      className="mb-2"
                                      style={{ fontSize: '0.95em', minWidth: 160, maxWidth: 220 }}
                                    />
                                    <Button variant="success" size="sm" style={{ padding: '2px 10px', fontSize: '0.95em' }} onClick={() => {
                                      const editalArray = novoEdital.split('\n').map(e => e.trim()).filter(e => e);
                                      const novas = materiasProjeto.map((m, i) => i === idx ? { ...m, edital: editalArray } : m);
                                      setMateriasProjeto(novas);
                                      setEditandoIdx(null);
                                    }}>✔</Button>
                                    <Button variant="secondary" size="sm" style={{ padding: '2px 10px', fontSize: '0.95em' }} onClick={() => setEditandoIdx(null)}>✖</Button>
                                  </>
                                ) : (
                                  <>
                                    {Array.isArray(mat.edital) && mat.edital.length > 0 ? (
                                      <ul className="mb-0 ps-2" style={{ fontSize: '0.95em', listStyle: 'disc inside', paddingLeft: 0 }}>
                                        {mat.edital.slice(0, 2).map((item, i) => (
                                          <li key={i} title={item} style={{ marginBottom: 2 }}>
                                            {item.length > 20 ? item.slice(0, 20) + '...' : item}
                                          </li>
                                        ))}
                                        {mat.edital.length > 2 && (
                                          <li className="text-muted">...</li>
                                        )}
                                      </ul>
                                    ) : (
                                      <span className="text-muted">Nenhum item</span>
                                    )}
                                    <span style={{ cursor: 'pointer', marginLeft: 6, color: 'var(--text-light)', transition: 'color 0.2s' }} title="Editar edital" onClick={() => {
                                      setEditandoIdx(`edital-${idx}`);
                                      setNovoEdital(Array.isArray(mat.edital) ? mat.edital.join('\n') : '');
                                    }}
                                      onMouseOver={e => e.currentTarget.style.color = 'var(--primary-primary)'}
                                      onMouseOut={e => e.currentTarget.style.color = 'var(--text-light)'}
                                    >
                                      <FontAwesomeIcon icon={faPenToSquare} />
                                    </span>
                                  </>
                                )}
                              </div>
                            </td>
                            {/* Apagar matéria */}
                            <td className="text-center align-middle">
                              <Button variant="outline-danger" size="sm" onClick={() => {
                                const nova = materiasProjeto.filter((_, i) => i !== idx);
                                setMateriasProjeto(nova);
                              }}>Apagar</Button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </Modal.Body>
            <Modal.Footer>
              <button className="btn btn-outline-primary-primary" onClick={() => {
                setShowModal(false);
                setEditProjetoIdx(null);
                setNomeProjetoPadrao('');
                setDescricaoProjetoPadrao('');
                setMaterias([]);
                setMateriasProjeto([]);
                setCarreiraSelecionadaModal('');
              }}>Cancelar</button>
              <button className="btn btn-primary-primary" onClick={handleSalvarProjetoPadrao} disabled={uploadingImagem}>
                {uploadingImagem ? 'Salvando...' : (editProjetoIdx !== null ? 'Salvar Alterações' : 'Salvar Projeto Padrão')}
              </button>
            </Modal.Footer>
          </Modal>
        </>
      )}

      {tipo === 'dicasSidebar' && (
        <>
          <strong className="mb-2 d-block m-0">DICAS SIDEBAR</strong>
          <div className="mb-3">
            <Button variant="primary" onClick={() => setShowDicaModal(true)}>
              + Inserir Dicas Sidebar
            </Button>
          </div>
          <table className="w-100 border-0 rounded-3 flex-grow-1">
            <thead>
              <tr>
                <th className="text-center p-1">Categoria</th>
                <th className="text-center p-1">Dica</th>
              </tr>
            </thead>
            <tbody>
              {categorias.length === 0 ? (
                <tr>
                  <td colSpan={2} className="text-secondary text-center p-3">Nenhuma categoria cadastrada.</td>
                </tr>
              ) : (
                categorias.flatMap((cat, catIdx) => {
                  const dicasCat = dicasSidebar.filter(d => d.categoriaId === cat.id);
                  return dicasCat.map((dica, idx) => (
                    <tr key={dica.id} className={(catIdx + idx) % 2 === 1 ? 'bg-secondary bg-opacity-10' : ''}>
                      <td className="text-center align-middle p-1 fw-semibold text-primary">{cat.nome}</td>
                      <td className="text-center align-middle p-1">{dica.texto}</td>
                    </tr>
                  ));
                })
              )}
            </tbody>
          </table>
          <Modal show={showDicaModal} onHide={() => setShowDicaModal(false)} centered>
            <Modal.Header closeButton>
              <Modal.Title>Inserir Dicas Sidebar</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <Form.Group className="mb-3">
                <Form.Label>Categoria</Form.Label>
                <Form.Select value={categoriaId} onChange={e => setCategoriaId(e.target.value)}>
                  <option value="">Selecione uma categoria</option>
                  {categorias.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.nome}</option>
                  ))}
                </Form.Select>
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Dicas (uma por linha)</Form.Label>
                <Form.Control as="textarea" rows={4} value={dicasTexto} onChange={e => setDicasTexto(e.target.value)} />
              </Form.Group>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={() => setShowDicaModal(false)}>Cancelar</Button>
              <Button variant="primary" onClick={handleInserirDicas}>Salvar Dicas</Button>
            </Modal.Footer>
          </Modal>
        </>
      )}
    </div>
  );
}

export default Inserir;

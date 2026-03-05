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
  const [materiaQuantidade, setMateriaQuantidade] = useState(0);
  // Modal de edição de matéria da lista
  const [showEditMateriaModal, setShowEditMateriaModal] = useState(false);
  const [editMatIdx, setEditMatIdx] = useState(null);
  const [editMatNome, setEditMatNome] = useState('');
  const [editMatCor, setEditMatCor] = useState('#71dd8c');
  const [editMatEdital, setEditMatEdital] = useState('');
  const [editMatQtd, setEditMatQtd] = useState(0);
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
  const [deletingId, setDeletingId] = useState(null);
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
        cor: m.cor || '#71dd8c',
        quantidadeQuestoes: m.quantidadeQuestoes !== undefined ? parseInt(m.quantidadeQuestoes) || 0 : 0
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
    setDeletingId(id);
    try {
      await api.delete(`/projetos-padrao/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      setProjetosPadrao(projetosPadrao.filter(p => p.id !== id));
    } catch (error) {
      alert('Erro ao apagar projeto padrão');
    } finally {
      setDeletingId(null);
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
                                  edital: Array.isArray(m.edital) ? m.edital : (m.conteudos || []),
                                  quantidadeQuestoes: m.quantidadeQuestoes ?? 0
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
                            <Button variant="outline-danger" size="sm" disabled={deletingId === p.id} onClick={() => handleApagarProjetoPadrao(p.id)}>
                              {deletingId === p.id ? 'Apagando...' : 'Apagar'}
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
          <Modal show={showModal} onHide={() => setShowModal(false)} centered backdrop="static" className="modal-fundo" size="lg">
            <Modal.Header className="modal-estilo border-0 pb-0" closeButton>
              <Modal.Title className="fw-bold fs-6">
                {editProjetoIdx !== null ? 'Editar Projeto Padrão' : 'Novo Projeto Padrão'}
              </Modal.Title>
            </Modal.Header>
            <Modal.Body className="modal-estilo py-3">

              {/* ── Linha 1: campos principais ── */}
              <div className="d-flex gap-2 mb-2 flex-wrap">
                <Form.Control size="sm" className="linha" style={{ flex: '2 1 140px' }} type="text" value={nomeProjetoPadrao} onChange={e => setNomeProjetoPadrao(e.target.value)} placeholder="Nome do projeto" />
                <Form.Control size="sm" className="linha" style={{ flex: '0 0 72px' }} type="number" value={anoProjetoPadrao} onChange={e => setAnoProjetoPadrao(e.target.value)} placeholder="Ano" min="1900" max="2100" />
                <Form.Control size="sm" className="linha" style={{ flex: '1 1 110px' }} type="text" value={cargoProjetoPadrao} onChange={e => setCargoProjetoPadrao(e.target.value)} placeholder="Cargo" />
                <Form.Control size="sm" className="linha" style={{ flex: '2 1 140px' }} type="text" value={descricaoProjetoPadrao} onChange={e => setDescricaoProjetoPadrao(e.target.value)} placeholder="Descrição" />
              </div>

              {/* ── Linha 2: carreira + imagem ── */}
              <div className="d-flex gap-2 mb-3 align-items-center flex-wrap">
                <div style={{ position: 'relative', flex: '1 1 160px' }} ref={dropdownRef}>
                  <button type="button" className="form-select form-select-sm linha text-start w-100" onClick={() => setShowCarreiraDropdown(v => !v)}>
                    {carreiras.find(c => c.id === carreiraSelecionadaModal)?.nome || <span className="text-muted">Carreira</span>}
                  </button>
                  <div className="text-dark" style={{ position: 'absolute', zIndex: 20, background: '#fff', border: '1px solid #ddd', borderRadius: 8, minWidth: '100%', boxShadow: '0 4px 16px rgba(0,0,0,0.12)', display: showCarreiraDropdown ? 'block' : 'none' }}>
                    {carreiras.map(opt => (
                      <div key={opt.id} className="d-flex align-items-center justify-content-between px-2 py-1" style={{ cursor: 'pointer', borderBottom: '1px solid #f2f2f2', fontSize: '0.9em' }}>
                        <span className="d-flex align-items-center gap-2" style={{ flex: 1 }}>
                          <span onClick={() => { setCarreiraSelecionadaModal(opt.id); setShowCarreiraDropdown(false); }}>{opt.nome}</span>
                          <FontAwesomeIcon icon={faPenToSquare} style={{ color: 'var(--primary-primary)', cursor: 'pointer', fontSize: '0.8em' }}
                            onClick={e => { e.stopPropagation(); setCarreiraEditando(opt); setNovoNomeCarreira(opt.nome || ''); setShowEditarCarreiraModal(true); }} />
                        </span>
                        <span style={{ color: '#dc3545', fontWeight: 'bold', fontSize: 16, lineHeight: 1 }}
                          onClick={async e => {
                            e.stopPropagation();
                            if (window.confirm('Apagar esta carreira? Os projetos padrão relacionados também serão apagados.')) {
                              try {
                                const token = JSON.parse(localStorage.getItem('user'))?.token;
                                await api.delete(`/carreiras/${opt.id}`, { headers: { Authorization: `Bearer ${token}` } });
                                setCarreiras(carreiras.filter(c => c.id !== opt.id));
                                setProjetosPadrao(projetosPadrao.filter(p => p.carreiraId !== opt.id));
                                if (carreiraSelecionada === opt.id) setCarreiraSelecionada('');
                                setShowCarreiraDropdown(false);
                              } catch (err) { alert('Erro ao apagar carreira'); }
                            }
                          }}>×</span>
                      </div>
                    ))}
                    <div className="px-2 py-1" style={{ cursor: 'pointer', color: 'var(--primary-primary)', fontWeight: 600, fontSize: '0.9em' }}
                      onClick={() => { setShowCarreiraModal(true); setShowCarreiraDropdown(false); }}>
                      + Nova carreira
                    </div>
                  </div>
                  {showEditarCarreiraModal && carreiraEditando && (
                    <Modal show={showEditarCarreiraModal} onHide={() => setShowEditarCarreiraModal(false)} centered backdrop="static" className="modal-fundo">
                      <Modal.Header className="modal-estilo border-0 pb-0" closeButton>
                        <Modal.Title className="fw-bold fs-6">Editar carreira</Modal.Title>
                      </Modal.Header>
                      <Modal.Body className="modal-estilo pt-2">
                        <Form.Control type="text" className="linha" value={novoNomeCarreira} onChange={e => setNovoNomeCarreira(e.target.value)} placeholder="Nome da carreira" />
                      </Modal.Body>
                      <Modal.Footer className="modal-estilo border-0 pt-0">
                        <button className="btn btn-outline-primary-primary3 btn-sm" onClick={() => setShowEditarCarreiraModal(false)}>Cancelar</button>
                        <button className="btn btn-primary-primary3 btn-sm" onClick={async () => {
                          if (!novoNomeCarreira.trim()) return;
                          try {
                            const token = JSON.parse(localStorage.getItem('user'))?.token;
                            const res = await api.put(`/carreiras/${carreiraEditando.id}`, { nome: novoNomeCarreira }, { headers: { Authorization: `Bearer ${token}` } });
                            setCarreiras(carreiras.map(c => c.id === carreiraEditando.id ? { ...c, nome: res.data.nome } : c));
                            setShowEditarCarreiraModal(false);
                          } catch (err) { alert('Erro ao editar carreira'); }
                        }}>Salvar</button>
                      </Modal.Footer>
                    </Modal>
                  )}
                </div>
                <div className="d-flex align-items-center gap-2" style={{ flex: '2 1 200px' }}>
                  <Form.Control type="file" size="sm" accept="image/*" className="linha" disabled={uploadingImagem}
                    onChange={e => { if (e.target.files?.[0]) setImagemProjetoPadrao(e.target.files[0]); else setImagemProjetoPadrao(null); }} />
                  {imagemProjetoPadrao
                    ? <img src={URL.createObjectURL(imagemProjetoPadrao)} alt="Prévia" style={{ height: 32, borderRadius: 6, border: '1px solid #ddd', objectFit: 'cover' }} />
                    : (editProjetoIdx !== null && projetosPadrao[editProjetoIdx]?.imagem
                      ? <img src={projetosPadrao[editProjetoIdx].imagem} alt="Atual" style={{ height: 32, borderRadius: 6, border: '1px solid #ddd', objectFit: 'cover' }} />
                      : null)}
                </div>
              </div>

              {/* ── Adicionar matéria (inline) ── */}
              <div className="border-top pt-2 mb-2">
                <span className="small fw-semibold text-muted">Adicionar matéria</span>
              </div>
              <div className="d-flex gap-2 align-items-center flex-wrap mb-2">
                <Form.Control size="sm" className="linha" style={{ flex: '2 1 130px' }} type="text" value={materiaNome} onChange={e => setMateriaNome(e.target.value)} placeholder="Nome da matéria" />
                <Form.Control size="sm" className="linha" style={{ flex: '0 0 80px' }} type="number" value={materiaQuantidade} onChange={e => setMateriaQuantidade(e.target.value)} min={0} placeholder="Questões" />
                <div className="d-flex flex-wrap gap-1 align-items-center" style={{ flex: '3 1 160px' }}>
                  {Array.from(new Set(PALETAS.flat())).map((cor, i) => (
                    <span key={i} title={cor} style={{ background: cor, width: 18, height: 18, borderRadius: '50%', display: 'inline-block', cursor: 'pointer', flexShrink: 0, border: materiaCor === cor ? '2px solid #333' : '1.5px solid rgba(255,255,255,0.5)', boxShadow: materiaCor === cor ? '0 0 0 2px #33333355' : 'none', transition: 'all 0.12s' }}
                      onClick={() => setMateriaCor(cor)} />
                  ))}
                </div>
                <button className="btn btn-primary-primary btn-sm px-3" style={{ flexShrink: 0 }} onClick={() => {
                  if (!materiaNome.trim()) return alert('Informe o nome da matéria');
                  const editalArray = materiaEdital.split('\n').map(e => e.trim()).filter(e => e);
                  setMateriasProjeto([...materiasProjeto, { nome: materiaNome, cor: materiaCor, edital: editalArray, quantidadeQuestoes: parseInt(materiaQuantidade) || 0 }]);
                  setMateriaNome(''); setMateriaCor('#71dd8c'); setMateriaEdital(''); setMateriaQuantidade(0);
                }}>+ Adicionar</button>
              </div>

              {/* ── Lista de matérias ── */}
              <div className="overflow-auto rounded border" style={{ maxHeight: '22vh' }}>
                <table className="table table-sm m-0" style={{ fontSize: '0.85em' }}>
                  <thead className="table-light">
                    <tr>
                      <th className="ps-2 py-1">Matéria</th>
                      <th className="text-center py-1" style={{ width: 40 }}>Cor</th>
                      <th className="py-1">Edital</th>
                      <th className="text-center py-1" style={{ width: 70 }}>Questões</th>
                      <th className="py-1" style={{ width: 90 }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {materiasProjeto.length === 0 ? (
                      <tr><td colSpan={5} className="text-muted text-center py-2 fst-italic">Nenhuma matéria adicionada.</td></tr>
                    ) : materiasProjeto.map((mat, idx) => (
                      <tr key={idx}>
                        <td className="align-middle ps-2 fw-semibold" style={{ color: 'var(--primary-primary)' }}>{mat.nome}</td>
                        <td className="text-center align-middle">
                          <span style={{ background: mat.cor, width: 18, height: 18, borderRadius: '50%', display: 'inline-block', border: '1.5px solid rgba(255,255,255,0.3)', verticalAlign: 'middle' }} title={mat.cor} />
                        </td>
                        <td className="align-middle text-muted small">
                          {Array.isArray(mat.edital) && mat.edital.length > 0
                            ? <>{mat.edital.slice(0, 2).join(', ')}{mat.edital.length > 2 ? ` +${mat.edital.length - 2}` : ''}</>
                            : <span className="fst-italic">—</span>}
                        </td>
                        <td className="text-center align-middle">{mat.quantidadeQuestoes ?? 0}</td>
                        <td className="text-center align-middle">
                          <div className="d-flex justify-content-center gap-1">
                            <Button variant="outline-primary" size="sm" style={{ padding: '1px 8px', fontSize: '0.82em' }} onClick={() => {
                              setEditMatIdx(idx); setEditMatNome(mat.nome); setEditMatCor(mat.cor || '#71dd8c');
                              setEditMatEdital(Array.isArray(mat.edital) ? mat.edital.join('\n') : '');
                              setEditMatQtd(mat.quantidadeQuestoes ?? 0); setShowEditMateriaModal(true);
                            }}>Editar</Button>
                            <Button variant="outline-danger" size="sm" style={{ padding: '1px 7px', fontSize: '0.82em' }} onClick={() => setMateriasProjeto(materiasProjeto.filter((_, i) => i !== idx))}>✕</Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Modal.Body>

            <Modal.Footer className="modal-estilo border-0 pt-0">
              <button className="btn btn-outline-primary-primary btn-sm" onClick={() => {
                setShowModal(false); setEditProjetoIdx(null); setNomeProjetoPadrao(''); setDescricaoProjetoPadrao('');
                setMaterias([]); setMateriasProjeto([]); setCarreiraSelecionadaModal('');
              }}>Cancelar</button>
              <button className="btn btn-primary-primary btn-sm px-4" onClick={handleSalvarProjetoPadrao} disabled={uploadingImagem}>
                {uploadingImagem ? 'Salvando...' : (editProjetoIdx !== null ? 'Salvar Alterações' : 'Criar Projeto')}
              </button>
            </Modal.Footer>
          </Modal>

          {/* Modal de edição de matéria */}
          <Modal show={showEditMateriaModal} onHide={() => setShowEditMateriaModal(false)} centered backdrop="static" className="modal-fundo">
            <Modal.Header className="modal-estilo border-0 pb-0" closeButton>
              <Modal.Title className="fw-bold fs-6">Editar matéria</Modal.Title>
            </Modal.Header>
            <Modal.Body className="modal-estilo pt-2">
              <div className="row g-3">
                <div className="col-12 col-sm-8">
                  <Form.Label className="small fw-semibold mb-1">Nome</Form.Label>
                  <Form.Control type="text" className="linha" value={editMatNome} onChange={e => setEditMatNome(e.target.value)} />
                </div>
                <div className="col-12 col-sm-4">
                  <Form.Label className="small fw-semibold mb-1">Qtd. Questões</Form.Label>
                  <Form.Control type="number" className="linha" value={editMatQtd} onChange={e => setEditMatQtd(e.target.value)} min={0} />
                </div>
                <div className="col-12">
                  <Form.Label className="small fw-semibold mb-1">Cor</Form.Label>
                  <div className="d-flex flex-wrap align-items-center gap-1">
                    {Array.from(new Set(PALETAS.flat())).map((cor, i) => (
                      <span key={i} title={cor} style={{ background: cor, width: 24, height: 24, borderRadius: '50%', display: 'inline-block', cursor: 'pointer', border: editMatCor === cor ? '2.5px solid #333' : '1.5px solid rgba(255,255,255,0.5)', boxShadow: editMatCor === cor ? '0 0 0 2px #33333355' : 'none', transition: 'all 0.15s' }}
                        onClick={() => setEditMatCor(cor)} />
                    ))}
                    <span className="ms-2 small text-muted">{editMatCor}</span>
                  </div>
                </div>
                <div className="col-12">
                  <Form.Label className="small fw-semibold mb-1">Edital <span className="text-muted fw-normal">(um tópico por linha)</span></Form.Label>
                  <Form.Control as="textarea" className="linha" rows={5} value={editMatEdital} onChange={e => setEditMatEdital(e.target.value)} placeholder="Tópicos do edital, um por linha..." />
                </div>
              </div>
            </Modal.Body>
            <Modal.Footer className="modal-estilo border-0 pt-0">
              <button className="btn btn-outline-primary-primary" onClick={() => setShowEditMateriaModal(false)}>Cancelar</button>
              <button className="btn btn-primary-primary px-4" onClick={() => {
                if (!editMatNome.trim()) return alert('Informe o nome da matéria');
                const editalArr = editMatEdital.split('\n').map(e => e.trim()).filter(e => e);
                setMateriasProjeto(materiasProjeto.map((m, i) => i === editMatIdx ? { ...m, nome: editMatNome, cor: editMatCor, edital: editalArr, quantidadeQuestoes: parseInt(editMatQtd) || 0 } : m));
                setShowEditMateriaModal(false);
              }}>Salvar</button>
            </Modal.Footer>
          </Modal>

          <Modal show={showCarreiraModal} onHide={() => setShowCarreiraModal(false)} centered backdrop="static" className="modal-fundo">
            <Modal.Header className="modal-estilo border-0 pb-0" closeButton>
              <Modal.Title className="fw-bold fs-6">Nova carreira</Modal.Title>
            </Modal.Header>
            <Modal.Body className="modal-estilo pt-2">
              <Form.Group>
                <Form.Label className="small fw-semibold">Nome da carreira</Form.Label>
                <Form.Control type="text" className="linha" value={novaCarreira} onChange={e => setNovaCarreira(e.target.value)} placeholder="ex: Policial Federal" />
              </Form.Group>
            </Modal.Body>
            <Modal.Footer className="modal-estilo border-0 pt-0">
              <button className="btn btn-outline-primary-primary3" onClick={() => setShowCarreiraModal(false)}>Cancelar</button>
              <button className="btn btn-primary-primary3" onClick={async () => {
                if (!novaCarreira.trim()) return;
                try {
                  const res = await api.post('/carreiras', { nome: novaCarreira });
                  setCarreiras([...carreiras, res.data]);
                  setNovaCarreira('');
                  setShowCarreiraModal(false);
                } catch (err) { alert('Erro ao inserir carreira'); }
              }}>Salvar</button>
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
          <Modal show={showDicaModal} onHide={() => setShowDicaModal(false)} centered backdrop="static" className="modal-fundo">
            <Modal.Body className="modal-estilo">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <Modal.Title className="fw-bold fs-5 m-0">Inserir Dicas Sidebar</Modal.Title>
              </div>
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
              <div className="d-flex justify-content-end gap-2 mt-3">
                <button className="btn btn-outline-primary-primary3" onClick={() => setShowDicaModal(false)}>Cancelar</button>
                <button className="btn btn-primary-primary3" onClick={handleInserirDicas}>Salvar Dicas</button>
              </div>
            </Modal.Body>
          </Modal>
        </>
      )}
    </div>
  );
}

export default Inserir;

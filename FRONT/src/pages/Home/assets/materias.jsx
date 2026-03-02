import React, { useEffect, useState, useRef } from 'react';
import ErrorBoundary from './ErrorBoundary.jsx';
import Sidebar from './components/sidebar.jsx';
import api from '../../services/api';
import { useNavigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Modal, Button } from 'react-bootstrap';
import { FaTrash, FaPen, FaRegEye, FaRegEyeSlash } from 'react-icons/fa';

// Estado para modal de projeto padrão
// (deve vir depois dos imports)

function Materias() {
  const navigate = useNavigate();
  const [materias, setMaterias] = useState([]);
  const [projetoSelecionado, setProjetoSelecionado] = useState(() => localStorage.getItem('projetoSelecionado') || '');
  const [projetoPadraoSelecionado, setProjetoPadraoSelecionado] = useState("");

  // Estado para modal de Projeto Padrão
  const [showProjetoPadraoModal, setShowProjetoPadraoModal] = useState(false);
  // Default to current project name if available
  const [nomeProjetoPadrao, setNomeProjetoPadrao] = useState(() => {
    const projetoId = localStorage.getItem('projetoSelecionado');
    const projetos = window.projetosSidebar || [];
    const projeto = projetos.find(p => p.id === projetoId);
    return projeto ? projeto.nome : '';
  });

  const [erroProjetoPadrao, setErroProjetoPadrao] = useState("");

  async function handleSalvarProjetoPadrao() {
    console.log('handleSalvarProjetoPadrao chamado');
    try {
      // Monta array correto de matérias para enviar ao backend
      const materiasPadrao = materias.map(m => ({
        nome: m.nome,
        conteudos: Array.isArray(m.edital) ? m.edital : []
      }));
      const payload = {
        nome: nomeProjetoPadrao,
        materias: materiasPadrao
      };
      console.log('Enviando projeto padrão:', payload);
      const res = await api.post('/projetos-padrao', payload);
      console.log('Resposta do backend:', res);
      setShowProjetoPadraoModal(false);
      setNomeProjetoPadrao("");
      alert("Projeto padrão salvo com sucesso!");
    } catch (error) {
      console.error('Erro ao salvar projeto padrão:', error);
      setErroProjetoPadrao(error?.response?.data?.details || error?.response?.data?.error || error.message || 'Erro desconhecido');
      alert("Erro ao salvar projeto padrão.");
    }
  }
  useEffect(() => {
    if (!projetoSelecionado) {
      navigate('/projeto');
    }
  }, [projetoSelecionado, navigate]);
  // Removido duplicidade de expandedId/setExpandedId
  const [editModalId, setEditModalId] = useState(null);
  const [editalInputs, setEditalInputs] = useState("");
  // Função para salvar/editar edital
  async function handleSaveEdital(materiaId) {
    const linhas = editalInputs.split('\n').map(l => l.trim()).filter(l => l);
    try {
      await api.post(`/materias/${materiaId}/edital`, { edital: linhas });
      getMaterias();
      setEditalInputs("");
      setEditModalId(null);
      localStorage.removeItem(`edital-completos-${materiaId}`);
    } catch (error) {
      alert('Erro ao salvar edital');
    }
  }
  const [expandedId, setExpandedId] = useState(null);
  const inputMateria = useRef();
  const [materiasInput, setMateriasInput] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editMateriaId, setEditMateriaId] = useState(null);
  const [editMateriaNome, setEditMateriaNome] = useState("");
  function openEditModal(materia) {
    setEditMateriaId(materia.id);
    setEditMateriaNome(materia.nome);
    setShowEditModal(true);
  }

  async function updateMateriaNome() {
    if (!editMateriaNome.trim()) return;
    try {
      await api.put(`/materias/${editMateriaId}`, { nome: editMateriaNome });
      setShowEditModal(false);
      setEditMateriaId(null);
      setEditMateriaNome("");
      getMaterias();
    } catch (error) {
      alert("Erro ao atualizar edital.");
    }
  }

  useEffect(() => {
    setProjetoSelecionado(localStorage.getItem('projetoSelecionado') || '');
  }, []);

  useEffect(() => {
    getMaterias();
  }, [projetoSelecionado]);

  async function getMaterias() {
    try {
      const userId = JSON.parse(localStorage.getItem('user'))?.id;
      const res = await api.get('/edital', {
        params: { userId, projetoId: projetoSelecionado }
      });
      if (projetoSelecionado) {
        setMaterias(res.data.filter(mat => mat.projetoId === projetoSelecionado));
      } else {
        setMaterias([]);
      }
    } catch (error) {
      console.error("Erro ao buscar edital:", error);
    }
  }

  async function createMateria() {
    try {
      const projetoId = localStorage.getItem('projetoSelecionado') || '';
      const userObj = localStorage.getItem('user');
      const userId = userObj ? JSON.parse(userObj).id : '';
      if (!userId) {
        alert('Usuário não identificado. Faça login novamente.');
        return;
      }
      // Divide o input por linhas, remove vazios e insere cada edital
      const materiasList = materiasInput.split('\n').map(m => m.trim()).filter(m => m.length > 0);
      if (materiasList.length === 0) return;
      await Promise.all(materiasList.map(nome =>
        api.post('/edital', { nome, projetoId, userId })
      ));
      await getMaterias();
      setMateriasInput("");
      setShowModal(false);
    } catch (error) {
      alert("Erro ao criar edital. Verifique os dados e tente novamente.");
      console.error("Erro ao criar edital:", error);
    }
  }

  async function deleteMateria(id) {
    const confirmDelete = window.confirm('Tem certeza que deseja apagar este edital? Essa ação não pode ser desfeita.');
    if (!confirmDelete) return;
    try {
      await api.delete(`/edital/${id}`);
      getMaterias(); // atualiza a lista
    } catch (error) {
      console.error("Erro ao deletar edital:", error);
    }
  }

  // Marcar/desmarcar item do edital
  function handleCheck(materiaId, idx) {
    const key = `edital-completos-${materiaId}`;
    let completos = JSON.parse(localStorage.getItem(key) || '[]');
    if (completos.includes(idx)) {
      completos = completos.filter(i => i !== idx);
    } else {
      completos.push(idx);
    }
    localStorage.setItem(key, JSON.stringify(completos));
    getMaterias();
  }

  // Função para calcular progresso do edital de cada matéria
  function getPorcentagem(materia) {
    const completos = JSON.parse(localStorage.getItem(`edital-completos-${materia.id}`) || '[]');
    const total = Array.isArray(materia.edital) ? materia.edital.length : 0;
    const feitos = completos.length;
    return total > 0 ? Math.round((feitos / total) * 100) : 0;
  }

  // Função para calcular progresso geral
  function getProgressoGeral() {
    if (materias.length === 0) return 0;
    const porcentagens = materias.map(getPorcentagem);
    const soma = porcentagens.reduce((acc, val) => acc + val, 0);
    return Math.round(soma / materias.length);
  }

  // Estado e lógica para modal de seleção de edital pré-inserido
  const [showEditalModal, setShowEditalModal] = useState(false);
  const [projetosPadrao, setProjetosPadrao] = useState([]);
  const [loadingProjetosPadrao, setLoadingProjetosPadrao] = useState(false);

  useEffect(() => {
    setLoadingProjetosPadrao(true);
    api.get('/projetos-padrao')
      .then(res => setProjetosPadrao(res.data))
      .catch(() => setProjetosPadrao([]))
      .finally(() => setLoadingProjetosPadrao(false));
  }, []);

  async function handleSelecionarProjetoPadrao(projetoPadraoId) {
    try {
      const userId = JSON.parse(localStorage.getItem('user'))?.id;
      const projetoId = localStorage.getItem('projetoSelecionado');
      if (!userId || !projetoId) {
        alert('Usuário ou projeto não selecionado.');
        return;
      }
      await api.post(`/usuarios/${userId}/copiar-projeto-padrao/${projetoPadraoId}`, { projetoId });
      await getMaterias();
      setShowEditalModal(false);
      alert('Projeto padrão copiado com sucesso!');
    } catch (error) {
      alert('Erro ao copiar projeto padrão.');
    }
  }

  return (
    <div className="app-container">
      <main className="container">
        <div className="titulo-pagina">
          <h2>
            Edital
            {(() => {
              const projetoSelecionado = localStorage.getItem('projetoSelecionado');
              const projetos = window.projetosSidebar || [];
              const projeto = projetos.find(p => p.id === projetoSelecionado);
              return projeto ? ` (${projeto.nome})` : '';
            })()}
          </h2>
        </div>
        <div style={{ marginBottom: '20px' }}>
          <strong>Progresso Geral do Edital:</strong> {getProgressoGeral()}%
          <div style={{ background: '#eee', borderRadius: '8px', height: '12px', marginTop: '4px' }}>
            <div style={{
              background: '#28a745',
              height: '100%',
              borderRadius: '8px',
              width: `${getProgressoGeral()}%`,
              transition: 'width 0.3s'
            }}></div>
          </div>
        </div>
        <div className='formulario-menu' style={{ display: 'flex', gap: '1em', marginBottom: '1em' }}>
          <button className="btn fw-bold btn-primary" onClick={() => setShowModal(true)} style={{ width: 'auto', minWidth: '180px', maxWidth: '300px', alignSelf: 'flex-start' }}>
            + Adicionar Nova Matéria
          </button>
          <button className="btn btn-warning" onClick={() => setShowProjetoPadraoModal(true)} style={{ minWidth: '180px', maxWidth: '300px', alignSelf: 'flex-start' }}>
            Adicionar Projeto Padrão
          </button>
        </div>
        <div className="users-list">
          {materias.length > 0 ? (
            materias.map(materia => {
              const progresso = getPorcentagem(materia);
              const isExpanded = expandedId === materia.id;
              const completos = JSON.parse(localStorage.getItem(`edital-completos-${materia.id}`) || '[]');
              const total = Array.isArray(materia.edital) ? materia.edital.length : 0;
              const feitos = completos.length;
              return (
                <div className="card-padrao sombra p-2 mb-3" key={materia.id} style={{ display: 'flex', flexDirection: 'column', cursor: 'pointer' }} onClick={e => {
                  if (
                    e.target.closest('.edital-card-botoes button') ||
                    e.target.closest('.edital-card-botoes .btn')
                  ) return;
                  setExpandedId(isExpanded ? null : materia.id);
                }}>
                  <div className='materia' style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                    <div className="edital-info" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                      <strong className='m-0 px-2'>{materia.nome}</strong>
                      {Array.isArray(materia.edital) && materia.edital.length > 0 && (
                        <div className='progresso' style={{ display: 'flex', alignItems: 'center', fontSize: '0.95em', color: '#0080ff', marginTop: '4px', gap: '0.7em' }}>
                          Progresso: {progresso}%
                          <div style={{ background: '#eee', borderRadius: '8px', height: '8px', marginTop: '2px', width: '100px' }}>
                            <div style={{ background: '#0080ff', height: '100%', borderRadius: '8px', width: `${progresso}%`, transition: 'width 0.3s' }}></div>
                          </div>
                          <span style={{ marginLeft: '0.5em', color: '#1976d2', cursor: 'pointer' }} onClick={e => {
                            e.stopPropagation();
                            setExpandedId(isExpanded ? null : materia.id);
                          }}>
                            {/* Invertido: expandido mostra olho aberto, fechado mostra olho fechado */}
                            {isExpanded ? <FaRegEye style={{ fontSize: '20px' }} /> : <FaRegEyeSlash style={{ fontSize: '20px' }} />}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="edital-card-botoes" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5em', alignItems: 'center', marginBottom: '0.5em', marginLeft: 'auto', justifyContent: 'flex-end' }}>
                      <button className="btn btn-outline-secondary btn-sm d-flex align-items-center justify-content-center" style={{ padding: '0.25em 0.5em', minWidth: '32px', minHeight: '32px' }} onClick={e => { e.stopPropagation(); setEditMateriaId(materia.id); setEditMateriaNome(materia.nome); setShowEditModal(true); }} title="Editar matéria">
                        <FaPen style={{ fontSize: '20px' }} />
                      </button>
                      <button className="btn btn-outline-danger btn-sm d-flex align-items-center justify-content-center" style={{ padding: '0.25em 0.5em', minWidth: '32px', minHeight: '32px' }} onClick={e => { e.stopPropagation(); deleteMateria(materia.id); }} title="Apagar matéria">
                        <FaTrash style={{ fontSize: '20px' }} />
                      </button>
                      {/* Ícone de olho removido conforme solicitado */}
                    </div>
                  </div>
                  {isExpanded && (
                    <div className="edital-expandido" style={{ marginTop: '1em', background: 'var(--dark)', borderRadius: '8px', padding: '1em', width: '100%' }} onClick={e => e.stopPropagation()}>
                      <Button variant="primary fw-bold" style={{ marginBottom: '1em' }} onClick={() => {
                        setEditModalId(materia.id);
                        setEditalInputs("");
                      }}>
                        + Inserir novo item
                      </Button>
                      {total > 0 && (
                        <div style={{ marginBottom: '1em' }}>
                          <strong>Progresso:</strong> {feitos} de {total} itens completos
                        </div>
                      )}
                      {total > 0 ? (
                        <table className="table table-bordered table-dark">
                          <thead>
                            <tr>
                              <th>Completo</th>
                              <th>Item do Edital</th>
                              <th>Ações</th>
                            </tr>
                          </thead>
                          <tbody>
                            {materia.edital.map((item, idx) => (
                              <tr key={idx}>
                                <td style={{ textAlign: 'center', verticalAlign: 'middle' }}>
                                  <div className="form-check form-switch d-flex justify-content-center">
                                    <input className="form-check-input" type="checkbox" id={`switch-edital-${materia.id}-${idx}`} checked={completos.includes(idx)} onChange={() => handleCheck(materia.id, idx)} />
                                  </div>
                                </td>
                                <td style={{ verticalAlign: 'middle' }}>{item}</td>
                                <td style={{ verticalAlign: 'middle' }}>
                                  <div style={{ display: 'flex', gap: '0.5em', alignItems: 'center', justifyContent: 'center' }}>
                                    <button className="btn btn-outline-secondary btn-sm d-flex align-items-center justify-content-center" style={{ verticalAlign: 'middle' }} onClick={() => {
                                      setEditModalId(materia.id + '-' + idx);
                                      setEditalInputs(item);
                                    }} title="Editar">
                                      <FaPen style={{ fontSize: '18px', verticalAlign: 'middle' }} />
                                    </button>
                                    <button className="btn btn-outline-danger btn-sm d-flex align-items-center justify-content-center" style={{ verticalAlign: 'middle' }} onClick={async () => {
                                      const confirm1 = window.confirm('Tem certeza que deseja apagar este item do edital?');
                                      if (!confirm1) return;
                                      const confirm2 = window.confirm('Essa ação não pode ser desfeita. Deseja realmente apagar?');
                                      if (!confirm2) return;
                                      const novoEdital = materia.edital.filter((_, i) => i !== idx);
                                      await api.post(`/materias/${materia.id}/edital`, { edital: novoEdital });
                                      getMaterias();
                                    }} title="Apagar">
                                      <FaTrash style={{ fontSize: '18px', verticalAlign: 'middle' }} />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      ) : (
                        <p>Nenhum edital cadastrado.</p>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <p>Nenhum edital cadastrado ainda.</p>
          )}
        </div>
      </main>
      <Modal show={showProjetoPadraoModal} onHide={() => setShowProjetoPadraoModal(false)} centered backdrop="static" className="modal-fundo">
        <Modal.Body className="modal-estilo">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <Modal.Title className="fw-bold fs-5 m-0">Salvar este projeto como Projeto Padrão</Modal.Title>
          </div>
          <div className="mb-3">
            <label>Nome do Projeto Padrão:</label>
            <input type="text" className="form-control" value={nomeProjetoPadrao} onChange={e => setNomeProjetoPadrao(e.target.value)} />
          </div>
          <div>
            <label>Matérias e Conteúdos que serão salvos:</label>
            <ul>
              {materias.map((mat, idx) => (
                <li key={idx}>
                  <strong>{mat.nome}</strong>
                  <ul>
                    {Array.isArray(mat.edital) && mat.edital.map((c, cidx) => (
                      <li key={cidx}>{c}</li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          </div>
          {erroProjetoPadrao ? (
            <div style={{ color: 'red', marginTop: '1em', whiteSpace: 'pre-line', background: '#fff3cd', padding: '1em', borderRadius: '8px' }}>
              <strong>Erro:</strong> {erroProjetoPadrao}
            </div>
          ) : null}
          <div className="d-flex justify-content-end gap-2 mt-3">
            <button className="btn btn-outline-primary-primary3" onClick={() => setShowProjetoPadraoModal(false)}>Cancelar</button>
            <button className="btn btn-primary-primary3" onClick={handleSalvarProjetoPadrao}>Salvar Projeto Padrão</button>
          </div>
        </Modal.Body>
      </Modal>
      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.18)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)', zIndex: 1050 }}></div>
      )}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered backdrop="static" className="modal-fundo">
        <Modal.Body className="modal-estilo">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <Modal.Title className="fw-bold fs-5 m-0">Inserir nova matéria:</Modal.Title>
          </div>
          <form className="form-modal needs-validation" noValidate onSubmit={e => {
            e.preventDefault();
            if (!materiasInput.trim()) {
              e.target.classList.add('was-validated');
              return;
            }
            createMateria();
          }}>
            <textarea
              placeholder="Digite uma matéria por linha (máx. 50 caracteres cada)"
              name='edital'
              rows={5}
              value={materiasInput}
              onChange={e => {
                const linhas = e.target.value.split('\n').map(l => l.slice(0, 50));
                setMateriasInput(linhas.join('\n'));
              }}
              className="form-control input-dark"
              style={{ padding: '1em', borderRadius: '10px', background: 'var(--dark)', color: '#fff', minHeight: '120px', fontSize: '1em' }}
              required
            />
            <small style={{ color: '#f8f9fa', fontWeight: 500 }}>Você pode adicionar várias matérias de uma vez, separando cada uma em uma linha.</small>
            <div style={{ display: 'none' }}>
              <input type="text" required value={materiasInput.trim() ? 'ok' : ''} readOnly />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.7em', marginTop: '1em' }}>
              <button className="btn btn-outline-primary-primary3" onClick={() => setShowModal(false)}>Cancelar</button>
              <button className="btn btn-primary-primary3" type="submit">Cadastrar</button>
            </div>
          </form>
        </Modal.Body>
      </Modal>
      {editModalId !== null && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.18)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)', zIndex: 1050 }}></div>
      )}
      <Modal show={editModalId !== null} onHide={() => { setEditModalId(null); setEditalInputs(""); }} centered backdrop="static" className="modal-fundo">
        <Modal.Body className="modal-estilo">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <Modal.Title className="fw-bold fs-5 m-0">{editModalId && editModalId.includes('-') ? "Editar item do edital" : "Inserir novos itens no edital"}</Modal.Title>
          </div>
          <form className="needs-validation" noValidate onSubmit={async e => {
            e.preventDefault();
            if (!editalInputs.trim()) {
              e.target.classList.add('was-validated');
              return;
            }
            if (editModalId && editModalId.includes('-')) {
              const [matId, idx] = editModalId.split('-');
              const materiaAtual = materias.find(m => m.id === matId);
              if (!materiaAtual) return;
              const novoEdital = [...materiaAtual.edital];
              novoEdital[parseInt(idx)] = editalInputs;
              await api.post(`/materias/${matId}/edital`, { edital: novoEdital });
            } else {
              const materiaAtual = materias.find(m => m.id === editModalId);
              if (!materiaAtual) return;
              const novosItens = editalInputs.split('\n').map(l => l.trim()).filter(l => l);
              const novoEdital = [...materiaAtual.edital, ...novosItens];
              await api.post(`/materias/${materiaAtual.id}/edital`, { edital: novoEdital });
            }
            setEditModalId(null);
            setEditalInputs("");
            getMaterias();
          }}>
            {editModalId && editModalId.includes('-') ? (
              <input
                type="text"
                value={editalInputs}
                onChange={e => setEditalInputs(e.target.value)}
                className="form-control input-dark"
                style={{ padding: '1em', borderRadius: '10px', background: 'var(--dark)', color: '#fff', fontSize: '1em' }}
                placeholder="Digite o item do edital"
                required
              />
            ) : (
              <textarea
                value={editalInputs}
                onChange={e => setEditalInputs(e.target.value)}
                className="form-control input-dark"
                style={{ padding: '1em', borderRadius: '10px', background: 'var(--dark)', color: '#fff', minHeight: '120px', fontSize: '1em' }}
                placeholder="Digite um item por linha"
                rows={5}
                required
              />
            )}
            {!editModalId || !editModalId.includes('-') ? (
              <small style={{ color: '#f8f9fa', fontWeight: 500 }}>Você pode adicionar vários itens de uma vez, separando cada um em uma linha.</small>
            ) : null}
            <div style={{ display: 'none' }}>
              <input type="text" required value={editalInputs.trim() ? 'ok' : ''} readOnly />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.7em', marginTop: '1em' }}>
              <button className="btn btn-outline-primary-primary3" onClick={() => { setEditModalId(null); setEditalInputs(""); }}>Cancelar</button>
              <button className="btn btn-primary-primary3" type="submit">Salvar</button>
            </div>
          </form>
        </Modal.Body>
      </Modal>
      {showEditModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.18)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)', zIndex: 1050 }}></div>
      )}
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)} centered backdrop="static" className="modal-fundo">
        <Modal.Body className="modal-estilo">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <Modal.Title className="fw-bold fs-5 m-0">Editar nome da matéria</Modal.Title>
          </div>
          <input type="text" className="form-control" value={editMateriaNome} onChange={e => setEditMateriaNome(e.target.value)} />
          <div className="d-flex justify-content-end gap-2 mt-3">
            <button className="btn btn-outline-primary-primary3" onClick={() => setShowEditModal(false)}>Cancelar</button>
            <button className="btn btn-primary-primary3" onClick={updateMateriaNome}>Salvar</button>
          </div>
        </Modal.Body>
      </Modal>
    </div>
  );
}

// Export Materias wrapped in ErrorBoundary
const MateriasWithBoundary = (props) => (
  <ErrorBoundary>
    <Materias {...props} />
  </ErrorBoundary>
);

export default MateriasWithBoundary;
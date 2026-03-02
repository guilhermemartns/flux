import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { Button, Modal, Spinner } from 'react-bootstrap';
import ErrosBarChart from './components/graficos/ErrosBarChart';
import MotivoErroBarChart from './components/graficos/MotivoErroBarChart';
import BrancosBarChart from './components/graficos/BrancosBarChart';
import MotivoBrancoBarChart from './components/graficos/MotivoBrancoBarChart';
import { ArrowLeft, ChevronUp, ChevronDown, Edit, Trash2 } from 'react-feather';
import Swal from 'sweetalert2';

function MateriaDetalhe() {
    // Sempre declare useParams no topo antes de qualquer uso de 'id'
    const { id } = useParams();
    // Estado para ordenação da tabela de brancos
    const [brancoSortCol, setBrancoSortCol] = useState(null);
    const [brancoSortAsc, setBrancoSortAsc] = useState(true);
    // Estado para estudos da matéria
    const [estudos, setEstudos] = useState([]);
    const [loadingEstudos, setLoadingEstudos] = useState(true);

    useEffect(() => {
        async function fetchEstudos() {
            setLoadingEstudos(true);
            try {
                const userId = JSON.parse(localStorage.getItem('user'))?.id;
                const projetoId = localStorage.getItem('projetoSelecionado');
                if (!userId || !id || !projetoId) {
                    setEstudos([]);
                    setLoadingEstudos(false);
                    return;
                }
                // Buscar todos os estudos do projeto e filtrar por materiaId
                const res = await api.get('/estudo', { params: { userId, projetoId } });
                const todosEstudos = res.data || [];
                const estudosMateria = todosEstudos.filter(e => String(e.materiaId) === String(id));
                setEstudos(estudosMateria);
            } catch (error) {
                setEstudos([]);
            }
            setLoadingEstudos(false);
        }
        fetchEstudos();
    }, [id]);

    // Função para ordenar brancos
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
    // Estado para ordenação da tabela de erros
    const [erroSortCol, setErroSortCol] = useState(null);
    const [erroSortAsc, setErroSortAsc] = useState(true);

    // Função para ordenar erros
    function getSortedErros(erros) {
        if (!erroSortCol) return erros;
        const sorted = [...erros].sort((a, b) => {
            let va = a[erroSortCol], vb = b[erroSortCol];
            // Data precisa ser convertida
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
    const editalRefs = useRef([]);
    async function handleMoveItem(idx, direction) {
        if (!materia || !Array.isArray(materia.edital)) return;
        const novoEdital = [...materia.edital];
        const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
        if (targetIdx < 0 || targetIdx >= novoEdital.length) return;
        // FLIP animation
        const firstRectA = editalRefs.current[idx]?.getBoundingClientRect();
        const firstRectB = editalRefs.current[targetIdx]?.getBoundingClientRect();
        [novoEdital[idx], novoEdital[targetIdx]] = [novoEdital[targetIdx], novoEdital[idx]];
        try {
            await api.post(`/materias/${materia.id}/edital`, { edital: novoEdital });
            setMateria({ ...materia, edital: novoEdital });
            setTimeout(() => {
                const lastRectA = editalRefs.current[targetIdx]?.getBoundingClientRect();
                const lastRectB = editalRefs.current[idx]?.getBoundingClientRect();
                const deltaA = firstRectA ? firstRectA.top - (lastRectA?.top || 0) : 0;
                const deltaB = firstRectB ? firstRectB.top - (lastRectB?.top || 0) : 0;
                if (editalRefs.current[targetIdx]) {
                    editalRefs.current[targetIdx].style.transition = 'none';
                    editalRefs.current[targetIdx].style.transform = `translateY(${deltaA}px)`;
                    requestAnimationFrame(() => {
                        editalRefs.current[targetIdx].style.transition = 'transform 0.4s';
                        editalRefs.current[targetIdx].style.transform = '';
                    });
                }
                if (editalRefs.current[idx]) {
                    editalRefs.current[idx].style.transition = 'none';
                    editalRefs.current[idx].style.transform = `translateY(${deltaB}px)`;
                    requestAnimationFrame(() => {
                        editalRefs.current[idx].style.transition = 'transform 0.4s';
                        editalRefs.current[idx].style.transform = '';
                    });
                }
            }, 0);
        } catch (error) {
            alert('Erro ao mover item do edital.');
        }
    }
    const [materia, setMateria] = useState(null);
    const [loading, setLoading] = useState(true);
    const [editModalId, setEditModalId] = useState(null);
    const [editalInputs, setEditalInputs] = useState("");
    const [editMateriaNome, setEditMateriaNome] = useState("");
    const [showEditModal, setShowEditModal] = useState(false);
    const [editItemIdx, setEditItemIdx] = useState(null);
    const [editItemValue, setEditItemValue] = useState("");
    const [showEditItemModal, setShowEditItemModal] = useState(false);
    const [showAddItemModal, setShowAddItemModal] = useState(false);
    const [newItemValue, setNewItemValue] = useState("");
    const [editalCompletos, setEditalCompletos] = useState([]);
    // (Removido: já declarado no topo)
    const navigate = useNavigate();
    const [brancosMateria, setBrancosMateria] = useState([]);
    const [loadingBrancos, setLoadingBrancos] = useState(true);
    const [errosMateria, setErrosMateria] = useState([]);
    const [loadingErros, setLoadingErros] = useState(true);
    const [simuladoFiltro, setSimuladoFiltro] = useState('todos');
    useEffect(() => {
        const fetchMateria = async () => {
            try {
                const userId = JSON.parse(localStorage.getItem('user'))?.id;
                const projetoId = localStorage.getItem('projetoSelecionado');
                const res = await api.get('/edital', {
                    params: { userId, projetoId }
                });
                const mat = res.data.find(m => m.id === id);
                setMateria(mat || null);
                // Buscar progresso do edital no backend
                if (mat && userId) {
                    const progressoRes = await api.get('/edital-progresso', {
                        params: { userId, materiaId: mat.id }
                    });
                    setEditalCompletos(progressoRes.data?.completos || []);
                }
            } catch (error) {
                setMateria(null);
            } finally {
                setLoading(false);
            }
        };
        fetchMateria();
    }, [id]);

    useEffect(() => {
        if (!materia?.nome) return;
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
                // Filtra apenas os erros da matéria atual
                const erros = res.data[materia.nome] || [];
                setErrosMateria(erros);
            } catch (error) {
                setErrosMateria([]);
            }
            setLoadingErros(false);
        };
        fetchErrosMateria();
    }, [materia?.nome, id]);

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
                // Buscar questões em branco da matéria pelo novo endpoint
                const res = await api.get('/dashboard/brancos-detalhados', { params: { userId, projetoId: projetoSelecionado } });
                const brancos = res.data[materia.nome] || [];
                setBrancosMateria(brancos);
            } catch (error) {
                setBrancosMateria([]);
            }
            setLoadingBrancos(false);
        };
        fetchBrancosMateria();
    }, [materia?.nome, id]);
    // ...existing code...
    function getPorcentagem(materia) {
        const total = Array.isArray(materia?.edital) ? materia.edital.length : 0;
        const feitos = editalCompletos.length;
        return total > 0 ? Math.round((feitos / total) * 100) : 0;
    }

    async function handleCheck(materiaId, idx) {
        const userId = JSON.parse(localStorage.getItem('user'))?.id;
        let novosCompletos = [...editalCompletos];
        if (novosCompletos.includes(idx)) {
            novosCompletos = novosCompletos.filter(i => i !== idx);
        } else {
            novosCompletos.push(idx);
        }
        setEditalCompletos(novosCompletos);
        // Salva progresso no backend
        try {
            await api.post('/edital-progresso', {
                userId,
                materiaId,
                completos: novosCompletos
            });
        } catch (error) {
            // Feedback de erro opcional
        }
    }

    async function handleEditItem(idx) {
        setEditItemIdx(idx);
        setEditItemValue(materia.edital[idx]);
        setShowEditItemModal(true);
    }

    async function saveEditItem() {
        if (!editItemValue.trim()) return;
        const novoEdital = [...materia.edital];
        novoEdital[editItemIdx] = editItemValue;
        try {
            await api.post(`/materias/${materia.id}/edital`, { edital: novoEdital });
            setMateria({ ...materia, edital: novoEdital });
            setShowEditItemModal(false);
            setEditItemIdx(null);
            setEditItemValue("");
        } catch (error) {
            alert('Erro ao editar item do edital.');
        }
    }

    async function handleDeleteItem(idx) {
        if (!window.confirm('Deseja apagar este item do edital? Essa ação não pode ser desfeita.')) return;
        const novoEdital = materia.edital.filter((_, i) => i !== idx);
        try {
            await api.post(`/materias/${materia.id}/edital`, { edital: novoEdital });
            setMateria({ ...materia, edital: novoEdital });
        } catch (error) {
            alert('Erro ao apagar item do edital.');
        }
    }

    async function handleAddItem() {
        if (!newItemValue.trim()) return;
        // Divide o input por linhas, remove vazios e insere cada item
        const novosItens = newItemValue.split('\n').map(l => l.trim()).filter(l => l.length > 0);
        if (novosItens.length === 0) return;
        const novoEdital = [...(materia.edital || []), ...novosItens];
        try {
            await api.post(`/materias/${materia.id}/edital`, { edital: novoEdital });
            setMateria({ ...materia, edital: novoEdital });
            setShowAddItemModal(false);
            setNewItemValue("");
        } catch (error) {
            alert('Erro ao adicionar item ao edital.');
        }
    }

    if (loading) return (
        <div style={{ width: '400px', height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: 'auto' }}>
            <Spinner animation="border" role="status" />
        </div>
    );
    if (!materia) return <div>Matéria não encontrada.</div>;

    // Filtra apenas os erros e brancos que possuem dados
    const errosComDados = errosMateria.filter(e => e.simulado || e.dataSim || e.numeroQuestao || e.motivoErro || e.editalItem);
    const brancosComDados = brancosMateria.filter(b => b.simulado || b.dataSim || b.numeroQuestao || b.motivoBranco || b.editalItem);

    const simuladosUnicos = Array.from(new Set([
        ...errosComDados.map(e => e.simulado),
        ...brancosComDados.map(b => b.simulado)
    ].filter(Boolean)));
    simuladosUnicos.sort(function(a, b) {
      return String(b == null ? '' : b).localeCompare(String(a == null ? '' : a));
    });
    const simuladosFiltroOpts = [{ label: 'Todos', value: 'todos' }];
    var simuladosExtra = [1,2,3,4,5]
      .filter(function(n) { return simuladosUnicos.length >= n; })
      .map(function(n) {
        return {
          label: n === 1 ? 'Último simulado' : n + ' últimos simulados',
          value: 'ultimos_' + n
        };
      });
    simuladosFiltroOpts.push.apply(simuladosFiltroOpts, simuladosExtra);
    let simuladosSelecionados;
    if (simuladoFiltro === 'todos') {
        simuladosSelecionados = simuladosUnicos;
    } else if (simuladoFiltro.startsWith('ultimos_')) {
        const n = parseInt(simuladoFiltro.replace('ultimos_', ''));
        simuladosSelecionados = simuladosUnicos.slice(0, n);
    } else {
        simuladosSelecionados = simuladosUnicos;
    }
    const errosFiltrados = errosComDados.filter(e => simuladosSelecionados.includes(e.simulado));
    const brancosFiltrados = brancosComDados.filter(b => simuladosSelecionados.includes(b.simulado));

    // Itens do edital que têm erro cadastrado
    const itensEditalComErro = Array.from(new Set(errosFiltrados.map(e => e.editalItem).filter(Boolean)));
    const errosPorItem = itensEditalComErro.map(item => ({
      item,
      erros: errosFiltrados.filter(e => e.editalItem === item)
    }));
    // Itens do edital que têm branco cadastrado
    const itensEditalComBranco = Array.from(new Set(brancosFiltrados.map(b => b.editalItem).filter(Boolean)));
    const brancosPorItem = itensEditalComBranco.map(item => ({
      item,
      brancos: brancosFiltrados.filter(b => b.editalItem === item)
    }));

    return (
        <div className="app-container">
            <main className="container-fluid pt-3 pb-4 px-4">
                <div>
                    <div className="d-flex align-items-center justify-content-between mb-3 position-relative">
                        <Button variant='' onClick={() => navigate(-1)} className="btn btn-outline-primary-primary3 fw-bold w-auto px-2 py-1 d-flex align-items-center justify-content-center w-44 h-38 btn btn-outline-primary btn-sm">
                            <ArrowLeft size={16} className="me-2" /> Voltar
                        </Button>
                        <strong className="display-6 titulo-menor fs-3 text-uppercase fw-bold position-absolute start-50 translate-middle-x">
                            {materia.nome.length > 40 ? `${materia.nome.slice(0, 40)}...` : materia.nome}
                        </strong>
                        <div></div>
                    </div>
                    {Array.isArray(materia.edital) && materia.edital.length > 0 ? (
                        <div className="card-padrao2 ">
                            <strong className="d-flex mb-3 text-center">Edital Verticalizado</strong>
                            <div>
                                <div className=" d-flex align-items-center gap-3">
                                    <strong>Progresso:</strong><span className="fw-semibold text-end" >{getPorcentagem(materia)}%</span>
                                    <div className="flex-grow-1">
                                        <div className="rounded-pill">
                                            <div
                                                className="rounded-pill"
                                                style={{
                                                    height: '12px',
                                                    width: `${getPorcentagem(materia)}%`,
                                                    transition: 'width 0.3s',
                                                    background: materia.cor || '#0d6efd'
                                                }}
                                            ></div>
                                        </div>
                                    </div>
                                    
                                </div>
                                <table className="w-100 border-0">
                                    <thead>
                                        <tr>
                                            <th className="text-center p-1 pointer" style={{ width: '40px' }} >Completo</th>
                                            <th className="text-center p-1" >Item do Edital</th>
                                            <th className="text-center p-1" style={{ width: '12%' }} >Ações</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {materia.edital.map((item, idx) => (
                                            <tr
                                                key={idx}
                                                ref={el => editalRefs.current[idx] = el}
                                                className={idx % 2 === 1 ? 'bg-secondary bg-opacity-10' : ''}
                                            >
                                                <td className="text-center align-middle p-1 pointer" style={{ width: '40px' }} onClick={e => {
                                                    if (e.target.tagName === 'INPUT') return;
                                                    handleCheck(materia.id, idx);
                                                }}>
                                                    <input
                                                        type="checkbox"
                                                        className="form-check-input pointer m-0"
                                                        id={`checkbox-edital-${materia.id}-${idx}`}
                                                        checked={editalCompletos.includes(idx)}
                                                        onChange={() => handleCheck(materia.id, idx)}
                                                    />
                                                </td>
                                                <td className="align-middle p-1" >{item}</td>
                                                <td className="align-middle" style={{ width: '1%' }}>
                                                  <div className="d-flex justify-content-center align-items-center gap-3 w-100">
                                                        <button className="btn-icon p-0  d-flex align-items-center justify-content-center" title="Trocar posição com o item acima" onClick={e => { e.stopPropagation(); handleMoveItem(idx, 'up'); }} disabled={idx === 0}>
                                                            <ChevronUp size={16} className="align-middle" />
                                                        </button>
                                                        <button className="btn-icon p-0  d-flex align-items-center justify-content-center" title="Trocar posição com o item abaixo" onClick={e => { e.stopPropagation(); handleMoveItem(idx, 'down'); }} disabled={idx === materia.edital.length - 1}>
                                                            <ChevronDown size={16} className="align-middle" />
                                                        </button>
                                                        <button className="btn-icon p-0  d-flex align-items-center justify-content-center" title="Editar" onClick={e => { e.stopPropagation(); handleEditItem(idx); }}>
                                                            <Edit size={16} className="align-middle" />
                                                        </button>
                                                        <button className="btn-icon p-0   d-flex align-items-center justify-content-center" title="Apagar" onClick={e => { e.stopPropagation(); handleDeleteItem(idx); }}>
                                                            <Trash2 size={16} className="align-middle" />
                                                        </button>
                                                  </div>
                                                </td>
                                            </tr>
                                        ))}
                                        {/* Linha vazia para adicionar novo item via modal, estilo card vazio */}
                                        <tr>
                                            <td colSpan={3} className="p-0 border-0">
                                                <div
                                                    className="card-padrao-vazio d-flex align-items-center justify-content-center my-2 py-2 px-3 pointer  text-secondary fst-italic"
                                                    onClick={() => setShowAddItemModal(true)}
                                                    onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.09)'}
                                                    onMouseOut={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
                                                >
                                                    <span className="fw-semibold text-secondary">
                                                        + Adicionar Novo Item
                                                    </span>
                                                </div>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                                {showAddItemModal && (
                                    <div ></div>
                                )}
                                <Modal show={showAddItemModal} onHide={() => setShowAddItemModal(false)} centered backdrop="static" className="modal-fundo">
                                    <Modal.Body className="modal-estilo">
                                        <div className="d-flex justify-content-between align-items-center mb-1">
                                            <Modal.Title className="fw-bold fs-5 m-0">Adicionar itens ao edital</Modal.Title>
                                        </div>
                                        <p className="text-secondary mb-3" style={{ fontSize: '0.8em' }}>Digite um item por linha. Cada linha será salva como um tópico separado do edital.</p>
                                        <form className="needs-validation" noValidate onSubmit={e => {
                                            e.preventDefault();
                                            if (!newItemValue.trim()) {
                                                e.target.classList.add('was-validated');
                                                return;
                                            }
                                            handleAddItem();
                                        }}>
                                            <textarea
                                                placeholder="Um item por linha..."
                                                rows={5}
                                                value={newItemValue}
                                                onChange={e => {
                                                    const linhas = e.target.value.split('\n').map(l => l.slice(0, 200));
                                                    setNewItemValue(linhas.join('\n'));
                                                }}
                                                className="form-control linha"
                                                required
                                            />
                                            <div className="d-none">
                                                <input type="text" required value={newItemValue.trim() ? 'ok' : ''} readOnly />
                                            </div>
                                            <div className="d-flex justify-content-end gap-3 mt-4">
                                                <button className="btn btn-outline-primary-primary3" type="button" onClick={() => setShowAddItemModal(false)}>Cancelar</button>
                                                <button className="btn btn-primary-primary3" type="submit">Adicionar</button>
                                            </div>
                                        </form>
                                    </Modal.Body>
                                </Modal>
                                <Modal show={showEditItemModal} onHide={() => setShowEditItemModal(false)} centered backdrop="static" className="modal-fundo">
                                    <Modal.Body className="modal-estilo">
                                        <div className="d-flex justify-content-between align-items-center mb-1">
                                            <Modal.Title className="fw-bold fs-5 m-0">Editar item do edital</Modal.Title>
                                        </div>
                                        <p className="text-secondary mb-3" style={{ fontSize: '0.8em' }}>Altere o texto do item selecionado.</p>
                                        <label className="form-label fw-semibold" style={{ fontSize: '0.78em', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-light)' }}>Item</label>
                                        <input type="text" className="form-control linha" value={editItemValue} onChange={e => setEditItemValue(e.target.value)} />
                                        <div className="d-flex justify-content-end gap-2 mt-3">
                                            <button className="btn btn-outline-primary-primary3" onClick={() => setShowEditItemModal(false)}>Cancelar</button>
                                            <button className="btn btn-primary-primary3" onClick={saveEditItem}>Salvar</button>
                                        </div>
                                    </Modal.Body>
                                </Modal>
                            </div>
                        </div>
                    ) : (
                        <div className="d-flex flex-column align-items-center mt-4">
                            <p className="text-secondary fs-5 mb-3">Nenhum item do edital cadastrado.</p>
                            <Button variant="primary fw-bold" onClick={() => setShowAddItemModal(true)}>
                                + Inserir edital
                            </Button>
                                        <Modal show={showAddItemModal} onHide={() => setShowAddItemModal(false)} centered backdrop="static" className="modal-fundo">
                                <Modal.Body className="modal-estilo">
                                    <div className="d-flex justify-content-between align-items-center mb-1">
                                        <Modal.Title className="fw-bold fs-5 m-0">Adicionar itens ao edital</Modal.Title>
                                    </div>
                                    <p className="text-secondary mb-3" style={{ fontSize: '0.8em' }}>Digite um item por linha. Cada linha será salva como um tópico separado do edital.</p>
                                    <form className="needs-validation" noValidate onSubmit={e => {
                                        e.preventDefault();
                                        if (!newItemValue.trim()) {
                                            e.target.classList.add('was-validated');
                                            return;
                                        }
                                        handleAddItem();
                                    }}>
                                        <textarea
                                            placeholder="Um item por linha..."
                                            rows={5}
                                            value={newItemValue}
                                            onChange={e => {
                                                const linhas = e.target.value.split('\n').map(l => l.slice(0, 200));
                                                setNewItemValue(linhas.join('\n'));
                                            }}
                                            className="form-control linha"
                                            required
                                        />
                                        <div className="d-none">
                                            <input type="text" required value={newItemValue.trim() ? 'ok' : ''} readOnly />
                                        </div>
                                        <div className="d-flex justify-content-end gap-3 mt-4">
                                            <button className="btn btn-outline-primary-primary3" type="button" onClick={() => setShowAddItemModal(false)}>Cancelar</button>
                                            <button className="btn btn-primary-primary3" type="submit">Adicionar</button>
                                        </div>
                                    </form>
                                </Modal.Body>
                            </Modal>
                        </div>
                    )}
                </div>

                <div className="d-flex w-100">
                    {/* Histórico de Estudo da Matéria */}
                    <div className="card-padrao2 fadein w-100 " style={{ padding: '1rem', position: 'relative' }}>
                        <div className="card-title-padrao">Histórico de Estudo</div>
                        <div className="card-content mb-3">
                            <ul className="list-group rounded list-group-flush" style={{ maxHeight: 220, overflowY: 'auto' }}>
                                {loadingEstudos ? (
                                    <li className="list-group-item"><Spinner animation="border" size="sm" /> Carregando estudos...</li>
                                ) : estudos && estudos.length === 0 ? (
                                    <li className="list-group-item">Nenhum registro encontrado.</li>
                                ) : (
                                    estudos.map((estudo, idx) => (
                                        <li key={estudo.id || idx} className="list-group-item d-flex align-items-center justify-content-between">
                                            <span>
                                                {(() => {
                                                    const data = new Date(estudo.dataSessao || estudo.data);
                                                    const dia = data.getUTCDate().toString().padStart(2, '0');
                                                    const mes = (data.getUTCMonth() + 1).toString().padStart(2, '0');
                                                    const ano = data.getUTCFullYear();
                                                    return <strong>{`${dia}/${mes}/${ano}`}</strong>;
                                                })()} - {estudo.disciplina || estudo.categoria || 'Disciplina'}
                                                {estudo.categoria && <span> | <span style={{ color: 'var(--primary-primary)' }}>{estudo.categoria}</span></span>}
                                                {estudo.editalItem && <span> | <span style={{ color: '#ffc107' }}>Edital: {estudo.editalItem}</span></span>}
                                                {' '} - {estudo.tempo} min
                                            </span>
                                            {/* Botões de editar/apagar podem ser adicionados aqui se necessário */}
                                        </li>
                                    ))
                                )}
                            </ul>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

export default MateriaDetalhe;

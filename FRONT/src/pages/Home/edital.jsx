import React, { useEffect, useState, useRef } from 'react';
import ErrorBoundary from './ErrorBoundary.jsx';
import Sidebar from './components/sidebar.jsx';
import api from '../../services/api';
import { useNavigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Modal, Button, Spinner } from 'react-bootstrap';
import { Trash, Eye, EyeOff, BookOpen, Edit2, Check, X, Circle, Folder } from 'react-feather';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Swal from 'sweetalert2';
import Navbar from '../../components/Navbar.jsx';
import { usePageTitle } from '../../components/PageTitleContext';
// (deve vir depois dos imports)

const PALETAS = [
    [
        '#E57373', '#F06292', '#BA68C8', '#7986CB', '#4FC3F7',
        '#4DD0E1', '#81C784', '#FFF176', '#FFD54F', '#FFB74D',
        '#A1887F', '#E57373', '#F06292', '#B0BEC5', '#FF8A65'
    ],
    [
        '#81C784', '#AED581', '#FFB74D', '#FFD54F', '#FF8A65',
        '#9575CD', '#7986CB', '#64B5F6', '#4FC3F7', '#B0BEC5',
        '#A1887F', '#E57373', '#F06292', '#BA68C8', '#FFB300'
    ],
    [
        '#F06292', '#E57373', '#FFB74D', '#FFD54F', '#FFF176',
        '#81C784', '#4DD0E1', '#4FC3F7', '#7986CB', '#9575CD',
        '#BA68C8', '#E57373', '#F06292', '#FF8A65', '#FFD54F'
    ]
];

export { PALETAS };

function Materias() {
    const navigate = useNavigate();
    const toastShownRef = useRef(false);
    const [materias, setMaterias] = useState([]);
    const [projetoSelecionado, setProjetoSelecionado] = useState(() => localStorage.getItem('projetoSelecionado') || '');
    // Removido: projetoPadraoSelecionado não utilizado

    // Estado para modal de Projeto Padrão
    const [showProjetoPadraoModal, setShowProjetoPadraoModal] = useState(false);
    const [nomeProjetoPadrao, setNomeProjetoPadrao] = useState("");

    const [erroProjetoPadrao, setErroProjetoPadrao] = useState("");

    async function handleSalvarProjetoPadrao() {
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
            toast.success("Projeto padrão salvo com sucesso!");
        } catch (error) {
            console.error('Erro ao salvar projeto padrão:', error);
            setErroProjetoPadrao(error?.response?.data?.details || error?.response?.data?.error || error.message || 'Erro desconhecido');
            toast.error("Erro ao salvar projeto padrão.");
        }
    }
    useEffect(() => {
        const projetoSelecionado = localStorage.getItem('projetoSelecionado');
        // Remova o redirecionamento automático:
        // if (!projetoSelecionado && !toastShownRef.current) {
        //     toastShownRef.current = true;
        //     // Primeiro redireciona, depois dispara o toast
        //     navigate('/projeto');
        //     setTimeout(() => {
        //         toast.warn('Insira um projeto para acessar o edital', {
        //             position: "top-right",
        //             autoClose: 5000,
        //             hideProgressBar: false,
        //             closeOnClick: true,
        //             pauseOnHover: true,
        //             draggable: true,
        //         });
        //     }, 300); // delay suficiente para garantir que ToastContainer está montado
        //     return;
        // }
        setProjetoSelecionado(localStorage.getItem('projetoSelecionado') || '');
    }, [navigate]);

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
            toast.success("Edital salvo com sucesso!");
        } catch (error) {
            toast.error('Erro ao salvar edital');
        }
    }
    const [expandedId, setExpandedId] = useState(null);
    // Removido inputMateria pois não é utilizado
    const [materiasInput, setMateriasInput] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editMateriaId, setEditMateriaId] = useState(null);
    const [editMateriaNome, setEditMateriaNome] = useState("");
    const [paletaSelecionada, setPaletaSelecionada] = useState(null);
    const [corSelecionada, setCorSelecionada] = useState('');
    const [editMateriaCor, setEditMateriaCor] = useState('');
    const [showColorDropdown, setShowColorDropdown] = useState(false);
    const [useCustomColor, setUseCustomColor] = useState(false);
    const [showSingleColorDropdown, setShowSingleColorDropdown] = useState(false);
    const colorDropdownRef = useRef(null);
    const singleColorDropdownRef = useRef(null);
    const [selectedPaletteIdx, setSelectedPaletteIdx] = useState(0);
    const [materiasCores, setMateriasCores] = useState([]);
    const PALETA_PADRAO = [].concat(...PALETAS);
    function openEditModal(materia) {
        setEditMateriaId(materia.id);
        setEditMateriaNome(materia.nome);
        setEditMateriaCor(materia.cor || '');
        setShowEditModal(true);
    }

    async function updateMateriaNome() {
        if (!editMateriaNome.trim()) return;
        try {
            await api.put(`/materias/${editMateriaId}`, { nome: editMateriaNome, cor: editMateriaCor });
            setShowEditModal(false);
            setEditMateriaId(null);
            setEditMateriaNome("");
            setEditMateriaCor("");
            getMaterias();
        } catch (error) {
            toast.error("Erro ao atualizar edital.");
        }
    }

    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Se não há projeto selecionado, não carrega nada (apenas mostra mensagem)
        if (!projetoSelecionado) {
            setLoading(false);
            setMaterias([]);
            setProjetosPadrao([]);
            return;
        }

        // Só executa loading se há projeto selecionado
        setLoading(true);
        const promises = [];

        // Carrega matérias
        promises.push(getMaterias());

        // Carrega projetos padrão
        promises.push(
            api.get('/projetos-padrao')
                .then(res => setProjetosPadrao(res.data))
                .catch(() => setProjetosPadrao([]))
        );

        Promise.all(promises).finally(() => setLoading(false));
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
            const materiasList = materiasInput.split('\n').map(m => m.trim()).filter(m => m.length > 0);
            if (materiasList.length === 0) return;
            let corPorMateria = materiasCores.map(c => c === '__open__' ? '' : c);
            if (corPorMateria.length < materiasList.length) {
                corPorMateria = materiasList.map((_, idx) => corPorMateria[idx] || '');
            }
            await Promise.all(materiasList.map((nome, idx) => {
                return api.post('/edital', { nome, projetoId, userId, cor: corPorMateria[idx] });
            }));
            await getMaterias();
            setMateriasInput("");
            setMateriasCores([]);
            setShowModal(false);
            setCorSelecionada("");
            setPaletaSelecionada(null);
        } catch (error) {
            toast.error("Erro ao criar edital. Verifique os dados e tente novamente.");
            console.error("Erro ao criar edital:", error);
        }
    }

    async function deleteMateria(id) {
        if (!window.confirm('Deseja apagar esta matéria? Essa ação não pode ser desfeita.')) return;
        try {
            await api.delete(`/edital/${id}`);
            getMaterias(); // atualiza a lista
        } catch (error) {
            toast.error('Erro ao deletar edital.');
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

    // Estado para progresso de cada matéria
    const [materiasProgresso, setMateriasProgresso] = useState({});

    // Busca progresso do BD para cada matéria
    useEffect(() => {
        async function fetchProgresso() {
            const userId = JSON.parse(localStorage.getItem('user'))?.id;
            if (!userId || materias.length === 0) return;
            const progressoObj = {};
            await Promise.all(materias.map(async mat => {
                try {
                    const res = await api.get('/edital-progresso', { params: { userId, materiaId: mat.id } });
                    progressoObj[mat.id] = Array.isArray(res.data.completos) ? res.data.completos : [];
                } catch {
                    progressoObj[mat.id] = [];
                }
            }));
            setMateriasProgresso(progressoObj);
        }
        fetchProgresso();
    }, [materias]);

    // Função para calcular progresso do edital de cada matéria usando BD
    function getPorcentagem(materia) {
        const completos = materiasProgresso[materia.id] || [];
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

    const { setTitle } = usePageTitle();
    useEffect(() => {
        setTitle('Edital');
        document.title = 'FLUX | Edital';
    }, [setTitle]);

    useEffect(() => {
        if (!showColorDropdown) return;
        function handleClickOutside(event) {
            if (colorDropdownRef.current && !colorDropdownRef.current.contains(event.target)) {
                setShowColorDropdown(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showColorDropdown]);

    useEffect(() => {
        if (!showSingleColorDropdown) return;
        function handleClickOutside(event) {
            if (singleColorDropdownRef.current && !singleColorDropdownRef.current.contains(event.target)) {
                setShowSingleColorDropdown(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showSingleColorDropdown]);

    useEffect(() => {
        function handleClickOutside(event) {
            document.querySelectorAll('.border[style*="z-index: 10"]').forEach((el, idx) => {
                if (!el.contains(event.target)) {
                    setMateriasCores(materiasCores => materiasCores.map(c => c === '__open__' ? '' : c));
                }
            });
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    // Estado para acertos, erros e brancos por matéria
    const [statsPorMateria, setStatsPorMateria] = useState({});

    // Buscar stats no banco para cada matéria
    useEffect(() => {
        async function fetchStats() {
            const userId = JSON.parse(localStorage.getItem('user'))?.id;
            const projetoId = localStorage.getItem('projetoSelecionado');
            if (!userId || !projetoId || materias.length === 0) return;
            const statsObj = {};
            await Promise.all(materias.map(async mat => {
                try {
                    const res = await api.get('/dashboard/stats-materia', { params: { userId, projetoId, materiaId: mat.id } });
                    statsObj[mat.id] = {
                        acertos: res.data.acertos || 0,
                        erros: res.data.erros || 0,
                        brancos: res.data.brancos || 0
                    };
                } catch {
                    statsObj[mat.id] = { acertos: 0, erros: 0, brancos: 0 };
                }
            }));
            setStatsPorMateria(statsObj);
        }
        fetchStats();
    }, [materias]);

    const [delays, setDelays] = useState([]);

    useEffect(() => {
        if (materias.length > 0) {
            // Cria delays sequenciais para efeito cascata
            setDelays(materias.map((_, idx) => `${idx * 0.1}s`));
        }
    }, [materias.length]);

    if (loading) {
        return (
            <div style={{ width: '400px', height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: 'auto' }}>
                <Spinner animation="border" role="status" />
            </div>
        );
    }

    return (
        <>
            {!projetoSelecionado ? (
                <div className="app-container d-flex flex-column justify-content-center align-items-center" style={{ minHeight: '80vh' }}>
                    <div className="d-flex flex-column align-items-center text-center">
                        <Folder size={48} className="mb-3 text-secondary" />
                        <h4 className="mb-3 text-secondary fs-6">
                            Nenhum projeto selecionado.<br />
                            Selecione ou crie um projeto para acessar o edital.
                        </h4>
                        <button className="btn btn-primary-primary px-4 py-2" onClick={() => navigate('/projeto')}>
                            Ir para Projetos
                        </button>
                    </div>
                </div>
            ) : (
                <div className='app-container '>
                    <main className="container-fluid gap-4 pt-3 " style={{ animationDelay: '0.05s', paddingTop: 90 }}>

                        <div className="d-flex align-items-center gap-4 w-100">
                            <span className="d-flex text-secondary align-items-center gap-2 fw-bold text-nowrap">
                                Progresso Geral do Edital:
                                <span>{getProgressoGeral()}%</span>
                            </span>
                            <div className="flex-grow-1  rounded-pill " style={{ backgroundColor: 'rgba(0, 0, 0, 0.08)', height: '3px' }} >
                                <div className="bg-primary-primary3 rounded-pill" style={{ height: '3px', width: `${getProgressoGeral()}%`, transition: 'width 0.3s' }}></div>
                            </div>

                        </div>
                        <div className="m-0 w-100 p-3 border fadein position-relative " style={{ borderRadius: '1em', animationDelay: '0.7s' }}>
                            <div className="card-title-padrao position-absolute px-3" style={{ top: '-12px', left: '20px', zIndex: 1, backgroundColor: 'var(--background)' }}>CONTEÚDO PROGRAMÁTICO</div>
                        <div className="row g-3">
                            {/* Cards de matérias */}
                            {materias.length > 0 ? (
                                materias.map((materia, idx) => {
                                    const progresso = getPorcentagem(materia);
                                    const feitos = (materiasProgresso[materia.id] || []).length;
                                    const total = Array.isArray(materia.edital) ? materia.edital.length : 0;
                                    const stats = statsPorMateria[materia.id] || { acertos: 0, erros: 0, brancos: 0 };
                                    const totalQuestoes = stats.acertos + stats.erros + stats.brancos;
                                    const pctAcertos = totalQuestoes > 0 ? Math.round((stats.acertos / totalQuestoes) * 100) : 0;
                                    const pctErros = totalQuestoes > 0 ? Math.round((stats.erros / totalQuestoes) * 100) : 0;
                                    const pctBrancos = totalQuestoes > 0 ? Math.round((stats.brancos / totalQuestoes) * 100) : 0;
                                    // Gera delay sequencial para efeito cascata
                                    const animationDelay = delays[idx] || '0s';
                                    return (
                                        <div className="col-12 col-sm-6 col-md-4 col-lg-3 d-flex" key={materia.id}>
                                            <div
                                                className="pointer card-padrao fadein card-padrao-hover w-100 d-flex flex-column position-relative"
                                                style={{
                                                    height: 200,
                                                    backgroundColor: materia.cor ? `${materia.cor}15` : '#0d6efd15',
                                                    animationDelay,
                                                    padding: 0,
                                                    overflow: 'hidden',
                                                }}
                                                onClick={() => navigate(`/materia/${materia.id}`)}
                                            >
                                                {/* Header do card */}
                                                <div className="p-3 pb-2 position-relative" style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                                                    <h6 className="m-0 fw-bold" style={{
                                                        fontSize: '0.9rem',
                                                        lineHeight: '1.3',
                                                        color: '#fff',
                                                        minHeight: '2.6rem',
                                                        display: '-webkit-box',
                                                        WebkitLineClamp: 2,
                                                        WebkitBoxOrient: 'vertical',
                                                        overflow: 'hidden',
                                                        paddingRight: '80px'
                                                    }}>
                                                        {materia.nome}
                                                    </h6>

                                                    {/* Botões de ação no canto superior direito */}
                                                    <div
                                                        className="position-absolute d-flex gap-1"
                                                        style={{ top: '8px', right: '8px' }}
                                                    >
                                                        <button
                                                            className="btn d-flex align-items-center justify-content-center"
                                                            style={{
                                                                width: '32px',
                                                                height: '32px',
                                                                border: 'none',
                                                                backgroundColor: 'transparent',
                                                                color: '#6c757d',
                                                                borderRadius: '8px',
                                                                padding: 0,
                                                                outline: 'none',
                                                                boxShadow: 'none',
                                                                cursor: 'pointer',
                                                                transition: 'none'
                                                            }}
                                                            onClick={e => {
                                                                e.stopPropagation();
                                                                setEditMateriaId(materia.id);
                                                                setEditMateriaNome(materia.nome);
                                                                setShowEditModal(true);
                                                            }}
                                                            title="Editar matéria"
                                                        >
                                                            <Edit2 size={18} style={{ fontSize: '1.1rem', color: 'var(--primary-primary)' }} />
                                                        </button>
                                                        <button
                                                            className="btn d-flex align-items-center justify-content-center"
                                                            style={{
                                                                width: '32px',
                                                                height: '32px',
                                                                border: 'none',
                                                                backgroundColor: 'transparent',
                                                                color: '#6c757d',
                                                                borderRadius: '8px',
                                                                padding: 0,
                                                                outline: 'none',
                                                                boxShadow: 'none',
                                                                cursor: 'pointer',
                                                                transition: 'none'
                                                            }}
                                                            onClick={e => {
                                                                e.stopPropagation();
                                                                deleteMateria(materia.id);
                                                            }}
                                                            title="Apagar matéria"
                                                        >
                                                            <Trash size={18} style={{ fontSize: '1.1rem', color: 'var(--primary-primary)' }} />
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* Conteúdo principal */}
                                                <div className="flex-grow-1 p-3 pt-2 d-flex flex-column justify-content-between">
                                                    {/* Progresso do edital */}
                                                    {Array.isArray(materia.edital) && materia.edital.length > 0 ? (
                                                        <div className="mb-3">
                                                            <div className="d-flex justify-content-between align-items-center mb-2">
                                                                <span className="text-secondary small">Progresso do Edital</span>
                                                                <span
                                                                    className="badge text-dark fw-bold"
                                                                    style={{ backgroundColor: materia.cor || '#0d6efd' }}
                                                                >
                                                                    {progresso}%
                                                                </span>
                                                            </div>
                                                            <div className="progress mb-2" style={{ height: '6px', backgroundColor: 'rgba(0, 0, 0, 0.08)' }}>
                                                                <div
                                                                    className="progress-bar"
                                                                    style={{
                                                                        width: `${progresso}%`,
                                                                        backgroundColor: materia.cor || '#4CAF50',
                                                                        transition: 'width 0.5s ease'
                                                                    }}
                                                                ></div>
                                                            </div>
                                                            <div className="text-center">
                                                                <span className="text-secondary small">
                                                                    <strong>{feitos}</strong> de <strong>{total}</strong> itens completos
                                                                </span>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="d-flex flex-column justify-content-center align-items-center flex-grow-1">
                                                            <div className="text-center text-secondary small">
                                                                Clique para inserir o edital
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>


                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <></>
                            )}
                            {/* Card vazio para adicionar nova matéria */}
                            <div className="col-12 col-sm-6 col-md-4 col-lg-3 d-flex pointer fadein" style={{ animationDelay: `${materias.length * 0.1}s` }}>
                                <div
                                    className="card-padrao-vazio-hover card-padrao-vazio w-100 d-flex flex-column justify-content-center align-items-center position-relative"
                                    style={{
                                        height: 200,
                                        padding: 0,
                                        overflow: 'hidden'
                                    }}
                                    onClick={() => setShowModal(true)}
                                >
                                    <div className="d-flex flex-column align-items-center justify-content-center h-100 w-100 p-3">
                                        <span className="fw-bold fs-6 text-secondary text-center">+ Adicionar Nova Matéria</span>
                                        <span className="fs-6 text-secondary mt-2 text-center">Clique para cadastrar uma nova matéria</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        </div>
                    </main>
                </div>
            )}
            <Modal className='modal-fundo' show={showProjetoPadraoModal} onHide={() => setShowProjetoPadraoModal(false)} centered backdrop="static">
                <Modal.Body className='modal-estilo'>
                    <div className="d-flex justify-content-between align-items-center mb-1">
                        <Modal.Title className='fw-bold fs-5 m-0'>Salvar como Projeto Padrão</Modal.Title>
                    </div>
                    <p className="text-secondary mb-4" style={{ fontSize: '0.8em' }}>Um projeto padrão pode ser reutilizado para criar novos projetos com as mesmas matérias e edital. Defina um nome de identificação.</p>
                    <div className="mb-3">
                        <label className="form-label fw-semibold" style={{ fontSize: '0.78em', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-light)' }}>Nome do Projeto Padrão</label>
                        <input type="text" className="form-control linha" value={nomeProjetoPadrao} onChange={e => setNomeProjetoPadrao(e.target.value)} />
                    </div>
                    <div className="mb-3">
                        <label className="form-label fw-semibold" style={{ fontSize: '0.78em', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-light)' }}>Matérias incluídas ({materias.length})</label>
                        <ul className="mb-0" style={{ fontSize: '0.82em', color: 'var(--text-light)', paddingLeft: '1.2em', maxHeight: 120, overflowY: 'auto' }}>
                            {materias.map((mat, idx) => (
                                <li key={idx}><strong>{mat.nome}</strong>{Array.isArray(mat.edital) && mat.edital.length > 0 && <span className="text-secondary"> — {mat.edital.length} item(s)</span>}</li>
                            ))}
                        </ul>
                    </div>
                    {erroProjetoPadrao && <div className="text-danger mb-2" style={{ fontSize: '0.82em' }}>{erroProjetoPadrao}</div>}
                    <div className="d-flex justify-content-end gap-2 mt-3">
                        <button type="button" onClick={() => setShowProjetoPadraoModal(false)} className="btn btn-outline-primary-primary3">Cancelar</button>
                        <button type="button" onClick={handleSalvarProjetoPadrao} className="btn btn-primary-primary3">Salvar Projeto Padrão</button>
                    </div>
                </Modal.Body>
            </Modal>
            {showModal && (
                <></>
            )}
            <Modal className='modal-fundo' show={showModal} onHide={() => setShowModal(false)} centered backdrop="static">
                <Modal.Body className='modal-estilo'>
                    <div className="d-flex justify-content-between align-items-center mb-1">
                        <Modal.Title className='fw-bold fs-5 m-0'>Inserir nova matéria</Modal.Title>
                    </div>
                    <p className="text-secondary mb-3" style={{ fontSize: '0.8em' }}>Digite uma matéria por linha (máx. 50 caracteres). Selecione uma cor para cada uma abaixo.</p>
                    <form className="form-modal needs-validation" noValidate onSubmit={e => {
                        e.preventDefault();
                        if (!materiasInput.trim()) {
                            e.target.classList.add('was-validated');
                            return;
                        }
                        createMateria();
                    }}>
                        <textarea
                            placeholder="Uma matéria por linha..."
                            name='edital'
                            rows={5}
                            value={materiasInput}
                            onChange={e => {
                                const linhas = e.target.value.split('\n').map(l => l.slice(0, 50));
                                setMateriasInput(linhas.join('\n'));
                                setMateriasCores(linhas.map((_, idx) => materiasCores[idx] || PALETA_PADRAO[idx % PALETA_PADRAO.length]));
                            }}
                            className="linha    form-control"
                            required
                        />
                        <small>Você pode adicionar várias matérias de uma vez, separando cada uma em uma linha.</small>
                        <div className="mt-2 d-flex flex-wrap" style={{ gap: 8 }}>
                            {materiasInput.trim().split('\n').filter(l => l.trim()).map((nome, idx) => (
                                nome.trim() && (
                                    <div key={idx} style={{ flex: '1 1 45%', minWidth: 0, maxWidth: '48%' }}>
                                        <div style={{ position: 'relative', maxWidth: 180 }}>
                                            <button type="button" className="form-select d-flex align-items-center gap-1" style={{ width: '100%', minHeight: 28, padding: '0 6px', cursor: 'pointer', fontSize: '0.95em', height: 28 }} onClick={() => setMateriasCores(materiasCores.map((c, i) => i === idx ? '__open__' : c))}>
                                                <div style={{ width: 16, height: 16, borderRadius: '5px', background: materiasCores[idx] && materiasCores[idx] !== '__open__' ? materiasCores[idx] : '#eee', border: '1px solid #888', marginRight: 6 }}></div>
                                                <span style={{ color: '#888', fontSize: '0.95em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{nome}</span>
                                            </button>
                                            {materiasCores[idx] === '__open__' && (
                                                <div className='border' style={{ position: 'absolute', zIndex: 10, top: 32, left: 0, background: '#fff', borderRadius: 8, padding: 8, minWidth: 120, maxWidth: 180 }}>
                                                    <div className="d-flex flex-wrap gap-1 mb-1" style={{ maxWidth: 160 }}>
                                                        {PALETA_PADRAO.map((cor, cidx) => (
                                                            <div key={cor} style={{ width: 16, height: 16, borderRadius: '5px', background: cor, border: materiasCores[idx] === cor ? '2px solid #eee' : '1px solid #eee', cursor: 'pointer', marginBottom: 1 }} onClick={() => setMateriasCores(materiasCores.map((c, i) => i === idx ? cor : c))} title={cor}></div>
                                                        ))}
                                                    </div>
                                                    <div className="d-flex align-items-center gap-1 mt-1">
                                                        <input className='pointer' type="color" value={materiasCores[idx] && materiasCores[idx] !== '__open__' ? materiasCores[idx] : '#000000'} onChange={e => setMateriasCores(materiasCores.map((c, i) => i === idx ? e.target.value : c))} style={{ width: 18, height: 18, borderRadius: '5px', border: '2px solid #eee', marginRight: 2, outline: 'none', background: 'none', boxShadow: 'none' }} />
                                                        <label className='text-muted' style={{ fontSize: '0.85em' }}>Cor personalizada</label>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )
                            ))}
                        </div>
                        <div className="d-none">
                            <input type="text" required value={materiasInput.trim() ? 'ok' : ''} readOnly />
                        </div>
                        <div className="d-flex justify-content-end gap-2 mt-3">
                            <button type="button" onClick={() => setShowModal(false)} className="btn btn-outline-primary-primary3">
                                Cancelar
                            </button>
                            <button type="submit" className="btn btn-primary-primary3">
                                Cadastrar
                            </button>
                        </div>
                    </form>
                </Modal.Body>
            </Modal>
            {editModalId !== null && (
                <></>
            )}
            <Modal className='modal-fundo' show={editModalId !== null} onHide={() => { setEditModalId(null); setEditalInputs(""); }} centered backdrop="static">
                <Modal.Body className='modal-estilo'>
                    <div className="d-flex justify-content-between align-items-center mb-1">
                        <Modal.Title className='fw-bold fs-5 m-0'>{editModalId && editModalId.includes('-') ? "Editar item do edital" : "Inserir itens no edital"}</Modal.Title>
                    </div>
                    <p className="text-secondary mb-3" style={{ fontSize: '0.8em' }}>{editModalId && editModalId.includes('-') ? 'Edite o texto do item selecionado.' : 'Digite um item por linha para adicionar vários de uma vez.'}</p>
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
                                className="form-control linha mb-2"
                                value={editalInputs}
                                onChange={e => setEditalInputs(e.target.value)}
                                placeholder="Digite o item do edital"
                                required
                            />
                        ) : (
                            <textarea
                                value={editalInputs}
                                onChange={e => setEditalInputs(e.target.value)}
                                className="form-control linha mb-2"
                                placeholder="Digite um item por linha"
                                rows={5}
                                required
                            />
                        )}
                        {!editModalId || !editModalId.includes('-') ? (
                            <small>Você pode adicionar vários itens de uma vez, separando cada um em uma linha.</small>
                        ) : null}
                        <div className="d-none">
                            <input type="text" required value={editalInputs.trim() ? 'ok' : ''} readOnly />
                        </div>
                        <div className="d-flex justify-content-end gap-2 mt-3">
                            <button type="button" onClick={() => { setEditModalId(null); setEditalInputs(""); }} className="btn btn-outline-primary-primary3">Cancelar</button>
                            <button type="submit" className="btn btn-primary-primary3">Salvar</button>
                        </div>
                    </form>
                </Modal.Body>
            </Modal>
            {showEditModal && (
                <></>
            )}
            <Modal className='modal-fundo' show={showEditModal} onHide={() => setShowEditModal(false)} centered backdrop="static">
                <Modal.Body className='modal-estilo'>
                    <div className="d-flex justify-content-between align-items-center mb-1">
                        <Modal.Title className='fw-bold fs-5 m-0'>Editar matéria</Modal.Title>
                    </div>
                    <p className="text-secondary mb-3" style={{ fontSize: '0.8em' }}>Altere o nome e a cor de identificação da matéria.</p>
                    <div className="mb-3">
                        <label className="form-label fw-semibold" style={{ fontSize: '0.78em', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-light)' }}>Nome</label>
                        <input type="text" className="linha form-control" value={editMateriaNome} onChange={e => setEditMateriaNome(e.target.value.slice(0, 50))} maxLength={50} />
                    </div>
                    <div className="mb-3">
                        <label className="form-label fw-semibold" style={{ fontSize: '0.78em', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-light)' }}>Cor</label>
                    <div style={{ position: 'relative', maxWidth: 260 }}>
                        <button type="button" className=" form-select d-flex align-items-center gap-2" style={{ width: '100%', minHeight: 38, padding: '0 8px', cursor: 'pointer' }} onClick={() => setShowColorDropdown(v => !v)}>
                            <div style={{ width: 24, height: 24, borderRadius: '6px', background: editMateriaCor || '#eee', border: '1px solid #888', marginRight: 8 }}></div>
                            <span style={{ color: '#888', fontSize: '1em' }}>Selecionar Cor...</span>
                        </button>
                        {showColorDropdown && (
                            <div ref={colorDropdownRef} className='border' style={{ position: 'absolute', zIndex: 10, top: 44, left: 0, background: '#fff', borderRadius: 8, padding: 12, minWidth: 220, maxWidth: 320 }}>
                                <div className="d-flex flex-wrap gap-1 mb-2" style={{ maxWidth: 260 }}>
                                    {[].concat(...PALETAS).map((cor, idx) => (
                                        <div key={cor} style={{ width: 24, height: 24, borderRadius: '6px', background: cor, border: editMateriaCor === cor ? '2px solid #eee' : '1px solid #eee', cursor: 'pointer', marginBottom: 2 }} onClick={() => { setEditMateriaCor(cor); }} title={cor}></div>
                                    ))}
                                </div>
                                <div className="d-flex align-items-center gap-2 mt-2">
                                    <input className='pointer' type="color" value={editMateriaCor || ''} onChange={e => { setEditMateriaCor(e.target.value); }} style={{ width: 24, height: 24, borderRadius: '6px', border: '2px solid #eee', marginRight: 4, outline: 'none', background: 'none', boxShadow: 'none' }} />
                                    <label className='text-muted'>COR PERSONALIZADA</label>
                                </div>
                            </div>
                        )}
                    </div>
                    </div>
                    <div className="d-flex justify-content-end gap-2 mt-3">
                        <button type="button" onClick={() => setShowEditModal(false)} className="btn btn-outline-primary-primary3">
                            Cancelar
                        </button>
                        <button type="button" onClick={updateMateriaNome} className="btn btn-primary-primary3">
                            Salvar
                        </button>
                    </div>
                </Modal.Body>
            </Modal>
        </>
    );
}

// Export Materias wrapped in ErrorBoundary
function EditalWithBoundary(props) {
    return (
        <ErrorBoundary>
            <Materias {...props} />
        </ErrorBoundary>
    );
}

export default EditalWithBoundary;
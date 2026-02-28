import { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { Button, Modal } from 'react-bootstrap';
import { FaTrash } from 'react-icons/fa';

function EditalMateria() {
    // Recupera usuário e projeto selecionado
    const userId = JSON.parse(localStorage.getItem('user'))?.id;
    const projetoId = localStorage.getItem('projetoSelecionado');
    const { id } = useParams();
    const navigate = useNavigate();
    const [edital, setEdital] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [completos, setCompletos] = useState([]);
    const [materiaNome, setMateriaNome] = useState('');
    const textareaRef = useRef();

    // Carregar progresso do localStorage
    useEffect(() => {
        async function fetchEdital() {
            try {
                // Filtra pelo projeto e usuário
                const res = await api.get(`/materias/${id}/edital`, {
                  params: { userId, projetoId }
                });
                setEdital(res.data || []);
                // Tenta carregar progresso salvo
                const saved = localStorage.getItem(`edital-completos-${id}-${projetoId}`);
                setCompletos(saved ? JSON.parse(saved) : []);
            } catch (error) {
                console.error('Erro ao carregar edital:', error);
            }
        }
        async function fetchMateriaNome() {
            try {
                const res = await api.get(`/edital`);
                const materia = res.data.find(m => m.id === id);
                setMateriaNome(materia ? materia.nome : '');
            } catch (error) {
                setMateriaNome('');
            }
        }
        fetchEdital();
        fetchMateriaNome();
    }, [id]);

    // Salvar progresso no localStorage
    function handleCheck(idx) {
        let novos = completos.includes(idx)
            ? completos.filter(i => i !== idx)
            : [...completos, idx];
        setCompletos(novos);
        localStorage.setItem(`edital-completos-${id}-${projetoId}`, JSON.stringify(novos));
    }

    async function handleSaveEdital() {
        const texto = textareaRef.current.value;
        const linhas = texto.split('\n').map(l => l.trim()).filter(l => l);
        try {
            await api.post(`/materias/${id}/edital`, { edital: linhas, userId, projetoId });
            setEdital(linhas);
            setShowModal(false);
            setCompletos([]);
            localStorage.removeItem(`edital-completos-${id}-${projetoId}`);
        } catch (error) {
            alert('Erro ao salvar edital');
        }
    }

    const total = edital.length;
    const feitos = completos.length;
    const porcentagem = total > 0 ? Math.round((feitos / total) * 100) : 0;

    return (
        <main className="conteudo">
            <div className="container">
                <div className="titulo-pagina"><h2>{materiaNome}</h2></div>
                <Button variant="secondary" style={{ marginBottom: '1em', width:'5em' }} onClick={() => navigate(-1)}>
                    Voltar
                </Button>   
                <Button variant="primary" onClick={() => setShowModal(true)}>
                    Inserir/Editar Edital
                </Button>
                
                {total > 0 ?
                    <table className="table table-bordered">
                        <thead>
                            <tr>
                                <th className="edital-header">Completo</th>
                                <th className="edital-header">Item do Edital</th>
                                <th className="edital-header">Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {edital.map((item, idx) => (
                                <tr key={idx}>
                                    <td style={{ textAlign: 'center' }}>
                                        <div className="form-check form-switch d-flex justify-content-center">
                                            <input
                                                className="form-check-input"
                                                type="checkbox"
                                                id={`switch-edital-${idx}`}
                                                checked={completos.includes(idx)}
                                                onChange={() => handleCheck(idx)}
                                            />
                                        </div>
                                    </td>
                                    <td style={idx === 0 ? { textAlign: 'center', textTransform: 'uppercase', fontWeight: 'bold' } : {}}>{item}</td>
                                    <td style={{ width: '100px', textAlign: 'center' }}>
                                        <button
                                            className="btn btn-outline-danger btn-sm d-flex align-items-center justify-content-center"
                                            style={{ padding: '0.25em 0.5em', minWidth: '32px', minHeight: '32px' }}
                                            onClick={async () => {
                                                const confirm1 = window.confirm('Tem certeza que deseja apagar este item do edital?');
                                                if (!confirm1) return;
                                                const confirm2 = window.confirm('Essa ação não pode ser desfeita. Deseja realmente apagar?');
                                                if (!confirm2) return;
                                                const novoEdital = edital.filter((_, i) => i !== idx);
                                                await api.post(`/materias/${id}/edital`, { edital: novoEdital, userId, projetoId });
                                                setEdital(novoEdital);
                                                setCompletos(completos.filter(i => i !== idx));
                                                localStorage.setItem(`edital-completos-${id}`, JSON.stringify(completos.filter(i => i !== idx)));
                                            }}
                                            title="Apagar"
                                        >
                                            <FaTrash style={{ fontSize: '20px' }} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    :
                    <p>Nenhum edital cadastrado.</p>
                }
                <Modal show={showModal} onHide={() => setShowModal(false)}>
                    <Modal.Header closeButton>
                        <Modal.Title>Colar conteúdo do edital</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <textarea ref={textareaRef} rows={15} style={{ width: '100%' }} placeholder="Cole o edital aqui, cada linha será um item." className="input-dark" />
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={() => setShowModal(false)}>Cancelar</Button>
                        <Button variant="primary" onClick={handleSaveEdital}>Salvar</Button>
                    </Modal.Footer>
                </Modal>
            </div>
        </main>
    );
}

export default EditalMateria;

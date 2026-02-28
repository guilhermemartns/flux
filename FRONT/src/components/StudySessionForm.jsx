import React, { useContext, useState, useEffect } from 'react';
import { Modal, Button } from 'react-bootstrap';
import api from '../services/api';
import { StudyTimerContext } from './StudyTimerContext';

const formatTime = (seconds) => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

const StudySessionForm = () => {
  const [dataSessao, setDataSessao] = useState(() => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  });
  const { isFormOpen, closeForm, timer, resetTimer, setTimer } = useContext(StudyTimerContext);
  const [categoria, setCategoria] = useState('');
  const [novaCategoria, setNovaCategoria] = useState('');
  const [disciplina, setDisciplina] = useState('');
  const [saved, setSaved] = useState(false);
  const [tempoEdit, setTempoEdit] = useState(formatTime(timer.seconds));
  const [materias, setMaterias] = useState([]);
  const [vincularCiclo, setVincularCiclo] = useState(true);
  useEffect(() => {
    async function fetchMaterias() {
      try {
        const projetoId = localStorage.getItem('projetoSelecionado');
        const userObj = localStorage.getItem('user');
        const userId = userObj ? JSON.parse(userObj).id : '';
        if (!userId || !projetoId) return setMaterias([]);
        const res = await api.get('/edital', { params: { userId, projetoId } });
        setMaterias(res.data.filter(mat => mat.projetoId === projetoId));
      } catch {
        setMaterias([]);
      }
    }
    if (isFormOpen) fetchMaterias();
  }, [isFormOpen]);

  // Atualizar tempoEdit sempre que o timer mudar ou o modal abrir
  useEffect(() => {
    if (isFormOpen) {
      setTempoEdit(formatTime(timer.seconds));
    }
  }, [isFormOpen, timer.seconds]);

  if (!isFormOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Usa novaCategoria se selecionado
    const categoriaFinal = categoria === 'nova' ? novaCategoria : categoria;
    // Converter tempoEdit (hh:mm:ss) para minutos
    const [h, m, s] = tempoEdit.split(':').map(v => parseInt(v, 10) || 0);
    const tempoMinutos = h * 60 + m + Math.floor(s / 60);
    setTimer(prev => ({ ...prev, seconds: tempoMinutos * 60 }));
    try {
      const userObj = localStorage.getItem('user');
      const userId = userObj ? JSON.parse(userObj).id : '';
      const projetoId = localStorage.getItem('projetoSelecionado');
      const materiaObj = materias.find(m => m.nome === disciplina);
      
      // Validação de campos
      if (!userId) {
        alert('Erro: Usuário não autenticado. Faça login novamente.');
        return;
      }
      if (!projetoId) {
        alert('Erro: Projeto não selecionado. Selecione um projeto.');
        return;
      }
      if (!disciplina) {
        alert('Erro: Disciplina não selecionada.');
        return;
      }
      if (!materiaObj) {
        alert('Erro: Matéria não encontrada.');
        return;
      }
      if (!categoria) {
        alert('Erro: Categoria não selecionada.');
        return;
      }
      
      let cicloId = null;
      if (vincularCiclo) {
        // Busca ciclo cadastrado
        const cicloRes = await api.get('/ciclos', { params: { userId, projetoId } });
        const ciclo = cicloRes.data && cicloRes.data.length > 0 ? cicloRes.data[cicloRes.data.length - 1] : null;
        cicloId = ciclo ? ciclo.id : null;
      }
      
      const payload = {
        userId,
        projetoId,
        materiaId: materiaObj.id,
        tempo: tempoMinutos,
        categoria: categoriaFinal,
        disciplina,
        dataSessao: dataSessao + 'T00:00:00.000Z',
        cicloId: cicloId || null
      };
      
      console.log('[StudySessionForm] ====== DEBUG PAYLOAD ======');
      console.log('[StudySessionForm] userId:', userId, '| tipo:', typeof userId);
      console.log('[StudySessionForm] projetoId:', projetoId, '| tipo:', typeof projetoId);
      console.log('[StudySessionForm] materiaId:', materiaObj.id, '| tipo:', typeof materiaObj.id);
      console.log('[StudySessionForm] tempo:', tempoMinutos, '| tipo:', typeof tempoMinutos);
      console.log('[StudySessionForm] categoria:', categoriaFinal, '| tipo:', typeof categoriaFinal);
      console.log('[StudySessionForm] disciplina:', disciplina, '| tipo:', typeof disciplina);
      console.log('[StudySessionForm] Payload completo:', payload);
      console.log('[StudySessionForm] ====== FIM DEBUG ======');
      
      const response = await api.post('/estudo', payload);
      console.log('[StudySessionForm] Resposta da API:', response.data);
      
      setSaved(true);
      resetTimer();
      setTimeout(() => {
        setSaved(false);
        closeForm();
      }, 1500);
    } catch (err) {
      console.error('[StudySessionForm] Erro ao salvar estudo:', err);
      alert('Erro ao salvar estudo: ' + (err.response?.data?.error || err.message));
    }
  };

  return (
    <Modal show={true} onHide={closeForm} centered size="lg">
      <Modal.Header closeButton>
        <Modal.Title>Salvar Sessão de Estudo</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <form onSubmit={handleSubmit} id="study-session-form">
          <div className="mb-3">
            <label className="form-label">Tempo e Data da sessão</label>
            <div className="d-flex align-items-center gap-2">
              <input
                type="text"
                className="form-control input-dark linha"
                style={{ padding: '0.4em 0.6em', borderRadius: '8px', background: '#f8fafc', color: '#222', fontWeight: 500, maxWidth: '120px' }}
                value={tempoEdit}
                onChange={e => {
                  // Permite apenas números, máximo 6 dígitos
                  let raw = e.target.value.replace(/\D/g, '').slice(0, 6);
                  let arr = raw.padStart(6, '0').split('');
                  let h = arr[0] + arr[1];
                  let m = arr[2] + arr[3];
                  let s = arr[4] + arr[5];
                  setTempoEdit(`${h}:${m}:${s}`);
                }}
                placeholder="hh:mm:ss"
                required
              />
              <input
                type="date"
                className="form-control input-dark linha"
                style={{ padding: '0.4em 0.6em', borderRadius: '8px', background: '#f8fafc', color: '#222', fontWeight: 500 }}
                value={dataSessao}
                onChange={e => setDataSessao(e.target.value)}
                required
              />
              <button type="button" className="btn btn-outline-primary-primary" style={{ whiteSpace: 'nowrap' }} onClick={() => {
                const today = new Date();
                const yyyy = today.getFullYear();
                const mm = String(today.getMonth() + 1).padStart(2, '0');
                const dd = String(today.getDate()).padStart(2, '0');
                setDataSessao(`${yyyy}-${mm}-${dd}`);
              }}>Hoje</button>
              <button type="button" className="btn btn-outline-secondary" style={{ whiteSpace: 'nowrap' }} onClick={() => {
                const yesterday = new Date();
                yesterday.setDate(yesterday.getDate() - 1);
                const yyyy = yesterday.getFullYear();
                const mm = String(yesterday.getMonth() + 1).padStart(2, '0');
                const dd = String(yesterday.getDate()).padStart(2, '0');
                setDataSessao(`${yyyy}-${mm}-${dd}`);
              }}>Ontem</button>
            </div>
          </div>
          <div className="mb-3">
            <label className="form-label">Categoria do estudo</label>
            <select className="form-control input-dark linha" style={{ padding: '0.4em 0.6em', borderRadius: '8px', background: '#f8fafc', color: '#222', fontWeight: 500 }} value={categoria} onChange={e => setCategoria(e.target.value)} required>
              <option value="" disabled></option>
              <option value="teoria">Teoria</option>
              <option value="revisao">Revisão</option>
              <option value="questoes">Questões</option>
              <option value="simulado">Simulado</option>
              <option value="nova">Nova categoria...</option>
            </select>
            {categoria === 'nova' && (
              <input type="text" className="form-control input-dark mt-2" style={{ padding: '0.4em 0.6em', borderRadius: '8px', background: '#f8fafc', color: '#222', fontWeight: 500 }} value={novaCategoria} onChange={e => setNovaCategoria(e.target.value)} placeholder="Digite a nova categoria" required />
            )}
          </div>
          <div className="mb-3">
            <label className="form-label">Disciplina</label>
            <select className="form-control input-dark linha" style={{ padding: '0.4em 0.6em', borderRadius: '8px', background: '#f8fafc', color: '#222', fontWeight: 500 }} value={disciplina} onChange={e => setDisciplina(e.target.value)} required>
              <option value="" disabled></option>
              {materias.map(m => (
                <option key={m.id} value={m.nome}>{m.nome}</option>
              ))}
            </select>
          </div>
          {/* Opção de vincular ao ciclo oculta
          <div className="mb-3">
            <div className="form-check">
              <input
                className="form-check-input"
                type="checkbox"
                id="vincularCiclo"
                checked={vincularCiclo}
                onChange={e => setVincularCiclo(e.target.checked)}
              />
              <label className="form-check-label" htmlFor="vincularCiclo">
                Vincular tempo de estudo ao ciclo
              </label>
            </div>
          </div>
          */}
          {saved && <div className="text-success mt-3">Sessão salva!</div>}
        </form>
      </Modal.Body>
      <Modal.Footer>
        <button className='btn btn-outline-primary-primary' onClick={closeForm}>
          Fechar
        </button>
        <button className='btn btn-primary-primary' type="submit" form="study-session-form">
          Salvar
        </button>
      </Modal.Footer>
    </Modal>
  );
};

export default StudySessionForm;

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
  const { isFormOpen, closeForm, timer, resetTimer, setTimer, editData, onAfterSave } = useContext(StudyTimerContext);
  const isEditMode = !!editData;

  const todayStr = () => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;
  };

  const [dataSessao, setDataSessao] = useState(todayStr);
  const [categoria, setCategoria] = useState('');
  const [novaCategoria, setNovaCategoria] = useState('');
  const [disciplina, setDisciplina] = useState('');
  const [saved, setSaved] = useState(false);
  const [tempoH, setTempoH] = useState(Math.floor(timer.seconds / 3600));
  const [tempoM, setTempoM] = useState(Math.floor((timer.seconds % 3600) / 60));
  const [tempoS, setTempoS] = useState(timer.seconds % 60);
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
      if (isEditMode) {
        const totalSec = editData.tempo * 60;
        setTempoH(Math.floor(totalSec / 3600));
        setTempoM(Math.floor((totalSec % 3600) / 60));
        setTempoS(totalSec % 60);
        setDisciplina(editData.disciplina || '');
        setCategoria(editData.categoria || '');
        setDataSessao(editData.dataSessao ? editData.dataSessao.split('T')[0] : todayStr());
      } else {
        setTempoH(Math.floor(timer.seconds / 3600));
        setTempoM(Math.floor((timer.seconds % 3600) / 60));
        setTempoS(timer.seconds % 60);
      }
    }
  }, [isFormOpen, editData]);

  if (!isFormOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Usa novaCategoria se selecionado
    const categoriaFinal = categoria === 'nova' ? novaCategoria : categoria;
    // Converter h/m/s para minutos (segundos arredondados para cima)
    const h = parseInt(tempoH, 10) || 0;
    const m = parseInt(tempoM, 10) || 0;
    const s = parseInt(tempoS, 10) || 0;
    const totalSegundos = h * 3600 + m * 60 + s;
    const tempoMinutos = Math.ceil(totalSegundos / 60);
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
      if (tempoMinutos <= 0) {
        alert('Erro: O tempo de estudo deve ser maior que zero.');
        return;
      }
      
      let cicloId = isEditMode ? (editData.cicloId || null) : null;
      if (!isEditMode && vincularCiclo) {
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

      if (isEditMode) {
        await api.put(`/estudo/${editData.id}`, payload);
      } else {
        await api.post('/estudo', payload);
      }
      
      setSaved(true);
      if (!isEditMode) resetTimer();
      if (onAfterSave) onAfterSave();
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
    <Modal show={true} onHide={closeForm} centered size="md" backdrop="static" className="modal-fundo">
      <Modal.Body className="modal-estilo">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <Modal.Title className="fw-bold fs-5 m-0">{isEditMode ? 'Editar Sessão de Estudo' : 'Salvar Sessão de Estudo'}</Modal.Title>
        </div>
        <form onSubmit={handleSubmit} id="study-session-form">

          {/* Linha 1: Disciplina + Categoria */}
          <div className="d-flex gap-3 mb-3">
            <div style={{ flex: 2 }}>
              <label className="form-label fw-semibold" style={{ fontSize: '0.8em', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-light)' }}>Disciplina</label>
              <select className="form-control linha" style={{ fontSize: '0.9em' }} value={disciplina} onChange={e => setDisciplina(e.target.value)} required>
                <option value="" disabled>Selecione...</option>
                {materias.map(m => (
                  <option key={m.id} value={m.nome}>{m.nome}</option>
                ))}
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label className="form-label fw-semibold" style={{ fontSize: '0.8em', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-light)' }}>Categoria</label>
              <select className="form-control linha" style={{ fontSize: '0.9em' }} value={categoria} onChange={e => setCategoria(e.target.value)} required>
                <option value="" disabled>Selecione...</option>
                <option value="teoria">Teoria</option>
                <option value="revisao">Revisão</option>
                <option value="questoes">Questões</option>
                <option value="simulado">Simulado</option>
                <option value="nova">Outra...</option>
              </select>
            </div>
          </div>

          {/* Nova categoria */}
          {categoria === 'nova' && (
            <div className="mb-3">
              <input type="text" className="form-control linha" style={{ fontSize: '0.9em' }} value={novaCategoria} onChange={e => setNovaCategoria(e.target.value)} placeholder="Nome da nova categoria" required />
            </div>
          )}

          {/* Linha 2: Tempo + Data + atalhos */}
          <div className="d-flex gap-3 align-items-end mb-3">
            <div>
              <label className="form-label fw-semibold" style={{ fontSize: '0.8em', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-light)' }}>Tempo</label>
              <div className="d-flex align-items-center gap-1" style={{ fontFamily: 'monospace' }}>
                <input
                  type="number" min="0" max="99"
                  className="form-control linha text-center"
                  style={{ fontSize: '0.9em', width: '54px', padding: '0.375rem 0.25rem' }}
                  value={tempoH}
                  onFocus={e => e.target.select()}
                  onChange={e => setTempoH(Math.max(0, parseInt(e.target.value, 10) || 0))}
                  placeholder="hh"
                />
                <span style={{ color: 'var(--text-light)' }}>:</span>
                <input
                  type="number" min="0" max="59"
                  className="form-control linha text-center"
                  style={{ fontSize: '0.9em', width: '54px', padding: '0.375rem 0.25rem' }}
                  value={tempoM}
                  onFocus={e => e.target.select()}
                  onChange={e => setTempoM(Math.min(59, Math.max(0, parseInt(e.target.value, 10) || 0)))}
                  placeholder="mm"
                />
                <span style={{ color: 'var(--text-light)' }}>:</span>
                <input
                  type="number" min="0" max="59"
                  className="form-control linha text-center"
                  style={{ fontSize: '0.9em', width: '54px', padding: '0.375rem 0.25rem' }}
                  value={tempoS}
                  onFocus={e => e.target.select()}
                  onChange={e => setTempoS(Math.min(59, Math.max(0, parseInt(e.target.value, 10) || 0)))}
                  placeholder="ss"
                />
              </div>
            </div>
            <div style={{ flex: 1 }}>
              <label className="form-label fw-semibold" style={{ fontSize: '0.8em', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-light)' }}>Data</label>
              <input
                type="date"
                className="form-control linha"
                style={{ fontSize: '0.9em' }}
                value={dataSessao}
                onChange={e => setDataSessao(e.target.value)}
                required
              />
            </div>
            <div className="d-flex gap-1 pb-1">
              <button type="button" className="btn btn-outline-primary-primary3" style={{ fontSize: '0.75em', padding: '0.3em 0.7em', whiteSpace: 'nowrap' }} onClick={() => {
                const today = new Date();
                setDataSessao(`${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`);
              }}>Hoje</button>
              <button type="button" className="btn btn-outline-primary-primary3" style={{ fontSize: '0.75em', padding: '0.3em 0.7em', whiteSpace: 'nowrap' }} onClick={() => {
                const y = new Date(); y.setDate(y.getDate()-1);
                setDataSessao(`${y.getFullYear()}-${String(y.getMonth()+1).padStart(2,'0')}-${String(y.getDate()).padStart(2,'0')}`);
              }}>Ontem</button>
            </div>
          </div>

          {saved && <div className="text-success" style={{ fontSize: '0.85em' }}>Sessão salva com sucesso!</div>}
        </form>
        <div className="d-flex justify-content-end gap-2 mt-4">
          <button className="btn btn-outline-primary-primary3" onClick={closeForm}>Cancelar</button>
          <button className="btn btn-primary-primary3" type="submit" form="study-session-form">{isEditMode ? 'Salvar Alterações' : 'Salvar Sessão'}</button>
        </div>
      </Modal.Body>
    </Modal>
  );
};

export default StudySessionForm;

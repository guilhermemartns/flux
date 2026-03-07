import { useEffect, useState, forwardRef } from 'react';
import api from '../../services/api';
import 'bootstrap/dist/css/bootstrap.min.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBolt, faFilePdf } from '@fortawesome/free-solid-svg-icons';
import DrivePickerButton from '../../components/DrivePickerButton';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const pdfUrl = url => {
  if (!url) return url;
  if (url.includes('drive.google.com')) return url;
  return `${API_URL}/pdf-view?url=${encodeURIComponent(url)}`;
};
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const SelecaoBateria = forwardRef(({ id: bateriaId, onClose }, ref) => {
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [bateria, setBateria] = useState(null);
  const [pdfBateria, setPdfBateria] = useState(null);
  const [pdfGabarito, setPdfGabarito] = useState(null);
  const [driveBateriaUrl, setDriveBateriaUrl] = useState(null);
  const [driveBateriaNome, setDriveBateriaNome] = useState(null);
  const [driveGabaritoUrl, setDriveGabaritoUrl] = useState(null);
  const [driveGabaritoNome, setDriveGabaritoNome] = useState(null);
  const [respostas, setRespostas] = useState([]);
  const [gabaritos, setGabaritos] = useState([]);
  const [materias, setMaterias] = useState([]);
  const [editalItens, setEditalItens] = useState([]);
  const [materiasEdital, setMateriasEdital] = useState({});
  const [anuladas, setAnuladas] = useState([]);
  const [chutes, setChutes] = useState([]);
  const [motivosErro, setMotivosErro] = useState([]);
  const [materiasCadastradas, setMateriasCadastradas] = useState([]);
  const [preenchimentoRapido, setPreenchimentoRapido] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    async function loadBateria() {
      try {
        const res = await api.get(`/baterias/${bateriaId}`);
        const bat = res.data;
        setBateria(bat);

        // Init arrays
        setRespostas(Array(bat.quanQuest).fill(''));
        setGabaritos(Array(bat.quanQuest).fill(''));
        setMaterias(Array(bat.quanQuest).fill(''));
        setEditalItens(Array(bat.quanQuest).fill(''));
        setAnuladas(Array(bat.quanQuest).fill(false));
        setChutes(Array(bat.quanQuest).fill(false));
        setMotivosErro(Array(bat.quanQuest).fill(''));

        // Load saved answers
        const respSalvas = await api.get(`/respostas-bateria/${bateriaId}`);
        const questoes = respSalvas.data;
        if (questoes.length > 0) {
          setRespostas(questoes.map(q => q.resposta || ''));
          setGabaritos(questoes.map(q => q.gabarito || ''));
          setMaterias(questoes.map(q => q.materia || ''));
          setEditalItens(questoes.map(q => q.editalItem || ''));
          setAnuladas(questoes.map(q => q.anulada || false));
          setChutes(questoes.map(q => q.chute || false));
          setMotivosErro(questoes.map(q => q.motivoErro || ''));
        }
      } catch (err) {
        console.error('Erro ao carregar bateria:', err);
      } finally {
        setLoading(false);
      }
    }
    loadBateria();
  }, [bateriaId]);

  useEffect(() => {
    async function loadMaterias() {
      try {
        const userId = JSON.parse(localStorage.getItem('user'))?.id || '';
        const projetoId = localStorage.getItem('projetoSelecionado') || '';
        const response = await api.get('/edital', { params: { userId, projetoId } });
        const materiasFiltradas = response.data.filter(m => m.projetoId === projetoId && m.nome && m.nome.trim() !== '');
        setMateriasCadastradas(materiasFiltradas);
        const materiasEditalTemp = {};
        for (const materia of materiasFiltradas) {
          try {
            const res = await api.get(`/materias/${materia.id}/edital`);
            materiasEditalTemp[materia.nome] = res.data || [];
          } catch {
            materiasEditalTemp[materia.nome] = [];
          }
        }
        setMateriasEdital(materiasEditalTemp);
      } catch (err) {
        console.error('Erro ao carregar matérias:', err);
      }
    }
    loadMaterias();
  }, []);

  useEffect(() => {
    if (!isDirty) return;
    const handler = (e) => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isDirty]);

  function handleAlternativaChange(e, index) {
    const value = e.target.value.toUpperCase();
    const updated = [...respostas];
    updated[index] = value;
    setRespostas(updated);
    setIsDirty(true);
    if (value.length === 1) {
      const nextInput = document.getElementById(`bat-alt-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  }

  function handleGabaritoChange(e, index) {
    const value = e.target.value.toUpperCase();
    const updated = [...gabaritos];
    updated[index] = value;
    setGabaritos(updated);
    setIsDirty(true);
    if (value.length === 1) {
      const nextInput = document.getElementById(`bat-gab-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  }

  function handleMateriaChange(e, index) {
    const value = e.target.value;
    setIsDirty(true);
    if (preenchimentoRapido) {
      const novas = [...materias];
      for (let i = index; i < novas.length; i++) novas[i] = value;
      setMaterias(novas);
      setEditalItens(prev => { const arr = [...prev]; for (let i = index; i < arr.length; i++) arr[i] = ''; return arr; });
    } else {
      const updated = [...materias];
      updated[index] = value;
      setMaterias(updated);
      setEditalItens(prev => { const arr = [...prev]; arr[index] = ''; return arr; });
    }
  }

  function handleAnuladaChange(index) {
    setIsDirty(true);
    const updated = [...anuladas];
    updated[index] = !updated[index];
    setAnuladas(updated);
    if (!anuladas[index]) {
      const g = [...gabaritos]; g[index] = 'A'; setGabaritos(g);
    } else {
      const g = [...gabaritos]; g[index] = ''; setGabaritos(g);
    }
  }

  function handleChuteChange(index) {
    setIsDirty(true);
    const updated = [...chutes]; updated[index] = !updated[index]; setChutes(updated);
  }

  function handleMotivoErroChange(e, index) {
    setIsDirty(true);
    const updated = [...motivosErro]; updated[index] = e.target.value; setMotivosErro(updated);
  }

  async function salvarDados() {
    let formValido = true;
    for (let i = 0; i < respostas.length; i++) {
      if (!respostas[i] || !gabaritos[i] || !materias[i] || !editalItens[i]) { formValido = false; break; }
    }
    if (!formValido) {
      const form = document.querySelector('.needs-validation-bat');
      if (form) form.classList.add('was-validated');
      return;
    }

    const projetoSelecionado = localStorage.getItem('projetoSelecionado') || '';
    const userId = JSON.parse(localStorage.getItem('user'))?.id;

    const dados = respostas.map((resposta, index) => {
      const gabarito = gabaritos[index];
      const materia = materias[index];
      const editalItem = editalItens[index];
      const anulada = anuladas[index];
      const chute = chutes[index];
      const motivoErro = motivosErro[index];
      const acertou = resposta === gabarito;
      const materiaObj = materiasCadastradas.find(m => m.nome === materia);
      const materiaId = materiaObj ? materiaObj.id : '';
      return {
        numero: index + 1,
        materia,
        materiaId,
        editalItem,
        resposta,
        gabarito,
        acertou,
        chute,
        anulada,
        motivoErro,
        bateriaId,
        userId,
        projetoId: projetoSelecionado
      };
    });

    try {
      setSaving(true);
      await api.post('/salvarRespostasBateria', { dados });

      // Upload PDFs
      if (pdfBateria || pdfGabarito) {
        setUploading(true);
        const formData = new FormData();
        if (pdfBateria) formData.append('pdfSimulado', pdfBateria);
        if (pdfGabarito) formData.append('pdfGabarito', pdfGabarito);
        formData.append('bateriaId', bateriaId);
        await api.post('/upload-pdf', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
        setUploading(false);
      }
      // Salvar URLs do Google Drive
      if (driveBateriaUrl || driveGabaritoUrl) {
        await api.post('/update-pdf-url', {
          bateriaId,
          ...(driveBateriaUrl && { simuladoUrl: driveBateriaUrl }),
          ...(driveGabaritoUrl && { gabaritoUrl: driveGabaritoUrl }),
        });
      }

      // Sync fila de revisão
      try {
        await api.post('/fila-revisao/sync-bateria', {
          userId,
          projetoId: projetoSelecionado,
          bateriaId,
          questoes: dados.map(q => ({
            numero: q.numero,
            anulada: q.anulada,
            acertou: q.resposta !== '' && q.resposta !== 'S' && q.acertou,
            chute: q.chute || false,
            tipo: (q.resposta === '' || q.resposta === 'S') ? 'branco' : 'erro',
            materia: q.materia || '',
            materiaId: q.materiaId || '',
            editalItem: q.editalItem || '',
            motivoErro: q.motivoErro || '',
          })),
        });
        window.dispatchEvent(new Event('filaRevisaoAtualizada'));
      } catch { /* silencioso */ }

      localStorage.setItem('atualizaDashboard', Date.now());
      setSaving(false);
      setIsDirty(false);
      setTimeout(() => { if (typeof onClose === 'function') onClose(); }, 300);
    } catch (err) {
      setSaving(false);
      toast.error('Erro ao salvar dados!');
      console.error(err);
    }
  }

  function handleCloseWithConfirm() {
    if (window.confirm('Tem certeza que deseja fechar? Os dados não salvos serão perdidos.')) {
      if (typeof onClose === 'function') onClose();
    }
  }

  if (!bateria || loading) {
    return (
      <div className="spinner-border text-secondary" role="status" style={{ width: '3rem', height: '3rem' }}>
        <span className="visually-hidden">Carregando...</span>
      </div>
    );
  }

  return (
    <div className="rounded-3 fadein shadow-lg overflow-auto position-relative" style={{ background: 'var(--background-l-light)', minWidth: 400, maxWidth: '90vw', maxHeight: '90vh' }}>
      <div className="p-4">
        <main className="conteudo" style={{ display: 'flex', flexDirection: 'column', height: 'auto', minHeight: 500 }}>
          <form className="needs-validation-bat" noValidate onSubmit={e => { e.preventDefault(); salvarDados(); }} style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            {/* HEADER FIXO */}
            <div style={{ position: 'sticky', top: 0, zIndex: 10, background: 'var(--background-l-light)', paddingBottom: 12 }}>
              {/* Barra de título */}
              <div className="d-flex justify-content-between align-items-center pb-3 mb-3" style={{ borderBottom: '1px solid var(--border)' }}>
                <div className="d-flex align-items-center gap-2">
                  <span style={{ width: 4, height: 22, borderRadius: 4, background: 'var(--primary)', display: 'inline-block', flexShrink: 0 }} />
                  <span className="fw-bold" style={{ fontSize: '1.05rem', color: 'var(--text-dark)', letterSpacing: '-0.01em' }}>
                    {bateria.titulo}
                  </span>
                  <span className="badge rounded-pill ms-1" style={{ background: 'var(--bg-card)', color: 'var(--text-light)', fontWeight: 500, fontSize: '0.72rem', border: '1px solid var(--border)' }}>
                    {bateria.quanQuest} questões
                  </span>
                </div>
                <div className="d-flex align-items-center gap-2">
                  <button type="button" className="btn-close" onClick={handleCloseWithConfirm} title="Fechar" style={{ fontSize: '0.8rem' }} />
                </div>
              </div>

              {/* Card de Info */}
              <div className="rounded-3 px-3 py-2 d-flex align-items-center flex-wrap gap-3" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>

                {/* Título */}
                <div className="d-flex align-items-center gap-2">
                  <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-light)', fontWeight: 600, whiteSpace: 'nowrap' }}>Título</span>
                  <input
                    className='form-control form-control-sm'
                    type="text"
                    value={bateria.titulo}
                    onChange={async e => {
                      const novoTitulo = e.target.value;
                      setBateria(prev => ({ ...prev, titulo: novoTitulo }));
                      try {
                        await api.put(`/baterias/${bateriaId}`, { titulo: novoTitulo, quanQuest: bateria.quanQuest, dataBat: bateria.dataBat });
                      } catch {}
                    }}
                    style={{ width: '200px' }}
                  />
                </div>

                <div style={{ width: 1, height: 28, background: 'var(--border)', flexShrink: 0 }} />

                {/* Data */}
                <div className="d-flex align-items-center gap-2">
                  <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-light)', fontWeight: 600, whiteSpace: 'nowrap' }}>Data</span>
                  <input
                    className='form-control form-control-sm'
                    type="date"
                    value={bateria.dataBat ? new Date(bateria.dataBat).toISOString().slice(0, 10) : ''}
                    onChange={async e => {
                      const dataUtc = new Date(e.target.value).toISOString();
                      setBateria(prev => ({ ...prev, dataBat: dataUtc }));
                      try {
                        await api.put(`/baterias/${bateriaId}`, { titulo: bateria.titulo, quanQuest: bateria.quanQuest, dataBat: dataUtc });
                      } catch {}
                    }}
                    style={{ width: '128px' }}
                  />
                </div>

                <div style={{ width: 1, height: 28, background: 'var(--border)', flexShrink: 0 }} />

                {/* PDF Bateria */}
                <div className="d-flex align-items-center gap-2">
                  <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-light)', fontWeight: 600, whiteSpace: 'nowrap' }}>
                    <FontAwesomeIcon icon={faFilePdf} style={{ color: '#3b82f6', marginRight: 4 }} />PDF
                  </span>
                  <DrivePickerButton
                    className="btn btn-outline-secondary btn-sm d-inline-flex align-items-center gap-1"
                    label={<><svg width="13" height="13" viewBox="0 0 87.3 78" style={{verticalAlign:'middle', flexShrink:0}}><path d="M6.6 66.85l3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8H0c0 1.55.4 3.1 1.2 4.5z" fill="#0066da"/><path d="M43.65 25L29.9 1.2C28.55 2 27.4 3.1 26.6 4.5L1.2 49.35A9.07 9.07 0 0 0 0 53.8h27.45z" fill="#00ac47"/><path d="M73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5H59.85l5.87 11.2z" fill="#ea4335"/><path d="M43.65 25L57.4 1.2C56.05.4 54.5 0 52.9 0H34.4c-1.6 0-3.15.45-4.5 1.2z" fill="#00832d"/><path d="M59.85 53.8H27.45L13.7 77.6c1.35.8 2.9 1.2 4.5 1.2h50.9c1.6 0 3.15-.45 4.5-1.2z" fill="#2684fc"/><path d="M73.4 26.95l-12.65-21.9C59.95 3.65 58.8 2.55 57.4 1.75L43.65 25 59.85 53.8h27.4c0-1.55-.4-3.1-1.2-4.5z" fill="#ffba00"/></svg><span>{driveBateriaNome ? '✓ '+driveBateriaNome.slice(0,18)+(driveBateriaNome.length>18?'…':'') : bateria.pdf ? 'Trocar' : 'Selecionar'}</span></>}
                    onPick={(url, nome) => { setDriveBateriaUrl(url); setDriveBateriaNome(nome); setPdfBateria(null); }}
                  />
                  {(bateria.pdf || driveBateriaUrl) && (
                    <a href={pdfUrl(driveBateriaUrl || bateria.pdf)} target="_blank" rel="noopener noreferrer" style={{ color: '#3b82f6', fontSize: '1.15em', lineHeight: 1 }} title="Abrir PDF">
                      <FontAwesomeIcon icon={faFilePdf} />
                    </a>
                  )}
                </div>

                <div style={{ width: 1, height: 28, background: 'var(--border)', flexShrink: 0 }} />

                {/* PDF Gabarito */}
                <div className="d-flex align-items-center gap-2">
                  <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-light)', fontWeight: 600, whiteSpace: 'nowrap' }}>
                    <FontAwesomeIcon icon={faFilePdf} style={{ color: '#ef4444', marginRight: 4 }} />Gabarito
                  </span>
                  <DrivePickerButton
                    className="btn btn-outline-secondary btn-sm d-inline-flex align-items-center gap-1"
                    label={<><svg width="13" height="13" viewBox="0 0 87.3 78" style={{verticalAlign:'middle', flexShrink:0}}><path d="M6.6 66.85l3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8H0c0 1.55.4 3.1 1.2 4.5z" fill="#0066da"/><path d="M43.65 25L29.9 1.2C28.55 2 27.4 3.1 26.6 4.5L1.2 49.35A9.07 9.07 0 0 0 0 53.8h27.45z" fill="#00ac47"/><path d="M73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5H59.85l5.87 11.2z" fill="#ea4335"/><path d="M43.65 25L57.4 1.2C56.05.4 54.5 0 52.9 0H34.4c-1.6 0-3.15.45-4.5 1.2z" fill="#00832d"/><path d="M59.85 53.8H27.45L13.7 77.6c1.35.8 2.9 1.2 4.5 1.2h50.9c1.6 0 3.15-.45 4.5-1.2z" fill="#2684fc"/><path d="M73.4 26.95l-12.65-21.9C59.95 3.65 58.8 2.55 57.4 1.75L43.65 25 59.85 53.8h27.4c0-1.55-.4-3.1-1.2-4.5z" fill="#ffba00"/></svg><span>{driveGabaritoNome ? '✓ '+driveGabaritoNome.slice(0,18)+(driveGabaritoNome.length>18?'…':'') : bateria.gabarito ? 'Trocar' : 'Selecionar'}</span></>}
                    onPick={(url, nome) => { setDriveGabaritoUrl(url); setDriveGabaritoNome(nome); setPdfGabarito(null); }}
                  />
                  {(bateria.gabarito || driveGabaritoUrl) && (
                    <a href={pdfUrl(driveGabaritoUrl || bateria.gabarito)} target="_blank" rel="noopener noreferrer" style={{ color: '#ef4444', fontSize: '1.15em', lineHeight: 1 }} title="Abrir Gabarito">
                      <FontAwesomeIcon icon={faFilePdf} />
                    </a>
                  )}
                </div>

              </div>
            </div>

            {/* TABELA SCROLLÁVEL */}
            <div className="overflow-auto" style={{ flex: 1, minHeight: 0, maxHeight: '50vh' }}>
              <table className="align-middle" style={{ minWidth: 900 }}>
                <thead style={{ position: 'sticky', top: 0, zIndex: 2, background: 'var(--background-l-light)' }}>
                  <tr>
                    <th className="text-center p-1">#</th>
                    <th className="text-center p-1" style={{ minWidth: 140 }}>
                      <span className="d-inline-flex align-items-center gap-1">
                        Matéria
                        <span
                          role="button"
                          tabIndex={0}
                          onClick={() => setPreenchimentoRapido(v => !v)}
                          style={{ cursor: 'pointer', color: preenchimentoRapido ? '#ffc107' : 'var(--text-light)', fontSize: '1.2em', marginLeft: '2px', transition: 'color 0.2s' }}
                          title="Preenchimento relâmpago"
                        >
                          <FontAwesomeIcon icon={faBolt} />
                        </span>
                      </span>
                    </th>
                    <th className="text-center p-1" style={{ minWidth: 180 }}>Item do Edital (Tópico)</th>
                    <th className="text-center p-1" style={{ minWidth: 40 }}>Resp.</th>
                    <th className="text-center p-1" style={{ minWidth: 40 }}>Gab.</th>
                    <th className="text-center p-1" style={{ minWidth: 36 }}>Chute?</th>
                    <th className="text-center p-1" style={{ minWidth: 36 }}>Anulada?</th>
                    <th className="text-center p-1" style={{ minWidth: 120 }}>Motivo do Erro</th>
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: bateria.quanQuest }, (_, index) => {
                    const r = respostas[index]?.trim().toUpperCase();
                    const g = gabaritos[index]?.trim().toUpperCase();
                    const isFilled = r !== '' && g !== '';
                    const isBlank = r === 'S' || g === 'S';
                    const anulada = anuladas[index];
                    const chute = chutes[index];
                    const motivoErro = motivosErro[index];
                    const cardClass = anulada ? 'card-anulada' : (isFilled && !isBlank ? (r === g ? 'linha-correta' : 'linha-incorreta') : '');
                    return (
                      <tr key={index} className={cardClass + ' fadein-cascade'} style={{ animationDelay: `${index * 0.06}s` }}>
                        <td className="text-center fw-bold p-1 border">{index + 1}</td>
                        <td className="p-1 border" style={{ minWidth: 140 }}>
                          <select
                            value={materias[index]}
                            onChange={e => handleMateriaChange(e, index)}
                            id={`bat-materia-${index}`}
                            className="form-select form-select-sm"
                            required
                            style={{ fontSize: '0.88em' }}
                          >
                            <option value="">Selecione</option>
                            {materiasCadastradas.map((m, idx) => (
                              <option key={`${m.id || idx}-${m.nome}`} value={m.nome}>{m.nome}</option>
                            ))}
                          </select>
                        </td>
                        <td className="p-1 border" style={{ minWidth: 180 }}>
                          <select
                            value={editalItens[index] || ''}
                            onChange={e => { const arr = [...editalItens]; arr[index] = e.target.value; setEditalItens(arr); }}
                            id={`bat-edital-${index}`}
                            className="form-select form-select-sm"
                            required
                            disabled={!materias[index] || !(materiasEdital[materias[index]]?.length > 0)}
                            style={{ fontSize: '0.88em' }}
                          >
                            <option value="">
                              {!materias[index] ? 'Selecione uma matéria' :
                                (materiasEdital[materias[index]]?.length > 0 ? 'Item do edital' : 'Não há edital inserido')}
                            </option>
                            {(materiasEdital[materias[index]] || []).map((item, idx) => (
                              <option key={`${idx}-${item}`} value={item}>{item}</option>
                            ))}
                          </select>
                        </td>
                        <td className="p-1 text-center border" style={{ minWidth: 40 }}>
                          <input
                            type="text"
                            maxLength={1}
                            value={respostas[index]}
                            onChange={e => handleAlternativaChange(e, index)}
                            className="form-control form-control-sm text-uppercase text-center"
                            id={`bat-alt-${index}`}
                            style={{ fontSize: '0.88em' }}
                          />
                        </td>
                        <td className="p-1 text-center border" style={{ minWidth: 40 }}>
                          <input
                            type="text"
                            maxLength={1}
                            id={`bat-gab-${index}`}
                            required
                            value={gabaritos[index]}
                            onChange={e => handleGabaritoChange(e, index)}
                            className="form-control form-control-sm text-uppercase text-center"
                            style={{ fontSize: '0.88em' }}
                          />
                        </td>
                        <td className="p-1 text-center border pointer" style={{ minWidth: 36 }} onClick={() => handleChuteChange(index)}>
                          <div className="form-check d-flex justify-content-center align-items-center" style={{ height: '28px', paddingLeft: 0 }}>
                            <input className="pointer form-check-input" type="checkbox" checked={chute} onChange={() => handleChuteChange(index)} style={{ margin: 0, width: '18px', height: '18px' }} />
                          </div>
                        </td>
                        <td className="p-1 text-center border pointer" style={{ minWidth: 36 }} onClick={() => handleAnuladaChange(index)}>
                          <div className="form-check d-flex justify-content-center align-items-center" style={{ height: '28px', paddingLeft: 0 }}>
                            <input className="pointer form-check-input" type="checkbox" checked={anulada} onChange={() => handleAnuladaChange(index)} style={{ margin: 0, width: '18px', height: '18px' }} />
                            <span style={{ marginLeft: '0.4em', color: '#6c757d', fontSize: '1.05em', cursor: 'pointer' }} title="Quando anulada, é contabilizada como acerto.">ⓘ</span>
                          </div>
                        </td>
                        <td className="p-1 border" style={{ minWidth: 180 }}>
                          {!(anulada || !respostas[index] || !gabaritos[index] || respostas[index]?.trim().toUpperCase() === gabaritos[index]?.trim().toUpperCase()) && (
                            <select
                              className="form-select form-select-sm"
                              value={motivoErro}
                              onChange={e => handleMotivoErroChange(e, index)}
                              style={{ fontSize: '0.88em' }}
                            >
                              <option value="">Selecione</option>
                              <option value="Falta de teoria">Falta de teoria</option>
                              <option value="Falta de revisão">Falta de revisão</option>
                              <option value="Falta de atenção">Falta de atenção</option>
                              <option value="Desconhecimento">Desconhecimento</option>
                              <option value="Interpretação">Interpretação</option>
                            </select>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* FOOTER */}
            <div style={{ position: 'sticky', bottom: 0, zIndex: 10, background: 'var(--background-l-light)', paddingTop: 2, paddingBottom: 2 }}>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.7em', marginTop: '0.7em', marginBottom: '0.2em' }}>
                <button type="button" className="btn btn-outline-primary-primary3" onClick={handleCloseWithConfirm}>Cancelar</button>
                <button type="submit" className="btn btn-primary-primary3" disabled={saving}>
                  {saving ? <><span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />Salvando...</> : 'Salvar Dados'}
                </button>
              </div>
            </div>
          </form>
        </main>
      </div>
    </div>
  );
});

export default SelecaoBateria;

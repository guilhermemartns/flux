import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState, forwardRef, useImperativeHandle } from 'react';
import DrivePickerButton from '../../components/DrivePickerButton';
import api from '../../services/api';
import 'bootstrap/dist/css/bootstrap.min.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBolt, faTimes, faFilePdf } from '@fortawesome/free-solid-svg-icons';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const pdfUrl = url => {
  if (!url) return url;
  if (url.includes('drive.google.com')) return url;
  return `${API_URL}/pdf-view?url=${encodeURIComponent(url)}`;
};

const Selecao = forwardRef(({ id: propId, onClose, tipo = 'alternativas', anulatoria = true }, ref) => {
  const [pdfSimulado, setPdfSimulado] = useState(null);
  const [pdfGabarito, setPdfGabarito] = useState(null);
  const [driveSimuladoUrl, setDriveSimuladoUrl] = useState(null);
  const [driveSimuladoNome, setDriveSimuladoNome] = useState(null);
  const [driveGabaritoUrl, setDriveGabaritoUrl] = useState(null);
  const [driveGabaritoNome, setDriveGabaritoNome] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true); // Adicionar estado de loading
  const params = useParams();
  const id = propId || params.id;
  const navigate = useNavigate();
  const [simulado, setSimulado] = useState(null);
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
    async function loadSimulado() {
      try {
        const response = await api.get(`/simulados/${id}`);
        setSimulado(response.data);

        // Buscar matérias do último simulado do projeto
        const projetoId = localStorage.getItem('projetoSelecionado') || '';
        const ultimosSimulados = await api.get('/simulados', { params: { projetoId } });
        let materiasUltimo = [];
        if (ultimosSimulados.data && ultimosSimulados.data.length > 0) {
          // Ordena por data e pega o último
          const ultimo = [...ultimosSimulados.data].sort((a, b) => new Date(b.dataSim) - new Date(a.dataSim))[0];
          if (ultimo && ultimo.id) {
            const respostasUltimo = await api.get(`/respostas/${ultimo.id}`);
            if (respostasUltimo.data && respostasUltimo.data.length > 0) {
              materiasUltimo = respostasUltimo.data.map(q => q.materia || '');
            }
          }
        }

        // Inicializa os estados com base no novo simulado
        setRespostas(Array(response.data.quanQuest).fill(''));
        setGabaritos(Array(response.data.quanQuest).fill(''));
        // Se houver matérias do último simulado, usa elas como valor inicial
        if (materiasUltimo.length === response.data.quanQuest) {
          setMaterias(materiasUltimo);
        } else {
          setMaterias(Array(response.data.quanQuest).fill(''));
        }
        setEditalItens(Array(response.data.quanQuest).fill(''));
        setAnuladas(Array(response.data.quanQuest).fill(false));
        setChutes(Array(response.data.quanQuest).fill(false));
        setMotivosErro(Array(response.data.quanQuest).fill(''));

        // Carrega respostas salvas
        const respSalvas = await api.get(`/respostas/${response.data.id}`);
        const questoes = respSalvas.data;

        // Preenche os estados com os dados salvos
        if (questoes.length > 0) {
          setRespostas(questoes.map(q => q.resposta || ''));
          setGabaritos(questoes.map(q => q.gabarito || ''));
          setMaterias(questoes.map(q => q.materia || ''));
          setEditalItens(questoes.map(q => q.editalItem || ''));
          setAnuladas(questoes.map(q => q.anulada || false));
          setChutes(questoes.map(q => q.chute || false));
          setMotivosErro(questoes.map(q => q.motivoErro || ''));
        }
      } catch (error) {
        console.error("Erro ao carregar simulado:", error);
        navigate('/simulados');
      } finally {
        setLoading(false); // Finalizar loading após carregar todos os dados
      }
    }
    loadSimulado();
  }, [id, navigate]);

  useEffect(() => {
    async function loadMaterias() {
      try {
        const userId = JSON.parse(localStorage.getItem('user'))?.id || '';
        const projetoId = localStorage.getItem('projetoSelecionado') || '';
        const response = await api.get('/edital', { params: { userId, projetoId } });
        setMateriasCadastradas(response.data.filter(m => m.projetoId === projetoId && m.nome && m.nome.trim() !== ''));
        // Carregar itens do edital de cada matéria
        const materiasEditalTemp = {};
        for (const materia of response.data) {
          try {
            const res = await api.get(`/materias/${materia.id}/edital`);
            materiasEditalTemp[materia.nome] = res.data || [];
          } catch (err) {
            materiasEditalTemp[materia.nome] = [];
          }
        }
        setMateriasEdital(materiasEditalTemp);
      } catch (error) {
        console.error("Erro ao carregar matérias:", error);
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

  function handleAlternativaClick(val, index) {
    const updated = [...respostas];
    updated[index] = updated[index] === val ? '' : val;
    setRespostas(updated);
    setIsDirty(true);
    if (updated[index]) {
      const next = document.getElementById(`alt-${index + 1}`);
      if (next) next.focus();
    }
  }

  function handleGabaritoClick(val, index) {
    const updated = [...gabaritos];
    updated[index] = updated[index] === val ? '' : val;
    setGabaritos(updated);
    setIsDirty(true);
    if (updated[index]) {
      const next = document.getElementById(`gab-${index + 1}`);
      if (next) next.focus();
    }
  }

  function handleMateriaChange(e, index) {
    const value = e.target.value;
    setIsDirty(true);
    if (preenchimentoRapido) {
      const novasMaterias = [...materias];
      for (let i = index; i < novasMaterias.length; i++) {
        novasMaterias[i] = value;
      }
      setMaterias(novasMaterias);
      setEditalItens(prev => {
        const arr = [...prev];
        for (let i = index; i < arr.length; i++) {
          arr[i] = '';
        }
        return arr;
      });
    } else {
      const updatedMaterias = [...materias];
      updatedMaterias[index] = value;
      setMaterias(updatedMaterias);
      setEditalItens(prev => {
        const arr = [...prev];
        arr[index] = '';
        return arr;
      });
    }
  }

  function handleAnuladaChange(index) {
      setIsDirty(true);
      const updated = [...anuladas];
      updated[index] = !updated[index];
      setAnuladas(updated);

      // Se marcar como anulada, define gabarito como 'A'
      if (!anuladas[index]) {
        const updatedGabaritos = [...gabaritos];
        updatedGabaritos[index] = 'A';
        setGabaritos(updatedGabaritos);
      }
      // Se desmarcar, limpa o gabarito
      else {
        const updatedGabaritos = [...gabaritos];
        updatedGabaritos[index] = '';
        setGabaritos(updatedGabaritos);
      }
  }

  function handleChuteChange(index) {
    setIsDirty(true);
    const updated = [...chutes];
    updated[index] = !updated[index];
    setChutes(updated);
  }

  function handleMotivoErroChange(e, index) {
    const value = e.target.value;
    setIsDirty(true);
    const updated = [...motivosErro];
    updated[index] = value;
    setMotivosErro(updated);
  }

  // Novo estado para itens do edital por matéria
  const emptyEditalItens = [];

  // Função de salvar dados deve estar fora do return principal
  async function salvarDados() {
    // Validação manual dos campos obrigatórios
    let formValido = true;
    for (let i = 0; i < respostas.length; i++) {
      if (!respostas[i] || !gabaritos[i] || !materias[i]) {
        formValido = false;
        break;
      }
      const itemsDisponiveis = materiasEdital[materias[i]] || [];
      if (itemsDisponiveis.length > 0 && !itemsDisponiveis.includes(editalItens[i])) {
        formValido = false;
        break;
      }
    }
    if (!formValido) {
      // Destaca os campos obrigatórios usando a validação nativa do navegador
      const form = document.querySelector('.needs-validation');
      if (form) form.classList.add('was-validated');
      // Não exibe nenhum texto de erro, apenas feedback visual
      return;
    }
    const projetoSelecionado = localStorage.getItem('projetoSelecionado') || '';
    const dados = respostas.map((resposta, index) => {
      const gabarito = gabaritos[index];
      const materia = materias[index];
      const editalItem = editalItens[index];
      const anulada = anuladas[index];
      const chute = chutes[index];
      const motivoErro = motivosErro[index];
      const acertou = resposta === gabarito;
      // Buscar o id da matéria pelo nome
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
        simuladoId: simulado.id || simulado._id,
        userId: JSON.parse(localStorage.getItem('user'))?.id,
        projetoId: projetoSelecionado
      };
    });
    console.log('projetoSelecionado:', projetoSelecionado);
    console.log('dados para envio:', dados);

    try {
      setSaving(true);
      const dadosValidos = dados.filter(q => q.simuladoId); // Só mantém os com simuladoId
      if (dadosValidos.length === 0) {
        setSaving(false);
        // Não exibe texto de erro, apenas feedback visual
        return;
      }

      // Substitui todas as respostas do usuário
      await api.post('/salvarRespostas', { dados: dadosValidos });

      // Sincroniza fila de revisão (upsert erros/brancos, remove acertos pendentes)
      try {
        const userId = JSON.parse(localStorage.getItem('user'))?.id || '';
        const projetoId = dadosValidos[0]?.projetoId || '';
        const simuladoId = dadosValidos[0]?.simuladoId || '';
        await api.post('/fila-revisao/sync', {
          userId,
          projetoId,
          simuladoId,
          questoes: dadosValidos.map(q => ({
            numero: q.numero,
            anulada: q.anulada,
            acertou: q.resposta !== '' && q.resposta !== 'S' && q.acertou, // branco ('' ou 'S') nunca é acerto
            chute: q.chute || false,
            tipo: (q.resposta === '' || q.resposta === 'S') ? 'branco' : 'erro',
            materia: q.materia || '',
            materiaId: q.materiaId || '',
            editalItem: q.editalItem || '',
            motivoErro: q.motivoErro || '',
          })),
        }).catch(() => null);
        window.dispatchEvent(new Event('filaRevisaoAtualizada'));
      } catch { /* silencioso — não bloqueia o fluxo principal */ }

      // Upload dos arquivos PDF
      if (pdfSimulado || pdfGabarito) {
        setUploading(true);
        const formData = new FormData();
        if (pdfSimulado) formData.append('pdfSimulado', pdfSimulado);
        if (pdfGabarito) formData.append('pdfGabarito', pdfGabarito);
        formData.append('simuladoId', simulado.id);
        await api.post('/upload-pdf', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        setUploading(false);
      }
      // Salvar URLs do Google Drive
      if (driveSimuladoUrl || driveGabaritoUrl) {
        await api.post('/update-pdf-url', {
          simuladoId: simulado.id,
          ...(driveSimuladoUrl && { simuladoUrl: driveSimuladoUrl }),
          ...(driveGabaritoUrl && { gabaritoUrl: driveGabaritoUrl }),
        });
      }

      // Atualiza dashboard imediatamente
      localStorage.setItem('atualizaDashboard', Date.now());

      setSaving(false);
      setIsDirty(false);
      // Fecha o popup/modal após salvar
      setTimeout(() => {
        handleCloseSilent();
      }, 300);
    } catch (error) {
      setSaving(false);
      toast.error('Erro ao salvar dados!');
      console.error('Erro ao salvar dados:', error);
      // Opcional: pode adicionar um ícone ou cor para erro, mas sem texto
    }
  }

  // Função para fechar o modal com confirmação
  function handleCloseWithConfirm() {
    if (window.confirm('Tem certeza que deseja fechar? Os dados não salvos serão perdidos.')) {
      if (typeof onClose === 'function') onClose();
    }
  }

  // Função para fechar o modal sem confirmação
  function handleCloseSilent() {
    if (typeof onClose === 'function') onClose();
  }

  // Função para preencher dados aleatórios
  function preencherAleatorio() {
    const alternativas = tipo === 'certo_errado' ? ['C', 'E'] : ['A', 'B', 'C', 'D', 'E'];
    const materiasNomes = materiasCadastradas.map(m => m.nome);
    
    // Gera arrays de matérias aleatórias primeiro
    const materiasAleatorias = Array(simulado.quanQuest).fill().map(() => 
      materiasNomes[Math.floor(Math.random() * materiasNomes.length)] || ''
    );
    
    setRespostas(Array(simulado.quanQuest).fill().map(() => alternativas[Math.floor(Math.random() * alternativas.length)]));
    setGabaritos(Array(simulado.quanQuest).fill().map(() => alternativas[Math.floor(Math.random() * alternativas.length)]));
    setMaterias(materiasAleatorias);
    
    // Usa a mesma matéria definida acima para buscar os itens do edital
    setEditalItens(Array(simulado.quanQuest).fill().map((_, i) => {
      const materia = materiasAleatorias[i]; // Usa a matéria já definida para esta questão
      const itens = materiasEdital[materia] || [];
      if (itens.length > 1) {
        // Seleciona um item aleatório que não seja o primeiro
        return itens[Math.floor(Math.random() * (itens.length - 1)) + 1];
      } else if (itens.length === 1) {
        return itens[0];
      } else {
        return '';
      }
    }));
    setAnuladas(Array(simulado.quanQuest).fill().map(() => Math.random() < 0.1));
    setChutes(Array(simulado.quanQuest).fill().map(() => Math.random() < 0.2));
    setMotivosErro(Array(simulado.quanQuest).fill().map(() => {
      const motivos = ["Falta de teoria", "Falta de revisão", "Falta de atenção", "Desconhecimento", "Interpretação", ""];
      return motivos[Math.floor(Math.random() * motivos.length)];
    }));
  }

  if (!simulado || loading) {
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
        <form className="needs-validation" noValidate onSubmit={e => { e.preventDefault(); salvarDados(); }} style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          {/* HEADER FIXO */}
          <div style={{ position: 'sticky', top: 0, zIndex: 10, background: 'var(--background-l-light)', paddingBottom: 12 }}>
            {/* Barra de título */}
            <div className="d-flex justify-content-between align-items-center pb-3 mb-3" style={{ borderBottom: '1px solid var(--border)' }}>
              <div className="d-flex align-items-center gap-2">
                <span style={{ width: 4, height: 22, borderRadius: 4, background: 'var(--primary)', display: 'inline-block', flexShrink: 0 }} />
                <span className="fw-bold" style={{ fontSize: '1.05rem', color: 'var(--text-dark)', letterSpacing: '-0.01em' }}>
                  Simulado <span style={{ color: 'var(--primary)' }}>#{simulado.numSim}</span>
                </span>
                <span className="badge rounded-pill ms-1" style={{ background: 'var(--bg-card)', color: 'var(--text-light)', fontWeight: 500, fontSize: '0.72rem', border: '1px solid var(--border)' }}>
                  {simulado.quanQuest} questões
                </span>
              </div>
              <div className="d-flex align-items-center gap-2">
                <button
                  type="button"
                  className="btn btn-sm"
                  onClick={preencherAleatorio}
                  style={{ fontSize: '0.75rem', color: 'var(--text-light)', border: '1px solid var(--border)', background: 'transparent', padding: '2px 10px' }}
                  title="Preencher Aleatório (Teste)"
                >
                  Aleatório
                </button>
                <button type="button" className="btn-close" onClick={handleCloseWithConfirm} title="Fechar" style={{ fontSize: '0.8rem' }} />
              </div>
            </div>

            {/* Card de Info */}
            <div className="rounded-3 px-3 py-2 d-flex align-items-center flex-wrap gap-3" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>

              {/* Número */}
              <div className="d-flex align-items-center gap-2">
                <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-light)', fontWeight: 600, whiteSpace: 'nowrap' }}>Nº</span>
                <input
                  className='form-control form-control-sm text-center'
                  type="number" min={1}
                  value={simulado.numSim}
                  onChange={async (e) => {
                    const novoNumSim = Number(e.target.value);
                    if (!isNaN(novoNumSim) && novoNumSim > 0) {
                      try {
                        await api.put(`/simulados/${simulado.id}`, { quanQuest: simulado.quanQuest, numSim: novoNumSim, dataSim: simulado.dataSim, projeto: simulado.projeto, userId: simulado.userId });
                        setSimulado({ ...simulado, numSim: novoNumSim });
                        localStorage.setItem('atualizaDashboard', Date.now());
                      } catch (err) { console.error(err); }
                    }
                  }}
                  style={{ width: '56px' }}
                />
              </div>

              <div style={{ width: 1, height: 28, background: 'var(--border)', flexShrink: 0 }} />

              {/* Data */}
              <div className="d-flex align-items-center gap-2">
                <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-light)', fontWeight: 600, whiteSpace: 'nowrap' }}>Data</span>
                <input
                  className='form-control form-control-sm'
                  type="date"
                  value={simulado.dataSim ? new Date(simulado.dataSim).toISOString().slice(0, 10) : ''}
                  onChange={async (e) => {
                    const dataUtc = new Date(e.target.value).toISOString();
                    try {
                      await api.put(`/simulados/${simulado.id}`, { quanQuest: simulado.quanQuest, numSim: simulado.numSim, dataSim: dataUtc, projeto: simulado.projeto, userId: simulado.userId });
                      setSimulado({ ...simulado, dataSim: dataUtc });
                      localStorage.setItem('atualizaDashboard', Date.now());
                    } catch (err) { console.error(err); }
                  }}
                  style={{ width: '128px' }}
                />
              </div>

              <div style={{ width: 1, height: 28, background: 'var(--border)', flexShrink: 0 }} />

              {/* PDF Simulado */}
              <div className="d-flex align-items-center gap-2">
                <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-light)', fontWeight: 600, whiteSpace: 'nowrap' }}>
                  <FontAwesomeIcon icon={faFilePdf} style={{ color: '#3b82f6', marginRight: 4 }} />PDF
                </span>
                <DrivePickerButton
                  className="btn btn-outline-secondary btn-sm d-inline-flex align-items-center gap-1"
                  label={<><svg width="13" height="13" viewBox="0 0 87.3 78" style={{verticalAlign:'middle', flexShrink:0}}><path d="M6.6 66.85l3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8H0c0 1.55.4 3.1 1.2 4.5z" fill="#0066da"/><path d="M43.65 25L29.9 1.2C28.55 2 27.4 3.1 26.6 4.5L1.2 49.35A9.07 9.07 0 0 0 0 53.8h27.45z" fill="#00ac47"/><path d="M73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5H59.85l5.87 11.2z" fill="#ea4335"/><path d="M43.65 25L57.4 1.2C56.05.4 54.5 0 52.9 0H34.4c-1.6 0-3.15.45-4.5 1.2z" fill="#00832d"/><path d="M59.85 53.8H27.45L13.7 77.6c1.35.8 2.9 1.2 4.5 1.2h50.9c1.6 0 3.15-.45 4.5-1.2z" fill="#2684fc"/><path d="M73.4 26.95l-12.65-21.9C59.95 3.65 58.8 2.55 57.4 1.75L43.65 25 59.85 53.8h27.4c0-1.55-.4-3.1-1.2-4.5z" fill="#ffba00"/></svg><span>{driveSimuladoNome ? '✓ '+driveSimuladoNome.slice(0,18)+(driveSimuladoNome.length>18?'…':'') : simulado.simulado ? 'Trocar' : 'Selecionar'}</span></>}
                  onPick={(url, nome) => { setDriveSimuladoUrl(url); setDriveSimuladoNome(nome); }}
                />
                {(simulado.simulado || driveSimuladoUrl) && (
                  <a href={pdfUrl(driveSimuladoUrl || simulado.simulado)} target="_blank" rel="noopener noreferrer" style={{ color: '#3b82f6', fontSize: '1.15em', lineHeight: 1 }} title="Abrir PDF">
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
                  label={<><svg width="13" height="13" viewBox="0 0 87.3 78" style={{verticalAlign:'middle', flexShrink:0}}><path d="M6.6 66.85l3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8H0c0 1.55.4 3.1 1.2 4.5z" fill="#0066da"/><path d="M43.65 25L29.9 1.2C28.55 2 27.4 3.1 26.6 4.5L1.2 49.35A9.07 9.07 0 0 0 0 53.8h27.45z" fill="#00ac47"/><path d="M73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5H59.85l5.87 11.2z" fill="#ea4335"/><path d="M43.65 25L57.4 1.2C56.05.4 54.5 0 52.9 0H34.4c-1.6 0-3.15.45-4.5 1.2z" fill="#00832d"/><path d="M59.85 53.8H27.45L13.7 77.6c1.35.8 2.9 1.2 4.5 1.2h50.9c1.6 0 3.15-.45 4.5-1.2z" fill="#2684fc"/><path d="M73.4 26.95l-12.65-21.9C59.95 3.65 58.8 2.55 57.4 1.75L43.65 25 59.85 53.8h27.4c0-1.55-.4-3.1-1.2-4.5z" fill="#ffba00"/></svg><span>{driveGabaritoNome ? '✓ '+driveGabaritoNome.slice(0,18)+(driveGabaritoNome.length>18?'…':'') : simulado.gabarito ? 'Trocar' : 'Selecionar'}</span></>}
                  onPick={(url, nome) => { setDriveGabaritoUrl(url); setDriveGabaritoNome(nome); }}
                />
                {(simulado.gabarito || driveGabaritoUrl) && (
                  <a href={pdfUrl(driveGabaritoUrl || simulado.gabarito)} target="_blank" rel="noopener noreferrer" style={{ color: '#ef4444', fontSize: '1.15em', lineHeight: 1 }} title="Abrir Gabarito">
                    <FontAwesomeIcon icon={faFilePdf} />
                  </a>
                )}
              </div>

            </div>
          </div>
          {/* CONTEÚDO SCROLLÁVEL */}
          <div className="overflow-auto" style={{ flex: 1, minHeight: 0, maxHeight: '50vh' }}>
            {/* Datalists para autocompletar itens do edital */}
            {materiasCadastradas.map(m => (
              <datalist key={m.id} id={`sel-edital-list-${m.id || m.nome}`}>
                {(materiasEdital[m.nome] || []).map((item, idx) => (
                  <option key={idx} value={item} />
                ))}
              </datalist>
            ))}
            <table className="align-middle" style={{ minWidth: tipo === 'certo_errado' ? 830 : 950, width: '100%', tableLayout: 'fixed' }}>
               <thead style={{ position: 'sticky', top: 0, zIndex: 2, background: 'var(--background-l-light)' }}>
                <tr>
                  <th className="text-center p-1" style={{ width: 36 }}>#</th>
                  <th className="text-center p-1" style={{ width: 160 }}>
                    <span className="d-inline-flex align-items-center gap-1">
                      Matéria
                      <span
                        role="button"
                        tabIndex={0}
                        onClick={() => setPreenchimentoRapido(v => !v)}
                        style={{ cursor: 'pointer', color: preenchimentoRapido ? '#ffc107' : 'var(--text-light)', fontSize: '1.2em', marginLeft: '2px', transition: 'color 0.2s' }}
                        title="Preenchimento relâmpago: ao selecionar uma matéria, todas as abaixo serão preenchidas com o mesmo valor."
                      >
                        <FontAwesomeIcon icon={faBolt} />
                      </span>
                    </span>
                  </th>
                  <th className="text-center p-1" style={{ width: 220 }}>Item do Edital</th>
                  <th className="text-center p-1" style={{ width: tipo === 'certo_errado' ? 72 : 124 }}>Resp.</th>
                  <th className="text-center p-1" style={{ width: tipo === 'certo_errado' ? 60 : 104 }}>Gab.</th>
                  <th className="text-center p-1" style={{ width: 52 }}>Chute?</th>
                  <th className="text-center p-1" style={{ width: 64 }}>Anulada?</th>
                  <th className="text-center p-1" style={{ width: 160 }}>Motivo do Erro</th>
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: simulado.quanQuest }, (_, index) => {
                  const r = respostas[index]?.trim().toUpperCase();
                  const g = gabaritos[index]?.trim().toUpperCase();
                  const isFilled = r !== '' && g !== '';
                  const isBlank = r === 'S' || g === 'S';
                  const anulada = anuladas[index];
                  const chute = chutes[index];
                  const motivoErro = motivosErro[index];
                  const cardClass = anulada ? 'card-anulada' : (isFilled && !isBlank ? (r === g ? 'linha-correta' : 'linha-incorreta') : '');
                  return (
                    <tr
                      key={index}
                      className={cardClass}
                    >
                      <td className="text-center fw-bold p-1 border" style={{ width: 36 }}>{index + 1}</td>
                      <td className="p-1 border" style={{ width: 160, overflow: 'hidden' }}>
                        <select
                          value={materias[index]}
                          onChange={(e) => handleMateriaChange(e, index)}
                          id={`materia-${index}`}
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
                      <td className="p-1 border" style={{ width: 220, overflow: 'hidden' }}>
                        {(() => {
                          const itemsDisponiveis = materiasEdital[materias[index]] || [];
                          const isInvalid = !!(editalItens[index] && itemsDisponiveis.length > 0 && !itemsDisponiveis.includes(editalItens[index]));
                          return (
                            <input
                              type="text"
                              value={editalItens[index] || ''}
                              onChange={e => { const updated = [...editalItens]; updated[index] = e.target.value; setEditalItens(updated); setIsDirty(true); }}
                              onBlur={e => {
                                const items = materiasEdital[materias[index]] || [];
                                if (items.length > 0 && e.target.value && !items.includes(e.target.value)) {
                                  const updated = [...editalItens]; updated[index] = ''; setEditalItens(updated);
                                }
                              }}
                              id={`edital-item-${index}`}
                              className={`form-control form-control-sm${isInvalid ? ' is-invalid' : ''}`}
                              placeholder={!materias[index] ? 'Selecione uma matéria' : 'Digite para filtrar...'}
                              disabled={!materias[index]}
                              list={materias[index] ? `sel-edital-list-${materiasCadastradas.find(m => m.nome === materias[index])?.id || materias[index]}` : undefined}
                              required={itemsDisponiveis.length > 0}
                              style={{ fontSize: '0.88em' }}
                              autoComplete="off"
                            />
                          );
                        })()}
                      </td>
                      <td className="p-1 text-center border" style={{ width: tipo === 'certo_errado' ? 72 : 124 }}>
                        <div className="d-flex gap-1 justify-content-center">
                          {(tipo === 'certo_errado' ? ['C','E','–'] : ['A','B','C','D','E','–']).map((opt) => {
                            const val = opt === '–' ? 'S' : opt;
                            const sel = respostas[index] === val;
                            return (
                              <button
                                key={opt}
                                type="button"
                                id={opt === (tipo === 'certo_errado' ? 'C' : 'A') ? `alt-${index}` : undefined}
                                onClick={() => handleAlternativaClick(val, index)}
                                style={{
                                  width: 17, height: 22, padding: 0,
                                  fontSize: '0.7em', fontWeight: 700, lineHeight: 1,
                                  borderRadius: 3,
                                  border: `1px solid ${sel ? 'transparent' : 'var(--border)'}`,
                                  background: sel ? (opt === '–' ? 'rgba(107,114,128,0.5)' : '#3b82f6') : 'transparent',
                                  color: sel ? '#fff' : 'var(--text-light)',
                                  cursor: 'pointer',
                                }}
                              >
                                {opt}
                              </button>
                            );
                          })}
                        </div>
                      </td>
                      <td className="p-1 text-center border" style={{ width: tipo === 'certo_errado' ? 60 : 104 }}>
                        <div className="d-flex gap-1 justify-content-center">
                          {(tipo === 'certo_errado' ? ['C','E'] : ['A','B','C','D','E']).map((opt) => {
                            const sel = gabaritos[index] === opt;
                            return (
                              <button
                                key={opt}
                                type="button"
                                id={opt === (tipo === 'certo_errado' ? 'C' : 'A') ? `gab-${index}` : undefined}
                                onClick={() => handleGabaritoClick(opt, index)}
                                style={{
                                  width: 17, height: 22, padding: 0,
                                  fontSize: '0.7em', fontWeight: 700, lineHeight: 1,
                                  borderRadius: 3,
                                  border: `1px solid ${sel ? 'transparent' : 'var(--border)'}`,
                                  background: sel ? '#3b82f6' : 'transparent',
                                  color: sel ? '#fff' : 'var(--text-light)',
                                  cursor: 'pointer',
                                }}
                              >
                                {opt}
                              </button>
                            );
                          })}
                        </div>
                      </td>
                      <td className="p-1 text-center border pointer" style={{ minWidth: 36, width: 50 }} onClick={() => handleChuteChange(index)}>
                        <div className="form-check d-flex justify-content-center align-items-center" style={{ height: '28px', minHeight: '28px', paddingLeft: 0, paddingRight: 0 }}>
                          <input
                            className="pointer form-check-input"
                            type="checkbox"
                            id={`chute-${index}`}
                            checked={chute}
                            onChange={() => handleChuteChange(index)}
                            style={{ margin: 0, display: 'inline-block', width: '18px', height: '18px', fontSize: '0.88em' }}
                          />
                        </div>
                      </td>
                      <td className="p-1  text-center border pointer" style={{ minWidth: 36, width: 60 }} onClick={() => handleAnuladaChange(index)}>
                        <div className="form-check d-flex justify-content-center align-items-center" style={{ height: '28px', minHeight: '28px', paddingLeft: 0, paddingRight: 0 }}>
                          <input
                            className="pointer  form-check-input"
                            type="checkbox"
                            id={`anulada-${index}`}
                            checked={anulada}
                            onChange={() => handleAnuladaChange(index)}
                            style={{ margin: 0, display: 'inline-block', width: '18px', height: '18px', fontSize: '0.88em' }}
                          />
                          <span
                            style={{ marginLeft: '0.4em', color: '#6c757d', fontSize: '1.05em', cursor: 'pointer', verticalAlign: 'middle' }}
                            title="Quando a questão é marcada como anulada, ela é contabilizada como ponto."
                          >
                            ⓘ
                          </span>
                        </div>
                      </td>
                      <td className="p-1 border" style={{ minWidth: 180 }}>
                        {!(anulada || !respostas[index] || !gabaritos[index] || respostas[index]?.trim().toUpperCase() === gabaritos[index]?.trim().toUpperCase()) && (
                          <select
                            id={`erro-${index}`}
                            className="form-select form-select-sm"
                            value={motivoErro}
                            onChange={(e) => handleMotivoErroChange(e, index)}
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
          {/* FOOTER FIXO */}
          <div style={{ position: 'sticky', bottom: 0, zIndex: 10, background: 'var(--background-l-light)', paddingTop: 2, paddingBottom: 2 }}>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.7em', marginTop: '0.7em', marginBottom: '0.2em' }}>
              <button type="button" className="btn btn-outline-primary-primary3" onClick={handleCloseSilent}>Cancelar</button>
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

export default Selecao;
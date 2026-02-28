import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState, forwardRef, useImperativeHandle } from 'react';
import api from '../../services/api';
import 'bootstrap/dist/css/bootstrap.min.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBolt, faTimes, faFilePdf } from '@fortawesome/free-solid-svg-icons';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const Selecao = forwardRef(({ id: propId, onClose }, ref) => {
  const [pdfSimulado, setPdfSimulado] = useState(null);
  const [pdfGabarito, setPdfGabarito] = useState(null);
  const [uploading, setUploading] = useState(false);
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
        const response = await api.get('/edital');
        setMateriasCadastradas(response.data);
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

  function handleAlternativaChange(e, index) {
    const value = e.target.value.toUpperCase();
    const updated = [...respostas];
    updated[index] = value;
    setRespostas(updated);

    if (value.length === 1) {
      const nextIndex = index + 1;
      if (nextIndex < simulado.quanQuest) {
        const nextInput = document.getElementById(`alt-${nextIndex}`);
        if (nextInput) nextInput.focus();
      } else {
        const firstGab = document.getElementById('gab-0');
        if (firstGab) firstGab.focus();
      }
    }
  }

  function handleGabaritoChange(e, index) {
    const value = e.target.value.toUpperCase();
    const updated = [...gabaritos];
    updated[index] = value;
    setGabaritos(updated);

    if (value.length === 1) {
      const nextIndex = index + 1;
      if (nextIndex < simulado.quanQuest) {
        const nextInput = document.getElementById(`gab-${nextIndex}`);
        if (nextInput) nextInput.focus();
      }
    }
  }

  function handleMateriaChange(e, index) {
    const value = e.target.value;
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
    const updated = [...chutes];
    updated[index] = !updated[index];
    setChutes(updated);
  }

  function handleMotivoErroChange(e, index) {
    const value = e.target.value;
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
      if (!respostas[i] || !gabaritos[i] || !materias[i] || !editalItens[i]) {
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
      const dadosValidos = dados.filter(q => q.simuladoId); // Só mantém os com simuladoId
      if (dadosValidos.length === 0) {
        // Não exibe texto de erro, apenas feedback visual
        return;
      }

      // Substitui todas as respostas do usuário
      await api.post('/salvarRespostas', { dados: dadosValidos });

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

      // Atualiza dashboard imediatamente
      localStorage.setItem('atualizaDashboard', Date.now());

      // Fecha o popup/modal após salvar
      setTimeout(() => {
        handleCloseSilent();
      }, 300);
    } catch (error) {
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
    const alternativas = ['C', 'E'];
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
          <div style={{ position: 'sticky', top: 0, zIndex: 10, background: 'var(--background-l-light)', paddingBottom: 8 }}>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <div className="d-flex align-items-center gap-2">
                <h5 className="mb-0" style={{ color: 'var(--text-dark)' }}>Simulado #{simulado.numSim}</h5>
                <button
                  type="button"
                  className="btn btn-warning btn-sm ms-2"
                  onClick={preencherAleatorio}
                  style={{ fontWeight: 600 }}
                  title="Preencher Aleatório (Teste)"
                >
                  Preencher Aleatório
                </button>
              </div>
              <button type="button" className="btn-close" onClick={handleCloseWithConfirm} title="Fechar"/>
            </div>
            <hr/>
            <div className="info-simulado mt-3 p-3 rounded-3 border text-dark" >
              <div className="d-flex flex-wrap align-items-end gap-3">
                {/* Número do simulado */}
                <div className="d-flex flex-column">
                  <label className="form-label fw-semibold  small">Número:</label>
                  <input
                    className='form-control form-control-sm '
                    type="number"
                    min={1}
                    value={simulado.numSim}
                    onChange={async (e) => {
                      const novoNumSim = Number(e.target.value);
                      if (!isNaN(novoNumSim) && novoNumSim > 0) {
                        try {
                          await api.put(`/simulados/${simulado.id}`, {
                            quanQuest: simulado.quanQuest,
                            numSim: novoNumSim,
                            dataSim: simulado.dataSim,
                            projeto: simulado.projeto,
                            userId: simulado.userId
                          });
                          setSimulado({ ...simulado, numSim: novoNumSim });
                          localStorage.setItem('atualizaDashboard', Date.now());
                        } catch (err) {
                          console.error("Erro ao atualizar número:", err);
                        }
                      }
                    }}
                    style={{ width: '60px' }}
                  />
                </div>
                
                {/* Data */}
                <div className="d-flex flex-column">
                  <label className="form-label fw-semibold small">Data:</label>
                  <input
                    className='form-control form-control-sm '
                    type="date"
                    value={simulado.dataSim ? new Date(simulado.dataSim).toISOString().slice(0, 10) : ''}
                    onChange={async (e) => {
                      const dataUtc = new Date(e.target.value).toISOString();
                      try {
                        await api.put(`/simulados/${simulado.id}`, {
                          quanQuest: simulado.quanQuest,
                          numSim: simulado.numSim,
                          dataSim: dataUtc,
                          projeto: simulado.projeto,
                          userId: simulado.userId
                        });
                        setSimulado({ ...simulado, dataSim: dataUtc });
                        localStorage.setItem('atualizaDashboard', Date.now());
                      } catch (err) {
                        console.error("Erro ao atualizar data:", err);
                      }
                    }}
                    style={{ width: '120px' }}
                  />
                </div>

                {/* PDF Simulado */}
                <div className="d-flex flex-column">
                  <label className="form-label fw-semibold  small d-flex align-items-center gap-1">
                    <FontAwesomeIcon icon={faFilePdf} className="text-primary" />
                    PDF Simulado:
                  </label>
                  <div className="d-flex align-items-center gap-2">
                    <input 
                      type="file" 
                      accept="application/pdf" 
                      onChange={e => setPdfSimulado(e.target.files[0])} 
                      className="form-control form-control-sm"
                      style={{ width: '300px' }}
                    />
                    {simulado.simulado && !pdfSimulado && (
                      <a href={`${API_URL}/pdf/${simulado.simulado}`} target="_blank" rel="noopener noreferrer" className="text-primary" style={{ fontSize: '1.2em' }}>
                        <FontAwesomeIcon icon={faFilePdf} />
                      </a>
                    )}
                  </div>
                </div>

                {/* PDF Gabarito */}
                <div className="d-flex flex-column">
                  <label className="form-label fw-semibold small d-flex align-items-center gap-1">
                    <FontAwesomeIcon icon={faFilePdf} className="text-danger" />
                    PDF Gabarito:
                  </label>
                  <div className="d-flex align-items-center gap-2">
                    <input 
                      type="file" 
                      accept="application/pdf" 
                      onChange={e => setPdfGabarito(e.target.files[0])} 
                      className="form-control form-control-sm"
                      style={{ width: '300px' }}
                    />
                    {simulado.gabarito && !pdfGabarito && (
                      <a href={`${API_URL}/pdf/${simulado.gabarito}`} target="_blank" rel="noopener noreferrer" className="text-danger" style={{ fontSize: '1.2em' }}>
                        <FontAwesomeIcon icon={faFilePdf} />
                      </a>
                    )}
                  </div>
                </div>
              </div>
              
              {uploading && (
                <div className="mt-3 p-2 bg-success bg-opacity-10 text-success rounded-2 d-flex align-items-center gap-2">
                  <div className="spinner-border spinner-border-sm" role="status"></div>
                  <span>Enviando arquivos...</span>
                </div>
              )}
            </div>
          </div>
          {/* CONTEÚDO SCROLLÁVEL */}
          <div className="overflow-auto" style={{ flex: 1, minHeight: 0, maxHeight: '50vh' }}>
            <table className="  align-middle" style={{ minWidth: 900 }}>
               <thead style={{ position: 'sticky', top: 0, zIndex: 2, background: 'var(--background-l-light)' }}>
                <tr>
                  <th className="text-center p-1 bo">#</th>
                  <th className="text-center p-1" style={{ minWidth: 140, maxWidth: 200 }}>
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
                  <th className="text-center p-1" style={{ minWidth: 180, maxWidth: 320 }}>Item do Edital</th>
                  <th className="text-center p-1" style={{ minWidth: 40, maxWidth: 60 }}>Resp.</th>
                  <th className="text-center p-1" style={{ minWidth: 40, maxWidth: 60 }}>Gab.</th>
                  <th className="text-center p-1" style={{ minWidth: 36, maxWidth: 40 }}>Chute?</th>
                  <th className="text-center p-1" style={{ minWidth: 36, maxWidth: 40 }}>Anulada?</th>
                  <th className="text-center p-1" style={{ minWidth: 120 }}>Motivo do Erro</th>
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
                      className={cardClass + ' fadein-cascade'}
                      style={{ animationDelay: `${index * 0.06}s` }}
                    >
                      <td className="text-center fw-bold p-1 border">{index + 1}</td>
                      <td className="p-1 border" style={{ minWidth: 140, width: 400 }}>
                        <div className="d-flex align-items-center">
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
                        </div>
                      </td>
                      <td className="p-1 border" style={{ minWidth: 180, width: 450 }}>
                        <select
                          value={editalItens[index] || ''}
                          onChange={e => {
                            const updated = [...editalItens];
                            updated[index] = e.target.value;
                            setEditalItens(updated);
                          }}
                          id={`edital-item-${index}`}
                          className="form-select form-select-sm"
                          required
                          disabled={!materias[index] || !(materiasEdital[materias[index]] && materiasEdital[materias[index]].length > 0)}
                          style={{ fontSize: '0.88em' }}
                        >
                          <option value="">
                            {!materias[index] ? 'Selecione uma matéria' :
                              (materiasEdital[materias[index]] && materiasEdital[materias[index]].length > 0 ? 'Item do edital' : 'Não há edital inserido')}
                          </option>
                          {(materiasEdital[materias[index]] || []).map((item, idx) => (
                            <option key={`${idx}-${item}`} value={item}>{item}</option>
                          ))}
                        </select>
                      </td>
                      <td className="p-1 text-center border" style={{ minWidth: 40, maxWidth: 60 }}>
                        <input
                          type="text"
                          maxLength={1}
                          value={respostas[index]}
                          onChange={(e) => handleAlternativaChange(e, index)}
                          className="form-control form-control-sm text-uppercase text-center"
                          id={`alt-${index}`}
                          style={{ fontSize: '0.88em' }}
                        />
                      </td>
                      <td className="p-1 text-center border" style={{ minWidth: 40, maxWidth: 60 }}>
                        <input
                          type="text"
                          maxLength={1}
                          id={`gab-${index}`}
                          required
                          value={gabaritos[index]}
                          onChange={(e) => handleGabaritoChange(e, index)}
                          className="form-control form-control-sm text-uppercase text-center"
                          style={{ fontSize: '0.88em' }}
                        />
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
              <button type="button" className="btn btn-outline-primary-primary" style={{ padding: '4px 14px', fontSize: '0.97em' }} onClick={handleCloseSilent}>Cancelar</button>
              <button type="submit" className="btn btn-primary-primary" style={{ padding: '4px 14px', fontSize: '0.97em' }}>Salvar Dados</button>
            </div>
          </div>
        </form>
        </main>
      </div>
    </div>
  );
});

export default Selecao;
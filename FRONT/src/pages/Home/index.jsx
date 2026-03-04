import Sidebar from './components/sidebar.jsx';
import React, { useEffect, useState, useContext } from 'react';
import api from '../../services/api';
import { Trash, Upload, Edit2, Calendar, Award, CheckCircle, XCircle } from 'react-feather';
import FireIcon from '../../components/FireIcon';
import { useNavigate } from 'react-router-dom';
import { Line, Radar } from 'react-chartjs-2';
import { Chart, CategoryScale, LinearScale, PointElement, LineElement, Legend, Tooltip, Title, RadialLinearScale, Filler } from 'chart.js';
import { Pie } from 'react-chartjs-2';
import { Bar } from 'react-chartjs-2';
import { Badge, Modal, Spinner } from 'react-bootstrap';
import { usePageTitle } from '../../components/PageTitleContext';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import confetti from 'canvas-confetti';
import { StudyTimerContext } from '../../components/StudyTimerContext';
Chart.register(CategoryScale, LinearScale, PointElement, LineElement, Legend, Tooltip, Title, RadialLinearScale, Filler);


// Função para ler o estado inicial da sidebar do localStorage
function getSidebarCollapsed() {
  const val = localStorage.getItem('sidebarCollapsed');
  // Se não está definido no localStorage, vamos verificar se há projetos
  if (val === null) {
    // Verifica se há projetos cadastrados para decidir o estado inicial
    try {
      const usuario = JSON.parse(localStorage.getItem('user'));
      if (!usuario) return true; // Se não há usuário, começa recolhida

      // Se há um projeto selecionado, significa que tem projetos - começa expandida
      const projetoSelecionado = localStorage.getItem('projetoSelecionado');
      if (projetoSelecionado) return false; // Expandida

      return true; // Recolhida por padrão
    } catch {
      return true; // Em caso de erro, começa recolhida
    }
  }
  return val === '1';
}

const Home = () => {
  const { openFormWithEdit } = useContext(StudyTimerContext);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(getSidebarCollapsed);
  const [simulados, setSimulados] = useState([]);
  const [resumos, setResumos] = useState({});
  const [loading, setLoading] = useState(true);
  const [temProjetosCadastrados, setTemProjetosCadastrados] = useState(false); // Começa como false para evitar flash
  const [loadingInit, setLoadingInit] = useState(true); // Aguarda verificação inicial

  // Recupera projeto selecionado do localStorage (id)
  const [projetoSelecionado, setProjetoSelecionado] = useState(() => localStorage.getItem('projetoSelecionado') || '');

  // Atualiza localStorage sempre que sidebarCollapsed mudar
  useEffect(() => {
    localStorage.setItem('sidebarCollapsed', sidebarCollapsed ? '1' : '0');
  }, [sidebarCollapsed]);

  useEffect(() => {
    function atualizarProjetoSelecionado() {
      setProjetoSelecionado(localStorage.getItem('projetoSelecionado') || '');
    }
    atualizarProjetoSelecionado();
    window.addEventListener('storage', atualizarProjetoSelecionado);
    return () => window.removeEventListener('storage', atualizarProjetoSelecionado);
  }, []);

  // Verificar se existem projetos cadastrados
  useEffect(() => {
    async function verificarProjetosCadastrados() {
      try {
        const usuario = JSON.parse(localStorage.getItem('user'));
        if (!usuario) {
          setTemProjetosCadastrados(false);
          return;
        }

        const res = await api.get('/projetos', { params: { userId: usuario.id } });
        const projetos = res.data || [];
        setTemProjetosCadastrados(projetos.length > 0);

        // Ajusta a sidebar baseada na existência de projetos
        if (projetos.length > 0) {
          // Se há projetos, sidebar deve estar expandida (exceto se usuário já definiu preferência)
          const sidebarPreferencia = localStorage.getItem('sidebarCollapsed');
          if (sidebarPreferencia === null) {
            setSidebarCollapsed(false); // Expandida
            localStorage.setItem('sidebarCollapsed', '0');
          }
        } else {
          // Se não há projetos, sidebar deve estar recolhida
          setSidebarCollapsed(true);
          localStorage.setItem('sidebarCollapsed', '1');
        }

        // Se não há projeto selecionado mas há projetos disponíveis, seleciona o primeiro
        if (projetos.length > 0 && !localStorage.getItem('projetoSelecionado')) {
          localStorage.setItem('projetoSelecionado', projetos[0].id);
          setProjetoSelecionado(projetos[0].id);
        }
      } catch (error) {
        console.error('Erro ao verificar projetos:', error);
        setTemProjetosCadastrados(false);
      } finally {
        setLoadingInit(false);
      }
    }

    verificarProjetosCadastrados();
  }, []);

  useEffect(() => {
    async function fetchData() {
      try {
        const projetoId = localStorage.getItem('projetoSelecionado') || '';

        // Se não há projeto selecionado, não busca dados
        if (!projetoId) {
          setLoading(false);
          return;
        }

        // Primeiro verifica se há simulados (requisição rápida para decisão)
        const simuladosCheck = await api.get('/simulados', { params: { projetoId } });
        const simuladosFiltrados = simuladosCheck.data.filter(sim => (sim.projetoId || sim.projetoId) === projetoId);

        // Se não há simulados, não mostra loading
        if (simuladosFiltrados.length === 0) {
          setSimulados([]);
          setResumos({});
          setLoading(false);
          return;
        }

        // Só executa loading se há projeto selecionado E há simulados
        setLoading(true);

        // Busca dados completos
        const resumoRes = await api.get('/dashboard/resumos', { params: { projetoId } });
        const resFiltrados = {};
        Object.keys(resumoRes.data || {}).forEach(id => {
          if ((resumoRes.data[id].projetoId || resumoRes.data[id].projeto) === projetoId) {
            resFiltrados[id] = resumoRes.data[id];
          }
        });
        setSimulados(simuladosFiltrados);
        setResumos(resFiltrados);
      } catch (err) {
        console.error('Erro ao carregar dados da home:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [projetoSelecionado]);

  // Array de simulados ordenados por número (usar em todos os lugares)
  const simuladosOrdenados = React.useMemo(() => {
    return [...simulados]
      .filter(sim => sim.numSim && !isNaN(parseInt(sim.numSim)))
      .sort((a, b) => {
        // Ordenação primária por número do simulado (menor número = mais antigo)
        const numA = parseInt(a.numSim) || 0;
        const numB = parseInt(b.numSim) || 0;
        if (numA !== numB) {
          return numA - numB;
        }
        // Ordenação secundária por ID caso os números sejam iguais (menor ID = mais antigo)
        return (a.id || 0) - (b.id || 0);
      });
  }, [simulados]);

  // Estatísticas do último simulado
  const ultimoSimulado = simulados.length > 0 ? simuladosOrdenados[simuladosOrdenados.length - 1] : null;
  const resumoUltimo = ultimoSimulado ? resumos[ultimoSimulado.id] : null;

  // Função para formatar data evitando problemas de timezone
  const formatarDataSegura = (dateString) => {
    if (!dateString) return 'Data inválida';
    try {
      // Tenta diferentes formatos de data
      let date;

      // Se já é um objeto Date válido
      if (dateString instanceof Date && !isNaN(dateString.getTime())) {
        date = dateString;
      }
      // Se é uma string ISO (YYYY-MM-DD ou YYYY-MM-DDTHH:mm:ss)
      else if (typeof dateString === 'string') {
        // Remove o horário se existir, mantém só a data
        const dateOnly = dateString.split('T')[0];
        date = new Date(dateOnly + 'T00:00:00');
      }
      // Fallback para new Date direto
      else {
        date = new Date(dateString);
      }

      if (isNaN(date.getTime())) return 'Data inválida';
      return date.toLocaleDateString('pt-BR');
    } catch (error) {
      console.error('Erro ao formatar data:', dateString, error);
      return 'Data inválida';
    }
  };

  // Calcular dias desde o último simulado
  let diasUltimoSimulado = null;
  if (ultimoSimulado) {
    const hoje = new Date();
    const dataUltimo = new Date(ultimoSimulado.dataSim);
    const diffMs = hoje - dataUltimo;
    diasUltimoSimulado = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  }

  // Recupera nome do usuário logado
  const usuario = JSON.parse(localStorage.getItem('user'));
  const nomeUsuario = usuario?.nome || usuario?.email || '';

  // Função para duplicar simulado
  async function handleDuplicarSimulado(simuladoId) {
    try {
      // Busca o simulado original
      const simuladoOriginal = simulados.find(s => s.id === simuladoId);
      if (!simuladoOriginal) return;
      // Cria novo simulado com os mesmos dados (exceto id e data)
      const novoSimulado = {
        ...simuladoOriginal,
        id: undefined,
        dataSim: new Date().toISOString(),
        numSim: simulados.length + 1 // ou outro critério
      };
      const res = await api.post('/simulados', novoSimulado);
      // Atualiza lista
      setSimulados([...simulados, res.data]);
      alert('Simulado duplicado com sucesso!');
    } catch (error) {
      alert('Erro ao duplicar simulado.');
    }
  }

  const [historicoEstudo, setHistoricoEstudo] = useState([]);
  const [diasSemFalhar, setDiasSemFalhar] = useState(0);
  const [recordeDias, setRecordeDias] = useState(0);
  const [metaSemanal, setMetaSemanal] = useState(10);
  const [showModalMeta, setShowModalMeta] = useState(false);
  const [metaSemanalHoras, setMetaSemanalHoras] = useState(10);
  const [metaSemanalMinutos, setMetaSemanalMinutos] = useState(0);
  const [inicioDaSemana, setInicioDaSemana] = useState(() => { const v = parseInt(localStorage.getItem('inicioDaSemana')); return isNaN(v) ? 1 : v; });
  const [inicioDaSemanaInput, setInicioDaSemanaInput] = useState(() => { const v = parseInt(localStorage.getItem('inicioDaSemana')); return isNaN(v) ? 1 : v; });
  const [diasMigrados, setDiasMigrados] = useState(0); // Novo state para dias migrados

  // Estados para migração de horas
  const [showModalMigracaoHoras, setShowModalMigracaoHoras] = useState(false);
  const [horasParaMigrar, setHorasParaMigrar] = useState('');
  const [minutosParaMigrar, setMinutosParaMigrar] = useState('');
  const [migracaoHorasUsada, setMigracaoHorasUsada] = useState(false);

  async function fetchHistoricoEstudo() {
      try {
        const usuario = JSON.parse(localStorage.getItem('user'));
        const projetoId = localStorage.getItem('projetoSelecionado') || '';
        if (!usuario || !projetoId) return;

        const res = await api.get('/estudo', { params: { userId: usuario.id, projetoId } });
        setHistoricoEstudo(res.data || []);

        // Recupera dias migrados do localStorage
        const diasMigradosStorage = parseInt(localStorage.getItem(`diasMigrados_${usuario.id}_${projetoId}`)) || 0;
        const recordeMigradoStorage = parseInt(localStorage.getItem(`recordeMigrado_${usuario.id}_${projetoId}`)) || 0;
        setDiasMigrados(diasMigradosStorage);

        // Normaliza datas de estudo reais para YYYY-MM-DD (usar a parte da string ISO para evitar timezone)
        const datasEstudoReais = new Set((res.data || []).map(e => {
          try {
            if (typeof e.dataSessao === 'string' && e.dataSessao.includes('T')) {
              return e.dataSessao.split('T')[0]; // YYYY-MM-DD
            }
            const d = new Date(e.dataSessao);
            const y = d.getFullYear();
            const m = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            return `${y}-${m}-${day}`;
          } catch {
            return '';
          }
        }));

        // Cálculo de dias consecutivos considerando migração
        const hoje = new Date();
        let diasConsecutivos = 0;
        let maxDias = Math.max(diasMigradosStorage, recordeMigradoStorage); // Recorde considera tanto dias migrados quanto recorde migrado

        // Se há migração, ela representa os dias base
        if (diasMigradosStorage > 0) {
          diasConsecutivos = diasMigradosStorage;
        }

        // Verifica dias consecutivos reais a partir de hoje
        let diasReaisConsecutivos = 0;
        for (let i = 0; i < 365; i++) {
          const data = new Date(hoje);
          data.setDate(hoje.getDate() - i);
          // comparar também em YYYY-MM-DD
          const y = data.getFullYear();
          const m = String(data.getMonth() + 1).padStart(2, '0');
          const day = String(data.getDate()).padStart(2, '0');
          const dataStr = `${y}-${m}-${day}`;

          if (datasEstudoReais.has(dataStr)) {
            diasReaisConsecutivos++;
          } else {
            // Se não estudou neste dia, para a contagem de dias reais
            break;
          }
        }

        // Se há dias reais consecutivos, eles se somam à migração
        // Mas apenas se a sequência atual for maior que a migração sozinha
        if (diasReaisConsecutivos > 0) {
          diasConsecutivos = Math.max(diasMigradosStorage, diasMigradosStorage + diasReaisConsecutivos);
        }

        // Atualiza o recorde se a sequência atual for maior
        maxDias = Math.max(maxDias, diasConsecutivos);

        setRecordeDias(maxDias);
        setDiasSemFalhar(diasConsecutivos);

        // Buscar meta semanal
        try {
          const metaRes = await api.get('/meta-semanal', {
            params: { userId: usuario.id, projetoId }
          });
          if (metaRes.data?.metaSemanal) {
            setMetaSemanal(metaRes.data.metaSemanal);
            setMetaSemanalHoras(Math.floor(metaRes.data.metaSemanal));
            setMetaSemanalMinutos(Math.round((metaRes.data.metaSemanal % 1) * 60));
          }
        } catch { }
      } catch { }
    }

  useEffect(() => {
    fetchHistoricoEstudo();
  }, []);

  // Função para apagar registro de estudo com confirmação
  async function handleApagarEstudo(estudoId) {
    if (!window.confirm('Deseja realmente apagar este registro de estudo?')) return;
    try {
      await api.delete(`/estudo/${estudoId}`);
      setHistoricoEstudo(historicoEstudo.filter(e => e.id !== estudoId));
    } catch { }
  }

  const nomeDaPagina = "Home";
  const { setTitle } = usePageTitle();
  useEffect(() => {
    setTitle('Home');
    document.title = 'FLUX | Home';
  }, [setTitle]);

  const navigate = useNavigate();

  const [resumoPeriodo, setResumoPeriodo] = useState('dia');

  const [materiasCoresMap, setMateriasCoresMap] = useState({});
  const [todasMateriasList, setTodasMateriasList] = useState([]);
  useEffect(() => {
    async function fetchMateriasCores() {
      const projetoId = localStorage.getItem('projetoSelecionado') || '';
      const usuario = JSON.parse(localStorage.getItem('user'));
      if (!usuario || !projetoId) return;
      const res = await api.get('/edital', { params: { userId: usuario.id, projetoId } });
      const map = {};
      res.data.forEach(m => { if (m.nome) map[m.nome] = m.cor || '#0d6efd'; });
      setMateriasCoresMap(map);
      setTodasMateriasList(res.data.map(m => m.nome).filter(Boolean));
    }
    fetchMateriasCores();
  }, []);

  // Função para salvar meta semanal
  async function handleSalvarMetaSemanal() {
    try {
      const usuario = JSON.parse(localStorage.getItem('user'));
      const projetoId = localStorage.getItem('projetoSelecionado') || '';
      if (!usuario || !projetoId) return;
      const novaMetaSemanal = metaSemanalHoras + metaSemanalMinutos / 60;
      await api.put('/meta-semanal', {
        userId: usuario.id,
        projetoId,
        metaSemanal: novaMetaSemanal
      });
      setMetaSemanal(novaMetaSemanal);
      localStorage.setItem('inicioDaSemana', String(inicioDaSemanaInput));
      setInicioDaSemana(inicioDaSemanaInput);
      setShowModalMeta(false);
    } catch (err) {
      alert('Erro ao salvar meta semanal.');
    }
  }

  const [fraseDoDia, setFraseDoDia] = useState('');
  const [frasesGlobais, setFrasesGlobais] = useState([]);

  // Estados para migração de constância
  const [showModalMigracao, setShowModalMigracao] = useState(false);
  const [migracaoUsada, setMigracaoUsada] = useState(false);
  const [diasParaMigrar, setDiasParaMigrar] = useState('');
  const [recordeParaMigrar, setRecordeParaMigrar] = useState('');

  useEffect(() => {
    async function fetchFrasesGlobais() {
      try {
        const res = await api.get('/frases-dia');
        setFrasesGlobais(res.data || []);
      } catch { }
    }
    fetchFrasesGlobais();
  }, []);

  // Verificar se a migração já foi usada
  useEffect(() => {
    function verificarMigracaoUsada() {
      try {
        const usuario = JSON.parse(localStorage.getItem('user'));
        const projetoId = localStorage.getItem('projetoSelecionado') || '';
        if (!usuario || !projetoId) return;

        // Verifica no localStorage se a migração já foi usada
        const migracaoJaUsada = localStorage.getItem(`migracao_${usuario.id}_${projetoId}`) === 'true';

        setMigracaoUsada(migracaoJaUsada);
      } catch {
        setMigracaoUsada(false);
      }
    }
    verificarMigracaoUsada();
  }, []);

  // Verificar se a migração de horas já foi usada
  useEffect(() => {
    function verificarMigracaoHorasUsada() {
      try {
        const usuario = JSON.parse(localStorage.getItem('user'));
        const projetoId = localStorage.getItem('projetoSelecionado') || '';
        if (!usuario || !projetoId) return;

        // Verifica no localStorage se a migração de horas já foi usada
        const migracaoHorasJaUsada = localStorage.getItem(`migracaoHoras_${usuario.id}_${projetoId}`) === 'true';

        // Para testes, permitimos múltiplas migrações
        setMigracaoHorasUsada(false);
      } catch {
        setMigracaoHorasUsada(false);
      }
    }
    verificarMigracaoHorasUsada();
  }, []);

  useEffect(() => {
    if (!frasesGlobais.length) return;
    const usuario = JSON.parse(localStorage.getItem('user'));
    const hoje = new Date();
    const dia = hoje.getDate();
    const mes = hoje.getMonth() + 1;
    const ano = hoje.getFullYear();
    // Seed: userId + data
    const seedStr = (usuario?.id || '') + `${ano}-${mes}-${dia}`;
    let hash = 0;
    for (let i = 0; i < seedStr.length; i++) {
      hash = ((hash << 5) - hash) + seedStr.charCodeAt(i);
      hash |= 0;
    }
    const idx = Math.abs(hash) % frasesGlobais.length;
    setFraseDoDia(frasesGlobais[idx]?.frase || '');
  }, [frasesGlobais]);

  // Função para inserir frase do dia
  async function handleInserirFrase() {
    const usuario = JSON.parse(localStorage.getItem('user'));
    if (!usuario) return;
    const hoje = new Date();
    const dataStr = hoje.toISOString().slice(0, 10); // yyyy-mm-dd
    const frase = window.prompt('Digite a frase do dia:');
    if (!frase) return;
    try {
      await api.post('/frase-dia', { userId: usuario.id, data: dataStr, frase });
      setFraseDoDia(frase);
      alert('Frase inserida!');
    } catch {
      alert('Erro ao inserir frase.');
    }
  }

  const [showFraseModal, setShowFraseModal] = useState(false);
  const [frasesInput, setFrasesInput] = useState('');

  async function handleSalvarFrases() {
    const frases = frasesInput.split('\n').map(f => f.trim()).filter(f => f);
    if (frases.length === 0) return;
    try {
      await api.post('/frases-dia', { frases });
      setFraseDoDia(frases[0]);
      setShowFraseModal(false);
      setFrasesInput('');
      alert('Frases inseridas!');
    } catch {
      alert('Erro ao inserir frases.');
    }
  }

  // Função para processar migração de constância
  async function handleMigrarConstancia() {
    if (migracaoUsada) {
      alert('A migração já foi utilizada para este projeto.');
      return;
    }

    const diasNum = parseInt(diasParaMigrar);
    const recordeNum = parseInt(recordeParaMigrar);

    if (!diasParaMigrar.trim() || isNaN(diasNum) || diasNum < 0) {
      alert('Por favor, insira um número válido de dias consecutivos (maior ou igual a 0).');
      return;
    }

    if (!recordeParaMigrar.trim() || isNaN(recordeNum) || recordeNum < 0) {
      alert('Por favor, insira um número válido para o melhor recorde (maior ou igual a 0).');
      return;
    }

    if (recordeNum < diasNum) {
      alert('O melhor recorde não pode ser menor que os dias consecutivos atuais.');
      return;
    }

    try {
      const usuario = JSON.parse(localStorage.getItem('user'));
      const projetoId = localStorage.getItem('projetoSelecionado') || '';
      if (!usuario || !projetoId) return;

      // Busca a primeira matéria do projeto para usar como referência
      const materiasRes = await api.get('/edital', {
        params: { userId: usuario.id, projetoId }
      });
      const materias = materiasRes.data;
      if (!materias || materias.length === 0) {
        alert('É necessário ter pelo menos uma matéria cadastrada no projeto para migrar dados.');
        return;
      }

      // Salva os dados migrados no localStorage
      localStorage.setItem(`diasMigrados_${usuario.id}_${projetoId}`, diasNum.toString());
      localStorage.setItem(`recordeMigrado_${usuario.id}_${projetoId}`, recordeNum.toString());
      localStorage.setItem(`migracao_${usuario.id}_${projetoId}`, 'true');

      setDiasMigrados(diasNum);
      setRecordeDias(recordeNum);
      setDiasSemFalhar(diasNum);
      setMigracaoUsada(true);
      setShowModalMigracao(false);
      setDiasParaMigrar('');
      setRecordeParaMigrar('');

      // Recarrega os dados para atualizar contadores
      window.location.reload();

      alert(`Migração concluída!\nDias consecutivos atuais: ${diasNum}\nMelhor recorde: ${recordeNum}`);
    } catch (error) {
      console.error('Erro na migração:', error);
      alert('Erro ao migrar dados. Tente novamente.');
    }
  }

  // Função para processar migração de horas de estudo
  async function handleMigrarHoras() {
    try {
      const usuario = JSON.parse(localStorage.getItem('user'));
      const projetoId = localStorage.getItem('projetoSelecionado');

      if (!usuario || !projetoId) {
        alert('Erro: Usuário ou projeto não identificado.');
        return;
      }

      const horas = parseInt(horasParaMigrar) || 0;
      const minutos = parseInt(minutosParaMigrar) || 0;
      const totalMinutos = (horas * 60) + minutos;

      if (totalMinutos < 0) {
        alert('Por favor, insira um valor válido.');
        return;
      }

      if (totalMinutos === 0) {
        // Se for 0, reseta a migração
        localStorage.setItem(`horasMigradas_${usuario.id}_${projetoId}`, '0');
        localStorage.setItem(`migracaoHoras_${usuario.id}_${projetoId}`, 'true');

        setMigracaoHorasUsada(true);
        setShowModalMigracaoHoras(false);
        setHorasParaMigrar('');
        setMinutosParaMigrar('');

        alert('Migração de horas processada! Contagem iniciada do zero.');
        return;
      }

      // Salva as horas migradas no localStorage
      localStorage.setItem(`horasMigradas_${usuario.id}_${projetoId}`, totalMinutos.toString());
      localStorage.setItem(`migracaoHoras_${usuario.id}_${projetoId}`, 'true');

      setMigracaoHorasUsada(true);
      setShowModalMigracaoHoras(false);
      setHorasParaMigrar('');
      setMinutosParaMigrar('');

      // Recarrega os dados para atualizar contadores
      window.location.reload();

      alert(`${horas}h ${minutos}min migrados com sucesso! Esse tempo será adicionado ao seu total.`);
    } catch (error) {
      console.error('Erro na migração de horas:', error);
      alert('Erro ao migrar horas. Tente novamente.');
    }
  }

  // Função para limpar migração de horas
  function handleLimparMigracaoHoras() {
    if (!window.confirm('Tem certeza que deseja limpar a migração de horas? Esta ação não pode ser desfeita.')) {
      return;
    }

    try {
      const usuario = JSON.parse(localStorage.getItem('user'));
      const projetoId = localStorage.getItem('projetoSelecionado');

      if (!usuario || !projetoId) {
        alert('Erro: Usuário ou projeto não identificado.');
        return;
      }

      // Remove as chaves do localStorage
      localStorage.removeItem(`horasMigradas_${usuario.id}_${projetoId}`);
      localStorage.removeItem(`migracaoHoras_${usuario.id}_${projetoId}`);

      setMigracaoHorasUsada(false);

      // Recarrega os dados para atualizar contadores
      window.location.reload();

      alert('Migração de horas removida com sucesso!');
    } catch (error) {
      console.error('Erro ao limpar migração de horas:', error);
      alert('Erro ao limpar migração. Tente novamente.');
    }
  }

  // Adicione esta verificação antes do return:
  if (loadingInit) {
    return (
      <div style={{ width: '100%', height: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Spinner animation="border" role="status" />
      </div>
    );
  }

  if (!temProjetosCadastrados) {
    // Função para disparar confete centralizado no botão e aguardar animação antes de redirecionar
    const handleIniciarProjeto = (e) => {
      e.preventDefault();
      const btn = e.currentTarget;
      const rect = btn.getBoundingClientRect();
      // Calcula posição central do botão em relação à viewport
      const x = (rect.left + rect.width / 2) / window.innerWidth;
      const y = (rect.top + rect.height / 2) / window.innerHeight;
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { x, y },
        startVelocity: 35,
        ticks: 250
      });
      window.dispatchEvent(new Event('expandSidebar'));
      setTimeout(() => {
        navigate('/projeto'); // SPA navigation
      }, 1200);
    };

    return (
      <div className="app-container d-flex flex-column justify-content-center align-items-center" style={{ minHeight: '80vh' }}>

        <div className="text-center">

          <img src="/logo.png" alt="Flux" className="mb-4 fadein-slideup" style={{ height: '54px', width: 'auto', display: 'block', margin: '0 auto 1rem' }} />
          <h2 className="mb-4 text-primary-primary fadein-slideup">Bem-vindo ao Flux!</h2>
          <div className="mb-3 fs-5  d-flex justify-content-center align-items-center gap-2 fadein-slideup">
            {fraseDoDia || ''}
            <FireIcon isActive={true} size={16} />
          </div>
          <div className="mb-4 fs-6  fadein-slideup" style={{ color: 'var(--text-light)' }}>
            <p>
              O FLUX é seu <span className="fw-bold text-primary-primary" style={{ background: 'rgba(255,255,255,0.08)', padding: '2px 8px', borderRadius: 8 }}>Sistema de gestão e monitoramento de aprendizado</span>a partir de agora!<br />

            </p>
            <p>
              Para começar, crie ou selecione um projeto. Assim você poderá cadastrar matérias, simulados e acompanhar seu progresso.
            </p>
          </div>
          <button
            className="btn btn-primary-primary3 px-4 py-2 fadein-slideup"

            onClick={handleIniciarProjeto}
          >
            Iniciar Projeto
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ width: '400px', height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: 'auto' }}>
        <Spinner animation="border" role="status" />
      </div>
    );
  }

  // Adicione no início do componente Home (antes do return)
  // Troque os labels dos botões:
  const resumoOpcoes = ['dia', 'semana', 'mes', 'total'];
  const resumoLabels = { dia: 'do Dia', semana: 'da Semana', mes: 'do Mês', total: 'Total' };
  function handleResumoPeriodoToggle() {
    const idx = resumoOpcoes.indexOf(resumoPeriodo);
    setResumoPeriodo(resumoOpcoes[(idx + 1) % resumoOpcoes.length]);
  }

  return (





    <div className="app-container">



      <main className="container-fluid gap-4 pt-3">




        <div className="m-0 w-100 p-3 border fadein" style={{ borderRadius: 25, animationDelay: '0.1s', display: 'flex', flexDirection: 'column', gap: '1rem', position: 'relative' }}>
          <div className="card-title-padrao position-absolute px-3" style={{ top: '-12px', left: '20px', zIndex: 1, backgroundColor: 'var(--background)' }}>TEMPO</div>

          <div className="d-flex w-100" style={{ animationDelay: '0.15s' }}>
            <div className="card-padrao2 fadein flex-grow-1 me-4" style={{ animationDelay: '0.18s', padding: '1rem', position: 'relative' }}>
              <div className="d-flex align-items-center " style={{ width: '100%' }}>
                <div className="card-title-padrao">Constância nos Estudos</div>
                {/* Remover as condições, sempre mostrar os botões */}
                <button
                  className="btn btn-sm btn-link p-0 text-secondary me-2"
                  style={{ marginLeft: 'auto' }}
                  onClick={() => {
                    if (window.confirm('Zerar todos os dados de migração?')) {
                      const usuario = JSON.parse(localStorage.getItem('user'));
                      const projetoId = localStorage.getItem('projetoSelecionado') || '';
                      localStorage.removeItem(`diasMigrados_${usuario.id}_${projetoId}`);
                      localStorage.removeItem(`recordeMigrado_${usuario.id}_${projetoId}`);
                      localStorage.removeItem(`migracao_${usuario.id}_${projetoId}`);
                      window.location.reload();
                    }
                  }}
                  title="Limpar dados de migração"
                >
                  <Trash size={14} />
                </button>
                <button
                  className="btn btn-sm btn-link p-0 text-secondary me-2"
                  onClick={() => setShowModalMigracao(true)}
                  title="Migrar constância de outro app (uso único)"
                >
                  <Upload size={14} />
                </button>
              </div>
              <div className="card-content " style={{ justifyContent: 'flex-start' }}>
                <div className="dias-consecutivos  d-flex flex-row flex-wrap justify-content-center w-100" style={{ paddingTop: '1rem' }}>
                  {(() => {
                    const totalIcons = 30;
                    const hoje = new Date();
                    hoje.setHours(0, 0, 0, 0);
                    // Criar set de datas de estudo reais
                    const datasEstudoReais = new Set(historicoEstudo.map(e => {
                      try {
                        if (typeof e.dataSessao === 'string' && e.dataSessao.includes('T')) {
                          return e.dataSessao.split('T')[0];
                        }
                        const d = new Date(e.dataSessao);
                        const y = d.getFullYear();
                        const m = String(d.getMonth() + 1).padStart(2, '0');
                        const day = String(d.getDate()).padStart(2, '0');
                        return `${y}-${m}-${day}`;
                      } catch {
                        return '';
                      }
                    }));
                    // Obter dias migrados do localStorage
                    const usuario = JSON.parse(localStorage.getItem('user'));
                    const projetoId = localStorage.getItem('projetoSelecionado');
                    const diasMigradosStorage = parseInt(localStorage.getItem(`diasMigrados_${usuario?.id}_${projetoId}`)) || 0;
                    // Montar lista de todas as 30 datas em ordem
                    const allDates = [...Array(totalIcons)].map((_, i) => {
                      const d = new Date(hoje);
                      d.setDate(hoje.getDate() - (totalIcons - 1 - i));
                      return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
                    });
                    // Identificar sequências de 2+ dias consecutivos estudados
                    const streakDates = new Set();
                    let runStart = -1;
                    for (let i = 0; i <= totalIcons; i++) {
                      const isStudied = i < totalIcons && (datasEstudoReais.has(allDates[i]) || (totalIcons - 1 - i) < diasMigradosStorage);
                      if (isStudied) {
                        if (runStart === -1) runStart = i;
                      } else {
                        if (runStart !== -1) {
                          if (i - runStart >= 2) {
                            for (let j = runStart; j < i; j++) streakDates.add(allDates[j]);
                          }
                          runStart = -1;
                        }
                      }
                    }
                    return [...Array(totalIcons)].map((_, i) => {
                      const data = new Date(hoje);
                      data.setDate(hoje.getDate() - (totalIcons - 1 - i));
                      const y = data.getFullYear();
                      const m = String(data.getMonth() + 1).padStart(2, '0');
                      const day = String(data.getDate()).padStart(2, '0');
                      const dataStr = `${y}-${m}-${day}`;
                      const diasAtras = totalIcons - 1 - i;
                      const estudouReal = datasEstudoReais.has(dataStr);
                      const dentroMigracao = diasAtras < diasMigradosStorage;
                      const estudou = estudouReal || dentroMigracao;
                      const emStreak = streakDates.has(dataStr);
                      let titulo = 'Não estudou';
                      let icone;
                      if (emStreak) {
                        titulo = 'Streak! Dia consecutivo';
                        icone = <FireIcon isActive={true} size={18} />;
                      } else if (estudou) {
                        titulo = dentroMigracao ? 'Dia migrado' : 'Estudou';
                        icone = <FireIcon isActive={false} size={18} />;
                      } else {
                        icone = <XCircle size={15} color="#be9da4" strokeWidth={2} />;
                      }
                      const title = `${titulo} - ${day}/${m}/${y}`;
                      return (
                        <div
                          key={i}
                          title={title}
                          className={`d-flex align-items-center justify-content-center text-light ${i === 0 ? 'rounded-start' : i === totalIcons - 1 ? 'rounded-end' : ''}`}
                          style={{
                            flex: 1,
                            minWidth: 0,
                            width: 50,
                            height: 34,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0',
                            background: '#fff',
                            boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.09)',
                            borderRadius: i === 0 ? '6px 0 0 6px' : i === totalIcons - 1 ? '0 6px 6px 0' : 0,
                          }}
                        >
                          {icone}
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>
            </div>
            <div className="card-padrao2 fadein" style={{ width: '40%', minWidth: 280, textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'center', animationDelay: '0.2s', padding: '1rem', position: 'relative' }}>
              <div className="d-flex align-items-center " style={{ width: '100%' }}>

              </div>
              <div className="card-content">
                <div className="d-flex flex-row align-items-center justify-content-around w-100" style={{ gap: '0.5rem' }}>
                  <div className="d-flex flex-column align-items-center text-center" style={{ flex: 1 }}>
                    <div className='text-primary-primary d-flex align-items-center gap-1' style={{ fontSize: '1.5em', fontWeight: 600, lineHeight: 1 }}>
                      <Calendar size={16} />
                      {(() => {
                        const diasUnicos = new Set(historicoEstudo.map(e => {
                          if (typeof e.dataSessao === 'string' && e.dataSessao.includes('T')) return e.dataSessao.split('T')[0];
                          const d = new Date(e.dataSessao);
                          return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                        }));
                        return diasUnicos.size;
                      })()} <span style={{ fontSize: '0.5em', fontWeight: 500 }}>dias</span>
                    </div>
                    <div style={{ fontSize: '0.75em', color: 'var(--text-light)', fontWeight: 500, marginTop: '0.2rem' }}>registrados</div>
                  </div>
                  <div style={{ width: '1px', background: 'rgba(255,255,255,0.1)', alignSelf: 'stretch' }}></div>
                  <div className="d-flex flex-column align-items-center text-center" style={{ flex: 1 }}>
                    <div className='d-flex align-items-center gap-1' style={{ fontSize: '2.4em', color: 'var(--primary-primary)', fontWeight: 700, lineHeight: 1 }}><FireIcon isActive={true} size={22} />{diasSemFalhar} <span style={{ fontSize: '0.5em', fontWeight: 500 }}>dias</span></div>
                    <div style={{ fontSize: '0.75em', color: 'var(--text-light)', fontWeight: 600, marginTop: '0.2rem' }}>Sequência atual</div>
                  </div>
                  <div style={{ width: '1px', background: 'rgba(255,255,255,0.1)', alignSelf: 'stretch' }}></div>
                  <div className="d-flex flex-column align-items-center text-center" style={{ flex: 1 }}>
                    <div className='d-flex align-items-center gap-1' style={{ fontSize: '1.5em', color: '#ffc107', fontWeight: 700, lineHeight: 1 }}><Award size={18} />{recordeDias} <span style={{ fontSize: '0.5em', fontWeight: 500 }}>dias</span></div>
                    <div style={{ fontSize: '0.75em', color: 'var(--text-light)', fontWeight: 600, marginTop: '0.2rem' }}>Melhor recorde</div>
                  </div>
                </div>
              </div>
            </div>
          </div>








          <div className="d-flex w-100 align-items-stretch min-vh-10" style={{ animationDelay: '0.2s' }}>




            <div className="card-padrao2 fadein text-center me-4 d-flex flex-column" style={{ flex: '0.6 1 0', minWidth: 0, maxHeight: 280, animationDelay: '0.25s', padding: '1rem', position: 'relative' }}>
              <div className="d-flex align-items-center " style={{ width: '100%' }}>
                <div className="d-flex align-items-center " style={{ width: '100%' }}>
                  <div className="card-title-padrao m-0">Tempo Total de Estudo</div>
                  <div className="flex-grow-1"></div>
                  <button
                    className="btn btn-sm btn-link p-0 text-secondary me-1"
                    onClick={handleLimparMigracaoHoras}
                    title="Limpar migração de horas"
                  >
                    <Trash size={14} />
                  </button>
                  <button className="btn btn-sm btn-link p-0 text-secondary" onClick={() => setShowModalMigracaoHoras(true)}>
                    <Upload size={14} />
                  </button>
                </div>
              </div>
              <div className="card-content d-flex flex-row justify-content-around align-items-center" style={{ flex: 1, gap: '1rem' }}>

                {/* Coluna Esquerda: Semanal + Mensal */}
                <div className="d-flex flex-column justify-content-center align-items-center" style={{ flex: 1, gap: '0.6rem' }}>
                  {/* Semanal */}
                  <div className="d-flex flex-column align-items-center text-center">
                    <div style={{ fontSize: '1.1em', color: 'var(--primary-primary)', fontWeight: 700 }}>
                      {(() => {
                        const hoje = new Date();
                        const dias = [];
                        for (let i = 0; i < 7; i++) {
                          const d = new Date(hoje);
                          d.setDate(hoje.getDate() - i);
                          dias.push(d.toDateString());
                        }
                        const estudos7dias = historicoEstudo.filter(e => dias.includes(new Date(e.dataSessao).toDateString()));
                        const totalMin = estudos7dias.reduce((acc, est) => acc + (est.tempo || 0), 0);
                        const horas = Math.floor(totalMin / 60);
                        const minutos = totalMin % 60;
                        return `${horas}h ${minutos}min`;
                      })()}
                    </div>
                    <div style={{ fontSize: '0.75em', color: 'var(--text-light)', fontWeight: 600 }}>Semanal</div>
                  </div>
                  <div style={{ width: '60%', borderTop: '1px solid rgba(255,255,255,0.1)' }}></div>
                  {/* Mensal */}
                  <div className="d-flex flex-column align-items-center text-center">
                    <div style={{ fontSize: '1.1em', color: 'var(--primary-primary)', fontWeight: 700 }}>
                      {(() => {
                        const hoje = new Date();
                        const dias = [];
                        for (let i = 0; i < 30; i++) {
                          const d = new Date(hoje);
                          d.setDate(hoje.getDate() - i);
                          dias.push(d.toDateString());
                        }
                        const estudos30dias = historicoEstudo.filter(e => dias.includes(new Date(e.dataSessao).toDateString()));
                        const totalMin = estudos30dias.reduce((acc, est) => acc + (est.tempo || 0), 0);
                        const horas = Math.floor(totalMin / 60);
                        const minutos = totalMin % 60;
                        return `${horas}h ${minutos}min`;
                      })()}
                    </div>
                    <div style={{ fontSize: '0.75em', color: 'var(--text-light)', fontWeight: 600 }}>Mensal</div>
                  </div>
                </div>

                {/* Divisor vertical */}
                <div style={{ width: '1px', background: 'rgba(255,255,255,0.1)', alignSelf: 'stretch' }}></div>

                {/* Coluna Direita: Total */}
                <div className="d-flex flex-column align-items-center justify-content-center text-center" style={{ flex: 1 }}>
                  <div style={{ fontSize: '2em', color: 'var(--primary-primary)', fontWeight: 700, marginBottom: '0.2rem' }}>
                    {(() => {
                      const totalMin = historicoEstudo.reduce((acc, est) => acc + (est.tempo || 0), 0);
                      const usuario = JSON.parse(localStorage.getItem('user'));
                      const projetoId = localStorage.getItem('projetoSelecionado');
                      const horasMigradas = parseInt(localStorage.getItem(`horasMigradas_${usuario?.id}_${projetoId}`)) || 0;
                      const totalComMigracao = totalMin + horasMigradas;
                      const horas = Math.floor(totalComMigracao / 60);
                      const minutos = totalComMigracao % 60;
                      return `${horas}h ${minutos}min`;
                    })()}
                  </div>
                  <div style={{ fontSize: '1em', color: 'var(--text-light)', fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase' }}>Total</div>
                </div>
              </div>

              {/* Info extra: dias de estudo + maior tempo diário */}
              <div className="d-flex flex-row justify-content-around align-items-center" style={{ gap: '0.5rem', borderTop: '1px solid rgba(255,255,255,0.08)', marginBottom: '0.5rem' }}>
                <div style={{ fontSize: '0.8em', color: 'var(--text-light)', textAlign: 'center' }}>
                  {(() => {
                    const totalMin = historicoEstudo.reduce((acc, est) => acc + (est.tempo || 0), 0);
                    const usuario = JSON.parse(localStorage.getItem('user'));
                    const projetoId = localStorage.getItem('projetoSelecionado');
                    const horasMigradas = parseInt(localStorage.getItem(`horasMigradas_${usuario?.id}_${projetoId}`)) || 0;
                    const totalComMigracao = totalMin + horasMigradas;
                    const dias = Math.floor(totalComMigracao / 1440);
                    return <><span style={{ color: 'var(--primary-primary)', fontWeight: 700 }}>{dias}</span> dias de estudo</>;
                  })()}
                </div>
                <div style={{ fontSize: '0.8em', color: 'var(--text-light)', textAlign: 'center' }}>
                  {(() => {
                    if (historicoEstudo.length === 0) return 'Sem registros';
                    const dias = {};
                    historicoEstudo.forEach(e => {
                      const key = new Date(e.dataSessao).toDateString();
                      dias[key] = (dias[key] || 0) + (e.tempo || 0);
                    });
                    const maiorDia = Object.entries(dias).sort((a, b) => b[1] - a[1])[0];
                    if (!maiorDia) return '';
                    const horas = Math.floor(maiorDia[1] / 60);
                    const minutos = Math.round(maiorDia[1] % 60);
                    return <>Melhor dia: <span className="badge bg-primary-primary4 text-primary-primary5" style={{ fontSize: '0.85em' }}>{horas}h {minutos}min</span></>;
                  })()}
                </div>
              </div>

            </div>





            <div className="card-padrao2 fadein me-4 text-center d-flex flex-column justify-content-center" style={{ flex: '1 1 0', minWidth: 0, height: '100%', animationDelay: '0.3s', padding: '1rem', position: 'relative' }}>

              <div className="d-flex align-items-center mb-3" style={{ width: '100%' }}>
                <div className="card-title-padrao m-0">Meta Semanal</div>
                <button className="btn btn-sm btn-link p-0 text-primary-primary" style={{ marginLeft: 'auto' }} onClick={() => {
                  setMetaSemanalHoras(Math.floor(metaSemanal));
                  setMetaSemanalMinutos(Math.round((metaSemanal % 1) * 60));
                  setInicioDaSemanaInput(inicioDaSemana);
                  setShowModalMeta(true);
                }}>
                  <Edit2 size={14} />
                </button>
              </div>
              <div className="card-content d-flex flex-column justify-content-center" style={{ flex: 1 }}>
                <div className="d-flex justify-content-center flex-column align-items-stretch gap-0">
                  {(() => {
                    const hoje = new Date();
                    const dias = [];
                    // Calcula o início da semana conforme preferência do usuário
                    const diaSemanaHoje = hoje.getDay(); // 0=Dom, 1=Seg...
                    const diff = (diaSemanaHoje - inicioDaSemana + 7) % 7;
                    const inicioSemana = new Date(hoje);
                    inicioSemana.setDate(hoje.getDate() - diff);
                    for (let i = 0; i < 7; i++) {
                      const d = new Date(inicioSemana);
                      d.setDate(inicioSemana.getDate() + i);
                      dias.push(d);
                    }
                    function formatDateForComparison(date) {
                      if (typeof date === 'string') {
                        return date.split('T')[0];
                      }
                      const d = new Date(date);
                      const y = d.getFullYear();
                      const m = String(d.getMonth() + 1).padStart(2, '0');
                      const day = String(d.getDate()).padStart(2, '0');
                      return `${y}-${m}-${day}`;
                    }
                    const diasSemana = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'];
                    const labels = dias.map(d => diasSemana[d.getDay()]);
                    const labelsCompletos = dias.map(d => `${diasSemana[d.getDay()]} ${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}`);
                    const valores = dias.map(d => {
                      const diaStr = formatDateForComparison(d);
                      const estudosHoje = historicoEstudo.filter(e => {
                        const estudoStr = formatDateForComparison(e.dataSessao);
                        return estudoStr === diaStr;
                      });
                      const totalMin = estudosHoje.reduce((acc, est) => acc + (est.tempo || 0), 0);
                      return +(totalMin / 60).toFixed(2);
                    });
                    if (historicoEstudo.length === 0) return (
                      <div style={{ width: '100%', height: 100, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-light)', gap: '0.4rem' }}>
                        <span style={{ fontSize: '0.8rem' }}>Nenhum estudo registrado ainda.</span>
                      </div>
                    );
                    return <div style={{ width: '100%', height: 100 }}>
                      <Bar
                        data={{
                          labels,
                          datasets: [{
                            label: 'Horas',
                            data: valores,
                            backgroundColor: '#71dd8c',
                            borderRadius: 6,
                          }]
                        }}
                        options={{
                          plugins: {
                            legend: { display: false },
                            tooltip: {
                              enabled: true,
                              backgroundColor: 'rgba(30,30,30,0.95)',
                              titleColor: '#fff',
                              bodyColor: '#71dd8c',
                              borderColor: 'rgba(255,255,255,0.12)',
                              borderWidth: 1,
                              padding: 8,
                              callbacks: {
                                title: function (context) {
                                  return labelsCompletos[context[0].dataIndex];
                                },
                                label: function (context) {
                                  const horas = Math.floor(context.parsed.y);
                                  const minutos = Math.round((context.parsed.y - horas) * 60);
                                  return `${horas}h ${minutos}min`;
                                }
                              }
                            }
                          },
                          interaction: { mode: 'index', intersect: false },
                          scales: {
                            x: { grid: { display: true, color: 'rgba(255,255,255,0.08)' }, ticks: { color: 'var(--text-light)', font: { size: 9 } } },
                            y: { grid: { display: false }, ticks: { color: 'var(--text-light)', font: { size: 9 }, stepSize: 1, precision: 0, callback: (v) => Number.isInteger(v) ? v : '' } }
                          },
                          responsive: true,
                          maintainAspectRatio: false,
                        }}
                        height={80}
                      />
                    </div>;
                  })()}
                </div>
              </div>
              <div className="card-content" style={{ paddingTop: 0 }}>
                {/* Barra de progresso semanal */}
                <div className="mt-2 mb-1 text-start">
                  <span className="fw-bold">Progresso:</span>
                  {(() => {
                    const hoje = new Date();
                    const diaSemanaHoje = hoje.getDay();
                    const diff = (diaSemanaHoje - inicioDaSemana + 7) % 7;
                    const inicioSemana = new Date(hoje);
                    inicioSemana.setDate(hoje.getDate() - diff);
                    inicioSemana.setHours(0, 0, 0, 0);
                    const fimSemana = new Date(inicioSemana);
                    fimSemana.setDate(inicioSemana.getDate() + 7);
                    const estudosSemana = historicoEstudo.filter(e => {
                      const d = new Date(e.dataSessao);
                      return d >= inicioSemana && d < fimSemana;
                    });
                    const totalMin = estudosSemana.reduce((acc, est) => acc + (est.tempo || 0), 0);
                    const totalHoras = totalMin / 60;
                    const progresso = Math.min((totalHoras / metaSemanal) * 100, 100);
                    return (
                      <div className="progress" style={{ height: '10px' }}>
                        <div
                          className="progress-bar"
                          role="progressbar"
                          style={{ width: `${progresso}%`, backgroundColor: '#71dd8c' }}
                          aria-valuenow={progresso}
                          aria-valuemin="0"
                          aria-valuemax="100"
                        />
                      </div>
                    );
                  })()}
                  <span className="ms-2">
                    {(() => {
                      const hoje = new Date();
                      const diaSemanaHoje = hoje.getDay();
                      const diff = (diaSemanaHoje - inicioDaSemana + 7) % 7;
                      const inicioSemana = new Date(hoje);
                      inicioSemana.setDate(hoje.getDate() - diff);
                      inicioSemana.setHours(0, 0, 0, 0);
                      const fimSemana = new Date(inicioSemana);
                      fimSemana.setDate(inicioSemana.getDate() + 7);
                      const estudosSemana = historicoEstudo.filter(e => {
                        const d = new Date(e.dataSessao);
                        return d >= inicioSemana && d < fimSemana;
                      });
                      const totalMin = estudosSemana.reduce((acc, est) => acc + (est.tempo || 0), 0);
                      const horasEstudadas = Math.floor(totalMin / 60);
                      const minutosEstudados = Math.round(totalMin % 60);
                      const metaMin = Math.round(metaSemanal * 60);
                      const metaHoras = Math.floor(metaMin / 60);
                      const metaMinutos = Math.round(metaMin % 60);
                      return `${horasEstudadas}h ${minutosEstudados}min / ${metaHoras}h ${metaMinutos}min`;
                    })()}
                  </span>
                </div>
                {/* Barra de progresso mensal */}

                {showModalMeta && (
                  <Modal show={showModalMeta} onHide={() => setShowModalMeta(false)} centered backdrop="static" className="modal-fundo">
                    <Modal.Body className="modal-estilo">
                      <div className="d-flex justify-content-between align-items-center mb-1">
                        <Modal.Title className="fw-bold fs-5 m-0">Meta Semanal</Modal.Title>
                      </div>
                      <p className="text-secondary mb-3" style={{ fontSize: '0.8em' }}>
                        Defina quantas horas você quer estudar por semana.
                      </p>
                      <div className="mb-3">
                        <label className="form-label fw-semibold" style={{ fontSize: '0.78em', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-light)' }}>Início da semana</label>
                        <div className="d-flex gap-2">
                          <button
                            type="button"
                            className={`btn btn-sm ${inicioDaSemanaInput === 1 ? 'btn-primary-primary' : 'btn-outline-primary-primary'}`}
                            onClick={() => setInicioDaSemanaInput(1)}
                          >Segunda-feira</button>
                          <button
                            type="button"
                            className={`btn btn-sm ${inicioDaSemanaInput === 0 ? 'btn-primary-primary' : 'btn-outline-primary-primary'}`}
                            onClick={() => setInicioDaSemanaInput(0)}
                          >Domingo</button>
                        </div>
                      </div>
                      <div className="d-flex gap-3 align-items-end mb-3">
                        <div>
                          <label className="form-label fw-semibold" style={{ fontSize: '0.78em', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-light)' }}>Horas</label>
                          <input
                            type="number"
                            min={0}
                            max={167}
                            value={metaSemanalHoras}
                            onChange={e => setMetaSemanalHoras(Math.max(0, Math.min(167, Number(e.target.value))))}
                            className="linha form-control"
                            style={{ width: 80, textAlign: 'center', fontFamily: 'monospace', fontSize: '1.1em' }}
                          />
                        </div>
                        <span className="pb-2 fw-bold" style={{ color: 'var(--text-light)' }}>:</span>
                        <div>
                          <label className="form-label fw-semibold" style={{ fontSize: '0.78em', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-light)' }}>Minutos</label>
                          <input
                            type="number"
                            min={0}
                            max={59}
                            value={metaSemanalMinutos}
                            onChange={e => setMetaSemanalMinutos(Math.max(0, Math.min(59, Number(e.target.value))))}
                            className="linha form-control"
                            style={{ width: 80, textAlign: 'center', fontFamily: 'monospace', fontSize: '1.1em' }}
                          />
                        </div>
                      </div>
                      <p className="text-secondary" style={{ fontSize: '0.75em' }}>Dica: comece com metas realistas e aumente gradualmente conforme sua rotina.</p>
                      <div className="d-flex justify-content-end gap-2 mt-3">
                        <button className="btn btn-outline-primary-primary3" onClick={() => {
                          setMetaSemanalHoras(Math.floor(metaSemanal));
                          setMetaSemanalMinutos(Math.round((metaSemanal % 1) * 60));
                          setInicioDaSemanaInput(inicioDaSemana);
                          setShowModalMeta(false);
                        }}>Cancelar</button>
                        <button className="btn btn-primary-primary3" onClick={handleSalvarMetaSemanal}>Salvar</button>
                      </div>
                    </Modal.Body>
                  </Modal>
                )}

                {/* Modal de Migração de Constância */}
                {showModalMigracao && (
                  <Modal show={showModalMigracao} onHide={() => setShowModalMigracao(false)} centered backdrop="static" className="modal-fundo">
                    <Modal.Body className="modal-estilo">
                      <div className="d-flex justify-content-between align-items-center mb-1">
                        <Modal.Title className="fw-bold fs-5 m-0">Migrar Constância</Modal.Title>
                      </div>
                      <p className="text-secondary mb-4" style={{ fontSize: '0.8em' }}>Importe sua sequência de dias consecutivos e seu recorde de outro aplicativo.</p>
                      <div className="d-flex gap-3 mb-3">
                        <div style={{ flex: 1 }}>
                          <label className="form-label fw-semibold" style={{ fontSize: '0.78em', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-light)' }}>Dias consecutivos</label>
                          <input
                            type="number"
                            min="0"
                            className="linha form-control"
                            value={diasParaMigrar}
                            onChange={e => setDiasParaMigrar(e.target.value)}
                            placeholder="Ex: 15"
                            style={{ fontSize: '1.1rem', textAlign: 'center' }}
                          />
                        </div>
                        <div style={{ flex: 1 }}>
                          <label className="form-label fw-semibold" style={{ fontSize: '0.78em', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-light)' }}>Melhor recorde</label>
                          <input
                            type="number"
                            min="0"
                            className="linha form-control"
                            value={recordeParaMigrar}
                            onChange={e => setRecordeParaMigrar(e.target.value)}
                            placeholder="Ex: 30"
                            style={{ fontSize: '1.1rem', textAlign: 'center' }}
                          />
                        </div>
                      </div>
                      <p className="text-secondary" style={{ fontSize: '0.75em' }}>O recorde deve ser ≥ dias consecutivos atuais.</p>
                      <div className="d-flex justify-content-end gap-2 mt-3">
                        <button className="btn btn-outline-primary-primary3" onClick={() => setShowModalMigracao(false)}>Cancelar</button>
                        <button className="btn btn-primary-primary3" onClick={handleMigrarConstancia}>Migrar</button>
                      </div>
                    </Modal.Body>
                  </Modal>
                )}

                {/* Modal de Migração de Horas */}
                {showModalMigracaoHoras && (
                  <Modal show={showModalMigracaoHoras} onHide={() => setShowModalMigracaoHoras(false)} centered backdrop="static" className="modal-fundo">
                    <Modal.Body className="modal-estilo">
                      <div className="d-flex justify-content-between align-items-center mb-1">
                        <Modal.Title className="fw-bold fs-5 m-0">Migrar Horas de Estudo</Modal.Title>
                      </div>
                      <p className="text-secondary mb-4" style={{ fontSize: '0.8em' }}>Importe suas horas acumuladas de outro aplicativo. Inserir 0h 0min reseta o contador.</p>
                      <div className="d-flex gap-3 align-items-end mb-3">
                        <div>
                          <label className="form-label fw-semibold" style={{ fontSize: '0.78em', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-light)' }}>Horas</label>
                          <input
                            type="number"
                            min="0"
                            className="linha form-control"
                            value={horasParaMigrar}
                            onChange={e => setHorasParaMigrar(e.target.value)}
                            placeholder="120"
                            style={{ width: 90, textAlign: 'center', fontFamily: 'monospace', fontSize: '1.1em' }}
                          />
                        </div>
                        <span className="pb-2 fw-bold" style={{ color: 'var(--text-light)' }}>h</span>
                        <div>
                          <label className="form-label fw-semibold" style={{ fontSize: '0.78em', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-light)' }}>Minutos</label>
                          <input
                            type="number"
                            min="0"
                            max="59"
                            className="linha form-control"
                            value={minutosParaMigrar}
                            onChange={e => setMinutosParaMigrar(e.target.value)}
                            placeholder="30"
                            style={{ width: 90, textAlign: 'center', fontFamily: 'monospace', fontSize: '1.1em' }}
                          />
                        </div>
                        <span className="pb-2 fw-bold" style={{ color: 'var(--text-light)' }}>min</span>
                      </div>
                      <div className="d-flex justify-content-end gap-2 mt-3">
                        <button className="btn btn-outline-primary-primary3" onClick={() => setShowModalMigracaoHoras(false)}>Cancelar</button>
                        <button className="btn btn-primary-primary3" onClick={handleMigrarHoras}>Migrar</button>
                      </div>
                    </Modal.Body>
                  </Modal>
                )}
              </div>


            </div>
            <div className='resumo-dia card-padrao2 fadein d-flex flex-column' style={{ flex: '1.1 1 0', minWidth: 0, height: '100%', animationDelay: '0.32s', padding: '1rem', position: 'relative', overflow: 'visible' }}>



              <div className="d-flex align-items-center mb-3" style={{ width: '100%' }}>
                <div className="card-title-padrao m-0">
                  Estudo {' '}
                  <button
                    className="btn btn-outline-primary-primary btn-sm"
                    style={{ padding: '0.25rem 0.7rem', fontSize: '0.85rem', fontWeight: 700, letterSpacing: 1, marginLeft: 4 }}
                    onClick={handleResumoPeriodoToggle}
                  >
                    {resumoLabels[resumoPeriodo]}
                  </button>
                </div>
              </div>
              <div className="card-content d-flex flex-column" style={{ paddingTop: 0, overflow: 'visible', flex: 1 }}>
                {(() => {
                  // Função para obter estudos do período
                  function getEstudosPeriodo() {
                    const hoje = new Date();
                    // Retorna todos os estudos para o período total
                    if (resumoPeriodo === 'total') {
                      return historicoEstudo;
                    }
                    // Gera set de strings YYYY-MM-DD para os dias do período
                    if (resumoPeriodo === 'semana' || resumoPeriodo === 'mes') {
                      const diasCount = resumoPeriodo === 'semana' ? 7 : 30;
                      const diasSet = new Set();
                      for (let i = 0; i < diasCount; i++) {
                        const d = new Date(hoje);
                        d.setHours(0, 0, 0, 0);
                        d.setDate(hoje.getDate() - i);
                        const y = d.getFullYear();
                        const m = String(d.getMonth() + 1).padStart(2, '0');
                        const day = String(d.getDate()).padStart(2, '0');
                        diasSet.add(`${y}-${m}-${day}`);
                      }
                      return historicoEstudo.filter(e => {
                        if (!e?.dataSessao) return false;
                        if (typeof e.dataSessao === 'string' && e.dataSessao.includes('T')) {
                          return diasSet.has(e.dataSessao.split('T')[0]);
                        }
                        const d = new Date(e.dataSessao);
                        const y = d.getFullYear();
                        const m = String(d.getMonth() + 1).padStart(2, '0');
                        const day = String(d.getDate()).padStart(2, '0');
                        return diasSet.has(`${y}-${m}-${day}`);
                      });
                    } else {
                      // Dia atual em YYYY-MM-DD
                      const y = hoje.getFullYear();
                      const m = String(hoje.getMonth() + 1).padStart(2, '0');
                      const day = String(hoje.getDate()).padStart(2, '0');
                      const hojeStr = `${y}-${m}-${day}`;
                      return historicoEstudo.filter(e => {
                        if (!e?.dataSessao) return false;
                        if (typeof e.dataSessao === 'string' && e.dataSessao.includes('T')) {
                          return e.dataSessao.split('T')[0] === hojeStr;
                        }
                        const d = new Date(e.dataSessao);
                        const yy = d.getFullYear();
                        const mm = String(d.getMonth() + 1).padStart(2, '0');
                        const dd = String(d.getDate()).padStart(2, '0');
                        return `${yy}-${mm}-${dd}` === hojeStr;
                      });
                    }
                  }
                  const estudosPeriodo = getEstudosPeriodo();
                  if (estudosPeriodo.length === 0) {
                    return <div className="text-secondary d-flex flex-column align-items-center justify-content-center gap-2 text-center" style={{ minHeight: 180 }}><span>Nenhum estudo registrado neste período.</span></div>;
                  }
                  const materias = {};
                  let totalMin = 0;
                  estudosPeriodo.forEach(e => {
                    const mat = e.disciplina || e.categoria || 'Outra';
                    materias[mat] = (materias[mat] || 0) + (e.tempo || 0);
                    totalMin += (e.tempo || 0);
                  });
                  const labels = Object.keys(materias);
                  const data = Object.values(materias);
                  const coresMateriasResumo = labels.map(nome => materiasCoresMap[nome] || '#1b59f9');
                  const horasPorMateria = data.map(min => `${Math.floor(min / 60)}h ${Math.round(min % 60)}min`);
                  const labelsComHoras = labels.map((nome, idx) => `${nome} `);
                  return <div className="d-flex flex-column" style={{ flex: 1 }}>
                    <div className="resumo-semana d-flex flex-row align-items-stretch w-100" style={{ flex: 1, overflow: 'visible' }}>
                      <div className="d-flex align-items-center justify-content-center" style={{ flex: 1, overflow: 'visible', position: 'relative' }}>
                        <div style={{ width: 140, height: 140, flexShrink: 0, overflow: 'visible', position: 'relative' }}>
                          <Pie
                            data={{
                              labels: labelsComHoras,
                              datasets: [
                                {
                                  data,
                                  backgroundColor: coresMateriasResumo,
                                  borderColor: '#fff',
                                  borderWidth: 2,
                                }
                              ]
                            }}
                            options={{
                              responsive: true,
                              maintainAspectRatio: false,
                              plugins: {
                                legend: { display: false },
                                tooltip: {
                                  backgroundColor: 'rgba(30,30,30,0.95)',
                                  titleColor: '#fff',
                                  bodyColor: '#ccc',
                                  borderColor: 'rgba(255,255,255,0.12)',
                                  borderWidth: 1,
                                  padding: 8,
                                  callbacks: {
                                    label: function (context) {
                                      const idx = context.dataIndex;
                                      const minutos = data[idx] || 0;
                                      const horas = Math.floor(minutos / 60);
                                      const min = Math.round(minutos % 60);
                                      return ` ${horas}h ${min}min`;
                                    }
                                  }
                                }
                              }
                            }}
                            width={140}
                            height={140}
                          />
                        </div>
                      </div>
                      <div className="d-flex flex-column align-items-start justify-content-center" style={{ overflow: 'visible', flex: 1, minWidth: 0 }}>
                        <ul className="list-unstyled mb-0" style={{ fontSize: '0.8em', marginTop: -10 }}>
                          {labels.map((nome, idx) => (
                            <li key={nome} style={{ color: 'var(--text-light, #ccc)', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '6px' }}>
                              <span style={{ display: 'inline-block', width: 12, height: 12, borderRadius: '4px', backgroundColor: coresMateriasResumo[idx], flexShrink: 0 }} title={nome}></span>
                              <span title={nome} style={{ whiteSpace: 'nowrap' }}>{nome.length > 35 ? nome.slice(0, 35) + '...' : nome}</span>
                              <span style={{ flex: 1, borderBottom: '1px dotted var(--text-light)', height: '1em', marginBottom: '2px' }}></span>
                              <span style={{ whiteSpace: 'nowrap' }}>{horasPorMateria[idx]}</span>
                            </li>
                          ))}
                        </ul>
                        <div className="mt-2 fw-bold text-primary-primary" style={{ textAlign: 'left' }}>Total: <span className="badge text-primary-primary5 bg-primary-primary4">{(() => {
                          const horas = Math.floor(totalMin / 60);
                          const minutos = Math.round(totalMin % 60);
                          return `${horas}h ${minutos}min`;
                        })()}</span></div>
                      </div>
                    </div>
                  </div>;
                })()}
              </div>
            </div>



          </div>

          {/* Seção: Radar tipos de estudo + Tabela tempo por matéria */}
          <div className="d-flex w-100 align-items-stretch gap-3 fadein" style={{ animationDelay: '0.4s' }}>

          {/* Gráfico teia - proporção por tipo de estudo */}
          <div className="card-padrao2" style={{ flex: '0 0 220px', padding: '0.75rem', position: 'relative', display: 'flex', flexDirection: 'column' }}>
            <div className="card-title-padrao">Tipos de Estudo</div>
            <div className="card-content d-flex align-items-center justify-content-center flex-column" style={{ flex: 1 }}>
              {(() => {
                const cats = { Teoria: 0, 'Revisão': 0, 'Questões': 0, Simulado: 0, Outros: 0 };
                historicoEstudo.forEach(e => {
                  const c = (e.categoria || '').toLowerCase();
                  if (c === 'teoria') cats.Teoria += (e.tempo || 0);
                  else if (c === 'revisao' || c === 'revisão') cats['Revisão'] += (e.tempo || 0);
                  else if (c === 'questoes' || c === 'questões') cats['Questões'] += (e.tempo || 0);
                  else if (c === 'simulado') cats.Simulado += (e.tempo || 0);
                  else cats.Outros += (e.tempo || 0);
                });
                const labels = Object.keys(cats);
                const data = Object.values(cats);
                const total = data.reduce((a, b) => a + b, 0);
                if (total === 0) return <div className="text-secondary small text-center">Sem dados ainda.</div>;
                return (
                  <>
                    <div style={{ width: '100%', maxWidth: 170, margin: '0 auto' }}>
                      <Radar
                        data={{
                          labels,
                          datasets: [{
                            label: 'Minutos',
                            data,
                            backgroundColor: 'rgba(27,89,249,0.15)',
                            borderColor: '#1b59f9',
                            borderWidth: 2,
                            pointBackgroundColor: '#1b59f9',
                            pointRadius: 4,
                            fill: true,
                          }]
                        }}
                        options={{
                          responsive: true,
                          maintainAspectRatio: true,
                          scales: {
                            r: {
                              ticks: { display: false, backdropColor: 'transparent' },
                              grid: { color: 'rgba(255,255,255,0.12)' },
                              angleLines: { color: 'rgba(255,255,255,0.12)' },
                              pointLabels: { color: 'var(--text-light)', font: { size: 10 } },
                            }
                          },
                          plugins: {
                            legend: { display: false },
                            tooltip: {
                              backgroundColor: 'rgba(30,30,30,0.95)',
                              titleColor: '#fff',
                              bodyColor: '#ccc',
                              borderColor: 'rgba(255,255,255,0.12)',
                              borderWidth: 1,
                              padding: 8,
                              callbacks: {
                                label: ctx => ` ${Math.floor(ctx.raw / 60)}h ${Math.round(ctx.raw % 60)}min`
                              }
                            }
                          }
                        }}
                      />
                    </div>
                    <div className="d-flex flex-wrap justify-content-center gap-2 mt-1">
                      {labels.map((l, i) => data[i] > 0 && (
                        <span key={l} style={{ fontSize: '0.68em', color: 'var(--text-light)' }}>
                          <span style={{ color: '#1b59f9', marginRight: 2 }}>●</span>
                          {l}: {Math.round(data[i] / total * 100)}%
                        </span>
                      ))}
                    </div>
                  </>
                );
              })()}
            </div>
          </div>

          {/* Tabela tempo por matéria */}
          <div className="card-padrao2" style={{ flex: 1, padding: '0.75rem', position: 'relative', display: 'flex', flexDirection: 'column' }}>
            <div className="card-title-padrao">Tempo por Matéria</div>
            <div className="card-content" style={{ paddingTop: 0, flex: 1 }}>
              {(() => {
                const hoje = new Date();
                const diaSemanaHoje = hoje.getDay();
                const diff = (diaSemanaHoje - inicioDaSemana + 7) % 7;
                const inicioSemana = new Date(hoje);
                inicioSemana.setDate(hoje.getDate() - diff);
                inicioSemana.setHours(0, 0, 0, 0);
                const fimSemana = new Date(inicioSemana);
                fimSemana.setDate(inicioSemana.getDate() + 7);
                const totalPorMateria = {};
                const semanaPorMateria = {};
                let totalSimulado = 0, semanaSimulado = 0;
                historicoEstudo.forEach(e => {
                  const isSimulado = (e.categoria || '').toLowerCase() === 'simulado';
                  const dataSessao = new Date(e.dataSessao);
                  const naSemana = dataSessao >= inicioSemana && dataSessao < fimSemana;
                  if (isSimulado) {
                    totalSimulado += (e.tempo || 0);
                    if (naSemana) semanaSimulado += (e.tempo || 0);
                  } else {
                    const mat = e.disciplina || e.categoria || 'Sem matéria';
                    totalPorMateria[mat] = (totalPorMateria[mat] || 0) + (e.tempo || 0);
                    if (naSemana) semanaPorMateria[mat] = (semanaPorMateria[mat] || 0) + (e.tempo || 0);
                  }
                });
                // Usa todasMateriasList para mostrar todas as matérias, mesmo sem estudo
                const allMats = todasMateriasList.length > 0
                  ? todasMateriasList
                  : Object.keys(totalPorMateria).sort((a, b) => totalPorMateria[b] - totalPorMateria[a]);
                const fmt = min => `${Math.floor(min / 60)}h ${Math.round(min % 60)}min`;
                if (allMats.length === 0) {
                  return <div className="text-secondary small text-center py-3">Nenhuma matéria no projeto.</div>;
                }
                return (
                  <div style={{ overflowY: 'auto', maxHeight: 160 }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82em' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid var(--border)' }}>
                          <th style={{ padding: '4px 8px', color: 'var(--text-light)', fontWeight: 600, textAlign: 'left' }}>Matéria</th>
                          <th style={{ padding: '4px 8px', color: 'var(--text-light)', fontWeight: 600, textAlign: 'right' }}>Esta semana</th>
                          <th style={{ padding: '4px 8px', color: 'var(--text-light)', fontWeight: 600, textAlign: 'right' }}>Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {allMats.map(mat => (
                          <tr key={mat} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                            <td style={{ padding: '5px 8px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                              <span style={{ width: 8, height: 8, borderRadius: '50%', background: materiasCoresMap[mat] || '#1b59f9', flexShrink: 0, display: 'inline-block' }} />
                              {mat}
                            </td>
                            <td style={{ padding: '5px 8px', textAlign: 'right', color: (semanaPorMateria[mat] || 0) > 0 ? 'var(--primary-primary)' : 'var(--text-light)' }}>{fmt(semanaPorMateria[mat] || 0)}</td>
                            <td style={{ padding: '5px 8px', textAlign: 'right', color: 'var(--text-secondary)', fontWeight: 600 }}>{fmt(totalPorMateria[mat] || 0)}</td>
                          </tr>
                        ))}
                        <tr style={{ borderTop: '1px solid var(--border)', background: 'rgba(255,149,0,0.06)' }}>
                          <td style={{ padding: '5px 8px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#FF9500', flexShrink: 0, display: 'inline-block' }} />
                            Simulados
                          </td>
                          <td style={{ padding: '5px 8px', textAlign: 'right', color: semanaSimulado > 0 ? 'var(--primary-primary)' : 'var(--text-light)' }}>{fmt(semanaSimulado)}</td>
                          <td style={{ padding: '5px 8px', textAlign: 'right', color: 'var(--text-secondary)', fontWeight: 600 }}>{fmt(totalSimulado)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                );
              })()}
            </div>
          </div>

          </div>

        </div>

        <div className="m-0 w-100 p-3 border fadein" style={{ borderRadius: 25, animationDelay: '0.3s', display: 'flex', flexDirection: 'column', gap: '1rem', position: 'relative' }}>
          <div className="card-title-padrao position-absolute px-3" style={{ top: '-12px', left: '20px', zIndex: 1, backgroundColor: 'var(--background)' }}>DESEMPENHO</div>

          {/* Removido resumo do progresso */}
          <div className='d-flex w-100 align-items-center min-vh-10' style={{ animationDelay: '0.35s', gap: '1.5rem' }}>






            <div className='evolucao card-padrao2 fadein text-center d-flex flex-column ' style={{ height: 200, flex: '0 0 calc(70% - 1rem)', width: 'calc(70% - 1rem)', minHeight: 160, animationDelay: '0.38s', padding: '1rem', position: 'relative' }}>
              <div className="card-title-padrao" >Evolução Geral em Simulados</div>
              <div className="card-content" style={{ paddingTop: 0, width: '100%' }}>
                <div style={{ width: '100%', height: '80%', margin: '0 auto', position: 'relative' }}>
                  {simuladosOrdenados.length === 0 ? (
                    <div style={{ width: '100%', height: 120, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-light)', gap: '0.4rem' }}>
                      <span style={{ fontSize: '0.8rem' }}>Nenhum simulado cadastrado ainda.</span>
                    </div>
                  ) : (
                  <Line
                    data={{
                      labels: simuladosOrdenados.length > 0 ? simuladosOrdenados.map(s => `Simulado #${s.numSim}`) : [''],
                      datasets: [
                        {
                          label: 'Acertos',
                          data: simuladosOrdenados.length > 0 ? simuladosOrdenados.map(s => {
                            const resumo = resumos[s.id];
                            return resumo ? (resumo.acertos ?? 0) : 0;
                          }) : [0],
                          borderColor: '#34C759',
                          backgroundColor: '#71dd8c22',
                          fill: false,
                          tension: 0.2,
                        },
                        {
                          label: 'Erros',
                          data: simuladosOrdenados.length > 0 ? simuladosOrdenados.map(s => {
                            const resumo = resumos[s.id];
                            return resumo ? (resumo.erros ?? 0) : 0;
                          }) : [0],
                          borderColor: '#FF2D55',
                          backgroundColor: '#83313e22',
                          fill: false,
                          tension: 0.2,
                        },
                        {
                          label: 'Brancos',
                          data: simuladosOrdenados.length > 0 ? simuladosOrdenados.map(s => {
                            const resumo = resumos[s.id];
                            return resumo ? (resumo.brancos ?? 0) : 0;
                          }) : [0],
                          borderColor: '#FF9500',
                          backgroundColor: '#FF950022',
                          fill: false,
                          tension: 0.2,
                        },
                        {
                          label: 'Líquido',
                          data: simuladosOrdenados.length > 0 ? simuladosOrdenados.map((s, idx) => {
                            const resumo = resumos[s.id];
                            return resumo ? (resumo.acertos ?? 0) - (resumo.erros ?? 0) : 0;
                          }) : [0],
                          borderColor: '#1b59f9',
                          backgroundColor: (context) => {
                            const chart = context.chart;
                            const { ctx, chartArea } = chart;
                            if (!chartArea) return 'rgba(27,89,249,0.1)';
                            const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
                            gradient.addColorStop(0, 'rgba(27,89,249,0.25)');
                            gradient.addColorStop(1, 'rgba(27,89,249,0.05)');
                            return gradient;
                          },
                          fill: true,
                          tension: 0.2,
                        },
                        {
                          label: 'Tendência Líquida',
                          data: (() => {
                            function calcularLinhaTendencia(yArray) {
                              const n = yArray.length;
                              if (n === 0) return [];
                              const xArray = Array.from({ length: n }, (_, i) => i + 1);
                              const xMean = xArray.reduce((a, b) => a + b, 0) / n;
                              const yMean = yArray.reduce((a, b) => a + b, 0) / n;
                              let num = 0, den = 0;
                              for (let i = 0; i < n; i++) {
                                num += (xArray[i] - xMean) * (yArray[i] - yMean);
                                den += (xArray[i] - xMean) ** 2;
                              }
                              const m = den === 0 ? 0 : num / den;
                              const b = yMean - m * xMean;
                              return xArray.map(x => m * x + b);
                            }
                            const liquidos = simuladosOrdenados.length > 0 ? simuladosOrdenados.map((s, idx) => {
                              const resumo = resumos[s.id];
                              return resumo ? (resumo.acertos ?? 0) - (resumo.erros ?? 0) : 0;
                            }) : [0];
                            return calcularLinhaTendencia(liquidos);
                          })(),
                          borderColor: '#ff9800',
                          backgroundColor: 'rgba(255,152,0,0.1)',
                          borderDash: [6, 6],
                          pointRadius: 0,
                          fill: false,
                          tension: 0,
                          order: 10
                        }
                      ]
                    }}
                    options={{
                      interaction: { mode: 'index', intersect: false },
                      scales: {
                        x: { grid: { display: false }, ticks: { color: 'var(--text-light)' } },
                        y: {
                          grid: { display: false },
                          ticks: {
                            color: 'var(--text-light)',
                            callback: function (value) {
                              return Number.isInteger(value) ? value : '';
                            },
                            stepSize: 1,
                            precision: 0
                          }
                        }
                      },
                      plugins: {
                        legend: { display: false },
                        tooltip: {
                          backgroundColor: 'rgba(30,30,30,0.95)',
                          titleColor: '#fff',
                          bodyColor: '#ccc',
                          borderColor: 'rgba(255,255,255,0.12)',
                          borderWidth: 1,
                          padding: 8,
                        }
                      },
                      responsive: true,
                      maintainAspectRatio: false,
                      animation: false,
                    }}
                    height={120}
                  />
                  )}
                </div>


              </div>

            </div>

            <div className="card-padrao2 fadein text-center d-flex flex-column" style={{ height: '100%', flex: '0 0 calc(30% - 1rem)', width: 'calc(30% - 1rem)', animationDelay: '0.15s', position: 'relative' }}>
              <div style={{ position: 'absolute', top: '10px', left: '50%', transform: 'translateX(-50%)' }}>
                <img src="/logo.png" alt="Flux" style={{ height: '22px', width: 'auto', opacity: 0.7 }} />
              </div>

              <div className="d-flex flex-column justify-content-center align-items-center h-100">
                <div className="mb-2" style={{ opacity: 0.9 }}>
                  <span className="text-primary-primary" style={{ fontSize: '0.95em', fontWeight: 500 }}>
                    Olá{nomeUsuario && <span>, {nomeUsuario}</span>}! 👋
                  </span>
                </div>
                <span className="fw-bold">
                  {fraseDoDia || ''}
                </span>
              </div>
            </div>



          </div>

          <div className="card-padrao2 fadein" style={{ animationDelay: '0.65s', padding: '1rem', position: 'relative' }}>
            <div className="card-title-padrao">Evolução Geral por Matéria em Simulados</div>
            <div className="card-content">
              <div className="row" style={{ margin: 0 }}>
                {(() => {
                  // Lista de todas as matérias
                  const todasMaterias = Array.from(new Set(simuladosOrdenados.flatMap(sim => (resumos[sim.id]?.materias ?? []).map(m => m.nome))));
                  if (todasMaterias.length === 0) return (
                    <div style={{ width: '100%', height: 120, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-light)', gap: '0.4rem' }}>
                      <span style={{ fontSize: '0.8rem' }}>Nenhum simulado cadastrado ainda.</span>
                    </div>
                  );
                  return todasMaterias.map(materiaNome => {
                    // Array de porcentagens líquidas por simulado para a matéria
                    const materiaPorcentagens = simuladosOrdenados.map(sim => {
                      const mat = (resumos[sim.id]?.materias ?? []).find(m => m.nome === materiaNome);
                      const totalMat = mat ? (mat.acertos + mat.erros + mat.brancos) : 0;
                      const liquido = mat ? (mat.acertos - mat.erros) : 0;
                      return totalMat > 0 ? ((liquido / totalMat) * 100) : null;
                    });
                    const tendenciaMateria = (() => {
                      const arr = materiaPorcentagens.map(v => v === null ? 0 : Number(v));
                      const n = arr.length;
                      if (n === 0) return [];
                      const xArray = Array.from({ length: n }, (_, i) => i + 1);
                      const xMean = xArray.reduce((a, b) => a + b, 0) / n;
                      const yMean = arr.reduce((a, b) => a + b, 0) / n;
                      let num = 0, den = 0;
                      for (let i = 0; i < n; i++) {
                        num += (xArray[i] - xMean) * (arr[i] - yMean);
                        den += (xArray[i] - xMean) ** 2;
                      }
                      const m = den === 0 ? 0 : num / den;
                      const b = yMean - m * xMean;
                      return xArray.map(x => m * x + b);
                    })();
                    // Labels: nomes dos simulados
                    const simLabels = simuladosOrdenados.map(sim => `Simulado #${sim.numSim}`);
                    const corMateria = materiasCoresMap[materiaNome] || '#0d6efd';
                    return (
                      <div className="col-12 col-sm-6 col-md-3 col-lg-2 mb-3" key={materiaNome}>
                        <div className="h-100" style={{ maxWidth: 180 }}>
                          <div className=" fw-bold text-center mb-2" style={{ fontSize: '0.95em' }}>{materiaNome.length > 25 ? materiaNome.slice(0, 25) + '...' : materiaNome}</div>
                          <Line
                            data={{
                              labels: simLabels,
                              datasets: [
                                {
                                  label: '% Líquido',
                                  data: materiaPorcentagens,
                                  borderColor: corMateria,
                                  backgroundColor: (context) => {
                                    const chart = context.chart;
                                    const { ctx, chartArea } = chart;
                                    if (!chartArea) return corMateria + '22';
                                    const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
                                    gradient.addColorStop(0, corMateria + '44');
                                    gradient.addColorStop(1, 'rgba(0,0,0,0)');
                                    return gradient;
                                  },
                                  fill: true,
                                  tension: 0.2,
                                },
                                {
                                  label: 'Tendência',
                                  data: tendenciaMateria,
                                  borderColor: '#ff9800',
                                  backgroundColor: 'rgba(255,152,0,0.1)',
                                  borderDash: [6, 6],
                                  pointRadius: 0,
                                  fill: false,
                                  tension: 0,
                                  order: 10
                                }
                              ]
                            }}
                            plugins={[{
                              beforeDatasetsDraw: (chart) => {
                                const ctx = chart.ctx;
                                const chartArea = chart.chartArea;
                                if (!chartArea) return;
                                const datasetIndex = chart.data.datasets.findIndex(ds => ds.label === '% Líquido');
                                if (datasetIndex === -1) return;
                                const meta = chart.getDatasetMeta(datasetIndex);
                                ctx.save();
                                const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
                                gradient.addColorStop(0, corMateria);
                                gradient.addColorStop(1, corMateria + '05');
                                ctx.globalAlpha = 0.5;
                                ctx.fillStyle = gradient;
                                ctx.beginPath();
                                meta.data.forEach((point, i) => {
                                  if (i === 0) ctx.moveTo(point.x, chartArea.bottom);
                                  ctx.lineTo(point.x, point.y);
                                });
                                meta.data.slice().reverse().forEach((point, i) => {
                                  ctx.lineTo(point.x, chartArea.bottom);
                                });
                                ctx.closePath();
                                ctx.fill();
                                ctx.restore();
                              }
                            }]}
                            options={{
                              interaction: { mode: 'index', intersect: false },
                              scales: {
                                x: {
                                  grid: { display: false },
                                  ticks: { color: '#bbb', display: false }
                                },
                                y: {
                                  beginAtZero: true,
                                  max: 100,
                                  title: { display: false },
                                  grid: {
                                    display: true,
                                    color: (context) => {
                                      if (context.tick.value === 0) {
                                        return '#dc3545'; // Vermelho para a linha do 0
                                      }
                                      return 'rgba(187, 187, 187, 0.1)'; // Cinza claro para outras linhas
                                    },
                                    lineWidth: (context) => {
                                      if (context.tick.value === 0) {
                                        return 2; // Linha mais grossa para o 0
                                      }
                                      return 1;
                                    }
                                  },
                                  ticks: { color: 'var(--text-light)' }
                                }
                              },
                              plugins: {
                                legend: { display: false },
                                tooltip: {
                                  backgroundColor: 'rgba(30,30,30,0.95)',
                                  titleColor: '#fff',
                                  bodyColor: '#ccc',
                                  borderColor: 'rgba(255,255,255,0.12)',
                                  borderWidth: 1,
                                  padding: 8,
                                  callbacks: {
                                    title: (tooltipItems) => {
                                      // Mostra o nome do simulado
                                      return simLabels[tooltipItems[0].dataIndex];
                                    }
                                  }
                                }
                              }
                            }}
                            height={60}
                            width={120}
                          />
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>
          </div>

        </div>

        <div className=" m-0 w-100 p-3 border fadein" style={{ borderRadius: 25, animationDelay: '0.7s', position: 'relative' }}>
          <div className="card-title-padrao position-absolute px-3" style={{ top: '-12px', left: '20px', zIndex: 1, backgroundColor: 'var(--background)' }}>HISTÓRICO</div>
          <div className="card-padrao2 fadein mb-3" style={{ animationDelay: '0.75s', padding: '1rem', position: 'relative' }}>
            <div className="card-title-padrao">Histórico de Estudo</div>
            <div className="card-content">
              <ul className="list-group rounded list-group-flush" style={{ maxHeight: 220, overflowY: 'auto' }}>
                {historicoEstudo.length === 0 ? (
                  <li className="list-group-item">Nenhum registro encontrado.</li>
                ) : (
                  [...historicoEstudo].reverse().map((estudo, idx) => (
                    <li key={estudo.id || idx} className=" list-group-item d-flex align-items-center justify-content-between">
                      <span>
                        {(() => {
                          const data = new Date(estudo.dataSessao);
                          const dia = data.getUTCDate().toString().padStart(2, '0');
                          const mes = (data.getUTCMonth() + 1).toString().padStart(2, '0');
                          const ano = data.getUTCFullYear();
                          return <strong>{`${dia}/${mes}/${ano}`}</strong>;
                        })()} - {estudo.disciplina || estudo.categoria || 'Disciplina'}
                        {estudo.categoria && <span> | <span style={{ color: 'var(--primary-primary)' }}>{estudo.categoria}</span></span>}
                        {estudo.editalItem && <span> | <span style={{ color: '#ffc107' }}>Edital: {estudo.editalItem}</span></span>}
                        {' '} - {estudo.tempo >= 60 ? `${Math.floor(estudo.tempo / 60)}h${estudo.tempo % 60 > 0 ? ` ${estudo.tempo % 60}min` : ''}` : `${estudo.tempo} min`}
                      </span>
                      <span className="d-flex gap-2">
                        <button className="btn-icon text-primary-primary" title="Editar" onClick={() => openFormWithEdit(estudo, fetchHistoricoEstudo)}>
                          <Edit2 size={14} />
                        </button>
                        <button className="btn-icon text-primary-primary" title="Apagar" onClick={() => handleApagarEstudo(estudo.id)}>
                          <Trash size={14} />
                        </button>
                      </span>
                    </li>
                  ))
                )}
              </ul>
            </div>
          </div>
          <div className="card-padrao2 fadein" style={{ maxHeight: 300, overflowY: 'auto', animationDelay: '0.8s', padding: '1rem', position: 'relative' }}>
            <div className="card-title-padrao">Histórico dos Últimos Simulados</div>
            <div className="card-content">
              <ul className="rounded list-group list-group-flush">
                {simuladosOrdenados.length === 0 ? (
                  <li className="list-group-item">Nenhum simulado encontrado.</li>
                ) : (
                  [...simuladosOrdenados].reverse().map(s => {
                    const resumo = resumos[s.id];
                    const notaLiquida = resumo ? (resumo.acertos ?? 0) - (resumo.erros ?? 0) : '--';
                    const data = formatarDataSegura(s.dataSim);
                    return (
                      <li key={s.id} className="list-group-item d-flex align-items-center justify-content-between">
                        <span>
                          <strong>Simulado #{s.numSim}</strong> - <span className="text-secondary">{data}</span>
                        </span>
                        <span className="badge bg-primary-primary4 text-dark">{notaLiquida} pts</span>
                      </li>
                    );
                  })
                )}
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Home;
import { Link, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import api from '../../../services/api';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPiedPiperHat } from '@fortawesome/free-brands-svg-icons';
import { faLocust,faOtter,faSyncAlt, faChartSimple, faQuestion,faGear, faGraduationCap, faBook, faClipboardList, faCog, faExclamationTriangle, faHome, faMap, faBookOpen, faLightbulb, faSmile, faBullseye, faHeartbeat, faRocket, faStar, faChartLine, faUser, faPenToSquare, faBars, faChevronDown, faChevronUp, faCircle, faBalanceScale, faCopy, faTimes } from '@fortawesome/free-solid-svg-icons';
import { Modal, Button } from 'react-bootstrap';
import { motion, AnimatePresence } from 'framer-motion';
import StudyTimer from '../../../components/StudyTimer';
import { useNavigate } from 'react-router-dom';

const ICONES_CATEGORIA = [
  { value: 'faLightbulb', label: 'Dica', icon: faLightbulb },
  { value: 'faBookOpen', label: 'Sugestão', icon: faBookOpen },
  { value: 'faSmile', label: 'Motivacional', icon: faSmile },
  { value: 'faBullseye', label: 'Organização', icon: faBullseye },
  { value: 'faHeartbeat', label: 'Saúde', icon: faHeartbeat },
  { value: 'faRocket', label: 'Produtividade', icon: faRocket },
  { value: 'faExclamationTriangle', label: 'Aviso', icon: faExclamationTriangle },
  { value: 'faStar', label: 'Meta/Desafio', icon: faStar },
  { value: 'faQuestion', label: 'Curiosidade', icon: faQuestion },
];

const Sidebar = ({ collapsed, setCollapsed, transition = false }) => {
  // Expande sidebar automaticamente se sinalizado ao entrar na página
  useEffect(() => {
    if (localStorage.getItem('sidebarExpandNext') === '1') {
      setCollapsed(false);
      localStorage.removeItem('sidebarExpandNext');
    }
  }, [setCollapsed]);
  // Removido auto expand/recolher da sidebar ao atualizar a página
  // Estado para animação de giro da otter
  const [otterSpin, setOtterSpin] = useState(false);
  const [otterSpinDirection, setOtterSpinDirection] = useState(''); // 'left' ou 'right'
  // Gira a otter ao abrir/recolher sidebar, para lados diferentes
  useEffect(() => {
    if (collapsed) {
      setOtterSpinDirection('left'); // Fechando: gira para a esquerda
    } else {
      setOtterSpinDirection('right'); // Abrindo: gira para a direita
    }
    setOtterSpin(true);
    const timer = setTimeout(() => setOtterSpin(false), 800);
    return () => clearTimeout(timer);
  }, [collapsed]);
  const location = useLocation();
  const navigate = useNavigate();

  // Mostrar/ocultar card de dicas (fechar)
  const [showDicaCard, setShowDicaCard] = useState(true);

  // Estados para controlar dropdowns - iniciam expandidos
  const [simuladosExpanded, setSimuladosExpanded] = useState(true);
  const [questoesExpanded, setQuestoesExpanded] = useState(true);

  // "Pinned" indica que o dropdown foi fixado por clique (permanece aberto mesmo ao tirar o mouse)
  const [simuladosPinned, setSimuladosPinned] = useState(false);
  const [questoesPinned, setQuestoesPinned] = useState(false);

  // Auto-expandir / fixar dropdowns se a rota atual pertencer ao grupo;
  // caso contrário, fechar e desfixar.
  useEffect(() => {
    const p = location.pathname;
    const isSimRoute = p.startsWith('/simulados') || p.startsWith('/dashboard');
    const isQuestRoute = p.startsWith('/questoes') || p.startsWith('/dashboard-questoes');

    setSimuladosPinned(isSimRoute);
    setQuestoesPinned(isQuestRoute);

    // manter expanded true se estiver pinned (rota do grupo) — se não, fecha
    setSimuladosExpanded(isSimRoute);
    setQuestoesExpanded(isQuestRoute);
  }, [location.pathname]);

  // Handlers para clique (fixa/desfixa) e hover (abre temporariamente)
  function handleSimuladosClick() {
    setSimuladosPinned(prev => {
      const next = !prev;
      setSimuladosExpanded(next);
      return next;
    });
  }
  function handleQuestoesClick() {
    setQuestoesPinned(prev => {
      const next = !prev;
      setQuestoesExpanded(next);
      return next;
    });
  }

  // Persistência do estado collapsed
  useEffect(() => {
    localStorage.setItem('sidebarCollapsed', collapsed ? '1' : '0');
  }, [collapsed]);
  // Recupera dados do usuário logado
  const [usuario, setUsuario] = useState(() => JSON.parse(localStorage.getItem('user')));
  const nomeUsuario = usuario?.nome || usuario?.email || 'Usuário';
  const isAdmin = usuario?.role?.toLowerCase() === 'admin';

  useEffect(() => {
    function atualizarUsuario() {
      setUsuario(JSON.parse(localStorage.getItem('user')));
    }
    window.addEventListener('storage', atualizarUsuario);
    return () => window.removeEventListener('storage', atualizarUsuario);
  }, []);
  // Estado para dicas do banco
  const [dicasSidebar, setDicasSidebar] = useState([]);
  const [dicaIndex, setDicaIndex] = useState(0);

  // Buscar dicas do banco ao montar
  useEffect(() => {
    api.get('/dicas-sidebar').then(res => {
      setDicasSidebar(res.data || []);
    });
  }, []);

  // Seleciona dica do dia (baseada na data)
  useEffect(() => {
    if (dicasSidebar.length > 0) {
      const today = new Date();
      const idx = today.getDate() % dicasSidebar.length;
      setDicaIndex(idx);
    }
  }, [dicasSidebar]);

  // Função para navegar entre dicas
  function handlePrevDica() {
    setDicaIndex(i => (i - 1 + dicasSidebar.length) % dicasSidebar.length);
  }
  function handleNextDica() {
    setDicaIndex(i => (i + 1) % dicasSidebar.length);
  }


  // Renderizar dica do dia
  let dica = dicasSidebar[dicaIndex];
  let dicaCor1 = dica?.categoria?.cor1 || dica?.cor1 || '#ff7e5f';
  let dicaCor2 = dica?.categoria?.cor2 || dica?.cor2 || '#feb47b';
  let iconName = dica?.categoria?.icon || dica?.icon || 'faBookOpen';
  let textoDica = dica?.texto || 'Organize seu estudo por ciclos e acompanhe seu progresso!';
  let dicaCategoriaNome = dica?.categoria?.nome || dica?.categoriaNome || 'Dica do Dia';

  // Estado de projetos precisa vir antes do uso
  const [projetos, setProjetos] = useState([]);
  const [projetoNome, setProjetoNome] = useState(() => localStorage.getItem('projetoSelecionadoNome') || '');

  // Verifica se há projeto criado
  const temProjeto = Array.isArray(projetos) && projetos.filter(p => p && p.id).length > 0;

  // Mapeamento de ícones
  const ICONES_MAP = {
    faLightbulb,
    faBookOpen,
    faSmile,
    faBullseye,
    faHeartbeat,
    faRocket,
    faExclamationTriangle,
    faStar,
    faChartLine,
    faBookOpen,
    faQuestion,
  };
  let dicaIcon = ICONES_MAP[iconName] || faBookOpen;

  useEffect(() => {
    function fetchProjetosSidebar() {
      const userId = JSON.parse(localStorage.getItem('user'))?.id || '';
      api.get('/projetos', { params: { userId } })
        .then(res => {
          setProjetos(res.data);
          window.projetosSidebar = res.data;
          const projetoSelecionadoId = localStorage.getItem('projetoSelecionado');
          if (projetoSelecionadoId) {
            const projeto = res.data.find(p => p.id === projetoSelecionadoId);
            if (projeto) {
              localStorage.setItem('projetoSelecionadoNome', projeto.nome);
              setProjetoNome(projeto.nome);
            } else {
              // Projeto selecionado não existe mais
              localStorage.removeItem('projetoSelecionado');
              localStorage.removeItem('projetoSelecionadoNome');
              setProjetoNome('');
            }
          } else if (res.data.length > 0) {
            // Seleciona automaticamente o primeiro projeto se houver projetos
            localStorage.setItem('projetoSelecionado', res.data[0].id);
            localStorage.setItem('projetoSelecionadoNome', res.data[0].nome);
            setProjetoNome(res.data[0].nome);
          } else {
            // Nenhum projeto selecionado e nenhum projeto existente
            setProjetoNome('');
          }
        })
        .catch(() => setProjetos([]));
    }
    fetchProjetosSidebar();
    window.addEventListener('projetosAtualizados', fetchProjetosSidebar);
    window.addEventListener('projetosSidebarAtualizar', fetchProjetosSidebar);
    return () => {
      window.removeEventListener('projetosAtualizados', fetchProjetosSidebar);
      window.removeEventListener('projetosSidebarAtualizar', fetchProjetosSidebar);
    };
  }, []);

  useEffect(() => {
    function atualizarProjetoNome() {
      setProjetoNome(localStorage.getItem('projetoSelecionadoNome') || '');
    }
    window.addEventListener('storage', atualizarProjetoNome);
    window.addEventListener('projetoNomeAtualizado', atualizarProjetoNome);
    return () => {
      window.removeEventListener('storage', atualizarProjetoNome);
      window.removeEventListener('projetoNomeAtualizado', atualizarProjetoNome);
    };
  }, []);

  // Recupera nome do usuário logado
  // (Removido duplicidade: já declarado no topo)

  function handleLogout() {
    localStorage.removeItem('user');
    localStorage.removeItem('projetoSelecionado');
    localStorage.removeItem('projetoSelecionadoNome');
    window.location.href = '/login';
  }

  // Estado para inserir categoria e dica
  const [categoriaNome, setCategoriaNome] = useState('');
  const [cor1, setCor1] = useState('#71dd8c');
  const [cor2, setCor2] = useState('#b7d9ff');
  const [categoriaIcon, setCategoriaIcon] = useState('faLightbulb');
  const [dicasTexto, setDicasTexto] = useState('');
  const [categoriaId, setCategoriaId] = useState('');
  const [categorias, setCategorias] = useState([]);

  useEffect(() => {
    api.get('/categorias-dica-sidebar').then(res => setCategorias(res.data || []));
  }, []);

  // Inserir categoria
  async function handleInserirCategoria() {
    if (!categoriaNome || !cor1 || !cor2 || !categoriaIcon) return;
    const res = await api.post('/categorias-dica-sidebar', {
      nome: categoriaNome,
      cor1,
      cor2,
      icon: categoriaIcon
    });
    setCategorias([...categorias, res.data]);
    setCategoriaNome('');
    setCor1('#71dd8c');
    setCor2('#b7d9ff');
    setCategoriaIcon('faLightbulb');
    alert('Categoria inserida!');
  }

  // Inserir dica
  async function handleInserirDica() {
    if (!dicasTexto || !categoriaId) return;
    const dicasArray = dicasTexto.split('\n').map(t => t.trim()).filter(t => t);
    if (dicasArray.length === 0) return;
    await api.post('/dicas-sidebar', {
      dicas: dicasArray.map(texto => ({ texto, categoriaId }))
    });
    setDicasTexto('');
    setCategoriaId('');
    alert('Dicas inseridas!');
  }

  // Estado para modal de inserção
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      {/* Barra fixa para sanduíche, ícone e título usando Bootstrap */}
      <div
        className="mt-2 position-fixed top-0 start-0 d-flex align-items-center px-3 justify-content-start"
        style={{ minHeight: '64px', zIndex: 110 }}
      >
        <button
          className="btn rounded-circle d-flex align-items-center justify-content-center me-2 border-0"
          onClick={() => setCollapsed(c => !c)}
          aria-label={collapsed ? 'Expandir sidebar' : 'Recolher sidebar'}
        >
          <FontAwesomeIcon 
            icon={faBars} 
            size="lg" 
            className={`bars-anim`} 
            style={{ 
              color: collapsed 
                ? '#000' 
                : '#000', // mesma cor da otter aberta
              transition: 'color 0.3s cubic-bezier(.77,0,.18,1)'
            }} 
          />
        </button>
        <a href="/" className="d-flex align-items-center gap-2 text-decoration-none">
          <span
            style={{ cursor: 'pointer', display: 'inline-flex' }}
          >
            <img 
              src="/logo.png" 
              alt="FLUX"
              style={{ width: '72px', height: 'auto', transition: 'opacity 0.3s cubic-bezier(.77,0,.18,1)', opacity: collapsed ? 0.6 : 1 }}
              title="Flux - Organize seu estudo, alcance seus objetivos!" 
            />
          </span>
        </a>
      </div>
      <aside
        className={`menu-lateral${collapsed ? ' collapsed' : ''}`}
        style={{
          position: 'relative',
          left: 0,
          top: 0,
          height: '100vh',
          width: 280,
          minWidth: 250,
          overflow: 'hidden',
          transition: 'transform 0.4s cubic-bezier(.77,0,.18,1)',
          zIndex: 100,
          transform: collapsed ? 'translateX(-100%)' : 'translateX(0)',
        }}
      >
        <div className="logo d-flex align-items-center w-100" style={{ minHeight: 50, position: 'relative', gap: 12 }}>
          {/* Linha flex: sanduíche, ícone, título - removido pois agora está na barra fixa */}
        </div>
        <div
          className='menu-navigation'
          onClick={() => {
            // Fecha imediatamente dropdowns; o useEffect abaixo reabrirá se a rota pertencer ao dropdown
            setSimuladosPinned(false);
            setQuestoesPinned(false);
            setSimuladosExpanded(false);
            setQuestoesExpanded(false);
          }}
        >
          {/* Botões principais */}
          <Link to="/" className={`menu-item ${location.pathname === '/' ? 'active' : ''}`}>
            <FontAwesomeIcon icon={faHome} />
            <span>Home</span>
          </Link>

          <Link to="/projeto" className={`menu-item ${location.pathname === '/projeto' ? 'active' : ''}`}>
            <FontAwesomeIcon icon={faGraduationCap} />
            <span>Projeto</span>
            {(Array.isArray(projetos) && projetos.filter(p => p && p.id).length === 0) ? (
              <span className="badge rounded bg-danger">Insira</span>
            ) : (!localStorage.getItem('projetoSelecionado') || !projetoNome) ? (
              <span className="badge rounded bg-warning text-dark">Selecione</span>
            ) : (
              <span className="badge rounded bg-primary-primary text-dark">{projetoNome}</span>
            )}
          </Link>

          <Link to="/edital" className={`menu-item ${location.pathname === '/edital' ? 'active' : ''}`}>
            <FontAwesomeIcon icon={faBook} />
            <span>Edital</span>
          </Link>

          <Link to="/ciclo" className={`menu-item ${location.pathname === '/ciclo' ? 'active' : ''}`}>
            <FontAwesomeIcon icon={faSyncAlt} />
            <span>Ciclo</span>
          </Link>

          {/* Dropdown Simulados */}
          <div 
            className="dropdown-section"
            onMouseEnter={() => setSimuladosExpanded(true)}
            onMouseLeave={() => setSimuladosExpanded(simuladosPinned)}
          >
            <div 
              className={`dropdown-header d-flex align-items-center gap-2 ${simuladosExpanded ? 'expanded' : ''}`}
              onClick={handleSimuladosClick}
            >
               <FontAwesomeIcon icon={faClipboardList} />
               <span >Simulados</span>
               <FontAwesomeIcon 
                 icon={faChevronDown} 
                 className="dropdown-arrow"
               />
             </div>

            <AnimatePresence>
               {simuladosExpanded && (
                 <motion.div
                   initial={{ height: 0, opacity: 0 }}
                   animate={{ height: 'auto', opacity: 1 }}
                   exit={{ height: 0, opacity: 0 }}
                   transition={{ duration: 0.3, ease: "easeInOut" }}
                   className="dropdown-content"
                 >
                   {/* Linha separadora removida conforme solicitado */}
                   <Link to="/simulados" className={`menu-item submenu-item ${location.pathname === '/simulados' ? 'active' : ''}`}>
                     <FontAwesomeIcon icon={faClipboardList} />
                     <span className='small'>Meus simulados</span>
                   </Link>
                   <Link to="/dashboard" className={`menu-item submenu-item ${location.pathname.startsWith('/dashboard') ? 'active' : ''}`}>
                     <FontAwesomeIcon icon={faChartSimple} />
                     <span className='small'>Dashboard</span>
                   </Link>
                 </motion.div>
               )}
             </AnimatePresence>
          </div>

          {/* Dropdown Questões */}
          <div 
            className="dropdown-section"
            onMouseEnter={() => setQuestoesExpanded(true)}
            onMouseLeave={() => setQuestoesExpanded(questoesPinned)}
          >
            <div 
              className={`dropdown-header d-flex align-items-center gap-2 ${questoesExpanded ? 'expanded' : ''}`}
              onClick={handleQuestoesClick}
            >
               <FontAwesomeIcon icon={faQuestion} />
               <span>Questões</span>
               <FontAwesomeIcon 
                 icon={faChevronDown} 
                 className="dropdown-arrow"
               />
             </div>
            <AnimatePresence>
               {questoesExpanded && (
                 <motion.div
                   initial={{ height: 0, opacity: 0 }}
                   animate={{ height: 'auto', opacity: 1 }}
                   exit={{ height: 0, opacity: 0 }}
                   transition={{ duration: 0.3, ease: "easeInOut" }}
                   className="dropdown-content"
                 >
                   <Link to="/questoes" className={`menu-item submenu-item ${location.pathname === '/questoes' ? 'active' : ''}`}>
                     <FontAwesomeIcon icon={faQuestion} />
                     <span className='small'>Minhas questões</span>
                   </Link>
                   <Link to="/dashboard-questoes" className={`menu-item submenu-item ${location.pathname === '/dashboard-questoes' ? 'active' : ''}`}>
                     <FontAwesomeIcon icon={faChartSimple} />
                     <span className='small'>Dashboard</span>
                   </Link>
                 </motion.div>
               )}
             </AnimatePresence>
          </div>

          {/* Link para "Reportar erro" removido */}
        </div>
      {/* Seção Admin separada no final */}
      {isAdmin && (
        <div className="admin-section">
          <span className="admin-title">Admin</span>
          <Link to="/usuarios" className={`menu-item ${location.pathname === '/usuarios' ? 'active' : ''}`}>
            <FontAwesomeIcon icon={faUser} />
            <span>Usuários</span>
          </Link>
          <Link to="/inserir" className={`menu-item ${location.pathname === '/inserir' ? 'active' : ''}`}>
            <FontAwesomeIcon icon={faPenToSquare} />
            <span>Inserir</span>
          </Link>
        </div>
      )}

      {/* Wrapper com layout para animar suavemente a mudança de posição entre card de dicas e cronômetro */}
      <motion.div
        layout
        transition={{ layout: { duration: 0.36, ease: [0.4, 0, 0.2, 1] } }}
        style={{ display: 'grid'}}
      >
        {/* Mensagem de dica do dia dinâmica só aparece se houver projeto, com animação de collapse */}
        <AnimatePresence>
          {temProjeto && showDicaCard && (
            <motion.div
              className="sidebar-messages"
              layout
              initial={{ opacity: 0, height: 0, marginTop: 0, paddingTop: 0, paddingBottom: 0 }}
              animate={{ opacity: 1, height: 'auto', marginTop: '1rem', paddingTop: '1rem', paddingBottom: '1rem' }}
              exit={{ opacity: 0, height: 0, marginTop: 0, paddingTop: 0, paddingBottom: 0 }}
              transition={{
                duration: 0.36,
                ease: [0.4, 0, 0.2, 1],
                layout: { duration: 0.36, ease: [0.4, 0, 0.2, 1] }
              }}
              style={{
                position: 'relative',
                background: `linear-gradient(90deg, ${dicaCor1} 0%, ${dicaCor2} 100%)`,
                borderRadius: '1em',
                padding: '1em',
                color: 'var(--text-dark)',
                display: 'flex',
                alignItems: 'center',
                fontSize: '0.85em',
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                overflow: 'hidden' // importante para o collapse visual
              }}
            >
              {/* Botão de fechar alinhado ao topo-direita */}
              <button
                aria-label="Fechar dica"
                onClick={() => setShowDicaCard(false)}
                style={{
                  position: 'absolute',
                  top: 8,
                  right: 10,
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-light)',
                  cursor: 'pointer',
                  padding: 4,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>

              <FontAwesomeIcon icon={dicaIcon} size="lg" style={{ opacity: 0.8, marginRight: '0.7em' }} />
              <div className='text-dark'>
                <div style={{ fontWeight: 600 }}>{dicaCategoriaNome}</div>
                <div style={{ fontSize: '0.9em', opacity: 0.85 }}>
                  {textoDica}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Cronômetro de estudo com layout ativado para subir suavemente ao collapse do card de dicas */}
        <AnimatePresence mode="wait">
          {temProjeto && <StudyTimer />}
        </AnimatePresence>
      </motion.div>

      {/* Botões de navegação entre dicas ocultos */}
      {/* (Removido conforme solicitado) */}

      {/* Botão para abrir modal de inserção oculto */}
      {/* (Removido conforme solicitado) */}

      {/* Modal para inserir categoria e dicas */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Inserir Categoria e Dicas</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="mb-2 fw-bold">Inserir Categoria de Dica</div>
          <input
            type="text"
            className="form-control mb-1"
            placeholder="Nome da categoria"
            value={categoriaNome}
            onChange={e => setCategoriaNome(e.target.value)}
          />
          <div className="d-flex gap-2 mb-1">
            <input
              type="color"
              value={cor1}
              onChange={e => setCor1(e.target.value)}
              title="Cor inicial"
              style={{ width: 40, height: 32, border: 'none', background: 'none' }}
            />
            <input
              type="color"
              value={cor2}
              onChange={e => setCor2(e.target.value)}
              title="Cor final"
              style={{ width: 40, height: 32, border: 'none', background: 'none' }}
            />
          </div>
          <div className="mb-2">
            <label className="small mb-1">Ícone da categoria:</label>
            <select
              className="form-select mb-1"
              value={categoriaIcon}
              onChange={e => setCategoriaIcon(e.target.value)}
            >
              {ICONES_CATEGORIA.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <div className="d-flex gap-2 mt-1">
              {ICONES_CATEGORIA.map(opt => (
                <span key={opt.value} style={{ cursor: 'pointer', border: categoriaIcon === opt.value ? '2px solid #71dd8c' : '2px solid transparent', borderRadius: 8, padding: 2 }}
                  onClick={() => setCategoriaIcon(opt.value)}>
                  <FontAwesomeIcon icon={opt.icon} size="lg" />
                </span>
              ))}
            </div>
          </div>
          <Button className="btn btn-primary-primary btn-sm w-100 mb-2" onClick={handleInserirCategoria}>
            Inserir Categoria
          </Button>
          <hr className="my-2" />
          <div className="mb-2 fw-bold">Inserir Dicas</div>
          <select
            className="form-select mb-1"
            value={categoriaId}
            onChange={e => setCategoriaId(e.target.value)}
          >
            <option value="">Selecione a categoria</option>
            {categorias.map(cat => (
              <option key={cat.id} value={cat.id}>
                {cat.nome}
              </option>
            ))}
          </select>
          <textarea
            className="form-control mb-1"
            placeholder="Digite uma dica por linha"
            value={dicasTexto}
            onChange={e => setDicasTexto(e.target.value)}
            rows={4}
          />
          <Button className="btn btn-primary-primary btn-sm w-100" onClick={handleInserirDica}>
            Inserir Dicas
          </Button>
        </Modal.Body>
      </Modal>
    </aside>
    {/* ...existing code... */}
    </>
  );
};

export default Sidebar;
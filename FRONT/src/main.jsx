import { StrictMode, lazy, Suspense, useState, useEffect } from 'react';
import { StudyTimerProvider } from './components/StudyTimerContext';
import { createRoot } from 'react-dom/client';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import './index.css';
import './style2.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'sweetalert2/dist/sweetalert2.min.css';
import 'react-toastify/dist/ReactToastify.css';
import { AuthProvider, useAuth } from './auth.jsx';
import { PageTitleProvider } from './components/PageTitleContext';
import { ToastContainer } from 'react-toastify';
// Componentes do layout global (sempre carregados)
import Sidebar from './pages/Home/components/sidebar.jsx';
import Navbar from './components/Navbar.jsx';
import StudySessionForm from './components/StudySessionForm';
import Perfil from './pages/Home/Perfil.jsx';

// Páginas carregadas sob demanda (code splitting)
const Home = lazy(() => import('./pages/Home'));
const Login = lazy(() => import('./pages/Home/Login.jsx'));
const Cadastro = lazy(() => import('./pages/Home/Cadastro.jsx'));
const Inserir = lazy(() => import('./pages/Home/inserir.jsx'));
const Usuarios = lazy(() => import('./pages/Home/Usuarios.jsx'));
const Projeto = lazy(() => import('./pages/Home/Projeto'));
const Simulados = lazy(() => import('./pages/Home/simulados'));
const Dashboard = lazy(() => import('./pages/Home/dashboard'));
const Selecao = lazy(() => import('./pages/Home/selecao'));
const EditalWithBoundary = lazy(() => import('./pages/Home/edital'));
const MateriaDetalhe = lazy(() => import('./pages/Home/MateriaDetalhe.jsx'));
const MateriaOverview = lazy(() => import('./pages/Home/MateriaOverview.jsx'));
const Ciclo = lazy(() => import('./pages/Home/Ciclo'));
const FilaRevisao = lazy(() => import('./pages/Home/FilaRevisao'));
const Questoes = lazy(() => import('./pages/Home/questoes'));

const PageLoader = () => (
  <div className="d-flex justify-content-center align-items-center" style={{ flex: 1, minHeight: '40vh' }}>
    <div className="spinner-border text-secondary" role="status" style={{ width: '2rem', height: '2rem' }}>
      <span className="visually-hidden">Carregando...</span>
    </div>
  </div>
);

function PrivateRoute({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" />;
}

function AdminRoute({ children }) {
  const { user } = useAuth();
  return user && user.role === 'admin' ? children : <Navigate to="/" />;
}

function getSidebarCollapsed() {
  const val = localStorage.getItem('sidebarCollapsed');
  if (val === null) return true;
  return val === '1';
}

function AppLayout() {
  const location = useLocation();
  const { user } = useAuth();
  const isAuthPage = location.pathname === '/login' || location.pathname === '/cadastro';

  useEffect(() => {
    document.body.classList.add('light-theme');
  }, []);

  const [sidebarCollapsed, setSidebarCollapsed] = useState(getSidebarCollapsed);
  const sidebarWidth = 300;

  useEffect(() => {
    function handleExpandSidebar() {
      setTimeout(() => setSidebarCollapsed(false), 1200);
    }
    window.addEventListener('expandSidebar', handleExpandSidebar);
    return () => window.removeEventListener('expandSidebar', handleExpandSidebar);
  }, []);

  useEffect(() => {
    localStorage.setItem('sidebarCollapsed', sidebarCollapsed ? '1' : '0');
  }, [sidebarCollapsed]);

  if (isAuthPage) {
    return (
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/cadastro" element={<Cadastro />} />
        </Routes>
      </Suspense>
    );
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  return (
    <div className="d-flex min-vh-100 position-relative">
      <Perfil />
      <Sidebar collapsed={sidebarCollapsed} setCollapsed={setSidebarCollapsed} />
      <div
        className='div-lateral d-flex flex-column flex-grow-1 min-vh-100 h-100 w-100'
        style={{
          transition: 'margin-left 0.3s cubic-bezier(.77,0,.18,1)',
          marginLeft: sidebarCollapsed ? -sidebarWidth : 0,
        }}
      >
        <Navbar /><hr/>
        <Suspense fallback={<PageLoader />}>
          <div key={location.key} style={{ animation: 'pageFadeIn 0.18s ease both', flex: 1, display: 'flex', flexDirection: 'column' }}>
            <Routes>
              <Route path="/" element={<PrivateRoute><Home /></PrivateRoute>} />
              <Route path="/simulados" element={<PrivateRoute><Simulados /></PrivateRoute>} />
              <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
              <Route path="/selecao/:id" element={<PrivateRoute><Selecao /></PrivateRoute>} />
              <Route path="/edital" element={<PrivateRoute><EditalWithBoundary /></PrivateRoute>} />
              <Route path="/materia/:id" element={<PrivateRoute><MateriaDetalhe /></PrivateRoute>} />
              <Route path="/dashboard/materia/:id/overview" element={<PrivateRoute><MateriaOverview /></PrivateRoute>} />
              <Route path="/projeto" element={<PrivateRoute><Projeto /></PrivateRoute>} />
              <Route path="/ciclo" element={<PrivateRoute><Ciclo /></PrivateRoute>} />
              <Route path="/fila-revisao" element={<PrivateRoute><FilaRevisao /></PrivateRoute>} />
              <Route path="/questoes" element={<PrivateRoute><Questoes /></PrivateRoute>} />
              <Route path="/usuarios" element={<AdminRoute><Usuarios /></AdminRoute>} />
              <Route path="/inserir" element={<AdminRoute><Inserir /></AdminRoute>} />
            </Routes>
          </div>
        </Suspense>
      </div>

      {/* Modal de registro de sessão de estudo - renderizado sobre toda a aplicação */}
      <StudySessionForm />
    </div>
  );
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <StudyTimerProvider>
        <PageTitleProvider>
          <Router>
            <AppLayout />
          </Router>
          <ToastContainer position="bottom-right" autoClose={3500} hideProgressBar={false} newestOnTop closeOnClick pauseOnHover />
        </PageTitleProvider>
      </StudyTimerProvider>
    </AuthProvider>
  </StrictMode>
);
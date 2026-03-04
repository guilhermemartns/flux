import { StrictMode, useState, useEffect } from 'react';
import { StudyTimerProvider } from './components/StudyTimerContext';
import { createRoot } from 'react-dom/client';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import './index.css';
import './style2.css';
import Home from './pages/Home';
import Inserir from './pages/Home/inserir.jsx';
import Usuarios from './pages/Home/Usuarios.jsx';
function AdminRoute({ children }) {
  const { user } = useAuth();
  return user && user.role === 'admin' ? children : <Navigate to="/" />;
}
import Login from './pages/Home/Login.jsx';
import Cadastro from './pages/Home/Cadastro.jsx';
import Projeto from './pages/Home/Projeto';
import Simulados from './pages/Home/simulados'; 
import Dashboard from './pages/Home/dashboard';
import Selecao from './pages/Home/selecao';
import EditalWithBoundary from './pages/Home/edital';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'sweetalert2/dist/sweetalert2.min.css';
import Sidebar from './pages/Home/components/sidebar.jsx';
import StudySessionForm from './components/StudySessionForm';
import { AuthProvider, useAuth } from './auth.jsx';
import Perfil from './pages/Home/Perfil.jsx';
import MateriaDetalhe from './pages/Home/MateriaDetalhe.jsx';
import MateriaOverview from './pages/Home/MateriaOverview.jsx';
import Ciclo from './pages/Home/Ciclo';
import FilaRevisao from './pages/Home/FilaRevisao';
import Navbar from './components/Navbar.jsx';
import { PageTitleProvider } from './components/PageTitleContext';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function PrivateRoute({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" />;
}

function AppLayout() {
  const location = useLocation();
  const isAuthPage = location.pathname === '/login' || location.pathname === '/cadastro';
  
  // Garante que o tema claro seja sempre aplicado
  useEffect(() => {
    document.body.classList.add('light-theme');
  }, []);
  
  // Função para ler o estado inicial da sidebar do localStorage
  const getSidebarCollapsed = () => {
    const val = localStorage.getItem('sidebarCollapsed');
    // Se não existe valor (primeira visita), retorna true (colapsada)
    if (val === null) return true;
    return val === '1';
  };
  
  const [sidebarCollapsed, setSidebarCollapsed] = useState(getSidebarCollapsed);
  const sidebarWidth = 300;
  
  useEffect(() => {
    function handleExpandSidebar() {
      setTimeout(() => {
        setSidebarCollapsed(false);
      }, 1200); // mesmo delay do setTimeout do botão
    }
    window.addEventListener('expandSidebar', handleExpandSidebar);
    return () => window.removeEventListener('expandSidebar', handleExpandSidebar);
  }, []);

  // Salva o estado da sidebar no localStorage sempre que mudar
  useEffect(() => {
    localStorage.setItem('sidebarCollapsed', sidebarCollapsed ? '1' : '0');
  }, [sidebarCollapsed]);
  if (isAuthPage) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/cadastro" element={<Cadastro />} />
      </Routes>
    );
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
          <Route path="/usuarios" element={<AdminRoute><Usuarios /></AdminRoute>} />
          <Route path="/inserir" element={<AdminRoute><Inserir /></AdminRoute>} />
        </Routes>
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
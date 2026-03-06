import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import api from '../../services/api';
import { useAuth } from '../../auth.jsx';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPiedPiperAlt } from '@fortawesome/free-brands-svg-icons';
import { faCheckCircle, faOtter, faTimesCircle, faCircle, faBalanceScale, faCopy, faEdit, faTrash, faFaceSadCry, faRocket } from '@fortawesome/free-solid-svg-icons';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [lembrar, setLembrar] = useState(true);
  const [hoverLogo, setHoverLogo] = useState(false);
  const containerRef = React.useRef(null);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    Promise.all([
      document.fonts.load('900 5rem "Geist Sans"'),
      document.fonts.ready,
    ]).then(() => {
      if (containerRef.current) {
        containerRef.current.style.opacity = '1';
      }
    });
    return () => { document.body.style.overflow = ''; };
  }, []);
  const [hoverCadeira, setHoverCadeira] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!email || !password) {
      setError('Preencha todos os campos.');
      return;
    }
    try {
      const response = await api.post('/login', {
        email: email.trim().toLowerCase(),
        senha: password
      });
      login(response.data);
      if (response.data.token) {
        if (lembrar) {
          localStorage.setItem('token', response.data.token);
        } else {
          sessionStorage.setItem('token', response.data.token);
          localStorage.removeItem('token');
        }
      }
      navigate('/');
    } catch (err) {
      if (err.response && err.response.data && err.response.data.error) {
        setError(err.response.data.error);
      } else {
        setError('Erro ao fazer login.');
      }
    }
  };

  // Referência para o formulário
  const formRef = React.useRef(null);
  const emailRef = React.useRef(null);

  // Função para disparar submit do formulário ao clicar em "Já tenho conta"
  function handleJaTenhoContaClick() {
    if (formRef.current) {
      formRef.current.requestSubmit();
      if (emailRef.current) {
        emailRef.current.focus();
      }
    }
  }

  return (
    <div
      ref={containerRef}
      className="min-vh-100 d-flex p-0 m-0"
      style={{
        fontFamily: 'inherit',
        overflow: 'hidden',
        opacity: 0,
        transition: 'opacity 0.25s ease',
        background: 'linear-gradient(90deg, #f9c5c5 0%, #fde8e0 25%, #eaf0fb 75%, #dce6f5 100%)'
      }}
    >
      <style>{`
        @keyframes loginFadeIn {
          from { opacity: 0.99; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes floatBounce {
          0%,100% { transform: translateY(0) rotate(0deg) scale(1.08); }
          30% { transform: translateY(-14px) rotate(-2deg) scale(1.10); }
          60% { transform: translateY(-6px) rotate(2deg) scale(1.09); }
        }
        @keyframes logoPop {
          0% { transform: scale(1) rotate(0deg); }
          40% { transform: scale(1.12) rotate(-4deg); }
          70% { transform: scale(1.08) rotate(3deg); }
          100% { transform: scale(1.10) rotate(0deg); }
        }
        @keyframes gradientShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .login-logo { transition: filter 0.3s, transform 0.3s; }
        .login-logo:hover { filter: drop-shadow(0 8px 24px rgba(168,85,247,0.35)); animation: logoPop 0.5s ease forwards; }
        .login-h1-hover {
          background: linear-gradient(270deg, #a855f7, #ec4899, #f97316, #a855f7);
          background-size: 300% 300%;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          transition: letter-spacing 0.3s;
          will-change: transform;
          transform: translateZ(0);
          -webkit-backface-visibility: hidden;
          backface-visibility: hidden;
          isolation: isolate;
        }
        .login-h1-hover:hover {
          animation: gradientShift 1.8s ease infinite;
          letter-spacing: 1px;
        }
        .login-cadeira { transition: transform 0.3s, filter 0.3s; cursor: default; }
        .login-cadeira:hover { filter: drop-shadow(0 12px 24px rgba(236,72,153,0.25)); animation: floatBounce 1.2s ease infinite; }
      `}</style>

      {/* Lado esquerdo */}
      <div
        className="d-flex flex-column justify-content-center align-items-center position-relative overflow-hidden"
        style={{
          flex: '0 0 60%',
          background: 'transparent',
          padding: '2.5rem 3rem',
          paddingLeft: '8rem',
        }}
      >
        {/* Conteúdo central - lado a lado */}
        <div className="d-flex align-items-center justify-content-center" style={{ gap: '2rem' }}>
          <div style={{ textAlign: 'left' }}>
            <a href="#" style={{ display: 'block', marginBottom: '2rem' }}>
              <img src="/sigma.png" alt="FLUX Logo" className="login-logo" style={{ width: '160px', height: 'auto', display: 'block' }} />
            </a>
            <h1
              className="login-h1-hover"
              style={{
                fontFamily: "'Geist Sans', 'Inter', sans-serif",
                fontWeight: 900,
                fontSize: 'clamp(3rem, 7vw, 5.5rem)',
                lineHeight: 0.85,
                marginBottom: '1.8rem'
              }}
            >
              Encontre<br />seu ritmo.
            </h1>
            <p style={{ color: '#444', fontSize: '1.04rem', lineHeight: 1.3, marginBottom: 0, maxWidth: '340px' }}>
              Entre em <strong>estado de fluxo</strong> e transforme<br />
              seu aprendizado em uma jornada natural.
            </p>
          </div>
          <img
            src="/cadeira.png"
            alt="Pessoa estudando"
            className="login-cadeira"
            style={{
              width: 'clamp(140px, 16vw, 200px)',
              height: 'auto',
              objectFit: 'contain',
              flexShrink: 0,
              marginTop: '2rem'
            }}
          />
        </div>

        <a
          href="https://www.instagram.com/meuflux"
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: '#aaa', fontSize: '0.8rem', position: 'absolute', bottom: '1.5rem', left: '3rem', textDecoration: 'none' }}
        >@meuflux</a>
      </div>

      {/* Lado direito */}
      <div
        className="d-flex justify-content-center align-items-center"
        style={{
          flex: '0 0 40%',
          padding: '2rem',
          background: 'transparent',
        }}
      >
        {/* Card flutuante */}
        <div
          className="bg-white"
          style={{
            width: '100%',
            maxWidth: '380px',
            borderRadius: '1.2rem',
            padding: '2.2rem 2rem',
            boxShadow: '0 4px 32px rgba(0,0,0,0.10)',
          }}
        >
          <h3 className="fw-bold text-center mb-1" style={{ color: '#1a1a2e', fontSize: '1.4rem' }}>Logar</h3>
          <p className="text-center text-muted mb-4" style={{ fontSize: '0.83rem' }}>Bem-vindo de volta! Faça login na sua conta</p>

          <form onSubmit={handleSubmit} ref={formRef}>
            <div className="mb-3">
              <label className="form-label small fw-semibold" style={{ color: '#444' }}>Email</label>
              <input
                type="email"
                ref={emailRef}
                className="form-control"
                placeholder="seu@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                style={{ borderRadius: '0.5rem', padding: '0.6rem 0.9rem', fontSize: '0.9rem' }}
              />
            </div>
            <div className="mb-2">
              <label className="form-label small fw-semibold" style={{ color: '#444' }}>Senha</label>
              <input
                type="password"
                className="form-control"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                style={{ borderRadius: '0.5rem', padding: '0.6rem 0.9rem', fontSize: '0.9rem' }}
              />
            </div>

            {error && <div className="alert alert-danger py-1 small mt-2">{error}</div>}

            <div className="d-flex align-items-center gap-2 mb-3 mt-2">
              <input
                type="checkbox"
                id="lembrar"
                checked={lembrar}
                onChange={e => setLembrar(e.target.checked)}
                style={{ cursor: 'pointer' }}
              />
              <label htmlFor="lembrar" className="small text-muted mb-0" style={{ cursor: 'pointer' }}>Lembrar-me</label>
            </div>

            <button
              type="submit"
              className="btn w-100 fw-bold py-2 mb-3"
              style={{ background: '#2563eb', color: '#fff', borderRadius: '0.5rem', fontSize: '0.95rem', border: 'none' }}
            >
              Entrar
            </button>
          </form>

          <div className="text-center mt-1">
            <span className="text-muted small">Não tem acesso? </span>
            <a
              href="https://wa.me/5514997200604?text=Ol%C3%A1%2C%20gostaria%20de%20acessar%20o%20Flux!"
              target="_blank"
              rel="noopener noreferrer"
              className="small"
              style={{ color: '#888', textDecoration: 'underline' }}
            >
              Solicitar acesso
            </a>
          </div>


        </div>
      </div>
    </div>
  );
};

export default Login;

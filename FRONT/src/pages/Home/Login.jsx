import React, { useState } from 'react';
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
        email,
        senha: password
      });
      // Salva usuário logado no contexto
      login(response.data);
      // Salva token no localStorage
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
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
      className="min-vh-100 d-flex p-0 m-0"
      style={{
        fontFamily: 'inherit',
        overflow: 'hidden',
        background: 'linear-gradient(90deg, #f9c5c5 0%, #fde8e0 25%, #eaf0fb 75%, #dce6f5 100%)'
      }}
    >

      {/* Lado esquerdo */}
      <div
        className="d-flex flex-column justify-content-center align-items-center position-relative overflow-hidden"
        style={{
          flex: '0 0 60%',
          background: 'transparent',
          padding: '2.5rem 3rem',
        }}
      >
        {/* Conteúdo central - lado a lado */}
        <div className="d-flex align-items-center justify-content-center" style={{ gap: '2rem' }}>
          <div style={{ textAlign: 'left' }}>
            <img src="/sigma.png" alt="FLUX Logo" style={{ width: '160px', height: 'auto', marginBottom: '2rem', display: 'block' }} />
            <h1
              style={{
                fontWeight: 900,
                fontSize: 'clamp(3rem, 7vw, 5.5rem)',
                lineHeight: 1.0,
                background: 'linear-gradient(90deg, #a855f7, #ec4899, #f97316)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                marginBottom: '1.8rem'
              }}
            >
              Encontre<br />seu ritmo.
            </h1>
            <p style={{ color: '#444', fontSize: '1.15rem', lineHeight: 1.3, marginBottom: 0, maxWidth: '340px' }}>
              Entre em <strong>estado de fluxo</strong> e transforme<br />
              o aprendizado em uma jornada natural.
            </p>
          </div>
          <img
            src="/cadeira.png"
            alt="Pessoa estudando"
            style={{
              width: 'clamp(140px, 16vw, 200px)',
              height: 'auto',
              objectFit: 'contain',
              flexShrink: 0,
              marginTop: '2rem'
            }}
          />
        </div>

        <div style={{ color: '#aaa', fontSize: '0.8rem', position: 'absolute', bottom: '1.5rem', left: '3rem' }}>@meuflux</div>
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

            <div className="d-flex justify-content-between align-items-center mb-3 mt-2">
              <div className="d-flex align-items-center gap-2">
                <input type="checkbox" id="lembrar" style={{ cursor: 'pointer' }} />
                <label htmlFor="lembrar" className="small text-muted mb-0" style={{ cursor: 'pointer' }}>Lembrar-me</label>
              </div>
              <a href="#" className="small" style={{ color: '#555' }}>Esqueceu a senha?</a>
            </div>

            <button
              type="submit"
              className="btn w-100 fw-bold py-2 mb-3"
              style={{ background: '#2563eb', color: '#fff', borderRadius: '0.5rem', fontSize: '0.95rem', border: 'none' }}
            >
              Entrar
            </button>
          </form>

          <div className="d-flex align-items-center gap-2 mb-3">
            <hr style={{ flex: 1, margin: 0 }} />
            <span className="text-muted small">ou continue com</span>
            <hr style={{ flex: 1, margin: 0 }} />
          </div>

          <button
            className="btn btn-outline-secondary w-100 d-flex align-items-center justify-content-center gap-2 py-2 mb-3"
            style={{ borderRadius: '0.5rem', fontSize: '0.9rem', fontWeight: 500 }}
            type="button"
          >
            <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" style={{ width: '18px' }} />
            Google
          </button>


        </div>
      </div>
    </div>
  );
};

export default Login;

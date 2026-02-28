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
    <div className="container-fluid min-vh-100 d-flex bg-light p-0" style={{ fontFamily: 'inherit' }}>
      {/* Lado esquerdo */}
      <div className="d-flex flex-column justify-content-center align-items-center flex-fill" style={{ padding: '0 2em' }}>
        <img src="/sigma.png" alt="FLUX Logo" className="mb-3" style={{ width: '60px', height: 'auto', margin: '0 auto', display: 'block' }} />
        <h1 className="fw-bold display-4 mb-2 text-dark">Bem-vindo ao FLUX</h1>
        <p className="fs-5 text-secondary mb-4">Gerencie e acompanhe seu aprendizado de forma inteligente.</p>
        <div className="d-flex gap-3 mb-4">
          <button className="btn btn-outline-primary-primary rounded-pill px-4 py-2 fw-semibold" onClick={handleJaTenhoContaClick}>Já tenho conta</button>
          <a href="/" className="btn btn-primary-primary rounded-pill px-4 py-2 fw-semibold">Quero assinar</a>
        </div>
        <p className="text-muted mt-4">Acesse sua conta ou crie uma nova para começar a evoluir nos estudos.</p>
      </div>
      {/* Lado direito - Formulário */}
      <div className="d-flex justify-content-center align-items-center flex-fill">
        <div className="w-100 bg-white" style={{ maxWidth: 400, padding: '2em 2em 1em 2em',  borderRadius: '2em' }}>
          <h2 className="mb-3 text-center text-muted fs-6 ">Acesse sua conta</h2>
          <form onSubmit={handleSubmit} ref={formRef}>
            <div className="mb-3">
              <input type="email" ref={emailRef} className="form-control rounded" placeholder="Digite seu e-mail" id="email" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            <div className="mb-3">
              <input type="password" className="form-control rounded" placeholder="Digite sua senha" id="password" value={password} onChange={e => setPassword(e.target.value)} required />
            </div>
            {error && <div className="alert alert-danger py-1">{error}</div>}
            <button type="submit" className="btn btn-primary-primary w-100  fw-bold fs-5 mt-2">Acessar</button>
          </form>
          <div className="mt-2 text-center">
            <a href="#" className=" text-primary-primary" style={{ fontSize: '0.98em' }}>Esqueceu sua senha?</a>
          </div>
   
        </div>
      </div>
    </div>
  );
};

export default Login;

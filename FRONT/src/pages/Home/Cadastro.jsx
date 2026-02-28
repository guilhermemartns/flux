import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import api from '../../services/api';

const Cadastro = () => {
  const [nome, setNome] = useState('');
  const [sobrenome, setSobrenome] = useState('');
  const [apelido, setApelido] = useState('');
  const [email, setEmail] = useState('');
  const [sexo, setSexo] = useState('');
  const [nascimento, setNascimento] = useState('');
  const [cidade, setCidade] = useState('');
  const [uf, setUf] = useState('');
  const [foto, setFoto] = useState('');
  const [role, setRole] = useState('user');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!nome || !sobrenome || !email || !sexo || !nascimento || !cidade || !uf || !password || !confirmPassword) {
      setError('Preencha todos os campos obrigatórios.');
      return;
    }
    if (password !== confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }
    try {
      await api.post('/usuarios', {
        nome,
        sobrenome,
        apelido,
        email,
        sexo,
        nascimento,
        cidade,
        uf,
        foto,
        role,
        senha: password
      });
      navigate('/login');
    } catch (err) {
      if (err.response && err.response.data && err.response.data.error) {
        setError(err.response.data.error);
      } else {
        setError('Erro ao cadastrar.');
      }
    }
  };

  return (
    <div className="container-fluid min-vh-100 d-flex justify-content-center align-items-center bg-light p-0" style={{ fontFamily: 'inherit' }}>
      <div className="w-100 shadow-sm bg-white" style={{ maxWidth: 400, padding: '2em 2em 1em 2em', borderRadius: '2em' }}>
        <h2 className="mb-3 text-center fs-6 fw-bold">Cadastro</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <input type="text" className="form-control rounded" placeholder="Nome" id="nome" value={nome} onChange={e => setNome(e.target.value)} required />
          </div>
          <div className="mb-3">
            <input type="text" className="form-control rounded" placeholder="Sobrenome" id="sobrenome" value={sobrenome} onChange={e => setSobrenome(e.target.value)} required />
          </div>
          <div className="mb-3">
            <input type="text" className="form-control rounded" placeholder="Apelido (opcional)" id="apelido" value={apelido} onChange={e => setApelido(e.target.value)} />
          </div>
          <div className="mb-3">
            <input type="email" className="form-control rounded" placeholder="Digite seu e-mail" id="email" value={email} onChange={e => setEmail(e.target.value)} required />
          </div>
          <div className="mb-3">
            <select className="form-select rounded" id="sexo" value={sexo} onChange={e => setSexo(e.target.value)} required>
              <option value="">Selecione o sexo</option>
              <option value="M">Masculino</option>
              <option value="F">Feminino</option>
              <option value="O">Outro</option>
            </select>
          </div>
          <div className="mb-3">
            <input type="date" className="form-control rounded" placeholder="Nascimento" id="nascimento" value={nascimento} onChange={e => setNascimento(e.target.value)} required />
          </div>
          <div className="mb-3">
            <input type="text" className="form-control rounded" placeholder="Cidade" id="cidade" value={cidade} onChange={e => setCidade(e.target.value)} required />
          </div>
          <div className="mb-3">
            <input type="text" className="form-control rounded" placeholder="UF" id="uf" value={uf} onChange={e => setUf(e.target.value)} maxLength={2} required />
          </div>
          <div className="mb-3">
            <input type="file" className="form-control rounded" id="foto" accept="image/*" onChange={e => {
              const file = e.target.files[0];
              if (file) {
                const reader = new FileReader();
                reader.onload = ev => setFoto(ev.target.result);
                reader.readAsDataURL(file);
              }
            }} />
          </div>
          <div className="mb-3">
            <select className="form-select rounded" id="role" value={role} onChange={e => setRole(e.target.value)} required>
              <option value="user">Usuário</option>
              <option value="admin">Administrador</option>
            </select>
          </div>
          <div className="mb-3">
            <input type="password" className="form-control rounded" placeholder="Digite sua senha" id="password" value={password} onChange={e => setPassword(e.target.value)} required />
          </div>
          <div className="mb-3">
            <input type="password" className="form-control rounded" placeholder="Confirme sua senha" id="confirmPassword" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required />
          </div>
          {error && <div className="alert alert-danger py-1">{error}</div>}
          <button type="submit" className="btn btn-primary-primary w-100 fw-bold fs-5 mt-2">Cadastrar</button>
        </form>
        <div className="mt-3 text-center text-secondary" style={{ fontSize: '0.98em' }}>
          Já tem conta? <a href="/login" className="fw-bold text-primary-primary">Clique aqui para acessar.</a>
        </div>
      </div>
    </div>
  );
};

export default Cadastro;

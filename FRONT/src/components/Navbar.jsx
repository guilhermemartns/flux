import React, { useState, useRef } from 'react';
// import HCaptcha from 'react-hcaptcha';
import { useAuth } from '../auth.jsx';
import api from '../services/api';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCamera, faCrown } from '@fortawesome/free-solid-svg-icons';
import { User } from 'react-feather';
import Dropdown from 'react-bootstrap/Dropdown';
import Modal from 'react-bootstrap/Modal';
import { usePageTitle } from './PageTitleContext';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const Navbar = () => {
  const { user } = useAuth();
  const { title, titleExtra } = usePageTitle();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showPerfilModal, setShowPerfilModal] = useState(false);
  const [showPreferenciasModal, setShowPreferenciasModal] = useState(false);
  const dropdownRef = useRef(null);

  // Estados para edição do perfil
  const [perfil, setPerfil] = useState({
    nome: '',
    sobrenome: '',
    apelido: '',
    email: '',
    sexo: '',
    nascimento: '',
    cidade: '',
    uf: '',
    foto: '',
  });
  const [fotoPreview, setFotoPreview] = useState('');
  
  // Atualiza os campos do perfil toda vez que abrir o modal (busca dados completos da API)
  React.useEffect(() => {
    if (showPerfilModal && user?.id) {
      api.get(`/usuarios/${user.id}`)
        .then(res => {
          const dados = res.data;
          setPerfil({
            nome: dados.nome || '',
            sobrenome: dados.sobrenome || '',
            apelido: dados.apelido || '',
            email: dados.email || '',
            sexo: dados.sexo || '',
            nascimento: dados.nascimento ? dados.nascimento.split('T')[0] : '',
            cidade: dados.cidade || '',
            uf: dados.uf || '',
            foto: dados.foto || '',
          });
          setFotoPreview(dados.foto || '');
        })
        .catch(() => {
          // fallback para dados do localStorage caso API falhe
          setPerfil({
            nome: user.nome || '',
            sobrenome: user.sobrenome || '',
            apelido: user.apelido || '',
            email: user.email || '',
            sexo: user.sexo || '',
            nascimento: user.nascimento ? user.nascimento.split('T')[0] : '',
            cidade: user.cidade || '',
            uf: user.uf || '',
            foto: user.foto || '',
          });
          setFotoPreview(user.foto || '');
        });
    }
  }, [showPerfilModal, user?.id]);
  const [senhaForm, setSenhaForm] = useState({ senhaAntiga: '', novaSenha: '', repitaNovaSenha: '' });
  const [senhaMsg, setSenhaMsg] = useState('');
  const { login } = useAuth();

  // Função para editar perfil
  function handlePerfilChange(e) {
    const { name, value } = e.target;
    setPerfil(prev => ({ ...prev, [name]: value }));
  }

  // Função para salvar perfil
  async function handleSalvarPerfil() {
    try {
      const userId = user?.id;
      if (!userId) return;
      const res = await api.put(`/usuarios/${userId}`, perfil);
      login({ ...user, ...res.data });
      setShowPerfilModal(false);
      toast.success('Dados do perfil atualizados com sucesso!', { position: 'bottom-right' });
    } catch (err) {
      toast.error('Erro ao atualizar perfil!', { position: 'bottom-right' });
    }
  }

  // Função para alterar foto
  function handleFotoChange(e) {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = ev => {
        setFotoPreview(ev.target.result);
        setPerfil(prev => ({ ...prev, foto: ev.target.result }));
      };
      reader.readAsDataURL(file);
    }
  }

  // Função para alterar senha
  function handleSenhaChange(e) {
    const { name, value } = e.target;
    setSenhaForm(prev => ({ ...prev, [name]: value }));
  }

  async function handleAlterarSenha(e) {
    e.preventDefault();
    setSenhaMsg('');
    if (!senhaForm.senhaAntiga || !senhaForm.novaSenha || !senhaForm.repitaNovaSenha) {
      setSenhaMsg('Preencha todos os campos.');
      return;
    }
    if (senhaForm.novaSenha !== senhaForm.repitaNovaSenha) {
      setSenhaMsg('As senhas não coincidem.');
      return;
    }
    try {
      const userId = user?.id;
      await api.put(`/usuarios/${userId}/senha`, { senhaAntiga: senhaForm.senhaAntiga, novaSenha: senhaForm.novaSenha });
      setSenhaMsg('Senha alterada com sucesso!');
      setSenhaForm({ senhaAntiga: '', novaSenha: '', repitaNovaSenha: '' });
      toast.success('Senha alterada com sucesso!', { position: 'bottom-right' });
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Erro ao alterar senha';
      setSenhaMsg(msg);
      toast.error('Erro ao alterar senha!', { position: 'bottom-right' });
    }
  }

  // Fecha dropdown ao clicar fora
  React.useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <>
  <nav className="navbar p-4" style={{  width: '100%', margin: 0, boxSizing: 'border-box' }}>
        <div className="container-fluid p-0" style={{ width: '100%' }}>
          {/* Linha 1: Usuário, foto, dropdown */}
          <div className="d-flex align-items-center justify-content-end" style={{ width: '100%' }}>
            {user && (
              <div className="d-flex align-items-center gap-2 position-relative">
                <div className="rounded-circle overflow-hidden d-flex align-items-center justify-content-center flex-shrink-0" style={{ width: 34, height: 34, border: '1px solid var(--border)', background: 'var(--bg-card)' }}>
                  {user.role === 'admin' ? (
                    <FontAwesomeIcon icon={faCrown} style={{ color: '#ffc107', fontSize: '1rem' }} />
                  ) : user.foto ? (
                    <img src={user.foto} alt="Foto" className="w-100 h-100 object-fit-cover" />
                  ) : (
                    <User size={16} className="text-secondary" />
                  )}
                </div>
                <Dropdown align="end">
                  <Dropdown.Toggle id="dropdown-user" className="fs-6 fw-semibold p-0" style={{ color: 'var(--text-light)', background: 'none', border: 'none', boxShadow: 'none', letterSpacing: '0.01em' }}>
                    {user.apelido || user.nome}
                  </Dropdown.Toggle>
                  <Dropdown.Menu>
                    <Dropdown.Item onClick={() => setShowPerfilModal(true)}>Meu perfil</Dropdown.Item>
                    {/* <Dropdown.Item onClick={() => setShowPreferenciasModal(true)}>Preferências</Dropdown.Item> */}
                    <Dropdown.Divider />
                    <Dropdown.Item onClick={() => { localStorage.clear(); window.location.replace('/login'); }}>Sair</Dropdown.Item>
                  </Dropdown.Menu>
                </Dropdown>
                {/* Modal Meu perfil - layout compacto */}
                <Modal className="modal-fundo" show={showPerfilModal} onHide={() => setShowPerfilModal(false)} centered backdrop="static" size="md">
                  <Modal.Body className="modal-estilo">
                    {/* Título */}
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <span className="fw-bold">Meu Perfil</span>
                      <button type="button" className="btn-icon" onClick={() => setShowPerfilModal(false)}>✕</button>
                    </div>
                    <p className="text-secondary mb-3" style={{ fontSize: '0.8em' }}>Atualize seus dados pessoais e foto de perfil.</p>

                    {/* Avatar */}
                    <div className="d-flex align-items-center gap-3 mb-3">
                      <div className="rounded-circle overflow-hidden d-flex align-items-center justify-content-center position-relative flex-shrink-0" style={{ width: 56, height: 56, border: '1px solid var(--border)', background: 'var(--bg-card)', cursor: 'pointer' }}>
                        {fotoPreview ? (
                          <img src={fotoPreview} alt="Foto" className="w-100 h-100 object-fit-cover" />
                        ) : (
                          <User size={26} className="text-secondary" />
                        )}
                        <label htmlFor="input-foto-perfil" className="position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center" style={{ background: 'rgba(0,0,0,0.35)', opacity: 0, transition: 'opacity 0.2s', cursor: 'pointer', borderRadius: '50%' }}
                          onMouseEnter={e => e.currentTarget.style.opacity = 1}
                          onMouseLeave={e => e.currentTarget.style.opacity = 0}
                        >
                          <FontAwesomeIcon icon={faCamera} className="text-light" />
                          <input id="input-foto-perfil" type="file" accept="image/*" onChange={handleFotoChange} style={{ display: 'none' }} />
                        </label>
                      </div>
                      <div>
                        <div className="fw-semibold" style={{ fontSize: '0.95em' }}>{perfil.nome} {perfil.sobrenome}</div>
                        <div className="text-secondary" style={{ fontSize: '0.78em' }}>{perfil.email}</div>
                      </div>
                    </div>

                    {/* Dados pessoais */}
                    <form className="row gx-2 gy-2 mb-3">
                      <div className="col-6">
                        <label className="form-label fw-semibold" style={{ fontSize: '0.78em', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-light)' }}>Nome</label>
                        <input type="text" className="form-control linha" name="nome" value={perfil.nome} onChange={handlePerfilChange} />
                      </div>
                      <div className="col-6">
                        <label className="form-label fw-semibold" style={{ fontSize: '0.78em', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-light)' }}>Sobrenome</label>
                        <input type="text" className="form-control linha" name="sobrenome" value={perfil.sobrenome} onChange={handlePerfilChange} />
                      </div>
                      <div className="col-6">
                        <label className="form-label fw-semibold" style={{ fontSize: '0.78em', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-light)' }}>Apelido</label>
                        <input type="text" className="form-control linha" name="apelido" value={perfil.apelido} onChange={handlePerfilChange} />
                      </div>
                      <div className="col-6">
                        <label className="form-label fw-semibold" style={{ fontSize: '0.78em', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-light)' }}>Email</label>
                        <input type="email" className="form-control linha" name="email" value={perfil.email} onChange={handlePerfilChange} />
                      </div>
                      <div className="col-4">
                        <label className="form-label fw-semibold" style={{ fontSize: '0.78em', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-light)' }}>Sexo</label>
                        <select className="form-select linha" name="sexo" value={perfil.sexo} onChange={handlePerfilChange}>
                          <option value="">—</option>
                          <option value="M">Masculino</option>
                          <option value="F">Feminino</option>
                          <option value="O">Outro</option>
                        </select>
                      </div>
                      <div className="col-4">
                        <label className="form-label fw-semibold" style={{ fontSize: '0.78em', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-light)' }}>Nascimento</label>
                        <input type="date" className="form-control linha" name="nascimento" value={perfil.nascimento} onChange={handlePerfilChange} />
                      </div>
                      <div className="col-3">
                        <label className="form-label fw-semibold" style={{ fontSize: '0.78em', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-light)' }}>Cidade</label>
                        <input type="text" className="form-control linha" name="cidade" value={perfil.cidade} onChange={handlePerfilChange} />
                      </div>
                      <div className="col-1">
                        <label className="form-label fw-semibold" style={{ fontSize: '0.78em', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-light)' }}>UF</label>
                        <input type="text" className="form-control linha" name="uf" value={perfil.uf} onChange={handlePerfilChange} maxLength={2} />
                      </div>
                      <div className="col-12 d-flex justify-content-end mt-3">
                        <button type="button" className="btn btn-primary-primary3 btn-sm px-3" onClick={handleSalvarPerfil}>Salvar dados</button>
                      </div>
                    </form>

                    <hr className="my-2" />

                    {/* Alterar senha */}
                    <form className="row gx-2 gy-2" onSubmit={handleAlterarSenha}>
                      <div className="col-12 fw-semibold mb-0" style={{ fontSize: '0.78em', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-light)' }}>Alterar Senha</div>
                      <div className="col-4">
                        <label className="form-label fw-semibold" style={{ fontSize: '0.78em', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-light)' }}>Senha atual</label>
                        <input type="password" className="form-control linha" name="senhaAntiga" value={senhaForm.senhaAntiga} onChange={handleSenhaChange} />
                      </div>
                      <div className="col-4">
                        <label className="form-label fw-semibold" style={{ fontSize: '0.78em', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-light)' }}>Nova senha</label>
                        <input type="password" className="form-control linha" name="novaSenha" value={senhaForm.novaSenha} onChange={handleSenhaChange} />
                      </div>
                      <div className="col-4">
                        <label className="form-label fw-semibold" style={{ fontSize: '0.78em', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-light)' }}>Repita</label>
                        <input type="password" className="form-control linha" name="repitaNovaSenha" value={senhaForm.repitaNovaSenha} onChange={handleSenhaChange} />
                      </div>
                      <div className="col-12 d-flex justify-content-end mt-3">
                        <button type="submit" className="btn btn-outline-primary-primary3 btn-sm px-3">Alterar senha</button>
                      </div>
                      {senhaMsg && <div className="col-12 text-danger mt-1" style={{ fontSize: '0.8rem' }}>{senhaMsg}</div>}
                    </form>
                  </Modal.Body>
                </Modal>
                {/* Modal Preferências */}
                <Modal className='modal-fundo' show={showPreferenciasModal} onHide={() => setShowPreferenciasModal(false)} centered>
                  <Modal.Body>
                    <h5 className="mb-3">Preferências</h5>
                    <div>Funcionalidade de preferências do usuário aqui.</div>
                    <div className="d-flex justify-content-end mt-3">
                      <button className="btn btn-outline-secondary" onClick={() => setShowPreferenciasModal(false)}>Fechar</button>
                    </div>
                  </Modal.Body>
                </Modal>
              </div>
            )}
          </div>
          {/* Linha 2: Título da página */}
          <div className="d-flex align-items-center gap-2" style={{ width: 'auto' }}>
            {title && (
              <h5 className="titulo fs-5 m-0">{title}</h5>
            )}
            {titleExtra && titleExtra}
          </div>
        </div>
      </nav>
  {/* ToastContainer removido. Usar apenas o global em main.jsx */}
    </>
  );
}

export default Navbar;

import React, { useState, useRef } from 'react';
// import HCaptcha from 'react-hcaptcha';
import { useAuth } from '../auth.jsx';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faCamera } from '@fortawesome/free-solid-svg-icons';
import Dropdown from 'react-bootstrap/Dropdown';
import Modal from 'react-bootstrap/Modal';
import { usePageTitle } from './PageTitleContext';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const Navbar = () => {
  const { user } = useAuth();
  const { title } = usePageTitle();
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
  
  // Atualiza os campos do perfil toda vez que abrir o modal
  React.useEffect(() => {
    if (showPerfilModal && user) {
      setPerfil({
        nome: user.nome || '',
        sobrenome: user.sobrenome || '',
        apelido: user.apelido || '',
        email: user.email || '',
        sexo: user.sexo || '',
        nascimento: user.nascimento || '',
        cidade: user.cidade || '',
        uf: user.uf || '',
        foto: user.foto || '',
      });
      setFotoPreview(user.foto || '');
    }
  }, [showPerfilModal, user]);
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
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:3000/usuarios/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(perfil)
      });
      if (!res.ok) throw new Error('Erro ao atualizar perfil');
      const atualizado = await res.json();
      login({ ...user, ...atualizado }); // Atualiza dados localmente
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
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:3000/usuarios/${userId}/senha`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ senhaAntiga: senhaForm.senhaAntiga, novaSenha: senhaForm.novaSenha })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao alterar senha');
      setSenhaMsg('Senha alterada com sucesso!');
      setSenhaForm({ senhaAntiga: '', novaSenha: '', repitaNovaSenha: '' });
  toast.success('Senha alterada com sucesso!', { position: 'bottom-right' });
    } catch (err) {
      setSenhaMsg(err.message);
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
              <div className="d-flex align-items-center gap-1 position-relative">
                <div className="rounded-circle bg-light border border-secondary overflow-hidden d-flex align-items-center justify-content-center" style={{ width: 38, height: 38 }}>
                  {user.foto ? (
                    <img src={user.foto} alt="Foto" className="w-100 h-100 object-fit-cover" />
                  ) : (
                    <FontAwesomeIcon icon={faUser} className="text-secondary fs-4" />
                  )}
                </div>
                <Dropdown align="end">
                  <Dropdown.Toggle  id="dropdown-user" className="  fs-6 fw-bold " style={{ color: 'var(--text-light)', background: 'none', border: 'none', boxShadow: 'none' }}>
                    {user.nome}
                  </Dropdown.Toggle>
                  <Dropdown.Menu>
                    <Dropdown.Item onClick={() => setShowPerfilModal(true)}>Meu perfil</Dropdown.Item>
                    <Dropdown.Item onClick={() => setShowPreferenciasModal(true)}>Preferências</Dropdown.Item>
                    <Dropdown.Divider />
                    <Dropdown.Item onClick={() => { localStorage.clear(); window.location.replace('/login'); }}>Sair</Dropdown.Item>
                  </Dropdown.Menu>
                </Dropdown>
                {/* Modal Meu perfil - layout customizado */}
                <Modal className="modal-fundo" show={showPerfilModal} onHide={() => setShowPerfilModal(false)} centered size="lg">
                  <Modal.Body className="p-0 position-relative" >
                    {/* Botão de fechar no canto superior direito */}
                    <button type="button" className="btn-close position-absolute top-0 end-0 m-3" aria-label="Fechar" style={{ zIndex: 10 }} onClick={() => setShowPerfilModal(false)}></button>
                    <div className="w-100 px-4 pt-4 pb-2 text-center">
                      <h4 className="text-dark fw-bold mb-3">Meu perfil</h4>
                      <div className="d-flex flex-column align-items-center mb-3">
                        <div className="rounded-circle border border-secondary overflow-hidden d-flex align-items-center justify-content-center position-relative group mb-2" style={{ width: 100, height: 100, background: '#222', cursor: 'pointer' }}>
                          {fotoPreview ? (
                            <img src={fotoPreview} alt="Foto" className="w-100 h-100 object-fit-cover" />
                          ) : (
                            <FontAwesomeIcon icon={faUser} className="text-secondary fs-1" />
                          )}
                          <label htmlFor="input-foto-perfil" className="position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center" style={{ background: 'rgba(0,0,0,0.25)', opacity: 0, transition: 'opacity 0.2s', cursor: 'pointer', borderRadius: '50%' }}
                            onMouseEnter={e => e.currentTarget.style.opacity = 1}
                            onMouseLeave={e => e.currentTarget.style.opacity = 0}
                          >
                            <FontAwesomeIcon icon={faCamera} className="text-light fs-2" />
                            <input id="input-foto-perfil" type="file" accept="image/*" onChange={handleFotoChange} style={{ display: 'none' }} />
                          </label>
                        </div>
                      </div>
                    </div>
                    <div className="d-flex justify-content-center align-items-center" style={{ minHeight: 420 }}>
                      {/* Lateral direita */}
                      <div className="flex-fill px-4 pb-4 pt-2" >
                        <form className="row gx-4 gy-2 mb-3">
                          <div className="col-6">
                            <label className="form-label text-light">Nome</label>
                            <input type="text" className="form-control linha" name="nome" value={perfil.nome} onChange={handlePerfilChange} />
                          </div>
                          <div className="col-6">
                            <label className="form-label text-light">Sobrenome</label>
                            <input type="text" className="form-control linha" name="sobrenome" value={perfil.sobrenome} onChange={handlePerfilChange} />
                          </div>
                          <div className="col-6">
                            <label className="form-label text-light">Apelido</label>
                            <input type="text" className="form-control linha" name="apelido" value={perfil.apelido} onChange={handlePerfilChange} />
                          </div>
                          <div className="col-6">
                            <label className="form-label text-light">Email</label>
                            <input type="email" className="form-control linha" name="email" value={perfil.email} onChange={handlePerfilChange} />
                          </div>
                          <div className="col-6">
                            <label className="form-label text-light">Sexo</label>
                            <select className="form-select border-0 border-bottom linha" name="sexo" value={perfil.sexo} onChange={handlePerfilChange}>
                              <option value="">Selecione</option>
                              <option value="M">Masculino</option>
                              <option value="F">Feminino</option>
                              <option value="O">Outro</option>
                            </select>
                          </div>
                          <div className="col-6">
                            <label className="form-label text-light">Nascimento</label>
                            <input type="date" className="form-control linha" name="nascimento" value={perfil.nascimento} onChange={handlePerfilChange} />
                          </div>
                          <div className="col-8">
                            <label className="form-label text-light">Cidade</label>
                            <input type="text" className="form-control linha" name="cidade" value={perfil.cidade} onChange={handlePerfilChange} />
                          </div>
                          <div className="col-4">
                            <label className="form-label text-light">UF</label>
                            <input type="text" className="form-control linha" name="uf" value={perfil.uf} onChange={handlePerfilChange} maxLength={2} />
                          </div>
                          <div className="col-12 d-flex justify-content-end gap-2 mt-2">
                            <button type="button" className="btn btn-primary-primary px-3 py-1" onClick={handleSalvarPerfil}>Salvar</button>
                          </div>
                        </form>
                        {/* Formulário de alteração de senha integrado */}
                        <form className="row gx-4 gy-2 mt-2 mb-2" onSubmit={handleAlterarSenha}>
                          <div className="col-12 text-light fw-bold mb-2" style={{ fontSize: '1rem' }}>Alterar senha</div>
                          <div className="col-6">
                            <label className="form-label text-light">Senha antiga</label>
                            <input type="password" className="form-control linha" name="senhaAntiga" value={senhaForm.senhaAntiga} onChange={handleSenhaChange} />
                          </div>
                          <div className="col-6"></div>
                          <div className="col-6">
                            <label className="form-label text-light">Nova senha</label>
                            <input type="password" className="form-control linha" name="novaSenha" value={senhaForm.novaSenha} onChange={handleSenhaChange} />
                          </div>
                          <div className="col-6">
                            <label className="form-label text-light">Repita nova senha</label>
                            <input type="password" className="form-control linha" name="repitaNovaSenha" value={senhaForm.repitaNovaSenha} onChange={handleSenhaChange} />
                          </div>
                          <div className="col-12 d-flex justify-content-end gap-2 mt-2">
                            <button type="submit" className="btn btn-primary-primary px-3 py-1">Alterar senha</button>
                          </div>
                          {senhaMsg && <div className="col-12 text-danger mt-2">{senhaMsg}</div>}
                        </form>
                      </div>
                    </div>
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
          <div className="d-flex align-items-center" style={{ width: '100%' }}>
            {title && (
              <h5 className="titulo fs-5">{title}</h5>
            )}
          </div>
        </div>
      </nav>
  {/* ToastContainer removido. Usar apenas o global em main.jsx */}
    </>
  );
}

export default Navbar;

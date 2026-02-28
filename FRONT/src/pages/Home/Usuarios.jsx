import React, { useEffect, useState } from 'react';
import { useEffect as useEffect2 } from 'react';
import { usePageTitle } from '../../components/PageTitleContext';
import api from '../../services/api';
import { Button, Modal, Form } from 'react-bootstrap';

const Usuarios = () => {
  const { setTitle } = usePageTitle();
  useEffect2(() => {
    setTitle('Usuários');
    // eslint-disable-next-line
  }, []);
  const [showEditModal, setShowEditModal] = useState(false);
  const [usuarioEdit, setUsuarioEdit] = useState(null);
  const [usuarios, setUsuarios] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [novoUsuario, setNovoUsuario] = useState({
    nome: '',
    sobrenome: '',
    apelido: '',
    email: '',
    sexo: '',
    nascimento: '',
    cidade: '',
    uf: '',
    foto: '',
    role: 'user',
    senha: ''
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    buscarUsuarios();
  }, []);

  async function buscarUsuarios() {
    setLoading(true);
    try {
      const token = JSON.parse(localStorage.getItem('user'))?.token;
      const res = await api.get('/usuarios', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsuarios(res.data);
    } catch {
      setUsuarios([]);
    }
    setLoading(false);
  }

  async function apagarUsuario(id) {
  // ...existing code...
    if (!window.confirm('Deseja realmente apagar este usuário? Todos os dados relacionados serão removidos!')) return;
    setLoading(true);
    const token = JSON.parse(localStorage.getItem('user'))?.token;
    await api.delete(`/usuarios/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    buscarUsuarios();
    setLoading(false);
  }

  async function cadastrarUsuario(e) {
    e.preventDefault();
    setLoading(true);
    const token = JSON.parse(localStorage.getItem('user'))?.token;
    await api.post('/usuarios', novoUsuario, {
      headers: { Authorization: `Bearer ${token}` }
    });
    setShowModal(false);
    setNovoUsuario({
      nome: '', sobrenome: '', apelido: '', email: '', sexo: '', nascimento: '', cidade: '', uf: '', foto: '', role: 'user', senha: ''
    });
    buscarUsuarios();
    setLoading(false);
  }

  return (
    <div className="container mt-4">
      {/* Título removido, agora é definido via PageTitleContext para o Navbar */}
      <div className="card-padrao rounded-3 shadow-sm p-3 mb-2  w-100">
        <strong className=" mb-2 d-block  m-0">GERENCIAR USUÁRIOS</strong>
        <table className="w-100 border-0 rounded-3">
          <thead>
            <tr>
              <th className="text-center p-1">Nome</th>
              <th className="text-center p-1">Email</th>
              <th className="text-center p-1">Role</th>
              <th className="text-center p-1">Ações</th>
            </tr>
          </thead>
          <tbody>
            {usuarios.length === 0 ? (
              <tr>
                <td colSpan={4} className="text-secondary text-center p-3">Nenhum usuário cadastrado.</td>
              </tr>
            ) : (
              usuarios.map((u, idx) => (
                <tr key={u.id} className={idx % 2 === 1 ? 'bg-secondary bg-opacity-10' : ''}>
                  <td className="text-center align-middle p-1 fw-semibold text-primary">{u.nome}</td>
                  <td className="text-center align-middle p-1">{u.email}</td>
                  <td className="text-center align-middle p-1">{u.role}</td>
                  <td className="text-center align-middle p-1">
                    <Button variant="warning" size="sm" className="me-2" onClick={() => { setUsuarioEdit(u); setShowEditModal(true); }}>Editar</Button>
                    <Button variant="secondary" size="sm" className="me-2" onClick={async () => {
                      if (window.confirm('Deseja realmente limpar todos os dados do usuário? O cadastro será mantido, mas todos os dados de projetos serão apagados!')) {
                        setLoading(true);
                        const token = JSON.parse(localStorage.getItem('user'))?.token;
                        await api.post(`/usuarios/${u.id}/limpar-dados`, {}, {
                          headers: { Authorization: `Bearer ${token}` }
                        });
                        buscarUsuarios();
                        setLoading(false);
                      }
                    }}>Limpar dados</Button>
                    <Button variant="danger" size="sm" onClick={() => apagarUsuario(u.id)}>Apagar</Button>
                  </td>
                </tr>
              ))
            )}
            <tr>
              <td colSpan={4} className="p-0 border-0">
                <div
                  className="card-padrao-vazio d-flex align-items-center justify-content-center my-2 py-2 px-3 pointer text-secondary fst-italic"
                  onClick={() => setShowModal(true)}
                  onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.09)'}
                  onMouseOut={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
                >
                  <span className="fw-semibold text-primary-primary">+ Cadastrar Usuário</span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      {loading && <div>Carregando...</div>}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title className="fw-bold fs-5">Cadastrar Usuário</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={cadastrarUsuario}>
            {/* Bloco 1: Nome, Sobrenome, Apelido, Sexo, Nascimento, Foto */}
            <div className="row g-2 mb-2">
              <div className="col-md-4">
                <Form.Group className="mb-2">
                  <Form.Label className="fw-semibold">Nome</Form.Label>
                  <Form.Control type="text" className="linha" value={novoUsuario.nome} onChange={e => setNovoUsuario({ ...novoUsuario, nome: e.target.value })} required />
                </Form.Group>
              </div>
              <div className="col-md-4">
                <Form.Group className="mb-2">
                  <Form.Label className="fw-semibold">Sobrenome</Form.Label>
                  <Form.Control type="text" className="linha" value={novoUsuario.sobrenome} onChange={e => setNovoUsuario({ ...novoUsuario, sobrenome: e.target.value })} />
                </Form.Group>
              </div>
              <div className="col-md-4">
                <Form.Group className="mb-2">
                  <Form.Label className="fw-semibold">Apelido (opcional)</Form.Label>
                  <Form.Control type="text" className="linha" value={novoUsuario.apelido} onChange={e => setNovoUsuario({ ...novoUsuario, apelido: e.target.value })} />
                </Form.Group>
              </div>
              <div className="col-md-4">
                <Form.Group className="mb-2">
                  <Form.Label className="fw-semibold">Sexo</Form.Label>
                  <Form.Select className="linha" value={novoUsuario.sexo} onChange={e => setNovoUsuario({ ...novoUsuario, sexo: e.target.value })}>
                    <option value="">Selecione</option>
                    <option value="M">Masculino</option>
                    <option value="F">Feminino</option>
                    <option value="O">Outro</option>
                  </Form.Select>
                </Form.Group>
              </div>
              <div className="col-md-4">
                <Form.Group className="mb-2">
                  <Form.Label className="fw-semibold">Nascimento</Form.Label>
                  <Form.Control type="date" className="linha" value={novoUsuario.nascimento} onChange={e => setNovoUsuario({ ...novoUsuario, nascimento: e.target.value })} />
                </Form.Group>
              </div>
              <div className="col-md-4">
                <Form.Group className="mb-2">
                  <Form.Label className="fw-semibold">Foto (opcional)</Form.Label>
                  <Form.Control type="file" className="linha" accept="image/*" onChange={e => {
                    const file = e.target.files[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = ev => setNovoUsuario({ ...novoUsuario, foto: ev.target.result });
                      reader.readAsDataURL(file);
                    }
                  }} />
                </Form.Group>
              </div>
            </div>
            {/* Bloco 2: Email */}
            <div className="row g-2 mb-2">
              <div className="col-md-12">
                <Form.Group className="mb-2">
                  <Form.Label className="fw-semibold">Email</Form.Label>
                  <Form.Control type="email" className="linha" value={novoUsuario.email} onChange={e => setNovoUsuario({ ...novoUsuario, email: e.target.value })} required />
                </Form.Group>
              </div>
            </div>
            {/* Bloco 3: Senha e Tipo de Usuário */}
            <div className="row g-2 mb-2">
              <div className="col-md-6">
                <Form.Group className="mb-2">
                  <Form.Label className="fw-semibold">Senha</Form.Label>
                  <Form.Control type="password" className="linha" value={novoUsuario.senha} onChange={e => setNovoUsuario({ ...novoUsuario, senha: e.target.value })} required />
                </Form.Group>
              </div>
              <div className="col-md-6">
                <Form.Group className="mb-2">
                  <Form.Label className="fw-semibold">Tipo</Form.Label>
                  <Form.Select className="linha" value={novoUsuario.role} onChange={e => setNovoUsuario({ ...novoUsuario, role: e.target.value })} required>
                    <option value="user">Usuário</option>
                    <option value="admin">Administrador</option>
                  </Form.Select>
                </Form.Group>
              </div>
            </div>
            {/* Bloco 4: Cidade e UF */}
            <div className="row g-2 mb-2">
              <div className="col-md-8">
                <Form.Group className="mb-2">
                  <Form.Label className="fw-semibold">Cidade</Form.Label>
                  <Form.Control type="text" className="linha" value={novoUsuario.cidade} onChange={e => setNovoUsuario({ ...novoUsuario, cidade: e.target.value })} />
                </Form.Group>
              </div>
              <div className="col-md-4">
                <Form.Group className="mb-2">
                  <Form.Label className="fw-semibold">UF</Form.Label>
                  <Form.Control type="text" className="linha" value={novoUsuario.uf} onChange={e => setNovoUsuario({ ...novoUsuario, uf: e.target.value })} maxLength={2} />
                </Form.Group>
              </div>
            </div>
            <div className="d-flex justify-content-end gap-2 mt-3">
              <Button type="button" variant="outline-secondary" onClick={() => setShowModal(false)}>
                Cancelar
              </Button>
              <Button type="submit" variant="success">
                Cadastrar
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>
      {/* Modal de edição de usuário */}
  <Modal show={showEditModal} onHide={() => setShowEditModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title className="fw-bold fs-5">Editar Usuário</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {usuarioEdit && (
            <Form onSubmit={async e => {
              e.preventDefault();
              setLoading(true);
              const { id, senha, ...dados } = usuarioEdit;
              const token = JSON.parse(localStorage.getItem('user'))?.token;
              await api.put(`/usuarios/${id}`, dados, {
                headers: { Authorization: `Bearer ${token}` }
              });
              if (senha && senha.trim().length > 0) {
                await api.put(`/usuarios/${id}/senha-admin`, { novaSenha: senha }, {
                  headers: { Authorization: `Bearer ${token}` }
                });
              }
              setShowEditModal(false);
              setUsuarioEdit(null);
              buscarUsuarios();
              setLoading(false);
            }}>
              {/* Bloco 1: Nome, Sobrenome, Apelido, Sexo, Nascimento, Foto */}
              <div className="row g-2 mb-2">
                <div className="col-md-4">
                  <Form.Group className="mb-2">
                    <Form.Label className="fw-semibold">Nome</Form.Label>
                    <Form.Control type="text" className="linha" value={usuarioEdit.nome} onChange={e => setUsuarioEdit({ ...usuarioEdit, nome: e.target.value })} required />
                  </Form.Group>
                </div>
                <div className="col-md-4">
                  <Form.Group className="mb-2">
                    <Form.Label className="fw-semibold">Sobrenome</Form.Label>
                    <Form.Control type="text" className="linha" value={usuarioEdit.sobrenome} onChange={e => setUsuarioEdit({ ...usuarioEdit, sobrenome: e.target.value })} required />
                  </Form.Group>
                </div>
                <div className="col-md-4">
                  <Form.Group className="mb-2">
                    <Form.Label className="fw-semibold">Apelido (opcional)</Form.Label>
                    <Form.Control type="text" className="linha" value={usuarioEdit.apelido || ''} onChange={e => setUsuarioEdit({ ...usuarioEdit, apelido: e.target.value })} />
                  </Form.Group>
                </div>
                <div className="col-md-4">
                  <Form.Group className="mb-2">
                    <Form.Label className="fw-semibold">Sexo</Form.Label>
                    <Form.Select className="linha" value={usuarioEdit.sexo} onChange={e => setUsuarioEdit({ ...usuarioEdit, sexo: e.target.value })} required>
                      <option value="">Selecione</option>
                      <option value="M">Masculino</option>
                      <option value="F">Feminino</option>
                      <option value="O">Outro</option>
                    </Form.Select>
                  </Form.Group>
                </div>
                <div className="col-md-4">
                  <Form.Group className="mb-2">
                    <Form.Label className="fw-semibold">Nascimento</Form.Label>
                    <Form.Control type="date" className="linha" value={usuarioEdit.nascimento ? usuarioEdit.nascimento.slice(0,10) : ''} onChange={e => setUsuarioEdit({ ...usuarioEdit, nascimento: e.target.value })} required />
                  </Form.Group>
                </div>
                <div className="col-md-4">
                  <Form.Group className="mb-2">
                    <Form.Label className="fw-semibold">Foto (opcional)</Form.Label>
                    <Form.Control type="file" className="linha" accept="image/*" onChange={e => {
                      const file = e.target.files[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = ev => setUsuarioEdit({ ...usuarioEdit, foto: ev.target.result });
                        reader.readAsDataURL(file);
                      }
                    }} />
                  </Form.Group>
                </div>
              </div>
              {/* Bloco 2: Email */}
              <div className="row g-2 mb-2">
                <div className="col-md-12">
                  <Form.Group className="mb-2">
                    <Form.Label className="fw-semibold">Email</Form.Label>
                    <Form.Control type="email" className="linha" value={usuarioEdit.email} onChange={e => setUsuarioEdit({ ...usuarioEdit, email: e.target.value })} required />
                  </Form.Group>
                </div>
              </div>
              {/* Bloco 3: Senha e Tipo de Usuário */}
              <div className="row g-2 mb-2">
                <div className="col-md-6">
                  <Form.Group className="mb-2">
                    <Form.Label className="fw-semibold">Nova Senha (opcional)</Form.Label>
                    <Form.Control type="password" className="linha" value={usuarioEdit.senha || ''} onChange={e => setUsuarioEdit({ ...usuarioEdit, senha: e.target.value })} placeholder="Digite nova senha para alterar" />
                  </Form.Group>
                </div>
                <div className="col-md-6">
                  <Form.Group className="mb-2">
                    <Form.Label className="fw-semibold">Tipo</Form.Label>
                    <Form.Select className="linha" value={usuarioEdit.role} onChange={e => setUsuarioEdit({ ...usuarioEdit, role: e.target.value })} required>
                      <option value="user">Usuário</option>
                      <option value="admin">Administrador</option>
                    </Form.Select>
                  </Form.Group>
                </div>
              </div>
              {/* Bloco 4: Cidade e UF */}
              <div className="row g-2 mb-2">
                <div className="col-md-8">
                  <Form.Group className="mb-2">
                    <Form.Label className="fw-semibold">Cidade</Form.Label>
                    <Form.Control type="text" className="linha" value={usuarioEdit.cidade} onChange={e => setUsuarioEdit({ ...usuarioEdit, cidade: e.target.value })} required />
                  </Form.Group>
                </div>
                <div className="col-md-4">
                  <Form.Group className="mb-2">
                    <Form.Label className="fw-semibold">UF</Form.Label>
                    <Form.Control type="text" className="linha" value={usuarioEdit.uf} onChange={e => setUsuarioEdit({ ...usuarioEdit, uf: e.target.value })} maxLength={2} required />
                  </Form.Group>
                </div>
              </div>
              <div className="d-flex justify-content-end gap-2 mt-3">
                <button type="button" className="btn btn-outline-primary-primary" onClick={() => setShowEditModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary-primary">
                  Salvar
                </button>
              </div>
            </Form>
          )}
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default Usuarios;

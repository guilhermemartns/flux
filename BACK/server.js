
const express = require('express');
const autenticar = require('./middlewares/auth');
const autorizarAdmin = require('./middlewares/authorizeAdmin');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const bcrypt = require('bcryptjs');

const app = express();
const prisma = new PrismaClient();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// Servir arquivos da pasta uploads
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));
// ROTA PUT - Editar nome da carreira
app.put('/carreiras/:id', async (req, res) => {
  const { id } = req.params;
  const { nome } = req.body;
  if (!nome) return res.status(400).json({ error: 'Nome obrigatório.' });
  try {
    const carreiraAtualizada = await prisma.carreira.update({
      where: { id },
      data: { nome }
    });
    res.status(200).json(carreiraAtualizada);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao atualizar carreira.', details: error.message });
  }
});
// ...existing code...
const projetoMesclarRouter = require('./routes/projetoMesclar');
// ...existing code...
app.use('/projetos', projetoMesclarRouter);

// ...existing code...
// Cria pasta uploads se não existir
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

// Configuração do multer para upload de imagem
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const nomeArquivo = `${Date.now()}_${Math.floor(Math.random()*10000)}${ext}`;
    cb(null, nomeArquivo);
  }
});
const upload = multer({ storage });

// ROTA PARA UPLOAD DE IMAGEM DO PROJETO PADRÃO
app.post('/upload-imagem-projeto', upload.single('imagem'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Nenhum arquivo enviado.' });
    // Retorna apenas o nome do arquivo salvo
    res.status(201).json({ filename: req.file.filename });
  } catch (error) {
    console.error('Erro ao fazer upload da imagem:', error);
    res.status(500).json({ error: 'Erro ao fazer upload da imagem.', details: error.message });
  }
});
// ...existing code...
// DELETE carreira e projetos padrão relacionados
app.delete('/carreiras/:id', async (req, res) => {
  const { id } = req.params;
  try {
    // Apaga projetos padrão relacionados
    await prisma.projetoPadrao.deleteMany({ where: { carreiraId: id } });
    // Apaga carreira
    await prisma.carreira.delete({ where: { id } });
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Erro ao apagar carreira:', error);
    res.status(500).json({ error: 'Erro ao apagar carreira.', details: error.message });
  }
});
// ...existing code...

// As rotas abaixo DEVEM ficar após a linha const app = express();

// ROTA GET - Buscar matéria por ID
app.get('/materias/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const materia = await prisma.materia.findUnique({ where: { id } });
    if (!materia) return res.status(404).json({ error: 'Matéria não encontrada.' });
    res.json(materia);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar matéria.', details: error.message });
  }
});

// ROTA GET - Buscar erros por matéria
app.get('/erros/materia/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const erros = await prisma.resposta.findMany({
      where: { materiaId: id, acertou: false },
      orderBy: { criadoEm: 'desc' }
    });
    res.json(erros);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar erros da matéria.', details: error.message });
  }
});

// ROTA GET - Buscar brancos por matéria
app.get('/brancos/materia/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const brancos = await prisma.resposta.findMany({
      where: { materiaId: id, acertou: null },
      orderBy: { criadoEm: 'desc' }
    });
    res.json(brancos);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar brancos da matéria.', details: error.message });
  }
});

// ROTAS DE CARREIRAS
app.get('/carreiras', async (req, res) => {
  try {
    const carreiras = await prisma.carreira.findMany();
    res.status(200).json(carreiras);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar carreiras.' });
  }
});

app.post('/carreiras', async (req, res) => {
  try {
    const { nome } = req.body;
    if (!nome) return res.status(400).json({ error: 'Nome da carreira obrigatório.' });
    const carreira = await prisma.carreira.create({ data: { nome } });
    res.status(201).json(carreira);
  } catch (error) {
    console.error('Erro ao criar carreira:', error);
    res.status(500).json({ error: 'Erro ao criar carreira.', details: error.message });
  }
});

app.use(express.json());
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// ROTA PUT - Editar projeto padrão

// ROTA PUT - Atualizar informações do usuário
app.put('/usuarios/:id', autenticar, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      nome,
      sobrenome,
      apelido,
      email,
      sexo,
      nascimento,
      cidade,
      uf,
      foto
    } = req.body;
    // Atualiza os campos informados
    const atualizado = await prisma.user.update({
      where: { id },
      data: {
        ...(nome !== undefined && { nome }),
        ...(sobrenome !== undefined && { sobrenome }),
        ...(apelido !== undefined && { apelido }),
        ...(email !== undefined && { email }),
        ...(sexo !== undefined && { sexo }),
        ...(nascimento !== undefined && { nascimento: nascimento ? new Date(nascimento) : null }),
        ...(cidade !== undefined && { cidade }),
        ...(uf !== undefined && { uf }),
        ...(foto !== undefined && { foto })
      }
    });
    res.status(200).json(atualizado);
  } catch (error) {
    console.error('Erro ao atualizar usuário:', error);
    res.status(500).json({ error: 'Erro ao atualizar usuário.' });
  }
});

// ROTA PUT - Alterar senha do usuário
app.put('/usuarios/:id/senha', autenticar, async (req, res) => {
  try {
    const { id } = req.params;
    const { senhaAntiga, novaSenha } = req.body;
    if (!senhaAntiga || !novaSenha) {
      return res.status(400).json({ error: 'Preencha senha antiga e nova senha.' });
    }
    const usuario = await prisma.user.findUnique({ where: { id } });
    if (!usuario) {
      return res.status(404).json({ error: 'Usuário não encontrado.' });
    }
    const senhaValida = await bcrypt.compare(senhaAntiga, usuario.senha);
    if (!senhaValida) {
      return res.status(401).json({ error: 'Senha antiga incorreta.' });
    }
    const senhaHash = await bcrypt.hash(novaSenha, 10);
    await prisma.user.update({
      where: { id },
      data: { senha: senhaHash }
    });
    res.status(200).json({ message: 'Senha alterada com sucesso.' });
  } catch (error) {
    console.error('Erro ao alterar senha:', error);
    res.status(500).json({ error: 'Erro ao alterar senha.' });
  }
});

// ROTA PUT - Alterar senha do usuário (admin, sem senha antiga)
app.put('/usuarios/:id/senha-admin', autenticar, autorizarAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { novaSenha } = req.body;
    if (!novaSenha) {
      return res.status(400).json({ error: 'Preencha a nova senha.' });
    }
    const usuario = await prisma.user.findUnique({ where: { id } });
    if (!usuario) {
      return res.status(404).json({ error: 'Usuário não encontrado.' });
    }
    const senhaHash = await bcrypt.hash(novaSenha, 10);
    await prisma.user.update({
      where: { id },
      data: { senha: senhaHash }
    });
    res.status(200).json({ message: 'Senha alterada pelo admin com sucesso.' });
  } catch (error) {
    console.error('Erro ao alterar senha pelo admin:', error);
    res.status(500).json({ error: 'Erro ao alterar senha pelo admin.' });
  }
});
// Apagar projeto padrão
// Editar projeto padrão
app.put('/projetos-padrao/:id', async (req, res) => {
  console.log('PUT /projetos-padrao/:id chamado', req.params, req.body);
  try {
    const { id } = req.params;
    let { nome, descricao, carreiraId, imagem, ano, cargo } = req.body;
    // Type-cast ano to int if present and not empty
    if (ano !== undefined && ano !== null && ano !== "") {
      ano = parseInt(ano);
      if (isNaN(ano)) ano = null;
    } else {
      ano = null;
    }
    // Garante que imagem seja string ou null
    if (Array.isArray(imagem)) {
      imagem = imagem.length > 0 ? imagem[0] : null;
    }
    // Type-cast carreiraId to string (Prisma expects string for id fields)
    if (carreiraId !== undefined && carreiraId !== null && carreiraId !== "") {
      carreiraId = String(carreiraId);
    } else {
      carreiraId = null;
    }
    // Atualiza dados do projeto padrão
    const projetoPadraoAtualizado = await prisma.projetoPadrao.update({
      where: { id },
      data: {
        ...(nome !== undefined && { nome }),
        ...(descricao !== undefined && { descricao }),
        carreiraId, // always update carreiraId, can be null
        ...(imagem !== undefined && { imagem }),
        ...(ano !== undefined && { ano }),
        ...(cargo !== undefined && { cargo })
      }
    });
    res.json(projetoPadraoAtualizado);
  } catch (error) {
    console.error('Erro ao editar projeto padrão:', error);
    console.error('Stack:', error.stack);
    res.status(500).json({ error: 'Erro ao editar projeto padrão.', details: error.message, stack: error.stack });
  }
});
app.delete('/projetos-padrao/:id', async (req, res) => {
  const { id } = req.params;
  try {
    // Apaga matérias padrão relacionadas usando o id string
    await prisma.materiaPadrao.deleteMany({ where: { projetoPadraoId: id } });
    // Apaga o projeto padrão
    await prisma.projetoPadrao.delete({ where: { id } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao apagar projeto padrão.' });
  }
});
// ROTA GET - Buscar projeto padrão por ID
app.get('/projetos-padrao/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const projeto = await prisma.projetoPadrao.findUnique({
      where: { id },
      include: {
        Materias: true // Prisma usa o nome do campo do modelo
      }
    });
    if (!projeto) return res.status(404).json({ error: 'Projeto padrão não encontrado.' });
    // Normaliza para o formato esperado no frontend
    const materias = (projeto.Materias || []).map(mat => ({
      nome: mat.nome,
      cor: mat.cor || '#71dd8c',
      edital: Array.isArray(mat.conteudos) ? mat.conteudos : []
    }));
  res.json({
    id: projeto.id,
    nome: projeto.nome,
    descricao: projeto.descricao || '',
    ano: projeto.ano || '',
    cargo: projeto.cargo || '',
    carreiraId: projeto.carreiraId || '',
    materias
  });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar projeto padrão.' });
  }
});
// ...existing code...
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Editar campo acao da resposta
app.put('/respostas/:id/acao', async (req, res) => {
  try {
    const { id } = req.params;
    const { acao } = req.body;
    if (!id) return res.status(400).json({ error: 'ID obrigatório.' });
    const editado = await prisma.resposta.update({ where: { id }, data: { acao } });
    res.json(editado);
  } catch (error) {
    console.error('Erro ao editar ação da resposta:', error);
    res.status(500).json({ error: 'Erro ao editar ação da resposta.', details: error.message });
  }
});

// ROTAS CRUD PARA ERRO E BRANCO SIMULADO

// Listar erros
app.get('/erros-simulado', async (req, res) => {
  try {
    const { userId, materiaId, simuladoId } = req.query;
    const where = {
      ...(userId ? { userId } : {}),
      ...(materiaId ? { materiaId } : {}),
      ...(simuladoId ? { simuladoId } : {})
    };
    // Busca erros diretamente da tabela resposta
    const erros = await prisma.resposta.findMany({
      where: {
        ...where,
        acertou: false
      },
      orderBy: { criadoEm: 'desc' }
    });
    res.json(erros);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar erros.' });
  }
});

// Criar erro
app.post('/erros-simulado', async (req, res) => {
  try {
    const novo = await prisma.erroSimulado.create({ data: req.body });
    res.status(201).json(novo);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao criar erro.' });
  }
});

// Editar erro
app.put('/erros-simulado/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const editado = await prisma.erroSimulado.update({ where: { id }, data: req.body });
    res.json(editado);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao editar erro.' });
  }
});

// Apagar erro
app.delete('/erros-simulado/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.erroSimulado.delete({ where: { id } });
    res.json({ message: 'Erro apagado.' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao apagar erro.' });
  }
});

// Listar brancos
app.get('/brancos-simulado', async (req, res) => {
  try {
    const { userId, materiaId, simuladoId } = req.query;
    const where = {
      ...(userId ? { userId } : {}),
      ...(materiaId ? { materiaId } : {}),
      ...(simuladoId ? { simuladoId } : {})
    };
    // Busca brancos diretamente da tabela resposta
    const brancos = await prisma.resposta.findMany({
      where: {
        ...where,
        OR: [
          { resposta: null },
          { resposta: '' },
          { resposta: 'S' }
        ]
      },
      orderBy: { criadoEm: 'desc' }
    });
    res.json(brancos);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar brancos.' });
  }
});

// Criar branco
app.post('/brancos-simulado', async (req, res) => {
  try {
    const novo = await prisma.brancoSimulado.create({ data: req.body });
    res.status(201).json(novo);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao criar branco.' });
  }
});

// Editar branco
app.put('/brancos-simulado/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const editado = await prisma.brancoSimulado.update({ where: { id }, data: req.body });
    res.json(editado);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao editar branco.' });
  }
});

// Apagar branco
app.delete('/brancos-simulado/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.brancoSimulado.delete({ where: { id } });
    res.json({ message: 'Branco apagado.' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao apagar branco.' });
  }
});

// ROTA GET - Brancos detalhados por matéria
app.get('/dashboard/brancos-detalhados', async (req, res) => {
  try {
    const { userId, projetoId } = req.query;
    const simulados = await prisma.simulado.findMany({
      where: {
        ...(userId ? { userId } : {}),
        ...(projetoId ? { projetoId } : {})
      }
    });
    const materias = await prisma.materia.findMany({
      where: {
        ...(userId ? { userId } : {}),
        ...(projetoId ? { projetoId } : {})
      }
    });
    const respostas = await prisma.resposta.findMany({
      where: {
        ...(userId ? { userId } : {}),
        ...(projetoId ? { projetoId } : {})
      }
    });

    // Agrupa por matéria, apenas respostas em branco (resposta === 'S')
    const resultado = {};
    materias.forEach(materia => {
      const nomeMateria = (materia.nome || '').trim().toLowerCase();
      resultado[materia.nome] = [];
      simulados.forEach(simulado => {
        const respostasMateriaSimulado = respostas.filter(r =>
          r.materia && r.materia.trim().toLowerCase() === nomeMateria &&
          r.simuladoId === simulado.id &&
          r.resposta === 'S'
        );
        respostasMateriaSimulado.forEach(r => {
          resultado[materia.nome].push({
            ...r,
            simulado: simulado.numSim,
            dataSim: simulado.dataSim,
            numeroQuestao: r.numero,
            motivoBranco: r.motivoBranco || '',
            editalItem: r.editalItem || ''
          });
        });
      });
    });
    // Log dos ids retornados
    Object.keys(resultado).forEach(materiaNome => {
      const ids = resultado[materiaNome].map(r => r.id);
      console.log(`[BRANCOS] Matéria: ${materiaNome} - IDs:`, ids);
    });
    res.json(resultado);
  } catch (error) {
    console.error('Erro ao buscar brancos detalhados:', error);
    res.status(500).json({ error: 'Erro ao buscar brancos detalhados.' });
  }
});

// Copiar projeto padrão para o projeto do usuário selecionado
app.post('/usuarios/:userId/copiar-projeto-padrao/:projetoPadraoId', async (req, res) => {
  try {
    const { userId, projetoPadraoId } = req.params;
    const { projetoId } = req.body;
    if (!projetoId) return res.status(400).json({ error: 'projetoId obrigatório.' });
    // Apaga matérias antigas do projeto
    await prisma.materia.deleteMany({ where: { userId, projetoId } });
    // Busca projeto padrão
    const projetoPadrao = await prisma.projetoPadrao.findUnique({ where: { id: projetoPadraoId } });
    // Atualiza o projeto do usuário com a imagem do projeto padrão
    if (projetoPadrao && projetoPadrao.imagem) {
  await prisma.projeto.update({ where: { id: projetoId }, data: { imagem: projetoPadrao.imagem, descricao: projetoPadrao.descricao } });
    }
    // Busca matérias do projeto padrão
    const materiasPadrao = await prisma.materiaPadrao.findMany({ where: { projetoPadraoId } });
    // Cria matérias no projeto do usuário
    for (const mat of materiasPadrao) {
      await prisma.materia.create({
        data: {
          nome: mat.nome,
          edital: mat.conteudos,
          cor: mat.cor || '#71dd8c',
          projetoId,
          userId
        }
      });
    }
    res.status(200).json({ message: 'Projeto padrão copiado com sucesso.' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao copiar projeto padrão.' });
  }
});
app.put('/projetos-padrao/:id', async (req, res) => {
  try {
    const { id } = req.params;
    let { nome, descricao, carreiraId, imagem, ano, cargo, materias } = req.body;
    // Type-cast ano to int if present and not empty
    if (ano !== undefined && ano !== null && ano !== "") {
      ano = parseInt(ano);
      if (isNaN(ano)) ano = null;
    }
    // Type-cast carreiraId to string (Prisma expects string for id fields)
    if (carreiraId !== undefined && carreiraId !== null && carreiraId !== "") {
      carreiraId = String(carreiraId);
    } else {
      carreiraId = null;
    }
    // Atualiza dados do projeto padrão
    const projetoPadraoAtualizado = await prisma.projetoPadrao.update({
      where: { id },
      data: {
        ...(nome !== undefined && { nome }),
        ...(descricao !== undefined && { descricao }),
        carreiraId, // always update carreiraId, can be null
        ...(imagem !== undefined && { imagem }),
        ...(ano !== undefined && { ano }),
        ...(cargo !== undefined && { cargo })
      }
    });
    // Se matérias vieram, atualiza matérias
    if (Array.isArray(materias)) {
      // Apaga matérias antigas
      await prisma.materiaPadrao.deleteMany({ where: { projetoPadraoId: id } });
      // Cria novas matérias
      for (const mat of materias) {
        await prisma.materiaPadrao.create({
          data: {
            nome: mat.nome,
            conteudos: mat.edital || mat.conteudos || [],
            cor: mat.cor || '#71dd8c',
            projetoPadraoId: id
          }
        });
      }
    }
    res.json(projetoPadraoAtualizado);
  } catch (error) {
    console.error('Erro ao editar projeto padrão:', error);
    res.status(500).json({ error: 'Erro ao editar projeto padrão.', details: error.message });
  }
});
app.post('/projetos-padrao', async (req, res) => {
  try {
    let { nome, descricao, materias, carreiraId, imagem, ano, cargo } = req.body;
    if (!nome || !Array.isArray(materias) || materias.length === 0) {
      return res.status(400).json({ error: 'Nome e matérias são obrigatórios.' });
    }
    // Garante que ano seja inteiro ou null ANTES de qualquer uso
    if (ano !== undefined && ano !== null && ano !== "") {
      ano = parseInt(ano);
      if (isNaN(ano)) ano = null;
    } else {
      ano = null;
    }
    // Garante que imagem seja string ou null
    if (Array.isArray(imagem)) {
      imagem = imagem.length > 0 ? imagem[0] : null;
    }
    // Cria projeto padrão com carreiraId se fornecido
    const projetoPadrao = await prisma.projetoPadrao.create({ data: { nome, descricao: descricao || '', carreiraId: carreiraId || null, imagem: imagem || null, ano: ano, cargo: cargo || null } });
    // Cria matérias padrão associadas
    for (const mat of materias) {
      await prisma.materiaPadrao.create({
        data: {
          nome: mat.nome,
          conteudos: mat.conteudos,
          cor: mat.cor || '#71dd8c',
          projetoPadraoId: projetoPadrao.id
        }
      });
    }
    res.status(201).json({ message: 'Projeto padrão e matérias cadastrados com sucesso.' });
  } catch (error) {
    console.error('Erro ao cadastrar projeto padrão:', error);
    res.status(500).json({ error: 'Erro ao cadastrar projeto padrão.', details: error.message });
  }
});


// Cria pasta uploads se não existir
// ...existing code...



//ROTA POST
// ROTA PARA UPLOAD DE PDF DO SIMULADO E GABARITO
app.post('/upload-pdf', upload.fields([
  { name: 'pdfSimulado', maxCount: 1 },
  { name: 'pdfGabarito', maxCount: 1 }
]), async (req, res) => {
  try {
    // Arquivos enviados
    const files = req.files;
    const simuladoId = req.body.simuladoId;
    let response = {};
    if (files.pdfSimulado) {
      response.simulado = files.pdfSimulado[0].filename;
        var simuladoFile = files.pdfSimulado[0].filename;
    }
    if (files.pdfGabarito) {
      response.gabarito = files.pdfGabarito[0].filename;
        var gabaritoFile = files.pdfGabarito[0].filename;
    }
      // Atualiza o registro do simulado com os nomes dos arquivos
      if (simuladoId && (simuladoFile || gabaritoFile)) {
        await prisma.simulado.update({
          where: { id: simuladoId },
          data: {
            ...(simuladoFile && { simulado: simuladoFile }),
            ...(gabaritoFile && { gabarito: gabaritoFile })
          }
        });
      }
    res.status(200).json({ message: 'Upload realizado com sucesso!', ...response });
  } catch (error) {
    console.error('Erro no upload:', error);
    res.status(500).json({ error: 'Erro ao fazer upload dos arquivos.' });
  }
});

// ROTA PARA SERVIR ARQUIVOS PDF DOS SIMULADOS E GABARITOS
app.get('/pdf/:filename', (req, res) => {
  const { filename } = req.params;
  const filePath = path.join(uploadsDir, filename);
  if (fs.existsSync(filePath)) {
    res.sendFile(filename, { root: uploadsDir });
  } else {
    res.status(404).json({ error: 'Arquivo não encontrado.' });
  }
});

// Listar editais pré-inseridos (gerais)


// ROTA GET - Buscar projetos do usuário
app.get('/projetos', async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ error: 'userId obrigatório' });
    // Busca todos os projetos do usuário
    const projetos = await prisma.projeto.findMany({ where: { userId } });
    // Para cada projeto, busca as matérias e conta os itens do edital
    const projetosComMaterias = await Promise.all(projetos.map(async projeto => {
      const materias = await prisma.materia.findMany({ where: { projetoId: projeto.id } });
      // Conta itens do edital de todas as matérias, garantindo que seja array
      const itensEdital = materias.reduce((acc, mat) => {
        const editalArr = Array.isArray(mat.edital) ? mat.edital : (mat.edital ? [mat.edital] : []);
        return acc + editalArr.length;
      }, 0);
      return {
        ...projeto,
        materias,
        itensEdital
      };
    }));
    res.status(200).json(projetosComMaterias);
  } catch (error) {
    console.error('Erro ao buscar projetos:', error);
    res.status(500).json({ error: 'Erro ao buscar projetos.' });
  }
});

// ROTA POST - Criar projeto
// ROTA PUT - Atualizar nome do projeto
app.put('/projetos/:id', async (req, res) => {
  try {
    const { nome } = req.body;
    if (!nome) return res.status(400).json({ error: 'Nome obrigatório' });
    const projetoAtualizado = await prisma.projeto.update({
      where: { id: req.params.id },
      data: { nome }
    });
    res.status(200).json(projetoAtualizado);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao atualizar projeto.' });
  }
});
app.post('/projetos', async (req, res) => {
  try {
    const { nome, descricao, userId } = req.body;
    if (!nome || !userId) return res.status(400).json({ error: 'Nome e userId obrigatórios' });
    const projeto = await prisma.projeto.create({ data: { nome, descricao, userId } });
    res.status(201).json(projeto);
  } catch (error) {
    console.error('Erro ao criar projeto:', error);
    res.status(500).json({ error: 'Erro ao criar projeto.' });
  }
});

// ROTA DELETE - Apagar projeto
app.delete('/projetos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    // Busca ids das matérias do projeto
    const materiasProjeto = await prisma.materia.findMany({ where: { projetoId: id } });
    const materiaIds = materiasProjeto.map(m => m.id);
    // Apaga estudos vinculados às matérias do projeto
    if (materiaIds.length > 0) {
      await prisma.estudo.deleteMany({ where: { materiaId: { in: materiaIds } } });
      await prisma.cicloMateria.deleteMany({ where: { materiaId: { in: materiaIds } } });
      await prisma.cicloEstudo.deleteMany({ where: { materiaId: { in: materiaIds } } });
      await prisma.editalProgresso.deleteMany({ where: { materiaId: { in: materiaIds } } });
    }
    // Apaga respostas vinculadas ao projeto
    await prisma.resposta.deleteMany({ where: { projetoId: id } });
    // Apaga respostas vinculadas a simulados do projeto
    const simulados = await prisma.simulado.findMany({ where: { projetoId: id } });
    const simuladoIds = simulados.map(s => s.id);
    if (simuladoIds.length > 0) {
      await prisma.resposta.deleteMany({ where: { simuladoId: { in: simuladoIds } } });
    }
    // Apaga simulados do projeto
    await prisma.simulado.deleteMany({ where: { projetoId: id } });
    // Apaga ciclos do projeto
    const ciclos = await prisma.ciclo.findMany({ where: { projetoId: id } });
    const cicloIds = ciclos.map(c => c.id);
    if (cicloIds.length > 0) {
      await prisma.cicloMateria.deleteMany({ where: { cicloId: { in: cicloIds } } });
      await prisma.cicloEstudo.deleteMany({ where: { cicloId: { in: cicloIds } } });
      await prisma.cicloFinalizado.deleteMany({ where: { cicloId: { in: cicloIds } } });
      await prisma.ciclo.deleteMany({ where: { id: { in: cicloIds } } });
    }
    // Apaga matérias do projeto
    if (materiaIds.length > 0) {
      await prisma.materia.deleteMany({ where: { id: { in: materiaIds } } });
    }
    // Apaga o projeto
    await prisma.projeto.delete({ where: { id } });
    res.status(200).json({ message: 'Projeto e todos os dados relacionados apagados com sucesso.' });
  } catch (error) {
    console.error('Erro ao apagar projeto:', error);
    if (error && error.stack) {
      console.error('Stack:', error.stack);
    }
    res.status(500).json({ error: 'Erro ao apagar projeto.', details: error.message });
  }
});

// ROTA POST - Login de usuário
app.post('/login', async (req, res) => {
  try {
    const { email, senha } = req.body;
    if (!email || !senha) {
      return res.status(400).json({ error: 'Preencha email e senha.' });
    }
    const usuario = await prisma.user.findUnique({ where: { email } });
    if (!usuario) {
      return res.status(401).json({ error: 'Email ou senha inválidos.' });
    }
    const senhaValida = await bcrypt.compare(senha, usuario.senha);
    if (!senhaValida) {
      return res.status(401).json({ error: 'Email ou senha inválidos.' });
    }
    // Gerar token JWT
    const jwt = require('jsonwebtoken');
    const secret = process.env.JWT_SECRET || 'seuSegredo';
    const token = jwt.sign({ id: usuario.id, email: usuario.email, role: usuario.role }, secret, { expiresIn: '7d' });
    res.status(200).json({
      id: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
      role: usuario.role,
      token
    });
  } catch (error) {
    console.error('Erro ao autenticar usuário:', error);
    res.status(500).json({ error: 'Erro ao autenticar usuário.' });
  }
});

// ROTA POST - Cadastro de usuário
// ROTA POST - Criar admin (sem autenticação necessária)
app.post('/criar-admin', async (req, res) => {
  try {
    const email = 'admin@admin';
    const senha = 'admin';
    
    // Hash da senha
    const hashedPassword = await bcrypt.hash(senha, 10);

    // Verificar se o usuário já existe
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      // Atualizar usuário existente
      const updatedUser = await prisma.user.update({
        where: { email },
        data: {
          senha: hashedPassword,
          role: 'admin',
          nome: 'Admin',
          apelido: 'Admin'
        }
      });
      return res.status(200).json({ 
        message: 'Usuário admin atualizado com sucesso',
        email: updatedUser.email,
        role: updatedUser.role 
      });
    } else {
      // Criar novo usuário admin
      const newUser = await prisma.user.create({
        data: {
          email,
          senha: hashedPassword,
          role: 'admin',
          nome: 'Admin',
          apelido: 'Admin'
        }
      });
      return res.status(201).json({ 
        message: 'Usuário admin criado com sucesso',
        email: newUser.email,
        role: newUser.role 
      });
    }
  } catch (error) {
    console.error('Erro ao criar admin:', error);
    res.status(500).json({ error: 'Erro ao criar admin.', details: error.message });
  }
});

// ROTA GET - Listar todos os usuários
app.get('/usuarios', autenticar, autorizarAdmin, async (req, res) => {
  try {
    const usuarios = await prisma.user.findMany();
    res.status(200).json(usuarios);
  } catch (error) {
    console.error('Erro ao listar usuários:', error);
    res.status(500).json({ error: 'Erro ao listar usuários.' });
  }
});

// ROTA DELETE - Apagar usuário e todos os dados relacionados
// ROTA POST - Limpar dados de projetos do usuário (mantém cadastro)
const { ObjectId } = require('mongodb');
app.post('/usuarios/:id/limpar-dados', autenticar, autorizarAdmin, async (req, res) => {
  const { id } = req.params;
  let userObjectId;
  try {
    userObjectId = new ObjectId(id);
  } catch (e) {
    return res.status(400).json({ error: 'ID de usuário inválido.' });
  }
  try {
    // Apaga projetos do usuário
    // Limpa todos os dados dependentes dos projetos do usuário
    const projetos = await prisma.projeto.findMany({ where: { userId: userObjectId.toString() } });
    for (const projeto of projetos) {
      // Limpa matérias do projeto
      const materias = await prisma.materia.findMany({ where: { projetoId: projeto.id } });
      const materiaIds = materias.map(m => m.id);
      if (materiaIds.length > 0) {
        // Remove respostas ligadas às matérias
        await prisma.resposta.deleteMany({ where: { materiaId: { in: materiaIds } } });
        await prisma.estudo.deleteMany({ where: { materiaId: { in: materiaIds } } });
        await prisma.cicloMateria.deleteMany({ where: { materiaId: { in: materiaIds } } });
        await prisma.cicloEstudo.deleteMany({ where: { materiaId: { in: materiaIds } } });
        await prisma.editalProgresso.deleteMany({ where: { materiaId: { in: materiaIds } } });
      }
      // Limpa respostas, simulados e ciclos do projeto
      await prisma.resposta.deleteMany({ where: { projetoId: projeto.id } });
      const simulados = await prisma.simulado.findMany({ where: { projetoId: projeto.id } });
      const simuladoIds = simulados.map(s => s.id);
      if (simuladoIds.length > 0) {
        await prisma.resposta.deleteMany({ where: { simuladoId: { in: simuladoIds } } });
      }
      await prisma.simulado.deleteMany({ where: { projetoId: projeto.id } });
      // Limpa ciclos e dependências do projeto
      const ciclos = await prisma.ciclo.findMany({ where: { projetoId: projeto.id } });
      const cicloIds = ciclos.map(c => c.id);
      if (cicloIds.length > 0) {
        await prisma.cicloMateria.deleteMany({ where: { cicloId: { in: cicloIds } } });
        await prisma.cicloEstudo.deleteMany({ where: { cicloId: { in: cicloIds } } });
        await prisma.editalProgresso.deleteMany({ where: { cicloId: { in: cicloIds } } });
        await prisma.cicloFinalizado.deleteMany({ where: { cicloId: { in: cicloIds } } });
      }
      await prisma.ciclo.deleteMany({ where: { projetoId: projeto.id } });
      await prisma.materia.deleteMany({ where: { projetoId: projeto.id } });
      await prisma.projeto.delete({ where: { id: projeto.id } });
    }
    // Limpa dados diretos do usuário
    await prisma.estudo.deleteMany({ where: { userId: userObjectId.toString() } });
    await prisma.resposta.deleteMany({ where: { userId: userObjectId.toString() } });
    await prisma.ciclo.deleteMany({ where: { userId: userObjectId.toString() } });
    await prisma.cicloEstudo.deleteMany({ where: { userId: userObjectId.toString() } });
    await prisma.editalProgresso.deleteMany({ where: { userId: userObjectId.toString() } });
    await prisma.simulado.deleteMany({ where: { userId: userObjectId.toString() } });
    if (prisma.cicloFinalizado) {
      await prisma.cicloFinalizado.deleteMany({ where: { userId: userObjectId.toString() } });
    }
    // Remove erros e brancos simulados se existirem (modelos não existem, linhas removidas)
    res.status(200).json({ message: 'Dados de projetos do usuário apagados com sucesso. Cadastro mantido.' });
  } catch (error) {
    console.error('Erro ao limpar dados do usuário:', error);
    if (error instanceof Error && error.stack) {
      console.error('Stack:', error.stack);
    }
    res.status(500).json({ error: 'Erro ao limpar dados do usuário.', details: error.message, stack: error.stack });
  }
});
app.delete('/usuarios/:id', autenticar, autorizarAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    // Apaga projetos do usuário
    const projetos = await prisma.projeto.findMany({ where: { userId: id } });
    for (const projeto of projetos) {
      // Apaga matérias do projeto
      const materiasProjeto = await prisma.materia.findMany({ where: { projetoId: projeto.id } });
      const materiaIds = materiasProjeto.map(m => m.id);
      if (materiaIds.length > 0) {
        await prisma.estudo.deleteMany({ where: { materiaId: { in: materiaIds } } });
      }
      await prisma.resposta.deleteMany({ where: { projetoId: projeto.id } });
      const simulados = await prisma.simulado.findMany({ where: { projetoId: projeto.id } });
      const simuladoIds = simulados.map(s => s.id);
      if (simuladoIds.length > 0) {
        await prisma.resposta.deleteMany({ where: { simuladoId: { in: simuladoIds } } });
      }
      await prisma.simulado.deleteMany({ where: { projetoId: projeto.id } });
      await prisma.ciclo.deleteMany({ where: { projetoId: projeto.id } });
      await prisma.materia.deleteMany({ where: { projetoId: projeto.id } });
      await prisma.projeto.delete({ where: { id: projeto.id } });
    }
    // Apaga estudos do usuário
    await prisma.estudo.deleteMany({ where: { userId: id } });
    // Apaga respostas do usuário
    await prisma.resposta.deleteMany({ where: { userId: id } });
    // Apaga ciclos do usuário
    await prisma.ciclo.deleteMany({ where: { userId: id } });
    // Apaga usuário
    await prisma.user.delete({ where: { id } });
    res.status(200).json({ message: 'Usuário e todos os dados relacionados apagados com sucesso.' });
  } catch (error) {
    console.error('Erro ao apagar usuário:', error);
    res.status(500).json({ error: 'Erro ao apagar usuário.', details: error.message });
  }
});
app.post('/usuarios', autenticar, autorizarAdmin, async (req, res) => {
  try {
    const { nome, sobrenome, apelido, email, sexo, nascimento, cidade, uf, foto, role } = req.body;
    const novoUsuario = await prisma.user.create({
      data: { nome, sobrenome, apelido, email, sexo, nascimento, cidade, uf, foto, role }
    });
    res.status(201).json({ id: novoUsuario.id, nome: novoUsuario.nome, email: novoUsuario.email, role: novoUsuario.role });
  } catch (error) {
    console.error('Erro ao cadastrar usuário:', error);
    res.status(500).json({ error: 'Erro ao cadastrar usuário.' });
  }
});


// ROTA GET - Erros detalhados por matéria
app.get('/dashboard/erros-detalhados', async (req, res) => {
  try {
    const { userId, projetoId } = req.query;
    const simulados = await prisma.simulado.findMany({
      where: {
        ...(userId ? { userId } : {}),
        ...(projetoId ? { projetoId } : {})
      }
    });
    const materias = await prisma.materia.findMany({
      where: {
        ...(userId ? { userId } : {}),
        ...(projetoId ? { projetoId } : {})
      }
    });
    const respostas = await prisma.resposta.findMany({
      where: {
        ...(userId ? { userId } : {}),
        ...(projetoId ? { projetoId } : {})
      }
    });

    // Agrupa por matéria
    const resultado = {};
    materias.forEach(materia => {
      const nomeMateria = (materia.nome || '').trim().toLowerCase();
      resultado[materia.nome] = [];
      simulados.forEach(simulado => {
        const respostasMateriaSimulado = respostas.filter(r =>
          r.materia && r.materia.trim().toLowerCase() === nomeMateria &&
          r.simuladoId === simulado.id &&
          r.acertou === false
        );
        respostasMateriaSimulado.forEach(r => {
          resultado[materia.nome].push({
            ...r,
            simulado: simulado.numSim,
            dataSim: simulado.dataSim,
            numeroQuestao: r.numero,
            motivoErro: r.motivoErro || '',
            editalItem: r.editalItem || ''
          });
        });
      });
    });
    // Log dos ids retornados
    Object.keys(resultado).forEach(materiaNome => {
      const ids = resultado[materiaNome].map(r => r.id);
      console.log(`[ERROS] Matéria: ${materiaNome} - IDs:`, ids);
    });
    res.json(resultado);
  } catch (error) {
    console.error('Erro ao buscar erros detalhados:', error);
    res.status(500).json({ error: 'Erro ao buscar erros detalhados.' });
  }
});

app.get('/dashboard/resumos', async (req, res) => {
  try {
    const { userId, projetoId } = req.query;
    const whereSimulado = {};
    const whereMateria = {};
    const whereResposta = {};
    if (userId) {
      whereSimulado.userId = userId;
      whereMateria.userId = userId;
      whereResposta.userId = userId;
    }
    if (projetoId) {
      whereSimulado.projetoId = projetoId;
      whereMateria.projetoId = projetoId;
      whereResposta.projetoId = projetoId;
    }

    const simulados = await prisma.simulado.findMany({ where: whereSimulado });
    const materias = await prisma.materia.findMany({ where: whereMateria });
    const respostas = await prisma.resposta.findMany({ where: whereResposta });

    const resumo = {};

    simulados.forEach(simulado => {
      const respostasSimulado = respostas.filter(r => r.simuladoId === simulado.id);

      // Resumo geral
      const acertos = respostasSimulado.filter(r => r.acertou === true && r.resposta).length;
      const erros = respostasSimulado.filter(r => r.acertou === false && r.resposta).length;
      const brancos = respostasSimulado.filter(r => !r.resposta || r.resposta.trim() === '' || r.resposta === 'S').length;

      // Resumo por matéria
      const materiasResumo = materias.map(materia => {
        const nomeMateria = (materia.nome || '').trim().toLowerCase();
        const materiaIdStr = String(materia.id);
        const respostasMateria = respostasSimulado.filter(r =>
          (r.materiaId && String(r.materiaId) === materiaIdStr) || ((r.materia || '').trim().toLowerCase() === nomeMateria)
        );
        return {
          nome: materia.nome,
          acertos: respostasMateria.filter(r => r.acertou === true && r.resposta).length,
          erros: respostasMateria.filter(r => r.acertou === false && r.resposta).length,
          brancos: respostasMateria.filter(r => !r.resposta || r.resposta.trim() === '' || r.resposta === 'S').length,
        };
      });

      resumo[simulado.id] = {
        acertos,
        erros,
        brancos,
        materias: materiasResumo,
    projeto: simulado.projeto || '',
    projetoId: simulado.projetoId || '',
      };
    });

    res.json(resumo);
  } catch (error) {
    console.error('Erro ao gerar resumo:', error);
    res.status(500).json({ error: 'Erro ao gerar resumo.' });
  }
});

// ROTA GET - Buscar edital da matéria
app.get('/materias/:id/edital', async (req, res) => {
  try {
    const materia = await prisma.materia.findUnique({
      where: { id: req.params.id },
      select: { edital: true }
    });
    res.json(materia?.edital || []);
  } catch (error) {
    res.status(500).json([]);
  }
});

// ROTA POST - Salvar edital da matéria
app.post('/materias/:id/edital', async (req, res) => {
  try {
    const { edital } = req.body; // agora recebe 'edital' do frontend
    await prisma.materia.update({
      where: { id: req.params.id },
      data: { edital }
    });
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ ok: false });
  }
});

// Criar simulado
app.post('/simulados', async (req, res) => {
  try {
    const { quanQuest, numSim, dataSim, projetoId, userId } = req.body;
    if (!projetoId || !userId || !numSim || !quanQuest || !dataSim) {
      return res.status(400).json({ error: 'Campos obrigatórios faltando ou inválidos.' });
    }
    const projetoExiste = await prisma.projeto.findUnique({ where: { id: projetoId } });
    if (!projetoExiste) {
      return res.status(400).json({ error: 'Projeto não encontrado para o projetoId informado.' });
    }
    const simulado = await prisma.simulado.create({
      data:  {
        quanQuest: parseInt(quanQuest),
        numSim: parseInt(numSim),
        dataSim: new Date(dataSim+ 'T00:00:00.000Z').toISOString(),
        projetoId,
        userId
      }
    });
    res.status(201).json(simulado);
  } catch (error) {
    console.error('Erro ao criar simulado:', error);
    res.status(500).json({ error: 'Erro ao criar simulado.', details: error.message });
  }
})

// Listar simulados
app.get('/simulados', async (req, res) => {
  let simulados = [];
  const { userId, projetoId, numSim } = req.query;
  const where = {};
  if (userId) where.userId = userId;
  if (projetoId) where.projetoId = projetoId;
  if (numSim) where.numSim = Number(numSim);
  simulados = await prisma.simulado.findMany({ where });
  res.status(200).json(simulados);
})

// Atualizar simulado
app.put('/simulados/:id', async (req, res) => {
  const { numSim, dataSim, quanQuest, projeto, userId } = req.body;
  // Verifica se já existe outro simulado com o mesmo numSim para o mesmo projeto/usuário
  const duplicado = await prisma.simulado.findFirst({
    where: {
      id: { not: req.params.id },
      numSim: Number(numSim),
      projeto,
      userId
    }
  });
  if (duplicado) {
    return res.status(409).json({ error: 'Já existe um simulado com esse número para este projeto/usuário.' });
  }
  const atualizado = await prisma.simulado.update({
    where: { id: req.params.id },
    data: {
      numSim: Number(numSim),
      dataSim: new Date(dataSim).toISOString(),
      quanQuest: quanQuest ? Number(quanQuest) : undefined,
      projeto,
      userId
    }
  });
  res.status(200).json(atualizado);
});

// Deletar simulado
app.delete('/simulados/:id', async (req, res) => {
  const simuladoId = req.params.id;
  try {
    await prisma.resposta.deleteMany({
      where: { simuladoId }
    });
    await prisma.simulado.delete({
      where: { id: simuladoId }
    });
    res.status(200).json({ message: 'Simulado e respostas deletados com sucesso!' });
  } catch (error) {
    console.error('Erro ao deletar simulado:', error);
    res.status(500).json({ error: 'Erro ao deletar simulado.' });
  }
})

// Buscar simulado por ID
app.get('/simulados/:id', async (req, res) => {
  try {
    const simulado = await prisma.simulado.findUnique({
      where: {
        id: req.params.id
      }
    });
    if (!simulado) {
      return res.status(404).json({ error: 'Simulado não encontrado' });
    }
    res.status(200).json(simulado);
  } catch (error) {
    console.error('Erro ao buscar simulado por ID:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});



//ROTA SALVAR RESPOSTAS
app.post('/salvarRespostas', async (req, res) => {
  try {
    console.log('--- INICIO /salvarRespostas ---');
    const { dados } = req.body;
    console.log('Dados recebidos:', JSON.stringify(dados, null, 2));
    if (!Array.isArray(dados) || dados.length === 0) {
      return res.status(400).json({ error: 'Nenhum dado recebido.' });
    }
    // Remove respostas antigas do simulado
    const simuladoId = dados[0].simuladoId;
    if (simuladoId) {
      await prisma.resposta.deleteMany({ where: { simuladoId } });
    }
    // Salva novas respostas (mantendo materiaId)
    await prisma.resposta.createMany({ data: dados });

    // Copia erros para ErroSimulado (toda questão errada)
    const erros = dados.filter(r => !r.acertou && r.materiaId);
    console.log('Erros detectados:', JSON.stringify(erros, null, 2));
    if (erros.length > 0) {
      try {
        console.log('Tentando salvar ErroSimulado...');
        const resultErros = await prisma.erroSimulado.createMany({
          data: erros.map(r => ({
            userId: r.userId,
            materiaId: r.materiaId,
            simuladoId: r.simuladoId,
            dataSim: r.dataSim ? new Date(r.dataSim) : undefined,
            numeroQuestao: r.numero,
            motivoErro: r.motivoErro,
            editalItem: r.editalItem,
          }))
        });
        console.log('Resultado createMany ErroSimulado:', resultErros);
      } catch (e) {
        console.error('Erro ao salvar ErroSimulado:', e);
      }
    }

    // Copia brancos para BrancoSimulado (resposta vazia ou 'S')
    const brancos = dados.filter(r => (!r.resposta || r.resposta === 'S') && r.materiaId);
    console.log('Brancos detectados:', JSON.stringify(brancos, null, 2));
    if (brancos.length > 0) {
      try {
        console.log('Tentando salvar BrancoSimulado...');
        const resultBrancos = await prisma.brancoSimulado.createMany({
          data: brancos.map(r => ({
            userId: r.userId,
            materiaId: r.materiaId,
            simuladoId: r.simuladoId,
            dataSim: r.dataSim ? new Date(r.dataSim) : undefined,
            numeroQuestao: r.numero,
            motivoBranco: r.motivoBranco,
            editalItem: r.editalItem,
          }))
        });
        console.log('Resultado createMany BrancoSimulado:', resultBrancos);
      } catch (e) {
        console.error('Erro ao salvar BrancoSimulado:', e);
      }
    }

    res.status(201).json({ message: 'Respostas salvas com sucesso!' });
  } catch (error) {
    console.error('Erro ao salvar respostas:', error);
    console.error('Dados recebidos:', JSON.stringify(req.body, null, 2));
    if (error && error.meta && error.meta.target) {
      console.error('Meta do erro:', error.meta.target);
    }
    res.status(500).json({ error: 'Erro ao salvar respostas.', details: error.message, fullError: error });
  }
});



//rota buscar respostas inseridas
app.get('/respostas/:simuladoId', async (req, res) => {
  const { simuladoId } = req.params;

  try {
    const respostas = await prisma.resposta.findMany({
      where: { simuladoId }
    });

    res.json(respostas);
  } catch (error) {
    console.error('Erro ao buscar respostas:', error);
    res.status(500).json({ error: 'Erro ao buscar respostas.' });
  }
});

//ROTA POST - Criar edital
app.post('/edital', async (req, res) => {
  try {
    const edital = await prisma.materia.create({
      data: {
        nome: req.body.nome,
        projetoId: req.body.projetoId,
        userId: req.body.userId,
        edital: [],
        cor: req.body.cor || null
      }
    });
    res.status(201).json(edital);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao criar edital.' });
  }
});

//ROTA GET - Listar editais
app.get('/edital', async (req, res) => {
  try {
  const { userId, projetoId } = req.query;
  const where = {};
  if (userId) where.userId = userId;
  if (projetoId) where.projetoId = projetoId;
  const editais = await prisma.materia.findMany({ where });
    res.status(200).json(editais);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar editais.' });
  }
});

//ROTA DELETE - Apagar edital
app.delete('/edital/:id', async (req, res) => {
  try {
    await prisma.materia.delete({
      where: { id: req.params.id }
    });
    res.status(200).json({ message: 'Edital deletado com sucesso!' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao deletar edital.' });
  }
});

//ROTA PUT - Atualizar nome da matéria
app.put('/materias/:id', async (req, res) => {
  try {
    const materiaAtualizada = await prisma.materia.update({
      where: { id: req.params.id },
      data: {
        nome: req.body.nome,
        ...(req.body.cor !== undefined ? { cor: req.body.cor } : {})
      }
    });
    res.status(200).json(materiaAtualizada);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao atualizar matéria.' });
  }
});

// Salvar progresso do edital (índices completos)
app.post('/edital-progresso', async (req, res) => {
  try {
    const { userId, materiaId, completos } = req.body;
    if (!userId || !materiaId || !Array.isArray(completos)) {
      return res.status(400).json({ error: 'Campos obrigatórios faltando ou inválidos.' });
    }
    // Tenta encontrar registro existente
    const existente = await prisma.editalProgresso.findFirst({ where: { userId, materiaId } });
    if (existente) {
      await prisma.editalProgresso.update({
        where: { id: existente.id },
        data: { completos }
      });
      return res.json({ ok: true, updated: true });
    } else {
      await prisma.editalProgresso.create({
        data: { userId, materiaId, completos }
      });
      return res.json({ ok: true, created: true });
    }
  } catch (error) {
    res.status(500).json({ error: 'Erro ao salvar progresso do edital.' });
  }
});

// Buscar progresso do edital para um usuário/matéria
app.get('/edital-progresso', async (req, res) => {
  try {
    const { userId, materiaId } = req.query;
    if (!userId || !materiaId) {
      return res.status(400).json({ error: 'userId e materiaId obrigatórios.' });
    }
    const progresso = await prisma.editalProgresso.findFirst({ where: { userId, materiaId } });
    if (!progresso) {
      return res.json({ completos: [] });
    }
    return res.json({ completos: progresso.completos });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar progresso do edital.' });
  }
});

// ROTA GET - Listar projetos padrão
app.get('/projetos-padrao', async (req, res) => {
  try {
    const { carreiraId } = req.query;
    const where = {};
    if (carreiraId) {
      where.carreiraId = carreiraId;
    }
    const projetosPadrao = await prisma.projetoPadrao.findMany({
      where,
      include: { Materias: true }
    });
    // Normaliza para garantir que descricao sempre exista
    const projetosPadraoNormalizados = projetosPadrao.map(p => ({
      ...p,
      descricao: p.descricao !== undefined && p.descricao !== null ? p.descricao : ''
    }));
    res.status(200).json(projetosPadraoNormalizados);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar projetos padrão.' });
  }
});

// POST /ciclos - Salvar ciclo
app.post('/ciclos', async (req, res) => {
  const { nome, materias, userId, projetoId } = req.body;
  if (!nome || !materias || !userId || !projetoId) {
    return res.status(400).json({ error: 'Campos obrigatórios ausentes.' });
  }
  try {
    const ciclo = await prisma.ciclo.create({
      data: {
        nome,
        userId,
        projetoId,
        materias: {
          create: materias.map((m, ordem) => ({
            materiaId: m.materiaId,
            tempoMin: m.tempoMin,
            ordem
          }))
        }
      },
      include: { materias: true }
    });
    res.json(ciclo);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao salvar ciclo.' });
  }
});

// GET /ciclos - Listar ciclos do usuário/projeto
app.get('/ciclos', async (req, res) => {
  const { userId, projetoId } = req.query;
  if (!userId || !projetoId) {
    return res.status(400).json({ error: 'userId e projetoId obrigatórios.' });
  }
  try {
    const ciclos = await prisma.ciclo.findMany({
      where: { userId, projetoId },
      include: {
        materias: {
          include: {
            materia: true
          }
        }
      }
    });
    res.json(ciclos);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar ciclos.' });
  }
});

// PUT /ciclos/:id - Atualizar ciclo existente
app.put('/ciclos/:id', async (req, res) => {
  const { nome, materias } = req.body;
  const cicloId = req.params.id;
  if (!nome || !materias || !cicloId) {
    return res.status(400).json({ error: 'Campos obrigatórios ausentes.' });
  }
  try {
    // Atualiza ciclo
    await prisma.ciclo.update({
      where: { id: cicloId },
      data: { nome }
    });
    // Remove matérias antigas do ciclo
    await prisma.cicloMateria.deleteMany({ where: { cicloId } });
    // Adiciona matérias novas
    await prisma.cicloMateria.createMany({
      data: materias.map((m, ordem) => ({
        cicloId,
        materiaId: m.materiaId,
        tempoMin: m.tempoMin,
        ordem
      }))
    });
    // Retorna ciclo atualizado
    const cicloAtualizado = await prisma.ciclo.findUnique({
      where: { id: cicloId },
      include: {
        materias: {
          include: { materia: true }
        }
      }
    });
    res.json(cicloAtualizado);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao atualizar ciclo.' });
  }
});

// DELETE /ciclos/:id - Apagar ciclo e suas matérias
app.delete('/ciclos/:id', async (req, res) => {
  const cicloId = req.params.id;
  if (!cicloId) {
    return res.status(400).json({ error: 'ID do ciclo obrigatório.' });
  }
  try {
    await prisma.cicloMateria.deleteMany({ where: { cicloId } });
    await prisma.ciclo.delete({ where: { id: cicloId } });
    res.status(200).json({ message: 'Ciclo apagado com sucesso.' });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao apagar ciclo.' });
  }
});

// POST /ciclo-estudo - Salvar tempo estudado
app.post('/ciclo-estudo', async (req, res) => {
  const { cicloId, materiaId, userId, tempoEstudado } = req.body;
  if (!cicloId || !materiaId || !userId || !tempoEstudado) {
    return res.status(400).json({ error: 'Campos obrigatórios ausentes.' });
  }
  try {
    const estudo = await prisma.cicloEstudo.create({
      data: { cicloId, materiaId, userId, tempoEstudado: Number(tempoEstudado) }
    });
    res.status(201).json(estudo);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao salvar tempo estudado.' });
  }
});

// GET /ciclo-estudo - Progresso do ciclo por matéria
app.get('/ciclo-estudo', async (req, res) => {
  const { cicloId, userId } = req.query;
  if (!cicloId || !userId) {
    return res.status(400).json({ error: 'cicloId e userId obrigatórios.' });
  }
  try {
    // Busca ciclo e suas matérias
    const ciclo = await prisma.ciclo.findUnique({
      where: { id: cicloId },
      include: { materias: true }
    });
    if (!ciclo) return res.status(404).json({ error: 'Ciclo não encontrado.' });
    // Busca estudos vinculados ao ciclo e versão atual
    const estudos = await prisma.estudo.findMany({
      where: { cicloId, userId, cicloVersao: ciclo.cicloVersao }
    });
    // Soma tempo estudado por matéria
    const tempoEstudadoPorMateria = {};
    estudos.forEach(e => {
      tempoEstudadoPorMateria[e.materiaId] = (tempoEstudadoPorMateria[e.materiaId] || 0) + e.tempo;
    });
    // Monta resultado por matéria
    const progresso = {};
    ciclo.materias.forEach(m => {
      const planejado = m.tempoMin;
      const estudado = Math.round(tempoEstudadoPorMateria[m.materiaId] || 0);
      const falta = planejado > 0 ? Math.max(0, 100 - Math.round((estudado / planejado) * 100)) : 100;
      progresso[m.materiaId] = { planejado, estudado, falta };
    });
    res.json(progresso);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar progresso do ciclo.' });
  }
});

// POST /estudo - Salvar sessão de estudo
app.post('/estudo', async (req, res) => {
  const { userId, projetoId, materiaId, tempo, categoria, disciplina, dataSessao, cicloId } = req.body;
  
  console.log('[POST /estudo] ====== Recebido ======');
  console.log('[POST /estudo] userId:', userId, '| existe:', !!userId);
  console.log('[POST /estudo] projetoId:', projetoId, '| existe:', !!projetoId);
  console.log('[POST /estudo] materiaId:', materiaId, '| existe:', !!materiaId);
  console.log('[POST /estudo] tempo:', tempo, '| existe:', !!tempo);
  console.log('[POST /estudo] categoria:', categoria, '| existe:', !!categoria);
  console.log('[POST /estudo] disciplina:', disciplina, '| existe:', !!disciplina);
  console.log('[POST /estudo] dataSessao:', dataSessao);
  console.log('[POST /estudo] cicloId:', cicloId);
  console.log('[POST /estudo] Body completo:', req.body);
  console.log('[POST /estudo] ====== FIM ======');
  
  if (!userId || !projetoId || !materiaId || !tempo || !categoria || !disciplina) {
    const missing = [];
    if (!userId) missing.push('userId');
    if (!projetoId) missing.push('projetoId');
    if (!materiaId) missing.push('materiaId');
    if (!tempo) missing.push('tempo');
    if (!categoria) missing.push('categoria');
    if (!disciplina) missing.push('disciplina');
    
    const errorMsg = `Campos obrigatórios ausentes: ${missing.join(', ')}`;
    console.log('[POST /estudo] ERRO:', errorMsg);
    return res.status(400).json({ error: errorMsg });
  }
  try {
    let cicloVersao = null;
    if (cicloId) {
      const ciclo = await prisma.ciclo.findUnique({ where: { id: cicloId } });
      cicloVersao = ciclo ? ciclo.cicloVersao : null;
    }
    const estudo = await prisma.estudo.create({
      data: {
        userId,
        projetoId,
        materiaId,
        tempo: Number(tempo),
        categoria,
        disciplina,
        dataSessao: dataSessao ? new Date(dataSessao) : new Date(),
        cicloId: cicloId || null,
        cicloVersao
      }
    });
    console.log('[POST /estudo] Estudo criado com sucesso:', estudo);
    res.status(201).json(estudo);
  } catch (err) {
    console.error('[POST /estudo] Erro ao salvar:', err);
    res.status(500).json({ error: 'Erro ao salvar sessão de estudo: ' + err.message });
  }
});

// GET /estudo - Buscar histórico de estudo do usuário
app.get('/estudo', async (req, res) => {
  const { userId, projetoId } = req.query;
  if (!userId || !projetoId) {
    return res.status(400).json({ error: 'userId e projetoId obrigatórios.' });
  }
  try {
    const estudos = await prisma.estudo.findMany({
      where: { userId, projetoId },
      include: { materia: true }
    });
    console.log('[GET /estudo] Parâmetros:', { userId, projetoId });
    console.log('[GET /estudo] Dados retornados:', estudos);
    res.json(estudos);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar estudos.' });
  }
});

// GET /ciclo-progresso - Retorna progresso do ciclo (tempo estudado e tempo total)
app.get('/ciclo-progresso', async (req, res) => {
  const { cicloId, userId } = req.query;
  if (!cicloId || !userId) {
    return res.status(400).json({ error: 'cicloId e userId obrigatórios.' });
  }
  try {
    // Busca ciclo e suas matérias
    const ciclo = await prisma.ciclo.findUnique({
      where: { id: cicloId },
      include: { materias: true }
    });
    if (!ciclo) return res.status(404).json({ error: 'Ciclo não encontrado.' });
    // Busca estudos vinculados ao ciclo
    const estudos = await prisma.estudo.findMany({
      where: { cicloId, userId }
    });
    // Soma tempo estudado por matéria
    const tempoEstudadoPorMateria = {};
    estudos.forEach(e => {
      tempoEstudadoPorMateria[e.materiaId] = (tempoEstudadoPorMateria[e.materiaId] || 0) + e.tempo;
    });
    // Soma total estudado e total planejado
    const tempoTotalCiclo = ciclo.materias.reduce((acc, m) => acc + m.tempoMin, 0);
    const tempoEstudadoCiclo = Object.values(tempoEstudadoPorMateria).reduce((acc, t) => acc + t, 0);
    const tempoRestanteCiclo = Math.max(tempoTotalCiclo - Math.round(tempoEstudadoCiclo / 60), 0);
    res.json({ tempoEstudadoPorMateria, tempoTotalCiclo, tempoEstudadoCiclo: Math.round(tempoEstudadoCiclo / 60), tempoRestanteCiclo });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar progresso do ciclo.' });
  }
});

// DELETE /estudo/:id - Apaga um registro de estudo
app.delete('/estudo/:id', async (req, res) => {
  const { id } = req.params;
  if (!id) return res.status(400).json({ error: 'Id obrigatório.' });
  try {
    await prisma.estudo.delete({ where: { id } });
    res.status(204).end();
  } catch (err) {
    res.status(500).json({ error: 'Erro ao apagar registro de estudo.' });
  }
});

// POST /ciclo-finalizado - Registrar conclusão de ciclo
app.post('/ciclo-finalizado', async (req, res) => {
  const { userId, cicloId } = req.body;
  if (!userId || !cicloId) {
    return res.status(400).json({ error: 'userId e cicloId obrigatórios.' });
  }
  try {
    // Busca ciclo atual
    const ciclo = await prisma.ciclo.findUnique({ where: { id: cicloId } });
    if (!ciclo) return res.status(404).json({ error: 'Ciclo não encontrado.' });
    // Incrementa cicloVersao
    await prisma.ciclo.update({
      where: { id: cicloId },
      data: { cicloVersao: ciclo.cicloVersao + 1 }
    });
    // Salva ciclo finalizado
    const cicloFinalizado = await prisma.cicloFinalizado.create({
      data: {
        userId,
        cicloId,
        dataFim: new Date()
      }
    });
    res.status(201).json(cicloFinalizado);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao registrar ciclo finalizado.' });
  }
});

// GET /ciclo-finalizado - Retorna a contagem de ciclos finalizados do usuário
app.get('/ciclo-finalizado', async (req, res) => {
  const { userId } = req.query;
  if (!userId) return res.status(400).json({ error: 'userId obrigatório.' });
  try {
    const count = await prisma.cicloFinalizado.count({ where: { userId } });
    res.json({ count });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar ciclos finalizados.' });
  }
});

// POST /ciclo-finalizado/zerar - Zera o contador de ciclos finalizados do usuário
app.post('/ciclo-finalizado/zerar', async (req, res) => {
  const { userId } = req.body;
  if (!userId) return res.status(400).json({ error: 'userId obrigatório.' });
  try {
    await prisma.cicloFinalizado.deleteMany({ where: { userId } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao zerar ciclos finalizados.' });
  }
});

// ROTA GET - Stats de acertos, erros e brancos por matéria
app.get('/dashboard/stats-materia', async (req, res) => {
  try {
    const { userId, projetoId, materiaId } = req.query;
    if (!userId || !projetoId || !materiaId) {
      return res.status(400).json({ acertos: 0, erros: 0, brancos: 0 });
    }
    const materia = await prisma.materia.findUnique({ where: { id: materiaId } });
    if (!materia) {
      return res.json({ acertos: 0, erros: 0, brancos: 0 });
    }
    let respostas = await prisma.resposta.findMany({
      where: {
        userId,
        projetoId,
        OR: [
          { materiaId },
          { materia: materia.nome }
        ]
      }
    });
    const acertos = respostas.filter(r => r.acertou === true && r.resposta).length;
    const erros = respostas.filter(r => r.acertou === false && r.resposta).length;
    const brancos = respostas.filter(r => !r.resposta || r.resposta.trim() === '' || r.resposta === 'S').length;
    res.json({ acertos, erros, brancos });
  } catch (error) {
    res.json({ acertos: 0, erros: 0, brancos: 0 });
  }
});

// ROTA GET - Buscar meta semanal do projeto
app.get('/meta-semanal', async (req, res) => {
  try {
    const { userId, projetoId } = req.query;
    if (!userId || !projetoId) {
      return res.status(400).json({ error: 'userId e projetoId obrigatórios.' });
    }
    
    const projeto = await prisma.projeto.findUnique({ 
      where: { id: projetoId }
    });
    
    if (!projeto) {
      return res.status(404).json({ error: 'Projeto não encontrado.' });
    }
    
    // Verificar se o usuário tem acesso ao projeto
    if (projeto.userId !== userId) {
      return res.status(403).json({ error: 'Acesso negado ao projeto.' });
    }
    
    res.status(200).json({ 
      metaSemanal: projeto.metaSemanal || 0 
    });
  } catch (error) {
    console.error('Erro ao buscar meta semanal:', error);
    res.status(500).json({ error: 'Erro ao buscar meta semanal.' });
  }
});

// ROTA PUT - Atualizar meta semanal do projeto
app.put('/meta-semanal', async (req, res) => {
  try {
    const { userId, projetoId, metaSemanal } = req.body;
    if (!userId || !projetoId || metaSemanal === undefined) {
      return res.status(400).json({ error: 'userId, projetoId e metaSemanal obrigatórios.' });
    }
    const projeto = await prisma.projeto.findUnique({ where: { id: projetoId } });
    if (!projeto) {
      return res.status(404).json({ error: 'Projeto não encontrado.' });
    }
    const atualizado = await prisma.projeto.update({
      where: { id: projetoId },
      data: { metaSemanal: Number(metaSemanal) }
    });
    res.status(200).json(atualizado);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao atualizar meta semanal.' });
  }
});

// ROTA POST - Cadastrar várias frases globais
app.post('/frases-dia', async (req, res) => {
  try {
    const { frases } = req.body;
    if (!Array.isArray(frases) || frases.length === 0) {
      return res.status(400).json({ error: 'frases obrigatórias.' });
    }
    const data = frases.map(frase => ({ frase }));
    await prisma.fraseDiaria.createMany({ data });
    res.status(201).json({ ok: true });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao cadastrar frases.' });
  }
});

// ROTA GET - Buscar todas as frases globais
app.get('/frases-dia', async (req, res) => {
  try {
    const frases = await prisma.fraseDiaria.findMany();
    res.json(frases);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar frases.' });
  }
});

// ROTA POST - Cadastrar categorias de dicas com degradê e ícone
app.post('/categorias-dica-sidebar', autenticar, autorizarAdmin, async (req, res) => {
  try {
    const { nome, cor1, cor2, icon } = req.body;
    if (!nome || !cor1 || !cor2 || !icon) return res.status(400).json({ error: 'Nome, cor1, cor2 e icon obrigatórios.' });
    const categoria = await prisma.categoriaDicaSidebar.create({ data: { nome, cor1, cor2, icon } });
    res.status(201).json(categoria);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao cadastrar categoria.' });
  }
});

// ROTA GET - Buscar todas as categorias de dicas
app.get('/categorias-dica-sidebar', async (req, res) => {
  try {
    const categorias = await prisma.categoriaDicaSidebar.findMany();
    res.json(categorias);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar categorias.' });
  }
});

// ROTA POST - Cadastrar dicas para a sidebar associando categoria
app.post('/dicas-sidebar', autenticar, autorizarAdmin, async (req, res) => {
  try {
    const { dicas } = req.body;
    // dicas: [{ texto: "...", categoriaId: "..." }, ...]
    if (!Array.isArray(dicas) || dicas.length === 0) {
      return res.status(400).json({ error: 'dicas obrigatórias.' });
    }
    await prisma.dicaSidebar.createMany({ data: dicas });
    res.status(201).json({ ok: true });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao cadastrar dicas.' });
  }
});

// ROTA GET - Buscar todas as dicas da sidebar (com categoria e cor)
app.get('/dicas-sidebar', async (req, res) => {
  try {
    const dicas = await prisma.dicaSidebar.findMany({
      include: { categoria: true }
    });
    res.json(dicas);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar dicas.' });
  }
});

// ROTA POST - Mesclar projetos padrão
app.post('/projetos/mesclar-padrao', async (req, res) => {
  try {
    const { userId, projetosPadrao, nome } = req.body;
    if (!userId || !projetosPadrao || projetosPadrao.length === 0) {
      return res.status(400).json({ error: 'Dados obrigatórios não enviados.' });
    }
    // Busca os projetosPadrao selecionados para montar a descrição e pegar as imagens
    const projetosPadraoData = await prisma.projetoPadrao.findMany({
      where: { id: { in: projetosPadrao } },
      select: { nome: true, cargo: true, imagem: true }
    });
    // Gera a descrição no formato "nome (cargo)\nnome2 (cargo2)"
    const descricao = projetosPadraoData
      .map(p => `${p.nome}${p.cargo ? ` (${p.cargo})` : ''}`)
      .join('\n');
    // Junta as imagens dos projetos mesclados
    const imagens = projetosPadraoData
      .map(p => {
        if (typeof p.imagem === 'string' && p.imagem.length > 0) return p.imagem;
        if (Array.isArray(p.imagem) && p.imagem.length > 0) return p.imagem[0];
        return null;
      })
      .filter(Boolean);
    const imagemFinal = imagens.length > 0 ? imagens[0] : null;
    // Cria novo projeto do usuário
    const novoProjeto = await prisma.projeto.create({
      data: {
        nome: nome || 'Projeto Mesclado',
        descricao,
        userId,
        imagem: imagemFinal,
        imagens,
        createdAt: new Date(),
      },
    });
    // Busca todas as matérias dos projetos padrão selecionados
    const materiasPadrao = await prisma.materiaPadrao.findMany({
      where: { projetoPadraoId: { in: projetosPadrao } },
    });
    // Copia todas as matérias para o novo projeto do usuário
    for (const mat of materiasPadrao) {
      await prisma.materia.create({
        data: {
          nome: mat.nome,
          projetoId: novoProjeto.id,
          userId,
          edital: mat.conteudos,
          cor: mat.cor || null,
        },
      });
    }
    return res.json(novoProjeto);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Erro ao mesclar projetos padrão.' });
  }
});

app.listen(3000)
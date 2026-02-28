// Script para normalizar o campo imagem em Projeto e ProjetoPadrao para string (ou null)
// Execute: node fixImagemString.js

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function normalizeImagemProjeto() {
  const projetos = await prisma.projeto.findMany();
  for (const p of projetos) {
    let novaImagem = null;
    if (Array.isArray(p.imagem)) {
      novaImagem = p.imagem.length > 0 ? p.imagem[0] : null;
    } else if (typeof p.imagem === 'string') {
      novaImagem = p.imagem;
    }
    if (novaImagem !== p.imagem) {
      await prisma.projeto.update({ where: { id: p.id }, data: { imagem: novaImagem } });
      console.log(`Projeto ${p.id} corrigido.`);
    }
  }
}

async function normalizeImagemProjetoPadrao() {
  const projetosPadrao = await prisma.projetoPadrao.findMany();
  for (const p of projetosPadrao) {
    let novaImagem = null;
    if (Array.isArray(p.imagem)) {
      novaImagem = p.imagem.length > 0 ? p.imagem[0] : null;
    } else if (typeof p.imagem === 'string') {
      novaImagem = p.imagem;
    }
    if (novaImagem !== p.imagem) {
      await prisma.projetoPadrao.update({ where: { id: p.id }, data: { imagem: novaImagem } });
      console.log(`ProjetoPadrao ${p.id} corrigido.`);
    }
  }
}

async function main() {
  await normalizeImagemProjeto();
  await normalizeImagemProjetoPadrao();
  await prisma.$disconnect();
  console.log('Normalização concluída.');
}

main().catch(e => { console.error(e); process.exit(1); });

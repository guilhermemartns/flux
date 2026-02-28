// Script para remover o campo imagem de todos os Projetos e ProjetosPadrao
// Execute: node scripts/removeImagem.js

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function removeImagemProjeto() {
  // Remove imagem de todos os projetos
  const projetos = await prisma.projeto.findMany();
  for (const p of projetos) {
    if (p.imagem !== null && p.imagem !== undefined) {
      await prisma.projeto.update({ where: { id: p.id }, data: { imagem: null } });
      console.log(`Imagem removida do Projeto ${p.id}`);
    }
  }
}

async function removeImagemProjetoPadrao() {
  // Remove imagem de todos os projetos padrão
  const projetosPadrao = await prisma.projetoPadrao.findMany();
  for (const p of projetosPadrao) {
    if (p.imagem !== null && p.imagem !== undefined) {
      await prisma.projetoPadrao.update({ where: { id: p.id }, data: { imagem: null } });
      console.log(`Imagem removida do ProjetoPadrao ${p.id}`);
    }
  }
}

async function main() {
  await removeImagemProjeto();
  await removeImagemProjetoPadrao();
  await prisma.$disconnect();
  console.log('Remoção de imagens concluída.');
}

main().catch(e => { console.error(e); process.exit(1); });

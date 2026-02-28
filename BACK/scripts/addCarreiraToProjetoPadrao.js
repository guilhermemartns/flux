// Script para adicionar campo carreiraId nos projetos padrão já existentes
// Execute: node BACK/scripts/addCarreiraToProjetoPadrao.js

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Buscar todos os projetos padrão
  const projetosPadrao = await prisma.projetoPadrao.findMany();

  // Buscar uma carreira padrão (ou crie uma se não existir)
  let carreira = await prisma.carreira.findFirst();
  if (!carreira) {
    carreira = await prisma.carreira.create({ data: { nome: 'Policial' } });
    console.log('Carreira criada:', carreira.nome);
  }

  // Atualizar todos os projetos padrão com carreiraId
  for (const projeto of projetosPadrao) {
    if (!projeto.carreiraId) {
      await prisma.projetoPadrao.update({
        where: { id: projeto.id },
        data: { carreiraId: carreira.id },
      });
      console.log(`ProjetoPadrao ${projeto.nome} atualizado com carreiraId.`);
    }
  }

  console.log('Atualização concluída.');
  await prisma.$disconnect();
}

main().catch(e => {
  console.error(e);
  prisma.$disconnect();
  process.exit(1);
});

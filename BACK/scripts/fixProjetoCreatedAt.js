// Script para atualizar o campo createdAt dos projetos antigos
// Execute com: node scripts/fixProjetoCreatedAt.js

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const projetos = await prisma.projeto.findMany({
    where: { createdAt: null },
  });
  console.log(`Projetos sem createdAt: ${projetos.length}`);
  for (const projeto of projetos) {
    await prisma.projeto.update({
      where: { id: projeto.id },
      data: { createdAt: new Date() }, // Preenche com data atual
    });
    console.log(`Atualizado projeto: ${projeto.id}`);
  }
  console.log('Atualização concluída.');
  await prisma.$disconnect();
}

main().catch(e => {
  console.error(e);
  prisma.$disconnect();
  process.exit(1);
});

// Script para adicionar campo quantidadeQuestoes nas matérias padrão já existentes
// Execute: node BACK/scripts/addQuantidadeQuestoesToMateriaPadrao.js

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const materias = await prisma.materiaPadrao.findMany();

  let atualizadas = 0;
  for (const mat of materias) {
    if (mat.quantidadeQuestoes === null || mat.quantidadeQuestoes === undefined) {
      await prisma.materiaPadrao.update({
        where: { id: mat.id },
        data: { quantidadeQuestoes: 0 }
      });
      atualizadas++;
      console.log(`MateriaPadrao "${mat.nome}" (${mat.id}) atualizada com quantidadeQuestoes: 0`);
    }
  }

  console.log(`\nConcluído. ${atualizadas} matérias atualizadas de um total de ${materias.length}.`);
  await prisma.$disconnect();
}

main().catch(e => {
  console.error(e);
  prisma.$disconnect();
  process.exit(1);
});

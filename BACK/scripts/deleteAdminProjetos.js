// Script para apagar todos os projetos do usuário admin (admin@admin)
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Buscar o admin
  const admin = await prisma.user.findUnique({ where: { email: 'admin@admin' } });
  if (!admin) {
    console.log('Usuário admin@admin não encontrado.');
    return;
  }
  console.log(`Admin encontrado: ${admin.id}`);

  // Buscar todos os projetos do admin
  const projetos = await prisma.projeto.findMany({ where: { userId: admin.id } });
  console.log(`Projetos encontrados: ${projetos.length}`);
  if (projetos.length === 0) {
    console.log('Nenhum projeto para apagar.');
    return;
  }

  for (const projeto of projetos) {
    const id = projeto.id;
    console.log(`\nApagando projeto: ${projeto.nome || id}`);

    // Matérias do projeto
    const materias = await prisma.materia.findMany({ where: { projetoId: id } });
    const materiaIds = materias.map(m => m.id);

    if (materiaIds.length > 0) {
      await prisma.estudo.deleteMany({ where: { materiaId: { in: materiaIds } } });
      await prisma.cicloMateria.deleteMany({ where: { materiaId: { in: materiaIds } } });
      await prisma.cicloEstudo.deleteMany({ where: { materiaId: { in: materiaIds } } });
      await prisma.editalProgresso.deleteMany({ where: { materiaId: { in: materiaIds } } });
      console.log(`  - estudos/ciclos/edital das matérias apagados`);
    }

    // Respostas do projeto (por projetoId e por materiaId para garantir)
    await prisma.resposta.deleteMany({ where: { projetoId: id } });
    if (materiaIds.length > 0) {
      await prisma.resposta.deleteMany({ where: { materiaId: { in: materiaIds } } });
    }
    console.log(`  - respostas do projeto apagadas`);

    // Respostas dos simulados do projeto
    const simulados = await prisma.simulado.findMany({ where: { projetoId: id } });
    const simuladoIds = simulados.map(s => s.id);
    if (simuladoIds.length > 0) {
      await prisma.resposta.deleteMany({ where: { simuladoId: { in: simuladoIds } } });
      await prisma.simulado.deleteMany({ where: { id: { in: simuladoIds } } });
      console.log(`  - ${simuladoIds.length} simulado(s) e respostas apagados`);
    }

    // Ciclos do projeto
    const ciclos = await prisma.ciclo.findMany({ where: { projetoId: id } });
    const cicloIds = ciclos.map(c => c.id);
    if (cicloIds.length > 0) {
      await prisma.cicloMateria.deleteMany({ where: { cicloId: { in: cicloIds } } });
      await prisma.cicloEstudo.deleteMany({ where: { cicloId: { in: cicloIds } } });
      await prisma.cicloFinalizado.deleteMany({ where: { cicloId: { in: cicloIds } } });
      await prisma.ciclo.deleteMany({ where: { id: { in: cicloIds } } });
      console.log(`  - ${cicloIds.length} ciclo(s) apagados`);
    }

    // Matérias
    if (materiaIds.length > 0) {
      await prisma.materia.deleteMany({ where: { id: { in: materiaIds } } });
      console.log(`  - ${materiaIds.length} matéria(s) apagadas`);
    }

    // Projeto
    await prisma.projeto.delete({ where: { id } });
    console.log(`  ✓ Projeto "${projeto.nome || id}" apagado.`);
  }

  console.log('\nTodos os projetos do admin foram apagados com sucesso!');
}

main().catch(e => {
  console.error('Erro:', e.message);
  process.exit(1);
}).finally(() => prisma.$disconnect());

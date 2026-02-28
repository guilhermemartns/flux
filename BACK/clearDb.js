const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  await prisma.resposta.deleteMany({});
  await prisma.simulado.deleteMany({});
  await prisma.materia.deleteMany({});
  await prisma.user.deleteMany({});
  console.log('Todos os dados foram apagados.');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });

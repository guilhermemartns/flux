// Script para criar usuário admin
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  try {
    // Hash da senha 'admin'
    const hashedPassword = await bcrypt.hash('admin', 10);

    // Verificar se o usuário já existe
    const existingUser = await prisma.user.findUnique({
      where: { email: 'admin@admin' }
    });

    if (existingUser) {
      // Atualizar usuário existente
      const updatedUser = await prisma.user.update({
        where: { email: 'admin@admin' },
        data: {
          senha: hashedPassword,
          role: 'admin',
          nome: 'Admin',
          apelido: 'Admin'
        }
      });
      console.log('Usuário admin atualizado:', updatedUser.email);
    } else {
      // Criar novo usuário admin
      const newUser = await prisma.user.create({
        data: {
          email: 'admin@admin',
          senha: hashedPassword,
          role: 'admin',
          nome: 'Admin',
          apelido: 'Admin'
        }
      });
      console.log('Usuário admin criado:', newUser.email);
    }

    console.log('\nCredenciais:');
    console.log('Email: admin@admin');
    console.log('Senha: admin');
    console.log('Role: admin');

  } catch (error) {
    console.error('Erro ao criar admin:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();

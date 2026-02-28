// Script para limpar todos os dados das coleções Projeto e Materia
// Execute com: node scripts/clearProjetosMaterias.js

const { MongoClient } = require('mongodb');
const uri = 'mongodb+srv://guilhermemartins06:aLayknXgNeDrQaME@users.xxk5j92.mongodb.net/Users?retryWrites=true&w=majority&appName=Users';
const dbName = 'Users';

async function main() {
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db(dbName);
  const projetos = await db.collection('Projeto').deleteMany({});
  const materias = await db.collection('Materia').deleteMany({});
  console.log('Projetos removidos:', projetos.deletedCount);
  console.log('Materias removidas:', materias.deletedCount);
  await client.close();
}
main();

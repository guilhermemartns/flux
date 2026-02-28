// Script para adicionar campo 'role' aos usuários existentes no MongoDB
const { MongoClient } = require('mongodb');
const uri = 'mongodb+srv://guilhermemartins06:aLayknXgNeDrQaME@users.xxk5j92.mongodb.net/Users?retryWrites=true&w=majority&appName=Users';
const client = new MongoClient(uri);

async function main() {
  await client.connect();
  const db = client.db('Users');
  const users = db.collection('User');
  await users.updateMany({}, { $set: { role: 'user' } });
  console.log('Campo role adicionado para todos os usuários.');
  await client.close();
}
main();

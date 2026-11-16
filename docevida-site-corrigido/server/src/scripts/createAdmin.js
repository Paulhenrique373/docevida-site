'use strict';
// Uso: ADMIN_USERNAME=maria ADMIN_PASSWORD='senha-longa-aqui' [ADMIN_ROLE=owner|staff] npm run admin:create
// A senha vem do ambiente (ou do prompt) e nunca é gravada em arquivo nem exibida.
const path = require('path');
const readline = require('readline');
const { loadConfig, loadDotEnv } = require('../config');
const { openDatabase } = require('../db');
const { createAuth } = require('../auth');

loadDotEnv(path.resolve(__dirname, '..', '..', '.env'));

function ask(question, hidden) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    if (hidden) {
      rl._writeToOutput = (s) => { if (s.includes(question)) process.stdout.write(question); };
    }
    rl.question(question, (a) => { rl.close(); if (hidden) process.stdout.write('\n'); resolve(a); });
  });
}

(async () => {
  const config = loadConfig();
  const db = openDatabase(config.databasePath);
  const auth = createAuth(db, config);
  const username = process.env.ADMIN_USERNAME || (await ask('Usuário: '));
  const password = process.env.ADMIN_PASSWORD || (await ask('Senha (mín. 10 caracteres): ', true));
  const role = process.env.ADMIN_ROLE || 'owner';
  try {
    const u = auth.createAdmin(username, password, role);
    console.log(`Administrador "${u}" criado com o perfil ${role}.`);
  } catch (e) {
    console.error(e.message.includes('UNIQUE') ? 'Este usuário já existe.' : e.message);
    process.exitCode = 1;
  }
  db.close();
})();

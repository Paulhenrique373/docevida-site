'use strict';
const path = require('path');
const { loadConfig, loadDotEnv } = require('./config');
const { openDatabase } = require('./db');
const { createApp } = require('./app');

loadDotEnv(path.resolve(__dirname, '..', '.env'));

let config;
try {
  config = loadConfig();
} catch (e) {
  console.error(`Configuração inválida: ${e.message}`);
  process.exit(1);
}

const db = openDatabase(config.databasePath);
const app = createApp(db, config);
app.locals.auth.purgeExpired();
setInterval(() => app.locals.auth.purgeExpired(), 60 * 60 * 1000).unref();

const server = app.listen(config.port, () => {
  console.log(`DoceVida API em http://localhost:${config.port} (${config.production ? 'produção' : 'desenvolvimento'})`);
});

const shutdown = () => server.close(() => { db.close(); process.exit(0); });
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

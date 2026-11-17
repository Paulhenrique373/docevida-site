'use strict';

const fs = require('fs');
const path = require('path');
const admin = require('firebase-admin');

function initializeFirebase(config) {
  const serviceAccountPath = path.resolve(
    __dirname,
    '..',
    config.firebaseServiceAccountPath
  );

  if (!fs.existsSync(serviceAccountPath)) {
    throw new Error('Arquivo de credenciais do Firebase não encontrado.');
  }

  const serviceAccount = JSON.parse(
    fs.readFileSync(serviceAccountPath, 'utf8')
  );

  if (serviceAccount.project_id !== config.firebaseProjectId) {
    throw new Error('O projeto das credenciais não corresponde à configuração.');
  }

  const app = admin.apps.length
    ? admin.app()
    : admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: config.firebaseProjectId
      });

  return admin.firestore(app);
}

module.exports = { initializeFirebase };

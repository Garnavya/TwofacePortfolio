import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import config from './config/env.js';
import apiRouter from './routes/api.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

app.use('/api', apiRouter);

if (config.nodeEnv === 'production') {
  const distPath = path.join(__dirname, '../dist');
  app.use(express.static(distPath));
}

app.listen(config.port, () => {
  console.log(`Express server listening on http://localhost:${config.port}`);
  if (config.nodeEnv === 'production') {
    console.log('Serving static files from /dist');
  } else {
    console.log('API only — frontend served by Vite dev server');
  }
});

import { createApp } from './app.js';
import { config } from './config.js';
import './workers/reportWorker.js';

const app = createApp();
app.listen(config.port, () => {
  console.log(`CS453 final starter server listening on http://localhost:${config.port}`);
});

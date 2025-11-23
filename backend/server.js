import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import { requireApiKey } from './middlewares/auth.js';
import generateRoutes from './routes/generateRoutes.js';
import configRoutes from './routes/configRoutes.js';
import aiRoutes from './routes/aiRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import assistantRoutes from './routes/assistantRoutes.js';
import llmTestRoutes from './routes/llmTestRoutes.js';
import authRoutes from './routes/authRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(bodyParser.json());
app.use(requireApiKey);

app.use('/api', authRoutes);
app.use('/api', adminRoutes);
app.use('/api', assistantRoutes);
app.use('/api', llmTestRoutes);
app.use('/api', generateRoutes);
app.use('/api', configRoutes);
app.use('/api', aiRoutes);

app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

app.listen(PORT, () => {
  console.log(`Henriktron backend running on port ${PORT}`);
});

import 'dotenv/config';
import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {GoogleGenAI} from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT ?? 3000);
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

function getServerGenieClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    throw new Error('服务端未配置 GEMINI_API_KEY，请在运行环境密钥设置中配置有效的付费 API Key。');
  }
  return new GoogleGenAI({
    apiKey,
    apiVersion: 'v1beta',
    httpOptions: {
      headers: {'User-Agent': 'aistudio-build'},
    },
  });
}

function parseErrorStatus(err: unknown): {status: number; message: string} {
  if (err && typeof err === 'object') {
    const maybeErr = err as {status?: number; message?: string};
    const msg = maybeErr.message ?? 'Genie 4 会话初始化失败。';
    if (typeof maybeErr.status === 'number' && maybeErr.status >= 400 && maybeErr.status < 600) {
      return {status: maybeErr.status, message: msg};
    }
    if (msg.includes('403') || msg.includes('PERMISSION_DENIED')) {
      return {status: 403, message: msg};
    }
    if (msg.includes('429') || msg.includes('RESOURCE_EXHAUSTED')) {
      return {status: 429, message: msg};
    }
    if (msg.includes('400') || msg.includes('API_KEY_INVALID')) {
      return {status: 400, message: msg};
    }
    if (msg.includes('GEMINI_API_KEY')) {
      return {status: 500, message: msg};
    }
    return {status: 502, message: msg};
  }
  return {status: 500, message: '未知服务端错误，请稍后重试。'};
}

async function startServer() {
  const app = express();
  app.use(express.json({limit: '1mb'}));

  app.get('/api/health', (_req, res) => {
    res.json({
      ok: true,
      configured: Boolean(process.env.GEMINI_API_KEY?.trim()),
      model: 'models/genie-4',
    });
  });

  app.post('/api/genie/session', async (_req, res) => {
    try {
      const serverAi = getServerGenieClient();
      const interaction = await serverAi.interactions.create({
        model: 'models/genie-4',
        api_version: 'v1beta',
      });
      const tokenResp = await serverAi.interactions.authTokens.create(
        interaction.id,
        {api_version: 'v1beta'},
      );

      if (!tokenResp.auth_token) {
        res.status(502).json({error: '未能获取 Genie 4 临时访问令牌。'});
        return;
      }

      res.json({
        interactionId: interaction.id,
        authToken: tokenResp.auth_token,
        maxDurationSeconds: 120,
      });
    } catch (err) {
      const {status, message} = parseErrorStatus(err);
      res.status(status).json({error: message});
    }
  });

  // Forward WebRTC SDP offer/answer strictly for Genie 4 :webrtc signaling using the
  // browser's ephemeral auth_token, avoiding preview iframe proxy path restrictions.
  app.post('/api/genie-signaling/v1beta/interactions/:target', async (req, res) => {
    const target = req.params.target;
    const match = /^([A-Za-z0-9_=-]+):webrtc$/.exec(target);
    if (!match) {
      res.status(400).json({error: {message: 'Invalid WebRTC signaling target.'}});
      return;
    }

    const interactionId = match[1];
    const authToken = req.header('x-goog-api-key')?.trim() ?? '';
    if (!authToken.startsWith('auth_tokens/')) {
      res.status(401).json({error: {message: 'Missing or invalid ephemeral Genie auth token.'}});
      return;
    }

    const offerSdp =
      req.body && typeof req.body === 'object' && typeof req.body.offer_sdp === 'string'
        ? req.body.offer_sdp
        : '';
    if (!offerSdp) {
      res.status(400).json({error: {message: 'Missing offer_sdp in request body.'}});
      return;
    }

    try {
      const upstreamUrl = `https://generativelanguage.googleapis.com/v1beta/interactions/${encodeURIComponent(interactionId)}:webrtc`;
      const upstream = await fetch(upstreamUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': authToken,
          'User-Agent': 'aistudio-build',
        },
        body: JSON.stringify({offer_sdp: offerSdp}),
      });

      const responseText = await upstream.text();
      res.status(upstream.status);
      res.setHeader('Content-Type', upstream.headers.get('content-type') ?? 'application/json');
      res.send(responseText);
    } catch (err) {
      const {status, message} = parseErrorStatus(err);
      res.status(status).json({error: {message}});
    }
  });

  if (!IS_PRODUCTION) {
    const {createServer} = await import('vite');
    const vite = await createServer({
      server: {middlewareMode: true},
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      const indexFile = path.join(distDir, 'index.html');
      if (fs.existsSync(indexFile)) {
        res.sendFile(indexFile);
      } else {
        res.status(404).send('Build output not found.');
      }
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Ares Horizon server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

import express from 'express';
import {
  createProxyMiddleware
} from 'http-proxy-middleware';
import rateLimiter from '../middleware/rateLimiter.middleware.js';

const router = express.Router();

// Basic healthcheck
router.get('/health', (req, res) => res.json({
  ok: true,
  service: 'gateway'
}));

// Proxy rules (adjust targets via env)
router.use(
  '/auth',
  rateLimiter,
  createProxyMiddleware({
    target: process.env.AUTH_SERVICE || 'http://localhost:8001',
    changeOrigin: true,
    pathRewrite: {
      '^/auth': ''
    },

    proxyTimeout: 5000,
    timeout: 5000,

    onError(err, req, res) {
      console.error('Auth proxy error:', err.message);
      res.status(502).json({
        message: 'Auth service unreachable'
      });
    },
  })
);

router.use(
  "/users",
  rateLimiter,
  createProxyMiddleware({
    target: process.env.AUTH_SERVICE || 'http://localhost:8001',
    changeOrigin: true,
  })
);

router.use('/chat', rateLimiter, createProxyMiddleware({
  target: process.env.CHAT_SERVICE || 'http://localhost:5001',
  changeOrigin: true,
  pathRewrite: {
    '^/chat': ''
  },
  onProxyReq: (proxyReq, req, res) => {
    if (req.user) proxyReq.setHeader('x-user-id', req.user.userId || req.user.id || '');
  }
}));

router.use('/media', rateLimiter, createProxyMiddleware({
  target: process.env.MEDIA_SERVICE || 'http://localhost:5002',
  changeOrigin: true,
  pathRewrite: {
    '^/media': ''
  }
}));

export default router;



import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import routes from './routes';

const app = express();
const port = Number(process.env.PORT) || 5000;

// Behind a reverse proxy (Nginx, Heroku, Cloudflare, etc.) client IP needs to be verified accurately.
if (process.env.TRUST_PROXY) {
  const trustVal = process.env.TRUST_PROXY === 'true' 
    ? true 
    : (isNaN(Number(process.env.TRUST_PROXY)) ? process.env.TRUST_PROXY : Number(process.env.TRUST_PROXY));
  app.set('trust proxy', trustVal);
} else if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1); // Trust first hops (standard load balancers)
}

// 1. Enable Helmet to configure standard security HTTP headers
app.use(helmet());

// Disable x-powered-by header explicitly (in addition to helmet)
app.disable('x-powered-by');

// 2. Configure CORS Allowlist from environment variables
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
  : ['http://localhost:5173']; // default local dev server

app.use(cors({
  origin: (origin, callback) => {
    // Allow server-to-server or test requests without origin
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
      callback(null, true);
    } else {
      callback(new Error('Blocked by CORS policy: origin not allowed.'));
    }
  },
  credentials: true,
}));

// 3. Configure Request Size Limits (protect against body-payload Denial of Service attacks)
app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ limit: '100kb', extended: true }));

// 4. Rate Limiting Middleware Definitions
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes window
  max: 100, // Limit each IP to 100 auth attempts per window
  standardHeaders: true, // Return rate limit info in standard headers
  legacyHeaders: false,
  message: {
    error: 'Too many authentication attempts',
    message: 'Too many login or signup attempts from this IP, please try again after 15 minutes.',
  },
});

const paymentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes window
  max: 50, // Limit each IP to 50 payment transactions per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many payment requests',
    message: 'Payment attempt threshold reached, please try again after 15 minutes.',
  },
});

// Apply Rate Limiters to Auth and Payment routes before they get resolved
app.use('/api/auth', authLimiter);
app.use('/api/users/login', authLimiter);
app.use('/api/users/signup', authLimiter);
app.use('/api/payments', paymentLimiter);

// Mount API routes
app.use('/api', routes);

app.get('/', (req, res) => {
  res.send('Rental System PostgreSQL API is running!');
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Server is listening on http://0.0.0.0:${port} (all interfaces)`);
});

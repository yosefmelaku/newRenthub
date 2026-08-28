


import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import routes from './routes';

const app = express();
const port = Number(process.env.PORT) || 5000;

app.use(cors());
app.use(express.json());

// Mount API routes
app.use('/api', routes);

app.get('/', (req, res) => {
  res.send('Rental System PostgreSQL API is running!');
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Server is listening on http://0.0.0.0:${port} (all interfaces)`);
});

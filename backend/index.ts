


import express from 'express';
import cors from 'cors';
import routes from './routes';

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Mount API routes
app.use('/api', routes);

app.get('/', (req, res) => {
  res.send('Rental System PostgreSQL API is running!');
});

app.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});

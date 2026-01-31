import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import {apiHandler as handler} from './main.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || '';
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://test.hostlyflorence.it',
  credentials: true
};
app.use(cors(corsOptions));
app.use(express.json());

app.use(handler);

app.listen(PORT, HOST, () => {
  console.log(`Server is running on port ${PORT}`);
});


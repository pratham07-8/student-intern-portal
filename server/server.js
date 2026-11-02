import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import requestFormRouter from './routes/RequestFormRoute.js';
import authRouter from './routes/AuthRoute.js';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.use('/auth', authRouter);
app.use('/Review', requestFormRouter);

app.get('/', (req, res) => {
    res.send('Student Intern Portal Backend is live 🚀');
});

app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK', message: 'Student Intern Portal API Server is running' });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`[SERVER] Student Intern Portal backend running on http://localhost:${PORT}`);
});

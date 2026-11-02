import express from 'express';
import { signup, login, verifyOTP } from '../controllers/AuthController.js';

const authRouter = express.Router();

authRouter.post('/signup', signup);
authRouter.post('/login', login);
authRouter.post('/verify-otp', verifyOTP);

export default authRouter;

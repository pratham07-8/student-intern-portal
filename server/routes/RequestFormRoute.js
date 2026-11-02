import express from 'express';
import { submit, getRequests, takeAction, deleteRequest } from '../controllers/RequestController.js';
import { authenticateToken } from '../middleware/auth.js';

const requestFormRouter = express.Router();

requestFormRouter.post('/', authenticateToken, submit);
requestFormRouter.get('/', authenticateToken, getRequests);
requestFormRouter.post('/:id/action', authenticateToken, takeAction);
requestFormRouter.delete('/:id', authenticateToken, deleteRequest);

export default requestFormRouter;



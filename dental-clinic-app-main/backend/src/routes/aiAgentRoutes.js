import { Router } from 'express';
import { authorize } from '../middleware/authMiddleware.js';
import { chat, createThread, getUsage, getChartData } from '../controllers/aiAgentController.js';
import { patientChat, createThread as patientCreateThread } from '../controllers/patientAiController.js';

const router = Router();

// --- Admin AI Routes ---
router.post('/create-thread', authorize(['admin']), createThread);
router.post('/chat', authorize(['admin']), chat);
router.get('/usage', authorize(['admin']), getUsage);
router.get('/charts', authorize(['admin']), getChartData);

// --- Patient AI Routes ---
// Patients use these routes to talk to their specific Assistant
router.post('/patient/create-thread', authorize(['patient']), patientCreateThread);
router.post('/patient/chat', authorize(['patient']), patientChat);

export default router;
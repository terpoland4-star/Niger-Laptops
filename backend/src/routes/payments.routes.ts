import { Router } from 'express';
import { PaymentsController } from '../controllers/payments.controller';
import { authenticateCustomer } from '../middleware/auth';

const router = Router();

router.post('/initiate', authenticateCustomer, PaymentsController.initiate);
router.get('/status/:orderId', authenticateCustomer, PaymentsController.checkStatus);

// Webhooks
router.post('/webhook/orange', PaymentsController.orangeWebhook);
router.post('/webhook/airtel', PaymentsController.airtelWebhook);
router.post('/webhook/mynita', PaymentsController.mynitaWebhook);
router.post('/webhook/amanata', PaymentsController.amanataWebhook);
router.post('/webhook/card', PaymentsController.cardWebhook);

// Callback
router.get('/callback/orange', PaymentsController.callback);
router.get('/callback/airtel', PaymentsController.callback);
router.get('/callback/mynita', PaymentsController.callback);
router.get('/callback/amanata', PaymentsController.callback);
router.get('/callback/card', PaymentsController.callback);

export default router;

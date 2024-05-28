import { Router } from 'express';
import { createPayment, webhook } from '../controllers/payment.controllers.js';
const router =  Router();


router.post('/createPayment',[
], createPayment);  


router.post('/webhook',[
], webhook);  



export default router;

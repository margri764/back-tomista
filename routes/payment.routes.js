import { Router } from 'express';
import { createPayment, deletePayment, getAllPayment, refundPayment, webhook } from '../controllers/payment.controllers.js';
const router =  Router();


router.post('/createPayment',[
], createPayment);  


router.get('/getAllPayments',[
], getAllPayment);  


router.post('/webhook',[
], webhook);  


router.post('/refundPayment',[
], refundPayment);  

router.delete('/deletePayment/:id',[
], deletePayment);  



export default router;

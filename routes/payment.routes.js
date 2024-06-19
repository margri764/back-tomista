import { Router } from 'express';
import { captureOrder, changeStatus, createPayment, deletePayment, getAllPayment, refoundIuguPayment, refoundPaypalPayment, webhook } from '../controllers/payment.controllers.js';
const router =  Router();


router.post('/createPayment',[
], createPayment);  

router.get('/getAllPayments',[
], getAllPayment);  

router.post('/webhook',[
], webhook);  


router.post('/refoundIuguPayment',[
], refoundIuguPayment);  

router.delete('/deletePayment/:id',[
], deletePayment);  

router.patch('/changeStatus/:id',[
], changeStatus);  

// paypal
router.get("/capture-order",[
], captureOrder);

router.post("/refoundPaypalPayment/:id",[
], refoundPaypalPayment);



export default router;

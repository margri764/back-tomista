import { Router } from 'express';
import { createInscription } from '../controllers/inscription.controllers.js';
const router =  Router();



router.put('/createInscription',[
], createInscription);  





export default router;

import { Router } from 'express';
import {check} from 'express-validator';
const router =  Router();
// import  { query} from 'express-validator';
// import { adminRole } from '../middlewares/check-role.js';
import { validateEmail, login, resendPassword, signUp, adminContactUs } from '../controllers/auth.controllers.js';


router.post('/login',[
], login);  

router.post('/signUp',[
], signUp);  


router.post('/validateEmail',[
], validateEmail); 

router.post('/resendPassword',[
], resendPassword); 

router.post('/adminContactUs',[
], adminContactUs); 



export default router;

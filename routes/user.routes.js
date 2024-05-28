import { Router } from 'express';
import { createProfile, getUserByEmail } from '../controllers/user.controllers.js';
const router =  Router();



router.post('/createProfile',[
], createProfile);  

router.get('/getUserByEmail',[
], getUserByEmail);  



export default router;

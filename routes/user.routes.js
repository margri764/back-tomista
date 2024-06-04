import { Router } from 'express';
import { activePauseUser, changeRole, createProfile, deleteUserById, getAllUsers, getUserByEmail } from '../controllers/user.controllers.js';
const router =  Router();



router.post('/createProfile',[
], createProfile);  

router.get('/getUserByEmail',[
], getUserByEmail);  

router.get('/getAllUsers',[
], getAllUsers);  


router.patch('/deleteUserById/:id',[
], deleteUserById);  

router.patch('/activePauseUser/:id',[
], activePauseUser);  


router.patch('/changeRole/:id',[
], changeRole);  



export default router;

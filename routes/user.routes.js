import { Router } from 'express';
import { activePauseUser, changeRole, createProfile, deleteUserById, getAllUsers, getProgramByConferenceId, getUserByEmail, uploadProgram } from '../controllers/user.controllers.js';
const router =  Router();



router.post('/createProfile',[
], createProfile);  

router.get('/getUserByEmail',[
], getUserByEmail);  

router.get('/getAllUsers',[
], getAllUsers);  


router.delete('/deleteUserById/:id',[
], deleteUserById);  


router.patch('/activePauseUser/:id',[
], activePauseUser);  


router.patch('/changeRole/:id',[
], changeRole);  

router.post('/uploadProgram',[
], uploadProgram);  

router.get('/getProgramByConferenceId/:id',[
], getProgramByConferenceId);  




export default router;

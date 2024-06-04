import { Router } from 'express';
import { deleteNotificationById, getAllNotifications, markNotificationRead } from '../controllers/notification.controllers.js';
const router =  Router();


router.get('/getAllNotifications',[
], getAllNotifications);  


router.delete('/deleteNotificationById/:id',[
], deleteNotificationById);  

router.patch('/markNotificationRead/:id',[
], markNotificationRead);  



export default router;

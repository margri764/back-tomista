import { Router } from 'express';
import { bulkMarkNotificationRead, deleteAllNotifications, deleteNotificationById, getAllNotifications, getAllNotificationsUnread, markNotificationRead } from '../controllers/notification.controllers.js';
const router =  Router();


router.get('/getAllNotifications',[
], getAllNotifications);  

router.get('/getAllNotificationsUnread',[
], getAllNotificationsUnread);  

router.delete('/deleteNotificationById/:id',[
], deleteNotificationById);  

router.delete('/deleteAllNotifications',[
], deleteAllNotifications);  

router.patch('/markNotificationRead/:id',[
], markNotificationRead);  

router.patch('/bulkMarkNotificationRead',[
], bulkMarkNotificationRead);  



export default router;

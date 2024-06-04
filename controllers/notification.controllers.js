
import { sendProfileToAdmin } from "../config/createdProfile.js";
import  { pool }  from "../db/config.db.js";




const getAllNotifications = async (req, res = response) => {

  
  try {
    

    const [notifications] = await pool.execute(`
    SELECT 
    notification.*,
    user.fullName,
    user.email,
    user.filePath,
    user.iduser AS iduser
    FROM notification
    INNER JOIN user ON notification.iduser = user.iduser
    WHERE notification.state = 1 AND notification.status = 'active'
    `);
    

     return res.status(200).json({
       success: true,
       notifications: notifications,
       
     });
 
  
  } catch (error) {
    console.log('Error desde getAllNotifications:', error);

    let errorMessage = 'Algo deu errado, por favor, entre em contato com o administrador';

    res.status(500).json({
      success: false,
      error: errorMessage,
    });
  }
};

const deleteNotificationById = async (req, res = response) => {

  
  try {

    const id = req.params.id;

    const [notifications] = await pool.execute(`DELETE FROM  notification WHERE idnotification = ?`, [id]);
    

     return res.status(200).json({
       success: true,
       
     });
 
  
  } catch (error) {
    console.log('Error desde deleteNotificationById:', error);

    let errorMessage = 'Algo deu errado, por favor, entre em contato com o administrador';

    res.status(500).json({
      success: false,
      error: errorMessage,
    });
  }
};

const markNotificationRead = async (req, res = response) => {
  
  try {

    const id = req.params.id;

    const [result] = await pool.execute(`UPDATE notification SET status = 'read' WHERE idnotification = ?`, [id]);

    if (result.affectedRows === 0) {
        return res.status(404).json({
        success: false,
        message: "Notification not found"
        });
    }else{
        return res.status(200).json({
        success: true,
        });

    }
    
  } catch (error) {
    console.log('Error desde markNotificationRead:', error);

    let errorMessage = 'Algo deu errado, por favor, entre em contato com o administrador';

    res.status(500).json({
      success: false,
      error: errorMessage,
    });
  }
};




export { 
        getAllNotifications,
        deleteNotificationById,
        markNotificationRead

       }


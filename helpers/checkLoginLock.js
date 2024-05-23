
import { pool } from "../db/config.db.js";

export const checkLoginLock = async (email) => {

    const LOCK_TIME = 15 * 60 * 1000; // 15 minutos en milisegundos
    const lockCheckQuery = 'SELECT timestamp FROM loginattempt WHERE email = ? ORDER BY timestamp DESC LIMIT 1;';
    const deleteEntriesQuery = 'DELETE FROM loginattempt WHERE email = ?;';

  
    try {
        
      const [rows] = await pool.execute(lockCheckQuery, [email]);
  
      if (rows.length > 0) {
        const lastAttemptTimestamp = new Date(rows[0].timestamp).getTime();
        const currentTime = new Date().getTime();
        const elapsedTime = currentTime - lastAttemptTimestamp;
  
        if (elapsedTime < LOCK_TIME) {
          return LOCK_TIME - elapsedTime; // Devuelve el tiempo restante en milisegundos
        }else{
          await pool.execute(deleteEntriesQuery, [email]);
        }

      }

      return 0; // No hay bloqueo o ha pasado suficiente tiempo

    } catch (error) {
      console.error('Error al verificar el bloqueo de inicio de sesión:', error);
      throw error; // Re-lanza el error para que pueda ser manejado por el llamador, si es necesario.
    }
  };
  
  
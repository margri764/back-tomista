import { pool } from "../db/config.db.js";

export const insertLoginAttempt = async (email) => {
  const insertAttemptQuery = 'INSERT INTO loginattempt (email, timestamp) VALUES (?, ?);';

  try {
    const currentTimestamp = new Date();
    await pool.execute(insertAttemptQuery, [email, currentTimestamp]);
  } catch (error) {
    console.error('Error al insertar intento de inicio de sesión:', error);
    throw error; // Re-lanza el error para que pueda ser manejado por el llamador, si es necesario.
  }
};

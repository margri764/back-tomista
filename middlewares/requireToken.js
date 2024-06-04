
import jwt from 'jsonwebtoken';
import  { pool }  from "../db/config.db.js";



export const requireToken = async (req, res, next) => {
    try {
      let token = req.headers?.authorization;
  
      if (!token) {
        return res.status(401).json({
          message: 'Não foi fornecido nenhum token no cabeçalho. Por favor, faça login novamente com suas credenciais'
        });
      }
  
      token = token.split(" ")[1];
  
      const { email } = jwt.verify(token, "thisismyprivatekey");
      let userAuth = null;
  
      const [rows] = await pool.execute('SELECT * FROM user WHERE email = ? LIMIT 1', [email]);
      userAuth = rows.length > 0 ? rows[0] : null;
  
      if (!userAuth) {
        return res.status(400).json({
          message: 'Token inválido.'
        });
      }
  
      req.userAuth = userAuth;

      const { password, iduser, address, phone, profession, state, status, timestamp, ...rest } = userAuth;

      const userWithout = rest;

      return res.status(200).json({
        message: 'Token válido.',
        user: userWithout
      });

    } catch (error) {
      console.log('Error en requireToken:', error);
      return res.status(401).json({
        success: false,
        error: error.message || 'No se pudo verificar el token.'
      });
    }
  }
  

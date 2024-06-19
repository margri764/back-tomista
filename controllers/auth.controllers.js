
import  { pool }  from "../db/config.db.js";
import { generateRandomCode } from "../helpers/generateRandomCode.js";
import { verifyEmail } from "../config/verify-email.js";
import { resendEmailPassword } from "../config/resend-password.js";
import  { insertLoginAttempt }  from "../helpers/insertLoginAttempt.js";
import  { checkLoginLock }  from "../helpers/checkLoginLock.js";
import { checkUserStates } from "../helpers/checkUserStates.js";
import { sendAdminEmail } from "../config/adminEmailContactUs.js";
import { generateToken } from "../helpers/tokenManager.js";


const login = async (req, res = response) => {

    const MAX_LOGIN_ATTEMPTS = 3;
    const LOCK_TIME = 15 * 60 * 1000;
  
    const { email, password } = req.body;

    let user;

    try {

      const [rows] = await pool.execute('SELECT * FROM account WHERE email = ?', [email]);
      
      user = rows[0];

      // si ya esta verificado me cambio a "user"

      const [accountVerified] = await pool.execute('SELECT * FROM user WHERE email = ?', [email]);

      if(accountVerified.length > 0){
        user = accountVerified[0];

        if(user.status !== 'active' ){
          return res.status(400).json({
            success: false,
            message: "Sua conta não está ativa."
          })
        }

      }

       if (!user || user.password !== password) {
        await insertLoginAttempt(email);
        return res.status(401).json({
          success: false,
          message: 'Credenciais incorretas',
        });
      }

      const lockTime = new Date(Date.now() - LOCK_TIME);

      const sqlAttemptsQuery = 'SELECT * FROM loginattempt WHERE email = ? AND timestamp >= ?;';
      const [loginRows] = await pool.execute(sqlAttemptsQuery, [email, lockTime]);
      // const remainingAttempts = MAX_LOGIN_ATTEMPTS - loginRows.length;

  
      if (loginRows.length >= MAX_LOGIN_ATTEMPTS) {

        const remainingLockTime = await checkLoginLock(email);

        if (remainingLockTime > 0) {
          const minutesRemaining = Math.ceil(remainingLockTime / (60 * 1000)); // Redondea hacia arriba
          return res.status(429).json({
            success: false,
            message: `Você excedeu o limite de tentativas de login. Por favor, aguarde ${minutesRemaining} minutos antes de tentar novamente`,
          });
        }
  
      }

      const deleteAttemptsQuery = 'DELETE FROM loginattempt WHERE email = ?;';
      await pool.execute(deleteAttemptsQuery, [email]);



      //si llega hasta aca es xq tiene todo en orden y deberia verificar su cuenta

      if(user.validateEmail === 'UNVERIFIED'){

      const updatedUser = { validateEmail : 'VERIFIED'}
 
      await pool.query('UPDATE account set ? WHERE email = ?', [updatedUser, email]);

    }

      const token = await generateToken(email);

      let userWithoutpassword = {...user, password};
      user = userWithoutpassword;

      return res.status(200).json({
        success: true,
        user,
        token
      });

    
    } catch (error) {
      console.log('Error desde Login:', error);

      let errorMessage = 'Algo deu errado, por favor, entre em contato com o administrador';

      // Verifica si el error es de conexión 
      if (error.message.includes('ETIMEDOUT')) {
          errorMessage = 'Ocorreu um erro fora do nosso sistema, por favor, tente novamente mais tarde';
        }

      res.status(500).json({
        success: false,
        error: errorMessage,
      });
    }
};

const signUp = async (req, res) => {

  try {
  const { email } = req.body;

  if (email !== '' && email !== null) {
    const [result] = await pool.query('SELECT * FROM account WHERE email = ?', [email]);

    if (result.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'E-mail já em uso. Por favor, escolha um diferente'
      });
    }
  }

  // genera codigo 6
  const generateCode = await generateRandomCode();


  const userToInsert = {
    email: email, 
    password: generateCode,
  }

// envia email y codigo de 50 digitos para q podamos verificar su cuenta
  await verifyEmail(email, generateCode);

  await pool.query('INSERT INTO account SET ?', [userToInsert]);


  return res.status(200).json({
    success: true,
    message: 'E-mail e código enviados com sucesso'
  });

  } catch (error) {

    console.log('signUp Error: ', error);
    let errorMessage = 'Algo deu errado, por favor, entre em contato com o administrador';

      errorMessage = error.message;
    return res.status(500).json({
    success: false,
    error: errorMessage
    });
  }
};

//una vez q el usuario ingresa al link que le mandamos, cambia su estado a "verified"
const validateEmail = async (req, res) => {
    
  try {
     
     const { email, code } = req.body;

     const [rows] = await pool.execute('SELECT * FROM account WHERE email = ?', [email]);
     const userToConfirm = rows[0];

    const check = await checkUserStates(email);
    
    if(!check){
      return
    }

    // por si intenta verificar dos veces el mismo email
    if(userToConfirm.validateEmail === 'VERIFIED'){
      return res.status(200).json({
        success: false,
        message: 'Sua conta já está verificada. Por favor, vá para o login',
      });

     }

    if (userToConfirm.password !== code) {
      return res.status(401).json({
        success: false,
        message: 'Credenciais incorretas',
      });
    }
      
    userToConfirm.validateEmail = 'VERIFIED';

    // Actualizar el usuario
    const [result] = await pool.query('UPDATE user set ? WHERE email = ?', [userToConfirm, email]);

    if (result.affectedRows === 0) {
      return res.status(500).json({
        success: false,
        error: "Falha ao atualizar usuário.",
      });
    }

    const newProfile = {
      email : userToConfirm.email,
      password: userToConfirm.code
      
    }

    // crea el perfil con los datos minimos
    const [user] = await pool.query('INSERT into user set ? ', [newProfile]);

    if (user.affectedRows === 0) {
      return res.status(500).json({
        success: false,
        error: "Falha ao criar usuário.",
      });
    }



  return res.status(200).json({
      success: true,
      message: 'E-mail verificado com sucesso',
      user: user
    
  });

     
  } catch (error) {
      console.log("Error desde validateEmail ", error);

      let errorMessage = 'Algo deu errado, por favor, entre em contato com o administrador';
      

      if (
        error.message.includes('O e-mail já está verificado') ||
        error.message.includes('Usuário não encontrado') ||
        error.message.includes('Usuário excluído') 
      ) {
        errorMessage = error.message;
      }

      return res.status(500).json({
          success: false,
          error: errorMessage
      });
  }
}

const resendPassword = async (req, res) => {

  try {

      const { email }  = req.body;

      const [rows] = await pool.execute('SELECT * FROM user WHERE email = ?', [email]);
      const user = rows[0];

      await checkUserStates(email)


     if(user){
      if(user.validateEmail ==='UNVERIFIED'  ) {
        return res.status(400).json({
          success: false,
          message: 'Usuário não verificado'
        })
      }
    }
    //  envia password de 12 digitos
     const genPassword = await generateRandomCode();

    
     const userToUpdate = {
       password: genPassword,
     };
   
     
      await resendEmailPassword(email, genPassword);


      const [result] = await pool.query('UPDATE user set ? WHERE email = ?', [userToUpdate, email]);
  
      if (result.affectedRows === 0) {
        return res.status(500).json({
          success: false,
          error: "Falha ao atualizar usuário.",
        });
      }

      const [updatedUserResult] = await pool.query('SELECT * FROM user WHERE email = ?', [email]);

      if (updatedUserResult.length <= 0) {

        return res.status(500).json({
          success: false,
          error: 'Falha ao atualizar usuário..'
        });

      }else{

        const updatedUser = updatedUserResult[0];
      
        return res.status(200).json({
          success: true,
          user: updatedUser
        });
      }

  } catch (error) {
      console.log("Error resendPassword: ", error);

      let errorMessage = 'Algo deu errado, por favor, entre em contato com o administrador';
    if (
      error.message.includes('O e-mail já está verificado') ||
      error.message.includes('Usuário não encontrado') ||
      error.message.includes('Usuário excluído') 
    ) {
      errorMessage = error.message;
    }
    return res.status(500).json({
        success: false,
        error: errorMessage
    });
    
  }
}

// el codigo le manda a un solo admin, eso hay q hablarlo con jonas
const adminContactUs = async (req, res=response) => {

  try {

      const body  = req.body;

      let arrEmails = [];

      const [rows] = await pool.execute('SELECT * FROM user WHERE role IN (?, ?, ?)', ["webmaster", "admin", "super_admin"]);
    

      if(rows.length === 0){
        return res.status(400).json({
          success: false,
          message: 'Nenhum usuário encontrado com a função de administrador o webmaster.'
        })
      }else{

        rows.forEach( (user)=>{ arrEmails.push(user.email)})
      }
   

      for (const email of arrEmails) {
        await sendAdminEmail(body, email);
      }
  
        return res.status(200).json({
          success: true,
         
        });

  } catch (error) {

    let errorMessage = 'Algo deu errado, por favor, entre em contato com o administrador';
    console.log("Error resendPassword: ", error);
    
    return res.status(500).json({
        success: false,
        error: errorMessage
    });
    
  }
}


  export { 
            login,
            signUp,
            validateEmail,
            resendPassword,
            adminContactUs
          }



import  { pool }  from "../db/config.db.js";


const createInscription = async (req, res = response) => {

    const { email, ...rest } = req.body;
    console.log(req.body);

    let user;

    try {

      const [rows] = await pool.execute('SELECT * FROM user WHERE email = ?', [email]);

      user = rows[0];

      if (!user) {
       return res.status(401).json({
         success: false,
         message: 'Usuário não encontrado',
       });
     }else if(user.validateEmail === "UNVERIFIED"){
       return res.status(400).json({
         success: false,
         message: 'Usuário não verificado',
       });
     }

     const updatedUser = {
        ...rest,
        
     }
     console.log('updatedUser:', updatedUser);

     await pool.query('UPDATE user set ? WHERE email = ?', [updatedUser, email]);
 

      return res.status(200).json({
        success: true,
   
      });



   
    
    } catch (error) {
      console.log('Error desde createInscription:', error);

      let errorMessage = 'Algo deu errado, por favor, entre em contato com o administrador';

      res.status(500).json({
        success: false,
        error: errorMessage,
      });
    }
};

export { 
        createInscription,
       }


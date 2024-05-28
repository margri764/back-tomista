
import  { pool }  from "../db/config.db.js";
import { uploadFile } from "../helpers/fileUpload.js";


const createProfile = async (req, res = response) => {

    const body = JSON.parse(req.body.body);

    console.log('body: ', body);

    const { email, ...rest } = body;

    let user;

    try {

      const [rows] = await pool.execute('SELECT * FROM account WHERE email = ?', [email]);

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

     let uploadedFile = null;
     if (req.files && req.files.file) {
      uploadedFile = await uploadFile(req.files.file, 'profilePicture' );
    }
      

     let updatedUser = {
        ...rest,
        filePath: (uploadedFile) ? uploadedFile.filePath : null,
        email: user.email, // quiero q siempre se conserve el email original
        
     }

     //puede editar los datos (es muy raro q pase)
     console.log('updatedUser:', updatedUser);

     const [createdProfile] = await pool.execute('SELECT * FROM user WHERE email = ?', [email]);

     if(createdProfile.length > 0){ // se trata de un update
      await pool.query('UPDATE user set ? WHERE email = ?', [updatedUser, email]);
     }else{
      updatedUser = { ...updatedUser, password : user.password  }
      await pool.query('INSERT INTO user set ?', [updatedUser, email]);
     }
 

      return res.status(200).json({
        success: true,
   
      });



   
    
    } catch (error) {
      console.log('Error desde createProfile:', error);

      let errorMessage = 'Algo deu errado, por favor, entre em contato com o administrador';

      res.status(500).json({
        success: false,
        error: errorMessage,
      });
    }
};

const getUserByEmail = async (req, res = response) => {

  
  try {
    
    const  email  = req.query.email;

     // Validar que el email esté presente
     if (!email) {
      return res.status(400).json({
        success: false,
        message: 'El parámetro email es obligatorio',
      });
    }

    const [rows] = await pool.execute('SELECT * FROM user WHERE email = ?', [email]);
    
    let user = rows[0];


    if (!user) {
     return res.status(200).json({
       success: false,
       message: 'no profile',
     });
   }else{

    // Buscar el iduser en la tabla payment
    const [paymentRows] = await pool.execute('SELECT * FROM payment WHERE iduser = ?', [user.iduser]);


    let conferenceRows = null;

    if(paymentRows.length > 0){

      // Si el usuario tiene pagos, obtener el idconference de la tabla payment
      const idconference = paymentRows[0].idconference;
  
      // Buscar la conferencia correspondiente en la tabla conference
      conferenceRows = await pool.execute('SELECT * FROM conference WHERE idconference = ?', [idconference]);
    }



     return res.status(200).json({
       success: true,
       user: rows[0],
       conference: (conferenceRows.length > 0) ? conferenceRows[0] : null,
       payment: (paymentRows.length > 0) ? paymentRows[0] : null,
     });
   }
 
  
  } catch (error) {
    console.log('Error desde getUserByEmail:', error);

    let errorMessage = 'Algo deu errado, por favor, entre em contato com o administrador';

    res.status(500).json({
      success: false,
      error: errorMessage,
    });
  }
};


export { 
        createProfile,
        getUserByEmail
       }


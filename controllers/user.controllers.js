
import { sendProfileToAdmin } from "../config/createdProfile.js";
import  { pool }  from "../db/config.db.js";
import { uploadFile } from "../helpers/fileUpload.js";


const createProfile = async (req, res = response) => {

    const body = JSON.parse(req.body.body);

    const { email, filePath, ...rest } = body;


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
      uploadedFile = await uploadFile(req.files.file, 'profileTomista' );
    }
      

     let updatedUser = {
        ...rest,
        filePath: (uploadedFile) ? uploadedFile.filePath : filePath,
        email: user.email, // quiero q siempre se conserve el email original
     }

     //puede editar los datos (es muy raro q pase, si edita no se envia email)
       const [createdProfile] = await pool.execute('SELECT * FROM user WHERE email = ?', [email]);

     if(createdProfile.length > 0){ // se trata de un update
      await pool.query('UPDATE user set ? WHERE email = ?', [updatedUser, email]);
      
      return res.status(200).json({
        success: true,
      });ñ

     }else{

      updatedUser = { ...updatedUser, password : user.password  }

      const [result] = await pool.query('INSERT INTO user set ?', [updatedUser, email]);

       const insertId = result.insertId;
     
      const [userFound] = await pool.query('SELECT * FROM user WHERE iduser = ?', [insertId]);

      user = userFound[0];
     
      //una vez q se completo el perfil se le envia email a los admin
      const [admins] = await pool.execute('SELECT * FROM user WHERE role IN (?, ?, ?)', ["webmaster", "admin", "super_admin"]);
      
      
      let arrEmails = []; 
      if(admins.length === 0){
        return res.status(400).json({
          success: false,
          message: 'Nenhum usuário encontrado com a função de administrador o webmaster.'
          })
        }else{
          admins.forEach( (user)=>{ arrEmails.push(user.email)})
        }
        const bodyToAdmin = {
            fullName: body.fullName,
            email: email,
            address: body.address,
            phone: body.phone
        }

        for (const email of arrEmails) {
          await sendProfileToAdmin(bodyToAdmin, email);
        }

        //creo la notification

        const newNotification = {
          iduser: user.iduser,
          typeNotification: 'new-profile'
        }

        const [notificacion] = await pool.query('INSERT INTO notification set  ?',[newNotification])


        return res.status(200).json({
          success: true,
        });
      }

    
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

    //esto esta para la primera ver q entra xq todavia no se creo la cuenta
    if(rows.length === 0){
      const [rowsAccount] = await pool.execute('SELECT * FROM account WHERE email = ?', [email]);
      user = rowsAccount[0];

      const {password, timestamp, validateEmail, idaccount, ...rest} = rowsAccount[0];
      user = {...rest, noProfileYet:true}

      if (user) {
        return res.status(200).json({
          success: true,
          user,
          conference:  null,
          payment: null,
        });
      }
    }


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

      const { password, state, status, timestamp, ...rest } = rows[0];
      const userRef = {...rest, noProfileYet:false};



     return res.status(200).json({
       success: true,
       user: userRef,
       conference: (conferenceRows && conferenceRows.length > 0) ? conferenceRows[0] : null,
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

const getAllUsers = async (req, res = response) => {

  
  try {
    

    const [rows] = await pool.execute('SELECT * FROM user WHERE state = 1');
    
    let sanitizedUsers = [];
    if(rows.length > 0){
      sanitizedUsers = rows.map(({ password, ...rest }) => rest);
    }

     return res.status(200).json({
       success: true,
       users: sanitizedUsers,
       
     });
 
  
  } catch (error) {
    console.log('Error desde getAllUsers:', error);

    let errorMessage = 'Algo deu errado, por favor, entre em contato com o administrador';

    res.status(500).json({
      success: false,
      error: errorMessage,
    });
  }
};

const deleteUserById = async (req, res = response) => {

  
  try {
    
    const id = req.params.id;

    const [existingUser] = await pool.query('SELECT * FROM user WHERE iduser = ?', [id]);


    if(existingUser.length < 0){
      return res.status(400).json({
         success: false,
         message: "Usuário não encontrado"
        })
    }else{

      await pool.query('DELETE FROM user WHERE iduser = ?', [id]);
      await pool.query('DELETE FROM account WHERE email = ?', [existingUser[0].email]);

  
       return res.status(200).json({
         success: true,
       });
   
    }

  
  } catch (error) {
    console.log('Error desde deleteUserById:', error);

    let errorMessage = 'Algo deu errado, por favor, entre em contato com o administrador';

    res.status(500).json({
      success: false,
      error: errorMessage,
    });
  }
};

const activePauseUser = async (req, res) => {
    
  try {

    const id = req.params.id;
    const action = req.query.action;

    const [existingUser] = await pool.query('UPDATE user SET status = ? WHERE iduser = ?', [action, id]);

    if (existingUser.affectedRows === 0) {
      return res.status(500).json({
        success: false,
        message: "Não foi possível atualizar o usuário.",
      });
    }
  
    return res.status(200).json({
      success: true,
    });

  } catch (error) {
    console.log('activePauseUser Error:', error);
    let errorMessage = 'Algo deu errado, por favor, entre em contato com o administrador';

    res.status(500).json({
      error: errorMessage,
    });
  }
};

const changeRole = async (req, res = response) => {

  
  try {
    
    const id = req.params.id;
    const {role} = req.body;


    const [existingUser] = await pool.query('SELECT * FROM user WHERE iduser = ?', [id]);


    if(existingUser.length < 0){
      return res.status(400).json({
         success: false,
         message: "Usuário não encontrado"
        })
    }else{

      const updatedUser = { role : role }

      const [rows] = await pool.query('UPDATE user set ? WHERE iduser = ?',[updatedUser, id ]);

  
       return res.status(200).json({
         success: true,
         users: rows[0],
         
       });
   
    }


  
  } catch (error) {
    console.log('Error desde changeRole:', error);

    let errorMessage = 'Algo deu errado, por favor, entre em contato com o administrador';

    res.status(500).json({
      success: false,
      error: errorMessage,
    });
  }
};

const uploadProgram = async (req, res = response) => {
  
  try {

    const body = JSON.parse(req.body.body);

    const { idconference } = body;

    console.log('req.files: ', req.files);
    let uploadedFile = null;

    if (!req.files || Object.keys(req.files).length === 0) {
      return res.status(400).send('No se ha seleccionado ningún archivo.');
  }

    
     uploadedFile = await uploadFile(req.files.file, 'document' );
     console.log('uploadedFile: ', uploadedFile);

   let newDocument = {
    idconference,
    filePath: uploadedFile.filePath
   }

  await pool.query('INSERT INTO document set  ?',[newDocument])

  return res.status(200).json({
    success: true

  })
  
  } catch (error) {
    console.log('Error desde uploadProgram:', error);

    let errorMessage = 'Algo deu errado, por favor, entre em contato com o administrador';

    res.status(500).json({
      success: false,
      error: errorMessage,
    });
  }
};

const getProgramByConferenceId = async (req, res = response) => {
  
  try {
    
    const { id }  = req.params;

    if (!id || isNaN(Number(id))) {
      return res.status(400).json({
        success: false,
        message: 'ID inválido ou não presente'
      });
    }

    const [rows] = await pool.execute('SELECT * FROM document WHERE idconference = ?', [id]);

    if(rows.length === 0){
      return res.status(400).json({
        success: false,
        message: 'no document',
      });
    }else{
      return res.status(200).json({
        success: true,
        document: rows[0],
      
      });

    }
 
  } catch (error) {
    console.log('Error desde getProgramByConferenceId:', error);

    let errorMessage = 'Algo deu errado, por favor, entre em contato com o administrador';

    res.status(500).json({
      success: false,
      error: errorMessage,
    });
  }
};



export { 
        createProfile,
        getUserByEmail,
        getAllUsers,
        changeRole,
        deleteUserById,
        activePauseUser,
        uploadProgram,
        getProgramByConferenceId
       }


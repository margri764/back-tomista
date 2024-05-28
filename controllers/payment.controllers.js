
import  { pool }  from "../db/config.db.js";


const createPayment = async (req, res = response) => {

  
  const { email, ...rest } = req.body;

  console.log('body payment: ', req.body);

    let user;

    try {

      const [rows] = await pool.execute('SELECT * FROM user WHERE email = ?', [email]);

      user = rows[0];


     const newPayment = {
        ...rest,
        iduser: user.iduser,
        idconference: 1
     }


     await pool.query('INSERT INTO payment set ? ', [newPayment]);
 

      return res.status(200).json({
        success: true,
   
      });



   
    
    } catch (error) {
      console.log('Error desde createPayment:', error);

      let errorMessage = 'Algo deu errado, por favor, entre em contato com o administrador';

      res.status(500).json({
        success: false,
        error: errorMessage,
      });
    }
};

const webhook = async (req, res) => {

  try {

    console.log('Webhook received:', req.body);
    res.status(200).send('Webhook received')
  
  } catch (error) {


    console.log('webhook Error: ', error);
    let errorMessage = 'Algo deu errado, por favor, entre em contato com o administrador';

      errorMessage = error.message;
    return res.status(500).json({
    success: false,
    error: errorMessage
    });
  }
};



export {
        createPayment,
        webhook
       }





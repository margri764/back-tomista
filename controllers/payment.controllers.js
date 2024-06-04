
import  { pool }  from "../db/config.db.js";
import axios from 'axios'; 
import moment from 'moment';
import { generatedInvoiceToAdmin } from "../config/generatedInvoiceToAdmin.js";



const getAllPayment = async (req, res = response) => {

  try {

    const [rows] = await pool.execute(`
    SELECT payment.*, user.*, conference.*
    FROM payment
    JOIN user ON payment.iduser = user.iduser
    JOIN conference ON payment.idconference = conference.idconference
`);

    return res.status(200).json({
      success: true,
      payments: rows
    })
  
 
  } catch (error) {
    console.log('Error desde getAllPayment:', error);

    let errorMessage = 'Algo deu errado, por favor, entre em contato com o administrador';

    res.status(500).json({
      success: false,
      error: errorMessage,
    });
  }
};

const deletePayment = async (req, res = response) => {

  try {

    const idPayment = req.params.id;


    const [rows] = await pool.query('SELECT * FROM payment WHERE idpayment = ?', [idPayment]);

    if(rows.length < 0){

      return res.status(400).json({
        success: false,
        payments: "Fatura não encontrada"
      })

    }else{

      const [result] = await pool.query('DELETE FROM payment WHERE idpayment = ?', [idPayment]);

      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          message: 'Pagamento não encontrado'
        });
      }

      return res.status(200).json({
        success: true,
      })
    
    }
    
 
  } catch (error) {
    console.log('Error desde getAdeletePaymentllPayment:', error);

    let errorMessage = 'Algo deu errado, por favor, entre em contato com o administrador';

    res.status(500).json({
      success: false,
      error: errorMessage,
    });
  }
};

const createPayment = async (req, res = response) => {

  const { email,  ...rest } = req.body;

  //primero controlo q ya no este registrado la inscripcion (no importa si esta pago o no)
  const [rows] = await pool.execute('SELECT * FROM payment WHERE emailPayment = ?', [email]);
  

  if (rows.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Repita o pagamento. Se você acha que isso é um erro, entre em contato com nossos administradores' });
  }

  const today = moment();
  const formattedDate = today.format('YYYY-MM-DD');

  let body =  null;

  if(req.body.paymentOption === 'iugu'){
    body = {
      items: [{description: 'Congreso Tomista', quantity: 1, price_cents: 1000}],
      // notification_url: 'https://d551-45-232-18-31.ngrok-free.app/api/payment/webhook',
      notification_url: 'https://congressovirgofloscarmeli.org/api/payment/webhook',
      email: req.body.email, 
      cc_emails: 'fgriotti747@alumnos.iua.edu.ar',
      due_date: formattedDate,
      payer: {
        cpf_cnpj: req.body.cpf,
        name: req.body.fullName,
        email: req.body.email
       }
    }
  }

  try {
    let user;

    const api_token = '3760F47809181087BF487867F00A9FCF118A218AD06ECEFE420C2E57E62A9C03';

    console.log('body: ', body);

    const options = {
      method: 'POST',
      url: `https://api.iugu.com/v1/invoices?api_token=${api_token}`,
      headers: { accept: 'application/json', 'content-type': 'application/json' },
      data: body
    };

    try {
      const response = await axios.request(options);

      if (response.status === 200) {

        const [rows] = await pool.execute('SELECT * FROM user WHERE email = ?', [email]);
        user = rows[0];

        if (!user) {
          return res.status(404).json({ message: 'User not found' });
        }

        const newPayment = {
          emailPayment: body.payer.email,
          cpf: body.payer.cpf_cnpj,
          fullName: body.payer.name,
          price: body.items[0].price_cents,
          iduser: user.iduser,
          paymentOption: 'iugu' ,
          idconference: 1,
          idinvoice: response.data.id
        };

        //inserto y obtengo el payment para usar en las notificaciones
        const [result] =await pool.query('INSERT INTO payment SET ?', [newPayment]);
        const insertId = result.insertId;
        const [paymentFound] =await pool.query('SELECT * FROM payment WHERE idpayment = ?', [insertId]);

        //una vez q se genero la factura envio un aviso a los admin
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
             fullName: body.payer.name,
             userEmail: body.email,
             conference: 'Tomista',
             paymentOption: 'Iugu' ,
         }
      
   
         for (const email of arrEmails) {
           await generatedInvoiceToAdmin(bodyToAdmin, email);
         }

         //si todo salio bien se genera una notificacion
             
        const newNotification = {
          iduser: user.iduser,
          typeNotification: "payment",
          idPayment: paymentFound[0].idpayment,
          paymentStatus: 'pending'
        }
  
        const [notificacion] = await pool.query('INSERT INTO notification set  ?',[newNotification])
      

        return res.status(200).json({
          success: true,
          data: response.data
        });

      } else {
        return res.status(response.status).json({
          success: false,
          message: 'Error generating invoice',
          data: response.data
        });
      }
    } catch (error) {
      if (error.response) {
        // El servidor respondió con un estado diferente a 2xx
        console.error('Error response data:', error.response.data);
        console.error('Error response status:', error.response.status);
        console.error('Error response headers:', error.response.headers);
      } else if (error.request) {
        // La solicitud fue hecha pero no se recibió respuesta
        console.error('Error request:', error.request);
      } else {
        // Algo sucedió al preparar la solicitud que desencadenó un error
        console.error('Error message:', error.message);
      }
      console.error('Error config:', error.config);
      return res.status(500).json({ message: 'Error processing payment' });
    }
  } catch (error) {
    console.error('Database query error:', error);
    return res.status(500).json({ message: 'Database query error' });
  }
};

const webhook = async (req, res) => {

  try {

    console.log('Webhook received:', req.body);
    const {data, event} = req.body;

    if(data){

     const [invoice] = await pool.execute('SELECT * FROM payment WHERE idinvoice = ?', [data.id]);

     //busco la factura para cambiar el estado
     if(invoice.length > 0){

      // solo hago el set en el caso de q no sea el mismo status
      if(invoice[0].paymentStatus !== data.status){

        const updatedInvoice = {
          paymentStatus: data.status
        }
        await pool.execute('UPDATE payment SET paymentStatus = ? WHERE idinvoice = ?', [updatedInvoice.paymentStatus, invoice[0].idinvoice]);
      
        //la notificacion solo se guarda si se cambia el estado
        const newNotification = {
          iduser: invoice[0].iduser,
          typeNotification: "payment",
          idpayment: invoice[0].idpayment,
          paymentStatus: data.status
        }
  
        const [notificacion] = await pool.query('INSERT INTO notification set  ?',[newNotification])
      }

     }


    }

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

const refundPayment = async (req, res) => {

  try {

    const {idinvoice } = req.body;


    const api_token = '3760F47809181087BF487867F00A9FCF118A218AD06ECEFE420C2E57E62A9C03';


    const options = {
      method: 'POST',
      url: `https://api.iugu.com/v1/invoices/${idinvoice}/refund?api_token=${api_token}`,
      headers: { accept: 'application/json', 'content-type': 'application/json' },
    };

    try {
      
      const response = await axios.request(options);

      console.log(response);

    } catch (error) {
      if (error.response) {
        // El servidor respondió con un estado diferente a 2xx
        console.error('Error response data:', error.response.data);

          return res.status(400).json({
            success: false,
            message: error.response.data.errors
          })

      } else if (error.request) {
        // La solicitud fue hecha pero no se recibió respuesta
        console.error('Error request:', error.request);
      } else {
        // Algo sucedió al preparar la solicitud que desencadenó un error
        console.error('Error message:', error.message);
      }
      console.error('Error config:', error.config);
      return res.status(500).json({ message: 'Error processing payment' });
    }
      
  
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
        getAllPayment,
        deletePayment,
        webhook,
        refundPayment
       }





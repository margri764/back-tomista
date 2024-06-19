
import  { pool }  from "../db/config.db.js";
import axios from 'axios'; 
import moment from 'moment';
import { generatedInvoiceToAdmin } from "../config/generatedInvoiceToAdmin.js";
import { PAYPAL_API, HOST, PAYPAL_API_CLIENT, PAYPAL_API_SECRET, IUGU_API_TOKEN, } from "../config.js";



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

  const { email } = req.body;

  //primero controlo q ya no este registrado la inscripcion (no importa si esta pago o no)
  // falta mas adelante ver por conferencia y tipo de pago (por ahora dejar asi)
  const [rows] = await pool.execute('SELECT * FROM payment WHERE emailPayment = ?', [email]);

  if (rows.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Repita o pagamento. Se você acha que isso é um erro, entre em contato com nossos administradores' });
  }

  if(req.body.paymentOption === 'iugu'){
   await iuguPayment(req, res)
  }else if(req.body.paymentOption === 'paypal'){
    await paypalPayment(req, res)
  }

};

const iuguPayment = async (req, res)=>{

  let body = req.body;


  const today = moment();
  const formattedDate = today.format('YYYY-MM-DD');

  body = {
    items: [{description: 'Congreso Tomista', quantity: 1, price_cents: 1000}],
    notification_url: 'https://51b0-191-96-5-75.ngrok-free.app/api/payment/webhook',
    // notification_url: 'https://congressovirgofloscarmeli.org/api/payment/webhook',
    email: body.email, 
    cc_emails: 'fgriotti747@alumnos.iua.edu.ar',
    due_date: formattedDate,
    payer: {
      cpf_cnpj: body.cpf,
      name: body.fullName,
      email: body.email
     }
  }

  const options = {
    method: 'POST',
    url: `https://api.iugu.com/v1/invoices?api_token=${IUGU_API_TOKEN}`,
    headers: { accept: 'application/json', 'content-type': 'application/json' },
    data: body
  };

  try {
    const response = await axios.request(options);


    if (response.status === 200) {

      let user = null;
       
      const [rows] = await pool.execute('SELECT * FROM user WHERE email = ?', [body.email]);
      user = rows[0];

      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      const newPayment = {
        iduser: user.iduser,
        idconference: 1,
        fullName: body.payer.name,
        emailPayment: body.payer.email,
        paymentOption: 'iugu' ,
        // cpf: body.payer.cpf_cnpj,
        // price: body.items[0].price_cents,
        // idinvoice: response.data.id
      };

      //inserto y obtengo el payment para usar en las notificaciones
      const [result] =await pool.query('INSERT INTO payment SET ?', [newPayment]);
      const insertId = result.insertId;
      const [paymentFound] =await pool.query('SELECT * FROM payment WHERE idpayment = ?', [insertId]);


      const newPaymentIugu = {
        idpayment: insertId,
        idinvoice: response.data.id,
        cpf: body.payer.cpf_cnpj,
        price: body.items[0].price_cents,
        emailPayment: body.payer.email,
      };

      // creo el pago en iugu
      const [resultIugu] = await pool.query('INSERT INTO iugu SET ?', [newPaymentIugu]);
      const insertIdIugu = resultIugu.insertId;

      // actualizo el payment con el idiugu

      await pool.query('UPDATE payment SET idiugu = ? WHERE idpayment = ?', [insertIdIugu, insertId ]);

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
      })

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

}

const webhook = async (req, res) => {

  try {

    console.log('Webhook received:', req.body);
    const {data, event} = req.body;

    if(data){

      console.log('data.id: ', data.id);

     const [invoice] = await pool.query('SELECT * FROM iugu WHERE idinvoice = ?', [data.id]);

     //busco la factura para cambiar el estado
     if(invoice.length > 0){


        const updatedInvoice = {
          paymentStatus: data.status
        }

        await pool.query('UPDATE payment SET paymentStatus = ? WHERE idiugu = ?', [updatedInvoice.paymentStatus, invoice[0].idiugu]);

        // hago el update de iugu
        await pool.query('UPDATE iugu SET paymentStatus = ? WHERE idiugu = ?', [updatedInvoice.paymentStatus, invoice[0].idiugu]);
      
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

const refoundIuguPayment = async (req, res) => {

  try {

    const { idiugu } = req.body;

    const [result] = await pool.query('SELECT * FROM iugu WHERE idiugu = ?', [idiugu])

    if(result.length === 0){
      return res.status(400).json({
        success: false,
        message: 'Pagamento nao encontrado'
      })
    }

    const options = {
      method: 'POST',
      url: `https://api.iugu.com/v1/invoices/${result[0].idinvoice}/refund?api_token=${IUGU_API_TOKEN}`,
      headers: { accept: 'application/json', 'content-type': 'application/json' },
    };

    try {
      
      const response = await axios.request(options);

      if(response.status === 200){
        return res.status(200).json({
          success: true
        })
      }


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


    console.log('refoundIuguPayment Error: ', error);
    let errorMessage = 'Algo deu errado, por favor, entre em contato com o administrador';

    errorMessage = error.message;
    return res.status(500).json({
    success: false,
    error: errorMessage
    });
  }
};

const changeStatus = async (req, res = response) => {

  
  try {
    
    const id = req.params.id;
    const {paymentStatus} = req.body;

    const [existingPayment] = await pool.query('SELECT * FROM payment WHERE idpayment = ?', [id]);


    if(existingPayment.length < 0){
      return res.status(400).json({
         success: false,
         message: "Pagamento não encontrado"
        })
    }else{

      const updatedPayment = { paymentStatus : paymentStatus }

      const [result] = await pool.query('UPDATE payment set ? WHERE idpayment = ?',[updatedPayment, id ]);

      if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'Payment not found' });
      }

      
      if(existingPayment[0].paymentOption === 'paypal'){
        const updatedPayment = { paymentStatus : paymentStatus }
        const [result] = await pool.query('UPDATE paypal set ? WHERE idpaypal = ?',[updatedPayment, existingPayment[0].idpaypal] );
        if (result.affectedRows === 0) {
          return res.status(404).json({ message: 'Payment not found' });
        }
      }else if(existingPayment[0].paymentOption === 'iugu'){
        const updatedPayment = { paymentStatus : paymentStatus }
        const [result] = await pool.query('UPDATE iugu set ? WHERE idiugu = ?',[updatedPayment, existingPayment[0].idiugu] );
        if (result.affectedRows === 0) {
          return res.status(404).json({ message: 'Payment not found' });
        }
      }

  
       return res.status(200).json({
         success: true,
         
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

 const paypalPayment = async (req, res) => {

  try {
    
  let body = req.body;
  let user = null;

        
  const [rows] = await pool.execute('SELECT * FROM user WHERE email = ?', [body.email]);
  user = rows[0];

  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  const today = moment();

  const formattedDate = today.format('YYYY-MM-DD');

    //esto tiene q ser los datos desde el front
    const order = {
      intent: "CAPTURE",
      purchase_units: [
        {
          amount: {
            currency_code: "BRL",
            value: "105.70",
          },
        },
      ],
      application_context: {
        brand_name: "congressovirgofloscarmeli.org",
        landing_page: "NO_PREFERENCE",
        user_action: "PAY_NOW",
        return_url: `${HOST}/api/payment/capture-order`,
        cancel_url: `${HOST}/cancel-payment`,
      },
    };

    // format the body
    const params = new URLSearchParams();

    params.append("grant_type", "client_credentials");

    // Generate an access token
    const { data: { access_token } } = await axios.post( `${PAYPAL_API}/v1/oauth2/token`, params, {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        auth: {
          username: PAYPAL_API_CLIENT,
          password: PAYPAL_API_SECRET,
        },
      }
    );

    const response = await axios.post(`${PAYPAL_API}/v2/checkout/orders`, order, {
        headers: { Authorization: `Bearer ${access_token}`},
      }
    );
    
    let url = null;

    if(response.data){
      if(response.data.status === 'CREATED'){

        response.data.links.forEach(element => {
          if(element.rel === 'approve'){
            url = element.href
          }
        })

        //guardo en base de datos el pago
        const paypalPayment = {
          idinvoice: response.data.id,
          urlPayment: url,
          price: body.price,
          emailPayment: body.email
        };
  
        //creo el pago de paypal
        const [result] = await pool.query('INSERT INTO paypal SET ?',[paypalPayment])

        const insertId = result.insertId;

        //luego creo el payment
        const newPayment = {
          emailPayment: body.email,
          fullName: body.fullName,
          iduser: user.iduser,
          paymentOption: 'paypal' ,
          idconference: 1,
          idpaypal: insertId,

        };
  
        const [payment] = await pool.query('INSERT INTO payment SET ?',[newPayment]);
        const insertIdP = payment.insertId;

        //hago el update para el idpayment
      await pool.query('UPDATE paypal SET idpayment = ? WHERE idpaypal = ? ',[insertIdP, insertId])



        //envio al front el link de pago
        response.data.links.forEach(element => {
          if(element.rel === 'approve'){
            url = element.href
          }
        }
      )

      console.log('response.data', response.data);
      return res.json({
        success: true,
        urlPaypal: url
      });
      }
    }



  } catch (error) {
    console.log('Error desde paypalPayment:', error);

    let errorMessage = 'Algo deu errado, por favor, entre em contato com o administrador';

    res.status(500).json({
      success: false,
      error: errorMessage,
    });
  }
};

// paypal (aca se cuando se realiza el pago)
const captureOrder = async (req, res) => {

  const { token } = req.query;

  try {

    const response = await axios.post(`${PAYPAL_API}/v2/checkout/orders/${token}/capture`, {},{
        auth: {
          username: PAYPAL_API_CLIENT,
          password: PAYPAL_API_SECRET,
        },
      }
    );

    if(response.data){
      
      const [result] = await pool.query('SELECT * FROM paypal WHERE idinvoice = ?', [response.data.id])
      if(result.length > 0){

        let status = null;
        if(response.data.status === 'COMPLETED'){
          status = 'paid'
        }

        const newDataCaptured = {
          paymentStatus: status,
          transactionID: response.data.purchase_units[0].payments.captures[0].id
        }
    
        await pool.query('UPDATE paypal SET ? WHERE idinvoice = ?', [newDataCaptured, response.data.id]);
        await pool.query('UPDATE payment SET paymentStatus = ? WHERE idpaypal = ?', [status, result[0].idpaypal]);


      }else{s
        return res.status(400).json({
          success: false,
          message: 'pagamento nao encontrado'
        })
      }
    }

   res.redirect('/pagamento-bem-sucedido')

 
  } catch (error) {
     console.log('Error desde captureOrder:', error);

    let errorMessage = 'Algo deu errado, por favor, entre em contato com o administrador';

    res.status(500).json({
      success: false,
      error: errorMessage,
    });
  }
};

const refoundPaypalPayment = async (req, res) => {

  try {

    const id = req.params.id;

    let paypal = null;

    const [existingPayment] = await pool.query('SELECT * FROM payment WHERE idpayment = ?', [id]);


    if(existingPayment.length < 0){
      return res.status(400).json({
         success: false,
         message: "Pagamento não encontrado"
        })
    }else{

      const [result] = await pool.query('SELECT * FROM paypal WHERE idpaypal = ?', [existingPayment[0].idpaypal]);

      if(result.length > 0){
        paypal = result[0];
      }
    }
    
    const params = new URLSearchParams();

    params.append("grant_type", "client_credentials");

    const {  data: { access_token },  } = await axios.post( `${PAYPAL_API}/v1/oauth2/token`, params, {
        headers: {
                  "Content-Type": "application/x-www-form-urlencoded",
                  },
        auth: {
          username: PAYPAL_API_CLIENT,
          password: PAYPAL_API_SECRET,
        },
      }
    );

    const capture_id = paypal.transactionID;

    const response = await axios.post(`${PAYPAL_API}/v2/payments/captures/${capture_id}/refund`, {}, {
        headers: {
                  Authorization: `Bearer ${access_token}`
                  }
      }
    );


    if(response.data.status === 'COMPLETED'){ 
  
      await pool.query('UPDATE paypal SET paymentStatus = "refund"  WHERE idpaypal = ?', [paypal.idpaypal]);
      await pool.query('UPDATE payment SET paymentStatus = "refund" WHERE idpaypal = ?', [ existingPayment[0].idpaypal]);


    }
    
      return res.json({
        success: true,
      });
      


  } catch (error) {
    console.log('Error desde refoundPaypalPayment:', error);

    let errorMessage = 'Algo deu errado, por favor, entre em contato com o administrador';

    res.status(500).json({
      success: false,
      error: errorMessage,
    });
  }
};




export {
        createPayment,
        getAllPayment,
        deletePayment,
        webhook,
        refoundIuguPayment,
        changeStatus,
        captureOrder,
        refoundPaypalPayment
       }





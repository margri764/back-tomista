import nodemailer from 'nodemailer';

const mail = {
    user: "congresso@virgofloscarmeli.org",
    pass: "rftJ7jWb"
}

let transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        greetingTimeout : 1000 * (60), 
        port: 465,
        tls: {
            rejectUnauthorized: false
        },
        secure: true, 
        auth: {
            user: mail.user, 
            pass: mail.pass, 
        },
 });


//  se le envia un link para q se verifique su email
const verifyEmail= async ( email, password) =>{

    const contentHtml = `

    <div style="padding:30px"> 
   
        <h1 style="color: #0078d4; font-size: 18px; font-family: Arial, sans-serif;"> Ativar conta, nova senha </h1>
  
        <span style="font-size: 14px; font-family: Google Sans,Roboto,RobotoDraft,Helvetica,Arial,sans-serif; margin-top:30px; display: block "> Email: ${email}  </span>

        <span style="display: block; margin-top: 20px; font-size: 14px; font-family: Google Sans,Roboto,RobotoDraft,Helvetica,Arial,sans-serif;"> Enviamos a sua nova senha para acesso. </span>

        <span style="font-size: 24px; font-family: Google Sans,Roboto,RobotoDraft,Helvetica,Arial,sans-serif; margin-top:30px; display: block "> <b> ${password} </b> </span>
  
   </div>
        `;
        


{
    }

    try {
        
        await transporter.sendMail({
            from: `congressovirgofloscarmeli.org <${mail.user}>`,
            to: email,
            subject: "Verificar email",
            text:"Verificar email",
            html: contentHtml,
        });


    } catch (error) {

        throw new Error (error)
    }
}


export { verifyEmail }











import nodemailer from 'nodemailer';

const mail = {
    user: "propulsao@acnsf.org.br",
    pass: "o6qyb2kd"
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

 // ESTO ERA EL LOGO
//  <div style="padding: 30px; display: flex; align-items: center; justify-content: center; height: 80px;">
//  <img src="https://res.cloudinary.com/margri764/image/upload/v1699276459/logo-vit_jcjjrx.png" alt="Vitamina Logo" style="height: 100%; max-width: 100%; display: block; margin: 0 auto;">
// </div>

const sendAdminEmail = async ( body, administratorEmail) =>{

   const { userEmail , fullName, description} = body;

    const contentHtml = `

    <div style="padding:30px"> 
        
      
 
        <h1 style="color: #0078d4; font-size: 24px; font-family: Arial, sans-serif; margin-top:20px"> Entre em contato conosco </h1>
      
        <span style="display: block; margin-top: 20px; font-size: 16px; font-family: Google Sans,Roboto,RobotoDraft,Helvetica,Arial,sans-serif;"> O usuário ${fullName} solicitou ser contatado. </span>
        <ul>
            <li style="margin-top: 8px; font-size: 16px; font-family: Google Sans,Roboto,RobotoDraft,Helvetica,Arial,sans-serif;">Nome: ${fullName} </li>

            <li style="margin-top: 8px; font-size: 16px; font-family: Google Sans,Roboto,RobotoDraft,Helvetica,Arial,sans-serif;">Email: ${userEmail} </li>

            <li style="margin-top: 8px; font-size: 16px; font-family: Google Sans,Roboto,RobotoDraft,Helvetica,Arial,sans-serif;">Assunto: ${description} </li>
        </ul>
    </div>
  `;

    try {

        await transporter.sendMail({
            from: `congressovirgofloscarmeli.org <${mail.user}>`,
            to: administratorEmail,
            subject: "Contate-nos",
            text:"Contate-nos",
            html: contentHtml,
        });

    } catch (error) {

        throw new Error (error)
    }
}


export { sendAdminEmail }










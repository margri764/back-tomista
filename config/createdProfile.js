
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


const sendProfileToAdmin = async ( body, administratorEmail) =>{

   const { email , fullName, address, phone} = body;

    const contentHtml = `

    <div"> 
        
        <h1 style="color: #0078d4; font-size: 1.3em; font-family: Arial, sans-serif;" > Perfil criado </h1>
      
        <span style="display: block; margin-top: 20px; font-size: 1.1em; font-family: Google Sans,Roboto,RobotoDraft,Helvetica,Arial,sans-serif;"> O usuário ${fullName} acabou de se cadastrar. </span>
        <ul>

            <li style="margin-top: 8px; font-size: 1.1em; font-family: Google Sans,Roboto,RobotoDraft,Helvetica,Arial,sans-serif;">Email: ${email} </li>

            <li style="margin-top: 8px; font-size: 1.1em; font-family: Google Sans,Roboto,RobotoDraft,Helvetica,Arial,sans-serif;">Endereço: ${address} </li>

            <li style="margin-top: 8px; font-size: 1.1em; font-family: Google Sans,Roboto,RobotoDraft,Helvetica,Arial,sans-serif;">Telefone: ${phone} </li>
        </ul>
    </div>
  `;

    try {

        await transporter.sendMail({
            from: `congressovirgofloscarmeli.org <${mail.user}>`,
            to: administratorEmail,
            subject: "Perfil criado",
            text:"Perfil criado",
            html: contentHtml,
        });

    } catch (error) {

        throw new Error (error)
    }
}


export { sendProfileToAdmin }










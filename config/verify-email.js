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
const verifyEmail= async ( email, code) =>{

    const contentHtml = `

    <div style="padding:30px"> 
        
      
 
        <h1 style="color: #0078d4; font-size: 24px; font-family: Arial, sans-serif; margin-top:30px"> Verificar e-mail</h1>
      
        <span style="display: block; margin-top: 20px; font-size: 16px; font-family: Google Sans,Roboto,RobotoDraft,Helvetica,Arial,sans-serif;"> Precisamos verificar a sua conta </span>

        <span style="display: block; margin-top: 20px; font-size: 16px; font-family: Google Sans,Roboto,RobotoDraft,Helvetica,Arial,sans-serif;"> Entre em nosso site usando o seguinte link. </span>

        <a href="http://localhost:4200/autenticacao/verificar-email/${email}${code}" style="font-size: 16px; font-family: Google Sans, Roboto, RobotoDraft, Helvetica, Arial, sans-serif; margin-top: 40px;"> Verifique</a>
        
        
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










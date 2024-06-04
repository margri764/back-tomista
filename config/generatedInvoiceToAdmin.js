
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


const generatedInvoiceToAdmin = async ( body, administratorEmail) =>{

   const { userEmail, fullName, conference, paymentOption } = body;

    const contentHtml = `

    <div"> 
        
        <h1 style="color: #0078d4; font-size: 1.3em; font-family: Arial, sans-serif;"> Inscrição realizada </h1>
      
        <span style="display: block; margin-top: 20px; font-size: 1.1em; font-family: Google Sans,Roboto,RobotoDraft,Helvetica,Arial,sans-serif;"> O usuário ${fullName} acaba de se inscrever no congresso: ${conference}. </span>
        <ul>

            <li style="margin-top: 8px; font-size: 1.1em; font-family: Google Sans,Roboto,RobotoDraft,Helvetica,Arial,sans-serif;">Email: ${userEmail} </li>

            <li style="margin-top: 8px; font-size: 1.1em; font-family: Google Sans,Roboto,RobotoDraft,Helvetica,Arial,sans-serif;">Meio pagamento: ${paymentOption} </li>

        </ul>
    </div>
  `;

    try {

        await transporter.sendMail({
            from: `congressovirgofloscarmeli.org <${mail.user}>`,
            to: administratorEmail,
            subject: "Inscricao feita",
            text:"Inscricao feita",
            html: contentHtml,
        });


    } catch (error) {

        throw new Error (error)
    }
}


export { generatedInvoiceToAdmin }










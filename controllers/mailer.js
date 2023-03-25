import nodemailer from 'nodemailer'
import Mailgen from 'mailgen'
import ENV from '../config.js'

// Backend done now

let nodeConfig = {
    host: "smtp.ethereal.email",
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
        user: ENV.EMAIL, // generated ethereal user
        pass: ENV.PASSWORD, // generated ethereal password
    },
}

let transporter = nodemailer.createTransport(nodeConfig);

let MailGenerator = new Mailgen({
    theme: "default",
    product: {
        name: "Mailgen",
        link: "https://mailgen.js/"
    }
})


/** POST: http://localhost:8080/api/registerMail 
 * @param: {
  "username" : "example123",
  "userEmail" : "admin123", 
  "text" : "", 
  "subject" : "", 
}
*/
export const registerMail = async (req, res) => {
    const { username, userEmail, text, subject } = req.body;

    console.log(req.body);
    // body of the email 
    var email = {
        body: {
            name: username,
            intro: text || "Welcome to Daily Tution we are glad to have you on board",
            outro: "if you have any query , then feel free to reply this email for help we wil be happy to help you.."
        }
    }

    var emailBody = MailGenerator.generate(email);

    let message = {
        from: ENV.EMAIL,
        to: userEmail,
        subject: subject || "Signup Successfully",
        html: emailBody
    }

    // send mail 
    transporter.sendMail(message)
        .then(() => {
            return res.status(201).send({ msg: "You should receive an email from us." })
        })
        .catch(error => {
            return res.status(500).send({ error })
        })
}
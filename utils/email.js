const nodemailer = require('nodemailer');


const sendEmail = async options => {

     //activate less secure app option is gmail
     const transporter = nodemailer.createTransport({
          host: "smtp.mailtrap.io",
          port: 2525,
          auth: {
            user: process.env.MAIL_USER,
            pass: process.env.MAIL_PASS
          }
        });

     const mailOptions = {
          from: 'Natours <support@natours.com>',
          to: options.email,
          subject: options.subject,
          text: options.text
     };

     await transporter.sendMail(mailOptions);
}

module.exports = sendEmail;
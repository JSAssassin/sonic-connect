import nodemailer from 'nodemailer';

const sendEmail = async options => {
  const transporter = nodemailer.createTransport({
    host: 'sandbox.smtp.mailtrap.io',
    port: 25,
    auth: {
      user: 'f561e5e25bb0a8',
      pass: '0200d0045b2ef4',
    },
  });
  // send mail with defined transport object
  const info = await transporter.sendMail({
    from: '"Sonic Connect" <support@sonic-connect.com>',
    to: options.email,
    subject: options.subject,
    text: options.message
  });

  console.log("Message sent: %s", info.messageId);
}

export default sendEmail;

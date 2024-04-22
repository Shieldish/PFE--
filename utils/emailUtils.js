const nodemailer = require('nodemailer');
require('dotenv').config();
// Create a nodemailer transporter

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com', // Your SMTP host
  port: 465, // Your SMTP port
  secure: true, // true for 465, false for other ports
  auth: {
    user: process.env.NODEMAILER_USER, // Your email address
    pass: process.env.NODEMAILER_PASS// Your email password
  }
});

async function sendUserRegistrationMail(email, name,confirmationToken) {
const mailOptions = {
    from: `Gestions Stages <${process.env.NODEMAILER_USER}>`,  // Sender address
    to: email, // Recipient address
    subject: 'Registration Confirmation', // Subject line
    html: `
    <html>
    <head>
      <style>
        /* Custom CSS styles */
        body {
          font-family: Arial, sans-serif;
          background-color: #f5f5f5;
          padding: 20px;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          background-color: #FFFFFF;
          padding: 20px;
          border-radius: 5px;
          box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.1);
        }
        .message {
          margin-bottom: 20px;
        }
        .signature {
          margin-top: 20px;
          text-align: center;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h2>Registration Confirmation: Welcome </h2>
        <div class="message">
          <p>Dear ${name},</p>
          <p>   Congratulations! We are delighted to confirm that your registration  was successful. Welcome to our community!</p>
          <strong><a href="${process.env.FRONTEND_URL}/connection/confirm-email?TOKEN=${confirmationToken}"> &#x1F449;  Confirm Email  &#x1F448;</a></strong>
          <p>Here are the details of your registration:</p>
          <ul>
            <li><strong>Username:</strong> ${name}</li>
            <li><strong>Email Address:</strong> ${email}</li>
            <li><strong>Registration Date:</strong> ${new Date().toLocaleString('fr-FR', { 
              month: 'long',
              day: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit'
          })}</li>
          </ul>
          <p>Thank you for registering with our app!</p>
          <p>Please click the link below to confirm your email address:</p>
          <a href="${process.env.FRONTEND_URL}/connection/confirm-email?TOKEN=${confirmationToken}"> &#x1F449;  Confirm Email  &#x1F448;</a>
          <p>This link will expire in 24 hours.</p>
          <p> Click here : ${process.env.FRONTEND_URL}/connection/confirm-email?TOKEN=${confirmationToken}</p>
          <p>As a registered member, you now have access to [briefly mention key features or benefits of your product/service]. We are confident that you'll find [Your Company] to be a valuable resource.</p>
          <p>Should you have any questions or need assistance, feel free to reach out to our support team at [Support Email/Contact Information]. We're here to help!</p>
          <p>Thank you for choosing [Your Company]. We're excited to have you on board!</p>
        </div>
        <div class="signature">
          <p>Best regards,</p>
          <p>[Your Name]<br>[Your Position/Role]<br>[Your Company]</p>
        </div>
      </div>
    </body>
  </html>
    `
 
  };
  

  try {
    // Send email
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.messageId);
  } catch (error) {
    console.error('Error sending email:', error);
  }
}


async function resendRegistrationMail(email,name,token) {
  const mailOptions = {
    from: `Gestions Stages <${process.env.NODEMAILER_USER}>`,  // Sender address
    to: email, // Recipient address
    subject: 'Resend Registration Email', // Subject line
    html: `
    <html>
    <head>
      <style>
        /* Custom CSS styles */
        body {
          font-family: Arial, sans-serif;
          background-color: #f5f5f5;
          padding: 20px;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          background-color: #FFFFFF;
          padding: 20px;
          border-radius: 5px;
          box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.1);
        }
        .message {
          margin-bottom: 20px;
        }
        .signature {
          margin-top: 20px;
          text-align: center;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h2>Resent Registration Email</h2>
        <div class="message">
          <p>Dear ${name},</p>
          <p>We received a request to resend the registration email to the following email address:</p>
          <p> <a href="${process.env.FRONTEND_URL}/connection/confirm-email?TOKEN=${token}"> &#x1F449; Confirm Email &#x1F448;</a></>
          <ul>
            <li><strong>Name:</strong> ${name}</li>
            <li><strong>Email Address:</strong> ${email}</li>
            <li><strong>Date:</strong> ${new Date().toLocaleString('en-US', { 
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit'
          })}</li>
          </ul>
          <p>If this was not you, please ignore this email.</p>
          <p>To confirm your email address and complete the registration process, please click the link below:</p>
          <a href="${process.env.FRONTEND_URL}/connection/confirm-email?TOKEN=${token}"> &#x1F449; Confirm Email &#x1F448;</a>
          <p> Click here  :  ${process.env.FRONTEND_URL}/connection/confirm-email?TOKEN=${token}</p>
        </div>
        <div class="signature">
          <p>Best regards,</p>
          <p>Your Team</p>
        </div>
      </div>
    </body>
    </html>
    
    `
  };


  try {
    // Send email
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.messageId);

    return true; // Email sent successfully
  } catch (error) {
    console.error('Error sending resend registration email:', error);
    return  false; // Failed to send email
  }
}


async function sendUserResetPasswordMail(email, resetToken) {
const mailOptions = {
  from: 'Gestions Stages <gabiamsamuelnathan@gmail.com>', // Sender address
  to: email, // Recipient address
  subject: 'Reset Your Password', // Subject line
  html: `
    <html>
      <head>
        <style>
          /* Add your custom CSS styles here */
          body {
            font-family: Arial, sans-serif;
            background-color: #f5f5f5;
            padding: 20px;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #FFFFFF;
            padding: 20px;
            border-radius: 5px;
            box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.1);
          }
          .message {
            margin-bottom: 20px;
          }
          .signature {
            margin-top: 20px;
            text-align: center;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h2>Password Reset Request</h2>
          <div class="message">
            <p>Dear User,</p>
            <p>We received a request to reset your password. If this was not you, please ignore this email.</p>
            <p>To reset your password, click the link below:</p>
            <a  href="${process.env.FRONTEND_URL}/connection/reset-password?email=${email}&token=${resetToken}"> &#x1F449; Reset Password  &#x1F448;</a>
            <p>The link will expire in 24 hours for security reasons.</p>

            <p>${process.env.FRONTEND_URL}/connection/reset-password?email=${email}&token=${resetToken} </p>
          </div>
          <div class="signature">
            <p>Best regards,</p>
            <p>Your Team</p>
          </div>
        </div>
      </body>
    </html>
  `
};

try {
  // Send email
  const info = await transporter.sendMail(mailOptions);
  console.log('Email sent:', info.messageId);
} catch (error) {
  console.error('Error sending email:', error);
}
}


module.exports = {sendUserRegistrationMail,sendUserResetPasswordMail ,resendRegistrationMail};

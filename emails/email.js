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
    <!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Registration Confirmation</title>
    <link rel="stylesheet" href="node_modules/bootstrap/dist/css/bootstrap.min.css">
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
        background-color:beige;
        padding: 20px;
        border-radius: 5px;
        box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.1);
    }
    h2 {
        text-align: center;
        margin-top: 0;
    }
    .message {
        margin-bottom: 20px;
    }
    .confirm-email-btn {
        display: inline-block;
        background-color: #ffffff38;
        color: #ffffff;
        text-decoration:#08070700;
        padding: 10px 20px;
        border-radius: 5px;
        transition: background-color 0.3s ease;
    }
    .confirm-email-btn:hover {
        background-color: rgb(77, 77, 73);
    }
    .signature {
        margin-top: 20px;
        text-align: center;
    }
    .confirm-email-btn.animation {
        animation: pulse 2s infinite;
    }
    @keyframes pulse {
        0% {
            transform: scale(1);
        }
        50% {
            transform: scale(1.1);
        }
        100% {
            transform: scale(1);
        }
    }
</style>
 
</head>
<body>
    <div class="container">
        <h2>Registration Confirmation: Welcome</h2>
        <div class="message">
            <p>Dear ${name},</p>
            <p>Congratulations! We are delighted to confirm that your registration was successful. Welcome to our community!</p>
            <a href="${process.env.FRONTEND_URL}/connection/confirm-email?TOKEN=${confirmationToken}" class="confirm-email-btn animation">Confirm Email</a>
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
            <a href="${process.env.FRONTEND_URL}/connection/confirm-email?TOKEN=${confirmationToken}" class="confirm-email-btn">Confirm Email</a>
            <p>This link will expire in 24 hours.</p>
            <p>Click here: ${process.env.FRONTEND_URL}/connection/confirm-email?TOKEN=${confirmationToken}</p>
            <p>As a registered member, you now have access to [briefly mention key features or benefits of your product/service]. We are confident that you'll find [Your Company] to be a valuable resource.</p>
            <p>Should you have any questions or need assistance, feel free to reach out to our support team at [Support Email/Contact Information]. We're here to help!</p>
            <p>Thank you for choosing [Your Company]. We're excited to have you on board!</p>
        </div>
        <div class="signature">
            <p>Best regards,</p>
            <p>[Your Name]<br>[Your Position/Role]<br>[Your Company]</p>
        </div>
    </div>
    <script src="node_modules/bootstrap/dist/js/bootstrap.bundle.min.js"></script>
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
    <!DOCTYPE html>
    <html>
      <head>
        <link rel="stylesheet" href="node_modules/bootstrap/dist/css/bootstrap.min.css">
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
            background-color:beige;
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
    
          .btn-confirm {
            display: inline-block;
            background-color: #ffffff38;
            color: #ffffff;
            text-decoration:#08070700;
            padding: 10px 20px;
            border-radius: 5px;
            transition: background-color 0.3s ease;
          }
    
          .btn-confirm:hover {
            background-color: rgb(77, 77, 73);
          }
    
          /* Animation */
          @keyframes pulse {
            0% {
              transform: scale(1);
            }
            50% {
              transform: scale(1.1);
            }
            100% {
              transform: scale(1);
            }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h2>Resent Registration Email</h2>
          <div class="message">
            <p>Dear ${name},</p>
            <p>We received a request to resend the registration email to the following email address:</p>
            <a class="btn-confirm" href="${process.env.FRONTEND_URL}/connection/confirm-email?TOKEN=${token}">Confirm Email</a>
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
            <a class="btn-confirm" href="${process.env.FRONTEND_URL}/connection/confirm-email?TOKEN=${token}">Confirm Email</a>
            <p>Click here: ${process.env.FRONTEND_URL}/connection/confirm-email?TOKEN=${token}</p>
          </div>
          <div class="signature">
            <p>Best regards,</p>
            <p>Your Team</p>
          </div>
        </div>
        <script src="node_modules/bootstrap/dist/js/bootstrap.bundle.min.js"></script>
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
  <!DOCTYPE html>
  <html>
    <head>
    <link rel="stylesheet" href="node_modules/bootstrap/dist/css/bootstrap.min.css">
      <style>
    
        /* Custom CSS styles */
        body {
          font-family: Arial, sans-serif;
          background-color: #f5f5f5;
          padding: 20px;
          display: flex;
          justify-content: center;
          align-items: center;
          height: 100vh;
        }
  
        .container {
        max-width: 600px;
        margin: 0 auto;
        background-color:beige;
        padding: 20px;
        border-radius: 5px;
        box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.1);
        }
  
        .title {
          text-align: center;
          color: #333333;
          animation: slideInDown 0.5s ease-in-out;
        }
  
        .message {
          margin-bottom: 20px;
        }
  
        .signature {
          margin-top: 20px;
          text-align: center;
        }
  
        .button {
          display: inline-block;
          background-color: #ffffff38;
          color: #ffffff;
          text-decoration:#08070700;
          padding: 10px 20px;
          border-radius: 5px;
          transition: background-color 0.3s ease;
        }
  
        .button:hover {
          background-color: rgb(77, 77, 73);
        }
  
        /* Animations */
        @keyframes fadeIn {
          0% {
            opacity: 0;
          }
          100% {
            opacity: 1;
          }
        }
  
        @keyframes slideInDown {
          0% {
            transform: translateY(-100%);
            opacity: 0;
          }
          100% {
            transform: translateY(0);
            opacity: 1;
          }
        }
  
        @keyframes pulse {
          0% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.1);
          }
          100% {
            transform: scale(1);
          }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h2 class="title">Password Reset Request</h2>
        <div class="message">
          <p>Dear User,</p>
          <p>We received a request to reset your password. If this was not you, please ignore this email.</p>
          <p>To reset your password, click the link below:</p>
          <a class="button" href="${process.env.FRONTEND_URL}/connection/reset-password?email=${email}&token=${resetToken}">Reset Password</a>
          <p>The link will expire in 24 hours for security reasons.</p>
          <p>${process.env.FRONTEND_URL}/connection/reset-password?email=${email}&token=${resetToken}</p>
        </div>
        <div class="signature">
          <p>Best regards,</p>
          <p>Your Team</p>
        </div>
      </div>
      <script src="node_modules/bootstrap/dist/js/bootstrap.bundle.min.js"></script>
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

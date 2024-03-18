const nodemailer = require('nodemailer');
require('dotenv').config();
// Create a nodemailer transporter

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com', // Your SMTP host
  port: 465, // Your SMTP port
  secure: true, // true for 465, false for other ports
  auth: {
    user: "gabiamsamuelnathan@gmail.com", // Your email address
    pass: "fkjo fycc cmgy oses"// Your email password
  }
});

// Function to send registration email
// Email content
/* async function sendUserLoginInfoMail(email, name, ip, location, time) {
  try {
    // Prepare HTML content for the email
    const htmlContent = `
      <html>
        <body>
          <p>Hello ${name},</p>
          <p>Your account was just logged in from ${ip} (${location}) at ${time}.</p>
          <p>Sincerely,</p>
          <p>Your Company Name</p>
        </body>
      </html>
    `;


    const mailOptions = {
      from: "gabiamsamuelnathan@gmail.com", // Sender address
      to: email, // Receiver address (user's email)
      subject: 'Login Information',
      html: htmlContent
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent: ' + info.response);
  } catch (error) {
    console.log(error);
  }
} */



async function sendUserRegistrationMail(email, name,confirmationToken) {
const mailOptions = {
    from: 'Gestions Stages', // Sender address
    to: email, // Recipient address
    subject: 'Registration Confirmation', // Subject line
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
              background-color: #ffffff;
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
            <h2>Registration Confirmation: Welcome to [Your Company ]!</h2>
            <div class="message">
              <p>Dear ${name},</p>
              <p>Congratulations! We are thrilled to confirm that your registration with [Your Company ] was successful. Welcome to our community!</p>
              <p>Here are the details of your registration:</p>
              <p>Thank you for registering with our app!</p>
                <p>Please click the link below to confirm your email address:</p>
                <a href="${process.env.FRONTEND_URL}/connection/confirm-email?TOKEN=${confirmationToken}">Confirm Email</a> 
                <p>This link will expire in 24 hours.</p>
              <ul>
                <li><strong>Username:</strong> ${name}</li>
                <li><strong>Email Address:</strong> ${email}</li>
                <li><strong>Registration Date:</strong> ${new Date().toLocaleDateString()}</li>
              </ul>
              <p>Thank you for registering with our app!</p>
                <p>Please click the link below to confirm your email address:</p>

                 <a href="${process.env.FRONTEND_URL}/connection/confirm-email?TOKEN=${confirmationToken}">Confirm Email</a> ${process.env.FRONTEND_URL}/connection/confirm-email?TOKEN=${confirmationToken} 
                <p>This link will expire in 24 hours.</p>
              <p>As a registered member, you now have access to [briefly mention key features or benefits of your product/service]. We are confident that you'll find [Your Company ] to be a valuable resource.</p>
              <p>Should you have any questions or need assistance, feel free to reach out to our support team at [Support Email/Contact Information]. We're here to help!</p>
              <p>Thank you for choosing [Your Company ]. We're excited to have you on board!</p>
            </div>
            <div class="signature">
              <p>Best regards,</p>
              <p>[Your Name]<br>[Your Position/Role]<br>[Your Company ]</p>
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



async function sendUserResetPasswordMail(email, resetToken) {
const mailOptions = {
  from: 'Gestions Stages', // Sender address
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
            background-color: #ffffff;
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
            <a  href="${process.env.FRONTEND_URL}/connection/reset-password?email=${email}&token=${resetToken}">Reset Password</a>
            <p>The link will expire in 24 hours for security reasons.</p>
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


module.exports = {sendUserRegistrationMail,sendUserResetPasswordMail };

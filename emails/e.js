const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: process.env.NODEMAILER_USER,
    pass: process.env.NODEMAILER_PASS
  }
});

async function sendUserRegistrationMail(email, name, confirmationToken) {
  const mailOptions = {
    from: `Gestions Stages <${process.env.NODEMAILER_USER}>`,
    to: email,
    subject: 'Confirmation d\'inscription',
    html: `
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Confirmation d'inscription</title>
        <style>
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
            background-color: #fef3c7;
            padding: 20px;
            border-radius: 5px;
            box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.1);
          }
          h2 {
            text-align: center;
            margin-top: 0;
            color: #333333;
          }
          .message {
            margin-bottom: 20px;
            color: #333333;
          }
          .confirm-email-btn {
            display: inline-block;
            background-color: #f59e0b;
            color: #ffffff;
            text-decoration: none;
            padding: 10px 20px;
            border-radius: 5px;
            transition: background-color 0.3s ease;
          }
          .confirm-email-btn:hover {
            background-color: #d97706;
          }
          .signature {
            margin-top: 20px;
            text-align: center;
            color: #333333;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h2>Confirmation d'inscription: Bienvenue</h2>
          <div class="message">
            <p>Bonjour ${name},</p>
            <p>Félicitations ! Nous sommes ravis de confirmer que votre inscription a été réussie. Bienvenue dans notre communauté !</p>
            <a href="${process.env.FRONTEND_URL}/connection/confirm-email?TOKEN=${confirmationToken}" class="confirm-email-btn">Confirmer l'email</a>
            <p>Voici les détails de votre inscription :</p>
            <ul>
              <li><strong>Nom d'utilisateur:</strong> ${name}</li>
              <li><strong>Adresse email:</strong> ${email}</li>
              <li><strong>Date d'inscription:</strong> ${new Date().toLocaleString('fr-FR', {
                month: 'long',
                day: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
              })}</li>
            </ul>
            <p>Merci de vous être inscrit sur notre application !</p>
            <p>Veuillez cliquer sur le lien ci-dessous pour confirmer votre adresse email :</p>
            <a href="${process.env.FRONTEND_URL}/connection/confirm-email?TOKEN=${confirmationToken}" class="confirm-email-btn">Confirmer l'email</a>
            <p>Ce lien expirera dans 24 heures.</p>
            <p>Cliquez ici: ${process.env.FRONTEND_URL}/connection/confirm-email?TOKEN=${confirmationToken}</p>
            <p>En tant que membre enregistré, vous avez désormais accès à [mentionner brièvement les principales fonctionnalités ou avantages de votre produit/service]. Nous sommes convaincus que vous trouverez [Votre Société] une ressource précieuse.</p>
            <p>Si vous avez des questions ou avez besoin d'aide, n'hésitez pas à contacter notre équipe de support à [Support Email/Contact Information]. Nous sommes là pour vous aider !</p>
            <p>Merci d'avoir choisi [Votre Société]. Nous sommes ravis de vous compter parmi nous !</p>
          </div>
          <div class="signature">
            <p>Cordialement,</p>
            <p>[Votre Nom]<br>[Votre Poste/Rôle]<br>[Votre Société]</p>
          </div>
        </div>
      </body>
      </html>
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.messageId);
  } catch (error) {
    console.error('Error sending email:', error);
  }
}
async function resendRegistrationMail(email, name, token) {
  const mailOptions = {
    from: `Gestions Stages <${process.env.NODEMAILER_USER}>`,
    to: email,
    subject: 'Renvoi de l\'email d\'inscription',
    html: `
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Renvoi de l'email d'inscription</title>
        <style>
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
            background-color: #fef3c7;
            padding: 20px;
            border-radius: 5px;
            box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.1);
          }
          h2 {
            text-align: center;
            margin-top: 0;
            color: #333333;
          }
          .message {
            margin-bottom: 20px;
            color: #333333;
          }
          .confirm-email-btn {
            display: inline-block;
            background-color: #f59e0b;
            color: #ffffff;
            text-decoration: none;
            padding: 10px 20px;
            border-radius: 5px;
            transition: background-color 0.3s ease;
          }
          .confirm-email-btn:hover {
            background-color: #d97706;
          }
          .signature {
            margin-top: 20px;
            text-align: center;
            color: #333333;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h2>Renvoi de l'email d'inscription</h2>
          <div class="message">
            <p>Bonjour ${name},</p>
            <p>Nous avons reçu une demande de renvoi de l'email d'inscription à l'adresse suivante :</p>
            <a href="${process.env.FRONTEND_URL}/connection/confirm-email?TOKEN=${token}" class="confirm-email-btn">Confirmer l'email</a>
            <ul>
              <li><strong>Nom:</strong> ${name}</li>
              <li><strong>Adresse email:</strong> ${email}</li>
              <li><strong>Date:</strong> ${new Date().toLocaleString('fr-FR', {
                month: 'long',
                day: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
              })}</li>
            </ul>
            <p>Si ce n'était pas vous, veuillez ignorer cet email.</p>
            <p>Pour confirmer votre adresse email et terminer le processus d'inscription, veuillez cliquer sur le lien ci-dessous :</p>
            <a href="${process.env.FRONTEND_URL}/connection/confirm-email?TOKEN=${token}" class="confirm-email-btn">Confirmer l'email</a>
            <p>Cliquez ici: ${process.env.FRONTEND_URL}/connection/confirm-email?TOKEN=${token}</p>
          </div>
          <div class="signature">
            <p>Cordialement,</p>
            <p>Votre Équipe</p>
          </div>
        </div>
      </body>
      </html>
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.messageId);
    return true;
  } catch (error) {
    console.error('Error sending resend registration email:', error);
    return false;
  }
}
async function sendUserResetPasswordMail(email, resetToken) {
  const mailOptions = {
    from: 'Gestions Stages <gabiamsamuelnathan@gmail.com>',
    to: email,
    subject: 'Réinitialiser votre mot de passe',
    html: `
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Réinitialiser votre mot de passe</title>
        <style>
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
            background-color: #fef3c7;
            padding: 20px;
            border-radius: 5px;
            box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.1);
          }
          h2 {
            text-align: center;
            margin-top: 0;
            color: #333333;
          }
          .message {
            margin-bottom: 20px;
            color: #333333;
          }
          .reset-password-btn {
            display: inline-block;
            background-color: #f59e0b;
            color: #ffffff;
            text-decoration: none;
            padding: 10px 20px;
            border-radius: 5px;
            transition: background-color 0.3s ease;
          }
          .reset-password-btn:hover {
            background-color: #d97706;
          }
          .signature {
            margin-top: 20px;
            text-align: center;
            color: #333333;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h2>Réinitialiser votre mot de passe</h2>
          <div class="message">
            <p>Bonjour,</p>
            <p>Nous avons reçu une demande de réinitialisation de mot de passe pour votre compte.</p>
            <a href="${process.env.FRONTEND_URL}/newPassword?TOKEN=${resetToken}" class="reset-password-btn">Réinitialiser le mot de passe</a>
            <p>Ce lien expirera dans 24 heures. Si vous n'avez pas demandé de réinitialisation de mot de passe, veuillez ignorer cet email.</p>
            <p>Cliquez ici: ${process.env.FRONTEND_URL}/newPassword?TOKEN=${resetToken}</p>
          </div>
          <div class="signature">
            <p>Cordialement,</p>
            <p>Votre Équipe</p>
          </div>
        </div>
      </body>
      </html>
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.messageId);
  } catch (error) {
    console.error('Error sending reset password email:', error);
  }
}
module.exports = {sendUserRegistrationMail,sendUserResetPasswordMail ,resendRegistrationMail};
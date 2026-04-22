const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ message: 'Serveur WARFIRA opérationnel ✅' });
});

//  ROUTE vers le FORMULAIRE CONTACT 
app.post('/api/contact', async (req, res) => {
  const { prenom, nom, email, telephone, profil, message } = req.body;

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: 'direction@warfira.com',
    subject: `Nouveau message de ${prenom} ${nom} — WARFIRA`,
    html: `
      <h2>Nouveau contact WARFIRA</h2>
      <p><strong>Nom :</strong> ${prenom} ${nom}</p>
      <p><strong>Email :</strong> ${email}</p>
      <p><strong>Téléphone :</strong> ${telephone}</p>
      <p><strong>Profil :</strong> ${profil}</p>
      <p><strong>Message :</strong> ${message}</p>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    res.json({ success: true, message: 'Email envoyé avec succès !' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur envoi email', error });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Serveur WARFIRA démarré sur le port ${PORT}`);
});
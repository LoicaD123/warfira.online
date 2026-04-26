const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
require('dotenv').config();

const db = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Test de connexion  avec la base de données
db.query('SELECT 1')
  .then(() => console.log('✅ Base de données WARFIRA connectée !'))
  .catch(err => console.error('❌ Erreur connexion DB :', err));

// ── ROUTE TEST ──
app.get('/', (req, res) => {
  res.json({ message: 'Serveur WARFIRA opérationnel ✅' });
});

// ── ROUTE FORMULAIRE CONTACT ──
app.post('/api/contact', async (req, res) => {
  const { prenom, nom, email, telephone, profil, message } = req.body;

  // Sauvegarde en base de données
  try {
    await db.query(
      'INSERT INTO contacts (prenom, nom, email, telephone, profil, message) VALUES (?, ?, ?, ?, ?, ?)',
      [prenom, nom, email, telephone, profil, message]
    );
  } catch (dbError) {
    console.error('❌ Erreur sauvegarde contact :', dbError);
  }

  // Envoi email
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

//  ROUTES PARTENAIRES WRB
app.get('/api/partenaires', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM partenaires ORDER BY created_at DESC');
    res.json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur récupération partenaires', error });
  }
});

app.post('/api/partenaires', async (req, res) => {
  const { nom, prenom, email, telephone, nom_agence, adresse, ville, pays } = req.body;
  try {
    await db.query(
      'INSERT INTO partenaires (nom, prenom, email, telephone, nom_agence, adresse, ville, pays) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [nom, prenom, email, telephone, nom_agence, adresse, ville, pays]
    );
    res.json({ success: true, message: 'Partenaire ajouté ✅' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur ajout partenaire', error });
  }
});

// ROUTES HOTELIERS WHS 
app.get('/api/hoteliers', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM hoteliers ORDER BY created_at DESC');
    res.json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur récupération hôteliers', error });
  }
});

app.post('/api/hoteliers', async (req, res) => {
  const { nom_hotel, contact_nom, contact_prenom, email, telephone, ville, pays, etoiles, nombre_chambres } = req.body;
  try {
    await db.query(
      'INSERT INTO hoteliers (nom_hotel, contact_nom, contact_prenom, email, telephone, ville, pays, etoiles, nombre_chambres) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [nom_hotel, contact_nom, contact_prenom, email, telephone, ville, pays, etoiles, nombre_chambres]
    );
    res.json({ success: true, message: 'Hôtelier ajouté ✅' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur ajout hôtelier', error });
  }
});

//  ROUTES DISTRIBUTEURS 
app.get('/api/distributeurs', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM distributeurs ORDER BY created_at DESC');
    res.json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur récupération distributeurs', error });
  }
});

app.post('/api/distributeurs', async (req, res) => {
  const { nom, prenom, email, telephone, entreprise, type_distributeur, ville, pays, zone_couverte } = req.body;
  try {
    await db.query(
      'INSERT INTO distributeurs (nom, prenom, email, telephone, entreprise, type_distributeur, ville, pays, zone_couverte) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [nom, prenom, email, telephone, entreprise, type_distributeur, ville, pays, zone_couverte]
    );
    res.json({ success: true, message: 'Distributeur ajouté ✅' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur ajout distributeur', error });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Serveur WARFIRA démarré sur le port ${PORT}`);
});
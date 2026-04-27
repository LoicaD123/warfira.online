const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
require('dotenv').config();

const db = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// ============================================================
// TEST CONNEXION BASE DE DONNÉES
// ============================================================
db.query('SELECT 1')
  .then(() => console.log('✅ Base de données WARFIRA connectée !'))
  .catch(err => console.error('❌ Erreur connexion DB :', err));

// ============================================================
// ROUTE TEST
// ============================================================
app.get('/', (req, res) => {
  res.json({ 
    message: '🚀 Serveur WARFIRA opérationnel',
    version: '1.0',
    base: 'warfira_online',
    routes: [
      'POST /api/contact',
      'POST /api/partenaires',
      'POST /api/hoteliers',
      'POST /api/distributeurs',
      'POST /api/athletes',
      'POST /api/evenements',
      'GET  /api/sports',
      'GET  /api/categories-poids/:sport_id',
    ]
  });
});

// ============================================================
// TRANSPORTEUR EMAIL
// ============================================================
function createTransporter() {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
}

// ============================================================
// BLOC 1 — FORMULAIRE CONTACT
// ============================================================
app.post('/api/contact', async (req, res) => {
  const { prenom, nom, email, telephone, profil, message } = req.body;

  // Validation
  if (!prenom || !nom || !email || !profil) {
    return res.status(400).json({ success: false, message: 'Champs obligatoires manquants.' });
  }

  try {
    // Sauvegarde en base
    await db.query(
      `INSERT INTO contacts (prenom, nom, email, telephone, profil, message, statut)
       VALUES (?, ?, ?, ?, ?, ?, 'nouveau')`,
      [prenom, nom, email, telephone || null, profil, message || null]
    );

    // Envoi email notification
    try {
      const transporter = createTransporter();
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: 'contact@warfira.com',
        subject: `📬 Nouveau contact — ${prenom} ${nom} (${profil})`,
        html: `
          <h2 style="color:#28368C;">Nouveau message WARFIRA</h2>
          <table style="border-collapse:collapse;width:100%;">
            <tr><td style="padding:8px;font-weight:bold;">Nom</td><td style="padding:8px;">${prenom} ${nom}</td></tr>
            <tr style="background:#EEF1FA;"><td style="padding:8px;font-weight:bold;">Email</td><td style="padding:8px;">${email}</td></tr>
            <tr><td style="padding:8px;font-weight:bold;">Téléphone</td><td style="padding:8px;">${telephone || 'Non renseigné'}</td></tr>
            <tr style="background:#EEF1FA;"><td style="padding:8px;font-weight:bold;">Profil</td><td style="padding:8px;">${profil}</td></tr>
            <tr><td style="padding:8px;font-weight:bold;">Message</td><td style="padding:8px;">${message || 'Aucun message'}</td></tr>
          </table>
        `
      });
    } catch (emailError) {
      console.error('⚠️ Email non envoyé :', emailError.message);
    }

    res.json({ success: true, message: '✅ Message enregistré avec succès !' });

  } catch (error) {
    console.error('❌ Erreur /api/contact :', error);
    res.status(500).json({ success: false, message: 'Erreur serveur.', error: error.message });
  }
});

// GET — Liste des contacts (admin)
app.get('/api/contact', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM contacts ORDER BY created_at DESC');
    res.json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur serveur.', error: error.message });
  }
});

// ============================================================
// BLOC 2 — FORMULAIRE PARTENAIRES WRB
// ============================================================
app.post('/api/partenaires', async (req, res) => {
  const { nom, prenom, email, telephone, nom_agence, adresse, ville, pays, siret } = req.body;

  // Validation
  if (!nom || !prenom || !email || !nom_agence) {
    return res.status(400).json({ success: false, message: 'Champs obligatoires manquants.' });
  }

  try {
    await db.query(
      `INSERT INTO partenaires_wrb 
       (nom, prenom, email, telephone, nom_agence, adresse, ville, pays, siret, abonnement, droits_entree, statut)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 149.00, 5000.00, 'prospect')`,
      [nom, prenom, email, telephone || null, nom_agence, adresse || null, ville || null, pays || 'France', siret || null]
    );

    // Email notification
    try {
      const transporter = createTransporter();
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: 'contact@warfira.com',
        subject: `🤝 Nouvelle demande partenaire WRB — ${nom_agence}`,
        html: `
          <h2 style="color:#28368C;">Nouvelle demande partenaire WRB</h2>
          <table style="border-collapse:collapse;width:100%;">
            <tr><td style="padding:8px;font-weight:bold;">Agence</td><td style="padding:8px;">${nom_agence}</td></tr>
            <tr style="background:#EEF1FA;"><td style="padding:8px;font-weight:bold;">Contact</td><td style="padding:8px;">${prenom} ${nom}</td></tr>
            <tr><td style="padding:8px;font-weight:bold;">Email</td><td style="padding:8px;">${email}</td></tr>
            <tr style="background:#EEF1FA;"><td style="padding:8px;font-weight:bold;">Téléphone</td><td style="padding:8px;">${telephone || 'Non renseigné'}</td></tr>
            <tr><td style="padding:8px;font-weight:bold;">Ville</td><td style="padding:8px;">${ville || 'Non renseigné'}</td></tr>
            <tr style="background:#EEF1FA;"><td style="padding:8px;font-weight:bold;">Pays</td><td style="padding:8px;">${pays || 'France'}</td></tr>
          </table>
          <p style="color:#28368C;font-weight:bold;">Abonnement : 149€/mois — Droits d'entrée : 5 000€</p>
        `
      });
    } catch (emailError) {
      console.error('⚠️ Email non envoyé :', emailError.message);
    }

    res.json({ success: true, message: '✅ Demande partenaire enregistrée !' });

  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ success: false, message: 'Cet email est déjà enregistré.' });
    }
    console.error('❌ Erreur /api/partenaires :', error);
    res.status(500).json({ success: false, message: 'Erreur serveur.', error: error.message });
  }
});

// GET — Liste des partenaires WRB
app.get('/api/partenaires', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM partenaires_wrb ORDER BY created_at DESC');
    res.json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur serveur.', error: error.message });
  }
});

// ============================================================
// BLOC 3 — FORMULAIRE HOTELIERS WHS
// ============================================================
app.post('/api/hoteliers', async (req, res) => {
  const { nom_hotel, contact_nom, contact_prenom, email, telephone, adresse, ville, pays, etoiles, nb_chambres } = req.body;

  if (!nom_hotel || !email) {
    return res.status(400).json({ success: false, message: 'Champs obligatoires manquants.' });
  }

  try {
    await db.query(
      `INSERT INTO hoteliers_whs 
       (nom_hotel, contact_nom, contact_prenom, email, telephone, adresse, ville, pays, etoiles, nb_chambres, commission, statut)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 7.50, 'prospect')`,
      [nom_hotel, contact_nom || null, contact_prenom || null, email, telephone || null, adresse || null, ville || null, pays || 'France', etoiles || null, nb_chambres || null]
    );

    try {
      const transporter = createTransporter();
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: 'contact@warfira.com',
        subject: `🏨 Nouvel hôtelier WHS — ${nom_hotel}`,
        html: `
          <h2 style="color:#28368C;">Nouvel hôtelier WHS</h2>
          <table style="border-collapse:collapse;width:100%;">
            <tr><td style="padding:8px;font-weight:bold;">Hôtel</td><td style="padding:8px;">${nom_hotel}</td></tr>
            <tr style="background:#EEF1FA;"><td style="padding:8px;font-weight:bold;">Contact</td><td style="padding:8px;">${contact_prenom || ''} ${contact_nom || ''}</td></tr>
            <tr><td style="padding:8px;font-weight:bold;">Email</td><td style="padding:8px;">${email}</td></tr>
            <tr style="background:#EEF1FA;"><td style="padding:8px;font-weight:bold;">Ville</td><td style="padding:8px;">${ville || 'Non renseigné'}</td></tr>
            <tr><td style="padding:8px;font-weight:bold;">Étoiles</td><td style="padding:8px;">${etoiles ? etoiles + ' ⭐' : 'Non renseigné'}</td></tr>
            <tr style="background:#EEF1FA;"><td style="padding:8px;font-weight:bold;">Chambres</td><td style="padding:8px;">${nb_chambres || 'Non renseigné'}</td></tr>
          </table>
          <p style="color:#28368C;font-weight:bold;">Commission proposée : 5-10% (vs OTAs 15-25%)</p>
        `
      });
    } catch (emailError) {
      console.error('⚠️ Email non envoyé :', emailError.message);
    }

    res.json({ success: true, message: '✅ Hôtelier enregistré avec succès !' });

  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ success: false, message: 'Cet email est déjà enregistré.' });
    }
    console.error('❌ Erreur /api/hoteliers :', error);
    res.status(500).json({ success: false, message: 'Erreur serveur.', error: error.message });
  }
});

// GET — Liste des hôteliers WHS
app.get('/api/hoteliers', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM hoteliers_whs ORDER BY created_at DESC');
    res.json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur serveur.', error: error.message });
  }
});

// ============================================================
// BLOC 4 — FORMULAIRE DISTRIBUTEURS
// ============================================================
app.post('/api/distributeurs', async (req, res) => {
  const { nom, prenom, email, telephone, entreprise, type_distributeur, ville, pays, zone_couverte } = req.body;

  if (!nom || !prenom || !email || !type_distributeur) {
    return res.status(400).json({ success: false, message: 'Champs obligatoires manquants.' });
  }

  try {
    await db.query(
      `INSERT INTO distributeurs 
       (nom, prenom, email, telephone, entreprise, type_distributeur, ville, pays, zone_couverte, statut)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'prospect')`,
      [nom, prenom, email, telephone || null, entreprise || null, type_distributeur, ville || null, pays || 'France', zone_couverte || null]
    );

    res.json({ success: true, message: '✅ Distributeur enregistré avec succès !' });

  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ success: false, message: 'Cet email est déjà enregistré.' });
    }
    console.error('❌ Erreur /api/distributeurs :', error);
    res.status(500).json({ success: false, message: 'Erreur serveur.', error: error.message });
  }
});

// GET — Liste des distributeurs
app.get('/api/distributeurs', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM distributeurs ORDER BY created_at DESC');
    res.json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur serveur.', error: error.message });
  }
});

// ============================================================
// BLOC 5 — FORMULAIRE SÉRÉNITÉ — ATHLÈTES
// ============================================================

// GET — Liste des sports (pour remplir les listes déroulantes)
app.get('/api/sports', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM sports WHERE 1 ORDER BY nom ASC');
    res.json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur serveur.', error: error.message });
  }
});

// GET — Catégories de poids par sport
app.get('/api/categories-poids/:sport_id', async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM categories_poids WHERE sport_id = ? ORDER BY genre, poids_max ASC',
      [req.params.sport_id]
    );
    res.json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur serveur.', error: error.message });
  }
});

// POST — Enregistrement athlète (prise en charge complète)
app.post('/api/athletes', async (req, res) => {
  const {
    nom, prenom, date_naissance, nationalite, genre,
    sport_id, categorie_poids_id, poids_actuel_kg, taille_cm,
    niveau, objectif, email, telephone,
    // Infos compétition (optionnel — si prise en charge complète)
    competition_nom, competition_ville, competition_pays,
    competition_date_debut, competition_date_fin,
    date_depart, date_retour,
    besoins_nutrition, besoins_medicaux, equipements
  } = req.body;

  if (!nom || !prenom || !genre || !sport_id) {
    return res.status(400).json({ success: false, message: 'Champs obligatoires manquants.' });
  }

  try {
    // 1 — Enregistrer l'athlète
    const [athleteResult] = await db.query(
      `INSERT INTO athletes 
       (nom, prenom, date_naissance, nationalite, genre, sport_id, categorie_poids_id, 
        poids_actuel_kg, taille_cm, niveau, objectif, email, telephone, statut)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'actif')`,
      [nom, prenom, date_naissance || null, nationalite || null, genre, sport_id,
       categorie_poids_id || null, poids_actuel_kg || null, taille_cm || null,
       niveau || 'national', objectif || null, email || null, telephone || null]
    );

    const athlete_id = athleteResult.insertId;

    // 2 — Si compétition renseignée → créer la compétition + délégation + logistique
    if (competition_nom && competition_date_debut) {

      // Créer la compétition
      const [compResult] = await db.query(
        `INSERT INTO competitions (sport_id, nom, type, ville, pays, date_debut, date_fin, niveau, statut)
         VALUES (?, ?, 'championnat', ?, ?, ?, ?, 'national', 'a_venir')`,
        [sport_id, competition_nom, competition_ville || null, competition_pays || null,
         competition_date_debut, competition_date_fin || null]
      );

      const competition_id = compResult.insertId;

      // Créer la délégation
      const [delResult] = await db.query(
        `INSERT INTO delegations (competition_id, nb_athletes, nb_encadrants, date_depart, date_retour, statut)
         VALUES (?, 1, 0, ?, ?, 'en_preparation')`,
        [competition_id, date_depart || null, date_retour || null]
      );

      const delegation_id = delResult.insertId;

      // Lier l'athlète à la délégation
      await db.query(
        `INSERT INTO delegation_athletes (delegation_id, athlete_id, categorie_poids_id, statut)
         VALUES (?, ?, ?, 'selectionne')`,
        [delegation_id, athlete_id, categorie_poids_id || null]
      );

      // Enregistrer la logistique
      if (besoins_nutrition || besoins_medicaux || equipements) {
        await db.query(
          `INSERT INTO logistique_sportive (delegation_id, equipements, besoins_nutrition, besoins_medicaux)
           VALUES (?, ?, ?, ?)`,
          [delegation_id, equipements || null, besoins_nutrition || null, besoins_medicaux || null]
        );
      }
    }

    // 3 — Email notification
    try {
      const transporter = createTransporter();
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: 'contact@warfira.com',
        subject: `🥈 Nouvel athlète Sérénité — ${prenom} ${nom}`,
        html: `
          <h2 style="color:#1A2E5A;">Nouveau dossier athlète WARFIRA Sérénité</h2>
          <table style="border-collapse:collapse;width:100%;">
            <tr><td style="padding:8px;font-weight:bold;">Athlète</td><td style="padding:8px;">${prenom} ${nom}</td></tr>
            <tr style="background:#EEF1FA;"><td style="padding:8px;font-weight:bold;">Genre</td><td style="padding:8px;">${genre}</td></tr>
            <tr><td style="padding:8px;font-weight:bold;">Nationalité</td><td style="padding:8px;">${nationalite || 'Non renseigné'}</td></tr>
            <tr style="background:#EEF1FA;"><td style="padding:8px;font-weight:bold;">Sport</td><td style="padding:8px;">ID ${sport_id}</td></tr>
            <tr><td style="padding:8px;font-weight:bold;">Poids actuel</td><td style="padding:8px;">${poids_actuel_kg ? poids_actuel_kg + ' kg' : 'Non renseigné'}</td></tr>
            <tr style="background:#EEF1FA;"><td style="padding:8px;font-weight:bold;">Objectif</td><td style="padding:8px;">${objectif || 'Non renseigné'}</td></tr>
            <tr><td style="padding:8px;font-weight:bold;">Compétition</td><td style="padding:8px;">${competition_nom || 'Non renseignée'}</td></tr>
            <tr style="background:#EEF1FA;"><td style="padding:8px;font-weight:bold;">Email</td><td style="padding:8px;">${email || 'Non renseigné'}</td></tr>
          </table>
          <p style="color:#C0C0C0;font-weight:bold;">Voyager avec WARFIRA, c'est financer une médaille. 🥈</p>
        `
      });
    } catch (emailError) {
      console.error('⚠️ Email non envoyé :', emailError.message);
    }

    res.json({ 
      success: true, 
      message: '✅ Dossier athlète enregistré avec succès !',
      athlete_id 
    });

  } catch (error) {
    console.error('❌ Erreur /api/athletes :', error);
    res.status(500).json({ success: false, message: 'Erreur serveur.', error: error.message });
  }
});

// GET — Liste des athlètes
app.get('/api/athletes', async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT a.*, s.nom as sport_nom, c.libelle as categorie_poids
       FROM athletes a
       LEFT JOIN sports s ON a.sport_id = s.id
       LEFT JOIN categories_poids c ON a.categorie_poids_id = c.id
       ORDER BY a.created_at DESC`
    );
    res.json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur serveur.', error: error.message });
  }
});

// ============================================================
// BLOC 6 — FORMULAIRE ÉVÉNEMENTIELS
// ============================================================
app.post('/api/evenements', async (req, res) => {
  const {
    prenom, nom, email, telephone, organisme, type_organisme,
    type_evenement, type_espace, nb_invites, ville_souhaitee,
    date_evenement, date_alternative, heure_debut, duree,
    besoins_traiteur, besoins_decoration, besoins_transferts, besoins_av,
    budget_estime, source, message
  } = req.body;

  if (!prenom || !nom || !email || !type_evenement || !type_espace || !duree || !type_organisme) {
    return res.status(400).json({ success: false, message: 'Champs obligatoires manquants.' });
  }

  try {
    await db.query(
      `INSERT INTO evenements_location 
       (prenom, nom, email, telephone, organisme, type_organisme,
        type_evenement, type_espace, nb_invites, ville_souhaitee,
        date_evenement, date_alternative, heure_debut, duree,
        besoins_traiteur, besoins_decoration, besoins_transferts, besoins_av,
        budget_estime, source, message, statut)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'nouveau')`,
      [prenom, nom, email, telephone || null, organisme || null, type_organisme,
       type_evenement, type_espace, nb_invites || null, ville_souhaitee || null,
       date_evenement || null, date_alternative || null, heure_debut || null, duree,
       besoins_traiteur || 'non_souhaite', besoins_decoration || 'non_souhaite',
       besoins_transferts || 'non_souhaite', besoins_av || 'non_souhaite',
       budget_estime || null, source || null, message || null]
    );

    // Email notification
    try {
      const transporter = createTransporter();
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: 'contact@warfira.com',
        subject: `🏰 Nouvelle demande événementielle — ${type_evenement} (${prenom} ${nom})`,
        html: `
          <h2 style="color:#28368C;">Nouvelle demande événementielle WARFIRA</h2>
          <table style="border-collapse:collapse;width:100%;">
            <tr><td style="padding:8px;font-weight:bold;">Contact</td><td style="padding:8px;">${prenom} ${nom}</td></tr>
            <tr style="background:#EEF1FA;"><td style="padding:8px;font-weight:bold;">Email</td><td style="padding:8px;">${email}</td></tr>
            <tr><td style="padding:8px;font-weight:bold;">Organisme</td><td style="padding:8px;">${organisme || 'Non renseigné'} (${type_organisme})</td></tr>
            <tr style="background:#EEF1FA;"><td style="padding:8px;font-weight:bold;">Type événement</td><td style="padding:8px;">${type_evenement}</td></tr>
            <tr><td style="padding:8px;font-weight:bold;">Espace souhaité</td><td style="padding:8px;">${type_espace}</td></tr>
            <tr style="background:#EEF1FA;"><td style="padding:8px;font-weight:bold;">Nb invités</td><td style="padding:8px;">${nb_invites || 'Non renseigné'}</td></tr>
            <tr><td style="padding:8px;font-weight:bold;">Date</td><td style="padding:8px;">${date_evenement || 'Non renseignée'}</td></tr>
            <tr style="background:#EEF1FA;"><td style="padding:8px;font-weight:bold;">Durée</td><td style="padding:8px;">${duree}</td></tr>
            <tr><td style="padding:8px;font-weight:bold;">Budget</td><td style="padding:8px;">${budget_estime || 'Non renseigné'}</td></tr>
            <tr style="background:#EEF1FA;"><td style="padding:8px;font-weight:bold;">Ville souhaitée</td><td style="padding:8px;">${ville_souhaitee || 'Non renseignée'}</td></tr>
            <tr><td style="padding:8px;font-weight:bold;">Message</td><td style="padding:8px;">${message || 'Aucun message'}</td></tr>
          </table>
        `
      });
    } catch (emailError) {
      console.error('⚠️ Email non envoyé :', emailError.message);
    }

    res.json({ success: true, message: '✅ Demande événementielle enregistrée ! Nous vous répondons sous 48h.' });

  } catch (error) {
    console.error('❌ Erreur /api/evenements :', error);
    res.status(500).json({ success: false, message: 'Erreur serveur.', error: error.message });
  }
});

// GET — Liste des événements
app.get('/api/evenements', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM evenements_location ORDER BY created_at DESC');
    res.json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur serveur.', error: error.message });
  }
});


app.listen(PORT, () => {
  console.log(`🚀 Serveur WARFIRA démarré sur le port ${PORT}`);
});
// ── WARFIRA AUTH MODAL ────────────────────────────────────────

const API = 'http://localhost:3000/api/auth';

// ── INJECTION HTML ─────────────────────────────────────────────
function injectAuthUI() {
  // 1. Bouton dans la navbar
  const navActions = document.querySelector('.nav-actions');
  if (navActions) {
    const btnConnexion = document.createElement('button');
    btnConnexion.className = 'auth-btn';
    btnConnexion.id = 'authNavBtn';
    btnConnexion.textContent = 'Connexion';
    btnConnexion.onclick = () => openModal('login');
    navActions.insertBefore(btnConnexion, navActions.firstChild);
  }

  // 2. Modal
  const modal = document.createElement('div');
  modal.className = 'auth-overlay';
  modal.id = 'authOverlay';
  modal.innerHTML = `
    <div class="auth-modal">
      <button class="auth-modal-close" onclick="closeModal()">✕</button>

      <div class="auth-modal-logo">
        <span>✦ WARFIRA ✦</span>
      </div>

      <!-- Onglets -->
      <div class="auth-tabs">
        <button class="auth-tab active" id="tabLogin" onclick="switchTab('login')">Connexion</button>
        <button class="auth-tab" id="tabRegister" onclick="switchTab('register')">Créer un compte</button>
      </div>

      <!-- Formulaire Connexion -->
      <form class="auth-form active" id="formLogin" onsubmit="handleLogin(event)">
        <div class="auth-field">
          <label>Email</label>
          <input type="email" id="loginEmail" placeholder="votre@email.com" required />
        </div>
        <div class="auth-field">
          <label>Mot de passe</label>
          <input type="password" id="loginPassword" placeholder="••••••••" required />
        </div>
        <button type="submit" class="auth-submit">Se connecter</button>
        <div class="auth-message" id="loginMsg"></div>
      </form>

      <!-- Formulaire Register -->
      <form class="auth-form" id="formRegister" onsubmit="handleRegister(event)">
        <div class="auth-field">
          <label>Nom complet</label>
          <input type="text" id="registerNom" placeholder="Votre nom" required />
        </div>
        <div class="auth-field">
          <label>Email</label>
          <input type="email" id="registerEmail" placeholder="votre@email.com" required />
        </div>
        <div class="auth-field">
          <label>Mot de passe</label>
          <input type="password" id="registerPassword" placeholder="Minimum 6 caractères" required minlength="6" />
        </div>
        <button type="submit" class="auth-submit">Créer mon compte</button>
        <div class="auth-message" id="registerMsg"></div>
      </form>
    </div>
  `;
  document.body.appendChild(modal);

  // Fermer en cliquant en dehors
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });

  // Vérifier si déjà connecté
  checkAuthState();
}

// ── MODAL ──────────────────────────────────────────────────────
function openModal(tab = 'login') {
  document.getElementById('authOverlay').classList.add('active');
  switchTab(tab);
}

function closeModal() {
  document.getElementById('authOverlay').classList.remove('active');
  clearMessages();
}

function switchTab(tab) {
  document.getElementById('formLogin').classList.toggle('active', tab === 'login');
  document.getElementById('formRegister').classList.toggle('active', tab === 'register');
  document.getElementById('tabLogin').classList.toggle('active', tab === 'login');
  document.getElementById('tabRegister').classList.toggle('active', tab === 'register');
  clearMessages();
}

function clearMessages() {
  ['loginMsg', 'registerMsg'].forEach(id => {
    const el = document.getElementById(id);
    if (el) { el.textContent = ''; el.className = 'auth-message'; }
  });
}

// ── LOGIN ──────────────────────────────────────────────────────
async function handleLogin(e) {
  e.preventDefault();
  const email = document.getElementById('loginEmail').value;
  const mot_de_passe = document.getElementById('loginPassword').value;
  const msgEl = document.getElementById('loginMsg');

  try {
    const res = await fetch(`${API}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, mot_de_passe })
    });

    const data = await res.json();

    if (res.ok) {
      localStorage.setItem('warfira_token', data.token);
      localStorage.setItem('warfira_user', JSON.stringify(data.user));
      msgEl.textContent = 'Connexion réussie !';
      msgEl.className = 'auth-message success';
      setTimeout(() => {
        closeModal();
        updateNavbar(data.user);
      }, 1000);
    } else {
      msgEl.textContent = data.message || 'Erreur de connexion.';
      msgEl.className = 'auth-message error';
    }
  } catch (err) {
    msgEl.textContent = 'Erreur réseau. Veuillez réessayer.';
    msgEl.className = 'auth-message error';
  }
}

// ── REGISTER ───────────────────────────────────────────────────
async function handleRegister(e) {
  e.preventDefault();
  const nom = document.getElementById('registerNom').value;
  const email = document.getElementById('registerEmail').value;
  const mot_de_passe = document.getElementById('registerPassword').value;
  const msgEl = document.getElementById('registerMsg');

  try {
    const res = await fetch(`${API}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nom, email, mot_de_passe })
    });

    const data = await res.json();

    if (res.ok) {
      msgEl.textContent = 'Compte créé ! Vous pouvez maintenant vous connecter.';
      msgEl.className = 'auth-message success';
      setTimeout(() => switchTab('login'), 2000);
    } else {
      msgEl.textContent = data.message || 'Erreur lors de la création.';
      msgEl.className = 'auth-message error';
    }
  } catch (err) {
    msgEl.textContent = 'Erreur réseau. Veuillez réessayer.';
    msgEl.className = 'auth-message error';
  }
}

// ── ÉTAT AUTH ──────────────────────────────────────────────────
function checkAuthState() {
  const user = JSON.parse(localStorage.getItem('warfira_user') || 'null');
  if (user) updateNavbar(user);
}

function updateNavbar(user) {
  const btn = document.getElementById('authNavBtn');
  if (!btn) return;

  btn.outerHTML = `
    <div class="auth-user-btn" id="authNavBtn">
      ✦ ${user.nom.split(' ')[0]}
      <div class="auth-user-dropdown">
        ${user.role === 'admin' ? '<a href="#">Tableau de bord</a>' : ''}
        <a href="#">Mon profil</a>
        <button onclick="logout()">Déconnexion</button>
      </div>
    </div>
  `;
}

function logout() {
  localStorage.removeItem('warfira_token');
  localStorage.removeItem('warfira_user');
  location.reload();
}

// ── INIT ───────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', injectAuthUI);
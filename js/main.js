/**
 * ===================================================================
 * PORTFOLIO ZOUHIR OUARAB — MODULE D'INTERFACE UTILISATEUR (main.js)
 * ===================================================================
 * Gère l'interactivité globale : thèmes clair/sombre, filtrage des profils
 * de lecture ciblés (RH, Chef de Projet, Tech Lead), modales et animations.
 */

/* ── Contenu adaptatif selon le profil recruteur ── */
const profileContent = {
  rh: {
    badge: {
      fr: '🎯 Ouvert à toute opportunité CDI dès Mai 2027 · Embarqué / Robotique / IA Embarquée / Logiciel / Front-End',
      en: '🎯 Open to all CDI opportunities from May 2027 · Embedded / Robotics / Edge AI / Software / Front-End'
    },
    sub: {
      fr: 'En <strong>Master 2 EEEA Paris-Saclay</strong>, actuellement en stage chez <strong>Vittascience</strong> en tant que <strong>développeur front-end & support technique</strong>. Ouvert à toute opportunité de <strong>CDI en Île-de-France dès Mai 2027</strong> : Ingénieur Systèmes Embarqués / Robotique / IA Embarquée / Logiciel Embarqué / Développeur Front-End. Fiable, rigoureux et autonome.',
      en: '<strong>Master 2 EEEA student (Paris-Saclay)</strong>, currently interning at <strong>Vittascience</strong> as a <strong>Front-End Developer & Technical Support</strong>. Open to all permanent contract (CDI) opportunities in <strong>Île-de-France starting May 2027</strong>: Embedded Systems / Robotics / Edge AI / Embedded Software / Front-End Developer.'
    }
  },
  manager: {
    badge: {
      fr: '🎯 Vision Système, Logiciel & Web · Conception, Intégration & Validation',
      en: '🎯 System, Software & Web Vision · Design, Integration & Validation'
    },
    sub: {
      fr: 'De l\'architecture matérielle à l\'application logicielle et web de pilotage, je conçois des systèmes autonomes fiables et éprouvés sur cibles réelles. Disponible pour un <strong>CDI en Île-de-France dès Mai 2027</strong>.',
      en: 'From hardware architecture to control software and web applications, I develop robust systems tested on real hardware. Available for a <strong>permanent position (CDI) in Île-de-France starting May 2027</strong>.'
    }
  },
  tech: {
    badge: {
      fr: '👨‍💻 C/C++ 64-bits · Qt · Systèmes Embarqués · Robotique · Web',
      en: '👨‍💻 64-bit C/C++ · Qt · Embedded Systems · Robotics · Web'
    },
    sub: {
      fr: 'Stack : <strong>C/C++ (64-bits)</strong>, <strong>Qt</strong>, <strong>STM32 / ARM</strong>, <strong>Microcontrôleurs</strong>, <strong>Liaisons Série & WebSerial/WebUSB</strong>, <strong>Robotique & IA Embarquée</strong>, <strong>Dév Front-End</strong>. En stage chez Vittascience, dispo pour un <strong>CDI dès Mai 2027</strong>.',
      en: 'Stack: <strong>64-bit C/C++</strong>, <strong>Qt</strong>, <strong>STM32 / ARM</strong>, <strong>Microcontrollers</strong>, <strong>Serial & WebSerial/WebUSB</strong>, <strong>Robotics & Edge AI</strong>, <strong>Front-End Dev</strong>. Interning at Vittascience, available for <strong>CDI starting May 2027</strong>.'
    }
  }
};

/* ── Gestionnaire de Thème (Sombre / Clair) ── */
let currentTheme = LS.get('theme') || (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');

function applyTheme(theme) {
  currentTheme = theme;
  LS.set('theme', theme);
  document.documentElement.classList.toggle('light', theme === 'light');
  const btn = document.getElementById('themeBtn');
  if (btn) btn.textContent = theme === 'dark' ? '☀️ Thème' : '🌙 Thème';
}

/* ── Filtre de lecture adaptatif selon l'audience cible ── */
function applyProfile(profile) {
  LS.set('profile', profile);
  document.querySelectorAll('.profile-pill').forEach(p => {
    p.classList.toggle('active', p.dataset.profile === profile);
  });

  if (profile && profile !== 'all' && profileContent[profile]) {
    document.body.setAttribute('data-profile', profile);
    const c = profileContent[profile];
    const badgeEl = document.getElementById('hero-badge-text');
    const subEl = document.getElementById('hero-sub');
    if (badgeEl && c.badge) badgeEl.innerHTML = c.badge[currentLang] || c.badge.fr;
    if (subEl && c.sub) subEl.innerHTML = c.sub[currentLang] || c.sub.fr;
  } else {
    document.body.removeAttribute('data-profile');
    const badgeEl = document.getElementById('hero-badge-text');
    const subEl = document.getElementById('hero-sub');
    if (badgeEl && i18n[currentLang] && i18n[currentLang]['hero.badge']) badgeEl.innerHTML = i18n[currentLang]['hero.badge'];
    if (subEl && i18n[currentLang] && i18n[currentLang]['hero.sub']) subEl.innerHTML = i18n[currentLang]['hero.sub'];
  }
}

document.querySelectorAll('.profile-pill').forEach(btn => {
  btn.addEventListener('click', () => applyProfile(btn.dataset.profile));
});

/* ── Modale Galerie VivaTech ── */
const vivaModal = document.getElementById('vivatech-modal');
const expVivatech = document.getElementById('exp-vivatech');
const vivaClose = document.getElementById('viva-close');

function openVivatech() {
  if (vivaModal) {
    vivaModal.classList.add('open');
    document.body.style.overflow = 'hidden';
  }
}

function closeVivatech() {
  if (vivaModal) {
    vivaModal.classList.remove('open');
    document.body.style.overflow = '';
  }
}

if (expVivatech) expVivatech.addEventListener('click', openVivatech);
if (vivaClose) vivaClose.addEventListener('click', closeVivatech);
if (vivaModal) vivaModal.addEventListener('click', e => { if (e.target === vivaModal) closeVivatech(); });
window.addEventListener('keydown', e => { if (e.key === 'Escape') closeVivatech(); });

/* ── Boutons d'en-tête & reset ── */
const resetBtn = document.getElementById('resetPrefs');
if (resetBtn) resetBtn.addEventListener('click', () => {
  ['profile','theme','lang'].forEach(k => LS.del(k));
  location.reload();
});

const themeBtn = document.getElementById('themeBtn');
const langBtn = document.getElementById('langBtn');
if (themeBtn) themeBtn.addEventListener('click', () => applyTheme(currentTheme === 'dark' ? 'light' : 'dark'));
if (langBtn) langBtn.addEventListener('click', () => applyLang(currentLang === 'fr' ? 'en' : 'fr'));

/* ── État de la barre de navigation au scroll ── */
const nav = document.getElementById('nav');
window.addEventListener('scroll', () => {
  if (nav) nav.classList.toggle('scrolled', window.scrollY > 50);
}, { passive: true });

/* ── Menu Mobile (Burger Drawer) ── */
const burger = document.getElementById('burger');
const drawer = document.getElementById('drawer');
if (burger && drawer) {
  burger.addEventListener('click', () => {
    const open = drawer.classList.toggle('open');
    burger.classList.toggle('open', open);
    document.body.style.overflow = open ? 'hidden' : '';
  });
  drawer.querySelectorAll('.dl').forEach(a => {
    a.addEventListener('click', () => {
      drawer.classList.remove('open');
      burger.classList.remove('open');
      document.body.style.overflow = '';
    });
  });
}

/* ── Scroll Reveal Observer (Animations d'apparition fluide) ── */
const rvObs = new IntersectionObserver((entries, obs) => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add('vis');
      obs.unobserve(e.target);
    }
  });
}, { threshold: 0.1 });
document.querySelectorAll('.rv').forEach(el => rvObs.observe(el));

/* ── Initialisation au chargement de la page ── */
(function init() {
  applyTheme(currentTheme);
  applyLang(currentLang);
  const savedProfile = LS.get('profile') || 'all';
  applyProfile(savedProfile);
})();

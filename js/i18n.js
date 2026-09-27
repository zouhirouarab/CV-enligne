/**
 * ===================================================================
 * PORTFOLIO ZOUHIR OUARAB — MODULE D'INTERNATIONALISATION (i18n)
 * ===================================================================
 * Gère le dictionnaire bilingue (Français / Anglais), la bascule
 * de langue dynamique et la persistance dans le localStorage.
 */

// Gestionnaire de stockage local (localStorage) sécurisé
const LS = {
  get: k => { try { return localStorage.getItem('zouPortfolio_' + k); } catch(e){ return null; } },
  set: (k, v) => { try { localStorage.setItem('zouPortfolio_' + k, v); } catch(e){} },
  del: k => { try { localStorage.removeItem('zouPortfolio_' + k); } catch(e){} }
};

// Dictionnaire bilingue complet
const i18n = {
  fr: {
    'nav.about':'Profil', 'nav.edu':'Formation', 'nav.exp':'Expériences', 'nav.skills':'Compétences', 'nav.projects':'Démonstrateurs', 'nav.contact':'Contact',
    'hero.badge':'🎯 Ouvert à toute opportunité CDI dès Mai 2027 · Ingénieur Systèmes Embarqués / Robotique / IA Embarquée / Logiciel Embarqué / Développeur Front-End',
    'hero.kicker':'Master 2 EEEA Paris-Saclay (En cours) · En stage chez Vittascience · Disponible dès Mai 2027',
    'hero.sub':'<strong>Stagiaire chez <a href="https://fr.vittascience.com" target="_blank" rel="noopener noreferrer" class="hero-link">Vittascience</a></strong> en tant que <strong>développeur front-end & support technique</strong> — conception d\'interfaces web, interfaçage matériel pour microcontrôleurs, capteurs, robotique et IA embarquée.',
    'hero.btn1':'Consulter mes projets', 'hero.btn2':'Me contacter',
    'hero.chip1':'Systèmes Embarqués & Firmware C/C++',
    'hero.chip2':'Robotique & Capteurs',
    'hero.chip3':'IA Embarquée (Edge AI)',
    'hero.chip4':'Dév Web & Interfaçage (WebSerial/WebUSB)',
    'prof.header':'Mode de lecture ciblé :',
    'prof.all':'✨ Vue Complète',
    'prof.rh':'👔 Recruteur / RH',
    'prof.manager':'🎯 Chef de Projet',
    'prof.tech':'👨‍💻 Tech Lead / Ingénieur',
    'about.tag':'Profil Technique', 'about.title':'Présentation.',
    'about.text1':'Actuellement en <strong>Master 2 EEEA</strong> (Systèmes Autonomes et Mobiles) à l\'Université Paris-Saclay et en <strong>stage chez Vittascience</strong> en tant que <strong>développeur front-end & support technique</strong>, je suis <strong>ouvert à toute opportunité CDI en Île-de-France dès Mai 2027</strong> en tant qu\'<strong>Ingénieur Systèmes Embarqués / Robotique / IA Embarquée / Logiciel Embarqué / Développeur Front-End</strong>.',
    'about.text2':'Mon parcours combine rigueur scientifique et développement concret : de l\'architecture firmware C/C++ et de l\'interfaçage de capteurs jusqu\'au déploiement d\'IA embarquée (Edge AI), la conception d\'interfaces logicielles applicatives (Qt) et le développement web pour la programmation et le pilotage de cartes microcontrôleurs et de robots.',
    'about.stat1':'Paris-Saclay', 'about.stat2':'Démonstrateurs', 'about.stat3':'Cibles Réelles',
    'edu.tag':'Parcours Académique', 'edu.title':'Formation & Diplômes.',
    'edu.desc':'Un socle scientifique et technique d\'excellence alliant rigueur théorique et projets de conception appliquée.',
    'edu.m2.title':'Master 2 EEEA (Systèmes Autonomes et Mobiles)',
    'edu.m2.school':'Université Paris-Saclay · Faculté des Sciences d\'Orsay',
    'edu.m2.date':'2025 – 2026 (En cours)',
    'edu.m2.desc':'Formation d\'excellence en ingénierie des systèmes autonomes : modélisation et commande avancée, perception et fusion multi-capteurs, architectures matérielles embarquées (STM32/ARM, FPGA), et intégration logicielle temps réel.',
    'edu.m1.title':'Master 1 Systèmes Électroniques & Automatique',
    'edu.m1.school':'Université Paris-Saclay',
    'edu.m1.date':'2024 – 2025',
    'edu.m1.desc':'Conception de systèmes à microcontrôleurs STM32 (ARM Cortex-M), programmation C/C++ bare-metal, protocoles de communication industriels (CAN, SPI, I2C, UART), et modélisation sous MATLAB/Simulink.',
    'edu.lic.title':'Licence Électronique, Énergie Électrique & Automatique (EEA)',
    'edu.lic.school':'Université Paris-Saclay',
    'edu.lic.date':'2021 – 2024',
    'edu.lic.desc':'Fondamentaux en électronique analogique et numérique, filtrage, amplificateurs opérationnels, synthèse VHDL sur FPGA, asservissements continus et discrets, et instrumentation de laboratoire.',
    'exp.tag':'Parcours Professionnel', 'exp.title':'Expériences.',
    'exp.desc':'Expériences industrielles et logicielles alliant développement embarqué, interfaçage matériel et conception d\'outils temps réel.',
    'exp.vitta.badge':'Stage Ingénieur (En cours)',
    'exp.vitta.role':'Stagiaire Développeur Front-End & Support Technique',
    'exp.vitta.org':'Vittascience',
    'exp.vitta.date':'Actuel · En cours',
    'exp.vitta.loc':'📍 Île-de-France',
    'exp.vitta.desc':'Conception et évolution d\'interfaces web pour programmer des microcontrôleurs et des robots éducatifs directement depuis le navigateur (WebSerial, WebUSB). Support technique et intégration continue selon les retours des utilisateurs.',
    'exp.lpens.badge':'Stage Ingénieur R&D',
    'exp.lpens.role':'Stagiaire Ingénieur R&D Logiciel',
    'exp.lpens.org':'LPENS',
    'exp.lpens.date':'Précédent',
    'exp.lpens.loc':'📍 Paris',
    'exp.lpens.desc':'Architecture logicielle 64-bits en C++ et interfaçage matériel pour caméra et banc d\'instrumentation scientifique : drivers SDK, communication série, gestion d\'acquisitions en temps réel et prototypage d\'interface applicative sous Qt.',
    'exp.viva.badge':'Bénévolat Technologie', 'exp.viva.date':'17 – 20 juin 2026',
    'exp.viva.b1':'Accueil, orientation et guidage des visiteurs professionnels et délégations tech.',
    'exp.viva.b2':'Assistance opérationnelle aux exposants et participation au bon déroulement de l\'événement international.',
    'exp.viva.link':'Voir la galerie photo 📸',
    'exp.jobs.badge':'Restauration & Commerce',
    'exp.jobs.role':'Équipier polyvalent (CDI temps partiel)',
    'exp.jobs.date':'Août 2023 – Présent',
    'exp.jobs.loc':'📍 Île-de-France',
    'exp.jobs.b1':'Gestion simultanée de plusieurs postes dans un environnement à très haute cadence.',
    'exp.jobs.b2':'Esprit d\'équipe, gestion du stress et adaptation immédiate aux imprévus opérationnels.',
    'exp.jobs.b3':'Fiabilité, assiduité et ponctualité démontrées sur un contrat CDI depuis plus de 2 ans en parallèle des études d\'ingénierie.',
    'diff.tag':'Expertise & Positionnement', 'diff.title':'Points forts.',
    'diff.desc':'Les atouts d\'un profil capable de décloisonner matériel, logiciel bas niveau et algorithmique avancée.',
    'diff.c1.title':'Intégration systémique',
    'diff.c1.desc':'Capacité reconnue à concevoir le schéma électronique (KiCad/LTspice), écrire le firmware bas niveau (C/C++ STM32) et implémenter la chaîne de perception neuronale (YOLOv8/PyTorch).',
    'diff.c2.title':'Validation expérimentale',
    'diff.c2.desc':'Maîtrise de la chaîne d\'instrumentation et de mesure pour valider chaque modèle théorique sur banc d\'essai réel (oscilloscope, analyseur logique, régulation PID, DSP audio).',
    'diff.c3.title':'Environnements contraints',
    'diff.c3.desc':'Appétence pour les architectures critiques : gestion stricte de la latence, déterminisme temps réel, gestion de la mémoire et robustesse face aux perturbations physiques.',
    'skills.tag':'Compétences Techniques', 'skills.title':'Stack & Outils.',
    'skills.desc':'Environnement technologique et outils de simulation maîtrisés pour le développement de prototypes et de systèmes industriels.',
    'proj.tag':'Réalisations Techniques', 'proj.title':'Démonstrateurs.',
    'proj.desc':'Projets complets et documentés avec démonstrateurs interactifs : de la modélisation à la validation sur cible physique.',
    'contact.tag':'Disponibilité', 'contact.title':'Contactez-moi.',
    'contact.desc':'En Master 2 EEEA à Paris-Saclay et actuellement en stage chez Vittascience en tant que développeur front-end & support technique, je suis <strong>ouvert à toute opportunité CDI en Île-de-France dès Mai 2027 : Ingénieur Systèmes Embarqués / Robotique / IA Embarquée / Logiciel Embarqué / Développeur Front-End</strong>.<br><br>⏳ <strong>Disponible dès Mai 2027</strong>, je serais ravi d\'échanger sur vos projets et besoins techniques.',
    'contact.meta':'🎯 Ouvert à toute opportunité CDI dès Mai 2027 · Ingénieur Systèmes Embarqués / Robotique / IA Embarquée / Logiciel Embarqué / Développeur Front-End',
    'footer.reset':'Réinitialiser les préférences',
    'viva.modal.tag':'Immersion Technologique',
    'viva.modal.title':'Galerie VivaTech 2026',
    'viva.modal.sub':'Découverte des dernières innovations en robotique, IA et systèmes embarqués lors du plus grand salon européen de la tech.',
    'viva.item1.title':'Tech Up - VivaTech',
    'viva.item1.desc':'Bénévole pour l\'édition 2026, au cœur de l\'innovation technologique européenne.',
    'viva.item2.title':'Rencontres & Découvertes',
    'viva.item2.desc':'Échanges enrichissants avec les acteurs de la tech, startups et professionnels de l\'embarqué.',
    'viva.item3.title':'Écosystème Européen',
    'viva.item3.desc':'Immersion dans le plus grand salon européen dédié à la technologie et aux startups.'
  },
  en: {
    'nav.about':'Profile', 'nav.edu':'Education', 'nav.exp':'Experience', 'nav.skills':'Skills', 'nav.projects':'Demonstrators', 'nav.contact':'Contact',
    'hero.badge':'🎯 Open to all permanent contract (CDI) opportunities from May 2027 · Embedded Systems / Robotics / Edge AI / Embedded Software / Front-End Developer',
    'hero.kicker':'Master 2 EEEA Paris-Saclay (In progress) · Intern at Vittascience · Available May 2027',
    'hero.sub':'<strong>Intern at <a href="https://fr.vittascience.com" target="_blank" rel="noopener noreferrer" class="hero-link">Vittascience</a></strong> as a <strong>Front-End Developer & Technical Support</strong> — developing web programming interfaces, hardware interfacing for microcontrollers, sensors, robotics, and edge AI.',
    'hero.btn1':'View my projects', 'hero.btn2':'Contact me',
    'hero.chip1':'Embedded Systems & C/C++ Firmware',
    'hero.chip2':'Robotics & Sensors',
    'hero.chip3':'Edge AI & Embedded Machine Learning',
    'hero.chip4':'Web Dev & Hardware Interfacing (WebSerial/WebUSB)',
    'prof.header':'Customized view mode:',
    'prof.all':'✨ Full Overview',
    'prof.rh':'👔 Recruiter / HR',
    'prof.manager':'🎯 Project Lead / Manager',
    'prof.tech':'👨‍💻 Tech Lead / Engineer',
    'about.tag':'Technical Profile', 'about.title':'Overview.',
    'about.text1':'Currently in <strong>Master 2 EEEA</strong> (Autonomous & Mobile Systems) at Paris-Saclay University and <strong>interning at Vittascience</strong> as a <strong>Front-End Developer & Technical Support</strong>, I am <strong>open to all permanent contract (CDI) opportunities in Paris Region (Île-de-France) starting May 2027</strong> as an <strong>Embedded Systems / Robotics / Edge AI / Embedded Software / Front-End Developer</strong>.',
    'about.text2':'My background bridges scientific rigor with hands-on technical execution: from bare-metal C/C++ firmware architecture and sensor interfacing to edge AI deployment, application software UI design (Qt), and web development for programming and controlling microcontroller boards and robots.',
    'about.stat1':'Paris-Saclay', 'about.stat2':'Demonstrators', 'about.stat3':'Real Hardware',
    'edu.tag':'Academic Background', 'edu.title':'Education & Degrees.',
    'edu.desc':'A strong scientific and engineering foundation combining theoretical rigor with practical design projects.',
    'edu.m2.title':'Master 2 EEEA (Autonomous & Mobile Systems)',
    'edu.m2.school':'Paris-Saclay University · Orsay Faculty of Sciences',
    'edu.m2.date':'2025 – 2026 (In progress)',
    'edu.m2.desc':'Excellence degree in autonomous systems engineering: advanced modeling and control, multi-sensor perception and fusion, embedded hardware architectures (STM32/ARM, FPGA), and real-time software integration.',
    'edu.m1.title':'Master 1 Electronic Systems & Automation',
    'edu.m1.school':'Paris-Saclay University',
    'edu.m1.date':'2024 – 2025',
    'edu.m1.desc':'Design of STM32 microcontroller systems (ARM Cortex-M), bare-metal C/C++ programming, industrial communication protocols (CAN, SPI, I2C, UART), and MATLAB/Simulink modeling.',
    'edu.lic.title':'Bachelor degree in Electronics, Electrical Energy & Automation (EEA)',
    'edu.lic.school':'Paris-Saclay University',
    'edu.lic.date':'2021 – 2024',
    'edu.lic.desc':'Fundamentals in analog and digital electronics, active filtering, operational amplifiers, VHDL synthesis on FPGA, linear continuous and discrete control systems, and lab instrumentation.',
    'exp.tag':'Professional Background', 'exp.title':'Experience.',
    'exp.desc':'Industrial and software engineering experiences bridging embedded firmware, hardware interfacing, and real-time instrumentation software.',
    'exp.vitta.badge':'Current Internship',
    'exp.vitta.role':'Front-End Developer & Technical Support Intern',
    'exp.vitta.org':'Vittascience',
    'exp.vitta.date':'Current · Ongoing',
    'exp.vitta.loc':'📍 Paris Region (Île-de-France)',
    'exp.vitta.desc':'Design and evolution of web interfaces to program and control microcontroller boards and educational robots directly from the browser (WebSerial, WebUSB). Technical support and continuous integration based on user feedback.',
    'exp.lpens.badge':'R&D Internship',
    'exp.lpens.role':'R&D Software Engineer Intern',
    'exp.lpens.org':'LPENS',
    'exp.lpens.date':'Previous',
    'exp.lpens.loc':'📍 Paris',
    'exp.lpens.desc':'Redesign of an industrial 64-bit C++ software architecture for cameras and scientific instrumentation testbenches: low-level hardware interfacing (SDK drivers), serial communication, real-time data acquisition, and application UI prototyping with Qt.',
    'exp.viva.badge':'Tech Volunteering', 'exp.viva.date':'June 17 – 20, 2026',
    'exp.viva.b1':'Welcoming, guiding, and orienting professional visitors and tech delegations.',
    'exp.viva.b2':'Operational support for exhibitors and smooth logistics coordination at Europe\'s premier tech event.',
    'exp.viva.link':'View photo gallery 📸',
    'exp.jobs.badge':'Retail & Fast Food',
    'exp.jobs.role':'Versatile Team Member (Part-time permanent contract)',
    'exp.jobs.date':'Aug 2023 – Present',
    'exp.jobs.loc':'📍 Paris Region (Île-de-France)',
    'exp.jobs.b1':'Simultaneous multi-station operations in a fast-paced environment.',
    'exp.jobs.b2':'Teamwork, stress resistance, and instant adaptation to operational priorities.',
    'exp.jobs.b3':'Demonstrated reliability and punctuality over 2+ years on a permanent contract alongside intensive engineering studies.',
    'diff.tag':'Expertise & Positioning', 'diff.title':'Key Strengths.',
    'diff.desc':'The advantages of an engineer bridging hardware, low-level firmware, and modern algorithmic AI.',
    'diff.c1.title':'System Integration',
    'diff.c1.desc':'Proven ability to design schematics and PCBs (KiCad/LTspice), program low-level firmware (C/C++ STM32), and deploy neural perception pipelines (YOLOv8/PyTorch).',
    'diff.c2.title':'Experimental Validation',
    'diff.c2.desc':'Mastery of the instrumentation and measurement chain to validate models on physical test benches (oscilloscopes, logic analyzers, PID tuning, DSP audio).',
    'diff.c3.title':'Constrained Environments',
    'diff.c3.desc':'Focus on critical architectures: strict latency management, real-time determinism, memory optimization, and resilience to physical perturbations.',
    'skills.tag':'Technical Skills', 'skills.title':'Stack & Tools.',
    'skills.desc':'Engineering toolset and simulation software mastered for prototype and industrial product development.',
    'proj.tag':'Technical Demonstrators', 'proj.title':'Projects.',
    'proj.desc':'Fully documented projects with interactive simulators: from mathematical modeling to physical hardware target validation.',
    'contact.tag':'Availability', 'contact.title':'Get in Touch.',
    'contact.desc':'Master 2 EEEA student at Paris-Saclay and currently interning at Vittascience as a front-end developer & technical support, I am <strong>open to all permanent contract (CDI) opportunities in Paris Region (Île-de-France) starting May 2027: Embedded Systems / Robotics / Edge AI / Embedded Software / Front-End Developer</strong>.<br><br>⏳ <strong>Available starting May 2027</strong>, I look forward to discussing your upcoming projects and technical requirements.',
    'contact.meta':'🎯 Open to all CDI opportunities from May 2027 · Embedded Systems / Robotics / Edge AI / Embedded Software / Front-End Developer',
    'footer.reset':'Reset preferences',
    'viva.modal.tag':'Tech Immersion',
    'viva.modal.title':'VivaTech 2026 Gallery',
    'viva.modal.sub':'Exploring the latest innovations in robotics, AI, and embedded systems at Europe\'s largest tech event.',
    'viva.item1.title':'Tech Up - VivaTech',
    'viva.item1.desc':'Volunteer for the 2026 edition, at the heart of European technological innovation.',
    'viva.item2.title':'Meetings & Discoveries',
    'viva.item2.desc':'Enriching exchanges with tech players, startups, and embedded systems professionals.',
    'viva.item3.title':'European Ecosystem',
    'viva.item3.desc':'Immersion in Europe\'s largest trade fair dedicated to technology and startups.'
  }
};

// Langue courante
let currentLang = LS.get('lang') || (navigator.language.startsWith('fr') ? 'fr' : 'en');

/**
 * Applique la langue sur l'ensemble des éléments [data-i18n]
 * @param {string} lang - 'fr' ou 'en'
 */
function applyLang(lang) {
  currentLang = lang;
  LS.set('lang', lang);
  document.documentElement.lang = lang;

  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.dataset.i18n;
    if (i18n[lang] && i18n[lang][key]) {
      el.innerHTML = i18n[lang][key];
    }
  });

  const btn = document.getElementById('langBtn');
  if (btn) {
    btn.textContent = lang === 'fr' ? '🇬🇧 EN' : '🇫🇷 FR';
    btn.title = lang === 'fr' ? 'Switch to English' : 'Passer en français';
  }

  // Si un profil ciblé est actif, réappliquer ses textes adaptés
  if (typeof applyProfile === 'function') {
    const currentProf = LS.get('profile');
    if (currentProf && currentProf !== 'all') applyProfile(currentProf);
  }
}

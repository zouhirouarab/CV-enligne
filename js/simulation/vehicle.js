/**
 * ===================================================================
 * MODULE SIMULATION 2/4 : MODÈLE VÉHICULE & TRAFIC (vehicle.js)
 * ===================================================================
 * Définit la cinématique non-holonome d'Ackermann (roues avant directrices),
 * les caractéristiques des agents autonomes (Ego + Trafic), les obstacles
 * statiques (plots de chantier) et leur rendu graphique sur le canvas.
 */

// Vitesse de croisière nominale (abscisse curviligne normalisée par frame)
const cruiseSpeed = 0.00065;

// Variables d'état interne du robot Ego (AUTONOMOUS NAV)
let robotProgress = 0.12;
let currentSpeed = 0.00065;
let lidarAngle = 0;
let steeringAngle = 0;      // Angle de braquage des roues avant relatif au châssis (radians)
let chassisPsi = 0;         // Angle de lacet du châssis relatif à la tangente du circuit (radians)
let currentLaneOffset = 15; // Voie 1 (nominale = +15px)
let targetLaneOffset = 15;  // Cible de voie (+15px = Voie 1, -15px = Voie 2)
let isBraking = false;
let isStopped = false;
let statusReason = 'NOMINAL';

// Wrapper objet de l'agent Robot Ego pour le contrôleur multi-agents
const egoRobot = {
  id: 'ego',
  dir: 1,
  get progress() { return robotProgress; },
  set progress(v) { robotProgress = v; },
  get speed() { return currentSpeed; },
  set speed(v) { currentSpeed = v; },
  baseSpeed: cruiseSpeed,
  nominalLane: 15,
  overtakeLane: -15,
  get currentLaneOffset() { return currentLaneOffset; },
  set currentLaneOffset(v) { currentLaneOffset = v; },
  get targetLaneOffset() { return targetLaneOffset; },
  set targetLaneOffset(v) { targetLaneOffset = v; },
  get steeringAngle() { return steeringAngle; },
  set steeringAngle(v) { steeringAngle = v; },
  get chassisPsi() { return chassisPsi; },
  set chassisPsi(v) { chassisPsi = v; },
  get isBraking() { return isBraking; },
  set isBraking(v) { isBraking = v; },
  get isStopped() { return isStopped; },
  set isStopped(v) { isStopped = v; },
  get statusReason() { return statusReason; },
  set statusReason(v) { statusReason = v; }
};

// 4 Véhicules de trafic autonomes avec vitesses et rôles différenciés
const trafficCars = [
  // 1. CAR-01 : Véhicule plus lent sur Voie 1 (provoque les dépassements)
  {
    id: 'fwd-1',
    dir: 1,
    progress: 0.42,
    nominalLane: 15,
    overtakeLane: -15,
    currentLaneOffset: 15,
    targetLaneOffset: 15,
    steeringAngle: 0,
    chassisPsi: 0,
    baseSpeed: cruiseSpeed * 0.78,
    speed: cruiseSpeed * 0.78,
    isBraking: false,
    isStopped: false,
    statusReason: 'NOMINAL',
    color: '#2563eb', // Bleu cobalt
    accent: '#60a5fa',
    label: 'CAR-01 (0.8x)'
  },
  // 2. CAR-02 : Véhicule rapide sur Voie 1 (dépasse activement les véhicules lents)
  {
    id: 'fwd-2',
    dir: 1,
    progress: 0.82,
    nominalLane: 15,
    overtakeLane: -15,
    currentLaneOffset: 15,
    targetLaneOffset: 15,
    steeringAngle: 0,
    chassisPsi: 0,
    baseSpeed: cruiseSpeed * 1.16,
    speed: cruiseSpeed * 1.16,
    isBraking: false,
    isStopped: false,
    statusReason: 'NOMINAL',
    color: '#059669', // Vert émeraude
    accent: '#34d399',
    label: 'CAR-02 (1.2x)'
  },
  // 3. CONTRESENS-1 : Véhicule en sens inverse sur Voie 2 (ambre)
  {
    id: 'rev-1',
    dir: -1,
    progress: 0.30,
    nominalLane: -15,
    overtakeLane: 15,
    currentLaneOffset: -15,
    targetLaneOffset: -15,
    steeringAngle: 0,
    chassisPsi: 0,
    baseSpeed: cruiseSpeed * 0.88,
    speed: cruiseSpeed * 0.88,
    isBraking: false,
    isStopped: false,
    statusReason: 'NOMINAL',
    color: '#d97706',
    accent: '#fbbf24',
    label: 'CONTRESENS-1'
  },
  // 4. CONTRESENS-2 : Véhicule en sens inverse sur Voie 2 (rose vif)
  {
    id: 'rev-2',
    dir: -1,
    progress: 0.86,
    nominalLane: -15,
    overtakeLane: 15,
    currentLaneOffset: -15,
    targetLaneOffset: -15,
    steeringAngle: 0,
    chassisPsi: 0,
    baseSpeed: cruiseSpeed * 1.10,
    speed: cruiseSpeed * 1.10,
    isBraking: false,
    isStopped: false,
    statusReason: 'NOMINAL',
    color: '#db2777',
    accent: '#f472b6',
    label: 'CONTRESENS-2'
  }
];

// Gestion des obstacles statiques aléatoires (plots de chantier)
const initNow = Date.now();
let roadObstacles = [
  {
    id: 1,
    progress: 0.65,
    lane: 15, // Plot présent sur Voie 1 à l'ouverture
    spawnTime: initNow,
    duration: 38000,
    opacity: 1
  }
];
let lastObstacleSpawn = initNow;

/**
 * Met à jour le cycle de vie des obstacles et en génère de nouveaux rarement
 */
function updateObstacles(now) {
  if (now - lastObstacleSpawn > 20000 && roadObstacles.length < 2) {
    if (Math.random() < 0.007) {
      lastObstacleSpawn = now;
      const spawnProg = (robotProgress + 0.25 + Math.random() * 0.45) % 1;
      const spawnLane = Math.random() < 0.75 ? 15 : -15; // 75% sur Voie 1
      roadObstacles.push({
        id: now,
        progress: spawnProg,
        lane: spawnLane,
        spawnTime: now,
        duration: 22000 + Math.random() * 10000,
        opacity: 0
      });
    }
  }

  roadObstacles = roadObstacles.filter(obs => {
    const age = now - obs.spawnTime;
    if (age < 1200) obs.opacity = age / 1200;
    else if (age > obs.duration - 1500) obs.opacity = Math.max(0, (obs.duration - age) / 1500);
    else obs.opacity = 1;
    return age < obs.duration;
  });
}

/**
 * Dessine un plot de chantier avec son périmètre radar animé
 */
function drawRoadObstacle(ctx, obs, isLight) {
  if (obs.opacity <= 0.01) return;
  const trackPoint = getTrackPos(obs.progress);
  const x = trackPoint.x + trackPoint.nx * obs.lane;
  const y = trackPoint.y + trackPoint.ny * obs.lane;

  ctx.save();
  ctx.globalAlpha = obs.opacity;

  // Périmètre d'alerte en tirets pulsants
  const pulse = 10 + Math.sin(Date.now() * 0.005) * 2;
  ctx.beginPath();
  ctx.arc(x, y, pulse, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(249, 115, 22, 0.45)';
  ctx.lineWidth = 1.2;
  ctx.setLineDash([3, 3]);
  ctx.stroke();
  ctx.setLineDash([]);

  // Socle du plot
  ctx.fillStyle = '#1c1917';
  ctx.beginPath();
  ctx.roundRect(x - 6, y - 6, 12, 12, 2);
  ctx.fill();

  // Corps conique orange
  ctx.fillStyle = '#f97316';
  ctx.beginPath();
  ctx.arc(x, y, 4.5, 0, Math.PI * 2);
  ctx.fill();

  // Bande blanche rétro-réfléchissante
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(x, y, 2.5, 0, Math.PI * 2);
  ctx.fill();

  // Pointe orange
  ctx.fillStyle = '#ea580c';
  ctx.beginPath();
  ctx.arc(x, y, 1.2, 0, Math.PI * 2);
  ctx.fill();

  // Étiquette télémétrique
  ctx.font = '600 7.5px "JetBrains Mono", Inter, monospace';
  ctx.fillStyle = '#fb923c';
  ctx.fillText('PLOT', x + 9, y + 3);

  ctx.restore();
}

/**
 * Dessine un véhicule de trafic (roues orientées Ackermann, phares, feux stop, badge)
 */
function drawTrafficVehicle(ctx, car, isLight) {
  const trackPoint = getTrackPos(car.progress);
  const laneOffset = (car.currentLaneOffset !== undefined) ? car.currentLaneOffset : car.nominalLane;
  const x = trackPoint.x + trackPoint.nx * laneOffset;
  const y = trackPoint.y + trackPoint.ny * laneOffset;
  const baseHeading = car.dir === 1 ? trackPoint.heading : trackPoint.heading + Math.PI;
  const heading = baseHeading + (car.chassisPsi || 0);

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(heading);

  // Faisceau de phares avant
  const grad = ctx.createRadialGradient(20, 0, 2, 70, 0, 60);
  grad.addColorStop(0, isLight ? 'rgba(0, 0, 0, 0.06)' : 'rgba(255, 255, 255, 0.10)');
  grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.beginPath();
  ctx.moveTo(18, 0);
  ctx.arc(18, 0, 70, -0.38, 0.38);
  ctx.closePath();
  ctx.fillStyle = grad;
  ctx.fill();

  // 4 Roues (Train arrière fixe, train avant orienté par steeringAngle)
  const wheelW = 9, wheelH = 4;
  ctx.fillStyle = isLight ? '#111317' : '#14161b';
  ctx.strokeStyle = isLight ? '#0f1115' : 'rgba(255, 255, 255, 0.35)';
  ctx.lineWidth = 1;
  [-13, 13].forEach(offsetY => {
    // Roues arrière
    ctx.beginPath();
    ctx.roundRect(-15 - wheelW / 2, offsetY - wheelH / 2, wheelW, wheelH, 1.2);
    ctx.fill();
    ctx.stroke();

    // Roues avant (orientées par la cinématique d'Ackermann)
    ctx.save();
    ctx.translate(13, offsetY);
    ctx.rotate(car.steeringAngle || 0);
    ctx.beginPath();
    ctx.roundRect(-wheelW / 2, -wheelH / 2, wheelW, wheelH, 1.2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  });

  // Châssis profilé du véhicule
  ctx.beginPath();
  ctx.moveTo(-16, -11);
  ctx.lineTo(10, -11);
  ctx.lineTo(18, -4);
  ctx.lineTo(18, 4);
  ctx.lineTo(10, 11);
  ctx.lineTo(-16, 11);
  ctx.closePath();
  ctx.fillStyle = isLight ? '#1e2430' : '#222834';
  ctx.fill();
  ctx.strokeStyle = car.accent;
  ctx.lineWidth = 1.3;
  ctx.stroke();

  // Bande centrale de toit
  ctx.fillStyle = car.color;
  ctx.beginPath();
  ctx.roundRect(-8, -4, 14, 8, 1.5);
  ctx.fill();

  // Feux stop arrière (illuminés en rouge vif lors du freinage ou de l'arrêt)
  [-7, 7].forEach(offsetY => {
    ctx.beginPath();
    ctx.roundRect(-17.5, offsetY - 1.5, 2, 3, 1);
    if (car.isBraking || car.isStopped) {
      ctx.fillStyle = '#ef4444';
      ctx.shadowColor = 'rgba(239, 68, 68, 0.9)';
      ctx.shadowBlur = 6;
      ctx.fill();
      ctx.shadowBlur = 0;
    } else {
      ctx.fillStyle = isLight ? '#7f1d1d' : '#450a0a';
      ctx.fill();
    }
  });

  // Phares LED avant
  [-7, 7].forEach(offsetY => {
    ctx.beginPath();
    ctx.arc(17, offsetY, 1.5, 0, Math.PI * 2);
    ctx.fillStyle = '#f8fafc';
    ctx.shadowColor = 'rgba(255, 255, 255, 0.8)';
    ctx.shadowBlur = 4;
    ctx.fill();
    ctx.shadowBlur = 0;
  });

  ctx.restore();

  // Badge télémétrique flottant au-dessus du véhicule
  ctx.font = '600 8px "JetBrains Mono", Inter, monospace';
  let badgeText = car.label;
  if (car.statusReason === 'OVERTAKING') {
    badgeText += ' [DÉPASSEMENT]';
  } else if (car.statusReason === 'WAIT_SAFE') {
    badgeText += ' [ATTENTE]';
  } else if (car.statusReason === 'RETREAT_NOMINAL' || car.statusReason === 'ABORT_OVERTAKE') {
    badgeText += ' [ÉVITEMENT]';
  } else if (car.isStopped) {
    badgeText += ' [STOP]';
  }
  const lblW = ctx.measureText(badgeText).width;
  ctx.fillStyle = isLight ? 'rgba(255, 255, 255, 0.88)' : 'rgba(15, 20, 28, 0.88)';
  ctx.strokeStyle = car.accent;
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.roundRect(x - lblW / 2 - 4, y - 22, lblW + 8, 13, 3);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = car.accent;
  ctx.fillText(badgeText, x - lblW / 2, y - 13);
}

/**
 * Dessine le Robot Ego principal (AUTONOMOUS NAV) avec sa tourelle LiDAR rotative 360°
 */
function drawEgoRobot(ctx, curPos, heading, isLight, isBraking, isStopped, lidarAngle, steeringAngle) {
  const robotBody = isLight ? '#1f242d' : '#222630';
  const robotStroke = isLight ? '#0f1115' : 'rgba(255, 255, 255, 0.45)';
  const wheelColor = isLight ? '#111317' : '#14161b';

  // 1. Enveloppe de sécurité radar lors du freinage / arrêt
  if (isBraking || isStopped) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(curPos.x, curPos.y, 75, heading - 0.7, heading + 0.7);
    ctx.strokeStyle = isStopped ? 'rgba(239, 68, 68, 0.55)' : 'rgba(245, 158, 11, 0.4)';
    ctx.lineWidth = 1.4;
    ctx.setLineDash([4, 4]);
    ctx.stroke();
    ctx.restore();
  }

  // 2. Rendu du robot dans son repère local
  ctx.save();
  ctx.translate(curPos.x, curPos.y);
  ctx.rotate(heading);

  // Cône de phares / champ capteurs
  const grad = ctx.createRadialGradient(25, 0, 2, 85, 0, 75);
  grad.addColorStop(0, isStopped ? 'rgba(239, 68, 68, 0.22)' : (isBraking ? 'rgba(245, 158, 11, 0.18)' : (isLight ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.12)')));
  grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.beginPath();
  ctx.moveTo(20, 0);
  ctx.arc(20, 0, 85, -0.42, 0.42);
  ctx.closePath();
  ctx.fillStyle = grad;
  ctx.fill();

  // 4 Roues (Train arrière fixe, train avant orienté dynamiquement)
  const wheelW = 10, wheelH = 4.5;
  ctx.fillStyle = wheelColor;
  ctx.strokeStyle = robotStroke;
  ctx.lineWidth = 1;

  [-14, 14].forEach(offsetY => {
    // Roues arrière
    ctx.beginPath();
    ctx.roundRect(-16 - wheelW / 2, offsetY - wheelH / 2, wheelW, wheelH, 1.5);
    ctx.fill();
    ctx.stroke();

    // Roues avant (directrices Ackermann)
    ctx.save();
    ctx.translate(14, offsetY);
    ctx.rotate(steeringAngle);
    ctx.beginPath();
    ctx.roundRect(-wheelW / 2, -wheelH / 2, wheelW, wheelH, 1.5);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  });

  // Châssis principal du robot
  ctx.beginPath();
  ctx.moveTo(-18, -12);
  ctx.lineTo(12, -12);
  ctx.lineTo(20, -5);
  ctx.lineTo(20, 5);
  ctx.lineTo(12, 12);
  ctx.lineTo(-18, 12);
  ctx.closePath();
  ctx.fillStyle = robotBody;
  ctx.fill();
  ctx.strokeStyle = robotStroke;
  ctx.lineWidth = 1.4;
  ctx.stroke();

  // Feux stop arrière
  [-8, 8].forEach(offsetY => {
    ctx.beginPath();
    ctx.roundRect(-19, offsetY - 2, 2.5, 4, 1);
    if (isStopped || isBraking) {
      ctx.fillStyle = '#ef4444';
      ctx.shadowColor = 'rgba(239, 68, 68, 0.95)';
      ctx.shadowBlur = 8;
      ctx.fill();
      ctx.shadowBlur = 0;
    } else {
      ctx.fillStyle = isLight ? '#7f1d1d' : '#450a0a';
      ctx.fill();
    }
  });

  // Baie électronique / MCU
  ctx.fillStyle = isLight ? '#333842' : '#14161a';
  ctx.beginPath();
  ctx.roundRect(-10, -6, 16, 12, 2);
  ctx.fill();

  // Tourelle LiDAR
  ctx.beginPath();
  ctx.arc(0, 0, 5, 0, Math.PI * 2);
  ctx.fillStyle = isLight ? '#111317' : '#2d3340';
  ctx.fill();
  ctx.strokeStyle = isStopped ? '#ef4444' : (isBraking ? '#f59e0b' : (isLight ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.4)'));
  ctx.stroke();

  // Rayon de balayage LiDAR rotatif à 360°
  ctx.save();
  ctx.rotate(lidarAngle);
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(45, 0);
  ctx.strokeStyle = isStopped ? 'rgba(239, 68, 68, 0.75)' : (isBraking ? 'rgba(245, 158, 11, 0.65)' : (isLight ? 'rgba(50, 60, 80, 0.45)' : 'rgba(200, 220, 255, 0.45)'));
  ctx.lineWidth = 1.2;
  ctx.setLineDash([3, 3]);
  ctx.stroke();
  ctx.restore();

  // LED frontale d'état
  ctx.beginPath();
  ctx.arc(17, 0, 2.2, 0, Math.PI * 2);
  if (isStopped) {
    ctx.fillStyle = (Date.now() % 400 < 200) ? '#ef4444' : '#b91c1c';
    ctx.shadowColor = 'rgba(239, 68, 68, 0.95)';
    ctx.shadowBlur = 7;
  } else if (isBraking) {
    ctx.fillStyle = '#f59e0b';
    ctx.shadowColor = 'rgba(245, 158, 11, 0.8)';
    ctx.shadowBlur = 4;
  } else {
    ctx.fillStyle = '#10b981';
    ctx.shadowColor = 'rgba(16, 185, 129, 0.6)';
    ctx.shadowBlur = 3;
  }
  ctx.fill();
  ctx.shadowBlur = 0;

  ctx.restore();
}

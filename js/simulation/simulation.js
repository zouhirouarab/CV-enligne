/**
 * ===================================================================
 * MODULE SIMULATION 4/4 : MOTEUR D'ANIMATION & RENDU (simulation.js)
 * ===================================================================
 * Orchestre le canvas en arrière-plan :
 * - Gestion du redimensionnement dynamique et du ratio HiDPI (Retina)
 * - Suivi du curseur souris pour l'interaction laser ADAS
 * - Boucle de rendu temps réel 60 FPS (requestAnimationFrame)
 * - Affichage des télémétries et HUDs interactifs
 */

(function initHeroRobotLine() {
  const canvas = document.getElementById('hero-robot-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  let width = 0, height = 0, dpr = Math.min(window.devicePixelRatio || 1, 2);
  let isVisible = true;

  // Position et état du curseur souris
  const mousePos = { x: -1000, y: -1000, active: false };

  // Écoute des mouvements de souris sur l'ensemble de la fenêtre
  window.addEventListener('mousemove', e => {
    mousePos.x = e.clientX;
    mousePos.y = e.clientY;
    mousePos.active = true;
  }, { passive: true });

  window.addEventListener('mouseleave', () => {
    mousePos.active = false;
  });

  // Gestion de la visibilité de l'onglet pour économiser les ressources GPU / CPU
  document.addEventListener('visibilitychange', () => {
    isVisible = !document.hidden;
  });

  // Redimensionnement dynamique avec support haute résolution (Retina / 4K)
  function resize() {
    width = window.innerWidth;
    height = window.innerHeight;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // Régénération géométrique de la spline du circuit
    generateTrack(width, height);
  }
  resize();
  window.addEventListener('resize', resize, { passive: true });

  /**
   * Boucle principale de simulation et de rendu graphique (60 FPS)
   */
  function render() {
    if (!isVisible) {
      requestAnimationFrame(render);
      return;
    }

    ctx.clearRect(0, 0, width, height);

    const isLight = document.documentElement.classList.contains('light');
    const textColor = isLight ? 'rgba(20, 24, 30, 0.75)' : 'rgba(240, 243, 248, 0.75)';

    // 1. Dessin de l'infrastructure routière (asphalte 2 voies, bordures, ligne médiane pointillée)
    drawRoadInfrastructure(ctx, isLight);

    // 2. Mise à jour et rendu des obstacles statiques (plots de signalisation)
    const now = Date.now();
    updateObstacles(now);
    roadObstacles.forEach(obs => drawRoadObstacle(ctx, obs, isLight));

    // 3. Calcul de la projection du curseur souris sur la chaussée (Capteur LiDAR virtuel)
    let mouseActiveOnRoad = false;
    let mouseTrackProg = 0;
    let mouseLatOffset = 999;
    let closestMouseDistSq = Infinity;

    if (mousePos.active && trackSamples.length > 0) {
      let closestIdx = 0;
      for (let i = 0; i < trackSamples.length; i++) {
        const s = trackSamples[i];
        const d2 = (mousePos.x - s.x) ** 2 + (mousePos.y - s.y) ** 2;
        if (d2 < closestMouseDistSq) {
          closestMouseDistSq = d2;
          closestIdx = i;
        }
      }
      const sMouse = trackSamples[closestIdx];
      mouseTrackProg = sMouse.distCum / trackLength;
      mouseLatOffset = (mousePos.x - sMouse.x) * sMouse.nx + (mousePos.y - sMouse.y) * sMouse.ny;
      mouseActiveOnRoad = Math.abs(mouseLatOffset) < 48 && Math.sqrt(closestMouseDistSq) < 52;
    }

    // 4. Contrôle multi-agents de tous les véhicules (Ego + 4 Véhicules de trafic)
    const allVehicles = [egoRobot, ...trafficCars];

    // 4.1 Mise à jour et dessin des véhicules du trafic
    trafficCars.forEach(car => {
      updateVehicleAgent(car, allVehicles, mouseActiveOnRoad, mouseTrackProg, mouseLatOffset);
      drawTrafficVehicle(ctx, car, isLight);
    });

    // 4.2 Mise à jour de l'agent Robot Ego (AUTONOMOUS NAV)
    updateVehicleAgent(egoRobot, allVehicles, mouseActiveOnRoad, mouseTrackProg, mouseLatOffset);

    // Calcul de la position cartésienne et de l'orientation de l'Ego Robot
    const curNominal = getTrackPos(robotProgress);
    const curPos = {
      x: curNominal.x + curNominal.nx * currentLaneOffset,
      y: curNominal.y + curNominal.ny * currentLaneOffset
    };
    const heading = curNominal.heading + chassisPsi;

    // Rotation continue de la tourelle LiDAR 360°
    lidarAngle += (currentSpeed > 0.0001 ? 0.06 : 0.025);

    // 4.3 Trajectoire spline prédictive lors des changements de voie
    if (Math.abs(currentLaneOffset - targetLaneOffset) > 1.2 || Math.abs(chassisPsi) > 0.04) {
      ctx.beginPath();
      ctx.moveTo(curPos.x, curPos.y);
      const targetLook = getTrackPos(robotProgress + 0.03);
      const targetLookPos = {
        x: targetLook.x + targetLook.nx * targetLaneOffset,
        y: targetLook.y + targetLook.ny * targetLaneOffset
      };
      ctx.quadraticCurveTo(
        (curPos.x + targetLookPos.x) / 2,
        (curPos.y + targetLookPos.y) / 2,
        targetLookPos.x,
        targetLookPos.y
      );
      ctx.strokeStyle = isLight ? 'rgba(56, 189, 248, 0.55)' : 'rgba(56, 189, 248, 0.7)';
      ctx.lineWidth = 1.4;
      ctx.setLineDash([3, 3]);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // 4.4 Dessin du Robot Ego principal
    drawEgoRobot(ctx, curPos, heading, isLight, isBraking, isStopped, lidarAngle, steeringAngle);

    // 5. Réticule et télémétrie laser de détection d'obstacle par curseur
    const obstacleDist = Math.hypot(mousePos.x - curPos.x, mousePos.y - curPos.y);
    if (mousePos.active && obstacleDist < 270) {
      const distMeters = (obstacleDist / 80).toFixed(2);
      const reticleColor = isStopped ? '#ef4444' : (isBraking ? '#f59e0b' : (isLight ? '#0284c7' : '#38bdf8'));

      // Faisceau laser virtuel pointé sur la cible
      ctx.beginPath();
      ctx.moveTo(curPos.x, curPos.y);
      ctx.lineTo(mousePos.x, mousePos.y);
      ctx.strokeStyle = isStopped ? 'rgba(239, 68, 68, 0.75)' : (isBraking ? 'rgba(245, 158, 11, 0.6)' : (isLight ? 'rgba(70, 80, 95, 0.35)' : 'rgba(180, 200, 230, 0.35)'));
      ctx.lineWidth = isStopped ? 1.6 : 1.2;
      ctx.setLineDash([4, 4]);
      ctx.stroke();
      ctx.setLineDash([]);

      // Cercle de visée
      ctx.beginPath();
      ctx.arc(mousePos.x, mousePos.y, 10, 0, Math.PI * 2);
      ctx.strokeStyle = reticleColor;
      ctx.lineWidth = 1.3;
      ctx.stroke();

      // Mires en croix
      ctx.beginPath();
      ctx.moveTo(mousePos.x - 14, mousePos.y); ctx.lineTo(mousePos.x - 5, mousePos.y);
      ctx.moveTo(mousePos.x + 5, mousePos.y); ctx.lineTo(mousePos.x + 14, mousePos.y);
      ctx.moveTo(mousePos.x, mousePos.y - 14); ctx.lineTo(mousePos.x, mousePos.y - 5);
      ctx.moveTo(mousePos.x, mousePos.y + 5); ctx.lineTo(mousePos.x, mousePos.y + 14);
      ctx.strokeStyle = reticleColor;
      ctx.lineWidth = 1.1;
      ctx.stroke();

      // Point central
      ctx.beginPath();
      ctx.arc(mousePos.x, mousePos.y, 2, 0, Math.PI * 2);
      ctx.fillStyle = reticleColor;
      ctx.fill();

      // Badge HUD du capteur ADAS
      ctx.font = '600 10px "JetBrains Mono", Inter, monospace';
      let label = `OBSTACLE: ${distMeters}m`;
      if (isStopped) {
        label += ` [ARRÊT D'URGENCE AEB]`;
      } else if (statusReason === 'WAIT_SAFE' || statusReason === 'WAIT_ONCOMING') {
        label += ` [ATTENTE PASSAGE CONTRESENS]`;
      } else if (statusReason === 'OVERTAKING' || statusReason === 'EVADE_VOIE_2' || statusReason === 'OVERTAKING_VOIE_2') {
        label += ` [DÉPASSEMENT SUR VOIE 2]`;
      } else if (statusReason === 'RETREAT_NOMINAL' || statusReason === 'ABORT_OVERTAKE') {
        label += ` [RABATTEMENT D'URGENCE]`;
      } else {
        label += ` [VOIE DÉGAGÉE]`;
      }

      const badgeWidth = ctx.measureText(label).width;
      ctx.fillStyle = isLight ? 'rgba(255, 255, 255, 0.92)' : 'rgba(15, 20, 28, 0.92)';
      ctx.strokeStyle = reticleColor;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(mousePos.x + 14, mousePos.y - 16, badgeWidth + 14, 20, 4);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = reticleColor;
      ctx.fillText(label, mousePos.x + 21, mousePos.y - 2.5);
    }

    // 6. Tableau de bord télémétrique en temps réel (vitesse, angle de braquage, état de navigation)
    ctx.font = '600 9.5px "JetBrains Mono", Inter, monospace';
    const speedMs = (currentSpeed * 1800).toFixed(1);
    const steerDeg = ((steeringAngle * 180) / Math.PI).toFixed(1);

    let hudText = `AUTONOMOUS NAV · VOIE 1 (NOMINALE) · V=${speedMs}m/s · ST=${steerDeg}°`;
    let hudColor = textColor;
    let hudBorder = isLight ? 'rgba(0, 0, 0, 0.15)' : 'rgba(255, 255, 255, 0.15)';

    if (isStopped) {
      hudText = `🛑 ARRÊT COMPLET (AEB) · ROUTE BLOQUÉE · V=0.0m/s`;
      hudColor = isLight ? '#dc2626' : '#f87171';
      hudBorder = '#ef4444';
    } else if (statusReason === 'WAIT_SAFE' || statusReason === 'WAIT_ONCOMING') {
      hudText = `⚠️ ATTENTE PASSAGE VÉHICULE EN CONTRESENS · V=${speedMs}m/s`;
      hudColor = isLight ? '#d97706' : '#fbbf24';
      hudBorder = '#f59e0b';
    } else if (statusReason === 'OVERTAKING' || statusReason === 'EVADE_VOIE_2' || statusReason === 'OVERTAKING_VOIE_2') {
      hudText = `🔄 DÉPASSEMENT D'OBSTACLE SUR VOIE 2 · V=${speedMs}m/s · ST=${steerDeg}°`;
      hudColor = isLight ? '#0284c7' : '#38bdf8';
      hudBorder = '#0ea5e9';
    } else if (statusReason === 'RETREAT_NOMINAL' || statusReason === 'ABORT_OVERTAKE') {
      hudText = `🛡️ RABATTEMENT D'URGENCE SUR VOIE 1 · V=${speedMs}m/s · ST=${steerDeg}°`;
      hudColor = isLight ? '#d97706' : '#fbbf24';
      hudBorder = '#f59e0b';
    }

    const telemW = ctx.measureText(hudText).width;
    ctx.fillStyle = isLight ? 'rgba(255, 255, 255, 0.90)' : 'rgba(15, 20, 28, 0.90)';
    ctx.strokeStyle = hudBorder;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(curPos.x + 22, curPos.y + 16, telemW + 14, 18, 4);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = hudColor;
    ctx.fillText(hudText, curPos.x + 29, curPos.y + 28.5);

    // Prochaine frame d'animation
    requestAnimationFrame(render);
  }

  // Démarrage du cycle d'animation
  render();
})();

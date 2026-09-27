/**
 * ===================================================================
 * MODULE SIMULATION 3/4 : CONTRÔLEUR ADAS & ANTI-DEADLOCK (controller.js)
 * ===================================================================
 * Implémente le cerveau décisionnel multi-agents :
 * 1. Perception de l'environnement (souris, plots de chantier, trafic)
 * 2. Résolution robuste des conflits face-à-face (Intrus vs Prioritaire)
 * 3. Décision de dépassement sécurisée avec horizon de 420px
 * 4. Régulateur adaptatif de vitesse (ACC)
 * 5. Asservissement en direction d'Ackermann (Pure Pursuit)
 */

/**
 * Met à jour un agent véhicule autonome selon la perception et les règles de circulation
 * @param {object} v - Véhicule à mettre à jour (Ego ou TrafficCar)
 * @param {Array} allVehicles - Ensemble de tous les véhicules en circulation
 * @param {boolean} mouseActiveOnRoad - Indique si le curseur souris est sur la chaussée
 * @param {number} mouseTrackProg - Abscisse curviligne du curseur souris [0, 1]
 * @param {number} mouseLatOffset - Déport latéral de la souris par rapport au centre de la route
 */
function updateVehicleAgent(v, allVehicles, mouseActiveOnRoad, mouseTrackProg, mouseLatOffset) {
  const otherVehicles = allVehicles.filter(o => o.id !== v.id);

  // Détermine si le véhicule est sur son côté nominal ou dans la voie de dépassement :
  // Voie 1 (dir = 1) : côté nominal > 0 (+15px), côté dépassement < 0 (-15px)
  // Voie 2 (dir = -1) : côté nominal < 0 (-15px), côté dépassement > 0 (+15px)
  const onNominalSide = (v.nominalLane > 0) ? (v.currentLaneOffset > 0) : (v.currentLaneOffset < 0);
  const onOvertakeSide = !onNominalSide;

  // ──────────────────────────────────────────────────────────
  // 1. PERCEPTION : OBSTACLE INTERACTIF CURSEUR SOURIS
  // ──────────────────────────────────────────────────────────
  let mouseAheadOnNominal = false;
  let mouseAlongsideOnNominal = false;
  let mouseBlockingOvertake = false;
  let mouseFrontalThreat = false;
  let dMouse = 999;

  if (mouseActiveOnRoad) {
    dMouse = getTrackDist(v.progress, mouseTrackProg, v.dir);
    const onNominal = (v.nominalLane > 0) ? (mouseLatOffset > -2 && mouseLatOffset < 36) : (mouseLatOffset < 2 && mouseLatOffset > -36);
    const onOvertake = (v.overtakeLane > 0) ? (mouseLatOffset > -2 && mouseLatOffset < 36) : (mouseLatOffset < 2 && mouseLatOffset > -36);

    mouseAheadOnNominal = onNominal && (dMouse > 15 && dMouse < 210);
    mouseAlongsideOnNominal = onNominal && (dMouse >= -26 && dMouse <= 26);
    mouseBlockingOvertake = onOvertake && (dMouse > -15 && dMouse < 180);

    // Menace de collision frontale directe avec le pare-choc
    const distFromVehicleCenter = Math.abs(mouseLatOffset - v.currentLaneOffset);
    if (distFromVehicleCenter < 13 && dMouse > 0 && dMouse < 40) {
      mouseFrontalThreat = true;
    }
  }

  // ──────────────────────────────────────────────────────────
  // 2. PERCEPTION : PLOTS DE CHANTIER STATIQUES
  // ──────────────────────────────────────────────────────────
  let coneAheadOnNominal = false;
  let coneAlongsideOnNominal = false;
  let coneBlockingOvertake = false;
  let coneFrontalThreat = false;

  for (let obs of roadObstacles) {
    if (obs.opacity > 0.25) {
      const dObs = getTrackDist(v.progress, obs.progress, v.dir);
      if (obs.lane === v.nominalLane) {
        if (dObs > 12 && dObs < 200) coneAheadOnNominal = true;
        if (dObs >= -25 && dObs <= 25) coneAlongsideOnNominal = true;
      }
      if (obs.lane === v.overtakeLane) {
        if (dObs > -15 && dObs < 180) coneBlockingOvertake = true;
      }
      const distFromLane = Math.abs(obs.lane - v.currentLaneOffset);
      if (distFromLane < 13 && dObs > 0 && dObs < 35) {
        coneFrontalThreat = true;
      }
    }
  }

  // ──────────────────────────────────────────────────────────
  // 3. PERCEPTION : VÉHICULES DU TRAFIC (MÊME SENS & CONTRESENS)
  // ──────────────────────────────────────────────────────────
  let leadCarAhead = false;
  let leadCarDist = 999;
  let leadCar = null;
  let carAlongsideOnNominal = false;
  let carBlockingOvertake = false;
  let oncomingDangerInOvertake = false;
  let oncomingDistInOvertake = 999;
  let sameDirectionFrontalThreat = false;

  // Menace imminente de face-à-face sur la même voie
  let faceToFaceOncomingThreat = false;
  let faceToFaceDist = 999;

  for (let o of otherVehicles) {
    const dOther = getTrackDist(v.progress, o.progress, v.dir);

    if (o.dir === v.dir) {
      // VÉHICULE DANS LE MÊME SENS DE CIRCULATION
      const oOnNominal = Math.abs(o.currentLaneOffset - v.nominalLane) < 14;
      const oOnOvertake = Math.abs(o.currentLaneOffset - v.overtakeLane) < 14;

      if (oOnNominal) {
        // Véhicule plus lent ou arrêté devant sur la voie nominale
        if (dOther > 12 && dOther < 110 && (v.baseSpeed > o.speed * 0.90 || o.isStopped)) {
          leadCarAhead = true;
          if (dOther < leadCarDist) {
            leadCarDist = dOther;
            leadCar = o;
          }
        }
        // Lorsque v est en dépassement, le véhicule dépassé est-il encore à hauteur ?
        if (dOther >= -34 && dOther <= 30) {
          carAlongsideOnNominal = true;
        }
      }

      if (oOnOvertake && (dOther > -28 && dOther < 110)) {
        carBlockingOvertake = true;
      }

      // Risque de collision pare-choc contre pare-choc dans la même voie
      if (Math.abs(o.currentLaneOffset - v.currentLaneOffset) < 13 && dOther > 0 && dOther < 42) {
        sameDirectionFrontalThreat = true;
      }
    } else {
      // VÉHICULE EN SENS INVERSE (CONTRESENS)
      // Horizon de sécurité anticipé de 420px sur la voie opposée
      if (dOther > 0 && dOther < 420) {
        const oNearOvertake = Math.abs(o.currentLaneOffset - v.overtakeLane) < 22 || Math.abs(o.targetLaneOffset - v.overtakeLane) < 22;
        if (oNearOvertake) {
          oncomingDangerInOvertake = true;
          if (dOther < oncomingDistInOvertake) {
            oncomingDistInOvertake = dOther;
          }
        }
      }

      // Menace de face-à-face sur la même voie !
      const lateralOverlap = Math.abs(o.currentLaneOffset - v.currentLaneOffset);
      if (lateralOverlap < 18 && dOther > 0 && dOther < 110) {
        faceToFaceOncomingThreat = true;
        if (dOther < faceToFaceDist) {
          faceToFaceDist = dOther;
        }
      }
    }
  }

  // ──────────────────────────────────────────────────────────
  // 4. SYNTHÈSE DÉCISIONNELLE & HIÉRARCHIE DES PRIORITÉS
  // ──────────────────────────────────────────────────────────
  // Obstacle devant sur la voie nominale (seul ce qui est devant déclenche un dépassement)
  const obstacleAheadOnNominal = mouseAheadOnNominal || coneAheadOnNominal || leadCarAhead;

  // Obstacle en cours de dépassement (maintien dans la voie de dépassement)
  const stillPassingObstacle = coneAlongsideOnNominal || carAlongsideOnNominal || mouseAlongsideOnNominal ||
                              coneAheadOnNominal || mouseAheadOnNominal || leadCarAhead;

  // Dépassement interdit ou dangereux :
  const overtakeBlocked = mouseBlockingOvertake || coneBlockingOvertake ||
                          carBlockingOvertake || oncomingDangerInOvertake ||
                          (v.dir === -1 && !coneAheadOnNominal); // Le contresens reste sur Voie 2 sauf plot

  let targetSpeed = v.baseSpeed;
  v.isBraking = false;
  v.isStopped = false;

  // PRIORITÉ 1 : CONFLIT FACE-À-FACE SUR LA MÊME VOIE (RÉSOLUTION ANTI-BLOCAGE)
  if (faceToFaceOncomingThreat) {
    if (onOvertakeSide) {
      // RÔLE : INTRUS (sur la voie opposée lors d'un dépassement)
      // Cède la priorité, engage un rabattement d'urgence vers sa voie nominale.
      // Conserve une vitesse de reptation (0.40x) pour que la cinématique Ackermann déplace la voiture latéralement !
      v.targetLaneOffset = v.nominalLane;
      targetSpeed = v.baseSpeed * 0.40;
      v.isBraking = true;
      v.statusReason = 'RETREAT_NOMINAL';

      // Biais d'évitement latéral actif : assure le franchissement rapide de la ligne médiane
      const evadeDir = Math.sign(v.nominalLane - v.currentLaneOffset);
      const lateralEvadeStep = Math.min(1.4, Math.max(0.6, (120 - faceToFaceDist) / 50));
      v.currentLaneOffset += evadeDir * lateralEvadeStep;
      v.currentLaneOffset = Math.max(-15, Math.min(15, v.currentLaneOffset));
    } else {
      // RÔLE : PROPRIÉTAIRE LÉGITIME DE LA VOIE
      // A la priorité, mais ralentit ou s'arrête en sécurité pour laisser l'intrus dégager la voie
      v.targetLaneOffset = v.nominalLane;
      v.isBraking = true;
      if (faceToFaceDist < 75) {
        targetSpeed = 0;
        v.isStopped = true;
        v.statusReason = 'WAIT_SAFE';
      } else {
        targetSpeed = v.baseSpeed * 0.25;
        v.statusReason = 'WAIT_SAFE';
      }
    }
  }
  // PRIORITÉ 2 : COLLISION FRONTALE IMMINENTE (Plot ou souris au pare-choc)
  else if (mouseFrontalThreat || coneFrontalThreat) {
    v.isBraking = true;
    v.isStopped = true;
    targetSpeed = 0;
    v.statusReason = 'BLOCKED_FRONT';
  }
  // PRIORITÉ 3 : EN DÉPASSEMENT MAIS VÉHICULE EN CONTRESENS EN APPROCHE
  // Avortement immédiat du dépassement et retour préventif sur la voie nominale
  else if (onOvertakeSide && oncomingDangerInOvertake) {
    v.targetLaneOffset = v.nominalLane;
    targetSpeed = v.baseSpeed * 0.85;
    v.isBraking = true;
    v.statusReason = 'ABORT_OVERTAKE';
  }
  // PRIORITÉ 4 : EN DÉPASSEMENT ET ENCORE À HAUTEUR DE L'OBSTACLE (VOIE CONTRESENS LIBRE)
  else if (onOvertakeSide && stillPassingObstacle) {
    v.targetLaneOffset = v.overtakeLane;
    targetSpeed = v.baseSpeed * 1.02;
    v.isBraking = false;
    v.statusReason = 'OVERTAKING';
  }
  // PRIORITÉ 5 : EN DÉPASSEMENT MAIS OBSTACLE ENTIÈREMENT DÉPASSÉ -> RETOUR VOIE NOMINALE
  else if (onOvertakeSide && !stillPassingObstacle) {
    v.targetLaneOffset = v.nominalLane;
    targetSpeed = v.baseSpeed;
    v.isBraking = false;
    v.statusReason = 'NOMINAL';
  }
  // PRIORITÉ 6 : SUR VOIE NOMINALE, OBSTACLE DEVANT & VOIE DE DÉPASSEMENT PARFAITEMENT DÉGAGÉE
  else if (onNominalSide && obstacleAheadOnNominal && !overtakeBlocked) {
    v.targetLaneOffset = v.overtakeLane;
    targetSpeed = v.baseSpeed * 1.02;
    v.isBraking = false;
    v.statusReason = 'OVERTAKING';
  }
  // PRIORITÉ 7 : SUR VOIE NOMINALE, OBSTACLE DEVANT MAIS DÉPASSEMENT IMPOSSIBLE (RÉGULATEUR ADAPTATIF ACC)
  else if (onNominalSide && obstacleAheadOnNominal && overtakeBlocked) {
    v.targetLaneOffset = v.nominalLane;
    v.isBraking = true;
    v.statusReason = 'WAIT_SAFE';

    if (leadCarAhead && leadCar) {
      // Suivi de file adaptatif derrière le véhicule de tête
      if (leadCarDist < 38) {
        targetSpeed = 0;
        v.isStopped = true;
      } else {
        const bufferRatio = Math.max(0, Math.min(1, (leadCarDist - 38) / 45));
        targetSpeed = Math.min(v.baseSpeed, (leadCar.speed || v.baseSpeed * 0.7) * bufferRatio);
      }
    } else {
      // Bloqué par un plot ou la souris
      if (dMouse < 40 || coneFrontalThreat) {
        targetSpeed = 0;
        v.isStopped = true;
      } else {
        targetSpeed = Math.max(0, v.baseSpeed * 0.20);
      }
    }
  }
  // PRIORITÉ 8 : SÉCURITÉ DE RAPPROCHEMENT DANS LA MÊME FILE
  else if (sameDirectionFrontalThreat) {
    v.isBraking = true;
    targetSpeed = 0;
    v.isStopped = true;
    v.statusReason = 'WAIT_SAFE';
  }
  // PRIORITÉ 9 : CROISIÈRE NORMALE SUR VOIE NOMINALE
  else {
    v.targetLaneOffset = v.nominalLane;
    targetSpeed = v.baseSpeed;
    v.isBraking = false;
    v.statusReason = 'NOMINAL';
  }

  // ──────────────────────────────────────────────────────────
  // 5. CINÉMATIQUE D'ACKERMANN & PHYSIQUE DU VÉHICULE NON-HOLONOME
  // ──────────────────────────────────────────────────────────
  const isEvasive = (v.statusReason === 'RETREAT_NOMINAL' || v.statusReason === 'ABORT_OVERTAKE');
  const accelRate = targetSpeed < v.speed ? 0.22 : 0.05;
  v.speed += (targetSpeed - v.speed) * accelRate;
  if (targetSpeed === 0 && v.speed < 0.000015) v.speed = 0;

  const stepPx = v.speed * trackLength;

  // Asservissement de braquage (Pure Pursuit / Proportionnel)
  const errorLat = v.currentLaneOffset - v.targetLaneOffset;
  const lookahead = isEvasive ? 14 : 24;
  const desiredPsi = -Math.atan(errorLat / lookahead) * v.dir;
  const steerGain = isEvasive ? 1.9 : 1.35;
  let desiredSteering = steerGain * (desiredPsi - v.chassisPsi);
  desiredSteering = Math.max(-0.52, Math.min(0.52, desiredSteering)); // Butée mécanique de braquage (±30°)
  const steerSlew = isEvasive ? 0.38 : 0.16;
  v.steeringAngle += (desiredSteering - v.steeringAngle) * steerSlew;

  // Intégration cinématique du modèle de bicyclette d'Ackermann
  if (stepPx > 0.0001) {
    const L = 30; // Empattement du véhicule en pixels
    const deltaPsi = (stepPx / L) * Math.tan(v.steeringAngle);
    v.chassisPsi = Math.max(-0.58, Math.min(0.58, v.chassisPsi + deltaPsi));

    // Déplacement longitudinal le long du circuit
    const deltaS = stepPx * Math.cos(v.chassisPsi);
    v.progress = (v.progress + (v.dir * deltaS) / trackLength + 1) % 1;

    // Déplacement transversal non-holonome (perpendiculaire à la piste)
    const deltaD = stepPx * Math.sin(v.chassisPsi) * v.dir;
    v.currentLaneOffset += deltaD;
    v.currentLaneOffset = Math.max(-15, Math.min(15, v.currentLaneOffset));
  }
}

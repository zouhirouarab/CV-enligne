/**
 * ===================================================================
 * MODULE SIMULATION 1/4 : GÉOMÉTRIE DU CIRCUIT (track.js)
 * ===================================================================
 * Modélise la route à 2 voies sous la forme d'une spline fermée
 * différentiable (Catmull-Rom) avec paramétrage par abscisse curviligne
 * et calcul du repère local de Frenet (tangente et normale).
 */

// Tableau des waypoints de contrôle du circuit
let waypoints = [];

// Longueur totale du circuit en pixels
let trackLength = 0;

// Nombre d'échantillons réguliers pour la discrétisation
const numSamples = 600;

// Tableau des points discrétisés contenant { x, y, distCum, heading, nx, ny }
let trackSamples = [];

/**
 * Génère une trajectoire fermée et fluide à travers l'écran
 * @param {number} width - Largeur du canvas
 * @param {number} height - Hauteur du canvas
 */
function generateTrack(width, height) {
  const cx = width * 0.54;
  const cy = height * 0.50;
  const rx = Math.min(width * 0.44, 580);
  const ry = Math.min(height * 0.42, 340);

  // 8 points de contrôle angulaires pour former une boucle dynamique
  const baseNodes = [
    { a: 0, rMult: 1.05, dy: -20 },
    { a: Math.PI * 0.25, rMult: 0.9, dy: 35 },
    { a: Math.PI * 0.5, rMult: 1.15, dy: 45 },
    { a: Math.PI * 0.75, rMult: 0.85, dy: 20 },
    { a: Math.PI, rMult: 1.12, dy: -40 },
    { a: Math.PI * 1.25, rMult: 0.95, dy: -60 },
    { a: Math.PI * 1.5, rMult: 1.2, dy: -25 },
    { a: Math.PI * 1.75, rMult: 0.92, dy: 10 }
  ];

  waypoints = baseNodes.map(n => ({
    x: cx + Math.cos(n.a) * rx * n.rMult,
    y: cy + Math.sin(n.a) * ry * n.rMult + n.dy
  }));

  // Discrétisation le long de la spline cubique fermée (Catmull-Rom)
  trackSamples = [];
  trackLength = 0;
  const N = waypoints.length;

  for (let i = 0; i < numSamples; i++) {
    const tGlobal = (i / numSamples) * N;
    const segIdx = Math.floor(tGlobal);
    const u = tGlobal - segIdx;

    const p0 = waypoints[(segIdx - 1 + N) % N];
    const p1 = waypoints[segIdx % N];
    const p2 = waypoints[(segIdx + 1) % N];
    const p3 = waypoints[(segIdx + 2) % N];

    // Formule matricielle Catmull-Rom cubique
    const x = 0.5 * (
      (2 * p1.x) +
      (-p0.x + p2.x) * u +
      (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * u * u +
      (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * u * u * u
    );
    const y = 0.5 * (
      (2 * p1.y) +
      (-p0.y + p2.y) * u +
      (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * u * u +
      (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * u * u * u
    );

    if (i > 0) {
      const prev = trackSamples[i - 1];
      const dist = Math.hypot(x - prev.x, y - prev.y);
      trackLength += dist;
    }
    trackSamples.push({ x, y, distCum: trackLength });
  }

  // Calcul du vecteur unitaire tangent (heading) et vecteur normal (nx, ny)
  const S = trackSamples.length;
  for (let i = 0; i < S; i++) {
    const next = trackSamples[(i + 1) % S];
    const prev = trackSamples[(i - 1 + S) % S];
    const heading = Math.atan2(next.y - prev.y, next.x - prev.x);
    trackSamples[i].heading = heading;
    trackSamples[i].nx = -Math.sin(heading); // Normale vers la gauche/droite
    trackSamples[i].ny = Math.cos(heading);
  }
}

/**
 * Calcule la position euclidienne et le repère local pour une abscisse curviligne normalisée t ∈ [0, 1]
 * @param {number} normT - Abscisse normalisée
 * @returns {{ x: number, y: number, heading: number, nx: number, ny: number }}
 */
function getTrackPos(normT) {
  const t = ((normT % 1) + 1) % 1;
  const targetDist = t * trackLength;
  let low = 0, high = trackSamples.length - 1;

  // Recherche dichotomique rapide sur l'abscisse curviligne
  while (low <= high) {
    const mid = (low + high) >> 1;
    if (trackSamples[mid].distCum < targetDist) low = mid + 1;
    else high = mid - 1;
  }

  const idx = Math.max(0, Math.min(trackSamples.length - 2, low));
  const p1 = trackSamples[idx];
  const p2 = trackSamples[idx + 1];
  const span = (p2.distCum - p1.distCum) || 1;
  const factor = Math.max(0, Math.min(1, (targetDist - p1.distCum) / span));

  return {
    x: p1.x + (p2.x - p1.x) * factor,
    y: p1.y + (p2.y - p1.y) * factor,
    heading: p1.heading,
    nx: p1.nx + (p2.nx - p1.nx) * factor,
    ny: p1.ny + (p2.ny - p1.ny) * factor
  };
}

/**
 * Calcule la distance longitudinale signée le long de la boucle dans le sens de marche
 * @param {number} fromProg - Abscisse de départ [0, 1]
 * @param {number} toProg - Abscisse d'arrivée [0, 1]
 * @param {number} dir - Sens de déplacement (1 ou -1)
 * @returns {number} Distance en pixels (positive si devant, négative si derrière)
 */
function getTrackDist(fromProg, toProg, dir = 1) {
  let delta = (toProg - fromProg) * dir;
  while (delta < -0.5) delta += 1;
  while (delta > 0.5) delta -= 1;
  return delta * trackLength;
}

/**
 * Dessine l'infrastructure routière complète :
 * Chaussée 2 voies (62px), bordures blanches, ligne médiane pointillée et repères Waypoints
 * @param {CanvasRenderingContext2D} ctx
 * @param {boolean} isLight
 */
function drawRoadInfrastructure(ctx, isLight) {
  if (trackSamples.length < 3) return;

  const trackBedColor = isLight ? 'rgba(0, 0, 0, 0.035)' : 'rgba(255, 255, 255, 0.032)';
  const nodeColor = isLight ? 'rgba(0, 0, 0, 0.35)' : 'rgba(255, 255, 255, 0.35)';

  // 1. Couloir d'asphalte (largeur totale de 62px)
  ctx.beginPath();
  ctx.moveTo(trackSamples[0].x, trackSamples[0].y);
  for (let i = 1; i < trackSamples.length; i++) {
    ctx.lineTo(trackSamples[i].x, trackSamples[i].y);
  }
  ctx.closePath();
  ctx.strokeStyle = trackBedColor;
  ctx.lineWidth = 62;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.stroke();

  // 2. Bord gauche de la route (Ligne continue : déport de -30px)
  ctx.beginPath();
  ctx.moveTo(trackSamples[0].x - trackSamples[0].nx * 30, trackSamples[0].y - trackSamples[0].ny * 30);
  for (let i = 1; i < trackSamples.length; i++) {
    const s = trackSamples[i];
    ctx.lineTo(s.x - s.nx * 30, s.y - s.ny * 30);
  }
  ctx.closePath();
  ctx.strokeStyle = isLight ? 'rgba(0, 0, 0, 0.16)' : 'rgba(255, 255, 255, 0.18)';
  ctx.lineWidth = 1.4;
  ctx.stroke();

  // 3. Bord droit de la route (Ligne continue : déport de +30px)
  ctx.beginPath();
  ctx.moveTo(trackSamples[0].x + trackSamples[0].nx * 30, trackSamples[0].y + trackSamples[0].ny * 30);
  for (let i = 1; i < trackSamples.length; i++) {
    const s = trackSamples[i];
    ctx.lineTo(s.x + s.nx * 30, s.y + s.ny * 30);
  }
  ctx.closePath();
  ctx.strokeStyle = isLight ? 'rgba(0, 0, 0, 0.16)' : 'rgba(255, 255, 255, 0.18)';
  ctx.lineWidth = 1.4;
  ctx.stroke();

  // 4. Ligne médiane de séparation pointillée (déport de 0px)
  ctx.beginPath();
  ctx.moveTo(trackSamples[0].x, trackSamples[0].y);
  for (let i = 1; i < trackSamples.length; i++) {
    ctx.lineTo(trackSamples[i].x, trackSamples[i].y);
  }
  ctx.closePath();
  ctx.strokeStyle = isLight ? 'rgba(0, 0, 0, 0.20)' : 'rgba(255, 255, 255, 0.22)';
  ctx.lineWidth = 1.2;
  ctx.setLineDash([7, 7]);
  ctx.stroke();
  ctx.setLineDash([]);

  // 5. Waypoints télémétriques WP-01 à WP-08
  ctx.font = '500 8.5px Inter, sans-serif';
  ctx.fillStyle = nodeColor;
  ctx.strokeStyle = nodeColor;
  ctx.lineWidth = 1;
  waypoints.forEach((wp, i) => {
    const s = 3;
    ctx.beginPath();
    ctx.moveTo(wp.x - s, wp.y); ctx.lineTo(wp.x + s, wp.y);
    ctx.moveTo(wp.x, wp.y - s); ctx.lineTo(wp.x, wp.y + s);
    ctx.stroke();
    ctx.fillText(`WP-${String(i + 1).padStart(2, '0')}`, wp.x + 8, wp.y - 6);
  });
}

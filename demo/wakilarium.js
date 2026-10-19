// Wakilarium — maquette du composant (lot 0, 19/10/2026). Canvas 2D, aucune dépendance. Lit des Wakil Events (NDJSON) et met en
// scène : couloirs par « lane », anneaux par acteur, l'humain en or, visiteurs en pointillé, cartes reliées, comètes, horloge,
// ligne de temps rejouable, vue publique (titres publics seulement). Thème par data-theme (night|day), langue par <html lang>.
// Sous « moins de mouvement » : scène fixe, étape par étape. Rien ne quitte la page : aucune requête.
(function () {
  'use strict';
  var racine = document.getElementById('wakilarium'); if (!racine) return;
  var canvas = racine.querySelector('canvas'), ctx = canvas.getContext('2d');
  var src = document.getElementById('wakil-events');
  var ui = { horloge: racine.querySelector('[data-wk-clock]'), pause: racine.querySelector('[data-wk-pause]'), slider: racine.querySelector('[data-wk-time]'),
             vitesse: racine.querySelector('[data-wk-speed]'), direct: racine.querySelector('[data-wk-live]'), publique: racine.querySelector('[data-wk-public]'),
             cout: racine.querySelector('[data-wk-cost]'), attente: racine.querySelector('[data-wk-pending]'), etat: racine.querySelector('[data-wk-state]') };
  var reduit = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  var dpr = Math.min(2, window.devicePixelRatio || 1), TAU = Math.PI * 2;

  // ---------- langue et thème
  function lang() { return (document.documentElement.getAttribute('lang') || 'fr').slice(0, 2) === 'en' ? 'en' : 'fr'; }
  var L = {
    fr: { vous: 'Vous', humain: 'humain', visiteur: 'visiteur', entree: 'ENTRÉE', types: { 'run.start': 'DÉBUT', 'run.end': 'FIN', tool: 'OUTIL', message: 'ÉCHANGE', 'decision.open': 'DÉCISION', 'decision.made': 'VOTRE DÉCISION', visitor: 'VISITEUR', launch: 'MISE EN LIGNE', cost: 'COÛT', note: 'NOTE' },
          generique: { 'run.start': 'commence à travailler', 'run.end': 'a terminé', tool: 'utilise un outil', message: 'échange', 'decision.open': 'propose une décision', 'decision.made': 'a décidé', visitor: 'un visiteur', launch: 'met en ligne', cost: '', note: 'note' },
          legende: ['échange', 'exécution', 'décision · humain', 'visiteur'], pied: 'journée simulée · personnages fictifs', direct: 'Direct', replay: 'Replay', pause: '❚❚ Pause', lecture: '▶ Lecture', suivant: 'Étape suivante', publique: 'vue publique' },
    en: { vous: 'You', humain: 'human', visiteur: 'visitor', entree: 'ENTRANCE', types: { 'run.start': 'START', 'run.end': 'DONE', tool: 'TOOL', message: 'EXCHANGE', 'decision.open': 'DECISION', 'decision.made': 'YOUR DECISION', visitor: 'VISITOR', launch: 'LAUNCH', cost: 'COST', note: 'NOTE' },
          generique: { 'run.start': 'starts working', 'run.end': 'is done', tool: 'uses a tool', message: 'exchanges', 'decision.open': 'proposes a decision', 'decision.made': 'decided', visitor: 'a visitor', launch: 'goes live', cost: '', note: 'note' },
          legende: ['exchange', 'execution', 'decision · human', 'visitor'], pied: 'simulated day · fictional characters', direct: 'Live', replay: 'Replay', pause: '❚❚ Pause', lecture: '▶ Play', suivant: 'Next step', publique: 'public view' }
  };
  function T() { return L[lang()]; }
  var THEMES = {
    night: { fond: ['#1b2452', '#0d1232', '#070a1c'], encre: '#f2efe7', doux: 'rgba(255,255,255,.55)', carte: 'rgba(5,8,23,.82)', verre: 'rgba(255,255,255,.07)', or: '#ffc43d', lanes: ['#ff5c9a', '#3ddc97', '#8b7cff', '#4cc9ff', '#f59e0b'], visiteur: '#9aa3c7', grille: 'rgba(255,255,255,.06)', lueur: 1 },
    day:   { fond: ['#fbf8f1', '#f3eee3', '#ebe4d6'], encre: '#12151c', doux: 'rgba(18,21,28,.6)', carte: 'rgba(255,255,255,.94)', verre: 'rgba(18,21,28,.04)', or: '#b8700c', lanes: ['#c2417a', '#1f7a5a', '#5b4bc4', '#1f6fb2', '#b45309'], visiteur: '#7a7f8c', grille: 'rgba(18,21,28,.08)', lueur: 0 }
  };
  function theme() { return THEMES[document.documentElement.getAttribute('data-theme') === 'day' ? 'day' : 'night']; }

  // ---------- événements
  var evenements = (src ? src.textContent : '').split('\n').map(function (l) { return l.trim(); }).filter(Boolean).map(function (l) { try { return JSON.parse(l); } catch (e) { return null; } }).filter(Boolean)
    .filter(function (e) { return e.ts && e.kind && e.actor && e.actor.id; }).sort(function (a, b) { return a.ts < b.ts ? -1 : 1; });
  if (!evenements.length) return;
  var acteurs = {}, lanes = [];
  function enregistrer(a) {
    if (!a || !a.id) return;
    var ex = acteurs[a.id] || (acteurs[a.id] = { id: a.id, kind: 'agent' });
    ['name', 'role', 'lane', 'kind', 'avatar'].forEach(function (k) { if (a[k]) ex[k] = a[k]; });
    if (ex.kind === 'human') ex.lane = ex.lane || 'direction';
    if (ex.kind === 'visitor') ex.lane = 'entree';
    ex.lane = ex.lane || 'autres';
    if (lanes.indexOf(ex.lane) === -1) lanes.push(ex.lane);
  }
  evenements.forEach(function (e) { enregistrer(e.actor); enregistrer(e.target); });
  if (lanes.indexOf('entree') !== -1) { lanes.splice(lanes.indexOf('entree'), 1); lanes.push('entree'); }
  var t0 = Date.parse(evenements[0].ts), t1 = Date.parse(evenements[evenements.length - 1].ts) + 5 * 60000;

  // ---------- disposition
  var noeuds = {}, colonnes = [], cartes = [], liens = [], etincelles = [], etroit = false, souris = { x: -1, y: -1 };
  function taille() {
    var w = canvas.clientWidth; if (!w) return;
    etroit = w < 700;
    var h = etroit ? 560 : Math.max(460, Math.min(600, Math.round(w * 0.52)));
    canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr); canvas.style.height = h + 'px'; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    disposer(w, h);
  }
  function disposer(w, h) {
    var th = theme(), n = lanes.length, large = w / n, anciens = noeuds; noeuds = {}; colonnes = [];
    lanes.forEach(function (id, i) {
      var couleur = id === 'entree' ? th.visiteur : th.lanes[i % th.lanes.length];
      colonnes.push({ id: id, x0: i * large, x1: (i + 1) * large, cx: (i + 0.5) * large, couleur: couleur, nom: id === 'entree' ? T().entree : id.toUpperCase().replace(/[-_]/g, ' ') });
    });
    lanes.forEach(function (id, i) {
      var liste = Object.keys(acteurs).map(function (k) { return acteurs[k]; }).filter(function (a) { return a.lane === id; });
      var col = colonnes[i], top = 190, bas = h - 96;
      liste.forEach(function (a, j) {
        var humain = a.kind === 'human', y = humain ? 112 : (liste.length > 1 ? top + (bas - top) * j / (liste.length - 1) : (top + bas) / 2);
        var x = humain ? col.cx : col.cx + (liste.length > 1 ? (j % 2 ? 38 : -38) : 0);
        var ancien = anciens[a.id];
        noeuds[a.id] = { id: a.id, nom: a.name || a.id, role: a.role || (humain ? T().humain : a.kind === 'visitor' ? T().visiteur : ''), kind: a.kind, couleur: humain ? th.or : col.couleur,
          x0: x, y0: y, x: ancien ? ancien.x : x, y: ancien ? ancien.y : y, r: humain ? (etroit ? 26 : 32) : (a.kind === 'visitor' ? 18 : etroit ? 20 : 24), phase: Math.random() * TAU, actif: 0, echec: 0 };
      });
    });
  }

  // ---------- temps
  var mode = 'replay', curseur = t0, vitesse = 180, enPause = false, index = 0, dernier = null, publique = false, totaux = { cost: 0, pending: 0 };
  function jouer(e, silencieux) {
    var a = noeuds[e.actor.id], c = e.target ? noeuds[e.target.id] : null; if (!a) return;
    var th = theme();
    if (e.kind === 'run.start') a.actif = 1;
    if (e.kind === 'run.end') { a.actif = 0.35; if (e.status === 'failed') a.echec = 1; }
    if (e.kind === 'tool') { for (var i = 0; i < 6; i++) etincelles.push({ x: a.x, y: a.y, vx: (Math.random() - .5) * 2.2, vy: -1 - Math.random() * 1.6, vie: 1, couleur: a.couleur }); }
    if (e.kind === 'cost' && e.cost) totaux.cost += Number(e.cost.amount) || 0;
    if (e.cost && e.kind !== 'cost') totaux.cost += Number(e.cost.amount) || 0;
    if (e.kind === 'decision.open') totaux.pending++;
    if (e.kind === 'decision.made') totaux.pending = Math.max(0, totaux.pending - 1);
    var texte = publique ? (e.public_title || T().generique[e.kind] || '') : (e.title || '');
    if (['message', 'decision.open', 'decision.made', 'visitor', 'launch', 'run.end'].indexOf(e.kind) !== -1 && texte) {
      var teinte = e.kind.indexOf('decision') === 0 ? th.or : (e.kind === 'visitor' ? th.visiteur : a.couleur);
      cartes.push({ acteur: a, cible: c, texte: texte, type: e.kind, teinte: teinte, heure: e.ts.slice(11, 16), statut: e.status || '', vie: silencieux ? 0.4 : 1, nee: curseur });
      if (cartes.length > 3) cartes.shift();
    }
    if (c) liens.push({ de: a, a: c, teinte: e.kind.indexOf('decision') === 0 ? th.or : a.couleur, vie: 1, pointille: e.kind === 'visitor' });
    if (liens.length > 5) liens.shift();
    if (ui.cout) ui.cout.textContent = totaux.cost.toFixed(2) + ' €';
    if (ui.attente) ui.attente.textContent = String(totaux.pending);
  }
  function remettre(jusqua, silencieux) {
    cartes = []; liens = []; etincelles = []; totaux = { cost: 0, pending: 0 }; index = 0;
    Object.keys(noeuds).forEach(function (k) { noeuds[k].actif = 0; noeuds[k].echec = 0; });
    while (index < evenements.length && Date.parse(evenements[index].ts) <= jusqua) { jouer(evenements[index], silencieux); index++; }
  }
  function avancer() { while (index < evenements.length && Date.parse(evenements[index].ts) <= curseur) { jouer(evenements[index], false); index++; } }
  function majUi() {
    var d = new Date(curseur);
    if (ui.horloge) ui.horloge.textContent = ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2);
    if (ui.slider) ui.slider.value = String(Math.round((curseur - t0) / (t1 - t0) * 1000));
    if (ui.etat) ui.etat.textContent = mode === 'direct' ? T().direct : T().replay;
    if (ui.pause) { ui.pause.textContent = reduit ? T().suivant : (enPause ? T().lecture : T().pause); ui.pause.setAttribute('aria-pressed', String(!reduit && enPause)); }
  }

  // ---------- dessin
  function arrondi(x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }
  function rgba(hex, a) { var n = parseInt(hex.slice(1), 16); return 'rgba(' + (n >> 16) + ',' + ((n >> 8) & 255) + ',' + (n & 255) + ',' + a + ')'; }
  function initiales(n) { var p = n.split(' '); return ((p[0] || '')[0] || '') + ((p[1] || '')[0] || ''); }
  function noeud(n, t) {
    var th = theme(), bob = reduit ? 0 : Math.sin(t / 1400 + n.phase) * 4;
    n.x += (n.x0 - n.x) * 0.08; n.y += (n.y0 + bob - n.y) * 0.08;
    var x = n.x, y = n.y, r = n.r, humain = n.kind === 'human', visiteur = n.kind === 'visitor';
    ctx.save();
    if (th.lueur) { ctx.shadowColor = n.couleur; ctx.shadowBlur = humain ? 28 : (n.actif ? 22 : 10); }
    ctx.strokeStyle = n.couleur; ctx.lineWidth = humain ? 3.5 : 2.5; if (visiteur) ctx.setLineDash([5, 5]);
    ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.stroke(); ctx.restore();
    ctx.save(); ctx.fillStyle = visiteur ? 'transparent' : rgba(n.couleur, humain ? 0.22 : 0.14); ctx.beginPath(); ctx.arc(x, y, r - 2, 0, TAU); ctx.fill(); ctx.restore();
    if (n.actif && !reduit) { ctx.save(); ctx.strokeStyle = th.encre; ctx.globalAlpha = 0.9; ctx.lineWidth = 2; ctx.lineCap = 'round'; var a0 = t / 900; ctx.beginPath(); ctx.arc(x, y, r + 6, a0, a0 + 1.4); ctx.stroke(); ctx.restore(); }
    if (n.echec) { ctx.fillStyle = '#ef4444'; ctx.beginPath(); ctx.arc(x + r * 0.75, y - r * 0.75, 5, 0, TAU); ctx.fill(); }
    ctx.fillStyle = humain ? th.or : th.encre; ctx.font = '800 ' + Math.round(r * (humain ? 0.55 : 0.7)) + 'px "IBM Plex Sans", system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(humain ? T().vous.toUpperCase() : (visiteur ? '?' : initiales(n.nom).toUpperCase()), x, y + 1);
    ctx.font = '700 ' + (etroit ? 11 : 12) + 'px "IBM Plex Sans", system-ui, sans-serif'; ctx.fillStyle = th.encre; ctx.textBaseline = 'alphabetic'; ctx.fillText(humain ? T().vous : (n.nom.split(' ')[0]), x, y + r + 16);
    if (n.role) { ctx.font = '600 10px "JetBrains Mono", ui-monospace, monospace'; ctx.fillStyle = th.doux; ctx.fillText(n.role.toUpperCase().slice(0, 22), x, y + r + 30); }
  }
  function carte(c, i, w) {
    var th = theme(), a = c.acteur, corps = etroit ? 12 : 13, cw = Math.min(etroit ? w - 24 : 340, w - 24);
    ctx.save(); ctx.font = '500 ' + corps + 'px "IBM Plex Sans", system-ui, sans-serif';
    var mots = c.texte.split(' '), lignes = [], l = '';
    mots.forEach(function (m) { var t = l ? l + ' ' + m : m; if (ctx.measureText(t).width > cw - 30 && l) { lignes.push(l); l = m; } else l = t; }); if (l) lignes.push(l);
    lignes = lignes.slice(0, 3);
    var ch = 48 + lignes.length * (corps + 6), cx = Math.min(Math.max(12, a.x - cw / 2), w - cw - 12), cy = Math.max(10, a.y - a.r - ch - 18 - i * 6);
    if (a.kind === 'human') cy = a.y + a.r + 40;
    ctx.globalAlpha = Math.max(0, Math.min(1, c.vie)) * (1 - i * 0.18);
    ctx.fillStyle = th.carte; arrondi(cx, cy, cw, ch, 14); ctx.fill();
    ctx.strokeStyle = c.teinte; ctx.lineWidth = 1.4; arrondi(cx, cy, cw, ch, 14); ctx.stroke();
    ctx.fillStyle = th.encre; ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    ctx.font = '700 ' + corps + 'px "IBM Plex Sans", system-ui, sans-serif'; ctx.fillText(a.kind === 'human' ? T().vous : a.nom, cx + 14, cy + 20);
    ctx.font = '600 10px "JetBrains Mono", ui-monospace, monospace'; ctx.fillStyle = c.teinte;
    var lib = T().types[c.type] || '', cibleNom = c.cible ? (c.cible.kind === 'human' ? T().vous.toUpperCase() : c.cible.nom.split(' ')[0].toUpperCase()) : '';
    ctx.fillText(c.heure + (cibleNom ? '  →  ' + cibleNom : '') + (c.statut ? '  ·  ' + c.statut : ''), cx + 14, cy + 35);
    var lw = ctx.measureText(lib).width + 14; ctx.fillStyle = rgba(c.teinte, 0.18); arrondi(cx + cw - lw - 12, cy + 10, lw, 18, 9); ctx.fill(); ctx.fillStyle = c.teinte; ctx.textBaseline = 'middle'; ctx.fillText(lib, cx + cw - lw - 5, cy + 19); ctx.textBaseline = 'alphabetic';
    ctx.font = '500 ' + corps + 'px "IBM Plex Sans", system-ui, sans-serif'; ctx.fillStyle = th.encre;
    lignes.forEach(function (ln, k) { ctx.fillText(ln, cx + 14, cy + 54 + (corps + 6) * k); });
    ctx.restore();
  }
  function infobulle(n) {
    var th = theme(), lignes = [n.nom + (n.role ? ' · ' + n.role : ''), n.kind === 'human' ? (lang() === 'en' ? 'approves, refuses or asks for changes' : 'approuve, refuse ou demande des changements') : (n.kind === 'visitor' ? (lang() === 'en' ? 'external agent, anonymous by default' : 'agent extérieur, anonyme par défaut') : (lang() === 'en' ? 'proposes, never commits' : 'propose, n\'engage rien'))];
    ctx.save(); ctx.font = '12px "IBM Plex Sans", system-ui, sans-serif';
    var w = Math.max.apply(null, lignes.map(function (l) { return ctx.measureText(l).width; })) + 22, h = 16 * lignes.length + 14;
    var bx = Math.min(Math.max(8, n.x - w / 2), canvas.clientWidth - w - 8), by = Math.max(6, n.y - n.r - h - 12);
    ctx.fillStyle = th.carte; ctx.strokeStyle = rgba(n.couleur, 0.7); ctx.lineWidth = 1; arrondi(bx, by, w, h, 8); ctx.fill(); ctx.stroke();
    ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic'; lignes.forEach(function (l, i) { ctx.fillStyle = i ? th.doux : th.encre; ctx.fillText(l, bx + 11, by + 20 + 16 * i); });
    ctx.restore();
  }
  function dessiner(dt) {
    var th = theme(), w = canvas.clientWidth, h = canvas.clientHeight, t = performance.now();
    var fond = ctx.createLinearGradient(0, 0, w, h); fond.addColorStop(0, th.fond[0]); fond.addColorStop(0.45, th.fond[1]); fond.addColorStop(1, th.fond[2]);
    ctx.fillStyle = fond; ctx.fillRect(0, 0, w, h);
    colonnes.forEach(function (c, i) {
      if (i) { ctx.strokeStyle = th.grille; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(c.x0, 52); ctx.lineTo(c.x0, h - 44); ctx.stroke(); }
      var g = ctx.createLinearGradient(0, 60, 0, h); g.addColorStop(0, rgba(c.couleur, th.lueur ? 0.16 : 0.08)); g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(c.cx - 26, 60); ctx.lineTo(c.cx + 26, 60); ctx.lineTo(c.x1 - 10, h - 44); ctx.lineTo(c.x0 + 10, h - 44); ctx.closePath(); ctx.fill();
      ctx.save(); if (th.lueur) { ctx.shadowColor = c.couleur; ctx.shadowBlur = 10; } ctx.strokeStyle = c.couleur; ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(c.cx - 22, 48); ctx.lineTo(c.cx + 22, 48); ctx.stroke(); ctx.restore();
      ctx.fillStyle = th.doux; ctx.font = '600 10px "JetBrains Mono", ui-monospace, monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic'; ctx.fillText(etroit ? c.nom.slice(0, 9) : c.nom, c.cx, 36);
    });
    liens.forEach(function (l) {
      l.vie -= dt / 6000; if (l.vie <= 0) return;
      ctx.save(); ctx.globalAlpha = Math.max(0, l.vie) * 0.75; ctx.strokeStyle = l.teinte; ctx.lineWidth = 1.4; if (l.pointille) ctx.setLineDash([4, 6]);
      ctx.beginPath(); ctx.moveTo(l.de.x, l.de.y); ctx.quadraticCurveTo((l.de.x + l.a.x) / 2, (l.de.y + l.a.y) / 2 - 40, l.a.x, l.a.y); ctx.stroke();
      if (!reduit) { var p = (1 - l.vie) % 1, qx = (1 - p) * (1 - p) * l.de.x + 2 * (1 - p) * p * ((l.de.x + l.a.x) / 2) + p * p * l.a.x, qy = (1 - p) * (1 - p) * l.de.y + 2 * (1 - p) * p * ((l.de.y + l.a.y) / 2 - 40) + p * p * l.a.y;
        ctx.fillStyle = l.teinte; if (th.lueur) { ctx.shadowColor = l.teinte; ctx.shadowBlur = 12; } ctx.beginPath(); ctx.arc(qx, qy, 3.5, 0, TAU); ctx.fill(); }
      ctx.restore();
    });
    liens = liens.filter(function (l) { return l.vie > 0; });
    Object.keys(noeuds).forEach(function (k) { noeud(noeuds[k], t); });
    etincelles.forEach(function (e) { e.x += e.vx; e.y += e.vy; e.vy += 0.05; e.vie -= dt / 900; ctx.globalAlpha = Math.max(0, e.vie); ctx.fillStyle = e.couleur; ctx.beginPath(); ctx.arc(e.x, e.y, 2, 0, TAU); ctx.fill(); });
    ctx.globalAlpha = 1; etincelles = etincelles.filter(function (e) { return e.vie > 0; });
    cartes.forEach(function (c, i) { if (!reduit) c.vie -= dt / 9000; carte(c, cartes.length - 1 - i, w); });
    cartes = cartes.filter(function (c) { return c.vie > 0; });
    // légende
    ctx.save(); ctx.font = '11px "IBM Plex Sans", system-ui, sans-serif'; ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    var lg = [[th.lanes[3], T().legende[0]], [th.lanes[1], T().legende[1]], [th.or, T().legende[2]], [th.visiteur, T().legende[3]]], pas = etroit ? 86 : 118;
    lg.forEach(function (e, i) { var x = 14 + i * pas; ctx.strokeStyle = e[0]; ctx.lineWidth = 2.5; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x, h - 16); ctx.lineTo(x + 18, h - 16); ctx.stroke(); ctx.fillStyle = th.doux; ctx.fillText(e[1], x + 24, h - 12); });
    if (!etroit) { ctx.textAlign = 'right'; ctx.fillStyle = th.doux; ctx.fillText(T().pied, w - 14, h - 12); }
    ctx.restore();
    if (souris.x >= 0) { var sur = null; Object.keys(noeuds).forEach(function (k) { var n = noeuds[k]; if (Math.hypot(souris.x - n.x, souris.y - n.y) < n.r + 8) sur = n; }); if (sur) infobulle(sur); }
  }

  // ---------- boucle et commandes
  function boucle(ts) {
    var dt = dernier === null ? 0 : Math.min(250, ts - dernier); dernier = ts;
    if (!enPause && mode === 'replay') { curseur += dt * vitesse; if (curseur > t1) { curseur = t1; mode = 'direct'; } avancer(); majUi(); }
    dessiner(dt); requestAnimationFrame(boucle);
  }
  function aller(ms, silencieux) { curseur = Math.max(t0, Math.min(t1, ms)); remettre(curseur, silencieux !== false); mode = curseur >= t1 ? 'direct' : 'replay'; majUi(); }
  if (ui.pause) ui.pause.addEventListener('click', function () { if (reduit) { index < evenements.length ? (curseur = Date.parse(evenements[index].ts), jouer(evenements[index], true), index++) : aller(t0); majUi(); dessiner(0); } else { enPause = !enPause; majUi(); } });
  if (ui.slider) ui.slider.addEventListener('input', function () { aller(t0 + (t1 - t0) * Number(ui.slider.value) / 1000); enPause = true; majUi(); });
  if (ui.vitesse) ui.vitesse.addEventListener('change', function () { vitesse = Number(ui.vitesse.value) || 180; });
  if (ui.direct) ui.direct.addEventListener('click', function () { aller(t1); enPause = false; });
  if (ui.publique) ui.publique.addEventListener('change', function () { publique = !!ui.publique.checked; aller(curseur); });
  canvas.addEventListener('mousemove', function (ev) { var r = canvas.getBoundingClientRect(); souris = { x: ev.clientX - r.left, y: ev.clientY - r.top }; });
  canvas.addEventListener('mouseleave', function () { souris = { x: -1, y: -1 }; });
  window.addEventListener('resize', taille);
  new MutationObserver(function () { var w = canvas.clientWidth, h = canvas.clientHeight; disposer(w, h); Object.keys(noeuds).forEach(function (k) { noeuds[k].x = noeuds[k].x0; noeuds[k].y = noeuds[k].y0; }); aller(curseur); }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme', 'lang'] });
  racine.classList.add('wk--vivant');
  taille(); aller(t0); enPause = false; majUi();
  if (reduit) { var d = evenements.findIndex(function (e) { return e.kind === 'decision.open'; }); aller(Date.parse(evenements[Math.max(0, d)].ts) + 1); dessiner(0); } else requestAnimationFrame(boucle);
})();

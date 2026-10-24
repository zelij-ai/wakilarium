// Wakilarium — le composant <wakil-arium> (lot 1). Canvas 2D, aucune dépendance, un seul fichier ESM.
// Lit des Wakil Events (état JSON du collecteur, NDJSON, ou tableau passé par `setEvents`), met en scène : couloirs par
// « lane », anneaux par acteur, l'humain en or, visiteurs en pointillé, cartes reliées, comètes, horloge, ligne de temps
// rejouable, direct par flux SSE, vue publique (titres publics seulement). Attributs : src, stream, theme (night|day),
// lang (fr|en), hours, public, speed. Sous « moins de mouvement » : scène fixe, étape par étape. Événement DOM « wakil:select ».
const TAU = Math.PI * 2;
const L = {
  fr: { vous: 'Vous', humain: 'humain', visiteur: 'visiteur', entree: 'ENTRÉE',
        types: { 'run.start': 'DÉBUT', 'run.end': 'FIN', tool: 'OUTIL', message: 'ÉCHANGE', 'decision.open': 'DÉCISION', 'decision.made': 'DÉCIDÉ', visitor: 'VISITEUR', launch: 'EN LIGNE', cost: 'COÛT', note: 'NOTE' },
        generique: { 'run.start': 'commence à travailler', 'run.end': 'a terminé', tool: 'utilise un outil', message: 'échange', 'decision.open': 'propose une décision', 'decision.made': 'a décidé', visitor: 'un visiteur', launch: 'met en ligne', cost: '', note: 'note' },
        legende: ['échange', 'exécution', 'décision · humain', 'visiteur'], pied: 'en direct · chaque carte est un geste réel', direct: 'Direct', replay: 'Replay', pause: '❚❚ Pause', lecture: '▶ Lecture', suivant: 'Étape suivante ▸', cout: 'coût du jour', attente: 'décisions en attente', publique: 'vue publique', vide: 'En attente du premier geste de vos agents…' },
  en: { vous: 'You', humain: 'human', visiteur: 'visitor', entree: 'ENTRANCE',
        types: { 'run.start': 'START', 'run.end': 'DONE', tool: 'TOOL', message: 'EXCHANGE', 'decision.open': 'DECISION', 'decision.made': 'DECIDED', visitor: 'VISITOR', launch: 'LIVE', cost: 'COST', note: 'NOTE' },
        generique: { 'run.start': 'starts working', 'run.end': 'is done', tool: 'uses a tool', message: 'exchanges', 'decision.open': 'proposes a decision', 'decision.made': 'has decided', visitor: 'a visitor', launch: 'goes live', cost: '', note: 'note' },
        legende: ['exchange', 'execution', 'decision · human', 'visitor'], pied: 'live · every card is a real move', direct: 'Live', replay: 'Replay', pause: '❚❚ Pause', lecture: '▶ Play', suivant: 'Next step ▸', cout: 'cost today', attente: 'pending decisions', publique: 'public view', vide: 'Waiting for your agents’ first move…' },
};
const THEMES = {
  night: { fond: ['#1b2452', '#0d1232', '#070a1c'], encre: '#f2efe7', doux: 'rgba(255,255,255,.55)', carte: 'rgba(5,8,23,.82)', verre: 'rgba(255,255,255,.07)', grille: 'rgba(255,255,255,.08)', or: '#e0a21c', visiteur: '#9aa4b2', lueur: true,
           lanes: ['#4f7cff', '#2bb3a3', '#c86bff', '#ff8a4c', '#58c15c', '#e94fa1'] },
  day:   { fond: ['#fbf8f1', '#f3eee3', '#ebe4d6'], encre: '#12151c', doux: 'rgba(18,21,28,.6)', carte: 'rgba(255,255,255,.94)', verre: 'rgba(18,21,28,.04)', grille: 'rgba(18,21,28,.09)', or: '#b8820f', visiteur: '#6b7280', lueur: false,
           lanes: ['#2a55d6', '#0f8f82', '#8f3bd9', '#d9632a', '#2f8f3a', '#c7357f'] },
};
const STYLE = `
:host { display: block; font-family: "IBM Plex Sans", system-ui, -apple-system, sans-serif; color: var(--wk-ink, #f2efe7); }
:host([theme="day"]) { --wk-ink: #12151c; --wk-doux: rgba(18,21,28,.6); --wk-line: rgba(18,21,28,.14); --wk-gold: #b8820f; --wk-bleu: #2a55d6; }
:host { --wk-ink: #f2efe7; --wk-doux: rgba(255,255,255,.55); --wk-line: rgba(255,255,255,.14); --wk-gold: #e0a21c; --wk-bleu: #4f7cff; --mono: "JetBrains Mono", ui-monospace, Menlo, monospace; }
.vitre { position: relative; border-radius: 22px; padding: 6px; background: linear-gradient(160deg, #1b2452, #0d1232 38%, #070a1c); box-shadow: 0 1px 0 rgba(255,255,255,.14) inset, 0 30px 60px -30px rgba(0,0,0,.7); }
:host([theme="day"]) .vitre { background: linear-gradient(160deg, #ffffff, #f3eee3 60%, #e9e2d3); box-shadow: 0 1px 0 rgba(255,255,255,.8) inset, 0 30px 60px -30px rgba(18,21,28,.35); }
.tete { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; padding: 12px 16px 8px; }
.tete .nom { font: 600 11px/1 var(--mono); letter-spacing: .18em; text-transform: uppercase; color: var(--wk-bleu); }
.tete .horloge { font: 700 22px/1 var(--mono); font-variant-numeric: tabular-nums; }
.tete .etat { font: 600 10px/1 var(--mono); letter-spacing: .14em; text-transform: uppercase; color: var(--wk-doux); padding: 5px 8px; border: 1px solid var(--wk-line); border-radius: 999px; }
.tete .kpi { font: 600 12px/1 var(--mono); color: var(--wk-doux); }
.tete .kpi b { color: var(--wk-gold); font-weight: 700; }
.tete .droite { margin-left: auto; display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
.tete label { font-size: 12px; color: var(--wk-doux); display: inline-flex; gap: 6px; align-items: center; cursor: pointer; }
.tete select, .tete input[type=range] { accent-color: var(--wk-gold); }
.tete select { background: transparent; color: var(--wk-ink); border: 1px solid var(--wk-line); border-radius: 8px; padding: 4px 6px; font: inherit; font-size: 12px; }
.tete input[type=range] { width: 140px; }
button { min-height: 40px; padding: 0 14px; border-radius: 999px; border: 1px solid var(--wk-line); background: transparent; color: var(--wk-ink); font: 600 12px/1 var(--mono); cursor: pointer; transition: background .18s; }
button:hover { background: rgba(127,127,127,.12); }
button:focus-visible, select:focus-visible, input:focus-visible { outline: 3px solid var(--wk-gold); outline-offset: 2px; }
.pause { border-color: color-mix(in srgb, var(--wk-gold) 60%, transparent); background: color-mix(in srgb, var(--wk-gold) 14%, transparent); }
canvas { display: block; width: 100%; height: 560px; border-radius: 16px; }
.vide { position: absolute; inset: 70px 0 0; display: grid; place-items: center; color: var(--wk-doux); font-size: 15px; pointer-events: none; }
.vide[hidden] { display: none; }
@media (max-width: 700px) { .tete input[type=range] { width: 100px; } .tete .horloge { font-size: 18px; } }
`;

function rgba(hex, a) { const n = parseInt(hex.slice(1), 16); return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`; }
function initiales(n) { const p = String(n).split(' '); return ((p[0] || '')[0] || '') + ((p[1] || '')[0] || ''); }

export class WakilArium extends HTMLElement {
  static get observedAttributes() { return ['src', 'theme', 'lang', 'public', 'hours', 'speed', 'stream']; }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.innerHTML = `<style>${STYLE}</style>
<div class="vitre">
  <div class="tete">
    <span class="nom">Wakilarium</span><span class="horloge" data-clock>--:--</span><span class="etat" data-state></span>
    <span class="kpi"><span data-l="cout"></span> <b data-cost>0.00</b> · <span data-l="attente"></span> <b data-pending>0</b></span>
    <div class="droite">
      <label><input type="checkbox" data-public> <span data-l="publique"></span></label>
      <label>×<select data-speed><option value="60">60</option><option value="180" selected>180</option><option value="600">600</option></select></label>
      <input type="range" min="0" max="1000" value="0" data-time aria-label="time">
      <button type="button" data-live></button>
      <button type="button" class="pause" data-pause aria-pressed="false"></button>
    </div>
  </div>
  <canvas role="img"></canvas>
  <div class="vide" data-empty hidden></div>
</div>`;
    const q = (s) => this.shadowRoot.querySelector(s);
    this.ui = { horloge: q('[data-clock]'), etat: q('[data-state]'), cout: q('[data-cost]'), attente: q('[data-pending]'), publique: q('[data-public]'), vitesse: q('[data-speed]'),
                slider: q('[data-time]'), direct: q('[data-live]'), pause: q('[data-pause]'), vide: q('[data-empty]'), labels: this.shadowRoot.querySelectorAll('[data-l]') };
    this.canvas = q('canvas'); this.ctx = this.canvas.getContext('2d');
    this.reduit = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    this.dpr = Math.min(2, window.devicePixelRatio || 1);
    this.evenements = []; this.acteurs = {}; this.lanes = []; this.noeuds = {}; this.colonnes = []; this.cartes = []; this.liens = []; this.etincelles = [];
    this.etroit = false; this.souris = { x: -1, y: -1 }; this.mode = 'replay'; this.curseur = 0; this.t0 = 0; this.t1 = 0; this.vitesse = 180; this.enPause = false;
    this.index = 0; this.dernier = null; this.publique = false; this.totaux = { cost: 0, pending: 0 }; this.anime = false; this.es = null;
  }

  // ---------- attributs et accès
  get lang() { return (this.getAttribute('lang') || document.documentElement.getAttribute('lang') || 'fr').slice(0, 2) === 'en' ? 'en' : 'fr'; }
  get T() { return L[this.lang]; }
  theme() { return THEMES[this.getAttribute('theme') === 'day' ? 'day' : 'night']; }

  connectedCallback() {
    this.canvas.setAttribute('aria-label', this.lang === 'en' ? 'Wakilarium scene: a human in gold, agents per lane, a visitor at the entrance' : 'Scène Wakilarium : un humain en or, des agents par couloir, un visiteur à l’entrée');
    this.publique = this.hasAttribute('public'); this.ui.publique.checked = this.publique;
    this.vitesse = Number(this.getAttribute('speed')) || 180; this.ui.vitesse.value = String([60, 180, 600].includes(this.vitesse) ? this.vitesse : 180);
    this.ui.pause.addEventListener('click', () => this.basculerPause());
    this.ui.slider.addEventListener('input', () => { this.aller(this.t0 + (this.t1 - this.t0) * Number(this.ui.slider.value) / 1000); this.enPause = true; this.majUi(); });
    this.ui.vitesse.addEventListener('change', () => { this.vitesse = Number(this.ui.vitesse.value) || 180; });
    this.ui.direct.addEventListener('click', () => { this.aller(this.t1); this.enPause = false; this.majUi(); });
    this.ui.publique.addEventListener('change', () => { this.publique = this.ui.publique.checked; this.aller(this.curseur); });
    this.canvas.addEventListener('mousemove', (ev) => { const r = this.canvas.getBoundingClientRect(); this.souris = { x: ev.clientX - r.left, y: ev.clientY - r.top }; });
    this.canvas.addEventListener('mouseleave', () => { this.souris = { x: -1, y: -1 }; });
    this.canvas.addEventListener('click', () => { const n = this.sousLaSouris(); if (n) this.dispatchEvent(new CustomEvent('wakil:select', { detail: { actor: { id: n.id, name: n.nom, role: n.role, kind: n.kind } }, bubbles: true })); });
    this._redim = () => this.taille(); window.addEventListener('resize', this._redim);
    this.majLibelles();
    if (this.getAttribute('src')) this.charger();
    else this.taille();
    this.majUi();
  }

  disconnectedCallback() { window.removeEventListener('resize', this._redim); if (this.es) { this.es.close(); this.es = null; } this.anime = false; }

  attributeChangedCallback(nom, ancien, nouveau) {
    if (ancien === nouveau || !this.isConnected) return;
    if (nom === 'src') this.charger();
    if (nom === 'theme') { this.disposer(this.canvas.clientWidth, this.canvas.clientHeight); this.aller(this.curseur); }
    if (nom === 'lang') { this.majLibelles(); this.aller(this.curseur); }
    if (nom === 'public') { this.publique = this.hasAttribute('public'); this.ui.publique.checked = this.publique; this.aller(this.curseur); }
    if (nom === 'hours') this.charger();
  }

  majLibelles() { this.ui.labels.forEach((el) => { el.textContent = this.T[el.getAttribute('data-l')] || ''; }); this.ui.direct.textContent = this.T.direct; this.ui.vide.textContent = this.T.vide; }

  // ---------- données
  async charger() {
    const src = this.getAttribute('src'); if (!src) return;
    const url = new URL(src, location.href); if (this.getAttribute('hours') && !url.searchParams.has('hours')) url.searchParams.set('hours', this.getAttribute('hours'));
    try {
      const r = await fetch(url, { cache: 'no-store' });
      const texte = await r.text();
      let liste;
      try { const j = JSON.parse(texte); liste = Array.isArray(j) ? j : (j.events || []); } catch { liste = texte.split('\n').map((l) => l.trim()).filter(Boolean).map((l) => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean); }
      this.setEvents(liste);
    } catch { this.setEvents([]); }
    this.ecouter();
  }

  ecouter() {
    const stream = this.getAttribute('stream') || (this.getAttribute('src') && this.getAttribute('src').includes('/state') ? this.getAttribute('src').replace('/state', '/stream') : null);
    if (!stream || !('EventSource' in window)) return;
    if (this.es) this.es.close();
    try {
      this.es = new EventSource(stream);
      this.es.onmessage = (m) => { try { const l = JSON.parse(m.data); this.push(Array.isArray(l) ? l : [l]); } catch { /* ligne ignorée */ } };
    } catch { this.es = null; }
  }

  /** Remplace la journée ; rejoue depuis le début (ou se place en direct si `live`). */
  setEvents(liste) {
    this.evenements = (liste || []).filter((e) => e && e.ts && e.kind && e.actor && e.actor.id).sort((a, b) => Date.parse(a.ts) - Date.parse(b.ts));
    this.acteurs = {}; this.lanes = [];
    this.evenements.forEach((e) => { this.enregistrer(e.actor); this.enregistrer(e.target); });
    this.rangerLanes();
    const vide = !this.evenements.length;
    this.ui.vide.hidden = !vide;
    this.t0 = vide ? Date.now() - 60000 : Date.parse(this.evenements[0].ts);
    this.t1 = vide ? Date.now() : Math.max(Date.parse(this.evenements[this.evenements.length - 1].ts) + 5 * 60000, this.hasAttribute('live') ? Date.now() : 0);
    this.taille();
    this.aller(this.hasAttribute('live') || this.reduit ? this.t1 : this.t0); this.enPause = false; this.majUi();
    if (this.reduit) { const d = this.evenements.findIndex((e) => e.kind === 'decision.open'); if (d !== -1) this.aller(Date.parse(this.evenements[d].ts) + 1); this.dessiner(0); }
    else if (!this.anime) { this.anime = true; requestAnimationFrame((ts) => this.boucle(ts)); }
  }

  /** Ajoute des événements en direct (flux SSE ou appel de l'hôte) : nouveaux acteurs, extension de la fenêtre, lecture immédiate. */
  push(liste) {
    const bons = (liste || []).filter((e) => e && e.ts && e.kind && e.actor && e.actor.id);
    if (!bons.length) return;
    let nouvelleLane = false;
    bons.forEach((e) => { const avant = this.lanes.length; this.enregistrer(e.actor); this.enregistrer(e.target); if (this.lanes.length !== avant) nouvelleLane = true; });
    this.rangerLanes();
    const enDirect = this.mode === 'direct' || this.curseur >= this.t1 - 1;
    this.evenements.push(...bons); this.evenements.sort((a, b) => Date.parse(a.ts) - Date.parse(b.ts));
    this.ui.vide.hidden = true;
    this.t1 = Math.max(this.t1, Date.parse(this.evenements[this.evenements.length - 1].ts) + 60000, Date.now());
    if (nouvelleLane || Object.keys(this.noeuds).length !== Object.keys(this.acteurs).length) this.disposer(this.canvas.clientWidth, this.canvas.clientHeight);
    if (enDirect) { bons.forEach((e) => this.jouer(e, false)); this.index = this.evenements.length; this.curseur = Date.now(); this.mode = 'direct'; }
    this.majUi();
  }

  enregistrer(a) {
    if (!a || !a.id) return;
    const ex = this.acteurs[a.id] || (this.acteurs[a.id] = { id: a.id, kind: 'agent' });
    ['name', 'role', 'lane', 'kind', 'avatar'].forEach((k) => { if (a[k]) ex[k] = a[k]; });
    if (ex.kind === 'human') ex.lane = ex.lane || 'direction';
    if (ex.kind === 'visitor') ex.lane = 'entree';
    ex.lane = ex.lane || 'autres';
    if (!this.lanes.includes(ex.lane)) this.lanes.push(ex.lane);
  }
  rangerLanes() { if (this.lanes.includes('entree')) { this.lanes.splice(this.lanes.indexOf('entree'), 1); this.lanes.push('entree'); } }

  // ---------- disposition
  taille() {
    const w = this.canvas.clientWidth; if (!w) return;
    this.etroit = w < 700;
    const h = this.etroit ? 560 : Math.max(460, Math.min(600, Math.round(w * 0.52)));
    this.canvas.width = Math.round(w * this.dpr); this.canvas.height = Math.round(h * this.dpr); this.canvas.style.height = h + 'px'; this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    this.disposer(w, h);
  }
  disposer(w, h) {
    const th = this.theme(), n = Math.max(1, this.lanes.length), large = w / n, anciens = this.noeuds; this.noeuds = {}; this.colonnes = [];
    this.lanes.forEach((id, i) => {
      const couleur = id === 'entree' ? th.visiteur : th.lanes[i % th.lanes.length];
      this.colonnes.push({ id, x0: i * large, x1: (i + 1) * large, cx: (i + 0.5) * large, couleur, nom: id === 'entree' ? this.T.entree : id.toUpperCase().replace(/[-_]/g, ' ') });
    });
    this.lanes.forEach((id, i) => {
      const liste = Object.values(this.acteurs).filter((a) => a.lane === id), col = this.colonnes[i], top = 190, bas = h - 96;
      liste.forEach((a, j) => {
        const humain = a.kind === 'human', y = humain ? 112 : (liste.length > 1 ? top + (bas - top) * j / (liste.length - 1) : (top + bas) / 2);
        const x = humain ? col.cx : col.cx + (liste.length > 1 ? (j % 2 ? 38 : -38) : 0), ancien = anciens[a.id];
        this.noeuds[a.id] = { id: a.id, nom: a.name || a.id, role: a.role || (humain ? this.T.humain : a.kind === 'visitor' ? this.T.visiteur : ''), kind: a.kind, couleur: humain ? th.or : col.couleur,
          x0: x, y0: y, x: ancien ? ancien.x : x, y: ancien ? ancien.y : y, r: humain ? (this.etroit ? 26 : 32) : (a.kind === 'visitor' ? 18 : this.etroit ? 20 : 24), phase: Math.random() * TAU, actif: ancien ? ancien.actif : 0, echec: ancien ? ancien.echec : 0 };
      });
    });
  }

  // ---------- temps
  jouer(e, silencieux) {
    const a = this.noeuds[e.actor.id], c = e.target ? this.noeuds[e.target.id] : null; if (!a) return;
    const th = this.theme();
    if (e.kind === 'run.start') a.actif = 1;
    if (e.kind === 'run.end') { a.actif = 0.35; if (e.status === 'failed') a.echec = 1; }
    if (e.kind === 'tool') { a.actif = Math.max(a.actif, 0.6); for (let i = 0; i < 6; i++) this.etincelles.push({ x: a.x, y: a.y, vx: (Math.random() - .5) * 2.2, vy: -1 - Math.random() * 1.6, vie: 1, couleur: a.couleur }); }
    if (e.cost && typeof e.cost.amount === 'number') this.totaux.cost += e.cost.amount;
    if (e.kind === 'decision.open') this.totaux.pending++;
    if (e.kind === 'decision.made') this.totaux.pending = Math.max(0, this.totaux.pending - 1);
    const texte = this.publique ? (e.public_title || this.T.generique[e.kind] || '') : (e.title || '');
    if (['message', 'decision.open', 'decision.made', 'visitor', 'launch', 'run.end'].includes(e.kind) && texte) {
      const teinte = e.kind.indexOf('decision') === 0 ? th.or : (e.kind === 'visitor' ? th.visiteur : a.couleur);
      this.cartes.push({ acteur: a, cible: c, texte, type: e.kind, teinte, heure: this.heureLocale(e.ts), statut: e.status || '', vie: silencieux ? 0.4 : 1 });
      if (this.cartes.length > 3) this.cartes.shift();
    }
    if (c) this.liens.push({ de: a, a: c, teinte: e.kind.indexOf('decision') === 0 ? th.or : a.couleur, vie: 1, pointille: e.kind === 'visitor' });
    if (this.liens.length > 5) this.liens.shift();
    this.ui.cout.textContent = this.publique ? '·' : this.totaux.cost.toFixed(2);
    this.ui.attente.textContent = String(this.totaux.pending);
  }
  heureLocale(ts) { const d = new Date(ts); return ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2); }
  remettre(jusqua, silencieux) {
    this.cartes = []; this.liens = []; this.etincelles = []; this.totaux = { cost: 0, pending: 0 }; this.index = 0;
    Object.values(this.noeuds).forEach((n) => { n.actif = 0; n.echec = 0; });
    while (this.index < this.evenements.length && Date.parse(this.evenements[this.index].ts) <= jusqua) { this.jouer(this.evenements[this.index], silencieux); this.index++; }
    this.ui.cout.textContent = this.publique ? '·' : this.totaux.cost.toFixed(2); this.ui.attente.textContent = String(this.totaux.pending);
  }
  avancer() { while (this.index < this.evenements.length && Date.parse(this.evenements[this.index].ts) <= this.curseur) { this.jouer(this.evenements[this.index], false); this.index++; } }
  aller(ms, silencieux) { this.curseur = Math.max(this.t0, Math.min(this.t1, ms)); this.remettre(this.curseur, silencieux !== false); this.mode = this.curseur >= this.t1 ? 'direct' : 'replay'; this.majUi(); }
  basculerPause() {
    if (this.reduit) { if (this.index < this.evenements.length) { const e = this.evenements[this.index]; this.curseur = Date.parse(e.ts); this.jouer(e, true); this.index++; } else this.aller(this.t0); this.majUi(); this.dessiner(0); return; }
    this.enPause = !this.enPause; if (this.mode === 'direct' && !this.enPause) this.aller(this.t0); this.majUi();
  }
  majUi() {
    const d = new Date(this.curseur || Date.now());
    this.ui.horloge.textContent = ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2);
    this.ui.slider.value = String(this.t1 > this.t0 ? Math.round((this.curseur - this.t0) / (this.t1 - this.t0) * 1000) : 1000);
    this.ui.etat.textContent = this.mode === 'direct' ? this.T.direct : this.T.replay;
    this.ui.pause.textContent = this.reduit ? this.T.suivant : (this.enPause ? this.T.lecture : this.T.pause); this.ui.pause.setAttribute('aria-pressed', String(!this.reduit && this.enPause));
  }

  // ---------- dessin
  arrondi(x, y, w, h, r) { const c = this.ctx; c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }
  noeud(n, t) {
    const ctx = this.ctx, th = this.theme(), bob = this.reduit ? 0 : Math.sin(t / 1400 + n.phase) * 4;
    n.x += (n.x0 - n.x) * 0.08; n.y += (n.y0 + bob - n.y) * 0.08;
    const x = n.x, y = n.y, r = n.r, humain = n.kind === 'human', visiteur = n.kind === 'visitor';
    ctx.save(); if (th.lueur) { ctx.shadowColor = n.couleur; ctx.shadowBlur = humain ? 28 : (n.actif ? 22 : 10); }
    ctx.strokeStyle = n.couleur; ctx.lineWidth = humain ? 3.5 : 2.5; if (visiteur) ctx.setLineDash([5, 5]);
    ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.stroke(); ctx.restore();
    ctx.save(); ctx.fillStyle = visiteur ? 'transparent' : rgba(n.couleur, humain ? 0.22 : 0.14); ctx.beginPath(); ctx.arc(x, y, r - 2, 0, TAU); ctx.fill(); ctx.restore();
    if (n.actif && !this.reduit) { ctx.save(); ctx.strokeStyle = th.encre; ctx.globalAlpha = 0.9; ctx.lineWidth = 2; ctx.lineCap = 'round'; const a0 = t / 900; ctx.beginPath(); ctx.arc(x, y, r + 6, a0, a0 + 1.4); ctx.stroke(); ctx.restore(); }
    if (n.echec) { ctx.fillStyle = '#ef4444'; ctx.beginPath(); ctx.arc(x + r * 0.75, y - r * 0.75, 5, 0, TAU); ctx.fill(); }
    ctx.fillStyle = humain ? th.or : th.encre; ctx.font = `800 ${Math.round(r * (humain ? 0.55 : 0.7))}px "IBM Plex Sans", system-ui, sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(humain ? this.T.vous.toUpperCase() : (visiteur ? '?' : initiales(n.nom).toUpperCase()), x, y + 1);
    ctx.font = `700 ${this.etroit ? 11 : 12}px "IBM Plex Sans", system-ui, sans-serif`; ctx.fillStyle = th.encre; ctx.textBaseline = 'alphabetic'; ctx.fillText(humain ? this.T.vous : String(n.nom).split(' ')[0], x, y + r + 16);
    if (n.role) { ctx.font = '600 10px "JetBrains Mono", ui-monospace, monospace'; ctx.fillStyle = th.doux; ctx.fillText(String(n.role).toUpperCase().slice(0, 22), x, y + r + 30); }
  }
  carte(c, i, w) {
    const ctx = this.ctx, th = this.theme(), a = c.acteur, corps = this.etroit ? 12 : 13, cw = Math.min(this.etroit ? w - 24 : 340, w - 24);
    ctx.save(); ctx.font = `500 ${corps}px "IBM Plex Sans", system-ui, sans-serif`;
    const mots = c.texte.split(' '); let lignes = [], l = '';
    mots.forEach((m) => { const t = l ? l + ' ' + m : m; if (ctx.measureText(t).width > cw - 30 && l) { lignes.push(l); l = m; } else l = t; }); if (l) lignes.push(l);
    lignes = lignes.slice(0, 3);
    const ch = 48 + lignes.length * (corps + 6), cx = Math.min(Math.max(12, a.x - cw / 2), w - cw - 12); let cy = Math.max(10, a.y - a.r - ch - 18 - i * 6);
    if (a.kind === 'human') cy = a.y + a.r + 40;
    ctx.globalAlpha = Math.max(0, Math.min(1, c.vie)) * (1 - i * 0.18);
    ctx.fillStyle = th.carte; this.arrondi(cx, cy, cw, ch, 14); ctx.fill(); ctx.strokeStyle = c.teinte; ctx.lineWidth = 1.4; this.arrondi(cx, cy, cw, ch, 14); ctx.stroke();
    ctx.fillStyle = th.encre; ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    ctx.font = `700 ${corps}px "IBM Plex Sans", system-ui, sans-serif`; ctx.fillText(a.kind === 'human' ? this.T.vous : a.nom, cx + 14, cy + 20);
    ctx.font = '600 10px "JetBrains Mono", ui-monospace, monospace'; ctx.fillStyle = c.teinte;
    const lib = this.T.types[c.type] || '', cibleNom = c.cible ? (c.cible.kind === 'human' ? this.T.vous.toUpperCase() : String(c.cible.nom).split(' ')[0].toUpperCase()) : '';
    ctx.fillText(c.heure + (cibleNom ? '  →  ' + cibleNom : '') + (c.statut ? '  ·  ' + c.statut : ''), cx + 14, cy + 35);
    const lw = ctx.measureText(lib).width + 14; ctx.fillStyle = rgba(c.teinte, 0.18); this.arrondi(cx + cw - lw - 12, cy + 10, lw, 18, 9); ctx.fill(); ctx.fillStyle = c.teinte; ctx.textBaseline = 'middle'; ctx.fillText(lib, cx + cw - lw - 5, cy + 19);
    ctx.font = `500 ${corps}px "IBM Plex Sans", system-ui, sans-serif`; ctx.fillStyle = th.encre; ctx.textBaseline = 'alphabetic';
    lignes.forEach((ln, k) => ctx.fillText(ln, cx + 14, cy + 54 + (corps + 6) * k));
    ctx.restore();
  }
  sousLaSouris() { let sur = null; Object.values(this.noeuds).forEach((n) => { if (this.souris.x >= 0 && Math.hypot(this.souris.x - n.x, this.souris.y - n.y) < n.r + 8) sur = n; }); return sur; }
  infobulle(n) {
    const ctx = this.ctx, th = this.theme(), en = this.lang === 'en';
    const lignes = [n.nom + (n.role ? ' · ' + n.role : ''), n.kind === 'human' ? (en ? 'approves, refuses or asks for changes' : 'approuve, refuse ou demande des changements') : (n.kind === 'visitor' ? (en ? 'an outside agent at the door' : 'un agent extérieur à la porte') : (n.actif ? (en ? 'working' : 'au travail') : (en ? 'idle' : 'au repos')))];
    ctx.save(); ctx.font = '12px "IBM Plex Sans", system-ui, sans-serif';
    const w = Math.max(...lignes.map((l) => ctx.measureText(l).width)) + 22, h = 16 * lignes.length + 14;
    const bx = Math.min(Math.max(8, n.x - w / 2), this.canvas.clientWidth - w - 8), by = Math.max(6, n.y - n.r - h - 12);
    ctx.fillStyle = th.carte; ctx.strokeStyle = rgba(n.couleur, 0.7); ctx.lineWidth = 1; this.arrondi(bx, by, w, h, 8); ctx.fill(); ctx.stroke();
    ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic'; lignes.forEach((l, i) => { ctx.fillStyle = i ? th.doux : th.encre; ctx.fillText(l, bx + 11, by + 20 + 16 * i); });
    ctx.restore();
  }
  dessiner(dt) {
    const ctx = this.ctx, th = this.theme(), w = this.canvas.clientWidth, h = this.canvas.clientHeight, t = performance.now();
    if (!w || !h) return;
    const fond = ctx.createLinearGradient(0, 0, w, h); fond.addColorStop(0, th.fond[0]); fond.addColorStop(0.45, th.fond[1]); fond.addColorStop(1, th.fond[2]);
    ctx.fillStyle = fond; ctx.fillRect(0, 0, w, h);
    this.colonnes.forEach((c, i) => {
      if (i) { ctx.strokeStyle = th.grille; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(c.x0, 52); ctx.lineTo(c.x0, h - 44); ctx.stroke(); }
      const g = ctx.createLinearGradient(0, 60, 0, h); g.addColorStop(0, rgba(c.couleur, th.lueur ? 0.16 : 0.08)); g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(c.cx - 26, 60); ctx.lineTo(c.cx + 26, 60); ctx.lineTo(c.x1 - 10, h - 44); ctx.lineTo(c.x0 + 10, h - 44); ctx.closePath(); ctx.fill();
      ctx.save(); if (th.lueur) { ctx.shadowColor = c.couleur; ctx.shadowBlur = 10; } ctx.strokeStyle = c.couleur; ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(c.cx - 22, 48); ctx.lineTo(c.cx + 22, 48); ctx.stroke(); ctx.restore();
      ctx.fillStyle = th.doux; ctx.font = '600 10px "JetBrains Mono", ui-monospace, monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic'; ctx.fillText(this.etroit ? c.nom.slice(0, 9) : c.nom, c.cx, 36);
    });
    this.liens.forEach((l) => {
      l.vie -= dt / 6000; if (l.vie <= 0) return;
      ctx.save(); ctx.globalAlpha = Math.max(0, l.vie) * 0.75; ctx.strokeStyle = l.teinte; ctx.lineWidth = 1.4; if (l.pointille) ctx.setLineDash([4, 6]);
      ctx.beginPath(); ctx.moveTo(l.de.x, l.de.y); ctx.quadraticCurveTo((l.de.x + l.a.x) / 2, (l.de.y + l.a.y) / 2 - 40, l.a.x, l.a.y); ctx.stroke();
      if (!this.reduit) { const p = (1 - l.vie) % 1, qx = (1 - p) * (1 - p) * l.de.x + 2 * (1 - p) * p * ((l.de.x + l.a.x) / 2) + p * p * l.a.x, qy = (1 - p) * (1 - p) * l.de.y + 2 * (1 - p) * p * ((l.de.y + l.a.y) / 2 - 40) + p * p * l.a.y;
        ctx.fillStyle = l.teinte; if (th.lueur) { ctx.shadowColor = l.teinte; ctx.shadowBlur = 12; } ctx.beginPath(); ctx.arc(qx, qy, 3.5, 0, TAU); ctx.fill(); }
      ctx.restore();
    });
    this.liens = this.liens.filter((l) => l.vie > 0);
    Object.values(this.noeuds).forEach((n) => this.noeud(n, t));
    this.etincelles.forEach((e) => { e.x += e.vx; e.y += e.vy; e.vy += 0.05; e.vie -= dt / 900; ctx.globalAlpha = Math.max(0, e.vie); ctx.fillStyle = e.couleur; ctx.beginPath(); ctx.arc(e.x, e.y, 2, 0, TAU); ctx.fill(); });
    ctx.globalAlpha = 1; this.etincelles = this.etincelles.filter((e) => e.vie > 0);
    this.cartes.forEach((c, i) => { if (!this.reduit) c.vie -= dt / 9000; this.carte(c, this.cartes.length - 1 - i, w); });
    this.cartes = this.cartes.filter((c) => c.vie > 0);
    ctx.save(); ctx.font = '11px "IBM Plex Sans", system-ui, sans-serif'; ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    const lg = [[th.lanes[3], this.T.legende[0]], [th.lanes[1], this.T.legende[1]], [th.or, this.T.legende[2]], [th.visiteur, this.T.legende[3]]], pas = this.etroit ? 86 : 118;
    lg.forEach((e, i) => { const x = 14 + i * pas; ctx.strokeStyle = e[0]; ctx.lineWidth = 2.5; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x, h - 16); ctx.lineTo(x + 18, h - 16); ctx.stroke(); ctx.fillStyle = th.doux; ctx.fillText(e[1], x + 24, h - 12); });
    if (!this.etroit) { ctx.textAlign = 'right'; ctx.fillStyle = th.doux; ctx.fillText(this.T.pied, w - 14, h - 12); }
    ctx.restore();
    const sur = this.sousLaSouris(); if (sur) this.infobulle(sur);
  }
  boucle(ts) {
    if (!this.anime || !this.isConnected) return;
    const dt = this.dernier === null ? 0 : Math.min(250, ts - this.dernier); this.dernier = ts;
    if (!this.enPause && this.mode === 'replay') { this.curseur += dt * this.vitesse; if (this.curseur > this.t1) { this.curseur = this.t1; this.mode = 'direct'; } this.avancer(); this.majUi(); }
    else if (this.mode === 'direct') { this.curseur = Math.max(this.curseur, Date.now()); this.t1 = Math.max(this.t1, this.curseur); this.avancer(); if (Math.floor(ts / 1000) !== Math.floor((ts - dt) / 1000)) this.majUi(); }
    this.dessiner(dt); requestAnimationFrame((n) => this.boucle(n));
  }
}

if (typeof customElements !== 'undefined' && !customElements.get('wakil-arium')) customElements.define('wakil-arium', WakilArium);
export default WakilArium;

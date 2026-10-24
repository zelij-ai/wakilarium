// Wakilarium — le badge « my agents today » : un SVG servi par le collecteur en mode public (titres publics seulement).
// Un anneau par acteur, une bulle par événement des dernières 24 h, l'or pour l'humain. Aucune animation : une image.
const COULEURS = ['#4f7cff', '#2bb3a3', '#c86bff', '#ff8a4c', '#58c15c', '#e94fa1'];

function echapper(s) { return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }

/**
 * @param {object} etat  état public (public.js)
 * @param {{theme?: 'night'|'day', largeur?: number}} options
 */
export function badgeSvg(etat, options = {}) {
  const nuit = (options.theme || 'night') !== 'day';
  const W = options.largeur || 320, H = 64;
  const fond = nuit ? '#0e0b08' : '#f6f2ea', encre = nuit ? '#f2efe7' : '#12151c', doux = nuit ? 'rgba(242,239,231,.6)' : 'rgba(18,21,28,.6)', or = '#e0a21c';
  const acteurs = (etat.actors || []).slice(0, 8);
  const n = (etat.events || []).length;
  const lanes = etat.lanes || [];
  const anneaux = acteurs.map((a, i) => {
    const x = 118 + i * 24, humain = a.kind === 'human', couleur = humain ? or : COULEURS[Math.max(0, lanes.indexOf(a.lane)) % COULEURS.length];
    const tiret = a.kind === 'visitor' ? ' stroke-dasharray="3 3"' : '';
    return `<circle cx="${x}" cy="26" r="${humain ? 9 : 7}" fill="none" stroke="${couleur}" stroke-width="${humain ? 2.5 : 2}"${tiret}><title>${echapper(a.name || a.id)}</title></circle>`;
  }).join('');
  const bulles = Array.from({ length: Math.min(40, n) }, (_, i) => `<circle cx="${118 + (i % 20) * 9.5}" cy="${46 + Math.floor(i / 20) * 7}" r="2" fill="${encre}" opacity=".55"/>`).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="Wakilarium: ${acteurs.length} agents, ${n} events today">
<rect width="${W}" height="${H}" rx="10" fill="${fond}"/>
<rect x=".5" y=".5" width="${W - 1}" height="${H - 1}" rx="9.5" fill="none" stroke="${doux}" stroke-opacity=".35"/>
<circle cx="24" cy="32" r="11" fill="none" stroke="${or}" stroke-width="2.5"/>
<text x="44" y="24" font-family="JetBrains Mono, ui-monospace, monospace" font-size="10" font-weight="700" letter-spacing="1.5" fill="${doux}">WAKILARIUM</text>
<text x="44" y="43" font-family="IBM Plex Sans, system-ui, sans-serif" font-size="11" fill="${encre}">${acteurs.length} agent${acteurs.length > 1 ? 's' : ''} · ${n} event${n > 1 ? 's' : ''}</text>
${anneaux}
${bulles}
</svg>`;
}

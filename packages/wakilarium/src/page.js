// Wakilarium — la page servie par le collecteur : langue, thème, liens publics. Aucune requête vers l'extérieur.
const racine = document.documentElement;
const scene = document.querySelector('wakil-arium');
const T = {
  fr: { jour: '☀ Jour', nuit: '☾ Nuit', hook: 'Claude Code branché par le hook : chaque outil, chaque réponse arrive ici. Rien ne quitte cette machine.', cmd: 'Partager un badge dans un README :', export: 'Exporter la journée' },
  en: { jour: '☀ Day', nuit: '☾ Night', hook: 'Claude Code is plugged in through the hook: every tool, every answer lands here. Nothing leaves this machine.', cmd: 'Share a badge in a README:', export: 'Export the day' },
};
let lang = (localStorage.getItem('wk-lang') || (navigator.language || 'fr').slice(0, 2)) === 'en' ? 'en' : 'fr';
let theme = localStorage.getItem('wk-theme') === 'day' ? 'day' : 'night';

function appliquer() {
  racine.setAttribute('lang', lang); racine.setAttribute('data-theme', theme);
  if (scene) { scene.setAttribute('lang', lang); scene.setAttribute('theme', theme); }
  document.querySelectorAll('[data-lang]').forEach((b) => b.setAttribute('aria-pressed', String(b.getAttribute('data-lang') === lang)));
  const t = document.querySelector('[data-theme-toggle]'); t.textContent = theme === 'day' ? T[lang].nuit : T[lang].jour; t.setAttribute('aria-pressed', String(theme === 'day'));
  document.querySelector('[data-i18n="hook"]').textContent = T[lang].hook;
  const cmd = document.querySelector('[data-i18n="cmd"]'); cmd.firstChild.textContent = T[lang].cmd + ' ';
  document.querySelector('[data-export]').textContent = T[lang].export;
  try { localStorage.setItem('wk-lang', lang); localStorage.setItem('wk-theme', theme); } catch { /* stockage indisponible */ }
}
document.querySelectorAll('[data-lang]').forEach((b) => b.addEventListener('click', () => { lang = b.getAttribute('data-lang'); appliquer(); }));
document.querySelector('[data-theme-toggle]').addEventListener('click', () => { theme = theme === 'day' ? 'night' : 'day'; appliquer(); });
appliquer();

fetch('/jeton').then((r) => r.json()).then((j) => {
  const a = document.querySelector('[data-public-link]'); a.href = j.public_url + '/'; a.textContent = location.origin + j.public_url + '/';
  const code = document.querySelector('[data-i18n="cmd"] code'); code.textContent = `![Wakilarium](${location.origin}${j.badge_url})`;
}).catch(() => {});

// Page publique : le composant lit l'état public et masque le coût
if (location.pathname.startsWith('/public/')) {
  const base = location.pathname.replace(/\/(page)?\/?$/, '');
  scene.setAttribute('src', `${base}/state`); scene.setAttribute('public', ''); scene.removeAttribute('live'); scene.removeAttribute('stream');
}

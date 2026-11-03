#!/usr/bin/env node
// Wakilarium — `npx wakilarium` : vos propres agents dans l'aquarium en une minute.
//   wakilarium                 démarre le collecteur local, propose d'installer le hook Claude Code, ouvre la page
//   wakilarium demo            la journée fictive de la maquette, sans rien installer
//   wakilarium hook            (appelé par Claude Code) traduit un hook en Wakil Events et les envoie au collecteur
//   wakilarium install-hooks   installe le hook dans ~/.claude/settings.json (sauvegarde à côté)
//   wakilarium uninstall-hooks le retire
//   options : --port 8798 --no-open --no-hooks --yes --lang fr|en --home <dossier>
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { createInterface } from 'node:readline';
import { spawn } from 'node:child_process';
import { creerServeur, chargerDemo } from '../src/collecteur.js';
import { Magasin, dossierMaison } from '../src/magasin.js';
import { traduire, envoyer, lireReglages, avecHooks, sansHooks, installes, ecrireReglages, fichierReglages } from '../src/hooks.js';

const BINAIRE = resolve(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const commande = args.find((a) => !a.startsWith('--')) || 'serve';
const option = (nom, defaut) => { const i = args.indexOf(`--${nom}`); return i !== -1 && args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : defaut; };
const drapeau = (nom) => args.includes(`--${nom}`);
const port = Number(option('port', process.env.WAKILARIUM_PORT || 8798));
const lang = option('lang', (process.env.LANG || '').startsWith('fr') ? 'fr' : 'en');
if (option('home')) process.env.WAKILARIUM_HOME = option('home');

const T = lang === 'fr' ? {
  demarre: (u) => `Wakilarium écoute sur ${u} — vos agents arrivent dès leur premier geste.`,
  demo: (u) => `Journée de démonstration (personnages fictifs) sur ${u}.`,
  question: 'Installer le hook Claude Code dans ~/.claude/settings.json ? Une sauvegarde est faite à côté, rien d’autre n’est lu. [o/N] ',
  installe: (f, s) => `Hook installé dans ${f}${s ? ` (sauvegarde : ${s})` : ''}. Chaque geste de Claude Code arrive maintenant dans l’aquarium.`,
  deja: 'Hook déjà installé.', retire: (f) => `Hook retiré de ${f}.`, absent: 'Aucun hook Wakilarium à retirer.',
  public: (u) => `Page publique (titres publics seulement) : ${u}`, badge: (u) => `Badge pour vos README : ${u}`,
  sans: 'Sans hook, lancez plus tard : npx wakilarium install-hooks', fin: 'Ctrl+C pour arrêter ; les événements restent dans ~/.wakilarium.',
} : {
  demarre: (u) => `Wakilarium is listening on ${u} — your agents show up at their first move.`,
  demo: (u) => `Demo day (fictional characters) on ${u}.`,
  question: 'Install the Claude Code hook in ~/.claude/settings.json? A backup is kept next to it, nothing else is read. [y/N] ',
  installe: (f, s) => `Hook installed in ${f}${s ? ` (backup: ${s})` : ''}. Every Claude Code move now reaches the aquarium.`,
  deja: 'Hook already installed.', retire: (f) => `Hook removed from ${f}.`, absent: 'No Wakilarium hook to remove.',
  public: (u) => `Public page (public titles only): ${u}`, badge: (u) => `Badge for your READMEs: ${u}`,
  sans: 'Without the hook, run later: npx wakilarium install-hooks', fin: 'Ctrl+C to stop; events stay in ~/.wakilarium.',
};

async function demander(question) {
  if (drapeau('yes')) return true;
  if (!process.stdin.isTTY) return false;
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const r = await new Promise((res) => rl.question(question, res));
  rl.close();
  return /^[oy]/i.test(r.trim());
}

function ouvrir(url) {
  if (drapeau('no-open')) return;
  const cmd = process.platform === 'win32' ? ['cmd', ['/c', 'start', '""', url]] : process.platform === 'darwin' ? ['open', [url]] : ['xdg-open', [url]];
  try { spawn(cmd[0], cmd[1], { stdio: 'ignore', detached: true }).unref(); } catch { /* pas de navigateur : l'adresse est affichée */ }
}

async function hook() {
  // Appelé par Claude Code : lit le JSON du hook, traduit, envoie au collecteur local. Toujours silencieux, toujours 0.
  let texte = '';
  try { for await (const m of process.stdin) texte += m; } catch { /* rien à lire */ }
  let donnees = {};
  try { donnees = JSON.parse(texte || '{}'); } catch { donnees = {}; }
  const evenements = traduire(donnees);
  await envoyer(evenements, `http://127.0.0.1:${port}/events`);
  process.exit(0);
}

function installer() {
  const fichier = fichierReglages();
  const reglages = lireReglages(fichier);
  if (installes(reglages)) { console.log(T.deja); return; }
  const sauvegarde = ecrireReglages(avecHooks(reglages, BINAIRE), fichier);
  console.log(T.installe(fichier, sauvegarde));
}

function desinstaller() {
  const fichier = fichierReglages();
  const reglages = lireReglages(fichier);
  if (!installes(reglages)) { console.log(T.absent); return; }
  ecrireReglages(sansHooks(reglages), fichier);
  console.log(T.retire(fichier));
}

async function servir(demo) {
  const magasin = new Magasin({ dossier: demo ? undefined : dossierMaison(), persister: !demo });
  if (demo) chargerDemo(magasin);
  const serveur = creerServeur({ magasin, lang });
  await new Promise((res, rej) => { serveur.once('error', rej); serveur.listen(port, '127.0.0.1', res); });
  const url = `http://127.0.0.1:${port}/`;
  console.log(demo ? T.demo(url) : T.demarre(url));
  console.log(T.public(`${url}public/${serveur.jeton}/`));
  console.log(T.badge(`${url}badge.svg`));
  if (!demo && !drapeau('no-hooks')) {
    const reglages = lireReglages(fichierReglages());
    if (installes(reglages)) console.log(T.deja);
    else if (await demander(T.question)) installer();
    else console.log(T.sans);
  }
  console.log(T.fin);
  ouvrir(url);
}

try {
  if (commande === 'hook') await hook();
  else if (commande === 'install-hooks') installer();
  else if (commande === 'uninstall-hooks') desinstaller();
  else if (commande === 'demo') await servir(true);
  else if (commande === 'serve' || commande === 'start') await servir(false);
  else { console.error(`commande inconnue : ${commande}`); process.exit(2); }
} catch (e) {
  if (commande === 'hook') process.exit(0);
  console.error(String(e && e.message || e));
  process.exit(1);
}

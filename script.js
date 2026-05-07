/**
 * ============================================================
 * LA STRAADA — script.js
 * Lit data.json → injecte tout le contenu du site
 * ⚠️ Ne pas modifier ce fichier. Tout est dans data.json.
 * ============================================================
 */
'use strict';

document.addEventListener('DOMContentLoaded', charger);

async function charger() {
  try {
    const res = await fetch('./data.json');
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const d = await res.json();

    // Couleurs dynamiques depuis data.json > seo
    if (d.seo?.couleurPrimaire)  document.documentElement.style.setProperty('--verde', d.seo.couleurPrimaire);
    if (d.seo?.couleurAccent)    document.documentElement.style.setProperty('--creme', d.seo.couleurAccent);
    if (d.seo?.couleurAccentVif) document.documentElement.style.setProperty('--or',    d.seo.couleurAccentVif);

    seo(d); nav(d); hero(d); intro(d); menu(d);
    galerie(d); avis(d); infos(d); contact(d);
    tiktokFloat(d); instagramFloat(d); footer(d);
    navScroll(); scrollReveal();

  } catch (e) {
    console.error('Erreur data.json:', e);
    document.body.insertAdjacentHTML('afterbegin',
      `<div style="background:#c0392b;color:#fff;padding:1rem;text-align:center;position:fixed;top:0;left:0;right:0;z-index:9999;font-family:sans-serif;">
        ⚠️ Impossible de charger <b>data.json</b>. Vérifiez que le fichier existe et est valide.
      </div>`
    );
  }
}

/* ── SEO ── */
function seo(d) {
  const s = d.seo || {};
  if (s.titre) { setText('page-title', s.titre); setAttr('og-title', 'content', s.titre); }
  if (s.description) { setAttr('meta-description', 'content', s.description); setAttr('og-desc', 'content', s.description); }
  const ogImg = d.galerie?.photos?.[0] || d.hero?.image || '';
  if (ogImg) setAttr('og-image', 'content', ogImg);
  // Favicon dynamique
  const fav = document.getElementById('favicon');
  if (fav && d.restaurant?.logo) fav.href = d.restaurant.logo;
  // Mettre à jour H1 accessible
  const h1 = document.getElementById('hero-h1');
  if (h1 && d.restaurant?.nomComplet) h1.textContent = d.restaurant.nomComplet + ' — Restaurant fusion franco-italien';
}

/* ── NAVIGATION ── */
function nav(d) {
  const r = d.restaurant || {};
  // Logo image
  const logoImg = document.getElementById('nav-logo-img');
  if (logoImg && r.logo) { logoImg.src = r.logo; logoImg.alt = r.nom || 'Logo'; }
  // Nom texte
  setText('nav-logo-text', r.nom);

  // Burger + overlay
  const burger  = document.getElementById('nav-burger');
  const links   = document.getElementById('nav-links');
  const overlay = document.getElementById('nav-overlay');

  function ouvrirMenu() {
    links.classList.add('open');
    overlay.classList.add('open');
    burger.classList.add('open');
    burger.setAttribute('aria-expanded', 'true');
    burger.setAttribute('aria-label', 'Fermer le menu');
    document.body.style.overflow = 'hidden';
  }

  function fermerMenu() {
    links.classList.remove('open');
    overlay.classList.remove('open');
    burger.classList.remove('open');
    burger.setAttribute('aria-expanded', 'false');
    burger.setAttribute('aria-label', 'Ouvrir le menu');
    document.body.style.overflow = '';
  }

  if (burger && links) {
    burger.addEventListener('click', () => {
      const estOuvert = links.classList.contains('open');
      estOuvert ? fermerMenu() : ouvrirMenu();
    });

    // Fermer au clic sur overlay
    if (overlay) overlay.addEventListener('click', fermerMenu);

    // Fermer via Escape
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && links.classList.contains('open')) fermerMenu();
    });

    // Fermer au clic sur un lien
    links.querySelectorAll('a').forEach(a => a.addEventListener('click', fermerMenu));
  }
}

/* ── HERO ── */
function hero(d) {
  const h   = d.hero || {};
  const med = document.getElementById('hero-media');

  if (med) {
    if (h.type === 'video' && h.video) {
      // Détection support vidéo
      const canPlay = document.createElement('video').canPlayType('video/mp4');

      if (canPlay !== '') {
        const v = document.createElement('video');

        // Attributs essentiels pour autoplay mobile
        v.setAttribute('autoplay', '');
        v.setAttribute('muted', '');           // attribut HTML (pas seulement propriété JS)
        v.setAttribute('loop', '');
        v.setAttribute('playsinline', '');     // iOS Safari
        v.setAttribute('webkit-playsinline', ''); // iOS vieux
        v.setAttribute('x5-playsinline', ''); // WeChat/Android
        v.setAttribute('x5-video-player-type', 'h5');
        v.setAttribute('preload', 'none');     // économise la bande passante mobile
        v.muted = true;                        // propriété JS en plus (double sécurité)

        if (h.videoPoster) {
          v.setAttribute('poster', h.videoPoster);
        }

        // Source
        const src = document.createElement('source');
        src.src  = h.video;
        src.type = 'video/mp4';
        v.appendChild(src);

        med.appendChild(v);

        // Tentative de lecture avec gestion d'erreur robuste
        const tentativeLecture = () => {
          const p = v.play();
          if (p instanceof Promise) {
            p.catch(() => {
              // Autoplay bloqué → fallback image
              afficherFallbackHero(med, h);
            });
          }
        };

        // Sur iOS, on attend que les métadonnées soient prêtes
        if (v.readyState >= 1) {
          tentativeLecture();
        } else {
          v.addEventListener('loadedmetadata', tentativeLecture, { once: true });
          // Timeout de sécurité : si la vidéo ne se charge pas en 4s → fallback
          setTimeout(() => {
            if (v.readyState < 1) afficherFallbackHero(med, h);
          }, 4000);
        }

        // Gestion erreur réseau
        v.addEventListener('error', () => afficherFallbackHero(med, h), { once: true });

      } else {
        // Navigateur ne supporte pas mp4 → image directement
        afficherFallbackHero(med, h);
      }

    } else {
      // Mode image
      const img = document.createElement('img');
      img.src     = h.image || '';
      img.alt     = '';
      img.loading = 'eager';
      img.fetchPriority = 'high';
      med.appendChild(img);
    }
  }

  const r = d.restaurant || {};
  // Le H1 textuel est géré via sr-only dans le HTML
  setText('hero-tagline', r.sousTagline || r.tagline);
  setText('hero-badge',   r.tagline);

  // Bouton appel hero
  const callBtn = document.getElementById('hero-call-btn');
  if (callBtn) {
    if (r.telephone && !r.telephone.includes('X')) {
      const tel = r.telephone.replace(/\s/g, '');
      callBtn.href = 'tel:' + tel;
      callBtn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.5 12 19.79 19.79 0 0 1 1.21 3.35 2 2 0 0 1 3.22 1h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.09 8.91a16 16 0 0 0 5.61 5.61l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 14.92z"/></svg> ${esc(r.telephone)}`;
    } else if (r.whatsapp) {
      callBtn.href = waUrl(r.whatsapp, r.whatsappMessage);
      callBtn.target = '_blank';
      callBtn.rel = 'noopener noreferrer';
      callBtn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg> Contacter`;
    } else {
      callBtn.style.display = 'none';
    }
  }
}

function afficherFallbackHero(med, h) {
  const src = h.videoPoster || h.image;
  if (!src) return;
  med.innerHTML = '';
  const img = document.createElement('img');
  img.src = src;
  img.alt = '';
  img.loading = 'eager';
  img.fetchPriority = 'high';
  med.appendChild(img);
}

/* ── INTRO ── */
function intro(d) {
  setText('intro-text', d.restaurant?.description);
  const dl    = d.restaurant?.livraison;
  const dlEl  = document.getElementById('deliveroo-link');
  const ubEl  = document.getElementById('ubereats-link');
  if (dlEl && dl?.deliveroo) dlEl.href = dl.deliveroo; else if (dlEl) dlEl.style.display = 'none';
  if (ubEl && dl?.ubereats)  ubEl.href = dl.ubereats;  else if (ubEl) ubEl.style.display = 'none';
}

/* ── MENU ── */
function menu(d) {
  const cats = d.menu?.categories || [];
  const tabs = document.getElementById('menu-tabs');
  const grid = document.getElementById('menu-grid');
  if (!tabs || !grid || !cats.length) return;

  cats.forEach((cat, i) => {
    const btn = document.createElement('button');
    btn.className = 'menu__tab' + (i === 0 ? ' active' : '');
    btn.innerHTML = `${cat.emoji || ''} ${esc(cat.nom)}`;
    btn.setAttribute('role', 'tab');
    btn.setAttribute('aria-selected', i === 0);
    btn.setAttribute('type', 'button');
    btn.addEventListener('click', () => {
      tabs.querySelectorAll('.menu__tab').forEach((t, j) => {
        t.classList.toggle('active', j === i);
        t.setAttribute('aria-selected', j === i);
      });
      renderPlats(cat.plats, grid);
    });
    tabs.appendChild(btn);
  });
  renderPlats(cats[0]?.plats || [], grid);
}

function renderPlats(plats, grid) {
  grid.innerHTML = '';
  plats.forEach((p, i) => {
    const card = document.createElement('article');
    card.className = 'menu__card';
    card.style.animationDelay = (i * 50) + 'ms';
    const tagKey   = (p.tag || '').toLowerCase().replace(/\s+/g, '-');
    const tagClass = 'tag--' + tagKey;
    const tagHtml  = p.tag ? `<span class="menu__card-tag ${tagClass}">${esc(p.tag)}</span>` : '';
    card.innerHTML = `
      <div class="menu__card-header">
        <h3 class="menu__card-name">${esc(p.nom)}</h3>
        <span class="menu__card-prix">${esc(p.prix)} €</span>
      </div>
      ${tagHtml}
      <p class="menu__card-desc">${esc(p.description)}</p>`;
    grid.appendChild(card);
  });
}

/* ── GALERIE ── */
function galerie(d) {
  const photos = d.galerie?.photos || [];
  const grid   = document.getElementById('galerie-grid');
  if (!grid || !photos.length) return;

  // Extensions par défaut si absentes
  const EXTS = ['.jpg', '.jpeg', '.png', '.webp'];
  const normaliser = (url) => {
    if (!url) return '';
    const u = String(url);
    // Si l'URL contient déjà un point dans la dernière partie → déjà une extension
    const dernierSegment = u.split('/').pop();
    if (dernierSegment.includes('.')) return u;
    // Sinon on ajoute .jpg par défaut
    return u + '.jpg';
  };

  photos.forEach((url, i) => {
    const urlNorm = normaliser(url);
    const item = document.createElement('div');
    item.className = 'galerie__item';
    item.setAttribute('role', 'listitem');
    item.setAttribute('tabindex', '0');

    const img = document.createElement('img');
    img.src     = urlNorm;
    img.alt     = 'Photo du restaurant La Straada ' + (i + 1);
    img.loading = 'lazy';
    img.decoding = 'async';
    // Fallback si image manquante : on essaie d'autres extensions
    img.addEventListener('error', () => {
      const ext = EXTS.find(e => !urlNorm.endsWith(e) && e !== '.jpg');
      if (ext) img.src = url + ext;
    }, { once: true });

    item.appendChild(img);
    item.addEventListener('click',  () => ouvrirLb(photos.map(normaliser), i));
    item.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); ouvrirLb(photos.map(normaliser), i); } });
    grid.appendChild(item);
  });
}

/* Lightbox */
let lbP = [], lbI = 0;
function ouvrirLb(p, i) {
  lbP = p; lbI = i;
  const lb  = document.getElementById('lightbox');
  const img = document.getElementById('lightbox-img');
  if (!lb || !img) return;
  img.src = p[i];
  lb.classList.add('open');
  document.body.style.overflow = 'hidden';
  document.getElementById('lightbox-close')?.focus();
}
function fermerLb() {
  document.getElementById('lightbox')?.classList.remove('open');
  document.body.style.overflow = '';
}
function navLb(dir) {
  lbI = (lbI + dir + lbP.length) % lbP.length;
  const img = document.getElementById('lightbox-img');
  if (img) img.src = lbP[lbI];
}

// Attachement des événements lightbox (au chargement, avant le fetch)
document.getElementById('lightbox-close')?.addEventListener('click', fermerLb);
document.getElementById('lightbox-prev')?.addEventListener('click',  () => navLb(-1));
document.getElementById('lightbox-next')?.addEventListener('click',  () => navLb(1));
document.getElementById('lightbox')?.addEventListener('click', e => { if (e.target.id === 'lightbox') fermerLb(); });
document.addEventListener('keydown', e => {
  if (!document.getElementById('lightbox')?.classList.contains('open')) return;
  if (e.key === 'Escape')     fermerLb();
  if (e.key === 'ArrowLeft')  navLb(-1);
  if (e.key === 'ArrowRight') navLb(1);
});

/* ── AVIS ── */
function avis(d) {
  const sec = document.getElementById('avis');
  if (!sec) return;
  if (!d.avis?.clients?.length) { sec.hidden = true; return; }
  const clients = d.avis.clients;
  setText('avis-titre', d.avis.titre);

  // Score moyen
  const moy = (clients.reduce((s, c) => s + (c.note || 0), 0) / clients.length).toFixed(1);
  const scoreEl = document.getElementById('avis-score');
  if (scoreEl) scoreEl.innerHTML = `
    <span class="avis__score-note">${moy}</span>
    <div class="avis__score-right">
      <span class="avis__score-stars" aria-hidden="true">${etoiles(Math.round(parseFloat(moy)), 5)}</span>
      <span class="avis__score-label">${clients.length} avis Google</span>
    </div>`;

  // Cartes
  const grid = document.getElementById('avis-grid');
  if (!grid) return;
  clients.forEach((c, i) => {
    const card = document.createElement('article');
    card.className = 'avis__card';
    card.style.animationDelay = (i * 80) + 'ms';
    const av = c.photo
      ? `<img class="avis__card-avatar" src="${esc(c.photo)}" alt="Photo de ${esc(c.nom)}" loading="lazy" width="44" height="44"/>`
      : `<div class="avis__card-initiale" aria-hidden="true">${esc(c.nom.charAt(0).toUpperCase())}</div>`;
    card.innerHTML = `
      <div class="avis__card-head">
        ${av}
        <div class="avis__card-meta">
          <span class="avis__card-nom">${esc(c.nom)}</span>
          <span class="avis__card-date">${esc(c.date || '')}</span>
        </div>
      </div>
      <div class="avis__card-stars" aria-label="${c.note} étoiles sur 5">${etoiles(c.note || 0, 5)}</div>
      <p class="avis__card-text">${esc(c.commentaire)}</p>`;
    grid.appendChild(card);
  });
}

function etoiles(n, max) {
  let h = '';
  for (let i = 1; i <= max; i++) h += `<span class="avis__card-star${i > n ? ' avis__card-star--empty' : ''}" aria-hidden="true">★</span>`;
  return h;
}

/* ── INFOS ── */
function infos(d) {
  const r = d.restaurant || {};

  // Horaires
  const listeH = document.getElementById('horaires-list');
  if (listeH && d.horaires) {
    const joursNoms = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
    const jourNow   = joursNoms[new Date().getDay()];
    d.horaires.forEach(h => {
      const li = document.createElement('li');
      if (h.jour === jourNow) li.classList.add('today');
      let horaireHtml;
      if (h.ferme) {
        horaireHtml = '<span class="ferme">Fermé</span>';
      } else if (h.soirUniquement) {
        horaireHtml = `<span>${esc(h.soir)}–${esc(h.fermetureSoir)} <span class="soir-seul">(soir)</span></span>`;
      } else {
        const midi = (h.ouverture && h.fermeture) ? `${esc(h.ouverture)}–${esc(h.fermeture)}` : '';
        const soir = (h.soir && h.fermetureSoir) ? `${esc(h.soir)}–${esc(h.fermetureSoir)}` : '';
        horaireHtml = `<span>${[midi, soir].filter(Boolean).join(' · ')}</span>`;
      }
      li.innerHTML = `<span class="jour">${esc(h.jour)}</span>${horaireHtml}`;
      listeH.appendChild(li);
    });
  }

  // Adresse
  const adr   = r.adresse;
  const adrEl = document.getElementById('adresse-block');
  if (adrEl && adr) adrEl.innerHTML = `${esc(adr.rue)}<br>${esc(adr.codePostal)} ${esc(adr.ville)}<br>${esc(adr.pays)}`;

  // Maps lien
  const mapLk = document.getElementById('map-link');
  if (mapLk) mapLk.href = r.maps?.lienExterne || '#';

  // Maps iframe — sécurité : on accepte uniquement les iframes Google Maps
  const mapIf = document.getElementById('map-iframe-wrap');
  if (mapIf && r.maps?.iframe) {
    const iframeHtml = String(r.maps.iframe).trim();
    if (iframeHtml.startsWith('<iframe') && iframeHtml.includes('google.com/maps')) {
      mapIf.innerHTML = iframeHtml;
      // Assurer l'attribut title pour l'accessibilité
      const iframeEl = mapIf.querySelector('iframe');
      if (iframeEl && !iframeEl.getAttribute('title')) {
        iframeEl.setAttribute('title', 'Localisation de La Straada sur Google Maps');
      }
    }
  }

  // Tel
  const telLk = document.getElementById('tel-link-infos');
  if (telLk && r.telephone && !r.telephone.includes('X')) {
    telLk.textContent = r.telephone;
    telLk.href = 'tel:' + r.telephone.replace(/\s/g, '');
  } else if (telLk) {
    telLk.style.display = 'none';
  }

  // Réseaux
  const socEl = document.getElementById('social-links');
  if (socEl && r.reseauxSociaux) {
    Object.entries(r.reseauxSociaux).forEach(([nom, url]) => {
      if (!url) return;
      const a = document.createElement('a');
      a.href    = url;
      a.target  = '_blank';
      a.rel     = 'noopener noreferrer';
      a.textContent = nom.charAt(0).toUpperCase() + nom.slice(1);
      socEl.appendChild(a);
    });
  }

  // Apps livraison
  const dl  = r.livraison;
  const dlI = document.getElementById('infos-deliveroo');
  const ubI = document.getElementById('infos-ubereats');
  if (dlI && dl?.deliveroo) dlI.href = dl.deliveroo; else if (dlI) dlI.style.display = 'none';
  if (ubI && dl?.ubereats)  ubI.href = dl.ubereats;  else if (ubI) ubI.style.display = 'none';
}

/* ── CONTACT ── */
function contact(d) {
  const r     = d.restaurant || {};
  const ctaTel = document.getElementById('contact-tel');
  const ctaIg  = document.getElementById('contact-instagram');
  const ctaTk  = document.getElementById('contact-tiktok');

  if (ctaTel) {
    if (r.telephone && !r.telephone.includes('X')) {
      ctaTel.href = 'tel:' + r.telephone.replace(/\s/g, '');
      ctaTel.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.5 12 19.79 19.79 0 0 1 1.21 3.35 2 2 0 0 1 3.22 1h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.09 8.91a16 16 0 0 0 5.61 5.61l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 14.92z"/></svg> ${esc(r.telephone)}`;
    } else {
      ctaTel.style.display = 'none';
    }
  }
  if (ctaIg && r.reseauxSociaux?.instagram) ctaIg.href = r.reseauxSociaux.instagram;
  else if (ctaIg) ctaIg.style.display = 'none';

  if (ctaTk && r.reseauxSociaux?.tiktok) ctaTk.href = r.reseauxSociaux.tiktok;
  else if (ctaTk) ctaTk.style.display = 'none';
}

/* ── TIKTOK FLOAT ── */
function tiktokFloat(d) {
  const btn = document.getElementById('tiktok-float');
  if (!btn) return;
  const tk = d.restaurant?.reseauxSociaux?.tiktok;
  if (tk) btn.href = tk;
  else btn.style.display = 'none';
}

/* ── INSTAGRAM FLOAT ── */
function instagramFloat(d) {
  const btn = document.getElementById('instagram-float');
  if (!btn) return;
  const ig = d.restaurant?.reseauxSociaux?.instagram;
  if (ig) btn.href = ig;
  else btn.style.display = 'none';
}

/* ── FOOTER ── */
function footer(d) {
  const r = d.restaurant || {};
  setText('footer-nom', r.nom);
  const adr = r.adresse;
  if (adr) {
    const el = document.getElementById('footer-adresse');
    if (el) el.textContent = `${adr.rue} · ${adr.codePostal} ${adr.ville}`;
  }
  const socEl = document.getElementById('footer-social');
  if (socEl && r.reseauxSociaux) {
    Object.entries(r.reseauxSociaux).forEach(([nom, url]) => {
      if (!url) return;
      const a = document.createElement('a');
      a.href    = url;
      a.target  = '_blank';
      a.rel     = 'noopener noreferrer';
      a.textContent = nom.charAt(0).toUpperCase() + nom.slice(1);
      socEl.appendChild(a);
    });
  }
  const yr = document.getElementById('footer-year');
  if (yr) yr.textContent = new Date().getFullYear();
}

/* ── UTILITAIRES ── */
function navScroll() {
  const navbar = document.getElementById('navbar');
  if (!navbar) return;
  const fn = () => navbar.classList.toggle('scrolled', window.scrollY > 60);
  window.addEventListener('scroll', fn, { passive: true });
  fn();
}

function scrollReveal() {
  const els = document.querySelectorAll('.reveal');
  if (!els.length) return;
  // rootMargin positif sur mobile pour déclencher plus tôt
  const obs = new IntersectionObserver(
    entries => entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
        obs.unobserve(e.target);
      }
    }),
    { threshold: 0.08, rootMargin: '0px 0px -40px 0px' }
  );
  els.forEach(el => obs.observe(el));
}

function waUrl(num, msg) {
  const n = String(num).replace(/[\s\-+]/g, '');
  const m = msg ? '?text=' + encodeURIComponent(msg) : '';
  return `https://wa.me/${n}${m}`;
}

function setText(id, val) {
  const el = document.getElementById(id);
  if (el && val != null) el.textContent = val;
}
function setAttr(id, attr, val) {
  const el = document.getElementById(id);
  if (el && val != null) el.setAttribute(attr, val);
}
function esc(s) {
  if (s == null) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

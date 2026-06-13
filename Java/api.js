// VILLENOVA — API OPENAGENDA

const API_KEY = "8f2d4b6cd375425ea1d6473b63269b94";

// ============================================
// 1. RÉCUPÉRATION DES ÉVÉNEMENTS
// ============================================

const API_URL = "https://api.openagenda.com/v2/agendas/3985631/events";

async function fetchEvenements(filtres = {}) {
  const params = new URLSearchParams({
    key: API_KEY,
    "relative[0]": "current",
    "relative[1]": "upcoming",
    detailed: 1,
    size: 20,
    ...filtres
  });

  try {
    const response = await fetch(`${API_URL}?${params}`);
    if (!response.ok) throw new Error(`Erreur API : ${response.status}`);
    const data = await response.json();
    return data.events || [];
  } catch (error) {
    console.error("Impossible de récupérer les événements :", error);
    return [];
  }
}

// ============================================
// 2. UTILITAIRES
// ============================================

function formaterDate(evenement) {
  return evenement.dateRange?.fr || "Date à confirmer";
}

function formaterHeure(evenement) {
  if (!evenement.nextTiming) return "";
  const debut = new Date(evenement.nextTiming.begin);
  return debut.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

function formaterLieu(evenement) {
  return evenement.location?.name || evenement.location?.city || "Lieu à confirmer";
}

function recupererCategorie(evenement) {
  const tags = evenement.keywords?.fr || [];
  if (tags.some(t => t.toLowerCase().includes("exposition"))) return "expo";
  if (tags.some(t => t.toLowerCase().includes("concert"))) return "concert";
  if (tags.some(t => t.toLowerCase().includes("festival"))) return "festival";
  if (tags.some(t => t.toLowerCase().includes("spectacle"))) return "spectacle";
  return "expo";
}

function labelCategorie(cat) {
  const labels = { expo: "Exposition", concert: "Concert", festival: "Festival", spectacle: "Spectacle" };
  return labels[cat] || "Événement";
}

function recupererImage(evenement) {
  return evenement.image?.base
    ? `${evenement.image.base}${evenement.image.filename}`
    : null;
}

const couleursCategorie = {
  expo: "#85B7EB",
  concert: "#EF9F27",
  festival: "#7F77DD",
  spectacle: "#1D9E75"
};

// Échapper les caractères HTML pour éviter les failles XSS
function escapeHTML(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// Construire l'URL vers la page de détail
function urlDetail(uid) {
  const base = window.location.pathname.includes('/html/') ? '' : 'html/';
  return `${base}event-detail.html?id=${uid}`;
}


// ============================================
// 3. GÉNÉRATION DES CARTES HTML
// ============================================

function genererCarteHTML(evenement) {
  const cat = recupererCategorie(evenement);
  const titre = escapeHTML(evenement.title?.fr || "Sans titre");
  const date = escapeHTML(formaterDate(evenement));
  const heure = escapeHTML(formaterHeure(evenement));
  const lieu = escapeHTML(formaterLieu(evenement));
  const image = recupererImage(evenement);
  const prix = escapeHTML(evenement.conditions?.fr || "");
  const gratuit = evenement.conditions?.fr?.toLowerCase().includes("gratuit");
  const uid = evenement.uid;
  const detail = urlDetail(uid);

  const imgHTML = image
    ? `<img src="${image}" alt="" role="presentation" />`
    : `<div class="card-img-placeholder" style="background:${couleursCategorie[cat]};" aria-hidden="true"></div>`;

  return `
    <article class="card ${cat}" aria-label="${titre}">
      <a href="${detail}" class="card-link" aria-label="Voir les détails de ${titre}">
        <div class="card-img-wrap">
          ${imgHTML}
          <span class="badge ${cat}" aria-label="Catégorie : ${labelCategorie(cat)}">${labelCategorie(cat)}</span>
        </div>
        <div class="card-body">
          <h3 class="card-title ${cat}">${titre}</h3>
          <div class="card-meta">
            <div class="meta-row ${cat}">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              <span>${date}${heure ? ` · ${heure}` : ""}</span>
            </div>
            <div class="meta-row ${cat}">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
              <span>${lieu}</span>
            </div>
          </div>
          ${gratuit ? `<span class="card-tag ${cat}">Gratuit</span>` : ""}
          ${prix && !gratuit ? `<span class="card-tag ${cat}">${prix}</span>` : ""}
        </div>
      </a>
      <a href="${detail}" class="btn-detail ${cat}" aria-label="En savoir plus sur ${titre}">
        En savoir plus →
      </a>
    </article>
  `;
}

function genererCarteHighlight(evenement) {
  const cat = recupererCategorie(evenement);
  const titre = escapeHTML(evenement.title?.fr || "Sans titre");
  const date = escapeHTML(formaterDate(evenement));
  const heure = escapeHTML(formaterHeure(evenement));
  const lieu = escapeHTML(formaterLieu(evenement));
  const uid = evenement.uid;
  const detail = urlDetail(uid);

  return `
    <article class="card-highlight ${cat}" aria-label="À la une : ${titre}">
      <a href="${detail}" class="card-highlight-link" aria-label="Voir les détails de ${titre}">
        <span class="badge ${cat}">À la une</span>
        <h3 class="card-title ${cat}">${titre}</h3>
        <div class="card-meta">
          <div class="meta-row ${cat}">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            <span>${date}${heure ? ` · ${heure}` : ""}</span>
          </div>
          <div class="meta-row ${cat}">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
            <span>${lieu}</span>
          </div>
        </div>
      </a>
      <a href="${detail}" class="btn-detail ${cat} light" aria-label="En savoir plus sur ${titre}">
        En savoir plus →
      </a>
    </article>
  `;
}


// ============================================
// 4. LIVE REGION (accessibilité lecteur d'écran)
// ============================================

function annoncerChargement(message) {
  const region = document.getElementById("live-region");
  if (region) region.textContent = message;
}


// ============================================
// 5. PAGE D'ACCUEIL
// ============================================

async function chargerAccueil() {
  const conteneurUne = document.getElementById("cards-une");
  const conteneurWeekend = document.getElementById("cards-weekend");

  if (!conteneurUne) return;

  conteneurUne.setAttribute("aria-busy", "true");
  conteneurUne.innerHTML = '<p role="status">Chargement…</p>';
  if (conteneurWeekend) {
    conteneurWeekend.setAttribute("aria-busy", "true");
    conteneurWeekend.innerHTML = '<p role="status">Chargement…</p>';
  }
  annoncerChargement("Chargement des événements en cours…");

  const evenements = await fetchEvenements({ size: 20 });
  tousLesEvenements = evenements;

  conteneurUne.removeAttribute("aria-busy");
  if (conteneurWeekend) conteneurWeekend.removeAttribute("aria-busy");

  if (evenements.length === 0) {
    conteneurUne.innerHTML = "<p>Aucun événement disponible.</p>";
    annoncerChargement("Aucun événement disponible.");
    return;
  }

  conteneurUne.innerHTML = evenements.slice(0, 4).map(genererCarteHTML).join("");
  if (conteneurWeekend) {
    conteneurWeekend.innerHTML = evenements.slice(4, 7).map(genererCarteHTML).join("");
  }
  annoncerChargement(`${evenements.length} événements chargés.`);
}


// ============================================
// 6. PAGES CATÉGORIES
// ============================================

async function chargerCategorie(categorie) {
  const conteneurEnCours = document.getElementById("cards-en-cours");
  const conteneurAvenir = document.getElementById("cards-avenir");
  const compteurEnCours = document.getElementById("count-en-cours");
  const compteurAvenir = document.getElementById("count-avenir");

  if (!conteneurEnCours) return;

  conteneurEnCours.setAttribute("aria-busy", "true");
  conteneurEnCours.innerHTML = '<p role="status">Chargement…</p>';
  if (conteneurAvenir) {
    conteneurAvenir.setAttribute("aria-busy", "true");
    conteneurAvenir.innerHTML = '<p role="status">Chargement…</p>';
  }
  annoncerChargement("Chargement des événements en cours…");

  const evenements = await fetchEvenements({ size: 100 });
  tousLesEvenements = evenements;

  const filtres = evenements.filter(e => {
    const tags = e.keywords?.fr || [];
    return tags.some(tag => tag.toLowerCase().includes(categorie));
  });

  conteneurEnCours.removeAttribute("aria-busy");
  if (conteneurAvenir) conteneurAvenir.removeAttribute("aria-busy");

  if (filtres.length === 0) {
    conteneurEnCours.innerHTML = "<p>Aucun événement disponible pour le moment.</p>";
    if (conteneurAvenir) conteneurAvenir.innerHTML = "";
    annoncerChargement("Aucun événement disponible pour cette catégorie.");
    return;
  }

  const maintenant = new Date();

  const enCours = filtres.filter(e => {
    if (!e.firstTiming || !e.lastTiming) return false;
    const debut = new Date(e.firstTiming.begin);
    const fin = new Date(e.lastTiming.end);
    return debut <= maintenant && fin >= maintenant;
  });

  const avenir = filtres.filter(e => {
    if (!e.firstTiming) return false;
    const debut = new Date(e.firstTiming.begin);
    return debut > maintenant;
  });

  if (enCours.length > 0) {
    const [highlight, ...reste] = enCours;
    conteneurEnCours.innerHTML =
      genererCarteHighlight(highlight) +
      reste.map(genererCarteHTML).join("");
  } else {
    conteneurEnCours.innerHTML = "<p>Aucun événement en cours.</p>";
  }

  if (compteurEnCours) {
    compteurEnCours.textContent = `${enCours.length} événement${enCours.length > 1 ? "s" : ""}`;
  }

  if (conteneurAvenir) {
    conteneurAvenir.innerHTML = avenir.length > 0
      ? avenir.map(genererCarteHTML).join("")
      : "<p>Aucun événement à venir.</p>";

    if (compteurAvenir) {
      compteurAvenir.textContent = `${avenir.length} événement${avenir.length > 1 ? "s" : ""}`;
    }
  }

  annoncerChargement(`${filtres.length} événements chargés.`);
}


// ============================================
// 7. PAGE DE DÉTAIL
// ============================================

async function chargerDetail() {
  const params = new URLSearchParams(window.location.search);
  const id = parseInt(params.get("id"));

  const conteneur = document.getElementById("detail-contenu");
  const titreDoc = document.querySelector("title");

  if (!conteneur || !id) {
    if (conteneur) conteneur.innerHTML = "<p>Événement introuvable.</p>";
    return;
  }

  conteneur.setAttribute("aria-busy", "true");
  conteneur.innerHTML = '<p role="status">Chargement de l\'événement…</p>';
  annoncerChargement("Chargement de l'événement…");

  const evenements = await fetchEvenements({ size: 100 });
  const evenement = evenements.find(e => e.uid === id);

  conteneur.removeAttribute("aria-busy");

  if (!evenement) {
    conteneur.innerHTML = `
      <div class="detail-not-found">
        <p>Cet événement est introuvable ou n'est plus disponible.</p>
        <a href="../index.html" class="btn-retour">← Retour à l'accueil</a>
      </div>
    `;
    return;
  }

  const cat = recupererCategorie(evenement);
  const titre = escapeHTML(evenement.title?.fr || "Sans titre");
  const description = escapeHTML(evenement.description?.fr || "Aucune description disponible.");
  const descriptionLongue = escapeHTML(evenement.longDescription?.fr || "");
  const date = escapeHTML(formaterDate(evenement));
  const heure = escapeHTML(formaterHeure(evenement));
  const lieu = escapeHTML(formaterLieu(evenement));
  const adresse = escapeHTML(evenement.location?.address || "");
  const ville = escapeHTML(evenement.location?.city || "");
  const conditions = escapeHTML(evenement.conditions?.fr || "");
  const age = evenement.age?.min ? `Dès ${evenement.age.min} ans` : "";
  const image = recupererImage(evenement);
  const siteWeb = evenement.links?.[0]?.link || null;

  // Mise à jour du titre de la page
  if (titreDoc) titreDoc.textContent = `${titre} — VilleNova`;

  const imgHTML = image
    ? `<img src="${image}" alt="${titre}" class="detail-img" />`
    : `<div class="detail-img-placeholder" style="background:${couleursCategorie[cat]};" aria-hidden="true"></div>`;

  conteneur.className = `detail-contenu ${cat}`;
  conteneur.innerHTML = `
    <a href="javascript:history.back()" class="btn-retour" id="btn-retour">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
      Retour à la liste
    </a>

    <div class="detail-hero">
      ${imgHTML}
      <div class="detail-hero-overlay ${cat}">
        <span class="badge ${cat}" style="position:static;display:inline-block;margin-bottom:12px;">${labelCategorie(cat)}</span>
        <h1 class="detail-titre">${titre}</h1>
      </div>
    </div>

    <div class="detail-body">
      <div class="detail-sidebar">
        <div class="detail-meta ${cat}">
          <h2 class="detail-meta-titre">Informations pratiques</h2>

          <div class="detail-meta-item">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            <div>
              <strong>Date</strong>
              <span>${date}${heure ? ` — ${heure}` : ""}</span>
            </div>
          </div>

          <div class="detail-meta-item">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
            <div>
              <strong>Lieu</strong>
              <span>${lieu}${adresse ? `<br><small>${adresse}${ville ? `, ${ville}` : ""}</small>` : ""}</span>
            </div>
          </div>

          ${conditions ? `
          <div class="detail-meta-item">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
            <div>
              <strong>Tarif</strong>
              <span>${conditions}</span>
            </div>
          </div>` : ""}

          ${age ? `
          <div class="detail-meta-item">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            <div>
              <strong>Public</strong>
              <span>${age}</span>
            </div>
          </div>` : ""}

          ${siteWeb ? `
          <a href="${escapeHTML(siteWeb)}" target="_blank" rel="noopener noreferrer" class="btn-site ${cat}" aria-label="Site officiel de l'événement (ouvre dans un nouvel onglet)">
            Voir le site officiel
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
          </a>` : ""}
        </div>
      </div>

      <div class="detail-main">
        <h2 class="detail-section-titre ${cat}">À propos</h2>
        <p class="detail-description">${description}</p>
        ${descriptionLongue ? `
        <div class="detail-description-longue">
          ${descriptionLongue}
        </div>` : ""}
      </div>
    </div>
  `;

  // Focus sur le bouton retour pour les utilisateurs clavier
  const btnRetour = document.getElementById("btn-retour");
  if (btnRetour) btnRetour.focus();

  annoncerChargement(`Événement chargé : ${evenement.title?.fr || "Sans titre"}.`);
}


// ============================================
// 8. RECHERCHE
// ============================================

function initialiserRecherche() {
  document.querySelectorAll("form").forEach(form => {
    const input = form.querySelector("input[type='text']");

    // Ajouter un label si manquant
    if (input && !input.getAttribute("aria-label")) {
      input.setAttribute("aria-label", input.placeholder || "Rechercher un événement");
    }

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const terme = input?.value.trim();
      if (!terme) return;

      const conteneur =
        document.getElementById("cards-une") ||
        document.getElementById("cards-en-cours");

      if (!conteneur) return;

      conteneur.setAttribute("aria-busy", "true");
      conteneur.innerHTML = '<p role="status">Recherche en cours…</p>';
      annoncerChargement(`Recherche en cours pour : ${terme}`);

      const resultats = await fetchEvenements({ search: terme });
      tousLesEvenements = [...tousLesEvenements, ...resultats];

      conteneur.removeAttribute("aria-busy");

      if (resultats.length > 0) {
        conteneur.innerHTML = resultats.map(genererCarteHTML).join("");
        annoncerChargement(`${resultats.length} résultat${resultats.length > 1 ? "s" : ""} trouvé${resultats.length > 1 ? "s" : ""} pour "${terme}".`);
      } else {
        conteneur.innerHTML = `<p>Aucun résultat pour « ${escapeHTML(terme)} ».</p>`;
        annoncerChargement(`Aucun résultat pour "${terme}".`);
      }

      // Déplacer le focus vers les résultats
      conteneur.setAttribute("tabindex", "-1");
      conteneur.focus();
    });
  });
}


// ============================================
// 9. FILTRES CATÉGORIES (page d'accueil)
// ============================================

function initialiserFiltres() {
  const filterRow = document.querySelector(".filter-row");
  if (!filterRow) return;

  const chips = filterRow.querySelectorAll(".chip[data-categorie]");
  chips.forEach(chip => {
    chip.addEventListener("click", async () => {
      // Mise à jour des états aria
      chips.forEach(c => {
        c.classList.remove("active");
        c.setAttribute("aria-pressed", "false");
      });
      chip.classList.add("active");
      chip.setAttribute("aria-pressed", "true");

      const cat = chip.dataset.categorie;
      const conteneurUne = document.getElementById("cards-une");
      const conteneurWeekend = document.getElementById("cards-weekend");

      if (cat === "tous") {
        // Recharger tous les événements
        conteneurUne.setAttribute("aria-busy", "true");
        conteneurUne.innerHTML = '<p role="status">Chargement…</p>';
        annoncerChargement("Chargement de tous les événements…");

        const evenements = await fetchEvenements({ size: 20 });
        tousLesEvenements = evenements;
        conteneurUne.removeAttribute("aria-busy");
        conteneurUne.innerHTML = evenements.slice(0, 4).map(genererCarteHTML).join("");
        if (conteneurWeekend) {
          conteneurWeekend.innerHTML = evenements.slice(4, 7).map(genererCarteHTML).join("");
        }
        annoncerChargement(`${evenements.length} événements affichés.`);
      } else {
        conteneurUne.setAttribute("aria-busy", "true");
        conteneurUne.innerHTML = '<p role="status">Filtrage en cours…</p>';
        annoncerChargement(`Filtrage par catégorie : ${chip.textContent.trim()}`);

        const filtres = tousLesEvenements.filter(e => {
          const tags = e.keywords?.fr || [];
          return tags.some(tag => tag.toLowerCase().includes(cat));
        });

        conteneurUne.removeAttribute("aria-busy");

        if (filtres.length > 0) {
          conteneurUne.innerHTML = filtres.map(genererCarteHTML).join("");
          if (conteneurWeekend) conteneurWeekend.innerHTML = "";
          annoncerChargement(`${filtres.length} événements affichés pour la catégorie ${chip.textContent.trim()}.`);
        } else {
          conteneurUne.innerHTML = `<p>Aucun événement pour cette catégorie.</p>`;
          if (conteneurWeekend) conteneurWeekend.innerHTML = "";
          annoncerChargement(`Aucun événement pour la catégorie ${chip.textContent.trim()}.`);
        }
      }
    });

    // Support clavier (Entrée et Espace déclenchent le clic)
    chip.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        chip.click();
      }
    });
  });
}


// ============================================
// 10. MENU BURGER (mobile)
// ============================================

function initialiserBurger() {
  const nav = document.querySelector("nav");
  if (!nav) return;

  // Créer le bouton burger
  const burger = document.createElement("button");
  burger.className = "burger";
  burger.setAttribute("aria-label", "Ouvrir le menu de navigation");
  burger.setAttribute("aria-expanded", "false");
  burger.setAttribute("aria-controls", "nav-links");
  burger.innerHTML = `
    <span aria-hidden="true"></span>
    <span aria-hidden="true"></span>
    <span aria-hidden="true"></span>
  `;

  const navLinks = nav.querySelector(".nav-links");
  if (navLinks) {
    navLinks.id = "nav-links";
    nav.appendChild(burger);

    burger.addEventListener("click", () => {
      const isOpen = navLinks.classList.toggle("open");
      burger.setAttribute("aria-expanded", isOpen ? "true" : "false");
      burger.setAttribute("aria-label", isOpen ? "Fermer le menu de navigation" : "Ouvrir le menu de navigation");
      burger.classList.toggle("open", isOpen);
    });

    // Fermer le menu si on clique ailleurs
    document.addEventListener("click", (e) => {
      if (!nav.contains(e.target) && navLinks.classList.contains("open")) {
        navLinks.classList.remove("open");
        burger.setAttribute("aria-expanded", "false");
        burger.setAttribute("aria-label", "Ouvrir le menu de navigation");
        burger.classList.remove("open");
      }
    });

    // Fermer au clavier (Escape)
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && navLinks.classList.contains("open")) {
        navLinks.classList.remove("open");
        burger.setAttribute("aria-expanded", "false");
        burger.setAttribute("aria-label", "Ouvrir le menu de navigation");
        burger.classList.remove("open");
        burger.focus();
      }
    });
  }
}


// ============================================
// 11. LIVE REGION — création
// ============================================

function creerLiveRegion() {
  const region = document.createElement("div");
  region.id = "live-region";
  region.setAttribute("aria-live", "polite");
  region.setAttribute("aria-atomic", "true");
  region.className = "sr-only";
  document.body.appendChild(region);
}


// ============================================
// 12. SKIP LINK
// ============================================

function creerSkipLink() {
  const existing = document.getElementById("skip-link");
  if (existing) return;

  const skip = document.createElement("a");
  skip.id = "skip-link";
  skip.href = "#contenu-principal";
  skip.className = "skip-link";
  skip.textContent = "Aller au contenu principal";
  document.body.insertBefore(skip, document.body.firstChild);

  // Ajouter l'id au premier conteneur principal si pas encore fait
  const main = document.querySelector(".hero, .page-header, #detail-contenu");
  if (main && !main.id) {
    main.id = "contenu-principal";
  } else if (main && !document.getElementById("contenu-principal")) {
    main.setAttribute("tabindex", "-1");
  }
}


// ============================================
// 13. STOCKAGE GLOBAL
// ============================================

let tousLesEvenements = [];


// ============================================
// 14. INITIALISATION
// ============================================

document.addEventListener("DOMContentLoaded", () => {
  creerLiveRegion();
  creerSkipLink();
  initialiserBurger();

  const page = document.body.dataset.page;
  switch (page) {
    case "accueil":
      chargerAccueil().then(() => initialiserFiltres());
      break;
    case "expositions":
      chargerCategorie("exposition");
      break;
    case "concerts":
      chargerCategorie("concert");
      break;
    case "festivals":
      chargerCategorie("festival");
      break;
    case "spectacles":
      chargerCategorie("spectacle");
      break;
    case "detail":
      chargerDetail();
      break;
  }

  initialiserRecherche();
});

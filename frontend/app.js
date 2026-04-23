const API_BASE = window.SCHULMANAGER_CONFIG?.apiBase || "http://localhost:4000/api";
const LOCAL_STORAGE_KEY = "schulmanager-local-data-v2";
const SESSION_STORAGE_KEY = "schulmanager-session-v1";

const modules = [
  { id: "dashboard", label: "Dashboard", icon: "DB", description: "Alle wichtigen Infos auf einen Blick." },
  { id: "users", label: "Benutzer", icon: "AD", description: "Admin-Bereich zum Anlegen weiterer Accounts.", source: "api", adminOnly: true },
  { id: "classes", label: "Klassen", icon: "KL", description: "Klassen aus dem Backend laden und verwalten.", source: "api" },
  { id: "students", label: "Schueler", icon: "SU", description: "Schueler aus dem Backend sehen und anlegen.", source: "api" },
  { id: "attendance", label: "Anwesenheit", icon: "AN", description: "An- und Abwesenheiten im Backend fuehren.", source: "api" },
  { id: "classbook", label: "Klassenbuch", icon: "KB", description: "Unterrichtsinhalte und Hausaufgaben im Backend speichern.", source: "api" },
  { id: "timetable", label: "Stundenplan", icon: "SP", description: "Stundenplan als Tabelle. Lehrer buchen, Admin bearbeitet.", source: "api" },
  { id: "documents", label: "Dokumente", icon: "DO", description: "Lokale Demo fuer Dokumente." },
  { id: "exams", label: "Klassenarbeiten", icon: "PR", description: "Lokale Demo fuer Klassenarbeiten." },
  { id: "makeup", label: "Nacharbeit", icon: "NA", description: "Lokale Demo fuer Nacharbeit." },
  { id: "letters", label: "Elternbriefe", icon: "EB", description: "Lokale Demo fuer Elternbriefe." },
  { id: "grades", label: "Noten", icon: "NO", description: "Lokale Demo fuer Noten." },
  { id: "payments", label: "Zahlungen", icon: "ZA", description: "Lokale Demo fuer Zahlungen." },
  { id: "calendar", label: "Kalender", icon: "CA", description: "Lokale Demo fuer Termine." },
  { id: "learning", label: "Lernen", icon: "LE", description: "Lokale Demo fuer Lernziele." }
];

const localDefaults = {
  profile: { name: "Gast" },
  documents: [
    { id: uid(), title: "Bio-Arbeitsblatt", category: "Unterricht", date: "2026-04-18", note: "Wiederholung fuer KW 17." }
  ],
  exams: [
    { id: uid(), subject: "Mathematik", date: "2026-04-28", topic: "Lineare Funktionen", status: "Angekuendigt" }
  ],
  makeup: [
    { id: uid(), title: "Deutsch-Nacharbeit", date: "2026-05-21", room: "B105", reason: "Fehlende Hausaufgaben", status: "Geplant" }
  ],
  timetable: [
    { id: uid(), day: "Montag", lesson: "1-2", subject: "Mathematik", room: "A103", teacher: "Frau Fischer" }
  ],
  letters: [
    { id: uid(), subject: "WTH/S-Unterricht", date: "2026-04-17", sender: "Schule", body: "Bitte an Schuerze und Dose denken." }
  ],
  grades: [
    { id: uid(), subject: "Englisch", type: "Vokabeltest", grade: 1, weight: 1, date: "2026-04-16" }
  ],
  payments: [
    { id: uid(), title: "Klassenfahrt Leipzig", amount: 120, dueDate: "2026-05-15", status: "Offen" }
  ],
  calendar: [
    { id: uid(), title: "Projekt Praesentation 8A", date: "2026-04-28", type: "Schule", details: "3.-5. Stunde im Mehrzweckraum" }
  ],
  learning: [
    { id: uid(), topic: "Mathe Funktionen", subject: "Mathematik", progress: "In Arbeit", deadline: "2026-04-27", note: "Taeglich 20 Minuten" }
  ]
};

let localState = loadLocalState();
let session = loadSession();
let apiState = {
  users: [],
  invitations: [],
  timetable: [],
  classes: [],
  students: [],
  attendance: [],
  classbook: []
};
let activeModule = "dashboard";
let currentEditId = null;
let currentSearch = "";
let loading = false;
let revealObserver = null;

const loginView = document.getElementById("loginView");
const loginForm = document.getElementById("loginForm");
const loginError = document.getElementById("loginError");
const loginHint = document.getElementById("loginHint");
const showInviteButton = document.getElementById("showInviteButton");
const inviteRegisterBox = document.getElementById("inviteRegisterBox");
const inviteRegisterForm = document.getElementById("inviteRegisterForm");
const inviteRegisterMessage = document.getElementById("inviteRegisterMessage");
const appShell = document.getElementById("appShell");
const moduleNav = document.getElementById("moduleNav");
const dashboardView = document.getElementById("dashboardView");
const moduleView = document.getElementById("moduleView");
const heroTitle = document.getElementById("heroTitle");
const heroDescription = document.getElementById("heroDescription");
const todayDate = document.getElementById("todayDate");
const openTasksCount = document.getElementById("openTasksCount");
const logoutButton = document.getElementById("logoutButton");
const sessionStatus = document.getElementById("sessionStatus");
const avatar = document.getElementById("avatar");
const cardTemplate = document.getElementById("cardTemplate");

boot();

function boot() {
  loginForm.addEventListener("submit", handleLoginSubmit);
  inviteRegisterForm.addEventListener("submit", handleInviteRegisterSubmit);
  logoutButton.addEventListener("click", logout);
  showInviteButton.addEventListener("click", () => {
    inviteRegisterBox.classList.toggle("hidden");
    if (!inviteRegisterBox.classList.contains("hidden")) {
      inviteRegisterMessage.textContent = "Token manuell eingeben oder Einladungslink nutzen.";
      inviteRegisterForm.elements.inviteToken.focus();
    }
  });
  syncInviteBoxFromUrl();

  if (session.token) {
    hydrateAfterLogin();
  } else {
    renderLoginOnly();
  }
}

async function handleInviteRegisterSubmit(event) {
  event.preventDefault();
  inviteRegisterMessage.textContent = "Registriere Benutzer...";
  const formData = new FormData(inviteRegisterForm);
  const payload = Object.fromEntries(formData.entries());

  try {
    await apiRequest("/auth/register-invite", {
      method: "POST",
      body: JSON.stringify(payload)
    }, false);
    inviteRegisterMessage.textContent = "Registrierung erfolgreich. Du kannst dich jetzt anmelden.";
    loginForm.elements.email.value = payload.email;
    loginForm.elements.password.value = "";
    inviteRegisterForm.reset();
  } catch (error) {
    inviteRegisterMessage.textContent = error.message || "Registrierung fehlgeschlagen.";
  }
}

async function handleLoginSubmit(event) {
  event.preventDefault();
  loginError.textContent = "";
  loginHint.textContent = "Verbinde mit Firebase-Backend...";

  const formData = new FormData(loginForm);
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");

  try {
    const result = await apiRequest("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password })
    }, false);

    session = {
      token: result.token,
      user: result.user
    };
    saveSession();
    loginForm.reset();
    await hydrateAfterLogin();
  } catch (error) {
    loginHint.textContent = "Pruefe Firebase-Zugangsdaten und Backend-Konfiguration.";
    loginError.textContent = error.message || "Login fehlgeschlagen.";
  }
}

async function hydrateAfterLogin() {
  renderAuthenticatedShell();
  await refreshApiState();
  renderApp();
}

function renderLoginOnly() {
  loginView.classList.remove("hidden");
  appShell.classList.add("hidden");
  loginHint.textContent = "Bitte mit dem konfigurierten Firebase-Server verbinden.";
  loginError.textContent = "";
  syncInviteBoxFromUrl();
}

function renderAuthenticatedShell() {
  loginView.classList.add("hidden");
  appShell.classList.remove("hidden");
  todayDate.textContent = new Intl.DateTimeFormat("de-DE", { dateStyle: "full" }).format(new Date());
  const displayName = [session.user.firstName, session.user.lastName].filter(Boolean).join(" ").trim();
  localState.profile.name = displayName || session.user.email || "Benutzer";
  saveLocalState();
  heroTitle.textContent = `Herzlich willkommen, ${localState.profile.name}`;
  sessionStatus.textContent = `${session.user.role} angemeldet`;
  avatar.textContent = initials(localState.profile.name);
}

async function refreshApiState() {
  if (!session.token) {
    return;
  }

  loading = true;
  renderApp();

  try {
    const [usersResult, invitationsResult, timetableResult, classesResult, studentsResult, attendanceResult, classbookResult] = await Promise.all([
      session.user?.role === "admin" ? apiRequest("/users") : Promise.resolve({ items: [] }),
      session.user?.role === "admin" ? apiRequest("/users/invitations") : Promise.resolve({ items: [] }),
      apiRequest("/lessons"),
      apiRequest("/classes"),
      apiRequest("/students"),
      apiRequest("/attendance"),
      apiRequest("/classbook")
    ]);

    apiState = {
      users: usersResult.items || [],
      invitations: invitationsResult.items || [],
      timetable: timetableResult.items || [],
      classes: classesResult.items || [],
      students: studentsResult.items || [],
      attendance: attendanceResult.items || [],
      classbook: classbookResult.items || []
    };
  } catch (error) {
    loginError.textContent = error.message || "Backend-Daten konnten nicht geladen werden.";
  } finally {
    loading = false;
  }
}

function renderApp() {
  if (!session.token) {
    renderLoginOnly();
    return;
  }

  renderAuthenticatedShell();
  openTasksCount.textContent = String(countOpenTasks());
  renderNavigation();
  renderDashboard();
  renderModule();
  applyMobileScrollReveal();
}

function renderNavigation() {
  moduleNav.innerHTML = "";
  modules
    .filter((module) => !module.adminOnly || session.user?.role === "admin")
    .forEach((module) => {
    const option = document.createElement("option");
    option.value = module.id;
    option.textContent = `${module.label}`;
    option.selected = module.id === activeModule;
    moduleNav.appendChild(option);
    });

  moduleNav.onchange = (event) => {
    activeModule = event.target.value;
    currentEditId = null;
    currentSearch = "";
    renderApp();
  };
}

function renderDashboard() {
  const showDashboard = activeModule === "dashboard";
  dashboardView.classList.toggle("hidden", !showDashboard);
  if (!showDashboard) {
    return;
  }

  heroDescription.textContent = "Login, Rollen und erste Live-Daten aus Firebase sind aktiv.";
  dashboardView.innerHTML = "";

  const cards = [
    {
      title: "Backend Status",
      icon: "API",
      content: `<p>${loading ? "Lade Daten..." : "Verbunden mit dem Firebase-Backend."}</p><p><strong>Rolle:</strong> ${escapeHtml(session.user.role)}</p>`
    },
    {
      title: "Benutzer",
      icon: "AD",
      content: session.user.role === "admin"
        ? `<p>${apiState.users.length} Benutzerkonten</p>${renderListHtml(apiState.users.slice(0, 3), (entry) => `${escapeHtml(entry.firstName)} ${escapeHtml(entry.lastName)}<br>${escapeHtml(entry.role)}`)}`
        : "<p>Benutzerverwaltung ist nur fuer den Admin sichtbar.</p>"
    },
    {
      title: "Klassen",
      icon: "KL",
      content: `<p>${apiState.classes.length} Klassen im Backend</p>${renderListHtml(apiState.classes.slice(0, 3), (entry) => `${escapeHtml(entry.name)}<br>Stufe ${escapeHtml(String(entry.gradeLevel))}`)}`
    },
    {
      title: "Schueler",
      icon: "SU",
      content: `<p>${apiState.students.length} Schueler im Backend</p>${renderListHtml(apiState.students.slice(0, 3), (entry) => `${escapeHtml(entry.firstName)} ${escapeHtml(entry.lastName)}`)}`
    },
    {
      title: "Anwesenheit",
      icon: "AN",
      content: renderListHtml(apiState.attendance.slice(0, 3), (entry) => `${formatDate(entry.date)}<br><span class="tag ${statusClass(entry.status)}">${escapeHtml(entry.status)}</span>`)
    },
    {
      title: "Klassenbuch",
      icon: "KB",
      content: renderListHtml(apiState.classbook.slice(0, 3), (entry) => `${escapeHtml(entry.subject)}<br>${escapeHtml(entry.topic)}`)
    },
    {
      title: "Demo-Module",
      icon: "LO",
      content: "<p>Dokumente, Noten, Zahlungen und weitere Bereiche bleiben lokal bearbeitbar, bis wir sie ebenfalls ans Backend anschliessen.</p>"
    }
  ];

  cards.forEach((card) => {
    const fragment = cardTemplate.content.cloneNode(true);
    const cardElement = fragment.querySelector(".panel-card");
    cardElement.classList.add("scroll-reveal");
    cardElement.dataset.revealDelay = String(cards.indexOf(card) % 4);
    fragment.querySelector("h3").textContent = card.title;
    fragment.querySelector(".panel-icon").textContent = card.icon;
    fragment.querySelector(".panel-card__body").innerHTML = card.content;
    dashboardView.appendChild(fragment);
  });
}

function renderModule() {
  const showModule = activeModule !== "dashboard";
  moduleView.classList.toggle("hidden", !showModule);
  if (!showModule) {
    return;
  }

  const module = modules.find((item) => item.id === activeModule);
  heroDescription.textContent = module.description;

  if (module.source === "api") {
    renderApiModule(module);
  } else {
    renderLocalModule(module);
  }
}

function renderApiModule(module) {
  const config = getApiModuleConfig(module.id);
  const allRows = module.id === "users" ? apiState.users : apiState[module.id];
  const rows = filterRows(allRows, currentSearch, config.searchKeys);
  const editingRow = currentEditId ? allRows.find((row) => row.id === currentEditId) : null;

  moduleView.innerHTML = `
    <section class="module-layout scroll-reveal" data-reveal-delay="0">
      <div class="module-layout__header">
        <div>
          <p class="eyebrow">${escapeHtml(module.label)}</p>
          <h3>${escapeHtml(module.label)} verwalten</h3>
          <p>${escapeHtml(module.description)}</p>
        </div>
        <div class="inline-actions">
          <button class="module-action" type="button" id="refreshModuleButton">Neu laden</button>
          ${canWriteApiModule(module.id) ? '<button class="module-action" type="button" id="newEntryButton">Neuen Eintrag anlegen</button>' : ""}
        </div>
      </div>
      <div class="module-layout__content">
        <div class="table-card">
          <div class="table-tools">
            <div class="stats-chip">${rows.length} Eintraege</div>
            <input id="moduleSearch" class="search-input" type="search" placeholder="Suchen..." value="${escapeAttribute(currentSearch)}">
          </div>
          ${rows.length ? renderTable(rows, config, module.id, "api") : '<div class="empty-state">Noch keine Eintraege gefunden.</div>'}
        </div>
        <div class="form-card">
          ${canWriteApiModule(module.id) ? renderApiFormCard(module.id, config, editingRow) : '<div class="empty-state">Deine Rolle darf diesen Bereich nur lesen.</div>'}
        </div>
      </div>
    </section>
  `;

  wireCommonModuleEvents();
  document.getElementById("refreshModuleButton").addEventListener("click", async () => {
    await refreshApiState();
    renderApp();
  });

  if (!canWriteApiModule(module.id)) {
    return;
  }

  if (document.getElementById("newEntryButton")) {
    document.getElementById("newEntryButton").addEventListener("click", () => {
      currentEditId = null;
      renderModule();
    });
  }

  document.getElementById("cancelEditButton").addEventListener("click", () => {
    currentEditId = null;
    renderModule();
  });

  if (document.getElementById("moduleForm")) {
    document.getElementById("moduleForm").addEventListener("submit", async (event) => {
      event.preventDefault();
      await submitApiForm(module.id, new FormData(event.currentTarget));
    });
  }

  if (module.id === "users") {
    moduleView.querySelectorAll("[data-action='edit']").forEach((button) => {
      button.addEventListener("click", () => {
        currentEditId = button.dataset.id;
        renderModule();
      });
    });

    moduleView.querySelectorAll("[data-action='delete']").forEach((button) => {
      button.addEventListener("click", async () => {
        if (!window.confirm("Benutzer wirklich loeschen?")) {
          return;
        }
        await apiRequest(`/users/${button.dataset.id}`, { method: "DELETE" });
        if (currentEditId === button.dataset.id) {
          currentEditId = null;
        }
        await refreshApiState();
        renderApp();
      });
    });
  }

  if (module.id === "timetable" && session.user?.role === "admin") {
    moduleView.querySelectorAll("[data-action='edit']").forEach((button) => {
      button.addEventListener("click", () => {
        currentEditId = button.dataset.id;
        renderModule();
      });
    });

    moduleView.querySelectorAll("[data-action='delete']").forEach((button) => {
      button.addEventListener("click", async () => {
        if (!window.confirm("Stunde wirklich loeschen?")) {
          return;
        }
        await apiRequest(`/lessons/${button.dataset.id}`, { method: "DELETE" });
        if (currentEditId === button.dataset.id) {
          currentEditId = null;
        }
        await refreshApiState();
        renderApp();
      });
    });
  }
}

function renderApiFormCard(moduleId, config, editingRow) {
  if (moduleId === "users") {
    return `
      ${editingRow ? `
        <p class="eyebrow">Bearbeiten</p>
        <h3>Benutzer bearbeiten</h3>
        <form id="moduleForm" class="form-grid ${config.formColumns === 2 ? "two-cols" : ""}">
          ${config.fields.map((field) => renderField(field, editingRow)).join("")}
          <div class="form-actions">
            <button class="primary-button" type="submit">Speichern</button>
            <button class="secondary-button" type="button" id="cancelEditButton">Zuruecksetzen</button>
          </div>
        </form>
      ` : `
        <p class="eyebrow">Einladung</p>
        <h3>Einladungs-Token erstellen</h3>
        <form id="moduleForm" class="form-grid">
          ${renderField(selectField("role", "Rolle", ["admin", "teacher", "student", "parent"]), null)}
          <div class="form-actions">
            <button class="primary-button" type="submit">Token erstellen</button>
            <button class="secondary-button" type="button" id="cancelEditButton">Leeren</button>
          </div>
        </form>
        ${renderInvitationList()}
      `}
    `;
  }

  if (moduleId === "timetable") {
    return `
      <p class="eyebrow">${editingRow ? "Bearbeiten" : "Neu"}</p>
      <h3>${editingRow ? "Stunde bearbeiten" : "Stunde buchen"}</h3>
      <form id="moduleForm" class="form-grid ${config.formColumns === 2 ? "two-cols" : ""}">
        ${config.fields.map((field) => renderField(field, editingRow)).join("")}
        <div class="form-actions">
          <button class="primary-button" type="submit">${editingRow ? "Speichern" : "Buchen"}</button>
          <button class="secondary-button" type="button" id="cancelEditButton">Zuruecksetzen</button>
        </div>
      </form>
    `;
  }

  if (editingRow) {
    return `
      <p class="eyebrow">Hinweis</p>
      <h3>Bearbeiten folgt als naechster Schritt</h3>
      <p>Das Backend-MVP unterstuetzt aktuell neue Eintraege. Update- und Delete-Endpunkte bauen wir als naechstes sauber nach.</p>
      <div class="form-actions">
        <button class="secondary-button" type="button" id="cancelEditButton">Zuruecksetzen</button>
      </div>
    `;
  }

  return `
    <p class="eyebrow">Neu</p>
    <h3>Eintrag hinzufuegen</h3>
    <form id="moduleForm" class="form-grid ${config.formColumns === 2 ? "two-cols" : ""}">
      ${config.fields.map((field) => renderField(field, null)).join("")}
      <div class="form-actions">
        <button class="primary-button" type="submit">Hinzufuegen</button>
        <button class="secondary-button" type="button" id="cancelEditButton">Leeren</button>
      </div>
    </form>
  `;
}

function renderLocalModule(module) {
  const config = getLocalModuleConfig(module.id);
  const allRows = localState[module.id];
  const rows = filterRows(allRows, currentSearch, config.searchKeys);
  const editingRow = currentEditId ? allRows.find((row) => row.id === currentEditId) : null;

  moduleView.innerHTML = `
    <section class="module-layout scroll-reveal" data-reveal-delay="0">
      <div class="module-layout__header">
        <div>
          <p class="eyebrow">${escapeHtml(module.label)}</p>
          <h3>${escapeHtml(module.label)} verwalten</h3>
          <p>${escapeHtml(module.description)}</p>
        </div>
        <button class="module-action" type="button" id="newEntryButton">Neuen Eintrag anlegen</button>
      </div>
      <div class="module-layout__content">
        <div class="table-card">
          <div class="table-tools">
            <div class="stats-chip">${rows.length} Eintraege</div>
            <input id="moduleSearch" class="search-input" type="search" placeholder="Suchen..." value="${escapeAttribute(currentSearch)}">
          </div>
          ${rows.length ? renderTable(rows, config, module.id, "local") : '<div class="empty-state">Noch keine Eintraege gefunden.</div>'}
        </div>
        <div class="form-card">
          <p class="eyebrow">${editingRow ? "Bearbeiten" : "Neu"}</p>
          <h3>${editingRow ? "Eintrag bearbeiten" : "Eintrag hinzufuegen"}</h3>
          <form id="moduleForm" class="form-grid ${config.formColumns === 2 ? "two-cols" : ""}">
            ${config.fields.map((field) => renderField(field, editingRow)).join("")}
            <div class="form-actions">
              <button class="primary-button" type="submit">${editingRow ? "Speichern" : "Hinzufuegen"}</button>
              <button class="secondary-button" type="button" id="cancelEditButton">Zuruecksetzen</button>
            </div>
          </form>
        </div>
      </div>
    </section>
  `;

  wireCommonModuleEvents();

  document.getElementById("newEntryButton").addEventListener("click", () => {
    currentEditId = null;
    renderModule();
  });

  document.getElementById("cancelEditButton").addEventListener("click", () => {
    currentEditId = null;
    renderModule();
  });

  document.getElementById("moduleForm").addEventListener("submit", (event) => {
    event.preventDefault();
    submitLocalForm(module.id, config, new FormData(event.currentTarget));
  });

  moduleView.querySelectorAll("[data-action='edit']").forEach((button) => {
    button.addEventListener("click", () => {
      currentEditId = button.dataset.id;
      renderModule();
    });
  });

  moduleView.querySelectorAll("[data-action='delete']").forEach((button) => {
    button.addEventListener("click", () => {
      deleteLocalRow(module.id, button.dataset.id);
    });
  });
}

function wireCommonModuleEvents() {
  document.getElementById("moduleSearch").addEventListener("input", (event) => {
    currentSearch = event.target.value;
    renderModule();
  });
}

async function submitApiForm(moduleId, formData) {
  const payload = Object.fromEntries(formData.entries());
  let endpoint = `/${moduleId}`;
  let method = "POST";
  if (moduleId === "users") {
    if (currentEditId) {
      endpoint = `/users/${currentEditId}`;
      method = "PATCH";
    } else {
      endpoint = "/users/invitations";
    }
  }
  if (moduleId === "classes" && payload.gradeLevel) {
    payload.gradeLevel = Number(payload.gradeLevel);
  }
  if (moduleId === "timetable") {
    endpoint = currentEditId ? `/lessons/${currentEditId}` : "/lessons";
    method = currentEditId ? "PATCH" : "POST";
  }
  if (moduleId === "attendance") {
    payload.excused = payload.excused === "true";
  }

  await apiRequest(endpoint, {
    method,
    body: JSON.stringify(payload)
  });

  currentEditId = null;
  currentSearch = "";
  await refreshApiState();
  renderApp();
}

function submitLocalForm(moduleId, config, formData) {
  const entry = {};
  config.fields.forEach((field) => {
    let value = formData.get(field.name);
    if (field.type === "number") {
      value = Number(value);
    }
    entry[field.name] = typeof value === "string" ? value.trim() : value;
  });

  if (currentEditId) {
    localState[moduleId] = localState[moduleId].map((row) => row.id === currentEditId ? { ...row, ...entry } : row);
  } else {
    localState[moduleId].unshift({ id: uid(), ...entry });
  }

  currentEditId = null;
  saveLocalState();
  renderApp();
}

function deleteLocalRow(moduleId, id) {
  if (!window.confirm("Eintrag wirklich loeschen?")) {
    return;
  }

  localState[moduleId] = localState[moduleId].filter((row) => row.id !== id);
  currentEditId = null;
  saveLocalState();
  renderApp();
}

function renderTable(rows, config, moduleId, source) {
  if (moduleId === "timetable") {
    return renderTimetableMatrix(rows);
  }
  const headers = config.columns.map((column) => `<th>${escapeHtml(column.label)}</th>`).join("");
  const canEdit = source === "local" || moduleId === "users" || (moduleId === "timetable" && session.user?.role === "admin");
  const canDelete = source === "local" || moduleId === "users" || (moduleId === "timetable" && session.user?.role === "admin");

  const body = rows.map((row) => {
    const cells = config.columns.map((column) => {
      const rawValue = row[column.key] ?? "";
      if (column.tag) {
        const tagClass = column.classForValue ? column.classForValue(rawValue) : "";
        return `<td><span class="tag ${tagClass}">${escapeHtml(String(rawValue))}</span></td>`;
      }
      const formatted = column.format ? column.format(rawValue, row) : escapeHtml(String(rawValue));
      return `<td>${formatted}</td>`;
    }).join("");

    return `
      <tr>
        ${cells}
        <td>
          <div class="inline-actions">
            ${canEdit ? `<button class="row-button" data-action="edit" data-id="${row.id}" type="button">Bearbeiten</button>` : ""}
            ${canDelete ? `<button class="row-button danger" data-action="delete" data-id="${row.id}" type="button">Loeschen</button>` : ""}
            ${source === "api" ? '<span class="hint-text">API</span>' : ""}
          </div>
        </td>
      </tr>
    `;
  }).join("");

  return `
    <table>
      <thead>
        <tr>
          ${headers}
          <th>Aktionen</th>
        </tr>
      </thead>
      <tbody>${body}</tbody>
    </table>
    ${moduleId === "grades" ? renderGradeSummary() : ""}
  `;
}

function getApiModuleConfig(moduleId) {
  return {
    users: {
      searchKeys: ["email", "role", "firstName", "lastName"],
      formColumns: 2,
      fields: [
        textField("firstName", "Vorname"),
        textField("lastName", "Nachname"),
        textField("email", "E-Mail"),
        selectField("role", "Rolle", ["admin", "teacher", "student", "parent"]),
        passwordField("password", "Neues Passwort")
      ],
      columns: [
        { key: "firstName", label: "Vorname" },
        { key: "lastName", label: "Nachname" },
        { key: "email", label: "E-Mail" },
        { key: "role", label: "Rolle", tag: true }
      ]
    },
    timetable: {
      searchKeys: ["day", "lessonSlot", "className", "subject", "room", "teacherName"],
      formColumns: 2,
      fields: [
        selectField("day", "Tag", ["Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag"]),
        selectField("lessonSlot", "Stunde", ["1", "2", "3", "4", "5", "6", "7", "8"]),
        textField("className", "Klasse"),
        textField("subject", "Fach"),
        textField("room", "Raum"),
        textField("teacherName", "Lehrer")
      ],
      columns: [
        { key: "day", label: "Tag" },
        { key: "lessonSlot", label: "Stunde" },
        { key: "className", label: "Klasse" },
        { key: "subject", label: "Fach" },
        { key: "room", label: "Raum" },
        { key: "teacherName", label: "Lehrer" }
      ]
    },
    classes: {
      searchKeys: ["name", "gradeLevel", "teacherId"],
      formColumns: 2,
      fields: [
        textField("name", "Klassenname"),
        numberField("gradeLevel", "Stufe", 1, 13, 1),
        textField("teacherId", "Lehrer-ID")
      ],
      columns: [
        { key: "name", label: "Name" },
        { key: "gradeLevel", label: "Stufe" },
        { key: "teacherId", label: "Lehrer-ID" }
      ]
    },
    students: {
      searchKeys: ["firstName", "lastName", "classId", "userId"],
      formColumns: 2,
      fields: [
        textField("firstName", "Vorname"),
        textField("lastName", "Nachname"),
        selectField("classId", "Klasse", apiState.classes.map((entry) => entry.id)),
        textField("userId", "Benutzer-ID")
      ],
      columns: [
        { key: "firstName", label: "Vorname" },
        { key: "lastName", label: "Nachname" },
        { key: "classId", label: "Klasse" },
        { key: "userId", label: "User-ID" }
      ]
    },
    attendance: {
      searchKeys: ["studentId", "classId", "status", "date", "note"],
      formColumns: 2,
      fields: [
        selectField("studentId", "Schueler-ID", apiState.students.map((entry) => entry.id)),
        selectField("classId", "Klasse", apiState.classes.map((entry) => entry.id)),
        dateField("date", "Datum"),
        selectField("status", "Status", ["present", "absent_unexcused", "absent_excused"]),
        selectField("excused", "Entschuldigt", ["false", "true"]),
        textareaField("note", "Notiz", 2)
      ],
      columns: [
        { key: "date", label: "Datum", format: formatDate },
        { key: "studentId", label: "Schueler-ID" },
        { key: "classId", label: "Klasse" },
        { key: "status", label: "Status", tag: true, classForValue: statusClass },
        { key: "note", label: "Notiz" }
      ]
    },
    classbook: {
      searchKeys: ["classId", "subject", "topic", "homework", "date"],
      formColumns: 1,
      fields: [
        selectField("classId", "Klasse", apiState.classes.map((entry) => entry.id)),
        textField("subject", "Fach"),
        dateField("date", "Datum"),
        textareaField("topic", "Unterrichtsinhalt"),
        textareaField("homework", "Hausaufgabe")
      ],
      columns: [
        { key: "date", label: "Datum", format: formatDate },
        { key: "classId", label: "Klasse" },
        { key: "subject", label: "Fach" },
        { key: "topic", label: "Inhalt" },
        { key: "homework", label: "Hausaufgabe" }
      ]
    }
  }[moduleId];
}

function getLocalModuleConfig(moduleId) {
  return {
    documents: {
      searchKeys: ["title", "category", "note"],
      formColumns: 1,
      fields: [textField("title", "Titel"), textField("category", "Kategorie"), dateField("date", "Datum"), textareaField("note", "Notiz")],
      columns: [{ key: "title", label: "Titel" }, { key: "category", label: "Kategorie" }, { key: "date", label: "Datum", format: formatDate }, { key: "note", label: "Notiz" }]
    },
    exams: {
      searchKeys: ["subject", "topic", "status"],
      formColumns: 2,
      fields: [textField("subject", "Fach"), dateField("date", "Datum"), textField("topic", "Thema"), selectField("status", "Status", ["Angekuendigt", "Vorbereitung", "Geschrieben"])],
      columns: [{ key: "subject", label: "Fach" }, { key: "date", label: "Datum", format: formatDate }, { key: "topic", label: "Thema" }, { key: "status", label: "Status", tag: true }]
    },
    makeup: {
      searchKeys: ["title", "room", "reason", "status"],
      formColumns: 2,
      fields: [textField("title", "Titel"), dateField("date", "Datum"), textField("room", "Raum"), selectField("status", "Status", ["Geplant", "Erledigt"]), textareaField("reason", "Grund", 2)],
      columns: [{ key: "title", label: "Titel" }, { key: "date", label: "Datum", format: formatDate }, { key: "room", label: "Raum" }, { key: "reason", label: "Grund" }, { key: "status", label: "Status", tag: true, classForValue: statusClass }]
    },
    timetable: {
      searchKeys: ["day", "lesson", "subject", "room", "teacher"],
      formColumns: 2,
      fields: [textField("day", "Tag"), textField("lesson", "Stunde"), textField("subject", "Fach"), textField("room", "Raum"), textField("teacher", "Lehrkraft")],
      columns: [{ key: "day", label: "Tag" }, { key: "lesson", label: "Stunde" }, { key: "subject", label: "Fach" }, { key: "room", label: "Raum" }, { key: "teacher", label: "Lehrkraft" }]
    },
    letters: {
      searchKeys: ["subject", "sender", "body"],
      formColumns: 1,
      fields: [textField("subject", "Betreff"), dateField("date", "Datum"), textField("sender", "Absender"), textareaField("body", "Inhalt")],
      columns: [{ key: "subject", label: "Betreff" }, { key: "date", label: "Datum", format: formatDate }, { key: "sender", label: "Absender" }, { key: "body", label: "Inhalt" }]
    },
    grades: {
      searchKeys: ["subject", "type"],
      formColumns: 2,
      fields: [textField("subject", "Fach"), textField("type", "Art"), numberField("grade", "Note", 1, 6, 1), numberField("weight", "Gewichtung", 1, 5, 1), dateField("date", "Datum")],
      columns: [{ key: "subject", label: "Fach" }, { key: "type", label: "Art" }, { key: "grade", label: "Note" }, { key: "weight", label: "Gewichtung" }, { key: "date", label: "Datum", format: formatDate }]
    },
    payments: {
      searchKeys: ["title", "status"],
      formColumns: 2,
      fields: [textField("title", "Bezeichnung"), numberField("amount", "Betrag", 0, 10000, 0.5), dateField("dueDate", "Faellig am"), selectField("status", "Status", ["Offen", "Bezahlt"])],
      columns: [{ key: "title", label: "Bezeichnung" }, { key: "amount", label: "Betrag", format: (value) => `${Number(value).toFixed(2)} EUR` }, { key: "dueDate", label: "Faellig", format: formatDate }, { key: "status", label: "Status", tag: true, classForValue: statusClass }]
    },
    calendar: {
      searchKeys: ["title", "type", "details"],
      formColumns: 1,
      fields: [textField("title", "Titel"), dateField("date", "Datum"), textField("type", "Art"), textareaField("details", "Details")],
      columns: [{ key: "title", label: "Titel" }, { key: "date", label: "Datum", format: formatDate }, { key: "type", label: "Art" }, { key: "details", label: "Details" }]
    },
    learning: {
      searchKeys: ["topic", "subject", "progress", "note"],
      formColumns: 2,
      fields: [textField("topic", "Lernziel"), textField("subject", "Fach"), selectField("progress", "Fortschritt", ["Offen", "In Arbeit", "Fertig"]), dateField("deadline", "Deadline"), textareaField("note", "Notiz", 2)],
      columns: [{ key: "topic", label: "Lernziel" }, { key: "subject", label: "Fach" }, { key: "progress", label: "Status", tag: true, classForValue: statusClass }, { key: "deadline", label: "Deadline", format: formatDate }, { key: "note", label: "Notiz" }]
    }
  }[moduleId];
}

function renderField(field, row) {
  const value = row?.[field.name] ?? "";
  const colSpan = field.colSpan === 2 ? 'style="grid-column: 1 / -1;"' : "";

  if (field.type === "select") {
    const options = field.options.length ? field.options : [""];
    return `
      <label ${colSpan}>
        ${escapeHtml(field.label)}
        <select name="${field.name}" required>
          ${options.map((option) => `<option value="${escapeAttribute(option)}" ${String(value) === option ? "selected" : ""}>${escapeHtml(option || "-")}</option>`).join("")}
        </select>
      </label>
    `;
  }

  if (field.type === "textarea") {
    return `
      <label ${colSpan}>
        ${escapeHtml(field.label)}
        <textarea name="${field.name}" required>${escapeHtml(String(value))}</textarea>
      </label>
    `;
  }

  const extras = [
    field.min !== undefined ? `min="${field.min}"` : "",
    field.max !== undefined ? `max="${field.max}"` : "",
    field.step !== undefined ? `step="${field.step}"` : ""
  ].join(" ");

  return `
    <label ${colSpan}>
      ${escapeHtml(field.label)}
      <input type="${field.type}" name="${field.name}" value="${escapeAttribute(String(value))}" required ${extras}>
    </label>
  `;
}

function resetLocalData() {
  if (!window.confirm("Lokale Demo-Daten zuruecksetzen?")) {
    return;
  }
  localState = structuredClone(localDefaults);
  saveLocalState();
  currentEditId = null;
  currentSearch = "";
  renderApp();
}

function logout() {
  session = { token: "", user: null };
  saveSession();
  activeModule = "dashboard";
  currentEditId = null;
  currentSearch = "";
  renderLoginOnly();
}

function loadLocalState() {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    return raw ? { ...structuredClone(localDefaults), ...JSON.parse(raw) } : structuredClone(localDefaults);
  } catch (error) {
    return structuredClone(localDefaults);
  }
}

function saveLocalState() {
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(localState));
}

function loadSession() {
  try {
    const raw = sessionStorage.getItem(SESSION_STORAGE_KEY);
    return raw ? JSON.parse(raw) : { token: "", user: null };
  } catch (error) {
    return { token: "", user: null };
  }
}

function saveSession() {
  if (session?.token) {
    sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
  } else {
    sessionStorage.removeItem(SESSION_STORAGE_KEY);
  }
}

async function apiRequest(path, options = {}, withAuth = true) {
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {})
  };

  if (withAuth && session.token) {
    headers.Authorization = `Bearer ${session.token}`;
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || `Fehler ${response.status}`);
  }
  return data;
}

function canWriteApiModule(moduleId) {
  if (!session.user) {
    return false;
  }
  if (moduleId === "users") {
    return session.user.role === "admin";
  }
  if (["teacher", "admin"].includes(session.user.role)) {
    return true;
  }
  return moduleId === "students" || moduleId === "classes" ? session.user.role === "admin" : false;
}

function countOpenTasks() {
  const openPayments = localState.payments.filter((entry) => entry.status === "Offen").length;
  const openLearning = localState.learning.filter((entry) => entry.progress !== "Fertig").length;
  const unexcused = apiState.attendance.filter((entry) => entry.status === "absent_unexcused").length;
  return openPayments + openLearning + unexcused;
}

function renderGradeSummary() {
  const weightedSum = localState.grades.reduce((sum, entry) => sum + Number(entry.grade) * Number(entry.weight), 0);
  const totalWeight = localState.grades.reduce((sum, entry) => sum + Number(entry.weight), 0);
  return `<p><strong>Gewichteter Durchschnitt:</strong> ${totalWeight ? (weightedSum / totalWeight).toFixed(2) : "-"}</p>`;
}

function filterRows(rows, query, keys) {
  const normalized = String(query || "").trim().toLowerCase();
  if (!normalized) {
    return rows;
  }
  return rows.filter((row) => keys.some((key) => String(row[key] ?? "").toLowerCase().includes(normalized)));
}

function renderListHtml(items, formatter) {
  if (!items.length) {
    return "<p>Keine Eintraege vorhanden.</p>";
  }
  return `<ul>${items.map((item) => `<li>${formatter(item)}</li>`).join("")}</ul>`;
}

function renderInvitationList() {
  if (!apiState.invitations.length) {
    return '<p class="hint-text">Noch keine Einladungs-Tokens erstellt.</p>';
  }

  return `
    <div class="invite-list">
      <p class="eyebrow">Offene Tokens</p>
      ${apiState.invitations.slice(0, 5).map((entry) => `
        <div class="invite-token-card">
          <strong>${escapeHtml(entry.token)}</strong>
          <p class="hint-text">${escapeHtml(buildInviteLink(entry.token))}</p>
          <span class="tag ${statusClass(entry.status)}">${escapeHtml(entry.role)} / ${escapeHtml(entry.status)}</span>
        </div>
      `).join("")}
    </div>
  `;
}

function renderTimetableMatrix(rows) {
  const days = ["Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag"];
  const slots = ["1", "2", "3", "4", "5", "6", "7", "8"];

  const body = slots.map((slot) => {
    const cells = days.map((day) => {
      const entry = rows.find((row) => row.day === day && String(row.lessonSlot) === slot);
      if (!entry) {
        return '<td><span class="hint-text">-</span></td>';
      }

      const adminActions = session.user?.role === "admin"
        ? `<div class="inline-actions timetable-actions">
             <button class="row-button" data-action="edit" data-id="${entry.id}" type="button">Bearbeiten</button>
             <button class="row-button danger" data-action="delete" data-id="${entry.id}" type="button">Loeschen</button>
           </div>`
        : "";

      return `
        <td>
          <div class="timetable-cell">
            <strong>${escapeHtml(entry.subject)}</strong>
            <span>${escapeHtml(entry.className)} · Raum ${escapeHtml(entry.room)}</span>
            <span>${escapeHtml(entry.teacherName)}</span>
            ${adminActions}
          </div>
        </td>
      `;
    }).join("");

    return `<tr><th>${slot}. Std.</th>${cells}</tr>`;
  }).join("");

  return `
    <div class="timetable-wrap">
      <table class="timetable-grid">
        <thead>
          <tr>
            <th>Stunde</th>
            ${days.map((day) => `<th>${day}</th>`).join("")}
          </tr>
        </thead>
        <tbody>${body}</tbody>
      </table>
    </div>
  `;
}

function syncInviteBoxFromUrl() {
  const inviteToken = new URLSearchParams(window.location.search).get("invite");
  if (inviteToken) {
    inviteRegisterBox.classList.remove("hidden");
    if (inviteRegisterForm?.elements?.inviteToken) {
      inviteRegisterForm.elements.inviteToken.value = inviteToken;
    }
    inviteRegisterMessage.textContent = "Registrierung mit Einladung freigeschaltet.";
  } else {
    inviteRegisterMessage.textContent = inviteRegisterBox.classList.contains("hidden")
      ? ""
      : "Token manuell eingeben oder Einladungslink nutzen.";
  }
}

function buildInviteLink(token) {
  return `${window.location.origin}${window.location.pathname}?invite=${encodeURIComponent(token)}`;
}

function textField(name, label) {
  return { type: "text", name, label };
}

function passwordField(name, label) {
  return { type: "password", name, label };
}

function dateField(name, label) {
  return { type: "date", name, label };
}

function textareaField(name, label, colSpan = 1) {
  return { type: "textarea", name, label, colSpan };
}

function selectField(name, label, options) {
  return { type: "select", name, label, options };
}

function numberField(name, label, min, max, step) {
  return { type: "number", name, label, min, max, step };
}

function formatDate(value) {
  if (!value) {
    return "";
  }
  const parts = String(value).split("-");
  if (parts.length !== 3) {
    return escapeHtml(String(value));
  }
  const [year, month, day] = parts.map(Number);
  return new Intl.DateTimeFormat("de-DE").format(new Date(year, month - 1, day));
}

function formatDateTime(value) {
  if (!value) {
    return "";
  }
  return new Intl.DateTimeFormat("de-DE", {
    dateStyle: "short",
    timeStyle: "short"
  }).format(new Date(value));
}

function statusClass(value) {
  if (["Bezahlt", "Fertig", "Erledigt", "absent_excused", "present", "used"].includes(value)) {
    return "is-ok";
  }
  if (["Offen", "Angekuendigt", "absent_unexcused", "open"].includes(value)) {
    return "is-alert";
  }
  return "";
}

function initials(name) {
  return String(name || "")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("") || "SM";
}

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeAttribute(value) {
  return escapeHtml(value);
}

function applyMobileScrollReveal() {
  const isMobile = window.matchMedia("(max-width: 720px)").matches;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const elements = document.querySelectorAll(".scroll-reveal");

  if (revealObserver) {
    revealObserver.disconnect();
    revealObserver = null;
  }

  if (!isMobile || reduceMotion) {
    elements.forEach((element) => element.classList.add("is-visible"));
    return;
  }

  revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        revealObserver.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.16,
    rootMargin: "0px 0px -40px 0px"
  });

  elements.forEach((element) => {
    element.classList.remove("is-visible");
    revealObserver.observe(element);
  });
}

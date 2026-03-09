import { agendaData } from './assets/data/agenda.js';
import { participantesData } from './assets/data/participantes.js';
import { photosData } from './assets/data/photos.js';
import { i18n } from './locales.js';

// ---- Configurações Globais ----
const GOOGLE_DRIVE_LINK = "https://drive.google.com/drive/folders/1QLjntW5u8gsWYKsYaLikHfnjhpj8Iq3X?usp=drive_link";

// Elementos da Interface
const navItems = document.querySelectorAll('.bottom-nav-item');
const sections = document.querySelectorAll('.home-section');
const actionCards = document.querySelectorAll('.action-card[data-link]');
const btnGoogleDrive = document.getElementById('btn-google-drive');

// ---- LÓGICA DE LOGIN (Supabase) ----
const form = document.querySelector('#login-form');
const emailInput = document.querySelector('#email');
const passwordInput = document.querySelector('#password');
const passwordField = document.querySelector('.password-field');
const passwordToggle = document.querySelector('.password-toggle');
const submitButton = document.querySelector('.primary-button');
const forgotPasswordButton = document.querySelector('#forgot-password');
const resetForm = document.querySelector('#reset-form');
const resetEmailInput = document.querySelector('#reset-email');
const newPasswordInput = document.querySelector('#new-password');
const confirmPasswordInput = document.querySelector('#confirm-password');
const backToLoginButton = document.querySelector('#back-to-login');
const resetSubmitButton = document.querySelector('#reset-submit');
const loginCard = document.querySelector('.login-card');

const AUTH_PROVIDER = 'supabase';

// ---- i18n (PT/EN) ----
const SUPPORTED_LANGS = ['pt', 'en'];

function getCurrentLang() {
  try {
    const stored = (localStorage.getItem('lang') || '').toLowerCase();
    if (SUPPORTED_LANGS.includes(stored)) return stored;
  } catch (e) { }
  return 'pt';
}

let translationMapPtToEn = null;

function buildTranslationMap(fromLang, toLang) {
  const map = new Map();
  const from = i18n?.[fromLang] || {};
  const to = i18n?.[toLang] || {};

  Object.keys(from).forEach((key) => {
    const fromVal = from[key];
    const toVal = to[key];
    if (typeof fromVal === 'string' && typeof toVal === 'string' && fromVal.trim() && toVal.trim()) {
      map.set(fromVal.trim(), toVal);
    }
  });
  return map;
}

function translateFromPt(text) {
  const lang = getCurrentLang();
  if (lang !== 'en') return text;
  if (typeof text !== 'string') return text;
  if (!translationMapPtToEn) translationMapPtToEn = buildTranslationMap('pt', 'en');
  return translationMapPtToEn.get(text.trim()) || text;
}

function formatTemplate(template, vars) {
  let out = template || '';
  Object.keys(vars || {}).forEach((k) => {
    out = out.replaceAll(`{${k}}`, String(vars[k] ?? ''));
  });
  return out;
}

function t(key) {
  const lang = getCurrentLang();
  return (i18n?.[lang] && i18n[lang][key]) || (i18n?.pt && i18n.pt[key]) || '';
}

function applyI18n() {
  const lang = getCurrentLang();
  document.documentElement.lang = lang === 'en' ? 'en' : 'pt-BR';

  document.querySelectorAll('[data-i18n]')?.forEach((el) => {
    const key = el.getAttribute('data-i18n');
    const value = key ? t(key) : '';
    if (value) el.textContent = value;
  });

  document.querySelectorAll('[data-i18n-placeholder]')?.forEach((el) => {
    const key = el.getAttribute('data-i18n-placeholder');
    const value = key ? t(key) : '';
    if (value) el.setAttribute('placeholder', value);
  });

  document.querySelectorAll('[data-i18n-aria-label]')?.forEach((el) => {
    const key = el.getAttribute('data-i18n-aria-label');
    const value = key ? t(key) : '';
    if (value) el.setAttribute('aria-label', value);
  });

  const langSelect = document.getElementById('lang-select');
  if (langSelect && langSelect.value !== lang) {
    langSelect.value = lang;
  }

  document.querySelectorAll('.lang-toggle-btn[data-lang]')?.forEach((btn) => {
    const btnLang = (btn.getAttribute('data-lang') || '').toLowerCase();
    const isActive = btnLang === lang;
    btn.classList.toggle('is-active', isActive);
    btn.setAttribute('aria-pressed', isActive ? 'true' : 'false');
  });
}

function initI18n() {
  applyI18n();

  const langSelect = document.getElementById('lang-select');
  if (langSelect) {
    langSelect.value = getCurrentLang();
    langSelect.addEventListener('change', () => {
      const next = (langSelect.value || 'pt').toLowerCase();
      try {
        localStorage.setItem('lang', SUPPORTED_LANGS.includes(next) ? next : 'pt');
      } catch (e) { }
      window.location.reload();
    });
  }

  document.querySelectorAll('.lang-toggle-btn[data-lang]')?.forEach((btn) => {
    btn.addEventListener('click', () => {
      const next = (btn.getAttribute('data-lang') || 'pt').toLowerCase();
      try {
        localStorage.setItem('lang', SUPPORTED_LANGS.includes(next) ? next : 'pt');
      } catch (e) { }
      window.location.reload();
    });
  });
}

const supabaseConfig = {
  url: 'https://pffbpufjovqlxzogrtjl.supabase.co',
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmZmJwdWZqb3ZxbHh6b2dydGpsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMwMjQyOTAsImV4cCI6MjA4ODYwMDI5MH0.kckgDcj2PR9n7xDmiVqIk19ym6zdgUfkPBUEWpl_AwI',
};

let supabaseClient = null;

function setError(input, message) {
  const errorElement = document.querySelector(`.field-error[data-error-for="${input.id}"]`);
  if (errorElement) {
    errorElement.textContent = message || '';
  }
}

function validateEmail(value) {
  if (!value) return t('emailRequired') || 'Informe seu e-mail corporativo';
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(value)) return t('emailInvalid') || 'Digite um e-mail válido';
  return '';
}

function validatePassword(value) {
  if (!value) return t('passwordRequired') || 'Informe sua senha';
  return '';
}

function setLoading(isLoading, button = submitButton) {
  if (!button) return;
  button.disabled = isLoading;
  if (isLoading) {
    button.classList.add('loading');
  } else {
    button.classList.remove('loading');
  }
}

passwordToggle?.addEventListener('click', () => {
  const isPassword = passwordInput.type === 'password';
  passwordInput.type = isPassword ? 'text' : 'password';
  passwordField.classList.toggle('password-visible', isPassword);
});

emailInput?.addEventListener('input', () => setError(emailInput, ''));
passwordInput?.addEventListener('input', () => setError(passwordInput, ''));
resetEmailInput?.addEventListener('input', () => setError(resetEmailInput, ''));
newPasswordInput?.addEventListener('input', () => setError(newPasswordInput, ''));
confirmPasswordInput?.addEventListener('input', () => setError(confirmPasswordInput, ''));

async function getSupabaseClient() {
  if (supabaseClient) return supabaseClient;

  if (!window.supabase) {
    console.error('Supabase SDK not loaded via script tag');
    alert(t('supabaseSdkMissing') || 'Erro: A biblioteca do Supabase não foi carregada.');
    throw new Error('Supabase SDK not loaded');
  }
  const { createClient } = window.supabase;
  supabaseClient = createClient(supabaseConfig.url, supabaseConfig.anonKey);
  return supabaseClient;
}

async function authenticate(email, password) {
  if (AUTH_PROVIDER === 'supabase') {
    const client = await getSupabaseClient();
    const { data, error } = await client
      .from('users')
      .select('*')
      .eq('email', email)
      .eq('password', password)
      .maybeSingle();

    if (error) throw error;
    if (!data) throw new Error('INVALID_CREDENTIALS');

    // Save user info for welcome message
    localStorage.setItem('logged_user_name', data.name || data.email.split('@')[0] || '');

    return { ok: true, user: { id: data.id, email: data.email } };
  }
  throw new Error('Provedor de autenticação não configurado corretamente.');
}

form?.addEventListener('submit', async (event) => {
  event.preventDefault();

  const email = emailInput.value.trim();
  const password = passwordInput.value;

  const emailError = validateEmail(email);
  const passwordError = validatePassword(password);

  setError(emailInput, emailError);
  setError(passwordInput, passwordError);

  if (emailError || passwordError) return;

  try {
    setLoading(true);
    await authenticate(email, password);
    window.location.href = './app.html';
  } catch (error) {
    console.error(error);
    if (error && error.message === 'INVALID_CREDENTIALS') {
      setError(passwordInput, t('invalidCredentials') || 'E-mail ou senha inválidos');
    } else {
      setError(passwordInput, t('connectError') || 'Não foi possível conectar. Verifique sua conexão e tente novamente.');
    }
  } finally {
    setLoading(false, submitButton);
  }
});

function switchToResetMode() {
  if (!loginCard || !resetForm) return;
  loginCard.classList.add('reset-mode');
  resetForm.hidden = false;
  form.hidden = true; // Oculta o login form
  const currentEmail = emailInput.value.trim();
  if (currentEmail && resetEmailInput) {
    resetEmailInput.value = currentEmail;
  }
}

function switchToLoginMode() {
  if (!loginCard || !resetForm) return;
  loginCard.classList.remove('reset-mode');
  resetForm.hidden = true;
  form.hidden = false; // Mostra o login form novamente
  newPasswordInput.value = '';
  confirmPasswordInput.value = '';
  setError(resetEmailInput, '');
  setError(newPasswordInput, '');
  setError(confirmPasswordInput, '');
}

forgotPasswordButton?.addEventListener('click', () => {
  switchToResetMode();
});

backToLoginButton?.addEventListener('click', () => {
  switchToLoginMode();
});

resetForm?.addEventListener('submit', async (event) => {
  event.preventDefault();

  const email = resetEmailInput.value.trim();
  const newPassword = newPasswordInput.value;
  const confirmPassword = confirmPasswordInput.value;

  const emailError = validateEmail(email);
  setError(resetEmailInput, emailError);

  let newPasswordError = '';
  if (!newPassword) {
    newPasswordError = t('resetNewPasswordRequired') || 'Informe a nova senha';
  }

  let confirmPasswordError = '';
  if (!confirmPassword) {
    confirmPasswordError = t('resetConfirmPasswordRequired') || 'Confirme a nova senha';
  } else if (newPassword && newPassword !== confirmPassword) {
    confirmPasswordError = t('resetPasswordsMismatch') || 'As senhas não conferem';
  }

  setError(newPasswordInput, newPasswordError);
  setError(confirmPasswordInput, confirmPasswordError);

  if (emailError || newPasswordError || confirmPasswordError) return;

  try {
    setLoading(true, resetSubmitButton);
    const client = await getSupabaseClient();

    const { data, error } = await client
      .from('users')
      .update({ password: newPassword })
      .eq('email', email)
      .select('id')
      .maybeSingle();

    if (error) {
      console.error('Erro ao redefinir senha:', error);
      alert(t('resetFailed') || 'Não foi possível redefinir a senha. Tente novamente.');
      return;
    }

    if (!data) {
      setError(resetEmailInput, t('emailNotFound') || 'E-mail não encontrado');
      return;
    }

    alert(t('resetSuccess') || 'Senha redefinida com sucesso! Use a nova senha para entrar.');
    emailInput.value = email;
    passwordInput.value = '';
    switchToLoginMode();
    passwordInput.focus();
  } catch (error) {
    console.error(error);
    alert(t('resetFailed') || 'Não foi possível redefinir a senha. Tente novamente.');
  } finally {
    setLoading(false, resetSubmitButton);
  }
});

// ---- Inicialização ----
document.addEventListener('DOMContentLoaded', () => {
  initIcons();
  initI18n();
  initServiceWorker();
  initNavigation();
  initAgenda();
  initNetworking();
  initHomeHighlights();
  initProfileModal();
});

function initServiceWorker() {
  if (!('serviceWorker' in navigator)) return;
  // SW requires secure context (https) or localhost
  navigator.serviceWorker.register('./sw.js').catch(() => { });
}

function initIcons() {
  if (window.lucide) {
    window.lucide.createIcons();
  }
}

// ---- Participant photos (match by name) ----
let photoIndex = null;

function normalizeNameForMatch(name) {
  return String(name || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toUpperCase();
}

function nameKeyFirstLast(normalized) {
  const parts = String(normalized || '').split(' ').filter(Boolean);
  if (parts.length === 0) return '';
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${parts[parts.length - 1]}`;
}

function buildPhotoIndex() {
  const list = Array.isArray(photosData) ? photosData : [];
  const byFull = new Map();
  const byFirstLast = new Map();

  list.forEach((item) => {
    const rawName = String(item?.name || '').trim();
    const file = String(item?.file || '').trim();
    if (!rawName || !file) return;
    const normalized = normalizeNameForMatch(rawName);
    const firstLast = nameKeyFirstLast(normalized);
    if (normalized && !byFull.has(normalized)) byFull.set(normalized, file);
    if (firstLast && !byFirstLast.has(firstLast)) byFirstLast.set(firstLast, file);
  });

  return { byFull, byFirstLast };
}

function getPhotoFileForPersonName(fullName) {
  if (!photoIndex) photoIndex = buildPhotoIndex();
  const normalized = normalizeNameForMatch(fullName);
  if (!normalized) return '';

  const direct = photoIndex.byFull.get(normalized);
  if (direct) return direct;

  const firstLast = nameKeyFirstLast(normalized);
  return photoIndex.byFirstLast.get(firstLast) || '';
}

function encodeFilePathSegment(file) {
  return encodeURIComponent(String(file || '')).replaceAll('%2F', '/');
}

// ---- Profile modal ----
function initProfileModal() {
  const modal = document.getElementById('app-modal');
  if (!modal) return;

  const closeBtn = modal.querySelector('.modal-close');
  closeBtn?.addEventListener('click', () => {
    try { modal.close(); } catch (e) { modal.removeAttribute('open'); }
  });

  modal.addEventListener('click', (e) => {
    // click outside content closes
    if (e.target === modal) {
      try { modal.close(); } catch (err) { modal.removeAttribute('open'); }
    }
  });
}

function openParticipantProfile(participant) {
  const modal = document.getElementById('app-modal');
  if (!modal) return;

  const titleEl = document.getElementById('modal-title');
  const descEl = document.getElementById('modal-description');
  const infoEl = document.getElementById('modal-info');
  const actionsEl = document.getElementById('modal-actions');
  const profileEl = document.getElementById('profile-content');

  if (titleEl) titleEl.textContent = participant?.nome || '';
  if (actionsEl) actionsEl.innerHTML = '';

  if (descEl) descEl.classList.add('is-hidden');
  if (infoEl) infoEl.classList.add('is-hidden');
  if (profileEl) profileEl.classList.remove('is-hidden');

  const file = participant?.photoFile || '';
  const photoHTML = file
    ? `<div class="profile-photo"><img src="./assets/photos/${encodeFilePathSegment(file)}" alt="${formatTemplate(t('photoAltNamed') || 'Photo of {name}', { name: participant?.nome || '' })}" loading="lazy" decoding="async" /></div>`
    : `<div class="profile-photo"><div class="profile-photo-fallback">${participant?.iniciais || ''}</div></div>`;

  const email = participant?.email || '';
  const emailHTML = email
    ? `<a href="mailto:${email}" style="color:var(--secondary-blue);text-decoration:underline;word-break:break-all;">${email}</a>`
    : '';

  if (profileEl) {
    profileEl.innerHTML = `
      ${photoHTML}
      <div class="profile-meta">
        <div class="profile-meta-row">
          <i data-lucide="briefcase"></i>
          <div>
            <div class="profile-meta-label">${t('labelRole') || 'Role'}</div>
            <div class="profile-meta-value">${participant?.cargo || ''}</div>
          </div>
        </div>
        <div class="profile-meta-row">
          <i data-lucide="map-pin"></i>
          <div>
            <div class="profile-meta-label">${t('labelLocation') || 'Location'}</div>
            <div class="profile-meta-value">${participant?.localidade || ''}</div>
          </div>
        </div>
        ${email ? `
          <div class="profile-meta-row">
            <i data-lucide="mail"></i>
            <div>
              <div class="profile-meta-label">${t('labelEmail') || 'Email'}</div>
              <div class="profile-meta-value">${emailHTML}</div>
            </div>
          </div>
        ` : ''}
      </div>
    `;
  }

  initIcons();

  try {
    if (typeof modal.showModal === 'function') modal.showModal();
    else modal.setAttribute('open', '');
  } catch (e) {
    modal.setAttribute('open', '');
  }
}

// ---- Navegação Base (Bottom Nav e Cards da Home) ----
function initNavigation() {
  function switchTab(targetView) {
    // Atualiza a visualização da seção principal
    sections.forEach(sec => {
      if (sec.getAttribute('data-view') === targetView) {
        sec.classList.add('is-active');
        sec.classList.remove('is-hidden');
      } else {
        sec.classList.remove('is-active');
        sec.classList.add('is-hidden');
      }
    });

    // Atualiza os ícones ativos no bottom nav
    navItems.forEach(nav => {
      if (nav.getAttribute('data-view-target') === targetView) {
        nav.classList.add('is-active');
      } else {
        nav.classList.remove('is-active');
      }
      // Força a atualização dos ícones (necessário para lucide se houver mudança de cor estrutural forte, mas CSS resolve isso)
    });

    // Scroll para o topo
    document.querySelector('.content-container').scrollTo({ top: 0, behavior: 'smooth' });
  }

  navItems.forEach(item => {
    item.addEventListener('click', () => {
      switchTab(item.getAttribute('data-view-target'));
    });
  });

  actionCards.forEach(card => {
    card.addEventListener('click', (e) => {
      e.preventDefault();
      switchTab(card.getAttribute('data-link'));
    });
  });

  if (btnGoogleDrive) {
    btnGoogleDrive.addEventListener('click', () => {
      window.open(GOOGLE_DRIVE_LINK, '_blank');
    });
  }
}

// ---- Helper Date ----
function excelDateToJSDate(excelDate) {
  // 25569 = Days between 1900-01-01 and 1970-01-01. Excel considera 1900 como bissexto (bug histórico), por isso -1
  const jsDate = new Date((excelDate - (25569 + 1)) * 86400 * 1000);
  // Ajuste de Timezone se necessário para manter o dia correto localmente
  return new Date(jsDate.getUTCFullYear(), jsDate.getUTCMonth(), jsDate.getUTCDate());
}

function parseHoraExcel(fraction) {
  if (typeof fraction === 'string') {
    const raw = fraction.trim();
    if (!raw) return '';

    // Normalize common PT-BR time formats:
    // - "8hs" -> "08h"
    // - "11:00hs" -> "11:00h"
    // - "07:00" -> "07:00h"
    const compact = raw.toLowerCase().replace(/\s+/g, '');
    const m = compact.match(/^(\d{1,2})(?::(\d{2}))?(?:h|hs)?$/);
    if (m) {
      const hh = m[1].padStart(2, '0');
      const mm = m[2];
      return mm !== undefined ? `${hh}:${mm}h` : `${hh}h`;
    }

    return raw.replace(/hs\b/gi, 'h');
  }
  if (typeof fraction !== 'number') return '';
  const totalSeconds = Math.round(fraction * 86400);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}h`;
}

// ---- Agenda ----
function initAgenda() {
  const dayTabsContainer = document.getElementById('agenda-day-tabs');
  const scheduleList = document.getElementById('schedule-list');

  if (!dayTabsContainer || !scheduleList || !agendaData) return;

  // Remove row cabecalho (idx 0) e possíveis em branco
  const validAgenda = agendaData.slice(1).filter(r => r["AGENDA EVENTO FACILITY - GESTORES"] || r["__EMPTY"]);

  // Agrupa por Dia
  const agendaAgrupada = {};
  validAgenda.forEach(item => {
    const diaNome = item["__EMPTY"] || "Outro"; // Nome do dia (2ª feira, 3ª feira)

    // Algumas linhas contêm string solta como "Suvinil", skip
    if (!item["__EMPTY_1"]) return;

    if (!agendaAgrupada[diaNome]) {
      agendaAgrupada[diaNome] = [];
    }

    agendaAgrupada[diaNome].push({
      titulo: translateFromPt(item["__EMPTY_1"]),
      localResponsavel: translateFromPt(item["__EMPTY_2"] || ''),
      horaInicio: parseHoraExcel(item["__EMPTY_3"] || ''),
      horaFim: parseHoraExcel(item["__EMPTY_4"] || ''),
      obs: translateFromPt(item["__EMPTY_5"] || '')
    });
  });

  const dias = Object.keys(agendaAgrupada);

  // Mapeamento de tabnames de semana para data conforme pedido
  const dayToDateMap = {
    '5ª feira': getCurrentLang() === 'en' ? 'Mar 5' : '5 de Mar',
    '2ª feira': getCurrentLang() === 'en' ? 'Mar 9' : '9 de Mar',
    '3ª feira': getCurrentLang() === 'en' ? 'Mar 10' : '10 de Mar',
    '4ª feira': getCurrentLang() === 'en' ? 'Mar 11' : '11 de Mar'
  };

  // Renderiza Tabs
  dayTabsContainer.innerHTML = '';
  dias.forEach((dia, index) => {
    const btn = document.createElement('button');
    btn.className = `day-pill ${index === 0 ? 'is-active' : ''}`;
    btn.type = 'button';
    btn.setAttribute('role', 'tab');

    // Converte nome ex: "2ª feira" para "26 Jan"
    btn.textContent = dayToDateMap[dia] || dia;

    btn.addEventListener('click', () => {
      // Update Active State
      dayTabsContainer.querySelectorAll('.day-pill').forEach(b => b.classList.remove('is-active'));
      btn.classList.add('is-active');
      renderAgendaDay(dia);
    });
    dayTabsContainer.appendChild(btn);
  });

  // Função de render principal
  function renderAgendaDay(diaNome) {
    scheduleList.innerHTML = '';
    const sessoes = agendaAgrupada[diaNome];

    if (!sessoes || sessoes.length === 0) {
      const msg = t('emptyScheduleDay') || 'Nenhuma atividade programada para este dia.';
      scheduleList.innerHTML = `<p style="text-align:center;color:var(--text-tertiary);padding:var(--spacing-xl) 0;">${msg}</p>`;
      return;
    }

    sessoes.forEach(sessao => {
      const el = createSessionCard(sessao);
      scheduleList.appendChild(el);
    });

    initIcons();
  }

  // Initial render do primeiro dia
  if (dias.length > 0) renderAgendaDay(dias[0]);
}

// ==== Componente Único de Card de Sessão ====
function createSessionCard(sessao) {
  const el = document.createElement('div');
  el.className = 'session-card';

  const timeHTML = sessao.horaFim
    ? `<span class="time-main">${sessao.horaInicio}</span><span class="time-sub">${t('until') || 'até'} ${sessao.horaFim}</span>`
    : `<span class="time-main">${sessao.horaInicio}</span>`;

  // Removido o ícone pois o conteúdo é variável (às vezes pessoa, às vezes local)
  const locHTML = sessao.localResponsavel
    ? `<div class="session-meta"><span>${sessao.localResponsavel}</span></div>`
    : '';

  const obsHTML = sessao.obs
    ? `<div class="session-meta"><span style="font-style:italic;">${sessao.obs}</span></div>`
    : '';

  el.innerHTML = `
    <div class="session-time">${timeHTML}</div>
    <div class="session-details">
        <h4 class="session-title">${sessao.titulo}</h4>
        ${locHTML}
        ${obsHTML}
    </div>
  `;
  return el;
}

// ==== Boas vindas dinâmica ====
function initWelcomeMessage() {
  const welcomeEl = document.getElementById('home-welcome-message');
  if (welcomeEl) {
    const userName = localStorage.getItem('logged_user_name');
    if (userName) {
      const firstName = userName.split(' ')[0];
      const template = t('welcomeNamed') || 'Olá {name}, seja muito bem-vindo!';
      welcomeEl.textContent = formatTemplate(template, { name: firstName });
    } else {
      welcomeEl.textContent = t('welcomeGeneric') || 'Olá, seja muito bem-vindo(a)!';
    }
  }
}

// ---- Home Highlights ----
function initHomeHighlights() {
  const hlContainer = document.getElementById('home-highlights-list');
  if (!hlContainer || !agendaData) return;

  initWelcomeMessage(); // Inicia mensagem da home em paralelo 

  // Pegamos os 2 primeiros itens válidos do primeiro dia para dar um gosto
  const validAgenda = agendaData.slice(1).filter(r => r["AGENDA EVENTO FACILITY - GESTORES"] && r["__EMPTY_1"]);
  const destaques = validAgenda.slice(0, 2);

  hlContainer.innerHTML = '';
  destaques.forEach(row => {
    const sessao = {
      titulo: translateFromPt(row["__EMPTY_1"]),
      localResponsavel: translateFromPt(row["__EMPTY_2"] || ''),
      horaInicio: parseHoraExcel(row["__EMPTY_3"] || ''),
      horaFim: parseHoraExcel(row["__EMPTY_4"] || ''),
      obs: translateFromPt(row["__EMPTY_5"] || '')
    };

    const el = createSessionCard(sessao);
    hlContainer.appendChild(el);
  });
  initIcons();
}

// ---- Networking ----
function initNetworking() {
  const ntList = document.getElementById('networking-list');
  const ntSearch = document.getElementById('networking-search');
  const ntCounter = document.getElementById('networking-counter');

  if (!ntList || !participantesData) return;

  // Format local data
  const validP = participantesData.filter(p => typeof p.NOME_COMP === 'string');

  // Title Case Helper (names/places)
  const titleCase = (str) => str.toLowerCase().split(' ').map(w => w.length > 2 ? w.charAt(0).toUpperCase() + w.slice(1) : w).join(' ');

  // Job title normalization (keep "de/da/do" lowercase, roman numerals uppercase, and space after dots)
  const JOB_STOPWORDS = new Set(['de', 'da', 'do', 'das', 'dos', 'e']);
  const isRomanNumeral = (token) => {
    const t = (token || '').toString().trim();
    return /^[ivxlcdm]+$/i.test(t) && t.length <= 6;
  };
  const toTitleWord = (word) => {
    const w = (word || '').toString();
    if (!w) return '';
    return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
  };
  const splitAffixes = (token) => {
    const t = (token || '').toString();
    const leading = (t.match(/^[\("'\[]+/) || [''])[0];
    const trailing = (t.match(/[\)"'\],;:]+$/) || [''])[0];
    const core = t.slice(leading.length, t.length - trailing.length);
    return { leading, core, trailing };
  };
  const formatJobCore = (core) => {
    const c = (core || '').toString();
    if (!c) return '';
    const lower = c.toLowerCase();
    if (JOB_STOPWORDS.has(lower)) return lower;
    if (isRomanNumeral(c)) return c.toUpperCase();

    // Abbreviations/segments separated by dots: GER.REC.HUMANOS -> Ger. Rec. Humanos
    if (c.includes('.')) {
      const hasTrailingDot = c.endsWith('.');
      const parts = c.split('.').filter(p => p.length > 0);
      const formattedParts = parts.map(p => {
        const pl = p.toLowerCase();
        if (JOB_STOPWORDS.has(pl)) return pl;
        if (isRomanNumeral(p)) return p.toUpperCase();
        return toTitleWord(p);
      });
      let joined = formattedParts.join('. ');
      if (hasTrailingDot) joined += '.';
      return joined;
    }

    return toTitleWord(c);
  };
  const formatJobTitle = (value) => {
    const raw = (value || '').toString().trim();
    if (!raw) return '';
    return raw
      .replace(/\s+/g, ' ')
      .split(' ')
      .map(token => {
        const { leading, core, trailing } = splitAffixes(token);
        return leading + formatJobCore(core) + trailing;
      })
      .join(' ');
  };

  const formatedParticipants = validP.map(p => {
    const fullName = titleCase(p.NOME_COMP);
    const nameParts = fullName.split(' ');
    const iniciais = nameParts.length > 1 ? (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase() : fullName.substring(0, 2).toUpperCase();

    const rawCargo = (p.CARGO || '').toString().trim();
    const cargoPt = rawCargo ? formatJobTitle(rawCargo) : (t('defaultRole') || 'Participante');
    let cargoEn = rawCargo ? translateFromPt(rawCargo) : (t('defaultRole') || 'Participant');
    if (rawCargo && cargoEn === rawCargo) {
      const normalizedPt = formatJobTitle(rawCargo);
      const translated = translateFromPt(normalizedPt);
      if (translated && translated !== normalizedPt) cargoEn = translated;
    }
    const cargoDisplay = getCurrentLang() === 'en' ? cargoEn : cargoPt;

    const photoFile = getPhotoFileForPersonName(fullName);

    return {
      nome: fullName,
      cargo: cargoDisplay,
      localidade: p.LOCALIDADE ? titleCase(p.LOCALIDADE) : 'Sherwin-Williams',
      email: (p.E_MAIL || '').trim().toLowerCase(),
      iniciais: iniciais,
      photoFile
    };
  }).sort((a, b) => a.nome.localeCompare(b.nome));

  // Only Sherwin emails in Networking tab
  const sherwinOnlyParticipants = formatedParticipants.filter(p => p.email.includes('@sherwin'));

  function renderList(list) {
    ntList.innerHTML = '';
    if (ntCounter) ntCounter.textContent = `${list.length} ${t('participants') || 'participantes'}`;

    list.forEach(p => {
      const el = document.createElement('div');
      el.className = 'participant-card';

      el.addEventListener('click', () => {
        openParticipantProfile(p);
      });

      const avatarHTML = p.photoFile
        ? `<img src="./assets/photos/${encodeFilePathSegment(p.photoFile)}" alt="${formatTemplate(t('photoAltNamed') || 'Photo of {name}', { name: p.nome })}" loading="lazy" decoding="async" />`
        : `${p.iniciais}`;

      const emailHTML = p.email ? `<div class="participant-email"><a href="mailto:${p.email}" style="color:var(--secondary-blue);text-decoration:underline;word-break:break-all;">${p.email}</a></div>` : '';

      el.innerHTML = `
            <div class="participant-avatar">${avatarHTML}</div>
                <div class="participant-info">
                    <h3 class="participant-name">${p.nome}</h3>
                    <div class="participant-role">${p.cargo}</div>
                    <div class="participant-location">
                        <i data-lucide="map-pin"></i> ${p.localidade}
                    </div>
                    ${emailHTML}
                </div>
            `;
      ntList.appendChild(el);
    });
    initIcons();
  }

  renderList(sherwinOnlyParticipants);

  if (ntSearch) {
    const placeholder = t('networkingSearchPlaceholder');
    if (placeholder) ntSearch.setAttribute('placeholder', placeholder);
  }

  // Filter Logic
  if (ntSearch) {
    ntSearch.addEventListener('input', (e) => {
      const t = e.target.value.toLowerCase();
      const filt = sherwinOnlyParticipants.filter(p =>
        p.nome.toLowerCase().includes(t) ||
        p.cargo.toLowerCase().includes(t) ||
        p.localidade.toLowerCase().includes(t)
      );
      renderList(filt);
    });
  }
}


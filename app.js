import { agendaData } from './assets/data/agenda.js';
import { participantesData } from './assets/data/participantes.js';

// ---- Configurações Globais ----
const GOOGLE_DRIVE_LINK = "https://drive.google.com/drive/folders/1LXQjov_59-Q_5Xs01n-C_tBIDnFtPGGC?usp=sharing";

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

const supabaseConfig = {
  url: 'https://kjwlboqqdufrkhcxjppf.supabase.co',
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtqd2xib3FxZHVmcmtoY3hqcHBmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzMyOTU2OCwiZXhwIjoyMDc4OTA1NTY4fQ.t30eEhmv9uVv-FEDoDKKwrgb6lfj6NUYEnTl47bydsw',
};

let supabaseClient = null;

function setError(input, message) {
  const errorElement = document.querySelector(`.field-error[data-error-for="${input.id}"]`);
  if (errorElement) {
    errorElement.textContent = message || '';
  }
}

function validateEmail(value) {
  if (!value) return 'Informe seu e-mail corporativo';
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(value)) return 'Digite um e-mail válido';
  return '';
}

function validatePassword(value) {
  if (!value) return 'Informe sua senha';
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
    alert('Erro: A biblioteca do Supabase não foi carregada.');
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
      setError(passwordInput, 'E-mail ou senha inválidos');
    } else {
      setError(passwordInput, 'Não foi possível conectar. Verifique sua conexão e tente novamente.');
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
    newPasswordError = 'Informe a nova senha';
  }

  let confirmPasswordError = '';
  if (!confirmPassword) {
    confirmPasswordError = 'Confirme a nova senha';
  } else if (newPassword && newPassword !== confirmPassword) {
    confirmPasswordError = 'As senhas não conferem';
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
      alert('Não foi possível redefinir a senha. Tente novamente.');
      return;
    }

    if (!data) {
      setError(resetEmailInput, 'E-mail não encontrado');
      return;
    }

    alert('Senha redefinida com sucesso! Use a nova senha para entrar.');
    emailInput.value = email;
    passwordInput.value = '';
    switchToLoginMode();
    passwordInput.focus();
  } catch (error) {
    console.error(error);
    alert('Não foi possível redefinir a senha. Tente novamente.');
  } finally {
    setLoading(false, resetSubmitButton);
  }
});

// ---- Inicialização ----
document.addEventListener('DOMContentLoaded', () => {
  initIcons();
  initNavigation();
  initAgenda();
  initNetworking();
  initHomeHighlights();
});

function initIcons() {
  if (window.lucide) {
    window.lucide.createIcons();
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
  if (typeof fraction === 'string') return fraction.replace('hs', 'h');
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
      titulo: item["__EMPTY_1"],
      localResponsavel: item["__EMPTY_2"] || '',
      horaInicio: parseHoraExcel(item["__EMPTY_3"] || ''),
      horaFim: parseHoraExcel(item["__EMPTY_4"] || ''),
      obs: item["__EMPTY_5"] || ''
    });
  });

  const dias = Object.keys(agendaAgrupada);

  // Mapeamento de tabnames de semana para data conforme pedido
  const dayToDateMap = {
    '2ª feira': '26 de Jan',
    '3ª feira': '27 de Jan',
    '4ª feira': '28 de Jan'
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
      scheduleList.innerHTML = '<p style="text-align:center;color:var(--text-tertiary);padding:var(--spacing-xl) 0;">Nenhuma atividade programada para este dia.</p>';
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
    ? `<span class="time-main">${sessao.horaInicio}</span><span class="time-sub">até ${sessao.horaFim}</span>`
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
      welcomeEl.textContent = `Olá ${firstName}, seja muito bem-vindo!`;
    } else {
      welcomeEl.textContent = `Olá, seja muito bem-vindo(a)!`;
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
      titulo: row["__EMPTY_1"],
      localResponsavel: row["__EMPTY_2"] || '',
      horaInicio: parseHoraExcel(row["__EMPTY_3"] || ''),
      horaFim: parseHoraExcel(row["__EMPTY_4"] || ''),
      obs: row["__EMPTY_5"] || ''
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

  // Title Case Helper
  const titleCase = (str) => str.toLowerCase().split(' ').map(w => w.length > 2 ? w.charAt(0).toUpperCase() + w.slice(1) : w).join(' ');

  const formatedParticipants = validP.map(p => {
    const fullName = titleCase(p.NOME_COMP);
    const nameParts = fullName.split(' ');
    const iniciais = nameParts.length > 1 ? (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase() : fullName.substring(0, 2).toUpperCase();

    return {
      nome: fullName,
      cargo: p.CARGO ? titleCase(p.CARGO) : 'Participante',
      localidade: p.LOCALIDADE ? titleCase(p.LOCALIDADE) : 'Sherwin-Williams',
      email: (p.E_MAIL || '').toLowerCase(),
      iniciais: iniciais
    };
  }).sort((a, b) => a.nome.localeCompare(b.nome));

  function renderList(list) {
    ntList.innerHTML = '';
    if (ntCounter) ntCounter.textContent = `${list.length} participantes`;

    list.forEach(p => {
      const el = document.createElement('div');
      el.className = 'participant-card';

      const emailHTML = p.email ? `<div class="participant-email"><a href="mailto:${p.email}" style="color:var(--secondary-blue);text-decoration:underline;word-break:break-all;">${p.email}</a></div>` : '';

      el.innerHTML = `
                <div class="participant-avatar">${p.iniciais}</div>
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

  renderList(formatedParticipants);

  // Filter Logic
  if (ntSearch) {
    ntSearch.addEventListener('input', (e) => {
      const t = e.target.value.toLowerCase();
      const filt = formatedParticipants.filter(p =>
        p.nome.toLowerCase().includes(t) ||
        p.cargo.toLowerCase().includes(t) ||
        p.localidade.toLowerCase().includes(t)
      );
      renderList(filt);
    });
  }
}


/* ==================================================================
   JuriAI - Engine 2.0
   SPA com Tailwind + Vanilla JS
================================================================== */

/* ================== ESTADO GLOBAL ================== */

const DEFAULT_STATE = {
    user: {
        name: 'Dr. BitBloom',
        email: 'advogado@juriai.com',
        credits: 150,
        plan: 'PRO',
    },
    stats: {
        petitionsCount: 42,
        lastActivity: new Date().toISOString(),
    },
    documents: [
        {
            id: 1,
            title: 'Ação de Indenização - Silva vs Gol',
            area: 'Consumidor',
            status: 'Finalizado',
            date: '18/11/2025',
            content: '<p>Conteúdo simulado da petição...</p>'
        },
        {
            id: 2,
            title: 'Contestação Trabalhista',
            area: 'Trabalhista',
            status: 'Rascunho',
            date: '15/11/2025',
            content: '<p>Conteúdo simulado da contestação...</p>'
        }
    ],
    isLoggedIn: false,
    currentSection: 'landing-page',
};

let appState = loadState() || structuredClone(DEFAULT_STATE);

/* ================== BOOT ================== */

document.addEventListener('DOMContentLoaded', () => {
    initApp();
});

function initApp() {
    injectHelperStyles();
    setupAuth();
    setupDashboardActions();
    updateUI();

    if (appState.isLoggedIn) {
        navigateTo('app-wrapper');
        switchTab('dashboard');
    } else {
        navigateTo('landing-page');
    }
}

/* ================== PERSISTÊNCIA ================== */

function saveState() {
    try {
        localStorage.setItem('juriai_state', JSON.stringify(appState));
    } catch (e) {
        console.warn('❌ Falha ao salvar estado', e);
    }
}

function loadState() {
    try {
        const raw = localStorage.getItem('juriai_state');
        return raw ? JSON.parse(raw) : null;
    } catch {
        localStorage.removeItem('juriai_state');
        return null;
    }
}

/* ======================================================
   ================== NAVEGAÇÃO GLOBAL ==================
   ====================================================== */

window.navigateTo = function(targetId) {

    const pages = ['landing-page', 'login-page', 'signup-page', 'app-wrapper'];

    pages.forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;

        el.classList.add('hidden');

        if (id === 'app-wrapper') el.classList.remove('flex');
        if (el.tagName === 'SECTION') el.classList.remove('block');
    });

    const target = document.getElementById(targetId);

    if (target) {
        target.classList.remove('hidden');

        if (targetId === 'app-wrapper') {
            target.classList.add('flex');
            switchTab('dashboard');
        } else {
            scrollTo({ top: 0, behavior: 'smooth' });
        }
    }

    if (['landing-page', 'login-page', 'signup-page'].includes(targetId)) {
        appState.currentSection = targetId;
        saveState();
    }
};

/* ================== SWITCH DE TABS DO DASHBOARD ================== */

window.switchTab = function(tabId) {

    if (!appState.isLoggedIn) return;

    document.querySelectorAll('.app-section').forEach(sec => sec.classList.add('hidden'));

    const target = document.getElementById(tabId);
    if (target) {
        target.classList.remove('hidden');
        target.classList.add('animate-fade-in');
        setTimeout(() => target.classList.remove('animate-fade-in'), 400);
    }

    updateSidebarActiveState(tabId);
};

function updateSidebarActiveState(activeTabId) {
    document.querySelectorAll('.nav-item').forEach(btn => {

        btn.classList.remove('bg-primary-50', 'text-primary-700');
        btn.classList.add('text-slate-600');

        const onclick = btn.getAttribute('onclick');

        if (onclick && onclick.includes(`'${activeTabId}'`)) {
            btn.classList.remove('text-slate-600');
            btn.classList.add('bg-primary-50', 'text-primary-700');
        }
    });
}

/* ================== AUTENTICAÇÃO ================== */

function setupAuth() {

    /* LOGIN */
    const loginForm = document.querySelector('#login-page form');

    if (loginForm) {
        loginForm.onsubmit = (e) => {
            e.preventDefault();

            const email = loginForm.querySelector('input[type="email"]').value;
            const namePart = email.split('@')[0];

            appState.user.email = email;
            appState.user.name = `Dr. ${namePart.charAt(0).toUpperCase() + namePart.slice(1)}`;
            appState.isLoggedIn = true;

            saveState();
            showToast(`Bem-vindo de volta, ${appState.user.name}!`, 'success');

            navigateTo('app-wrapper');
            updateUI();
        };
    }

    /* SIGNUP */
    const signupForm = document.querySelector('#signup-page form');

    if (signupForm) {
        signupForm.onsubmit = (e) => {
            e.preventDefault();

            const nome = signupForm.querySelectorAll('input[type="text"]')[0].value;
            const sobrenome = signupForm.querySelectorAll('input[type="text"]')[1].value;
            const email = signupForm.querySelector('input[type="email"]').value;

            appState.user.name = `Dr. ${nome} ${sobrenome}`;
            appState.user.email = email;
            appState.user.credits = 20;
            appState.isLoggedIn = true;

            saveState();
            showToast('Conta criada com sucesso! +20 créditos 🎉', 'success');

            navigateTo('app-wrapper');
            updateUI();
        };
    }

    /* LOGOUT */
    const logoutBtn = document.querySelector('aside button .ph-sign-out')?.closest('button');

    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            appState.isLoggedIn = false;
            saveState();
            showToast('Sessão encerrada.', 'info');
        });
    }
}

/* ================== AÇÕES DO DASHBOARD ================== */

function setupDashboardActions() {

    const generateBtn = document.getElementById('generate-btn');
    if (generateBtn) generateBtn.addEventListener('click', handleGeneratePetition);

    window.addText = function(text) {
        const area = document.getElementById('petition-input');
        if (!area) return;

        area.value += (area.value ? " " : "") + text;
        area.focus();
    };

    const creditButtons = document.querySelectorAll('#buy-credits button');
    creditButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const card = e.target.closest('div');

            if (card.innerText.includes('20 créditos')) addCredits(20);
            if (card.innerText.includes('100 créditos')) addCredits(100);
            if (card.innerText.includes('300 créditos')) addCredits(300);
        });
    });
}

/* ================== GERADOR IA (SIMULAÇÃO) ================== */

async function handleGeneratePetition() {

    const inputEl = document.getElementById('petition-input');
    const areaEl = document.getElementById('select-area');
    const btn = document.getElementById('generate-btn');

    const loadingOverlay = document.getElementById('loading-overlay');
    const editorPlaceholder = document.getElementById('editor-placeholder');
    const outputContainer = document.getElementById('output-container');

    if (!inputEl.value.trim()) {
        showToast('Você precisa descrever o caso.', 'warning');
        inputEl.focus();
        return;
    }

    if (appState.user.credits < 5) {
        showToast('Créditos insuficientes!', 'error');
        switchTab('buy-credits');
        return;
    }

    btn.disabled = true;
    const oldTxt = btn.innerHTML;
    btn.innerHTML = `<i class="ph-bold ph-spinner animate-spin"></i> Gerando...`;

    loadingOverlay?.classList.remove('hidden');

    await sleep(2500);

    const dataHoje = new Date().toLocaleDateString('pt-BR');

    const generated = `
        <h2 class="text-center font-bold">PEÇA GERADA VIA IA</h2>
        <p><strong>Área:</strong> ${areaEl.value}</p>
        <p><strong>Data:</strong> ${dataHoje}</p>
        <hr><br>
        <p>${inputEl.value}</p>
    `;

    loadingOverlay?.classList.add('hidden');
    editorPlaceholder?.classList.add('hidden');

    outputContainer.innerHTML = generated;
    outputContainer.classList.remove('hidden');

    appState.user.credits -= 5;
    appState.stats.petitionsCount++;

    appState.documents.unshift({
        id: Date.now(),
        title: `Petição IA - ${areaEl.value}`,
        area: areaEl.value,
        status: 'Finalizado',
        date: dataHoje,
        content: generated
    });

    saveState();
    updateUI();

    btn.disabled = false;
    btn.innerHTML = oldTxt;

    showToast('Petição gerada com sucesso! (-5 créditos)', 'success');
}

/* ================== DOCUMENTOS ================== */

window.loadDocument = function(id) {
    const doc = appState.documents.find(x => x.id === id);

    if (!doc) return;

    document.getElementById('output-container').innerHTML = doc.content;
    document.getElementById('output-container').classList.remove('hidden');

    document.getElementById('editor-placeholder')?.classList.add('hidden');

    switchTab('ai-generator');
    showToast('Documento carregado.', 'info');
};

window.deleteDocument = function(id) {
    if (!confirm('Deseja realmente excluir este documento?')) return;

    appState.documents = appState.documents.filter(x => x.id !== id);

    saveState();
    updateUI();
    showToast('Documento excluído.', 'info');
};

function renderDocumentsTable() {
    const tbody = document.querySelector('#my-documents tbody');
    if (!tbody) return;

    tbody.innerHTML = '';

    if (appState.documents.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="p-6 text-center text-slate-400">Nenhum documento encontrado.</td></tr>`;
        return;
    }

    appState.documents.forEach(doc => {
        const tr = document.createElement('tr');

        tr.className = "border-b hover:bg-slate-50 transition";

        tr.innerHTML = `
            <td class="px-6 py-4 font-medium flex items-center gap-3">
                <div class="p-1.5 rounded bg-blue-100 text-blue-600"><i class="ph-fill ph-file-text"></i></div>
                ${doc.title}
            </td>
            <td class="px-6 py-4">${doc.area}</td>
            <td class="px-6 py-4">
                <span class="px-2 py-1 rounded-full text-xs font-bold ${doc.status === 'Finalizado' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}">
                    ${doc.status}
                </span>
            </td>
            <td class="px-6 py-4">${doc.date}</td>
            <td class="px-6 py-4 text-right">
                <button onclick="loadDocument(${doc.id})" class="text-slate-400 hover:text-primary-600"><i class="ph-bold ph-eye"></i></button>
                <button onclick="deleteDocument(${doc.id})" class="text-slate-400 hover:text-red-500 ml-3"><i class="ph-bold ph-trash"></i></button>
            </td>
        `;

        tbody.appendChild(tr);
    });
}

/* ================== UI UPDATES ================== */

function updateUI() {

    const nameEl = document.querySelector('#dashboard h2 span');
    if (nameEl) nameEl.innerText = appState.user.name.split(' ')[1] || 'Advogado';

    const creditsEl = document.getElementById('stat-credits');
    const petitionsEl = document.getElementById('stat-petitions');

    if (creditsEl) creditsEl.innerText = appState.user.credits;
    if (petitionsEl) petitionsEl.innerText = appState.stats.petitionsCount;

    renderDocumentsTable();
}

/* ================== HELPERS ================== */

function addCredits(amount) {
    appState.user.credits += amount;
    saveState();
    updateUI();
    showToast(`+${amount} créditos adicionados!`, 'success');
}

function sleep(ms) {
    return new Promise(res => setTimeout(res, ms));
}

function injectHelperStyles() {
    const style = document.createElement('style');
    style.innerHTML = `
        .animate-fade-in { animation: fadeIn .4s ease; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(5px);} to { opacity: 1; transform: translateY(0);} }
    `;
    document.head.appendChild(style);
}

/* ================== TOAST SYSTEM ================== */

function showToast(message, type = 'info') {

    const colors = {
        success: 'border-emerald-500',
        error: 'border-red-500',
        warning: 'border-amber-500',
        info: 'border-primary-500'
    };

    const icons = {
        success: '<i class="ph-fill ph-check-circle text-emerald-600 text-xl"></i>',
        error: '<i class="ph-fill ph-warning-circle text-red-600 text-xl"></i>',
        warning: '<i class="ph-fill ph-warning text-amber-600 text-xl"></i>',
        info: '<i class="ph-fill ph-info text-primary-500 text-xl"></i>',
    };

    let container = document.getElementById('toast-container');

    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        container.className = 'fixed top-5 right-5 z-[9999] flex flex-col gap-3';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `
        toast-notification 
        pointer-events-auto 
        bg-white shadow-lg border-l-4 p-4 rounded-lg flex items-center gap-3 w-72
        ${colors[type]}
    `;

    toast.innerHTML = `
        ${icons[type]}
        <span class="text-sm font-medium text-slate-700">${message}</span>
    `;

    container.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(20px)';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

window.openSettingsTab = function(tab) {
    document.querySelectorAll('.settings-tab').forEach(t => t.classList.add('hidden'));

    document.getElementById(`settings-${tab}`).classList.remove('hidden');
};

window.saveSettingsProfile = function() {
    const name = document.getElementById('settings-name').value;
    const email = document.getElementById('settings-email').value;

    if(name.trim().length < 3) return showToast('Nome inválido.', 'warning');
    if(!email.includes('@')) return showToast('E-mail inválido.', 'warning');

    appState.user.name = name;
    appState.user.email = email;
    saveState();

    updateUI();
    showToast('Perfil atualizado com sucesso!', 'success');
};
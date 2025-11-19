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

/* ================== GERADOR IA (ATUALIZADO) ================== */

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

    // Estado de Loading
    btn.disabled = true;
    const oldTxt = btn.innerHTML;
    btn.innerHTML = `<i class="ph-bold ph-spinner animate-spin"></i> Escrevendo Petição...`;

    loadingOverlay?.classList.remove('hidden');

    // Simulação de tempo de resposta da IA
    await sleep(2500);

    const dataHoje = new Date().toLocaleDateString('pt-BR');
    const area = areaEl.value.split(' - ')[0]; // Pega só a área (Ex: Cível)
    const acao = areaEl.value.split(' - ')[1] || 'Ação Judicial'; // Pega o tipo (Ex: Indenizatória)

    // Geração do Template Jurídico Rico
    const generated = `
        <div class="font-serif text-justify leading-relaxed text-slate-900">
            <p class="text-center font-bold uppercase mb-8 text-sm">EXCELENTÍSSIMO SENHOR DOUTOR JUIZ DE DIREITO DA ___ VARA ${area.toUpperCase()} DA COMARCA DE SÃO PAULO/SP</p>

            <p class="mb-6">
                <strong>REQUERENTE</strong>, nacionalidade, estado civil, profissão, portador do RG nº XX.XXX.XXX-X, inscrito no CPF/MF sob o nº XXX.XXX.XXX-XX, residente e domiciliado na Rua Exemplo, nº 000, Bairro, Cidade/UF, vem, respeitosamente, à presença de Vossa Excelência, por seu advogado infra-assinado, propor a presente
            </p>

            <h3 class="text-center font-bold text-lg mb-6 uppercase border-y border-slate-200 py-2">
                ${areaEl.value.toUpperCase()}
            </h3>

            <p class="mb-8">
                em face de <strong>REQUERIDA S.A.</strong>, pessoa jurídica de direito privado, inscrita no CNPJ sob o nº XX.XXX.XXX/0001-XX, com sede na Rua da Empresa, nº 1000, pelos motivos de fato e de direito a seguir expostos:
            </p>

            <h4 class="font-bold uppercase text-sm border-b border-slate-300 pb-1 mb-3 mt-6">I. DOS FATOS</h4>
            <p class="mb-4 text-slate-800">${inputEl.value}</p>
            <p class="mb-4">Diante de tal cenário, restou infrutífera a tentativa de resolução amigável, não restando alternativa ao Autor senão socorrer-se do Poder Judiciário.</p>

            <h4 class="font-bold uppercase text-sm border-b border-slate-300 pb-1 mb-3 mt-6">II. DO DIREITO</h4>
            <p class="mb-4">A pretensão do Autor encontra amparo na legislação pátria e na jurisprudência consolidada dos Tribunais Superiores.</p>
            
            <div class="bg-slate-50 p-4 border-l-4 border-slate-300 text-sm italic text-slate-600 my-4">
                "Aquele que, por ação ou omissão voluntária, negligência ou imprudência, violar direito e causar dano a outrem, ainda que exclusivamente moral, comete ato ilícito." (Art. 186, Código Civil).
            </div>
            
            <p class="mb-4">Fica evidente o nexo causal entre a conduta da Ré e o dano suportado pelo Autor.</p>

            <h4 class="font-bold uppercase text-sm border-b border-slate-300 pb-1 mb-3 mt-6">III. DOS PEDIDOS</h4>
            <p class="mb-2">Diante do exposto, requer:</p>
            <ol class="list-decimal pl-10 space-y-2 mb-8">
                <li>A citação da Ré para, querendo, contestar a presente ação;</li>
                <li>A procedência total dos pedidos para condenar a Ré;</li>
                <li>A concessão dos benefícios da Justiça Gratuita;</li>
                <li>A condenação em custas processuais e honorários advocatícios.</li>
            </ol>

            <p class="mb-2">Dá-se à causa o valor de R$ 10.000,00 (dez mil reais).</p>

            <p class="text-center mt-12">Termos em que,<br>Pede deferimento.</p>
            <p class="text-center mt-6 font-bold">${dataHoje}<br>ADVOGADO<br>OAB/UF 000.000</p>
        </div>
    `;

    // Atualização da UI
    loadingOverlay?.classList.add('hidden');
    editorPlaceholder?.classList.add('hidden');

    outputContainer.innerHTML = generated;
    outputContainer.classList.remove('hidden');

    // Atualização do Estado
    appState.user.credits -= 5;
    appState.stats.petitionsCount++;

    appState.documents.unshift({
        id: Date.now(),
        title: `${acao} - ${area}`,
        area: area,
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
    if (nameEl) {
        // Fallback seguro caso o split falhe
        const parts = appState.user.name.split(' ');
        nameEl.innerText = parts.length > 1 ? parts[1] : parts[0];
    }

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
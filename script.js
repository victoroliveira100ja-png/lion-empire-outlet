document.addEventListener("DOMContentLoaded", () => {

    // ================= SIDEBAR =================

    function abrirSidebar() {
        const sidebar = document.getElementById('sidebar');
        const main = document.getElementById('mainContent');
        const reopenBtn = document.getElementById('reopenBtn');

        sidebar.classList.remove('fechada');
        main.classList.remove('cheia');
        reopenBtn.style.display = 'none';
    }

    function fecharSidebar() {
        const sidebar = document.getElementById('sidebar');
        const main = document.getElementById('mainContent');
        const reopenBtn = document.getElementById('reopenBtn');

        sidebar.classList.add('fechada');
        main.classList.add('cheia');
        reopenBtn.style.display = 'flex';
    }

    window.toggleSidebar = function() {
        const sidebar = document.getElementById('sidebar');
        sidebar.classList.contains('fechada') ? abrirSidebar() : fecharSidebar();
    };

    // Estado inicial: sidebar sempre aberta
    (function initSidebar() {
        const sidebar = document.getElementById('sidebar');
        const main = document.getElementById('mainContent');
        const reopenBtn = document.getElementById('reopenBtn');
        sidebar.classList.remove('fechada');
        main.classList.remove('cheia');
        reopenBtn.style.display = 'none';
    })();

    // ================= SLIDER INFINITO =================
    window.moveSlider = function(sliderId, direction) {
        const slider = document.getElementById(sliderId);
        const scrollAmount = 310;
        if (!slider.dataset.cloned) {
            const cards = Array.from(slider.children);
            cards.forEach(card => {
                const clone = card.cloneNode(true);
                clone.setAttribute('aria-hidden', 'true');
                slider.appendChild(clone);
            });
            slider.scrollLeft = 0;
            slider.dataset.cloned = 'true';
        }
        const totalWidth = slider.scrollWidth;
        const half = totalWidth / 2;
        slider.scrollBy({ left: direction * scrollAmount, behavior: 'smooth' });
        setTimeout(() => {
            if (slider.scrollLeft >= half - 5) {
                slider.style.scrollBehavior = 'auto';
                slider.scrollLeft -= half;
                slider.style.scrollBehavior = '';
            }
            if (slider.scrollLeft <= 5) {
                slider.style.scrollBehavior = 'auto';
                slider.scrollLeft += half;
                slider.style.scrollBehavior = '';
            }
        }, 400);
    };

    // ================= BUSCA + AUTOCOMPLETE =================
    const searchInput = document.getElementById('searchInput');
    const searchClear = document.getElementById('searchClear');
    const searchDropdown = document.getElementById('searchDropdown');

    function normalize(text) {
        return text.toLowerCase()
            .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9 ]/g, '')
            .trim();
    }

    // Categorias precisas com exclusões
    const categories = {
        'tenis':    { must: ['tenis', 'teni', 'asics', 'damando', 'repplay', 'fitt shoes', 'raiden'], exclude: ['relogio', 'digital', 'kit', 'conjunto'] },
        'shorts':   { must: ['short', 'bermuda'], exclude: ['conjunto', 'kit', 'camiseta', 'camisa', 'calca'] },

        'calcas':   { must: ['calca', 'cargo', 'denim', 'desgastado'], exclude: ['bermuda', 'short', 'conjunto', 'kit'] },
        'bones':    { must: ['bone', 'bones', 'beisebol'], exclude: ['conjunto', 'kit'] },
        'time':     { must: ['sao paulo', 'corinthians', 'palmeiras', 'santos', 'atletico', 'flamengo', 'botafogo', 'vasco', 'fluminense', 'gremio', 'internacional', 'cruzeiro', 'torcedor', 'jogador'], exclude: [] },
        'premium':  { must: ['premium', 'camisa', 'camiseta'], exclude: ['conjunto', 'kit', 'tenis', 'moletom', 'torcedor', 'jogador', 'corinthians', 'palmeiras', 'flamengo', 'santos', 'botafogo', 'vasco', 'atletico', 'sao paulo', 'fluminense', 'gremio'] },
        'relogios': { must: ['relogio', 'digital'], exclude: ['tenis', 'teni', 'calcado'] },
        'moletom':  { must: ['moletom', 'moleton', 'fleece'], exclude: ['kit', 'conjunto'] },
        'camisa':   { must: ['camisa', 'camiseta'], exclude: ['torcedor', 'jogador', 'corinthians', 'palmeiras', 'flamengo', 'santos fc', 'botafogo', 'vasco', 'atletico', 'sao paulo fc', 'fluminense', 'gremio', 'conjunto', 'kit', 'moletom', '25/26', '24/25', '23/24'] },
        'jaqueta':  { must: ['jaqueta', 'casaco'], exclude: ['conjunto', 'kit'] },
        'kit':      { must: ['kit'], exclude: [] },
        'conjunto': { must: ['conjunto'], exclude: ['moletom'] },
        'chinelo':  { must: ['chinelo', 'chinelos', 'slide', 'asuna'], exclude: [] },
        'perfume':  { must: ['perfume', 'perfumes', 'fragancia', 'deo', 'colonia', 'kaiak', 'eau'], exclude: [] },
        'acessorio': { must: ['corrente', 'pulseira', 'colar', 'anel', 'brinco', 'carteira', 'cinto', 'grumet'], exclude: [] },
        'polo':     { must: ['polo'], exclude: ['conjunto', 'kit'] },
    };

    const catSearchMap = {
        'Shorts':      'shorts',
        'Bonés':       'bones',
        'Calças':      'calcas',
        'Time':        'time',
        'Premium':     'premium',
        'Relógios':    'relogios',
        'Tênis':       'tenis',
        'Acessórios':  'acessorio',
        'Perfumes':    'perfume',
        'Chinelos':    'chinelo',
    };

    function getCategoryForQuery(query) {
        const norm = normalize(query);
        for (const [cat, { must }] of Object.entries(categories)) {
            if (must.some(w => norm.includes(w)) || norm === cat) {
                return cat;
            }
        }
        return null;
    }

    function matchSearch(title, query) {
        const normTitle = normalize(title);
        const normQuery = normalize(query);

        if (!normQuery) return false;

        const titleWords = normTitle.split(' ');
        const queryWords = normQuery.split(' ').filter(w => w.length >= 1);

        // 1) Detecta categoria — tem prioridade sobre busca livre
        const cat = getCategoryForQuery(normQuery);
        if (cat) {
            const { must, exclude } = categories[cat];
            if (cat === 'camisa' || cat === 'premium') {
                const isTimeShirt = categories['time'].must.some(w => normTitle.includes(w));
                if (isTimeShirt) return false;
            }
            const hasRequired = must.some(w => normTitle.includes(w));
            const hasExcluded = exclude.some(w => normTitle.includes(w));
            return hasRequired && !hasExcluded;
        }

        // 2) Query com múltiplas palavras: todas devem bater no título
        if (queryWords.length > 1) {
            return queryWords.every(qw =>
                normTitle.includes(qw) || titleWords.some(tw => tw.startsWith(qw))
            );
        }

        // 3) Query de 1 palavra: só bate se for palavra exata ou prefixo (mín. 3 letras)
        if (normQuery.length >= 2) {
            if (titleWords.includes(normQuery)) return true;
            if (normQuery.length >= 3 && titleWords.some(w => w.startsWith(normQuery))) return true;
        }

        return false;
    }

    function applyFilter(query) {
        const allCards = document.querySelectorAll('.card');
        const resultsPage = document.getElementById('searchResultsPage');
        const contentMain = document.getElementById('contentMain');
        const resultsGrid = document.getElementById('searchResultsGrid');
        const resultsQuery = document.getElementById('searchResultsQuery');
        const resultsCount = document.getElementById('searchResultsCount');

        const normQuery = normalize(query);
        const cat = getCategoryForQuery(normQuery);
        const isCamisaFilter = cat === 'camisa' || cat === 'premium';
        const isBonesFilter = cat === 'bones' || normQuery === 'bones' || normQuery === 'bonés';
        const isSectionFilter = {
            'acessorio': 'sec-acessorios',
            'perfume': 'sec-perfumes',
            'chinelo': 'sec-chinelos',
        }[cat];

        const seen = new Set();
        const matched = [];

        allCards.forEach(c => {
            const title = c.querySelector('h3').textContent.trim();
            const section = c.closest('section');

            if (isCamisaFilter && section && section.id === 'sec-times') return;

            if (isBonesFilter) {
                if (!section || section.id !== 'sec-bones') return;
                if (!seen.has(title)) { seen.add(title); matched.push(c); }
                return;
            }

            if (isSectionFilter) {
                if (!section || section.id !== isSectionFilter) return;
                if (!seen.has(title)) { seen.add(title); matched.push(c); }
                return;
            }

            if (matchSearch(title, query) && !seen.has(title)) {
                seen.add(title);
                matched.push(c);
            }
        });

        resultsGrid.innerHTML = '';
        matched.forEach(card => {
            const clone = card.cloneNode(true);
            // Garante que o clone aparece mesmo vindo de seção oculta
            clone.style.cssText = 'display: block !important';
            resultsGrid.appendChild(clone);
        });

        resultsQuery.textContent = `"${query}"`;
        resultsCount.textContent = matched.length === 0
            ? 'Nenhum produto encontrado'
            : `${matched.length} produto${matched.length > 1 ? 's' : ''} encontrado${matched.length > 1 ? 's' : ''}`;

        resultsPage.classList.add('active');
        contentMain.classList.add('hidden');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            const query = searchInput.value.trim();
            if (!query) return;
            searchDropdown.classList.remove('active');
            applyFilter(query);
        }
    });

    searchInput.addEventListener('input', () => {
        const raw = searchInput.value;
        const query = raw.toLowerCase().trim();
        searchClear.style.opacity = query ? '1' : '0';
        searchClear.style.pointerEvents = query ? 'all' : 'none';

        searchDropdown.innerHTML = '';
        if (!query || query.length < 1) { searchDropdown.classList.remove('active'); return; }

        const allCards = document.querySelectorAll('.card');
        const seen = new Set();
        const matches = [];

        allCards.forEach(card => {
            const h3 = card.querySelector('h3');
            if (!h3) return;
            const title = h3.textContent.trim();
            if (matchSearch(title, query) && !seen.has(title)) {
                seen.add(title);
                matches.push({ name: title, card });
            }
        });

        if (matches.length === 0) {
            searchDropdown.innerHTML = '<div class="dropdown-empty">Nenhum produto encontrado</div>';
            searchDropdown.classList.add('active');
            return;
        }

        matches.slice(0, 8).forEach(({ name }) => {
            const item = document.createElement('div');
            item.className = 'dropdown-item';
            // Destaca o trecho digitado no nome
            const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const regex = new RegExp(`(${escaped})`, 'gi');
            const highlighted = name.replace(regex, '<mark>$1</mark>');
            item.innerHTML = '<i class="fas fa-tag"></i> ' + highlighted;
            item.addEventListener('click', () => {
                searchInput.value = name;
                searchDropdown.classList.remove('active');
                applyFilter(name);
            });
            searchDropdown.appendChild(item);
        });

        // Se tiver mais resultados, mostra contador no final
        if (matches.length > 8) {
            const more = document.createElement('div');
            more.className = 'dropdown-more';
            more.textContent = `+ ${matches.length - 8} produto(s) — pressione Enter para ver todos`;
            more.addEventListener('click', () => {
                searchDropdown.classList.remove('active');
                applyFilter(query);
            });
            searchDropdown.appendChild(more);
        }

        searchDropdown.classList.add('active');
    });

    document.addEventListener('click', (e) => {
        if (!e.target.closest('.search-wrapper')) {
            searchDropdown.classList.remove('active');
        }
    });

    window.clearSearch = function() {
        searchInput.value = '';
        searchClear.style.opacity = '0';
        searchClear.style.pointerEvents = 'none';
        searchDropdown.classList.remove('active');
        document.getElementById('searchResultsPage').classList.remove('active');
        document.getElementById('contentMain').classList.remove('hidden');
        searchInput.focus();
    };

    // ================= BANNERS =================
    const banners = document.querySelectorAll('.banner-categoria[data-filter]');
    banners.forEach(banner => {
        banner.style.cursor = 'pointer';
        banner.addEventListener('click', (e) => {
            e.preventDefault();
            const key = banner.getAttribute('data-filter');
            const label = banner.querySelector('h2').textContent.trim();
            searchInput.value = label;
            applyFilter(key);
        });
    });

    // ================= CATEGORIAS =================
    const cats = document.querySelectorAll('.cat');

    cats.forEach(cat => {
        cat.style.cursor = 'pointer';
        cat.addEventListener('click', () => {
            const label = cat.querySelector('p').textContent.trim();
            const key = catSearchMap[label];
            if (key) {
                searchInput.value = label;
                applyFilter(key);
            }
        });
    });

    // ================= MENU LATERAL =================
    const menuItems = document.querySelectorAll('.nav-item');

    menuItems.forEach(item => {
        item.addEventListener('click', () => {
            menuItems.forEach(i => i.classList.remove('active'));
            item.classList.add('active');
            const label = item.textContent.trim();
            if (label.includes('Início')) {
                clearSearch();
                window.scrollTo({ top: 0, behavior: 'smooth' });
                return;
            }
            let targetId = null;
            if (label.includes('Destaques')) targetId = 'sec-destaques';
            if (label.includes('Acessórios')) { applyFilter('acessorio'); return; }
            if (label.includes('Perfumes'))   { applyFilter('perfume');   return; }
            if (label.includes('Chinelos'))   { applyFilter('chinelo');   return; }
            if (targetId) {
                const section = document.getElementById(targetId);
                if (section) section.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });

});
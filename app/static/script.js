document.addEventListener('DOMContentLoaded', () => {
    // --- Theme Management ---
    const themeToggle = document.getElementById('themeToggle');
    const html = document.documentElement;
    
    // Initialize theme from localStorage or system preference
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        html.classList.add('dark');
    }
    
    themeToggle.addEventListener('click', () => {
        html.classList.toggle('dark');
        localStorage.setItem('theme', html.classList.contains('dark') ? 'dark' : 'light');
    });

    // Initialize Lucide icons
    if (window.lucide) {
        lucide.createIcons();
    }

    // --- DOM References ---
    const form = document.getElementById('uploadForm');
    const fileInput = document.getElementById('file');
    const dropZone = document.getElementById('dropZone');
    const dropText = document.getElementById('dropText');
    const fileInfo = document.getElementById('fileInfo');
    const fileName = document.getElementById('fileName');
    const jobDescription = document.getElementById('jobDescription');
    const selectedModelIdInput = document.getElementById('selectedModelId');
    const removeFileBtn = document.getElementById('removeFile');
    const submitBtn = document.getElementById('submitBtn');
    const btnText = document.getElementById('btnText');
    const loading = document.getElementById('loading');
    const result = document.getElementById('result');
    const responseCards = document.getElementById('responseCards');
    const copyBtn = document.getElementById('copyBtn');
    const errorDiv = document.getElementById('error');
    const errorMessage = document.getElementById('errorMessage');
    const retryBtn = document.getElementById('retryBtn');

    let currentFile = null;

    // --- Models dropdown UI (enhanced) ---
    let modelsData = [];

    // Default static metadata (fallback/enrichment)
    const staticModelsMeta = [
      { "id": "nex-agi/nex-n2-pro:free", "name": "Nex AGI: Nex-N2-Pro (free)", "context_length": 262144, "company": "Nex AGI", "rating": 3, "recommended": false, "badge": "New" },
      { "id": "nvidia/nemotron-3.5-content-safety:free", "name": "NVIDIA: Nemotron 3.5 Content Safety (free)", "context_length": 128000, "company": "NVIDIA", "rating": 4, "recommended": false, "badge": "Safety" },
      { "id": "nvidia/nemotron-3-ultra-550b-a55b:free", "name": "NVIDIA: Nemotron 3 Ultra (free)", "context_length": 1000000, "company": "NVIDIA", "rating": 5, "recommended": true, "badge": "🔥 Top" },
      { "id": "openrouter/owl-alpha", "name": "Owl Alpha", "context_length": 1048756, "company": "OpenRouter", "rating": 4, "recommended": false, "badge": "New" },
      { "id": "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free", "name": "NVIDIA: Nemotron 3 Nano Omni (free)", "context_length": 256000, "company": "NVIDIA", "rating": 4, "recommended": true, "badge": "Reasoning" },
      { "id": "poolside/laguna-xs.2:free", "name": "Poolside: Laguna XS.2 (free)", "context_length": 262144, "company": "Poolside", "rating": 3, "recommended": false, "badge": "Fast" },
      { "id": "poolside/laguna-m.1:free", "name": "Poolside: Laguna M.1 (free)", "context_length": 262144, "company": "Poolside", "rating": 3, "recommended": false, "badge": null },
      { "id": "moonshotai/kimi-k2.6:free", "name": "MoonshotAI: Kimi K2.6 (free)", "context_length": 262144, "company": "MoonshotAI", "rating": 4, "recommended": false, "badge": null },
      { "id": "google/gemma-4-26b-a4b-it:free", "name": "Google: Gemma 4 26B A4B (free)", "context_length": 262144, "company": "Google", "rating": 4, "recommended": true, "badge": "⚡ Fast" },
      { "id": "google/gemma-4-31b-it:free", "name": "Google: Gemma 4 31B (free)", "context_length": 262144, "company": "Google", "rating": 4, "recommended": true, "badge": "⚡ Fast" },
      { "id": "google/lyria-3-pro-preview", "name": "Google: Lyria 3 Pro Preview", "context_length": 1048576, "company": "Google", "rating": 5, "recommended": false, "badge": "Audio" },
      { "id": "google/lyria-3-clip-preview", "name": "Google: Lyria 3 Clip Preview", "context_length": 1048576, "company": "Google", "rating": 4, "recommended": false, "badge": "Audio" },
      { "id": "nvidia/nemotron-3-super-120b-a12b:free", "name": "NVIDIA: Nemotron 3 Super (free)", "context_length": 1000000, "company": "NVIDIA", "rating": 5, "recommended": true, "badge": "🔥 Top" },
      { "id": "openrouter/free", "name": "Free Models Router", "context_length": 200000, "company": "OpenRouter", "rating": 3, "recommended": true, "badge": "Auto" },
      { "id": "liquid/lfm-2.5-1.2b-thinking:free", "name": "LiquidAI: LFM2.5-1.2B-Thinking (free)", "context_length": 32768, "company": "LiquidAI", "rating": 3, "recommended": false, "badge": "Thinking" },
      { "id": "liquid/lfm-2.5-1.2b-instruct:free", "name": "LiquidAI: LFM2.5-1.2B-Instruct (free)", "context_length": 32768, "company": "LiquidAI", "rating": 3, "recommended": false, "badge": null },
      { "id": "nvidia/nemotron-3-nano-30b-a3b:free", "name": "NVIDIA: Nemotron 3 Nano 30B A3B (free)", "context_length": 256000, "company": "NVIDIA", "rating": 4, "recommended": false, "badge": null },
      { "id": "nvidia/nemotron-nano-12b-v2-vl:free", "name": "NVIDIA: Nemotron Nano 12B 2 VL (free)", "context_length": 128000, "company": "NVIDIA", "rating": 4, "recommended": false, "badge": "Vision" },
      { "id": "qwen/qwen3-next-80b-a3b-instruct:free", "name": "Qwen: Qwen3 Next 80B A3B Instruct (free)", "context_length": 262144, "company": "Qwen", "rating": 5, "recommended": true, "badge": "⭐ Best" },
      { "id": "nvidia/nemotron-nano-9b-v2:free", "name": "NVIDIA: Nemotron Nano 9B V2 (free)", "context_length": 128000, "company": "NVIDIA", "rating": 3, "recommended": false, "badge": null },
      { "id": "openai/gpt-oss-120b:free", "name": "OpenAI: gpt-oss-120b (free)", "context_length": 131072, "company": "OpenAI", "rating": 5, "recommended": true, "badge": "⭐ Best" },
      { "id": "openai/gpt-oss-20b:free", "name": "OpenAI: gpt-oss-20b (free)", "context_length": 131072, "company": "OpenAI", "rating": 4, "recommended": false, "badge": "⚡ Fast" },
      { "id": "qwen/qwen3-coder:free", "name": "Qwen: Qwen3 Coder 480B A35B (free)", "context_length": 1048576, "company": "Qwen", "rating": 5, "recommended": true, "badge": "💻 Code" },
      { "id": "cognitivecomputations/dolphin-mistral-24b-venice-edition:free", "name": "Venice: Uncensored (free)", "context_length": 32768, "company": "Venice", "rating": 3, "recommended": false, "badge": "Uncensored" },
      { "id": "meta-llama/llama-3.3-70b-instruct:free", "name": "Meta: Llama 3.3 70B Instruct (free)", "context_length": 131072, "company": "Meta", "rating": 5, "recommended": true, "badge": "⭐ Best" },
      { "id": "meta-llama/llama-3.2-3b-instruct:free", "name": "Meta: Llama 3.2 3B Instruct (free)", "context_length": 131072, "company": "Meta", "rating": 3, "recommended": false, "badge": "⚡ Fast" },
      { "id": "nousresearch/hermes-3-llama-3.1-405b:free", "name": "Nous: Hermes 3 405B Instruct (free)", "context_length": 131072, "company": "Nous", "rating": 4, "recommended": false, "badge": "Large" }
    ];

    // Helper utilities
    const companyColors = {
        "NVIDIA": "from-green-500 to-emerald-600",
        "Google": "from-blue-500 to-cyan-500",
        "OpenAI": "from-gray-700 to-gray-900",
        "Meta": "from-blue-600 to-indigo-700",
        "Qwen": "from-purple-500 to-pink-500",
        "Nex AGI": "from-red-500 to-orange-500",
        "Poolside": "from-cyan-400 to-blue-500",
        "MoonshotAI": "from-indigo-500 to-purple-600",
        "LiquidAI": "from-teal-500 to-cyan-600",
        "OpenRouter": "from-indigo-500 to-purple-500",
        "Venice": "from-rose-500 to-red-600",
        "Nous": "from-amber-500 to-orange-600"
    };

    // Кэш для загруженных SVG иконок
    const svgCache = {};

    function getCompanyIconFile(company) {
        const slugMap = {
            "NVIDIA": "nvidia",
            "Google": "google",
            "OpenAI": "openai",
            "Meta": "meta",
            "Qwen": "qwen",
            "OpenRouter": "openrouter",
            "MoonshotAI": "moonshot-ai",
            "LiquidAI": "liquid-ai",
            "Poolside": "poolside",
            "Venice": "venice",
            "Nous": "nous",
            "Nex AGI": "nex-agi",
        };
        return slugMap[company] || null;
    }

    async function loadSvgIcon(company) {
        const file = getCompanyIconFile(company);
        if (!file) return null;
        if (svgCache[company]) return svgCache[company];
        try {
            const resp = await fetch(`/assets/icons/${file}.svg`);
            if (!resp.ok) throw new Error('Not found');
            let text = await resp.text();
            text = text.replace(/<\?xml[^>]*>/g, '').trim();
            text = text.replace(/\s+fill="[^"]*"/g, '');
            text = text.replace(/\s+fill='[^']*'/g, '');
            text = text.replace(/<svg /, '<svg fill="white" ');
            svgCache[company] = text;
            return text;
        } catch {
            svgCache[company] = null;
            return null;
        }
    }

    function renderCompanyIcon(company, isSelected = false) {
        const size = isSelected ? "w-5 h-5" : "w-8 h-8";
        const gradient = companyColors[company] || "from-gray-500 to-gray-700";
        const cached = svgCache[company];

        if (cached) {
            return `
                <div class="${size} bg-gradient-to-br ${gradient} rounded-md flex items-center justify-center flex-shrink-0">
                    ${cached}
                </div>
            `;
        }

        // Fallback на инициалы
        const initials = getCompanyInitials(company);
        return `
            <div class="${size} bg-gradient-to-br ${gradient} rounded-md flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                ${initials}
            </div>
        `;
    }

    function getCompanyInitials(company) {
        if (!company) return 'AI';
        return company.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();
    }

    // Загружаем все SVG иконки при старте
    const allCompanies = Object.keys(companyColors);
    allCompanies.forEach(company => {
        loadSvgIcon(company).then(svg => {
            if (svg) svgCache[company] = svg;
        });
    });

    function renderStars(rating) {
        let html = '';
        for (let i = 1; i <= 5; i++) {
            if (i <= rating) {
                html += '<svg class="w-3 h-3 text-yellow-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>';
            } else {
                html += '<svg class="w-3 h-3 text-gray-300 dark:text-gray-600" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>';
            }
        }
        return html;
    }

    function getBadgeColor(badge) {
        if (!badge) return '';
        if (badge.includes('Best') || badge.includes('Top')) return 'bg-gradient-to-r from-amber-400 to-orange-500 text-white';
        if (badge.includes('Fast')) return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300';
        if (badge.includes('Code')) return 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300';
        if (badge.includes('New')) return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300';
        if (badge.includes('Vision')) return 'bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300';
        if (badge.includes('Audio')) return 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300';
        if (badge.includes('Safety')) return 'bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300';
        if (badge.includes('Thinking')) return 'bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300';
        if (badge.includes('Reasoning')) return 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300';
        if (badge.includes('Uncensored')) return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300';
        if (badge.includes('Auto')) return 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300';
        if (badge.includes('Large')) return 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300';
        return 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300';
    }

    function renderModelItem(model) {
        const gradient = companyColors[model.company] || "from-gray-500 to-gray-700";
        const contextK = Math.round((model.context_length || 0) / 1000);
        const iconHtml = renderCompanyIcon(model.company, false);
        return `
            <div class="model-item px-4 py-3 hover:bg-indigo-50 dark:hover:bg-gray-700 cursor-pointer transition-colors flex items-center space-x-3 ${model.recommended ? 'bg-indigo-50/30 dark:bg-indigo-900/10' : ''}" 
                 data-id="${model.id}" data-name="${(model.name||'').toLowerCase()}">
                <div class="w-9 h-9 rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0 shadow-sm bg-gradient-to-br ${gradient}">
                    ${iconHtml}
                </div>
                <div class="flex-1 min-w-0">
                    <div class="flex items-center space-x-2 mb-0.5">
                        <span class="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">${model.name || model.id}</span>
                        ${model.recommended ? '<span class="text-xs">⭐</span>' : ''}
                    </div>
                    <div class="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
                        <div class="flex items-center space-x-0.5">${renderStars(model.rating || 3)}</div>
                        <span>•</span>
                        <span>${contextK}k ctx</span>
                        <span>•</span>
                        <span>${model.company || ''}</span>
                    </div>
                </div>
                ${model.badge ? `<span class="text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${getBadgeColor(model.badge)}">${model.badge}</span>` : ''}
            </div>
        `;
    }

    function initModelDropdown() {
        const btn = document.getElementById('modelDropdownBtn');
        const menu = document.getElementById('modelDropdownMenu');
        const list = document.getElementById('modelList');
        const search = document.getElementById('modelSearch');
        const arrow = document.getElementById('dropdownArrow');
        const display = document.getElementById('selectedModelDisplay');
        const hiddenInput = document.getElementById('selectedModelId');

        const sortedModels = [...modelsData].sort((a, b) => {
            if (a.recommended && !b.recommended) return -1;
            if (!a.recommended && b.recommended) return 1;
            return (b.rating || 0) - (a.rating || 0);
        });

        function renderList(filter = '') {
            const filtered = sortedModels.filter(m => 
                (m.name || '').toLowerCase().includes(filter.toLowerCase()) ||
                (m.company || '').toLowerCase().includes(filter.toLowerCase())
            );

            if (filtered.length === 0) {
                list.innerHTML = '<div class="px-4 py-8 text-center text-gray-500 dark:text-gray-400 text-sm">No models found</div>';
                return;
            }

            const recommended = filtered.filter(m => m.recommended);
            const others = filtered.filter(m => !m.recommended);

            let html = '';
            if (recommended.length > 0 && !filter) {
                html += '<div class="px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase bg-gray-50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-700">⭐ Recommended</div>';
                html += recommended.map(renderModelItem).join('');
            } else if (recommended.length > 0) {
                html += recommended.map(renderModelItem).join('');
            }

            if (others.length > 0) {
                if (recommended.length > 0 && !filter) {
                    html += '<div class="px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase bg-gray-50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-700">All Models</div>';
                }
                html += others.map(renderModelItem).join('');
            }

            list.innerHTML = html;

            list.querySelectorAll('.model-item').forEach(item => {
                item.addEventListener('click', () => {
                    const id = item.dataset.id;
                    const model = modelsData.find(m => m.id === id);
                    if (model) selectModel(model);
                });
            });
        }

        function selectModel(model) {
            const gradient = companyColors[model.company] || "from-gray-500 to-gray-700";
            const iconHtml = renderCompanyIcon(model.company, true);

            display.innerHTML = `
                <div class="w-6 h-6 bg-gradient-to-br ${gradient} rounded-md flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                    ${iconHtml}
                </div>
                <span class="truncate font-medium text-gray-900 dark:text-gray-100">${model.name}</span>
                ${model.recommended ? '<span class="text-xs">⭐</span>' : ''}
            `;

            hiddenInput.value = model.id;
            closeMenu();
        }

        function openMenu() {
            menu.classList.remove('hidden');
            arrow.style.transform = 'rotate(180deg)';
            search.value = ''; 
            renderList(); 
            setTimeout(() => search.focus(), 50);
        }

        function closeMenu() { 
            menu.classList.add('hidden'); 
            arrow.style.transform = 'rotate(0deg)'; 
        }

        btn.addEventListener('click', (e) => { 
            e.stopPropagation(); 
            if (menu.classList.contains('hidden')) openMenu(); 
            else closeMenu(); 
        });
        
        search.addEventListener('input', (e) => renderList(e.target.value));
        search.addEventListener('click', (e) => e.stopPropagation());
        
        document.addEventListener('click', (e) => { 
            if (!document.getElementById('modelDropdownWrapper').contains(e.target)) closeMenu(); 
        });

        renderList();
    }

    // Fetch available models from backend and enrich with static metadata if possible
    (async function fetchModelsAndInit() {
        try {
            const resp = await fetch('/models-free/');
            if (!resp.ok) throw new Error('Failed to fetch models');
            const remote = await resp.json();

            modelsData = remote.map(r => {
                const found = staticModelsMeta.find(m => m.id === r.id);
                if (found) return found;
                const inferredCompany = (r.name || '').split(':')[0] || '';
                return { id: r.id, name: r.name || r.id, context_length: r.context_length || 0, company: inferredCompany.trim(), rating: 3, recommended: false, badge: null };
            });
        } catch (err) {
            console.warn('Could not fetch remote models, falling back to static list', err);
            modelsData = staticModelsMeta.slice();
        }

        initModelDropdown();
    })();

    // --- Utility Functions ---
    function resetUI() {
        result.classList.add('hidden');
        errorDiv.classList.add('hidden');
        loading.classList.add('hidden');
        submitBtn.disabled = false;
        btnText.textContent = 'Analyze Resume';
        responseCards.innerHTML = '';
        copyBtn.classList.add('hidden');
    }

    function showFileInfo(file) {
        fileName.textContent = `${file.name} (${(file.size / 1024).toFixed(1)} KB)`;
        fileInfo.classList.remove('hidden');
        dropText.textContent = 'Drag & drop a different PDF or';
    }

    function clearFileInput() {
        fileInput.value = '';
        currentFile = null;
        fileInfo.classList.add('hidden');
        dropText.textContent = 'Drag & drop your resume PDF here';
        resetUI();
    }

    function validateFile(file) {
        if (!file || file.type !== 'application/pdf') {
            alert('Please select a valid PDF file.');
            return false;
        }
        if (file.size > 5 * 1024 * 1024) {
            alert('File size must be less than 5MB.');
            return false;
        }
        return true;
    }

    function showError(message, details = '') {
        errorMessage.textContent = message + (details ? ` (${details})` : '');
        errorDiv.classList.remove('hidden');
        console.error('Upload error:', message, details);
    }

    // --- Drag & Drop ---
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, (e) => {
            e.preventDefault();
            e.stopPropagation();
        });
    });

    dropZone.addEventListener('dragover', () => dropZone.classList.add('dragover'));
    dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));

    dropZone.addEventListener('drop', (e) => {
        dropZone.classList.remove('dragover');
        const files = e.dataTransfer.files;
        if (files.length > 0 && validateFile(files[0])) {
            currentFile = files[0];
            fileInput.files = files;
            showFileInfo(files[0]);
            resetUI();
        }
    });

    dropZone.addEventListener('click', () => fileInput.click());

    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0 && validateFile(e.target.files[0])) {
            currentFile = e.target.files[0];
            showFileInfo(currentFile);
            resetUI();
        } else {
            clearFileInput();
        }
    });

    removeFileBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        clearFileInput();
    });

    // --- Result Parsing & Display ---
    function createListCard(title, items, colorClass = 'text-indigo-500') {
        const card = document.createElement('div');
        card.className = 'bg-gray-50 dark:bg-gray-700 rounded-xl p-5 border border-gray-200 dark:border-gray-600 shadow-sm';
        card.innerHTML = `
            <div class="flex items-start space-x-3">
                <div class="mt-1 flex-shrink-0 ${colorClass}">
                    <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 00-1.414 0L9 11.586 6.707 9.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l7-7a1 1 0 000-1.414z" clip-rule="evenodd"/></svg>
                </div>
                <div class="flex-1">
                    <h3 class="text-base font-semibold text-gray-800 dark:text-gray-100 mb-2">${title}</h3>
                    <ul class="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-2">${items
                        .map(item => `<li>${item}</li>`)
                        .join('')}</ul>
                </div>
            </div>
        `;
        return card;
    }

    function displayResult(data, meta = {}, rawText = '') {
        const analysis = data.analysis || data;
        const filename = data.filename || analysis.filename || '';

        responseCards.innerHTML = '';

        const headerCard = document.createElement('div');
        headerCard.className = 'bg-white dark:bg-gray-700 rounded-2xl p-5 border border-gray-200 dark:border-gray-600 shadow-sm';
        const summaryParagraph = document.createElement('p');
        summaryParagraph.className = 'mt-4 text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap';
        summaryParagraph.textContent = analysis.summary || 'No summary provided.';

        headerCard.innerHTML = `
            <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                    <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">Resume analysis</h3>
                    <p class="text-sm text-gray-500 dark:text-gray-400">${filename ? `File: ${filename}` : 'Match percentage and summary from AI.'}</p>
                </div>
                <span class="rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 px-4 py-2 text-sm font-semibold">Match ${analysis.match_percentage ?? 'N/A'}%</span>
            </div>
        `;
        headerCard.appendChild(summaryParagraph);
        responseCards.appendChild(headerCard);

        // Additional info card (model, duration, status)
        const infoCard = document.createElement('div');
        infoCard.className = 'bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700 shadow-sm flex items-start justify-between';
        const infoLeft = document.createElement('div');
        infoLeft.innerHTML = `
            <h4 class="text-sm font-semibold text-gray-800 dark:text-gray-100">Additional info</h4>
            <div class="text-xs text-gray-500 dark:text-gray-400 mt-2">
                <div>Model: <span class="font-medium text-gray-700 dark:text-gray-200">${meta.model || 'n/a'}</span></div>
                <div>Request time: <span class="font-medium text-gray-700 dark:text-gray-200">${meta.durationMs ? meta.durationMs + ' ms' : 'n/a'}</span></div>
                <div>Status: <span class="font-medium text-gray-700 dark:text-gray-200">${meta.status || 'n/a'}</span></div>
            </div>
        `;
        const rawBtn = document.createElement('button');
        rawBtn.className = 'text-sm text-indigo-600 dark:text-indigo-400 hover:underline';
        rawBtn.textContent = 'Show raw JSON';

        const rawPre = document.createElement('pre');
        rawPre.className = 'hidden mt-3 overflow-auto text-xs p-3 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded';
        rawPre.style.maxHeight = '240px';
        rawPre.textContent = rawText || JSON.stringify({ filename, analysis }, null, 2);

        rawBtn.addEventListener('click', () => {
            if (rawPre.classList.contains('hidden')) {
                rawPre.classList.remove('hidden');
                rawBtn.textContent = 'Hide raw JSON';
            } else {
                rawPre.classList.add('hidden');
                rawBtn.textContent = 'Show raw JSON';
            }
        });

        infoCard.appendChild(infoLeft);
        const right = document.createElement('div');
        right.appendChild(rawBtn);
        infoCard.appendChild(right);
        responseCards.appendChild(infoCard);
        responseCards.appendChild(rawPre);

        if (analysis.found_skills?.length) {
            responseCards.appendChild(createListCard('Found skills', analysis.found_skills, 'text-green-500'));
        }
        if (analysis.missing_skills?.length) {
            responseCards.appendChild(createListCard('Missing skills', analysis.missing_skills, 'text-red-500'));
        }
        if (analysis.recommendations?.length) {
            responseCards.appendChild(createListCard('Recommendations', analysis.recommendations, 'text-blue-500'));
        }

        result.classList.remove('hidden');
        copyBtn.classList.remove('hidden');
        copyBtn.dataset.rawText = JSON.stringify({ filename, analysis }, null, 2);
    }

    // --- Copy to Clipboard ---
    copyBtn.addEventListener('click', async () => {
        const text = copyBtn.dataset.rawText;
        if (!text) return;
        try {
            await navigator.clipboard.writeText(text);
            copyBtn.querySelector('span').textContent = 'Copied!';
            setTimeout(() => {
                copyBtn.querySelector('span').textContent = 'Copy';
            }, 2000);
        } catch (err) {
            alert('Failed to copy text.');
        }
    });

    // --- Form Submit ---
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        if (!currentFile) {
            alert('Please select a PDF file first.');
            return;
        }

        resetUI();
        result.classList.add('hidden');
        errorDiv.classList.add('hidden');
        loading.classList.remove('hidden');
        submitBtn.disabled = true;
        btnText.textContent = 'Analyzing...';

        const formData = new FormData();
        formData.append('file', currentFile);
        formData.append('job_description', jobDescription.value.trim());
        formData.append('model', selectedModelIdInput.value || 'google/gemma-4-31b-it:free');

        const startTime = Date.now();
        let rawText = '';
        try {
            const response = await fetch('/upload/', {
                method: 'POST',
                body: formData
            });

            console.log('Response status:', response.status, response.statusText);

            rawText = await response.text();
            console.log('Raw response:', rawText);

            let data;
            try {
                data = JSON.parse(rawText);
            } catch (parseError) {
                throw new Error('Response is not valid JSON. First 200 chars: ' + rawText.substring(0, 200));
            }

            const durationMs = Date.now() - startTime;

            if (response.ok) {
                if (data.analysis || data.match_percentage) {
                    displayResult(data, {
                        model: selectedModelIdInput.value || 'google/gemma-4-31b-it:free',
                        durationMs,
                        status: response.status
                    }, rawText);
                } else if (data.error) {
                    showError(data.error);
                } else {
                    showError('Server returned an empty or invalid response.');
                }
            } else {
                showError(data.detail || data.error || `Server returned an error (status ${response.status})`);
            }
        } catch (error) {
            showError('Network or parsing error', error.message || error);
        } finally {
            loading.classList.add('hidden');
            submitBtn.disabled = false;
            btnText.textContent = 'Analyze Resume';
        }
    });

    // --- Retry Button ---
    retryBtn.addEventListener('click', () => {
        form.dispatchEvent(new Event('submit'));
    });

    // --- Initial State ---
    resetUI();
});
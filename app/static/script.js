document.addEventListener('DOMContentLoaded', () => {
    // --- DOM References ---
    const form = document.getElementById('uploadForm');
    const fileInput = document.getElementById('file');
    const dropZone = document.getElementById('dropZone');
    const dropText = document.getElementById('dropText');
    const fileInfo = document.getElementById('fileInfo');
    const fileName = document.getElementById('fileName');
    const jobDescription = document.getElementById('jobDescription');
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
        card.className = 'bg-gray-50 rounded-xl p-5 border border-gray-200 shadow-sm';
        card.innerHTML = `
            <div class="flex items-start space-x-3">
                <div class="mt-1 flex-shrink-0 ${colorClass}">
                    <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 00-1.414 0L9 11.586 6.707 9.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l7-7a1 1 0 000-1.414z" clip-rule="evenodd"/></svg>
                </div>
                <div class="flex-1">
                    <h3 class="text-base font-semibold text-gray-800 mb-2">${title}</h3>
                    <ul class="list-disc list-inside text-gray-700 space-y-2">${items
                        .map(item => `<li>${item}</li>`)
                        .join('')}</ul>
                </div>
            </div>
        `;
        return card;
    }

    function displayResult(data) {
        const analysis = data.analysis || data;
        const filename = data.filename || analysis.filename || '';

        responseCards.innerHTML = '';

        const headerCard = document.createElement('div');
        headerCard.className = 'bg-white rounded-2xl p-5 border border-gray-200 shadow-sm';
        const summaryParagraph = document.createElement('p');
        summaryParagraph.className = 'mt-4 text-gray-700 leading-relaxed whitespace-pre-wrap';
        summaryParagraph.textContent = analysis.summary || 'No summary provided.';

        headerCard.innerHTML = `
            <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                    <h3 class="text-lg font-semibold text-gray-900">Resume analysis</h3>
                    <p class="text-sm text-gray-500">${filename ? `File: ${filename}` : 'Match percentage and summary from AI.'}</p>
                </div>
                <span class="rounded-full bg-indigo-50 text-indigo-700 px-4 py-2 text-sm font-semibold">Match ${analysis.match_percentage ?? 'N/A'}%</span>
            </div>
        `;
        headerCard.appendChild(summaryParagraph);
        responseCards.appendChild(headerCard);

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

    // --- Form Submit (with enhanced error logging) ---
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

        try {
            const response = await fetch('/upload/', {
                method: 'POST',
                body: formData
            });

            console.log('Response status:', response.status, response.statusText);

            const rawText = await response.text();
            console.log('Raw response:', rawText);

            let data;
            try {
                data = JSON.parse(rawText);
            } catch (parseError) {
                throw new Error('Response is not valid JSON. First 200 chars: ' + rawText.substring(0, 200));
            }

                if (response.ok) {
                if (data.analysis || data.match_percentage) {
                    displayResult(data);
                } else if (data.error) {
                    showError(data.error);
                } else {
                    showError('Server returned an empty or invalid response.');
                }
            } else {
                showError(data.detail || data.error || `Server returned an error (status ${response.status})`);
            }
        } catch (error) {
            showError('Network or parsing error', error.message);
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
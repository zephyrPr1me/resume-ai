document.addEventListener('DOMContentLoaded', () => {
    // --- DOM References ---
    const form = document.getElementById('uploadForm');
    const fileInput = document.getElementById('file');
    const dropZone = document.getElementById('dropZone');
    const dropText = document.getElementById('dropText');
    const fileInfo = document.getElementById('fileInfo');
    const fileName = document.getElementById('fileName');
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
    function parseResponse(text) {
        const sections = [];
        const cleanedText = text.replace(/\r\n/g, '\n');
        const headingRegex = /^(?:\*{1,3}|\#\s)?(Key Points|Weaknesses|Strengths|What needs improvement|Improvements|Suggestions)(?:\*{1,3}|\:|\s*\#)?/im;
        const lines = cleanedText.split('\n');
        let currentSection = { title: 'General Insights', content: [] };

        lines.forEach(line => {
            const match = line.match(headingRegex);
            if (match && match[0]) {
                if (currentSection.content.length > 0) {
                    sections.push({
                        title: currentSection.title,
                        text: currentSection.content.join('\n').trim()
                    });
                }
                currentSection = { title: match[1].trim(), content: [] };
            } else {
                if (line.trim() !== '') {
                    currentSection.content.push(line);
                }
            }
        });

        if (currentSection.content.length > 0) {
            sections.push({
                title: currentSection.title,
                text: currentSection.content.join('\n').trim()
            });
        }

        if (sections.length === 0) {
            sections.push({ title: 'Analysis', text: cleanedText });
        }
        return sections;
    }

    function displayResult(responseText) {
        const sections = parseResponse(responseText);
        responseCards.innerHTML = '';

        sections.forEach(section => {
            const card = document.createElement('div');
            card.className = 'bg-gray-50 rounded-xl p-5 border border-gray-200 shadow-sm';
            let iconSvg = '';

            switch (section.title.toLowerCase()) {
                case 'key points':
                    iconSvg = '<svg class="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>';
                    break;
                case 'weaknesses':
                    iconSvg = '<svg class="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/></svg>';
                    break;
                case 'strengths':
                    iconSvg = '<svg class="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/></svg>';
                    break;
                case 'what needs improvement':
                case 'improvements':
                    iconSvg = '<svg class="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20"><path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"/></svg>';
                    break;
                default:
                    iconSvg = '<svg class="w-5 h-5 text-indigo-500" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-2 0c0 .552-.448 1-1 1h-1.586l1.293 1.293a1 1 0 01-1.414 1.414L10 10.414l-3.293 3.293a1 1 0 01-1.414-1.414L6.586 10H5a1 1 0 110-2h1.586L5.293 6.707a1 1 0 011.414-1.414L10 8.586l3.293-3.293a1 1 0 011.414 1.414L13.414 9H15a1 1 0 011 1z" clip-rule="evenodd"/></svg>';
            }

            card.innerHTML = `
                <div class="flex items-start space-x-3">
                    <div class="mt-1 flex-shrink-0">${iconSvg}</div>
                    <div class="flex-1">
                        <h3 class="text-base font-semibold text-gray-800 mb-2">${section.title}</h3>
                        <div class="text-gray-700 markdown-content leading-relaxed">${marked.parse(section.text)}</div>
                    </div>
                </div>
            `;
            responseCards.appendChild(card);
        });

        result.classList.remove('hidden');
        copyBtn.classList.remove('hidden');
        copyBtn.dataset.rawText = responseText;
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
                // Проверяем наличие поля response или error
                if (data.response) {
                    displayResult(data.response);
                } else if (data.error) {
                    showError(data.error);
                } else {
                    showError('Server returned an empty or invalid response.');
                }
            } else {
                showError(data.error || `Server returned an error (status ${response.status})`);
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
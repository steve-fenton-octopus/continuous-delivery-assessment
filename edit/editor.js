/**
 * Assessment JSON Editor
 * 
 * Handles:
 *  - Fetching JSON from ../data/<file>
 *  - Rendering a questions table across all categories
 *  - Editing questions/options in a modal (line breaks preserved in JSON)
 *  - Editing top-level metadata
 *  - Downloading the modified JSON
 */

// ── State ─────────────────────────────────────────────────────────────────────

let assessmentData = null;   // The currently loaded JSON object
let editTarget = null;       // { categoryIndex, questionIndex }

// ── Init ──────────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
    const select = document.getElementById('file-select');
    select.addEventListener('change', () => {
        if (select.value) loadFile(select.value);
    });

    document.getElementById('download-btn').addEventListener('click', saveJSON);
    document.getElementById('save-question-btn').addEventListener('click', saveQuestion);
    document.getElementById('cancel-question-btn').addEventListener('click', closeModal);
    document.getElementById('modal-close-btn').addEventListener('click', closeModal);
    document.getElementById('modal-backdrop').addEventListener('click', (e) => {
        if (e.target === e.currentTarget) closeModal();
    });
    document.getElementById('add-option-btn').addEventListener('click', addOptionRow);
});

// ── File Loading ──────────────────────────────────────────────────────────────

async function loadFile(filename) {
    const url = `../data/${filename}`;
    try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        assessmentData = await res.json();
        renderAll();
        showToast(`Loaded ${filename}`);
    } catch (err) {
        alert(`Failed to load ${filename}:\n${err.message}`);
    }
}

// ── Render ────────────────────────────────────────────────────────────────────

function renderAll() {
    renderQuestionsTable();
    document.getElementById('metadata-section').style.display = '';
    renderMetadataEditor();
    document.getElementById('toolbar').style.display = 'flex';
}

function renderQuestionsTable() {
    const tbody = document.getElementById('questions-tbody');
    tbody.innerHTML = '';

    if (!assessmentData?.categories?.length) {
        tbody.innerHTML = '<tr><td colspan="7" class="empty-state">No categories found in this file.</td></tr>';
        return;
    }

    assessmentData.categories.forEach((cat, catIdx) => {
        cat.questions.forEach((q, qIdx) => {
            const tr = document.createElement('tr');

            // Category name (only show on first question of category)
            const catCell = document.createElement('td');
            catCell.className = 'col-category';
            catCell.textContent = cat.name;
            if (cat.informational) {
                const badge = document.createElement('span');
                badge.className = 'badge-informational';
                badge.textContent = 'info';
                catCell.appendChild(badge);
            }

            const numCell = document.createElement('td');
            numCell.className = 'col-num';
            numCell.textContent = q.id;

            const textCell = document.createElement('td');
            textCell.className = 'col-text';
            // Show multi-line text as-is (newlines become <br>)
            textCell.innerHTML = escapeHtml(q.text).replace(/\n/g, '<br>');

            const fieldCell = document.createElement('td');
            fieldCell.className = 'col-field';
            fieldCell.textContent = q.field_name ?? '—';

            const typeCell = document.createElement('td');
            typeCell.textContent = q.field_type ?? 'radio';

            const optsCell = document.createElement('td');
            optsCell.className = 'col-opts';
            optsCell.textContent = q.options?.length ?? 0;

            const actCell = document.createElement('td');
            actCell.className = 'col-actions';
            const editBtn = document.createElement('button');
            editBtn.className = 'btn-edit';
            editBtn.textContent = '✏️ Edit';
            editBtn.addEventListener('click', () => openModal(catIdx, qIdx));
            actCell.appendChild(editBtn);

            tr.append(catCell, numCell, textCell, fieldCell, typeCell, optsCell, actCell);
            tbody.appendChild(tr);
        });
    });
}

// ── Edit Modal ────────────────────────────────────────────────────────────────

function openModal(catIdx, qIdx) {
    editTarget = { catIdx, qIdx };
    const cat = assessmentData.categories[catIdx];
    const q = cat.questions[qIdx];

    document.getElementById('modal-title').textContent =
        `Edit — ${cat.name} · Question ${q.id}`;

    // Populate fields  (JSON \n → textarea newline)
    document.getElementById('edit-text').value = q.text ?? '';
    document.getElementById('edit-advice').value = q.advice ?? '';
    document.getElementById('edit-field-name').value = q.field_name ?? '';
    document.getElementById('edit-field-type').value = q.field_type ?? 'radio';

    // Options
    renderOptionRows(q.options ?? []);

    document.getElementById('modal-backdrop').classList.add('open');
    document.getElementById('edit-text').focus();
}

function closeModal() {
    document.getElementById('modal-backdrop').classList.remove('open');
    editTarget = null;
}

function saveQuestion() {
    if (!editTarget) return;
    const { catIdx, qIdx } = editTarget;
    const q = assessmentData.categories[catIdx].questions[qIdx];

    // Read fields  (textarea newline → JSON \n — already the case, JSON.stringify handles it)
    q.text = document.getElementById('edit-text').value;
    q.advice = document.getElementById('edit-advice').value;
    q.field_name = document.getElementById('edit-field-name').value;
    const ft = document.getElementById('edit-field-type').value.trim();
    if (ft && ft !== 'radio') {
        q.field_type = ft;
    } else {
        delete q.field_type;
    }

    // Collect options
    const rows = document.querySelectorAll('.option-row');
    q.options = Array.from(rows).map(row => ({
        value: parseOptionValue(row.querySelector('.value-input').value),
        level: row.querySelector('.level-input').value,
        description: row.querySelector('.desc-input').value,
    }));

    closeModal();
    renderQuestionsTable();
    showToast('Question saved — click "Write to file" when done!');
}

// ── Options editor ────────────────────────────────────────────────────────────

function renderOptionRows(options) {
    const list = document.getElementById('options-list');
    list.innerHTML = '';
    options.forEach(opt => addOptionRow(opt));
}

function addOptionRow(opt = {}) {
    const list = document.getElementById('options-list');
    const row = document.createElement('div');
    row.className = 'option-row';

    row.innerHTML = `
        <input type="text" class="value-input" placeholder="value" value="${escapeAttr(String(opt.value ?? ''))}" title="Value (numeric or text)">
        <input type="text" class="level-input" placeholder="Label shown to user" value="${escapeAttr(opt.level ?? '')}" title="Display label">
        <input type="text" class="desc-input" placeholder="Description (optional)" value="${escapeAttr(opt.description ?? '')}" title="Description">
        <button class="btn-remove-option" title="Remove option" type="button">✕</button>
    `;
    row.querySelector('.btn-remove-option').addEventListener('click', () => row.remove());
    list.appendChild(row);
}

/** Attempt to keep numeric values numeric */
function parseOptionValue(raw) {
    const n = Number(raw);
    return (raw.trim() !== '' && !isNaN(n)) ? n : raw;
}

// ── Metadata Editor ───────────────────────────────────────────────────────────

function renderMetadataEditor() {
    const meta = assessmentData.metadata ?? {};
    const section = document.getElementById('metadata-section');
    section.innerHTML = '';

    const heading = document.createElement('h2');
    heading.textContent = 'Metadata';
    section.appendChild(heading);

    const simpleFields = [
        { key: 'title', label: 'Title' },
        { key: 'language', label: 'Language code' },
        { key: 'language_native', label: 'Language (native name)' },
        { key: 'language_label', label: 'Language label text' },
        { key: 'introTitle', label: 'Intro heading' },
        { key: 'results_title', label: 'Results heading' },
        { key: 'feedback_message', label: 'Feedback message' },
        { key: 'copy_link_text', label: 'Copy link button text' },
        { key: 'copy_success', label: 'Copy success message' },
        { key: 'copy_fail', label: 'Copy fail message' },
        { key: 'previous_button_text', label: 'Previous button text' },
        { key: 'next_button_text', label: 'Next button text' },
        { key: 'submit_button_text', label: 'Submit button text' },
        { key: 'back_to_assessment', label: 'Back to assessment text' },
        { key: 'advice_title', label: 'Advice title' },
        { key: 'advice_category_title', label: 'Advice category title' },
        { key: 'congrats_title', label: 'Congratulations title' },
        { key: 'congrats_message', label: 'Congratulations message' },
    ];

    simpleFields.forEach(({ key, label }) => {
        const val = meta[key];
        if (val === undefined) return;

        const group = document.createElement('div');
        group.className = 'field-group';

        const lbl = document.createElement('label');
        lbl.textContent = label;

        const isLong = typeof val === 'string' && (val.length > 80 || val.includes('\n'));
        let input;
        if (isLong) {
            input = document.createElement('textarea');
            input.rows = 3;
        } else {
            input = document.createElement('input');
            input.type = 'text';
        }
        input.value = val;
        input.dataset.metaKey = key;
        input.addEventListener('change', () => {
            assessmentData.metadata[key] = input.value;
        });

        group.append(lbl, input);
        section.appendChild(group);
    });

    // Intro (plain string)
    if (typeof meta.intro === 'string') {
        const group = document.createElement('div');
        group.className = 'field-group';

        const lbl = document.createElement('label');
        lbl.textContent = 'Intro text';

        const ta = document.createElement('textarea');
        ta.id = 'intro-text';
        ta.rows = 6;
        ta.value = meta.intro;

        const hint = document.createElement('p');
        hint.className = 'field-hint';
        hint.textContent = 'You can use line breaks — they will be preserved in the JSON.';

        group.append(lbl, ta, hint);
        section.appendChild(group);
    }

    // Save metadata button
    const saveMetaBtn = document.createElement('button');
    saveMetaBtn.type = 'button';
    saveMetaBtn.textContent = '💾 Save metadata';
    saveMetaBtn.addEventListener('click', saveMetadata);
    section.appendChild(saveMetaBtn);
}


function saveMetadata() {
    const introTa = document.getElementById('intro-text');
    if (introTa) {
        assessmentData.metadata.intro = introTa.value;
    }

    showToast('Metadata saved — click "Write to file" when done!');
}

// ── Save / Download ───────────────────────────────────────────────────────────

/**
 * Save the JSON back to disk.
 * Uses the File System Access API (showSaveFilePicker) when available so the
 * user can navigate directly to data/ and overwrite the source file in place.
 * Falls back to a plain browser download for Firefox / Safari.
 */
async function saveJSON() {
    if (!assessmentData) return;

    const json = JSON.stringify(assessmentData, null, 2);
    const filename = document.getElementById('file-select').value || 'assessment.json';

    if (typeof window.showSaveFilePicker === 'function') {
        try {
            const handle = await window.showSaveFilePicker({
                suggestedName: filename,
                types: [{
                    description: 'JSON assessment file',
                    accept: { 'application/json': ['.json'] },
                }],
            });
            const writable = await handle.createWritable();
            await writable.write(json);
            await writable.close();
            showToast(`Saved to ${handle.name}!`);
            return;
        } catch (err) {
            // User cancelled the picker — do nothing
            if (err.name === 'AbortError') return;
            // Any other error: fall through to plain download
            console.warn('showSaveFilePicker failed, falling back to download:', err);
        }
    }

    // Fallback: trigger a browser download
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
    showToast('Downloaded! Move it to data/ manually.');
}

// ── Utilities ─────────────────────────────────────────────────────────────────

function escapeHtml(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function escapeAttr(str) {
    return String(str).replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function showToast(msg) {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.classList.add('visible');
    clearTimeout(t._timer);
    t._timer = setTimeout(() => t.classList.remove('visible'), 2800);
}

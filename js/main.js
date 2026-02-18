let isSaving = false;
let isImporting = false;

const i18n = {
    en: {
        personalTitle: "Personal Information",
        phName: "First Name",
        phSurname: "Last Name",
        phSummary: "Professional Summary (ATS Optimized)",
        contacts: "Contact Informations",
        experience: "PROFESSIONAL EXPERIENCE",
        education: "EDUCATION",
        skills: "CORE COMPETENCIES",
        projects: "PROJECTS",
        certifications: "CERTIFICATIONS",
        summaryTitle: "PROFESSIONAL SUMMARY",
        add: "Add",
        recrop: "Recrop",
        present: "Present",
        confirmDelete: "Delete this CV?",
        pageLabel: "Page",
        cont: "(continued)",
        githubTitle: "Support This Project",
        githubText: "If this CV Builder helped you, please consider giving it a star on GitHub to support further development.",
        githubStar: "Star on GitHub",
        githubLater: "Remind Me Later",
        githubHide: "Don’t Show Again",
        months: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
        colorThemeLabel: "Color Theme",
        customColorLabel: "Custom Accent Color",
        accentLabel: "Accent Color",
        bgLabel: "Header Background",
        textLabel: "Text Color",
        colors: {
            black: "⬛ Black",
            dGraphite: "⬛ Deep Graphite",
            graphite: "⬛ Graphite",
            dGrey: "🔘 Dark Grey",
            grey: "🔘 Grey",
            white: "⬜ White",
            offWhite: "⬜ Off-White",
            fog: "☁️ Light Fog",
            pBlue: "🔹 Pastel Blue",
            pGreen: "🌿 Pastel Green",
            pSand: "⏳ Pastel Sand"
        }
    },
    de: {
        personalTitle: "Persönliche Informationen",
        phName: "Vorname",
        phSurname: "Last Name",
        phSummary: "Professionelle Zusammenfassung",
        contacts: "Kontaktinformationen",
        experience: "BERUFSERFAHRUNG",
        education: "AUSBILDUNG",
        skills: "KERNKOMPETENZEN",
        projects: "PROJEKTE",
        certifications: "ZERTIFIKATE",
        summaryTitle: "ZUSAMMENFASSUNG",
        add: "Hinzufügen",
        recrop: "Anpassen",
        present: "Heute",
        confirmDelete: "Diesen Lebenslauf löschen?",
        pageLabel: "Seite",
        cont: "(Fortsetzung)",
        githubTitle: "Projekt unterstützen",
        githubText: "Wenn dir dieser CV Builder geholfen hat, gib dem Projekt bitte einen Stern auf GitHub.",
        githubStar: "Auf GitHub markieren",
        githubLater: "Später erinnern",
        githubHide: "Nicht mehr anzeigen",
        months: ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"],
        colorThemeLabel: "Farbschema",
        customColorLabel: "Eigene Akzentfarbe",
        accentLabel: "Akzentfarbe",
        bgLabel: "Header-Hintergrund",
        textLabel: "Textfarbe",
        colors: {
            black: "⬛ Schwarz",
            dGraphite: "⬛ Tiefgraphit",
            graphite: "⬛ Graphit",
            dGrey: "🔘 Dunkelgrau",
            grey: "🔘 Grau",
            white: "⬜ Weiß",
            offWhite: "⬜ Altweiß",
            fog: "☁️ Hellnebel",
            pBlue: "🔹 Pastellblau",
            pGreen: "🌿 Pastellgrün",
            pSand: "⏳ Pastellsand"
        }
    }
};

const skillTypes = {
    "tech": "Technical Skills",
    "soft": "Soft Skills",
    "lang": "Languages",
    "tools": "Tools & Technologies",
    "cert": "Certifications",
    "method": "Methodologies",
    "comp": "Core Competencies",
    "other": "Other"
};

const forbiddenChars = /[<>{}\[\]\/\\|~`^*=%$!?;:§€£¥]/g;

let db, currentId = null,
    photoBase64 = "",
    originalPhoto = "",
    cropper, isLoading = false;
const cropModal = new bootstrap.Modal(document.getElementById('cropModal'));

// Task 6: Dynamic Year
document.getElementById('footerYear').innerText = new Date().getFullYear();

// Task 3: Validation Logic
document.body.addEventListener('input', (e) => {

    if (e.target.id === 'firstName' || e.target.id === 'lastName') {
        const allowedChars = /[^a-zA-ZäöüÄÖÜßẞ\s\-]/g;
        if (allowedChars.test(e.target.value)) {
            e.target.value = e.target.value.replace(allowedChars, '');
            const toast = document.getElementById('ats-toast');
            toast.innerText = "Only English and German letters allowed";
            toast.classList.add('show');
        }
    }

    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        if (!isLoading) autoSave();
        let cleaned = e.target.value
            .replace(forbiddenChars, '')
            .replace(/[\u{1F600}-\u{1F6FF}]/gu, '') // emojis
            .replace(/[\u2018\u2019\u201C\u201D]/g, '') // smart quotes
            .replace(/\u00A0/g, ' '); // non-breaking space

        if (cleaned !== e.target.value) {
            e.target.value = cleaned;
            const toast = document.getElementById('ats-toast');
            toast.innerText = "Special characters are not ATS-compatible and have been removed.";
            toast.classList.add('show');
            setTimeout(() => toast.classList.remove('show'), 4000);
        }
    }
});


// Initialize Tooltips
const initTooltips = () => {
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function(tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });
};

const request = indexedDB.open("CV_BUILDER_DB_V28", 1); // Incremented DB Version for new schema
request.onupgradeneeded = e => e.target.result.createObjectStore("cvs", {
    keyPath: "id",
    autoIncrement: true
});
request.onsuccess = e => {
    db = e.target.result;
    const urlParams = new URLSearchParams(window.location.search);
    const importUrl = urlParams.get('import_from_url');
    if (importUrl) {
        if (importUrl) {
            fetch(importUrl)
                .then(r => r.json())
                .then(d => {
                    delete d.id; // Чтобы создалась новая запись
                    const tx = db.transaction("cvs", "readwrite");
                    const store = tx.objectStore("cvs");
                    const addReq = store.add(d);

                    addReq.onsuccess = (ev) => {
                        currentId = ev.target.result; // Устанавливаем ID новой записи
                        d.id = currentId;
                        loadData(d); // Сразу загружаем данные в форму
                        updateList(); // Обновляем выпадающий список
                        render(); // Перерисовываем превью

                        // Убираем параметр из URL, чтобы не импортировать заново при обновлении
                        window.history.replaceState({}, document.title, window.location.pathname);
                    };
                })
                .catch(err => {
                    console.error("Import failed", err);
                    loadLast();
                });
        }
    } else {
        loadLast();
        updateGithubPopupText();
    }
};

function changeLang() {
    const lang = document.getElementById('uiLang').value;
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.dataset.i18n;
        const translation = key.split('.').reduce((obj, i) => obj ? obj[i] : null, i18n[lang]);
        if (translation) el.innerText = translation;
    });
    document.querySelectorAll('[data-i18n-ph]').forEach(el => {
        el.placeholder = i18n[lang][el.dataset.i18nPh];
    });
    updateGithubPopupText();
    render();
}

function formatDate(val) {
    const lang = document.getElementById('uiLang').value;
    if (!val) return i18n[lang].present;
    const d = new Date(val);
    if (isNaN(d.getTime())) return val;
    const order = document.getElementById('dateOrder').value;
    const sep = document.getElementById('dateSep').value;
    const mText = i18n[lang].months[d.getMonth()];
    const mNum = (d.getMonth() + 1).toString().padStart(2, '0');
    const year = d.getFullYear();
    if (order === 'MY_NUM') return `${mNum}${sep}${year}`;
    return `${mText} ${year}`;
}

function createPage(n, ds) {
    const w = document.createElement('div');
    w.className = "page-wrapper";
    w.style.fontSize = ds.size + "pt";
    w.style.fontFamily = "Arial, Helvetica, sans-serif";
    w.innerHTML = `
                <div class="page-content"></div>
                <div style="position:absolute; bottom:10mm; right:10mm; font-size:8pt; opacity:0.3; color:${ds.text}">${i18n[document.getElementById('uiLang').value].pageLabel} ${n}</div>`;
    return w;
}

function fitPreviewToScreen() {
    const pages = document.querySelectorAll('.page-wrapper');
    const previewSide = document.querySelector('.preview-side');
    if (!previewSide) return;
    if (window.innerWidth >= 992) {
        pages.forEach(p => {
            p.style.transform = 'none';
            p.style.marginBottom = '20px';
        });
    } else {
        const padding = 20;
        const scale = (previewSide.offsetWidth - padding) / 794;
        pages.forEach(p => {
            p.style.transform = `scale(${scale})`;
            p.style.marginBottom = `${(1123 * scale) - 1123 + 10}px`;
        });
    }
}

function slugifyName(text) {
    const map = {
        'ä': 'ae',
        'ö': 'oe',
        'ü': 'ue',
        'Ä': 'Ae',
        'Ö': 'Oe',
        'Ü': 'Ue',
        'ß': 'ss',
        'ẞ': 'SS'
    };
    return text.replace(/[äöüÄÖÜßẞ]/g, m => map[m])
        .replace(/[^a-zA-Z0-9]/gi, '_');
}

function getFileName() {
    const f = slugifyName(document.getElementById('firstName').value || 'Name');
    const l = slugifyName(document.getElementById('lastName').value || 'Surname');
    const job = slugifyName(document.getElementById('targetJob').value || 'Job');
    return `CV_${f}_${l}_${job}_${new Date().getFullYear()}`;
}

function exportPDF() {
    const pages = document.querySelectorAll('.page-wrapper');
    const container = document.getElementById('cv-pages-container');
    pages.forEach(p => {
        p.style.transform = 'none';
        p.style.marginBottom = '0';
        p.style.boxShadow = 'none';
    });
    container.style.gap = '0';
    const opt = {
        margin: 0,
        filename: getFileName() + '.pdf',
        image: {
            type: 'jpeg',
            quality: 0.98
        },
        html2canvas: {
            scale: 2,
            useCORS: true,
            scrollY: 0
        },
        jsPDF: {
            unit: 'mm',
            format: 'a4',
            orientation: 'portrait'
        }
    };
    html2pdf().set(opt).from(container).save().then(() => {
        pages.forEach(p => {
            p.style.boxShadow = '0 0 20px rgba(0,0,0,0.5)';
        });
        fitPreviewToScreen();
        showGithubPopup();
    });
}

function checkUiStates() {
    const dateOrder = document.getElementById('dateOrder').value;
    const dateSep = document.getElementById('dateSep');
    if (dateOrder === 'MY_TEXT') {
        dateSep.disabled = true;
        dateSep.classList.add('control-disabled');
    } else {
        dateSep.disabled = false;
        dateSep.classList.remove('control-disabled');
    }

    const hasPhoto = !!photoBase64;
    const showPhotoCheck = document.getElementById('showPhoto');
    const photoSizeRange = document.getElementById('photoSize');
    if (!hasPhoto) {
        showPhotoCheck.disabled = true;
        showPhotoCheck.checked = false;
        showPhotoCheck.parentElement.classList.add('control-disabled');
        photoSizeRange.disabled = true;
        photoSizeRange.parentElement.classList.add('control-disabled');
    } else {
        showPhotoCheck.disabled = false;
        showPhotoCheck.parentElement.classList.remove('control-disabled');
        photoSizeRange.disabled = false;
        photoSizeRange.parentElement.classList.remove('control-disabled');
    }
}

// Helper: Format new lines as bullet points
function formatBullets(text) {
    if (!text) return '';
    const lines = text.split('\n').filter(l => l.trim().length > 0);
    if (lines.length === 0) return '';
    return `<ul class="cv-list">${lines.map(l => `<li>${l}</li>`).join('')}</ul>`;
        }

        function render() {
            if (isLoading) return;
            checkUiStates();

            const lang = document.getElementById('uiLang').value;
            const ds = {
                size: document.getElementById('fontSize').value,
                hSize: document.getElementById('headerSize').value,
                pSize: document.getElementById('photoSize').value,
                accent: document.getElementById('accentColor').value,
                text: document.getElementById('textColor').value,
                headerBg: document.getElementById('headerBgColor').value,
                showPhoto: document.getElementById('showPhoto').checked
            };

            const name = (document.getElementById('firstName').value + ' ' + document.getElementById('lastName').value).trim();
            const jobTitle = document.getElementById('targetJob').value;
            const summary = document.getElementById('summary').value;

            const blocks = [];

            // 1. HEADER
            let headerHtml = `<div style="display:flex; gap:20px; align-items:flex-start; margin-bottom:20px;">`;
            headerHtml += `<div style="flex:1">
                <h1 style="font-size:2.5em; margin:0; line-height:1.1; color:${ds.text}; font-weight:bold; font-family:Arial, sans-serif;">${name || 'NAME'}</h1>
                <div style="font-size:1.5em; margin-top:5px; color:${ds.accent};">${jobTitle}</div>
            </div>`;
            if (ds.showPhoto && photoBase64) {
                headerHtml += `<div style="width:${ds.pSize}mm; height:${ds.pSize * 1.3}mm; flex-shrink:0;">
                    <img src="${photoBase64}" style="width:100%; height:100%; object-fit:cover;">
                </div>`;
            }
            headerHtml += `</div>`;
            blocks.push({ type: 'html', html: headerHtml });

            // 2. CONTACTS (Pre-Summary as per strict order)
            const contacts = Array.from(document.querySelectorAll('#contactInputs > div')).map(d => {
                const label = d.querySelectorAll('input')[0].value;
                const value = d.querySelectorAll('input')[1].value;
                return value ? `<div><strong>${label}:</strong> ${value}</div>` : null;
            }).filter(v => v);
            if (contacts.length > 0) {
                blocks.push({
                    type: 'section-title',
                    title: i18n[lang].contacts
                });
                let contactHtml = `<div style="display:flex; flex-wrap:wrap; gap:15px; margin-bottom:15px; color:${ds.text}; font-size:0.95em;">`;

                contactHtml += contacts.join('');
                contactHtml += `</div>`;
                blocks.push({ type: 'html', html: contactHtml });
            }

            // 3. SUMMARY
            if (summary) {
                blocks.push({ type: 'section-title', title: i18n[lang].summaryTitle });
                blocks.push({ type: 'html', html: `<div style="margin-bottom:15px; color:${ds.text}; line-height:1.4;">${summary}</div>` });
            }

            // 4. SKILLS
            const skills = Array.from(document.getElementById('skillsInputs').children).map(d => {
                return { n: d.querySelector('input.s-name').value, t: d.querySelector('select.s-type').value };
            }).filter(s => s.n);
            if (skills.length) {
                blocks.push({ type: 'section-title', title: i18n[lang].skills });
                const grouped = {};
                skills.forEach(s => { const k = skillTypes[s.t] || "Other"; if (!grouped[k]) grouped[k] = []; grouped[k].push(s.n); });
                let skillHtml = `<div style="color:${ds.text};">`;
                for (const [cat, list] of Object.entries(grouped)) { skillHtml += `<div style="margin-bottom:5px;"><strong>${cat}:</strong> ${list.join(', ')}</div>`; }
                skillHtml += `</div>`;
                blocks.push({ type: 'html', html: skillHtml });
            }

            // 5. WORK EXPERIENCE (Company - Position)
            const expItems = Array.from(document.getElementById('expInputs').children);
            if (expItems.length > 0) {
                blocks.push({ type: 'section-title', title: i18n[lang].experience });
                expItems.forEach(it => {
                    const dStr = formatDate(it.querySelector('.e-start').value) + ' — ' + formatDate(it.querySelector('.e-end').value);
                    const org = it.querySelector('.e-org').value;
                    const title = it.querySelector('.e-title').value;
                    const desc = it.querySelector('.e-desc').value;

                    const entryHtml = `<div style="margin-bottom:12px; color:${ds.text};">
                        <div style="display:flex; justify-content:space-between;">
                            <div style="font-weight:bold; font-size:1.05em;">${org} – ${title}</div>
                            <div style="font-weight:bold; font-size:0.9em; white-space:nowrap;">${dStr}</div>
                        </div>
                        ${formatBullets(desc)}
                    </div>`;
                    blocks.push({ type: 'entry', title: i18n[lang].experience, html: entryHtml });
                });
            }

            // 6. PROJECTS
            const projItems = Array.from(document.getElementById('projInputs').children);
            if (projItems.length > 0) {
                blocks.push({ type: 'section-title', title: i18n[lang].projects });
                projItems.forEach(it => {
                    const dStr = formatDate(it.querySelector('.e-start').value) + ' — ' + formatDate(it.querySelector('.e-end').value);
                    const entryHtml = `<div style="margin-bottom:12px; color:${ds.text};">
                        <div style="display:flex; justify-content:space-between;">
                            <div style="font-weight:bold; font-size:1.05em;">${it.querySelector('.e-title').value}</div>
                            <div style="font-weight:bold; font-size:0.9em;">${dStr}</div>
                        </div>
                         <div style="font-style:italic; font-size:0.95em; color:${ds.accent};">${it.querySelector('.e-org').value}</div>
                         ${formatBullets(it.querySelector('.e-desc').value)}
                    </div>`;
                    blocks.push({ type: 'entry', title: "PROJECTS", html: entryHtml });
                });
            }

            // 7. EDUCATION (Bullet Highlights)
            const eduItems = Array.from(document.getElementById('eduInputs').children);
            if (eduItems.length > 0) {
                blocks.push({ type: 'section-title', title: i18n[lang].education });
                eduItems.forEach(it => {
                    const dStr = formatDate(it.querySelector('.e-start').value) + ' — ' + formatDate(it.querySelector('.e-end').value);
                    const entryHtml = `<div style="margin-bottom:12px; color:${ds.text};">
                        <div style="display:flex; justify-content:space-between;">
                             <div style="font-weight:bold; font-size:1.05em;">${it.querySelector('.e-org').value}</div>
                             <div style="font-weight:bold; font-size:0.9em;">${dStr}</div>
                        </div>
                        <div style="font-weight:bold; color:${ds.accent};">${it.querySelector('.e-title').value}</div>
                        ${formatBullets(it.querySelector('.e-desc').value)}
                    </div>`;
                    blocks.push({ type: 'entry', title: i18n[lang].education, html: entryHtml });
                });
            }

            // 8. CERTIFICATIONS (New Block)
            const certItems = Array.from(document.getElementById('certInputs').children);
            if (certItems.length > 0) {
                blocks.push({ type: 'section-title', title: i18n[lang].certifications });
                certItems.forEach(it => {
                    const dStr = formatDate(it.querySelector('.e-start').value) + (it.querySelector('.e-end').value ? ' — ' + formatDate(it.querySelector('.e-end').value) : '');
                    const entryHtml = `<div style="margin-bottom:12px; color:${ds.text};">
                        <div style="display:flex; justify-content:space-between;">
                             <div style="font-weight:bold; font-size:1.05em;">${it.querySelector('.e-title').value}</div>
                             <div style="font-weight:bold; font-size:0.9em;">${dStr}</div>
                        </div>
                        <div style="font-size:0.95em; color:${ds.accent};">${it.querySelector('.e-org').value}</div>
                        ${formatBullets(it.querySelector('.e-desc').value)}
                    </div>`;
                    blocks.push({ type: 'entry', title: "CERTIFICATIONS", html: entryHtml });
                });
            }

            // RENDER TO PAGES
            const container = document.getElementById('cv-pages-container');
            container.innerHTML = "";
            let pNum = 1;
            let currentP = createPage(pNum, ds);
            container.appendChild(currentP);
            const ghost = document.getElementById('ghost-render');
            ghost.style.fontSize = ds.size + "pt";
            ghost.style.fontFamily = "Arial, Helvetica, sans-serif";
            ghost.style.width = "170mm";

            blocks.forEach(b => {
                let contentHtml = b.html || "";
                if (b.type === 'section-title') {
                    contentHtml = `<div class="section-title-wrapper"><div class="section-title" style="color:${ds.accent}; background-color:${ds.headerBg}; font-size:${ds.hSize}pt;">${b.title}</div></div>`;
                }

                ghost.innerHTML = contentHtml;
                const elementHeight = ghost.offsetHeight;
                const currentHeight = currentP.querySelector('.page-content').offsetHeight;

                if (currentHeight + elementHeight > 960) {
                    pNum++;
                    currentP = createPage(pNum, ds);
                    container.appendChild(currentP);
                    if (b.type === 'entry') {
                         const contHeader = `<div class="section-title-wrapper"><div class="section-title" style="color:${ds.accent}; background-color:${ds.headerBg}; font-size:${ds.hSize}pt;">${b.title} <span style="font-size:0.7em; text-transform:none; opacity:0.6;">${i18n[lang].cont}</span></div></div>`;
                         const d = document.createElement('div'); d.innerHTML = contHeader;
                         currentP.querySelector('.page-content').appendChild(d);
                    }
                }
                const div = document.createElement('div'); div.innerHTML = contentHtml;
                currentP.querySelector('.page-content').appendChild(div);
            });
            fitPreviewToScreen();
            // autoSave();
        }

        function collectData() {
            return {
                id: currentId,
                fn: document.getElementById('firstName').value,
                ln: document.getElementById('lastName').value,
                job: document.getElementById('targetJob').value,
                sum: document.getElementById('summary').value,
                photo: photoBase64, original: originalPhoto, lang: document.getElementById('uiLang').value,
                contacts: Array.from(document.querySelectorAll('#contactInputs > div')).map(d => ({t:d.querySelectorAll('input')[0].value, v:d.querySelectorAll('input')[1].value})),
                exp: Array.from(document.getElementById('expInputs').children).map(d=>({s:d.querySelector('.e-start').value, e:d.querySelector('.e-end').value, t:d.querySelector('.e-title').value, o:d.querySelector('.e-org').value, d:d.querySelector('.e-desc').value})),
                proj: Array.from(document.getElementById('projInputs').children).map(d=>({s:d.querySelector('.e-start').value, e:d.querySelector('.e-end').value, t:d.querySelector('.e-title').value, o:d.querySelector('.e-org').value, d:d.querySelector('.e-desc').value})),
                edu: Array.from(document.getElementById('eduInputs').children).map(d=>({s:d.querySelector('.e-start').value, e:d.querySelector('.e-end').value, t:d.querySelector('.e-title').value, o:d.querySelector('.e-org').value, d:d.querySelector('.e-desc').value})),
                cert: Array.from(document.getElementById('certInputs').children).map(d=>({s:d.querySelector('.e-start').value, e:d.querySelector('.e-end').value, t:d.querySelector('.e-title').value, o:d.querySelector('.e-org').value, d:d.querySelector('.e-desc').value})),
                skills: Array.from(document.getElementById('skillsInputs').children).map(d=>({ n:d.querySelector('input.s-name').value, t:d.querySelector('select.s-type').value })),
                ds: {
                    size: document.getElementById('fontSize').value, hSize: document.getElementById('headerSize').value, pSize: document.getElementById('photoSize').value,
                    accent: document.getElementById('accentColor').value, text: document.getElementById('textColor').value, headerBg: document.getElementById('headerBgColor').value,
                    dOrder: document.getElementById('dateOrder').value, dSep: document.getElementById('dateSep').value, showPhoto: document.getElementById('showPhoto').checked
                }
            };
        }

        function exportJSON() {
            const a = document.createElement('a');
            a.href = URL.createObjectURL(new Blob([JSON.stringify(collectData(), null, 4)], {type:'application/json'}));
            a.download = getFileName() + '.json';
            a.click();
        }

        function handleImport(input) {
            if (isImporting) return;
            if (input.files[0]) {
                isImporting = true;
                isLoading = true;

                const r = new FileReader();
                r.onload = e => {
                    try {
                        const d = JSON.parse(e.target.result);
                        delete d.id;

                        const tx = db.transaction("cvs", "readwrite");
                        const store = tx.objectStore("cvs");

                        const addRequest = store.add(d);
                        addRequest.onsuccess = (ev) => {
                            const newId = ev.target.result;
                            currentId = newId;
                            d.id = newId;

                            loadData(d);
                            updateList();

                            setTimeout(() => {
                                isImporting = false;
                                isLoading = false;
                            }, 100);
                        };
                    } catch (err) {
                        isImporting = false;
                        isLoading = false;
                    }
                };
                r.readAsText(input.files[0]);
                input.value = '';
            }
        }

        function autoSave() {
            if (!db || isLoading || isSaving) return;

            isSaving = true;

            const data = collectData();
            const store = db.transaction("cvs", "readwrite").objectStore("cvs");

            if (currentId) {
                store.put(data).onsuccess = () => {
                    updateList();
                    isSaving = false;
                };
            } else {
                delete data.id;
                store.add(data).onsuccess = e => {
                    currentId = e.target.result;
                    updateList();
                    isSaving = false;
                };
            }
        }

        function loadLast() { db.transaction("cvs").objectStore("cvs").getAll().onsuccess = e => { if (e.target.result.length) loadData(e.target.result[e.target.result.length-1]); else createNew(); updateList(); initSortable(); }; }
        function updateList() { db.transaction("cvs").objectStore("cvs").getAll().onsuccess = e => { document.getElementById('cvSelect').innerHTML = e.target.result.map(cv => `<option value="${cv.id}" ${cv.id===currentId?'selected':''}>${cv.fn || 'New'} ${cv.ln || ''}</option>`).join(''); }; }
        function loadFromSelector() { currentId = parseInt(document.getElementById('cvSelect').value); db.transaction("cvs").objectStore("cvs").get(currentId).onsuccess = e => loadData(e.target.result); }

        function loadData(d) {
            isLoading = true; currentId = d.id;
            document.getElementById('uiLang').value = d.lang || "en";
            document.getElementById('firstName').value = d.fn || "";
            document.getElementById('lastName').value = d.ln || "";
            document.getElementById('targetJob').value = d.job || "";
            document.getElementById('summary').value = d.sum || "";
            photoBase64 = d.photo || ""; originalPhoto = d.original || "";
            updatePhotoUI();
            if (d.ds) {
                document.getElementById('fontSize').value = d.ds.size;
                document.getElementById('headerSize').value = d.ds.hSize || 14;
                document.getElementById('photoSize').value = d.ds.pSize;
                document.getElementById('accentColor').value = d.ds.accent;
                document.getElementById('textColor').value = d.ds.text;
                document.getElementById('headerBgColor').value = d.ds.headerBg || "#ffffff";
                document.getElementById('dateOrder').value = d.ds.dOrder || "MY_TEXT";
                document.getElementById('dateSep').value = d.ds.dSep || "/";
                document.getElementById('showPhoto').checked = d.ds.showPhoto === true;
            }
            document.getElementById('contactInputs').innerHTML = ""; (d.contacts||[]).forEach(c => addContact(c.t, c.v));
            document.getElementById('expInputs').innerHTML = ""; (d.exp||[]).forEach(x => addEntry('expInputs', x));
            document.getElementById('projInputs').innerHTML = ""; (d.proj||[]).forEach(x => addEntry('projInputs', x));
            document.getElementById('eduInputs').innerHTML = ""; (d.edu||[]).forEach(x => addEntry('eduInputs', x));
            document.getElementById('certInputs').innerHTML = ""; (d.cert||[]).forEach(x => addCertification(x));
            document.getElementById('skillsInputs').innerHTML = ""; (d.skills||[]).forEach(s => addSkill(s.n, s.t));
            changeLang(); isLoading = false; initTooltips(); render();
        }

        function createNew() {
            currentId = null; photoBase64 = ""; originalPhoto = "";
            document.getElementById('firstName').value = ""; document.getElementById('lastName').value = "";
            document.getElementById('targetJob').value = ""; document.getElementById('summary').value = "";
            updatePhotoUI();
            document.getElementById('showPhoto').checked = false;
            document.getElementById('contactInputs').innerHTML = ""; document.getElementById('expInputs').innerHTML = "";
            document.getElementById('projInputs').innerHTML = ""; document.getElementById('eduInputs').innerHTML = "";
            document.getElementById('certInputs').innerHTML = ""; document.getElementById('skillsInputs').innerHTML = "";

            // Task 7: Pre-filled Contacts
            addContact("Email", "email@example.com");
            addContact("Phone", "+1 (123) 456-7890");
            addContact("Location", "City, Country");
            addContact("LinkedIn", "linkedin.com/in/username");

            initTooltips();
            render();
            autoSave();
        }
        function deleteCurrent() { if (confirm(i18n[document.getElementById('uiLang').value].confirmDelete)) { db.transaction("cvs", "readwrite").objectStore("cvs").delete(currentId).onsuccess = () => loadLast(); } }

        function addContact(t="Email", v="") {
            const div = document.createElement('div'); div.className="draggable-card d-flex gap-2 align-items-center";
            div.innerHTML=`<div class="drag-handle">⠿</div><input type="text" value="${t}" class="form-control form-control-sm w-25" oninput="render()"><input type="text" value="${v}" class="form-control form-control-sm flex-grow-1" oninput="render()"><button onclick="this.parentElement.remove(); render()" class="btn btn-sm text-danger">✕</button>`;
            document.getElementById('contactInputs').appendChild(div); render();
        }

        function addEntry(id, d={}) {
            const div = document.createElement('div'); div.className="draggable-card";
            let phTitle = "Title", phOrg = "Organization";
            if(id === 'eduInputs') { phTitle = "Degree"; phOrg = "Institution"; }

            div.innerHTML=`<div class="d-flex gap-2 mb-2"><div class="drag-handle">⠿</div><input type="date" class="form-control form-control-sm e-start" value="${d.s||''}" oninput="render()"><input type="date" class="form-control form-control-sm e-end" value="${d.e||''}" oninput="render()"><button onclick="this.parentElement.parentElement.remove(); render()" class="btn btn-sm text-danger ms-auto">✕</button></div>
            <div class="mb-2"><input type="text" placeholder="${phTitle}" class="form-control form-control-sm fw-bold mb-1 e-title" value="${d.t||''}" oninput="render()"><input type="text" placeholder="${phOrg}" class="form-control form-control-sm mb-1 e-org" value="${d.o||''}" oninput="render()"></div>
            <div class="d-flex align-items-center gap-1"><label class="small text-muted fw-bold">Highlights / Description</label><span class="ats-help" data-bs-toggle="tooltip" title="Bullets are added automatically for each new line.">?</span></div>
            <textarea class="form-control form-control-sm e-desc" rows="2" placeholder="List achievements here..." oninput="render()">${d.d||''}</textarea>`;
            document.getElementById(id).appendChild(div); initTooltips(); render();
        }

        function addCertification(d={}) {
            const div = document.createElement('div'); div.className="draggable-card";
            div.innerHTML=`<div class="d-flex gap-2 mb-2"><div class="drag-handle">⠿</div><input type="date" class="form-control form-control-sm e-start" value="${d.s||''}" oninput="render()"><input type="date" class="form-control form-control-sm e-end" value="${d.e||''}" placeholder="Exp Date" oninput="render()"><button onclick="this.parentElement.parentElement.remove(); render()" class="btn btn-sm text-danger ms-auto">✕</button></div>
            <div class="mb-2"><input type="text" placeholder="Certification Name" class="form-control form-control-sm fw-bold mb-1 e-title" value="${d.t||''}" oninput="render()"><input type="text" placeholder="Issuing Organization" class="form-control form-control-sm mb-1 e-org" value="${d.o||''}" oninput="render()"></div>
            <div class="d-flex align-items-center gap-1"><label class="small text-muted fw-bold">Description (Optional)</label><span class="ats-help" data-bs-toggle="tooltip" title="Briefly describe skills validated.">?</span></div>
            <textarea class="form-control form-control-sm e-desc" rows="2" placeholder="Description..." oninput="render()">${d.d||''}</textarea>`;
            document.getElementById('certInputs').appendChild(div); initTooltips(); render();
        }

        function addSkill(n="", t="tech") {
            const div = document.createElement('div'); div.className="draggable-card";
            let opts = ""; for(let k in skillTypes) { opts += `<option value="${k}" ${t===k?'selected':''}>${skillTypes[k]}</option>`; }
            div.innerHTML=`<div class="d-flex gap-2 align-items-center"><div class="drag-handle">⠿</div><input type="text" class="form-control form-control-sm s-name" value="${n}" placeholder="Skill Name" oninput="render()"><select class="form-select form-select-sm s-type" style="width: 45%" onchange="render()">${opts}</select><button onclick="this.parentElement.parentElement.remove(); render()" class="btn btn-sm text-danger">✕</button></div>`;
            document.getElementById('skillsInputs').appendChild(div); render();
        }

        const githubModal = new bootstrap.Modal(document.getElementById('githubModal'));

        function showGithubPopup() {
            if (!localStorage.getItem("hideGithubPopup")) {
                setTimeout(() => githubModal.show(), 800);
            }
        }

        function disableGithubPopup() {
            localStorage.setItem("hideGithubPopup", "true");
            githubModal.hide();
        }

        function updateGithubPopupText() {
            const lang = document.getElementById('uiLang').value;

            document.getElementById('ghTitle').innerText = i18n[lang].githubTitle;
            document.getElementById('ghText').innerText = i18n[lang].githubText;
            document.getElementById('ghStarBtn').innerText = "⭐ " + i18n[lang].githubStar;
            document.getElementById('ghLaterBtn').innerText = i18n[lang].githubLater;
            document.getElementById('ghHideBtn').innerText = i18n[lang].githubHide;
        }

        function initSortable() { document.querySelectorAll('.sortable-list').forEach(el => new Sortable(el, { handle: '.drag-handle', animation: 150, onEnd: render })); }
        function initCropper(input) { if (input.files && input.files[0]) { const r = new FileReader(); r.onload = e => { originalPhoto = e.target.result; openCropper(originalPhoto); }; r.readAsDataURL(input.files[0]); } }
        function reCropCurrent() { if (originalPhoto) openCropper(originalPhoto); }
        function openCropper(src) { document.getElementById('image-to-crop').src = src; cropModal.show(); if (cropper) cropper.destroy(); setTimeout(() => { cropper = new Cropper(document.getElementById('image-to-crop'), { aspectRatio: 0.77, viewMode: 1 }); }, 300); }
        function applyCrop() { photoBase64 = cropper.getCroppedCanvas({ width: 500 }).toDataURL("image/jpeg"); updatePhotoUI(); cropModal.hide(); render(); }
        function updatePhotoUI() { const t = document.getElementById('photoThumb'); if (photoBase64) { t.src = photoBase64; t.style.display = 'block'; document.getElementById('recropBtn').classList.remove('d-none'); } else { t.style.display = 'none'; document.getElementById('recropBtn').classList.add('d-none'); } render(); }
        window.onresize = fitPreviewToScreen;

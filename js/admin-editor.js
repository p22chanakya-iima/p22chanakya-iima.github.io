// =============================================================================
// CONFIG
// =============================================================================
const CONFIG = {
    apiBaseUrl: 'https://portfolio-admin-api-murex.vercel.app',
    githubOwner: 'p22chanakya-iima',
    githubRepo: 'portfolio',
    githubBranch: 'main',
};
CONFIG.rawBase = `https://raw.githubusercontent.com/${CONFIG.githubOwner}/${CONFIG.githubRepo}/${CONFIG.githubBranch}/`;

// =============================================================================
// STATE
// =============================================================================
let data = { profile: null, experience: null, projects: null, blogPosts: null };
let dirty = {};          // which files have been modified
let currentPage = 'home';
let monacoEditor = null;
let monacoReady = false;
let editingBlogFile = null;
let blogOriginalContent = null;

// =============================================================================
// BOOT
// =============================================================================
document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('adminToken');
    const userJSON = localStorage.getItem('adminUser');
    if (!token || !userJSON) return redirectToLogin();

    let userInfo;
    try { userInfo = JSON.parse(userJSON); } catch { return redirectToLogin(); }
    if (userInfo.expiresAt && Date.now() > userInfo.expiresAt) return redirectToLogin();

    const valid = await verifyToken(token);
    if (!valid) return redirectToLogin();

    document.getElementById('userEmail').textContent = userInfo.email || '';

    showLoading(true);
    try {
        await loadAllData();
        setupNav();
        renderPage('home');
        initMonaco();
    } catch (e) {
        console.error(e);
        toast('Failed to load data: ' + e.message, 'error');
    }
    showLoading(false);
});

function redirectToLogin() {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    window.location.href = 'index.html';
}

async function verifyToken(token) {
    try {
        const r = await fetch(`${CONFIG.apiBaseUrl}/api/verify`, {
            method: 'POST', headers: { Authorization: `Bearer ${token}` },
        });
        return (await r.json()).valid === true;
    } catch { return false; }
}

// =============================================================================
// DATA LOADING
// =============================================================================
async function loadAllData() {
    const t = Date.now();
    const [profile, experience, projects, blogPosts] = await Promise.all([
        fetchJSON('data/profile.json', t),
        fetchJSON('data/experience.json', t),
        fetchJSON('data/projects.json', t),
        fetchJSON('data/blog-posts.json', t),
    ]);
    data.profile = profile;
    data.experience = experience.experience || [];
    data.projects = projects.projects || [];
    data.blogPosts = blogPosts.posts || [];
    dirty = {};
    renderBlogNav();
}

async function fetchJSON(path, t) {
    const r = await fetch(`${CONFIG.rawBase}${path}?t=${t}`);
    if (!r.ok) throw new Error(`Failed to load ${path}`);
    return r.json();
}

// =============================================================================
// NAVIGATION
// =============================================================================
function setupNav() {
    document.querySelectorAll('.nav-item[data-page]').forEach(el => {
        el.addEventListener('click', () => {
            currentPage = el.dataset.page;
            document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
            el.classList.add('active');
            renderPage(currentPage);
        });
    });

    document.getElementById('logoutBtn').addEventListener('click', () => {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminUser');
        window.location.href = 'index.html';
    });

    document.getElementById('saveBtn').addEventListener('click', () => {
        document.getElementById('commitModal').classList.add('show');
        const ci = document.getElementById('commitInput');
        ci.value = '';
        ci.focus();
    });

    document.getElementById('commitBtn').addEventListener('click', commitAll);
    document.getElementById('commitInput').addEventListener('keydown', e => {
        if (e.key === 'Enter') commitAll();
    });

    document.addEventListener('keydown', e => {
        if ((e.metaKey || e.ctrlKey) && e.key === 's') {
            e.preventDefault();
            if (!document.getElementById('saveBtn').disabled) {
                document.getElementById('saveBtn').click();
            }
        }
    });
}

function renderBlogNav() {
    const nav = document.getElementById('blogPostsNav');
    nav.innerHTML = '';
    data.blogPosts.forEach(p => {
        const el = document.createElement('div');
        el.className = 'nav-item';
        el.dataset.page = 'blogpost';
        el.dataset.file = p.content_file;
        el.textContent = p.title;
        el.addEventListener('click', () => openBlogPost(p));
        nav.appendChild(el);
    });
}

const PAGE_INFO = {
    home: { title: 'Home Page', sub: 'Hero section and featured content' },
    about: { title: 'About Page', sub: 'Bio, experience, skills, education' },
    work: { title: 'Work / Projects', sub: 'All projects — add, edit, delete' },
    writing: { title: 'Writing / Blog', sub: 'Blog post metadata — add, edit, delete' },
    contact: { title: 'Contact Page', sub: 'Email, social links, open to' },
    raw: { title: 'Raw JSON Editor', sub: 'Edit JSON files directly' },
    blogpost: { title: 'Blog Post', sub: 'Edit markdown content' },
};

// =============================================================================
// PAGE RENDERING
// =============================================================================
function renderPage(page) {
    currentPage = page;
    const info = PAGE_INFO[page] || { title: page, sub: '' };
    document.getElementById('pageTitle').textContent = info.title;
    document.getElementById('pageSub').textContent = info.sub;

    // Show form, hide monaco
    document.getElementById('form-wrapper').classList.remove('hide');
    document.getElementById('monaco-wrapper').classList.remove('show');
    editingBlogFile = null;

    const c = document.getElementById('form-wrapper');
    c.innerHTML = '';

    const renderers = { home: renderHome, about: renderAbout, work: renderWork, writing: renderWriting, contact: renderContact, raw: renderRaw };
    if (renderers[page]) renderers[page](c);
    updateSaveButton();
}

// ---- HOME ----
function renderHome(c) {
    const p = data.profile;

    c.innerHTML = `
    <div class="section">
        <div class="section-header"><div class="section-title">Hero Section</div></div>
        <div class="field-group">
            ${fieldRow('Name', 'text', p.name, v => { p.name = v; markDirty('profile'); })}
            ${fieldRow('Title', 'text', p.title, v => { p.title = v; markDirty('profile'); })}
            ${fieldRow('Tagline', 'text', p.tagline, v => { p.tagline = v; markDirty('profile'); })}
        </div>
    </div>
    <div class="section">
        <div class="section-header"><div class="section-title">Featured Projects</div></div>
        <div id="home-featured"></div>
    </div>
    <div class="section">
        <div class="section-header"><div class="section-title">Featured Blog Posts</div></div>
        <div id="home-featured-posts"></div>
    </div>`;
    bindFields(c);

    // Featured projects
    const fp = document.getElementById('home-featured');
    data.projects.filter(x => x.featured).forEach(proj => {
        fp.innerHTML += itemCard(proj.title, `${proj.role} — ${proj.status}`, proj.tagline,
            [proj.featured ? 'Featured' : ''],
            () => openProjectModal(proj));
    });
    if (!data.projects.some(x => x.featured)) fp.innerHTML = '<div class="empty-state"><p>No featured projects. Edit projects in the Work page.</p></div>';

    // Featured posts
    const fbp = document.getElementById('home-featured-posts');
    data.blogPosts.filter(x => x.featured).forEach(post => {
        fbp.innerHTML += itemCard(post.title, post.date, post.excerpt, post.tags);
    });
    if (!data.blogPosts.some(x => x.featured)) fbp.innerHTML = '<div class="empty-state"><p>No featured posts. Edit posts in the Writing page.</p></div>';
}

// ---- ABOUT ----
function renderAbout(c) {
    const p = data.profile;

    c.innerHTML = `
    <div class="section">
        <div class="section-header"><div class="section-title">Bio</div></div>
        <div class="field-group">
            ${fieldRow('Paragraph 1', 'textarea', (p.bio||[])[0]||'', v => { if(!p.bio) p.bio=[]; p.bio[0]=v; markDirty('profile'); })}
            ${fieldRow('Paragraph 2', 'textarea', (p.bio||[])[1]||'', v => { if(!p.bio) p.bio=[]; p.bio[1]=v; markDirty('profile'); })}
            ${fieldRow('Paragraph 3', 'textarea', (p.bio||[])[2]||'', v => { if(!p.bio) p.bio=[]; p.bio[2]=v; markDirty('profile'); })}
            ${fieldRow('Company', 'text', p.current_company, v => { p.current_company=v; markDirty('profile'); })}
            ${fieldRow('Role', 'text', p.current_role, v => { p.current_role=v; markDirty('profile'); })}
        </div>
    </div>

    <div class="section">
        <div class="section-header">
            <div class="section-title">Experience</div>
            <button class="btn btn-add" onclick="addExperience()">+ Add</button>
        </div>
        <div id="experience-list"></div>
    </div>

    <div class="section">
        <div class="section-header"><div class="section-title">Skills</div></div>
        <div class="field-group">
            <div class="field-row"><div class="field-label">Product</div><div class="list-editor" id="skills-product"></div></div>
            <div class="field-row"><div class="field-label">Tools</div><div class="list-editor" id="skills-tools"></div></div>
            <div class="field-row"><div class="field-label">Methodologies</div><div class="list-editor" id="skills-methods"></div></div>
        </div>
    </div>

    <div class="section">
        <div class="section-header">
            <div class="section-title">Education</div>
            <button class="btn btn-add" onclick="addEducation()">+ Add</button>
        </div>
        <div id="education-list"></div>
    </div>

    <div class="section">
        <div class="section-header"><div class="section-title">Currently</div></div>
        <div class="field-group">
            ${fieldRow('Working on', 'text', (p.currently||{}).working_on||'', v => { if(!p.currently) p.currently={}; p.currently.working_on=v; markDirty('profile'); })}
            ${fieldRow('Learning', 'text', (p.currently||{}).learning||'', v => { if(!p.currently) p.currently={}; p.currently.learning=v; markDirty('profile'); })}
            ${fieldRow('Reading', 'text', (p.currently||{}).reading||'', v => { if(!p.currently) p.currently={}; p.currently.reading=v; markDirty('profile'); })}
        </div>
    </div>

    <div class="section">
        <div class="section-header"><div class="section-title">Fun Facts</div></div>
        <div class="field-group"><div class="list-editor" id="fun-facts-list"></div></div>
    </div>`;

    bindFields(c);

    // Experience cards
    const el = document.getElementById('experience-list');
    data.experience.forEach((exp, i) => {
        el.innerHTML += itemCard(
            `${exp.role} @ ${exp.company}`, `${exp.date_start} — ${exp.date_end || 'Present'}`,
            exp.description, [exp.type],
            () => openExperienceModal(i),
            () => deleteItem(data.experience, i, 'experience', 'experience-list', renderExperienceList)
        );
    });

    // Skills
    renderListEditor('skills-product', p.skills?.product || [], v => { if(!p.skills) p.skills={}; p.skills.product=v; markDirty('profile'); });
    renderListEditor('skills-tools', p.skills?.tools || [], v => { if(!p.skills) p.skills={}; p.skills.tools=v; markDirty('profile'); });
    renderListEditor('skills-methods', p.skills?.methodologies || [], v => { if(!p.skills) p.skills={}; p.skills.methodologies=v; markDirty('profile'); });

    // Education
    const edl = document.getElementById('education-list');
    (p.education||[]).forEach((edu, i) => {
        edl.innerHTML += itemCard(
            `${edu.degree} — ${edu.institution}`, edu.year,
            edu.notes, [],
            () => openEducationModal(i),
            () => { p.education.splice(i, 1); markDirty('profile'); renderPage('about'); }
        );
    });

    // Fun facts
    renderListEditor('fun-facts-list', p.fun_facts || [], v => { p.fun_facts = v; markDirty('profile'); });
}

// ---- WORK ----
function renderWork(c) {
    c.innerHTML = `
    <div class="section">
        <div class="section-header">
            <div class="section-title">Projects (${data.projects.length})</div>
            <button class="btn btn-add" onclick="addProject()">+ Add Project</button>
        </div>
        <div id="projects-list"></div>
    </div>`;
    renderProjectsList();
}

function renderProjectsList() {
    const el = document.getElementById('projects-list');
    if (!el) return;
    el.innerHTML = '';
    data.projects.forEach((proj, i) => {
        const tags = [...(proj.tags||[])];
        if (proj.featured) tags.unshift('Featured');
        if (proj.status === 'Live') tags.unshift('Live');
        el.innerHTML += itemCard(
            proj.title, `${proj.role || ''} ${proj.company ? '@ '+proj.company : ''} — ${proj.status || ''}`,
            proj.tagline, tags,
            () => openProjectModal(proj, i),
            () => { data.projects.splice(i, 1); markDirty('projects'); renderProjectsList(); }
        );
    });
}

// ---- WRITING ----
function renderWriting(c) {
    c.innerHTML = `
    <div class="section">
        <div class="section-header">
            <div class="section-title">Blog Posts (${data.blogPosts.length})</div>
            <button class="btn btn-add" onclick="addBlogPost()">+ Add Post</button>
        </div>
        <div id="posts-list"></div>
    </div>`;
    renderPostsList();
}

function renderPostsList() {
    const el = document.getElementById('posts-list');
    if (!el) return;
    el.innerHTML = '';
    data.blogPosts.forEach((post, i) => {
        const tags = [...(post.tags||[])];
        if (post.featured) tags.unshift('Featured');
        el.innerHTML += itemCard(
            post.title, post.date,
            post.excerpt, tags,
            () => openBlogPostModal(post, i),
            () => { data.blogPosts.splice(i, 1); markDirty('blogPosts'); renderPostsList(); },
            `<button class="btn btn-edit" onclick="event.stopPropagation(); openBlogPost(data.blogPosts[${i}])">Edit Content</button>`
        );
    });
}

// ---- CONTACT ----
function renderContact(c) {
    const p = data.profile;
    c.innerHTML = `
    <div class="section">
        <div class="section-header"><div class="section-title">Contact Info</div></div>
        <div class="field-group">
            ${fieldRow('Email', 'text', p.email||'', v => { p.email=v; markDirty('profile'); })}
            ${fieldRow('Location', 'text', p.location||'', v => { p.location=v; markDirty('profile'); })}
            ${fieldRow('Resume URL', 'text', p.resume_url||'', v => { p.resume_url=v; markDirty('profile'); })}
            ${fieldRow('Calendar URL', 'text', p.calendar_url||'', v => { p.calendar_url=v; markDirty('profile'); })}
        </div>
    </div>
    <div class="section">
        <div class="section-header"><div class="section-title">Social Links</div></div>
        <div class="field-group">
            ${fieldRow('GitHub', 'text', (p.social||{}).github||'', v => { if(!p.social) p.social={}; p.social.github=v; markDirty('profile'); })}
            ${fieldRow('LinkedIn', 'text', (p.social||{}).linkedin||'', v => { if(!p.social) p.social={}; p.social.linkedin=v; markDirty('profile'); })}
            ${fieldRow('Twitter', 'text', (p.social||{}).twitter||'', v => { if(!p.social) p.social={}; p.social.twitter=v; markDirty('profile'); })}
            ${fieldRow('Medium', 'text', (p.social||{}).medium||'', v => { if(!p.social) p.social={}; p.social.medium=v; markDirty('profile'); })}
        </div>
    </div>
    <div class="section">
        <div class="section-header"><div class="section-title">Open To</div></div>
        <div class="field-group"><div class="list-editor" id="open-to-list"></div></div>
    </div>`;
    bindFields(c);
    renderListEditor('open-to-list', p.open_to||[], v => { p.open_to = v; markDirty('profile'); });
}

// ---- RAW JSON ----
function renderRaw(c) {
    const files = [
        { label: 'profile.json', path: 'data/profile.json', key: 'profile' },
        { label: 'experience.json', path: 'data/experience.json', key: 'experience' },
        { label: 'projects.json', path: 'data/projects.json', key: 'projects' },
        { label: 'blog-posts.json', path: 'data/blog-posts.json', key: 'blogPosts' },
    ];
    c.innerHTML = `<div class="section"><div class="section-title" style="margin-bottom:12px">Select a file to edit raw JSON</div>
        ${files.map(f => `<div class="item-card" style="cursor:pointer" onclick="openRawEditor('${f.path}','${f.key}')">${f.label}</div>`).join('')}
    </div>`;
}

// =============================================================================
// FIELD HELPERS
// =============================================================================
let fieldCallbacks = [];

function fieldRow(label, type, value, onChange) {
    const id = 'f' + fieldCallbacks.length;
    fieldCallbacks.push(onChange);
    if (type === 'textarea') {
        return `<div class="field-row"><div class="field-label">${label}</div><textarea class="field-input" data-fid="${id}">${esc(value)}</textarea></div>`;
    }
    return `<div class="field-row"><div class="field-label">${label}</div><input class="field-input" type="text" data-fid="${id}" value="${esc(value)}"></div>`;
}

function bindFields(container) {
    container.querySelectorAll('[data-fid]').forEach(el => {
        const cb = fieldCallbacks[parseInt(el.dataset.fid)];
        if (cb) el.addEventListener('input', () => { cb(el.value); updateSaveButton(); });
    });
    fieldCallbacks = [];
}

function esc(s) { return String(s||'').replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

function itemCard(title, sub, body, tags, onEdit, onDelete, extraBtn) {
    const tagHTML = (tags||[]).filter(Boolean).map(t => {
        let cls = 'tag';
        if (t === 'Featured') cls += ' featured';
        if (t === 'Live') cls += ' live';
        return `<span class="${cls}">${esc(t)}</span>`;
    }).join('');

    const editBtn = onEdit ? `<button class="btn btn-edit" onclick="event.stopPropagation(); (${onEdit.toString()})()">Edit</button>` : '';
    const deleteBtn = onDelete ? `<button class="btn btn-delete" onclick="event.stopPropagation(); if(confirm('Delete this item?')) (${onDelete.toString()})()">Del</button>` : '';

    return `<div class="item-card">
        <div class="item-card-header">
            <div><div class="item-card-title">${esc(title)}</div><div class="item-card-sub">${esc(sub)}</div></div>
            <div class="item-card-actions">${extraBtn||''}${editBtn}${deleteBtn}</div>
        </div>
        ${body ? `<div class="item-card-body">${esc(body)}</div>` : ''}
        ${tagHTML ? `<div style="margin-top:6px">${tagHTML}</div>` : ''}
    </div>`;
}

// =============================================================================
// LIST EDITOR (for skills, tags, fun facts, open_to)
// =============================================================================
function renderListEditor(containerId, arr, onChange) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = '';

    arr.forEach((item, i) => {
        const chip = document.createElement('span');
        chip.className = 'list-chip';
        chip.innerHTML = `${esc(item)} <span class="remove" title="Remove">&times;</span>`;
        chip.querySelector('.remove').addEventListener('click', () => {
            arr.splice(i, 1);
            onChange(arr);
            renderListEditor(containerId, arr, onChange);
            updateSaveButton();
        });
        container.appendChild(chip);
    });

    const input = document.createElement('input');
    input.className = 'list-add-input';
    input.placeholder = 'Add...';
    input.addEventListener('keydown', e => {
        if (e.key === 'Enter' && input.value.trim()) {
            arr.push(input.value.trim());
            onChange(arr);
            renderListEditor(containerId, arr, onChange);
            updateSaveButton();
        }
    });
    container.appendChild(input);
}

// =============================================================================
// MODALS — EXPERIENCE
// =============================================================================
function openExperienceModal(index) {
    const isNew = index === undefined;
    const exp = isNew ? { id:'', company:'', role:'', type:'Work', date_start:'', date_end:'', current:false, description:'', achievements:[], logo:'' } : data.experience[index];

    openModal(isNew ? 'Add Experience' : 'Edit Experience', `
        ${modalField('Company', 'exp-company', exp.company)}
        ${modalField('Role', 'exp-role', exp.role)}
        ${modalField('Type', 'exp-type', exp.type, 'select', ['Work','Education','Internship','Freelance'])}
        ${modalField('Start', 'exp-start', exp.date_start)}
        ${modalField('End', 'exp-end', exp.date_end, 'text', null, 'Leave blank for current')}
        ${modalField('Description', 'exp-desc', exp.description, 'textarea')}
        ${modalField('Achievements (one per line)', 'exp-ach', (exp.achievements||[]).join('\\n'), 'textarea')}
        ${modalField('Logo (2-letter)', 'exp-logo', exp.logo)}
    `, () => {
        exp.company = gv('exp-company');
        exp.role = gv('exp-role');
        exp.type = gv('exp-type');
        exp.date_start = gv('exp-start');
        exp.date_end = gv('exp-end');
        exp.current = !gv('exp-end');
        exp.description = gv('exp-desc');
        exp.achievements = gv('exp-ach').split('\n').map(s=>s.trim()).filter(Boolean);
        exp.logo = gv('exp-logo');
        if (!exp.id) exp.id = exp.company.toLowerCase().replace(/[^a-z0-9]+/g,'-');
        if (isNew) data.experience.push(exp);
        markDirty('experience');
        closeModal();
        renderPage('about');
    });
}

function addExperience() { openExperienceModal(); }

// =============================================================================
// MODALS — EDUCATION
// =============================================================================
function openEducationModal(index) {
    const isNew = index === undefined;
    const edu = isNew ? { degree:'', institution:'', year:'', notes:'' } : data.profile.education[index];

    openModal(isNew ? 'Add Education' : 'Edit Education', `
        ${modalField('Degree', 'edu-degree', edu.degree)}
        ${modalField('Institution', 'edu-inst', edu.institution)}
        ${modalField('Year', 'edu-year', edu.year)}
        ${modalField('Notes', 'edu-notes', edu.notes)}
    `, () => {
        edu.degree = gv('edu-degree');
        edu.institution = gv('edu-inst');
        edu.year = gv('edu-year');
        edu.notes = gv('edu-notes');
        if (isNew) { if (!data.profile.education) data.profile.education = []; data.profile.education.push(edu); }
        markDirty('profile');
        closeModal();
        renderPage('about');
    });
}

function addEducation() { openEducationModal(); }

// =============================================================================
// MODALS — PROJECTS
// =============================================================================
function openProjectModal(proj, index) {
    const isNew = index === undefined && !proj;
    const p = isNew ? { id:'', title:'', tagline:'', company:'', role:'', date:'', status:'In Progress', category:'Product', problem:'', solution:'', impact:[], tags:[], github:'', live_url:'', featured:false } : proj;

    openModal(isNew ? 'Add Project' : 'Edit Project', `
        ${modalField('Title', 'p-title', p.title)}
        ${modalField('Tagline', 'p-tagline', p.tagline)}
        ${modalField('Company', 'p-company', p.company)}
        ${modalField('Role', 'p-role', p.role)}
        ${modalField('Date', 'p-date', p.date, 'text', null, 'e.g. 2026-02')}
        ${modalField('Status', 'p-status', p.status, 'select', ['Live','In Progress','Completed','Archived'])}
        ${modalField('Category', 'p-category', p.category, 'select', ['Product','Side Project','Research','Design','Other'])}
        ${modalField('Problem', 'p-problem', p.problem, 'textarea')}
        ${modalField('Solution', 'p-solution', p.solution, 'textarea')}
        ${modalField('Impact (one per line)', 'p-impact', (p.impact||[]).join('\\n'), 'textarea')}
        ${modalField('Tags (comma-separated)', 'p-tags', (p.tags||[]).join(', '))}
        ${modalField('GitHub URL', 'p-github', p.github)}
        ${modalField('Live URL', 'p-live', p.live_url)}
        <div class="field-row">
            <div class="field-label">Featured</div>
            <label style="display:flex;align-items:center;gap:8px;color:#cbd5e1;font-size:13px">
                <input type="checkbox" id="p-featured" ${p.featured?'checked':''}>
                Show on homepage
            </label>
        </div>
    `, () => {
        p.title = gv('p-title');
        p.tagline = gv('p-tagline');
        p.company = gv('p-company');
        p.role = gv('p-role');
        p.date = gv('p-date');
        p.status = gv('p-status');
        p.category = gv('p-category');
        p.problem = gv('p-problem');
        p.solution = gv('p-solution');
        p.impact = gv('p-impact').split('\n').map(s=>s.trim()).filter(Boolean);
        p.tags = gv('p-tags').split(',').map(s=>s.trim()).filter(Boolean);
        p.github = gv('p-github');
        p.live_url = gv('p-live');
        p.featured = document.getElementById('p-featured').checked;
        if (!p.id) p.id = p.title.toLowerCase().replace(/[^a-z0-9]+/g,'-');
        if (isNew) data.projects.push(p);
        markDirty('projects');
        closeModal();
        renderPage(currentPage);
    });
}

function addProject() { openProjectModal(null); }

// =============================================================================
// MODALS — BLOG POSTS (metadata)
// =============================================================================
function openBlogPostModal(post, index) {
    const isNew = index === undefined && !post;
    const p = isNew ? { id:'', title:'', date: new Date().toISOString().split('T')[0], tags:[], excerpt:'', content_file:'', featured:false } : post;

    openModal(isNew ? 'Add Blog Post' : 'Edit Blog Post Metadata', `
        ${modalField('Title', 'bp-title', p.title)}
        ${modalField('Slug / ID', 'bp-id', p.id, 'text', null, 'e.g. my-new-post')}
        ${modalField('Date', 'bp-date', p.date, 'text', null, 'YYYY-MM-DD')}
        ${modalField('Excerpt', 'bp-excerpt', p.excerpt, 'textarea')}
        ${modalField('Tags (comma-separated)', 'bp-tags', (p.tags||[]).join(', '))}
        <div class="field-row">
            <div class="field-label">Featured</div>
            <label style="display:flex;align-items:center;gap:8px;color:#cbd5e1;font-size:13px">
                <input type="checkbox" id="bp-featured" ${p.featured?'checked':''}>
                Show on homepage
            </label>
        </div>
    `, () => {
        p.title = gv('bp-title');
        p.id = gv('bp-id').toLowerCase().replace(/[^a-z0-9-]+/g,'-');
        p.date = gv('bp-date');
        p.excerpt = gv('bp-excerpt');
        p.tags = gv('bp-tags').split(',').map(s=>s.trim()).filter(Boolean);
        p.featured = document.getElementById('bp-featured').checked;
        p.content_file = `blog/posts/${p.id}.md`;
        if (isNew) data.blogPosts.push(p);
        markDirty('blogPosts');
        closeModal();
        renderPage('writing');
        renderBlogNav();
    });
}

function addBlogPost() { openBlogPostModal(null); }

// =============================================================================
// BLOG POST EDITOR (Monaco)
// =============================================================================
async function openBlogPost(post) {
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    // highlight the right sidebar item
    document.querySelectorAll('#blogPostsNav .nav-item').forEach(n => {
        if (n.dataset.file === post.content_file) n.classList.add('active');
    });

    document.getElementById('pageTitle').textContent = post.title;
    document.getElementById('pageSub').textContent = post.content_file;
    document.getElementById('form-wrapper').classList.add('hide');
    document.getElementById('monaco-wrapper').classList.add('show');
    editingBlogFile = post.content_file;

    showLoading(true);
    try {
        let content;
        try {
            const r = await fetch(`${CONFIG.rawBase}${post.content_file}?t=${Date.now()}`);
            if (r.ok) { content = await r.text(); }
            else { content = `---\ntitle: "${post.title}"\ndate: ${post.date}\n---\n\n# ${post.title}\n\nWrite your content here...\n`; }
        } catch {
            content = `---\ntitle: "${post.title}"\ndate: ${post.date}\n---\n\n# ${post.title}\n\nWrite your content here...\n`;
        }

        if (monacoReady && monacoEditor) {
            monaco.editor.setModelLanguage(monacoEditor.getModel(), 'markdown');
            monacoEditor.setValue(content);
            blogOriginalContent = content;
        }
    } catch (e) {
        toast('Failed to load blog post: ' + e.message, 'error');
    }
    showLoading(false);
}

function initMonaco() {
    require.config({ paths: { vs: 'https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/min/vs' } });
    require(['vs/editor/editor.main'], () => {
        monacoEditor = monaco.editor.create(document.getElementById('monaco-wrapper'), {
            value: '// Select a blog post from the sidebar',
            language: 'markdown',
            theme: 'vs-dark',
            fontSize: 14,
            minimap: { enabled: false },
            automaticLayout: true,
            scrollBeyondLastLine: false,
            wordWrap: 'on',
        });
        monacoReady = true;

        monacoEditor.onDidChangeModelContent(() => {
            if (editingBlogFile && blogOriginalContent !== null) {
                const changed = monacoEditor.getValue() !== blogOriginalContent;
                if (changed) dirty._blogContent = true; else delete dirty._blogContent;
                updateSaveButton();
            }
        });
    });
}

// =============================================================================
// RAW EDITOR
// =============================================================================
function openRawEditor(path, key) {
    document.getElementById('pageTitle').textContent = path;
    document.getElementById('pageSub').textContent = 'Raw JSON editor';
    document.getElementById('form-wrapper').classList.add('hide');
    document.getElementById('monaco-wrapper').classList.add('show');

    let content;
    if (key === 'profile') content = JSON.stringify(data.profile, null, 2);
    else if (key === 'experience') content = JSON.stringify({ experience: data.experience }, null, 2);
    else if (key === 'projects') content = JSON.stringify({ projects: data.projects }, null, 2);
    else if (key === 'blogPosts') content = JSON.stringify({ posts: data.blogPosts }, null, 2);

    editingBlogFile = null;
    blogOriginalContent = null;

    // Use a special mode for raw editing
    const rawPath = path;
    const rawKey = key;

    if (monacoReady && monacoEditor) {
        monaco.editor.setModelLanguage(monacoEditor.getModel(), 'json');
        monacoEditor.setValue(content);
        const origContent = content;

        // Override the change listener
        monacoEditor._rawKey = rawKey;
        monacoEditor._rawPath = rawPath;
        monacoEditor._rawOrig = origContent;
    }
}

// =============================================================================
// MODAL FRAMEWORK
// =============================================================================
function modalField(label, id, value, type, options, placeholder) {
    type = type || 'text';
    if (type === 'select') {
        const opts = (options||[]).map(o => `<option value="${esc(o)}" ${o===value?'selected':''}>${esc(o)}</option>`).join('');
        return `<div class="field-row"><div class="field-label">${label}</div><select class="field-input" id="${id}">${opts}</select></div>`;
    }
    if (type === 'textarea') {
        return `<div class="field-row"><div class="field-label">${label}</div><textarea class="field-input" id="${id}" placeholder="${esc(placeholder||'')}">${esc(value)}</textarea></div>`;
    }
    return `<div class="field-row"><div class="field-label">${label}</div><input class="field-input" type="text" id="${id}" value="${esc(value)}" placeholder="${esc(placeholder||'')}"></div>`;
}

function gv(id) { return (document.getElementById(id)?.value || '').trim(); }

function openModal(title, bodyHTML, onSave) {
    document.getElementById('modalTitle').textContent = title;
    document.getElementById('modalBody').innerHTML = bodyHTML;
    document.getElementById('modalSave').onclick = onSave;
    document.getElementById('modal').classList.add('show');
}

function closeModal() { document.getElementById('modal').classList.remove('show'); }

// =============================================================================
// DIRTY TRACKING & SAVE
// =============================================================================
function markDirty(key) { dirty[key] = true; updateSaveButton(); }

function updateSaveButton() {
    document.getElementById('saveBtn').disabled = Object.keys(dirty).length === 0;
}

async function commitAll() {
    const msg = document.getElementById('commitInput').value.trim();
    if (msg.length < 3) {
        document.getElementById('commitInput').style.borderColor = '#ef4444';
        return;
    }
    document.getElementById('commitModal').classList.remove('show');
    showLoading(true);

    const token = localStorage.getItem('adminToken');
    if (!token) return redirectToLogin();

    const filesToCommit = [];

    if (dirty.profile) {
        filesToCommit.push({ path: 'data/profile.json', content: JSON.stringify(data.profile, null, 2) });
    }
    if (dirty.experience) {
        filesToCommit.push({ path: 'data/experience.json', content: JSON.stringify({ experience: data.experience }, null, 2) });
    }
    if (dirty.projects) {
        filesToCommit.push({ path: 'data/projects.json', content: JSON.stringify({ projects: data.projects }, null, 2) });
    }
    if (dirty.blogPosts) {
        filesToCommit.push({ path: 'data/blog-posts.json', content: JSON.stringify({ posts: data.blogPosts }, null, 2) });
    }
    if (dirty._blogContent && editingBlogFile && monacoEditor) {
        filesToCommit.push({ path: editingBlogFile, content: monacoEditor.getValue() });
    }

    // Also check if we're in raw editor mode
    if (monacoEditor && monacoEditor._rawKey && document.getElementById('monaco-wrapper').classList.contains('show')) {
        const rawContent = monacoEditor.getValue();
        try {
            const parsed = JSON.parse(rawContent);
            if (monacoEditor._rawKey === 'profile') { data.profile = parsed; filesToCommit.push({ path: 'data/profile.json', content: rawContent }); }
            else if (monacoEditor._rawKey === 'experience') { data.experience = parsed.experience || []; filesToCommit.push({ path: 'data/experience.json', content: rawContent }); }
            else if (monacoEditor._rawKey === 'projects') { data.projects = parsed.projects || []; filesToCommit.push({ path: 'data/projects.json', content: rawContent }); }
            else if (monacoEditor._rawKey === 'blogPosts') { data.blogPosts = parsed.posts || []; filesToCommit.push({ path: 'data/blog-posts.json', content: rawContent }); }
        } catch (e) {
            toast('Invalid JSON: ' + e.message, 'error');
            showLoading(false);
            return;
        }
    }

    if (filesToCommit.length === 0) {
        toast('No changes to save', 'error');
        showLoading(false);
        return;
    }

    let success = 0;
    let lastError = '';

    for (const file of filesToCommit) {
        try {
            const r = await fetch(`${CONFIG.apiBaseUrl}/api/commit`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ path: file.path, content: file.content, message: msg }),
            });
            const d = await r.json();
            if (r.status === 401) { toast('Session expired', 'error'); setTimeout(redirectToLogin, 1500); return; }
            if (!r.ok) throw new Error(d.message || d.error);
            success++;
        } catch (e) {
            lastError = e.message;
            console.error(`Failed to commit ${file.path}:`, e);
        }
    }

    if (success === filesToCommit.length) {
        dirty = {};
        if (blogOriginalContent !== null && monacoEditor) blogOriginalContent = monacoEditor.getValue();
        if (monacoEditor) { monacoEditor._rawKey = null; monacoEditor._rawOrig = null; }
        updateSaveButton();
        toast(`Saved ${success} file${success>1?'s':''} to GitHub!`, 'success');
        renderBlogNav();
    } else {
        toast(`${success}/${filesToCommit.length} saved. Error: ${lastError}`, 'error');
    }

    showLoading(false);
}

// =============================================================================
// UI HELPERS
// =============================================================================
let toastTimer;
function toast(msg, type) {
    const el = document.getElementById('toast');
    el.textContent = msg;
    el.className = `toast show ${type}`;
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('show'), 5000);
}

function showLoading(on) { document.getElementById('loading').classList.toggle('show', on); }

function deleteItem(arr, index, dirtyKey) {
    arr.splice(index, 1);
    markDirty(dirtyKey);
    renderPage(currentPage);
}

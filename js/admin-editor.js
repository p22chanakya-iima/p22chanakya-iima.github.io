// =============================================================================
// Portfolio Admin — Inline WYSIWYG Editor
// Renders the actual site content with hover edit/delete/add overlays
// =============================================================================

// =============================================================================
// A. CONFIG & STATE
// =============================================================================
const CONFIG = {
    apiBaseUrl: 'https://portfolio-admin-api-murex.vercel.app',
    githubOwner: 'p22chanakya-iima',
    githubRepo: 'portfolio',
    githubBranch: 'main',
};
CONFIG.rawBase = `https://raw.githubusercontent.com/${CONFIG.githubOwner}/${CONFIG.githubRepo}/${CONFIG.githubBranch}/`;

let data = { profile: null, experience: null, projects: null, blogPosts: null };
let dirty = {};
let currentPage = 'home';
let monacoEditor = null;
let monacoReady = false;
let editingBlogFile = null;
let blogOriginalContent = null;

// =============================================================================
// B. AUTH
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

    showLoading(true);
    try {
        await loadAllData();
        setupToolbar();
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
// C. DATA LOADING
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
}

async function fetchJSON(path, t) {
    const r = await fetch(`${CONFIG.rawBase}${path}?t=${t}`);
    if (!r.ok) throw new Error(`Failed to load ${path}`);
    return r.json();
}

// =============================================================================
// D. TOOLBAR & NAVIGATION
// =============================================================================
function setupToolbar() {
    // Tab switching
    document.querySelectorAll('.admin-toolbar__tab').forEach(tab => {
        tab.addEventListener('click', () => {
            currentPage = tab.dataset.page;
            document.querySelectorAll('.admin-toolbar__tab').forEach(t => t.classList.remove('admin-toolbar__tab--active'));
            tab.classList.add('admin-toolbar__tab--active');
            renderPage(currentPage);
        });
    });

    // Save button
    document.getElementById('saveBtn').addEventListener('click', () => {
        const modal = document.getElementById('commitModal');
        const filesEl = document.getElementById('commitFiles');
        const fileList = getDirtyFileList();
        filesEl.textContent = 'Files: ' + fileList.map(f => f.path).join(', ');
        modal.classList.add('show');
        const ci = document.getElementById('commitInput');
        ci.value = '';
        setTimeout(() => ci.focus(), 100);
    });

    // Commit
    document.getElementById('commitBtn').addEventListener('click', commitAll);
    document.getElementById('commitInput').addEventListener('keydown', e => {
        if (e.key === 'Enter') commitAll();
    });

    // Logout
    document.getElementById('logoutBtn').addEventListener('click', () => {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminUser');
        window.location.href = 'index.html';
    });

    // Ctrl+S
    document.addEventListener('keydown', e => {
        if ((e.metaKey || e.ctrlKey) && e.key === 's') {
            e.preventDefault();
            if (!document.getElementById('saveBtn').disabled) {
                document.getElementById('saveBtn').click();
            }
        }
    });
}

function updateSaveButton() {
    const hasDirty = Object.keys(dirty).length > 0;
    document.getElementById('saveBtn').disabled = !hasDirty;
    const status = document.getElementById('adminStatus');
    if (hasDirty) {
        status.textContent = 'Unsaved changes';
        status.className = 'admin-toolbar__status admin-toolbar__status--dirty';
    } else {
        status.textContent = 'No changes';
        status.className = 'admin-toolbar__status';
    }
}

// =============================================================================
// E. PAGE RENDERING — Renders actual site markup
// =============================================================================
function renderPage(page) {
    currentPage = page;
    const content = document.getElementById('admin-content');
    content.innerHTML = '';

    const renderers = {
        home: renderHome,
        about: renderAbout,
        work: renderWork,
        writing: renderWriting,
        contact: renderContact,
    };

    if (renderers[page]) renderers[page](content);
    updateSaveButton();
}

// ---- HOME PAGE ----
function renderHome(c) {
    const p = data.profile;

    // Hero section
    const heroHTML = `
        <section class="hero container--narrow">
            <h1 class="hero__name">${esc(p.name)}</h1>
            <p class="hero__title">${esc(p.title)}</p>
            <p class="hero__bio">${esc(p.tagline)} Currently at ${esc(p.current_company)}.</p>
            <div class="hero__cta">
                <span class="btn btn--primary">View My Work</span>
                <span class="btn">About Me</span>
            </div>
        </section>`;
    c.innerHTML += wrapSection(heroHTML, { section: 'hero', onEdit: () => editHero() });

    // Featured Projects
    const featured = data.projects.filter(x => x.featured);
    let featuredCards = '';
    featured.forEach((proj, i) => {
        const realIndex = data.projects.indexOf(proj);
        const card = buildProjectCard(proj);
        featuredCards += wrapSection(card, {
            section: 'project',
            onEdit: () => editProject(realIndex),
            onDelete: () => deleteProject(realIndex),
        });
    });

    const featuredSection = `
        <section class="section section--alt">
            <div class="container">
                <div class="section__header">
                    <h2 class="section__title">Featured Work</h2>
                    <p class="section__subtitle">Projects I've built and shipped.</p>
                </div>
                <div class="projects-grid">${featuredCards}</div>
            </div>
        </section>`;
    c.innerHTML += featuredSection;

    // Recent Writing
    const recentPosts = data.blogPosts.slice(0, 3);
    let postsHTML = '';
    if (recentPosts.length === 0) {
        postsHTML = '<div class="admin-empty"><div class="admin-empty__text">No blog posts yet. Go to the Writing tab to add some.</div></div>';
    } else {
        recentPosts.forEach((post, i) => {
            const postCard = buildPostCard(post);
            postsHTML += wrapSection(postCard, {
                section: 'blogpost',
                onEdit: () => editBlogPost(i),
                onDelete: () => deleteBlogPost(i),
            });
        });
    }

    const writingSection = `
        <section class="section">
            <div class="container--narrow">
                <div class="section__header">
                    <h2 class="section__title">Recent Writing</h2>
                    <p class="section__subtitle">Thoughts on product, building, and learning.</p>
                </div>
                <div class="posts-list">${postsHTML}</div>
            </div>
        </section>`;
    c.innerHTML += writingSection;
}

// ---- ABOUT PAGE ----
function renderAbout(c) {
    const p = data.profile;

    // Page header
    c.innerHTML += `
        <main class="container--narrow">
            <header class="page-header">
                <h1 class="page-header__title">About Me</h1>
                <p class="page-header__subtitle">Problem solver. Builder. Trivia nerd.</p>
            </header>
        </main>`;

    // Bio
    const bioHTML = `
        <section class="section">
            <div class="container--narrow">
                <div class="about__bio">
                    ${(p.bio || []).map(para => `<p>${esc(para)}</p>`).join('')}
                </div>
            </div>
        </section>`;
    c.innerHTML += wrapSection(bioHTML, { section: 'bio', onEdit: () => editBio() });

    // Experience
    let expItems = '';
    data.experience.forEach((exp, i) => {
        const item = `
            <div class="timeline__item">
                <div class="timeline__dot"></div>
                <div class="timeline__date">${esc(exp.date_start)}${exp.date_end ? ' — ' + esc(exp.date_end) : exp.current ? ' — Present' : ''}</div>
                <div class="timeline__role">${esc(exp.role)}</div>
                <div class="timeline__company">${esc(exp.company)}</div>
                ${exp.description ? `<div class="timeline__description">${esc(exp.description)}</div>` : ''}
                ${(exp.achievements && exp.achievements.length) ? `<ul class="timeline__achievements">${exp.achievements.map(a => `<li>${esc(a)}</li>`).join('')}</ul>` : ''}
            </div>`;
        expItems += wrapSection(item, {
            section: 'experience',
            onEdit: () => editExperience(i),
            onDelete: () => deleteExperience(i),
        });
    });

    c.innerHTML += `
        <section class="section">
            <div class="container--narrow">
                <div class="section__header">
                    <h2 class="section__title">Experience</h2>
                </div>
                <div class="timeline">${expItems}</div>
                <div class="admin-add-row">
                    <button class="admin-btn admin-btn--add" onclick="addExperience()">+ Add Experience</button>
                </div>
            </div>
        </section>`;

    // Currently
    const cur = p.currently || {};
    const currentlyHTML = `
        <section class="section">
            <div class="container--narrow">
                <div class="section__header">
                    <h2 class="section__title">Currently</h2>
                </div>
                <div class="currently-grid">
                    <div><div class="currently-item__label">Working on</div><div class="currently-item__value">${esc(cur.working_on || '')}</div></div>
                    <div><div class="currently-item__label">Learning</div><div class="currently-item__value">${esc(cur.learning || '')}</div></div>
                    <div><div class="currently-item__label">Reading</div><div class="currently-item__value">${esc(cur.reading || '')}</div></div>
                </div>
            </div>
        </section>`;
    c.innerHTML += wrapSection(currentlyHTML, { section: 'currently', onEdit: () => editCurrently() });

    // Fun Facts
    const factsHTML = `
        <section class="section">
            <div class="container--narrow">
                <div class="section__header">
                    <h2 class="section__title">A Few More Things</h2>
                </div>
                <ul style="padding-left: 1.25em; line-height: 2;">
                    ${(p.fun_facts || []).map(f => `<li>${esc(f)}</li>`).join('')}
                </ul>
            </div>
        </section>`;
    c.innerHTML += wrapSection(factsHTML, { section: 'funfacts', onEdit: () => editFunFacts() });
}

// ---- WORK PAGE ----
function renderWork(c) {
    c.innerHTML += `
        <main class="container">
            <header class="page-header">
                <h1 class="page-header__title">Work</h1>
                <p class="page-header__subtitle">Products and projects I've built, shipped, and learned from.</p>
            </header>
            <div class="admin-add-row" style="justify-content:flex-end;margin-bottom:var(--space-sm)">
                <button class="admin-btn admin-btn--add" onclick="addProject()">+ Add Project</button>
            </div>
        </main>`;

    let cardsHTML = '';
    data.projects.forEach((proj, i) => {
        const card = buildProjectCard(proj);
        cardsHTML += wrapSection(card, {
            section: 'project',
            onEdit: () => editProject(i),
            onDelete: () => deleteProject(i),
        });
    });

    if (data.projects.length === 0) {
        cardsHTML = '<div class="admin-empty"><div class="admin-empty__icon">&#128736;</div><div class="admin-empty__text">No projects yet. Click "+ Add Project" to create one.</div></div>';
    }

    c.innerHTML += `<div class="container"><div class="projects-grid">${cardsHTML}</div></div>`;
}

// ---- WRITING PAGE ----
function renderWriting(c) {
    c.innerHTML += `
        <main class="container--narrow">
            <header class="page-header">
                <h1 class="page-header__title">Writing</h1>
                <p class="page-header__subtitle">Thoughts on product, building, and the things I'm learning along the way.</p>
            </header>
            <div class="admin-add-row" style="justify-content:flex-end;margin-bottom:var(--space-sm)">
                <button class="admin-btn admin-btn--add" onclick="addBlogPost()">+ Add Post</button>
            </div>
        </main>`;

    let postsHTML = '';
    data.blogPosts.forEach((post, i) => {
        const card = buildPostCard(post);
        const wrapped = wrapSection(card, {
            section: 'blogpost',
            onEdit: () => editBlogPost(i),
            onDelete: () => deleteBlogPost(i),
            extraButtons: `<button class="admin-btn admin-btn--content" onclick="event.stopPropagation(); openBlogContent(${i})">Edit Content</button>`,
        });
        postsHTML += wrapped;
    });

    if (data.blogPosts.length === 0) {
        postsHTML = '<div class="admin-empty"><div class="admin-empty__icon">&#9997;</div><div class="admin-empty__text">No blog posts yet. Click "+ Add Post" to write something.</div></div>';
    }

    c.innerHTML += `<div class="container--narrow"><div class="posts-list">${postsHTML}</div></div>`;
}

// ---- CONTACT PAGE ----
function renderContact(c) {
    const p = data.profile;

    c.innerHTML += `
        <main class="container--narrow">
            <header class="page-header">
                <h1 class="page-header__title">Get in Touch</h1>
                <p class="page-header__subtitle">I'm always open to interesting conversations. Let's connect.</p>
            </header>
        </main>`;

    // Contact cards
    const social = p.social || {};
    const contactHTML = `
        <section class="section">
            <div class="container--narrow">
                <div class="contact-grid">
                    <div class="contact-card">
                        <div class="contact-card__icon">&#9993;</div>
                        <div class="contact-card__label">Email</div>
                        <div class="contact-card__value">${esc(p.email || '')}</div>
                    </div>
                    <div class="contact-card">
                        <div class="contact-card__icon">&#128205;</div>
                        <div class="contact-card__label">Location</div>
                        <div class="contact-card__value">${esc(p.location || '')}</div>
                    </div>
                    <div class="contact-card">
                        <div class="contact-card__icon">&#128279;</div>
                        <div class="contact-card__label">Social</div>
                        <div class="contact-card__value">
                            ${social.github ? `<a href="${esc(social.github)}" target="_blank">GitHub</a>` : ''}
                            ${social.github && social.linkedin ? ' &middot; ' : ''}
                            ${social.linkedin ? `<a href="${esc(social.linkedin)}" target="_blank">LinkedIn</a>` : ''}
                        </div>
                    </div>
                </div>
            </div>
        </section>`;
    c.innerHTML += wrapSection(contactHTML, { section: 'contactinfo', onEdit: () => editContactInfo() });

    // Open To
    const openToHTML = `
        <section class="section">
            <div class="container--narrow">
                <div class="section__header">
                    <h2 class="section__title">I'm open to</h2>
                </div>
                <ul style="padding-left: 1.25em; line-height: 2;">
                    ${(p.open_to || []).map(item => `<li>${esc(item)}</li>`).join('')}
                </ul>
            </div>
        </section>`;
    c.innerHTML += wrapSection(openToHTML, { section: 'opento', onEdit: () => editOpenTo() });
}

// =============================================================================
// F. SECTION WRAPPER — Adds hover overlay with edit/delete buttons
// =============================================================================
function wrapSection(html, opts) {
    const buttons = [];
    if (opts.extraButtons) buttons.push(opts.extraButtons);
    if (opts.onEdit) buttons.push(`<button class="admin-btn admin-btn--edit" data-action="edit">Edit</button>`);
    if (opts.onDelete) buttons.push(`<button class="admin-btn admin-btn--delete" data-action="delete">Del</button>`);

    const id = 'as-' + Math.random().toString(36).substr(2, 8);
    const overlay = buttons.length ? `<div class="admin-section__overlay">${buttons.join('')}</div>` : '';

    // We need to attach event listeners after innerHTML is set, so we use a mutation-safe approach
    setTimeout(() => {
        const el = document.getElementById(id);
        if (!el) return;
        const editBtn = el.querySelector('[data-action="edit"]');
        const delBtn = el.querySelector('[data-action="delete"]');
        if (editBtn && opts.onEdit) editBtn.addEventListener('click', (e) => { e.stopPropagation(); opts.onEdit(); });
        if (delBtn && opts.onDelete) delBtn.addEventListener('click', (e) => { e.stopPropagation(); opts.onDelete(); });
    }, 0);

    return `<div class="admin-section" id="${id}">${overlay}${html}</div>`;
}

// =============================================================================
// COMPONENT BUILDERS (reuse actual site markup)
// =============================================================================
function buildProjectCard(proj) {
    const statusClass = proj.status === 'In Progress' ? 'project-card__status--in-progress' : '';
    return `
        <div class="project-card">
            <div class="project-card__status ${statusClass}">${esc(proj.status || '')}</div>
            <h3 class="project-card__title">${esc(proj.title)}</h3>
            <p class="project-card__tagline">${esc(proj.tagline || '')}</p>
            <div class="project-card__meta">${esc(proj.role || '')}${proj.company ? ' @ ' + esc(proj.company) : ''} &middot; ${esc(proj.date || '')}</div>
            <div class="project-card__tags">
                ${(proj.tags || []).map(t => `<span class="tag">${esc(t)}</span>`).join('')}
                ${proj.featured ? '<span class="tag" style="background:var(--color-accent);color:#fff">Featured</span>' : ''}
            </div>
            <div class="project-card__actions">
                ${proj.live_url ? `<a href="${esc(proj.live_url)}" class="btn" target="_blank" onclick="event.stopPropagation()">Live &rarr;</a>` : ''}
                ${proj.github ? `<a href="${esc(proj.github)}" class="btn" target="_blank" onclick="event.stopPropagation()">GitHub</a>` : ''}
            </div>
        </div>`;
}

function buildPostCard(post) {
    return `
        <div class="post-card">
            <div class="post-card__date">${formatDate(post.date)}</div>
            <h3 class="post-card__title">${esc(post.title)}</h3>
            <p class="post-card__excerpt">${esc(post.excerpt || '')}</p>
            <div class="post-card__meta">
                ${(post.tags || []).map(t => `<span class="tag">${esc(t)}</span>`).join('')}
                ${post.featured ? '<span class="tag" style="background:var(--color-accent);color:#fff">Featured</span>' : ''}
            </div>
        </div>`;
}

function formatDate(dateStr) {
    if (!dateStr) return '';
    try {
        const d = new Date(dateStr + 'T00:00:00');
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch { return dateStr; }
}

// =============================================================================
// G. EDIT HANDLERS — Open modals for each section type
// =============================================================================

function editHero() {
    const p = data.profile;
    openModal('Edit Hero', `
        ${adminField('Name', 'hero-name', p.name)}
        ${adminField('Title', 'hero-title', p.title)}
        ${adminField('Tagline', 'hero-tagline', p.tagline)}
        ${adminField('Current Company', 'hero-company', p.current_company)}
        ${adminField('Current Role', 'hero-role', p.current_role)}
    `, () => {
        p.name = gv('hero-name');
        p.title = gv('hero-title');
        p.tagline = gv('hero-tagline');
        p.current_company = gv('hero-company');
        p.current_role = gv('hero-role');
        markDirty('profile');
        closeModal();
        renderPage(currentPage);
    });
}

function editBio() {
    const p = data.profile;
    openModal('Edit Bio', `
        ${adminField('Paragraph 1', 'bio-1', (p.bio || [])[0] || '', 'textarea')}
        ${adminField('Paragraph 2', 'bio-2', (p.bio || [])[1] || '', 'textarea')}
        ${adminField('Paragraph 3', 'bio-3', (p.bio || [])[2] || '', 'textarea')}
    `, () => {
        if (!p.bio) p.bio = [];
        p.bio[0] = gv('bio-1');
        p.bio[1] = gv('bio-2');
        p.bio[2] = gv('bio-3');
        p.bio = p.bio.filter(x => x); // remove empties
        markDirty('profile');
        closeModal();
        renderPage(currentPage);
    });
}

function editProject(index) {
    const isNew = index === undefined;
    const proj = isNew
        ? { id: '', title: '', tagline: '', company: '', role: '', date: '', status: 'In Progress', category: 'Side Project', problem: '', solution: '', impact: [], tags: [], github: '', live_url: '', featured: false }
        : data.projects[index];

    openModal(isNew ? 'Add Project' : 'Edit Project', `
        ${adminField('Title', 'p-title', proj.title)}
        ${adminField('Tagline', 'p-tagline', proj.tagline)}
        <div class="admin-field__row">
            ${adminField('Company', 'p-company', proj.company)}
            ${adminField('Role', 'p-role', proj.role)}
        </div>
        <div class="admin-field__row">
            ${adminField('Date', 'p-date', proj.date, 'text', 'e.g. 2026-02')}
            ${adminField('Status', 'p-status', proj.status, 'select', null, ['Live', 'In Progress', 'Completed', 'Archived'])}
        </div>
        ${adminField('Category', 'p-category', proj.category, 'select', null, ['Product', 'Side Project', 'Research', 'Design', 'Other'])}
        ${adminField('Problem', 'p-problem', proj.problem, 'textarea')}
        ${adminField('Solution', 'p-solution', proj.solution, 'textarea')}
        ${adminField('Impact (one per line)', 'p-impact', (proj.impact || []).join('\n'), 'textarea')}
        ${adminField('Tags (comma-separated)', 'p-tags', (proj.tags || []).join(', '))}
        <div class="admin-field__row">
            ${adminField('GitHub URL', 'p-github', proj.github)}
            ${adminField('Live URL', 'p-live', proj.live_url)}
        </div>
        <div class="admin-field">
            <label class="admin-field__checkbox">
                <input type="checkbox" id="p-featured" ${proj.featured ? 'checked' : ''}>
                Featured on homepage
            </label>
        </div>
    `, () => {
        proj.title = gv('p-title');
        proj.tagline = gv('p-tagline');
        proj.company = gv('p-company');
        proj.role = gv('p-role');
        proj.date = gv('p-date');
        proj.status = gv('p-status');
        proj.category = gv('p-category');
        proj.problem = gv('p-problem');
        proj.solution = gv('p-solution');
        proj.impact = gv('p-impact').split('\n').map(s => s.trim()).filter(Boolean);
        proj.tags = gv('p-tags').split(',').map(s => s.trim()).filter(Boolean);
        proj.github = gv('p-github');
        proj.live_url = gv('p-live');
        proj.featured = document.getElementById('p-featured').checked;
        if (!proj.id) proj.id = proj.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        if (isNew) data.projects.push(proj);
        markDirty('projects');
        closeModal();
        renderPage(currentPage);
    });
}

function editExperience(index) {
    const isNew = index === undefined;
    const exp = isNew
        ? { id: '', company: '', role: '', type: 'Work', date_start: '', date_end: '', current: false, description: '', achievements: [], logo: '' }
        : data.experience[index];

    openModal(isNew ? 'Add Experience' : 'Edit Experience', `
        <div class="admin-field__row">
            ${adminField('Company', 'exp-company', exp.company)}
            ${adminField('Role', 'exp-role', exp.role)}
        </div>
        ${adminField('Type', 'exp-type', exp.type, 'select', null, ['Work', 'Education', 'Internship', 'Freelance'])}
        <div class="admin-field__row">
            ${adminField('Start Date', 'exp-start', exp.date_start)}
            ${adminField('End Date', 'exp-end', exp.date_end, 'text', 'Leave blank for current')}
        </div>
        ${adminField('Description', 'exp-desc', exp.description, 'textarea')}
        ${adminField('Achievements (one per line)', 'exp-ach', (exp.achievements || []).join('\n'), 'textarea')}
        ${adminField('Logo (2-letter)', 'exp-logo', exp.logo)}
    `, () => {
        exp.company = gv('exp-company');
        exp.role = gv('exp-role');
        exp.type = gv('exp-type');
        exp.date_start = gv('exp-start');
        exp.date_end = gv('exp-end');
        exp.current = !gv('exp-end');
        exp.description = gv('exp-desc');
        exp.achievements = gv('exp-ach').split('\n').map(s => s.trim()).filter(Boolean);
        exp.logo = gv('exp-logo');
        if (!exp.id) exp.id = exp.company.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        if (isNew) data.experience.push(exp);
        markDirty('experience');
        closeModal();
        renderPage(currentPage);
    });
}

function editCurrently() {
    const cur = data.profile.currently || {};
    openModal('Edit Currently', `
        ${adminField('Working on', 'cur-working', cur.working_on || '')}
        ${adminField('Learning', 'cur-learning', cur.learning || '')}
        ${adminField('Reading', 'cur-reading', cur.reading || '')}
    `, () => {
        if (!data.profile.currently) data.profile.currently = {};
        data.profile.currently.working_on = gv('cur-working');
        data.profile.currently.learning = gv('cur-learning');
        data.profile.currently.reading = gv('cur-reading');
        markDirty('profile');
        closeModal();
        renderPage(currentPage);
    });
}

function editFunFacts() {
    openModal('Edit Fun Facts', `
        <div class="admin-field">
            <label class="admin-field__label">Fun facts (one per line)</label>
            <textarea class="admin-field__input tall" id="ff-list">${esc((data.profile.fun_facts || []).join('\n'))}</textarea>
        </div>
    `, () => {
        data.profile.fun_facts = gv('ff-list').split('\n').map(s => s.trim()).filter(Boolean);
        markDirty('profile');
        closeModal();
        renderPage(currentPage);
    });
}

function editBlogPost(index) {
    const isNew = index === undefined;
    const post = isNew
        ? { id: '', title: '', date: new Date().toISOString().split('T')[0], tags: [], excerpt: '', content_file: '', featured: false }
        : data.blogPosts[index];

    openModal(isNew ? 'Add Blog Post' : 'Edit Blog Post', `
        ${adminField('Title', 'bp-title', post.title)}
        ${adminField('Slug / ID', 'bp-id', post.id, 'text', 'e.g. my-new-post')}
        <div class="admin-field__row">
            ${adminField('Date', 'bp-date', post.date, 'text', 'YYYY-MM-DD')}
        </div>
        ${adminField('Excerpt', 'bp-excerpt', post.excerpt, 'textarea')}
        ${adminField('Tags (comma-separated)', 'bp-tags', (post.tags || []).join(', '))}
        <div class="admin-field">
            <label class="admin-field__checkbox">
                <input type="checkbox" id="bp-featured" ${post.featured ? 'checked' : ''}>
                Featured on homepage
            </label>
        </div>
    `, () => {
        post.title = gv('bp-title');
        post.id = gv('bp-id').toLowerCase().replace(/[^a-z0-9-]+/g, '-');
        post.date = gv('bp-date');
        post.excerpt = gv('bp-excerpt');
        post.tags = gv('bp-tags').split(',').map(s => s.trim()).filter(Boolean);
        post.featured = document.getElementById('bp-featured').checked;
        post.content_file = `blog/posts/${post.id}.md`;
        if (isNew) data.blogPosts.push(post);
        markDirty('blogPosts');
        closeModal();
        renderPage(currentPage);
    });
}

function editContactInfo() {
    const p = data.profile;
    const social = p.social || {};
    openModal('Edit Contact Info', `
        ${adminField('Email', 'ci-email', p.email || '')}
        ${adminField('Location', 'ci-location', p.location || '')}
        <div class="admin-field__row">
            ${adminField('Resume URL', 'ci-resume', p.resume_url || '')}
            ${adminField('Calendar URL', 'ci-calendar', p.calendar_url || '')}
        </div>
        ${adminField('GitHub', 'ci-github', social.github || '')}
        ${adminField('LinkedIn', 'ci-linkedin', social.linkedin || '')}
        ${adminField('Twitter', 'ci-twitter', social.twitter || '')}
        ${adminField('Medium', 'ci-medium', social.medium || '')}
    `, () => {
        p.email = gv('ci-email');
        p.location = gv('ci-location');
        p.resume_url = gv('ci-resume');
        p.calendar_url = gv('ci-calendar');
        if (!p.social) p.social = {};
        p.social.github = gv('ci-github');
        p.social.linkedin = gv('ci-linkedin');
        p.social.twitter = gv('ci-twitter');
        p.social.medium = gv('ci-medium');
        markDirty('profile');
        closeModal();
        renderPage(currentPage);
    });
}

function editOpenTo() {
    openModal('Edit Open To', `
        <div class="admin-field">
            <label class="admin-field__label">Items (one per line)</label>
            <textarea class="admin-field__input tall" id="ot-list">${esc((data.profile.open_to || []).join('\n'))}</textarea>
        </div>
    `, () => {
        data.profile.open_to = gv('ot-list').split('\n').map(s => s.trim()).filter(Boolean);
        markDirty('profile');
        closeModal();
        renderPage(currentPage);
    });
}

// =============================================================================
// H. ADD / DELETE HANDLERS
// =============================================================================
function addProject() { editProject(undefined); }
function addExperience() { editExperience(undefined); }
function addBlogPost() { editBlogPost(undefined); }

function deleteProject(index) {
    if (!confirm(`Delete "${data.projects[index].title}"?`)) return;
    data.projects.splice(index, 1);
    markDirty('projects');
    renderPage(currentPage);
}

function deleteExperience(index) {
    if (!confirm(`Delete "${data.experience[index].role} @ ${data.experience[index].company}"?`)) return;
    data.experience.splice(index, 1);
    markDirty('experience');
    renderPage(currentPage);
}

function deleteBlogPost(index) {
    if (!confirm(`Delete "${data.blogPosts[index].title}"?`)) return;
    data.blogPosts.splice(index, 1);
    markDirty('blogPosts');
    renderPage(currentPage);
}

// =============================================================================
// I. MODAL SYSTEM
// =============================================================================
function openModal(title, bodyHTML, onSave) {
    document.getElementById('adminModalTitle').textContent = title;
    document.getElementById('adminModalBody').innerHTML = bodyHTML;
    document.getElementById('adminModalSave').onclick = onSave;
    document.getElementById('adminModal').classList.add('show');

    // Focus first input
    setTimeout(() => {
        const first = document.querySelector('#adminModalBody input, #adminModalBody textarea, #adminModalBody select');
        if (first) first.focus();
    }, 100);
}

function closeModal() {
    document.getElementById('adminModal').classList.remove('show');
}

// Close modal on overlay click
document.addEventListener('click', (e) => {
    if (e.target.id === 'adminModal') closeModal();
    if (e.target.id === 'commitModal') document.getElementById('commitModal').classList.remove('show');
});

// Close modal on Escape
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeModal();
        document.getElementById('commitModal').classList.remove('show');
        closeMonaco();
    }
});

// =============================================================================
// MODAL FIELD HELPERS
// =============================================================================
function adminField(label, id, value, type, placeholder, options) {
    type = type || 'text';

    if (type === 'select') {
        const opts = (options || []).map(o => `<option value="${esc(o)}" ${o === value ? 'selected' : ''}>${esc(o)}</option>`).join('');
        return `<div class="admin-field">
            <label class="admin-field__label" for="${id}">${label}</label>
            <select class="admin-field__input" id="${id}">${opts}</select>
        </div>`;
    }

    if (type === 'textarea') {
        return `<div class="admin-field">
            <label class="admin-field__label" for="${id}">${label}</label>
            <textarea class="admin-field__input" id="${id}" placeholder="${esc(placeholder || '')}">${esc(value)}</textarea>
        </div>`;
    }

    return `<div class="admin-field">
        <label class="admin-field__label" for="${id}">${label}</label>
        <input class="admin-field__input" type="text" id="${id}" value="${esc(value)}" placeholder="${esc(placeholder || '')}">
    </div>`;
}

function gv(id) { return (document.getElementById(id)?.value || '').trim(); }

function esc(s) {
    return String(s || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// =============================================================================
// BLOG CONTENT EDITOR (Monaco)
// =============================================================================
function openBlogContent(index) {
    const post = data.blogPosts[index];
    if (!post) return;

    document.getElementById('monacoTitle').textContent = post.title;
    document.getElementById('monacoPath').textContent = post.content_file;
    document.getElementById('monacoOverlay').classList.add('show');
    editingBlogFile = post.content_file;

    showLoading(true);
    (async () => {
        let content;
        try {
            const r = await fetch(`${CONFIG.rawBase}${post.content_file}?t=${Date.now()}`);
            if (r.ok) {
                content = await r.text();
            } else {
                content = `# ${post.title}\n\nWrite your content here...\n`;
            }
        } catch {
            content = `# ${post.title}\n\nWrite your content here...\n`;
        }

        if (monacoReady && monacoEditor) {
            monaco.editor.setModelLanguage(monacoEditor.getModel(), 'markdown');
            monacoEditor.setValue(content);
            blogOriginalContent = content;
        }
        showLoading(false);
    })();
}

function closeMonaco() {
    document.getElementById('monacoOverlay').classList.remove('show');
    editingBlogFile = null;
}

function initMonaco() {
    require.config({ paths: { vs: 'https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/min/vs' } });
    require(['vs/editor/editor.main'], () => {
        monacoEditor = monaco.editor.create(document.getElementById('admin-monaco-container'), {
            value: '',
            language: 'markdown',
            theme: window.matchMedia('(prefers-color-scheme: dark)').matches ? 'vs-dark' : 'vs',
            fontSize: 14,
            minimap: { enabled: false },
            automaticLayout: true,
            scrollBeyondLastLine: false,
            wordWrap: 'on',
            padding: { top: 12 },
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

    document.getElementById('monacoClose').addEventListener('click', closeMonaco);
}

// =============================================================================
// J. COMMIT FLOW
// =============================================================================
function markDirty(key) { dirty[key] = true; updateSaveButton(); }

function getDirtyFileList() {
    const files = [];
    if (dirty.profile) files.push({ path: 'data/profile.json', content: JSON.stringify(data.profile, null, 2) });
    if (dirty.experience) files.push({ path: 'data/experience.json', content: JSON.stringify({ experience: data.experience }, null, 2) });
    if (dirty.projects) files.push({ path: 'data/projects.json', content: JSON.stringify({ projects: data.projects }, null, 2) });
    if (dirty.blogPosts) files.push({ path: 'data/blog-posts.json', content: JSON.stringify({ posts: data.blogPosts }, null, 2) });
    if (dirty._blogContent && editingBlogFile && monacoEditor) {
        files.push({ path: editingBlogFile, content: monacoEditor.getValue() });
    }
    return files;
}

async function commitAll() {
    const msg = document.getElementById('commitInput').value.trim();
    if (msg.length < 3) {
        document.getElementById('commitInput').style.borderColor = '#e74c3c';
        return;
    }
    document.getElementById('commitModal').classList.remove('show');
    showLoading(true);

    const token = localStorage.getItem('adminToken');
    if (!token) return redirectToLogin();

    const filesToCommit = getDirtyFileList();

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
        updateSaveButton();
        toast(`Saved ${success} file${success > 1 ? 's' : ''} to GitHub!`, 'success');
    } else {
        toast(`${success}/${filesToCommit.length} saved. Error: ${lastError}`, 'error');
    }

    showLoading(false);
}

// =============================================================================
// K. UTILITIES
// =============================================================================
let toastTimer;
function toast(msg, type) {
    const el = document.getElementById('adminToast');
    el.textContent = msg;
    el.className = `admin-toast show admin-toast--${type}`;
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('show'), 5000);
}

function showLoading(on) {
    document.getElementById('adminLoading').classList.toggle('show', on);
}

// =============================================================================
// Configuration — UPDATE apiBaseUrl AFTER DEPLOYING VERCEL BACKEND
// =============================================================================
const CONFIG = {
    apiBaseUrl:     'https://portfolio-admin-api-murex.vercel.app',
    githubOwner:    'p22chanakya-iima',
    githubRepo:     'portfolio',
    githubBranch:   'main',
};

// Derived URLs
CONFIG.rawBase = `https://raw.githubusercontent.com/${CONFIG.githubOwner}/${CONFIG.githubRepo}/${CONFIG.githubBranch}/`;

// =============================================================================
// State
// =============================================================================
let editor = null;
let currentFile = null;
let originalContent = null;
let userInfo = null;
let statusTimer = null;

// =============================================================================
// Bootstrap
// =============================================================================
document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('adminToken');
    const userJSON = localStorage.getItem('adminUser');

    if (!token || !userJSON) {
        return redirectToLogin();
    }

    try {
        userInfo = JSON.parse(userJSON);
    } catch {
        return redirectToLogin();
    }

    // Check client-side expiry first (avoids unnecessary network call)
    if (userInfo.expiresAt && Date.now() > userInfo.expiresAt) {
        return redirectToLogin();
    }

    // Verify with backend
    const valid = await verifyToken(token);
    if (!valid) {
        return redirectToLogin();
    }

    // All good — set up the editor
    try {
        await initMonaco();
        renderUserInfo();
        setupEventListeners();
        await loadBlogPostsList();
    } catch (err) {
        console.error('Init error:', err);
        showStatus('error', 'Initialization failed', err.message);
    }
});

// =============================================================================
// Auth helpers
// =============================================================================
function redirectToLogin() {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    window.location.href = 'index.html';
}

async function verifyToken(token) {
    try {
        const res = await fetch(`${CONFIG.apiBaseUrl}/api/verify`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
        });
        if (!res.ok) return false;
        const data = await res.json();
        return data.valid === true;
    } catch {
        return false;
    }
}

// =============================================================================
// Monaco Editor
// =============================================================================
function initMonaco() {
    return new Promise((resolve, reject) => {
        require.config({
            paths: { vs: 'https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/min/vs' },
        });
        require(['vs/editor/editor.main'], () => {
            editor = monaco.editor.create(document.getElementById('editor-container'), {
                value: '// Select a file from the sidebar to start editing',
                language: 'plaintext',
                theme: 'vs-dark',
                fontSize: 14,
                minimap: { enabled: true },
                automaticLayout: true,
                scrollBeyondLastLine: false,
                wordWrap: 'on',
            });

            editor.onDidChangeModelContent(() => {
                if (currentFile) {
                    const changed = originalContent !== null
                        ? editor.getValue() !== originalContent
                        : true; // new file — always changed
                    document.getElementById('saveBtn').disabled = !changed;
                }
            });

            resolve();
        }, reject);
    });
}

// =============================================================================
// User info
// =============================================================================
function renderUserInfo() {
    document.getElementById('userName').textContent = userInfo.name || 'Admin';
    document.getElementById('userEmail').textContent = userInfo.email || '';
    const avatar = document.getElementById('userAvatar');
    if (userInfo.picture) {
        avatar.src = userInfo.picture;
    }
}

// =============================================================================
// Blog posts sidebar
// =============================================================================
async function loadBlogPostsList() {
    const container = document.getElementById('blogPostsList');
    container.innerHTML = '<div class="nav-item" style="opacity:0.5">Loading posts...</div>';

    try {
        // Cache-bust to always get latest from GitHub
        const url = `${CONFIG.rawBase}data/blog-posts.json?t=${Date.now()}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();

        // Handle both { posts: [...] } and plain array
        const posts = Array.isArray(data) ? data : (data.posts || []);

        container.innerHTML = '';
        posts.forEach(post => {
            const filePath = post.content_file || `blog/posts/${post.id}.md`;
            const item = document.createElement('div');
            item.className = 'nav-item';
            item.dataset.file = filePath;
            item.textContent = post.title;
            item.addEventListener('click', () => loadFile(filePath));
            container.appendChild(item);
        });

        if (posts.length === 0) {
            container.innerHTML = '<div class="nav-item" style="opacity:0.5">No posts yet</div>';
        }
    } catch (err) {
        console.error('Failed to load blog posts list:', err);
        container.innerHTML = '<div class="nav-item" style="opacity:0.5;color:#f87171">Failed to load posts</div>';
    }
}

// =============================================================================
// Event listeners
// =============================================================================
function setupEventListeners() {
    // Static nav items (JSON data files)
    document.querySelectorAll('.nav-item[data-file]').forEach(item => {
        item.addEventListener('click', () => loadFile(item.dataset.file));
    });

    document.getElementById('saveBtn').addEventListener('click', showCommitModal);
    document.getElementById('logoutBtn').addEventListener('click', logout);
    document.getElementById('newPostBtn').addEventListener('click', createNewPost);
    document.getElementById('cancelCommitBtn').addEventListener('click', hideCommitModal);
    document.getElementById('confirmCommitBtn').addEventListener('click', commitChanges);

    document.getElementById('commitMessage').addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            commitChanges();
        }
    });

    // Keyboard shortcut: Cmd/Ctrl+S
    document.addEventListener('keydown', (e) => {
        if ((e.metaKey || e.ctrlKey) && e.key === 's') {
            e.preventDefault();
            if (!document.getElementById('saveBtn').disabled) {
                showCommitModal();
            }
        }
    });
}

// =============================================================================
// File loading
// =============================================================================
async function loadFile(filePath) {
    setLoading(true);

    try {
        const url = `${CONFIG.rawBase}${filePath}?t=${Date.now()}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error(`Could not fetch ${filePath} (HTTP ${res.status})`);

        const content = await res.text();
        const lang = filePath.endsWith('.json') ? 'json'
                   : filePath.endsWith('.md')   ? 'markdown'
                   : 'plaintext';

        monaco.editor.setModelLanguage(editor.getModel(), lang);
        editor.setValue(content);
        originalContent = content;
        currentFile = filePath;

        document.getElementById('editorTitle').textContent = friendlyName(filePath);
        document.getElementById('editorPath').textContent = filePath;
        document.getElementById('saveBtn').disabled = true;

        // Highlight active sidebar item
        document.querySelectorAll('.nav-item').forEach(el => {
            el.classList.toggle('active', el.dataset.file === filePath);
        });
    } catch (err) {
        console.error('Load file error:', err);
        showStatus('error', 'Failed to load file', err.message);
    } finally {
        setLoading(false);
    }
}

function friendlyName(path) {
    return path.split('/').pop()
        .replace(/\.(json|md)$/, '')
        .replace(/-/g, ' ')
        .replace(/\b\w/g, c => c.toUpperCase());
}

// =============================================================================
// Save / Commit
// =============================================================================
function showCommitModal() {
    const modal = document.getElementById('commitModal');
    const input = document.getElementById('commitMessage');
    modal.classList.add('show');
    input.value = '';
    input.focus();
}

function hideCommitModal() {
    document.getElementById('commitModal').classList.remove('show');
}

async function commitChanges() {
    const msgInput = document.getElementById('commitMessage');
    const message = msgInput.value.trim();

    if (message.length < 3) {
        msgInput.style.borderColor = '#ef4444';
        msgInput.placeholder = 'Please enter at least 3 characters...';
        return;
    }

    hideCommitModal();
    setLoading(true);

    try {
        const token = localStorage.getItem('adminToken');
        if (!token) return redirectToLogin();

        const content = editor.getValue();

        // Client-side JSON validation
        if (currentFile.endsWith('.json')) {
            try { JSON.parse(content); }
            catch (e) { throw new Error(`Invalid JSON: ${e.message}`); }
        }

        const res = await fetch(`${CONFIG.apiBaseUrl}/api/commit`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ path: currentFile, content, message }),
        });

        const data = await res.json();

        if (res.status === 401) {
            showStatus('error', 'Session expired', 'Please log in again.');
            setTimeout(redirectToLogin, 2000);
            return;
        }

        if (!res.ok) {
            throw new Error(data.message || data.error || `HTTP ${res.status}`);
        }

        // Success
        originalContent = content;
        document.getElementById('saveBtn').disabled = true;
        showStatus('success', 'Committed!', `${message} (${data.commit?.sha?.slice(0, 7) || 'done'})`);

        // Refresh blog list if we just edited blog metadata
        if (currentFile === 'data/blog-posts.json') {
            // Wait a moment for GitHub CDN to catch up
            setTimeout(() => loadBlogPostsList(), 3000);
        }
    } catch (err) {
        console.error('Commit error:', err);
        showStatus('error', 'Commit failed', err.message);
    } finally {
        setLoading(false);
    }
}

// =============================================================================
// New blog post
// =============================================================================
function createNewPost() {
    const slug = prompt('Enter blog post slug (lowercase, hyphens only).\nExample: my-new-post');
    if (!slug) return;

    const cleaned = slug.trim().toLowerCase();
    if (!/^[a-z0-9][a-z0-9-]{0,80}$/.test(cleaned)) {
        alert('Invalid slug. Use only lowercase letters, numbers, and hyphens. Must start with a letter or number.');
        return;
    }

    const filePath = `blog/posts/${cleaned}.md`;

    // Check for duplicates in sidebar
    if (document.querySelector(`.nav-item[data-file="${filePath}"]`)) {
        alert('A post with this slug already exists.');
        return;
    }

    const today = new Date().toISOString().split('T')[0];
    const template = `---
title: "New Blog Post"
date: ${today}
tags: []
excerpt: "A brief description of this post..."
---

# New Blog Post

Write your content here...
`;

    monaco.editor.setModelLanguage(editor.getModel(), 'markdown');
    editor.setValue(template);
    originalContent = null; // null = new file, always enable save
    currentFile = filePath;

    document.getElementById('editorTitle').textContent = friendlyName(filePath);
    document.getElementById('editorPath').textContent = filePath + ' (new)';
    document.getElementById('saveBtn').disabled = false;

    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));

    showStatus('success', 'Template loaded', 'Edit and then Save & Commit.');
}

// =============================================================================
// Logout
// =============================================================================
function logout() {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    window.location.href = 'index.html';
}

// =============================================================================
// UI helpers
// =============================================================================
function showStatus(type, title, detail) {
    const el = document.getElementById('statusMessage');
    document.getElementById('statusIcon').textContent = type === 'success' ? '✓' : '✕';
    document.getElementById('statusTitle').textContent = title;
    document.getElementById('statusDetail').textContent = detail || '';
    el.className = `status-message show ${type}`;

    if (statusTimer) clearTimeout(statusTimer);
    statusTimer = setTimeout(() => el.classList.remove('show'), 5000);
}

function setLoading(on) {
    document.getElementById('loadingOverlay').classList.toggle('show', on);
}

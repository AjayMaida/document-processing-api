const API_BASE = window.location.origin;

let authMode = 'login';
let currentUsername = localStorage.getItem('username');
let isAdminUser = localStorage.getItem('is_admin') === 'true';
let accessToken = localStorage.getItem('access_token');
let refreshToken = localStorage.getItem('refresh_token');

let activeTab = 'dashboard';
let currentDocText = '';
let currentDocFilename = '';

document.addEventListener('DOMContentLoaded', () => {
  if (window.lucide) lucide.createIcons();
  initApp();
});

function initApp() {
  updateAuthUI();
  setupEventListeners();
  checkHealth();
  if (accessToken) {
    loadDocuments();
    if (isAdminUser) loadAdminData();
  }
}

async function apiRequest(endpoint, options = {}) {
  const headers = { ...options.headers };
  if (accessToken && !headers['Authorization']) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }
  if (!(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  let res = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });

  if (res.status === 401 && refreshToken && !endpoint.includes('/auth/')) {
    const refreshed = await doRefreshToken();
    if (refreshed) {
      headers['Authorization'] = `Bearer ${accessToken}`;
      res = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });
    }
  }

  if (!res.ok) {
    let msg = `HTTP Error ${res.status}`;
    try {
      const json = await res.json();
      if (json.detail) {
        if (Array.isArray(json.detail)) {
          msg = json.detail.map((e) => e.msg || e.message).join(', ');
        } else {
          msg = typeof json.detail === 'string' ? json.detail : JSON.stringify(json.detail);
        }
      }
    } catch (e) {}
    throw new Error(msg);
  }

  if (options.responseType === 'blob') return await res.blob();
  return await res.json();
}

async function doRefreshToken() {
  try {
    const data = await fetch(`${API_BASE}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken }),
    }).then((r) => r.json());

    if (data.access_token) {
      accessToken = data.access_token;
      refreshToken = data.refresh_token;
      localStorage.setItem('access_token', accessToken);
      localStorage.setItem('refresh_token', refreshToken);
      return true;
    }
  } catch (e) {
    logout();
  }
  return false;
}

function updateAuthUI() {
  const isAuth = !!accessToken;
  document.getElementById('unauth-callout').classList.toggle('hidden', isAuth);
  document.getElementById('auth-dashboard').classList.toggle('hidden', !isAuth || activeTab !== 'dashboard');
  document.getElementById('admin-dashboard').classList.toggle('hidden', !isAuth || activeTab !== 'admin');
  document.getElementById('nav-links').classList.toggle('hidden', !isAuth);
  document.getElementById('nav-btn-admin').classList.toggle('hidden', !isAuth || !isAdminUser);
  document.getElementById('user-badge').classList.toggle('hidden', !isAuth);
  document.getElementById('btn-signout').classList.toggle('hidden', !isAuth);
  document.getElementById('btn-signin').classList.toggle('hidden', isAuth);
  document.getElementById('btn-register').classList.toggle('hidden', isAuth);

  if (isAuth && currentUsername) {
    document.getElementById('user-username-text').textContent = `${currentUsername} ${isAdminUser ? '(Admin)' : ''}`;
  }
}

function setupEventListeners() {
  document.getElementById('brand-logo').onclick = () => switchTab('dashboard');
  document.getElementById('nav-btn-docs').onclick = () => switchTab('dashboard');
  document.getElementById('nav-btn-admin').onclick = () => switchTab('admin');

  document.getElementById('btn-signin').onclick = () => openAuthModal('login');
  document.getElementById('btn-register').onclick = () => openAuthModal('register');
  document.getElementById('callout-signin').onclick = () => openAuthModal('login');
  document.getElementById('callout-register').onclick = () => openAuthModal('register');
  document.getElementById('btn-signout').onclick = logout;

  document.getElementById('auth-modal-close').onclick = closeAuthModal;
  document.getElementById('auth-switch-btn').onclick = () => {
    openAuthModal(authMode === 'login' ? 'register' : 'login');
  };

  document.getElementById('auth-form').onsubmit = async (e) => {
    e.preventDefault();
    const username = document.getElementById('auth-username').value;
    const pwd = document.getElementById('auth-password').value;

    try {
      if (authMode === 'login') {
        const res = await apiRequest('/auth/login', {
          method: 'POST',
          body: JSON.stringify({ username, password: pwd }),
        });
        accessToken = res.access_token;
        refreshToken = res.refresh_token;
        currentUsername = res.username || username;
        isAdminUser = res.is_admin || false;

        localStorage.setItem('access_token', accessToken);
        localStorage.setItem('refresh_token', refreshToken);
        localStorage.setItem('username', currentUsername);
        localStorage.setItem('is_admin', isAdminUser ? 'true' : 'false');

        closeAuthModal();
        updateAuthUI();
        loadDocuments();
        if (isAdminUser) loadAdminData();
      } else {
        const email = document.getElementById('auth-email').value;
        const confirmPwd = document.getElementById('auth-confirm-password').value;

        if (pwd !== confirmPwd) {
          alert('Passwords do not match');
          return;
        }

        await apiRequest('/auth/register', {
          method: 'POST',
          body: JSON.stringify({
            username,
            email,
            password: pwd,
            confirm_password: confirmPwd,
          }),
        });
        alert('Account created successfully! You can now log in.');
        openAuthModal('login');
      }
    } catch (err) {
      alert(err.message);
    }
  };

  // Upload dropzone with click propagation fix
  const dropzone = document.getElementById('dropzone');
  const fileInput = document.getElementById('file-input');

  dropzone.onclick = (e) => {
    e.stopPropagation();
    fileInput.click();
  };

  fileInput.onclick = (e) => e.stopPropagation();

  fileInput.onchange = (e) => {
    if (e.target.files[0]) {
      uploadFile(e.target.files[0]);
      fileInput.value = '';
    }
  };

  dropzone.ondragover = (e) => e.preventDefault();
  dropzone.ondrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files[0]) uploadFile(e.dataTransfer.files[0]);
  };

  // Search & Refresh Buttons
  document.getElementById('btn-do-search').onclick = doSearch;
  document.getElementById('btn-refresh-docs').onclick = () => loadDocuments();
  document.getElementById('admin-btn-refresh').onclick = () => loadAdminData();

  document.getElementById('text-modal-close').onclick = () => {
    document.getElementById('text-modal').classList.add('modal-hidden');
  };

  document.getElementById('text-modal-download-btn').onclick = downloadTextFile;
}

function switchTab(tabName) {
  activeTab = tabName;
  document.getElementById('nav-btn-docs').className = `btn ${tabName === 'dashboard' ? 'btn-primary' : 'btn-secondary'}`;
  document.getElementById('nav-btn-admin').className = `btn ${tabName === 'admin' ? 'btn-primary' : 'btn-secondary'}`;
  updateAuthUI();
}

async function uploadFile(file) {
  const formData = new FormData();
  formData.append('file', file);
  try {
    await apiRequest('/documents/upload', { method: 'POST', body: formData });
    loadDocuments();
  } catch (err) {
    alert(err.message);
  }
}

async function loadDocuments() {
  try {
    const data = await apiRequest('/documents?page=1&limit=20');
    renderDocuments(data.documents || []);
    updateStats(data.documents || []);
  } catch (e) {
    console.error(e);
  }
}

function updateStats(docs) {
  document.getElementById('stat-total').textContent = docs.length;
  document.getElementById('stat-completed').textContent = docs.filter((d) => d.status === 'completed').length;
  document.getElementById('stat-pending').textContent = docs.filter((d) => d.status === 'pending').length;
}

function renderDocuments(docs) {
  const container = document.getElementById('doc-grid');
  if (!docs.length) {
    container.innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--text-muted);">No documents found in library.</div>`;
    return;
  }

  container.innerHTML = docs
    .map(
      (doc) => {
        const docId = doc.id || doc.document_id;
        return `
    <div class="glass-panel glass-panel-interactive" style="padding: 20px; display: flex; flex-direction: column; justify-content: space-between;">
      <div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
          <span class="badge badge-primary">${(doc.original_filename.split('.').pop() || 'DOC').toUpperCase()}</span>
          <span class="badge ${doc.status === 'completed' ? 'badge-success' : 'badge-warning'}">${doc.status}</span>
        </div>
        <h4 style="font-size: 1rem; font-weight: 600; margin-bottom: 6px; text-overflow: ellipsis; overflow: hidden; white-space: nowrap;">${doc.original_filename}</h4>
        ${doc.snippet ? `<p style="font-size: 0.8rem; color: var(--accent-cyan); font-style: italic; margin-bottom: 10px;">"...${doc.snippet}..."</p>` : ''}
      </div>
      <div style="display: flex; gap: 8px; margin-top: 16px; border-top: 1px solid var(--border-glass); padding-top: 12px;">
        <button class="btn btn-secondary" style="flex:1; padding: 6px; font-size: 0.8rem;" onclick="viewText(${docId}, '${doc.original_filename}')">Text</button>
        <button class="btn btn-secondary" style="flex:1; padding: 6px; font-size: 0.8rem;" onclick="downloadDoc(${docId}, '${doc.original_filename}')">Download</button>
        <button class="btn btn-danger btn-icon" style="width: 32px; height: 32px;" onclick="deleteDoc(${docId})"><i data-lucide="trash-2" style="width:14px; height:14px;"></i></button>
      </div>
    </div>
  `;
      }
    )
    .join('');

  if (window.lucide) lucide.createIcons();
}

async function loadAdminData() {
  try {
    const stats = await apiRequest('/admin/stats');
    document.getElementById('admin-stat-users').textContent = stats.total_users ?? 0;
    document.getElementById('admin-stat-docs').textContent = stats.total_documents ?? 0;
    document.getElementById('admin-stat-completed').textContent = stats.completed_extractions ?? 0;
    document.getElementById('admin-stat-words').textContent = stats.total_words_extracted ?? 0;

    const usersData = await apiRequest('/admin/users');
    renderAdminUsers(usersData.users || []);
  } catch (e) {
    console.error('Admin fetch error:', e);
  }
}

function renderAdminUsers(users) {
  const tbody = document.getElementById('admin-users-tbody');
  if (!tbody) return;

  tbody.innerHTML = users
    .map(
      (u) => `
    <tr style="border-bottom: 1px solid rgba(255,255,255,0.04);">
      <td style="padding: 12px; font-family: var(--font-mono);">#${u.id}</td>
      <td style="padding: 12px; font-weight: 600;">${u.username}</td>
      <td style="padding: 12px; color: var(--text-muted);">${u.email}</td>
      <td style="padding: 12px;"><span class="badge ${u.is_admin ? 'badge-warning' : 'badge-primary'}">${u.is_admin ? 'Admin' : 'User'}</span></td>
      <td style="padding: 12px; font-weight: 700;">${u.document_count}</td>
      <td style="padding: 12px; color: var(--text-muted);">${new Date(u.created_at).toLocaleDateString()}</td>
    </tr>
  `
    )
    .join('');
}

async function viewText(id, filename) {
  currentDocFilename = filename;
  document.getElementById('text-modal-filename').textContent = filename;
  document.getElementById('text-modal-body').textContent = 'Loading extracted text...';
  document.getElementById('text-modal').classList.remove('modal-hidden');

  try {
    const res = await apiRequest(`/documents/${id}/text`);
    currentDocText = res.content || 'No text content extracted.';
    document.getElementById('text-modal-body').textContent = currentDocText;
  } catch (err) {
    document.getElementById('text-modal-body').textContent = 'Failed to load text: ' + err.message;
  }
}

function downloadTextFile() {
  if (!currentDocText) return;
  const blob = new Blob([currentDocText], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${currentDocFilename.split('.')[0]}_extracted.txt`;
  a.click();
  URL.revokeObjectURL(url);
}

async function downloadDoc(id, filename) {
  try {
    const blob = await apiRequest(`/documents/${id}/download`, { responseType: 'blob' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  } catch (err) {
    alert('Download failed: ' + err.message);
  }
}

async function deleteDoc(id) {
  if (!confirm('Delete this document?')) return;
  try {
    await apiRequest(`/documents/${id}`, { method: 'DELETE' });
    loadDocuments();
  } catch (err) {
    alert(err.message);
  }
}

async function doSearch() {
  const query = document.getElementById('search-input').value.trim();
  if (!query) {
    loadDocuments();
    return;
  }
  try {
    const res = await apiRequest(`/search?q=${encodeURIComponent(query)}`);
    renderDocuments(res.results || []);
  } catch (err) {
    alert(err.message);
  }
}

async function checkHealth() {
  try {
    const res = await apiRequest('/health');
    const dot = document.getElementById('api-health-dot');
    const txt = document.getElementById('api-health-text');
    if (res.status === 'healthy') {
      dot.style.backgroundColor = '#10b981';
      txt.textContent = 'API Online';
    }
  } catch (e) {}
}

function openAuthModal(mode) {
  authMode = mode;
  document.getElementById('auth-title').textContent = mode === 'login' ? 'Sign In' : 'Create Account';
  document.getElementById('auth-submit-btn').textContent = mode === 'login' ? 'Sign In' : 'Register Account';
  document.getElementById('auth-switch-prompt').textContent =
    mode === 'login' ? "Don't have an account?" : 'Already registered?';
  document.getElementById('auth-switch-btn').textContent = mode === 'login' ? 'Create one' : 'Sign in';

  document.getElementById('auth-email-group').style.display = mode === 'login' ? 'none' : 'flex';
  document.getElementById('auth-confirm-group').style.display = mode === 'login' ? 'none' : 'flex';

  document.getElementById('auth-modal').classList.remove('modal-hidden');
}

function closeAuthModal() {
  document.getElementById('auth-modal').classList.add('modal-hidden');
}

function logout() {
  accessToken = null;
  refreshToken = null;
  currentUsername = null;
  isAdminUser = false;
  localStorage.clear();
  switchTab('dashboard');
  updateAuthUI();
}

window.viewText = viewText;
window.downloadDoc = downloadDoc;
window.deleteDoc = deleteDoc;

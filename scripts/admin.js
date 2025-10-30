// scripts/admin.js
// This script expects the admin HTML to be served by the Worker, and the password stored in sessionStorage under ADMIN_PASS.
// Replace WORKER_BASE with your worker URL (e.g. 'https://my-worker.workers.dev')
const WORKER_BASE = 'https://WORKER_BASE_REPLACE_ME';

const ADMIN_PASS = sessionStorage.getItem('ADMIN_PASS') || null;

if (!ADMIN_PASS) {
  document.body.innerHTML = '<p class="loading">Unauthorized. No admin password found in session. Please open admin from the homepage prompt.</p>';
  throw new Error('No ADMIN_PASS');
}

async function api(path, opts = {}) {
  const headers = opts.headers || {};
  headers['x-pass'] = ADMIN_PASS;
  headers['Content-Type'] = headers['Content-Type'] || 'application/json';
  const res = await fetch(`${WORKER_BASE}${path}`, { ...opts, headers });
  if (res.status === 401) {
    alert('Unauthorized — password rejected. Reload and try again.');
    throw new Error('Unauthorized');
  }
  return res;
}

async function loadPostList() {
  const container = document.getElementById('posts-list');
  container.innerHTML = '<p class="loading">Loading…</p>';
  try {
    const res = await api('/api/blog/list', { method: 'GET' });
    const posts = await res.json();
    if (!posts.length) {
      container.innerHTML = '<p>No posts.</p>';
      return;
    }
    container.innerHTML = posts.map(p => `
      <div class="post" data-slug="${p.slug}">
        <h4>${escapeHtml(p.title)}</h4>
        <p class="muted">${new Date(p.date).toLocaleString()}</p>
        <p>${escapeHtml(p.excerpt || '')}</p>
        <p>
          <button class="edit" data-slug="${p.slug}">Edit</button>
          <button class="del" data-slug="${p.slug}">Delete</button>
        </p>
      </div>
    `).join('');
    setPostListHandlers();
  } catch (err) {
    container.innerHTML = '<p class="loading">Failed to load posts.</p>';
    console.error(err);
  }
}

function setPostListHandlers(){
  document.querySelectorAll('#posts-list .edit').forEach(btn => {
    btn.addEventListener('click', async e => {
      const slug = e.currentTarget.dataset.slug;
      const res = await api(`/api/blog/${encodeURIComponent(slug)}`, { method: 'GET' });
      const post = await res.json();
      populateEditForm(post);
    });
  });
  document.querySelectorAll('#posts-list .del').forEach(btn => {
    btn.addEventListener('click', async e => {
      const slug = e.currentTarget.dataset.slug;
      if (!confirm('Delete post "' + slug + '"?')) return;
      await api('/api/blog/delete', { method: 'DELETE', body: JSON.stringify({ slug }) });
      await loadPostList();
    });
  });
}

function populateEditForm(post) {
  const form = document.getElementById('create-form');
  form.title.value = post.title;
  form.slug.value = post.slug;
  form.excerpt.value = post.excerpt || '';
  form.content.value = post.content;
}

document.getElementById('create-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const form = e.currentTarget;
  const payload = {
    title: form.title.value.trim(),
    slug: form.slug.value.trim() || undefined,
    excerpt: form.excerpt.value.trim(),
    content: form.content.value,
  };

  // If slug exists then attempt edit if remote slug already exists -> Worker will treat slug as create or edit depending on presence
  // We'll call create; Worker will error if slug exists; if you want to force update call edit endpoint.
  try {
    const res = await api('/api/blog/create', { method: 'POST', body: JSON.stringify(payload) });
    if (!res.ok) {
      const text = await res.text();
      alert('Create failed: ' + text);
      return;
    }
    alert('Post created.');
    form.reset();
    loadPostList();
  } catch (err) {
    alert('Error: ' + err.message);
  }
});

function escapeHtml(s){ return String(s||'').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }

loadPostList();

// scripts/index.js
// Replace WORKER_BASE with your worker URL (e.g. 'https://my-worker.workers.dev')
const WORKER_BASE = 'https://WORKER_BASE_REPLACE_ME';

async function fetchList() {
  const res = await fetch(`${WORKER_BASE}/api/blog/list`);
  if (!res.ok) {
    document.getElementById('posts').innerHTML = '<p class="loading">Unable to load posts.</p>';
    return;
  }
  const data = await res.json();
  renderPosts(data || []);
}

function renderPosts(posts) {
  const container = document.getElementById('posts');
  if (!posts.length) {
    container.innerHTML = '<p class="loading">No posts yet.</p>';
    return;
  }
  const html = posts.map(p => `
    <article class="post">
      <h3><a href="/blog/${encodeURIComponent(p.slug)}">${escapeHtml(p.title)}</a></h3>
      <p class="muted">${escapeHtml(new Date(p.date).toLocaleString())}</p>
      ${p.excerpt ? `<p class="excerpt">${escapeHtml(p.excerpt)}</p>` : ''}
    </article>
  `).join('');
  container.innerHTML = html;
}

function escapeHtml(s){ return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }

document.getElementById('admin-link').addEventListener('click', async (e) => {
  e.preventDefault();
  const pass = prompt('Admin password:');
  if (!pass) return;
  try {
    const res = await fetch(`${WORKER_BASE}/admin`, {
      headers: { 'x-pass': pass },
    });
    if (res.status === 200) {
      const html = await res.text();
      const win = window.open('', '_blank');
      win.document.open();
      win.document.write(html);
      win.document.close();
      // store password in sessionStorage for admin page API calls
      sessionStorage.setItem('ADMIN_PASS', pass);
    } else {
      alert('Unauthorized (wrong password).');
    }
  } catch (err) {
    alert('Failed to contact admin endpoint: ' + err.message);
  }
});

fetchList();

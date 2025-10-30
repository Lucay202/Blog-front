// scripts/blog.js
// Replace WORKER_BASE with your worker URL (e.g. 'https://my-worker.workers.dev')
const WORKER_BASE = 'https://WORKER_BASE_REPLACE_ME';

function getSlugFromPath() {
  const parts = location.pathname.split('/').filter(Boolean);
  // expecting /blog/<slug>
  return parts[1] || parts[0] || null;
}

async function loadPost() {
  const slug = getSlugFromPath();
  if (!slug) {
    document.getElementById('post-content').innerHTML = '<p class="loading">No post specified.</p>';
    return;
  }
  const res = await fetch(`${WORKER_BASE}/api/blog/${encodeURIComponent(slug)}`);
  if (!res.ok) {
    document.getElementById('post-content').innerHTML = '<p class="loading">Post not found.</p>';
    return;
  }
  const post = await res.json();
  document.getElementById('post-title').textContent = post.title;
  document.getElementById('post-date').textContent = new Date(post.date).toLocaleString();
  // content may be HTML or Markdown. We'll assume saved content is HTML or simple text.
  document.getElementById('post-content').innerHTML = post.content;
}

loadPost();

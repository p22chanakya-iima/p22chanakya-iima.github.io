/* ============================================================
   Blog Loader
   Loads blog post metadata and renders markdown content.
   Used by both the writing listing page and individual posts.
   ============================================================ */

const BlogLoader = {
  postsData: null,

  async loadPosts() {
    if (this.postsData) return this.postsData;
    const res = await fetch('data/blog-posts.json');
    this.postsData = await res.json();
    return this.postsData;
  },

  // Calculate reading time from word count
  readingTime(text) {
    const words = text.trim().split(/\s+/).length;
    const mins = Math.ceil(words / 230);
    return `${mins} min read`;
  },

  // Format date: "2026-02-10" → "Feb 10, 2026"
  formatDate(dateStr) {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  },

  // Render blog listing (for writing.html and homepage)
  renderPostsList(container, posts, limit) {
    const items = limit ? posts.slice(0, limit) : posts;
    container.innerHTML = items.map(post => `
      <article class="post-card fade-in">
        <a href="blog/${post.id}.html" class="post-card__link">
          <div class="post-card__date">${this.formatDate(post.date)}</div>
          <h3 class="post-card__title">${post.title}</h3>
          <p class="post-card__excerpt">${post.excerpt}</p>
          <div class="post-card__meta">
            <div class="post-card__tags">
              ${post.tags.map(t => `<span class="tag">${t}</span>`).join('')}
            </div>
          </div>
        </a>
      </article>
    `).join('');
  },

  // Load and render a single blog post (for post-template.html)
  async renderPost(postId) {
    const data = await this.loadPosts();
    const post = data.posts.find(p => p.id === postId);
    if (!post) {
      document.getElementById('blog-post-content').innerHTML = '<p>Post not found.</p>';
      return;
    }

    // Set page title
    document.title = `${post.title} — Chanakya Yadav`;

    // Update meta
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.content = post.excerpt;

    // Set header info
    document.getElementById('blog-post-title').textContent = post.title;
    document.getElementById('blog-post-date').textContent = this.formatDate(post.date);

    const tagsEl = document.getElementById('blog-post-tags');
    if (tagsEl) {
      tagsEl.innerHTML = post.tags.map(t => `<span class="tag">${t}</span>`).join('');
    }

    // Fetch markdown content — path is relative from blog/ directory
    try {
      const mdPath = '../' + post.content_file;
      const res = await fetch(mdPath);
      if (!res.ok) throw new Error('Failed to load post content');
      const md = await res.text();

      // Set reading time
      const readTimeEl = document.getElementById('blog-post-readtime');
      if (readTimeEl) readTimeEl.textContent = this.readingTime(md);

      // Parse markdown and render
      const html = MarkdownParser.parse(md);
      document.getElementById('blog-post-content').innerHTML = html;
    } catch (e) {
      document.getElementById('blog-post-content').innerHTML =
        '<p>Unable to load post content. Please try again later.</p>';
      console.error('Blog load error:', e);
    }
  }
};

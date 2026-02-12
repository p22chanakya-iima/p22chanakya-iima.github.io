# Chanakya Yadav — Personal Portfolio

A clean, minimal personal website for showcasing product management work, writing, and experience. Built with vanilla HTML, CSS, and JavaScript. Hosted on GitHub Pages.

## Quick Start

```bash
# Clone the repository
git clone https://github.com/p22chanakya-iima/portfolio.git
cd portfolio

# Run locally
python3 -m http.server 8000
# Open http://localhost:8000
```

## Project Structure

```
portfolio/
├── index.html              # Homepage
├── about.html              # About page (bio, experience, skills)
├── work.html               # Portfolio / projects page
├── writing.html            # Blog listing page
├── contact.html            # Contact info
├── css/
│   ├── style.css           # Main stylesheet (design system)
│   └── blog.css            # Blog post reading styles
├── js/
│   ├── app.js              # Main app logic (data loading, rendering)
│   ├── blog-loader.js      # Blog post listing and rendering
│   └── markdown-parser.js  # Lightweight markdown-to-HTML converter
├── data/
│   ├── profile.json        # Name, bio, social links, skills
│   ├── experience.json     # Work history / timeline
│   ├── projects.json       # Portfolio projects
│   └── blog-posts.json     # Blog post metadata
├── blog/
│   ├── post-template.html  # Blog post viewer page
│   └── posts/              # Markdown blog posts
│       ├── how-i-validate-product-ideas.md
│       ├── building-for-indian-consumers.md
│       └── pm-frameworks-that-actually-work.md
└── assets/                 # Images, icons, screenshots
```

## Updating Content

All content lives in JSON and Markdown files. You never need to edit HTML.

### Update Profile Info

Edit `data/profile.json`:

```json
{
  "name": "Your Name",
  "title": "Your Title",
  "tagline": "Your one-liner",
  "bio": ["Paragraph 1", "Paragraph 2"],
  "email": "you@email.com",
  "social": {
    "github": "https://github.com/you",
    "linkedin": "https://linkedin.com/in/you"
  }
}
```

### Add a New Project

Edit `data/projects.json` and add an entry to the `projects` array:

```json
{
  "id": "my-project",
  "title": "Project Name",
  "tagline": "Brief description",
  "company": "Context",
  "role": "Your Role",
  "date": "2026-01",
  "status": "Live",
  "category": "Product",
  "problem": "What problem it solves",
  "solution": "How you solved it",
  "impact": ["Result 1", "Result 2"],
  "tags": ["Tag1", "Tag2"],
  "github": "https://github.com/...",
  "live_url": "https://...",
  "featured": true
}
```

Set `featured: true` to show it on the homepage.

### Add Work Experience

Edit `data/experience.json`:

```json
{
  "id": "company-name",
  "company": "Company",
  "role": "Your Role",
  "type": "Work",
  "date_start": "2024",
  "date_end": "Present",
  "current": true,
  "description": "Brief description",
  "achievements": ["Achievement 1", "Achievement 2"]
}
```

### Write a New Blog Post

1. Create a markdown file in `blog/posts/`:
   ```
   blog/posts/my-new-post.md
   ```

2. Add metadata to `data/blog-posts.json`:
   ```json
   {
     "id": "my-new-post",
     "title": "My New Post Title",
     "date": "2026-03-01",
     "tags": ["Product Management"],
     "excerpt": "First 1-2 sentences as a preview...",
     "content_file": "blog/posts/my-new-post.md",
     "featured": false
   }
   ```

3. Push to GitHub. Done.

## Customization

### Colors

Edit CSS variables in `css/style.css`:

```css
:root {
  --color-primary: #1A1A1A;    /* Main text */
  --color-accent: #0066CC;     /* Links, CTAs */
  --color-bg: #FFFFFF;         /* Background */
}
```

### Fonts

Change font imports at the top of `css/style.css`:

```css
--font-display: 'Playfair Display', serif;  /* Headings */
--font-body: 'Inter', sans-serif;           /* Body text */
```

### Layout

```css
--content-width: 720px;   /* Text-heavy pages */
--layout-width: 1080px;   /* Grid layouts */
```

## Deployment

### GitHub Pages

1. Push to `main` branch
2. Go to repo Settings > Pages
3. Source: Deploy from branch > `main` > `/ (root)`
4. Save

Site will be live at `https://username.github.io/portfolio/`

### Custom Domain

1. Add a `CNAME` file with your domain: `yourdomain.com`
2. Configure DNS:
   - A record: `185.199.108.153` (GitHub Pages IP)
   - CNAME record: `username.github.io`
3. Enable HTTPS in repo Settings > Pages

## Features

- **Data-driven**: All content in JSON/Markdown files
- **Dark mode**: Respects system preference + manual toggle
- **Responsive**: Mobile-first design
- **Fast**: No frameworks, no build step, minimal dependencies
- **Blog**: Write in Markdown, rendered client-side
- **Accessible**: Semantic HTML, ARIA labels, keyboard nav
- **SEO**: Meta tags, Open Graph, semantic markup
- **Print-friendly**: Clean print stylesheet for About page

## Tech Stack

- HTML5 (semantic)
- CSS3 (custom properties, grid, flexbox)
- Vanilla JavaScript (ES6+)
- No build tools, no frameworks, no dependencies

## License

MIT

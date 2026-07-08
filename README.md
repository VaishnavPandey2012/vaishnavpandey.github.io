# Alex Rivera — Personal Portfolio

A premium, Apple-inspired "liquid glass" portfolio site for a technology
founder / product engineer / designer. Pure HTML, CSS, and vanilla
JavaScript — no frameworks, no build step. Works out of the box on
GitHub Pages.

---

## 1. Site structure

```
index.html        Home — hero, about preview, featured projects, latest
                   posts, full Social Hub, contact banner
about.html         Biography, stats, skills, tech stack, timeline, achievements
projects.html       Full project grid
blog.html           Full post grid
contact.html         Contact info, social icons, contact form

css/style.css        Design tokens, reset, components, layout, responsive rules
css/animations.css    All @keyframes and a few small animation-driven states

js/main.js           Navigation, scroll reveal, mouse-reactive light,
                     form handling — all vanilla JS, no dependencies

assets/images/       Profile photo, favicon, Open Graph image
assets/projects/     Project cover images
assets/blog/         Blog post cover images
assets/icons/        Standalone copies of the SVG icons used inline in the HTML

robots.txt, sitemap.xml   Basic SEO plumbing
```

### Why "Social" lives on the homepage
The brief calls for a single floating nav with Home / About / Projects /
Blog / Social / Contact, but also for separate pages per section. Since
there's no natural standalone "social.html" destination, the **Social
Hub lives on the homepage** (`index.html#social`) where it works well as
a glanceable, browsable section, while About / Projects / Blog / Contact
get full dedicated pages for depth and SEO. The homepage also includes
short previews of About, Projects, and Blog with "see more" links — so
it works as a proper landing page, not just a hero.

---

## 2. Deploying to GitHub Pages

1. Create a new repository on GitHub (or use an existing one).
2. Push all of these files to the repository, keeping the folder
   structure exactly as-is (the `css/`, `js/`, and `assets/` paths are
   referenced relatively).
   ```bash
   git init
   git add .
   git commit -m "Initial portfolio"
   git branch -M main
   git remote add origin https://github.com/YOUR-USERNAME/YOUR-REPO.git
   git push -u origin main
   ```
3. In the repository, go to **Settings → Pages**.
4. Under "Build and deployment", set **Source** to "Deploy from a
   branch", branch `main`, folder `/ (root)`.
5. Save. GitHub will give you a URL like
   `https://YOUR-USERNAME.github.io/YOUR-REPO/` within a minute or two.
6. If you're using a custom domain, add it under **Settings → Pages →
   Custom domain**, and update the canonical URLs in every page's
   `<head>`, plus `sitemap.xml` and `robots.txt`, to match.

No build tools, `npm install`, or bundler are required — it's static
files, served as-is.

---

## 3. Customization guide

### Name, title, and intro
Search for **"Alex Rivera"** across the HTML files — it appears in the
nav logo, hero, footer, and meta tags of every page. The hero title,
role line, and intro paragraph are in `index.html` inside `<section
class="hero">`.

### Biography
Edit the paragraphs inside `about.html`, in the two `<div class="reveal">`
blocks under `<!-- ============ BIOGRAPHY ============ -->`.

### Profile photo
Replace `assets/images/profile-photo.jpg` with your own photo.
- Recommended size: **800×800px**, JPG or PNG, square crop.
- Keep the same file name, or update the `<img src="...">` reference in
  `index.html` (`.hero-portrait img`).

### Projects
Open `projects.html`. Each project is one `<article class="project-card">`
block — copy one, then edit:
- The image (`assets/projects/`, recommended **1200×800px**)
- The `<span class="tag">` list
- Title, description
- The GitHub / live demo `href` links (currently `#` placeholders)

The homepage also shows three featured projects — update those cards in
`index.html` under `<!-- ============ FEATURED PROJECTS PREVIEW ============ -->`
if you want the homepage highlights to match your best work.

### Blog posts
Open `blog.html`. Each post is one `<article class="blog-card">` block —
copy one, then edit the cover image (`assets/blog/`, recommended
**1200×630px**), category label, date, title, summary, and the "Read
more" link. This template doesn't generate individual post pages — point
"Read more" at a post hosted elsewhere (Medium, Substack, a PDF, a page
you add yourself) or remove the grid item if you don't need it yet.

### Colors
All color values are CSS custom properties at the top of
`css/style.css`, under **section 1 — DESIGN TOKENS**. Change
`--color-bg`, `--accent-violet`, `--accent-aqua`, `--accent-coral`, etc.
— every component derives its color from these variables, so editing
them re-themes the whole site.

### Fonts
Also in the design tokens: `--font-display`, `--font-body`,
`--font-mono`. If you swap fonts, update the Google Fonts `<link>` tag
in each page's `<head>` to match.

### Animations
All `@keyframes` live in `css/animations.css`, each with a comment
naming which element uses it. Durations and easing curves are set as
custom properties in `css/style.css` (`--dur-fast`, `--dur-base`,
`--dur-slow`, `--ease-out`, `--ease-in-out`) if you want to speed
everything up or slow it down globally.

### Social links
Update the `href="#"` placeholders for X, Instagram, and GitHub in:
- `index.html` (Social Hub section)
- `contact.html` (icon buttons)
- The `sameAs` array in the JSON-LD block at the top of `index.html`

### Stats and skill bars
Stat numbers use `data-count` (the target number) and an optional
`data-suffix` (e.g. `"+"`, `"M+"`) — see `.stat-num` elements in
`index.html` and `about.html`. They animate on scroll via
`js/main.js`. Skill bars use `data-fill` as a percentage (0–100) on the
`.skill-bar` element in `about.html`.

### Contact form
The form in `contact.html` now does three things by default:
- Validates fields (including stricter email validation).
- Blocks garbage / spammy message patterns.
- Sends with `fetch()` when `data-endpoint` is set on `#contact-form`.

If `data-endpoint` is empty, it falls back to opening a prefilled
`mailto:` draft to `data-recipient`.

Recommended setup:
- **Formspree**
  1. Create a Formspree form and copy your endpoint URL
     (example: `https://formspree.io/f/xxxxabcd`).
  2. In `contact.html`, set `data-endpoint="https://formspree.io/f/xxxxabcd"`
     on the form.
  3. Keep `data-recipient` as fallback.

No build step or extra package is required.

---

## 4. SEO & performance notes

- Every page has a unique `<title>`, meta description, canonical URL,
  Open Graph tags, and Twitter/X Card tags.
- A `Person` JSON-LD schema is included on the homepage.
- `robots.txt` and `sitemap.xml` are included — update the domain in
  both once you know your final URL.
- Images use `loading="lazy"` (except the above-the-fold profile
  photo) and explicit `width`/`height` to prevent layout shift.
- Animations respect `prefers-reduced-motion`; the mouse-reactive
  "aurora" light is skipped on touch devices and reduced-motion
  preferences.
- All interactive elements have visible focus states
  (`:focus-visible`) and a skip-to-content link.

---

## 5. Replacing placeholder images

Every image in `assets/` is a generated placeholder so the site looks
complete out of the box — swap them for real photography/artwork
whenever you're ready:

| File | Purpose | Recommended size |
|---|---|---|
| `assets/images/profile-photo.jpg` | Hero portrait | 800×800 |
| `assets/images/og-image.jpg` | Social share preview | 1200×630 |
| `assets/images/favicon.png` / `favicon-32.png` / `favicon.svg` | Browser tab icon | 512×512 / 32×32 / vector |
| `assets/projects/project-0X.jpg` | Project cover images | 1200×800 |
| `assets/blog/post-0X.jpg` | Blog post cover images | 1200×630 |

---

## 6. Browser support

Built on standard, widely-supported CSS and JS: CSS custom properties,
`backdrop-filter`, `IntersectionObserver`, and the Grid layout. Works in
current versions of Chrome, Edge, Safari, and Firefox. `backdrop-filter`
degrades gracefully to a solid translucent background on very old
browsers that don't support it.

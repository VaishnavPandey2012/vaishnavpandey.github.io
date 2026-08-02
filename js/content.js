/* =================================================================
   CONTENT.JS — shared helpers for admin-added blog posts + projects
   -------------------------------------------------------------------
   Blog posts live in Firestore at posts(collection)... actually at
   `blogPosts/{slug}`, projects at `projects/{id}`. Both are public to
   read, but only an account with role "admin" can write to them (see
   firestore.rules). This file just has the shared render/fetch logic
   so blog.html, index.html, projects.html, and post.html don't each
   duplicate it.
   ================================================================= */
(function () {
  "use strict";

  function escapeHtml(text) {
    return String(text)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function slugify(title) {
    return String(title)
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
      .slice(0, 60) || "post";
  }

  function formatDate(dateISO) {
    if (!dateISO) return "";
    var d = new Date(dateISO + "T00:00:00");
    if (isNaN(d.getTime())) return dateISO;
    return d.toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" });
  }

  /* -------- Video covers -------- */
  function youTubeId(url) {
    if (!url) return null;
    var m = String(url).match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{6,})/);
    return m ? m[1] : null;
  }

  function isDirectVideoUrl(url) {
    return /\.(mp4|webm|mov|m4v)(\?.*)?$/i.test(String(url || ""));
  }

  // card: true  -> small, non-interactive cover for a grid card (muted/looping or a thumbnail with a play badge)
  // card: false -> full-size cover for the post's own page (real player / embed)
  function coverMediaHtml(item, card) {
    var videoUrl = item.coverVideoUrl;
    var ytId = youTubeId(videoUrl);
    var title = escapeHtml(item.title || "");

    if (ytId) {
      if (card) {
        return '<img src="https://img.youtube.com/vi/' + ytId + '/hqdefault.jpg" alt="' + title + '" loading="lazy" width="1200" height="750" />' +
          '<span class="cover-play-badge" aria-hidden="true"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7Z"/></svg></span>';
      }
      return '<div class="cover-video-embed"><iframe src="https://www.youtube.com/embed/' + ytId + '" title="' + title + '" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen loading="lazy"></iframe></div>';
    }

    if (videoUrl && isDirectVideoUrl(videoUrl)) {
      if (card) {
        return '<video src="' + escapeHtml(videoUrl) + '" muted loop autoplay playsinline preload="metadata"></video>';
      }
      return '<video src="' + escapeHtml(videoUrl) + '" controls preload="metadata"></video>';
    }

    var img = item.imageUrl || "assets/blog/post-01.jpg";
    return '<img src="' + escapeHtml(img) + '" alt="' + title + '" loading="lazy" width="1200" height="750" />';
  }

  /* -------- Rich post content -------- */
  // Posts written with the new editor store real HTML (bold, sizes,
  // colors, etc). Older posts (from before the editor existed) stored
  // plain text split on newlines. Detect which one we've got so both
  // keep rendering correctly without needing to migrate old posts.
  function looksLikeHtml(str) {
    return /<[a-z][\s\S]*>/i.test(String(str || ""));
  }

  function renderContentHtml(content, fallbackSummary) {
    var raw = content || "";
    if (looksLikeHtml(raw)) return raw;
    var source = raw || fallbackSummary || "";
    var paragraphs = String(source).split(/\n+/).filter(Boolean);
    return paragraphs.map(function (p) { return "<p>" + escapeHtml(p) + "</p>"; }).join("") || ("<p>" + escapeHtml(fallbackSummary || "") + "</p>");
  }

  /* -------- Blog posts -------- */
  function blogPostHref(post) {
    return post.externalUrl ? post.externalUrl : "post.html?slug=" + encodeURIComponent(post.id);
  }

  function blogCardHtml(post, revealClass) {
    return [
      '<article class="blog-card glass glass-hover ' + (revealClass || "reveal") + '">',
      '<div class="blog-media">',
      coverMediaHtml(post, true),
      post.category ? '<span class="blog-category">' + escapeHtml(post.category) + '</span>' : "",
      '</div>',
      '<div class="blog-body">',
      '<span class="blog-date">' + escapeHtml(formatDate(post.dateISO)) + '</span>',
      '<h3>' + escapeHtml(post.title) + '</h3>',
      '<p>' + escapeHtml(post.summary || "") + '</p>',
      '<a class="blog-readmore" href="' + escapeHtml(blogPostHref(post)) + '">Read More',
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14"></path><path d="m13 5 7 7-7 7"></path></svg>',
      '</a>',
      '</div>',
      '</article>'
    ].join("");
  }

  function fetchBlogPosts(db, max) {
    return db.collection("blogPosts").orderBy("createdAt", "desc").limit(max || 20).get().then(function (snap) {
      return snap.docs.map(function (doc) {
        return Object.assign({ id: doc.id }, doc.data());
      });
    }).catch(function (err) {
      console.error("Failed to load blog posts:", err);
      return [];
    });
  }

  /* -------- Projects -------- */
  function projectCardHtml(project, revealClass) {
    var img = project.imageUrl || "assets/projects/project-01.jpg";
    var tags = Array.isArray(project.tags) ? project.tags : [];
    return [
      '<article class="project-card glass glass-hover ' + (revealClass || "reveal") + '">',
      '<div class="project-media">',
      '<img src="' + escapeHtml(img) + '" alt="Cover artwork for ' + escapeHtml(project.title) + '" loading="lazy" width="1200" height="800" />',
      '</div>',
      '<div class="project-body">',
      '<div class="project-tags">' + tags.map(function (t) { return '<span class="tag">' + escapeHtml(t) + '</span>'; }).join("") + '</div>',
      '<h3>' + escapeHtml(project.title) + '</h3>',
      '<p>' + escapeHtml(project.description || "") + '</p>',
      '<div class="project-links">',
      project.githubUrl ? '<a href="' + escapeHtml(project.githubUrl) + '" class="btn btn-sm btn-ghost" target="_blank" rel="noopener">GitHub</a>' : "",
      project.demoUrl ? '<a href="' + escapeHtml(project.demoUrl) + '" class="btn btn-sm btn-primary" target="_blank" rel="noopener">Live demo</a>' : "",
      '</div>',
      '</div>',
      '</article>'
    ].join("");
  }

  function fetchProjects(db, max) {
    return db.collection("projects").orderBy("createdAt", "desc").limit(max || 30).get().then(function (snap) {
      return snap.docs.map(function (doc) {
        return Object.assign({ id: doc.id }, doc.data());
      });
    }).catch(function (err) {
      console.error("Failed to load projects:", err);
      return [];
    });
  }

  window.ContentApp = {
    escapeHtml: escapeHtml,
    slugify: slugify,
    formatDate: formatDate,
    blogPostHref: blogPostHref,
    blogCardHtml: blogCardHtml,
    fetchBlogPosts: fetchBlogPosts,
    projectCardHtml: projectCardHtml,
    fetchProjects: fetchProjects,
    coverMediaHtml: coverMediaHtml,
    renderContentHtml: renderContentHtml,
    youTubeId: youTubeId,
    isDirectVideoUrl: isDirectVideoUrl
  };
})();

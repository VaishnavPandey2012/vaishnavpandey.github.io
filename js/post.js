/* =================================================================
   POST.JS — behaviour for post.html only.
   Fetches blogPosts/{slug} from Firestore (slug comes from ?slug=)
   and fills in the template, then re-runs main.js's reaction/comment
   binding now that the real post id is known.
   ================================================================= */
(function () {
  "use strict";

  document.addEventListener("DOMContentLoaded", function () {
    if (!window.AuthApp || !window.ContentApp) {
      console.error("AuthApp/ContentApp not found — check script order on this page");
      return;
    }

    var db = window.AuthApp.db;
    var C = window.ContentApp;

    var params = new URLSearchParams(window.location.search);
    var slug = params.get("slug");

    var notFoundEl = document.getElementById("post-not-found");
    var loadedEl = document.getElementById("post-loaded");

    if (!slug) {
      notFoundEl.style.display = "block";
      return;
    }

    db.collection("blogPosts").doc(slug).get().then(function (snap) {
      if (!snap.exists) {
        notFoundEl.style.display = "block";
        return;
      }
      var post = snap.data();

      document.title = post.title + " — Vaishnav Pandey";
      var descEl = document.getElementById("page-description");
      if (descEl) descEl.setAttribute("content", post.summary || "");

      document.getElementById("post-title").textContent = post.title;
      document.getElementById("post-date").textContent = C.formatDate(post.dateISO) + (post.category ? " · " + post.category : "");

      document.getElementById("post-cover").innerHTML = C.coverMediaHtml(post, false);

      var bodyEl = document.getElementById("post-body");
      bodyEl.innerHTML = C.renderContentHtml(post.content, post.summary);

      // Wire the real post id into every reaction bar / comment thread
      // on the page, then let main.js bind click handlers + listeners
      // now that these are no longer empty strings.
      document.getElementById("reactions-top").setAttribute("data-post-id", slug);
      document.getElementById("reactions-bottom").setAttribute("data-post-id", slug);
      document.getElementById("post-article").setAttribute("data-post-id", slug);
      document.getElementById("comment-section").setAttribute("data-comment-thread", slug);

      loadedEl.style.display = "block";
      loadedEl.querySelectorAll(".reveal").forEach(function (el) { el.classList.add("is-visible"); });

      if (window.initPostReactions) window.initPostReactions();
    }).catch(function (err) {
      console.error("Failed to load post:", err);
      notFoundEl.style.display = "block";
    });
  });
})();

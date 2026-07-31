/* =================================================================
   ADMIN-BLOG.JS — behaviour for admin-blog.html only.
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

    var guard = document.getElementById("admin-guard");
    var panel = document.getElementById("admin-panel");
    var form = document.getElementById("post-form");
    var status = document.getElementById("form-status");
    var listEl = document.getElementById("post-list");
    var formHeading = document.getElementById("form-heading");
    var cancelBtn = document.getElementById("cancel-edit");

    function resetForm() {
      form.reset();
      form.editingId.value = "";
      formHeading.textContent = "Add a new post";
      cancelBtn.style.display = "none";
      status.textContent = "";
    }

    function loadPosts() {
      C.fetchBlogPosts(db, 100).then(function (posts) {
        if (!posts.length) {
          listEl.innerHTML = '<p style="color:var(--color-text-faint); margin:0;">No admin-added posts yet.</p>';
          return;
        }
        listEl.innerHTML = posts.map(function (post) {
          return [
            '<div style="display:flex; justify-content:space-between; gap:16px; align-items:center; padding:14px 0; border-bottom: var(--glass-border);">',
            '<div>',
            '<strong>' + C.escapeHtml(post.title) + '</strong><br />',
            '<span style="font-size:0.82rem; color:var(--color-text-faint);">' + C.escapeHtml(C.formatDate(post.dateISO)) + (post.category ? " · " + C.escapeHtml(post.category) : "") + '</span>',
            '</div>',
            '<div style="display:flex; gap:8px; flex-shrink:0;">',
            '<button type="button" class="btn btn-sm btn-ghost" data-edit="' + post.id + '">Edit</button>',
            '<button type="button" class="btn btn-sm btn-ghost" data-delete="' + post.id + '">Delete</button>',
            '</div>',
            '</div>'
          ].join("");
        }).join("");

        listEl.querySelectorAll("[data-edit]").forEach(function (btn) {
          btn.addEventListener("click", function () {
            var post = posts.find(function (p) { return p.id === btn.getAttribute("data-edit"); });
            if (!post) return;
            form.editingId.value = post.id;
            form.title.value = post.title || "";
            form.category.value = post.category || "";
            form.dateISO.value = post.dateISO || "";
            form.imageUrl.value = post.imageUrl || "";
            form.summary.value = post.summary || "";
            form.content.value = post.content || "";
            form.externalUrl.value = post.externalUrl || "";
            formHeading.textContent = "Editing: " + post.title;
            cancelBtn.style.display = "inline-flex";
            window.scrollTo({ top: form.offsetTop - 100, behavior: "smooth" });
          });
        });

        listEl.querySelectorAll("[data-delete]").forEach(function (btn) {
          btn.addEventListener("click", function () {
            if (!window.confirm("Delete this post? This can't be undone.")) return;
            db.collection("blogPosts").doc(btn.getAttribute("data-delete")).delete().then(loadPosts).catch(function (err) {
              alert("Couldn't delete: " + err.message);
            });
          });
        });
      });
    }

    cancelBtn.addEventListener("click", resetForm);

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var title = form.title.value.trim();
      var summary = form.summary.value.trim();
      var dateISO = form.dateISO.value;
      if (!title || !summary || !dateISO) {
        status.textContent = "Title, summary, and date are required.";
        return;
      }

      var data = {
        title: title,
        category: form.category.value.trim(),
        dateISO: dateISO,
        imageUrl: form.imageUrl.value.trim(),
        summary: summary,
        content: form.content.value,
        externalUrl: form.externalUrl.value.trim(),
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      };

      var editingId = form.editingId.value;
      status.textContent = "Saving…";

      var savePromise;
      if (editingId) {
        savePromise = db.collection("blogPosts").doc(editingId).set(data, { merge: true });
      } else {
        var slug = C.slugify(title);
        savePromise = db.collection("blogPosts").doc(slug).get().then(function (snap) {
          var finalSlug = snap.exists ? slug + "-" + Date.now().toString().slice(-5) : slug;
          return db.collection("blogPosts").doc(finalSlug).set(data);
        });
      }

      savePromise.then(function () {
        status.textContent = "Saved.";
        resetForm();
        loadPosts();
      }).catch(function (err) {
        status.textContent = "Couldn't save: " + err.message;
      });
    });

    window.AuthApp.onReady(function (user, profile) {
      if (!user || !profile || profile.role !== "admin") {
        guard.style.display = "block";
        panel.style.display = "none";
        return;
      }
      guard.style.display = "none";
      panel.style.display = "block";
      loadPosts();
    });
  });
})();

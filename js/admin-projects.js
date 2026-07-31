/* =================================================================
   ADMIN-PROJECTS.JS — behaviour for admin-projects.html only.
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
    var form = document.getElementById("project-form");
    var status = document.getElementById("form-status");
    var listEl = document.getElementById("project-list");
    var formHeading = document.getElementById("form-heading");
    var cancelBtn = document.getElementById("cancel-edit");

    function resetForm() {
      form.reset();
      form.editingId.value = "";
      formHeading.textContent = "Add a new project";
      cancelBtn.style.display = "none";
      status.textContent = "";
    }

    function loadProjects() {
      C.fetchProjects(db, 100).then(function (projects) {
        if (!projects.length) {
          listEl.innerHTML = '<p style="color:var(--color-text-faint); margin:0;">No admin-added projects yet.</p>';
          return;
        }
        listEl.innerHTML = projects.map(function (project) {
          return [
            '<div style="display:flex; justify-content:space-between; gap:16px; align-items:center; padding:14px 0; border-bottom: var(--glass-border);">',
            '<div>',
            '<strong>' + C.escapeHtml(project.title) + '</strong><br />',
            '<span style="font-size:0.82rem; color:var(--color-text-faint);">' + (Array.isArray(project.tags) ? project.tags.map(C.escapeHtml).join(", ") : "") + '</span>',
            '</div>',
            '<div style="display:flex; gap:8px; flex-shrink:0;">',
            '<button type="button" class="btn btn-sm btn-ghost" data-edit="' + project.id + '">Edit</button>',
            '<button type="button" class="btn btn-sm btn-ghost" data-delete="' + project.id + '">Delete</button>',
            '</div>',
            '</div>'
          ].join("");
        }).join("");

        listEl.querySelectorAll("[data-edit]").forEach(function (btn) {
          btn.addEventListener("click", function () {
            var project = projects.find(function (p) { return p.id === btn.getAttribute("data-edit"); });
            if (!project) return;
            form.editingId.value = project.id;
            form.title.value = project.title || "";
            form.tags.value = Array.isArray(project.tags) ? project.tags.join(", ") : "";
            form.imageUrl.value = project.imageUrl || "";
            form.description.value = project.description || "";
            form.githubUrl.value = project.githubUrl || "";
            form.demoUrl.value = project.demoUrl || "";
            formHeading.textContent = "Editing: " + project.title;
            cancelBtn.style.display = "inline-flex";
            window.scrollTo({ top: form.offsetTop - 100, behavior: "smooth" });
          });
        });

        listEl.querySelectorAll("[data-delete]").forEach(function (btn) {
          btn.addEventListener("click", function () {
            if (!window.confirm("Delete this project? This can't be undone.")) return;
            db.collection("projects").doc(btn.getAttribute("data-delete")).delete().then(loadProjects).catch(function (err) {
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
      var description = form.description.value.trim();
      if (!title || !description) {
        status.textContent = "Title and description are required.";
        return;
      }

      var tags = form.tags.value.split(",").map(function (t) { return t.trim(); }).filter(Boolean);

      var data = {
        title: title,
        tags: tags,
        imageUrl: form.imageUrl.value.trim(),
        description: description,
        githubUrl: form.githubUrl.value.trim(),
        demoUrl: form.demoUrl.value.trim(),
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      };

      var editingId = form.editingId.value;
      status.textContent = "Saving…";

      var savePromise = editingId
        ? db.collection("projects").doc(editingId).set(data, { merge: true })
        : db.collection("projects").add(data);

      savePromise.then(function () {
        status.textContent = "Saved.";
        resetForm();
        loadProjects();
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
      loadProjects();
    });
  });
})();

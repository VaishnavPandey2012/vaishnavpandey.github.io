/* =================================================================
   ADMIN.JS — behaviour for admin.html only.
   Client-side check is just for showing/hiding the UI. The real
   enforcement is in the Firestore security rules: only a user whose
   own users/{uid} doc has role "admin" is allowed to write another
   user's role field. See firestore.rules / SETUP_GUIDE.md.
   ================================================================= */
(function () {
  "use strict";

  document.addEventListener("DOMContentLoaded", function () {
    if (!window.AuthApp) {
      console.error("AuthApp not found — make sure js/auth.js is loaded before js/admin.js");
      return;
    }

    var guard = document.getElementById("admin-guard");
    var panel = document.getElementById("admin-panel");
    var links = document.getElementById("admin-links");
    var rows = document.getElementById("admin-user-rows");
    var db = window.AuthApp.db;

    function escapeHtml(text) {
      return String(text)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
    }

    function loadUsers() {
      db.collection("users").orderBy("createdAt", "desc").limit(100).get().then(function (snap) {
        rows.innerHTML = "";
        snap.forEach(function (doc) {
          var data = doc.data();
          var uid = doc.id;
          var isAdmin = data.role === "admin";
          var tr = document.createElement("tr");
          tr.innerHTML =
            "<td>" + escapeHtml(data.name || "—") + "</td>" +
            "<td>" + escapeHtml(data.email || "—") + "</td>" +
            "<td><span class=\"role-pill" + (isAdmin ? " is-admin" : "") + "\">" + (isAdmin ? "Admin" : "User") + "</span></td>" +
            "<td><button type=\"button\" class=\"btn btn-sm btn-ghost\" data-uid=\"" + uid + "\" data-next-role=\"" + (isAdmin ? "user" : "admin") + "\">" +
              (isAdmin ? "Demote to user" : "Promote to admin") +
            "</button></td>";
          rows.appendChild(tr);
        });

        rows.querySelectorAll("button[data-uid]").forEach(function (btn) {
          btn.addEventListener("click", function () {
            var uid = btn.getAttribute("data-uid");
            var nextRole = btn.getAttribute("data-next-role");
            btn.disabled = true;
            db.collection("users").doc(uid).update({ role: nextRole }).then(loadUsers).catch(function (err) {
              alert("Couldn't update role: " + err.message);
              btn.disabled = false;
            });
          });
        });
      });
    }

    window.AuthApp.onReady(function (user, profile) {
      if (!user || !profile || profile.role !== "admin") {
        guard.style.display = "block";
        panel.style.display = "none";
        links.style.display = "none";
        return;
      }
      guard.style.display = "none";
      panel.style.display = "block";
      links.style.display = "grid";
      loadUsers();
    });
  });
})();

/* =================================================================
   AUTH.JS — shared Firebase Authentication + user profile layer
   -------------------------------------------------------------------
   Loaded on every page, after the Firebase compat SDK scripts and
   js/firebase-config.js, and before js/main.js. Provides:

     - Email/password sign up + login
     - Google and GitHub OAuth sign-in
     - Logout, password reset
     - A per-user Firestore profile doc (users/{uid}) with a "role"
       field ("user" or "admin") for the user-level system
     - The small user icon / avatar dropdown in the navbar on every
       page (elements with id="nav-auth-*", injected in each page's
       <nav>)
     - window.AuthApp: a small API other scripts (js/main.js) use to
       check the current user and require login before reacting or
       commenting on a post.

   See SETUP_GUIDE.md for the Firebase console steps this depends on.
   ================================================================= */
(function () {
  "use strict";

  if (!window.firebase || !window.firebaseConfig) {
    console.error("Firebase SDK or firebase-config.js not loaded before auth.js");
    return;
  }

  if (!firebase.apps.length) {
    firebase.initializeApp(window.firebaseConfig);
  }

  // Optional: Analytics, only if a measurementId was set in
  // firebase-config.js and the compat SDK script was included.
  if (window.firebaseConfig.measurementId && firebase.analytics) {
    try { firebase.analytics(); } catch (err) { /* blocked by an ad-blocker etc. — harmless */ }
  }

  var auth = firebase.auth();
  var db = firebase.firestore();

  var currentUser = null;
  var currentProfile = null;
  var ready = false;
  var readyCallbacks = [];

  /* ---------------------------------------------------------------
     Profile helpers
  ------------------------------------------------------------------ */
  function userDocRef(uid) {
    return db.collection("users").doc(uid);
  }

  // Creates the Firestore profile the first time we see a user
  // (covers email/password sign-up AND first Google/GitHub login).
  // Never overwrites an existing "role" so nobody can self-promote.
  function ensureProfile(user, extra) {
    var ref = userDocRef(user.uid);
    return ref.get().then(function (snap) {
      if (snap.exists) {
        return snap.data();
      }
      var profile = {
        name: (extra && extra.name) || user.displayName || (user.email ? user.email.split("@")[0] : "Member"),
        email: user.email || "",
        role: "user",
        provider: (user.providerData[0] && user.providerData[0].providerId) || "password",
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      };
      return ref.set(profile).then(function () { return profile; });
    });
  }

  function loadProfile(user) {
    return userDocRef(user.uid).get().then(function (snap) {
      return snap.exists ? snap.data() : null;
    });
  }

  /* ---------------------------------------------------------------
     Public auth actions
  ------------------------------------------------------------------ */
  function signUp(name, email, password) {
    return auth.createUserWithEmailAndPassword(email, password).then(function (cred) {
      return cred.user.updateProfile({ displayName: name }).then(function () {
        return ensureProfile(cred.user, { name: name });
      });
    });
  }

  function logIn(email, password) {
    return auth.signInWithEmailAndPassword(email, password);
  }

  function logInWithGoogle() {
    var provider = new firebase.auth.GoogleAuthProvider();
    return auth.signInWithPopup(provider).then(function (cred) {
      return ensureProfile(cred.user);
    });
  }

  function logInWithGitHub() {
    var provider = new firebase.auth.GithubAuthProvider();
    return auth.signInWithPopup(provider).then(function (cred) {
      return ensureProfile(cred.user);
    });
  }

  function resetPassword(email) {
    return auth.sendPasswordResetEmail(email);
  }

  function logOut() {
    return auth.signOut();
  }

  // Redirects to the login page, remembering where to come back to.
  function requireLogin() {
    var here = window.location.pathname.split("/").pop() + window.location.search + window.location.hash;
    window.location.href = "login.html?redirect=" + encodeURIComponent(here || "index.html");
  }

  function onReady(cb) {
    if (ready) { cb(currentUser, currentProfile); }
    else { readyCallbacks.push(cb); }
  }

  /* ---------------------------------------------------------------
     Nav UI: small user icon (signed out) / avatar + dropdown (signed in)
     These element ids are expected in the <nav> of every page.
  ------------------------------------------------------------------ */
  function initNavUI() {
    var signedOutEl = document.getElementById("nav-auth-signed-out");
    var signedInEl = document.getElementById("nav-auth-signed-in");
    var avatarBtn = document.getElementById("nav-auth-avatar-btn");
    var menu = document.getElementById("nav-auth-menu");
    var initialsEl = document.getElementById("nav-auth-initials");
    var nameEl = document.getElementById("nav-auth-name");
    var roleEl = document.getElementById("nav-auth-role");
    var adminLink = document.getElementById("nav-auth-admin-link");
    var logoutBtn = document.getElementById("nav-auth-logout");

    if (avatarBtn && menu) {
      avatarBtn.addEventListener("click", function (e) {
        e.stopPropagation();
        var open = menu.classList.toggle("is-open");
        avatarBtn.setAttribute("aria-expanded", open ? "true" : "false");
      });
      document.addEventListener("click", function (e) {
        if (!menu.classList.contains("is-open")) return;
        if (menu.contains(e.target) || avatarBtn.contains(e.target)) return;
        menu.classList.remove("is-open");
        avatarBtn.setAttribute("aria-expanded", "false");
      });
    }

    if (logoutBtn) {
      logoutBtn.addEventListener("click", function () {
        logOut().then(function () {
          window.location.href = "index.html";
        });
      });
    }

    function initials(name) {
      return String(name || "?")
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map(function (p) { return p.charAt(0).toUpperCase(); })
        .join("") || "?";
    }

    function render(user, profile) {
      if (user) {
        if (signedOutEl) signedOutEl.hidden = true;
        if (signedInEl) signedInEl.hidden = false;
        var displayName = (profile && profile.name) || user.displayName || user.email || "Member";
        if (initialsEl) initialsEl.textContent = initials(displayName);
        if (nameEl) nameEl.textContent = displayName;
        var role = (profile && profile.role) || "user";
        if (roleEl) roleEl.textContent = role === "admin" ? "Admin" : "Member";
        if (adminLink) adminLink.hidden = role !== "admin";
      } else {
        if (signedOutEl) signedOutEl.hidden = false;
        if (signedInEl) signedInEl.hidden = true;
        if (menu) menu.classList.remove("is-open");
      }
    }

    onReady(render);
    document.addEventListener("authStateChanged", function (e) {
      render(e.detail.user, e.detail.profile);
    });
  }

  /* ---------------------------------------------------------------
     Boot
  ------------------------------------------------------------------ */
  auth.onAuthStateChanged(function (user) {
    if (!user) {
      currentUser = null;
      currentProfile = null;
      ready = true;
      readyCallbacks.forEach(function (cb) { cb(null, null); });
      readyCallbacks = [];
      document.dispatchEvent(new CustomEvent("authStateChanged", { detail: { user: null, profile: null } }));
      return;
    }
    loadProfile(user).then(function (profile) {
      currentUser = user;
      currentProfile = profile;
      ready = true;
      readyCallbacks.forEach(function (cb) { cb(user, profile); });
      readyCallbacks = [];
      document.dispatchEvent(new CustomEvent("authStateChanged", { detail: { user: user, profile: profile } }));
    });
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initNavUI);
  } else {
    initNavUI();
  }

  window.AuthApp = {
    auth: auth,
    db: db,
    signUp: signUp,
    logIn: logIn,
    logInWithGoogle: logInWithGoogle,
    logInWithGitHub: logInWithGitHub,
    resetPassword: resetPassword,
    logOut: logOut,
    requireLogin: requireLogin,
    onReady: onReady,
    getCurrentUser: function () { return currentUser; },
    getCurrentProfile: function () { return currentProfile; }
  };
})();

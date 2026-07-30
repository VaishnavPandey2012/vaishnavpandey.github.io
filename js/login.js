/* =================================================================
   LOGIN.JS — behaviour for login.html only.
   Depends on window.AuthApp from js/auth.js being loaded first.
   ================================================================= */
(function () {
  "use strict";

  document.addEventListener("DOMContentLoaded", function () {
    if (!window.AuthApp) {
      console.error("AuthApp not found — make sure js/auth.js is loaded before js/login.js");
      return;
    }

    function redirectTarget() {
      var params = new URLSearchParams(window.location.search);
      var target = params.get("redirect");
      return target && target.indexOf("//") === -1 ? target : "index.html";
    }

    // If already signed in, just leave.
    window.AuthApp.onReady(function (user) {
      if (user) window.location.href = redirectTarget();
    });

    /* -------- Tabs -------- */
    var tabs = document.querySelectorAll("[data-auth-tab]");
    var panels = document.querySelectorAll("[data-auth-panel]");
    tabs.forEach(function (tab) {
      tab.addEventListener("click", function () {
        var target = tab.getAttribute("data-auth-tab");
        tabs.forEach(function (t) { t.classList.toggle("is-active", t === tab); });
        panels.forEach(function (p) {
          p.classList.toggle("is-active", p.getAttribute("data-auth-panel") === target);
        });
      });
    });

    function friendlyError(err) {
      var map = {
        "auth/email-already-in-use": "That email already has an account — try logging in instead.",
        "auth/invalid-email": "That email address doesn't look right.",
        "auth/weak-password": "Password should be at least 6 characters.",
        "auth/user-not-found": "No account found with that email.",
        "auth/wrong-password": "Incorrect password.",
        "auth/invalid-credential": "Incorrect email or password.",
        "auth/popup-closed-by-user": "Sign-in popup was closed before completing.",
        "auth/account-exists-with-different-credential": "An account already exists with this email using a different sign-in method."
      };
      return (err && map[err.code]) || (err && err.message) || "Something went wrong. Please try again.";
    }

    /* -------- Login form -------- */
    var loginForm = document.getElementById("login-form");
    var loginStatus = document.getElementById("login-status");
    if (loginForm) {
      loginForm.addEventListener("submit", function (e) {
        e.preventDefault();
        var email = loginForm.email.value.trim();
        var password = loginForm.password.value;
        loginStatus.textContent = "Logging in…";
        loginStatus.classList.remove("is-success");
        window.AuthApp.logIn(email, password).then(function () {
          loginStatus.textContent = "Success! Redirecting…";
          loginStatus.classList.add("is-success");
          window.location.href = redirectTarget();
        }).catch(function (err) {
          loginStatus.textContent = friendlyError(err);
        });
      });
    }

    /* -------- Forgot password -------- */
    var forgotLink = document.getElementById("forgot-password-link");
    if (forgotLink) {
      forgotLink.addEventListener("click", function (e) {
        e.preventDefault();
        var email = (loginForm && loginForm.email.value.trim()) || window.prompt("Enter your account email:");
        if (!email) return;
        window.AuthApp.resetPassword(email).then(function () {
          loginStatus.textContent = "Password reset email sent to " + email + ".";
          loginStatus.classList.add("is-success");
        }).catch(function (err) {
          loginStatus.textContent = friendlyError(err);
        });
      });
    }

    /* -------- Register form -------- */
    var registerForm = document.getElementById("register-form");
    var registerStatus = document.getElementById("register-status");
    if (registerForm) {
      registerForm.addEventListener("submit", function (e) {
        e.preventDefault();
        var name = registerForm.name.value.trim();
        var email = registerForm.email.value.trim();
        var password = registerForm.password.value;
        registerStatus.textContent = "Creating your account…";
        registerStatus.classList.remove("is-success");
        window.AuthApp.signUp(name, email, password).then(function () {
          registerStatus.textContent = "Account created! Redirecting…";
          registerStatus.classList.add("is-success");
          window.location.href = redirectTarget();
        }).catch(function (err) {
          registerStatus.textContent = friendlyError(err);
        });
      });
    }

    /* -------- OAuth -------- */
    var googleBtn = document.getElementById("google-signin");
    if (googleBtn) {
      googleBtn.addEventListener("click", function () {
        window.AuthApp.logInWithGoogle().then(function () {
          window.location.href = redirectTarget();
        }).catch(function (err) {
          (loginStatus || registerStatus).textContent = friendlyError(err);
        });
      });
    }

    var githubBtn = document.getElementById("github-signin");
    if (githubBtn) {
      githubBtn.addEventListener("click", function () {
        window.AuthApp.logInWithGitHub().then(function () {
          window.location.href = redirectTarget();
        }).catch(function (err) {
          (loginStatus || registerStatus).textContent = friendlyError(err);
        });
      });
    }
  });
})();

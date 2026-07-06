/* =================================================================
   ALEX RIVERA — PORTFOLIO / main.js
   -------------------------------------------------------------------
   Vanilla JS only. Organised into small, independent functions that
   each own one piece of behaviour. Nothing here depends on a
   framework or build step, so this file can be dropped straight
   into GitHub Pages.
   ================================================================= */
(function () {
  "use strict";

  var prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var isFinePointer = window.matchMedia("(pointer: fine)").matches;

  if (prefersReducedMotion) document.documentElement.classList.add("reduced-motion");
  if (!isFinePointer) document.documentElement.classList.add("no-fine-pointer");

  document.addEventListener("DOMContentLoaded", function () {
    setFooterYear();
    initMobileMenu();
    initActiveNav();
    initNavScrollState();
    initSmoothAnchors();
    initScrollReveal();
    initAuroraCursor();
    initContactForm();
    initPageTransition();
  });

  /* ---------------------------------------------------------------
     Footer year
  ------------------------------------------------------------------ */
  function setFooterYear() {
    var els = document.querySelectorAll("[data-year]");
    var year = new Date().getFullYear();
    els.forEach(function (el) { el.textContent = year; });
  }

  /* ---------------------------------------------------------------
     Mobile menu — full-screen glass overlay
  ------------------------------------------------------------------ */
  function initMobileMenu() {
    var toggle = document.querySelector(".nav-toggle");
    var menu = document.querySelector(".mobile-menu");
    if (!toggle || !menu) return;

    function close() {
      toggle.classList.remove("is-open");
      menu.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
      document.body.style.overflow = "";
    }
    function open() {
      toggle.classList.add("is-open");
      menu.classList.add("is-open");
      toggle.setAttribute("aria-expanded", "true");
      document.body.style.overflow = "hidden";
    }

    toggle.addEventListener("click", function () {
      var isOpen = toggle.classList.contains("is-open");
      isOpen ? close() : open();
    });

    menu.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", close);
    });

    window.addEventListener("keydown", function (e) {
      if (e.key === "Escape") close();
    });
  }

  /* ---------------------------------------------------------------
     Highlight the nav link matching the current page / hash
  ------------------------------------------------------------------ */
  function initActiveNav() {
    var path = window.location.pathname.split("/").pop() || "index.html";
    var links = document.querySelectorAll(".nav-links a, .mobile-menu a");

    links.forEach(function (link) {
      var href = link.getAttribute("href") || "";
      var hrefPage = href.split("#")[0] || "index.html";
      if (hrefPage === "" ) hrefPage = "index.html";
      if (hrefPage === path) {
        link.classList.add("active");
      }
    });
  }

  /* ---------------------------------------------------------------
     Give the floating navbar a stronger glass background once the
     page has scrolled past the hero, so it stays legible.
  ------------------------------------------------------------------ */
  function initNavScrollState() {
    var navbar = document.querySelector(".navbar");
    if (!navbar) return;
    var ticking = false;

    function update() {
      navbar.classList.toggle("is-scrolled", window.scrollY > 40);
      ticking = false;
    }
    window.addEventListener("scroll", function () {
      if (!ticking) {
        window.requestAnimationFrame(update);
        ticking = true;
      }
    }, { passive: true });
    update();
  }

  /* ---------------------------------------------------------------
     Smooth scroll for in-page anchor links (Home / Social on pages
     that contain those sections). Falls back to default browser
     behaviour for cross-page links.
  ------------------------------------------------------------------ */
  function initSmoothAnchors() {
    document.querySelectorAll('a[href*="#"]').forEach(function (link) {
      var href = link.getAttribute("href");
      var hashIndex = href.indexOf("#");
      if (hashIndex === -1) return;
      var pagePart = href.substring(0, hashIndex);
      var hashPart = href.substring(hashIndex + 1);
      var samePage = pagePart === "" || pagePart === window.location.pathname.split("/").pop();

      if (samePage && hashPart) {
        link.addEventListener("click", function (e) {
          var target = document.getElementById(hashPart);
          if (target) {
            e.preventDefault();
            var top = target.getBoundingClientRect().top + window.scrollY - 90;
            window.scrollTo({ top: top, behavior: prefersReducedMotion ? "auto" : "smooth" });
            history.pushState(null, "", "#" + hashPart);
          }
        });
      }
    });
  }

  /* ---------------------------------------------------------------
     Scroll-triggered reveal animations, plus two small "bonus"
     behaviours that piggyback on the same observer:
       - skill bars fill to their data-fill percentage
       - stat numbers count up from 0
  ------------------------------------------------------------------ */
  function initScrollReveal() {
    var revealEls = document.querySelectorAll(".reveal");
    if (!("IntersectionObserver" in window) || prefersReducedMotion) {
      revealEls.forEach(function (el) { el.classList.add("is-visible"); });
      fillSkillBars(document);
      countUpAll(document);
      return;
    }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          fillSkillBars(entry.target);
          countUpAll(entry.target);
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.18, rootMargin: "0px 0px -40px 0px" });

    revealEls.forEach(function (el) { observer.observe(el); });
  }

  function fillSkillBars(scope) {
    var bars = scope.querySelectorAll ? scope.querySelectorAll("[data-fill]") : [];
    (scope.matches && scope.matches("[data-fill]") ? [scope] : Array.from(bars)).forEach(function (bar) {
      var fill = bar.getAttribute("data-fill");
      var inner = bar.querySelector("span");
      if (inner && fill) {
        requestAnimationFrame(function () { inner.style.width = fill + "%"; });
      }
    });
  }

  function countUpAll(scope) {
    var nums = scope.querySelectorAll ? scope.querySelectorAll("[data-count]") : [];
    var list = scope.matches && scope.matches("[data-count]") ? [scope] : Array.from(nums);
    list.forEach(function (el) {
      var target = parseFloat(el.getAttribute("data-count"));
      var suffix = el.getAttribute("data-suffix") || "";
      if (isNaN(target) || el.classList.contains("is-counting")) return;
      el.classList.add("is-counting");
      var duration = 1400;
      var start = null;
      function step(ts) {
        if (!start) start = ts;
        var progress = Math.min((ts - start) / duration, 1);
        var eased = 1 - Math.pow(1 - progress, 3);
        el.textContent = Math.round(target * eased) + suffix;
        if (progress < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    });
  }

  /* ---------------------------------------------------------------
     Signature interaction: a soft aurora light that follows the
     cursor and shows through the glass panels above it. Desktop /
     fine-pointer only; skipped entirely for touch and reduced motion.
  ------------------------------------------------------------------ */
  function initAuroraCursor() {
    if (!isFinePointer || prefersReducedMotion) return;

    var cursor = document.createElement("div");
    cursor.className = "aurora-cursor";
    cursor.setAttribute("aria-hidden", "true");
    document.body.appendChild(cursor);

    var mouseX = window.innerWidth / 2;
    var mouseY = window.innerHeight / 2;
    var raf = null;

    window.addEventListener("mousemove", function (e) {
      mouseX = e.clientX;
      mouseY = e.clientY;
      if (!raf) {
        raf = requestAnimationFrame(function () {
          document.documentElement.style.setProperty("--mx", mouseX + "px");
          document.documentElement.style.setProperty("--my", mouseY + "px");
          raf = null;
        });
      }
    });
  }

  /* ---------------------------------------------------------------
     Contact form — front-end validation + simulated submission.
     There is no backend wired up by default. To connect a real
     endpoint (Formspree, Netlify Forms, EmailJS, your own API):
       1. Remove the e.preventDefault() fake-submit block below.
       2. Point the <form> action/method at your endpoint in
          contact.html, or call fetch() here with your provider's URL.
  ------------------------------------------------------------------ */
  function initContactForm() {
    var form = document.querySelector("#contact-form");
    if (!form) return;
    var status = form.querySelector(".form-status");

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var valid = true;

      form.querySelectorAll("[required]").forEach(function (field) {
        var row = field.closest(".form-row");
        var ok = field.value.trim().length > 0;
        if (field.type === "email" && ok) {
          ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(field.value.trim());
        }
        if (row) row.classList.toggle("has-error", !ok);
        if (!ok) valid = false;
      });

      if (!valid) {
        if (status) {
          status.textContent = "Please fill in every field with a valid value.";
          status.className = "form-status";
          status.style.display = "block";
          status.style.color = "var(--accent-coral)";
        }
        return;
      }

      // ---- Fake submit success state (replace with real request) ----
      if (status) {
        status.textContent = "Thanks — your message has been noted. I'll reply within 2 business days.";
        status.className = "form-status is-success";
      }
      form.reset();
      form.querySelectorAll(".form-row").forEach(function (row) { row.classList.remove("has-error"); });
    });
  }

  /* ---------------------------------------------------------------
     Subtle page-leave transition for a more premium, app-like feel
     when moving between pages. Purely cosmetic; navigation still
     works instantly if JS is disabled.
  ------------------------------------------------------------------ */
  function initPageTransition() {
    if (prefersReducedMotion) return;
    var overlay = document.createElement("div");
    overlay.className = "page-transition";
    overlay.setAttribute("aria-hidden", "true");
    document.body.appendChild(overlay);

    document.querySelectorAll("a[href$='.html'], a[href='/'], a[href='./']").forEach(function (link) {
      if (link.target === "_blank" || link.hasAttribute("download")) return;
      var url = link.getAttribute("href");
      if (!url || url.indexOf("http") === 0) return;

      link.addEventListener("click", function (e) {
        e.preventDefault();
        overlay.classList.add("is-active");
        setTimeout(function () { window.location.href = url; }, 320);
      });
    });
  }
})();

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
    initPostReactions();
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
     Blog post reactions + comments for the GitHub Universe article.
     Stored in localStorage so the page stays static but still feels
     interactive.
  ------------------------------------------------------------------ */
  function initPostReactions() {
    var reactionBars = document.querySelectorAll("[data-post-id]");
    var commentThread = document.querySelector("[data-comment-thread]");
    if (!reactionBars.length && !commentThread) return;

    var stateByPost = {};

    function storageKey(postId) {
      return "blog-post-state:" + postId;
    }

    function loadState(postId) {
      if (stateByPost[postId]) return stateByPost[postId];
      var fallback = { reactions: { like: 0, dislike: 0 }, comments: [] };
      try {
        var raw = window.localStorage.getItem(storageKey(postId));
        if (!raw) {
          stateByPost[postId] = fallback;
          return fallback;
        }
        var parsed = JSON.parse(raw);
        stateByPost[postId] = {
          reactions: {
            like: Number(parsed.reactions && parsed.reactions.like) || 0,
            dislike: Number(parsed.reactions && parsed.reactions.dislike) || 0
          },
          comments: Array.isArray(parsed.comments) ? parsed.comments : []
        };
      } catch (err) {
        stateByPost[postId] = fallback;
      }
      return stateByPost[postId];
    }

    function saveState(postId) {
      try {
        window.localStorage.setItem(storageKey(postId), JSON.stringify(stateByPost[postId]));
      } catch (err) {}
    }

    function syncReactionBars(postId) {
      var state = loadState(postId);
      document.querySelectorAll('[data-post-id="' + postId + '"]').forEach(function (bar) {
        bar.querySelectorAll("[data-reaction]").forEach(function (button) {
          var type = button.getAttribute("data-reaction");
          var countEl = button.querySelector("[data-reaction-count]");
          if (countEl) countEl.textContent = state.reactions[type] || 0;
          var active = (state.reactions[type] || 0) > 0;
          button.classList.toggle("is-active", active);
          button.setAttribute("aria-pressed", active ? "true" : "false");
        });
      });
    }

    function renderComments(thread) {
      var postId = thread.getAttribute("data-comment-thread");
      var state = loadState(postId);
      var list = thread.querySelector("[data-comment-list]");
      if (!list) return;

      if (!state.comments.length) {
        list.innerHTML = '<div class="comment-empty glass"><p style="margin:0;">No comments yet. Be the first to share your thoughts.</p></div>';
        return;
      }

      list.innerHTML = state.comments.slice().reverse().map(function (comment) {
        var initials = getInitials(comment.name);
        return [
          '<article class="comment-item glass">',
          '<div class="comment-meta">',
          '<div class="comment-author">',
          '<div class="comment-avatar" aria-hidden="true">' + escapeHtml(initials) + '</div>',
          '<div><strong>' + escapeHtml(comment.name) + '</strong></div>',
          '</div>',
          '<span>' + formatCommentTime(comment.createdAt) + '</span>',
          '</div>',
          '<p>' + escapeHtml(comment.text).replace(/\n/g, "<br />") + '</p>',
          '</article>'
        ].join("");
      }).join("");
    }

    function getInitials(name) {
      return String(name || "")
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map(function (part) { return part.charAt(0).toUpperCase(); })
        .join("") || "?";
    }

    function escapeHtml(text) {
      return String(text)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/\"/g, "&quot;")
        .replace(/'/g, "&#39;");
    }

    function formatCommentTime(value) {
      var date = new Date(value);
      if (isNaN(date.getTime())) return "Just now";
      return date.toLocaleString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit"
      });
    }

    reactionBars.forEach(function (bar) {
      var postId = bar.getAttribute("data-post-id");
      var state = loadState(postId);

      bar.querySelectorAll("[data-reaction]").forEach(function (button) {
        button.addEventListener("click", function () {
          var reactionType = button.getAttribute("data-reaction");
          state.reactions[reactionType] = (state.reactions[reactionType] || 0) + 1;
          stateByPost[postId] = state;
          saveState(postId);
          syncReactionBars(postId);
        });
      });

      syncReactionBars(postId);
    });

    if (commentThread) {
      var form = commentThread.querySelector("[data-comment-form]");
      var status = commentThread.querySelector(".comment-status");
      var postId = commentThread.getAttribute("data-comment-thread");

      renderComments(commentThread);

      if (form) {
        form.addEventListener("submit", function (e) {
          e.preventDefault();
          var nameField = form.querySelector('input[name="name"]');
          var commentField = form.querySelector('textarea[name="comment"]');
          var name = nameField ? nameField.value.trim() : "";
          var text = commentField ? commentField.value.trim() : "";

          if (!name || !text) {
            if (status) status.textContent = "Please add your name and a comment before posting.";
            return;
          }

          var state = loadState(postId);
          state.comments.push({
            name: name,
            text: text,
            createdAt: new Date().toISOString()
          });
          stateByPost[postId] = state;
          saveState(postId);

          if (nameField) nameField.value = "";
          if (commentField) commentField.value = "";
          if (status) status.textContent = "Comment posted.";

          renderComments(commentThread);
        });
      }
    }
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
     Contact form — front-end validation + backend submit (if configured).
     Set data-endpoint on #contact-form to send with fetch() to providers
     like Formspree. If no endpoint is set, it falls back to mailto.
  ------------------------------------------------------------------ */
  function initContactForm() {
    var form = document.querySelector("#contact-form");
    if (!form) return;
    var status = form.querySelector(".form-status");
    var submitBtn = form.querySelector("button[type='submit']");
    var endpoint = (form.getAttribute("data-endpoint") || "").trim();
    var recipient = form.getAttribute("data-recipient") || "vaishnav.pandeyartist2@gmail.com";
    var isSubmitting = false;

    function setStatus(message, isError) {
      if (!status) return;
      status.textContent = message;
      status.className = isError ? "form-status" : "form-status is-success";
      status.style.display = "block";
      status.style.color = isError ? "var(--accent-coral)" : "";
    }

    function setFieldError(field, hasError) {
      var row = field.closest(".form-row");
      if (!row) return;
      row.classList.toggle("has-error", hasError);
    }

    function isValidEmail(email) {
      var value = (email || "").trim();
      if (!value || value.length > 254) return false;
      return /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/.test(value);
    }

    function isGarbageMessage(message) {
      var text = (message || "").replace(/\s+/g, " ").trim();
      if (!text) return true;

      var words = text.split(" ").filter(Boolean);
      if (text.length < 15 || words.length < 3) return true;

      var links = text.match(/https?:\/\/|www\./gi);
      if (links && links.length > 2) return true;

      // Reject repeated single-character spam like "aaaaaaa" or "!!!!!!".
      if (/(.)\1{7,}/.test(text)) return true;

      var alpha = text.toLowerCase().replace(/[^a-z]/g, "");
      if (alpha.length >= 12) {
        var unique = new Set(alpha.split("")).size;
        var diversity = unique / alpha.length;
        if (diversity < 0.18) return true;
      }

      var spamPhrases = [
        "buy now", "earn money", "work from home", "click here", "free crypto",
        "win cash", "loan approved", "guaranteed returns", "cheap followers"
      ];
      var lower = text.toLowerCase();
      return spamPhrases.some(function (phrase) { return lower.indexOf(phrase) !== -1; });
    }

    function openMailClient(name, email, subject, message) {
      var finalSubject = subject && subject.trim() ? subject.trim() : "Contact from portfolio site";
      var body = [
        "Name: " + name,
        "Email: " + email,
        "",
        message
      ].join("\n");
      var mailtoUrl = "mailto:" + encodeURIComponent(recipient) + "?subject=" + encodeURIComponent(finalSubject) + "&body=" + encodeURIComponent(body);
      window.location.href = mailtoUrl;
    }

    function setSubmitting(submitting) {
      isSubmitting = submitting;
      if (!submitBtn) return;
      submitBtn.disabled = submitting;
      submitBtn.setAttribute("aria-busy", submitting ? "true" : "false");
      submitBtn.textContent = submitting ? "Sending..." : "Send message";
    }

    function resetFormState() {
      form.reset();
      form.querySelectorAll(".form-row").forEach(function (row) { row.classList.remove("has-error"); });
    }

    function sendToEndpoint(payload) {
      return fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify(payload)
      });
    }

    form.addEventListener("submit", async function (e) {
      e.preventDefault();
      if (isSubmitting) return;
      var nameField = form.querySelector("#name");
      var emailField = form.querySelector("#email");
      var subjectField = form.querySelector("#subject");
      var messageField = form.querySelector("#message");
      var websiteField = form.querySelector("#website");

      if (!nameField || !emailField || !subjectField || !messageField) return;

      var name = nameField.value.trim();
      var email = emailField.value.trim();
      var subject = subjectField.value.trim();
      var message = messageField.value.trim();
      var website = websiteField ? websiteField.value.trim() : "";

      if (website.length > 0) {
        // Honeypot filled => likely bot; silently accept and clear.
        resetFormState();
        setStatus("Thanks — your message has been received.", false);
        return;
      }

      var hasNameError = name.length === 0;
      var hasEmailError = !isValidEmail(email);
      var hasSubjectError = subject.length < 3;
      var hasMessageError = isGarbageMessage(message);

      setFieldError(nameField, hasNameError);
      setFieldError(emailField, hasEmailError);
      setFieldError(subjectField, hasSubjectError);
      setFieldError(messageField, hasMessageError);

      if (hasNameError || hasEmailError || hasSubjectError || hasMessageError) {
        if (hasMessageError) {
          setStatus("Please write a meaningful message (at least a few words, no spammy text).", true);
        } else if (hasEmailError) {
          setStatus("Please enter a valid email address before sending.", true);
        } else {
          setStatus("Please fill in every field with valid details.", true);
        }
        return;
      }

      if (!endpoint) {
        openMailClient(name, email, subject, message);
        setStatus("Opening your email app to send the message...", false);
        resetFormState();
        return;
      }

      try {
        setSubmitting(true);
        var response = await sendToEndpoint({
          name: name,
          email: email,
          subject: subject,
          message: message,
          _subject: "Portfolio contact: " + subject,
          _replyto: email
        });

        if (!response.ok) {
          throw new Error("Submit failed with status " + response.status);
        }

        setStatus("Message sent successfully. Thanks for reaching out.", false);
        resetFormState();
      } catch (err) {
        setStatus("Couldn't send directly right now. Opening your email app instead.", true);
        openMailClient(name, email, subject, message);
      } finally {
        setSubmitting(false);
      }
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

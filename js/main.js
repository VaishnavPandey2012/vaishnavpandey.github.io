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
    }, { threshold: 0, rootMargin: "0px 0px -10% 0px" });

    revealEls.forEach(function (el) {
      // Elements taller than the viewport (e.g. a blog post hero image
      // + intro block) can start already covering the whole screen on
      // load, which IntersectionObserver reports as "intersecting" —
      // but on some browsers the very first observe() callback can be
      // skipped by a paint timing race. As a safety net, also reveal
      // anything that's already on-screen at load without waiting for
      // the observer at all.
      var rect = el.getBoundingClientRect();
      if (rect.top < window.innerHeight && rect.bottom > 0) {
        el.classList.add("is-visible");
        fillSkillBars(el);
        countUpAll(el);
        return;
      }
      observer.observe(el);
    });
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
     Blog post reactions + comments.
     -----------------------------------------------------------------
     Backed by Firebase (Auth + Firestore) via window.AuthApp from
     js/auth.js. Each reaction is stored as a document keyed by the
     signed-in user's uid (posts/{postId}/reactions/{uid}), so a
     single account can only ever hold one like OR one dislike on a
     post no matter how many times it clicks, how many tabs it opens,
     or whether it clears local storage — that's enforced by Firestore
     itself (the doc ID is the uid, and the security rules only let a
     user write their own doc), not by anything client-side that can
     be reset. Signed-out visitors can read counts but must log in to
     react or comment. See SETUP_GUIDE.md for the Firestore rules.
  ------------------------------------------------------------------ */
  function initPostReactions() {
    var reactionBars = Array.prototype.filter.call(
      document.querySelectorAll("[data-post-id]"),
      function (el) { return el.getAttribute("data-post-id"); }
    );
    var commentThread = document.querySelector('[data-comment-thread]:not([data-comment-thread=""])');
    if (!reactionBars.length && !commentThread) return;

    if (!window.AuthApp) {
      console.error("AuthApp not found — make sure js/auth.js is loaded before js/main.js");
      return;
    }

    var db = window.AuthApp.db;

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
      if (!value || !value.toDate) return "Just now";
      var date = value.toDate();
      if (isNaN(date.getTime())) return "Just now";
      return date.toLocaleString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit"
      });
    }

    /* -------- Reactions -------- */
    function postReactionsRef(postId) {
      return db.collection("posts").doc(postId).collection("reactions");
    }

    function refreshCounts(postId) {
      var ref = postReactionsRef(postId);
      return ref.get().then(function (snap) {
        var counts = { like: 0, dislike: 0 };
        snap.forEach(function (doc) {
          var type = doc.data().type;
          if (type === "like" || type === "dislike") counts[type] += 1;
        });
        return counts;
      });
    }

    function syncReactionBars(postId) {
      var user = window.AuthApp.getCurrentUser();
      var userReactionPromise = user
        ? postReactionsRef(postId).doc(user.uid).get().then(function (snap) {
            return snap.exists ? snap.data().type : null;
          })
        : Promise.resolve(null);

      Promise.all([refreshCounts(postId), userReactionPromise]).then(function (results) {
        var counts = results[0];
        var userReaction = results[1];
        document.querySelectorAll('[data-post-id="' + postId + '"]').forEach(function (bar) {
          bar.querySelectorAll("[data-reaction]").forEach(function (button) {
            var type = button.getAttribute("data-reaction");
            var countEl = button.querySelector("[data-reaction-count]");
            if (countEl) countEl.textContent = counts[type] || 0;
            var active = userReaction === type;
            button.classList.toggle("is-active", active);
            button.setAttribute("aria-pressed", active ? "true" : "false");
          });
        });
      });
    }

    reactionBars.forEach(function (bar) {
      var postId = bar.getAttribute("data-post-id");

      bar.querySelectorAll("[data-reaction]").forEach(function (button) {
        button.addEventListener("click", function () {
          var user = window.AuthApp.getCurrentUser();
          if (!user) {
            window.AuthApp.requireLogin();
            return;
          }

          var reactionType = button.getAttribute("data-reaction");
          var docRef = postReactionsRef(postId).doc(user.uid);
          button.disabled = true;

          docRef.get().then(function (snap) {
            var existing = snap.exists ? snap.data().type : null;
            var write;
            if (existing === reactionType) {
              // Clicking the same reaction again removes it.
              write = docRef.delete();
            } else {
              write = docRef.set({
                type: reactionType,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
              });
            }
            return write;
          }).then(function () {
            syncReactionBars(postId);
          }).catch(function (err) {
            console.error("Reaction failed:", err);
          }).finally(function () {
            button.disabled = false;
          });
        });
      });

      window.AuthApp.onReady(function () { syncReactionBars(postId); });
      document.addEventListener("authStateChanged", function () { syncReactionBars(postId); });
    });

    /* -------- Comments -------- */
    if (commentThread) {
      var form = commentThread.querySelector("[data-comment-form]");
      var status = commentThread.querySelector(".comment-status");
      var postId = commentThread.getAttribute("data-comment-thread");
      var list = commentThread.querySelector("[data-comment-list]");
      var nameField = form ? form.querySelector('input[name="name"]') : null;

      function renderComments(comments) {
        if (!list) return;
        if (!comments.length) {
          list.innerHTML = '<div class="comment-empty glass"><p style="margin:0;">No comments yet. Be the first to share your thoughts.</p></div>';
          return;
        }
        list.innerHTML = comments.map(function (comment) {
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

      db.collection("posts").doc(postId).collection("comments")
        .orderBy("createdAt", "desc")
        .onSnapshot(function (snapshot) {
          var comments = snapshot.docs.map(function (doc) { return doc.data(); });
          renderComments(comments);
        }, function (err) {
          console.error("Comments listener failed:", err);
        });

      // Pre-fill / lock the name field to the signed-in account's name.
      function syncCommentForm() {
        var user = window.AuthApp.getCurrentUser();
        var profile = window.AuthApp.getCurrentProfile();
        if (!form) return;
        if (user) {
          if (nameField) {
            nameField.value = (profile && profile.name) || user.displayName || user.email || "";
            nameField.readOnly = true;
          }
          if (status) status.textContent = "";
        } else {
          if (nameField) nameField.readOnly = false;
          if (status) status.textContent = "Log in to leave a comment.";
        }
      }
      window.AuthApp.onReady(syncCommentForm);
      document.addEventListener("authStateChanged", syncCommentForm);

      if (form) {
        form.addEventListener("submit", function (e) {
          e.preventDefault();
          var user = window.AuthApp.getCurrentUser();
          if (!user) {
            window.AuthApp.requireLogin();
            return;
          }

          var profile = window.AuthApp.getCurrentProfile();
          var commentField = form.querySelector('textarea[name="comment"]');
          var name = (profile && profile.name) || user.displayName || user.email || "Member";
          var text = commentField ? commentField.value.trim() : "";

          if (!text) {
            if (status) status.textContent = "Write something before posting.";
            return;
          }

          var submitBtn = form.querySelector('button[type="submit"]');
          if (submitBtn) submitBtn.disabled = true;

          db.collection("posts").doc(postId).collection("comments").add({
            uid: user.uid,
            name: name,
            text: text,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
          }).then(function () {
            if (commentField) commentField.value = "";
            if (status) status.textContent = "Comment posted.";
          }).catch(function (err) {
            console.error("Comment failed:", err);
            if (status) status.textContent = "Something went wrong posting your comment.";
          }).finally(function () {
            if (submitBtn) submitBtn.disabled = false;
          });
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

  // Exposed so post.html can re-run reaction/comment binding once its
  // async Firestore fetch resolves the real post slug (see js/post.js).
  window.initPostReactions = initPostReactions;
})();

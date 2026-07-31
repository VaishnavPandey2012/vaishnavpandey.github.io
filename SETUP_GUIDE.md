# Setup guide — accounts, login, and the like system

Your site is static and hosted on GitHub Pages, which can't run its own
server or database. The standard, well-supported way to get real user
accounts (with Google/GitHub login) and a like system that can't be
gamed by clearing your browser data is **Firebase** — it's free at this
scale, needs no backend code or build step, and works fine on GitHub
Pages because everything runs from your browser talking directly to
Google's servers.

What you're getting with the code already in this repo:

- `login.html` — email/password register + login, plus "Continue with
  Google" and "Continue with GitHub" buttons
- A small user icon in the navbar of every page (top right). Signed
  out, it's a plain profile outline that links to `login.html`. Signed
  in, it becomes your initials with a dropdown (name, role, log out).
- `admin.html` — a simple table to promote/demote users between
  "user" and "admin" (the user-level system)
- The like/dislike buttons and comments on `github-universe-2026.html`
  now write to a real database instead of `localStorage`, so one
  account = one like, permanently, no matter how many times someone
  clicks, refreshes, or switches browsers.

Everything currently points at placeholder Firebase keys, so **none of
this will work until you do the steps below.**

---

## 1. Create a Firebase project

1. Go to <https://console.firebase.google.com/> and sign in with any
   Google account.
2. Click **Add project**, give it a name (e.g. `vaishnav-blog`), and
   finish the wizard (Google Analytics is optional, you can skip it).

## 2. Register a web app

1. In the project overview page, click the **</>** (web) icon to add
   a web app.
2. Give it a nickname, e.g. `blog-site`. You don't need Firebase
   Hosting — you're already using GitHub Pages.
3. Firebase will show you a config object that looks like this:

   ```js
   const firebaseConfig = {
     apiKey: "AIza...",
     authDomain: "vaishnav-blog.firebaseapp.com",
     projectId: "vaishnav-blog",
     storageBucket: "vaishnav-blog.appspot.com",
     messagingSenderId: "123456789",
     appId: "1:123456789:web:abcdef"
   };
   ```

4. Copy those values into `js/firebase-config.js` in this repo,
   replacing the placeholder `"YOUR_..."` strings. This file is safe
   to commit publicly — these values identify your project, they
   don't grant access by themselves (the security rules below do
   that).

## 3. Turn on Authentication

1. In the Firebase console, open **Build -> Authentication -> Get
   started**.
2. Under **Sign-in method**, enable:
   - **Email/Password** — just toggle it on.
   - **Google** — toggle on, pick a support email, save.
   - **GitHub** — toggle on. This one needs a GitHub OAuth app:
     1. Go to <https://github.com/settings/developers> ->
        **New OAuth App**.
     2. **Homepage URL**: your site's URL (e.g.
        `https://vaishnavpandey.dev` or
        `https://vaishnavpandey.github.io`).
     3. **Authorization callback URL**: Firebase shows you this exact
        URL on the GitHub provider screen (something like
        `https://vaishnav-blog.firebaseapp.com/__/auth/handler`) —
        copy it in from there.
     4. Create the app, copy the **Client ID** and generate a
        **Client secret**.
     5. Paste both into the Firebase GitHub provider screen and save.

3. Still in Authentication, open the **Settings** tab ->
   **Authorized domains**, and add:
   - `vaishnavpandey.github.io` (or whatever your GitHub Pages domain
     is)
   - your custom domain if you use one (e.g. `vaishnavpandey.dev`,
     matching the `CNAME` file in this repo)
   - `localhost` is already there by default, useful for testing

## 4. Turn on Firestore (the database)

1. In the console, open **Build -> Firestore Database -> Create
   database**.
2. Choose **Start in production mode** (not test mode) and pick a
   region close to your audience.
3. Once it's created, go to the **Rules** tab, delete what's there,
   and paste in the contents of `firestore.rules` from this repo.
   Click **Publish**.

   These rules are what actually enforce "one like per account" —
   it's not something the JavaScript decides, the database itself
   rejects a second write. They also make sure a user can never grant
   themselves the admin role.

## 5. Make your first admin

New accounts always start with role `"user"` — nobody can promote
themselves, that's enforced by the rules above. So the very first
admin has to be set by hand, once:

1. Register a normal account on your live `login.html` page.
2. In the Firebase console, go to **Firestore Database -> Data**,
   open the `users` collection, and find the document with your uid.
3. Edit the `role` field from `"user"` to `"admin"`, save.
4. Refresh the site — you'll now see an **Admin** link in your account
   dropdown, and `admin.html` will let you promote/demote everyone
   else from then on.

## 6. Push to GitHub and test

1. Commit and push all the changed/added files (`js/firebase-config.js`
   with your real keys included — again, this is fine to publish).
2. Visit your live GitHub Pages URL, click the user icon top-right,
   create an account or sign in with Google/GitHub.
3. Open `github-universe-2026.html`, like the post, refresh the page —
   the like should still be there. Log in from a different browser (or
   incognito) with the same account and confirm it shows as already
   liked, and that a second click *removes* the like instead of adding
   a second one.

## 7. Managing blog posts and projects as admin

Once you're an admin (step 5), your account dropdown shows an **Admin**
link → the admin hub has two more links: **Manage blog posts** and
**Manage projects**. Both work the same way:

- Add a post/project through the form — it shows up immediately on
  `blog.html` (and the homepage preview, for posts) or `projects.html`,
  no rebuild or redeploy needed, since it's read live from Firestore.
- Blog posts get their own page automatically at
  `post.html?slug=your-post-title` using the same design as the
  existing GitHub Universe post, reactions and comments included. If
  you'd rather link to a hand-built HTML page instead (like
  `github-universe-2026.html`), fill in the "External link" field and
  that's used instead.
- Cover images: there's no upload button, to avoid needing Firebase
  Storage set up too. Either push an image to `assets/blog/` or
  `assets/projects/` in your repo and reference that path, or paste
  any public image URL.
- If you make a fresh Firestore rules change (like the `blogPosts`/
  `projects` rules already included in `firestore.rules`), remember to
  re-publish them in the Rules tab — rules only take effect after
  Publish, editing the file locally does nothing on its own.

## Notes / things worth knowing: Firebase's free "Spark" plan comfortably
  covers a personal blog (50k reads/20k writes per day on Firestore,
  effectively unlimited auth users). You won't need to enter a credit
  card for this.
- **Comment moderation**: admins can delete any comment directly in
  the Firestore console (`posts/{postId}/comments/{commentId}`) if
  needed, or you can extend `admin.html` later to list comments too.
- **Custom domain vs github.io domain**: whichever one people actually
  land on needs to be in the Authentication -> Authorized domains list
  from step 3, or Google/GitHub login popups will fail with an
  "unauthorized domain" error.
- **Nothing here is secret**: the API key in `firebase-config.js`
  is meant to be public (it's how every Firebase web app on the
  internet works) — real security comes entirely from
  `firestore.rules`, so don't loosen those rules without thinking
  through what it allows.

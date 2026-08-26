# Borcelle DocAccess

A production-ready document access portal built with **Next.js (App Router)**,
**Neon Postgres**, and deployed on **Vercel**.

- Login page is the landing page (`/`) — matches the reference design.
- Sign up page at `/signup`.
- After login, the homepage (`/dashboard`) shows an **Access Document** option.
- Clicking it checks the logged-in user's permission (`can_access_documents`)
  straight from the database.
  - **Not allowed** → shows "You don't have permission to access document."
  - **Allowed** → shows the four people: Rahul Raj, Divya Kumar, Rudransh Raj,
    Devenash Raj.
- Clicking a person shows their documents, each with **View** and
  **Download** buttons, plus an **Add Document** button (asks for a document
  name and URL, and saves it to the database).

---

## 1. Tech stack

| Layer      | Choice                                   |
|------------|-------------------------------------------|
| Framework  | Next.js 14 (App Router, JS, Tailwind CSS) |
| Database   | Neon (serverless Postgres)                 |
| Auth       | Custom email/password auth, bcrypt hashing, JWT session cookie (httpOnly) |
| Hosting    | Vercel                                     |

No third-party auth provider is used — everything (signup, login, sessions,
permissions) is your own backend code talking directly to your Neon database,
as requested.

---

## 2. Project structure

```
docaccess-app/
├── app/
│   ├── page.js                  # Login page (landing page)
│   ├── signup/page.js           # Sign up page
│   ├── dashboard/page.js        # Homepage after login
│   ├── documents/page.js        # Permission check + list of people
│   ├── documents/[personId]/page.js  # A person's documents (view/download/add)
│   └── api/
│       ├── auth/login/route.js
│       ├── auth/signup/route.js
│       ├── auth/logout/route.js
│       ├── auth/me/route.js
│       ├── documents/access/route.js  # returns { allowed: true/false }
│       ├── documents/route.js         # GET list by person, POST add document
│       └── persons/route.js           # list of the 4 people
├── components/
│   ├── AuthIllustration.js      # Illustration on the auth screens
│   └── TopNav.js                # Header w/ user name + logout
├── lib/
│   ├── db.js                    # Neon connection (tagged-template SQL)
│   ├── auth.js                  # JWT sign/verify helpers
│   └── session.js               # Reads the cookie -> current user from DB
├── middleware.js                # Redirects unauthenticated users to /
├── scripts/
│   ├── schema.sql                # Table definitions + seeds the 4 people
│   └── seed.js                   # Runs schema.sql + creates 2 demo accounts
└── .env.example
```

---

## 3. Database schema

```sql
users (id, full_name, email, password_hash, can_access_documents, created_at)
persons (id, name, created_at)                -- the 4 people
documents (id, person_id, name, url, created_at)
```

`can_access_documents` is the single flag that controls whether a logged-in
user is allowed into the document section. New sign-ups start with this set
to `false`. To grant a user access, run this in the Neon SQL editor:

```sql
UPDATE users SET can_access_documents = true WHERE email = 'someone@example.com';
```

(You could later add an admin UI for this — it's intentionally left as a
direct DB update for now, since the brief didn't call for an admin role.)

---

## 4. Local setup

### 4.1 Create a Neon database
1. Go to https://console.neon.tech and create a free project.
2. Open **Connection Details** and copy the **pooled connection string**
   (it looks like `postgresql://user:pass@ep-xxxx-pooler.region.aws.neon.tech/neondb?sslmode=require`).

### 4.2 Configure environment variables
```bash
cp .env.example .env.local
```
Fill in:
```
DATABASE_URL=<your Neon pooled connection string>
JWT_SECRET=<a long random string>   # generate with: openssl rand -base64 32
```

### 4.3 Install dependencies
```bash
npm install
```

### 4.4 Create tables + seed demo data
```bash
npm run seed
```
This creates the `users`, `persons`, and `documents` tables, seeds the four
people, and creates two demo accounts so you can test both permission
states immediately:

| Email                  | Password    | Document access |
|-------------------------|-------------|------------------|
| allowed@example.com     | password123 | ✅ Yes            |
| denied@example.com      | password123 | ❌ No             |

### 4.5 Run the dev server
```bash
npm run dev
```
Visit http://localhost:3000 — you'll land on the Log in page.

---

## 5. Using the app

1. **Sign up** (`/signup`) or log in with a demo account above.
2. On the **homepage**, click **Access Document**.
3. If your account doesn't have access, you'll see the permission message.
   Otherwise, you'll see the four people.
4. Click a person to see their documents.
5. Use **View** to preview a document (renders inline if it's an image URL,
   otherwise offers an "Open in a new tab" link) or **Download** to save it
   locally.
6. Use **+ Add Document** to save a new document (name + URL) for that
   person — it's written straight to the `documents` table in Neon and
   appears in the list immediately.

---

## 6. Deploying to Vercel

1. Push this project to a GitHub repository.
2. Go to https://vercel.com/new and import the repository.
3. In **Environment Variables**, add:
   - `DATABASE_URL` — your Neon pooled connection string
   - `JWT_SECRET` — a long random string (use a different one than local dev)
4. Deploy. Vercel will run `next build` automatically.
5. After the first deploy, run the seed script once against your **production**
   database (you can run `npm run seed` locally as long as `.env.local`
   points at the same Neon database used in production — Neon databases
   aren't tied to Vercel, so the same connection string works from anywhere).
6. Visit your Vercel URL — the login page will be live.

### Notes for production
- Cookies are set with `secure: true` automatically when
  `NODE_ENV=production`, so sessions only work over HTTPS (which Vercel
  provides by default).
- Neon's serverless driver (`@neondatabase/serverless`) works natively in
  Vercel's serverless functions — no connection pooling setup needed beyond
  using the pooled connection string.

---

## 7. Security notes

- Passwords are hashed with **bcrypt** (never stored in plain text).
- Sessions use a signed **JWT** in an **httpOnly** cookie (not readable by
  JavaScript, reducing XSS risk).
- All document endpoints re-check `can_access_documents` from the database
  on every request — permission changes take effect immediately, without
  needing the user to log out and back in.
- Generic "Invalid email or password" errors are used on login so the API
  doesn't reveal whether an email is registered.

---

## 8. Customizing

- **Add more people**: insert rows into `persons` (via Neon SQL editor or a
  future admin screen).
- **Change the illustration**: edit `components/AuthIllustration.js` — it's
  plain SVG, no image assets to swap.
- **Colors/branding**: edit the `navy` / `teal` tokens in `tailwind.config.js`.

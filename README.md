# Club Z Tutor Portal

A small web app I built for tutoring work. Tutors fill in short web forms, and the
app fills in the two monthly PDF forms: a **tutor time summary** and a
**student attendance sheet**.

## Features

- **Timesheets**: enter the tutor name and month, add students one by one with
  in-person and online hours, and download a filled-in *Tutor Time Summary* PDF.
- **Attendance sheets**: enter student details, up to 12 session rows (date,
  start and end time, notes, online or in person), monthly progress notes and a
  review date, then download a filled-in *Student Attendance Sheet* PDF.
- **Drafts**: unfinished forms are saved, so you can resume them later in the
  same month.
- **History**: completed documents are listed and can be downloaded again.

## Tech stack

- **Server**: Node.js, Express 5
- **Data**: SQLite via `better-sqlite3`; sessions stored in SQLite
- **PDFs**: `pdf-lib`, drawing text onto the original PDF templates
- **Security**: `bcryptjs`, `express-session`, `helmet`, `express-rate-limit`,
  `sanitize-html`
- **Hosting**: Render

## Security design

The app handles information about students, so it is built to keep that data
private:

- **No credentials in the code or repo.** The single login account comes from
  environment variables, and only a bcrypt hash of the password is stored there.
  `npm run hash-password` creates the hash without showing or saving the password.
- **Server-side sessions.** Cookies are `httpOnly` and `sameSite=strict`, and
  `secure` in production. The server refuses to start in production without a
  strong `SESSION_SECRET`.
- **Login rate limiting.** There are 10 attempts per 15 minutes.
- **Every page and download needs a login.** The only public files are the login
  page and the logo.
- **PDFs are generated in memory** and sent straight to the logged-in user. They
  are never written to disk or to a public folder.
- **Input is validated and sanitized** before it is stored, and users can only
  load their own drafts and history.
- **Security headers** come from Helmet.

## Running it locally

Requires Node.js 20 or newer.

```bash
npm install
cp .env.example .env
```

Fill in `.env`:

1. `SESSION_SECRET`: run
   `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`.
2. `ADMIN_USERNAME`: any username.
3. `ADMIN_PASSWORD_HASH`: run `npm run hash-password` and paste the hash in
   single quotes.

Then start the server and open http://localhost:3000:

```bash
npm start
```

## Tests

```bash
npm test
```

The integration suite starts the server with a random throwaway account and a
temporary database. It covers:

- login and logout
- both document workflows and their validation
- drafts, history and re-downloads
- security headers and rate limiting
- that sensitive paths are never served

## Project structure

| Path | Purpose |
|---|---|
| `server.js` | Express app: routes, auth, validation |
| `db.js` | SQLite schema and login account setup |
| `generate-pdf.js` | Fills the tutor time summary template |
| `generate-attendance.js` | Fills the student attendance sheet template |
| `scripts/hash-password.js` | Creates the password hash for `.env` |
| `*.html` | Form and result pages |
| `*TEMPLATE*.pdf`, `Tutor Time Summary Template*.pdf` | Blank templates |
| `test.js` | Integration tests |

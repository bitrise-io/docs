# Bitrise Documentation

Welcome to the public repository for Bitrise product documentation.

## Status

[![Redirect Status](https://docs.bitrise.io/_redirects.svg)](https://docs.bitrise.io/_redirects.html)

_Additional documentation health metrics may be added here in the future (e.g., number of documents, build status, etc.)_

## About
This repository contains the source files for the official Bitrise documentation. It is intended for reference and transparency purposes only.

## Published Documentation
The latest, user-friendly documentation is available at:

👉 [docs.bitrise.io](https://docs.bitrise.io/)

## Note
This repository is not intended for open source contributions. If you have questions or feedback about Bitrise or its documentation, please use the support channels provided on our website.

## Run the docs locally

If you've never used Node.js or a docs site before, no problem — these steps walk you through everything.

### 1. Install the tools you need (one-time setup)

You need two things on your machine:

- **Node.js** — the JavaScript runtime that powers Docusaurus. Get the **LTS** version from [nodejs.org](https://nodejs.org/) (or run `brew install node` on macOS). After installing, open a fresh terminal and confirm it's there:

  ```bash
  node --version   # should print v18.x or higher
  npm --version    # should print 9.x or higher
  ```

- **Git** — to clone this repo. Check with `git --version`. macOS prompts you to install it on first run; on other systems grab it from [git-scm.com](https://git-scm.com/).

### 2. Get the code

```bash
git clone git@github.com:bitrise-io/docs.git
cd docs
```

### 3. Install the docs site's dependencies

From inside the `docs/` folder:

```bash
npm install
```

This downloads everything Docusaurus needs into a `node_modules/` folder. It's safe to ignore the deprecation warnings; the install takes a minute or two.

### 4. Start the docs locally

```bash
npm start
```

Docusaurus boots a development server, then opens [http://localhost:3000](http://localhost:3000) in your browser automatically. Every page is served at `/en/...` — for example [http://localhost:3000/en/bitrise-ci.html](http://localhost:3000/en/bitrise-ci.html).

The dev server hot-reloads: edit any `.md` / `.mdx` file under `docs/` (or any partial under `src/partials/`), save, and the browser refreshes within a second.

To stop the server, press `Ctrl+C` in the terminal.

### 5. Build the static site (optional)

When you want to verify the production build (same output that ships to docs.bitrise.io):

```bash
npm run build
```

The output lands in `build/`. To preview it locally:

```bash
npm run serve
```

### Where to edit what

| You want to... | Edit this |
|---|---|
| Change the text of a page | `docs/<section>/.../<page>.md` or `.mdx` |
| Change a piece of content reused across many pages | `src/partials/<readable-name>.mdx` |
| Change the landing page (the `/` portal) | `src/pages/index.tsx` |
| Change site-wide navbar / footer / colors | `docusaurus.config.ts`, `src/css/custom.css` |
| Add a new image | drop it under `static/img/` and reference it as `/img/your-file.png` |

### Troubleshooting

- **`npm: command not found`** — Node.js isn't installed (or your terminal hasn't picked it up). Reinstall from [nodejs.org](https://nodejs.org/) and open a new terminal window.
- **Build errors mentioning MDX** — usually a stray `<word>` or `{kebab-case}` placeholder in a Markdown file is being parsed as JSX. The error message points at the file and line; wrap the offending text in backticks (`` `<word>` ``) or escape with HTML entities (`&lt;word&gt;`).
- **Port 3000 already in use** — pass a different port: `npm start -- --port 3001`.
- **Browser shows an empty page after editing** — check the terminal for compile errors; the dev server pauses rendering until it can recompile.
# How Are You

A local-first PWA for tracking conversation topics and facts about friends — so you remember what to ask on your next call.

**Live demo:** https://phoebejaffe.github.io/how-are-you

## Privacy

This app is safe to host publicly because it has **no backend**:

- All friend data is stored in **your browser's IndexedDB** — nothing is sent to a server
- There is no analytics, tracking, or third-party data collection
- Import/export files are created and read **locally** on your device
- The only external request is **Google Fonts** (Nunito and Fraunces) loaded from Google's CDN

**Things to be aware of:**

- Data is tied to the URL origin. Data saved at `localhost` is separate from data at `phoebejaffe.github.io/how-are-you`
- Clearing browser site data will erase your entries
- Export regularly if you want a backup
- Don't commit export JSON files to a public repo — they contain personal information

## Features

- Per-friend topics with follow-ups, pinning, and archiving
- Facts pinned at the top or listed below
- Channel tracking (call, text, in person) with timestamps
- Import/export JSON with per-person conflict resolution
- Undo toasts with 10-second countdown for deletes and archives
- IndexedDB storage — data stays on your device

## Development

```bash
npm install
npm run dev        # http://127.0.0.1:3300
npm run build
npm run test
npm run icons      # regenerate PWA icons from SVG
```

## Deploy to GitHub Pages

1. Create a new **public** repo on GitHub named `how-are-you`
2. Push this project (see commands below)
3. Run `npm run deploy` — this builds and pushes `dist/` to the `gh-pages` branch
4. In the GitHub repo: **Settings → Pages → Build and deployment → Branch: `gh-pages` / `/ (root)`**
5. Visit https://phoebejaffe.github.io/how-are-you

First-time setup:

```bash
cd ~/Sites/how-are-you
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin git@github.com:phoebejaffe/how-are-you.git
git push -u origin main
npm install
npm run deploy
```

If your GitHub username isn't `phoebejaffe`, update `homepage` in `package.json` and the `base` path in `vite.config.ts` to match your repo name.

## Launcher integration

Managed by the `sites` launcher via [`project.toml`](project.toml):

```bash
sites scan
sites start how-are-you
```

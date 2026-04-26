# 🍙 Onigiri Assemble — Random Team Picker

A fun random name picker built for the **Product People** team's weekly "Onigiri Assemble" ritual. Spins through meeting participants and reveals the selected participant — complete with sound effects and confetti

![Preview](https://img.shields.io/badge/status-live-brightgreen)

## How It Works

​
Google Calendar Meeting
↓ (1 min before)
Google Workspace Studio Flow
↓ (writes accepted guests)
Google Sheet (Cell A1 = comma-separated names)
↓ (reads names)
Apps Script Web App (the picker UI)
↓ (embedded via iframe)
Netlify (clean public URL)

## Architecture

### 1. Google Workspace Studio (Automation)

A Workspace Studio flow automatically populates a Google Sheet with meeting participants before each "Onigiri Assemble" session.

**Flow configuration:**

| Step | Type | Details |
|------|------|---------|
| **Step 1 — Starter** | Based on a meeting | Meeting: `Onigiri Assemble \| Product People` · Time offset: `1 minute` · Start: `Before meeting` |
| **Step 2 — Action** | Google Sheets: Clear rows | Spreadsheet: `Onigiri Assemble Participants Automation` · Sheet: `Sheet1` · Column: `Participants` · Value: `Any` |
| **Step 3 — Action** | Google Sheets: Add a row | Spreadsheet: `Onigiri Assemble Participants Automation` · Sheet: `Sheet1` · Add row: `After last data row` · Participants: Step 1 variable → `Accepted: Guests display name` |

> This clears old participants and writes the current meeting's accepted guests into the sheet — 1 minute before every meeting.

### 2. Google Sheet

- Spreadsheet: **Onigiri Assemble Participants Automation**
- The Apps Script reads names from **Cell A1** of **Sheet1**
- Names should be comma-separated (the Workspace Studio flow handles this automatically)

### 3. Google Apps Script (`apps-script/Code.gs`)

A web app that:
- Reads participant names from the Google Sheet
- Serves a fully self-contained HTML page with the animated picker UI
- Includes sound effects (Web Audio API) and confetti animations

**Deployment:**
1. Open the Google Sheet → Extensions → Apps Script
2. Replace the default code with the contents of `apps-script/Code.gs`
3. Deploy → New deployment → Web app
4. Set "Who has access" to **Anyone** (or "Anyone within [org]" if not using iframe)
5. Copy the deployment URL

### 4. Netlify Site (`netlify/index.html`)

A minimal HTML wrapper that iframes the Apps Script web app, giving it a clean URL.

**Deployment:**
1. Update the `<iframe src="...">` in `netlify/index.html` with your Apps Script deployment URL
2. Drag the `netlify/` folder to [app.netlify.com/drop](https://app.netlify.com/drop)
3. Set custom domain to your preferred name (e.g. `onigiri-assemble.netlify.app`)

> **Note:** If you set Apps Script access to "Anyone within [org]", use a `_redirects` file instead of an iframe (third-party cookie restrictions will break iframe auth). See [Redirect Approach](#redirect-approach) below.

## Redirect Approach

If you need org-restricted access, replace `netlify/index.html` with a `netlify/_redirects` file that contains:
/ https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec 302

​
Replace the URL with your actual Apps Script deployment URL
Save the file and name it exactly _redirects — no file extension (not .txt or .html)

This redirects visitors to the Apps Script URL directly, where Google auth cookies work normally.

## Features

- 🎯 Animated spinning orb with name cycling
- 🔊 Tick sounds during spin + reveal chord (Web Audio API — no external files)
- 🎊 Confetti explosion on selection
- 💊 Pill badges showing all participants
- 📱 Responsive design (works on mobile)
- ✨ Starfield background with twinkling animation
- 🔄 Auto-scales long names to fit the orb

## Tech Stack

- Google Workspace Studio (automation)
- Google Sheets (data)
- Google Apps Script (backend + UI)
- Vanilla HTML/CSS/JS (frontend)
- Web Audio API (sound)
- Netlify (hosting/domain)

## License

MIT — use it for your own team rituals! 🍙

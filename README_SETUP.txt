GHSS NASEER KILLI — COMPLETE OFFLINE PWA SETUP

FILES
- github-pages/: upload the CONTENTS of this folder to the root of your existing GitHub Pages repository.
- apps-script/Code.gs: existing backend plus a POST API bridge.
- apps-script/Index.html: original Apps Script dashboard retained as a legacy/backup copy.
- ORIGINAL_* files: untouched source copies for rollback.

IMPORTANT
Keep the current live portal running until the new version is tested. First login and first class roster download require internet. Offline rosters are cached per device. Attendance is queued in IndexedDB and syncs when the app is open and internet returns. Browser background sync after the app is fully closed is not guaranteed. If the Apps Script session expires, queued attendance remains on the device; log in online again to sync. Do not clear browser/site data or uninstall while records are pending.

A) APPS SCRIPT BACKEND
1. Open the Google Sheet connected to the attendance system -> Extensions -> Apps Script.
2. Back up the existing Code.gs.
3. Replace Code.gs with apps-script/Code.gs.
4. Keep an HTML file named Index in Apps Script. The included apps-script/Index.html is the original dashboard source; do not delete the existing one if it contains newer changes.
5. Run setupAttendanceSystem() only if required sheets are missing, and only after making a spreadsheet backup.
6. Deploy -> Manage deployments -> Edit the existing Web App -> New version -> Deploy. Keep the current access setting required by the school.
7. The PWA bridge is configured to the Apps Script URL supplied by the user. If the deployment URL changes, update API_URL in github-pages/api-bridge.js.

B) GITHUB PAGES
1. Download a ZIP backup of repository ghssnaseerkilli-school-portal.
2. Upload the CONTENTS of github-pages/ into the repository root (not the folder itself).
3. Replace index.html, manifest.json and service-worker.js after backup. Add api-bridge.js and icons/.
4. Commit changes and wait for GitHub Pages to publish.
5. Open https://miansajjadahmadsst-bot.github.io/ghssnaseerkilli-school-portal/ while online.

C) TEST BEFORE OFFICIAL USE
1. Open the PWA online on each teacher device, log in, and load each class roster at least once.
2. Install using browser menu -> Install app / Add to Home screen.
3. Test offline using a test date/class or a controlled test record. Confirm SAVE ATTENDANCE says saved on device / pending sync.
4. Restore internet while the app remains open. Confirm pending count returns to zero.
5. Verify Attendance, Absent Students, Class Summary and Offline Sync Log sheets.
6. Test fine report/payment and Principal dashboard online after sync.

LIMITATIONS
- Offline class roster is device-specific and must be cached online first.
- Passwords are not stored. A cached authenticated session may permit offline entry, but server token expiry can require online login before sync.
- WhatsApp/SMS requires internet and a messaging app/network.
- Fine calculations/payments and Principal live dashboard remain server-backed; pending offline attendance affects fine totals after sync.
- The API bridge uses Apps Script doPost + hidden iframe response. It must be validated in the live deployment with a test attendance record before relying on it for official data. Do not shut down the existing portal until that test passes.

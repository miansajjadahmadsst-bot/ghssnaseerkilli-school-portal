GHSS Naseer Killi – School Portal PWA
======================================

Files:
- index.html
- manifest.json
- service-worker.js
- icon-192.png
- icon-512.png

Deploy with GitHub Pages:
1. Sign in to GitHub and create a new public repository, e.g. ghss-school-portal.
2. Upload all five files to the repository root (not inside another folder).
3. Open repository Settings > Pages.
4. Under Build and deployment, choose "Deploy from a branch".
5. Select branch "main" and folder "/ (root)", then Save.
6. Wait for GitHub Pages to publish. Open the HTTPS URL it provides.
7. Test the URL on Android Chrome and iPhone Safari.

Android:
- Open the HTTPS site in Chrome.
- Use the Install app prompt, or Chrome menu > Install app / Add to Home screen.

iPhone:
- Open the HTTPS site in Safari.
- Tap Share > Add to Home Screen > Add.

Important:
- This PWA is an installable launcher for the two existing Google Apps Script portals.
- The Public Portal and Management Portal buttons open your supplied Apps Script URLs.
- The launcher shell can be cached, but live portal data, login, forms and Google Sheets operations need internet.
- Since the portals are hosted on script.google.com and this PWA is hosted on a different origin, the portal pages may open in a browser tab rather than remain inside the standalone app. This package does not modify either Apps Script project.
- Keep the Apps Script deployments set to the access level required by your school. Do not make a private management portal public just to make the PWA installable.
GHSS School Portal Publishing Update
<script src="./api-bridge.js"></script>

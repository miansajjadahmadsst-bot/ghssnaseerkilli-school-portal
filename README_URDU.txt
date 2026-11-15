GHSS NASEER KILLI — OFFLINE PWA SETUP (URDU)

ZIP MEIN KYA HAI?
1. github-pages folder: ye files aap ke GitHub Pages repository ke root mein upload hongi.
2. apps-script/Code.gs: aap ke current backend ke sath PWA API bridge.
3. apps-script/Index.html: purana Apps Script dashboard backup/reference ke liye.
4. ORIGINAL files: original source ki safe copies.

STEP 1 — PEHLE BACKUP
- Apni Google Sheet ka backup banayein.
- GitHub repository ka ZIP download karke backup rakhein.
- Jab tak naya system test na ho, purana live attendance system band na karein.

STEP 2 — GOOGLE APPS SCRIPT
1. Google Sheet kholein jahan Attendance System laga hua hai.
2. Extensions > Apps Script par jayein.
3. Maujooda Code.gs ki copy backup mein rakhein.
4. ZIP ke apps-script folder wala Code.gs paste karein.
5. Apps Script mein Index naam ki HTML file ko delete na karein. Maujooda Index.html ko filhal rehne dein.
6. Deploy > Manage deployments > Edit (pencil) > New version > Deploy karein.
7. Web App ki access setting pehle jaisi rakhein.
8. Agar deployment URL badal jaye to github-pages/api-bridge.js mein API_URL ko naye /exec URL se replace karein.

STEP 3 — GITHUB PAGES
1. Apni repository kholein: ghssnaseerkilli-school-portal
2. ZIP ke andar github-pages folder kholein.
3. Is folder ke ANDAR ki tamam files (index.html, api-bridge.js, manifest.json, service-worker.js aur icons folder) repository ke root mein upload karein. github-pages folder ko as-is root mein upload na karein.
4. Existing files replace karne se pehle backup zaroor rakhein.
5. Commit changes karein aur GitHub Pages publish hone ka intezar karein.
6. Portal kholein: https://miansajjadahmadsst-bot.github.io/ghssnaseerkilli-school-portal/

STEP 4 — MOBILE / LAPTOP PAR TEST
1. Har teacher ke mobile/laptop par portal ko internet ke sath pehli dafa kholein.
2. Teacher login karein aur apni har class ko kam az kam aik martaba Load Students karein. Is se class roster us device mein cache hoga.
3. Browser menu se Install App / Add to Home Screen karein.
4. Test ke liye internet band karein, app dobara kholein, cached class load karein, attendance mark karein aur SAVE ATTENDANCE dabayein.
5. Status mein saved on device / pending sync aana chahiye.
6. Internet wapas on karein aur app ko khula rakhein. Pending sync zero hona chahiye.
7. Google Sheet mein Attendance, Absent Students, Class Summary aur Offline Sync Log check karein.
8. Is test ke baad fine report/payment aur Principal dashboard online check karein.

ZAROORI LIMITATIONS
- Pehli login aur pehli dafa class roster cache karne ke liye internet zaroori hai.
- Har device ka roster alag cache hota hai; har teacher ko apne device par classes pehle online load karni hongi.
- Password save nahi hota. Offline login ke liye pehle se authenticated device ka saved session use hota hai. Session expire ho to queued attendance safe rahegi, magar sync ke liye internet par dobara login karna hoga.
- Attendance app khuli ho aur internet wapas aaye to sync hota hai. App band hone ke baad background sync har browser mein guaranteed nahi.
- Fine report/payment aur Principal ka live dashboard server par depend karte hain; offline attendance sync hone ke baad fine totals update honge.
- WhatsApp/SMS ke liye internet aur messaging app/network chahiye.
- Apps Script POST/iframe API bridge ko live deployment par pehle chhote test record ke sath verify karna zaroori hai. Is test ke pass hone se pehle official attendance ke liye naya portal rely na karein.
- Browser data clear ya app uninstall karne se pending local attendance delete ho sakti hai. Pending sync hone tak app ka data clear na karein.

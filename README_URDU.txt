GHSS NASEER KILLI — PUBLIC + MANAGEMENT PWA

GitHub repository root mein ye files upload/replace karein:
1. index.html
2. public.html
3. management.html
4. manifest.json
5. service-worker.js

Purane icon-192.png aur icon-512.png files ko repository mein rehne dein.

GitHub Pages par HTTPS enabled hona chahiye. Upload ke baad website ek dafa internet ke sath kholen,
Public Portal aur Management Portal dono pages kholen taake cache install ho jaye.
Phir home page aur dono portal landing pages offline khul sakte hain.

IMPORTANT:
- Google Apps Script ke linked modules (Attendance, Complaint, Results, Student Record, Award List)
  ko kaam karne ke liye internet chahiye.
- Is package mein landing pages offline cached hain; student data, attendance submissions,
  complaints, results ya award-list entries ki offline storage/sync implement nahi ki gayi.
- Offline data sync ke liye har module ke asal Code.gs aur Index.html backend ko alag convert/test karna hoga.
- Kisi public cache mein student records, passwords, tokens ya private information store na karein.

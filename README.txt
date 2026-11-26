POKÉMON Z-A COMPANION — FIRST BUILD

FILES
- index.html: app interface
- app.js: navigation, gallery and progress tracking
- data.json: phase roadmap and artwork references
- sw.js: offline cache
- manifest.webmanifest: install metadata

RUN / INSTALL
A PWA service worker requires HTTPS or localhost. Upload the folder contents to any static HTTPS host (for example, a private GitHub Pages/Netlify deployment), open the URL on Android Chrome, then use browser menu > Add to Home screen / Install app.
Open once while online. The app shell is precached; Pokémon artwork is cached as each image is loaded. For reliable offline artwork, open the Pokémon gallery while online and let every image finish loading.

IMPORTANT CONTENT STATUS
This is a functional first app build using the current summarized roadmap. It deliberately flags unverified exact encounter timing, DLC roster detail, move compatibility and some late-game item sources rather than presenting guesses as verified facts. It should be treated as a working companion draft, not a fully audited game database.
Progress is saved in browser local storage on that device.

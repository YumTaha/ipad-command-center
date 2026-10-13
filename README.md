# Room · Cincinnati

A buildless weather and calendar display for a first-generation iPad Air. Open `index.html` through an HTTPS static host. JavaScript is ES5; no external fonts, CDN, `fetch`, or build step. The local ICS importer includes pinned ICAL.js 1.5.0 under the Mozilla Public License 2.0; its license is in `vendor/ICAL-LICENSE`.

Features: a midnight-to-midnight calendar with 1-day, 3-day (default), and Sunday–Saturday week views, separate all-day events, overlap layout, today highlight and current-time marker; Eastern clock with a US daylight-saving fallback; Cincinnati weather and five-day forecast; weather cache, timeouts and retries; offline and stale status; automatic 10 PM–7 AM dimming with override; device-local private agenda, Google embed, optional ICS snapshot, and explicitly selected sample preview.

The calendar starts disconnected. No calendar feed, bearer token or personal events belong in this repository. Settings are stored in localStorage on each device, not synchronized. If storage is blocked, configuration remains in memory until the page closes. Agenda data is held in memory, except explicitly imported ICS snapshots.

See [SETUP.md](SETUP.md). Real iOS 12 Safari, network authentication, Home Screen behavior and days of uptime still need testing on the iPad.

A private setup QR can provision the deployed agenda endpoint and display key on this device. The QR contains a credential: keep it private and outside this public repository. The page removes its setup fragment immediately and stores validated settings locally.

Weather data: [Open-Meteo](https://open-meteo.com/). Its free API is intended for noncommercial use; check current terms before using this dashboard commercially.



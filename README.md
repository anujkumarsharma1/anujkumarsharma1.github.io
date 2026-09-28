# anujkumarsharma1.github.io

My portfolio, built as a walkable Mini Militia (Doodle Army 2) map. **A/D** walk, **W** jetpack, **E** interact with a station, mouse to aim, click to shoot. The HUD minimap fast-travels to any station.

**Live:** https://anujkumarsharma1.github.io

- Plain HTML, CSS and JavaScript. No framework, no build step, no trackers.
- Stats and the battlefield come live from my [profile repo](https://github.com/anujkumarsharma1/anujkumarsharma1), which refreshes them daily.
- Stations: ID terminal (about), weapon locker (skills), mission board (projects), radar tower on a jetpack-only ledge (activity), radio mast (contact), and one hidden crate.
- Phones, reduced-motion settings and the **Resume mode** button get a plain vertical page built from the same panels.
- Art is drawn in code (`tools/make_art.py` reuses the profile's generator). Icons: [Simple Icons](https://simpleicons.org) (CC0) and [Lucide](https://lucide.dev) (ISC). Fonts: OFL / Apache 2.0, licences in `assets/fonts/`.

Run locally: `python3 -m http.server` and open http://localhost:8000.

Fan tribute; Mini Militia belongs to Appsomniacs and Miniclip.

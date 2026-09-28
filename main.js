(() => {
  "use strict";
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const root = document.documentElement;
  const isGame = () => root.classList.contains("game");

  const track = $("#track"), spacer = $("#spacer"), pilot = $("#pilot"), fuel = $("#fuel");
  const levels = $$(".level"), tabs = $$(".tabs a"), pars = $$(".par"), jungles = $$(".jungle");
  const arm = $("#pilot .arm"), fx = $("#fx"), toast = $("#toast");
  const N = levels.length;
  const SKY = [ // top, bottom colour per level: dusk, night, day, sunset
    ["#6e53a3", "#2f3162"], ["#4a3c85", "#232552"], ["#241f48", "#110f24"],
    ["#4f6aa3", "#a79dc4"], ["#9fbfd0", "#dfe8e4"], ["#ff8a4c", "#3a2d5e"],
  ];

  let vw = 0, vh = 0, per = 1, target = 0, cur = 0, last = 0, vel = 0;
  let aim = 18, aimTo = 18, pointer = null, dual = false, active = -1;

  function measure() {
    vw = innerWidth; vh = innerHeight; per = vh * 1.15;
    spacer.style.height = isGame() ? `${per * (N - 1) + vh}px` : "0px";
  }

  const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const mix = (a, b, t) => {
    const A = hex(a), B = hex(b);
    return `rgb(${A.map((v, i) => Math.round(v + (B[i] - v) * t)).join(",")})`;
  };
  function sky(p) {
    const i = Math.min(N - 2, Math.floor(p)), t = Math.min(1, Math.max(0, p - i));
    root.style.setProperty("--sky-top", mix(SKY[i][0], SKY[i + 1][0], t));
    root.style.setProperty("--sky-bot", mix(SKY[i][1], SKY[i + 1][1], t));
  }

  function setActive(i) {
    if (i === active) return;
    active = i;
    tabs.forEach((t, k) => t.classList.toggle("on", k === i));
    levels.forEach((l, k) => { if (Math.abs(k - i) <= 0 || k === i) l.classList.add("in"); });
  }

  function frame(now) {
    const dt = Math.min(64, now - last || 16) / 16.67;
    last = now;
    if (isGame()) {
      target = scrollY / per;
      const prev = cur;
      cur += (target - cur) * (1 - Math.pow(0.88, dt));
      if (Math.abs(target - cur) < 0.0004) cur = target;
      vel = (cur - prev) / dt;
      const x = cur * vw;
      track.style.transform = `translate3d(${-x}px,0,0)`;
      pars.forEach((p) => {
        const rate = +p.dataset.rate;
        p.style.transform = `translate3d(${-((x * rate) % 1800)}px,0,0)`;
      });
      jungles.forEach((j, k) => {
        const out = Math.min(1, cur * 1.4);
        j.style.transform = `translate3d(${(k ? 1 : -1) * out * 320}px,0,0)`;
        j.style.opacity = 1 - out;
      });
      sky(cur);
      fuel.style.transform = `scaleX(${Math.max(0.02, cur / (N - 1))})`;
      const bob = Math.sin(now / 420) * 7;
      const tilt = Math.max(-14, Math.min(14, vel * 260));
      pilot.style.transform = `translate3d(0,${bob}px,0) rotate(${tilt}deg)`;
      pilot.style.setProperty("--thrust", Math.min(1, Math.abs(vel) * 40).toFixed(2));
      setActive(Math.round(cur));
      // aim at the pointer when there is one, else at the ground ahead
      aim += (aimTo - aim) * 0.25;
      if (arm) arm.style.transform = `rotate(${aim.toFixed(2)}deg)`;
    }
    requestAnimationFrame(frame);
  }

  // ----- aiming and shooting
  function center(el) { const r = el.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; }
  function aimAt(px, py) {
    const sh = $("#shoulder"); if (!sh) return;
    const [sx, sy] = center(sh);
    const a = Math.atan2(py - sy, px - sx) * 180 / Math.PI - Math.atan2(5, 69) * 180 / Math.PI;
    aimTo = Math.max(-70, Math.min(75, a));
  }
  addEventListener("pointermove", (e) => { if (isGame() && e.pointerType === "mouse") { pointer = [e.clientX, e.clientY]; aimAt(...pointer); } }, { passive: true });

  const NS = "http://www.w3.org/2000/svg";
  function el(tag, attrs) { const n = document.createElementNS(NS, tag); for (const k in attrs) n.setAttribute(k, attrs[k]); return n; }
  function tracer(x0, y0, x1, y1, w0 = 5, w1 = 1.3) {
    const dx = x1 - x0, dy = y1 - y0, n = Math.hypot(dx, dy) || 1, nx = -dy / n, ny = dx / n;
    const id = "g" + Math.random().toString(36).slice(2, 8);
    const g = el("linearGradient", { id, gradientUnits: "userSpaceOnUse", x1: x0, y1: y0, x2: x1, y2: y1 });
    [["0", "#ff2a1a"], [".35", "#ff8a1a"], ["1", "#fff36a"]].forEach(([o, c]) => g.appendChild(el("stop", { offset: o, "stop-color": c })));
    const pts = [[x0 + nx * w0 / 2, y0 + ny * w0 / 2], [x1 + nx * w1 / 2, y1 + ny * w1 / 2],
      [x1 - nx * w1 / 2, y1 - ny * w1 / 2], [x0 - nx * w0 / 2, y0 - ny * w0 / 2]].map((p) => p.join(",")).join(" ");
    const poly = el("polygon", { points: pts, fill: `url(#${id})`, class: "tracer" });
    fx.append(g, poly);
    setTimeout(() => { g.remove(); poly.remove(); }, 220);
  }
  function hole(x, y) {
    const h = el("g", { class: "hole", transform: `translate(${x} ${y})` });
    h.append(el("circle", { r: 4.2, fill: "#0b0a10" }), el("circle", { r: 7, fill: "none", stroke: "#0b0a10", "stroke-opacity": ".35", "stroke-width": 2 }),
      el("path", { d: "M-9,-3 L-5,-1 M8,-6 L4,-2 M6,8 L3,3", stroke: "#0b0a10", "stroke-opacity": ".5", "stroke-width": 1.3 }));
    fx.append(h);
    setTimeout(() => h.remove(), 2500);
  }
  function burst(x, y, r = 22) {
    const b = el("g", { class: "burst" });
    b.append(el("circle", { cx: x, cy: y, r, fill: "#ff7a1a" }), el("circle", { cx: x, cy: y, r: r * .6, fill: "#ffd166" }), el("circle", { cx: x, cy: y, r: r * .25, fill: "#fff" }));
    fx.append(b);
    setTimeout(() => b.remove(), 500);
  }
  function shoot(x, y, target) {
    aimAt(x, y); aim = aimTo;
    if (arm) arm.style.transform = `rotate(${aim}deg)`;
    const m = $("#muzzle"); if (!m) return;
    const [mx, my] = center(m);
    tracer(mx, my, x, y);
    if (dual) tracer(mx, my + 10, x + 14, y + 10, 4, 1);
    pilot.classList.add("firing");
    setTimeout(() => pilot.classList.remove("firing"), 70);
    const drone = target && target.closest(".drone");
    if (drone && !drone.classList.contains("dead")) {
      const [dx, dy] = center(drone);
      burst(dx, dy, 30);
      drone.classList.add("dead");
      setTimeout(() => drone.classList.remove("dead"), 6000);
    } else if (!(target && target.closest("a, button, #hud"))) {
      hole(x, y); burst(x, y, 8);
    }
  }
  addEventListener("pointerdown", (e) => {
    if (!isGame() || e.button !== 0 || e.pointerType !== "mouse") return;
    shoot(e.clientX, e.clientY, e.target);
  });

  // ----- navigation
  function go(i) {
    i = Math.max(0, Math.min(N - 1, i));
    if (isGame()) scrollTo({ top: i * per, behavior: "smooth" });
    else levels[i].scrollIntoView({ behavior: "smooth" });
  }
  tabs.forEach((t) => t.addEventListener("click", (e) => { e.preventDefault(); go(+t.dataset.level); }));
  $(".skip").addEventListener("click", (e) => { e.preventDefault(); go(1); });
  addEventListener("keydown", (e) => {
    if (e.target.closest && e.target.closest("input, textarea")) return;
    const idx = isGame() ? Math.round(cur) : active < 0 ? 0 : active;
    if (e.key === "ArrowRight" || e.key === "PageDown") { e.preventDefault(); go(idx + 1); }
    if (e.key === "ArrowLeft" || e.key === "PageUp") { e.preventDefault(); go(idx - 1); }
    konami(e.key);
  });

  // ----- resume mode toggle
  const modeBtn = $("#mode");
  function syncMode() {
    const flat = !isGame();
    modeBtn.textContent = flat ? "GAME MODE" : "RESUME MODE";
    modeBtn.setAttribute("aria-pressed", String(flat));
    track.style.transform = ""; pilot.style.transform = "";
    measure();
  }
  modeBtn.addEventListener("click", () => {
    const idx = Math.max(0, active);
    root.className = isGame() ? "flat" : "game";
    try { localStorage.setItem("mode", isGame() ? "game" : "flat"); } catch (e) {}
    syncMode();
    levels.forEach((l) => l.classList.add("in"));
    if (isGame()) { scrollTo(0, idx * per); cur = target = idx; } else levels[idx].scrollIntoView();
  });

  // flat mode: reveal and highlight with an observer instead of the game loop
  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (en.isIntersecting && !isGame()) {
        en.target.classList.add("in");
        const i = levels.indexOf(en.target);
        active = i; tabs.forEach((t, k) => t.classList.toggle("on", k === i));
      }
    });
  }, { threshold: 0.35 });
  levels.forEach((l) => io.observe(l));

  // ----- easter egg: the Konami code unlocks the Pro Pack (dual wield)
  const code = ["ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown", "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight", "b", "a"];
  let pos = 0;
  function konami(k) {
    pos = k === code[pos] ? pos + 1 : k === code[0] ? 1 : 0;
    if (pos === code.length) { pos = 0; dual = true; say("PRO PACK UNLOCKED · DUAL WIELD"); }
  }
  function say(msg) { toast.textContent = msg; toast.classList.add("show"); setTimeout(() => toast.classList.remove("show"), 2600); }

  // ----- respawn countdown in comms
  let n = 3;
  setInterval(() => { n = n > 1 ? n - 1 : 3; $("#respawn").textContent = n; }, 1000);

  // ----- live stats from the profile repo (refreshed daily by its workflow)
  const RANKS = [[0, "RECRUIT"], [50, "PRIVATE"], [150, "CORPORAL"], [300, "SERGEANT"], [500, "STAFF SERGEANT"],
    [800, "LIEUTENANT"], [1200, "CAPTAIN"], [1800, "MAJOR"], [2600, "COLONEL"], [4000, "GENERAL"]];
  fetch("https://raw.githubusercontent.com/anujkumarsharma1/anujkumarsharma1/main/data/snapshot.json")
    .then((r) => r.ok ? r.json() : Promise.reject(r.status))
    .then((s) => {
      const g = s.github;
      const active = g.calendar.flat().filter((d) => d.count > 0).length;
      const set = (k, v) => { const e = $(`[data-stat="${k}"]`); if (e) e.textContent = Number(v).toLocaleString("en-IN"); };
      set("commits", g.commits_all_time); set("contrib", g.contributions_last_year);
      set("active", active); set("repos", g.repo_count);
      const xp = g.contributions_all_time;
      let i = 0; while (i + 1 < RANKS.length && xp >= RANKS[i + 1][0]) i++;
      const lo = RANKS[i][0], hi = RANKS[i + 1] ? RANKS[i + 1][0] : lo + 1;
      $("#rank-name").textContent = `${RANKS[i][1]} · ${xp} XP`;
      $("#xp").style.width = `${Math.min(100, ((xp - lo) / (hi - lo)) * 100)}%`;
      $("#synced").textContent = "SYNCED " + new Date(s.synced_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short" }).toUpperCase();
    })
    .catch(() => { $("#xp").style.width = "31%"; });

  addEventListener("resize", measure);
  measure();
  syncMode();
  setActive(0);
  if (!isGame()) levels.forEach((l) => l.classList.add("in"));
  requestAnimationFrame((t) => { last = t; requestAnimationFrame(frame); });
})();

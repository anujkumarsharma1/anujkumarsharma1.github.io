(() => {
  "use strict";
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const root = document.documentElement;
  const GAME = root.classList.contains("game");

  const toast = $("#toast");
  const say = (msg) => { toast.textContent = msg; toast.classList.add("show"); clearTimeout(say.t); say.t = setTimeout(() => toast.classList.remove("show"), 2600); };

  // ---------- panels (shared by both modes)
  const panels = Object.fromEntries($$(".station.panel").map((p) => [p.dataset.for, p]));
  let openPanel = null, dual = false;
  function open(name) {
    const p = panels[name]; if (!p) return;
    if (!GAME) { p.scrollIntoView({ behavior: "smooth" }); return; }
    if (openPanel) close();
    openPanel = p; p.classList.add("is-open"); root.classList.add("panel-open");
    if (name === "pro" && !dual) { dual = true; say("PRO PACK UNLOCKED · DUAL WIELD"); }
    setTimeout(() => $(".close", p).focus({ preventScroll: true }), 30);
  }
  function close() {
    if (!openPanel) return;
    openPanel.classList.remove("is-open"); root.classList.remove("panel-open"); openPanel = null;
  }
  $$(".close").forEach((b) => b.addEventListener("click", close));

  // ---------- live stats from the profile repo (refreshed daily there)
  const RANKS = [[0, "RECRUIT"], [50, "PRIVATE"], [150, "CORPORAL"], [300, "SERGEANT"], [500, "STAFF SERGEANT"],
    [800, "LIEUTENANT"], [1200, "CAPTAIN"], [1800, "MAJOR"], [2600, "COLONEL"], [4000, "GENERAL"]];
  fetch("https://raw.githubusercontent.com/anujkumarsharma1/anujkumarsharma1/main/data/snapshot.json")
    .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
    .then((s) => {
      const g = s.github;
      const set = (k, v) => { const e = $(`[data-stat="${k}"]`); if (e) e.textContent = Number(v).toLocaleString("en-IN"); };
      set("commits", g.commits_all_time); set("contrib", g.contributions_last_year);
      set("active", g.calendar.flat().filter((d) => d.count > 0).length); set("repos", g.repo_count);
      const xp = g.contributions_all_time;
      let i = 0; while (i + 1 < RANKS.length && xp >= RANKS[i + 1][0]) i++;
      const lo = RANKS[i][0], hi = RANKS[i + 1] ? RANKS[i + 1][0] : lo + 1;
      $("#rank-name").textContent = `${RANKS[i][1]} · ${xp} XP`;
      $("#xp").style.width = `${Math.min(100, ((xp - lo) / (hi - lo)) * 100)}%`;
      $("#synced").textContent = "SYNCED " + new Date(s.synced_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short" }).toUpperCase();
    })
    .catch(() => { $("#xp").style.width = "31%"; });

  let n = 3;
  setInterval(() => { n = n > 1 ? n - 1 : 3; $("#respawn").textContent = n; }, 1000);

  const modeBtn = $("#mode");
  modeBtn.textContent = GAME ? "RESUME MODE" : "GAME MODE";
  modeBtn.setAttribute("aria-pressed", String(!GAME));
  modeBtn.addEventListener("click", () => {
    try { localStorage.setItem("mode", GAME ? "flat" : "game"); } catch (e) {}
    location.reload();
  });

  // ---------- flat mode: the minimap just scrolls the page
  if (!GAME) {
    $$("#map button").forEach((b) => b.addEventListener("click", () => {
      const p = panels[b.dataset.go] || $("#p-hero");
      p.scrollIntoView({ behavior: "smooth" });
    }));
    return;
  }

  // =============== GAME MODE ===============
  const world = $("#world"), stage = $("#stage"), player = $("#player"), prompt = $("#prompt");
  const promptLabel = $("#prompt-label"), fuelBar = $("#fuel"), me = $("#me"), arm = $("#player .arm");
  const fx = $("#fx");
  world.appendChild(fx);
  fx.setAttribute("viewBox", "0 0 4600 820");
  const W = 4600, H = 820, GROUND = 700;
  const LABELS = { briefing: "OPEN PLAYER FILE", armory: "OPEN LOCKER", missions: "READ MISSIONS",
    battlefield: "CHECK RADAR", comms: "USE RADIO", pro: "OPEN CRATE" };

  const plats = $$(".plat").map((p) => ({ x: p.offsetLeft, y: p.offsetTop, w: p.offsetWidth }));
  const stations = $$(".prop[data-station]").map((p) => ({
    name: p.dataset.station, el: p, x: p.offsetLeft, w: p.offsetWidth,
    base: p.offsetTop + p.offsetHeight,
  }));
  const spawnX = 460;
  const travel = { spawn: [spawnX, GROUND] };
  stations.forEach((s) => { travel[s.name] = [s.x + s.w / 2, s.base]; });

  // minimap markers follow the real station positions
  $$("#map button").forEach((b) => {
    const t = travel[b.dataset.go]; if (t) b.style.setProperty("--p", `${(t[0] / W) * 100}%`);
    b.addEventListener("click", () => { teleport(b.dataset.go); b.blur(); });
  });

  const drones = $$(".drone").map((d, i) => {
    const [x0, x1, y] = d.dataset.patrol.split(",").map(Number);
    return { el: d, x0, x1, y, phase: i * 1.7, dead: 0 };
  });

  // player: x = torso centre, y = feet
  const P = { x: spawnX, y: -140, vx: 0, vy: 0, ground: false, face: 1, fuel: 1, thrust: 0 };
  const keys = new Set();
  let s = 1, camX = 0, mouse = null, lastMove = 0, started = false, near = null;

  function measure() { s = Math.max(0.55, innerHeight / H); }
  addEventListener("resize", measure); measure();

  function teleport(name) {
    const t = travel[name]; if (!t) return;
    close();
    P.x = t[0]; P.y = t[1] - 160; P.vx = 0; P.vy = 0;
    burst(P.x, t[1] - 40, 26, "#4fd13f");
    if (!started) start();
  }

  // ----- splash
  const splash = $("#splash");
  function start() {
    if (started) return;
    started = true; splash.classList.add("gone");
    say("A / D MOVE · W FLY · E INTERACT");
  }
  $("#deploy").addEventListener("click", start);
  $("#deploy").focus({ preventScroll: true });

  // ----- input
  const LEFT = ["a", "arrowleft"], RIGHT = ["d", "arrowright"], UP = ["w", "arrowup", " "];
  addEventListener("keydown", (e) => {
    const k = e.key.toLowerCase();
    konami(e.key);
    if (!started) { if (!["tab", "shift"].includes(k)) { e.preventDefault(); start(); } return; }
    if (k === "escape") { close(); return; }
    if (k === "e") { if (openPanel) close(); else if (near) open(near.name); e.preventDefault(); return; }
    if (openPanel) return;
    if ([...LEFT, ...RIGHT, ...UP, "s", "arrowdown"].includes(k)) { e.preventDefault(); keys.add(k); }
  });
  addEventListener("keyup", (e) => keys.delete(e.key.toLowerCase()));
  addEventListener("blur", () => keys.clear());
  const held = (list) => list.some((k) => keys.has(k));

  stage.addEventListener("pointermove", (e) => { mouse = [e.clientX, e.clientY]; lastMove = performance.now(); });
  stage.addEventListener("pointerdown", (e) => {
    if (e.button !== 0 || openPanel) return;
    if (!started) { start(); return; }
    const prop = e.target.closest(".prop[data-station]");
    shoot(e.clientX, e.clientY, e.target);
    if (prop) setTimeout(() => open(prop.dataset.station), 120);
  });

  // ----- effects, drawn in world coordinates
  const NS = "http://www.w3.org/2000/svg";
  const el = (tag, a) => { const n = document.createElementNS(NS, tag); for (const k in a) n.setAttribute(k, a[k]); return n; };
  const toWorld = (sx, sy) => [sx / s + camX, sy / s];
  const center = (node) => { const r = node.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; };
  function tracer(x0, y0, x1, y1, w0 = 5, w1 = 1.4) {
    const dx = x1 - x0, dy = y1 - y0, len = Math.hypot(dx, dy) || 1, nx = -dy / len, ny = dx / len;
    const id = "g" + Math.random().toString(36).slice(2, 8);
    const g = el("linearGradient", { id, gradientUnits: "userSpaceOnUse", x1: x0, y1: y0, x2: x1, y2: y1 });
    [["0", "#ff2a1a"], [".35", "#ff8a1a"], ["1", "#fff36a"]].forEach(([o, c]) => g.appendChild(el("stop", { offset: o, "stop-color": c })));
    const pts = [[x0 + nx * w0 / 2, y0 + ny * w0 / 2], [x1 + nx * w1 / 2, y1 + ny * w1 / 2], [x1 - nx * w1 / 2, y1 - ny * w1 / 2], [x0 - nx * w0 / 2, y0 - ny * w0 / 2]];
    const poly = el("polygon", { points: pts.map((p) => p.join(",")).join(" "), fill: `url(#${id})`, class: "tracer" });
    fx.append(g, poly); setTimeout(() => { g.remove(); poly.remove(); }, 220);
  }
  function burst(x, y, r = 20, core = "#ffd166") {
    const b = el("g", { class: "burst" });
    b.append(el("circle", { cx: x, cy: y, r, fill: "#ff7a1a" }), el("circle", { cx: x, cy: y, r: r * .6, fill: core }), el("circle", { cx: x, cy: y, r: r * .25, fill: "#fff" }));
    fx.append(b); setTimeout(() => b.remove(), 500);
  }
  function hole(x, y) {
    const h = el("g", { class: "hole", transform: `translate(${x} ${y})` });
    h.append(el("circle", { r: 4.2, fill: "#0b0a10" }), el("circle", { r: 7, fill: "none", stroke: "#0b0a10", "stroke-opacity": ".35", "stroke-width": 2 }));
    fx.append(h); setTimeout(() => h.remove(), 2500);
  }
  function shoot(sx, sy, target) {
    aimAt(sx, sy, true);
    const m = $("#muzzle"); if (!m) return;
    const [mx, my] = toWorld(...center(m)), [tx, ty] = toWorld(sx, sy);
    tracer(mx, my, tx, ty);
    if (dual) tracer(mx, my + 8, tx + 12, ty + 10, 4, 1);
    player.classList.add("firing"); setTimeout(() => player.classList.remove("firing"), 70);
    const d = target && target.closest(".drone");
    const hit = d && drones.find((x) => x.el === d);
    if (hit && !hit.dead) { const [dx, dy] = toWorld(...center(d)); burst(dx, dy, 34); hit.dead = performance.now(); d.classList.add("dead"); }
    else if (!(target && target.closest(".prop"))) { hole(tx, ty); burst(tx, ty, 7); }
  }
  function aimAt(sx, sy, snap) {
    const sh = $("#shoulder"); if (!sh || !arm) return;
    const [ax, ay] = center(sh);
    const dx = sx - ax, dy = sy - ay;
    if (Math.abs(dx) > 8) P.face = dx < 0 ? -1 : 1;
    let a = Math.atan2(dy, dx * P.face) * 180 / Math.PI - 4.1;
    a = Math.max(-80, Math.min(80, a));
    P.aim = snap ? a : P.aim + (a - (P.aim || 0)) * 0.3;
  }

  // ----- the loop
  let last = performance.now();
  function frame(now) {
    const dt = Math.min(0.033, (now - last) / 1000); last = now;
    if (started && !openPanel) step(dt, now);
    render(now);
    requestAnimationFrame(frame);
  }

  function step(dt, now) {
    const dir = (held(RIGHT) ? 1 : 0) - (held(LEFT) ? 1 : 0);
    const accel = P.ground ? 2600 : 1500, maxV = 330;
    if (dir) { P.vx += dir * accel * dt; if (now - lastMove > 900) P.face = dir; }
    else P.vx *= Math.pow(P.ground ? 0.0005 : 0.25, dt);
    P.vx = Math.max(-maxV, Math.min(maxV, P.vx));

    const flying = held(UP) && P.fuel > 0;
    P.thrust += ((flying ? 1 : 0) - P.thrust) * Math.min(1, dt * 12);
    P.vy += (1900 - (flying ? 3300 : 0)) * dt;
    P.vy = Math.max(-420, Math.min(900, P.vy));
    if (flying) P.fuel = Math.max(0, P.fuel - dt * 0.42);
    else if (P.ground) P.fuel = Math.min(1, P.fuel + dt * 0.8);

    const prevY = P.y;
    P.x = Math.max(50, Math.min(W - 50, P.x + P.vx * dt));
    P.y += P.vy * dt;
    P.ground = false;
    const down = held(["s", "arrowdown"]);
    if (P.vy >= 0) {
      for (const p of plats) {
        if (!down && P.x > p.x - 14 && P.x < p.x + p.w + 14 && prevY <= p.y + 2 && P.y >= p.y) {
          P.y = p.y; P.vy = 0; P.ground = true;
        }
      }
      if (P.y >= GROUND) { P.y = GROUND; P.vy = 0; P.ground = true; }
    }
    if (P.y < 60) { P.y = 60; P.vy = Math.max(0, P.vy); }

    // nearest station within reach
    near = null;
    for (const st of stations) {
      const cx = st.x + st.w / 2;
      if (Math.abs(P.x - cx) < st.w / 2 + 46 && Math.abs(P.y - st.base) < 80) near = st;
    }
    if (mouse) aimAt(mouse[0], mouse[1]); else P.aim = (P.aim || 20) + (20 - (P.aim || 20)) * 0.1;
  }

  function render(now) {
    const viewW = innerWidth / s;
    const target = Math.max(0, Math.min(W - viewW, P.x - viewW * 0.42));
    camX += (target - camX) * 0.12;
    world.style.transform = `translate3d(${(-camX * s).toFixed(2)}px,0,0) scale(${s})`;
    $$(".par").forEach((p) => { p.style.transform = `translate3d(${-((camX * s * p.dataset.rate) % 1800)}px,0,0)`; });

    const walking = P.ground && Math.abs(P.vx) > 30;
    const bob = walking ? Math.abs(Math.sin(now / 90)) * -4 : P.ground ? 0 : Math.sin(now / 300) * 3;
    const tilt = P.ground ? (walking ? Math.sin(now / 90) * 3 : 0) : Math.max(-12, Math.min(12, P.vx / 30));
    player.style.transform = `translate3d(${P.x - 66}px,${P.y - 125 + bob}px,0) scaleX(${P.face}) rotate(${tilt * P.face}deg)`;
    player.style.transformOrigin = "66px 95px";
    player.style.setProperty("--jet", (0.15 + P.thrust * 0.85).toFixed(2));
    if (arm) arm.style.transform = `rotate(${(P.aim || 20).toFixed(1)}deg)`;
    fuelBar.style.transform = `scaleX(${Math.max(0.02, P.fuel)})`;
    me.style.left = `${(P.x / W) * 100}%`;
    $$("#map button").forEach((b) => b.classList.toggle("on", near && b.dataset.go === near.name));

    stations.forEach((st) => st.el.classList.toggle("near", st === near));
    if (near && started && !openPanel) {
      promptLabel.textContent = LABELS[near.name];
      prompt.style.left = `${near.x + near.w / 2 - 70}px`;
      prompt.style.top = `${near.el.offsetTop - 46}px`;
      prompt.classList.add("show");
    } else prompt.classList.remove("show");

    for (const d of drones) {
      if (d.dead && now - d.dead > 7000) { d.dead = 0; d.el.classList.remove("dead"); }
      const t = now / 1000 + d.phase;
      const x = d.x0 + (d.x1 - d.x0) * (0.5 + 0.5 * Math.sin(t * 0.45));
      d.el.style.transform = `translate3d(${x}px,${d.y + Math.sin(t * 2.2) * 8}px,0)`;
    }
  }

  // ----- Konami code: a second way to the Pro Pack
  const code = ["ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown", "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight", "b", "a"];
  let pos = 0;
  function konami(k) {
    pos = k === code[pos] ? pos + 1 : k === code[0] ? 1 : 0;
    if (pos === code.length) { pos = 0; if (!dual) { dual = true; say("PRO PACK UNLOCKED · DUAL WIELD"); } }
  }

  requestAnimationFrame((t) => { last = t; requestAnimationFrame(frame); });
})();

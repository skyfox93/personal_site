import { profile, experience, projects, outLinks } from './site-data.js'

/* ------------------------------------------------------------------ *
 * Build the graph
 * ------------------------------------------------------------------ */
const nodes = []
const links = []
const byId = new Map()

function addNode(n) {
  const node = {
    x: 0, y: 0, vx: 0, vy: 0,
    alpha: 1, glow: 0, fixed: false,
    seed: Math.random() * 1000,
    ...n,
  }
  nodes.push(node)
  byId.set(node.id, node)
  return node
}
function addLink(a, b, len) {
  links.push({ source: byId.get(a), target: byId.get(b), len })
}
const techId = (t) => 'tech:' + t.toLowerCase().replace(/[^a-z0-9]+/g, '-')

addNode({ id: 'me', label: profile.name, type: 'self', r: 13 })
addNode({ id: 'resume', label: 'Resume', type: 'hub', group: 'resume', r: 24 })
addNode({ id: 'projects', label: 'Projects', type: 'hub', group: 'projects', r: 24 })
addLink('me', 'resume', 190)
addLink('me', 'projects', 190)

for (const l of outLinks) {
  addNode({ id: l.id, label: l.title, type: 'link', url: l.url, r: 5 })
  addLink('me', l.id, 80)
}

function addItems(list, hub) {
  for (const item of list) {
    addNode({ id: item.id, label: item.title, type: 'item', group: hub, data: item, r: 10 })
    addLink(hub, item.id, 105)
    for (const t of item.tech) {
      const id = techId(t)
      if (!byId.has(id)) addNode({ id, label: t, type: 'tech', r: 5, tech: t })
      addLink(item.id, id, 70)
    }
  }
}
addItems(experience, 'resume')
addItems(projects, 'projects')

const neighbors = new Map(nodes.map((n) => [n, new Set()]))
for (const l of links) {
  neighbors.get(l.source).add(l.target)
  neighbors.get(l.target).add(l.source)
}

// Initial layout: hubs on either side, children fanned around them, then let physics settle.
byId.get('resume').x = -190
byId.get('projects').x = 190
byId.get('me').y = -40
for (const n of nodes) {
  if (n.type === 'self' || n.type === 'hub') continue
  const anchor = n.group ? byId.get(n.group) : byId.get('me')
  const a = Math.random() * Math.PI * 2
  const d = n.type === 'tech' ? 170 : 100
  n.x = (anchor ? anchor.x : 0) + Math.cos(a) * d
  n.y = (anchor ? anchor.y : 0) + Math.sin(a) * d
}
// Entry animation: start collapsed and let the graph bloom outward.
for (const n of nodes) { n.x *= 0.15; n.y *= 0.15 }

/* ------------------------------------------------------------------ *
 * Canvas + camera
 * ------------------------------------------------------------------ */
const canvas = document.getElementById('graph')
const ctx = canvas.getContext('2d')
let W = 0, H = 0, DPR = 1
const hud = document.querySelector('.hud')
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

const cam = { x: 0, y: 0, k: 0.6 }
const camTarget = { x: 0, y: 0, k: 1 }
let follow = null        // node the camera tracks
let manualCam = false    // user has panned; stop auto-centering until next focus

function resize() {
  DPR = Math.min(window.devicePixelRatio || 1, 2)
  W = canvas.clientWidth
  H = canvas.clientHeight
  canvas.width = W * DPR
  canvas.height = H * DPR
  if (!focus) camTarget.k = baseZoom()
}
function baseZoom() { return W < 640 ? 0.72 : 1 }
function isMobile() { return W < 760 }

// Where on screen the focused node should sit, leaving room for the panel.
function viewCenter() {
  if (!panelOpen) return { x: W / 2, y: H / 2 }
  if (isMobile()) {
    const top = hud.offsetHeight
    const bottom = H - (panel.offsetHeight || H * 0.56)
    return { x: W / 2, y: top + (bottom - top) / 2 + 10 }
  }
  const pw = panel.offsetWidth || 420
  return { x: (W - pw) / 2, y: H / 2 }
}
const toScreen = (x, y) => {
  const c = viewCenter()
  return { x: (x - cam.x) * cam.k + c.x, y: (y - cam.y) * cam.k + c.y }
}
const toWorld = (sx, sy) => {
  const c = viewCenter()
  return { x: (sx - c.x) / cam.k + cam.x, y: (sy - c.y) / cam.k + cam.y }
}

/* ------------------------------------------------------------------ *
 * Focus state
 * ------------------------------------------------------------------ */
let focus = null
let focusSet = null
let hover = null
const pulses = []

function computeFocusSet(node) {
  const set = new Set([node, byId.get('me')])
  for (const n of neighbors.get(node)) {
    set.add(n)
    // For hubs, include the second hop (their tech) so the whole cluster lights up.
    if (node.type === 'hub' && n.type === 'item') for (const m of neighbors.get(n)) set.add(m)
  }
  return set
}

function setFocus(node, { openPanel = true, scrollTo = null } = {}) {
  focus = node
  focusSet = node ? computeFocusSet(node) : null
  follow = node
  manualCam = false
  camTarget.k = node ? (node.type === 'hub' ? (isMobile() ? 1.05 : 1.25) : (isMobile() ? 1.3 : 1.55)) * baseZoom() : baseZoom()
  if (node) {
    pulses.push({ node, t: performance.now() })
    // A little kick outward from the clicked node makes the graph visibly "shift".
    for (const n of nodes) {
      if (n === node) continue
      const dx = n.x - node.x, dy = n.y - node.y
      const d = Math.hypot(dx, dy) || 1
      const inSet = focusSet.has(n)
      const kick = inSet ? -2.5 : 7
      n.vx += (dx / d) * kick
      n.vy += (dy / d) * kick
    }
  }
  updateNavButtons()
  if (node && openPanel) renderPanel(node, scrollTo)
  else if (!node) closePanel()
}

/* ------------------------------------------------------------------ *
 * Physics
 * ------------------------------------------------------------------ */
function step(t) {
  const n = nodes.length
  // Repulsion
  for (let i = 0; i < n; i++) {
    const a = nodes[i]
    for (let j = i + 1; j < n; j++) {
      const b = nodes[j]
      let dx = b.x - a.x, dy = b.y - a.y
      let d2 = dx * dx + dy * dy
      if (d2 < 1) { dx = Math.random() - 0.5; dy = Math.random() - 0.5; d2 = 1 }
      const strength = 2600 * ((a.r + b.r) / 20)
      const f = Math.min(strength / d2, 6)
      const d = Math.sqrt(d2)
      const fx = (dx / d) * f, fy = (dy / d) * f
      a.vx -= fx; a.vy -= fy
      b.vx += fx; b.vy += fy
    }
  }
  // Springs
  for (const l of links) {
    const a = l.source, b = l.target
    const dx = b.x - a.x, dy = b.y - a.y
    const d = Math.hypot(dx, dy) || 1
    const f = (d - l.len) * 0.03
    const fx = (dx / d) * f, fy = (dy / d) * f
    a.vx += fx; a.vy += fy
    b.vx -= fx; b.vy -= fy
  }
  // Gravity — the focused hub is pulled to the middle and the other hub is pushed away.
  const focusedHub = focus && (focus.type === 'hub' ? focus : focus.group ? byId.get(focus.group) : null)
  for (const node of nodes) {
    let tx = 0, ty = 0, g = 0.004
    if (focusedHub) {
      if (node === focusedHub) { g = 0.04 }
      else if (node.type === 'hub') {
        const d = Math.hypot(node.x, node.y) || 1
        tx = (node.x / d) * 380; ty = (node.y / d) * 380; g = 0.02
      }
    }
    node.vx += (tx - node.x) * g
    node.vy += (ty - node.y) * g
    // Gentle idle drift so the graph is always breathing.
    if (!reduceMotion) {
      node.vx += Math.sin(t * 0.0006 + node.seed) * 0.06
      node.vy += Math.cos(t * 0.0005 + node.seed * 1.3) * 0.06
    }
  }
  // Integrate
  for (const node of nodes) {
    if (node.fixed) { node.vx = node.vy = 0; continue }
    node.vx *= 0.82; node.vy *= 0.82
    node.x += node.vx; node.y += node.vy
  }
}

/* ------------------------------------------------------------------ *
 * Render
 * ------------------------------------------------------------------ */
const COLORS = {
  bg: '#17171a',
  dot: 'rgba(255,255,255,0.045)',
  link: '160,160,175',
  node: '#9a9aa6',
  tech: '#6b6b78',
  self: '#e6e6ea',
  accent: '#a882ff',
  accent2: '#5ec8c0',
  label: '220,220,228',
}
const hubColor = (n) => (n.id === 'resume' ? COLORS.accent2 : COLORS.accent)

function nodeColor(n) {
  if (n.type === 'hub') return hubColor(n)
  if (n.type === 'self') return COLORS.self
  if (n.type === 'tech') return COLORS.tech
  if (n.type === 'item') return n.group === 'resume' ? '#8fbfbb' : '#b9a6e6'
  return COLORS.node
}

function lerp(a, b, t) { return a + (b - a) * t }

function draw(t) {
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0)
  ctx.fillStyle = COLORS.bg
  ctx.fillRect(0, 0, W, H)

  // Dot grid that moves with the camera (parallax 1:1) — Obsidian canvas vibe.
  const grid = 28 * cam.k
  if (grid > 8) {
    const c = viewCenter()
    const ox = ((-cam.x * cam.k + c.x) % grid + grid) % grid
    const oy = ((-cam.y * cam.k + c.y) % grid + grid) % grid
    ctx.fillStyle = COLORS.dot
    for (let x = ox; x < W; x += grid) for (let y = oy; y < H; y += grid) ctx.fillRect(x, y, 1.5, 1.5)
  }

  const hoverSet = hover ? new Set([hover, ...neighbors.get(hover)]) : null

  // Alpha/glow easing
  for (const n of nodes) {
    const target = focusSet ? (focusSet.has(n) ? 1 : 0.12) : 1
    n.alpha = lerp(n.alpha, hoverSet && !hoverSet.has(n) ? Math.min(target, 0.35) : target, 0.12)
    const g = n === focus || n === hover ? 1 : 0
    n.glow = lerp(n.glow, g, 0.15)
  }

  // Links
  ctx.lineCap = 'round'
  for (const l of links) {
    const a = toScreen(l.source.x, l.source.y)
    const b = toScreen(l.target.x, l.target.y)
    const alpha = Math.min(l.source.alpha, l.target.alpha)
    const hot = (hoverSet && hoverSet.has(l.source) && hoverSet.has(l.target) && (l.source === hover || l.target === hover)) ||
      (focus && (l.source === focus || l.target === focus))
    ctx.strokeStyle = hot ? `rgba(168,130,255,${0.75 * alpha})` : `rgba(${COLORS.link},${0.28 * alpha})`
    ctx.lineWidth = hot ? 1.6 : 1
    ctx.beginPath()
    ctx.moveTo(a.x, a.y)
    ctx.lineTo(b.x, b.y)
    ctx.stroke()
  }

  // Focus pulses
  for (let i = pulses.length - 1; i >= 0; i--) {
    const p = pulses[i]
    const age = (t - p.t) / 900
    if (age > 1) { pulses.splice(i, 1); continue }
    const s = toScreen(p.node.x, p.node.y)
    ctx.strokeStyle = `rgba(168,130,255,${(1 - age) * 0.7})`
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc(s.x, s.y, (p.node.r + age * 70) * cam.k, 0, Math.PI * 2)
    ctx.stroke()
  }

  // Nodes
  for (const n of nodes) {
    const s = toScreen(n.x, n.y)
    const r = n.r * cam.k * (1 + n.glow * 0.15)
    const color = nodeColor(n)
    ctx.globalAlpha = n.alpha
    if (n.type === 'hub' || n.glow > 0.02) {
      const gr = ctx.createRadialGradient(s.x, s.y, r * 0.5, s.x, s.y, r * (n.type === 'hub' ? 2.6 : 2.2))
      gr.addColorStop(0, hexA(color, 0.35 + n.glow * 0.25))
      gr.addColorStop(1, hexA(color, 0))
      ctx.fillStyle = gr
      ctx.beginPath()
      ctx.arc(s.x, s.y, r * 2.6, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.fillStyle = color
    ctx.beginPath()
    ctx.arc(s.x, s.y, r, 0, Math.PI * 2)
    ctx.fill()
    if (n.type === 'link') {
      ctx.strokeStyle = hexA(color, 0.9)
      ctx.lineWidth = 1.2
      ctx.beginPath()
      ctx.arc(s.x, s.y, r + 3 * cam.k, 0, Math.PI * 2)
      ctx.stroke()
    }
    if (n.type === 'self' && headshot.complete && headshot.naturalWidth) {
      ctx.save()
      ctx.beginPath()
      ctx.arc(s.x, s.y, r - 1.5, 0, Math.PI * 2)
      ctx.clip()
      ctx.drawImage(headshot, s.x - r, s.y - r, r * 2, r * 2)
      ctx.restore()
    }
  }
  ctx.globalAlpha = 1

  // Labels
  ctx.textAlign = 'center'
  ctx.textBaseline = 'top'
  for (const n of nodes) {
    const always = n.type === 'hub' || n.type === 'self' || n.type === 'item' || n.type === 'link'
    const show = always || cam.k > 1.15 || (focusSet && focusSet.has(n)) || (hoverSet && hoverSet.has(n))
    if (!show) continue
    const s = toScreen(n.x, n.y)
    const r = n.r * cam.k
    const size = n.type === 'hub' ? 16 : n.type === 'self' ? 13 : n.type === 'tech' ? 11 : 12.5
    ctx.font = `${n.type === 'hub' ? 600 : 500} ${size}px Inter, system-ui, sans-serif`
    const la = n.alpha * (n.type === 'tech' && !(focusSet && focusSet.has(n)) && n !== hover ? 0.7 : 1)
    ctx.fillStyle = n.type === 'hub' ? hexA(hubColor(n), la) : `rgba(${COLORS.label},${la * 0.9})`
    ctx.fillText(n.label, s.x, s.y + r + (n.type === 'hub' ? 10 : 6))
  }
}

function hexA(hex, a) {
  const v = parseInt(hex.slice(1), 16)
  return `rgba(${(v >> 16) & 255},${(v >> 8) & 255},${v & 255},${a})`
}

const headshot = new Image()
headshot.src = profile.headshot

/* ------------------------------------------------------------------ *
 * Loop
 * ------------------------------------------------------------------ */
function frame(t) {
  step(t)
  if (follow && !manualCam) { camTarget.x = follow.x; camTarget.y = follow.y }
  else if (!manualCam && !focus) { camTarget.x = 0; camTarget.y = 0 }
  const e = reduceMotion ? 0.3 : 0.075
  cam.x = lerp(cam.x, camTarget.x, e)
  cam.y = lerp(cam.y, camTarget.y, e)
  cam.k = lerp(cam.k, camTarget.k, e)
  draw(t)
  requestAnimationFrame(frame)
}

/* ------------------------------------------------------------------ *
 * Input
 * ------------------------------------------------------------------ */
function pick(sx, sy) {
  const w = toWorld(sx, sy)
  let best = null, bestD = Infinity
  for (const n of nodes) {
    if (n.alpha < 0.3) continue
    const d = Math.hypot(n.x - w.x, n.y - w.y)
    const hit = n.r + 10 / cam.k
    if (d < hit && d < bestD) { best = n; bestD = d }
  }
  return best
}

let drag = null
canvas.addEventListener('pointerdown', (e) => {
  canvas.setPointerCapture(e.pointerId)
  const node = pick(e.offsetX, e.offsetY)
  drag = { node, sx: e.offsetX, sy: e.offsetY, lx: e.offsetX, ly: e.offsetY, moved: false }
  if (node) node.fixed = true
})
canvas.addEventListener('pointermove', (e) => {
  if (!drag) {
    const n = pick(e.offsetX, e.offsetY)
    if (n !== hover) { hover = n; canvas.style.cursor = n ? 'pointer' : 'grab' }
    return
  }
  if (Math.hypot(e.offsetX - drag.sx, e.offsetY - drag.sy) > 5) drag.moved = true
  if (drag.node) {
    const w = toWorld(e.offsetX, e.offsetY)
    drag.node.x = w.x; drag.node.y = w.y
  } else if (drag.moved) {
    manualCam = true
    camTarget.x -= (e.offsetX - drag.lx) / cam.k
    camTarget.y -= (e.offsetY - drag.ly) / cam.k
    cam.x = camTarget.x; cam.y = camTarget.y
    canvas.style.cursor = 'grabbing'
  }
  drag.lx = e.offsetX; drag.ly = e.offsetY
})
canvas.addEventListener('pointerup', (e) => {
  if (!drag) return
  const { node, moved } = drag
  if (node) node.fixed = false
  drag = null
  canvas.style.cursor = hover ? 'pointer' : 'grab'
  if (moved) return
  if (!node) { if (focus) setFocus(null); return }
  onNodeClick(node)
})
canvas.addEventListener('pointerleave', () => { if (!drag) hover = null })
canvas.addEventListener('wheel', (e) => {
  e.preventDefault()
  camTarget.k = Math.max(0.35, Math.min(3, camTarget.k * Math.exp(-e.deltaY * 0.0015)))
}, { passive: false })

function onNodeClick(node) {
  if (node.type === 'link') { window.open(node.url, '_blank', 'noopener'); return }
  if (node.type === 'self') { setFocus(null); return }
  if (node.type === 'item') {
    // Shift to the item's hub first, then highlight its card in the panel.
    setFocus(node, { scrollTo: node.id })
    return
  }
  setFocus(node)
}

window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') { closeVideo(); setFocus(null) }
})
window.addEventListener('resize', resize)

/* ------------------------------------------------------------------ *
 * Side panel
 * ------------------------------------------------------------------ */
const panel = document.getElementById('panel')
const panelBody = document.getElementById('panel-body')
let panelOpen = false

document.getElementById('panel-close').addEventListener('click', () => setFocus(null))

function closePanel() {
  panelOpen = false
  panel.classList.remove('open')
  panel.setAttribute('aria-hidden', 'true')
}

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))
const chips = (tech) => tech.map((t) => `<button class="chip" data-focus="${techId(t)}">${esc(t)}</button>`).join('')

function experienceCard(x) {
  return `
  <article class="card" id="card-${x.id}">
    <div class="card-media" style="background-image:url('${x.image}')"></div>
    <div class="card-body">
      <div class="card-head">
        <h3>${esc(x.title)}${x.subtitle ? ` <span class="muted">(${esc(x.subtitle)})</span>` : ''}</h3>
        <span class="muted small">${esc(x.dates)}</span>
      </div>
      <p>${esc(x.description)}</p>
      <div class="chips">${chips(x.tech)}</div>
    </div>
  </article>`
}

function projectCard(p) {
  return `
  <article class="card" id="card-${p.id}">
    <div class="card-media ${p.vimeoId ? 'has-video' : ''}" style="background-image:url('${p.image}')" ${p.vimeoId ? `data-vimeo="${p.vimeoId}"` : ''}>
      ${p.vimeoId ? '<span class="preview-hint">▶ Preview</span>' : ''}
    </div>
    <div class="card-body">
      <div class="card-head"><h3>${esc(p.title)}</h3></div>
      <p>${esc(p.description)}</p>
      <div class="chips">${chips(p.tech)}</div>
      <div class="actions">
        ${p.url ? `<a class="btn primary" href="${p.url}" target="_blank" rel="noopener">Open demo</a>` : ''}
        ${p.vimeoId ? `<button class="btn" data-video="${p.vimeoId}">Watch video</button>` : ''}
        ${p.code ? `<a class="btn" href="${p.code}" target="_blank" rel="noopener">Code</a>` : ''}
      </div>
    </div>
  </article>`
}

function renderPanel(node, scrollTo) {
  let html = ''
  const hubId = node.type === 'hub' ? node.id : node.group
  if (hubId === 'resume') {
    const allTech = [...new Set(experience.flatMap((x) => x.tech))]
    html = `
      <p class="eyebrow resume">Resume</p>
      <h2>Professional work</h2>
      <a class="btn primary wide" href="${profile.resumePdf}" target="_blank" rel="noopener">Download résumé (PDF)</a>
      ${experience.map(experienceCard).join('')}
      <h4 class="section-label">Skills</h4>
      <div class="chips">${chips(allTech)}</div>`
  } else if (hubId === 'projects') {
    html = `
      <p class="eyebrow">Projects</p>
      <h2>Fun projects</h2>
      <p class="muted">${matchMedia('(hover: none)').matches ? 'Tap' : 'Hover'} a thumbnail for a video preview.</p>
      ${projects.map(projectCard).join('')}`
  } else if (node.type === 'tech') {
    const used = [...neighbors.get(node)].filter((n) => n.type === 'item')
    html = `
      <p class="eyebrow">Skill</p>
      <h2>${esc(node.label)}</h2>
      <p class="muted">Used in ${used.length} ${used.length === 1 ? 'place' : 'places'}:</p>
      <ul class="used-in">
        ${used.map((u) => `<li><button data-focus="${u.id}"><span class="dot ${u.group}"></span>${esc(u.label)}<span class="muted small">${u.group === 'resume' ? 'Work' : 'Project'}</span></button></li>`).join('')}
      </ul>`
  }
  panelBody.innerHTML = html
  panelOpen = true
  panel.classList.add('open')
  panel.setAttribute('aria-hidden', 'false')
  panelBody.scrollTop = 0
  if (scrollTo) {
    const card = document.getElementById('card-' + scrollTo)
    if (card) {
      requestAnimationFrame(() => card.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' }))
      card.classList.add('flash')
      setTimeout(() => card.classList.remove('flash'), 1400)
    }
  }
}

// Panel interactions: chips refocus the graph, thumbnails preview video.
panelBody.addEventListener('click', (e) => {
  const f = e.target.closest('[data-focus]')
  if (f) { const n = byId.get(f.dataset.focus); if (n) onNodeClick(n); return }
  const v = e.target.closest('[data-video]')
  if (v) { openVideo(v.dataset.video); return }
  const m = e.target.closest('.card-media.has-video')
  if (m && matchMedia('(hover: none)').matches) togglePreview(m)
})
panelBody.addEventListener('pointerover', (e) => {
  const m = e.target.closest('.card-media.has-video')
  if (m && e.pointerType === 'mouse') startPreview(m)
})
panelBody.addEventListener('pointerout', (e) => {
  const m = e.target.closest('.card-media.has-video')
  if (m && e.pointerType === 'mouse' && !m.contains(e.relatedTarget)) stopPreview(m)
})

function startPreview(m) {
  if (m.querySelector('iframe')) return
  const f = document.createElement('iframe')
  f.src = `https://player.vimeo.com/video/${m.dataset.vimeo}?background=1&muted=1&autoplay=1&loop=1`
  f.allow = 'autoplay; fullscreen'
  f.title = 'Video preview'
  m.appendChild(f)
  m.classList.add('previewing')
}
function stopPreview(m) {
  m.querySelector('iframe')?.remove()
  m.classList.remove('previewing')
}
function togglePreview(m) { m.querySelector('iframe') ? stopPreview(m) : startPreview(m) }

/* Video modal */
const modal = document.getElementById('video-modal')
function openVideo(id) {
  modal.querySelector('.frame').innerHTML =
    `<iframe src="https://player.vimeo.com/video/${id}?autoplay=1&byline=0&portrait=0" allow="autoplay; fullscreen" allowfullscreen title="Project video"></iframe>`
  modal.classList.add('open')
}
function closeVideo() {
  modal.classList.remove('open')
  modal.querySelector('.frame').innerHTML = ''
}
modal.addEventListener('click', (e) => { if (e.target === modal || e.target.closest('.close')) closeVideo() })

/* Top nav buttons mirror the two hub nodes */
const navButtons = document.querySelectorAll('[data-hub]')
navButtons.forEach((b) => b.addEventListener('click', () => {
  const n = byId.get(b.dataset.hub)
  focus === n ? setFocus(null) : setFocus(n)
}))
function updateNavButtons() {
  const hubId = focus ? (focus.type === 'hub' ? focus.id : focus.group) : null
  navButtons.forEach((b) => b.classList.toggle('active', b.dataset.hub === hubId))
}

/* ------------------------------------------------------------------ */
resize()
canvas.style.cursor = 'grab'
requestAnimationFrame(frame)

// Deep links: /#resume or /#projects open focused.
const initial = location.hash.slice(1)
if (byId.get(initial)?.type === 'hub') setTimeout(() => setFocus(byId.get(initial)), 600)

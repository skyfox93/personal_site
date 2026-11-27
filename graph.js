import { profile, experience, projects, outLinks } from './site-data.js'

/* ------------------------------------------------------------------ *
 * Build the graph
 * ------------------------------------------------------------------ */
const nodes = []
const links = []
const byId = new Map()

const CARD_W = 240        // CSS px, before scaling
const CARD_SCALE = 0.75   // card size in world units relative to its CSS size

function addNode(n) {
  const node = {
    x: 0, y: 0, vx: 0, vy: 0,
    alpha: 1, glow: 0, ex: 0, fixed: false,
    seed: Math.random() * 1000,
    ...n,
  }
  node.hw = node.hh = node.r
  nodes.push(node)
  byId.set(node.id, node)
  return node
}
function addLink(a, b, len) {
  links.push({ source: byId.get(a), target: byId.get(b), len })
}
const lerp = (a, b, t) => a + (b - a) * t
const techId = (t) => 'tech:' + t.toLowerCase().replace(/[^a-z0-9]+/g, '-')

addNode({ id: 'me', label: profile.name, type: 'self', r: 34 })
addNode({ id: 'resume', label: 'Resume', type: 'hub', group: 'resume', r: 22 })
addNode({ id: 'projects', label: 'Projects', type: 'hub', group: 'projects', r: 22 })
addLink('me', 'resume', 250)
addLink('me', 'projects', 250)

for (const l of outLinks) {
  addNode({ id: l.id, label: l.title, type: 'link', url: l.url, r: 5 })
  addLink('me', l.id, 95)
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

// Initial layout: Skylar in the middle, hubs on either side, children fanned around them.
byId.get('resume').x = -250
byId.get('projects').x = 250
for (const n of nodes) {
  if (n.type === 'self' || n.type === 'hub') continue
  const anchor = n.group ? byId.get(n.group) : byId.get('me')
  const a = Math.random() * Math.PI * 2
  const d = n.type === 'tech' ? 170 : 100
  n.x = anchor.x + Math.cos(a) * d
  n.y = anchor.y + Math.sin(a) * d
}
// Entry animation: start collapsed and let the graph bloom outward.
for (const n of nodes) { n.x *= 0.15; n.y *= 0.15 }

/* ------------------------------------------------------------------ *
 * Canvas, overlay + camera
 * ------------------------------------------------------------------ */
const canvas = document.getElementById('graph')
const ctx = canvas.getContext('2d')
const layer = document.getElementById('cards')
const hud = document.querySelector('.hud')
let W = 0, H = 0, DPR = 1
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
const touchOnly = window.matchMedia('(hover: none)').matches

const cam = { x: 0, y: 0, k: 0.5 }
const camTarget = { x: 0, y: 0, k: 1 }
const vc = { x: 0, y: 0 }          // screen point the camera centres on (eased)
let manualCam = false              // user panned/zoomed: stop auto-fitting until next focus

function resize() {
  DPR = Math.min(window.devicePixelRatio || 1, 2)
  W = canvas.clientWidth
  H = canvas.clientHeight
  canvas.width = W * DPR
  canvas.height = H * DPR
  measureCards()
  if (!vc.x) { vc.x = W / 2; vc.y = H / 2 }
}
const isMobile = () => W < 760

const toScreen = (x, y) => ({ x: (x - cam.x) * cam.k + vc.x, y: (y - cam.y) * cam.k + vc.y })
const toWorld = (sx, sy) => ({ x: (sx - vc.x) / cam.k + cam.x, y: (sy - vc.y) / cam.k + cam.y })

/* ------------------------------------------------------------------ *
 * Focus state
 * ------------------------------------------------------------------ */
let focus = null
let focusSet = null
let hover = null
const pulses = []
let lastMePulse = 0

function computeFocusSet(node) {
  const set = new Set([node, byId.get('me')])
  for (const n of neighbors.get(node)) {
    set.add(n)
    // Hubs light up their whole cluster, including the second hop (skills).
    if (node.type === 'hub' && n.type === 'item') for (const m of neighbors.get(n)) set.add(m)
  }
  return set
}

function focusedHub() {
  if (!focus) return null
  if (focus.type === 'hub') return focus
  if (focus.type === 'item') return byId.get(focus.group)
  return null
}

function setFocus(node) {
  focus = node
  focusSet = node ? computeFocusSet(node) : null
  manualCam = false
  if (node) {
    pulses.push({ node, t: performance.now(), color: '168,130,255' })
    // A kick outward from the clicked node makes the graph visibly shift.
    for (const n of nodes) {
      if (n === node) continue
      const dx = n.x - node.x, dy = n.y - node.y
      const d = Math.hypot(dx, dy) || 1
      const kick = focusSet.has(n) ? -2 : 7
      n.vx += (dx / d) * kick
      n.vy += (dy / d) * kick
    }
  }
  for (const n of nodes) if (n.card) n.card.querySelectorAll('.gcard-media.previewing').forEach(stopPreview)
  updateNavButtons()
}

// An item shows as a card when it's part of the current focus.
const wantsCard = (n) => n.type === 'item' && !!focusSet && focusSet.has(n)

/* ------------------------------------------------------------------ *
 * Physics
 * ------------------------------------------------------------------ */
function step(t) {
  const count = nodes.length

  // Collision boxes: cards ease open; other nodes reserve room for their label.
  const k = cam.k
  const pillHub = focusedHub()
  for (const n of nodes) {
    const lw = (n.labelW || 0) / 2 / k + 6
    const lh = n.r + (n.labelH || 20) / k
    if (n.type === 'item') {
      n.ex += ((wantsCard(n) ? 1 : 0) - n.ex) * 0.12
      n.hw = lerp(Math.max(n.r, lw), n.cardHW, n.ex)
      n.hh = lerp(lh, n.cardHH, n.ex)
    } else {
      n.hw = Math.max(n.r, lw)
      n.hh = lh
      if (n.type === 'self') { n.hw = Math.max(n.hw, n.r + 22); n.hh += 8 }
      if (n.id === 'resume' && pillHub === n) { n.hw = Math.max(n.hw, 95 / k); n.hh = n.r + 78 / k }
    }
  }

  // Repulsion
  for (let i = 0; i < count; i++) {
    const a = nodes[i]
    for (let j = i + 1; j < count; j++) {
      const b = nodes[j]
      let dx = b.x - a.x, dy = b.y - a.y
      let d2 = dx * dx + dy * dy
      if (d2 < 1) { dx = Math.random() - 0.5; dy = Math.random() - 0.5; d2 = 1 }
      const ra = a.type === 'self' ? 40 : Math.min(a.r, 24), rb = b.type === 'self' ? 40 : Math.min(b.r, 24)
      const strength = 2600 * ((ra + rb) / 20)
      const f = Math.min(strength / d2, 6)
      const d = Math.sqrt(d2)
      const fx = (dx / d) * f, fy = (dy / d) * f
      a.vx -= fx; a.vy -= fy
      b.vx += fx; b.vy += fy
    }
  }
  // Springs — links to an open card stretch so the card has room.
  for (const l of links) {
    const a = l.source, b = l.target
    const dx = b.x - a.x, dy = b.y - a.y
    const d = Math.hypot(dx, dy) || 1
    const len = l.len + (a.ex + b.ex) * 95
    const f = (d - len) * 0.03
    const fx = (dx / d) * f, fy = (dy / d) * f
    a.vx += fx; a.vy += fy
    b.vx -= fx; b.vy -= fy
  }
  // Gravity — the focused hub is pulled to the middle and the other hub is pushed away.
  const hub = focusedHub()
  for (const node of nodes) {
    let tx = 0, ty = 0, g = 0.004
    if (hub) {
      if (node === hub) g = 0.04
      else if (node.type === 'hub') {
        const d = Math.hypot(node.x, node.y) || 1
        tx = (node.x / d) * 520; ty = (node.y / d) * 520; g = 0.02
      }
    } else if (!focus && node.type === 'self') g = 0.03
    node.vx += (tx - node.x) * g
    node.vy += (ty - node.y) * g
    if (!reduceMotion) {
      const amp = node.ex > 0.5 ? 0.02 : 0.06
      node.vx += Math.sin(t * 0.0006 + node.seed) * amp
      node.vy += Math.cos(t * 0.0005 + node.seed * 1.3) * amp
    }
  }
  // Integrate
  for (const node of nodes) {
    if (node.fixed) { node.vx = node.vy = 0; continue }
    node.vx *= 0.82; node.vy *= 0.82
    node.x += node.vx; node.y += node.vy
  }
  // Box collision so open cards never overlap anything (two relaxation passes).
  for (let pass = 0; pass < 2; pass++)
  for (let i = 0; i < count; i++) {
    const a = nodes[i]
    for (let j = i + 1; j < count; j++) {
      const b = nodes[j]
      if (a.ex < 0.05 && b.ex < 0.05 && a.type !== 'self' && b.type !== 'self') continue
      const dx = b.x - a.x, dy = b.y - a.y
      const ox = a.hw + b.hw + 12 - Math.abs(dx)
      const oy = a.hh + b.hh + 12 - Math.abs(dy)
      if (ox <= 0 || oy <= 0) continue
      const wa = a.fixed ? 0 : b.fixed ? 1 : 0.5
      const wb = 1 - wa
      if (ox < oy) {
        const s = Math.sign(dx) || 1
        if (!a.fixed) a.x -= s * ox * wa * 0.5
        if (!b.fixed) b.x += s * ox * wb * 0.5
        const v = (a.vx + b.vx) / 2; a.vx = b.vx = v
      } else {
        const s = Math.sign(dy) || 1
        if (!a.fixed) a.y -= s * oy * wa * 0.5
        if (!b.fixed) b.y += s * oy * wb * 0.5
        const v = (a.vy + b.vy) / 2; a.vy = b.vy = v
      }
    }
  }
}

/* ------------------------------------------------------------------ *
 * Camera: keep whatever is in focus framed on screen
 * ------------------------------------------------------------------ */
function updateCamera() {
  const top = hud.offsetHeight
  const pad = isMobile() ? 16 : 48
  const availW = W - pad * 2
  const availH = H - top - pad
  // Screen centre of the free area below the header.
  const cx = W / 2, cy = focus || isMobile() ? top + availH / 2 : H / 2
  const e = reduceMotion ? 0.3 : 0.075
  vc.x += (cx - vc.x) * e
  vc.y += (cy - vc.y) * e

  if (!manualCam) {
    let fit
    if (!focus) fit = nodes
    else if (focus.type === 'hub') fit = [focus, ...nodes.filter((n) => n.group === focus.id)]
    else if (focus.type === 'item') fit = [focus]
    else fit = [...focusSet].filter((n) => n.type !== 'self')
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity
    for (const n of fit) {
      const lab = n.ex > 0.5 ? 0 : 26
      x0 = Math.min(x0, n.x - n.hw); x1 = Math.max(x1, n.x + n.hw)
      y0 = Math.min(y0, n.y - n.hh); y1 = Math.max(y1, n.y + n.hh + lab)
    }
    const maxK = focus?.type === 'item' ? 1.7 : focus ? 1.35 : 1.15
    const k = Math.min(availW / (x1 - x0 + 40), availH / (y1 - y0 + 40))
    camTarget.k = Math.max(0.4, Math.min(maxK, k))
    camTarget.x = (x0 + x1) / 2
    camTarget.y = (y0 + y1) / 2
  }
  cam.x += (camTarget.x - cam.x) * e
  cam.y += (camTarget.y - cam.y) * e
  cam.k += (camTarget.k - cam.k) * e
}

/* ------------------------------------------------------------------ *
 * Render
 * ------------------------------------------------------------------ */
const COLORS = {
  bg: '#17171a',
  dot: 'rgba(255,255,255,0.045)',
  link: '160,160,175',
  tech: '#6b6b78',
  link_node: '#9a9aa6',
  self: '#f3eee4',
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
  return COLORS.link_node
}
function hexA(hex, a) {
  const v = parseInt(hex.slice(1), 16)
  return `rgba(${(v >> 16) & 255},${(v >> 8) & 255},${v & 255},${a})`
}
const headshot = new Image()
headshot.src = profile.headshot

function draw(t) {
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0)
  ctx.fillStyle = COLORS.bg
  ctx.fillRect(0, 0, W, H)

  // Dot grid that moves with the camera.
  const grid = 28 * cam.k
  if (grid > 8) {
    const ox = ((-cam.x * cam.k + vc.x) % grid + grid) % grid
    const oy = ((-cam.y * cam.k + vc.y) % grid + grid) % grid
    ctx.fillStyle = COLORS.dot
    for (let x = ox; x < W; x += grid) for (let y = oy; y < H; y += grid) ctx.fillRect(x, y, 1.5, 1.5)
  }

  const hoverSet = hover ? new Set([hover, ...neighbors.get(hover)]) : null
  const me = byId.get('me')

  for (const n of nodes) {
    const target = focusSet ? (focusSet.has(n) ? 1 : 0.12) : 1
    n.alpha = lerp(n.alpha, hoverSet && !hoverSet.has(n) ? Math.min(target, 0.35) : target, 0.12)
    // Skylar glows whenever nothing else is focused.
    const g = n === focus || n === hover || (n === me && !focus) ? 1 : 0
    n.glow = lerp(n.glow, g, 0.08)
  }

  // Idle heartbeat on the Skylar node until something is clicked.
  if (!focus && !reduceMotion && t - lastMePulse > 2600) {
    pulses.push({ node: me, t, color: '243,238,228' })
    lastMePulse = t
  }

  // Links
  ctx.lineCap = 'round'
  for (const l of links) {
    const a = toScreen(l.source.x, l.source.y)
    const b = toScreen(l.target.x, l.target.y)
    const alpha = Math.min(l.source.alpha, l.target.alpha)
    const hot = (hover && (l.source === hover || l.target === hover)) ||
      (focus && (l.source === focus || l.target === focus))
    ctx.strokeStyle = hot ? `rgba(168,130,255,${0.75 * alpha})` : `rgba(${COLORS.link},${0.28 * alpha})`
    ctx.lineWidth = hot ? 1.6 : 1
    ctx.beginPath()
    ctx.moveTo(a.x, a.y)
    ctx.lineTo(b.x, b.y)
    ctx.stroke()
  }

  // Pulses
  for (let i = pulses.length - 1; i >= 0; i--) {
    const p = pulses[i]
    const age = (t - p.t) / 1000
    if (age > 1) { pulses.splice(i, 1); continue }
    const s = toScreen(p.node.x, p.node.y)
    ctx.strokeStyle = `rgba(${p.color},${(1 - age) * 0.6})`
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc(s.x, s.y, (p.node.r + age * 60) * cam.k, 0, Math.PI * 2)
    ctx.stroke()
  }

  // Nodes
  for (const n of nodes) {
    if (n.ex > 0.6) continue // drawn as a card instead
    const s = toScreen(n.x, n.y)
    const r = n.r * cam.k * (1 + n.glow * 0.12) * (1 - n.ex)
    const color = nodeColor(n)
    ctx.globalAlpha = n.alpha
    if (n.type === 'hub' || n.type === 'self' || n.glow > 0.02) {
      const spread = n.type === 'self' ? 2.4 + n.glow * 0.8 : 2.4
      const gr = ctx.createRadialGradient(s.x, s.y, r * 0.6, s.x, s.y, r * spread)
      gr.addColorStop(0, hexA(color, (n.type === 'self' ? 0.18 : 0.3) + n.glow * 0.3))
      gr.addColorStop(1, hexA(color, 0))
      ctx.fillStyle = gr
      ctx.beginPath()
      ctx.arc(s.x, s.y, r * spread, 0, Math.PI * 2)
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
      ctx.arc(s.x, s.y, r - 2.5, 0, Math.PI * 2)
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
    if (n.ex > 0.3) continue
    const always = n.type !== 'tech'
    const show = always || cam.k > 1.15 || (focusSet && focusSet.has(n)) || (hoverSet && hoverSet.has(n))
    if (!show) continue
    const s = toScreen(n.x, n.y)
    const r = n.r * cam.k
    ctx.font = labelFont(n)[0]
    const la = n.alpha * (n.type === 'tech' && !(focusSet && focusSet.has(n)) && n !== hover ? 0.7 : 1)
    ctx.fillStyle = n.type === 'hub' ? hexA(hubColor(n), la) : `rgba(${COLORS.label},${la * (n.type === 'self' ? 1 : 0.9)})`
    ctx.fillText(n.label, s.x, s.y + r + (n.type === 'hub' || n.type === 'self' ? 12 : 6))
  }

  positionOverlays()
}

/* ------------------------------------------------------------------ *
 * Cards embedded in the graph (DOM elements that follow their node)
 * ------------------------------------------------------------------ */
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))
const chips = (tech) => tech.map((t) => `<button class="chip" data-focus="${techId(t)}">${esc(t)}</button>`).join('')

function cardHtml(n) {
  const x = n.data
  const isProject = n.group === 'projects'
  return `
    <div class="gcard-media ${x.vimeoId ? 'has-video' : ''}" style="background-image:url('${x.image}')" ${x.vimeoId ? `data-vimeo="${x.vimeoId}"` : ''}>
      ${x.vimeoId ? `<span class="preview-hint">▶ ${touchOnly ? 'Tap' : 'Hover'} to preview</span>` : ''}
    </div>
    <div class="gcard-body">
      <div class="gcard-head">
        <h3>${esc(x.title)}</h3>
        ${x.dates ? `<span class="dates">${esc(x.dates)}</span>` : ''}
      </div>
      <p>${esc(x.description)}</p>
      <div class="chips">${chips(x.tech)}</div>
      ${isProject ? `<div class="actions">
        ${x.url ? `<a class="btn primary" href="${x.url}" target="_blank" rel="noopener">Open demo</a>` : ''}
        ${x.vimeoId ? `<button class="btn" data-video="${x.vimeoId}">Video</button>` : ''}
        ${x.code ? `<a class="btn" href="${x.code}" target="_blank" rel="noopener">Code</a>` : ''}
      </div>` : ''}
    </div>`
}

for (const n of nodes) {
  if (n.type !== 'item') continue
  const el = document.createElement('article')
  el.className = `gcard ${n.group}`
  el.style.width = CARD_W + 'px'
  el.innerHTML = cardHtml(n)
  el.dataset.node = n.id
  layer.appendChild(el)
  n.card = el
}

// Résumé download pill hangs under the Resume hub while it's focused.
const resumePill = document.createElement('a')
resumePill.className = 'hub-pill'
resumePill.href = profile.resumePdf
resumePill.target = '_blank'
resumePill.rel = 'noopener'
resumePill.textContent = 'Download résumé (PDF)'
layer.appendChild(resumePill)

const labelFont = (n) => {
  const size = n.type === 'self' ? 17 : n.type === 'hub' ? 16 : n.type === 'tech' ? 11 : 12.5
  return [`${n.type === 'hub' || n.type === 'self' ? 600 : 500} ${size}px Inter, system-ui, sans-serif`, size]
}
function measureCards() {
  for (const n of nodes) {
    const [font, size] = labelFont(n)
    ctx.font = font
    n.labelW = ctx.measureText(n.label).width
    n.labelH = size + (n.type === 'hub' || n.type === 'self' ? 16 : 10)
  }
  for (const n of nodes) {
    if (!n.card) continue
    n.cardHW = (CARD_W * CARD_SCALE) / 2
    n.cardHH = (n.card.offsetHeight * CARD_SCALE) / 2
  }
}

function positionOverlays() {
  const s = cam.k * CARD_SCALE
  for (const n of nodes) {
    if (!n.card) continue
    const el = n.card
    const vis = n.ex * Math.max(n.alpha, 0.3)
    if (vis < 0.02) { if (el.style.visibility !== 'hidden') el.style.visibility = 'hidden'; continue }
    const p = toScreen(n.x, n.y)
    el.style.visibility = 'visible'
    el.style.opacity = vis.toFixed(3)
    el.style.transform = `translate(${p.x}px, ${p.y}px) translate(-50%, -50%) scale(${(s * (0.6 + 0.4 * n.ex)).toFixed(4)})`
    el.style.pointerEvents = n.ex > 0.6 ? 'auto' : 'none'
    el.classList.toggle('is-focus', n === focus)
  }
  const resume = byId.get('resume')
  const showPill = focusedHub() === resume
  const p = toScreen(resume.x, resume.y)
  resumePill.style.opacity = showPill ? resume.alpha.toFixed(3) : '0'
  resumePill.style.pointerEvents = showPill ? 'auto' : 'none'
  resumePill.style.transform = `translate(${p.x}px, ${p.y + resume.r * cam.k + 38}px) translate(-50%, 0)`
}

/* ------------------------------------------------------------------ *
 * Loop
 * ------------------------------------------------------------------ */
function frame(t) {
  step(t)
  updateCamera()
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
    if (n.alpha < 0.3 || n.ex > 0.6) continue
    const d = Math.hypot(n.x - w.x, n.y - w.y)
    if (d < n.r + 10 / cam.k && d < bestD) { best = n; bestD = d }
  }
  return best
}

let drag = null
function startDrag(e, node, target) {
  e.currentTarget.setPointerCapture?.(e.pointerId)
  drag = { node, target, sx: e.clientX, sy: e.clientY, lx: e.clientX, ly: e.clientY, moved: false }
  if (node) node.fixed = true
}
canvas.addEventListener('pointerdown', (e) => startDrag(e, pick(e.clientX, e.clientY), null))
layer.addEventListener('pointerdown', (e) => {
  const card = e.target.closest('.gcard')
  if (!card || e.target.closest('a, button')) return
  startDrag(e, byId.get(card.dataset.node), e.target)
})
window.addEventListener('pointermove', (e) => {
  if (!drag) {
    if (e.target !== canvas) return
    const n = pick(e.clientX, e.clientY)
    if (n !== hover) { hover = n; canvas.style.cursor = n ? 'pointer' : 'grab' }
    return
  }
  if (Math.hypot(e.clientX - drag.sx, e.clientY - drag.sy) > 5) drag.moved = true
  if (drag.node) {
    if (drag.moved) {
      const w = toWorld(e.clientX, e.clientY)
      drag.node.x = w.x; drag.node.y = w.y
    }
  } else if (drag.moved) {
    manualCam = true
    camTarget.x -= (e.clientX - drag.lx) / cam.k
    camTarget.y -= (e.clientY - drag.ly) / cam.k
    cam.x = camTarget.x; cam.y = camTarget.y
    canvas.style.cursor = 'grabbing'
  }
  drag.lx = e.clientX; drag.ly = e.clientY
})
window.addEventListener('pointerup', () => {
  if (!drag) return
  const { node, moved, target } = drag
  if (node) node.fixed = false
  drag = null
  canvas.style.cursor = hover ? 'pointer' : 'grab'
  if (moved) return
  if (!node) { if (focus) setFocus(null); return }
  if (node.card) {
    const media = target && target.closest('.gcard-media.has-video')
    if (media && touchOnly && focus === node) { togglePreview(media); return }
    if (focus !== node) setFocus(node)
    return
  }
  onNodeClick(node)
})
canvas.addEventListener('pointerleave', () => { if (!drag) hover = null })
canvas.addEventListener('wheel', (e) => {
  e.preventDefault()
  manualCam = true
  camTarget.k = Math.max(0.35, Math.min(3, camTarget.k * Math.exp(-e.deltaY * 0.0015)))
}, { passive: false })

function onNodeClick(node) {
  if (node.type === 'link') { window.open(node.url, '_blank', 'noopener'); return }
  if (node.type === 'self') { setFocus(null); return }
  setFocus(node)
}

// Buttons inside cards
layer.addEventListener('click', (e) => {
  const f = e.target.closest('[data-focus]')
  if (f) { const n = byId.get(f.dataset.focus); if (n) setFocus(n); return }
  const v = e.target.closest('[data-video]')
  if (v) openVideo(v.dataset.video)
})
// Hover previews (mouse)
layer.addEventListener('pointerover', (e) => {
  const m = e.target.closest('.gcard-media.has-video')
  if (m && e.pointerType === 'mouse') startPreview(m)
})
layer.addEventListener('pointerout', (e) => {
  const m = e.target.closest('.gcard-media.has-video')
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

window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') { closeVideo(); setFocus(null) }
})
window.addEventListener('resize', resize)

/* Header buttons mirror the two hub nodes */
const navButtons = document.querySelectorAll('[data-hub]')
navButtons.forEach((b) => b.addEventListener('click', () => {
  const n = byId.get(b.dataset.hub)
  setFocus(focus === n ? null : n)
}))
function updateNavButtons() {
  const hub = focusedHub()
  navButtons.forEach((b) => b.classList.toggle('active', !!hub && b.dataset.hub === hub.id))
}

/* ------------------------------------------------------------------ */
resize()
document.fonts?.ready.then(measureCards)
canvas.style.cursor = 'grab'
requestAnimationFrame(frame)

// Deep links: /#resume or /#projects open focused.
const initial = byId.get(location.hash.slice(1))
if (initial?.type === 'hub') setTimeout(() => setFocus(initial), 900)

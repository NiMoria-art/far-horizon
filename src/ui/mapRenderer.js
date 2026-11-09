const TAU = Math.PI * 2;
export function createMapRenderer(canvas, onSelect) {
  const ctx = canvas.getContext('2d', { alpha: false });
  let state;
  let width = 0;
  let height = 0;
  let dpr = 1;
  function maxOrbit() { return Math.max(1, ...state.system.planets.map((planet) => planet.orbit)); }
  function mapScale() {
    const outerOrbit = maxOrbit();
    return Math.max(0.01, Math.min(width / 720, height / 650, (width / 2 - 48) / outerOrbit, (height / 2 - 40) / outerOrbit));
  }
  function resize() {
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = rect.width;
    height = rect.height;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    draw();
  }
  function draw() {
    if (!state || !width || !height) return;
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = '#08111b';
    ctx.fillRect(0, 0, width, height);
    for (let i = 0; i < 72; i += 1) {
      const x = ((i * 127.1) % 997) / 997 * width;
      const y = ((i * 311.7) % 991) / 991 * height;
      ctx.fillStyle = i % 5 === 0 ? 'rgba(119,190,211,.42)' : 'rgba(164,188,206,.22)';
      ctx.fillRect(x, y, i % 9 === 0 ? 1.5 : 1, i % 9 === 0 ? 1.5 : 1);
    }
    const orbitScale = mapScale();
    const cx = width * .5;
    const cy = height * .51;
    for (const planet of state.system.planets) {
      ctx.beginPath();
      ctx.arc(cx, cy, planet.orbit * orbitScale, 0, TAU);
      ctx.strokeStyle = 'rgba(132,169,190,.12)';
      ctx.lineWidth = 1;
      ctx.stroke();
    }
    const glow = ctx.createRadialGradient(cx, cy, 3, cx, cy, 39 * orbitScale);
    glow.addColorStop(0, 'rgba(255,219,152,.28)');
    glow.addColorStop(1, 'rgba(255,200,112,0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(cx, cy, 39 * orbitScale, 0, TAU);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx, cy, 8 * Math.max(.75, orbitScale), 0, TAU);
    ctx.fillStyle = '#ffe3a5';
    ctx.shadowColor = '#ffc36d';
    ctx.shadowBlur = 18 * Math.max(.7, orbitScale);
    ctx.fill();
    ctx.shadowBlur = 0;
    state.system.planets.forEach((planet, index) => {
      const angle = planet.angle ?? (-2.1 + index * (TAU / Math.max(1, state.system.planets.length)));
      const radius = planet.orbit * orbitScale;
      const x = cx + Math.cos(angle) * radius;
      const y = cy + Math.sin(angle) * radius;
      const selected = state.selectedPlanetId === planet.id;
      const pr = Math.max(4, planet.size * Math.max(.75, orbitScale));
      if (selected) {
        ctx.beginPath();
        ctx.arc(x, y, pr + 8, 0, TAU);
        ctx.strokeStyle = 'rgba(112,226,224,.76)';
        ctx.lineWidth = 1;
        ctx.stroke();
      }
      ctx.beginPath();
      ctx.arc(x, y, pr, 0, TAU);
      ctx.fillStyle = planet.color;
      ctx.shadowColor = planet.color;
      ctx.shadowBlur = selected ? 13 : 5;
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.font = '11px Inter, system-ui, sans-serif';
      ctx.fillStyle = selected ? '#c9f4f0' : 'rgba(193,211,221,.65)';
      ctx.textAlign = x > cx ? 'left' : 'right';
      ctx.fillText(planet.name, x + (x > cx ? 12 : -12), y + 4);
    });
    const shipIndex = state.system.planets.findIndex((planet) => planet.id === state.shipAt);
    let ship = { x: cx, y: cy };
    if (shipIndex >= 0) {
      const angle = state.system.planets[shipIndex].angle ?? (-2.1 + shipIndex * (TAU / Math.max(1, state.system.planets.length)));
      const radius = state.system.planets[shipIndex].orbit * orbitScale;
      ship = { x: cx + Math.cos(angle) * radius, y: cy + Math.sin(angle) * radius };
    }
    ctx.save();
    ctx.translate(ship.x + 19, ship.y - 17);
    ctx.rotate(-Math.PI / 4);
    ctx.beginPath();
    ctx.moveTo(0, -7);
    ctx.lineTo(5, 6);
    ctx.lineTo(0, 3);
    ctx.lineTo(-5, 6);
    ctx.closePath();
    ctx.fillStyle = '#79d8d1';
    ctx.fill();
    ctx.restore();
    ctx.textAlign = 'left';
    ctx.font = '9px Inter, system-ui, sans-serif';
    ctx.fillStyle = 'rgba(172,198,208,.48)';
    ctx.fillText(state.system.designation, 18, height - 17);
  }
  function pointer(event) {
    if (!state) return;
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const factor = mapScale();
    const cx = width * .5;
    const cy = height * .51;
    let nearest = null;
    let distance = 26;
    state.system.planets.forEach((planet, index) => {
      const angle = planet.angle ?? (-2.1 + index * (TAU / Math.max(1, state.system.planets.length)));
      const dx = x - (cx + Math.cos(angle) * planet.orbit * factor);
      const dy = y - (cy + Math.sin(angle) * planet.orbit * factor);
      const d = Math.hypot(dx, dy);
      if (d < distance) { nearest = planet; distance = d; }
    });
    if (nearest) onSelect(nearest.id);
  }
  canvas.addEventListener('pointerdown', pointer);
  const observer = new ResizeObserver(resize);
  observer.observe(canvas);
  return {
    render(nextState) { state = nextState; draw(); },
    destroy() { observer.disconnect(); canvas.removeEventListener('pointerdown', pointer); },
  };
}

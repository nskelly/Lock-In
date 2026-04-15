const TASKS = [
  { label: "bathroom",       icon: "toilet" },
  { label: "drink water",    icon: "drop"       },
  { label: "get dressed",    icon: "shirt"      },
  { label: "eat breakfast",  icon: "utensils"   },
  { label: "ready to leave", icon: "clock"      },
];
 
// ─────────────────────────────────────────────────────────────────────────────
// COLOURS
// ─────────────────────────────────────────────────────────────────────────────
const C_BG     = [214, 234, 245];
const C_STROKE = [108, 142, 174];
const C_CIRCLE = [168, 196, 218];
const C_FILL   = [107, 140, 172];
const C_LABEL  = [108, 142, 174];
const C_DONE   = [255, 255, 255];
const C_TITLE  = [ 88, 120, 158];
const C_ICON   = [255, 255, 255];
 
const SNAP = 0.85;
 
let sliders = [];
let W, H;
let fontLoaded = false;
 
// ─────────────────────────────────────────────────────────────────────────────
// SETUP
// ─────────────────────────────────────────────────────────────────────────────
function setup() {
  W = windowWidth;
  H = windowHeight;
  createCanvas(W, H);
  noLoop();
 
  // Load Comfortaa via FontFace API so p5.js text() uses it
  const font = new FontFace('Comfortaa', 'url(https://fonts.gstatic.com/s/comfortaa/v45/1Pt_g8LJRfWJmhDAuUs4TYFs.woff2)');
  font.load().then(f => {
    document.fonts.add(f);
    fontLoaded = true;
    textFont('Comfortaa');
    buildLayout();
    redraw();
  }).catch(() => {
    // fallback — build anyway with system font
    buildLayout();
    redraw();
  });
 
  buildLayout();
  redraw();
}
 
function buildLayout() {
  sliders = [];
  const landscape = W > H;
 
  const marginX   = W * (landscape ? 0.03 : 0.06);
  const marginY   = H * (landscape ? 0.05 : 0.03);
  const titleZone = landscape ? 0 : H * 0.16;
 
  // Cap track height tighter in landscape since vertical space is limited
  const trackH  = min(landscape ? H * 0.13 : H * 0.095, landscape ? 56 : 76);
  const circleR = trackH * 0.56;
  const trackW  = W - marginX * 2;
  const usableH = H - titleZone - marginY * 2;
  const rowH    = usableH / 5;
 
  for (let i = 0; i < TASKS.length; i++) {
    const cy = titleZone + marginY + rowH * i + rowH * 0.5;
    sliders.push({
      label:     TASKS[i].label,
      icon:      TASKS[i].icon,
      tx: marginX, ty: cy - trackH / 2,
      tw: trackW,  th: trackH,
      r:  trackH / 2,
      circleR, cy,
      value: 0, completed: false,
      dragging: false, dragOffX: 0,
    });
  }
}
 
// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────
function circleCX(s) {
  return s.tx + s.circleR + s.value * (s.tw - s.circleR * 2);
}
 
// ─────────────────────────────────────────────────────────────────────────────
// DRAW
// ─────────────────────────────────────────────────────────────────────────────
function draw() {
  background(...C_BG);
 
  if (fontLoaded) textFont('Comfortaa');
 
  // Title — smaller in landscape, sits in the slim top margin
  const landscape = W > H;
  noStroke();
  fill(...C_TITLE);
  textAlign(CENTER, CENTER);
  textStyle(BOLD);
  textSize(landscape ? min(W * 0.038, H * 0.10, 28) : min(W * 0.092, 48));
  if (landscape) {
    text('TASK LIST', W / 2, H * 0.032);
  } else {
    text('TASK LIST', W / 2, H * 0.085);
  }
  textStyle(NORMAL);
 
  for (const s of sliders) drawSlider(s);
}
 
function drawSlider(s) {
  const { tx, ty, tw, th, r, circleR, value, completed, cy } = s;
  const cx = circleCX(s);
  const sw = max(2.5, W * 0.004);
 
  // ── Track ──────────────────────────────────────────────────────────────
  if (completed) {
    noStroke();
    fill(...C_FILL);
    rect(tx, ty, tw, th, r);
  } else {
    // Empty pill
    fill(255, 255, 255, 70);
    stroke(...C_STROKE);
    strokeWeight(sw);
    rect(tx, ty, tw, th, r);
 
    // Progress fill clipped to pill
    if (value > 0) {
      noStroke();
      fill(...C_FILL);
      drawingContext.save();
      const clip = new Path2D();
      clip.roundRect(tx, ty, tw, th, r);
      drawingContext.clip(clip);
      rect(tx, ty, (cx - tx) + circleR * 0.6, th);
      drawingContext.restore();
    }
  }
 
  // ── Label ──────────────────────────────────────────────────────────────
  noStroke();
  textAlign(CENTER, CENTER);
  textStyle(NORMAL);
  textSize(min(th * 0.40, tw * 0.060));
  fill(...(completed ? C_DONE : C_LABEL));
  text(completed ? 'completed' : s.label, tx + tw / 2, cy);
 
  // ── Icon circle ────────────────────────────────────────────────────────
  noStroke();
  fill(...C_CIRCLE);
  circle(cx, cy, circleR * 2);
 
  // ── Icon drawing ───────────────────────────────────────────────────────
  if (completed) {
    drawCheckmark(cx, cy, circleR);
  } else {
    drawIcon(s.icon, cx, cy, circleR);
  }
}
 
// ─────────────────────────────────────────────────────────────────────────────
// ICONS — all drawn centred on (0,0) inside a push/translate/pop block
// ─────────────────────────────────────────────────────────────────────────────
function iconStyle(r) {
  stroke(...C_ICON);
  strokeWeight(max(1.8, r * 0.10));
  strokeCap(ROUND);
  strokeJoin(ROUND);
  noFill();
}
 
function drawIcon(name, cx, cy, r) {
  push();
  translate(cx, cy);
  iconStyle(r);
 
  const s = r * 0.54; // unified scale — icon spans roughly ±s in each axis
 
  if (name === 'toilet') {
    const sw = max(1.8, r * 0.09);
    strokeWeight(sw);
 
    // ── Layout anchors (all relative to centre 0,0) ──
    const tankTop  = -s * 1.00;
    const tankBot  = -s * 0.42;  // bottom of tank = top of lid
    const tankW    =  s * 1.00;
    const tankH    =  tankBot - tankTop;
 
    const lidTop   =  tankBot;
    const lidBot   = -s * 0.22;
    const lidW     =  s * 1.30;
 
    const bowlTop  =  lidBot;
    const bowlBot  =  s * 0.80;  // bottom of bowl curve
 
    const baseTop  =  bowlBot;
    const baseBot  =  s * 1.00;
    const baseW    =  s * 0.80;
 
    // 1. Tank
    rect(-tankW / 2, tankTop, tankW, tankH, s * 0.13);
 
    // 2. Lid (wider than tank, thin flat pill)
    rect(-lidW / 2, lidTop, lidW, lidBot - lidTop, (lidBot - lidTop) * 0.5);
 
    // 3. Bowl — smooth U shape
    beginShape();
    vertex(-lidW / 2, bowlTop);
    bezierVertex(
      -lidW / 2 - s * 0.12, bowlTop + (bowlBot - bowlTop) * 0.4,
      -baseW / 2,            bowlBot - s * 0.08,
      -baseW / 2,            bowlBot
    );
    // flat base underside
    vertex( baseW / 2, bowlBot);
    bezierVertex(
       baseW / 2,            bowlBot - s * 0.08,
       lidW / 2 + s * 0.12, bowlTop + (bowlBot - bowlTop) * 0.4,
       lidW / 2,             bowlTop
    );
    endShape(CLOSE);
 
    // 4. Pedestal / base block
    rect(-baseW / 2, baseTop, baseW, baseBot - baseTop, s * 0.10);
 
  } else if (name === 'drop') {
    // Teardrop centred: tip at -s*1.0, round bottom at +s*0.85
    beginShape();
    vertex(0, -s * 1.0);
    bezierVertex( s*0.85,  s*0.0,  s*0.72,  s*0.85, 0,  s*0.85);
    bezierVertex(-s*0.72,  s*0.85, -s*0.85,  s*0.0, 0, -s*1.0);
    endShape(CLOSE);
 
  } else if (name === 'shirt') {
    // T-shirt centred: top at -s, bottom at +s
    strokeWeight(max(1.8, r * 0.09));
    beginShape();
    vertex(-s*0.42, -s*0.9);          // left collar
    vertex(-s*1.0,  -s*0.55);         // left sleeve tip top
    vertex(-s*0.78, -s*0.05);         // left sleeve tip bottom
    vertex(-s*0.50, -s*0.05);         // left armhole
    vertex(-s*0.50,  s*1.0);          // bottom left
    vertex( s*0.50,  s*1.0);          // bottom right
    vertex( s*0.50, -s*0.05);         // right armhole
    vertex( s*0.78, -s*0.05);         // right sleeve tip bottom
    vertex( s*1.0,  -s*0.55);         // right sleeve tip top
    vertex( s*0.42, -s*0.9);          // right collar
    // Curved neckline
    bezierVertex( s*0.22, -s*0.52, -s*0.22, -s*0.52, -s*0.42, -s*0.9);
    endShape(CLOSE);
 
  } else if (name === 'utensils') {
    strokeWeight(max(1.8, r * 0.09));
    // Fork on left, spoon on right, both span -s..+s vertically
    const fx  = -s * 0.42;
    const spx =  s * 0.42;
    const top = -s * 1.0;
    const bot =  s * 1.0;
 
    // Fork handle
    line(fx, -s*0.15, fx, bot);
    // Fork tines (3)
    const tw = s * 0.20;
    for (let i = -1; i <= 1; i++) {
      line(fx + i*tw, top, fx + i*tw, -s*0.35);
    }
    // Fork tine bridge (arc connecting outer tines)
    noFill();
    beginShape();
    vertex(fx - tw, -s*0.35);
    bezierVertex(fx - tw, -s*0.1, fx + tw, -s*0.1, fx + tw, -s*0.35);
    endShape();
 
    // Spoon bowl (ellipse centred slightly above midpoint)
    ellipse(spx, -s*0.55, s*0.48, s*0.66);
    // Spoon handle
    line(spx, -s*0.22, spx, bot);
 
  } else if (name === 'clock') {
    // Circle fills most of the icon area
    circle(0, 0, s * 1.92);
    // Minute hand → 12
    strokeWeight(max(2, r * 0.11));
    line(0, 0, 0, -s * 0.68);
    // Hour hand → ~9
    line(0, 0, -s * 0.50, 0);
    // Centre dot
    fill(...C_ICON);
    noStroke();
    circle(0, 0, max(4, r * 0.15));
  }
 
  pop();
}
 
function drawCheckmark(cx, cy, r) {
  push();
  translate(cx, cy);
  const s = r * 0.54;
  stroke(...C_ICON);
  strokeWeight(max(2.5, r * 0.13));
  strokeCap(ROUND);
  strokeJoin(ROUND);
  noFill();
  beginShape();
  vertex(-s * 0.85,  s * 0.05);
  vertex(-s * 0.10,  s * 0.75);
  vertex( s * 0.85, -s * 0.65);
  endShape();
  pop();
}
 
// ─────────────────────────────────────────────────────────────────────────────
// INTERACTION
// ─────────────────────────────────────────────────────────────────────────────
function hitTest(s, px, py) {
  if (s.completed) return false;
  const cx = circleCX(s);
  return dist(px, py, cx, s.cy) < s.circleR * 1.8
      || (px >= s.tx && px <= s.tx + s.tw && py >= s.ty && py <= s.ty + s.th);
}
 
function onStart(px, py) {
  // If a completed circle is tapped, reset it back to the left
  for (const s of sliders) {
    if (!s.completed) continue;
    const cx = circleCX(s);
    if (dist(px, py, cx, s.cy) < s.circleR * 1.8) {
      s.completed = false;
      snapBack(s);
      return;
    }
  }
  // Otherwise start a drag on an incomplete slider
  for (const s of sliders) {
    if (hitTest(s, px, py)) {
      s.dragging = true;
      s.dragOffX = px - circleCX(s);
      loop();
    }
  }
}
 
function onMove(px) {
  for (const s of sliders) {
    if (!s.dragging) continue;
    const minX = s.tx + s.circleR;
    const maxX = s.tx + s.tw - s.circleR;
    s.value = constrain((px - s.dragOffX - minX) / (maxX - minX), 0, 1);
  }
}
 
function onEnd() {
  for (const s of sliders) {
    if (!s.dragging) continue;
    s.dragging = false;
    if (s.value >= SNAP) {
      s.value = 1;
      s.completed = true;
      noLoop(); redraw();
    } else {
      snapBack(s);
    }
  }
}
 
function snapBack(s) {
  loop();
  (function step() {
    s.value = lerp(s.value, 0, 0.2);
    redraw();
    if (s.value > 0.005) requestAnimationFrame(step);
    else { s.value = 0; redraw(); noLoop(); }
  })();
}
 
function mousePressed()  { onStart(mouseX, mouseY); }
function mouseDragged()  { onMove(mouseX); }
function mouseReleased() { onEnd(); }
 
function touchStarted() { if (touches.length) onStart(touches[0].x, touches[0].y); return false; }
function touchMoved()   { if (touches.length) onMove(touches[0].x); return false; }
function touchEnded()   { onEnd(); return false; }
 
function windowResized() {
  W = windowWidth; H = windowHeight;
  resizeCanvas(W, H);
  buildLayout();
  redraw();
}
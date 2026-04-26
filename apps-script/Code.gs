function doGet() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Sheet1");
  const cell  = sheet.getRange("A1").getValue();
  const names = cell.split(",").map(n => n.trim()).filter(Boolean);

  const html = HtmlService.createHtmlOutput(buildPage(names))
    .setTitle("Onigiri Assemble")
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);

  return html;
}

function buildPage(names) {
  const namesJson = JSON.stringify(names);
  return `<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=DM+Sans:wght@300;400;500&display=swap');
  * { margin:0; padding:0; box-sizing:border-box; }
  body { min-height:100vh; background:#0e0b14; font-family:'DM Sans',sans-serif; display:flex; align-items:center; justify-content:center; overflow:hidden; }
  .stars { position:fixed; inset:0; pointer-events:none; z-index:0; }
  .star { position:absolute; width:2px; height:2px; background:rgba(255,255,255,0.6); border-radius:50%; animation:twinkle var(--d,3s) ease-in-out infinite; }
  @keyframes twinkle { 0%,100%{opacity:0.2}50%{opacity:1} }
  .container { position:relative; z-index:1; width:100%; max-width:520px; padding:48px 24px; text-align:center; }
  .subtitle { font-size:11px; letter-spacing:4px; text-transform:uppercase; color:#9d7ec7; margin-bottom:12px; }
  h1 { font-family:'Playfair Display',serif; font-size:42px; font-weight:400; color:#f0eafa; line-height:1.1; margin-bottom:40px; }
  h1 em { font-style:italic; color:#c9a8f5; }
  .pill-row { display:flex; flex-wrap:wrap; gap:8px; justify-content:center; min-height:36px; margin-bottom:36px; }
  .pill { background:rgba(157,126,199,0.12); border:1px solid rgba(157,126,199,0.25); color:#c9a8f5; border-radius:100px; padding:6px 16px; font-size:13px; transition:all 0.3s; }
  .pill.highlight { background:rgba(201,168,245,0.25); border-color:#c9a8f5; color:#f0eafa; transform:scale(1.08); }
  .orb-wrap { position:relative; width:200px; height:200px; margin:0 auto 36px; cursor:pointer; }
  .orb-bg { position:absolute; inset:0; border-radius:50%; background:radial-gradient(circle at 38% 38%,#3d2060 0%,#1a0e30 60%,#0e0b14 100%); border:1px solid rgba(201,168,245,0.15); transition:transform 0.4s; }
  .orb-ring { position:absolute; inset:-8px; border-radius:50%; border:1px solid rgba(201,168,245,0.08); animation:spin-slow 20s linear infinite; }
  .orb-ring2 { position:absolute; inset:-18px; border-radius:50%; border:1px dashed rgba(157,126,199,0.06); animation:spin-slow 30s linear infinite reverse; }
  @keyframes spin-slow { from{transform:rotate(0deg)}to{transform:rotate(360deg)} }
  .orb-inner { position:absolute; inset:0; display:flex; flex-direction:column; align-items:center; justify-content:center; border-radius:50%; }
  .orb-text { font-family:'Playfair Display',serif; font-size:28px; color:#f0eafa; line-height:1.2; max-width:160px; word-break:break-word; overflow-wrap:break-word; hyphens:auto; display:flex; align-items:center; justify-content:center; text-align:center; }
  .orb-hint { font-size:11px; color:#6b5888; letter-spacing:2px; text-transform:uppercase; margin-top:6px; }
  .orb-wrap:hover .orb-bg { transform:scale(1.04); }
  .orb-wrap.rolling .orb-bg { animation:orb-pulse 0.08s ease-in-out infinite; }
  @keyframes orb-pulse { 0%,100%{transform:scale(1)}50%{transform:scale(1.03)} }
  .glow { position:absolute; inset:-40px; border-radius:50%; background:radial-gradient(circle,rgba(157,126,199,0.12) 0%,transparent 70%); opacity:0; transition:opacity 0.5s; pointer-events:none; }
  .orb-wrap.done .glow { opacity:1; }
  .btn { display:inline-block; padding:14px 40px; background:linear-gradient(135deg,#6b3fa8,#9d5fd6); color:#f0eafa; border:none; border-radius:100px; font-family:'DM Sans',sans-serif; font-size:14px; font-weight:500; letter-spacing:1.5px; text-transform:uppercase; cursor:pointer; transition:all 0.3s; box-shadow:0 4px 24px rgba(107,63,168,0.35); }
  .btn:hover { transform:translateY(-2px); box-shadow:0 8px 32px rgba(107,63,168,0.5); }
  canvas { position:fixed; inset:0; pointer-events:none; z-index:10; }
  @media (max-width: 480px) {
    h1 { font-size: 32px; }
    .orb-wrap { width: 160px; height: 160px; }
    .orb-text { font-size: 22px; }
    .btn { padding: 12px 32px; font-size: 13px; }
  }
</style>
</head>
<body>
<div class="stars" id="stars"></div>
<div class="container">
  <p class="subtitle">Onigiri Assemble</p>
  <h1>The <em>Chosen</em> One</h1>
  <div class="pill-row" id="pills"></div>
  <div class="orb-wrap" id="orb" onclick="pick()">
    <div class="glow"></div>
    <div class="orb-ring"></div>
    <div class="orb-ring2"></div>
    <div class="orb-bg"></div>
    <div class="orb-inner">
      <div class="orb-text" id="orbText">?</div>
      <div class="orb-hint" id="orbHint">tap to reveal</div>
    </div>
  </div>
  <button class="btn" onclick="pick()">Draw</button>
</div>
<canvas id="confetti"></canvas>
<script>
const NAMES = ${namesJson};

// --- Audio ---
const AudioCtx = window.AudioContext || window.webkitAudioContext;
let audioCtx;
function ensureAudio() { if (!audioCtx) audioCtx = new AudioCtx(); }

function playTick() {
  ensureAudio();
  const o = audioCtx.createOscillator();
  const g = audioCtx.createGain();
  o.connect(g); g.connect(audioCtx.destination);
  o.type = 'sine';
  o.frequency.value = 600 + Math.random() * 400;
  g.gain.setValueAtTime(0.15, audioCtx.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.08);
  o.start(); o.stop(audioCtx.currentTime + 0.08);
}

function playReveal() {
  ensureAudio();
  [523, 659, 784].forEach((freq, i) => {
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.connect(g); g.connect(audioCtx.destination);
    o.type = 'sine';
    o.frequency.value = freq;
    const t = audioCtx.currentTime + i * 0.12;
    g.gain.setValueAtTime(0.2, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
    o.start(t); o.stop(t + 0.5);
  });
}

// --- Stars ---
const starContainer = document.getElementById('stars');
for(let i=0;i<80;i++){const s=document.createElement('div');s.className='star';s.style.left=Math.random()*100+'%';s.style.top=Math.random()*100+'%';s.style.setProperty('--d',(2+Math.random()*4)+'s');s.style.animationDelay=(Math.random()*4)+'s';starContainer.appendChild(s);}

// --- Pills ---
const row=document.getElementById('pills');
NAMES.forEach(n=>{const p=document.createElement('div');p.className='pill';p.textContent=n;p.id='pill-'+n.replace(/\\s+/g,'_');row.appendChild(p);});

// --- Orb text scaling ---
function fitOrbText(name) {
  const el = document.getElementById('orbText');
  el.textContent = name;
  if (name.length > 14) el.style.fontSize = '18px';
  else if (name.length > 10) el.style.fontSize = '22px';
  else el.style.fontSize = '28px';
}

// --- Picker ---
let rolling=false;

function pick(){
  if(!NAMES.length||rolling)return;
  rolling=true;
  const orb=document.getElementById('orb');
  orb.classList.add('rolling');orb.classList.remove('done');
  document.getElementById('orbHint').textContent='...';
  document.querySelectorAll('.pill').forEach(p=>p.classList.remove('highlight'));
  let count=0,totalSpins=18+Math.floor(Math.random()*10),delay=60;

  function spin(){
    const idx=Math.floor(Math.random()*NAMES.length);
    const name=NAMES[idx];
    fitOrbText(name);
    playTick();
    document.querySelectorAll('.pill').forEach(p=>p.classList.remove('highlight'));
    const pill=document.getElementById('pill-'+name.replace(/\\s+/g,'_'));
    if(pill)pill.classList.add('highlight');
    count++;delay=Math.min(delay+(count>totalSpins*0.6?18:3),280);
    if(count<totalSpins)setTimeout(spin,delay);
    else{orb.classList.remove('rolling');orb.classList.add('done');document.getElementById('orbHint').textContent='✦';rolling=false;playReveal();launchConfetti();}
  }
  spin();
}

// --- Confetti ---
function launchConfetti(){
  const canvas=document.getElementById('confetti');const ctx=canvas.getContext('2d');
  canvas.width=window.innerWidth;canvas.height=window.innerHeight;
  const colors=['#c9a8f5','#9d7ec7','#f0eafa','#6b3fa8','#e8c5ff'];
  const pieces=Array.from({length:60},()=>({x:canvas.width/2+(Math.random()-.5)*200,y:canvas.height/2+(Math.random()-.5)*200,r:3+Math.random()*4,color:colors[Math.floor(Math.random()*colors.length)],vx:(Math.random()-.5)*8,vy:-6-Math.random()*6,alpha:1,rot:Math.random()*360,rotV:(Math.random()-.5)*10}));
  let frame=0;
  function draw(){ctx.clearRect(0,0,canvas.width,canvas.height);pieces.forEach(p=>{p.x+=p.vx;p.y+=p.vy;p.vy+=0.18;p.alpha-=0.018;p.rot+=p.rotV;if(p.alpha<=0)return;ctx.save();ctx.globalAlpha=p.alpha;ctx.translate(p.x,p.y);ctx.rotate(p.rot*Math.PI/180);ctx.fillStyle=p.color;ctx.fillRect(-p.r,-p.r/2,p.r*2,p.r);ctx.restore();});frame++;if(frame<120)requestAnimationFrame(draw);else ctx.clearRect(0,0,canvas.width,canvas.height);}
  draw();
}
</script>
</body>
</html>`;
}

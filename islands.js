// 首頁「天空島嶼」：5 座科目島用天空吊橋串起來，萌寵在橋上走來走去
// 島嶼圖：isl/<id>-a.webp（主圖）、-b.webp（變化圖，即夢生成）；第三格「發光」用程式做。
(function () {
  var ISL = [
    { id: 'social', name: '社會', sub: '公主城堡', url: 'https://kuog88.github.io/social-puzzle/', c: '#e8913a' },
    { id: 'nature', name: '自然', sub: '森林木屋', url: 'https://kuog88.github.io/science5-quest/', c: '#23a55a' },
    { id: 'math', name: '數學', sub: '蒸汽齒輪城堡', url: 'https://kuog88.github.io/math5a-lab/', c: '#2f80ed' },
    { id: 'chinese', name: '國文', sub: '雲端書院', url: 'https://kuog88.github.io/guoyu-island/', c: '#d94f70' },
    { id: 'english', name: '英文', sub: '魔法學院', url: 'https://kuog88.github.io/galaxy-english/', c: '#6c5ce7' }
  ];
  var root = document.getElementById('sky-islands'); if (!root) return;
  var RM = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  var css = document.createElement('style');
  css.textContent =
    '#sky-islands{position:relative;width:100%;max-width:1180px;margin:0 auto;overflow:visible;-webkit-tap-highlight-color:transparent}' +
    '#sky-islands svg.br{position:absolute;inset:0;width:100%;height:100%;pointer-events:none;overflow:visible}' +
    '.isl{position:absolute;z-index:1;display:block;text-decoration:none;color:inherit;transform:translate(-50%,-50%);animation:islBob 6s ease-in-out infinite}' +
    '.isl .art{position:relative;width:100%;aspect-ratio:1/1;filter:drop-shadow(0 18px 18px rgba(60,90,140,.25));transition:transform .25s}' +
    '.isl:hover .art,.isl:focus-visible .art{transform:scale(1.05)}.isl:focus-visible{outline:none}' +
    '.isl .art img{position:absolute;inset:0;width:100%;height:100%;object-fit:contain;transition:opacity .9s ease-in-out,filter .9s}' +
    '.isl .art img.fb{opacity:0}.isl.f1 .art img.fb{opacity:1}' +
    '.isl.f2 .art img{filter:brightness(1.1) saturate(1.15) drop-shadow(0 0 14px rgba(255,236,160,.9))}' +
    '.isl .tag{position:absolute;left:50%;bottom:-4%;transform:translateX(-50%);white-space:nowrap;background:#fff;border:4px solid var(--c);box-shadow:0 5px 0 var(--c);border-radius:999px;padding:4px 16px 5px;font-weight:900;font-size:clamp(17px,2.2vw,22px);color:var(--c);text-align:center;line-height:1.15}' +
    '.isl .tag small{display:block;font-size:.58em;font-weight:700;color:#7a6a5a}' +
    '.isl .spk{position:absolute;pointer-events:none;font-size:18px;animation:islSpk 1.6s ease-out forwards}' +
    '#isl-walker{position:absolute;z-index:5;width:var(--pw,64px);height:var(--pw,64px);transform:translate(-50%,-92%);cursor:pointer;pointer-events:auto}' +
    '#isl-walker img{width:100%;height:100%;object-fit:contain;filter:drop-shadow(0 5px 4px rgba(0,0,0,.25));animation:islStep .42s ease-in-out infinite;transform-origin:50% 100%}' +
    '#isl-walker.rest img{animation:islBreath 1.8s ease-in-out infinite}' +
    '#isl-walker .bub{position:absolute;bottom:100%;left:50%;transform:translateX(-50%);margin-bottom:4px;white-space:normal;width:max-content;max-width:min(220px,64vw);text-align:center;line-height:1.4;background:#fff;color:#333;border:2px solid #ffb84d;border-radius:12px;padding:3px 10px;font:800 14px "Microsoft JhengHei","PingFang TC",sans-serif;box-shadow:0 3px 8px rgba(0,0,0,.15);opacity:0;transition:opacity .25s;pointer-events:none}' +
    '#isl-walker .bub.on{opacity:1}' +
    '.cloud{position:absolute;pointer-events:none;background:#fff;border-radius:999px;opacity:.75;filter:blur(2px);animation:islCloud linear infinite}' +
    '.cloud::before,.cloud::after{content:"";position:absolute;background:#fff;border-radius:50%}' +
    '.cloud::before{width:55%;height:160%;left:15%;bottom:20%}.cloud::after{width:40%;height:130%;right:12%;bottom:25%}' +
    '@keyframes islBob{0%,100%{translate:0 0}50%{translate:0 -10px}}' +
    '@keyframes islStep{0%,100%{translate:0 0;rotate:-4deg}50%{translate:0 -7px;rotate:4deg}}' +
    '@keyframes islBreath{0%,100%{scale:1}50%{scale:1.05 .96}}' +
    '#isl-walker.left.rest img,#isl-walker.left img{transform:scaleX(-1)}' +
    '@keyframes islSpk{0%{opacity:0;transform:translateY(0) scale(.5)}30%{opacity:1}100%{opacity:0;transform:translateY(-34px) scale(1.1)}}' +
    '@keyframes islCloud{from{transform:translateX(-30vw)}to{transform:translateX(130vw)}}' +
    '@media (prefers-reduced-motion:reduce){.isl,#isl-walker img,.cloud{animation:none!important}}';
  document.head.appendChild(css);

  // 漂浮的雲（裝飾，在整頁背景）
  var sky = document.createElement('div'); sky.setAttribute('aria-hidden', 'true');
  sky.style.cssText = 'position:fixed;inset:0;z-index:-1;overflow:hidden;pointer-events:none';
  for (var c = 0; c < 6; c++) {
    var d = document.createElement('div'); d.className = 'cloud';
    var w = 90 + Math.random() * 130; d.style.width = w + 'px'; d.style.height = w * 0.32 + 'px';
    d.style.top = (6 + Math.random() * 80) + '%'; d.style.left = '0';
    d.style.animationDuration = (70 + Math.random() * 60) + 's'; d.style.animationDelay = (-Math.random() * 120) + 's';
    sky.appendChild(d);
  }
  document.body.appendChild(sky);

  // 島嶼
  var NS = 'http://www.w3.org/2000/svg';
  var svg = document.createElementNS(NS, 'svg'); svg.setAttribute('class', 'br'); svg.setAttribute('aria-hidden', 'true');
  root.appendChild(svg);
  var els = ISL.map(function (s, i) {
    var a = document.createElement('a'); a.className = 'isl'; a.href = s.url; a.style.setProperty('--c', s.c);
    a.style.animationDelay = (-i * 1.3) + 's';
    a.setAttribute('aria-label', s.name + '（' + s.sub + '）');
    a.innerHTML = '<div class="art"><img src="isl/' + s.id + '-a.webp" alt=""><img class="fb" src="isl/' + s.id + '-b.webp" alt=""></div>' +
      '<span class="tag">' + s.name + '<small>' + s.sub + '</small></span>';
    root.appendChild(a);
    return a;
  });

  // 三格動畫：主圖 → 變化圖 → 主圖＋發光（每座島錯開時間）
  if (!RM) els.forEach(function (a, i) {
    var f = 0;
    function next() {
      f = (f + 1) % 3;
      a.classList.toggle('f1', f === 1); a.classList.toggle('f2', f === 2);
      if (f === 2) sparkle(a);
      setTimeout(next, f === 0 ? 2600 : f === 1 ? 2600 : 1700);
    }
    setTimeout(next, 900 + i * 700);
  });
  function sparkle(a) {
    var art = a.querySelector('.art');
    for (var k = 0; k < 4; k++) (function (k) {
      setTimeout(function () {
        var s = document.createElement('span'); s.className = 'spk'; s.textContent = k % 2 ? '✨' : '⭐';
        s.style.left = (22 + Math.random() * 56) + '%'; s.style.top = (8 + Math.random() * 35) + '%';
        art.appendChild(s); setTimeout(function () { s.remove(); }, 1700);
      }, k * 260);
    })(k);
  }

  // 版面：一排波浪。寬螢幕整排放得下；手機改成可以左右滑動的長條（橋才不會變成梯子）
  var wrap = document.createElement('div'); wrap.id = 'sky-wrap';
  wrap.style.cssText = 'width:100%;max-width:1180px;overflow-x:auto;overflow-y:hidden;-webkit-overflow-scrolling:touch;scrollbar-width:thin;padding-bottom:8px';
  root.parentNode.insertBefore(wrap, root); wrap.appendChild(root);
  var hint = document.createElement('p');
  hint.style.cssText = 'margin:2px 0 0;font-size:14px;color:#6b7c93;text-align:center;display:none';
  hint.textContent = '👆 左右滑動，看看其他島嶼';
  wrap.parentNode.insertBefore(hint, wrap.nextSibling);
  var userScrolledAt = 0;
  ['touchstart', 'touchmove', 'wheel', 'mousedown'].forEach(function (t) { wrap.addEventListener(t, function () { userScrolledAt = Date.now(); }, { passive: true }); });
  // 小朋友左右滑：萌寵跑去畫面中間那座島，太快會喊累，到了會幫忙選科目
  var goal = -1, goalUntil = 0, goalArrived = false, lastTired = 0;
  wrap.addEventListener('scroll', function () {
    if (!pano || !walker || Date.now() - userScrolledAt > 2500) return;   // 不是小朋友滑的（程式自動捲動）就不理
    var center = wrap.scrollLeft + wrap.clientWidth / 2, g = 0;
    P.forEach(function (p, i) { if (Math.abs(p.x - center) < Math.abs(P[g].x - center)) g = i; });
    if (g !== goal) { goal = g; goalArrived = false; pauseUntil = 0; }
    goalUntil = Date.now() + 9000;
    if (Math.abs(pos.x - center) > wrap.clientWidth * 0.45 && Date.now() - lastTired > 3500) {
      lastTired = Date.now(); say(pick(TIRED), 1800);
    }
  }, { passive: true });
  var P = [], size = 0, pano = false;
  function layout() {
    var avail = wrap.clientWidth, wide = avail >= 760, W, gap;
    pano = !wide;
    if (wide) { W = avail; size = Math.min(235, W / 5.3); gap = (W - size) / 4; }
    else { size = Math.min(300, Math.max(210, avail * 0.74)); gap = size * 1.14; W = size + gap * 4; }
    root.style.width = W + 'px'; root.style.maxWidth = 'none';
    hint.style.display = pano ? 'block' : 'none';
    var top = size * 0.2;   // 島嶼上方留給熱氣球、彩虹等天空裝飾
    P = ISL.map(function (s, i) { return { x: size / 2 + gap * i, y: top + size * 0.6 + (i % 2 ? size * 0.13 : 0) }; });
    var H = top + size * 1.32;
    root.style.height = H + 'px';
    els.forEach(function (a, i) { a.style.width = size + 'px'; a.style.left = P[i].x + 'px'; a.style.top = P[i].y + 'px'; });
    drawBridges();
    if (window.KGSky) KGSky.placeDecor(root, P, size, geo());
    if (walker) walker.style.setProperty('--pw', Math.round(size * 0.27) + 'px');
  }
  // 給天空城裝飾用的位置資料：每座島的草地高度、每座橋的兩端與中點
  function geo() {
    var br = [];
    for (var i = 0; i < ISL.length - 1; i++) { var e = bridgeEnds(i), p = e[0], q = e[1], len = Math.hypot(q.x - p.x, q.y - p.y), sag = Math.max(12, len * 0.12); br.push({ p: p, q: q, m: { x: (p.x + q.x) / 2, y: (p.y + q.y) / 2 + sag / 2 }, len: len }); }
    return { W: parseFloat(root.style.width), H: parseFloat(root.style.height), deck: P.map(function (x, i) { return deck(i); }), br: br };
  }
  // 給天空城商店用：換吊橋、裝飾物後重畫
  window.KGIsland = { redraw: function () { if (P.length) { drawBridges(); if (window.KGSky) KGSky.placeDecor(root, P, size, geo()); } } };
  // 每座島的走道：從左緣（或上一座橋接點）到右緣，高度在草地表面
  function deck(i) { return P[i].y - size * 0.06; }
  function anchors(i) {
    var cx = P[i].x, y = deck(i), hw = size * 0.38;
    return { l: { x: cx - hw, y: y + size * 0.02 }, r: { x: cx + hw, y: y + size * 0.02 }, c: { x: cx, y: y - size * 0.02 } };
  }
  function bridgeEnds(i) {   // 第 i 座到第 i+1 座
    var A = anchors(i), B = anchors(i + 1);
    var goRight = P[i + 1].x > P[i].x;
    return goRight ? [A.r, B.l] : [A.l, B.r];
  }
  // 吊橋樣式（天空城商店買的）：木板兩色、木板框、扶手繩、吊索、木樁、特效
  var BST = {
    wood: { pl: ['#c08a52', '#a8723f'], st: '#7a4f27', rope: '#8a5a2b', hang: '#a0703f', post: '#8a5a2b' },
    flower: { pl: ['#c08a52', '#a8723f'], st: '#7a4f27', rope: '#4f9a3c', hang: '#6bb34f', post: '#8a5a2b', fl: ['#ff8fc7', '#fff', '#ffd93d'] },
    candy: { pl: ['#ff9ec7', '#ffffff'], st: '#e06b9d', rope: '#ff6fa8', hang: '#ffb3d1', post: '#ff6fa8' },
    rainbow: { pl: ['#ff6b6b', '#ffa94d', '#ffd93d', '#69db7c', '#4dabf7', '#9775fa'], st: 'rgba(255,255,255,.8)', rope: '#ffffff', hang: '#ffffff', post: '#9775fa', glow: 'rgba(255,255,255,.9)' },
    crystal: { pl: ['#d6f8ff', '#8fe3ff'], st: '#4fc3e8', rope: '#bff4ff', hang: '#d6f8ff', post: '#6fd3f0', glow: 'rgba(120,220,255,.95)', op: 0.85 },
    gold: { pl: ['#ffe066', '#f2b400'], st: '#b8860b', rope: '#d4a017', hang: '#e8b923', post: '#c99a06', glow: 'rgba(255,215,80,.95)' }
  };
  function drawBridges() {
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    var B = BST[window.KGSky ? KGSky.bridgeStyle() : 'wood'] || BST.wood;
    svg.style.filter = B.glow ? 'drop-shadow(0 0 5px ' + B.glow + ')' : '';
    for (var i = 0; i < ISL.length - 1; i++) {
      var e = bridgeEnds(i), p = e[0], q = e[1];
      var len = Math.hypot(q.x - p.x, q.y - p.y), sag = Math.max(12, len * 0.12);
      var mx = (p.x + q.x) / 2, my = (p.y + q.y) / 2 + sag;
      var g = document.createElementNS(NS, 'g');
      // 木板：沿著二次曲線
      var n = Math.max(6, Math.round(len / 14));
      for (var k = 0; k <= n; k++) {
        var t = k / n, x = (1 - t) * (1 - t) * p.x + 2 * (1 - t) * t * mx + t * t * q.x, y = (1 - t) * (1 - t) * p.y + 2 * (1 - t) * t * my + t * t * q.y;
        var dx = 2 * (1 - t) * (mx - p.x) + 2 * t * (q.x - mx), dy = 2 * (1 - t) * (my - p.y) + 2 * t * (q.y - my);
        var ang = Math.atan2(dy, dx) * 180 / Math.PI;
        var r = document.createElementNS(NS, 'rect');
        r.setAttribute('x', -6); r.setAttribute('y', -3); r.setAttribute('width', 12); r.setAttribute('height', 7); r.setAttribute('rx', 1.5);
        r.setAttribute('fill', B.pl[k % B.pl.length]); r.setAttribute('stroke', B.st); if (B.op) r.setAttribute('fill-opacity', B.op); r.setAttribute('stroke-width', 1);
        r.setAttribute('transform', 'translate(' + x.toFixed(1) + ',' + y.toFixed(1) + ') rotate(' + ang.toFixed(1) + ')');
        g.appendChild(r);
        if (k % 2 === 0 && k && k < n) {   // 吊索
          var v = document.createElementNS(NS, 'line');
          v.setAttribute('x1', x.toFixed(1)); v.setAttribute('y1', (y - 2).toFixed(1)); v.setAttribute('x2', x.toFixed(1)); v.setAttribute('y2', (y - 22).toFixed(1));
          v.setAttribute('stroke', B.hang); v.setAttribute('stroke-width', 1.4); g.insertBefore(v, g.firstChild);
        }
      }
      // 兩條扶手繩
      [-16, -26].forEach(function (off, j) {
        var path = document.createElementNS(NS, 'path');
        path.setAttribute('d', 'M' + p.x + ',' + (p.y + off) + ' Q' + mx + ',' + (my + off + (j ? 6 : 3)) + ' ' + q.x + ',' + (q.y + off));
        path.setAttribute('fill', 'none'); path.setAttribute('stroke', B.rope); path.setAttribute('stroke-width', j ? 2 : 2.6); path.setAttribute('stroke-linecap', 'round');
        g.appendChild(path);
      });
      // 橋頭木樁
      [p, q].forEach(function (o) {
        var post = document.createElementNS(NS, 'rect');
        post.setAttribute('x', o.x - 3.5); post.setAttribute('y', o.y - 30); post.setAttribute('width', 7); post.setAttribute('height', 34); post.setAttribute('rx', 3);
        post.setAttribute('fill', B.post); g.appendChild(post);
      });
      if (B.fl) for (var f = 1; f < 12; f++) {   // 花藤：扶手繩上的小花
        var tt = f / 12, fx = (1 - tt) * (1 - tt) * p.x + 2 * (1 - tt) * tt * mx + tt * tt * q.x, fy = (1 - tt) * (1 - tt) * (p.y - 16) + 2 * (1 - tt) * tt * (my - 13) + tt * tt * (q.y - 16);
        var fc = document.createElementNS(NS, 'circle'); fc.setAttribute('cx', fx.toFixed(1)); fc.setAttribute('cy', fy.toFixed(1)); fc.setAttribute('r', 3.6);
        fc.setAttribute('fill', B.fl[f % B.fl.length]); fc.setAttribute('stroke', '#e0609b'); fc.setAttribute('stroke-width', .8); g.appendChild(fc);
      }
      g.dataset.p = JSON.stringify([p, { x: mx, y: my }, q]);
      svg.appendChild(g);
    }
  }

  // 萌寵：從第 1 座島走到第 5 座，再走回來
  var walker = null, bub, img, route = [], seg = 0, dir = 1, pos = null, raf = 0, pauseUntil = 0, lastT = 0;
  function petImg() {
    var K = window.KGPet; if (!K) return { src: 'pets/honey/wave.webp', walk: 'pets/honey/cheer.webp', name: '蜜蜜' };
    var d = K.get(), p = (d.active && K.pet(d.active)) || K.pet('honey') || K.PETS[0];
    var st = p.stages[0].img;
    return { src: K.url(p.poses ? p.poses.wave : st), walk: K.url(p.poses ? (p.poses.run || p.poses.cheer) : st), name: p.name, pet: p };
  }
  // 路線點：島i 左→中→右，接橋（曲線取樣）
  var stopIdx = [];
  function buildRoute() {
    route = []; stopIdx = [];
    for (var i = 0; i < ISL.length; i++) {
      var A = anchors(i);
      var into = i ? bridgeEnds(i - 1)[1] : (P[1].x > P[0].x ? A.l : A.r);
      var out = i < ISL.length - 1 ? bridgeEnds(i)[0] : (P[i].x > P[i - 1].x ? A.r : A.l);
      route.push({ x: into.x, y: into.y }); stopIdx[i] = route.length; route.push({ x: A.c.x, y: A.c.y, stop: i }); route.push({ x: out.x, y: out.y });
      if (i < ISL.length - 1) {
        var e = bridgeEnds(i), p = e[0], q = e[1], len = Math.hypot(q.x - p.x, q.y - p.y), sag = Math.max(12, len * 0.12);
        var mx = (p.x + q.x) / 2, my = (p.y + q.y) / 2 + sag;
        for (var k = 1; k < 10; k++) { var t = k / 10; route.push({ x: (1 - t) * (1 - t) * p.x + 2 * (1 - t) * t * mx + t * t * q.x, y: (1 - t) * (1 - t) * p.y + 2 * (1 - t) * t * my + t * t * q.y - 5 }); }
      }
    }
  }
  function say(t, ms) { bub.textContent = t; bub.classList.add('on'); clearTimeout(bub._t); bub._t = setTimeout(function () { bub.classList.remove('on'); }, ms || 2200); }
  var LINES = ['這裡是{n}島！一起去{s}闖關吧！', '{s}好漂亮喔～點我旁邊的島就能進去！', '下一站，{n}！', '我最喜歡{n}了！你呢？'];
  var TIRED = ['你跑慢點啦～我快累死了！', '等等我！我的腿比較短啦！', '呼…呼…你滑太快了！', '慢一點～我追不上了！', '咻～我來了我來了！'];
  var PICK = ['這裡是{n}島！要進去{s}嗎？點一下島就出發！', '你決定要去哪一座島了嗎？選好就點下去吧！', '{n}島到了！今天想挑戰{n}嗎？',
    '要不要從{n}開始？我陪你一起闖關！', '還在想嗎？左右滑一滑，選一座最想去的島！', '{s}裡面有好多關卡等你喔！'];
  function pick(a) { return a[Math.floor(Math.random() * a.length)]; }
  function fill(t, s) { return t.replace(/\{n\}/g, s.name).replace(/\{s\}/g, s.sub); }
  function startWalker() {
    walker = document.createElement('div'); walker.id = 'isl-walker'; walker.setAttribute('role', 'button'); walker.title = '點我換萌寵';
    walker.innerHTML = '<span class="bub"></span><img alt="">';
    bub = walker.querySelector('.bub'); img = walker.querySelector('img');
    walker.addEventListener('click', function () { if (window.KGPet) KGPet.picker(); });
    root.appendChild(walker);
    walker.style.setProperty('--pw', Math.round(size * 0.27) + 'px');
    refreshPet();
    setTimeout(function () { var mp = walker._p.pet; if (mp && mp.hi) say(pick(mp.hi), 3000); }, 1500);
    buildRoute(); seg = 0; dir = 1; pos = { x: route[0].x, y: route[0].y };
    place();
    if (!RM) raf = requestAnimationFrame(tick);
    else { pos = route[1]; place(); walker.classList.add('rest'); }
  }
  function refreshPet() { var p = petImg(); walker._p = p; img.src = walker.classList.contains('rest') ? p.src : p.walk; img.alt = p.name; }
  function place() { walker.style.left = pos.x + 'px'; walker.style.top = pos.y + 'px'; }
  function tick(t) {
    raf = requestAnimationFrame(tick);
    var dt = Math.min(50, t - (lastT || t)); lastT = t;
    var chasing = goal >= 0 && Date.now() < goalUntil;
    if (goal >= 0 && !chasing) goal = -1;   // 小朋友很久沒滑了：回去來回散步
    if (t < pauseUntil && !chasing) return;
    var mult = 1;
    if (chasing) {
      var gi = stopIdx[goal];
      if (seg === gi) {                      // 跑到了：停下來幫忙選科目
        if (!goalArrived) {
          goalArrived = true; goalUntil = Date.now() + 12000;
          walker.classList.add('rest'); img.src = walker._p.src;
          say(fill(pick(PICK), ISL[goal]), 3200);
        }
        return;
      }
      dir = gi > seg ? 1 : -1;
      mult = Math.abs(pos.x - P[goal].x) > wrap.clientWidth * 0.5 ? 3.4 : 2;   // 落後很多就衝刺
    }
    if (walker.classList.contains('rest')) { walker.classList.remove('rest'); img.src = walker._p.walk; }
    var target = route[seg + dir]; if (!target) { dir = -dir; target = route[seg + dir]; }
    var speed = size * 0.0011 * dt * mult;   // 每毫秒移動距離（跟島的大小成比例）
    var dx = target.x - pos.x, dy = target.y - pos.y, dist = Math.hypot(dx, dy);
    if (Math.abs(dx) > 0.5) walker.classList.toggle('left', dx < 0);
    if (dist <= speed) {
      pos = { x: target.x, y: target.y }; seg += dir;
      if (target.stop !== undefined && !chasing) {       // 散步到島中央：停下來說話
        var s = ISL[target.stop];
        pauseUntil = t + 2600; walker.classList.add('rest'); img.src = walker._p.src;
        var mp = walker._p.pet, own = mp && [].concat(mp.cheer || mp.praise || [], mp.facts || [], mp.tap || []);
        if (own && own.length && Math.random() < 0.55) { pauseUntil = t + 3400; say(pick(own), 3200); }   // 每隻萌寵自己的話
        else say(fill(pick(LINES), s), 2400);
      }
      if (!chasing && (seg === 0 || seg === route.length - 1)) dir = -dir;
    } else { pos = { x: pos.x + dx / dist * speed, y: pos.y + dy / dist * speed }; }
    place();
    // 手機長條：小朋友 6 秒沒有自己滑、也不在追島嶼時，就慢慢跟著萌寵捲動
    if (pano && !chasing && Date.now() - userScrolledAt > 6000) {
      var want = pos.x - wrap.clientWidth / 2, cur = wrap.scrollLeft;
      if (Math.abs(want - cur) > 2) wrap.scrollLeft = cur + (want - cur) * 0.06;
    }
  }

  layout();
  var rz; addEventListener('resize', function () { clearTimeout(rz); rz = setTimeout(function () { layout(); if (walker) { buildRoute(); seg = Math.min(seg, route.length - 1); pos = { x: route[seg].x, y: route[seg].y }; place(); } }, 150); });
  function boot() { if (!walker) startWalker(); }
  if (document.readyState === 'complete') setTimeout(boot, 300); else addEventListener('load', function () { setTimeout(boot, 300); });
  var prevChange = window.onKGPetChange;
  window.onKGPetChange = function () { if (typeof prevChange === 'function') prevChange(); if (walker) refreshPet(); };
})();

// 💎 天空城晶幣與商店（首頁用）
// 公平算法：每個「年級×學期」闖滿＝1000 晶幣，不管年級、版本、關卡數多少都一樣。
//   一、二年級：數學、國文各 500；三～六年級：數學、自然、社會、國文各 250。
//   每科拿到的晶幣＝該科份額 ×（拿到的關卡星星 ÷ 這一冊滿分星星），所以關卡多的版本每顆星比較便宜。
//   闖其他年級也能賺（每個學期各自最多 1000），全部商品加起來大約＝12 個學期都闖滿。
// 星星來源：數學、自然、社會讀家長報表（kg-report-v1，月考測驗卷不算）；國文讀 guoyu-island-v3。
// 晶幣只增不減（存最高紀錄 kg-sky-v1.best），買東西扣 spent。換孩子時 kg-profile.js 會整包切換。
(function () {
  if (window.KGSky) return;
  var KEY = 'kg-sky-v1', VER = ['nani', 'kang', 'han'], GR = ['', '一', '二', '三', '四', '五', '六'];
  var BASE = '';   // 只在首頁用，圖片用相對路徑 sky/…
  // 每一冊闖滿的星星數（南一、康軒、翰林），2026-11-08 實際打開每個遊戲讀出來的
  var MAX = {
    'math5a-lab/grade1': [108, 132, 132], 'math5a-lab/grade1-2': [81, 90, 81], 'math5a-lab/grade2': [90, 108, 99], 'math5a-lab/grade2-2': [120, 132, 132],
    'math5a-lab/grade3': [108, 132, 120], 'math5a-lab/grade3-2': [90, 90, 81], 'math5a-lab/grade4': [90, 108, 108], 'math5a-lab/grade4-2': [120, 120, 120],
    'math5a-lab/grade5': [120, 132, 132], 'math5a-lab/grade5-2': [90, 99, 99], 'math5a-lab/grade6': [72, 90, 75], 'math5a-lab/grade6-2': [87, 87, 84],
    'science5-quest/grade3': [36, 60, 36], 'science5-quest/grade3-2': [36, 48, 57], 'science5-quest/grade4': [36, 42, 51], 'science5-quest/grade4-2': [36, 45, 48],
    'science5-quest/grade5': [42, 45, 51], 'science5-quest/grade5-2': [36, 48, 33], 'science5-quest/grade6': [39, 42, 48], 'science5-quest/grade6-2': [30, 39, 33],
    'social-puzzle/grade3-2': [54, 57, 54], 'social-puzzle/grade4': [60, 66, 72], 'social-puzzle/grade4-2': [45, 48, 57], 'social-puzzle/grade5': [81, 78, 60],
    'social-puzzle/grade5-2': [51, 63, 45], 'social-puzzle/grade6': [75, 57, 45], 'social-puzzle/grade6-2': [54, 63, 45]
  };
  var REPO = { math: 'math5a-lab', science: 'science5-quest', social: 'social-puzzle' };
  var SNAME = { math: '數學', science: '自然', social: '社會', chinese: '國文' };
  // 國文每冊課數（南一、康軒、翰林）；沒列的當 12 課
  var GUOYU_N = { '1上': [8, 6, 7] };

  // ---------- 商品 ----------
  // 價格比例：自己這學期闖滿（1000）大約可以買 1 個大獎或好幾個小東西；傳說級要闖 2 個學期以上
  var SHOP = {
    sky: [
      { id: 'day', name: '晴朗藍天', price: 0, sw: 'linear-gradient(180deg,#8fd0ff,#c9ecff 50%,#fff2dc)' },
      { id: 'sunset', name: '橘子夕陽', price: 200, sw: 'linear-gradient(180deg,#ff9a6b,#ffc78a 45%,#ffe9c7)' },
      { id: 'candy', name: '棉花糖粉天', price: 300, sw: 'linear-gradient(180deg,#ffb3d9,#e3c4ff 50%,#fff0f7)' },
      { id: 'night', name: '星星夜空', price: 450, sw: 'linear-gradient(180deg,#14204a,#2c3e7a 55%,#5b6fb0)', dark: 1 },
      { id: 'aurora', name: '極光之夜', price: 800, sw: 'linear-gradient(180deg,#071a2e,#123e4f 45%,#2a6b6b)', dark: 1 },
      { id: 'galaxy', name: '傳說・銀河星海', price: 1800, sw: 'linear-gradient(180deg,#1a0b3a,#3b1f73 45%,#7a3fa0)', dark: 1, legend: 1 }
    ],
    bridge: [
      { id: 'wood', name: '木頭吊橋', price: 0 },
      { id: 'flower', name: '花藤吊橋', price: 250 },
      { id: 'candy', name: '糖果吊橋', price: 350 },
      { id: 'rainbow', name: '彩虹吊橋', price: 600 },
      { id: 'crystal', name: '水晶吊橋', price: 900 },
      { id: 'gold', name: '傳說・黃金吊橋', price: 1600, legend: 1 }
    ],
    // 裝飾物：img 在 sky/<id>.webp；spot＝放在哪座島旁邊（i 第幾座、dx/dy 以島的大小為單位、w 寬度）
    decor: [
      { id: 'flowers', name: '小花叢', price: 60, desc: '每座島都種一叢', spot: { i: 0, dx: -0.3, dy: 0.2, w: 0.28 } },
      { id: 'lanterns', name: '小燈籠串', price: 100, desc: '掛在每座吊橋上', spot: { i: 3, dx: 0.02, dy: -0.52, w: 0.42 } },
      { id: 'balloons', name: '氣球束', price: 120, desc: '綁在吊橋的橋柱上', spot: { i: 1, dx: 0.4, dy: -0.38, w: 0.26 } },
      { id: 'windmill', name: '風車小屋', price: 250, desc: '蓋在數學島旁邊', spot: { i: 2, dx: 0.42, dy: 0.12, w: 0.32 } },
      { id: 'airballoon', name: '熱氣球', price: 300, desc: '在天空慢慢飄', spot: { i: 1, dx: -0.14, dy: -0.6, w: 0.34, back: 1 } },
      { id: 'rainbow', name: '彩虹', price: 350, desc: '從自然島跨到數學島', spot: { i: 2, dx: 0, dy: -0.45, w: 0.66, back: 1 } },
      { id: 'airship', name: '小飛船', price: 700, desc: '在天空到處飛來飛去', spot: { i: 0, dx: 0.52, dy: -0.5, w: 0.38, back: 1 } },
      { id: 'whale', name: '天空鯨魚', price: 900, desc: '在天上游來游去', spot: { i: 4, dx: -0.46, dy: -0.52, w: 0.46, back: 1 } },
      { id: 'tower', name: '傳說・星星水晶塔', price: 2000, desc: '蓋在英文島旁邊，會發光', spot: { i: 4, dx: 0.3, dy: 0.08, w: 0.32 }, legend: 1 }
    ]
  };
  function item(kind, id) { return SHOP[kind].filter(function (x) { return x.id === id; })[0]; }

  function load() { try { return Object.assign({ best: {}, spent: 0, owned: {}, eq: { sky: 'day', bridge: 'wood', decor: {} } }, JSON.parse(localStorage.getItem(KEY)) || {}); } catch (e) { return { best: {}, spent: 0, owned: {}, eq: { sky: 'day', bridge: 'wood', decor: {} } }; } }
  function save(d) { try { localStorage.setItem(KEY, JSON.stringify(d)); } catch (e) {} }
  function jget(k) { try { return JSON.parse(localStorage.getItem(k)) || {}; } catch (e) { return {}; } }

  // ---------- 算晶幣 ----------
  function sems() { var a = []; for (var g = 1; g <= 6; g++) ['上', '下'].forEach(function (s) { a.push({ g: g, s: s, key: g + s, subj: g <= 2 ? ['math', 'chinese'] : ['math', 'science', 'social', 'chinese'] }); }); return a; }
  function progress() {
    var rep = (jget('kg-report-v1').games) || {}, setup = jget('kg-setup-v1'), gy = jget('guoyu-island-v3').stars || {};
    var out = [];
    sems().forEach(function (S) {
      var share = 1000 / S.subj.length, row = { key: S.key, g: S.g, s: S.s, name: GR[S.g] + S.s, subj: [], coins: 0, made: 0 };
      S.subj.forEach(function (sj) {
        var pct = 0, made = false;
        if (sj === 'chinese') {
          var cnt = GUOYU_N[S.key] || [12, 12, 12];
          if (S.s === '上') made = true;   // 國文目前只有上學期（注音島、加強練習的 id 沒分上下，先只算上學期）
          if (made) VER.forEach(function (v, vi) {
            // 關卡：課文 + 一年級注音島 5 關 + 三年級以上加強練習 6 關 + 五六年級閱讀 3 關（國語視窗 2026-11-08 提供）
            var sum = 0, n = cnt[vi] + (S.g === 1 ? 5 : 0) + (S.g >= 3 ? 6 : 0) + (S.g >= 5 ? 3 : 0);
            var re = new RegExp('^(' + v + '-' + S.g + S.s + '-|' + S.g + '-' + v + '-(pr|read)-' + (S.g === 1 ? '|g1-zy-' : '') + ')');
            Object.keys(gy).forEach(function (id) { if (re.test(id)) sum += Math.min(3, +gy[id] || 0); });
            pct = Math.max(pct, sum / (n * 3));
          });
        } else {
          var id = REPO[sj] + '/grade' + S.g + (S.s === '下' ? '-2' : ''), mx = MAX[id];
          if (mx) {
            made = true;
            var v = (setup[sj] && setup[sj].version) || 'nani', g = rep[id], sum = 0;
            if (g && g.levels) Object.keys(g.levels).forEach(function (n) { if (!/^📝/.test(n)) sum += Math.min(3, +g.levels[n].stars || 0); });
            pct = sum / mx[Math.max(0, VER.indexOf(v))];
          }
        }
        pct = Math.min(1, pct);
        var c = Math.floor(share * pct + 1e-9);
        row.subj.push({ id: sj, name: SNAME[sj], share: Math.round(share), coins: c, made: made });
        row.coins += c; if (made) row.made += Math.round(share);
      });
      out.push(row);
    });
    return out;
  }
  // 晶幣只增不減：每科存最高紀錄
  function sync() {
    var d = load(), changed = false;
    progress().forEach(function (r) { r.subj.forEach(function (x) { var k = r.key + x.id; if ((d.best[k] || 0) < x.coins) { d.best[k] = x.coins; changed = true; } }); });
    if (changed) save(d);
    return d;
  }
  function earned(d) { var t = 0; Object.keys(d.best).forEach(function (k) { t += d.best[k]; }); return t; }
  function balance() { var d = sync(); return earned(d) - (d.spent || 0); }

  function buy(kind, id) {
    var it = item(kind, id), d = sync(); if (!it) return false;
    var k = kind + ':' + id;
    if (d.owned[k] || !it.price) return true;
    if (earned(d) - d.spent < it.price) return false;
    d.spent += it.price; d.owned[k] = Date.now(); save(d); return true;
  }
  function owns(d, kind, id) { var it = item(kind, id); return !!it && (!it.price || !!d.owned[kind + ':' + id]); }
  function equip(kind, id, on) {
    var d = load(); if (!owns(d, kind, id)) return;
    if (kind === 'decor') { d.eq.decor = d.eq.decor || {}; if (on) d.eq.decor[id] = 1; else delete d.eq.decor[id]; }
    else d.eq[kind] = id;
    save(d); apply();
  }

  // ---------- 套到首頁 ----------
  var css = document.createElement('style');
  css.textContent =
    'html[data-sky] body{transition:background .6s}' +
    'html[data-sky=sunset] body{background:linear-gradient(180deg,#ff9a6b 0%,#ffc78a 40%,#ffe9c7 100%) fixed}' +
    'html[data-sky=candy] body{background:linear-gradient(180deg,#ffb3d9 0%,#e3c4ff 45%,#fff0f7 100%) fixed}' +
    'html[data-sky=night] body{background:linear-gradient(180deg,#14204a 0%,#2c3e7a 55%,#5b6fb0 100%) fixed}' +
    'html[data-sky=aurora] body{background:linear-gradient(180deg,#071a2e 0%,#123e4f 45%,#2a6b6b 100%) fixed}' +
    'html[data-sky=galaxy] body{background:linear-gradient(180deg,#1a0b3a 0%,#3b1f73 45%,#7a3fa0 100%) fixed}' +
    'html.sky-dark .sub,html.sky-dark .note,html.sky-dark footer,html.sky-dark #sky-wrap+p{color:#eef3ff!important;text-shadow:0 1px 3px rgba(0,0,0,.5)}' +
    'html.sky-dark .cloud{opacity:.35}' +
    '#sky-fx{position:fixed;inset:0;z-index:-1;pointer-events:none;overflow:hidden}' +
    '#sky-fx i{position:absolute;width:3px;height:3px;border-radius:50%;background:#fff;box-shadow:0 0 6px #fff;animation:skyTw 2.6s ease-in-out infinite}' +
    '#sky-fx .au{position:absolute;left:-20%;width:140%;height:38%;filter:blur(30px);opacity:.55;border-radius:50%;animation:skyAu 12s ease-in-out infinite alternate}' +
    '#sky-fx .mw{position:absolute;left:-10%;top:10%;width:120%;height:45%;transform:rotate(-14deg);background:radial-gradient(ellipse at center,rgba(255,220,255,.35),rgba(170,140,255,.18) 40%,transparent 70%);filter:blur(8px)}' +
    '@keyframes skyTw{0%,100%{opacity:.25;transform:scale(.7)}50%{opacity:1;transform:scale(1.2)}}' +
    '@keyframes skyAu{0%{transform:translateX(-6%) skewX(-8deg)}100%{transform:translateX(6%) skewX(8deg)}}' +
    '.sky-dec{position:absolute;pointer-events:none;z-index:2;transform-origin:50% 100%}' +
    '.sky-dec.swing img{transform-origin:50% 0;animation:skySwing 3.4s ease-in-out infinite}' +
    '.sky-dec.sway img{transform-origin:50% 100%;animation:skySway 3s ease-in-out infinite}' +
    '.sky-dec.glow img{animation:skyGlow 2.4s ease-in-out infinite}' +
    '.sky-dec.back{z-index:0}.sky-dec.front{z-index:3}' +
    '.sky-dec img{width:100%;height:auto;display:block;filter:drop-shadow(0 8px 8px rgba(40,60,110,.22))}' +
    '@keyframes skySwing{0%,100%{rotate:-2deg}50%{rotate:2deg}}' +
    '@keyframes skySway{0%,100%{rotate:-4deg}50%{rotate:4deg}}' +
    '@keyframes skyGlow{0%,100%{filter:drop-shadow(0 0 4px rgba(200,150,255,.6))}50%{filter:drop-shadow(0 0 16px rgba(255,220,120,.95))}}' +
    '@media (prefers-reduced-motion:reduce){#sky-fx i,#sky-fx .au,.sky-dec,.sky-dec img{animation:none!important}}' +
    // 商店
    '#sky-shop{position:fixed;inset:0;z-index:2147482000;background:rgba(20,30,60,.55);display:grid;place-items:center;padding:12px;font-family:"Microsoft JhengHei","PingFang TC","Noto Sans TC",sans-serif;color:#2b2b2b}' +
    '#sky-shop .bx{background:#fffdf7;border-radius:26px;width:min(820px,100%);max-height:92vh;overflow:auto;padding:16px 16px 20px;box-shadow:0 20px 50px rgba(0,0,0,.3)}' +
    '#sky-shop .hd{display:flex;align-items:center;gap:10px;flex-wrap:wrap}#sky-shop h2{margin:0;font-size:24px;color:#6c4ad6}' +
    '#sky-shop .bal{margin-left:auto;font-weight:900;font-size:22px;color:#fff;background:linear-gradient(#8a6cff,#5b3fd6);padding:6px 16px;border-radius:999px}' +
    '#sky-shop .x{font:inherit;font-size:22px;border:none;background:#eee;border-radius:50%;width:40px;height:40px;cursor:pointer}' +
    '#sky-shop .tabs{display:flex;gap:6px;margin:12px 0;flex-wrap:wrap}#sky-shop .tabs button{font:inherit;font-weight:800;font-size:16px;padding:8px 14px;border-radius:999px;border:2px solid #d9cff8;background:#fff;cursor:pointer;color:#5b3fd6}' +
    '#sky-shop .tabs button.on{background:#6c4ad6;color:#fff;border-color:#6c4ad6}' +
    '#sky-shop .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:12px}' +
    '#sky-shop .it{border:3px solid #ece4ff;border-radius:18px;padding:10px;display:grid;gap:6px;justify-items:center;text-align:center;background:#fff}' +
    '#sky-shop .it.legend{border-color:#ffcf4a;background:linear-gradient(#fffbe8,#fff)}' +
    '#sky-shop .pv{width:100%;aspect-ratio:4/3;border-radius:12px;display:grid;place-items:center;overflow:hidden;background:#eef6ff}' +
    '#sky-shop .pv img{max-width:88%;max-height:88%}' +
    '#sky-shop .nm{font-weight:900;font-size:16px}#sky-shop .pr{font-weight:800;color:#6c4ad6}' +
    '#sky-shop .it button{font:inherit;font-weight:800;font-size:15px;padding:6px 14px;border-radius:999px;border:none;cursor:pointer;background:#6c4ad6;color:#fff;min-height:36px}' +
    '#sky-shop .it button.use{background:#23a55a}#sky-shop .it button.off{background:#aaa}#sky-shop .it button[disabled]{background:#ddd;color:#888;cursor:default}' +
    '#sky-shop .need{font-size:13px;color:#999}' +
    '#sky-shop .tip{background:#f3efff;border-radius:14px;padding:10px 12px;font-size:15px;line-height:1.6;margin-bottom:10px}' +
    '#sky-shop .sem{display:grid;grid-template-columns:52px 1fr auto;gap:8px;align-items:center;padding:6px 0;border-bottom:1px dashed #e6def8}' +
    '#sky-shop .sem b{font-size:17px}#sky-shop .bar{height:14px;border-radius:999px;background:#eee;overflow:hidden}#sky-shop .bar i{display:block;height:100%;background:linear-gradient(90deg,#8a6cff,#ff7ac8)}' +
    '#sky-shop .sem small{grid-column:2/4;color:#777;font-size:13px}#sky-shop .sem.me{background:#fff8dc;border-radius:10px;padding:6px}';
  document.head.appendChild(css);

  function apply() {
    var d = load(), sk = item('sky', d.eq.sky) && owns(d, 'sky', d.eq.sky) ? d.eq.sky : 'day', it = item('sky', sk);
    var html = document.documentElement;
    if (sk === 'day') html.removeAttribute('data-sky'); else html.setAttribute('data-sky', sk);
    html.classList.toggle('sky-dark', !!it.dark);
    var fx = document.getElementById('sky-fx'); if (fx) fx.remove();
    if (it.dark) {
      fx = document.createElement('div'); fx.id = 'sky-fx'; fx.setAttribute('aria-hidden', 'true');
      var h = '';
      if (sk === 'aurora') h += '<div class="au" style="top:2%;background:linear-gradient(90deg,transparent,#3dffb0,#38c8ff,transparent)"></div><div class="au" style="top:18%;animation-delay:-5s;background:linear-gradient(90deg,transparent,#a66bff,#3dffb0,transparent)"></div>';
      if (sk === 'galaxy') h += '<div class="mw"></div>';
      var n = sk === 'night' ? 70 : 90;
      for (var k = 0; k < n; k++) h += '<i style="left:' + (Math.random() * 100).toFixed(1) + '%;top:' + (Math.random() * 85).toFixed(1) + '%;animation-delay:' + (-Math.random() * 3).toFixed(2) + 's;' + (k % 9 === 0 ? 'width:5px;height:5px' : '') + (sk === 'galaxy' && k % 4 === 0 ? ';background:#ffd6ff;box-shadow:0 0 8px #ff9df5' : '') + '"></i>';
      fx.innerHTML = h; document.body.appendChild(fx);
    }
    if (window.KGIsland) KGIsland.redraw();
  }
  // 由 islands.js 在排版時呼叫：裝飾物要跟島、吊橋連在一起（種在草地上、掛在橋上、綁在橋柱上），會飛的就在天空飛
  // ax/ay＝圖片的哪一點對準位置（0.5,1＝底部中間踩在地上）
  var flyers = [], flyRaf = 0;
  function put(root, id, x, y, w, ax, ay, cls, delay, flip) {
    var e = document.createElement('div'); e.className = 'sky-dec ' + id + (cls ? ' ' + cls : '');
    e.style.left = x + 'px'; e.style.top = y + 'px'; e.style.width = w + 'px';
    e.style.transform = 'translate(' + (-ax * 100) + '%,' + (-ay * 100) + '%)' + (flip ? ' scaleX(-1)' : '');
    e.style.animationDelay = (delay || 0) + 's';
    e.innerHTML = '<img src="' + BASE + 'sky/' + id + '.webp" alt="">';
    root.appendChild(e); return e;
  }
  function placeDecor(root, P, size, G) {
    root.querySelectorAll('.sky-dec').forEach(function (e) { e.remove(); });
    flyers = []; cancelAnimationFrame(flyRaf);
    var d = load(), on = d.eq.decor || {}, has = function (id) { return on[id] && owns(d, 'decor', id); };
    if (!G || !P.length) return;
    var n = P.length, br = G.br;
    // 小花叢：每座島的草地前緣都種一叢
    if (has('flowers')) P.forEach(function (p, i) { put(root, 'flowers', p.x + (i % 2 ? 0.27 : -0.27) * size, G.deck[i] + size * 0.17, size * 0.17, 0.5, 0.85, 'front', -i * 0.6, i % 2); });
    // 小燈籠串：掛在每一座吊橋的扶手繩下面
    if (has('lanterns')) br.forEach(function (b, i) { var e = put(root, 'lanterns', b.m.x, b.m.y - 24, b.len * 0.62, 0.5, 0.2, 'front swing', -i * 0.8); e.style.transform += ' rotate(' + (Math.atan2(b.q.y - b.p.y, b.q.x - b.p.x) * 57.3).toFixed(1) + 'deg)'; });
    // 氣球束：綁在吊橋的橋柱上（繩子末端對準柱頂）
    if (has('balloons')) [[0, 'p'], [1, 'q'], [2, 'p'], [3, 'q']].forEach(function (a, k) { var b = br[a[0]]; if (!b) return; var o = b[a[1]]; put(root, 'balloons', o.x, o.y - 28, size * 0.15, 0.46, 0.97, 'front sway', -k * 1.1, k % 2); });
    // 風車小屋：蓋在數學島（蒸汽城堡）旁邊的草地上
    if (has('windmill') && P[2]) put(root, 'windmill', P[2].x - size * 0.3, G.deck[2] + size * 0.15, size * 0.25, 0.5, 0.92, 'front', -1.2);
    // 星星水晶塔：蓋在英文島（魔法學院）旁邊
    if (has('tower') && P[n - 1]) put(root, 'tower', P[n - 1].x + size * 0.31, G.deck[n - 1] + size * 0.13, size * 0.27, 0.5, 0.95, 'front glow', -0.5);
    // 彩虹：從自然島跨到數學島的天上，兩端的雲落在兩座島上
    if (has('rainbow') && P[2]) {
      var x1 = P[1].x, x2 = P[2].x, w = (x2 - x1) * 1.25, foot = Math.min(P[1].y, P[2].y) - size * 0.1, h = Math.min(w * 0.8, foot - 4);
      var e = put(root, 'rainbow', (x1 + x2) / 2, foot, w, 0.5, 1, 'back still'); e.querySelector('img').style.height = h + 'px'; e.querySelector('img').style.objectFit = 'fill';
    }
    // 會飛的：熱氣球慢慢飄過天空、小飛船到處亂飛、鯨魚在天上游來游去
    var fly = function (id, w, speed, mode) {
      var e = put(root, id, 0, 0, w, 0.5, 0.5, 'back flyer');
      var f = { e: e, w: w, sp: speed, mode: mode, x: Math.random() * G.W, y: G.H * (0.15 + Math.random() * 0.3), tx: 0, ty: 0, dir: 1, t: Math.random() * 6 };
      pick(f); flyers.push(f);
    };
    function pick(f) {   // 下一個要飛去的點
      if (f.mode === 'wander') { f.tx = size * 0.2 + Math.random() * (G.W - size * 0.4); f.ty = G.H * (0.08 + Math.random() * 0.45); }
      else if (f.mode === 'swim') { f.tx = f.x < G.W / 2 ? G.W - size * 0.3 : size * 0.3; f.ty = G.H * (0.12 + Math.random() * 0.25); }
      else { f.tx = f.x + (Math.random() < 0.5 ? -1 : 1) * G.W * 0.4; f.tx = Math.max(size * 0.2, Math.min(G.W - size * 0.2, f.tx)); f.ty = G.H * (0.06 + Math.random() * 0.3); }
    }
    if (has('airballoon')) fly('airballoon', size * 0.28, 12, 'drift');
    if (has('airship')) fly('airship', size * 0.36, 48, 'wander');
    if (has('whale')) fly('whale', size * 0.42, 26, 'swim');
    if (!flyers.length) return;
    var RM = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches, last = 0;
    function draw(f) {
      var bob = Math.sin(f.t * (f.mode === 'swim' ? 1.4 : 1)) * (f.mode === 'drift' ? 6 : 9);
      f.e.style.left = f.x + 'px'; f.e.style.top = (f.y + bob) + 'px';
      f.e.style.transform = 'translate(-50%,-50%) scaleX(' + (f.mode === 'drift' ? 1 : f.dir) + ')' + (f.mode === 'wander' ? ' rotate(' + (Math.sin(f.t * 1.7) * 4).toFixed(1) + 'deg)' : '');
    }
    flyers.forEach(draw);
    if (RM) return;
    (function step(ts) {
      var dt = Math.min(0.05, (ts - (last || ts)) / 1000); last = ts;
      flyers.forEach(function (f) {
        f.t += dt;
        var dx = f.tx - f.x, dy = f.ty - f.y, dist = Math.hypot(dx, dy), v = f.sp * (size / 220) * dt;
        if (dist < 4) pick(f); else { f.x += dx / dist * v; f.y += dy / dist * v; }
        if (Math.abs(dx) > 2) f.dir = f.e.classList.contains('whale') ? (dx < 0 ? 1 : -1) : (dx < 0 ? -1 : 1);   // 鯨魚圖頭朝左、飛船圖頭朝右
        draw(f);
      });
      flyRaf = requestAnimationFrame(step);
    })(0);
  }
  // 吊橋樣式（islands.js 畫橋時讀）
  function bridgeStyle() { var d = load(); return owns(d, 'bridge', d.eq.bridge) ? d.eq.bridge : 'wood'; }

  // ---------- 商店畫面 ----------
  var BRIDGE_PV = {
    wood: ['#c08a52', '#a8723f', '#8a5a2b'], flower: ['#c08a52', '#a8723f', '#5aa64a'], candy: ['#ff9ec7', '#fff', '#ff6fa8'],
    rainbow: ['#ff6b6b', '#ffd93d', '#fff'], crystal: ['#bdf3ff', '#8fe3ff', '#c9f6ff'], gold: ['#ffd54a', '#f2b400', '#d4a017']
  };
  function bridgePreview(id) {
    var c = BRIDGE_PV[id], s = '<svg viewBox="0 0 160 90" width="100%"><path d="M10,34 Q80,58 150,34" stroke="' + c[2] + '" stroke-width="3" fill="none"/>';
    var rb = ['#ff6b6b', '#ffa94d', '#ffd93d', '#69db7c', '#4dabf7', '#9775fa'];
    for (var k = 0; k <= 10; k++) { var t = k / 10, x = 10 + 140 * t, y = 50 + 4 * 24 * t * (1 - t); s += '<rect x="' + (x - 6) + '" y="' + (y - 3) + '" width="12" height="8" rx="2" fill="' + (id === 'rainbow' ? rb[k % 6] : (k % 2 ? c[0] : c[1])) + '" stroke="rgba(0,0,0,.25)"/>'; if (id === 'flower' && k % 2) s += '<circle cx="' + x + '" cy="' + (y - 18) + '" r="3.5" fill="' + (k % 4 === 1 ? '#ff8fc7' : '#fff') + '"/>'; }
    if (id === 'crystal' || id === 'gold') s += '<text x="120" y="22" font-size="16">✨</text><text x="30" y="26" font-size="12">✨</text>';
    return s + '</svg>';
  }
  var tab = 'sky';
  function myGrade() { var s = jget('kg-setup-v1'), m = s.math || s.science || s.social || {}; return m.grade ? m.grade + (m.sem || '上') : ''; }
  function openShop(startTab) {
    if (startTab) tab = startTab;
    var old = document.getElementById('sky-shop'); if (old) old.remove();
    var box = document.createElement('div'); box.id = 'sky-shop'; box.setAttribute('role', 'dialog'); box.setAttribute('aria-label', '天空城商店');
    document.body.appendChild(box);
    function draw() {
      var d = sync(), bal = earned(d) - d.spent, h = '<div class="bx"><div class="hd"><h2>🏰 天空城商店</h2><span class="bal">💎 ' + bal + ' 晶幣</span><button class="x" type="button" aria-label="關閉">✕</button></div>' +
        '<div class="tabs">' + [['sky', '🌅 天空'], ['bridge', '🌉 吊橋'], ['decor', '🎈 裝飾'], ['earn', '💎 怎麼賺晶幣']].map(function (t) { return '<button type="button" data-t="' + t[0] + '" class="' + (tab === t[0] ? 'on' : '') + '">' + t[1] + '</button>'; }).join('') + '</div>';
      if (tab === 'earn') {
        var me = myGrade(), rows = progress();
        h += '<div class="tip">闖關拿星星就會得到晶幣！<b>每個年級的每個學期，全部闖滿都是 1000 晶幣</b>（一、二年級：數學、國文各 500；三～六年級：數學、自然、社會、國文各 250）。<br>自己年級拿滿了，還可以去<b>挑戰別的年級</b>，再多賺 1000！月考測驗卷的星星是換萌寵用的，不算在這裡。</div>';
        rows.forEach(function (r) {
          if (!r.made) return;
          var best = 0; r.subj.forEach(function (x) { best += Math.max(x.coins, d.best[r.key + x.id] || 0); });
          h += '<div class="sem' + (r.key === me ? ' me' : '') + '"><b>' + r.name + '</b><div class="bar"><i style="width:' + (best / 10).toFixed(1) + '%"></i></div><span><b>' + best + '</b>／1000' + (r.key === me ? ' 👈' : '') + '</span>' +
            '<small>' + r.subj.map(function (x) { return x.name + ' ' + (x.made ? Math.max(x.coins, d.best[r.key + x.id] || 0) + '/' + x.share : '製作中'); }).join('・') + '</small></div>';
        });
      } else {
        h += '<div class="grid">' + SHOP[tab].map(function (it) {
          var have = owns(d, tab, it.id), using = tab === 'decor' ? !!(d.eq.decor || {})[it.id] : d.eq[tab] === it.id || (!d.eq[tab] && !it.price);
          var pv = tab === 'sky' ? '<div class="pv" style="background:' + it.sw + '">' + (it.dark ? '<span style="color:#fff;font-size:26px">✦ ✧ ✦</span>' : '') + '</div>'
            : tab === 'bridge' ? '<div class="pv" style="background:#dff1ff">' + bridgePreview(it.id) + '</div>'
            : '<div class="pv"><img src="' + BASE + 'sky/' + it.id + '.webp" alt=""></div>';
          var btn = !have ? (bal >= it.price ? '<button type="button" data-buy="' + it.id + '">💎 ' + it.price + ' 買下</button>' : '<button type="button" disabled>💎 ' + it.price + '</button><span class="need">還差 ' + (it.price - bal) + ' 晶幣</span>')
            : tab === 'decor' ? '<button type="button" class="' + (using ? 'off' : 'use') + '" data-tg="' + it.id + '">' + (using ? '收起來' : '放到天空城') + '</button>'
            : using ? '<button type="button" disabled>使用中</button>' : '<button type="button" class="use" data-use="' + it.id + '">換上</button>';
          return '<div class="it' + (it.legend ? ' legend' : '') + '">' + pv + '<div class="nm">' + it.name + '</div>' + (it.desc ? '<div class="need" style="color:#7a6aa8">' + it.desc + '</div>' : '') + (have ? '' : '<div class="pr">' + (it.price ? '💎 ' + it.price : '免費') + '</div>') + btn + '</div>';
        }).join('') + '</div>';
      }
      h += '</div>';
      box.innerHTML = h;
      box.querySelector('.x').onclick = function () { box.remove(); };
      box.querySelectorAll('[data-t]').forEach(function (b) { b.onclick = function () { tab = b.dataset.t; draw(); }; });
      box.querySelectorAll('[data-buy]').forEach(function (b) { b.onclick = function () { if (buy(tab, b.dataset.buy)) { equip(tab, b.dataset.buy, true); cheer(); } draw(); refreshBtn(); }; });
      box.querySelectorAll('[data-use]').forEach(function (b) { b.onclick = function () { equip(tab, b.dataset.use, true); draw(); }; });
      box.querySelectorAll('[data-tg]').forEach(function (b) { b.onclick = function () { var on = !(load().eq.decor || {})[b.dataset.tg]; equip('decor', b.dataset.tg, on); draw(); }; });
    }
    box.addEventListener('click', function (e) { if (e.target === box) box.remove(); });
    draw();
  }
  function cheer() {
    var s = document.createElement('div'); s.textContent = '🎉 買到了！天空城變漂亮了！';
    s.style.cssText = 'position:fixed;left:50%;top:14%;transform:translateX(-50%);z-index:2147483001;background:#fff;color:#6c4ad6;font:900 22px "Microsoft JhengHei","PingFang TC",sans-serif;padding:10px 22px;border-radius:999px;box-shadow:0 8px 24px rgba(0,0,0,.25);pointer-events:none';
    document.body.appendChild(s); setTimeout(function () { s.remove(); }, 2200);
  }
  function refreshBtn() { var b = document.getElementById('sky-btn'); if (b) b.textContent = '💎 天空城商店（' + balance() + ' 晶幣）'; }

  window.KGSky = { open: openShop, balance: balance, progress: progress, placeDecor: placeDecor, bridgeStyle: bridgeStyle, apply: apply, refreshBtn: refreshBtn, SHOP: SHOP };
  function boot() { apply(); refreshBtn(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();

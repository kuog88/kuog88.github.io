// 📅 每日任務、寶箱、闖關天數、錯題小怪獸（首頁用）
// 資料來源：家長報表 kg-report-v1（各科遊戲作答時自動寫入）。自己的資料存在 kg-daily-v1：
//   { days: { 'YYYY-MM-DD': { chest: 晶幣數, mon: 今天打倒幾隻, t2: 'mon'|'right' } }, total: 完成天數, combo: 連續天數,
//     last: 上次開寶箱的日期, bonus: 累計額外晶幣（kg-sky.js 會加進餘額）, love: 萌寵親密度 }
// 設計原則：每天三個任務做完就開一次寶箱，之後沒有額外獎勵（每天 10～15 分鐘）；中斷不扣任何東西。
(function () {
  if (window.KGDaily) return;
  var KEY = 'kg-daily-v1', RKEY = 'kg-report-v1', FONT = "'Microsoft JhengHei','PingFang TC','Noto Sans TC',sans-serif";
  var MON_CAP = 10;                       // 每天最多 10 隻怪獸有晶幣
  var MILE = { 3: 30, 7: 80, 14: 150, 21: 200, 30: 400, 50: 600, 100: 1000 };   // 完成天數里程碑：額外晶幣
  var MONS = ['👾', '👻', '🐙', '🦖', '🧟', '🦂', '🕷️', '🐲', '🦇', '👹'];

  function J(k, def) { try { return JSON.parse(localStorage.getItem(k)) || def; } catch (e) { return def; } }
  function load() { var d = J(KEY, {}); d.days = d.days || {}; d.total = d.total || 0; d.combo = d.combo || 0; d.bonus = d.bonus || 0; d.love = d.love || 0; return d; }
  function save(d) { try { localStorage.setItem(KEY, JSON.stringify(d)); } catch (e) {} }
  function dayKey(ts) { var d = ts ? new Date(ts) : new Date(); return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2); }
  function esc(s) { return String(s === undefined || s === null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function shuffle(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function petName() { var K = window.KGPet; if (!K) return '萌寵'; var d = K.get(), p = d.active && K.pet(d.active); return p ? p.name : '萌寵'; }

  // ---------- 今天做了什麼（從家長報表算） ----------
  function today() {
    var r = J(RKEY, { games: {} }), k = dayKey(), out = { lv: 0, right: 0, subj: [] };
    Object.keys(r.games || {}).forEach(function (id) {
      var g = r.games[id], t = g.days && g.days[k]; if (!t) return;
      out.lv += t.lv || 0; out.right += t.r || 0;
      if ((t.lv || 0) > 0 && g.subject && out.subj.indexOf(g.subject) < 0) out.subj.push(g.subject);
    });
    return out;
  }
  // ---------- 錯題小怪獸：還沒訂正、而且有正確答案可以出選擇題的錯題 ----------
  function monsters() {
    var r = J(RKEY, { games: {} }), out = [], pool = {};
    Object.keys(r.games || {}).forEach(function (id) {
      var g = r.games[id], map = {};
      (g.wrong || []).forEach(function (w) {
        if (!w.q) return;
        if (w.c) (pool[id] = pool[id] || []).push(w.c);
        var k = w.lv + '\u0001' + w.q, it = map[k];
        if (!it) it = map[k] = { id: id, subject: g.subject || '', game: g.title || '', lv: w.lv, q: w.q, c: w.c, a: w.a, last: 0, fixed: true };
        if (w.ts > it.last) { it.last = w.ts; it.a = w.a || it.a; it.c = w.c || it.c; }
        if (!w.fixed) it.fixed = false;
      });
      Object.keys(map).forEach(function (k) { if (!map[k].fixed && map[k].c) out.push(map[k]); });
    });
    out.forEach(function (it) { it.opts = options(it, pool[it.id] || []); });
    return out.filter(function (it) { return it.opts.length >= 2; });
  }
  var PAIR = [['○', '✕'], ['◯', '✕'], ['O', 'X'], ['對', '錯'], ['是', '不是'], ['＞', '＜'], ['>', '<']];
  function options(it, pool) {
    var c = String(it.c), o = [c];
    function add(x) { x = String(x || '').trim(); if (x && o.indexOf(x) < 0 && o.length < 4) o.push(x); }
    for (var i = 0; i < PAIR.length; i++) { var p = PAIR[i].indexOf(c); if (p >= 0) { add(PAIR[i][1 - p]); return shuffle(o); } }
    add(it.a);
    // 其他錯題的正確答案當干擾選項：先挑長度、類型接近的
    var num = /^[\d.,\/\s-]+$/.test(c);
    shuffle(pool).filter(function (x) { return /^[\d.,\/\s-]+$/.test(String(x)) === num && Math.abs(String(x).length - c.length) <= 4; }).forEach(add);
    if (num && o.length < 3) { var n = parseFloat(c.replace(/,/g, '')); if (!isNaN(n) && /^\d+$/.test(c)) [n + 1, n - 1, n + 10, n * 10].forEach(function (v) { if (v >= 0) add(v); }); }
    return shuffle(o);
  }
  function markFixed(it) {
    var r = J(RKEY, { games: {} }), g = r.games[it.id]; if (!g) return;
    (g.wrong || []).forEach(function (w) { if (w.lv === it.lv && w.q === it.q && !w.fixed) w.fixed = Date.now(); });
    try { localStorage.setItem(RKEY, JSON.stringify(r)); } catch (e) {}
  }

  // ---------- 任務 ----------
  function tasks() {
    var d = load(), k = dayKey(), t = today(), rec = d.days[k] = d.days[k] || {}, mon = rec.mon || 0;
    if (!rec.t2) { rec.t2 = monsters().length + mon >= 3 ? 'mon' : 'right'; save(d); }
    var list = [
      { ico: '🚩', txt: '闖完 1 關（哪一科都可以）', now: Math.min(1, t.lv), max: 1 },
      rec.t2 === 'mon' ? { ico: '👾', txt: '打倒 3 隻錯題小怪獸', now: Math.min(3, mon), max: 3, mon: true }
        : { ico: '✏️', txt: '今天答對 10 題', now: Math.min(10, t.right), max: 10 },
      { ico: '🌈', txt: '到 2 個不同的科目各闖 1 關', now: Math.min(2, t.subj.length), max: 2 }
    ];
    var done = list.filter(function (x) { return x.now >= x.max; }).length;
    return { list: list, done: done, all: done === list.length, opened: rec.chest !== undefined, rec: rec, d: d, combo: comboNow(d) };
  }
  // 連續天數：昨天或今天有開寶箱才算連續，斷了就從 0 重新數（完成天數 total 不會少）
  function comboNow(d) {
    if (!d.last) return 0;
    var y = dayKey(Date.now() - 86400000);
    return d.last === dayKey() || d.last === y ? d.combo : 0;
  }
  function openChest() {
    var s = tasks(); if (!s.all || s.opened) return null;
    var d = s.d, k = dayKey(), combo = comboNow(d) + (d.last === k ? 0 : 1);
    var base = 15 + Math.floor(Math.random() * 11), fire = Math.min(10, 2 * (combo - 1)), lucky = Math.random() < 0.12;
    var coins = (base + fire) * (lucky ? 2 : 1);
    d.total++; d.combo = combo; d.last = k; d.love++;
    var mile = MILE[d.total] || 0;
    d.bonus += coins + mile; d.days[k].chest = coins + mile;
    // 只留最近 60 天的紀錄
    Object.keys(d.days).sort().slice(0, -60).forEach(function (x) { delete d.days[x]; });
    save(d);
    return { coins: coins, fire: fire, lucky: lucky, mile: mile, total: d.total, combo: combo, love: d.love };
  }
  function nextMile(total) { var ks = Object.keys(MILE).map(Number).sort(function (a, b) { return a - b; }); for (var i = 0; i < ks.length; i++) if (ks[i] > total) return ks[i]; return 0; }

  // ---------- 首頁卡片 ----------
  var css = document.createElement('style');
  css.textContent =
    '#kg-daily{width:min(560px,100%);margin:6px auto 16px;font-family:' + FONT + '}' +
    '#kg-daily .cd{background:linear-gradient(160deg,#fffdf4,#fff3d6);border:4px solid #f5b800;border-radius:24px;box-shadow:0 6px 0 #f5b800;padding:14px 16px 16px;color:#4a3a1a;text-align:left}' +
    '#kg-daily .hd{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:8px}#kg-daily .hd b{font-size:21px;color:#b5651d}' +
    '#kg-daily .pill{font-size:14px;font-weight:800;background:#fff;border:2px solid #f3c08a;border-radius:999px;padding:2px 10px;color:#b5651d}' +
    '#kg-daily .pill.fire{border-color:#ff8a65;color:#d84315}' +
    '#kg-daily .tk{display:flex;align-items:center;gap:10px;background:#fff;border:2px solid #f0dcc0;border-radius:14px;padding:8px 10px;margin-top:6px;font-size:16px;font-weight:700}' +
    '#kg-daily .tk.ok{background:#eafaf0;border-color:#7fd3a0;color:#1e7a45}' +
    '#kg-daily .tk .n{margin-left:auto;font-size:14px;white-space:nowrap;color:#8a7a66}#kg-daily .tk.ok .n{color:#1e7a45}' +
    '#kg-daily .tk button{margin-left:auto;font:800 14px ' + FONT + ';border:none;background:#8a6cff;color:#fff;border-radius:999px;padding:5px 12px;cursor:pointer;white-space:nowrap}' +
    '#kg-daily .chest{display:block;width:100%;margin-top:10px;font:900 19px ' + FONT + ';padding:12px;border-radius:16px;border:none;cursor:pointer;background:#e8e2d4;color:#9a8f7a}' +
    '#kg-daily .chest.go{background:linear-gradient(90deg,#ffb300,#ff7043);color:#fff;box-shadow:0 5px 0 #c7511f;animation:kgdPulse 1.1s ease-in-out infinite}' +
    '#kg-daily .chest.fin{background:#eafaf0;color:#1e7a45;cursor:default}' +
    '#kg-daily .mon{display:block;width:100%;margin-top:8px;font:800 16px ' + FONT + ';padding:9px;border-radius:14px;border:3px solid #8a6cff;background:#fff;color:#6c4ad6;cursor:pointer}' +
    '#kg-daily .ft{margin-top:8px;font-size:13px;color:#8a7a66;line-height:1.5}' +
    '@keyframes kgdPulse{0%,100%{transform:scale(1)}50%{transform:scale(1.03)}}' +
    '#kgd-pop{position:fixed;inset:0;z-index:2147482500;background:rgba(30,20,50,.6);display:grid;place-items:center;padding:14px;font-family:' + FONT + '}' +
    '#kgd-pop .bx{background:#fffdf7;border-radius:26px;width:min(480px,100%);max-height:92vh;overflow:auto;padding:20px 18px;text-align:center;color:#2b2b2b;box-shadow:0 20px 50px rgba(0,0,0,.35)}' +
    '#kgd-pop .big{font-size:86px;line-height:1.1}#kgd-pop .big.shake{animation:kgdShake .5s ease-in-out 3}' +
    '#kgd-pop h2{margin:6px 0;font-size:24px;color:#b5651d}#kgd-pop p{margin:6px 0;font-size:16px;line-height:1.6}' +
    '#kgd-pop .coin{font-size:34px;font-weight:900;color:#6c4ad6}' +
    '#kgd-pop .btn{font:800 18px ' + FONT + ';padding:10px 22px;border-radius:16px;border:none;background:#2a9d8f;color:#fff;cursor:pointer;margin-top:10px}' +
    '#kgd-pop .btn.sub{background:#eee;color:#555}' +
    '#kgd-pop .mq{font-size:19px;font-weight:800;line-height:1.6;margin:10px 0;text-align:left;background:#f6f2ff;border-radius:14px;padding:10px 12px}' +
    '#kgd-pop .op{display:block;width:100%;font:800 18px ' + FONT + ';padding:11px;margin-top:8px;border-radius:14px;border:3px solid #cbbcff;background:#fff;color:#3b2a7a;cursor:pointer}' +
    '#kgd-pop .op.r{background:#eafaf0;border-color:#4caf7a;color:#1e7a45}#kgd-pop .op.w{background:#ffecec;border-color:#e57373;color:#b23b3b}' +
    '#kgd-pop .hp{height:12px;border-radius:999px;background:#eee;overflow:hidden;margin:6px auto;width:60%}#kgd-pop .hp i{display:block;height:100%;background:#e57373;transition:width .4s}' +
    '#kgd-pop .mon1{font-size:72px;line-height:1.1;display:inline-block;animation:kgdBob 1.4s ease-in-out infinite}#kgd-pop .mon1.hit{animation:kgdHit .5s ease-in-out}#kgd-pop .mon1.dead{animation:kgdDead .6s ease-in forwards}' +
    '#kgd-pop .meta{font-size:13px;color:#8a7a66}' +
    '@keyframes kgdShake{0%,100%{transform:rotate(0)}25%{transform:rotate(-10deg)}75%{transform:rotate(10deg)}}' +
    '@keyframes kgdBob{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}' +
    '@keyframes kgdHit{0%,100%{transform:translateX(0)}25%{transform:translateX(-10px)}75%{transform:translateX(10px)}}' +
    '@keyframes kgdDead{to{transform:scale(0) rotate(180deg);opacity:0}}' +
    '@media (prefers-reduced-motion:reduce){#kg-daily .chest.go,#kgd-pop .big.shake,#kgd-pop .mon1{animation:none!important}}';
  document.head.appendChild(css);

  function render() {
    var root = document.getElementById('kg-daily'); if (!root) return;
    var s = tasks(), d = s.d, mons = monsters().length, nm = nextMile(d.total);
    root.innerHTML = '<div class="cd"><div class="hd"><b>📅 今日任務</b><span class="pill">🗓️ 完成 ' + d.total + ' 天</span>' +
      (s.combo > 1 ? '<span class="pill fire">🔥 連續 ' + s.combo + ' 天</span>' : '') +
      (d.love ? '<span class="pill">💗 ' + esc(petName()) + '親密度 ' + d.love + '</span>' : '') + '</div>' +
      s.list.map(function (t) {
        var ok = t.now >= t.max;
        return '<div class="tk' + (ok ? ' ok' : '') + '"><span>' + (ok ? '✅' : t.ico) + '</span><span>' + t.txt + '</span>' +
          (t.mon && !ok ? '<button type="button" data-mon>去打怪 ▶</button>' : '<span class="n">' + t.now + ' / ' + t.max + '</span>') + '</div>';
      }).join('') +
      (s.opened ? '<button type="button" class="chest fin" disabled>🎉 今天的寶箱開過了（💎 ' + s.rec.chest + '），明天再來！</button>'
        : s.all ? '<button type="button" class="chest go" data-chest>🎁 任務完成！開寶箱</button>'
          : '<button type="button" class="chest" disabled>🔒 完成 3 個任務就能開寶箱（' + s.done + ' / 3）</button>') +
      (mons ? '<button type="button" class="mon" data-mon>👾 錯題小怪獸：還有 ' + mons + ' 隻（打倒 1 隻 💎 1）</button>' : '') +
      '<div class="ft">每天做完三個任務就可以開一次寶箱，得到晶幣去裝飾天空城。' + (nm ? '再完成 ' + (nm - d.total) + ' 天有大獎 💎 ' + MILE[nm] + '！' : '') + '</div></div>';
    var c = root.querySelector('[data-chest]'); if (c) c.onclick = chestPop;
    root.querySelectorAll('[data-mon]').forEach(function (b) { b.onclick = fight; });
    if (window.KGSky && KGSky.refreshBtn) KGSky.refreshBtn();
  }
  function pop(html) {
    var old = document.getElementById('kgd-pop'); if (old) old.remove();
    var w = document.createElement('div'); w.id = 'kgd-pop'; w.setAttribute('role', 'dialog');
    w.innerHTML = '<div class="bx">' + html + '</div>'; document.body.appendChild(w);
    return w;
  }
  function chestPop() {
    var w = pop('<div class="big shake">🎁</div><h2>寶箱打開中…</h2>');
    setTimeout(function () {
      var r = openChest(); if (!r) { w.remove(); render(); return; }
      w.querySelector('.bx').innerHTML = '<div class="big">' + (r.lucky ? '🌟' : '💎') + '</div><h2>' + (r.lucky ? '幸運大獎！晶幣加倍！' : '得到晶幣！') + '</h2>' +
        '<div class="coin">💎 +' + r.coins + '</div>' +
        (r.fire ? '<p>🔥 連續 ' + r.combo + ' 天，多送 ' + r.fire * (r.lucky ? 2 : 1) + ' 晶幣</p>' : '') +
        (r.mile ? '<p>🏆 完成第 ' + r.total + ' 天里程碑，再送 <b>💎 ' + r.mile + '</b>！</p>' : '') +
        '<p>💗 ' + esc(petName()) + '吃到點心了，親密度 ' + r.love + '</p>' +
        '<p class="meta">今天的任務都做完了，休息一下，明天再來喔！</p><button type="button" class="btn">太棒了！</button>';
      w.querySelector('.btn').onclick = function () { w.remove(); render(); };
    }, 1600);
  }

  // ---------- 打怪 ----------
  function fight() {
    var qs = shuffle(monsters()).slice(0, 5), i = 0, beat = 0, gain = 0;
    if (!qs.length) return;
    var w = pop('');
    function end() {
      var d = load();
      w.querySelector('.bx').innerHTML = '<div class="big">' + (beat ? '🏆' : '💪') + '</div><h2>打倒了 ' + beat + ' 隻小怪獸！</h2>' +
        (gain ? '<div class="coin">💎 +' + gain + '</div>' : (beat ? '<p class="meta">今天打怪的晶幣已經拿滿 ' + MON_CAP + ' 個了，但訂正還是算數喔！</p>' : '')) +
        '<p>打倒的題目已經從錯題本變成「已訂正」。' + (monsters().length ? '還有 ' + monsters().length + ' 隻在等你。' : '所有小怪獸都被你打倒了！🎉') + '</p>' +
        '<button type="button" class="btn">好！</button>';
      w.querySelector('.btn').onclick = function () { w.remove(); render(); };
    }
    function show() {
      if (i >= qs.length) return end();
      var it = qs[i], m = MONS[(it.q.length + it.q.charCodeAt(0)) % MONS.length];
      w.querySelector('.bx').innerHTML = '<div class="meta">第 ' + (i + 1) + ' / ' + qs.length + ' 隻　' + esc(it.subject) + '・' + esc(it.lv) + '</div>' +
        '<div class="mon1">' + m + '</div><div class="hp"><i style="width:100%"></i></div>' +
        '<div class="mq">' + esc(it.q) + '</div>' +
        it.opts.map(function (o, k) { return '<button type="button" class="op" data-k="' + k + '">' + esc(o) + '</button>'; }).join('') +
        '<button type="button" class="btn sub" data-quit>先不打了</button>';
      var bx = w.querySelector('.bx'), locked = false;
      bx.querySelector('[data-quit]').onclick = end;
      bx.querySelectorAll('.op').forEach(function (b) {
        b.onclick = function () {
          if (locked) return; locked = true;
          var ok = it.opts[+b.dataset.k] === String(it.c), mon = bx.querySelector('.mon1');
          bx.querySelectorAll('.op').forEach(function (x) { if (it.opts[+x.dataset.k] === String(it.c)) x.classList.add('r'); });
          if (ok) {
            markFixed(it); beat++;
            var d = load(), k = dayKey(), rec = d.days[k] = d.days[k] || {};
            rec.mon = (rec.mon || 0) + 1;
            if (rec.mon <= MON_CAP) { d.bonus++; gain++; }
            if (rec.mon % 5 === 0) d.love++;
            save(d);
            bx.querySelector('.hp i').style.width = '0%'; mon.classList.add('dead');
          } else { b.classList.add('w'); mon.classList.add('hit'); }
          var nx = document.createElement('button'); nx.type = 'button'; nx.className = 'btn';
          nx.textContent = ok ? '💥 打倒了！下一隻 ▶' : '記住正確答案了，下一隻 ▶';
          nx.onclick = function () { i++; show(); };
          bx.querySelector('[data-quit]').replaceWith(nx);
        };
      });
    }
    show();
  }

  window.KGDaily = { render: render, tasks: tasks, bonus: function () { return load().bonus; }, get: load, monsters: monsters };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', render); else render();
  addEventListener('pageshow', render);
  document.addEventListener('visibilitychange', function () { if (!document.hidden) render(); });
})();

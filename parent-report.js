// 家長報表：所有遊戲共用的作答紀錄（同一個網站，紀錄存在這台裝置的瀏覽器）
// home-button.js 會自動載入這支檔案。遊戲端只要在對應的地方呼叫（先檢查 window.KGReport 存在）：
//   KGReport.level('2-C 加減應用挑戰', '第 2 單元 四位數的加減')   進入關卡時
//   KGReport.answer(true/false, { q: '題目', a: '孩子的答案', c: '正確答案' })   每次作答
//   KGReport.done({ stars: 3, right: 8, total: 10 })   關卡結束時
// 報表頁：https://kuog88.github.io/report.html（?game=<遊戲id> 只看一個遊戲）
(function () {
  if (window.KGReport) return;
  var KEY = 'kg-report-v1', MAX_WRONG = 300;
  // 本機測試時（把 publish/ 當網站根目錄）報表頁在 /kuog88.github.io/
  var HUB = /^(localhost|127.0.0.1)$/.test(location.hostname) ? '/kuog88.github.io/' : 'https://kuog88.github.io/';
  var SUBJ = { 'math5a-lab': '數學', 'science5-quest': '自然', 'social-puzzle': '社會', 'galaxy-english': '英文', 'guoyu-island': '國文' };

  // 遊戲 id：網址的 repo + 年級資料夾，例如 math5a-lab/grade3、social-puzzle/grade3.html
  var parts = location.pathname.replace(/index\.html$/, '').split('/').filter(Boolean);
  var id = parts.slice(0, 2).join('/') || 'home';
  var repo = parts[0] || '';

  function load() { try { return JSON.parse(localStorage.getItem(KEY)) || { games: {} }; } catch (e) { return { games: {} }; } }
  function save(d) { try { localStorage.setItem(KEY, JSON.stringify(d)); } catch (e) {} }
  function clean(s, n) {
    if (s === undefined || s === null) return '';
    var t = String(s).replace(/<br\s*\/?>/gi, ' ').replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
    return t.length > (n || 160) ? t.slice(0, n || 160) + '…' : t;
  }
  function day(ts) { var d = new Date(ts); return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2); }
  // 沒有特別指定時，用畫面上最顯眼的標題當作關卡名
  function guessLevel() {
    var els = document.querySelectorAll('h1,h2,h3,[id*="title" i],[class*="title" i]'), best = null, bs = 0;
    for (var i = 0; i < els.length; i++) {
      var e = els[i], r = e.getBoundingClientRect(), t = clean(e.textContent, 40);
      if (!t || r.width === 0 || r.height === 0) continue;
      var fs = parseFloat(getComputedStyle(e).fontSize) || 0;
      if (fs > bs) { bs = fs; best = t; }
    }
    return best || clean(document.title, 40);
  }

  var cur = null, lastAct = 0;
  function game(d) {
    var g = d.games[id];
    if (!g) g = d.games[id] = { subject: SUBJ[repo] || '', levels: {}, wrong: [], days: {}, first: Date.now() };
    g.title = clean(document.title, 40); g.path = location.pathname; g.subject = g.subject || SUBJ[repo] || '';
    return g;
  }
  // 計算練習時間：兩次作答相隔 3 分鐘以內才算在練習
  function addTime(g, now) {
    if (lastAct && now - lastAct < 180000) { var k = day(now); g.days[k] = g.days[k] || { r: 0, w: 0, ms: 0 }; g.days[k].ms += now - lastAct; }
    lastAct = now;
  }

  var api = {
    id: id,
    level: function (name, unit) {
      cur = { name: clean(name, 60) || guessLevel(), unit: clean(unit, 60) };
      shown();
    },
    answer: function (ok, info) {
      info = info || {};
      var now = Date.now(), d = load(), g = game(d);
      var lv = cur || { name: guessLevel(), unit: '' };
      var L = g.levels[lv.name] = g.levels[lv.name] || { unit: lv.unit, r: 0, w: 0, plays: 0 };
      if (lv.unit) L.unit = lv.unit;
      ok ? L.r++ : L.w++; L.last = now;
      var k = day(now); g.days[k] = g.days[k] || { r: 0, w: 0, ms: 0 }; ok ? g.days[k].r++ : g.days[k].w++;
      addTime(g, now);
      if (!ok) {
        g.wrong.unshift({ ts: now, lv: lv.name, q: clean(info.q), a: clean(info.a, 60), c: clean(info.c, 60) });
        if (g.wrong.length > MAX_WRONG) g.wrong.length = MAX_WRONG;
      } else if (info.q) {
        // 錯題本：同一關、同一題後來答對了，就算訂正過
        var cq = clean(info.q);
        g.wrong.forEach(function (w) { if (!w.fixed && w.lv === lv.name && w.q === cq) w.fixed = now; });
      }
      g.last = now; save(d); shown();
    },
    done: function (res) {
      res = res || {};
      var d = load(), g = game(d), lv = cur || { name: guessLevel(), unit: '' };
      var L = g.levels[lv.name] = g.levels[lv.name] || { unit: lv.unit, r: 0, w: 0, plays: 0 };
      L.plays = (L.plays || 0) + 1; L.last = Date.now();
      if (res.stars !== undefined) L.stars = Math.max(L.stars || 0, +res.stars || 0);
      if (res.total) L.lastScore = (res.right || 0) + '/' + res.total;
      g.last = Date.now(); save(d);
      if (+res.stars > 0) starPop(+res.stars);
    },
    open: function () { openPanel(); }
  };

  // 過關／交卷得到星星時，畫面上方跳出大大的星星，讓孩子清楚知道「我拿到星星了！」（英文科不套用）
  function starPop(n) {
    if (/\/galaxy-english\//.test(location.pathname)) return;
    try {
      if (!document.getElementById('kg-starpop-css')) {
        var st = document.createElement('style'); st.id = 'kg-starpop-css';
        st.textContent = '#kg-starpop{position:fixed;left:0;right:0;top:9vh;z-index:2147483000;display:flex;flex-direction:column;align-items:center;pointer-events:none;font-family:"Microsoft JhengHei","PingFang TC","Noto Sans TC",sans-serif;animation:kgspOut .5s ease-in 2.9s forwards}' +
          '#kg-starpop .row{display:flex;gap:6px;align-items:flex-end;background:radial-gradient(closest-side,rgba(255,255,255,.95),rgba(255,255,255,.75) 70%,rgba(255,255,255,0));padding:10px 34px;border-radius:40px}' +
          '#kg-starpop .s{font-size:min(26vw,120px);line-height:1;color:#ffbf00;-webkit-text-stroke:4px #c96f00;paint-order:stroke fill;text-shadow:0 6px 0 #b85f00,0 0 24px rgba(255,200,0,.8);transform:scale(0);animation:kgspIn .55s cubic-bezier(.2,1.6,.4,1) forwards}' +
          '#kg-starpop .s.half{width:.5em;overflow:hidden;display:inline-block}' +
          '#kg-starpop .t{margin-top:8px;font-size:min(8vw,36px);font-weight:900;color:#fff;background:linear-gradient(#ffb300,#ff7a00);padding:8px 26px;border-radius:999px;border:4px solid #fff;box-shadow:0 6px 18px rgba(0,0,0,.25);transform:scale(0);animation:kgspIn .5s cubic-bezier(.2,1.6,.4,1) forwards}' +
          '@keyframes kgspIn{0%{transform:scale(0) rotate(-30deg)}100%{transform:scale(1) rotate(0)}}' +
          '@keyframes kgspOut{to{opacity:0;transform:translateY(-30px)}}' +
          '@media (prefers-reduced-motion:reduce){#kg-starpop .s,#kg-starpop .t{animation:none;transform:none}}';
        document.head.appendChild(st);
      }
      var old = document.getElementById('kg-starpop'); if (old) old.remove();
      var box = document.createElement('div'); box.id = 'kg-starpop'; box.setAttribute('aria-live', 'polite');
      var full = Math.floor(n), h = '';
      for (var i = 0; i < full; i++) h += '<span class="s" style="animation-delay:' + (i * .22) + 's">★</span>';
      if (n % 1) h += '<span class="s half" style="animation-delay:' + (full * .22) + 's">★</span>';
      box.innerHTML = '<div class="row">' + h + '</div><div class="t" style="animation-delay:' + (Math.ceil(n) * .22 + .1) + 's">⭐ 得到 ' + n + ' 顆星！</div>';
      document.body.appendChild(box);
      setTimeout(function () { box.remove(); }, 3600);
    } catch (e) {}
  }
  window.KGReport = api;

  // ---------- 遊戲裡的「家長報表」按鈕：有紀錄或遊戲有呼叫過才出現 ----------
  var btn = null;
  function shown() {
    if (btn || !document.body) return;
    var css = document.createElement('style');
    css.textContent =
      '#kg-rep-btn{position:fixed;left:12px;bottom:62px;z-index:2147483000;display:flex;align-items:center;gap:6px;' +
      'padding:7px 13px;border-radius:999px;background:rgba(255,255,255,.92);color:#2a9d8f;border:3px solid #2a9d8f;' +
      'font:700 14px "Microsoft JhengHei","PingFang TC","Noto Sans TC",sans-serif;box-shadow:0 3px 0 #2a9d8f;opacity:.85;cursor:pointer}' +
      '#kg-rep-btn:hover,#kg-rep-btn:focus-visible{opacity:1;outline:none;transform:translateY(-2px)}' +
      '#kg-rep{position:fixed;inset:0;z-index:2147483600;background:rgba(0,0,0,.5);display:flex;align-items:center;justify-content:center;padding:12px}' +
      '#kg-rep .box{position:relative;width:min(960px,100%);height:min(92vh,100%);background:#fff;border-radius:18px;overflow:hidden;box-shadow:0 10px 40px rgba(0,0,0,.3)}' +
      '#kg-rep iframe{width:100%;height:100%;border:0}' +
      '#kg-rep .x{position:absolute;top:8px;right:10px;z-index:1;width:40px;height:40px;border-radius:50%;border:none;background:#2a9d8f;color:#fff;font-size:22px;cursor:pointer}' +
      '@media print{#kg-rep-btn{display:none}}' +
      '';
    document.head.appendChild(css);
    btn = document.createElement('button');
    btn.id = 'kg-rep-btn'; btn.type = 'button'; btn.innerHTML = '📊<span class="t"> 家長報表</span>';
    btn.title = '給家長看：孩子在這個遊戲的闖關紀錄與常錯題目';
    btn.onclick = openPanel;
    document.body.appendChild(btn);
  }
  function openPanel() {
    if (document.getElementById('kg-rep')) return;
    var w = document.createElement('div'); w.id = 'kg-rep';
    w.innerHTML = '<div class="box"><button class="x" type="button" aria-label="關閉報表">✕</button>' +
      '<iframe title="家長報表" src="' + HUB + 'report.html?embed=1&game=' + encodeURIComponent(id) + '"></iframe></div>';
    w.querySelector('.x').onclick = function () { w.remove(); };
    w.addEventListener('click', function (e) { if (e.target === w) w.remove(); });
    document.body.appendChild(w);
  }
  function init() { var d = load(); if (d.games[id]) shown(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();

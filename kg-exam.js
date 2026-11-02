// 月考測驗卷：正式的複習試卷（不是遊戲）。home-button.js 會自動載入。
//
// 遊戲端：在年級首頁放一個容器，載入自己的題庫後呼叫
//   KGExam.mount(document.getElementById('exam-box'), EXAM_BANK)
// 會畫出「📝 月考測驗卷」欄位：每份試卷一張卡片，顯示最佳分數和星星。
//
// EXAM_BANK 格式：
//   { grade: '三年級上學期 數學',
//     papers: [ { title: '第一次月考（第 1～4 單元）', units: ['第 1 單元 …', …], count: 45 }, … ],
//     bank: [ 題目, … ] }
// 題目（全部是是非、選擇、填充）：
//   { type: 'tf',     unit: '…', q: '題目敘述', answer: true / false, explain: '…' }
//   { type: 'choice', unit: '…', q: '…', choices: ['…','…','…','…'], answer: '（和某個選項完全相同）', explain: '…' }
//   { type: 'fill',   unit: '…', q: '……（　　）……', answer: '答案' 或 ['可接受的答案', …], explain: '…' }
// 題目也可以是回傳題目物件的函式（亂數出題）。q 可以有 HTML、SVG 圖。
// 每張試卷依 是非 → 選擇 → 填充 排列，平均從範圍內各單元抽題。
// 計分：100 分制；80 分 1 顆星、90 分 1.5 顆星、100 分 2 顆星。
(function () {
  if (window.KGExam) return;
  var KEY = 'kg-exam-v1';
  var MIX = { tf: 0.25, choice: 0.5, fill: 0.25 };   // 各題型大約比例
  var SEC = [['tf', '是非題', '對的打 ⭕，錯的打 ❌'], ['choice', '選擇題', '選出最適當的答案'], ['fill', '填充題', '在空格內填入正確的答案']];
  var css = document.createElement('style');
  css.textContent =
    '#kg-exam :where(:not(svg):not(svg *)),#kgx-panel :where(:not(svg):not(svg *)){all:revert;box-sizing:border-box}' +
    '#kg-exam{position:fixed;inset:0;z-index:2147483500;background:#ece6da;overflow:auto;font-family:"Microsoft JhengHei","PingFang TC","Noto Sans TC",sans-serif;color:#222}' +
    '#kg-exam .paper{max-width:820px;margin:0 auto;background:#fff;min-height:100%;padding:22px 20px 120px;box-shadow:0 0 30px rgba(0,0,0,.15)}' +
    '#kg-exam .top{display:flex;justify-content:space-between;align-items:center;gap:10px;position:sticky;top:0;background:#fff;padding:8px 0;z-index:2;border-bottom:1px solid #ddd}' +
    '#kg-exam .top b{font-size:15px;color:#555}' +
    '#kg-exam .x{border:1px solid #bbb;background:#fff;border-radius:8px;padding:6px 12px;font:inherit;cursor:pointer}' +
    '#kg-exam h1{text-align:center;font-size:clamp(20px,5vw,26px);margin:16px 0 4px;letter-spacing:2px}' +
    '#kg-exam .sub{text-align:center;color:#555;margin-bottom:6px}' +
    '#kg-exam .name{display:flex;justify-content:center;gap:24px;flex-wrap:wrap;margin:10px 0 18px;font-size:16px}' +
    '#kg-exam .name span{border-bottom:1px solid #333;min-width:120px;display:inline-block}' +
    '#kg-exam h2{font-size:19px;margin:22px 0 10px;padding:6px 10px;background:#f3efe6;border-left:5px solid #8b5e34}' +
    '#kg-exam h2 small{font-weight:400;color:#666;font-size:14px;margin-left:8px}' +
    '#kg-exam .it{padding:10px 4px 12px;border-bottom:1px dashed #ddd;display:grid;gap:8px}' +
    '#kg-exam .it .q{font-size:17px;line-height:1.75}' +
    '#kg-exam .it .q svg,#kg-exam .it .q img{max-width:100%;height:auto;display:block;margin:6px 0}' +
    '#kg-exam .no{font-weight:800;margin-right:4px}' +
    '#kg-exam .opts{display:grid;gap:6px}' +
    '#kg-exam .opts.tf{grid-template-columns:auto auto;justify-content:start;gap:12px}' +
    '#kg-exam .opts button{font:inherit;font-size:16px;text-align:left;padding:8px 12px;border:2px solid #ccc;border-radius:10px;background:#fff;cursor:pointer;color:#222;min-height:44px}' +
    '#kg-exam .opts.tf button{font-size:22px;min-width:70px;text-align:center}' +
    '#kg-exam .opts button.sel{border-color:#2f6fd6;background:#eaf2ff;font-weight:700}' +
    '#kg-exam .it input{font:inherit;font-size:18px;padding:8px 10px;border:2px solid #ccc;border-radius:10px;width:min(320px,100%)}' +
    '#kg-exam .it input:focus{outline:none;border-color:#2f6fd6}' +
    '#kg-exam .bar{position:fixed;left:0;right:0;bottom:0;background:#fff;border-top:1px solid #ddd;padding:10px 16px;display:flex;justify-content:center;align-items:center;gap:14px;z-index:3;flex-wrap:wrap}' +
    '#kg-exam .btn{font:inherit;font-size:17px;font-weight:800;padding:10px 26px;border-radius:999px;border:2px solid #8b5e34;background:#fff;color:#8b5e34;cursor:pointer}' +
    '#kg-exam .btn.main{background:#8b5e34;color:#fff}' +
    '#kg-exam .res{text-align:center;margin:16px 0;display:grid;gap:6px;justify-items:center}' +
    '#kg-exam .res .sc{font-size:72px;font-weight:900;color:#d22;font-family:Georgia,"Times New Roman",serif;transform:rotate(-8deg);line-height:1}' +
    '#kg-exam .stars{font-size:34px;letter-spacing:4px;color:#f2b400}' +
    '#kg-exam .it.right{background:#f3fbf5}#kg-exam .it.wrong{background:#fff4f4}' +
    '#kg-exam .mark{font-weight:800}#kg-exam .mark.r{color:#1e9b4b}#kg-exam .mark.w{color:#d22}' +
    '#kg-exam .exp{color:#555;font-size:15px;background:#faf7f0;border-radius:8px;padding:6px 10px}' +
    '#kg-exam .it.wrong .opts button.ans,#kg-exam .it .opts button.ans{border-color:#1e9b4b;background:#e8f7ee}' +
    '#kg-exam .it.wrong .opts button.sel:not(.ans){border-color:#d22;background:#ffeaea}' +
    '#kg-exam .filter{display:flex;gap:8px;justify-content:center;margin:6px 0}' +
    // 年級頁的欄位
    '#kgx-panel{display:grid;gap:12px;font-family:"Microsoft JhengHei","PingFang TC","Noto Sans TC",sans-serif;color:#222;text-align:left}' +
    '#kgx-panel h3{margin:0;font-size:20px;font-weight:800}' +
    '#kgx-panel .cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px}' +
    '#kgx-panel .card{text-align:left;font:inherit;color:#222;background:#fff;border:2px solid #d8c8ad;border-radius:14px;padding:12px 14px;cursor:pointer;display:grid;gap:4px;box-shadow:0 3px 0 #d8c8ad}' +
    '#kgx-panel .card:hover{border-color:#8b5e34}' +
    '#kgx-panel .card b{font-size:17px}#kgx-panel .card small{color:#666}' +
    '#kgx-panel .card .best{color:#b07a00;font-weight:800}';

  function esc(s) { return String(s === undefined || s === null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function plain(s) { return String(s || '').replace(/<svg[\s\S]*?<\/svg>/gi, '（圖）').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim(); }
  function shuffle(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function norm(s) {
    return String(s === undefined || s === null ? '' : s).replace(/[０-９Ａ-Ｚａ-ｚ]/g, function (c) { return String.fromCharCode(c.charCodeAt(0) - 65248); })
      .replace(/[／]/g, '/').replace(/[．]/g, '.').replace(/[，,]/g, '').replace(/[\s　（）()「」『』。、]/g, '').toLowerCase();
  }
  function num(s) {
    s = norm(s);
    var m = s.match(/^(-?\d+)又(\d+)\/(\d+)$/);
    if (m) { if (+m[2] >= +m[3] || +m[2] === 0) return NaN; return +m[1] + m[2] / m[3]; }
    m = s.match(/^(-?\d+(?:\.\d+)?)\/(\d+(?:\.\d+)?)$/);
    if (m) return +m[2] ? m[1] / m[2] : NaN;
    return /^-?\d+(\.\d+)?$/.test(s) ? +s : NaN;
  }
  function same(a, ans) {
    var list = Array.isArray(ans) ? ans : [ans];
    for (var i = 0; i < list.length; i++) {
      if (norm(a) === '' ) return false;
      var x = num(a), y = num(list[i]);
      if (!isNaN(x) && !isNaN(y) && Math.abs(x - y) < 1e-9) return true;
      if (norm(a) === norm(list[i])) return true;
    }
    return false;
  }
  // 函式題目：用 fn.unit，沒寫就試跑一次讀回傳的 unit
  function unitOf(b) { if (typeof b !== 'function') return b.unit; if (b.unit === undefined) { try { b.unit = b().unit; } catch (e) { b.unit = ''; } } return b.unit; }
  function typeOf(q) { return q.type || (q.choices ? 'choice' : typeof q.answer === 'boolean' ? 'tf' : 'fill'); }
  function starsOf(score) { return score >= 100 ? 2 : score >= 90 ? 1.5 : score >= 80 ? 1 : 0; }
  function starHTML(n) { return n ? '★'.repeat(Math.floor(n)) + (n % 1 ? '<span style="display:inline-block;width:.5em;overflow:hidden;vertical-align:bottom">★</span>' : '') : '☆'; }
  function gameId() { return location.pathname.replace(/index\.html$/, '').split('/').filter(Boolean).slice(0, 2).join('/'); }
  function loadBest() { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; } }
  function saveBest(d) { try { localStorage.setItem(KEY, JSON.stringify(d)); } catch (e) {} }

  // 抽題：依比例決定各題型題數，每個題型平均從各單元抽
  function build(bank, count) {
    var items = bank.map(function (b) { return typeof b === 'function' ? b : b; });
    var pools = { tf: [], choice: [], fill: [] };
    items.forEach(function (b) {
      var t = typeof b === 'function' ? typeOf(b()) : typeOf(b);   // 函式先試跑一次判斷題型
      (pools[t] || pools.choice).push(b);
    });
    var want = { tf: Math.round(count * MIX.tf), fill: Math.round(count * MIX.fill) };
    want.choice = count - want.tf - want.fill;
    // 某題型不夠時，把名額讓給其他題型
    var avail = function (t) { return pools[t].length; };
    ['tf', 'fill', 'choice'].forEach(function (t) { if (want[t] > avail(t)) { var extra = want[t] - avail(t); want[t] = avail(t); var o = t === 'choice' ? 'tf' : 'choice'; want[o] += extra; } });
    ['choice', 'tf', 'fill'].forEach(function (t) { if (want[t] > avail(t)) { var extra = want[t] - avail(t); want[t] = avail(t); want.fill += t !== 'fill' ? extra : 0; } });
    var out = {};
    SEC.forEach(function (s) {
      var t = s[0], byU = {}, units = [];
      pools[t].forEach(function (b) { var u = unitOf(b) || '_'; if (!byU[u]) { byU[u] = []; units.push(u); } byU[u].push(b); });
      units = shuffle(units); units.forEach(function (u) { byU[u] = shuffle(byU[u]); });
      var list = [], k = 0, g = 0;
      while (list.length < want[t] && g++ < 5000) { var u = units[k++ % units.length]; if (byU[u].length) list.push(byU[u].shift()); else if (units.every(function (x) { return !byU[x].length; })) break; }
      out[t] = list.map(function (b) { var q = Object.assign({}, typeof b === 'function' ? b() : b); q.type = typeOf(q); if (q.choices) q.choices = shuffle(q.choices); return q; });
    });
    return out;
  }

  function open(paper, bankAll, grade) {
    if (document.getElementById('kg-exam')) return;
    if (!css.parentNode) document.head.appendChild(css);
    var units = paper.units && paper.units.length ? paper.units : null;
    var bank = (bankAll || []).filter(function (b) { return !units || units.indexOf(unitOf(b)) >= 0; });
    var count = paper.count || 45;
    var secs = build(bank, count), all = [];
    SEC.forEach(function (s) { (secs[s[0]] || []).forEach(function (q) { all.push(q); }); });
    if (!all.length) { alert('這份測驗卷的題目還在準備中！'); return; }
    var title = paper.title, full = (grade ? grade + ' ' : '') + title;
    var box = document.createElement('div'); box.id = 'kg-exam';
    document.body.appendChild(box);
    var started = Date.now(), picks = [];
    function close() { box.remove(); document.documentElement.style.overflow = ''; }
    document.documentElement.style.overflow = 'hidden';

    function render(done, onlyWrong) {
      var n = 0, right = 0;
      all.forEach(function (q, i) { if (done && picks[i] && picks[i].ok) right++; });
      var score = done ? Math.round(right / all.length * 100) : 0, stars = starsOf(score);
      var h = '<div class="paper"><div class="top"><b>📝 ' + esc(full) + '</b><button class="x" type="button">' + (done ? '關閉' : '離開') + '</button></div>' +
        '<h1>' + esc(grade || '') + '</h1><div class="sub">' + esc(title) + '　共 ' + all.length + ' 題，每題 ' + (Math.round(1000 / all.length) / 10) + ' 分</div>' +
        '<div class="name">班級：<span></span>　姓名：<span></span>　得分：<span style="color:#d22;font-weight:800;text-align:center">' + (done ? score : '') + '</span></div>';
      if (done) {
        var mins = Math.max(1, Math.round((Date.now() - started) / 60000));
        h += '<div class="res"><div class="sc">' + score + '</div><div class="stars">' + starHTML(stars) + '</div>' +
          '<div>答對 ' + right + ' / ' + all.length + ' 題・作答約 ' + mins + ' 分鐘</div>' +
          '<div style="color:#666">' + (stars === 2 ? '滿分！月考準備好了！' : stars === 1.5 ? '很棒！把錯的題目再看一次就更穩了。' : stars === 1 ? '及格了！錯的地方要訂正喔。' : '還不到 80 分，先看錯的題目和解說，再寫一張吧！') + '</div>' +
          '<div style="font-size:13px;color:#888">評分：80 分 ★、90 分 ★½、100 分 ★★</div></div>' +
          '<div class="filter"><button class="btn' + (onlyWrong ? '' : ' main') + '" data-f="all" type="button">全部題目</button><button class="btn' + (onlyWrong ? ' main' : '') + '" data-f="wrong" type="button">只看錯的（' + (all.length - right) + '）</button></div>';
      }
      SEC.forEach(function (s) {
        var t = s[0], list = secs[t] || [];
        if (!list.length) return;
        var body = '';
        list.forEach(function (q) {
          var i = all.indexOf(q); n++;
          var p = picks[i], ok = p && p.ok;
          if (done && onlyWrong && ok) return;
          body += '<div class="it' + (done ? (ok ? ' right' : ' wrong') : '') + '" data-i="' + i + '"><div class="q"><span class="no">' + n + '.</span>' + (q.q || '') + '</div>';
          if (t === 'tf') body += '<div class="opts tf">' + [[true, '⭕'], [false, '❌']].map(function (o) {
            var cls = (p && p.a === o[0] ? ' sel' : '') + (done && q.answer === o[0] ? ' ans' : '');
            return '<button type="button" data-v="' + o[0] + '" class="' + cls + '"' + (done ? ' disabled' : '') + '>' + o[1] + '</button>'; }).join('') + '</div>';
          else if (t === 'choice') body += '<div class="opts">' + q.choices.map(function (c, k) {
            var cls = (p && p.a === c ? ' sel' : '') + (done && c === q.answer ? ' ans' : '');
            return '<button type="button" data-k="' + k + '" class="' + cls + '"' + (done ? ' disabled' : '') + '>（' + (k + 1) + '）' + c + '</button>'; }).join('') + '</div>';
          else body += '<div><input type="text" inputmode="text" autocomplete="off" placeholder="寫答案" value="' + esc(p ? p.a : '') + '"' + (done ? ' disabled' : '') + '></div>';
          if (done) {
            var ca = t === 'tf' ? (q.answer ? '⭕' : '❌') : Array.isArray(q.answer) ? q.answer[0] : q.answer;
            body += '<div class="mark ' + (ok ? 'r' : 'w') + '">' + (ok ? '✔ 答對' : '✘ 答錯' + (p && p.a !== '' && p.a !== undefined ? '' : '（沒作答）') + '　正確答案：' + ca) + '</div>' +
              (q.explain ? '<div class="exp">💡 ' + q.explain + '</div>' : '');
          }
          body += '</div>';
        });
        if (body) h += '<h2>' + '一二三'[SEC.indexOf(s)] + '、' + s[1] + '<small>' + s[2] + '（' + list.length + ' 題）</small></h2>' + body;
      });
      h += '</div><div class="bar">' + (done ? '<button class="btn main" data-again type="button">再寫一張（題目會換）</button><button class="btn" data-close type="button">關閉</button>'
        : '<span id="kge-left"></span><button class="btn main" data-submit type="button">交卷</button>') + '</div>';
      box.innerHTML = h;
      box.querySelector('.x').onclick = function () { if (done || confirm('還沒交卷，確定要離開嗎？作答內容不會保存。')) close(); };
      if (done) {
        box.querySelector('[data-close]').onclick = close;
        box.querySelector('[data-again]').onclick = function () { close(); open(paper, bankAll, grade); };
        box.querySelectorAll('[data-f]').forEach(function (b) { b.onclick = function () { render(true, b.dataset.f === 'wrong'); box.scrollTop = 0; }; });
        return;
      }
      var left = function () { var c = all.filter(function (q, i) { return !picks[i] || picks[i].a === '' || picks[i].a === undefined; }).length; box.querySelector('#kge-left').textContent = c ? '還有 ' + c + ' 題沒寫' : '全部寫完了！'; };
      box.querySelectorAll('.it').forEach(function (it) {
        var i = +it.dataset.i, q = all[i];
        it.querySelectorAll('.opts button').forEach(function (b) {
          b.onclick = function () {
            var v = q.type === 'tf' ? b.dataset.v === 'true' : q.choices[+b.dataset.k];
            picks[i] = { a: v }; it.querySelectorAll('.opts button').forEach(function (x) { x.classList.toggle('sel', x === b); }); left();
          };
        });
        var inp = it.querySelector('input');
        if (inp) inp.oninput = function () { picks[i] = { a: inp.value }; left(); };
      });
      left();
      box.querySelector('[data-submit]').onclick = function () {
        var c = all.filter(function (q, i) { return !picks[i] || picks[i].a === '' || picks[i].a === undefined; }).length;
        if (c && !confirm('還有 ' + c + ' 題沒寫，確定要交卷嗎？')) return;
        submit();
      };
    }
    function submit() {
      var lv = '📝 月考測驗卷：' + title;
      if (window.KGReport) KGReport.level(lv, grade || '');
      var right = 0;
      all.forEach(function (q, i) {
        var p = picks[i] = picks[i] || { a: '' };
        p.ok = q.type === 'tf' ? p.a === q.answer : q.type === 'choice' ? p.a === q.answer : same(p.a, q.answer);
        if (p.ok) right++;
        if (window.KGReport) {
          var ca = q.type === 'tf' ? (q.answer ? '⭕ 對' : '❌ 錯') : Array.isArray(q.answer) ? q.answer[0] : q.answer;
          var aa = q.type === 'tf' ? (p.a === true ? '⭕ 對' : p.a === false ? '❌ 錯' : '（沒作答）') : (p.a === '' ? '（沒作答）' : p.a);
          KGReport.answer(p.ok, { q: plain(q.q), a: plain(aa), c: plain(ca) });
        }
      });
      var score = Math.round(right / all.length * 100), stars = starsOf(score);
      if (window.KGReport) KGReport.done({ right: right, total: all.length, stars: stars });
      var d = loadBest(), k = gameId() + '|' + title, o = d[k] || { n: 0 };
      o.n++; o.last = score; o.ts = Date.now(); if (!(o.best >= score)) o.best = score; o.stars = starsOf(o.best);
      d[k] = o; saveBest(d);
      render(true, false); box.scrollTop = 0;
      if (window.__kgExamMounted) window.__kgExamMounted.forEach(function (f) { f(); });
    }
    render(false);
  }

  // 在年級頁畫出「月考測驗卷」欄位
  function mount(el, B) {
    if (!el || !B) return;
    if (!css.parentNode) document.head.appendChild(css);
    function draw() {
      var d = loadBest();
      el.innerHTML = '<div id="kgx-panel"><h3>📝 月考測驗卷</h3><div style="color:#666;font-size:14px">正式的考前複習試卷，每張 40～50 題（是非、選擇、填充），題目每次會換。80 分 ★、90 分 ★½、100 分 ★★。</div>' +
        '<div class="cards">' + B.papers.map(function (p, i) {
          var o = d[gameId() + '|' + p.title];
          return '<button class="card" type="button" data-p="' + i + '"><b>' + esc(p.title) + '</b><small>' + (p.count || 45) + ' 題' + (p.units && p.units.length ? '・' + p.units.length + ' 個單元' : '') + '</small>' +
            (o ? '<span class="best">最佳 ' + o.best + ' 分 ' + starHTML(o.stars) + '　（寫過 ' + o.n + ' 次）</span>' : '<small>還沒寫過</small>') + '</button>';
        }).join('') + '</div></div>';
      el.querySelectorAll('[data-p]').forEach(function (b) { b.onclick = function () { open(B.papers[+b.dataset.p], B.bank, B.grade); }; });
    }
    draw();
    (window.__kgExamMounted = window.__kgExamMounted || []).push(draw);
  }

  window.KGExam = { mount: mount, open: open, starsOf: starsOf, _num: num, _same: same, _build: build, _typeOf: typeOf };
})();

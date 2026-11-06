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
    '#kg-exam .name>span:not(.kzw){border-bottom:1px solid #333;min-width:120px;display:inline-block}' +
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
    '#kg-exam .it input.pick{cursor:pointer;background:#fffdf2;min-width:140px}' +
    '#kg-exam .chips{display:flex;flex-wrap:wrap;gap:8px;margin-top:6px}' +
    '#kg-exam .chips button{font:inherit;font-size:17px;padding:7px 14px;border:2px solid #d8c8ad;border-radius:999px;background:#fff;cursor:pointer;color:#222;min-height:42px}' +
    '#kg-exam .chips button.sel{border-color:#2f6fd6;background:#eaf2ff;font-weight:700}' +
    '#kg-exam .np{display:grid;grid-template-columns:repeat(5,minmax(0,56px));gap:6px;margin-top:8px}' +
    '#kg-exam .np button{font:inherit;font-size:19px;font-weight:700;min-height:44px;border:2px solid #ccc;border-radius:10px;background:#fff;cursor:pointer;color:#222}' +
    '#kg-exam .np button.fn{background:#f1ede4}' +
    '#kg-exam .typ{font:inherit;font-size:13px;color:#666;background:none;border:none;text-decoration:underline;cursor:pointer;margin-left:8px}' +
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
    '#kgx-panel .hist{display:grid;gap:6px}#kgx-panel .hrow{font:inherit;display:grid;grid-template-columns:auto 1fr auto;gap:10px;align-items:center;text-align:left;background:#fffdf7;border:2px solid #e6dccb;border-radius:12px;padding:8px 12px;cursor:pointer;color:#222}#kgx-panel .hrow:hover{border-color:#8b5e34}#kgx-panel .hrow span{color:#666;font-size:14px}#kgx-panel .hrow .sc2{color:#b07a00;font-weight:800}' +
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
  var HKEY = 'kg-exam-hist-v1', KEEP = 5;
  function loadHist() { try { return JSON.parse(localStorage.getItem(HKEY)) || {}; } catch (e) { return {}; } }
  function saveHist(h) {
    for (var t = 0; t < 40; t++) {
      try { localStorage.setItem(HKEY, JSON.stringify(h)); return; } catch (e) {
        // 空間不夠：刪掉全部紀錄裡最舊的一張再試
        var ok = '', oi = -1, ots = Infinity;
        Object.keys(h).forEach(function (k) { (h[k] || []).forEach(function (r, i) { if (r.ts < ots) { ots = r.ts; ok = k; oi = i; } }); });
        if (oi < 0) return; h[ok].splice(oi, 1); if (!h[ok].length) delete h[ok];
      }
    }
  }
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

  function open(paper, bankAll, grade, replay) {
    if (document.getElementById('kg-exam')) return;
    if (!css.parentNode) document.head.appendChild(css);
    if (replay) return openReplay(paper, bankAll, grade, replay);
    var units = paper.units && paper.units.length ? paper.units : null;
    var bank = (bankAll || []).filter(function (b) { return !units || units.indexOf(unitOf(b)) >= 0; });
    var count = paper.count || 45;
    var secs = build(bank, count), all = [];
    if (paper.__rec) { secs = {}; SEC.forEach(function (s) { secs[s[0]] = paper.__rec.secs[s[0]] || []; }); }
    var pool = [];   // 範圍內所有填充題的答案，當詞語框的誘答
    bank.forEach(function (b) {
      var q = typeof b === 'function' ? b() : b;
      if (typeOf(q) !== 'fill') return;
      var a = Array.isArray(q.answer) ? q.answer[0] : q.answer;
      if (a !== undefined && a !== null && String(a).trim()) pool.push({ a: String(a), unit: q.unit });
    });
    (secs.fill || []).forEach(function (q) {
      var a = String(Array.isArray(q.answer) ? q.answer[0] : q.answer);
      q.numeric = !isNaN(num(a));
      if (q.numeric || q.chips) return;
      var seen = {}, out = [a]; seen[norm(a)] = 1;
      var cand = shuffle(pool.filter(function (x) { return x.unit === q.unit && isNaN(num(x.a)); })).concat(shuffle(pool.filter(function (x) { return x.unit !== q.unit && isNaN(num(x.a)); })));
      for (var k = 0; k < cand.length && out.length < 4; k++) {
        var n = norm(cand[k].a);
        if (seen[n] || same(cand[k].a, q.answer)) continue;
        seen[n] = 1; out.push(cand[k].a);
      }
      q.chips = out.length > 1 ? shuffle(out) : null;
    });
    SEC.forEach(function (s) { (secs[s[0]] || []).forEach(function (q) { all.push(q); }); });
    if (!all.length) { alert('這份測驗卷的題目還在準備中！'); return; }
    var title = paper.title, full = (grade ? grade + ' ' : '') + title;
    var box = document.createElement('div'); box.id = 'kg-exam';
    // 數學試卷附浮動計算機（試卷設定 calculator: false 可關掉）
    var useCalc = paper.calculator !== undefined ? paper.calculator : /\/math5a-lab\//.test(location.pathname);
    document.body.appendChild(box);
    var started = Date.now(), picks = [], lastWallet = null, replayRec = paper.__rec || null;
    if (replayRec) { started = replayRec.started || replayRec.ts; picks = replayRec.picks.map(function (p) { return { a: p.a, ok: p.ok }; }); }
    function close() { box.remove(); var cc = document.getElementById('kgx-calc'); if (cc) cc.remove(); document.documentElement.style.overflow = ''; }
    if (useCalc) addCalc();
    document.documentElement.style.overflow = 'hidden';

    function render(done, onlyWrong) {
      var n = 0, right = 0;
      all.forEach(function (q, i) { if (done && picks[i] && picks[i].ok) right++; });
      var score = done ? Math.round(right / all.length * 100) : 0, stars = starsOf(score);
      var h = '<div class="paper"><div class="top"><b>📝 ' + esc(full) + '</b><button class="x" type="button">' + (done ? '關閉' : '離開') + '</button></div>' +
        '<h1>' + esc(grade || '') + '</h1><div class="sub">' + esc(title) + '　共 ' + all.length + ' 題，每題 ' + (Math.round(1000 / all.length) / 10) + ' 分</div>' +
        '<div class="name">班級：<span></span>　姓名：<span></span>　得分：<span style="color:#d22;font-weight:800;text-align:center">' + (done ? score : '') + '</span></div>';
      if (done) {
        var mins = Math.max(1, Math.round(((replayRec ? replayRec.ts : Date.now()) - started) / 60000));
        h += '<div class="res"><div class="sc">' + score + '</div><div class="stars">' + starHTML(stars) + '</div>' +
          '<div>答對 ' + right + ' / ' + all.length + ' 題・作答約 ' + mins + ' 分鐘</div>' +
          '<div style="color:#666">' + (stars === 2 ? '滿分！月考準備好了！' : stars === 1.5 ? '很棒！把錯的題目再看一次就更穩了。' : stars === 1 ? '及格了！錯的地方要訂正喔。' : '還不到 80 分，先看錯的題目和解說，再寫一張吧！') + '</div>' +
          '<div style="font-size:13px;color:#888">評分：80 分 ★、90 分 ★½、100 分 ★★</div>' +
          (stars && lastWallet !== null ? '<div style="margin-top:6px;font-weight:800;color:#b07a00">⭐ 得到 ' + stars + ' 顆星，現在共有 ' + lastWallet + ' 顆！回首頁按「🐾 換萌寵」可以解鎖新萌寵。</div>' : '') + '</div>' +
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
          else {
            var v = esc(p ? p.a : '');
            if (done) body += '<div><input type="text" value="' + v + '" disabled></div>';
            else if (q.numeric) body += '<div><input class="pick" type="text" inputmode="none" readonly placeholder="點這裡填數字" value="' + v + '"><button class="typ" type="button">⌨️ 自己打字</button></div>' +
              '<div class="np" hidden>' + ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '.', '/', '又', '⌫', '清除'].map(function (k) { return '<button type="button" class="' + (/[⌫清]/.test(k) ? 'fn' : '') + '" data-n="' + k + '">' + k + '</button>'; }).join('') + '</div>';
            else if (q.chips) body += '<div><input class="pick" type="text" readonly placeholder="從下面選一個" value="' + v + '"><button class="typ" type="button">⌨️ 自己打字</button></div>' +
              '<div class="chips">' + q.chips.map(function (c, k) { return '<button type="button" data-c="' + k + '" class="' + (p && p.a === c ? 'sel' : '') + '">' + esc(c) + '</button>'; }).join('') + '</div>';
            else body += '<div><input type="text" inputmode="text" autocomplete="off" placeholder="寫答案" value="' + v + '"></div>';
          }
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
        box.querySelector('[data-again]').onclick = function () { var pp = Object.assign({}, paper); delete pp.__rec; close(); open(pp, bankAll, grade); };
        box.querySelectorAll('[data-f]').forEach(function (b) { b.onclick = function () { render(true, b.dataset.f === 'wrong'); box.scrollTop = 0; if (replayRec) { var tp = box.querySelector('.top b'); if (tp) tp.textContent = '📄 ' + full + '（重看寫過的試卷）'; } }; });
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
        var setV = function (v) { inp.value = v; picks[i] = { a: v }; left(); };
        it.querySelectorAll('.chips button').forEach(function (b) {
          b.onclick = function () { setV(q.chips[+b.dataset.c]); it.querySelectorAll('.chips button').forEach(function (x) { x.classList.toggle('sel', x === b); }); };
        });
        var np = it.querySelector('.np');
        if (np) {
          inp.onclick = function () { box.querySelectorAll('.np').forEach(function (o) { if (o !== np) o.hidden = true; }); np.hidden = !np.hidden; };
          np.querySelectorAll('button').forEach(function (b) {
            b.onclick = function () {
              var k = b.dataset.n, v = inp.value;
              if (k === '⌫') v = v.slice(0, -1); else if (k === '清除') v = ''; else if (v.length < 14) v += k;
              setV(v);
            };
          });
        }
        var typ = it.querySelector('.typ');
        if (typ) typ.onclick = function () {
          inp.readOnly = false; inp.removeAttribute('inputmode'); inp.classList.remove('pick'); inp.placeholder = '寫答案';
          if (np) { np.hidden = true; inp.onclick = null; }
          typ.remove(); inp.focus();
        };
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
      // 星星存起來，可以在首頁解鎖萌寵
      lastWallet = stars && window.KGPet && KGPet.addStars ? KGPet.addStars(stars, full) : null;
      if (window.KGReport) KGReport.done({ right: right, total: all.length, stars: stars });
      var d = loadBest(), k = gameId() + '|' + title, o = d[k] || { n: 0 };
      o.n++; o.last = score; o.ts = Date.now(); if (!(o.best >= score)) o.best = score; o.stars = starsOf(o.best);
      d[k] = o; saveBest(d);
      var hist = loadHist(), rec = { ts: Date.now(), started: started, title: title, grade: grade || '', score: score, stars: stars, right: right, total: all.length,
        secs: {}, picks: picks.map(function (p) { return { a: p.a, ok: p.ok }; }) };
      SEC.forEach(function (s) { rec.secs[s[0]] = (secs[s[0]] || []).map(function (q) { return { type: q.type, unit: q.unit, q: q.q, choices: q.choices, answer: q.answer, explain: q.explain, unit2: q.unit2, numeric: q.numeric, chips: q.chips }; }); });
      (hist[k] = hist[k] || []).unshift(rec); if (hist[k].length > KEEP) hist[k].length = KEEP;
      saveHist(hist);
      render(true, false); box.scrollTop = 0;
      if (window.__kgExamMounted) window.__kgExamMounted.forEach(function (f) { f(); });
    }
    if (replayRec) { render(true, false); var tp = box.querySelector('.top b'); if (tp) tp.textContent = '📄 ' + full + '（' + new Date(replayRec.ts).toLocaleString('zh-TW', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' }) + ' 寫的）'; }
    else render(false);
  }


  // ---------- 數學試卷的浮動計算機（可拖曳、縮放、收起） ----------
  var CALC_CSS =
    '#kgx-calc{position:fixed;right:16px;top:90px;z-index:2147483600;width:250px;background:#2f3542;border-radius:16px;box-shadow:0 10px 30px rgba(0,0,0,.35);font-family:"Microsoft JhengHei",Arial,sans-serif;user-select:none;touch-action:none;transform-origin:top right}' +
    '#kgx-calc *{box-sizing:border-box}' +
    '#kgx-calc .hd{display:flex;align-items:center;gap:4px;padding:6px 8px;color:#fff;cursor:move;font-weight:700;font-size:14px}' +
    '#kgx-calc .hd span{flex:1}' +
    '#kgx-calc .hd button{border:none;background:#57606f;color:#fff;border-radius:8px;width:28px;height:28px;font-size:15px;cursor:pointer;padding:0}' +
    '#kgx-calc .scr{margin:0 8px;background:#dfe6e9;border-radius:10px;padding:6px 10px;text-align:right;min-height:62px;display:grid;align-content:end}' +
    '#kgx-calc .ex{font-size:14px;color:#555;min-height:18px;word-break:break-all}' +
    '#kgx-calc .rs{font-size:26px;font-weight:800;color:#222;word-break:break-all}' +
    '#kgx-calc .ks{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;padding:8px}' +
    '#kgx-calc .ks button{border:none;border-radius:10px;height:42px;font-size:19px;font-weight:700;cursor:pointer;background:#f1f2f6;color:#222;padding:0}' +
    '#kgx-calc .ks .op{background:#ffa502;color:#fff}#kgx-calc .ks .eq{background:#2ed573;color:#fff}#kgx-calc .ks .fn{background:#a4b0be;color:#222}' +
    '#kgx-calc.min{width:auto;background:none;box-shadow:none}' +
    '#kgx-calc.min .scr,#kgx-calc.min .ks,#kgx-calc.min .hd span,#kgx-calc.min .hd .sz{display:none}' +
    '#kgx-calc.min .hd{padding:0}#kgx-calc.min .hd .mn{width:54px;height:54px;border-radius:50%;font-size:28px;background:#2f3542;box-shadow:0 6px 16px rgba(0,0,0,.3)}';
  // 安全的四則運算（不使用 eval）：支援 + − × ÷、括號、小數，先乘除後加減
  function calcEval(str) {
    var t = str.replace(/×/g, '*').replace(/÷/g, '/').replace(/−/g, '-'), i = 0;
    function peek() { return t[i]; }
    function num() { var m = t.slice(i).match(/^\d*\.?\d+/); if (!m) throw 0; i += m[0].length; return parseFloat(m[0]); }
    function factor() {
      if (peek() === '-') { i++; return -factor(); }
      if (peek() === '(') { i++; var v = expr(); if (peek() === ')') i++; return v; }
      return num();
    }
    function term() { var v = factor(); while (peek() === '*' || peek() === '/') { var o = t[i++], w = factor(); if (o === '/' && w === 0) throw 1; v = o === '*' ? v * w : v / w; } return v; }
    function expr() { var v = term(); while (peek() === '+' || peek() === '-') { var o = t[i++], w = term(); v = o === '+' ? v + w : v - w; } return v; }
    var r = expr(); if (i < t.length) throw 0;
    return Math.round(r * 1e10) / 1e10;
  }
  function addCalc() {
    if (document.getElementById('kgx-calc')) return document.getElementById('kgx-calc');
    if (!document.getElementById('kgx-calc-css')) { var st = document.createElement('style'); st.id = 'kgx-calc-css'; st.textContent = CALC_CSS; document.head.appendChild(st); }
    var c = document.createElement('div'); c.id = 'kgx-calc';
    var keys = [['C', 'fn'], ['(', 'fn'], [')', 'fn'], ['÷', 'op'], ['7'], ['8'], ['9'], ['×', 'op'], ['4'], ['5'], ['6'], ['−', 'op'], ['1'], ['2'], ['3'], ['+', 'op'], ['0'], ['.'], ['⌫', 'fn'], ['=', 'eq']];
    c.innerHTML = '<div class="hd"><span>🧮 計算機</span><button class="sz" data-z="-" type="button" title="縮小">－</button><button class="sz" data-z="+" type="button" title="放大">＋</button><button class="mn" type="button" title="收起／打開">🧮</button></div>' +
      '<div class="scr"><div class="ex"></div><div class="rs">0</div></div><div class="ks">' + keys.map(function (k) { return '<button type="button" class="' + (k[1] || '') + '" data-k="' + k[0] + '">' + k[0] + '</button>'; }).join('') + '</div>';
    document.body.appendChild(c);
    var ex = c.querySelector('.ex'), rs = c.querySelector('.rs'), cur = '', justEq = false, scale = 1;
    if (innerWidth < 600) c.classList.add('min');   // 手機先收起來，點 🧮 打開
    function show() { rs.textContent = cur || '0'; }
    c.querySelectorAll('.ks button').forEach(function (b) {
      b.onclick = function () {
        var k = b.dataset.k;
        if (k === 'C') { cur = ''; ex.textContent = ''; }
        else if (k === '⌫') cur = cur.slice(0, -1);
        else if (k === '=') {
          if (!cur) return;
          try { var v = calcEval(cur); ex.textContent = cur + ' ='; cur = String(v); justEq = true; show(); return; }
          catch (e) { ex.textContent = e === 1 ? '不能除以 0' : '算式不完整'; return; }
        } else {
          if (justEq && /[0-9.(]/.test(k)) cur = '';
          if (cur.length < 40) cur += k;
        }
        justEq = false; show();
      };
    });
    var mnBtn = c.querySelector('.mn'), skip = false;
    mnBtn.onclick = function () { if (skip) return; c.classList.toggle('min'); };
    c.querySelectorAll('.sz').forEach(function (b) { b.onclick = function () { scale = Math.max(0.7, Math.min(1.6, scale + (b.dataset.z === '+' ? 0.15 : -0.15))); c.style.transform = 'scale(' + scale + ')'; }; });
    // 拖曳標題列移動（收起時拖 🧮 圓鈕）
    var hd = c.querySelector('.hd');
    hd.addEventListener('pointerdown', function (e) {
      if (e.target.tagName === 'BUTTON' && e.target !== mnBtn) return;
      var r = c.getBoundingClientRect(), dx = e.clientX - r.left, dy = e.clientY - r.top, sx = e.clientX, sy = e.clientY, drag = false;
      function mv(ev) {
        if (!drag && Math.abs(ev.clientX - sx) + Math.abs(ev.clientY - sy) < 6) return;
        drag = true; c.style.right = 'auto';
        c.style.left = Math.max(0, Math.min(innerWidth - 60, ev.clientX - dx)) + 'px';
        c.style.top = Math.max(0, Math.min(innerHeight - 60, ev.clientY - dy)) + 'px';
      }
      function up() { removeEventListener('pointermove', mv); removeEventListener('pointerup', up); if (drag) { skip = true; setTimeout(function () { skip = false; }, 60); } }
      addEventListener('pointermove', mv); addEventListener('pointerup', up);
    });
    return c;
  }


  function openReplay(paper, bankAll, grade, rec) {
    var pp = Object.assign({}, paper, { __rec: rec });
    return open(pp, bankAll, grade);
  }

  // 在年級頁畫出「月考測驗卷」欄位
  function mount(el, B) {
    if (!el || !B) return;
    if (!css.parentNode) document.head.appendChild(css);
    function histHTML() {
      var h = loadHist(), rows = [];
      B.papers.forEach(function (p) { var k = gameId() + '|' + p.title; (h[k] || []).forEach(function (r, i) { rows.push({ k: k, i: i, r: r }); }); });
      if (!rows.length) return '';
      rows.sort(function (a, b) { return b.r.ts - a.r.ts; });
      return '<h3 style="margin-top:6px">📄 寫過的試卷</h3><div style="color:#666;font-size:14px">點一下就能重看當時的作答、正確答案和解說（每份保留最近 ' + KEEP + ' 次）。</div><div class="hist">' +
        rows.slice(0, 15).map(function (x) {
          var t = new Date(x.r.ts);
          return '<button class="hrow" type="button" data-h="' + esc(x.k) + '#' + x.i + '"><span>' + (t.getMonth() + 1) + '/' + t.getDate() + ' ' + ('0' + t.getHours()).slice(-2) + ':' + ('0' + t.getMinutes()).slice(-2) + '</span><b>' + esc(x.r.title) + '</b><span class="sc2">' + x.r.score + ' 分 ' + starHTML(x.r.stars) + '</span></button>';
        }).join('') + '</div>';
    }
    function draw() {
      var d = loadBest();
      el.innerHTML = '<div id="kgx-panel"><h3>📝 月考測驗卷</h3><div style="color:#666;font-size:14px">正式的考前複習試卷，每張 40～50 題（是非、選擇、填充），題目每次會換。80 分 ★、90 分 ★½、100 分 ★★。</div>' +
        '<div class="cards">' + B.papers.map(function (p, i) {
          var o = d[gameId() + '|' + p.title];
          return '<button class="card" type="button" data-p="' + i + '"><b>' + esc(p.title) + '</b><small>' + (p.count || 45) + ' 題' + (p.units && p.units.length ? '・' + p.units.length + ' 個單元' : '') + '</small>' +
            (o ? '<span class="best">最佳 ' + o.best + ' 分 ' + starHTML(o.stars) + '　（寫過 ' + o.n + ' 次）</span>' : '<small>還沒寫過</small>') + '</button>';
        }).join('') + '</div>' + histHTML() + '</div>';
      el.querySelectorAll('[data-p]').forEach(function (b) { b.onclick = function () { open(B.papers[+b.dataset.p], B.bank, B.grade); }; });
      el.querySelectorAll('[data-h]').forEach(function (b) {
        b.onclick = function () {
          var x = b.dataset.h.split('#'), rec = (loadHist()[x[0]] || [])[+x[1]];
          if (!rec) return;
          var paper = B.papers.filter(function (p) { return gameId() + '|' + p.title === x[0]; })[0] || { title: rec.title };
          open(paper, B.bank, rec.grade || B.grade, rec);
        };
      });
    }
    draw();
    (window.__kgExamMounted = window.__kgExamMounted || []).push(draw);
  }

  window.KGExam = { mount: mount, open: open, starsOf: starsOf, _num: num, _same: same, _build: build, _typeOf: typeOf };
})();

// 測驗卷：寫完換積分，積分在首頁的「萌寵小屋」換陪讀萌寵（pets.js）。
// home-button.js 會自動載入。遊戲端只要提供題庫並呼叫：
//   KGExam.open({ title: '三年級上學期 數學測驗卷', count: 10, bank: [...] })
// bank 每一項是題目物件，或回傳題目物件的函式（亂數出題）。題目物件：
//   { unit: '第 2 單元 四位數的加減', q: '題目（可以有 HTML、SVG 圖）',
//     choices: ['甲', '乙', '丙', '丁'], answer: '乙', explain: '解說' }        // 選擇題（選項會自動打亂）
//   { unit: '…', q: '…', input: 'number', answer: 4107, unit2: '本', explain: '…' }  // 填數字（可填 3/4、1又2/3、0.5）
// 會平均從各單元抽題。答錯、答對都會記到家長報表（關卡名稱「📝 測驗卷」）。
(function () {
  if (window.KGExam) return;
  var css = document.createElement('style');
  css.textContent =
    '#kg-exam{position:fixed;inset:0;z-index:2147483500;background:rgba(40,30,20,.55);display:flex;align-items:center;justify-content:center;padding:10px;font-family:"Microsoft JhengHei","PingFang TC","Noto Sans TC",sans-serif}' +
    '#kg-exam .paper{position:relative;width:min(760px,100%);max-height:96vh;overflow:auto;background:#fffdf6;border-radius:18px;box-shadow:0 12px 40px rgba(0,0,0,.35);padding:20px 18px 24px;color:#2b2b2b;background-image:repeating-linear-gradient(transparent 0 37px,#eee3cf 37px 38px)}' +
    '#kg-exam .hd{display:flex;align-items:center;gap:10px;border-bottom:3px double #c9a66b;padding-bottom:10px;margin-bottom:14px}' +
    '#kg-exam .hd h2{flex:1;font-size:clamp(18px,4.6vw,24px);color:#7a4e1d;margin:0}' +
    '#kg-exam .x{border:none;background:#eee;border-radius:50%;width:38px;height:38px;font-size:18px;cursor:pointer}' +
    '#kg-exam .prog{font-weight:800;color:#b5651d}' +
    '#kg-exam .unit{font-size:13px;color:#8a7a66;margin-bottom:4px}' +
    '#kg-exam .q{font-size:clamp(18px,4.6vw,22px);font-weight:700;line-height:1.6;margin:6px 0 16px}' +
    '#kg-exam .q svg,#kg-exam .q img{max-width:100%;height:auto}' +
    '#kg-exam .ch{display:grid;gap:10px}' +
    '#kg-exam .ch button,#kg-exam .btn{font:inherit;font-size:18px;font-weight:700;text-align:left;padding:12px 14px;border-radius:14px;border:3px solid #e2cfae;background:#fff;cursor:pointer;color:#2b2b2b;min-height:48px}' +
    '#kg-exam .ch button b{display:inline-block;width:28px;color:#b5651d}' +
    '#kg-exam .ch button:hover{border-color:#e0954a}' +
    '#kg-exam .inp{display:flex;gap:8px;align-items:center;flex-wrap:wrap}' +
    '#kg-exam .inp output{min-width:140px;min-height:52px;font-size:26px;font-weight:800;border:3px solid #e2cfae;border-radius:12px;background:#fff;display:flex;align-items:center;padding:0 12px}' +
    '#kg-exam .pad{display:grid;grid-template-columns:repeat(5,1fr);gap:8px;margin-top:12px;max-width:420px}' +
    '#kg-exam .pad button{font:inherit;font-size:20px;font-weight:800;min-height:50px;border-radius:12px;border:2px solid #e2cfae;background:#fff;cursor:pointer}' +
    '#kg-exam .btn.main{background:#e0954a;border-color:#e0954a;color:#fff;text-align:center;box-shadow:0 4px 0 #b5651d}' +
    '#kg-exam .btn.main:disabled{opacity:.45}' +
    '#kg-exam .row{display:flex;gap:10px;flex-wrap:wrap;align-items:center;margin-top:16px}' +
    '#kg-exam .score{font-size:64px;font-weight:900;color:#d94f4f;text-align:center;font-family:"Comic Sans MS","Microsoft JhengHei",sans-serif;transform:rotate(-6deg)}' +
    '#kg-exam .rev{display:grid;gap:10px;margin-top:10px}' +
    '#kg-exam .rev .it{border:2px solid #eadfce;border-radius:12px;padding:10px 12px;background:#fff}' +
    '#kg-exam .rev .ok{color:#23a55a;font-weight:800}#kg-exam .rev .bad{color:#d94f4f;font-weight:800}' +
    '#kg-exam .reward{display:grid;gap:8px;justify-items:center;text-align:center;background:#fff6e5;border:3px dashed #e0954a;border-radius:16px;padding:14px;margin-top:12px}' +
    '#kg-exam .reward img{width:110px;height:110px;object-fit:contain}' +
    '#kg-exam .reward .evo{animation:kgeEvo 1.2s ease-in-out 2}' +
    '@keyframes kgeEvo{0%,100%{transform:scale(1);filter:none}50%{transform:scale(1.35);filter:brightness(1.6) drop-shadow(0 0 16px #ffd34d)}}';

  function esc(s) { return String(s === undefined || s === null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function plain(s) { return String(s || '').replace(/<svg[\s\S]*?<\/svg>/gi, '（圖）').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim(); }
  function shuffle(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  // 把答案轉成數字（支援 3/4、1又2/3、全形）
  function num(s) {
    s = String(s).replace(/[０-９]/g, function (c) { return String.fromCharCode(c.charCodeAt(0) - 65248); }).replace(/[／]/g, '/').replace(/[．]/g, '.').replace(/\s+/g, '');
    var m = s.match(/^(-?\d+)又(\d+)\/(\d+)$/);
    if (m) { if (+m[2] >= +m[3] || +m[2] === 0) return NaN; return +m[1] + m[2] / m[3]; }
    m = s.match(/^(-?\d+(?:\.\d+)?)\/(\d+(?:\.\d+)?)$/);
    if (m) return +m[2] ? m[1] / m[2] : NaN;
    return /^-?\d+(\.\d+)?$/.test(s) ? +s : NaN;
  }
  function same(a, ans) {
    var list = Array.isArray(ans) ? ans : [ans];
    for (var i = 0; i < list.length; i++) {
      var x = num(a), y = num(list[i]);
      if (!isNaN(x) && !isNaN(y) && Math.abs(x - y) < 1e-9) return true;
      if (String(a).replace(/\s+/g, '') === String(list[i]).replace(/\s+/g, '')) return true;
    }
    return false;
  }
  // 平均從各單元抽題
  function pickQs(bank, count) {
    var byUnit = {}, units = [];
    bank.forEach(function (b, i) { var u = (typeof b === 'object' && b.unit) || '_'; if (!byUnit[u]) { byUnit[u] = []; units.push(u); } byUnit[u].push(b); });
    units.forEach(function (u) { byUnit[u] = shuffle(byUnit[u]); });
    var out = [], k = 0, guard = 0;
    units = shuffle(units);
    while (out.length < count && guard++ < 500) {
      var u = units[k++ % units.length], list = byUnit[u];
      if (list.length) out.push(list.shift());
      else if (units.every(function (x) { return !byUnit[x].length; })) break;
    }
    return out.map(function (b) { var q = typeof b === 'function' ? b() : b; q = Object.assign({}, q); if (q.choices) q.choices = shuffle(q.choices); return q; });
  }

  function open(opt) {
    if (document.getElementById('kg-exam')) return;
    if (!css.parentNode) document.head.appendChild(css);
    var qs = pickQs(opt.bank || [], opt.count || 10), ans = [], i = 0;
    if (!qs.length) { alert('這個年級的測驗卷還在準備中，敬請期待！'); return; }
    var title = opt.title || (document.title + ' 測驗卷');
    var box = document.createElement('div'); box.id = 'kg-exam';
    box.innerHTML = '<div class="paper"></div>';
    document.body.appendChild(box);
    var paper = box.querySelector('.paper');
    if (window.KGReport) KGReport.level('📝 測驗卷', title);
    function close() { box.remove(); }
    function head(extra) { return '<div class="hd"><h2>📝 ' + esc(title) + '</h2>' + (extra || '') + '<button class="x" type="button" aria-label="關閉">✕</button></div>'; }
    function bindClose(confirmIt) {
      paper.querySelector('.x').onclick = function () { if (!confirmIt || confirm('還沒寫完，確定要離開嗎？這張測驗卷不會得到積分。')) close(); };
    }
    function show() {
      if (i >= qs.length) return finish();
      var q = qs[i];
      var body = '<div class="unit">' + esc(q.unit || '') + '</div><div class="q">' + (i + 1) + '. ' + (q.q || '') + '</div>';
      if (q.choices) body += '<div class="ch">' + q.choices.map(function (c, k) { return '<button type="button" data-k="' + k + '"><b>' + '甲乙丙丁戊己'[k] + '</b>' + c + '</button>'; }).join('') + '</div>';
      else {
        body += '<div class="inp"><output id="kge-v"></output>' + (q.unit2 ? '<span style="font-size:20px;font-weight:700">' + esc(q.unit2) + '</span>' : '') + '</div>' +
          '<div class="pad">' + ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '.', '/', '又', '−', '⌫'].map(function (k) { return '<button type="button" data-p="' + k + '">' + k + '</button>'; }).join('') + '</div>' +
          '<div class="row"><button class="btn main" id="kge-go" type="button" disabled>寫好了 ✔</button></div>';
      }
      paper.innerHTML = head('<span class="prog">' + (i + 1) + ' / ' + qs.length + '</span>') + body;
      bindClose(true);
      if (q.choices) paper.querySelectorAll('.ch button').forEach(function (b) { b.onclick = function () { answer(q.choices[+b.dataset.k]); }; });
      else {
        var v = '', out = paper.querySelector('#kge-v'), go = paper.querySelector('#kge-go');
        paper.querySelectorAll('.pad button').forEach(function (b) {
          b.onclick = function () {
            var k = b.dataset.p;
            if (k === '⌫') v = v.slice(0, -1); else if (k === '−') v = v[0] === '-' ? v.slice(1) : '-' + v; else if (v.length < 12) v += k;
            out.textContent = v; go.disabled = !v;
          };
        });
        go.onclick = function () { if (v) answer(v); };
      }
      paper.scrollTop = 0;
    }
    function answer(a) {
      var q = qs[i], ok = same(a, q.answer);
      ans.push({ a: a, ok: ok });
      if (window.KGReport) KGReport.answer(ok, { q: plain(q.q), a: plain(a), c: plain(Array.isArray(q.answer) ? q.answer[0] : q.answer) + (q.unit2 ? ' ' + q.unit2 : '') });
      i++; setTimeout(show, 120);
    }
    function finish() {
      var right = ans.filter(function (x) { return x.ok; }).length, total = qs.length, score = Math.round(right / total * 100);
      var res = window.KGPet ? KGPet.addPaper({ right: right, total: total, title: title }) : null;
      if (window.KGReport) KGReport.done({ right: right, total: total, stars: score >= 90 ? 3 : score >= 70 ? 2 : score >= 60 ? 1 : 0 });
      var reward = '';
      if (res) {
        var d = KGPet.get(), p = d.active && KGPet.pet(d.active), o = p && d.owned[p.id];
        reward = '<div class="reward"><div style="font-size:20px;font-weight:800">⭐ 得到 ' + res.gain + ' 積分！（現在有 ' + res.points + ' 分）</div>';
        if (p && o) {
          var s = KGPet.stageOf(o.papers), st = p.stages[s - 1] || p.stages[0];
          reward += '<img class="' + (res.evolved ? 'evo' : '') + '" src="' + KGPet.url(st.img) + '" alt="' + esc(p.name) + '">' +
            (res.evolved ? '<div style="font-size:22px;font-weight:900;color:#d94f4f">🎉 ' + esc(p.name) + ' 進化成「' + KGPet.STAGE_NAME[s - 1] + '」了！</div>'
              : res.pass ? '<div>' + esc(p.name) + '：' + (res.toNext ? '再完成 ' + res.toNext + ' 張測驗卷，我就會進化喔！' : '我已經是最強的傳說型態了！') + '</div>'
              : '<div>' + esc(p.name) + '：答對 6 成以上才算完成一張，再試一次吧！</div>');
        } else reward += '<div>到首頁的「🐾 萌寵小屋」用積分換一隻陪讀萌寵吧！</div>';
        reward += '<a class="btn" href="' + KGPet.BASE + 'pets.html" style="text-align:center;text-decoration:none">🐾 去萌寵小屋</a></div>';
      }
      paper.innerHTML = head() + '<div class="score">' + score + ' 分</div>' +
        '<div style="text-align:center;font-weight:700">答對 ' + right + ' / ' + total + ' 題</div>' + reward +
        '<h3 style="margin-top:18px">📖 對答案</h3><div class="rev">' + qs.map(function (q, k) {
          var x = ans[k], c = Array.isArray(q.answer) ? q.answer[0] : q.answer;
          return '<div class="it"><div>' + (k + 1) + '. ' + (q.q || '') + '</div>' +
            '<div class="' + (x.ok ? 'ok' : 'bad') + '">' + (x.ok ? '⭕ 答對' : '❌ 你寫：' + x.a) + '</div>' +
            (x.ok ? '' : '<div class="ok">正確答案：' + c + (q.unit2 ? ' ' + esc(q.unit2) : '') + '</div>') +
            (q.explain ? '<div style="color:#6b6b6b;font-size:15px;margin-top:4px">💡 ' + q.explain + '</div>' : '') + '</div>';
        }).join('') + '</div><div class="row"><button class="btn main" id="kge-again" type="button">再寫一張</button><button class="btn" id="kge-close" type="button">關閉</button></div>';
      bindClose(false);
      paper.querySelector('#kge-close').onclick = close;
      paper.querySelector('#kge-again').onclick = function () { close(); open(opt); };
      paper.scrollTop = 0;
    }
    show();
  }
  window.KGExam = { open: open, _num: num, _same: same };
})();

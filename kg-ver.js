// 三版本（南一・康軒・翰林）共用：家長設定、年級頁的版本／範圍切換、依版本排列單元、月考試卷範圍。
// 科目首頁：KGVer.wizard(el, { subject: 'math', name: '數學', grades: [1,2,3,4,5,6], books: { '3上': 'grade3/', '3下': 'grade3-2/', … } })
// 年級遊戲：先載入自己的 js/book.js（window.BOOK），再
//   KGVer.bar(el, BOOK, onChange)   畫出「三年級上學期・康軒版／換版本／期中・期末・全冊」列
//   KGVer.units(BOOK)               目前版本、目前範圍要顯示的單元（依該版本順序）
//   KGVer.examBank(BOOK, EXAM_BANK) 依版本重新組成期中／期末／全冊三份試卷
// BOOK 格式：
//   { subject: 'math', grade: 3, sem: '上',
//     versions: { nani: [ { no: 1, title: '10000 以內的數', levels: ['u1'], bankUnits: ['第 1 單元 …'] }, … ],
//                 kang: [ … ], han: [ … ] } }
//   levels＝遊戲內部的單元代號（遊戲自己決定怎麼用），bankUnits＝題庫裡對應的 unit 名稱。
(function () {
  if (window.KGVer) return;
  var KEY = 'kg-setup-v1';
  var PUB = { nani: '南一', kang: '康軒', han: '翰林' };
  var GR = ['', '一', '二', '三', '四', '五', '六'];
  var RANGE = { m1: '期中考範圍', m2: '期末考範圍', all: '全冊' };
  var SUBJ = { 'math5a-lab': 'math', 'science5-quest': 'science', 'social-puzzle': 'social' };
  function subj() { return SUBJ[location.pathname.split('/').filter(Boolean)[0]] || 'x'; }
  function loadAll() { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; } }
  function saveAll(d) { try { localStorage.setItem(KEY, JSON.stringify(d)); } catch (e) {} }
  function get(s) { return loadAll()[s || subj()] || {}; }
  function set(o, s) { var d = loadAll(), k = s || subj(); d[k] = Object.assign({}, d[k], o); saveAll(d); return d[k]; }
  function esc(t) { return String(t == null ? '' : t).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  var CSS = '#kgv-bar,#kgv-wiz{font-family:"Microsoft JhengHei","PingFang TC","Noto Sans TC",sans-serif;color:#2b2b2b}' +
    '#kgv-bar{display:flex;flex-wrap:wrap;gap:8px 12px;align-items:center;background:rgba(255,255,255,.92);border:2px solid #e6dccb;border-radius:16px;padding:8px 12px;margin:8px auto;max-width:960px;text-align:left}' +
    '#kgv-bar .lb{font-weight:800}#kgv-bar .grp{display:flex;gap:6px;flex-wrap:wrap;align-items:center}' +
    '#kgv-bar button{font:inherit;font-size:15px;font-weight:700;padding:6px 12px;border-radius:999px;border:2px solid #d8ccb8;background:#fff;color:#2b2b2b;cursor:pointer;min-height:38px}' +
    '#kgv-bar button.on{color:#fff;border-color:transparent}' +
    '#kgv-bar button.nani.on{background:#e85d4a}#kgv-bar button.kang.on{background:#2f80ed}#kgv-bar button.han.on{background:#23a55a}#kgv-bar button.rg.on{background:#8b5e34}' +
    '#kgv-wiz{max-width:860px;margin:0 auto;display:grid;gap:14px;text-align:left}' +
    '#kgv-wiz .pn{background:#fff;border:3px solid #eadfce;border-radius:20px;padding:16px;display:grid;gap:10px}' +
    '#kgv-wiz h2{margin:0;font-size:20px}#kgv-wiz .row{display:flex;flex-wrap:wrap;gap:10px}' +
    '#kgv-wiz .row button{font:inherit;font-size:18px;font-weight:800;padding:12px 18px;border-radius:16px;border:3px solid #e2d4bd;background:#fff;color:#2b2b2b;cursor:pointer;min-width:96px}' +
    '#kgv-wiz .row button[aria-pressed="true"]{background:#ff7a2f;border-color:#ff7a2f;color:#fff}' +
    '#kgv-wiz .row button.nani[aria-pressed="true"]{background:#e85d4a;border-color:#e85d4a}#kgv-wiz .row button.kang[aria-pressed="true"]{background:#2f80ed;border-color:#2f80ed}#kgv-wiz .row button.han[aria-pressed="true"]{background:#23a55a;border-color:#23a55a}' +
    '#kgv-wiz .row button:disabled{opacity:.4;cursor:not-allowed}' +
    '#kgv-wiz .go{font:inherit;font-size:20px;font-weight:900;padding:14px 28px;border-radius:999px;border:none;background:#ff7a2f;color:#fff;cursor:pointer;justify-self:end;box-shadow:0 5px 0 #c4561b}' +
    '#kgv-wiz .go:disabled{opacity:.4;box-shadow:none;cursor:default}#kgv-wiz .mut{color:#6b6b6b;font-size:14px}';
  function css() { if (!document.getElementById('kgv-css')) { var s = document.createElement('style'); s.id = 'kgv-css'; s.textContent = CSS; document.head.appendChild(s); } }

  // 年級頁：目前用哪個版本、哪個範圍
  function cur(BOOK) {
    var c = get(BOOK.subject);
    var v = c.version && BOOK.versions[c.version] ? c.version : (BOOK.defaultVersion || 'nani');
    var r = RANGE[c.range] ? c.range : 'all';
    return { version: v, range: r };
  }
  function units(BOOK) {
    var c = cur(BOOK), list = (BOOK.versions[c.version] || []).slice(), half = Math.ceil(list.length / 2);
    return c.range === 'm1' ? list.slice(0, half) : c.range === 'm2' ? list.slice(half) : list;
  }
  function bar(el, BOOK, onChange) {
    if (!el) return; css();
    function draw() {
      var c = cur(BOOK), list = BOOK.versions[c.version] || [], half = Math.ceil(list.length / 2);
      var sub = { m1: list.length ? '第 ' + list[0].no + '～' + list[half - 1].no + ' 單元' : '', m2: list.length > half ? '第 ' + list[half].no + '～' + list[list.length - 1].no + ' 單元' : '', all: '全部單元' };
      el.innerHTML = '<div id="kgv-bar"><span class="lb">📘 ' + GR[BOOK.grade] + '年級' + BOOK.sem + '學期</span>' +
        '<span class="grp">版本：' + ['nani', 'kang', 'han'].filter(function (v) { return BOOK.versions[v]; }).map(function (v) { return '<button type="button" class="' + v + (v === c.version ? ' on' : '') + '" data-v="' + v + '">' + PUB[v] + '</button>'; }).join('') + '</span>' +
        '<span class="grp">範圍：' + ['m1', 'm2', 'all'].map(function (r) { return '<button type="button" class="rg' + (r === c.range ? ' on' : '') + '" data-r="' + r + '" title="' + esc(sub[r]) + '">' + RANGE[r] + '</button>'; }).join('') + '</span></div>';
      el.querySelectorAll('[data-v]').forEach(function (b) { b.onclick = function () { set({ version: b.dataset.v, grade: BOOK.grade, sem: BOOK.sem }, BOOK.subject); draw(); onChange && onChange(); }; });
      el.querySelectorAll('[data-r]').forEach(function (b) { b.onclick = function () { set({ range: b.dataset.r }, BOOK.subject); draw(); onChange && onChange(); }; });
    }
    draw();
  }
  // 依版本組月考試卷：期中＝前半單元、期末＝後半、全冊
  function examBank(BOOK, EB) {
    var c = cur(BOOK), list = BOOK.versions[c.version] || [], half = Math.ceil(list.length / 2);
    var bu = function (arr) { var s = []; arr.forEach(function (u) { (u.bankUnits || []).forEach(function (x) { if (s.indexOf(x) < 0) s.push(x); }); }); return s; };
    var a = list.slice(0, half), b = list.slice(half);
    var rng = function (arr) { return arr.length ? '第 ' + arr[0].no + '～' + arr[arr.length - 1].no + ' 單元' : ''; };
    return { grade: (EB.grade || '') + '（' + PUB[c.version] + '版）', bank: EB.bank, papers: [
      { title: '期中考範圍（' + rng(a) + '）', units: bu(a), count: 45 },
      { title: '期末考範圍（' + rng(b) + '）', units: bu(b), count: 45 },
      { title: '全冊總複習', units: bu(list), count: 50 }] };
  }

  // 科目首頁的設定精靈：年級 → 版本 → 學期 → 範圍
  function wizard(el, CFG) {
    if (!el) return; css();
    var p = Object.assign({ range: 'm1' }, get(CFG.subject));
    function has(g, s) { return !!CFG.books[g + s]; }
    function draw() {
      el.innerHTML = '<div id="kgv-wiz">' +
        '<div class="pn"><h2>1. 孩子幾年級？</h2><div class="row">' + CFG.grades.map(function (g) { return '<button type="button" data-g="' + g + '" aria-pressed="' + (p.grade === g) + '">' + GR[g] + '年級</button>'; }).join('') + '</div></div>' +
        '<div class="pn"><h2>2. 用哪個版本的課本？</h2><div class="row">' + ['nani', 'kang', 'han'].map(function (v) { return '<button type="button" class="' + v + '" data-v="' + v + '" aria-pressed="' + (p.version === v) + '">' + PUB[v] + '版</button>'; }).join('') + '</div><div class="mut">不知道的話，看課本封面或聯絡簿上的版本。</div></div>' +
        '<div class="pn"><h2>3. 上學期還是下學期？</h2><div class="row">' + ['上', '下'].map(function (s) { return '<button type="button" data-s="' + s + '" aria-pressed="' + (p.sem === s) + '"' + (p.grade && !has(p.grade, s) ? ' disabled' : '') + '>' + s + '學期' + (p.grade && !has(p.grade, s) ? '（製作中）' : '') + '</button>'; }).join('') + '</div></div>' +
        '<div class="pn"><h2>4. 要準備哪一次考試？</h2><div class="row">' + ['m1', 'm2', 'all'].map(function (r) { return '<button type="button" data-r="' + r + '" aria-pressed="' + (p.range === r) + '">' + RANGE[r] + '</button>'; }).join('') + '</div><div class="mut">各校考試範圍可能不同，進去之後可以隨時切換版本和範圍。</div>' +
        '<button type="button" class="go"' + (p.grade && p.version && p.sem && has(p.grade, p.sem) ? '' : ' disabled') + '>出發去闖關 ▶</button></div></div>';
      el.querySelectorAll('[data-g]').forEach(function (b) { b.onclick = function () { p.grade = +b.dataset.g; if (p.sem && !has(p.grade, p.sem)) p.sem = null; draw(); }; });
      el.querySelectorAll('[data-v]').forEach(function (b) { b.onclick = function () { p.version = b.dataset.v; draw(); }; });
      el.querySelectorAll('[data-s]').forEach(function (b) { b.onclick = function () { p.sem = b.dataset.s; draw(); }; });
      el.querySelectorAll('[data-r]').forEach(function (b) { b.onclick = function () { p.range = b.dataset.r; draw(); }; });
      el.querySelector('.go').onclick = function () {
        if (!(p.grade && p.version && p.sem && has(p.grade, p.sem))) return;
        set({ grade: p.grade, version: p.version, sem: p.sem, range: p.range }, CFG.subject);
        location.href = CFG.books[p.grade + p.sem];
      };
    }
    draw();
  }

  window.KGVer = { PUB: PUB, get: get, set: set, cur: cur, units: units, bar: bar, examBank: examBank, wizard: wizard };
})();

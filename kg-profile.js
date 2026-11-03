// 一台裝置多個孩子：每個孩子有自己的一份進度（星星、家長報表、錯題本、試卷、萌寵、版本設定…）。
// 做法：整個網站的瀏覽器資料就是「目前這個孩子」的資料；換人時把目前的資料收進他的抽屜（kg-profile-data-<id>），
// 再把另一個孩子抽屜裡的資料放出來，然後重新整理。所以各科遊戲不用改，國文也會一起分開。
// 首頁：KGProfile.chip(容器)  畫出「👦 哥哥 換人 ▾」
// 其他頁：KGProfile.current() 取得目前孩子 {id, name, face}
(function () {
  if (window.KGProfile) return;
  var REG = 'kg-profiles-v1', BOX = 'kg-profile-data-';
  var KEEP = [REG, 'kg-bgm-on'];   // 不跟著換人的設定（背景音樂開關是整台裝置共用）
  var FACES = ['👦', '👧', '🧒', '👶', '🐯', '🐰', '🦊', '🐼', '🐱', '🐶'];
  function reg() { try { return JSON.parse(localStorage.getItem(REG)) || { list: [] }; } catch (e) { return { list: [] }; } }
  function saveReg(r) { localStorage.setItem(REG, JSON.stringify(r)); }
  function esc(t) { return String(t == null ? '' : t).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function mine(k) { return KEEP.indexOf(k) < 0 && k.indexOf(BOX) !== 0; }
  function current() { var r = reg(); for (var i = 0; i < r.list.length; i++) if (r.list[i].id === r.active) return r.list[i]; return null; }

  // 把目前的資料收進 id 的抽屜
  function stash(id) {
    var snap = {};
    for (var i = 0; i < localStorage.length; i++) { var k = localStorage.key(i); if (mine(k)) snap[k] = localStorage.getItem(k); }
    localStorage.setItem(BOX + id, JSON.stringify(snap));
    return snap;
  }
  function switchTo(id) {
    var r = reg();
    if (r.active === id) return true;
    try {
      if (r.active) stash(r.active);
      var keys = []; for (var i = 0; i < localStorage.length; i++) { var k = localStorage.key(i); if (mine(k)) keys.push(k); }
      keys.forEach(function (k) { localStorage.removeItem(k); });
      var data = {}; try { data = JSON.parse(localStorage.getItem(BOX + id)) || {}; } catch (e) {}
      Object.keys(data).forEach(function (k) { localStorage.setItem(k, data[k]); });
      localStorage.removeItem(BOX + id);   // 現在在使用中，抽屜清空
      r.active = id; saveReg(r);
      return true;
    } catch (e) { alert('手機的儲存空間不夠，換人失敗。可以到家長報表清除一些舊紀錄後再試。'); return false; }
  }
  function add(name, face) {
    var r = reg(), id = 'c' + Date.now().toString(36);
    r.list.push({ id: id, name: name, face: face });
    // 第一個孩子：直接沿用目前已經有的進度
    if (!r.active) r.active = id;
    saveReg(r); return id;
  }
  function remove(id) {
    var r = reg(); if (r.active === id) return false;
    r.list = r.list.filter(function (c) { return c.id !== id; }); localStorage.removeItem(BOX + id); saveReg(r); return true;
  }
  function rename(id, name, face) { var r = reg(); r.list.forEach(function (c) { if (c.id === id) { if (name) c.name = name; if (face) c.face = face; } }); saveReg(r); }

  var CSS = '#kgp-chip{font:inherit;font-weight:800;font-size:16px;display:inline-flex;align-items:center;gap:6px;padding:7px 14px;border-radius:999px;border:3px solid #ffb84d;background:#fff;color:#7a4e1d;cursor:pointer;box-shadow:0 4px 0 #ffb84d}' +
    '#kgp-chip .f{font-size:22px}' +
    '#kgp-pop{position:fixed;inset:0;z-index:2147483300;background:rgba(40,30,20,.5);display:flex;align-items:center;justify-content:center;padding:14px;font-family:"Microsoft JhengHei","PingFang TC","Noto Sans TC",sans-serif}' +
    '#kgp-pop .bx{width:min(460px,100%);max-height:92vh;overflow:auto;background:#fffaf2;border-radius:22px;padding:18px;display:grid;gap:12px;box-shadow:0 12px 36px rgba(0,0,0,.3);color:#2b2b2b}' +
    '#kgp-pop h2{margin:0;font-size:22px;color:#b5651d;text-align:center}#kgp-pop p{margin:0;color:#6b6b6b;font-size:14px;text-align:center}' +
    '#kgp-pop .kid{display:flex;align-items:center;gap:10px;background:#fff;border:3px solid #f0dcc0;border-radius:16px;padding:10px 12px}' +
    '#kgp-pop .kid.on{border-color:#ff9f43;background:#fff4e6}' +
    '#kgp-pop .kid .f{font-size:34px}#kgp-pop .kid b{flex:1;font-size:19px}' +
    '#kgp-pop button{font:inherit;cursor:pointer}' +
    '#kgp-pop .use{font-weight:800;font-size:16px;padding:8px 16px;border-radius:999px;border:none;background:#ff7a2f;color:#fff}' +
    '#kgp-pop .sm{font-size:13px;padding:5px 10px;border-radius:999px;border:2px solid #e2d4bd;background:#fff;color:#6b5b48}' +
    '#kgp-pop .now{font-weight:800;color:#23a55a;font-size:14px}' +
    '#kgp-pop .new{display:grid;gap:8px;background:#fff;border:2px dashed #e2d4bd;border-radius:16px;padding:12px}' +
    '#kgp-pop input{font:inherit;font-size:18px;padding:8px 10px;border:2px solid #e2d4bd;border-radius:10px;width:100%;box-sizing:border-box}' +
    '#kgp-pop .faces{display:flex;flex-wrap:wrap;gap:6px}#kgp-pop .faces button{font-size:26px;width:46px;height:46px;border-radius:12px;border:2px solid #eee;background:#fff}' +
    '#kgp-pop .faces button.sel{border-color:#ff7a2f;background:#fff1e6}' +
    '#kgp-pop .add{font-weight:800;font-size:17px;padding:10px;border-radius:999px;border:none;background:#23a55a;color:#fff}' +
    '#kgp-pop .close{justify-self:center;border:none;background:none;color:#8a7a66;text-decoration:underline}';
  function css() { if (!document.getElementById('kgp-css')) { var s = document.createElement('style'); s.id = 'kgp-css'; s.textContent = CSS; document.head.appendChild(s); } }

  function panel(onDone) {
    css();
    var w = document.createElement('div'); w.id = 'kgp-pop';
    var face = FACES[0], editing = null;
    function draw() {
      var r = reg(), cur = r.active;
      w.innerHTML = '<div class="bx"><h2>👨‍👩‍👧 誰要來玩？</h2><p>每個孩子的星星、闖關進度、家長報表、錯題本、試卷成績和萌寵都分開記錄。</p>' +
        r.list.map(function (c) {
          return '<div class="kid' + (c.id === cur ? ' on' : '') + '"><span class="f">' + c.face + '</span><b>' + esc(c.name) + '</b>' +
            (c.id === cur ? '<span class="now">✔ 使用中</span>' : '<button class="use" type="button" data-use="' + c.id + '">換成他</button>') +
            '<button class="sm" type="button" data-ed="' + c.id + '">改名</button>' +
            (c.id === cur ? '' : '<button class="sm" type="button" data-del="' + c.id + '">刪除</button>') + '</div>';
        }).join('') +
        '<div class="new"><b>' + (editing ? '✏️ 修改名字和頭像' : (r.list.length ? '➕ 新增一個孩子' : '先建立第一個孩子（目前的進度會給他）')) + '</b>' +
        '<input id="kgp-name" maxlength="10" placeholder="名字，例如：哥哥、小美" value="' + esc(editing ? editing.name : '') + '">' +
        '<div class="faces">' + FACES.map(function (f) { return '<button type="button" data-f="' + f + '" class="' + (f === face ? 'sel' : '') + '">' + f + '</button>'; }).join('') + '</div>' +
        '<button class="add" type="button">' + (editing ? '儲存' : '建立') + '</button></div>' +
        '<button class="close" type="button">關閉</button></div>';
      w.querySelectorAll('[data-f]').forEach(function (b) { b.onclick = function () { face = b.dataset.f; w.querySelectorAll('[data-f]').forEach(function (x) { x.classList.toggle('sel', x === b); }); }; });
      w.querySelector('.add').onclick = function () {
        var n = w.querySelector('#kgp-name').value.trim();
        if (!n) { w.querySelector('#kgp-name').focus(); return; }
        if (editing) { rename(editing.id, n, face); editing = null; draw(); onDone && onDone(); return; }
        var first = !reg().list.length;
        add(n, face); draw(); onDone && onDone();
        if (first) { w.remove(); }
      };
      w.querySelectorAll('[data-use]').forEach(function (b) { b.onclick = function () { if (switchTo(b.dataset.use)) location.reload(); }; });
      w.querySelectorAll('[data-ed]').forEach(function (b) { b.onclick = function () { editing = reg().list.filter(function (c) { return c.id === b.dataset.ed; })[0]; face = editing.face; draw(); }; });
      w.querySelectorAll('[data-del]').forEach(function (b) {
        b.onclick = function () {
          var c = reg().list.filter(function (x) { return x.id === b.dataset.del; })[0];
          if (c && confirm('確定要刪除「' + c.name + '」嗎？他的所有進度都會一起刪掉，無法復原。')) { remove(c.id); draw(); onDone && onDone(); }
        };
      });
      w.querySelector('.close').onclick = function () { w.remove(); };
    }
    draw(); document.body.appendChild(w);
  }
  function chip(el) {
    if (!el) return; css();
    function draw() {
      var c = current();
      el.innerHTML = '<button id="kgp-chip" type="button">' + (c ? '<span class="f">' + c.face + '</span>' + esc(c.name) + '<small style="font-weight:700;color:#b5651d">　換人 ▾</small>' : '<span class="f">👤</span>設定小孩（兩個以上孩子用）') + '</button>';
      el.querySelector('#kgp-chip').onclick = function () { panel(draw); };
    }
    draw();
  }
  window.KGProfile = { current: current, chip: chip, panel: panel, switchTo: switchTo, list: function () { return reg().list; } };
})();

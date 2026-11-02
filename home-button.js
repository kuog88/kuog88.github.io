// 學習遊戲樂園：每個遊戲共用的「回遊戲樂園」按鈕
// 用法：在遊戲 HTML 的 </body> 前加一行
// <script src="https://kuog88.github.io/home-button.js" defer></script>
(function () {
  if (document.getElementById('kg-hub-btn')) return;
  var css = document.createElement('style');
  css.textContent =
    '#kg-hub-btn{position:fixed;left:12px;bottom:12px;z-index:2147483000;' +
    'display:flex;align-items:center;gap:6px;padding:8px 14px;border-radius:999px;' +
    'background:rgba(255,255,255,.92);color:#ff7a2f;border:3px solid #ff7a2f;' +
    'font:700 15px "Microsoft JhengHei","PingFang TC","Noto Sans TC",sans-serif;' +
    'text-decoration:none;box-shadow:0 3px 0 #ff7a2f;opacity:.85;transition:opacity .15s,transform .15s}' +
    '#kg-hub-btn:hover,#kg-hub-btn:focus-visible{opacity:1;transform:translateY(-2px);outline:none}' +
    '@media print{#kg-hub-btn{display:none}}' +
    // 手機上只留圖示，按鈕小一點
    '@media (max-width:600px){#kg-hub-btn .t,#kg-rep-btn .t{display:none}#kg-hub-btn,#kg-rep-btn{padding:0;width:40px;height:40px;justify-content:center;font-size:18px}}' +
    // 蓋到遊戲自己的按鈕時：變透明，點擊直接穿過去
    '.kg-dodge{opacity:.12!important;pointer-events:none!important}';
  document.head.appendChild(css);
  var a = document.createElement('a');
  a.id = 'kg-hub-btn';
  a.href = 'https://kuog88.github.io/';
  a.title = '回到學習遊戲樂園，重新選科目';
  a.innerHTML = '🎮<span class="t"> 遊戲樂園</span>';
  a.addEventListener('click', function (e) {
    if (!confirm('要離開這個遊戲，回到遊戲樂園選科目嗎？')) e.preventDefault();
  });
  document.body.appendChild(a);
  // 家長報表（國文有自己的報表，不載入）
  if (!window.KGReport && !/\/guoyu-island\//.test(location.pathname)) {
    var rs = document.createElement('script');
    rs.src = 'https://kuog88.github.io/parent-report.js';
    document.head.appendChild(rs);
  }
  // 陪讀萌寵與測驗卷（英文由另一邊獨立管理，不載入）
  if (!/\/galaxy-english\//.test(location.pathname)) {
    ['pets.js', 'kg-exam.js'].forEach(function (f) {
      var s = document.createElement('script');
      s.src = 'https://kuog88.github.io/' + f;
      document.head.appendChild(s);
    });
  }

  // ---------- 浮動按鈕（遊戲樂園、家長報表、音樂）避開遊戲的按鈕 ----------
  var FLOAT = ['kg-hub-btn', 'kg-rep-btn', 'kg-bgm-btn'];
  var GAME = 'button,a[href],input,select,textarea,label,[role="button"],[onclick],[draggable="true"],[tabindex]:not([tabindex="-1"])';
  function isFloat(el) { for (var i = 0; i < FLOAT.length; i++) { var f = document.getElementById(FLOAT[i]); if (f && (f === el || f.contains(el))) return true; } return false; }
  function covers(f) {
    var r = f.getBoundingClientRect();
    if (!r.width) return false;
    var pts = [[.5, .5], [.15, .2], [.85, .2], [.15, .8], [.85, .8]];
    for (var i = 0; i < pts.length; i++) {
      var x = r.left + r.width * pts[i][0], y = r.top + r.height * pts[i][1];
      var stack = document.elementsFromPoint ? document.elementsFromPoint(x, y) : [];
      for (var j = 0; j < stack.length; j++) {
        var el = stack[j];
        if (el === document.body || el === document.documentElement) break;
        if (isFloat(el) || (el.closest && el.closest('#kg-rep'))) continue;
        var g = el.closest ? el.closest(GAME) : null;
        if (g && !isFloat(g) && !g.disabled) return true;
      }
    }
    return false;
  }
  function dodge() {
    for (var i = 0; i < FLOAT.length; i++) {
      var f = document.getElementById(FLOAT[i]);
      if (!f) continue;
      f.classList.remove('kg-dodge');          // 先恢復，量它原本的位置
      if (covers(f)) f.classList.add('kg-dodge');
    }
  }
  setInterval(dodge, 400);
  window.addEventListener('scroll', dodge, { passive: true });
  window.addEventListener('resize', dodge);
})();

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
  // 家長報表（國文也載入：過關紀錄、大星星動畫）
  if (!window.KGReport) {
    var rs = document.createElement('script');
    rs.src = 'https://kuog88.github.io/parent-report.js?v=20261120';
    document.head.appendChild(rs);
  }
  // 國語沒有載入 bgm.js，所以這裡也放一份（英文獨立管理，不套用）
  if (!/\/galaxy-english\//.test(location.pathname)) {
  // ---------- iPad／iPhone：靜音模式下也要有聲音 ----------
    // 這個網站的音樂、音效都是 Web Audio 即時合成的。iPad、iPhone 開著「靜音模式」（控制中心的鈴鐺）時，
    // Safari 會把 Web Audio 當成鈴聲一起關掉，所以「手機有聲音、iPad 沒聲音」。
    // 做法：把這一頁的聲音宣告成「播放媒體」，就和看影片一樣，不受靜音模式影響。
    (function () {
      if (window.__kgAudioSession) return; window.__kgAudioSession = 1;
      var ua = navigator.userAgent || '';
      var ios = /iPad|iPhone|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);   // iPad 會假裝成 Mac
      try { if (navigator.audioSession) navigator.audioSession.type = 'playback'; } catch (e) {}          // iOS／iPadOS 17 以上
      if (!ios) return;
      // 舊版 iOS 沒有 audioSession：第一次點畫面時播一段沒有聲音的 <audio>，系統就會切到「播放媒體」
      function silentWav() {   // 1 秒、8000Hz、8 位元的無聲 WAV
        var n = 8000, b = new Uint8Array(44 + n), v = new DataView(b.buffer), w = function (o, t) { for (var i = 0; i < t.length; i++) b[o + i] = t.charCodeAt(i); };
        w(0, 'RIFF'); v.setUint32(4, 36 + n, true); w(8, 'WAVEfmt '); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
        v.setUint32(24, 8000, true); v.setUint32(28, 8000, true); v.setUint16(32, 1, true); v.setUint16(34, 8, true); w(36, 'data'); v.setUint32(40, n, true);
        for (var i = 44; i < b.length; i++) b[i] = 128;
        return URL.createObjectURL(new Blob([b], { type: 'audio/wav' }));
      }
      var el = null;
      function kick() {
        try { if (navigator.audioSession && navigator.audioSession.type !== 'playback') navigator.audioSession.type = 'playback'; } catch (e) {}
        if (navigator.audioSession) return;
        try {
          if (!el) { el = document.createElement('audio'); el.src = silentWav(); el.loop = true; el.setAttribute('playsinline', ''); el.volume = 0.01; el.style.display = 'none'; (document.body || document.documentElement).appendChild(el); }
          if (el.paused) { var pr = el.play(); if (pr && pr.catch) pr.catch(function () {}); }
        } catch (e) {}
      }
      ['touchend', 'pointerup', 'click'].forEach(function (ev) { window.addEventListener(ev, kick, { capture: true, passive: true }); });
      document.addEventListener('visibilitychange', function () { if (el && document.hidden) { try { el.pause(); } catch (e) {} } });
    })();
  }

  // 月考測驗卷與隨機出現的萌寵（英文由另一邊獨立管理，不載入）
  if (!/\/galaxy-english\//.test(location.pathname)) {
    ['kg-exam.js', 'pets.js'].forEach(function (f) {
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

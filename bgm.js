// 學習遊戲樂園：輕柔的背景循環音樂（每個關卡一首，用 Web Audio 即時合成，不需要音檔）
// 用法：在遊戲 HTML 的 </body> 前加一行
// <script src="https://kuog88.github.io/bgm.js" defer></script>
// 遊戲可以主動呼叫 BGM.level('關卡代號') 換曲；沒呼叫的話，會依畫面上的關卡標題自動換曲。
(function () {
  if (window.BGM) return;
  var STORE = 'kg-bgm-on';
  var on = true;
  try { on = localStorage.getItem(STORE) !== '0'; } catch (e) {}

  var ac = null, master = null, echo = null, duck = null, ducked = false;
  var song = null, songKey = null, nextTime = 0, step = 0, timer = null, manual = false, started = false;

  // ---------- 小工具 ----------
  function hash(s) { var h = 2166136261; for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  function rng(seed) { return function () { seed |= 0; seed = seed + 0x6D2B79F5 | 0; var t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function pick(r, a) { return a[Math.floor(r() * a.length)]; }
  var MAJOR = [0, 2, 4, 5, 7, 9, 11], PENTA = [0, 2, 4, 7, 9];
  var PROGS = [[0, 5, 3, 4], [0, 3, 4, 0], [0, 4, 5, 3], [5, 3, 0, 4], [0, 3, 0, 4], [3, 4, 0, 5]];
  function freq(m) { return 440 * Math.pow(2, (m - 69) / 12); }

  // ---------- 依代號產生一首固定的曲子（4 小節，循環） ----------
  function compose(key) {
    var r = rng(hash(location.pathname + '|' + key));
    var root = pick(r, [60, 62, 65, 67, 57, 64]);
    var bpm = 70 + Math.floor(r() * 24);
    var prog = pick(r, PROGS);
    var lead = pick(r, ['triangle', 'sine', 'triangle']);
    var mel = [], deg = Math.floor(r() * 5), oct = 0;
    for (var bar = 0; bar < 4; bar++) {
      for (var b = 0; b < 8; b++) {           // 每小節 8 個八分音符
        if (r() < (b % 2 ? .45 : .22)) { mel.push(null); continue; } // 留白，讓旋律不吵
        deg += pick(r, [-2, -1, -1, 0, 1, 1, 2]);
        if (deg < 0) { deg += 5; oct--; } if (deg > 4) { deg -= 5; oct++; }
        if (oct > 1) oct = 1; if (oct < 0) oct = 0;
        var len = r() < .3 && b % 2 === 0 ? 2 : 1;
        mel.push({ n: root + 12 + PENTA[deg] + oct * 12, len: len });
      }
    }
    var bell = r() < .6;
    return { root: root, spb: 60 / bpm / 2, prog: prog, lead: lead, mel: mel, bell: bell };
  }

  // ---------- 合成 ----------
  function init() {
    if (ac) return;
    var C = window.AudioContext || window.webkitAudioContext; if (!C) return;
    ac = new C();
    master = ac.createGain(); master.gain.value = 0;
    var lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 2200;
    echo = ac.createDelay(1); echo.delayTime.value = .33;
    var fb = ac.createGain(); fb.gain.value = .25;
    var wet = ac.createGain(); wet.gain.value = .3;
    // duck：唸題目、播影片或語音時把音樂壓低
    duck = ac.createGain(); duck.gain.value = 1; master.connect(duck);
    duck.connect(lp); lp.connect(ac.destination);
    duck.connect(echo); echo.connect(fb); fb.connect(echo); echo.connect(wet); wet.connect(lp);
  }
  function note(f, t, dur, type, vol) {
    var o = ac.createOscillator(), g = ac.createGain();
    o.type = type; o.frequency.value = f;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol, t + .03);
    g.gain.exponentialRampToValueAtTime(vol * .45, t + dur * .6);
    g.gain.exponentialRampToValueAtTime(.0001, t + dur + .25);
    o.connect(g); g.connect(master);
    o.start(t); o.stop(t + dur + .3);
  }
  // 有人在說話（朗讀題目）或有影片、語音在播放嗎？
  function talking() {
    try { if (window.speechSynthesis && speechSynthesis.speaking) return true; } catch (e) {}
    var ms = document.querySelectorAll('audio,video');
    for (var i = 0; i < ms.length; i++) if (!ms[i].paused && !ms[i].muted && ms[i].volume > 0 && !ms[i].ended) return true;
    return false;
  }
  function tick() {
    if (!song || !ac) return;
    var tk = talking();
    if (duck && tk !== ducked) { ducked = tk; duck.gain.setTargetAtTime(tk ? .2 : 1, ac.currentTime, tk ? .08 : .6); }
    while (nextTime < ac.currentTime + .35) {
      var s = song, i = step % 32, bar = Math.floor(i / 8), t = nextTime;
      var m = s.mel[i];
      if (m) note(freq(m.n), t, s.spb * m.len * 1.6, s.lead, .16);
      var chord = s.root - 12 + MAJOR[s.prog[bar]];
      if (i % 8 === 0) note(freq(chord), t, s.spb * 7, 'sine', .14);            // 低音
      if (i % 8 === 4) note(freq(chord + 12 + 4), t, s.spb * 3, 'sine', .05);   // 和聲墊底
      if (s.bell && i % 16 === 14) note(freq(s.root + 24 + 7), t, s.spb * 2, 'sine', .05); // 偶爾的小鈴聲
      nextTime += s.spb; step++;
    }
  }
  function fadeTo(v, sec) {
    if (!ac) return;
    var g = master.gain, t = ac.currentTime;
    g.cancelScheduledValues(t); g.setValueAtTime(g.value, t); g.linearRampToValueAtTime(v, t + sec);
  }
  var VOL = .32;
  function play(key) {
    if (!key) key = 'lobby';
    if (key === songKey && song) return;
    songKey = key;
    if (!on || !started) return;
    init(); if (!ac) return;
    fadeTo(0, .5);
    setTimeout(function () {
      if (songKey !== key) return;
      song = compose(key); step = 0; nextTime = ac.currentTime + .05;
      fadeTo(VOL, 1.2);
      if (!timer) timer = setInterval(tick, 100);
    }, 520);
  }

  // ---------- 自動偵測目前的關卡（依畫面上最醒目的標題） ----------
  function visible(el) {
    if (!el || !el.offsetParent && getComputedStyle(el).position !== 'fixed') return false;
    var cs = getComputedStyle(el);
    if (cs.visibility === 'hidden' || +cs.opacity === 0) return false;
    if (!innerWidth || !innerHeight) return true; // 背景分頁量不到尺寸時，只看有沒有顯示
    var r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < innerHeight;
  }
  function autoKey() {
    var best = null, bestSize = 0;
    var els = document.querySelectorAll('h1,h2,h3,[class*="title"],[class*="Title"],[id*="title"],[id*="Title"]');
    for (var i = 0; i < els.length; i++) {
      var el = els[i];
      if (el.closest('#kg-hub-btn,#kg-bgm-btn')) continue;
      var txt = (el.textContent || '').replace(/\s+/g, ' ').trim();
      if (txt.length < 2 || txt.length > 40 || !visible(el)) continue;
      var size = parseFloat(getComputedStyle(el).fontSize) || 0;
      if (size > bestSize) { bestSize = size; best = txt; }
    }
    return best || document.title || 'lobby';
  }
  var pend = null;
  function watch() {
    if (manual || pend) return;
    pend = setTimeout(function () { pend = null; if (!manual) play(autoKey()); }, 350);
  }

  // ---------- 開關按鈕 ----------
  function button() {
    var css = document.createElement('style');
    css.textContent = '#kg-bgm-btn{position:fixed;right:12px;bottom:12px;z-index:2147483000;width:40px;height:40px;border-radius:50%;' +
      'border:3px solid #7c5cff;background:rgba(255,255,255,.92);font-size:18px;cursor:pointer;opacity:.8;box-shadow:0 3px 0 #7c5cff;' +
      'transition:opacity .15s,transform .15s;padding:0;line-height:1}#kg-bgm-btn:hover{opacity:1;transform:translateY(-2px)}' +
      '#kg-bgm-btn.off{filter:grayscale(1);opacity:.55}@media print{#kg-bgm-btn{display:none}}';
    document.head.appendChild(css);
    var b = document.createElement('button');
    b.id = 'kg-bgm-btn'; b.type = 'button';
    function paint() { b.textContent = on ? '🎵' : '🔇'; b.className = on ? '' : 'off'; b.title = on ? '關掉背景音樂' : '打開背景音樂'; }
    paint();
    b.addEventListener('click', function (e) {
      e.stopPropagation();
      on = !on; try { localStorage.setItem(STORE, on ? '1' : '0'); } catch (err) {}
      paint();
      if (on) { start(); var k = songKey; songKey = null; play(k); } else fadeTo(0, .4);
    });
    document.body.appendChild(b);
  }

  // 瀏覽器規定要使用者先互動才能出聲
  function start() {
    if (started) { if (ac && ac.state === 'suspended') ac.resume(); return; }
    started = true; init();
    if (ac && ac.state === 'suspended') ac.resume();
    var k = songKey || (manual ? 'lobby' : autoKey()); songKey = null; play(k);
  }
  ['pointerdown', 'keydown', 'touchstart'].forEach(function (ev) { window.addEventListener(ev, start, { capture: true, passive: true }); });
  document.addEventListener('visibilitychange', function () {
    if (!ac) return;
    if (document.hidden) ac.suspend(); else if (on && started) ac.resume();
  });

  window.BGM = {
    level: function (key) { manual = true; play(String(key)); },   // 遊戲主動指定關卡
    auto: function () { manual = false; watch(); },                  // 回到自動偵測
    toggle: function () { var b = document.getElementById('kg-bgm-btn'); if (b) b.click(); },
    get key() { return songKey; }
  };

  function boot() {
    button();
    songKey = autoKey();
    new MutationObserver(watch).observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'style', 'hidden'] });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();

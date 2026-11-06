// 國字旁自動加注音（給一年級用）
// 用法：<script src="https://kuog88.github.io/kg-zhuyin.js" data-dict="zhuyin/math-g1.json"></script>
// 注音資料來自教育部「教育百科」：c = 單字讀音，w = 語詞讀音（決定多音字、輕聲）。
// 注音用 CSS 的 ::after 畫在字的右邊，不會改變文字內容（textContent），遊戲判斷答案不受影響。
(function () {
  if (window.KGZhuyin) return;
  var me = document.currentScript;
  var BASE = /^(localhost|127.0.0.1)$/.test(location.hostname) ? '/kuog88.github.io/' : 'https://kuog88.github.io/';
  var DICT = null, MAXW = 1, KEY = 'kg-zy-off', observer = null;
  var CJK = /[㐀-鿿豈-﫿]/;
  var SKIP = { SCRIPT: 1, STYLE: 1, TEXTAREA: 1, INPUT: 1, SELECT: 1, OPTION: 1, NOSCRIPT: 1, CODE: 1, svg: 1, SVG: 1, CANVAS: 1, TITLE: 1 };

  var css = document.createElement('style');
  // 測驗卷入口（#kgx-panel）和試卷（#kg-exam）有自己的樣式重設，所以每條規則也加一份它們開頭的，確保優先
  function S(sel, body) { return sel.split(',').map(function (x) { return x + ',#kgx-panel ' + x + ',#kg-exam ' + x; }).join(',') + '{' + body + '}'; }
  css.textContent =
    // --zs：注音大小＝國字的 0.36 倍，但最小 10px（小字也看得清楚）
    S('.kz', '--zs:max(.36em,10px);display:inline-block;position:relative;margin:0 calc(var(--zs) * 1.75) 0 0;padding:0;text-indent:0;pointer-events:none;font:inherit;color:inherit') +
    S('.kz::after,.kz::before', 'position:absolute;left:100%;top:50%;font-family:"Microsoft JhengHei","PingFang TC","Noto Sans TC",sans-serif;font-size:var(--zs);' +
      'letter-spacing:0;white-space:nowrap;text-shadow:none;color:inherit;-webkit-text-fill-color:currentColor;background:none;font-style:normal') +
    S('.kz::after', 'content:attr(data-z);transform:translate(.08em,-50%);writing-mode:vertical-rl;text-orientation:upright;line-height:1;font-weight:500') +
    S('.kz::before', 'content:attr(data-t);transform:translate(.92em,calc(-50% + var(--zh,1) * .5em - .7em));line-height:1;font-weight:700') +
    S('.kz.k0::before', 'transform:translate(.1em,calc(-50% - var(--zh,1) * .5em - .45em))') +
    // 固定在畫面上的按鈕（回首頁、選年級…）空間小，用小一點、靠緊一點的注音
    S('.kz-sm .kz', '--zs:9px;margin-right:13px') +
    'html.kz-off .kz,html.kz-off #kgx-panel .kz,html.kz-off #kg-exam .kz{margin-right:0}' +
    'html.kz-off .kz::after,html.kz-off .kz::before,html.kz-off #kgx-panel .kz::after,html.kz-off #kgx-panel .kz::before,html.kz-off #kg-exam .kz::after,html.kz-off #kg-exam .kz::before{content:none}' +
    '#kz-tg{position:fixed;left:50%;transform:translateX(-50%);bottom:8px;z-index:2147482900;font:700 14px "Microsoft JhengHei","PingFang TC",sans-serif;background:#fff;color:#c0392b;border:2px solid #f0a59b;border-radius:999px;padding:5px 12px;cursor:pointer;box-shadow:0 2px 6px rgba(0,0,0,.15);opacity:.92}' +
    '@media print{#kz-tg{display:none}}';

  function split(z) {           // 'ㄔㄤˊ' → ['ㄔㄤ','ˊ']；'˙ㄇㄣ' → ['ㄇㄣ','˙']
    if (z.charAt(0) === '˙') return [z.slice(1), '˙'];
    var t = z.slice(-1);
    return 'ˊˇˋ'.indexOf(t) >= 0 ? [z.slice(0, -1), t] : [z, ''];
  }
  function span(ch, z) {
    var s = document.createElement('span'), p = split(z);
    s.className = p[1] === '˙' ? 'kz k0' : 'kz';
    s.setAttribute('data-z', p[0]); s.setAttribute('data-t', p[1]);
    s.style.setProperty('--zh', p[0].length);   // 注音有幾個符號（決定聲調、輕聲點的位置）
    s.textContent = ch;
    return s;
  }
  // 依前後字決定讀音（例如「數」：一個一個數 ㄕㄨˇ／哪一個數 ㄕㄨˋ）
  // r = {v: 動詞讀音, n: 名詞讀音, nextN, nextV, seqV:[前面幾個字], prevN, prevV}
  function rule(r, t, i) {
    var nx = t.charAt(i + 1), pv = t.charAt(i - 1);
    if (nx && r.nextN.indexOf(nx) >= 0) return r.n;
    if (nx && r.nextV.indexOf(nx) >= 0) return r.v;
    for (var k = 0; k < r.seqV.length; k++) if (t.substr(i - r.seqV[k].length, r.seqV[k].length) === r.seqV[k]) return r.v;
    if (pv && r.prevN.indexOf(pv) >= 0) return r.n;
    if (pv && r.prevV.indexOf(pv) >= 0) return r.v;
    return r.n;
  }
  // 把一段文字切成：語詞（最長比對）→ 單字
  function annotateText(node) {
    var t = node.nodeValue;
    if (!CJK.test(t)) return;
    var frag = document.createDocumentFragment(), buf = '', i = 0, any = false;
    function flush() { if (buf) { frag.appendChild(document.createTextNode(buf)); buf = ''; } }
    while (i < t.length) {
      var hit = null;
      if (CJK.test(t.charAt(i))) {
        for (var L = Math.min(MAXW, t.length - i); L >= 2 && !hit; L--) {
          var w = t.substr(i, L);
          if (DICT.w[w]) hit = [w, DICT.w[w]];
        }
        if (hit) {
          flush();
          for (var k = 0; k < hit[0].length; k++) frag.appendChild(span(hit[0].charAt(k), hit[1][k]));
          i += hit[0].length; any = true; continue;
        }
        var c = t.charAt(i), z = DICT.c[c];
        if (DICT.r && DICT.r[c]) z = rule(DICT.r[c], t, i) || z;
        if (z) { flush(); frag.appendChild(span(c, z)); any = true; i++; continue; }
      }
      buf += t.charAt(i); i++;
    }
    flush();
    if (!any) return;
    var host = node.parentNode.closest && node.parentNode.closest('button,a,[role="button"]');
    if (host && !host.classList.contains('kz-sm') && getComputedStyle(host).position === 'fixed') host.classList.add('kz-sm');
    // 包成一整段：在 flex／grid 版面裡才不會每個字各自變成一格
    var wrap = document.createElement('span'); wrap.className = 'kzw'; wrap.appendChild(frag);
    node.parentNode.replaceChild(wrap, node);
  }
  function skip(el) {
    for (var e = el; e && e !== document.body; e = e.parentNode) {
      if (e.nodeType !== 1) continue;
      if (SKIP[e.nodeName] || e.isContentEditable || (e.classList && (e.classList.contains('kz') || e.hasAttribute('data-nozy'))) || e.id === 'kz-tg') return true;
      if (e.namespaceURI && e.namespaceURI !== 'http://www.w3.org/1999/xhtml') return true;
    }
    return false;
  }
  function walk(root) {
    if (!DICT || !root) return;
    if (root.nodeType === 3) { if (root.parentNode && !skip(root.parentNode)) annotateText(root); return; }
    if (root.nodeType !== 1 || skip(root)) return;
    var tw = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null), list = [], n;
    while ((n = tw.nextNode())) if (CJK.test(n.nodeValue) && !skip(n.parentNode)) list.push(n);
    list.forEach(annotateText);
  }
  function run(muts) {
    observer.disconnect();
    try {
      if (muts) muts.forEach(function (m) {
        if (m.type === 'characterData') walk(m.target);
        else m.addedNodes.forEach(function (x) { if (x.isConnected) walk(x); });
      });
      else walk(document.body);
    } finally { observer.observe(document.body, { childList: true, subtree: true, characterData: true }); }
  }
  function toggle() {
    var off = document.documentElement.classList.toggle('kz-off');
    try { off ? localStorage.setItem(KEY, '1') : localStorage.removeItem(KEY); } catch (e) {}
    btn.textContent = off ? 'ㄅㄆㄇ 注音：關' : 'ㄅㄆㄇ 注音：開';
  }
  var btn;
  function start() {
    document.head.appendChild(css);
    var off = false; try { off = localStorage.getItem(KEY) === '1'; } catch (e) {}
    if (off) document.documentElement.classList.add('kz-off');
    btn = document.createElement('button'); btn.id = 'kz-tg'; btn.type = 'button';
    btn.textContent = off ? 'ㄅㄆㄇ 注音：關' : 'ㄅㄆㄇ 注音：開'; btn.onclick = toggle;
    document.body.appendChild(btn);
    observer = new MutationObserver(run);
    run(null);
  }
  var src = (me && me.getAttribute('data-dict')) || 'zhuyin/math-g1.json';
  fetch(/^(https?:)?\//.test(src) ? src : BASE + src).then(function (r) { return r.json(); }).then(function (d) {
    DICT = d; for (var w in d.w) if (w.length > MAXW) MAXW = w.length;
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
  });
  window.KGZhuyin = { walk: walk, toggle: function () { toggle(); } };
})();

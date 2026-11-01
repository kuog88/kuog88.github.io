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
    // 製作者浮水印：不擋點擊，放下方正中間（左下是回樂園、右下是音樂鍵）
    '#kg-credit{position:fixed;left:50%;transform:translateX(-50%);bottom:10px;z-index:2147482999;pointer-events:none;' +
    'padding:3px 10px;border-radius:999px;background:rgba(255,255,255,.55);color:rgba(60,60,60,.7);' +
    'font:600 12px "Microsoft JhengHei","PingFang TC","Noto Sans TC",sans-serif;white-space:nowrap;' +
    'text-shadow:0 1px 0 rgba(255,255,255,.8)}' +
    '@media (max-width:480px){#kg-credit{font-size:10.5px;left:auto;right:6px;transform:none;bottom:62px}}';
  document.head.appendChild(css);
  var a = document.createElement('a');
  a.id = 'kg-hub-btn';
  a.href = 'https://kuog88.github.io/';
  a.title = '回到學習遊戲樂園，重新選科目';
  a.textContent = '🎮 遊戲樂園';
  a.addEventListener('click', function (e) {
    if (!confirm('要離開這個遊戲，回到遊戲樂園選科目嗎？')) e.preventDefault();
  });
  document.body.appendChild(a);
  var credit = document.createElement('div');
  credit.id = 'kg-credit';
  credit.setAttribute('aria-hidden', 'true');
  credit.textContent = '有需要幫助請IG找製作者:xt4photo';
  document.body.appendChild(credit);
  // 家長報表（國文有自己的報表，不載入）
  if (!window.KGReport && !/\/guoyu-island\//.test(location.pathname)) {
    var rs = document.createElement('script');
    rs.src = 'https://kuog88.github.io/parent-report.js';
    document.head.appendChild(rs);
  }
})();

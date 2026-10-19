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
    '@media print{#kg-hub-btn{display:none}}';
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
})();

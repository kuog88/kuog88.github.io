// 📦 進度搬家（首頁用）：把這台裝置所有科目的進度打包成一個檔案，到另一台裝置讀入就能接著玩。
// 所有遊戲（國文、社會、自然、數學、英文）都在 kuog88.github.io 同一個網站，進度都存在 localStorage，
// 所以整包 localStorage 打包就包含：關卡星星、晶幣與天空城、萌寵、試卷紀錄、錯題本、家長報表、多孩子設定。
// 檔案只存在使用者自己手上（下載或用 LINE 分享），不會上傳到任何伺服器。
(function () {
  if (window.KGBackup) return;
  var APP = 'kuog88-progress', FONT = "'Microsoft JhengHei','PingFang TC','Noto Sans TC',sans-serif";

  function pack() {
    var data = {};
    for (var i = 0; i < localStorage.length; i++) { var k = localStorage.key(i); data[k] = localStorage.getItem(k); }
    return { app: APP, v: 1, ts: Date.now(), data: data };
  }
  function stamp(ts) { var d = new Date(ts); return d.getFullYear() + ('0' + (d.getMonth() + 1)).slice(-2) + ('0' + d.getDate()).slice(-2) + '-' + ('0' + d.getHours()).slice(-2) + ('0' + d.getMinutes()).slice(-2); }
  function who() { try { var p = JSON.parse(localStorage.getItem('kg-profiles-v1')); return p && p.list ? p.list.map(function (x) { return x.name; }).join('、') : ''; } catch (e) { return ''; } }

  function exportFile(msg) {
    var obj = pack(), name = '闖關進度-' + stamp(obj.ts) + '.json';
    var blob = new Blob([JSON.stringify(obj)], { type: 'application/json' });
    var file = null; try { file = new File([blob], name, { type: 'application/json' }); } catch (e) {}
    // 手機：可以直接分享到 LINE、雲端硬碟；不支援就下載
    if (file && navigator.canShare && navigator.canShare({ files: [file] })) {
      navigator.share({ files: [file], title: '闖關進度' }).then(function () { msg('✅ 已分享！到新裝置打開首頁，按「📦 進度搬家」→「讀入進度」選這個檔案。'); })
        .catch(function (e) { if (e && e.name === 'AbortError') return; download(blob, name, msg); });
    } else download(blob, name, msg);
  }
  function download(blob, name, msg) {
    var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name;
    document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1500);
    msg('✅ 已存成「' + name + '」。把這個檔案傳到新裝置（LINE、Email、雲端硬碟都可以），再按「讀入進度」。');
  }
  function importFile(f, msg) {
    var r = new FileReader();
    r.onload = function () {
      var obj; try { obj = JSON.parse(r.result); } catch (e) { obj = null; }
      if (!obj || obj.app !== APP || !obj.data || typeof obj.data !== 'object') { msg('❌ 這不是闖關進度檔，請選「闖關進度-日期.json」那個檔案。'); return; }
      var n = Object.keys(obj.data).length;
      if (!confirm('要讀入 ' + new Date(obj.ts).toLocaleString() + ' 打包的進度嗎？\n\n這台裝置目前的進度會被換掉（共 ' + n + ' 筆資料）。')) return;
      try {
        localStorage.clear();
        Object.keys(obj.data).forEach(function (k) { if (typeof obj.data[k] === 'string') localStorage.setItem(k, obj.data[k]); });
      } catch (e) { msg('❌ 讀入失敗：這台裝置的瀏覽器空間不夠或被封鎖（無痕模式不能存）。'); return; }
      msg('✅ 讀入完成！馬上重新整理…');
      setTimeout(function () { location.reload(); }, 900);
    };
    r.readAsText(f);
  }

  function open() {
    var old = document.getElementById('kg-backup'); if (old) old.remove();
    var box = document.createElement('div'); box.id = 'kg-backup'; box.setAttribute('role', 'dialog'); box.setAttribute('aria-label', '進度搬家');
    box.style.cssText = 'position:fixed;inset:0;z-index:2147482000;background:rgba(20,30,60,.55);display:grid;place-items:center;padding:14px;font-family:' + FONT;
    var kids = who();
    box.innerHTML = '<div style="background:#fffdf7;border-radius:24px;width:min(460px,100%);padding:18px 18px 20px;box-shadow:0 20px 50px rgba(0,0,0,.3);color:#2b2b2b;display:grid;gap:12px">' +
      '<div style="display:flex;align-items:center;gap:8px"><b style="font-size:22px;color:#2a7d6f">📦 進度搬家</b><button type="button" data-x style="margin-left:auto;font:inherit;font-size:20px;border:none;background:#eee;border-radius:50%;width:38px;height:38px;cursor:pointer">✕</button></div>' +
      '<div style="font-size:15px;line-height:1.6;color:#555">換手機、換平板時用：在<b>舊裝置</b>打包，把檔案傳到<b>新裝置</b>讀入，就能接著玩。<br>會一起搬過去：所有科目（國文、社會、自然、數學、英文）的星星、晶幣和天空城、萌寵、試卷、錯題本、家長報表' + (kids ? '，還有每個孩子（' + kids.replace(/[<>&]/g, '') + '）的資料' : '') + '。</div>' +
      '<button type="button" data-out style="font:800 18px ' + FONT + ';padding:12px;border-radius:16px;border:none;background:#2a9d8f;color:#fff;cursor:pointer">① 舊裝置：打包進度</button>' +
      '<label style="font:800 18px ' + FONT + ';padding:12px;border-radius:16px;background:#fff;color:#2a7d6f;border:3px solid #2a9d8f;text-align:center;cursor:pointer">② 新裝置：讀入進度<input type="file" accept=".json,application/json" hidden></label>' +
      '<div data-msg style="font-size:15px;line-height:1.5;color:#2a7d6f;min-height:1em"></div>' +
      '<div style="font-size:13px;color:#999;line-height:1.5">檔案只存在你自己手上，不會上傳到網路。讀入會把新裝置原本的進度換掉；兩台輪流玩時，每次換裝置都要再搬一次。</div></div>';
    document.body.appendChild(box);
    var msg = function (t) { box.querySelector('[data-msg]').textContent = t; };
    box.querySelector('[data-x]').onclick = function () { box.remove(); };
    box.addEventListener('click', function (e) { if (e.target === box) box.remove(); });
    box.querySelector('[data-out]').onclick = function () { exportFile(msg); };
    box.querySelector('input[type=file]').onchange = function () { if (this.files[0]) importFile(this.files[0], msg); this.value = ''; };
  }
  window.KGBackup = { open: open, pack: pack };
})();

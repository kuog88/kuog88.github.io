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
      navigator.share({ files: [file], title: '闖關進度' }).then(function () { msg('✅ 已分享！下一步：在新裝置的 LINE 點開檔案 →「儲存到檔案」（Android 按「儲存」），再打開這個首頁按「② 讀入進度」。'); })
        .catch(function (e) { if (e && e.name === 'AbortError') return; download(blob, name, msg); });
    } else download(blob, name, msg);
  }
  function download(blob, name, msg) {
    var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name;
    document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1500);
    msg('✅ 已存成「' + name + '」（在「下載」資料夾）。下一步：用 LINE 把這個檔案傳到新裝置，在新裝置「儲存」後按「② 讀入進度」。不會的話看下面「📖 第一次用？」');
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
    box.style.cssText = 'position:fixed;inset:0;overflow:auto;z-index:2147482000;background:rgba(20,30,60,.55);display:grid;place-items:center;padding:14px;font-family:' + FONT;
    var kids = who();
    box.innerHTML = '<div style="background:#fffdf7;border-radius:24px;width:min(460px,100%);max-height:92vh;overflow:auto;padding:18px 18px 20px;box-shadow:0 20px 50px rgba(0,0,0,.3);color:#2b2b2b;display:grid;gap:12px">' +
      '<div style="display:flex;align-items:center;gap:8px"><b style="font-size:22px;color:#2a7d6f">📦 進度搬家</b><button type="button" data-x style="margin-left:auto;font:inherit;font-size:20px;border:none;background:#eee;border-radius:50%;width:38px;height:38px;cursor:pointer">✕</button></div>' +
      '<div style="font-size:15px;line-height:1.6;color:#555">換手機、換平板時用：在<b>舊裝置</b>打包，把檔案傳到<b>新裝置</b>讀入，就能接著玩。<br>會一起搬過去：所有科目（國文、社會、自然、數學、英文）的星星、晶幣和天空城、萌寵、試卷、錯題本、家長報表' + (kids ? '，還有每個孩子（' + kids.replace(/[<>&]/g, '') + '）的資料' : '') + '。</div>' +
      '<div style="font-size:13px;color:#888;margin:-6px 0 -4px">在要搬走的舊手機／平板按 ↓</div>' +
      '<button type="button" data-out style="font:800 18px ' + FONT + ';padding:12px;border-radius:16px;border:none;background:#2a9d8f;color:#fff;cursor:pointer">① 舊裝置：打包進度</button>' +
      '<div style="font-size:13px;color:#888;margin:-4px 0 -4px">在新手機／平板按 ↓（要先把檔案存到這台）</div>' +
      '<label style="font:800 18px ' + FONT + ';padding:12px;border-radius:16px;background:#fff;color:#2a7d6f;border:3px solid #2a9d8f;text-align:center;cursor:pointer">② 新裝置：讀入進度<input type="file" accept=".json,application/json" hidden></label>' +
      '<details style="background:#f1faf8;border-radius:14px;padding:8px 12px;font-size:15px;line-height:1.65;color:#335">' +
      '<summary style="font-weight:800;color:#2a7d6f;cursor:pointer">📖 第一次用？看這裡（3 步驟）</summary>' +
      '<div style="margin-top:6px"><b>步驟 1｜舊裝置打包</b><br>按上面「① 打包進度」。手機會跳出分享：選 <b>LINE</b> 傳給自己（或家人），也可以存到雲端硬碟。電腦會下載一個「闖關進度-日期.json」。</div>' +
      '<div style="margin-top:8px"><b>步驟 2｜在新裝置把檔案存下來</b><br>在 LINE 點開那個檔案 →<br>・<b>iPhone／iPad</b>：按右上角分享 →「<b>儲存到檔案</b>」<br>・<b>Android</b>：按「<b>儲存</b>」（會存到「下載」）<br><span style="color:#c0392b">⚠️ 不要直接點開檔案，點開只會看到一堆文字。</span></div>' +
      '<div style="margin-top:8px"><b>步驟 3｜新裝置讀入</b><br>用孩子<b>平常玩的瀏覽器</b>打開這個首頁 → 按「📦 進度搬家」→「② 讀入進度」→ 找到「闖關進度-日期.json」：<br>・<b>iPhone／iPad</b>：點「瀏覽」→「我的 iPhone」或「下載項目」<br>・<b>Android</b>：點「下載」或「最近使用」<br>按「確定」就完成了！</div>' +
      '<div style="margin-top:8px;color:#777;font-size:13px">找不到檔案？多半是 LINE 裡沒有按「儲存」。進度沒出現？確認是同一個瀏覽器（Chrome 和 Safari 的進度是分開的），也不要用無痕模式。</div>' +
      '</details>' +
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

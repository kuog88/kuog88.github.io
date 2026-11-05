// 陪讀萌寵：積分、萌寵、進化，以及在每個頁面散步的萌寵
// home-button.js 會自動載入（英文頁面除外）。資料存在這台裝置的 localStorage「kg-pet-v1」。
//
// ★ 換成自己做的動畫：在 PETS 裡每一階段填 img（平常的樣子）和 anims（點一下輪流播放）。
//   檔案放在 pets/<萌寵id>/ 底下，支援 .webp / .gif / .png（透明背景的動圖最好）。
//   anims 每一項可以寫成 'pets/blue/s1-jump.webp'，或 { src: '...', ms: 1800 } 指定播放幾毫秒。
//   沒填 anims 的階段會用內建的跳跳、轉圈、愛心動畫。
(function () {
  if (window.KGPet) return;
  var BASE = /^(localhost|127.0.0.1)$/.test(location.hostname) ? '/kuog88.github.io/' : 'https://kuog88.github.io/';
  var KEY = 'kg-pet-v1';

  // ---------- 規則 ----------
  var RULE = {
    perCorrect: 1,      // 每答對 1 題得幾分
    perfectBonus: 5,    // 滿分加分
    passRate: 0.6,      // 答對率達到多少才算「完成 1 張」（進化用）
    papersPerStage: 5,  // 每幾張進化一次
    maxStage: 4
  };
  var STAGE_NAME = ['寶寶', '小小', '少年', '傳說'];
  var PETS = [
    { id: 'blue', name: '波波', desc: '戴蛙鏡的藍毛球，最喜歡數字和拼圖。', price: 20, star: 0,
      stages: [{ img: 'pets/fluffy-blue.webp' }, { img: 'pets/fluffy-blue.webp' }, { img: 'pets/fluffy-blue.webp' }, { img: 'pets/fluffy-blue.webp' }] },
    { id: 'green', name: '嫩芽', desc: '頭上有觸角、三隻眼睛的綠毛球，最會觀察大自然。', price: 40, star: 2,
      stages: [{ img: 'pets/fluffy-green.webp' }, { img: 'pets/fluffy-green.webp' }, { img: 'pets/fluffy-green.webp' }, { img: 'pets/fluffy-green.webp' }] },
    { id: 'orange', name: '紫紫', desc: '戴耳機的紫毛球，喜歡聽故事、夢想環遊世界。', price: 40, star: 2,
      stages: [{ img: 'pets/fluffy-orange.webp' }, { img: 'pets/fluffy-orange.webp' }, { img: 'pets/fluffy-orange.webp' }, { img: 'pets/fluffy-orange.webp' }] },
    // 贊助解鎖的萌寵：有 6 種姿勢（poses），會招手、寫作業、比讚、想事情、歡呼、睡覺，而且一直誇獎小朋友
    { id: 'honey', name: '蜜蜜', desc: '頭上長小芽、背著透明翅膀的黃毛球，最愛誇獎認真的小朋友！', price: 0, star: 0,
      sponsor: '💛 贊助已達 1000 元解鎖',
      poses: { wave: 'pets/honey/wave.webp', write: 'pets/honey/write.webp', thumb: 'pets/honey/thumb.webp',
        think: 'pets/honey/think.webp', cheer: 'pets/honey/cheer.webp', sleep: 'pets/honey/sleep.webp' },
      praise: ['你好厲害喔！蜜蜜好崇拜你～', '哇！你答得又快又準！', '你是蜜蜜心中的第一名！', '認真的你閃閃發亮✨',
        '給你一個大大的讚！👍', '蜜蜜最喜歡看你努力的樣子了～', '答錯也沒關係，肯動腦就很了不起！', '你的頭腦轉得好快喔！',
        '一題一題慢慢來，你做得超好！', '我要把你的努力告訴全世界！', '哇～你又進步了耶！', '你好專心喔，好酷！',
        '有你陪我讀書，蜜蜜好開心～', '蜜蜜幫你搧搧翅膀打氣！加油！', '你比昨天的自己更棒了！', '這麼難你都會，太強了吧！',
        '你的字寫得好認真喔～', '蜜蜜要送你一朵小花🌼', '你是最棒的小學霸！', '慢慢想沒關係，你一定想得出來！'],
      stages: [{ img: 'pets/honey/wave.webp' }, { img: 'pets/honey/wave.webp' }, { img: 'pets/honey/wave.webp' }, { img: 'pets/honey/wave.webp' }] }
  ];
  // 挑選視窗裡「還沒開放」的剪影（借現有圖片變形後塗黑，看不出是誰）
  var LOCKED = ['pets/fluffy-orange.webp', 'pets/fluffy-green.webp'];
  var LOCK_TF = ['transform:scaleX(-1) scaleY(1.12)', 'transform:scale(0.9,1.15) rotate(-8deg)', 'transform:scaleX(-1.1) rotate(6deg)'];
  var CHEER = ['你好棒！', '再闖一關吧！', '我陪你一起加油！', '答錯沒關係，再想想～', '今天也很努力喔！', '我們一起變厲害！',
    '慢慢來，看清楚題目再作答！', '錯的題目最有價值，訂正完就學會了！', '休息一下眼睛，再繼續衝！', '你比昨天的自己更厲害了！',
    '遇到難題先深呼吸～', '每答對一題，大腦就長出一點點肌肉！', '我看到你很認真喔！', '加油加油，你一定可以！'];
  // 短笑話：[問題, 答案]，先問、隔兩秒再說答案
  var JOKE = [['什麼東西越洗越髒？', '水！'], ['什麼門永遠關不起來？', '球門！'], ['什麼書在書店買不到？', '秘書！'],
    ['哪一種布剪不斷？', '瀑布！'], ['鉛筆姓什麼？', '姓「蕭」（削）！'], ['什麼人一年只上一天班？', '聖誕老公公！'],
    ['什麼東西明明是你的，別人卻用得比你多？', '你的名字！'], ['什麼數字最聽話？', '一百，百依百順！'],
    ['為什麼數學課本總是愁眉苦臉？', '因為它有好多「問題」！'], ['時鐘為什麼總是很忙？', '因為它一直在趕時間！'],
    ['哪一個字大家都念「錯」？', '就是「錯」這個字！'], ['什麼東西越生氣越大？', '脾氣！'], ['什麼東西有頭沒有腳？', '火柴棒！'],
    ['小明的爸爸有三個兒子：大毛、二毛，老三叫什麼？', '小明啊！'], ['什麼蛋不能吃？', '笨蛋～但你不是喔！'],
    ['什麼動物最會寫字？', '小鴨子，因為牠會「呱呱呱」（寫寫寫）～好啦這個有點冷！']];

  // ---------- 資料 ----------
  function load() {
    var d; try { d = JSON.parse(localStorage.getItem(KEY)); } catch (e) {}
    d = d || {};
    d.points = d.points || 0; d.stars = d.stars || 0; d.papers = d.papers || 0; d.owned = d.owned || {}; d.log = d.log || [];
    if (d.walk === undefined) d.walk = true;
    return d;
  }
  function save(d) { try { localStorage.setItem(KEY, JSON.stringify(d)); } catch (e) {} }
  function pet(id) { for (var i = 0; i < PETS.length; i++) if (PETS[i].id === id) return PETS[i]; return null; }
  function stageOf(papers) { return Math.min(RULE.maxStage, 1 + Math.floor((papers || 0) / RULE.papersPerStage)); }
  function url(p) { return /^(https?:)?\//.test(p) ? p : BASE + p; }

  var api = {
    RULE: RULE, PETS: PETS, STAGE_NAME: STAGE_NAME, BASE: BASE,
    get: load, stageOf: stageOf, pet: pet, url: url,
    // 交一張測驗卷：回傳得到的分數、是否算完成、是否進化
    addPaper: function (info) {
      var d = load(), right = info.right || 0, total = info.total || 0;
      var gain = right * RULE.perCorrect + (total && right === total ? RULE.perfectBonus : 0);
      var pass = total > 0 && right / total >= RULE.passRate;
      d.points += gain;
      var res = { gain: gain, pass: pass, points: d.points, evolved: false, active: d.active || null };
      if (pass) {
        d.papers++;
        if (d.active && d.owned[d.active]) {
          var o = d.owned[d.active], before = stageOf(o.papers);
          o.papers = (o.papers || 0) + 1;
          var after = stageOf(o.papers);
          res.stage = after; res.evolved = after > before;
          res.toNext = after >= RULE.maxStage ? 0 : RULE.papersPerStage - (o.papers % RULE.papersPerStage);
        }
      }
      d.log.unshift({ ts: Date.now(), title: info.title || '', right: right, total: total, gain: gain });
      if (d.log.length > 100) d.log.length = 100;
      save(d); refresh();
      return res;
    },
    buy: function (id) {
      var d = load(), p = pet(id);
      if (!p || d.owned[id] || d.points < p.price) return false;
      d.points -= p.price; d.owned[id] = { papers: 0, since: Date.now() };
      if (!d.active) d.active = id;
      save(d); refresh(); return true;
    },
    setActive: function (id) { var d = load(); if (!d.owned[id]) return; d.active = id; save(d); refresh(); },
    setWalk: function (on) { var d = load(); d.walk = !!on; save(d); refresh(); },
    // 月考測驗卷交卷得到的星星（80 分 1、90 分 1.5、100 分 2）存起來換萌寵
    addStars: function (n, title) {
      var d = load(); n = +n || 0; if (!n) return d.stars;
      d.stars = Math.round((d.stars + n) * 10) / 10;
      d.log.unshift({ ts: Date.now(), title: title || '', star: n }); if (d.log.length > 100) d.log.length = 100;
      save(d); return d.stars;
    },
    canUse: function (id) { var d = load(), p = pet(id); return !!p && (!!d.owned[id] || !p.star); },
    // 用星星解鎖（已擁有或免費的直接回傳 true）
    unlock: function (id) {
      var d = load(), p = pet(id); if (!p) return false;
      if (d.owned[id] || !p.star) return true;
      if (d.stars < p.star) return false;
      d.stars = Math.round((d.stars - p.star) * 10) / 10; d.owned[id] = { papers: 0, since: Date.now() };
      save(d); return true;
    },
    // 挑一隻當陪伴萌寵（免費的或已解鎖的）
    choose: function (id) {
      var d = load(), p = pet(id); if (!p) return false;
      if (!d.owned[id]) { if (p.star) return false; d.owned[id] = { papers: 0, since: Date.now() }; }
      d.active = id; d.walk = true; d.skipPick = false; save(d); refresh(); return true;
    },
    picker: function (auto) { openPicker(auto); }
  };
  window.KGPet = api;

  // ---------- 散步的萌寵 ----------
  var el = null, img = null, bubble = null, moveT = null, playing = false, animIdx = 0, curKey = '';
  var css = document.createElement('style');
  css.textContent =
    '#kg-pet[hidden]{display:none}#kg-pet{position:fixed;left:40%;top:70%;z-index:2147482990;width:84px;height:84px;cursor:pointer;transition:left 3.2s ease-in-out,top 3.2s ease-in-out;touch-action:manipulation;-webkit-tap-highlight-color:transparent}' +
    '#kg-pet img{width:100%;height:100%;object-fit:contain;pointer-events:none;filter:drop-shadow(0 4px 4px rgba(0,0,0,.25));animation:kgpBob 1.6s ease-in-out infinite;transform-origin:50% 90%}' +
    '#kg-pet.left img{transform:scaleX(-1)}' +
    '#kg-pet.s2{width:96px;height:96px}#kg-pet.s3{width:108px;height:108px}#kg-pet.s4{width:120px;height:120px}' +
    '#kg-pet .crown{position:absolute;left:50%;top:-14px;transform:translateX(-50%);font-size:22px;pointer-events:none}' +
    '#kg-pet .bub{position:absolute;bottom:100%;left:50%;transform:translateX(-50%);margin-bottom:6px;white-space:normal;width:max-content;max-width:min(230px,70vw);text-align:center;line-height:1.4;background:#fff;color:#333;border:2px solid #ffb84d;border-radius:14px;padding:4px 10px;font:700 14px "Microsoft JhengHei","PingFang TC",sans-serif;box-shadow:0 3px 8px rgba(0,0,0,.15);pointer-events:none;opacity:0;transition:opacity .2s}' +
    '#kg-pet .bub.on{opacity:1}' +
    '#kg-pet .fx{position:absolute;left:50%;top:10%;font-size:22px;pointer-events:none;animation:kgpFly 1.2s ease-out forwards}' +
    '#kg-pet.a-jump img{animation:kgpJump .7s ease-in-out 2}' +
    '#kg-pet.a-spin img{animation:kgpSpin 1s ease-in-out}' +
    '#kg-pet.a-wiggle img{animation:kgpWiggle .5s ease-in-out 3}' +
    '#kg-pet.a-heart img{animation:kgpPop .6s ease-in-out 2}' +
    '#kg-pet.kg-dodge{opacity:.3;pointer-events:none}' +
    '#kg-pet.p-wave img{animation:kgpWave .45s ease-in-out 5}' +
    '#kg-pet.p-cheer img{animation:kgpJump .6s ease-in-out 2}' +
    '#kg-pet.p-sleep img{animation:kgpBreath 2.6s ease-in-out infinite}' +
    '@keyframes kgpWave{0%,100%{rotate:0deg}50%{rotate:-9deg}}' +
    '@keyframes kgpBreath{0%,100%{scale:1}50%{scale:1.04 0.97}}' +
    '@keyframes kgpBob{0%,100%{translate:0 0}50%{translate:0 -6px}}' +
    '@keyframes kgpJump{0%,100%{translate:0 0}40%{translate:0 -38px}60%{translate:0 -38px}}' +
    '@keyframes kgpSpin{to{rotate:360deg}}' +
    '@keyframes kgpWiggle{0%,100%{rotate:0deg}25%{rotate:-14deg}75%{rotate:14deg}}' +
    '@keyframes kgpPop{0%,100%{scale:1}50%{scale:1.25}}' +
    '@keyframes kgpFly{0%{opacity:1;translate:-50% 0}100%{opacity:0;translate:-50% -60px}}' +
    '@media (max-width:600px){#kg-pet{width:66px;height:66px}#kg-pet.s2{width:74px;height:74px}#kg-pet.s3{width:82px;height:82px}#kg-pet.s4{width:90px;height:90px}}' +
    '@media print{#kg-pet{display:none}}' +
    '@media (prefers-reduced-motion:reduce){#kg-pet{transition:none}#kg-pet img{animation:none!important}}';

  var visitor = null;   // 還沒有自己的萌寵時：隨機一隻來串門子
  function stageData() {
    var d = load(), p = d.active && pet(d.active), o = p && d.owned[p.id];
    if (!p || !o) {
      if (!visitor) visitor = PETS[Math.floor(Math.random() * PETS.length)];
      return { d: d, p: visitor, s: 1, st: visitor.stages[0], visitor: true };
    }
    var s = stageOf(o.papers);
    return { d: d, p: p, s: s, st: p.stages[s - 1] || p.stages[0] };
  }
  function refresh() {
    var sd = stageData();
    if (!sd || !sd.d.walk || /\/galaxy-english\//.test(location.pathname)) { if (el) { el.remove(); el = null; } return; }
    if (!document.body) return;
    if (!el) {
      if (!css.parentNode) document.head.appendChild(css);
      el = document.createElement('div'); el.id = 'kg-pet'; el.setAttribute('role', 'button');
      el.innerHTML = '<span class="bub"></span><img alt="">';
      img = el.querySelector('img'); bubble = el.querySelector('.bub');
      el.addEventListener('click', play);
      document.body.appendChild(el);
      wander();
      if (sd.visitor) { el.hidden = true; schedule(8000 + Math.random() * 10000, true); }
      else {
        chatter();
        if (sd.p.poses) setTimeout(function () { if (el && !el.hidden) { pose('wave', 0); say(pick(['嗨～蜜蜜來陪你囉！', '哈囉！今天也一起加油吧！', '蜜蜜好想你喔～'])); } }, 1200);
      }
    }
    if (!sd.visitor && el.hidden) { clearTimeout(visitT); el.hidden = false; chatter(); }
    var key = sd.p.id + sd.s;
    if (key !== curKey) { curKey = key; img.src = url(sd.st.img); }
    el.className = (el.classList.contains('left') ? 'left ' : '') + 's' + sd.s;
    el.title = sd.p.name + '（' + STAGE_NAME[sd.s - 1] + '）：點我一下！';
    img.alt = sd.p.name;
    var cr = el.querySelector('.crown');
    if (sd.s >= 4 && !cr) el.insertAdjacentHTML('beforeend', '<span class="crown">👑</span>');
    if (sd.s < 4 && cr) cr.remove();
  }
  // 在畫面邊緣附近隨意走動，避開正中間的作答區
  function wander() {
    if (!el) return;
    clearTimeout(moveT);
    if (!playing) {
      var w = innerWidth, h = innerHeight, size = el.offsetWidth || 80;
      var zone = Math.random();
      var x, y;
      if (zone < 0.5) { x = Math.random() * (w - size); y = h - size - 70 - Math.random() * 40; }       // 下方
      else if (zone < 0.75) { x = Math.random() * Math.min(80, w * 0.12); y = h * (0.3 + Math.random() * 0.45); } // 左側
      else { x = w - size - Math.random() * Math.min(80, w * 0.12); y = h * (0.3 + Math.random() * 0.45); }       // 右側
      var cur = el.getBoundingClientRect().left;
      el.classList.toggle('left', x < cur);
      el.style.left = Math.max(0, x) + 'px'; el.style.top = Math.max(60, y) + 'px';
    }
    moveT = setTimeout(wander, 4500 + Math.random() * 4000);
  }
  var sayT = null;
  function say(t, ms) {
    clearTimeout(sayT); bubble.textContent = t; bubble.classList.add('on');
    sayT = setTimeout(function () { bubble.classList.remove('on'); }, ms || 2600);
  }
  // ---------- 有多種姿勢的萌寵（蜜蜜） ----------
  var poseT = null, sleeping = false, idleT = null;
  function hasPoses() { var sd = stageData(); return sd && sd.p.poses ? sd : null; }
  // 換姿勢 ms 毫秒後回到招手（ms 為 0 表示停在這個姿勢）
  function pose(name, ms) {
    var sd = hasPoses(); if (!sd || !el) return;
    clearTimeout(poseT);
    el.classList.remove('p-wave', 'p-cheer', 'p-sleep');
    img.src = url(sd.p.poses[name] || sd.st.img);
    if (name === 'wave' || name === 'cheer' || name === 'sleep') { void el.offsetWidth; el.classList.add('p-' + name); }
    if (ms) poseT = setTimeout(function () { if (!sleeping) pose('wave', 0); }, ms);
  }
  function pick(a) { return a[Math.floor(Math.random() * a.length)]; }
  function poseTalk(sd) {
    var r = Math.random();
    if (r < 0.2) {          // 笑話：先想一想，再歡呼說答案
      var j = pick(JOKE); pose('think', 0); say(j[0], 2600);
      setTimeout(function () { if (el && !sleeping) { pose('cheer', 3400); say(j[1], 3200); } }, 2700);
    } else if (r < 0.32) { pose('write', 4000); say(pick(['我也跟你一起寫作業～', '我們一起把題目看清楚！', '蜜蜜也在認真做筆記喔！']), 3000); }
    else { pose(pick(['thumb', 'cheer', 'wave', 'thumb']), 3200); say(pick(sd.p.praise), 3000); }
  }
  // 太久沒動就睡著，小朋友一動就醒來
  function idleReset() {
    clearTimeout(idleT);
    if (sleeping) {
      sleeping = false;
      if (hasPoses() && el && !el.hidden) { pose('cheer', 2600); say(pick(['啊！我醒了！你還在努力耶，好棒！', '蜜蜜睡飽了！我們繼續加油～']), 3000); }
    }
    idleT = setTimeout(function () {
      if (!hasPoses() || !el || el.hidden) return;
      sleeping = true; pose('sleep', 0); say('呼…呼…（點我叫醒蜜蜜）', 4000);
    }, 120000);
  }
  ['pointerdown', 'keydown'].forEach(function (t) { addEventListener(t, idleReset, true); });
  idleReset();

  // 隨機說打氣的話或講一個短笑話
  function talk() {
    if (!el || el.hidden) return;
    var sp = hasPoses();
    if (sp) { if (!sleeping) poseTalk(sp); return; }
    if (Math.random() < 0.45) {
      var j = JOKE[Math.floor(Math.random() * JOKE.length)];
      say(j[0], 2600); setTimeout(function () { if (el) say(j[1], 3200); }, 2700);
    } else say(CHEER[Math.floor(Math.random() * CHEER.length)]);
  }
  var talkT = null, visitT = null;
  function chatter() { clearTimeout(talkT); var fast = !!hasPoses(); talkT = setTimeout(function () { talk(); chatter(); }, fast ? 11000 + Math.random() * 8000 : 16000 + Math.random() * 12000); }
  // 訪客模式：出現 40～70 秒，離開 1.5～3 分鐘，再換一隻隨機出現
  function schedule(wait, show) {
    clearTimeout(visitT);
    visitT = setTimeout(function () {
      if (!el) return;
      if (show) {
        visitor = PETS[Math.floor(Math.random() * PETS.length)]; curKey = ''; refresh();
        el.hidden = false; wander();
        setTimeout(function () { say(['嗨！我來陪你讀書囉～', '哈囉！我路過來幫你加油！', '嘿嘿，偷偷來看你在做什麼～'][Math.floor(Math.random() * 3)]); }, 900);
        chatter();
        schedule(40000 + Math.random() * 30000, false);
      } else {
        say('我先去散步，等一下再來找你！', 2200);
        clearTimeout(talkT);
        setTimeout(function () { if (el) el.hidden = true; }, 2300);
        schedule(90000 + Math.random() * 90000, true);
      }
    }, wait);
  }
  // 點一下：輪流播放動畫（自訂的動圖，或內建動畫）
  function play() {
    var sd = stageData(); if (!sd || playing) return;
    if (sd.p.poses) {       // 蜜蜜：點一下就換姿勢、誇獎＋冒愛心
      playing = true; sleeping = false;
      var seq = ['cheer', 'thumb', 'wave', 'think'], nm = seq[animIdx++ % seq.length];
      pose(nm, 2600);
      say(nm === 'think' ? '嗯…你在想什麼呢？你一定想得出來！' : pick(sd.p.praise), 2800);
      ['💛', '✨', '💛'].forEach(function (e, i) { setTimeout(function () { var f = document.createElement('span'); f.className = 'fx'; f.textContent = e; f.style.marginLeft = (i - 1) * 18 + 'px'; el.appendChild(f); setTimeout(function () { f.remove(); }, 1300); }, i * 180); });
      setTimeout(function () { playing = false; }, 1500);
      return;
    }
    playing = true;
    var anims = sd.st.anims && sd.st.anims.length ? sd.st.anims : null;
    var done = function () { playing = false; el.classList.remove('a-jump', 'a-spin', 'a-wiggle', 'a-heart'); img.src = url(sd.st.img); };
    talk();
    if (anims) {
      var a = anims[animIdx++ % anims.length], src = typeof a === 'string' ? a : a.src, ms = (typeof a === 'object' && a.ms) || 2000;
      img.src = url(src) + (url(src).indexOf('?') < 0 ? '?t=' : '&t=') + Date.now(); // 從頭播放
      setTimeout(done, ms);
    } else {
      var kinds = ['a-jump', 'a-spin', 'a-wiggle', 'a-heart'], k = kinds[animIdx++ % kinds.length];
      el.classList.add(k);
      if (k === 'a-heart') ['💖', '✨', '💖'].forEach(function (e, i) { setTimeout(function () { var f = document.createElement('span'); f.className = 'fx'; f.textContent = e; f.style.marginLeft = (i - 1) * 18 + 'px'; el.appendChild(f); setTimeout(function () { f.remove(); }, 1300); }, i * 180); });
      setTimeout(done, 1400);
    }
  }

  // ---------- 挑選陪伴萌寵的視窗 ----------
  function openPicker(auto) {
    if (document.getElementById('kg-pick')) return;
    var d = load();
    var st = document.createElement('style');
    st.textContent =
      '#kg-pick{position:fixed;inset:0;z-index:2147483400;background:rgba(40,30,20,.55);display:flex;align-items:center;justify-content:center;padding:14px;font-family:"Microsoft JhengHei","PingFang TC","Noto Sans TC",sans-serif}' +
      '#kg-pick .bx{width:min(760px,100%);max-height:94vh;overflow:auto;background:linear-gradient(160deg,#fff7e6,#eaf6ff);border-radius:26px;padding:22px 18px;text-align:center;box-shadow:0 14px 40px rgba(0,0,0,.35)}' +
      '#kg-pick h2{margin:0 0 4px;font-size:clamp(22px,5.5vw,30px);color:#b5651d}' +
      '#kg-pick p{margin:0 0 14px;color:#6b5b48}' +
      '#kg-pick .ps{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:14px}' +
      '#kg-pick .pc{font:inherit;cursor:pointer;background:#fff;border:4px solid #f0dcc0;border-radius:22px;padding:14px 10px;display:grid;gap:6px;justify-items:center;color:#2b2b2b;transition:transform .15s}' +
      '#kg-pick .pc:hover,#kg-pick .pc:focus-visible{transform:translateY(-4px);border-color:#e0954a;outline:none}' +
      '#kg-pick .pc.on{border-color:#e0954a;box-shadow:0 6px 0 #f3c08a}' +
      '#kg-pick .pc img{width:120px;height:120px;object-fit:contain;animation:kgpBob 1.6s ease-in-out infinite;filter:drop-shadow(0 6px 6px rgba(0,0,0,.2))}' +
      '#kg-pick .pc b{font-size:22px}#kg-pick .pc small{color:#6b6b6b;line-height:1.5}' +
      '#kg-pick .skip{margin-top:14px;font:inherit;background:none;border:none;color:#8a7a66;text-decoration:underline;cursor:pointer}' +
      '#kg-pick .pc.lock{cursor:not-allowed;background:#eef0f4;border-style:dashed;border-color:#c9ced8}' +
      '#kg-pick .pc.lock:hover{transform:none;border-color:#c9ced8}' +
      '#kg-pick .pc.lock .sil{position:relative;display:block;width:120px;height:120px}' +
      '#kg-pick .pc.lock img{animation:none;filter:brightness(0) opacity(.82)}' +
      '#kg-pick .pc.lock i{position:absolute;inset:0;display:grid;place-items:center;font-style:normal;font-size:64px;font-weight:900;color:#fff;text-shadow:0 0 10px rgba(0,0,0,.6)}' +
      '#kg-pick .pc.lock b{color:#555}#kg-pick .pc.lock small{color:#7a6a9a;font-weight:700}' +
      '#kg-pick .wal{background:#fff;border:2px solid #f0dcc0;border-radius:14px;padding:8px 12px;margin:0 0 14px;color:#6b5b48}#kg-pick .wal b{font-size:22px;color:#e0954a}#kg-pick .wal small{display:block;margin-top:2px}' +
      '#kg-pick .pc .need{font-size:14px;font-weight:800;color:#8a7a66;background:#f4ece0;border-radius:999px;padding:3px 10px}' +
      '#kg-pick .pc.need img{filter:grayscale(1) opacity(.55);animation:none}' +
      '#kg-pick .pc.can .need{color:#fff;background:#e0954a}' +
      '#kg-pick .pc.shake{animation:kgpShake .4s}' +
      '#kg-pick .pc .spn{font-size:14px;font-weight:900;color:#8a5a00;background:linear-gradient(90deg,#ffe58a,#ffd34d);border:2px solid #f5b800;border-radius:999px;padding:3px 12px}' +
      '@keyframes kgpShake{0%,100%{translate:0}25%{translate:-6px}75%{translate:6px}}' +
      '@keyframes kgpBob{0%,100%{translate:0 0}50%{translate:0 -6px}}';
    document.head.appendChild(st);
    var w = document.createElement('div'); w.id = 'kg-pick';
    w.innerHTML = '<div class="bx" role="dialog" aria-label="挑選陪伴萌寵"><h2>🐾 選一隻萌寵陪你讀書！</h2><p>牠會跟著你到每個科目，幫你加油、講笑話給你聽。</p>' +
      '<div class="wal">⭐ 我的星星：<b>' + d.stars + '</b> 顆　<small>寫「📝 月考測驗卷」80 分得 1 顆、90 分 1.5 顆、100 分 2 顆，可以解鎖新萌寵</small></div>' +
      '<div class="ps">' + PETS.map(function (p) {
        var own = d.owned[p.id] || !p.star, enough = d.stars >= p.star;
        var tag = p.sponsor ? '<span class="spn">' + p.sponsor + '</span>' : own ? '' :'<span class="need">' + (enough ? '🔓 用 ' + p.star + ' 顆星解鎖' : '🔒 需要 ' + p.star + ' 顆星（還差 ' + Math.round((p.star - d.stars) * 10) / 10 + ' 顆）') + '</span>';
        return '<button class="pc' + (d.active === p.id ? ' on' : '') + (own ? '' : enough ? ' can' : ' need') + '" type="button" data-id="' + p.id + '"><img src="' + url(p.stages[0].img) + '" alt=""><b>' + p.name + '</b><small>' + p.desc + '</small>' + tag + '</button>';
      }).join('') +
      // 還沒開放的萌寵：黑色剪影＋問號，不能點
      LOCKED.map(function (src, k) {
        return '<div class="pc lock" aria-disabled="true" title="等待贊助解鎖新萌寵"><span class="sil"><img src="' + url(src) + '" alt="" style="' + LOCK_TF[k] + '"><i>?</i></span><b>？？？</b><small>等待贊助解鎖新萌寵</small></div>';
      }).join('') + '</div>' +
      '<button class="skip" type="button">' + (d.active ? '不換了，關閉' : '先不要，直接選科目') + '</button></div>';
    document.body.appendChild(w);
    function close() { w.remove(); st.remove(); }
    w.querySelectorAll('button.pc').forEach(function (b) {
      b.onclick = function () {
        var p = pet(b.dataset.id), d3 = load();
        if (!api.canUse(p.id)) {
          if (d3.stars < p.star) { b.classList.remove('shake'); void b.offsetWidth; b.classList.add('shake'); return; }
          if (!confirm('要用 ' + p.star + ' 顆星解鎖「' + p.name + '」嗎？（你有 ' + d3.stars + ' 顆）')) return;
          api.unlock(p.id);
        }
        api.choose(p.id); close();
        if (typeof window.onKGPetChange === 'function') window.onKGPetChange();
        setTimeout(function () { if (el) { if (p.poses) pose('wave', 0); say('我是' + p.name + '！我們一起去闖關吧！', 3000); } }, 500);
      };
    });
    w.querySelector('.skip').onclick = function () { if (auto) { var d2 = load(); d2.skipPick = true; save(d2); } close(); };
  }

  // 蓋到遊戲按鈕時讓開（和 home-button.js 同樣的做法）
  var lastDodgeMove = 0;
  function dodge() {
    if (!el || playing) return;
    el.classList.remove('kg-dodge');
    var r = el.getBoundingClientRect(), x = r.left + r.width / 2, y = r.top + r.height / 2;
    var stack = document.elementsFromPoint ? document.elementsFromPoint(x, y) : [];
    for (var i = 0; i < stack.length; i++) {
      var t = stack[i];
      if (t === el || el.contains(t)) continue;
      if (t === document.body || t === document.documentElement) break;
      if (t.closest && t.closest('button,a[href],input,select,textarea,[role="button"],[onclick],[draggable="true"]')) {
        // 先讓點擊穿過去，再走到別的地方
        el.classList.add('kg-dodge');
        if (Date.now() - lastDodgeMove > 3500) { lastDodgeMove = Date.now(); wander(); }
        break;
      }
    }
  }
  setInterval(dodge, 500);
  // 本機測試時找不到 /kuog88.github.io/ 的圖片，就改用正式網站的圖
  addEventListener('error', function (e) {
    var t = e.target;
    if (t && t.tagName === 'IMG' && t.closest && t.closest('#kg-pet,#kg-pick')) {
      var s = t.getAttribute('src') || '';
      if (s.indexOf('/kuog88.github.io/') === 0) t.src = 'https://kuog88.github.io/' + s.slice(18);
    }
  }, true);
  window.addEventListener('storage', function (e) { if (e.key === KEY) refresh(); });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', refresh); else refresh();
})();

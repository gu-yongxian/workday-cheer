(()=>{
 'use strict';
 const E=CheerEngine,$=s=>document.querySelector(s),all=s=>[...document.querySelectorAll(s)];
 let settings={...E.defaults},saved=false,storageOK=true,pip=null,installPrompt=null,quoteIndex=0,lastReminder=Date.now(),lastMilestone=0;
 const KEY='workday-cheer-v1';
 try{const raw=localStorage.getItem(KEY);if(raw){const x=JSON.parse(raw);if(!E.validate({...E.defaults,...x})){settings={...E.defaults,...x};saved=true;}}if(localStorage.getItem('cheer-theme')==='dark')document.documentElement.classList.add('dark');}catch{storageOK=false;}
 const standalone=new URLSearchParams(location.search).has('widget');
 if(standalone)document.body.classList.add('standalone-widget');
 const quotes=['工资正在加载，快乐也别落下。','今天的努力，正在悄悄长出生活的底气。','允许自己慢一点，前进就有意义。','工作是生活的一部分，快乐也是。','认真工作的你，也值得被认真照顾。','多一份收入，就多一份选择的自由。','喝口水，伸个懒腰，今天的你已经很棒了。','下班后的晚风，正在等你。','账户慢慢变厚，生活慢慢变甜。','每个平凡的工作日，都在为喜欢的生活铺路。'];
 function toast(t){$('#toast').textContent=t;$('#toast').hidden=false;clearTimeout(toast.timer);toast.timer=setTimeout(()=>$('#toast').hidden=true,5200);}
 const money=(n,d=2)=>Number(n).toLocaleString('zh-CN',{minimumFractionDigits:d,maximumFractionDigits:d});
 function duration(ms){const s=Math.max(0,Math.floor(ms/1000));return [Math.floor(s/3600),Math.floor(s/60)%60,s%60].map(x=>String(x).padStart(2,'0'));}
 function docs(){return pip&&!pip.closed?[document,pip.document]:[document];}
 function values(k,t){for(const d of docs())d.querySelectorAll(`[data-value="${k}"]`).forEach(e=>e.textContent=t);}
 function render(){
  const now=new Date(),x=E.snapshot(now,settings),[h,m,s]=duration(x.countdown),active=['work','lunch'].includes(x.code);
  values('status',x.status);values('earned',money(x.earned,4));values('monthEarned',money(x.monthEarned));values('daily',money(x.daily));values('minuteRate',`${x.paidRunning?'+':'时薪换算'} ¥${money(x.rate*60000,4)} / 分钟`);values('percent',`${(x.progress*100).toFixed(1)}%`);values('payDays',x.payDays);values('coffees',(x.earned/settings.coffee).toFixed(1));values('shortCountdown',`${active?'下班':'开工'} ${h}:${m}:${s}`);
  $('#clock').textContent=now.toLocaleTimeString('zh-CN',{hour12:false});
  $('#dateLabel').textContent=now.toLocaleDateString('zh-CN',{month:'long',day:'numeric',weekday:'long',year:'numeric'});
  $('#greeting').innerHTML=(x.code==='done'?'下班快乐，把时间留给自己':x.code==='rest'?'今天休息，快乐也要认真':now.getHours()<12?'早上好，今天也在慢慢变好':'认真生活的你，辛苦啦')+'<span>✳</span>';
  $('#earningCaption').textContent=x.code==='lunch'?(settings.paidLunch?'安心休息，收入继续累计':'休息一下，下午接着发光'):x.code==='done'?'今日努力已到账，好好享受生活':'你的每一份认真，都有回响';
  $('#shiftStart').textContent=`${settings.start} 开始`;
  $('#shiftEnd').textContent=`${settings.end}${E.minutes(settings.end)<E.minutes(settings.start)?' 次日':''} 自由`;
  $('#countdownLabel').textContent=active?'距离快乐下班':x.code==='done'?'距离下次开工':x.code==='rest'?'距离下次开工':'距离今天开工';
  $('#countdownTag').textContent=active?'今日':x.next&&E.dateKey(x.next)===E.dateKey(now)?'今日':'下次';
  $('#countdownText').textContent=active?'再攒一点努力，就去拥抱自己的生活。':x.code==='rest'||x.code==='done'?'现在的时间，属于你自己。':'别着急，给今天一个舒服的开始。';
  const counter=$('[data-value="countdown"]');counter.replaceChildren();for(const [i,n]of[h,m,s].entries()){const el=document.createElement(i===2?'small':'span');el.textContent=n;const unit=document.createElement('em');unit.textContent=['时','分','秒'][i];el.append(unit);counter.append(el);}
  const mp=Math.max(0,Math.min(1,x.monthEarned/settings.salary));
  for(const d of docs()){d.querySelectorAll('[data-progress="day"]').forEach(e=>e.style.width=`${x.progress*100}%`);d.querySelectorAll('[data-progress="month"]').forEach(e=>e.style.width=`${mp*100}%`);}
  $('#monthPercent').textContent=`${(x.monthEarned/settings.salary*100).toFixed(1)}%`;
  $('#monthHint').textContent=`${x.activeDate.getMonth()+1} 月 · ${settings.fixedDays?'固定 21.75 天换算':'按排班工作日平摊'}`;
  $('#workdaysHint').textContent=`本月计划工作 ${x.workdays} 天`;
  $('#hoursHint').textContent=`${(x.total/3600000).toFixed(1)} 计薪小时 / 天`;
  $('#rateHint').textContent=`每小时 ¥${money(x.rate*3600000)} · ${settings.paidLunch&&settings.lunch?'含带薪午休':'按计薪时长累计'}`;
  $('#paydayHint').textContent=x.payDays===0?'今天就是发薪日，好事将近！':`每月 ${settings.payday} 日，收获到账`;
  $('#coffeePrice').textContent=`¥${money(settings.coffee,settings.coffee%1?2:0)} / 杯`;
  const cups=Math.floor(x.earned/settings.coffee);$('#coffeeText').textContent=cups>0?`今日努力已兑换 ${cups} 杯快乐，记得奖励自己。`:'一杯咖啡的时间，也能攒下一点幸福。';
  $('#setupBanner').hidden=saved;
  if(saved&&x.paidRunning&&cups>lastMilestone&&lastMilestone>0)toast(`☕ 又攒到一杯快乐！今天已经赚到 ${cups} 杯咖啡啦。`);lastMilestone=cups;
  if(settings.remind&&x.code==='work'&&Date.now()-lastReminder>=3600000){lastReminder=Date.now();toast('💧 工作一小时啦，喝口水，站起来伸展一下。');}
 }
 function syncFields(){const f=$('#settingsForm');$('#lunchFields').hidden=!f.elements.lunch.checked;$('#paidLunchField').hidden=!f.elements.lunch.checked;$('#anchorField').hidden=f.elements.schedule.value!=='alternate';$('#restDaysField').hidden=f.elements.schedule.value!=='custom';}
 function openSettings(){const f=$('#settingsForm');for(const [k,v]of Object.entries(settings)){const e=f.elements[k];if(e){if(e.type==='checkbox')e.checked=v;else e.value=String(v);}}all('#restDaysField input').forEach(e=>e.checked=settings.restDays.includes(Number(e.value)));$('#formError').textContent='';syncFields();$('#settingsDialog').showModal();}
 all('[data-settings]').forEach(b=>b.addEventListener('click',openSettings));
 all('[data-close]').forEach(b=>b.addEventListener('click',()=>b.closest('dialog').close()));
 all('dialog').forEach(d=>d.addEventListener('click',e=>{if(e.target===d){const r=d.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)d.close();}}));
 $('#settingsForm').addEventListener('change',syncFields);
 $('#settingsForm').addEventListener('submit',e=>{e.preventDefault();const f=e.currentTarget,n={...settings};for(const k of ['salary','coffee','payday'])n[k]=Number(f.elements[k].value);for(const k of ['start','end','lunchStart','lunchEnd','schedule','anchor'])n[k]=f.elements[k].value;for(const k of ['lunch','paidLunch','remind'])n[k]=f.elements[k].checked;n.fixedDays=f.elements.fixedDays.value==='true';n.restDays=all('#restDaysField input:checked').map(x=>Number(x.value));const error=E.validate(n);if(error){$('#formError').textContent=error;return;}settings=n;saved=true;lastReminder=Date.now();lastMilestone=0;try{localStorage.setItem(KEY,JSON.stringify(settings));storageOK=true;}catch{storageOK=false;}f.closest('dialog').close();render();toast(storageOK?'设置已保存，你的每一秒都开始有意义。':'设置已应用；当前浏览器禁止本地存储，关闭页面后需重新填写。');});
 function help(title,html){$('#helpTitle').textContent=title;$('#helpContent').innerHTML=html;$('#helpDialog').showModal();}
 function installHelp(){if(installPrompt){installPrompt.prompt();installPrompt=null;return;}help('添加到你的桌面','<h3>苹果 Mac · Safari</h3><p>使用 macOS Sonoma 14 或更新版本，在 Safari 打开本网址，点击菜单「文件 → 添加到程序坞」。以后像打开软件一样点击图标即可。</p><h3>Mac / Windows · Chrome、Edge</h3><p>点击浏览器地址栏右侧的安装图标，或在浏览器菜单中选择「安装应用 / 将此页面安装为应用」。</p><h3>让它陪你工作</h3><p>点击小窗右上角的 ↗，或左侧「桌面小窗」。Chrome / Edge 支持置顶悬浮窗；Safari 提供可移动的独立窗口。</p><p>工资设置仅留在当前浏览器。首次添加为应用后，如果没有带入设置，请在应用里再设置一次。</p><h3>也可以完全离线使用</h3><p>下载离线包，解压后双击 index.html。无需安装程序，Mac 与 Windows 均可打开。</p><a class="primary-button" href="downloads/workday-cheer-offline.zip" download="上班鼓励器_离线版.zip">下载离线版 ↓</a><p style="margin-top:18px"><a href="https://support.apple.com/zh-cn/104996" target="_blank" rel="noopener noreferrer">Apple 官方：在 Mac 上使用 Safari 网页 App ↗</a></p>');}
 all('[data-install]').forEach(b=>b.addEventListener('click',installHelp));
 window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();installPrompt=e;});
 $('#calculationButton').addEventListener('click',()=>help('每一秒的收入怎么算？','<h3>计薪公式</h3><p>默认日薪 = 月薪 ÷ 本月计划工作日；每秒收入 = 日薪 ÷ 每日计薪秒数。今天收入 = 已经过的计薪秒数 × 每秒收入。本月累计按当月各班次实际已经过的计薪时间估算。</p><h3>午休、休息日与跨夜班</h3><p>不带薪午休暂停累计；带薪午休继续累计。休息日不累计。跨夜班收入归属开工当天，午夜后继续计时。大小周以设置中选定的双休周为起点交替。</p><h3>换算方式</h3><p>可改为固定按 21.75 天换算日薪；该方式下，本月累计可能高于或低于所填月薪。法定节假日、调休、奖金、扣款和税费暂不自动计算。</p><h3>使用本地时间</h3><p>日期与上下班时间以这台电脑的时区为准。修改工资和排班后，会按新设置重新计算整个月。关闭页面后无需持续运行，再次打开会根据当前时间自动更新。</p>'));
 $('#quoteButton').addEventListener('click',()=>{quoteIndex=(quoteIndex+1)%quotes.length;$('#quoteText').textContent=quotes[quoteIndex];});
 $('#themeButton').addEventListener('click',()=>{const dark=document.documentElement.classList.toggle('dark');$('#themeButton').textContent=dark?'☀':'☾';try{localStorage.setItem('cheer-theme',dark?'dark':'light');}catch{}if(pip&&!pip.closed)pip.document.documentElement.classList.toggle('dark',dark);});
 $('#themeButton').textContent=document.documentElement.classList.contains('dark')?'☀':'☾';
 function minimize(){if(standalone){window.close();return;}$('#widget').hidden=true;$('#widgetLauncher').hidden=false;}
 $('#widgetMin').addEventListener('click',minimize);
 $('#widgetLauncher').addEventListener('click',()=>{$('#widget').hidden=false;$('#widgetLauncher').hidden=true;});
 async function floatWindow(){
  if(standalone){help('小窗的使用方式','<p>可以拖动浏览器窗口到屏幕右下角。要开启始终置顶，请回到 Chrome / Edge 的主页面，点击「桌面小窗」。</p>');return;}
  if(pip&&!pip.closed){pip.focus();return;}
  if('documentPictureInPicture'in window){try{pip=await window.documentPictureInPicture.requestWindow({width:340,height:270,preferInitialWindowPlacement:true});pip.document.title='上班鼓励器';const sheet=pip.document.createElement('link');sheet.rel='stylesheet';sheet.href=new URL('style.css',location.href).href;pip.document.head.append(sheet);pip.document.body.className='standalone-widget';pip.document.documentElement.lang='zh-CN';pip.document.documentElement.classList.toggle('dark',document.documentElement.classList.contains('dark'));const clone=$('#widget').cloneNode(true);clone.hidden=false;clone.querySelector('#widgetPin').remove();clone.querySelector('#widgetMin').remove();pip.document.body.append(clone);$('#widget').hidden=true;$('#widgetLauncher').hidden=true;pip.addEventListener('pagehide',()=>{pip=null;$('#widget').hidden=false;$('#widgetLauncher').hidden=true;});render();toast('悬浮窗已打开，可拖到屏幕右下角。保留主页面，小窗会持续更新。');return;}catch{toast('当前环境未允许置顶小窗，将尝试打开独立窗口。');}}
  const width=355,height=330,left=Math.max(0,screen.availWidth-width-24),top=Math.max(0,screen.availHeight-height-48),url=new URL(location.href);url.search='?widget=1';const child=window.open(url.href,'workday-cheer-widget',`popup=yes,width=${width},height=${height},left=${left},top=${top}`);if(!child){help('请允许打开小窗','<p>浏览器拦截了弹出窗口。请在地址栏允许此网站弹出窗口，然后再次点击「桌面小窗」。</p>');}else{child.focus();$('#widget').hidden=true;$('#widgetLauncher').hidden=false;toast('独立小窗已打开。Chrome / Edge 可提供置顶悬浮；窗口位置可能由系统调整。');}
 }
 $('#navFloat').addEventListener('click',floatWindow);$('#widgetPin').addEventListener('click',floatWindow);
 $('#navHome').addEventListener('click',()=>window.scrollTo({top:0,behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'}));
 window.addEventListener('storage',e=>{if(e.key===KEY&&e.newValue){try{const n={...E.defaults,...JSON.parse(e.newValue)};if(!E.validate(n)){settings=n;saved=true;lastMilestone=0;render();}}catch{}}});
 window.addEventListener('focus',render);document.addEventListener('visibilitychange',render);
 if('serviceWorker'in navigator&&location.protocol!=='file:')navigator.serviceWorker.register('./sw.js').catch(()=>{});
 render();setInterval(render,1000);if(!storageOK)setTimeout(()=>toast('当前浏览器未允许本地存储，设置在关闭后可能无法保留。'),800);
})();

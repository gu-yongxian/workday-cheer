(function(root){
 'use strict';
 const WIDTH=360,HEIGHT=400;
 function mount(win,host,{floating=false,onGoal=()=>{}}={}){
  if(!host)return ()=>{};
  const doc=win.document;
  if(floating){doc.documentElement.classList.add('widget-document');doc.documentElement.style.background='#244d3e';}
  function fit(){
   if(floating){host.style.setProperty('--widget-scale','1');host.style.setProperty('--window-scale',String(Math.min(win.innerWidth/WIDTH,win.innerHeight/HEIGHT)));}
   else{host.style.setProperty('--widget-scale',String(host.getBoundingClientRect().width/WIDTH));}
  }
  function resize(kind){
   const current=Math.min(win.innerWidth/WIDTH,win.innerHeight/HEIGHT);
   const scale=kind==='reset'?1:Math.max(.7,Math.min(2,current*(kind==='larger'?1.12:1/1.12)));
   const chromeW=Math.max(0,win.outerWidth-win.innerWidth),chromeH=Math.max(0,win.outerHeight-win.innerHeight);
   try{win.resizeTo(Math.round(WIDTH*scale+chromeW),Math.round(HEIGHT*scale+chromeH));}catch{/* 用户仍可使用窗口边框，卡片始终等比适配。 */}
  }
  function click(event){const control=event.target.closest('button');if(!control)return;if(control.dataset.widgetSize)resize(control.dataset.widgetSize);if(control.hasAttribute('data-widget-goal'))onGoal();}
  host.addEventListener('click',click);win.addEventListener('resize',fit);
  const observer=new win.ResizeObserver(fit);observer.observe(floating?doc.documentElement:host);fit();
  return ()=>{observer.disconnect();win.removeEventListener('resize',fit);host.removeEventListener('click',click);};
 }
 root.CheerWidget={WIDTH,HEIGHT,mount};
})(window);

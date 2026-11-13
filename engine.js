(function(root){
  'use strict';
  const DAY=86400000;
  const defaults={salary:12000,start:'09:00',end:'18:00',lunchStart:'12:00',lunchEnd:'13:00',lunch:true,paidLunch:false,schedule:'double',restDays:[0,6],anchor:'2026-11-09',fixedDays:false,coffee:25,payday:10,remind:false};
  const minutes=t=>{const [h,m]=t.split(':').map(Number);return h*60+m;};
  const day=d=>new Date(d.getFullYear(),d.getMonth(),d.getDate());
  const dateKey=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  const addDay=(d,n)=>new Date(d.getFullYear(),d.getMonth(),d.getDate()+n);
  const ordinal=d=>Date.UTC(d.getFullYear(),d.getMonth(),d.getDate())/DAY;
  function isWorkday(d,s){
    const w=d.getDay();
    if(s.schedule==='single')return w!==0;
    if(s.schedule==='double')return w!==0&&w!==6;
    if(s.schedule==='custom')return !s.restDays.includes(w);
    if(w===0)return false;
    if(w!==6)return true;
    const a=new Date(s.anchor+'T00:00:00');
    const monday=addDay(a,-((a.getDay()+6)%7));
    const delta=Math.floor((ordinal(d)-ordinal(monday))/7);
    return ((delta%2)+2)%2===1;
  }
  function shift(d,s){
    const base=day(d),at=m=>new Date(base.getFullYear(),base.getMonth(),base.getDate(),0,m);
    let begin=minutes(s.start),finish=minutes(s.end);if(finish<=begin)finish+=1440;
    let ls=minutes(s.lunchStart),le=minutes(s.lunchEnd);
    if(ls<begin)ls+=1440;if(le<=ls%1440)le+=1440; if(le<ls)le+=1440;
    return {start:at(begin),end:at(finish),lunchStart:at(ls),lunchEnd:at(le)};
  }
  function paidMs(q,s){return q.end-q.start-(s.lunch&&!s.paidLunch?q.lunchEnd-q.lunchStart:0);}
  function elapsed(q,now,s){let x=Math.max(0,Math.min(now-q.start,q.end-q.start));if(s.lunch&&!s.paidLunch)x-=Math.max(0,Math.min(now-q.lunchStart,q.lunchEnd-q.lunchStart));return Math.max(0,x);}
  function validate(s){
    if(!Number.isFinite(s.salary)||s.salary<=0||s.salary>1e9)return '请填写大于 0 的月薪（最高 10 亿元）。';
    for(const k of ['start','end','lunchStart','lunchEnd'])if(!/^([01]\d|2[0-3]):[0-5]\d$/.test(s[k]))return '请完整填写时间。';
    if(s.start===s.end)return '上下班时间不能相同。';
    if(!['double','single','alternate','custom'].includes(s.schedule))return '请选择休息方式。';
    if(!Array.isArray(s.restDays)||s.restDays.some(x=>!Number.isInteger(x)||x<0||x>6)||s.restDays.length===7)return '每周至少保留一个工作日。';
    if(s.schedule==='alternate'&&(!/^\d{4}-\d{2}-\d{2}$/.test(s.anchor)||Number.isNaN(new Date(s.anchor+'T00:00:00').getTime())))return '请选择一个双休周内的日期。';
    const q=shift(new Date(),s);if(s.lunch&&(q.lunchStart<q.start||q.lunchEnd>q.end||q.lunchStart>=q.lunchEnd))return '午休必须位于上班和下班之间。跨夜班的休息时间会自动按次日计算。';
    if(!Number.isFinite(s.coffee)||s.coffee<=0||s.coffee>1e6)return '小目标金额需要大于 0。';
    if(!Number.isInteger(s.payday)||s.payday<1||s.payday>31)return '发薪日需为 1 至 31。';
    return '';
  }
  function snapshot(now,s){
    const today=day(now),yesterday=addDay(today,-1),yq=shift(yesterday,s);
    const activeDate=isWorkday(yesterday,s)&&now>=yq.start&&now<yq.end?yesterday:today;
    const q=shift(activeDate,s),workingDay=isWorkday(activeDate,s),total=paidMs(q,s);
    let status='休息日',code='rest';
    if(workingDay){if(now<q.start){status='还没上班';code='before';}else if(now>=q.end){status='今日已下班';code='done';}else if(s.lunch&&now>=q.lunchStart&&now<q.lunchEnd){status='午休充电中';code='lunch';}else{status='上班中，收入正在增加';code='work';}}
    const month=activeDate.getMonth(),year=activeDate.getFullYear();
    let workdays=0,monthEarnedMs=0;
    for(let d=new Date(year,month,1);d.getMonth()===month;d=addDay(d,1))if(isWorkday(d,s)){workdays++;monthEarnedMs+=elapsed(shift(d,s),now,s);}
    const rate=s.salary/((s.fixedDays?21.75:workdays)*total);
    const done=workingDay?elapsed(q,now,s):0;
    let next=null;for(let i=0;i<16;i++){const d=addDay(today,i),nq=shift(d,s);if(isWorkday(d,s)&&nq.start>now){next=nq.start;break;}}
    let pay=new Date(now.getFullYear(),now.getMonth(),Math.min(s.payday,new Date(now.getFullYear(),now.getMonth()+1,0).getDate()));
    if(day(now)>pay)pay=new Date(now.getFullYear(),now.getMonth()+1,Math.min(s.payday,new Date(now.getFullYear(),now.getMonth()+2,0).getDate()));
    return {status,code,activeDate,q,workdays,total,rate,earned:done*rate,monthEarned:monthEarnedMs*rate,daily:total*rate,progress:workingDay?done/total:0,countdown:(['work','lunch'].includes(code)?q.end:next)-now,next,payDays:Math.round((ordinal(pay)-ordinal(today))),paidRunning:code==='work'||(code==='lunch'&&s.paidLunch)};
  }
  const api={defaults,minutes,day,dateKey,addDay,isWorkday,shift,elapsed,paidMs,validate,snapshot};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.CheerEngine=api;
})(typeof window!=='undefined'?window:globalThis);

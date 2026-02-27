const JUZ_START_PAGE=[1,22,42,62,82,102,122,142,162,182,202,222,242,262,282,302,322,342,362,382,402,422,442,462,482,502,522,542,562,582];
function pageToJuz(page){let juz=1;for(let i=0;i<JUZ_START_PAGE.length;i++){if(page>=JUZ_START_PAGE[i])juz=i+1;}return juz;}
function getJuzRange(startPage,endPage){
  const j1=pageToJuz(startPage),j2=pageToJuz(endPage);
  if(j1===j2)return{text:`الجزء ${j1}`,sub:`صفحات ${startPage}–${endPage} من الجزء`};
  const juzStr=j2-j1===1?`الجزء ${j1} و${j2}`:`الأجزاء ${j1}–${j2}`;
  return{text:juzStr,sub:`صفحات ${startPage}–${endPage}`};
}
function renderQuranPage(){
  const totalPages=604,k=S.khatma;
  const rDay=Math.min(Math.max(S.hijriDay||new Date().getDate(),1),30);
  const dailyPages=Math.ceil((totalPages*k)/30);
  const startPage=(rDay-1)*dailyPages+1;
  const endPage=Math.min(startPage+dailyPages-1,totalPages);
  const done=S.completed.length,rem=Math.max(0,30-done),pct=Math.round((done/30)*100);
  const g=id=>document.getElementById(id);
  if(g("doneDays"))g("doneDays").textContent=done;
  if(g("remDays"))g("remDays").textContent=rem;
  if(g("pctDone"))g("pctDone").textContent=pct+"%";
  if(g("progBar"))g("progBar").style.width=pct+"%";
  const isDone=S.completed.includes(rDay);
  const wc=g("wirdCard");if(!wc)return;
  if(startPage>totalPages){
    wc.innerHTML=`<div class="wird-c"><div class="wird-j">🎉 أتممت الختمة!</div></div><div class="cfoot"><button class="act" disabled>تم إنهاء الختمة</button></div>`;
    renderDays(rDay);return;
  }
  const{text:juzText,sub:juzSub}=getJuzRange(startPage,endPage);
  const cfootHTML=isDone
    ?`<button class="act" disabled style="margin-bottom:8px;opacity:.65;"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 16 4 11"/></svg>✓ تم إنهاء ورد اليوم</button>
       <button onclick="undoToday(${rDay})" style="width:100%;padding:10px;border-radius:var(--r);border:1px solid var(--bd);background:var(--sf2);color:var(--mu);font-size:13px;font-weight:600;cursor:pointer;font-family:var(--font);display:flex;align-items:center;justify-content:center;gap:6px;transition:.2s;" onmouseover="this.style.borderColor='#f87171';this.style.color='#f87171'" onmouseout="this.style.borderColor='var(--bd)';this.style.color='var(--mu)'"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>إعادة الورد</button>`
    :`<button class="act" onclick="finishToday(${rDay})"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 16 4 11"/></svg>تأكيد إتمام الورد</button>`;
  wc.innerHTML=`
    <div class="wird-c">

      <div class="wird-j" style="font-size:22px;margin-bottom:4px;">${juzText}</div>
      <div class="wird-s">${juzSub}</div>
    </div>
    <div style="display:flex;border-top:1px solid var(--bd);border-bottom:1px solid var(--bd);">
      <div style="flex:1;text-align:center;padding:12px 8px;border-left:1px solid var(--bd);">
        <div style="font-size:20px;font-weight:900;color:var(--ac);">${dailyPages}</div>
        <div style="font-size:10px;color:var(--mu);margin-top:2px;">صفحة اليوم</div>
      </div>
      <div style="flex:1;text-align:center;padding:12px 8px;border-left:1px solid var(--bd);">
        <div style="font-size:20px;font-weight:900;color:var(--bl);">${startPage}</div>
        <div style="font-size:10px;color:var(--mu);margin-top:2px;">من صفحة</div>
      </div>
      <div style="flex:1;text-align:center;padding:12px 8px;">
        <div style="font-size:20px;font-weight:900;color:var(--bl);">${endPage}</div>
        <div style="font-size:10px;color:var(--mu);margin-top:2px;">إلى صفحة</div>
      </div>
    </div>
    <div class="cfoot">${cfootHTML}</div>`;
  renderDays(rDay);
}
function finishToday(day){if(!S.completed.includes(day)){S.completed.push(day);LSS("completed",JSON.stringify(S.completed));}renderQuranPage();}
function undoToday(day){S.completed=S.completed.filter(d=>d!==day);LSS("completed",JSON.stringify(S.completed));renderQuranPage();}
function renderDays(today){
  const g=document.getElementById("daysGrid");if(!g)return;g.innerHTML="";
  for(let d=1;d<=30;d++){const dn=S.completed.includes(d),it=d===today;const div=document.createElement("div");div.className="dc"+(dn?" done":"")+(it?" today":"");div.innerHTML=dn?`<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 16 4 11"/></svg>`:String(d);g.appendChild(div);}
}
// ══════════════════════════════════════
function switchMT(t){
  S.mainTab=t;
  document.querySelectorAll("[data-mt]").forEach(b=>b.classList.toggle("active",b.dataset.mt===t));
  document.getElementById("mt-adhkar").style.display=t==="adhkar"?"block":"none";
  document.getElementById("mt-hadith").style.display=t==="hadith"?"block":"none";
  if(t==="hadith")renderHadith();
}
function initAdhkar(){
  const tabs=document.getElementById("dhikrTabs");
  DCATS.forEach(c=>{const b=document.createElement("button");b.className="dtab"+(c.id===S.dcat?" active":"");b.textContent=c.label;b.onclick=()=>switchDcat(c.id);tabs.appendChild(b);});
}
function switchDcat(id){S.dcat=id;document.querySelectorAll(".dtab").forEach((t,i)=>t.classList.toggle("active",DCATS[i].id===id));renderDhikr();}
function renderDhikr(){
  const list=document.getElementById("dhikrList"),items=ADHKAR[S.dcat]||[];
  const dk=new Date().toDateString();
  list.innerHTML=items.map((item,i)=>{
    const key=`${S.dcat}_${dk}_${i}`,cur=S.dcounts[key]||0,done=cur>=item.repeat;
    return`<div class="ditem"><div class="dtext">${item.text}</div><div class="dnote">${item.note}</div><div class="dfoot"><button class="cbtn${done?" done":""}" onclick="countD('${key}',${item.repeat})"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 16 4 11"/></svg><span>${done?"مكتمل":`${cur} / ${item.repeat}`}</span></button><span class="dsrc">${item.repeat>1?item.repeat+" مرة":""}</span></div></div>`;
  }).join("");
}
function countD(key,max){const cur=S.dcounts[key]||0;if(cur>=max)return;S.dcounts[key]=cur+1;LSS("dcounts",JSON.stringify(S.dcounts));renderDhikr();}

function setHadithCount(v){S.hadithCount=parseInt(v);LSS("hadithCount",v);renderHadith();}
function renderHadith(){
  const list=document.getElementById("hadithList");if(!list)return;
  const seed=Math.floor((Date.now()-new Date(new Date().getFullYear(),0,1))/(86400000));
  const indices=[];
  for(let i=0;i<S.hadithCount;i++)indices.push((seed*3+i*7)%AHADITH.length);
  const unique=[...new Set(indices)];
  list.innerHTML=unique.map(idx=>{
    const h=AHADITH[idx];
    return`<div class="hitem"><div class="htitle">${h.title}</div><div class="htext">${h.text}</div><div class="hsrc">${h.src}</div></div>`;
  }).join("");
}

// ══════════════════════════════════════
// EXTRA (QIBLA + TASBIH)
// ══════════════════════════════════════
function switchEV(v){
  S.ev=v;
  document.querySelectorAll("[data-ev]").forEach(b=>b.classList.toggle("active",b.dataset.ev===v));
  document.getElementById("ev-qibla").style.display=v==="qibla"?"block":"none";
  document.getElementById("ev-tasbih").style.display=v==="tasbih"?"block":"none";
}

// QIBLA
function calcQiblaFromCity(){
  if(!S.country||!S.city)return;
  const cdata=COUNTRIES[S.country];if(!cdata)return;
  const coords=cdata.cities[S.city]||[cdata.lat,cdata.lon];
  const[lat,lon]=coords;
  S.qiblaDeg=calcBearing(lat,lon);S.compass={lat,lon};
  renderQibla();
}
function calcBearing(lat,lon){
  const mLat=21.4225*Math.PI/180,mLon=39.8262*Math.PI/180;
  const uLat=lat*Math.PI/180,uLon=lon*Math.PI/180;
  const dLon=mLon-uLon;
  const y=Math.sin(dLon)*Math.cos(mLat);
  const x=Math.cos(uLat)*Math.sin(mLat)-Math.sin(uLat)*Math.cos(mLat)*Math.cos(dLon);
  return((Math.atan2(y,x)*180/Math.PI)+360)%360;
}
function onDeviceOrient(e){
  if(e.alpha===null)return;
  let heading=e.alpha;
  if(e.webkitCompassHeading!==undefined)heading=e.webkitCompassHeading;
  S.deviceOrient=heading;updateCompassNeedle();
}
function updateCompassNeedle(){
  const needle=document.getElementById("compassNeedle");
  if(!needle||S.qiblaDeg===null)return;
  const rotation=(S.qiblaDeg-(S.deviceOrient||0)+360)%360;
  needle.style.transform=`rotate(${rotation}deg)`;
}
function renderQibla(){
  if(S.qiblaDeg===null)return;
  const{lat,lon}=S.compass;
  const rotation=(S.qiblaDeg-(S.deviceOrient||0)+360)%360;
  document.getElementById("qiblaContent").innerHTML=`
    <div class="compass">
      <div class="compass-ring">
        <span class="cn">ش</span><span class="cs">ج</span><span class="ce">غ</span><span class="cw">ش·غ</span>
        <div style="position:absolute;bottom:50%;left:50%;margin-left:-2.5px;transform-origin:bottom center;transform:rotate(${rotation}deg);display:flex;flex-direction:column;" id="compassNeedle">
          <div class="needle-top"></div><div class="needle-bot"></div>
        </div>
        <div class="compass-center"></div>
      </div>
    </div>
    <div class="qibla-deg">${Math.round(S.qiblaDeg)}°</div>
    <div class="qibla-sub">اتجاه القبلة من ${S.city||"موقعك"}</div>
    <div class="qibla-loc">${lat.toFixed(3)}°، ${lon.toFixed(3)}°</div>`;
}

// TASBIH
function initTasbih(){
  const p=document.getElementById("tasbihPresets");
  TSBIHAT.forEach((t,i)=>{
    const b=document.createElement("button");
    b.className="t-pre"+(i===S.tasbih.presetIdx?" active":"");
    b.textContent=t.t;b.onclick=()=>selectTasbih(i);p.appendChild(b);
  });
  updateTasbih();
}
function selectTasbih(i){
  S.tasbih.presetIdx=i;S.tasbih.count=0;S.tasbih.target=TSBIHAT[i].n;
  LSS("tcount","0");
  document.querySelectorAll(".t-pre").forEach((b,idx)=>b.classList.toggle("active",idx===i));
  updateTasbih();
}
function applyCustomTarget(){
  const v=parseInt(document.getElementById("customTarget").value);
  if(!v||v<1)return;
  S.tasbih.target=v;S.tasbih.count=0;LSS("tcount","0");
  // Remove active state from presets
  document.querySelectorAll(".t-pre").forEach(b=>b.classList.remove("active"));
  document.getElementById("tasbihDhikr").textContent="ذكر مخصص";
  updateTasbih();
}
function tapTasbih(){
  S.tasbih.count++;
  LSS("tcount",S.tasbih.count);
  
  const tapBtn = document.getElementById("tasbihBtn");
  
  if(S.tasbih.count === S.tasbih.target){
    if(navigator.vibrate) navigator.vibrate([200, 100, 200]);
    tapBtn.classList.add("reached");
    setTimeout(()=>{
      tapBtn.classList.remove("reached");
      S.tasbih.count=0;
      LSS("tcount","0");
      updateTasbih();
    }, 500);
  } else {
    if(navigator.vibrate) navigator.vibrate(50);
  }
  updateTasbih();
}
function resetTasbih(){S.tasbih.count=0;LSS("tcount","0");updateTasbih();}
function updateTasbih(){
  const t=TSBIHAT[S.tasbih.presetIdx];
  document.getElementById("tasbihCount").textContent=S.tasbih.count;
  document.getElementById("tasbihTarget").textContent=`الهدف: ${S.tasbih.target}`;
}

// ══════════════════════════════════════
// SETTINGS
// ══════════════════════════════════════
function renderSettings(){
  const li=document.getElementById("locInfo");
  if(li)li.textContent=S.country&&S.city?`${S.country} — ${S.city}`:"غير محدد";
  const sc=document.getElementById("sCountry");
  if(sc&&S.country&&sc.value!==S.country){
    sc.value=S.country;fillCities("sCity",S.country);
    setTimeout(()=>{const sc2=document.getElementById("sCity");if(sc2&&S.city)sc2.value=S.city;},50);
  }
  const hs=document.getElementById("hijriSetting");
  if(hs&&S.hijriDay){
    const off=S.hijriOffset!==0?` (${S.hijriOffset>0?"+":""}${S.hijriOffset})`:"";
    hs.textContent=`اليوم ${S.hijriDay} هجري${off}`;
  }
  updateHijriOffsetUI();
  renderColorTemplates();
  updateSummerTimeUI();
}
// ══════════════════════════════════════
function resetAll(){
  if(!confirm("سيتم حذف جميع البيانات. هل أنت متأكد؟"))return;
  localStorage.clear();
  // stop radio
  const ra=document.getElementById("radioAudio");ra.pause();ra.src="";
  S.radio.playing=false;
  const btn=document.getElementById("radioModalPlayBtn");
  const ico=document.getElementById("radioModalPlayIco");
  if(btn) btn.classList.remove("playing");
  if(ico) ico.innerHTML=`<polygon points="5,3 19,12 5,21"/>`;
  document.getElementById("radioModalStatus").textContent="القاهرة - بث مباشر";
  // reset state
  Object.assign(S,{
    country:"",city:"",countryEn:"",khatma:1,completed:[],timings:null,
    dcounts:{},hijriDay:null,manualHijri:false,hijriOffset:0,_lastHijriData:null,
    tasbih:{count:0,presetIdx:0,target:33},
    dcIdx:0,hadithCount:3,qiblaDeg:null,compass:null,
    summerTime:false,accentColor:"amber",
  });
  applyAccentColor("amber",false);
  if(S.ptimer)clearInterval(S.ptimer);
  // reset UI
  ["countrySelect","sCountry"].forEach(id=>sync(id,""));
  fillCities("citySelect","");fillCities("sCity","");
  showEmpty();
  renderHomeDhikr();
  document.getElementById("hijriDisplay").textContent="—";
  document.getElementById("qiblaContent").innerHTML=`<div class="empty"><svg class="ei" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="2" x2="12" y2="4"/><line x1="12" y1="20" x2="12" y2="22"/><line x1="2" y1="12" x2="4" y2="12"/><line x1="20" y1="12" x2="22" y2="12"/></svg><div class="et">اختر الدولة والمدينة أولاً</div><div class="es">لحساب اتجاه القبلة</div></div>`;
  // reset tasbih display
  document.getElementById("tasbihCount").textContent="0";
  document.querySelectorAll(".t-pre").forEach((b,i)=>b.classList.toggle("active",i===0));
  updateTasbih();
  nav("home");
}

// ══════════════════════════════════════
// HIJRI CALENDAR - OFFLINE (no API needed)
// ══════════════════════════════════════

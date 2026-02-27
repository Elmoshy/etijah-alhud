function renderHomeDhikr(){
  const item=HOME_ADHKAR[S.dcIdx];
  const lbl=document.getElementById("dcLabel");
  const txt=document.getElementById("dcText");
  const src=document.getElementById("dcSrc");
  const dots=document.getElementById("dcDots");
  if(lbl) lbl.textContent=item.cat;
  if(txt) txt.textContent=item.text;
  if(src) src.textContent=item.src;
  if(dots) dots.innerHTML=HOME_ADHKAR.map((x,i)=>`<div class="dhikr-dot${i===S.dcIdx?" active":""}"></div>`).join("");
  // sync height of wrapper
  syncWrapHeight();
}
function syncWrapHeight(){
  const wrap=document.getElementById("dhikrCardWrap");
  const front=document.getElementById("dhikrCard");
  if(wrap&&front) wrap.style.height=front.offsetHeight+"px";
}
function loadBackCard(idx){
  const item=HOME_ADHKAR[idx];
  const lbl=document.getElementById("dcLabelBack");
  const txt=document.getElementById("dcTextBack");
  const src=document.getElementById("dcSrcBack");
  if(lbl) lbl.textContent=item.cat;
  if(txt) txt.textContent=item.text;
  if(src) src.textContent=item.src;
}
function dcNext(){S.dcIdx=(S.dcIdx+1)%HOME_ADHKAR.length;renderHomeDhikr();}
function dcPrev(){S.dcIdx=(S.dcIdx-1+HOME_ADHKAR.length)%HOME_ADHKAR.length;renderHomeDhikr();}

// ══ SWIPE LOGIC ══
(function(){
  let startX=0, startY=0, dragging=false, dir=0;
  const THRESHOLD=60;

  function getCards(){
    return {
      front: document.getElementById("dhikrCard"),
      back:  document.getElementById("dhikrCardBack"),
      wrap:  document.getElementById("dhikrCardWrap")
    };
  }

  function onStart(x, y){
    startX=x; startY=y; dragging=false; dir=0;
    const {front,back}=getCards();
    front.classList.remove("dhikr-card-snap");
    back.classList.remove("dhikr-card-snap");
  }

  function onMove(x, y){
    const dx=x-startX, dy=y-startY;
    if(!dragging){
      if(Math.abs(dx)<8&&Math.abs(dy)<8) return;
      if(Math.abs(dy)>Math.abs(dx)){ dir=-1; return; } // vertical scroll, ignore
      dragging=true;
      // سحب يمين = التالي (dir=1)، سحب شمال = السابق (dir=-1)
      dir = dx>0 ? 1 : -1;
      // load back card content
      const nextIdx = dir===1
        ? (S.dcIdx+1)%HOME_ADHKAR.length
        : (S.dcIdx-1+HOME_ADHKAR.length)%HOME_ADHKAR.length;
      loadBackCard(nextIdx);
    }
    if(dir===0) return;
    const {front,back}=getCards();
    const dx2=x-startX;
    const progress=Math.min(Math.abs(dx2)/THRESHOLD,1);
    // front: يتحرك مع الإيد ويصغر
    front.style.transform=`translateX(${dx2}px) scale(${1-progress*0.08})`;
    front.style.opacity=`${1-progress*0.5}`;
    // back: يكبر تدريجياً
    const backScale=0.93+(0.07*progress);
    const backOpacity=0.5+(0.5*progress);
    back.style.transform=`scale(${backScale})`;
    back.style.opacity=`${backOpacity}`;
  }

  function onEnd(x){
    if(!dragging||dir===0) return;
    const dx=x-startX;
    const {front,back}=getCards();
    front.classList.add("dhikr-card-snap");
    back.classList.add("dhikr-card-snap");

    if(Math.abs(dx)>=THRESHOLD){
      // اكتمل السحب - نغير الكارت
      const goDir=dx>0?1:-1;
      // نطير الكارت الأمامي للاتجاه
      front.style.transform=`translateX(${goDir*110}%) scale(0.9)`;
      front.style.opacity="0";
      back.style.transform="scale(1)";
      back.style.opacity="1";
      setTimeout(()=>{
        if(dx>0) dcNext(); else dcPrev();
        // reset
        front.style.transition="none";
        back.style.transition="none";
        front.style.transform="translateX(0) scale(1)";
        front.style.opacity="1";
        back.style.transform="scale(0.93)";
        back.style.opacity="0.5";
        setTimeout(()=>{
          front.classList.remove("dhikr-card-snap");
          back.classList.remove("dhikr-card-snap");
        },20);
      },280);
    } else {
      // رجّع للمكان الأصلي
      front.style.transform="translateX(0) scale(1)";
      front.style.opacity="1";
      back.style.transform="scale(0.93)";
      back.style.opacity="0.5";
    }
    dragging=false; dir=0;
  }

  window.addEventListener("load",()=>{
    const wrap=document.getElementById("dhikrCardWrap");
    if(!wrap) return;
    wrap.addEventListener("touchstart",e=>{
      onStart(e.touches[0].clientX,e.touches[0].clientY);
    },{passive:true});
    wrap.addEventListener("touchmove",e=>{
      onMove(e.touches[0].clientX,e.touches[0].clientY);
    },{passive:true});
    wrap.addEventListener("touchend",e=>{
      onEnd(e.changedTouches[0].clientX);
    },{passive:true});
    // mouse support for desktop testing
    wrap.addEventListener("mousedown",e=>{onStart(e.clientX,e.clientY);});
    window.addEventListener("mousemove",e=>{if(e.buttons===1)onMove(e.clientX,e.clientY);});
    window.addEventListener("mouseup",e=>{onEnd(e.clientX);});
    setTimeout(syncWrapHeight,100);
    window.addEventListener("resize",syncWrapHeight);
  });
})();

// ══════════════════════════════════════
// HIJRI (offset-based)
// ══════════════════════════════════════
function updateHijriUI(hData){
  // Update gregorian display
  const now=new Date();
  const gregEl=document.getElementById("gregDisplay");
  if(gregEl){
    const days=["الأحد","الاثنين","الثلاثاء","الأربعاء","الخميس","الجمعة","السبت"];
    const months=["يناير","فبراير","مارس","أبريل","مايو","يونيو","يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر"];
    gregEl.textContent=days[now.getDay()]+" "+now.getDate()+" "+months[now.getMonth()]+" "+now.getFullYear();
  }
  let day,monthAr,year;
  if(hData){S._lastHijriData=hData;}
  const src=hData||S._lastHijriData;
  if(!src)return;
  day=Math.max(1,Math.min(30,parseInt(src.day)+S.hijriOffset));
  monthAr=src.month.ar;year=src.year;
  S.hijriDay=day;LSS("hijriDay",day);
  const offTag=S.hijriOffset!==0?` (${S.hijriOffset>0?"+":""}${S.hijriOffset})`:"";
  const str=`${day} ${monthAr} ${year} هـ${offTag}`;
  const el=document.getElementById("hijriDisplay");if(el)el.textContent=str;
  const hs=document.getElementById("hijriSetting");if(hs)hs.textContent=str;
  updateHijriOffsetUI();
}
function updateHijriOffsetUI(){
  const el=document.getElementById("hijriOffsetVal");
  if(!el)return;
  el.textContent=S.hijriOffset===0?"تلقائي":(S.hijriOffset>0?`+${S.hijriOffset}`:S.hijriOffset);
  el.style.color=S.hijriOffset===0?"var(--mu)":"var(--ac)";
}
function adjustHijriOffset(delta){
  S.hijriOffset=Math.max(-3,Math.min(3,S.hijriOffset+delta));
  LSS("hijriOffset",S.hijriOffset);
  updateHijriUI();renderQuranPage();
  // Update calendar to reflect new hijri day
  if(S._lastHijriData){
    const newDay=Math.max(1,Math.min(30,parseInt(S._lastHijriData.day)+S.hijriOffset));
    const newMonth=parseInt(S._lastHijriData.month.number);
    const newYear=parseInt(S._lastHijriData.year);
    calState.month=newMonth; calState.year=newYear;
  }
  const calEl=document.getElementById("calendarContent");
  if(calEl&&calState.month) drawCalendar(calState.month,calState.year);
}
function resetHijri(){
  S.hijriOffset=0;LSS("hijriOffset",0);
  if(S.countryEn&&S.city)loadTimings(S.countryEn,S.city);
  else updateHijriUI();
  renderQuranPage();
}

// ══════════════════════════════════════
// COUNTRIES / CITIES
// ══════════════════════════════════════
function fillCountries(id){
  const sel=document.getElementById(id);if(!sel)return;
  sel.innerHTML='<option value="">الدولة</option>';
  Object.keys(COUNTRIES).forEach(ar=>{const o=document.createElement("option");o.value=ar;o.textContent=ar;sel.appendChild(o);});
}
function fillCities(id,ar){
  const sel=document.getElementById(id);if(!sel)return;
  sel.innerHTML='<option value="">المدينة</option>';
  const d=COUNTRIES[ar];if(!d)return;
  Object.keys(d.cities).forEach(c=>{const o=document.createElement("option");o.value=c;o.textContent=c;sel.appendChild(o);});
}
function onCountryChange(){
  const ar=document.getElementById("countrySelect").value;
  S.country=ar;S.countryEn=COUNTRIES[ar]?.en||"";S.city="";S.timings=null;
  LSS("country",ar);LSS("countryEn",S.countryEn);
  S.hijriOffset=0;LSS("hijriOffset",0);
  S._lastHijriData=null; // امسح بيانات الدولة القديمة
  calState.month=null;calState.year=null;
  fillCities("citySelect",ar);sync("sCountry",ar);fillCities("sCity",ar);
  showEmpty();
}
function onCityChange(){
  const c=document.getElementById("citySelect").value;if(!c)return;
  S.city=c;LSS("city",c);sync("sCity",c);
  loadTimings(S.countryEn,c);calcQiblaFromCity();
}
function sOnCountry(){
  const ar=document.getElementById("sCountry").value;
  S.country=ar;S.countryEn=COUNTRIES[ar]?.en||"";S.city="";S.timings=null;
  LSS("country",ar);LSS("countryEn",S.countryEn);
  S.hijriOffset=0;LSS("hijriOffset",0);
  S._lastHijriData=null;
  calState.month=null;calState.year=null;
  fillCities("sCity",ar);sync("countrySelect",ar);fillCities("citySelect",ar);
  showEmpty();renderSettings();
}
function sOnCity(){
  const c=document.getElementById("sCity").value;if(!c)return;
  S.city=c;LSS("city",c);sync("citySelect",c);
  loadTimings(S.countryEn,c);calcQiblaFromCity();renderSettings();
}
function sync(id,val){const el=document.getElementById(id);if(el)el.value=val;}

// ══════════════════════════════════════
// PRAYER TIMES
// ══════════════════════════════════════
function showEmpty(){
  document.getElementById("homeContent").innerHTML=`<div class="empty"><svg class="ei" width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg><div class="et">اختر موقعك أولاً</div><div class="es">سيتم جلب مواقيت الصلاة تلقائياً</div></div>`;
}
function loadTimings(cen,city){
  document.getElementById("homeContent").innerHTML=`<div class="loader"><div class="spin"></div>جارٍ جلب المواقيت...</div>`;
  const m=CALCM[cen]||5;
  const adj=(HIJRI_ADJ[cen]||0)+(S.hijriOffset||0);
  const cdata=COUNTRIES[S.country];
  const coords=cdata&&cdata.cities&&cdata.cities[city]?cdata.cities[city]:[cdata?cdata.lat:30,cdata?cdata.lon:31];
  const lat=coords[0],lon=coords[1];
  const today=new Date();
  const dd=String(today.getDate()).padStart(2,"0");
  const mm2=String(today.getMonth()+1).padStart(2,"0");
  const yyyy=today.getFullYear();
  // adjustment=0 افتراضياً لكن نطبق الـ offset يدوياً في updateHijriUI
  fetch("https://api.aladhan.com/v1/timings/"+dd+"-"+mm2+"-"+yyyy+"?latitude="+lat+"&longitude="+lon+"&method="+m)
    .then(r=>r.json()).then(d=>{
        if(d.code===200&&d.data){
          S.timings=applyTimingsAdjust(d.data.timings);
          const hData=d.data.date.hijri;
          // طبّق تعديل الدولة على التاريخ الهجري
          const countryAdj=HIJRI_ADJ[cen]||0;
          if(countryAdj!==0){
            // عدّل اليوم بناءً على تعديل الدولة
            let adjDay=parseInt(hData.day)+countryAdj;
            // handle month overflow simply
            if(adjDay<1) adjDay=1;
            if(adjDay>30) adjDay=30;
            hData.day=String(adjDay);
          }
          // حدّث calState من بيانات الدولة الجديدة دايماً
          calState.month=parseInt(hData.month.number);
          calState.year=parseInt(hData.year);
          updateHijriUI(hData);
          renderHome();
          startTimer();
          renderQuranPage();
          // حدّث التقويم دايماً لما تيجي بيانات جديدة
          drawCalendar(calState.month,calState.year);
        } else {
          document.getElementById("homeContent").innerHTML='<div class="empty"><div class="et">فشل تحميل المواقيت</div></div>';
        }
    })
    .catch(()=>{document.getElementById("homeContent").innerHTML='<div class="empty"><div class="et">فشل تحميل المواقيت</div></div>';});
}

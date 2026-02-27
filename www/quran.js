function renderHome(){
  if(!S.timings)return;
  const nx=getNext();
  function prCell(p){
    const isN=p===nx.name;
    return `<div class="pr-cell${isN?" next":""}">
      <div class="pr-cell-name">${PR_AR[p]}${isN?`<span class="pr-badge">التالية</span>`:""}</div>
      <div class="pr-cell-time">${fmt12(S.timings[p])}</div>
    </div>`;
  }
  const grid=`
    <div class="pr-grid-row" style="border-bottom:1px solid var(--bd)">
      ${prCell("Fajr")}<div class="pr-grid-sep"></div>${prCell("Dhuhr")}
    </div>
    <div class="pr-grid-row" style="border-bottom:1px solid var(--bd)">
      ${prCell("Asr")}<div class="pr-grid-sep"></div>${prCell("Maghrib")}
    </div>
    <div class="pr-grid-row">
      ${prCell("Isha")}
    </div>`;
  document.getElementById("homeContent").innerHTML=`
    <div class="card" style="margin-bottom:14px"><div class="ph">
      <div class="ph-lbl">الصلاة القادمة</div>
      <div class="ph-name" id="npName">${PR_AR[nx.name]||nx.name}</div>
      <div class="ph-cd" id="npCd">00:00:00</div>
    </div></div>
    <div class="card"><div>${grid}</div></div>`;
}
function getNext(){
  if(!S.timings)return{name:"Fajr",diff:0};
  const now=new Date();
  for(let p of PRAYERS){const[h,m]=S.timings[p].split(":").map(Number);const t=new Date();t.setHours(h,m,0,0);if(t>now)return{name:p,diff:t-now};}
  const[h,m]=S.timings["Fajr"].split(":").map(Number);const tm=new Date();tm.setDate(tm.getDate()+1);tm.setHours(h,m,0,0);return{name:"Fajr",diff:tm-now};
}
function startTimer(){
  if(S.ptimer)clearInterval(S.ptimer);
  S.ptimer=setInterval(()=>{
    if(!S.timings)return;
    const{name,diff}=getNext();
    const h=Math.floor(diff/3600000),mn=Math.floor((diff%3600000)/60000),sc=Math.floor((diff%60000)/1000);
    const cd=document.getElementById("npCd"),nn=document.getElementById("npName");
    if(cd)cd.textContent=`${pad(h)}:${pad(mn)}:${pad(sc)}`;
    if(nn)nn.textContent=PR_AR[name]||name;
  },1000);
}
function fmt12(t){if(!t)return"--:--";const[h,m]=t.split(":").map(Number);return`${h%12||12}:${pad(m)} ${h>=12?"م":"ص"}`;}
function pad(n){return String(n).padStart(2,"0");}

// ══════════════════════════════════════
// QURAN
// ══════════════════════════════════════
function switchQT(t){
  S.qt=t;
  document.querySelectorAll("[data-qt]").forEach(b=>b.classList.toggle("active",b.dataset.qt===t));
  document.getElementById("qt-khatma").style.display=t==="khatma"?"block":"none";
  document.getElementById("qt-browse").style.display=t==="browse"?"block":"none";
  document.getElementById("qt-audio").style.display=t==="audio"?"block":"none";
  if(t==="browse"){renderBmBar();renderQList();}
  if(t==="audio"){renderAudioList();}
}

// ── فتح المصحف الكامل مباشرة من مكان التوقف ──
function openFullMushaf(){
  const lastPage=parseInt(LS("mushafLastPage"))||1;
  const startPage=S.bookmark?getPageOfAyah(S.bookmark.surahNum,S.bookmark.ayahNum):lastPage;
  openMushafPage(startPage,true);
}
function openMushafPage(p,firstOpen){
  p=Math.max(1,Math.min(604,p));
  LSS("mushafLastPage",p);
  S.mushafPage=p;
  setReader(`المصحف — صفحة ${p}`,`جزء ${pageToJuz(p)} · ${p} / 604`,true);
  document.getElementById("ayahWrap").innerHTML=`<div class="loader"><div class="spin"></div>تحميل الصفحة ${p}...</div>`;
  fetch(`https://api.alquran.cloud/v1/page/${p}/quran-uthmani`)
    .then(r=>r.json())
    .then(d=>{
      renderMushafPage(d.data.ayahs||[],p);
      if(firstOpen&&S.bookmark){
        const bmPage=getPageOfAyah(S.bookmark.surahNum,S.bookmark.ayahNum);
        if(bmPage===p)scrollToBookmark(S.bookmark.surahNum,S.bookmark.ayahNum);
      }
    })
    .catch(()=>{document.getElementById("ayahWrap").innerHTML=`<div class="empty"><div class="et">فشل تحميل الصفحة</div></div>`;});
}
function setKhatma(val){
  let k=parseInt(val);if(isNaN(k)||k<1)k=1;if(k>10)k=10;
  S.khatma=k;LSS("khatma",k);
  document.getElementById("khatmaCount").value=k;
  renderQuranPage();
}
// ── BOOKMARK ──
function saveBookmark(surahNum,surahName,ayahNum){
  S.bookmark={surahNum,surahName,ayahNum,ts:Date.now()};
  LSS("bookmark",JSON.stringify(S.bookmark));
  renderBmBar();renderBmReaderBar();
  // إعادة رسم الآيات لتحديث حالة الزر
  if(window._lastAyahs)renderAyahsHTML(window._lastAyahs,window._lastSN,window._lastJN,window._lastPN);
}
function clearBookmark(){
  S.bookmark=null;LSS("bookmark","null");
  renderBmBar();renderBmReaderBar();
  // إذا كنا في وضع المصحف الكامل، أعد رسم الصفحة
  if(S.mushafPage){
    openMushafPage(S.mushafPage,false);
  } else if(window._lastAyahs){
    renderAyahsHTML(window._lastAyahs,window._lastSN,window._lastJN,window._lastPN);
  }
}
function renderBmBar(){
  const el=document.getElementById("bmBar");if(!el)return;
  const lastPage=parseInt(LS("mushafLastPage"))||0;
  let html="";
  if(S.bookmark){
    const bm=S.bookmark;
    const bmPage=getPageOfAyah(bm.surahNum,bm.ayahNum);
    html+=`<div class="bm-bar" onclick="gotoBookmark()" style="margin-bottom:${lastPage&&lastPage!==bmPage?'8px':'0'}">
      <div class="bm-ico"><svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg></div>
      <div class="bm-info"><div class="bm-title">🔖 العلامة المرجعية</div><div class="bm-sub">سورة ${bm.surahName} — آية ${bm.ayahNum} (ص. ${bmPage})</div></div>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--ac)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
    </div>`;
  }
  if(lastPage&&(!S.bookmark||getPageOfAyah(S.bookmark.surahNum,S.bookmark.ayahNum)!==lastPage)){
    html+=`<div class="bm-bar" onclick="openMushafPage(${lastPage},false)" style="background:var(--sf2);border:1px solid var(--bd);">
      <div class="bm-ico" style="background:var(--bld);border-color:rgba(96,165,250,.2);color:var(--bl);"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg></div>
      <div class="bm-info"><div class="bm-title" style="color:var(--bl);">📖 استكمل قراءتك</div><div class="bm-sub">آخر صفحة: ${lastPage} — جزء ${pageToJuz(lastPage)}</div></div>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--bl)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
    </div>`;
  }
  el.style.display=html?"block":"none";
  el.innerHTML=html;
}
function renderBmReaderBar(){
  const el=document.getElementById("bmReaderBar");if(!el)return;
  if(!S.bookmark){el.style.display="none";return;}
  const bm=S.bookmark;
  const bmPage=getPageOfAyah(bm.surahNum,bm.ayahNum);
  el.style.display="block";
  el.innerHTML=`<div style="display:flex;align-items:center;gap:8px;background:var(--acd2);border:1px solid rgba(245,158,11,.2);border-radius:var(--r);padding:8px 12px;margin-bottom:6px;">
    <svg width="13" height="13" viewBox="0 0 24 24" fill="var(--ac)"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
    <span style="flex:1;font-size:12px;color:var(--ac);font-weight:600;">🔖 علامتك: ${bm.surahName} — آية ${bm.ayahNum} (ص. ${bmPage})</span>
    <button onclick="clearBookmark()" style="border:none;background:none;color:var(--mu);cursor:pointer;font-size:11px;padding:2px 6px;border-radius:5px;" onmouseover="this.style.color='#f87171'" onmouseout="this.style.color='var(--mu)'">✕ حذف</button>
  </div>`;
}
function gotoBookmark(){
  if(!S.bookmark)return;
  const bmPage=getPageOfAyah(S.bookmark.surahNum,S.bookmark.ayahNum);
  openMushafPage(bmPage,true);
}
function scrollToBookmark(surahNum,ayahNum){
  setTimeout(()=>{
    const t=document.getElementById(`ayah-${surahNum}-${ayahNum}`);
    if(t)t.scrollIntoView({behavior:"smooth",block:"center"});
  },400);
}
// ── LIST ──
// ══════════════════════════════════════
// المصحف المسموع - المنشاوي
// ══════════════════════════════════════
// archive.org identifier: alminshawi-radio-128kb-high-quality
// File format: 001.mp3 to 114.mp3 (padded 3 digits)
let audioState={surahIdx:null,playing:false};
function getMinshawURL(n){
  // الملفات على archive.org بصيغة 001.mp3 الخ
  const id="alminshawi-radio-128kb-high-quality";
  const num=String(n).padStart(3,"0");
  return`https://archive.org/download/${id}/${num}.mp3`;
}
function renderAudioList(){
  const q=(document.getElementById("audioSearch")||{}).value||"";
  const list=document.getElementById("audioSurahList");if(!list)return;
  const filtered=SURAHS.filter(s=>!q||s.ar.includes(q)||String(s.n).includes(q));
  list.innerHTML=filtered.map(s=>{
    const isPlaying=audioState.surahIdx===s.n&&audioState.playing;
    return`<div class="si" onclick="playAudioSurah(${s.n},'${s.ar}')" style="${audioState.surahIdx===s.n?"border-color:var(--ac);background:var(--acd2);":""}">
      <div class="si-l">
        <div class="sin">${s.n}</div>
        <div><div class="sn">${s.ar}</div><div class="ss">${s.type} · ${s.ayahs} آية</div></div>
      </div>
      <div style="color:${audioState.surahIdx===s.n?"var(--ac)":"var(--mu)"};">
        ${isPlaying
          ?`<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="none"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>`
          :`<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="5,3 19,12 5,21"/></svg>`
        }
      </div>
    </div>`;
  }).join("");
}
function playAudioSurah(n,name){
  const au=document.getElementById("quranAudio");
  const player=document.getElementById("audioPlayer");
  const nameEl=document.getElementById("audioSurahName");
  const ico=document.getElementById("audioPlayIco");
  audioState.surahIdx=n;
  audioState.playing=true;
  au.src=getMinshawURL(n);
  au.load();
  au.play().catch(()=>{});
  player.style.display="block";
  if(nameEl)nameEl.textContent="سورة "+name;
  if(ico)ico.innerHTML=`<rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>`;
  document.getElementById("audioPlayBtn").style.background="var(--ac)";
  // scroll to top
  player.scrollIntoView({behavior:"smooth",block:"nearest"});
  renderAudioList();
  au.onended=()=>{
    // auto play next
    if(n<114){playAudioSurah(n+1,SURAHS[n].ar);}
    else{closeAudioPlayer();}
  };
}
function toggleAudioPlayer(){
  const au=document.getElementById("quranAudio");
  const ico=document.getElementById("audioPlayIco");
  if(audioState.playing){
    au.pause();audioState.playing=false;
    if(ico)ico.innerHTML=`<polygon points="5,3 19,12 5,21"/>`;
  } else {
    au.play().catch(()=>{});audioState.playing=true;
    if(ico)ico.innerHTML=`<rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>`;
  }
  renderAudioList();
}
function closeAudioPlayer(){
  const au=document.getElementById("quranAudio");
  au.pause();au.src="";
  audioState={surahIdx:null,playing:false};
  document.getElementById("audioPlayer").style.display="none";
  renderAudioList();
}

function switchQV(v){
  S.qv=v;
  document.querySelectorAll("[data-qv]").forEach(b=>b.classList.toggle("active",b.dataset.qv===v));
  renderQList();
}
function renderQList(){
  const a=document.getElementById("qListArea");if(!a)return;
  if(S.qv==="surahs"){
    a.innerHTML=`<div class="slist">${SURAHS.map(s=>{
      const isBm=S.bookmark&&S.bookmark.surahNum===s.n;
      return`<div class="si${isBm?" today-j":""}" onclick="openSurah(${s.n}${isBm?`,${S.bookmark.ayahNum}`:""})">
        <div class="si-l"><div class="sin">${s.n}</div><div><div class="sn">${s.ar}</div><div class="ss">${s.type} · ${s.ayahs} آية · جزء ${s.juz}</div></div></div>
        <div class="si-r">${isBm?`<span style="font-size:11px;color:var(--ac);font-weight:700;">🔖</span>`:""}</div>
      </div>`;
    }).join("")}</div>`;
  } else if(S.qv==="juzs"){
    a.innerHTML=`<div class="slist">${JUZS.map(j=>`<div class="ji" onclick="openJuz(${j.n})"><div><div class="jn">الجزء ${j.n}</div><div class="jsb">${j.start}</div></div></div>`).join("")}</div>`;
  } else {
    // المصحف صفحة صفحة
    let html='<div class="slist">';
    const bmPage=S.bookmark?getPageOfAyah(S.bookmark.surahNum,S.bookmark.ayahNum):null;
    for(let p=1;p<=604;p++){
      const juz=pageToJuz(p);
      const isBm=bmPage===p;
      html+=`<div class="ji${isBm?" today-j":""}" onclick="openPage(${p})">
        <div><div class="jn">صفحة ${p}</div><div class="jsb">جزء ${juz}${isBm?" · 🔖 علامتك":""}</div></div>
        ${isBm?`<span class="jbadge">استكمل</span>`:""}
      </div>`;
    }
    html+='</div>';
    a.innerHTML=html;
  }
}
function getPageOfAyah(surahNum,ayahNum){
  const SURAH_PAGE=[1,2,50,77,106,128,151,177,187,208,221,235,249,255,261,267,282,293,305,312,322,332,342,350,359,367,377,385,396,404,411,415,418,428,434,440,446,453,458,467,477,483,489,496,499,503,507,510,513,515,518,520,523,526,528,531,534,537,539,542,545,549,551,553,554,556,558,560,562,564,566,568,570,572,574,575,577,578,580,582,583,584,585,586,587,587,588,589,590,591,591,592,592,593,594,594,595,595,596,596,597,597,597,598,598,599,599,599,600,600,601,601,601,602];
  const sp=SURAH_PAGE[surahNum-1]||1;
  const s=SURAHS[surahNum-1];
  return Math.min(604,sp+Math.floor(ayahNum/15));
}
// ── OPEN ──
function openSurah(n,scrollToAyah){
  const s=SURAHS[n-1];
  setReader(s.ar,`${s.type} · ${s.ayahs} آية · جزء ${s.juz}`);
  document.getElementById("ayahWrap").innerHTML=`<div class="loader"><div class="spin"></div>تحميل السورة...</div>`;
  fetch(`https://api.alquran.cloud/v1/surah/${n}/quran-uthmani`)
    .then(r=>r.json()).then(d=>{
      renderAyahsHTML(d.data.ayahs,n,null,null);
      if(scrollToAyah)scrollToBookmark(n,scrollToAyah);
    })
    .catch(()=>{document.getElementById("ayahWrap").innerHTML=`<div class="empty"><div class="et">فشل التحميل</div></div>`;});
}
function openJuz(n){
  setReader(`الجزء ${n}`,JUZS[n-1].start);
  document.getElementById("ayahWrap").innerHTML=`<div class="loader"><div class="spin"></div>تحميل الجزء...</div>`;
  fetch(`https://api.alquran.cloud/v1/juz/${n}/quran-uthmani`)
    .then(r=>r.json()).then(d=>renderAyahsHTML(d.data.ayahs,null,n,null))
    .catch(()=>{document.getElementById("ayahWrap").innerHTML=`<div class="empty"><div class="et">فشل التحميل</div></div>`;});
}
function openPage(p){
  openMushafPage(p,false);
}
function renderMushafPage(ayahs,pageNum){
  window._lastAyahs=ayahs;window._lastSN=null;window._lastJN=null;window._lastPN=pageNum;
  // تحديث عنوان الريدر
  document.getElementById("rdrTitle").textContent=`المصحف — صفحة ${pageNum}`;
  document.getElementById("rdrSub").textContent=`جزء ${pageToJuz(pageNum)} · ${pageNum} / 604`;
  let html="",lastSurah=null;
  ayahs.forEach(a=>{
    const surahN=a.surah?a.surah.number:null;
    const surahNameAr=a.surah?a.surah.name:"";
    if(surahN!==lastSurah){
      if(a.numberInSurah===1&&surahN!==1&&surahN!==9){
        html+=`<div class="surah-hdr">— ${surahNameAr} —</div>`;
        html+=`<div class="page-block"><div class="bismillah">بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ</div></div>`;
      } else {
        html+=`<div class="surah-hdr">— ${surahNameAr} —</div>`;
      }
      lastSurah=surahN;
    }
    const isBm=S.bookmark&&S.bookmark.surahNum===surahN&&S.bookmark.ayahNum===a.numberInSurah;
    const snameEsc=(surahNameAr||"").replace(/'/g,"\\'");
    html+=`<div class="ayah-row" id="ayah-${surahN}-${a.numberInSurah}" style="${isBm?"background:var(--acd2);border-radius:10px;padding:6px 4px;margin:2px 0;":""}">
      <button class="ayah-bm-btn${isBm?" marked":""}" onclick="saveBookmarkMushaf(${surahN},'${snameEsc}',${a.numberInSurah},${pageNum})" title="ضع علامة هنا">
        <svg width="11" height="11" viewBox="0 0 24 24" fill="${isBm?"currentColor":"none"}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
      </button>
      <div class="ayah-text" style="font-size:${S.fs}px">${a.text} <span class="anum">${a.numberInSurah}</span></div>
    </div>`;
  });
  // أزرار التنقل + شريط المعلومات
  const juz=pageToJuz(pageNum);
  html=`
    <div style="display:flex;align-items:center;justify-content:space-between;padding:10px 4px 14px;border-bottom:1px solid var(--bd);margin-bottom:10px;">
      <div style="font-size:12px;color:var(--mu);">جزء ${juz}</div>
      <div style="font-size:13px;font-weight:700;color:var(--ac);">صفحة ${pageNum}</div>
      <div style="font-size:12px;color:var(--mu);">${pageNum} / 604</div>
    </div>
    ${html}
    <div style="display:flex;gap:10px;padding:16px 0 8px;">
      ${pageNum>1?`<button onclick="openMushafPage(${pageNum-1},false)" class="act" style="flex:1;background:var(--sf2);color:var(--tx);border:1px solid var(--bd);gap:6px;"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>صفحة ${pageNum-1}</button>`:""}
      ${pageNum<604?`<button onclick="openMushafPage(${pageNum+1},false)" class="act" style="flex:1;gap:6px;">صفحة ${pageNum+1}<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg></button>`:""}
    </div>`;
  document.getElementById("ayahWrap").innerHTML=`<div style="padding:10px 14px;">${html}</div>`;
}
function saveBookmarkMushaf(surahNum,surahName,ayahNum,pageNum){
  saveBookmark(surahNum,surahName,ayahNum);
  // أعد رسم الصفحة لتحديث حالة الأزرار
  openMushafPage(pageNum,false);
}
function setReader(title,sub,isMushaf){
  document.getElementById("rdrTitle").textContent=title;
  document.getElementById("rdrSub").textContent=sub;
  document.getElementById("qp-main").style.display="none";
  document.getElementById("qp-reader").style.display="block";
  const jb=document.getElementById("mushafJumpBox");
  if(jb)jb.style.display=isMushaf?"flex":"none";
  renderBmReaderBar();
}
function jumpToMushafPage(){
  const v=parseInt(document.getElementById("mushafJumpInput").value);
  if(!v||v<1||v>604)return;
  document.getElementById("mushafJumpInput").value="";
  openMushafPage(v,false);
}
// ── RENDER ──
function renderAyahsHTML(ayahs,sn,jn,pageNum){
  window._lastAyahs=ayahs;window._lastSN=sn;window._lastJN=jn;window._lastPN=pageNum;
  let html="",lastSurah=null;
  if(sn&&sn!==1&&sn!==9)html+=`<div class="page-block"><div class="bismillah">بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ</div></div>`;
  ayahs.forEach(a=>{
    const surahN=a.surah?a.surah.number:sn;
    const surahNameAr=a.surah?a.surah.name:(SURAHS[sn-1]?.ar||"");
    if((jn||pageNum)&&surahN!==lastSurah){
      html+=`<div class="surah-hdr">— ${surahNameAr} —</div>`;
      if(a.numberInSurah===1&&surahN!==1&&surahN!==9)html+=`<div class="page-block"><div class="bismillah">بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ</div></div>`;
      lastSurah=surahN;
    }
    const isBm=S.bookmark&&S.bookmark.surahNum===surahN&&S.bookmark.ayahNum===a.numberInSurah;
    // escape quote في اسم السورة
    const snameEsc=(surahNameAr||"").replace(/'/g,"\\'");
    html+=`<div class="ayah-row" id="ayah-${surahN}-${a.numberInSurah}" style="${isBm?"background:var(--acd2);border-radius:10px;padding:6px 4px;margin:2px 0;":""}">
      <button class="ayah-bm-btn${isBm?" marked":""}" onclick="saveBookmark(${surahN},'${snameEsc}',${a.numberInSurah})" title="ضع علامة هنا">
        <svg width="11" height="11" viewBox="0 0 24 24" fill="${isBm?"currentColor":"none"}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
      </button>
      <div class="ayah-text" style="font-size:${S.fs}px">${a.text} <span class="anum">${a.numberInSurah}</span></div>
    </div>`;
  });
  if(pageNum){
    html+=`<div class="page-foot" style="margin:16px 0 8px;text-align:center;">— صفحة ${pageNum} —</div>
    <div style="display:flex;gap:10px;padding-bottom:16px;">
      ${pageNum>1?`<button onclick="openPage(${pageNum-1})" class="act" style="flex:1;background:var(--sf2);color:var(--tx);border:1px solid var(--bd);gap:6px;"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>صفحة ${pageNum-1}</button>`:""}
      ${pageNum<604?`<button onclick="openPage(${pageNum+1})" class="act" style="flex:1;gap:6px;">صفحة ${pageNum+1}<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg></button>`:""}
    </div>`;
  }
  document.getElementById("ayahWrap").innerHTML=`<div style="padding:10px 14px;">${html}</div>`;
  if(jn&&S.bookmark)scrollToBookmark(S.bookmark.surahNum,S.bookmark.ayahNum);
}
function closeReader(){
  S.mushafPage=null;
  document.getElementById("qp-reader").style.display="none";
  document.getElementById("qp-main").style.display="block";
  renderBmBar();
}
function chFS(d){S.fs=Math.min(Math.max(S.fs+d,16),40);LSS("fs",S.fs);document.querySelectorAll(".ayah-text").forEach(el=>el.style.fontSize=S.fs+"px");}

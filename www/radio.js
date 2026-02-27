function openRadioModal() {
  document.getElementById("radioModalOverlay").classList.add("active");
}
function closeRadioModal() {
  document.getElementById("radioModalOverlay").classList.remove("active");
}
function togglePlay(){
  const a=document.getElementById("radioAudio");
  const btn=document.getElementById("radioModalPlayBtn");
  const ico=document.getElementById("radioModalPlayIco");
  const st=document.getElementById("radioModalStatus");
  const fab=document.getElementById("radioFab");
  if(!S.radio.playing){
    if(!a.src||a.src==="about:blank"||a.src===""){a.src=RADIO_URL;}
    a.play().catch(()=>{st.textContent="تعذّر التشغيل";});
    S.radio.playing=true;
    btn.classList.add("playing");
    if(fab)fab.classList.add("playing");
    ico.innerHTML=`<rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>`;
    st.textContent="يُبث الآن ▶";
  } else {
    a.pause();
    S.radio.playing=false;
    btn.classList.remove("playing");
    if(fab)fab.classList.remove("playing");
    ico.innerHTML=`<polygon points="5,3 19,12 5,21"/>`;
    st.textContent="متوقف";
  }
}

// ══════════════════════════════════════
// NAV
// ══════════════════════════════════════
function nav(page){
  document.querySelectorAll(".page").forEach(p=>p.classList.remove("active"));
  document.querySelectorAll(".ni").forEach(b=>b.classList.remove("active"));
  document.getElementById("page-"+page).classList.add("active");
  document.getElementById("nav-"+page).classList.add("active");
  if(page==="quran")renderQuranPage();
  if(page==="settings")renderSettings();
  if(page==="adhkar")renderDhikr();
  if(page==="calendar")renderHijriCalendar();
}

// ══════════════════════════════════════
// HOME DHIKR
// ══════════════════════════════════════

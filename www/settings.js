const LS=k=>localStorage.getItem(k);
const LSS=(k,v)=>localStorage.setItem(k,v);
let S={
  theme:LS("theme")||"dark",
  country:LS("country")||"",city:LS("city")||"",countryEn:LS("countryEn")||"",
  khatma:parseInt(LS("khatma"))||1,
  completed:JSON.parse(LS("completed")||"[]"),
  hijriDay:LS("hijriDay")?parseInt(LS("hijriDay")):null,
  hijriOffset:parseInt(LS("hijriOffset"))||0,
  manualHijri:false,
  bookmark:JSON.parse(LS("bookmark")||"null"),
  dcounts:JSON.parse(LS("dcounts")||"{}"),
  dcat:"morning",mainTab:"adhkar",
  timings:null,ptimer:null,
  qv:"surahs",qt:"khatma",ev:"qibla",
  fs:parseInt(LS("fs"))||24,
  radio:{playing:false},
  summerTime:LS("summerTime")==="true",
  accentColor:LS("accentColor")||"amber",
  tasbih:{count:parseInt(LS("tcount"))||0,presetIdx:0,target:33},
  dcIdx:0,
  hadithCount:parseInt(LS("hadithCount"))||3,
  compass:null,deviceOrient:null,qiblaDeg:null,
  mushafPage:null,
};

// ══════════════════════════════════════
// INIT
// ══════════════════════════════════════
// ══════════════════════════════════════
// COLOR TEMPLATES
// ══════════════════════════════════════
const COLOR_TEMPLATES={
  amber:{name:"ذهبي",ac:"#f59e0b",acd:"rgba(245,158,11,.14)",acd2:"rgba(245,158,11,.07)"},
  green:{name:"أخضر",ac:"#22c55e",acd:"rgba(34,197,94,.14)",acd2:"rgba(34,197,94,.07)"},
  mint:{name:"مينت",ac:"#10d9a0",acd:"rgba(16,217,160,.14)",acd2:"rgba(16,217,160,.07)"},
  blue:{name:"أزرق",ac:"#3b82f6",acd:"rgba(59,130,246,.14)",acd2:"rgba(59,130,246,.07)"},
  purple:{name:"بنفسجي",ac:"#a855f7",acd:"rgba(168,85,247,.14)",acd2:"rgba(168,85,247,.07)"},
  pink:{name:"وردي",ac:"#ec4899",acd:"rgba(236,72,153,.14)",acd2:"rgba(236,72,153,.07)"},
  red:{name:"أحمر",ac:"#ef4444",acd:"rgba(239,68,68,.14)",acd2:"rgba(239,68,68,.07)"},
  teal:{name:"فيروزي",ac:"#14b8a6",acd:"rgba(20,184,166,.14)",acd2:"rgba(20,184,166,.07)"},
  orange:{name:"برتقالي",ac:"#f97316",acd:"rgba(249,115,22,.14)",acd2:"rgba(249,115,22,.07)"},
  sky:{name:"سماوي",ac:"#0ea5e9",acd:"rgba(14,165,233,.14)",acd2:"rgba(14,165,233,.07)"},
};
function applyAccentColor(key,save=true){
  const c=COLOR_TEMPLATES[key];if(!c)return;
  S.accentColor=key;
  const r=document.documentElement.style;
  r.setProperty("--ac",c.ac);
  r.setProperty("--acd",c.acd);
  r.setProperty("--acd2",c.acd2);
  if(save)LSS("accentColor",key);
  renderColorTemplates();
}
function renderColorTemplates(){
  const wrap=document.getElementById("colorTemplates");if(!wrap)return;
  wrap.innerHTML=Object.entries(COLOR_TEMPLATES).map(([k,c])=>`
    <div onclick="applyAccentColor('${k}')" title="${c.name}" style="cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:5px;">
      <div style="width:36px;height:36px;border-radius:50%;background:${c.ac};border:3px solid ${S.accentColor===k?c.ac:"var(--bd)"};outline:${S.accentColor===k?"3px solid var(--sf)":"none"};outline-offset:${S.accentColor===k?"-5px":"0"};transition:.2s;box-shadow:${S.accentColor===k?"0 0 0 2px "+c.ac:"none"};"></div>
      <div style="font-size:10px;color:${S.accentColor===k?"var(--ac)":"var(--mu)"};">${c.name}</div>
    </div>
  `).join("");
}

// ══════════════════════════════════════
// SUMMER TIME
// ══════════════════════════════════════
function setSummerTime(val){
  S.summerTime=val;
  LSS("summerTime",val?"true":"false");
  updateSummerTimeUI();
  if(S.countryEn&&S.city)loadTimings(S.countryEn,S.city);
}
function updateSummerTimeUI(){
  const on=document.getElementById("summerOnTgl"),off=document.getElementById("summerOffTgl");
  if(on){on.classList.toggle("active",S.summerTime);off.classList.toggle("active",!S.summerTime);}
  const sub=document.getElementById("summerTimeSub");
  if(sub)sub.textContent=S.summerTime?"مفعّل — المواقيت +١ ساعة":"يزيد ساعة على جميع المواقيت";
}
function applyTimingsAdjust(timings){
  if(!S.summerTime)return timings;
  const adj={};
  for(const k of Object.keys(timings)){
    const parts=timings[k].split(":");
    if(parts.length<2){adj[k]=timings[k];continue;}
    let h=parseInt(parts[0]),m=parseInt(parts[1]);
    h=(h+1)%24;
    adj[k]=pad(h)+":"+pad(m)+(parts[2]?":"+parts[2]:"");
  }
  return adj;
}

window.onload=()=>{
  applyTheme(S.theme,false);
  applyAccentColor(S.accentColor,false);
  updateSummerTimeUI();
  fillCountries("countrySelect");fillCountries("sCountry");
  initAdhkar();initTasbih();
  renderHomeDhikr();
  document.getElementById("khatmaCount").value = S.khatma;


  
  if(S.country&&S.city){
    document.getElementById("countrySelect").value=S.country;
    document.getElementById("sCountry").value=S.country;
    fillCities("citySelect",S.country);fillCities("sCity",S.country);
    setTimeout(()=>{
      document.getElementById("citySelect").value=S.city;
      document.getElementById("sCity").value=S.city;
      loadTimings(S.countryEn,S.city);
      calcQiblaFromCity();
    },60);
  }
  if(window.DeviceOrientationEvent)window.addEventListener("deviceorientation",onDeviceOrient,true);
};

// ══════════════════════════════════════
// THEME
// ══════════════════════════════════════
function applyTheme(t,re=true){
  S.theme=t;document.body.className=t;LSS("theme",t);
  const sunP=`<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>`;
  const moonP=`<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9z"/>`;
  document.getElementById("themeIco").innerHTML=t==="dark"?sunP:moonP;
  const d=document.getElementById("darkTgl"),l=document.getElementById("lightTgl");
  if(d){d.classList.toggle("active",t==="dark");l.classList.toggle("active",t==="light");}
}
function toggleTheme(){applyTheme(S.theme==="dark"?"light":"dark");}

// ══════════════════════════════════════
// RADIO MODAL
// ══════════════════════════════════════

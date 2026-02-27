const HIJRI_MONTHS = ["محرم","صفر","ربيع الأول","ربيع الآخر","جمادى الأولى","جمادى الآخرة","رجب","شعبان","رمضان","شوال","ذو القعدة","ذو الحجة"];
const HIJRI_EVENTS = {
  "1-1":["رأس السنة الهجرية"],
  "1-10":["يوم عاشوراء"],
  "3-12":["المولد النبوي الشريف"],
  "7-27":["ليلة الإسراء والمعراج"],
  "8-15":["ليلة النصف من شعبان"],
  "9-1":["أول رمضان"],
  "9-27":["ليلة القدر المرتقبة"],
  "10-1":["عيد الفطر المبارك"],
  "12-9":["يوم عرفة"],
  "12-10":["عيد الأضحى المبارك"],
  "12-11":["أيام التشريق"],
  "12-12":["أيام التشريق"],
  "12-13":["أيام التشريق"]
};
const DAY_NAMES_AR = ["الأحد","الاثنين","الثلاثاء","الأربعاء","الخميس","الجمعة","السبت"];

let calState = {month: null, year: null};

// Convert Gregorian to Hijri offline using Umm Al-Qura algorithm
function gregToHijri(gYear, gMonth, gDay) {
  // Julian Day Number
  const a = Math.floor((14 - gMonth) / 12);
  const y = gYear + 4800 - a;
  const m = gMonth + 12 * a - 3;
  let jdn = gDay + Math.floor((153*m+2)/5) + 365*y + Math.floor(y/4) - Math.floor(y/100) + Math.floor(y/400) - 32045;
  // Hijri
  const z = jdn - 1948438 + 10632;
  const n = Math.floor((z - 1) / 10631);
  const zz = z - 10631*n + 354;
  const j = Math.floor((10985 - zz) / 5316) * Math.floor((50*zz) / 17719) + Math.floor(zz / 5670) * Math.floor((43*zz) / 15238);
  const zzz = zz - Math.floor((30-j) / 15) * Math.floor((17719*j) / 50) - Math.floor(j / 16) * Math.floor((15238*j) / 43) + 29;
  const hYear = 30*n + j - 30;
  const hMonth = Math.ceil(zzz / 29.5);
  const hDay = zzz - Math.floor(29.5 * (hMonth-1));
  return {year: hYear, month: Math.min(hMonth, 12), day: Math.max(1, hDay)};
}

function hijriMonthLength(hYear, hMonth) {
  // Check length: convert 1st of next month back
  const nextMonth = hMonth === 12 ? 1 : hMonth + 1;
  const nextYear = hMonth === 12 ? hYear + 1 : hYear;
  // Use 29 or 30 based on standard pattern
  // Odd months=30 days, Even months=29 days, except month 12 in leap year=30
  const isLeap = ((hYear * 11) + 14) % 30 < 11;
  if (hMonth === 12) return isLeap ? 30 : 29;
  return hMonth % 2 === 1 ? 30 : 29;
}

function hijriToGreg(hYear, hMonth, hDay) {
  // Approximate conversion
  const n = Math.floor((hYear - 1) / 30);
  const r = (hYear - 1) % 30;
  const jdn = 1948438 - 385 + n * 10631 + Math.floor((r * 10631 + 14) / 30) +
    Math.floor((hMonth - 1) * 29.5 + 0.5) + hDay;
  // JDN to Gregorian
  const a = jdn + 32044;
  const b = Math.floor((4*a+3)/146097);
  const c = a - Math.floor(146097*b/4);
  const d = Math.floor((4*c+3)/1461);
  const e = c - Math.floor(1461*d/4);
  const m = Math.floor((5*e+2)/153);
  const day = e - Math.floor((153*m+2)/5) + 1;
  const month = m + 3 - 12*Math.floor(m/10);
  const year = 100*b + d - 4800 + Math.floor(m/10);
  return {year, month, day};
}

function renderHijriCalendar(){
  const el = document.getElementById("calendarContent");
  if(!el) return;
  if(!calState.month){
    if(S._lastHijriData){
      // استخدم التاريخ القادم من API الدولة المختارة
      calState.month = parseInt(S._lastHijriData.month.number);
      calState.year = parseInt(S._lastHijriData.year);
    } else if(S.country&&S.city){
      // لو عنده دولة ومدينة بس لسه ما جابش التاريخ، اجلبه
      el.innerHTML = '<div class="loader"><div class="spin"></div>جارٍ تحميل...</div>';
      loadTimings(S.countryEn,S.city);
      return;
    } else {
      // fallback offline
      const t = new Date();
      const h = gregToHijri(t.getFullYear(), t.getMonth()+1, t.getDate());
      calState.month = h.month;
      calState.year = h.year;
    }
  }
  drawCalendar(calState.month, calState.year);
}

function drawCalendar(hMonth, hYear){
  const el = document.getElementById("calendarContent");
  if(!el) return;

  // Current hijri today - من API الدولة المختارة دايماً
  let todayH = null;
  if(S._lastHijriData){
    // اليوم بالتعديل (offset + country adj)
    const rawDay = parseInt(S._lastHijriData.day) + S.hijriOffset;
    todayH = {
      year: parseInt(S._lastHijriData.year),
      month: parseInt(S._lastHijriData.month.number),
      day: Math.max(1,Math.min(30,rawDay))
    };
  } else {
    const t = new Date();
    todayH = gregToHijri(t.getFullYear(), t.getMonth()+1, t.getDate());
  }

  const monthLen = hijriMonthLength(hYear, hMonth);
  // Get gregorian date of 1st day of this hijri month
  const firstGreg = hijriToGreg(hYear, hMonth, 1);
  const firstDate = new Date(firstGreg.year, firstGreg.month-1, firstGreg.day);
  const startDow = firstDate.getDay(); // 0=Sun

  // Pills
  let pillsHTML = HIJRI_MONTHS.map((mn,i)=>{
    const m=i+1;
    return '<button class="cal-month-pill'+(m===hMonth?" active":"")+'" onclick="calGoMonth('+m+','+hYear+')">'+mn+'</button>';
  }).join("");

  // Header
  const prevM = hMonth===1?12:hMonth-1, prevY = hMonth===1?hYear-1:hYear;
  const nextM = hMonth===12?1:hMonth+1, nextY = hMonth===12?hYear+1:hYear;
  let headerHTML = '<div class="cal-header">'+
    '<button class="cal-nav-btn" onclick="calGoMonth('+prevM+','+prevY+')" title="السابق">&#8249;</button>'+
    '<div style="text-align:center"><div class="cal-title">'+HIJRI_MONTHS[hMonth-1]+'</div><div class="cal-sub">'+hYear+' هـ</div></div>'+
    '<button class="cal-nav-btn" onclick="calGoMonth('+nextM+','+nextY+')" title="التالي">&#8250;</button>'+
    '</div>';

  // Day names
  const DAY_NAMES_AR = ["الأحد","الاثنين","الثلاثاء","الأربعاء","الخميس","الجمعة","السبت"];
  let dayNamesHTML = '<div class="cal-grid-header">'+DAY_NAMES_AR.map(d=>'<div class="cal-day-name">'+d+'</div>').join("")+'</div>';

  // Cells
  let cells = "";
  for(let i=0;i<startDow;i++) cells += '<div class="cal-cell empty"></div>';

  for(let hDay=1; hDay<=monthLen; hDay++){
    const gDate = hijriToGreg(hYear, hMonth, hDay);
    const dateObj = new Date(gDate.year, gDate.month-1, gDate.day);
    const dow = dateObj.getDay();
    const isFri = dow===5;
    const isToday = todayH && hDay===todayH.day && hMonth===todayH.month && hYear===todayH.year;
    const eventKey = hMonth+"-"+hDay;
    const hasEvent = !!HIJRI_EVENTS[eventKey];
    cells += '<div class="cal-cell'+(isFri?" friday":"")+(isToday?" today":"")+(hasEvent?" has-event":"")+'">'+
      '<div class="cal-hijri">'+hDay+'</div>'+
      '<div class="cal-greg">'+gDate.day+'/'+gDate.month+'</div>'+
      '</div>';
  }

  // Events
  let eventsHTML = "";
  let monthEvents = [];
  for(let d=1;d<=monthLen;d++){
    const key=hMonth+"-"+d;
    if(HIJRI_EVENTS[key]) monthEvents.push({day:d, events:HIJRI_EVENTS[key]});
  }
  if(monthEvents.length){
    eventsHTML = '<div class="cal-events"><div class="cal-event-title">مناسبات الشهر</div>';
    monthEvents.forEach(ev=>{
      ev.events.forEach(name=>{
        eventsHTML += '<div class="cal-event-item"><div class="cal-event-dot"></div><div><div class="cal-event-name">'+name+'</div><div class="cal-event-date">'+ev.day+' '+HIJRI_MONTHS[hMonth-1]+' '+hYear+' هـ</div></div></div>';
      });
    });
    eventsHTML += '</div>';
  }

  el.innerHTML = headerHTML+
    '<div class="cal-months-nav" id="calMonthsNav">'+pillsHTML+'</div>'+
    dayNamesHTML+
    '<div class="cal-grid">'+cells+'</div>'+
    eventsHTML;

  setTimeout(()=>{
    const nav=document.getElementById("calMonthsNav");
    const active=nav?nav.querySelector(".cal-month-pill.active"):null;
    if(active) active.scrollIntoView({behavior:"smooth",block:"nearest",inline:"center"});
  },100);
}

function calGoMonth(m, y){ calState.month=m; calState.year=y; drawCalendar(m,y); }
function calGoYear(delta){
  let y = calState.year + delta;
  calState.year = y;
  drawCalendar(calState.month, y);
}


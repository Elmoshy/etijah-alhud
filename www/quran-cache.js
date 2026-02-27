// ══════════════════════════════════════
// QURAN CACHE — IndexedDB Manager
// تحميل وتخزين القرآن الكريم كاملاً (604 صفحة)
// ══════════════════════════════════════

const QDB_NAME    = "quranDB";
const QDB_VERSION = 1;
const QDB_STORE   = "pages";

// ── فتح قاعدة البيانات ──
function qdbOpen() {
  return new Promise((res, rej) => {
    const req = indexedDB.open(QDB_NAME, QDB_VERSION);
    req.onupgradeneeded = e => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(QDB_STORE)) {
        db.createObjectStore(QDB_STORE, { keyPath: "page" });
      }
    };
    req.onsuccess = e => res(e.target.result);
    req.onerror   = e => rej(e.target.error);
  });
}

// ── حفظ صفحة ──
function qdbSave(db, page, ayahs) {
  return new Promise((res, rej) => {
    const tx = db.transaction(QDB_STORE, "readwrite");
    tx.objectStore(QDB_STORE).put({ page, ayahs });
    tx.oncomplete = () => res();
    tx.onerror    = e => rej(e.target.error);
  });
}

// ── قراءة صفحة ──
function qdbGet(db, page) {
  return new Promise((res, rej) => {
    const tx  = db.transaction(QDB_STORE, "readonly");
    const req = tx.objectStore(QDB_STORE).get(page);
    req.onsuccess = e => res(e.target.result ? e.target.result.ayahs : null);
    req.onerror   = e => rej(e.target.error);
  });
}

// ── عدد الصفحات المخزنة ──
function qdbCount(db) {
  return new Promise((res, rej) => {
    const tx  = db.transaction(QDB_STORE, "readonly");
    const req = tx.objectStore(QDB_STORE).count();
    req.onsuccess = e => res(e.target.result);
    req.onerror   = e => rej(e.target.error);
  });
}

// ══════════════════════════════════════
// واجهة التحميل (Progress UI)
// ══════════════════════════════════════
function showDownloadModal() {
  let modal = document.getElementById("quranDlModal");
  if (!modal) {
    modal = document.createElement("div");
    modal.id = "quranDlModal";
    modal.innerHTML = `
      <div id="quranDlBox">
        <div id="quranDlIco">📥</div>
        <div id="quranDlTitle">تحميل القرآن الكريم</div>
        <div id="quranDlSub">يتم تحميل القرآن الكريم كاملاً للعمل بدون إنترنت</div>
        <div id="quranDlBarWrap"><div id="quranDlBar"></div></div>
        <div id="quranDlPct">0%</div>
        <div id="quranDlPages">0 / 604 صفحة</div>
      </div>
    `;
    modal.style.cssText = `
      position:fixed;inset:0;background:rgba(0,0,0,.7);backdrop-filter:blur(6px);
      display:flex;align-items:center;justify-content:center;z-index:9999;
      direction:rtl;
    `;
    document.getElementById("quranDlBox").style.cssText = `
      background:var(--sf,#1e293b);border:1px solid var(--bd,rgba(255,255,255,.08));
      border-radius:18px;padding:32px 28px;max-width:320px;width:90%;
      text-align:center;box-shadow:0 24px 60px rgba(0,0,0,.5);
    `;
    // inject styles
    const style = document.createElement("style");
    style.textContent = `
      #quranDlIco{font-size:40px;margin-bottom:12px;}
      #quranDlTitle{font-size:18px;font-weight:800;color:var(--ac,#f59e0b);margin-bottom:6px;font-family:var(--font,'Noto Naskh Arabic',sans-serif);}
      #quranDlSub{font-size:12px;color:var(--mu,#94a3b8);margin-bottom:20px;line-height:1.7;font-family:var(--font,'Noto Naskh Arabic',sans-serif);}
      #quranDlBarWrap{background:var(--sf2,#0f172a);border-radius:99px;height:10px;overflow:hidden;margin-bottom:10px;}
      #quranDlBar{height:100%;background:var(--ac,#f59e0b);border-radius:99px;width:0%;transition:width .3s;}
      #quranDlPct{font-size:22px;font-weight:900;color:var(--ac,#f59e0b);font-family:var(--font,'Noto Naskh Arabic',sans-serif);}
      #quranDlPages{font-size:12px;color:var(--mu,#94a3b8);margin-top:4px;font-family:var(--font,'Noto Naskh Arabic',sans-serif);}
    `;
    document.head.appendChild(style);
    document.body.appendChild(modal);
    // re-apply box style after append
    document.getElementById("quranDlBox").style.cssText = `
      background:var(--sf,#1e293b);border:1px solid var(--bd,rgba(255,255,255,.08));
      border-radius:18px;padding:32px 28px;max-width:320px;width:90%;
      text-align:center;box-shadow:0 24px 60px rgba(0,0,0,.5);
    `;
  }
  modal.style.display = "flex";
}

function updateDownloadProgress(done, total) {
  const pct = Math.round((done / total) * 100);
  const bar = document.getElementById("quranDlBar");
  const pctEl = document.getElementById("quranDlPct");
  const pagesEl = document.getElementById("quranDlPages");
  if (bar)    bar.style.width = pct + "%";
  if (pctEl)  pctEl.textContent = pct + "%";
  if (pagesEl) pagesEl.textContent = done + " / " + total + " صفحة";
}

function hideDownloadModal(success) {
  const modal = document.getElementById("quranDlModal");
  if (!modal) return;
  const ico   = document.getElementById("quranDlIco");
  const title = document.getElementById("quranDlTitle");
  const sub   = document.getElementById("quranDlSub");
  if (success) {
    if (ico)   ico.textContent   = "✅";
    if (title) title.textContent = "اكتمل التحميل!";
    if (sub)   sub.textContent   = "القرآن الكريم متاح الآن بدون إنترنت";
    setTimeout(() => { modal.style.display = "none"; }, 1800);
  } else {
    if (ico)   ico.textContent   = "⚠️";
    if (title) title.textContent = "حدث خطأ";
    if (sub)   sub.textContent   = "تعذّر التحميل — ستجد القرآن متاحاً عند الاتصال بالإنترنت";
    setTimeout(() => { modal.style.display = "none"; }, 3000);
  }
}

// ══════════════════════════════════════
// التحميل الفعلي — مع Concurrency Control
// ══════════════════════════════════════
async function downloadAllQuran(db, onProgress) {
  const TOTAL = 604;
  const BATCH = 5; // 5 صفحات بالتوازي
  const DELAY = 120; // ms بين كل batch

  let downloaded = 0;

  for (let start = 1; start <= TOTAL; start += BATCH) {
    const end = Math.min(start + BATCH - 1, TOTAL);
    const promises = [];

    for (let p = start; p <= end; p++) {
      promises.push(
        fetch(`https://api.alquran.cloud/v1/page/${p}/quran-uthmani`)
          .then(r => r.json())
          .then(async d => {
            if (d.code === 200 && d.data && d.data.ayahs) {
              await qdbSave(db, p, d.data.ayahs);
            }
          })
          .catch(() => {/* صفحة فشلت، نكملها المرة الجاية */})
      );
    }

    await Promise.all(promises);
    downloaded = Math.min(downloaded + BATCH, TOTAL);
    if (onProgress) onProgress(downloaded, TOTAL);

    // استراحة قصيرة
    await new Promise(r => setTimeout(r, DELAY));
  }
}

// ══════════════════════════════════════
// الوظيفة الرئيسية — تُستدعى من window.onload
// ══════════════════════════════════════
async function initQuranCache() {
  try {
    const db    = await qdbOpen();
    const count = await qdbCount(db);

    if (count >= 604) {
      // ✅ القرآن مكتمل — لا حاجة لشيء
      window._quranDB = db;
      return;
    }

    // ❌ ناقص — ابدأ التحميل
    showDownloadModal();
    updateDownloadProgress(count, 604);

    await downloadAllQuran(db, (done, total) => {
      updateDownloadProgress(done, total);
    });

    window._quranDB = db;

    // تحقق كم تم تحميله فعلاً
    const finalCount = await qdbCount(db);
    hideDownloadModal(finalCount >= 580); // 580+ = نجاح معقول

  } catch (err) {
    console.error("QuranCache error:", err);
    hideDownloadModal(false);
  }
}

// ══════════════════════════════════════
// استبدال fetch المصحف بقراءة من IndexedDB
// ══════════════════════════════════════
async function openMushafPageCached(p, firstOpen) {
  p = Math.max(1, Math.min(604, p));
  LSS("mushafLastPage", p);
  S.mushafPage = p;
  setReader(`المصحف — صفحة ${p}`, `جزء ${pageToJuz(p)} · ${p} / 604`, true);
  document.getElementById("ayahWrap").innerHTML =
    `<div class="loader"><div class="spin"></div>تحميل الصفحة ${p}...</div>`;

  // حاول IndexedDB أولاً
  if (window._quranDB) {
    try {
      const ayahs = await qdbGet(window._quranDB, p);
      if (ayahs && ayahs.length > 0) {
        renderMushafPage(ayahs, p);
        if (firstOpen && S.bookmark) {
          const bmPage = getPageOfAyah(S.bookmark.surahNum, S.bookmark.ayahNum);
          if (bmPage === p) scrollToBookmark(S.bookmark.surahNum, S.bookmark.ayahNum);
        }
        return;
      }
    } catch (e) { /* تجاوز للـ fetch */ }
  }

  // Fallback: API
  fetch(`https://api.alquran.cloud/v1/page/${p}/quran-uthmani`)
    .then(r => r.json())
    .then(async d => {
      const ayahs = d.data.ayahs || [];
      renderMushafPage(ayahs, p);
      // خزّن في IndexedDB إن كانت متاحة
      if (window._quranDB) await qdbSave(window._quranDB, p, ayahs);
      if (firstOpen && S.bookmark) {
        const bmPage = getPageOfAyah(S.bookmark.surahNum, S.bookmark.ayahNum);
        if (bmPage === p) scrollToBookmark(S.bookmark.surahNum, S.bookmark.ayahNum);
      }
    })
    .catch(() => {
      document.getElementById("ayahWrap").innerHTML =
        `<div class="empty"><div class="et">فشل تحميل الصفحة — تأكد من الاتصال بالإنترنت</div></div>`;
    });
}

// استبدال سريع للدالة الأصلية بعد التحميل
window.addEventListener("load", () => {
  // سجّل الـ Service Worker
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("./sw.js")
      .then(() => console.log("✅ SW registered"))
      .catch(e => console.warn("SW error:", e));
  }

  // ابدأ تهيئة الكاش (لا تنتظر — بتشتغل في الخلفية)
  initQuranCache().then(() => {
    // بعد تهيئة الكاش، استبدل openMushafPage بالنسخة المحسّنة
    window.openMushafPage = openMushafPageCached;
    window.openFullMushaf = function() {
      const lastPage = parseInt(LS("mushafLastPage")) || 1;
      const startPage = S.bookmark
        ? getPageOfAyah(S.bookmark.surahNum, S.bookmark.ayahNum)
        : lastPage;
      openMushafPageCached(startPage, true);
    };
  });
});

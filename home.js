// ================================================
// STREAMVIBE — home.js
// PURPOSE:
//   - Require login, load user plan
//   - Show sample video grid
//   - Category filter + search filter
//   - Download button with plan-based limit check
//   - Show watch limit banner based on plan
// ================================================

let currentUser    = null;
let userProfile    = null;
let allVideos      = [];
let activeCategory = "all";

// ---- Sample videos (replace with Firestore data later) ----
const SAMPLE_VIDEOS = [
  { id:"v1",  title:"The Future of AI — What's Next?",        channel:"TechVision",    views:"1.2M", duration:"12:34", category:"tech",     thumb:"https://picsum.photos/seed/v1/480/270", src:"https://www.w3schools.com/html/mov_bbb.mp4"  },
  { id:"v2",  title:"Top 10 Goals of the Season",             channel:"SportZone",     views:"890K", duration:"8:22",  category:"sports",   thumb:"https://picsum.photos/seed/v2/480/270", src:"https://www.w3schools.com/html/movie.mp4"  },
  { id:"v3",  title:"Street Food India — Mumbai Edition",      channel:"FoodieWalker",  views:"2.1M", duration:"18:05", category:"trending", thumb:"https://picsum.photos/seed/v3/480/270", src:"https://www.w3schools.com/html/mov_bbb.mp4"  },
  { id:"v4",  title:"Midnight Raaga — Live Concert 2024",     channel:"MusicMela",     views:"450K", duration:"42:10", category:"music",    thumb:"https://picsum.photos/seed/v4/480/270", src:"https://www.w3schools.com/html/movie.mp4"  },
  { id:"v5",  title:"Build a REST API in 20 Minutes",         channel:"CodeWithMe",    views:"3.4M", duration:"19:58", category:"tech",     thumb:"https://picsum.photos/seed/v5/480/270", src:"https://www.w3schools.com/html/mov_bbb.mp4"  },
  { id:"v6",  title:"Stand-Up Comedy Night Highlights",       channel:"LaughFactory",  views:"1.8M", duration:"25:00", category:"comedy",   thumb:"https://picsum.photos/seed/v6/480/270", src:"https://www.w3schools.com/html/movie.mp4"  },
  { id:"v7",  title:"Champions League Final — Best Moments",  channel:"SportZone",     views:"5.6M", duration:"14:30", category:"sports",   thumb:"https://picsum.photos/seed/v7/480/270", src:"https://www.w3schools.com/html/mov_bbb.mp4"  },
  { id:"v8",  title:"Lofi Hip-Hop — Study & Chill Beats",    channel:"ChillWaves",    views:"22M",  duration:"1:00:00",category:"music",   thumb:"https://picsum.photos/seed/v8/480/270", src:"https://www.w3schools.com/html/movie.mp4"  },
  { id:"v9",  title:"React vs Vue vs Angular in 2024",        channel:"CodeWithMe",    views:"780K", duration:"22:14", category:"tech",     thumb:"https://picsum.photos/seed/v9/480/270", src:"https://www.w3schools.com/html/mov_bbb.mp4"  },
  { id:"v10", title:"Desi Comedy Roast — Episode 12",         channel:"LaughFactory",  views:"3.1M", duration:"35:00", category:"comedy",   thumb:"https://picsum.photos/seed/v10/480/270", src:"https://www.w3schools.com/html/movie.mp4" },
  { id:"v11", title:"Kerala Backwaters — Travel Vlog",        channel:"WanderLens",    views:"670K", duration:"16:45", category:"trending", thumb:"https://picsum.photos/seed/v11/480/270", src:"https://www.w3schools.com/html/mov_bbb.mp4" },
  { id:"v12", title:"Classical Carnatic Fusion — 4K",         channel:"MusicMela",     views:"290K", duration:"55:20", category:"music",    thumb:"https://picsum.photos/seed/v12/480/270", src:"https://www.w3schools.com/html/movie.mp4" },
];

// ---- Page init ----
window.addEventListener("DOMContentLoaded", async () => {
  currentUser = await requireAuth();
  if (!currentUser) return;

  userProfile = await getUserProfile(currentUser.uid);
  allVideos   = SAMPLE_VIDEOS;

  // Greet the user
  const firstName = userProfile?.firstName || currentUser.displayName?.split(" ")[0] || "there";
  const greeting  = document.getElementById("user-greeting");
  if (greeting) greeting.textContent = `Hi, ${firstName} 👋`;

  // Show plan badge
  const badge = document.getElementById("user-plan-badge");
  if (badge) badge.textContent = (userProfile?.plan || "free").toUpperCase();

  // Show limit banner if on free/bronze plan
  showLimitBanner(userProfile?.plan || "free");

  // Render videos
  renderVideos(allVideos);
});

// ---- Render video grid ----
function renderVideos(videos) {
  const grid  = document.getElementById("video-grid");
  const empty = document.getElementById("empty-state");

  if (!videos.length) {
    grid.innerHTML = "";
    empty.classList.remove("hidden");
    return;
  }

  empty.classList.add("hidden");
  grid.innerHTML = videos.map(v => videoCard(v)).join("");
}

// ---- Build video card HTML ----
function videoCard(v) {
  return `
    <div class="video-card" data-category="${v.category}" data-id="${v.id}">
      <div class="card-thumb" onclick="openVideo('${v.id}')">
        <img src="${v.thumb}" alt="${v.title}" loading="lazy"/>
        <div class="card-play-overlay">
          <span class="play-icon">▶</span>
        </div>
        <span class="card-duration">${v.duration}</span>
      </div>
      <div class="card-body" onclick="openVideo('${v.id}')">
        <p class="card-title">${v.title}</p>
        <div class="card-meta">
          <span class="card-channel">${v.channel}</span>
          <span>${v.views} views</span>
        </div>
      </div>
      <div class="card-actions">
        <button class="card-action-btn" onclick="openVideo('${v.id}')">▶ Watch</button>
        <button class="card-action-btn download-btn" onclick="handleDownload(event, '${v.id}', '${v.title}')">
          ⬇ Download
        </button>
        <span class="card-category-tag">${v.category}</span>
      </div>
    </div>
  `;
}

// ---- Navigate to video player ----
function openVideo(videoId) {
  window.location.href = `player.html?v=${videoId}`;
}

// ---- Category filter ----
function filterCategory(category, btn) {
  activeCategory = category;

  // Update button styles
  document.querySelectorAll(".cat-btn").forEach(b => b.classList.remove("active"));
  btn.classList.add("active");

  applyFilters();
}

// ---- Search filter ----
function filterVideos(query) {
  applyFilters(query);
}

// ---- Apply both filters ----
function applyFilters(query = document.getElementById("search-input")?.value || "") {
  let filtered = allVideos;

  if (activeCategory !== "all") {
    filtered = filtered.filter(v => v.category === activeCategory);
  }

  if (query.trim()) {
    const q = query.toLowerCase();
    filtered = filtered.filter(v =>
      v.title.toLowerCase().includes(q) ||
      v.channel.toLowerCase().includes(q)
    );
  }

  renderVideos(filtered);
}

// ---- Download handler (Point 2) ----
async function handleDownload(event, videoId, videoTitle) {
  event.stopPropagation();   // don't open the video
  if (!userProfile) return;

  const plan    = userProfile.plan || "free";
  const limits  = getPlanLimit(plan);

  // Check daily limit for free users
  if (plan === "free") {
    const today       = new Date().toDateString();
    const lastDlDate  = userProfile.lastDownload;
    const dlCount     = userProfile.downloads || 0;

    if (lastDlDate === today && dlCount >= limits.downloadsPerDay) {
      showToast("Daily download limit reached! Upgrade to Premium ↗", "error");
      setTimeout(() => { window.location.href = "plans.html"; }, 1500);
      return;
    }
  }

  // Simulate download (in real app: generate signed URL from Firebase Storage)
  showToast(`Downloading "${videoTitle}"...`, "default");

  // Update download count in Firestore
  const today = new Date().toDateString();
  await db.collection("users").doc(currentUser.uid).update({
    downloads:    firebase.firestore.FieldValue.increment(1),
    lastDownload: today,
  });
  userProfile.downloads    = (userProfile.downloads || 0) + 1;
  userProfile.lastDownload = today;

  // Save to downloads collection
  const docRef = await db.collection("downloads").add({
    uid:         currentUser.uid,
    videoId,
    videoTitle,
    downloadedAt: firebase.firestore.FieldValue.serverTimestamp(),
  });

  console.log('Download saved:', docRef.id);

  setTimeout(() => showToast("✅ Saved to your Downloads!", "success"), 1000);

  if (typeof loadDownloads === 'function') {
    try { loadDownloads(); } catch (e) { console.warn('Could not refresh downloads list:', e); }
  }
  // If profile downloads list is visible, insert local placeholder so it appears immediately
  try {
    const listEl = document.getElementById('downloads-list');
    if (listEl) {
      const now = new Date();
      const itemHtml = `
        <div class="download-item">
          <span class="dl-icon">🎬</span>
          <div>
            <p class="dl-title">${videoTitle}</p>
            <p class="dl-date">${now.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
          </div>
          <button class="btn btn-ghost btn-sm dl-play" onclick="window.location.href='player.html?v=${videoId}'">▶ Play</button>
        </div>
      `;
      listEl.insertAdjacentHTML('afterbegin', itemHtml);
    }
  } catch (e) { console.warn('Could not insert local download item:', e); }
  // Best-effort browser download: try to fetch the file and save it
  try {
    const video = SAMPLE_VIDEOS.find(v => v.id === videoId);
    const url = video?.src;
    if (url) {
      const resp = await fetch(url);
      if (!resp.ok) throw new Error('Network response not ok');
      const blob = await resp.blob();
      const ext = (url.split('.').pop().split(/[#?]/)[0]) || 'mp4';
      const filename = `${(videoTitle || 'video').replace(/[^\w\s-]/g,'').replace(/\s+/g,'_')}.${ext}`;
      const a = document.createElement('a');
      const objectUrl = URL.createObjectURL(blob);
      a.href = objectUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(objectUrl);
    } else {
      // fallback: open player page for manual save
      window.open(`player.html?v=${videoId}`, '_blank');
    }
  } catch (err) {
    console.warn('Download failed, opening player page:', err);
    window.open(`player.html?v=${videoId}`, '_blank');
  }
}

// ---- Limit banner ----
function showLimitBanner(plan) {
  const banner    = document.getElementById("limit-banner");
  const planEl    = document.getElementById("banner-plan");
  const minsEl    = document.getElementById("banner-mins");
  const limits    = getPlanLimit(plan);

  if (plan !== "gold") {
    banner.classList.remove("hidden");
    if (planEl) planEl.textContent = limits.label;
    if (minsEl) minsEl.textContent = limits.watchMinutes;
  }
}

// ---- Logout ----
async function handleLogout() {
  await auth.signOut();
  window.location.href = "../index.html";
}

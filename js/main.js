// ============================================
//   SCROLL ANIMATIONS WITH DEBOUNCE
// ============================================
const reveals = document.querySelectorAll('.reveal');

function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

function reveal() {
  reveals.forEach(element => {
    const windowHeight = window.innerHeight;
    const revealTop = element.getBoundingClientRect().top;
    const revealPoint = 150;

    if (revealTop < windowHeight - revealPoint) {
      element.classList.add('visible');
    }
  });
}

window.addEventListener('scroll', debounce(reveal, 100));
reveal();

// ============================================
//   NAV SCROLL EFFECT WITH THROTTLE
// ============================================
const nav = document.querySelector('nav');
let ticking = false;

function updateNav() {
  if (window.scrollY > 100) {
    nav.classList.add('scrolled');
  } else {
    nav.classList.remove('scrolled');
  }
  ticking = false;
}

window.addEventListener('scroll', () => {
  if (!ticking) {
    window.requestAnimationFrame(updateNav);
    ticking = true;
  }
});

// ============================================
//   MOBILE MENU TOGGLE
// ============================================
const menuToggle = document.querySelector('.menu-toggle');
const navLinks = document.querySelector('.nav-links');

if (menuToggle && navLinks) {
  menuToggle.addEventListener('click', () => {
    navLinks.classList.toggle('active');
  });

  navLinks.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      navLinks.classList.remove('active');
    });
  });
}

// ============================================
//   SMOOTH SCROLL FOR ANCHOR LINKS
// ============================================
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    const href = this.getAttribute('href');
    if (href === '#') return;
    
    e.preventDefault();
    const target = document.querySelector(href);
    if (target) {
      target.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  });
});

// ============================================
//   LOAD FEATURED CREATORS FROM GOOGLE SHEET
// ============================================

async function loadFeaturedCreators() {
  const sheetId = "2PACX-1vQR_A_KNK2zWNAYiT-a3baVWUSt8-_SE83gnyt4rOLDRruj0E-SVg4ej8-JnxaMuD0AxIYt6roaKJsg";
  const url = `https://docs.google.com/spreadsheets/d/e/${sheetId}/pub?output=tsv`;

  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    
    const data = await response.text();
    const rows = data.split("\n");

    const creators = rows.slice(1).map(row => {
      if (!row.trim()) return null;
      const cols = row.split("\t");
      return {
        twitch: cols[0]?.trim(),
        name: cols[1]?.trim(),
        level: parseInt(cols[2]),
        featured: cols[4]?.trim(),
        status: cols[5]?.trim()
      };
    }).filter(c => c && c.twitch && c.name);

    // Filter for people who are ACTUALLY live based on your sheet's status
    const liveNow = creators.filter(c => 
      c.level >= 5 && 
      c.featured === "Yes" && 
      c.status === "Live"
    );

    // If no one is live, show the "No one is live" card
    if (liveNow.length === 0) {
      displayNoCreators();
    } else {
      displayFeaturedCreators(liveNow);
    }

  } catch (err) {
    console.error("Error loading creators:", err);
    displayNoCreators();
  }
}

// ============================================
//   DISPLAY CREATORS WITH TWITCH API
// ============================================

function displayFeaturedCreators(creators) {
  const container = document.getElementById("twitch-embed");
  if (!container) return;

  // Clear container only once
  container.innerHTML = "";

  // Load Twitch embed script first
  loadTwitchScript(() => {
    creators.forEach(c => {
      // 1. Create the wrapper
      const wrapper = document.createElement('div');
      wrapper.className = 'creator-featured';
      wrapper.id = `wrapper-${c.twitch}`;
      
      wrapper.innerHTML = `
        <div class="creator-featured-header">
          <div class="creator-avatar"><i class="fas fa-user"></i></div>
          <div class="creator-info">
            <h3 class="creator-name">${c.name}</h3>
            <p class="creator-level">Level ${c.level}</p>
          </div>
          <div class="creator-status-badge">LIVE</div>
        </div>
        <div id="player-${c.twitch}" class="twitch-embed-container" style="min-height: 500px;"></div>
      `;
      
      container.appendChild(wrapper);

      // 2. Initialize the Twitch Player API
      setTimeout(() => {
        try {
          const player = new Twitch.Player(`player-${c.twitch}`, {
            channel: c.twitch,
            width: "100%",
            height: 500,
            parent: [window.location.hostname],
            autoplay: true,
            muted: true
          });

          // 3. LISTEN FOR OFFLINE EVENT - Fast stop
          player.addEventListener(Twitch.Player.OFFLINE, () => {
            console.log(`${c.twitch} went offline, removing player immediately.`);
            wrapper.remove();
            
            // If no other creators are left, show the "No one is live" card
            if (container.children.length === 0) {
              displayNoCreators();
            }
          });
        } catch (err) {
          console.error(`Error initializing player for ${c.twitch}:`, err);
          wrapper.remove();
        }
      }, 100);
    });
  });
}

function displayNoCreators() {
  const container = document.getElementById("twitch-embed");
  if (!container) return;

  container.innerHTML = `
    <div class="no-featured-creators">
      <i class="fas fa-video"></i>
      <p>No one is live right now</p>
      <p style="font-size: 0.9rem; margin-top: 0.5rem;">Check back soon for featured creators!</p>
    </div>
  `;
}

function loadTwitchScript(callback) {
  if (window.twitchScriptLoaded) {
    callback();
    return;
  }

  const script = document.createElement('script');
  script.src = 'https://embed.twitch.tv/embed/v1.js';
  script.async = true;
  script.onload = () => {
    window.twitchScriptLoaded = true;
    callback();
  };
  script.onerror = () => {
    console.error('Failed to load Twitch embed script');
  };
  document.body.appendChild(script);
}

// ============================================
//   REFRESH HANDLERS
// ============================================

document.addEventListener('DOMContentLoaded', loadFeaturedCreators);

// Refresh every 60 seconds to check for new streamers
setInterval(loadFeaturedCreators, 60000);

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') {
    loadFeaturedCreators();
  }
});

window.addEventListener('focus', () => {
  loadFeaturedCreators();
});

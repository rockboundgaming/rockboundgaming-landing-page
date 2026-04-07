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
//   FEATURED CREATORS FROM GOOGLE SHEET
// ============================================
const sheetURL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQR_A_KNK2zWNAYiT-a3baVWUSt8-_SE83gnyt4rOLDRruj0E-SVg4ej8-JnxaMuD0AxIYt6roaKJsg/pub?output=csv";

async function fetchFeaturedCreators() {
  try {
    const response = await fetch(sheetURL);
    const csv = await response.text();
    
    // Parse CSV
    const lines = csv.trim().split('\n');
    const featuredCreators = [];
    
    // Skip header row (row 0)
    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(',').map(col => col.trim());
      
      if (cols.length < 5) continue; // Skip incomplete rows
      
      const twitchName = cols[0];
      const displayName = cols[1];
      const level = parseInt(cols[2]);
      const status = cols[3];
      const featured = cols[4];
      
      // Check if Level >= 5 and Featured = Yes
      if (level >= 5 && featured.toLowerCase() === "yes" && twitchName) {
        featuredCreators.push({
          twitchName: twitchName,
          displayName: displayName,
          level: level,
          status: status,
          featured: featured
        });
      }
    }
    
    displayFeaturedCreators(featuredCreators);
    
  } catch (error) {
    console.error('Error fetching creators:', error);
    displayNoCreators();
  }
}

function displayFeaturedCreators(creators) {
  const container = document.getElementById('creator-list');
  
  if (creators.length === 0) {
    displayNoCreators();
    return;
  }
  
  container.innerHTML = '';
  
  creators.forEach(creator => {
    const creatorHTML = `
      <div class="creator-featured">
        <div class="creator-featured-header">
          <div class="creator-avatar">
            <i class="fas fa-user"></i>
          </div>
          <div class="creator-info">
            <h3 class="creator-name">${creator.displayName}</h3>
            <p class="creator-level">Level ${creator.level}</p>
          </div>
          <div class="creator-status-badge">
            ${creator.status}
          </div>
        </div>
        <div class="creator-embed-wrapper">
          <iframe
            src="https://twitch.tv/embed/${creator.twitchName}/chat?parent=localhost&parent=rockgamingnl.ca&parent=www.rockgamingnl.ca"
            height="500"
            width="100%"
            frameborder="0"
            scrolling="no"
            allowfullscreen="true">
          </iframe>
        </div>
      </div>
    `;
    
    container.innerHTML += creatorHTML;
  });
}

function displayNoCreators() {
  const container = document.getElementById('creator-list');
  container.innerHTML = `
    <div class="no-featured-creators">
      <i class="fas fa-video"></i>
      <p>No featured creators streaming right now</p>
      <p style="font-size: 0.9rem; margin-top: 0.5rem;">Check back soon or join our Discord!</p>
    </div>
  `;
}

// Fetch creators when page loads
document.addEventListener('DOMContentLoaded', fetchFeaturedCreators);

// Refresh every 5 minutes
setInterval(fetchFeaturedCreators, 300000);

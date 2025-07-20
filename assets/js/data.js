// Y3ti@Sec - Unified Data Fetching Script

// --- CONFIGURATION ---
const API_BASE_URL = "https://y3tisec-api.vercel.app/api";
const TEAM_ID = "383056"; // Y3ti@Sec's CTFtime Team ID

// --- DOM BINDINGS & SELECTORS ---
const DATA_SELECTORS = {
  globalRank: '[data-value="globalRank"]',
  countryRank: '[data-value="countryRank"]',
  ratingPoints: '[data-value="ratingPoints"]',
  ctfsCompleted: '[data-value="ctfsCompleted"]',
  roundedRatingPoints: '[data-value="roundedRatingPoints"]',
  coreMembers: '[data-value="coreMembers"]',
};

// --- CORE FUNCTIONS ---

/**
 * Fetches team statistics from the backend API.
 * Handles errors gracefully with a fallback mechanism.
 */
async function fetchTeamStats() {
  try {
    const response = await fetch(`${API_BASE_URL}/team/stats`);

    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status}`);
    }

    const result = await response.json();

    if (result.success && result.data) {
      updateUI(result.data);
      console.log("Updated live team statistics.");
    } else {
      throw new Error("Invalid API response format.");
    }
  } catch (error) {
    console.error("❌ Error fetching live data:", error);
    console.log("🔄 Using fallback data due to API error.");
    useFallbackData();
  }
}

/**
 * Updates the UI with the fetched data.
 * @param {object} data - The statistics data from the API.
 */
function updateUI(data) {
  const stats = data.currentYear;
  const ctfsCompleted = data.ctfsCompleted;

  if (!stats) {
    console.warn("No data available for the current year.");
    // Clear loading text if no data
    document
      .querySelectorAll(
        `${DATA_SELECTORS.globalRank}, ${DATA_SELECTORS.countryRank}, ${DATA_SELECTORS.ratingPoints}`
      )
      .forEach((el) => (el.textContent = "N/A"));
    return;
  }

  // Update Global Rank
  const globalRankElements = document.querySelectorAll(
    DATA_SELECTORS.globalRank
  );
  if (globalRankElements.length > 0 && stats.globalRank) {
    globalRankElements.forEach(
      (el) => (el.textContent = `#${stats.globalRank}`)
    );
  }

  // Update Country Rank
  const countryRankElements = document.querySelectorAll(
    DATA_SELECTORS.countryRank
  );
  if (countryRankElements.length > 0 && stats.countryRank) {
    countryRankElements.forEach(
      (el) => (el.textContent = `#${stats.countryRank}`)
    );
  }

  // Update Rating Points
  const ratingPointsElements = document.querySelectorAll(
    DATA_SELECTORS.ratingPoints
  );
  if (ratingPointsElements.length > 0 && stats.ratingPoints) {
    ratingPointsElements.forEach(
      (el) => (el.textContent = stats.ratingPoints.toFixed(3))
    );
  }

  // Update Rounded Rating Points
  const roundedRatingPointsElements = document.querySelectorAll(
    DATA_SELECTORS.roundedRatingPoints
  );
  if (roundedRatingPointsElements.length > 0 && stats.ratingPoints) {
    roundedRatingPointsElements.forEach(
      (el) => (el.textContent = stats.ratingPoints.toFixed(0) + "+")
    );
  }
}

/**
 * Fetches completed CTF data and populates the achievements table.
 */
async function fetchCompletedCTFs() {
  // Always update CTFs Completed count, even if table is missing
  try {
    const response = await fetch(`${API_BASE_URL}/team/completed-ctfs`);
    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status}`);
    }
    const result = await response.json();

    // Update CTFs Completed count
    const ctfsCompletedElements = document.querySelectorAll(
      DATA_SELECTORS.ctfsCompleted
    );
    if (ctfsCompletedElements.length > 0) {
      ctfsCompletedElements.forEach(
        (el) => (el.textContent = result.data.length)
      );
    }

    // Now handle achievements table if it exists
    const achievementsBody = document.querySelector(
      ".achievements-table tbody"
    );
    if (!achievementsBody) return;

    // Show loading state
    achievementsBody.innerHTML =
      '<tr><td colspan="5" class="loading">Loading CTF data...</td></tr>';

    if (!result.success || !Array.isArray(result.data)) {
      throw new Error("Invalid API response format for CTFs.");
    }

    // Clear loading state
    achievementsBody.innerHTML = "";

    if (result.data.length === 0) {
      achievementsBody.innerHTML =
        '<tr><td colspan="5" class="no-data">No CTFs available for the current year yet.</td></tr>';
      return;
    }

    result.data.forEach((ctf) => {
      const rankClass =
        ctf.rank <= 100 ? "excellent" : ctf.rank <= 200 ? "good" : "average";
      const row = document.createElement("tr");
      row.className = `achievement-row ${rankClass}`;
      row.innerHTML = `
        <td><span class="rank-badge rank-${rankClass}">#${ctf.rank}</span></td>
        <td>${ctf.ctf_name}</td>
        <td>${(ctf.points || 0).toFixed(4)}</td>
        <td>${(ctf.rating_points || 0).toFixed(3)}</td>
        <td><span class="performance-badge ${rankClass}">${
        rankClass.charAt(0).toUpperCase() + rankClass.slice(1)
      }</span></td>
      `;
      achievementsBody.appendChild(row);
    });
  } catch (error) {
    console.error("❌ Error fetching completed CTFs:", error);
    // Update the count to show an error state
    const ctfsCompletedElements = document.querySelectorAll(
      DATA_SELECTORS.ctfsCompleted
    );
    if (ctfsCompletedElements.length > 0) {
      ctfsCompletedElements.forEach((el) => (el.textContent = "N/A"));
    }
    // If table exists, show error
    const achievementsBody = document.querySelector(
      ".achievements-table tbody"
    );
    if (achievementsBody) {
      achievementsBody.innerHTML =
        '<tr><td colspan="5" class="error">Failed to load CTF data. Please try again later.</td></tr>';
    }
  }
}

/**
 * Provides hardcoded fallback data if the API is unavailable.
 * Ensures the website remains functional.
 */
function useFallbackData() {
  const fallbackData = {
    currentYear: {
      globalRank: 497,
      countryRank: 5,
      ratingPoints: 65.851,
    },
  };
  updateUI(fallbackData);

  // Optional: Add a visual indicator that data is cached/fallback
  const statContainers = document.querySelectorAll(
    ".stats-container, .team-stats"
  );
  statContainers.forEach((container) => {
    // Avoid adding duplicate indicators
    if (container && !container.querySelector(".cache-indicator")) {
      const indicator = document.createElement("div");
      indicator.className = "cache-indicator";
      indicator.textContent = "Cached";
      indicator.style.cssText = `
        position: absolute; top: -10px; right: -10px; background: rgba(255, 193, 7, 0.9);
        color: #000; padding: 2px 6px; border-radius: 10px; font-size: 10px; font-weight: bold;
      `;
      container.style.position = "relative";
      container.appendChild(indicator);
    }
  });
}

/**
 * Shows a loading state in the UI for stats.
 */
function showStatsLoading() {
  // nahh
}

// Helper to parse event date string to Date object (best effort)
function parseEventDate(dateStr) {
  // Replace abbreviated month names (with or without period) with full names
  const monthMap = {
    Jan: "January",
    Feb: "February",
    Mar: "March",
    Apr: "April",
    May: "May",
    Jun: "June",
    Jul: "July",
    Aug: "August",
    Sep: "September",
    Sept: "September",
    Oct: "October",
    Nov: "November",
    Dec: "December",
  };
  dateStr = dateStr.replace(
    /\b([A-Za-z]{3,4})\.?\b/g,
    (m, abbr) => monthMap[abbr] || m
  );

  // Convert times like '7 p.m.' or '6 a.m.' to '7:00 PM' or '6:00 AM'
  dateStr = dateStr.replace(
    /(\d{1,2})\s*([ap])\.?m\.?/gi,
    (m, hour, ap) => `${hour}:00 ${ap.toUpperCase()}M`
  );

  let date = new Date(dateStr);
  if (!isNaN(date)) return date;
  // Try to match 'Month Day, Year, HH:MM' (e.g., 'July 18, 2025, 3:15 p.m.')
  const match = dateStr.match(
    /([A-Za-z]+)\s+(\d{1,2}),\s*(\d{4}),?\s*(\d{1,2}:\d{2})?\s*([ap]\.?m\.?)?/i
  );
  if (match) {
    let [_, month, day, year, time, ampm] = match;
    let dateString = `${month} ${day}, ${year}`;
    if (time) {
      dateString += ` ${time}`;
      if (ampm) dateString += ` ${ampm.replace(/\./g, "")}`;
    }
    date = new Date(dateString);
    if (!isNaN(date)) return date;
  }
  // Try ISO format fallback
  const isoMatch = dateStr.match(/(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})/);
  if (isoMatch) {
    return new Date(
      `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}T${isoMatch[4]}:${isoMatch[5]}:00Z`
    );
  }
  return null;
}

// Helper to get 'starts in' string
function getStartsInString(eventDate) {
  const now = new Date();
  const diffMs = eventDate - now;
  if (diffMs <= 0) return "Already started";
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays > 0)
    return `Starting in ${diffDays} day${diffDays > 1 ? "s" : ""}`;
  if (diffHours > 0)
    return `Starting in ${diffHours} hour${diffHours > 1 ? "s" : ""}`;
  if (diffMins > 0)
    return `Starting in ${diffMins} minute${diffMins > 1 ? "s" : ""}`;
  return "Starting soon";
}

// Fetch and render upcoming CTFs on the events page
async function renderUpcomingCtfs() {
  const grid = document.querySelector(".upcoming-events .events-grid");
  if (!grid) return;
  grid.innerHTML = `<div class="event-card loading" style="display:flex;align-items:center;justify-content:center;flex-direction:column;padding:2rem;min-height:180px;">
      <div class="spinner" style="border:4px solid #222;border-top:4px solid #1E40AF;border-radius:50%;width:40px;height:40px;animation:spin 1s linear infinite;margin-bottom:1rem;"></div>
      <div style="font-size:1.1rem;opacity:0.8;">Loading upcoming CTFs...</div>
      <style>
        @keyframes spin { 0% { transform: rotate(0deg);} 100% { transform: rotate(360deg);} }
      </style>
    </div>`;
  try {
    const response = await fetch(
      `${API_BASE_URL.replace(/\/$/, "")}/ctftime/upcoming`
    );
    const result = await response.json();
    if (
      !result.success ||
      !Array.isArray(result.data) ||
      result.data.length === 0
    ) {
      grid.innerHTML =
        '<div class="event-card empty">No upcoming CTFs planned yet.</div>';
      return;
    }
    grid.innerHTML = "";
    result.data.forEach((event) => {
      // Parse date for display
      let day = "",
        month = "",
        time = "",
        startsIn = "";
      let eventDateObj = null;
      if (event.date) {
        eventDateObj = parseEventDate(event.date);
        if (eventDateObj) {
          // Use Date object for day and month
          day = eventDateObj.getDate();
          // Get short month name in uppercase (e.g., 'AUG')
          month = eventDateObj
            .toLocaleString("en-US", { month: "short" })
            .toUpperCase();
          // Get time in 'HH:MM' 24-hour format
          let hours = eventDateObj.getHours();
          let minutes = eventDateObj.getMinutes();
          time = `${hours.toString().padStart(2, "0")}:${minutes
            .toString()
            .padStart(2, "0")}`;
          startsIn = getStartsInString(eventDateObj);
          if (startsIn === "Already started") {
            upcoming = "Ongoing";
          } else {
            upcoming = "Upcoming";
          }
        }
      }

      grid.innerHTML += `
                <div class="event-card upcoming">
                  <div class="event-date">
                    <span class="day">${day}</span>
                    <span class="month">${month}</span>
                  </div>
                  <div class="event-info">
                    <h3><a href="${
                      event.url
                    }" target="_blank" rel="noopener" style="color: #fff; text-decoration: none;">${
        event.name
      }</a></h3>
                    <p class="event-time">${time} UTC</p>
                    <p class="event-status">${startsIn}</p>
                    <p class="event-description">${
                      event.description
                        ? event.description
                        : "No description available."
                    }</p>
                  </div>
                  <div class="event-badge upcoming-badge">${upcoming}</div>
                </div>
                <hr class="event-separator" />
            `;
    });
    // Remove last separator
    if (
      grid.lastElementChild &&
      grid.lastElementChild.classList.contains("event-separator")
    ) {
      grid.removeChild(grid.lastElementChild);
    }
  } catch (err) {
    grid.innerHTML =
      '<div class="event-card error">Failed to load upcoming CTFs.</div>';
  }
}

// Only run on events.html
if (window.location.pathname.endsWith("events.html")) {
  document.addEventListener("DOMContentLoaded", renderUpcomingCtfs);
}

// --- INITIALIZATION ---

/**
 * Fires the data fetching process once the DOM is fully loaded.
 */
window.addEventListener("DOMContentLoaded", () => {
  showStatsLoading();
  fetchTeamStats();
  fetchCompletedCTFs();

  // send get request to warmup backend api but dont wait for it
  fetch(`${API_BASE_URL.replace(/\/$/, "")}/ctftime/upcoming`);
});

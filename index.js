const API_KEY = "2c88a4f5";
const DEFAULT_QUERY = "Blade Runner";
const MAX_RESULTS = 10;
const WATCHLIST_STORAGE_KEY = "movies_watchlist";
const inputEl = document.getElementById("searchInput");
const buttonEl = document.getElementById("searchBtn");
const moviesEl = document.getElementById("movies");
const emptyEl = document.querySelector(".empty");
const movieTemplate = document.getElementById("movieTemplate");
// Cache the currently rendered movie details by imdbID so the click handler
// can save the full movie object without re-fetching.
const movieDetailsById = new Map();

function loadWatchlist() {
  try {
    const raw = localStorage.getItem(WATCHLIST_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveWatchlist(movies) {
  localStorage.setItem(WATCHLIST_STORAGE_KEY, JSON.stringify(movies));
}

function setEmptyVisible(isVisible) {
  if (!emptyEl) return;
  emptyEl.classList.toggle("hidden", !isVisible);
}

function renderMovies(movies) {
  if (!moviesEl || !movieTemplate) return;

  moviesEl.innerHTML = "";
  movieDetailsById.clear();

  const current = loadWatchlist();
  const currentIds = new Set(
    current.map((m) => (m?.imdbID ? String(m.imdbID) : null)).filter(Boolean),
  );

  movies.forEach((m) => {
    if (m?.imdbID) movieDetailsById.set(m.imdbID, m);
    const clone = movieTemplate.content.cloneNode(true);

    const img = clone.querySelector("img");
    const titleEl = clone.querySelector("h3");
    const ratingEl = clone.querySelector(".rating");
    const runtimeEl = clone.querySelector(".runtime");
    const genreEl = clone.querySelector(".genre");
    const plotEl = clone.querySelector(".plot");
    const watchlistBtn = clone.querySelector(".watchlist-btn");

    const poster =
      m.Poster && m.Poster !== "N/A"
        ? m.Poster
        : "https://via.placeholder.com/100x150?text=No+Poster";

    if (img) {
      img.src = poster;
      img.alt = m.Title ? `${m.Title} poster` : "Movie poster";
    }
    if (titleEl) titleEl.textContent = m.Title ?? "Untitled";
    if (ratingEl)
      ratingEl.textContent = m.imdbRating ? `⭐ ${m.imdbRating}` : "";
    if (runtimeEl) runtimeEl.textContent = m.Runtime ?? "";
    if (genreEl) genreEl.textContent = m.Genre ?? "";
    if (plotEl) plotEl.textContent = m.Plot ?? "";
    if (watchlistBtn) {
      watchlistBtn.dataset.imdbid = m.imdbID ?? "";
      const imdbId = m?.imdbID ? String(m.imdbID) : "";
      watchlistBtn.textContent = currentIds.has(imdbId)
        ? "Added"
        : "+ Watchlist";
    }

    moviesEl.appendChild(clone);
  });
}

async function fetchMovieDetails(imdbID) {
  const res = await fetch(
    `https://www.omdbapi.com/?i=${encodeURIComponent(imdbID)}&apikey=${API_KEY}&plot=short`,
  );
  const data = await res.json();
  return data?.Response === "False" ? null : data;
}

async function searchMovies(query) {
  const q = String(query ?? "").trim() || DEFAULT_QUERY;

  const url = `https://www.omdbapi.com/?s=${encodeURIComponent(q)}&apikey=${API_KEY}`;
  const res = await fetch(url);
  const data = await res.json();

  const searchMoviesList = Array.isArray(data?.Search) ? data.Search : [];
  if (searchMoviesList.length === 0) {
    renderMovies([]);
    setEmptyVisible(true);
    return;
  }

  setEmptyVisible(false);
  moviesEl.innerHTML = `<p>Loading...</p>`;

  const limited = searchMoviesList.slice(0, MAX_RESULTS);
  const enriched = [];

  // Fetch details per movie to get imdbRating, Plot, Runtime, Genre.
  // Do this sequentially to avoid hitting OMDb rate limits.
  for (const item of limited) {
    const details = await fetchMovieDetails(item.imdbID).catch(() => null);
    enriched.push(
      details
        ? {
            ...details,
            // Keep poster from search result if details poster is missing.
            Poster:
              details.Poster && details.Poster !== "N/A"
                ? details.Poster
                : item.Poster,
            Type: details.Type ?? item.Type,
            Year: details.Year ?? item.Year,
            imdbID: details.imdbID ?? item.imdbID,
          }
        : item,
    );
  }

  renderMovies(enriched);
}

// Event delegation so dynamically-created watchlist buttons work.
moviesEl?.addEventListener("click", (e) => {
  const target = e.target;
  if (!(target instanceof Element)) return;

  const watchlistBtn = target.closest(".watchlist-btn");
  if (!watchlistBtn) return;

  const imdbId = watchlistBtn.dataset.imdbid;
  if (!imdbId) return;

  const movie = movieDetailsById.get(imdbId);
  if (!movie) return; // Shouldn't happen while cards are rendered.

  const current = loadWatchlist();
  const exists = current.some((m) => m?.imdbID === imdbId);

  if (!exists) {
    current.push(movie);
    saveWatchlist(current);
  }

  // Optional small UX: change button label after adding.
  watchlistBtn.textContent = "Added";
});

buttonEl?.addEventListener("click", () => {
  searchMovies(inputEl?.value).catch(console.error);
});

inputEl?.addEventListener("keydown", (e) => {
  if (e.key === "Enter") searchMovies(inputEl?.value).catch(console.error);
});

// initial example search
searchMovies("Blade Runner").catch(console.error);

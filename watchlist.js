const WATCHLIST_STORAGE_KEY = "movies_watchlist";

const watchlistMoviesEl = document.getElementById("watchlistMovies");
const watchlistTemplateEl = document.getElementById("watchlistTemplate");
const emptyEl = document.querySelector(".empty");

function setEmptyVisible(isVisible) {
  emptyEl?.classList.toggle("hidden", !isVisible);
}

function loadWatchlist() {
  try {
    const raw = localStorage.getItem(WATCHLIST_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function renderWatchlist(movies) {
  if (!watchlistMoviesEl || !watchlistTemplateEl) return;

  const list = Array.isArray(movies) ? movies : [];
  watchlistMoviesEl.innerHTML = "";

  list.forEach((m) => {
    const clone = watchlistTemplateEl.content.cloneNode(true);

    const img = clone.querySelector("img");
    const titleEl = clone.querySelector("h3");
    const ratingEl = clone.querySelector(".rating");
    const runtimeEl = clone.querySelector(".runtime");
    const genreEl = clone.querySelector(".genre");
    const plotEl = clone.querySelector(".plot");
    const removeBtn = clone.querySelector(".watchlist-btn");

    const poster =
      m?.Poster && m.Poster !== "N/A"
        ? m.Poster
        : "https://via.placeholder.com/100x150?text=No+Poster";

    if (img) {
      img.src = poster;
      img.alt = m?.Title ? `${m.Title} poster` : "Movie poster";
    }
    if (titleEl) titleEl.textContent = m?.Title ?? "Untitled";
    if (ratingEl)
      ratingEl.textContent = m?.imdbRating ? `⭐ ${m.imdbRating}` : "";
    if (runtimeEl) runtimeEl.textContent = m?.Runtime ?? "";
    if (genreEl) genreEl.textContent = m?.Genre ?? "";
    if (plotEl) plotEl.textContent = m?.Plot ?? "";
    if (removeBtn) removeBtn.dataset.imdbid = m?.imdbID ?? "";

    watchlistMoviesEl.appendChild(clone);
  });
}

function removeFromWatchlist(imdbId) {
  if (!imdbId) return;
  const current = loadWatchlist();
  const next = current.filter((m) => m?.imdbID !== imdbId);
  localStorage.setItem(WATCHLIST_STORAGE_KEY, JSON.stringify(next));
  return next;
}

watchlistMoviesEl?.addEventListener("click", (e) => {
  const target = e.target;
  if (!(target instanceof Element)) return;

  const removeBtn = target.closest(".watchlist-btn");
  if (!removeBtn) return;

  const imdbId = removeBtn.dataset.imdbid;
  const next = removeFromWatchlist(imdbId);
  renderWatchlist(next);
  setEmptyVisible((next?.length ?? 0) === 0);
});

// Initial render on page load
const current = loadWatchlist();
renderWatchlist(current);
setEmptyVisible(current.length === 0);

let movieInfo, movieId;
const genres = {
  28: "Action",
  12: "Adventure",
  16: "Animation",
  35: "Comedy",
  80: "Crime",
  99: "Documentary",
  18: "Drama",
  10751: "Family",
  14: "Fantasy",
  36: "History",
  27: "Horror",
  10402: "Music",
  9648: "Mystery",
  10749: "Romance",
  878: "Science Fiction",
  10770: "TV Movie",
  53: "Thriller",
  10752: "War",
  37: "Western",
};

(() => {
  console.log("view.js loaded!");

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.addEventListener("message", gotMessage);
  }

  document.querySelector(".btn-watched").addEventListener("click", handleClick);

  getMovie();
})();

function sendMessage(msg) {
  //send a message to the service worker
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.ready.then((reg) => {
      reg.active.postMessage(msg);
    });
  }
}
function fillInfo(movieInfo) {
  let emptyMsg = document.querySelector(".empty-msg");
  if (movieInfo) {
    emptyMsg.classList.add("inactive");

    document.querySelector(".movie__title").textContent =
      movieInfo.original_title;

    let genreIds = movieInfo.genre_ids;
    let genreFrag = document.createDocumentFragment();
    genreIds.forEach((id) => {
      let span = document.createElement("span");
      span.className = "movie__genre";
      span.textContent = getGenre(id);
      genreFrag.append(span);
    });
    document.querySelector(".movie__genre-list").append(genreFrag);

    let rating = Math.round(movieInfo.vote_average);
    let fullStars = Math.floor(rating / 2);
    let halfStar = rating % 10;
    let emptyStar = 10 - Math.ceil(rating / 2);
    let rateFrag = document.createDocumentFragment();
    for (let i = 0; i < fullStars; i++) {
      let img = document.createElement("img");
      img.src = "./images/full-star.svg";
      rateFrag.append(img);
    }
    if (halfStar) {
      let img = document.createElement("img");
      img.src = "./images/half-star.svg";
      rateFrag.append(img);
    }
    if (emptyStar) {
      let img = document.createElement("img");
      img.src = "./images/empty-star.svg";
      rateFrag.append(img);
    }
    let p = document.createElement("p");
    p.className = "no-of-ratings";
    p.textContent = `(${movieInfo.vote_count}) reviews`;
    rateFrag.append(p);
    document.querySelector(".ratings").append(rateFrag);

    let sum = document.querySelector(".movie__summary > p");
    sum.textContent = movieInfo.overview;

    document.querySelector(
      ".movie-details__list .adults .info__text--normal"
    ).textContent = movieInfo.adult ? " Yes" : " No";
    document.querySelector(
      ".movie-details__list .release .info__text--normal"
    ).textContent = ` ${movieInfo.release_date}`;

    document.querySelector(".view.container").classList.remove("inactive");
  } else {
    if (emptyMsg) {
      emptyMsg.classList.remove("inactive");
    }
  }
}

function getMovie() {
  let url = new URL(location.href);
  movieId = url.searchParams.get("movieId") || "";

  let msg = {
    action: "watch",
    movieId: movieId,
  };
  sendMessage(msg);
}

function gotMessage(ev) {
  //got a message from the service worker
  if ("action" in ev.data) {
    if (ev.data.action === "watchSuccess") {
      movieInfo = ev.data.movieInfo;

      fillInfo(movieInfo);
    }
    if (ev.data.action === "watchedSuccess") {
      if (movieId === ev.data.movieId) {
        window.location.href = "./index.html";
      }
    }
  }
}

function getGenre(id) {
  return genres[id];
}

function handleClick(ev) {
  ev.preventDefault();
  let msg = { action: "watched", movieId: movieId };
  sendMessage(msg);
}

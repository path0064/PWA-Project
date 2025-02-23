import token from "./apikey.js";
let keyword;

(async () => {
  console.log("search.js loaded!");
  let searchForm = document.getElementById("search-form");
  if (searchForm) searchForm.addEventListener("submit", handleSearchSubmit);
  setSearchValue();

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.addEventListener("message", gotMessage);
  }

  let moviesArray = await fetchMoviesReturnMovieArray(keyword);
  createCards(moviesArray);
})();

async function handleSearchSubmit(ev) {
  console.log("search submitted!");
  ev.preventDefault();

  let search = document.getElementById("search");
  keyword = search.value;

  let url = new URL(location.href);
  url.searchParams.set("search", keyword);
  window.history.pushState(null, "", url.toString());

  let moviesArray = await fetchMoviesReturnMovieArray(keyword);

  createCards(moviesArray);
}

async function fetchMoviesReturnMovieArray(query) {
  let req = new Request(
    `https://api.themoviedb.org/3/search/movie?query=${query}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  );
  let res = await fetch(req)
    .then((res) => {
      if (!res.ok) {
        throw new Error("There was an error fetching the movie");
      }
      return res.json();
    })
    .then((data) => {
      return data.results;
    })
    .catch((err) => {
      console.error(err.message);
    });
  if (res) return res;
}

function setSearchValue() {
  let url = new URL(location.href);
  keyword = url.searchParams.get("search") || "";
  document.getElementById("search").value = keyword;
}

function createCards(movieArray) {
  let frag = document.createDocumentFragment();
  movieArray.forEach((result) => {
    let clone = document
      .getElementById("card-template")
      .content.cloneNode(true);

    clone.querySelector("div.user-card").id = `movieId${result.id}`;
    // anchor
    let a = clone.querySelector("a.btn-cart");
    a.id = `cart${result.id}`;
    a.addEventListener("click", handleResultClick);
    // images
    let img = clone.querySelector("div.user-card__img > img");
    img.addEventListener(
      "load",
      async (ev) => {
        let img = ev.target;

        img.src = result.poster_path
          ? "https://image.tmdb.org/t/p/original" + result.poster_path
          : "/images/placeholderimg.svg";
        img.alt = `movie poster`;
      },
      { once: true }
    );
    img.addEventListener("error", (ev) => {
      let img = ev.target;
      img.src = "/images/placeholderimg.svg";
      img.alt = `movie poster`;
    });
    // name
    clone.querySelector("h3.user-card__name").textContent =
      result.original_title;
    // rating
    clone.querySelector("p.user-card__rating").textContent += ` ${
      Math.round(result.vote_average * 10) / 10
    }/10`;
    clone.querySelector("p.user-card__description").textContent =
      result.overview;
    frag.append(clone);
  });
  let ul = document.querySelector("ul.user-card__list");
  ul.innerHTML = "";
  ul.append(frag);
}

function handleResultClick(ev) {
  ev.preventDefault();
  let a = ev.currentTarget;
  let msg = {
    action: "addToCart",
    movieId: a.id.substring(4),
  };
  sendMessage(msg);
}

function sendMessage(msg) {
  //send a message to the service worker
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.ready.then((reg) => {
      reg.active.postMessage(msg);
    });
  }
}

function gotMessage(ev) {
  //got a message from the service worker
  if ("action" in ev.data) {
    if (ev.data.action === "addToCartSuccess") {
      console.log(`added to cart: ${ev.data.movieId}`);
      let a = document.querySelector(`#cart${ev.data.movieId}`);
      if (a) {
        a.classList.add("btn-addedToCart");
        a.textContent = "Added to cart";
      }
    }
    // if (ev.data.action === "removeFromCartSuccess") {
    // }
    // if (ev.data.action === "checkoutSuccess") {
    // }
    // if (ev.data.action === "watchedSuccess") {
    // }
  }
}

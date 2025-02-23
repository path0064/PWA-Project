let movieArray;

(() => {
  console.log("rent.js loaded!");

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.addEventListener("message", gotMessage);
  }

  getMovieArray();
})();

function createCards(movieArray) {
  let results = movieArray;

  let frag = document.createDocumentFragment();
  results.forEach((result) => {
    let clone = document
      .getElementById("card-template")
      .content.cloneNode(true);
    clone.querySelector("div.user-card").id = `movieId${result.id}`;
    // anchor
    let a = clone.querySelector("a.btn-watch");
    a.id = `wtch${result.id}`;
    a.href = `./view.html?movieId=${result.id}`;
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
      // let a = document.querySelector(`a#${ev.data.movieId}`);
      // a.classList.add("");
    }
    if (ev.data.action === "removeFromCartSuccess") {
    }
    if (ev.data.action === "checkoutSuccess") {
    }
    if (ev.data.action === "watchedSuccess") {
    }
    if (ev.data.action === "getCartAllSuccess") {
      movieArray = ev.data.movieArray;
    }
    if (ev.data.action === "getRentAllSuccess") {
      movieArray = ev.data.movieArray;
      createCards(movieArray);
    }
  }
}

function getMovieArray() {
  let msg = {
    action: "getRentAll",
  };
  sendMessage(msg);
}

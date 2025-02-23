let movieArray;
(() => {
  console.log("cart.js loaded!");

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.addEventListener("message", gotMessage);
  }

  // sendMessage({ action: "checkout" });

  getMovieArray();
})();

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
    // if (ev.data.action === "addToCartSuccess") {

    // }
    if (ev.data.action === "removeFromCartSuccess") {
      let remv = document.getElementById(`remv${ev.data.movieId}`);
      if (remv) {
        document.getElementById(`rent${ev.data.movieId}`).remove();
        remv.textContent = "Removed";
      }
    }
    if (ev.data.action === "rentSuccess") {
      let rent = document.getElementById(`rent${ev.data.movieId}`);
      if (rent) {
        document.getElementById(`remv${ev.data.movieId}`).remove();
        rent.textContent = "Rented";
      }
    }
    // if (ev.data.action === "watchedSuccess") {
    // }
    if (ev.data.action === "getCartAllSuccess") {
      movieArray = ev.data.movieArray;
      createCards(movieArray);
    }
  }
}

function createCards(movieArray) {
  let emptyMsg = document.querySelector(".empty-msg");
  if (movieArray.length > 0) {
    if (emptyMsg) {
      document.querySelector(".empty-msg").classList.add("inactive");
    }
    let frag = document.createDocumentFragment();
    movieArray.forEach((result) => {
      let clone = document
        .getElementById("card-template")
        .content.cloneNode(true);

      clone.querySelector("div.user-card").id = `movieId${result.id}`;

      // anchor
      let remove = clone.querySelector("a.btn-remove");
      remove.setAttribute("id", `remv${result.id}`);
      remove.addEventListener("click", handleRemoveClick);

      let rent = clone.querySelector("a.btn-rent");
      rent.setAttribute("id", `rent${result.id}`);
      rent.addEventListener("click", handleRentClick);
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
  } else {
    if (emptyMsg) {
      emptyMsg.classList.remove("inactive");
    }
  }
}

function getMovieArray() {
  let msg = {
    action: "getCartAll",
  };
  sendMessage(msg);
}

function handleRemoveClick(ev) {
  ev.preventDefault();
  let a = ev.currentTarget;
  let msg = {
    action: "removeFromCart",
    movieId: a.id.substring(4),
  };
  sendMessage(msg);
}

function handleRentClick(ev) {
  ev.preventDefault();
  let a = ev.currentTarget;
  let msg = {
    action: "rent",
    movieId: a.id.substring(4),
  };
  sendMessage(msg);
}

//IIFE
(async () => {
  console.log("main.js loaded!");
  setUpWorker();

  if ("serviceWorker" in navigator) {
    sendMessage({});
    navigator.serviceWorker.addEventListener("message", gotMessage);
  }

  pageSpecific();
})();

function setUpWorker() {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("./sw.js");
  }
}

function pageSpecific() {
  let id = document.body.id; // checks the id of the body element, and then matches the id name to the js file
  switch (id) {
    case "index-html":
      import("./index.js");
      // import("./search.js");
      break;
    case "search-html":
      import("./search.js");
      break;
    case "cart-html":
      import("./cart.js");
      break;
    case "rent-html":
      import("./rent.js");
      break;
    case "view-html":
      import("./view.js");
      break;
    default:
  }
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
    if (ev.data.action === "iconCount") {
      let div = document.querySelector(".cart-icon > div");
      if (div) {
        if (ev.data.cartCount > 0) {
          div.style.display = "block";
          div.textContent = ev.data.cartCount;
        } else {
          div.style.display = "none";
        }
      }
      div = document.querySelector(".rent-icon > div");
      if (div) {
        if (ev.data.rentCount > 0) {
          div.style.display = "block";
          div.textContent = ev.data.rentCount;
        } else {
          div.style.display = "none";
        }
      }
    }
    if (ev.data.action === "isOnline") {
      let offline = document.querySelector(".offline");
      if (offline) {
        if (ev.data.isOnline) {
          offline.classList.add("inactive");
        } else {
          offline.classList.remove("inactive");
        }
      }
    }
  }
}

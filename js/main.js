//IIFE
(async () => {
  console.log("main.js loaded!");
  // setUpWorker();
  // const input = getSearchQuery();
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
      import("./rent.js");
      break;
    default:
  }
}

// function getSearchQuery() {
//   let searchField = document.getElementById("search");
//   let url = new URL(location.href);
//   let input = url.searchParams.get("search");
//   if (input) {
//     searchField.value = input;
//   }
//   return input;
// }

function sendMessage(msg) {
  //send a message to the service worker
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.ready.then((reg) => {
      reg.active.postMessage(msg);
    });
  }
}

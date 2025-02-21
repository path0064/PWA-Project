import * as fh from "./fetch.js";
(() => {
  console.log("view.js loaded");
})();

function sendMessage(msg) {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.ready.then((reg) => {
      reg.active.postMessage(msg);
    });
  }
}

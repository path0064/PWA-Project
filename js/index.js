import * as fh from "./index.js";
(() => {
  console.log("index.js loaded");
})();

function sendMessage(msg) {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.ready.then((reg) => {
      reg.active.postMessage(msg);
    });
  }
}

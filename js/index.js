(() => {
  console.log("index.js loaded!");
})();

function sendMessage(msg) {
  //send a message to the service worker
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.ready.then((reg) => {
      reg.active.postMessage(msg);
    });
  }
}

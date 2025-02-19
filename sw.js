const version = 1;
const appCache = "movie:cineholic_" + version;
const cartCache = "movie:cart_" + version;
const rentedCache = "movie:rented_" + version;
const imagesCache = "movie:images_" + version;
const searchCache = "movie:search_" + version;

const appFiles = [
  "/",
  "/index.html",
  "/cart.html",
  "/css/main.css",
  "/js/main.js",
];

self.addEventListener("install", (ev) => {
  ev.waitUntil(
    caches.open(appCache).then((cache) => {
      cache.addAll(appFiles);
    })
  );
  console.log("service worker installed!");
});

self.addEventListener("activate", (ev) => {
  caches.keys().then((cacheList) => {
    return Promise.all(
      cacheList
        .filter(
          (cache) =>
            ![
              appCache,
              cartCache,
              rentedCache,
              imagesCache,
              searchCache,
            ].includes(cache)
        )
        .map((cache) => caches.delete(cache))
    );
  });
});

self.addEventListener("message", (ev) => {
  if ("action" in ev.data) {
    // if (ev.data.action == "addToCart") {

    // }
    // if (ev.data.action == "removeFromCart") {

    // }
    switch (ev.data.action) {
      case "addToCart":
        addToCart(ev.data.movieId);
        break;
      case "removeFromCart":
        removeFromCart(ev.data.movieId);
        break;
      case "checkout":
        checkout();
        break;
      case "watched":
        watched(ev.data.movieId);
        break;
    }
  }
});

function sendMessage(msg, clientId) {
  if (clientId) {
    self.clients
      .get(clientId)
      .then((client) => {
        if (client) {
          client.postMessage(msg);
        } else {
          console.warn(`Client with ID ${clientId} not found.`);
        }
      })
      .catch((error) =>
        console.error(`Error getting client with ID ${clientId}:`, error)
      );
  } else {
    self.clients
      .matchAll()
      .then((clientList) => {
        for (let client of clientList) {
          client.postMessage(msg);
        }
      })
      .catch((error) => console.error("Error retrieving client:", error));
  }
}

function cacheOnly(ev) {
  //only the response from the cache
  return caches.match(ev.request);
}

function cacheFirst(ev) {
  //try cache then fetch
  return caches.match(ev.request).then((cacheResponse) => {
    return cacheResponse || fetch(ev.request);
  });
}

function networkOnly(ev) {
  //only the result of a fetch
  return fetch(ev.request);
}

function networkFirst(ev) {
  //try fetch then cache
  return fetch(ev.request).then((response) => {
    if (response.status > 0 && !response.ok) return caches.match(ev.request);
    return response;
  });
}

function staleWhileRevalidate(ev, cacheName) {
  //return cache then fetch and save latest fetch
  return caches.match(ev.request).then((cacheResponse) => {
    let fetchResponse = fetch(ev.request).then((response) => {
      return caches.open(cacheName).then((cache) => {
        cache.put(ev.request, response.clone());
        return response;
      });
    });
    return cacheResponse || fetchResponse;
  });
}

function networkFirstAndRevalidate(ev) {
  //attempt fetch and cache result too
  return fetch(ev.request).then((response) => {
    if (response.status > 0 && !response.ok) return caches.match(ev.request);
    //accept opaque responses with status code 0
    //still save a copy
    return caches.open(cacheName).then((cache) => {
      cache.put(ev.request, response.clone());
      return response; //send the fetch response to the web page/script
    });
  });
}

let isOnline = true;
self.addEventListener("online", (ev) => {
  isOnline = true;
});

self.addEventListener("offline", (ev) => {
  isOnline = false;
});

self.addEventListener("fetch", (ev) => {
  let mode = ev.request.mode; // navigate, cors, no-cors
  let method = ev.request.method; //get the HTTP method
  let url = new URL(ev.request.url); //turn the url string into a URL object
  let params = url.searchParams; //params.has('id') params.get("id") params.set("id")
  // let queryString = new URLSearchParams(url.search); //turn query string into an Object
  // let isOnline = navigator.onLine; //determine if the browser is currently offline
  let online = navigator.onLine && isOnline;
  let isImage =
    url.pathname.includes(".png") ||
    url.pathname.includes(".jpg") ||
    url.pathname.includes(".ico") ||
    url.pathname.includes(".svg") ||
    url.pathname.includes(".gif") ||
    url.pathname.includes(".webp") ||
    url.pathname.includes(".jpeg") ||
    url.hostname.includes("some.external.image.site"); //check file extension or location

  let isAPI = url.hostname.includes("api.themoviedb.org");
  let isAPIImage = url.hostname.includes("image.tmdb.org");
  let selfLocation = new URL(self.location);
  //determine if the requested file is from the same origin as your website
  let isRemote = selfLocation.origin !== url.origin;

  if (online) {
    //online
    if (isImage && isAPIImage) {
      ev.respondWith(staleWhileRevalidate(ev, imgCache));
      console.log({ imgCache });
      console.log({ appCache });
    } else if (isAPI) {
      ev.respondWith(fetchAndCache(ev, appCache));
    } else {
      respondWith(staleWhileRevalidate(ev, appCache));
    }
    ev.respondWith(staleWhileRevalidate(ev, appCache));
  } else {
    //offline
    ev.respondWith(cacheOnly(ev));
  }
});

function fetchAndCache(ev, cacheName) {
  return fetch(ev.request).then(async (fetchResponse) => {
    await caches.open(cacheName).then((cache) => {
      cache.put(ev.request, fetchResponse.clone());
    });
    return fetchResponse;
  });
}

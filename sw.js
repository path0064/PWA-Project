const version = 3;
const appCache = "movie:cineholic_" + version;
const cartCache = "movie:cart_" + version;
const rentedCache = "movie:rented_" + version;
const imagesCache = "movie:images_" + version;
const searchCache = "movie:search_" + version;

const appFiles = [
  "/",
  "/index.html",
  // "/search.html",
  "/cart.html",
  "/rent.html",
  "/view.html",
  "/css/main.css",
  "/js/main.js",
  // "/js/search.js",
  // "/js/fetch.js",
  "/js/index.js",
  "/js/cart.js",
  "/js/rent.js",
  "/js/view.js",
  // "/videos/placeholder-vid.mp4",
  "/videos/placeholdervid.mp4",
  "/images/Searchicon2.svg",
  // "/images/Search.svg",
  "/images/search-icons.svg",
  // "/images/search-icon.svg",
  "/images/s-l1200.jpg",
  // "/images/ri_search-line.svg",
  "/images/rents-empty.svg",
  "/images/placeholderimg.svg",
  "/images/offline-warning.svg",
  "/images/Movie.svg",
  "/images/Movie-appLogo.svg",
  "/images/Home.svg",
  "/images/half-star.svg",
  "/images/full-star.svg",
  "/images/empty-star.svg",
  "/images/empty-cart.svg",
  "/images/Cart.svg",
  "/images/512.png",
  "/images/192.png",
];

self.addEventListener("install", (ev) => {
  ev.waitUntil(
    caches.open(appCache).then((cache) => {
      cache.addAll(appFiles);
    })
  );
  self.skipWaiting();
  console.log("service worker installed!");
});

self.addEventListener("activate", (ev) => {
  ev.waitUntil(self.clients.claim());
  console.log("service worker activated!");
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

self.addEventListener("message", async (ev) => {
  if ("action" in ev.data) {
    switch (ev.data.action) {
      case "addToCart":
        await addToCart(ev.data.movieId);
        break;
      case "removeFromCart":
        await removeFromCart(ev.data.movieId);
        break;
      case "rent":
        await rent(ev.data.movieId);
        break;
      case "watched":
        await watched(ev.data.movieId);
        break;
      case "getCartAll":
        await getCartAll();
        break;
      case "getRentAll":
        await getRentAll();
        break;
      case "watch":
        await watch(ev.data.movieId);
    }
  }
  iconCount();
  isOnlineFunc();
});

function sendMessage(msg, clientId) {
  //client is falsey means send to all
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
    let fetchResponse = fetch(ev.request)
      .then((res) => {
        if (!res.ok) {
          throw new Error("There was an error fetching the response,");
        }
        return res;
      })
      .then((response) => {
        return caches.open(cacheName).then((cache) => {
          cache.put(ev.request, response.clone()).catch((err) => {
            throw new Error("There was an error caching the response", err);
          });
          return response;
        });
      });
    return cacheResponse || fetchResponse;
  });
}

async function networkFirstAndRevalidate(ev, cacheName) {
  //attempt fetch and cache result too
  return fetch(ev.request).then(async (response) => {
    if (response.status > 0 && !response.ok) return caches.match(ev.request);
    //accept opaque responses with status code 0
    //still save a copy
    return caches.open(cacheName).then((cache) => {
      cache.put(ev.request, response.clone());
      return response; //send the fetch response to the web page/script
    });
  });
}

async function fetchAndCache(ev, cacheName) {
  return fetch(ev.request).then(async (fetchResponse) => {
    await caches.open(cacheName).then((cache) => {
      cache.put(ev.request, fetchResponse.clone());
    });
    return fetchResponse;
  });
}

async function searchFetchAndCache(ev, cacheName) {
  return fetch(ev.request).then(async (fetchResponse) => {
    await caches.open(cacheName).then(async (cache) => {
      let cloneObj = await fetchResponse.clone().json();
      cloneObj.results.forEach((result) => {
        let req = new Request(`/movie/${result.id}`);
        let res = new Response(JSON.stringify(result), {
          headers: { "Content-Type": "application/json" },
        });
        cache.put(req, res);
      });
    });
    return fetchResponse;
  });
}

async function searchCacheOnlyAll(ev, cacheName) {
  let resultArray = [];
  await caches.open(cacheName).then(async (cache) => {
    let keys = await cache.keys();
    for (let i = keys.length - 1; i > -1; i--) {
      let match = await cache.match(keys[i]);
      let result = await match.json();
      resultArray.push(result);
    }
  });
  let res = new Response(JSON.stringify({ results: resultArray }), {
    headers: { "Content-Type": "application/json" },
  });
  return res;
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
  let isSearch = url.pathname.includes("search");
  let selfLocation = new URL(self.location);
  //determine if the requested file is from the same origin as your website
  let isRemote = selfLocation.origin !== url.origin;
  let isGoogle =
    url.hostname.includes("apis.google.com") ||
    url.hostname.includes("fonts.googleapis.com") ||
    url.hostname.includes("fonts.gstatic.com");
  if (isGoogle) {
    console.log(url);
  }

  if (online) {
    online;
    if (isImage && isAPIImage) {
      ev.respondWith(networkFirstAndRevalidate(ev, imagesCache));
    } else if (isSearch && isAPI) {
      ev.respondWith(searchFetchAndCache(ev, searchCache));
    } else if (isGoogle) {
      ev.respondWith(fetchAndCache(ev, appCache));
    } else {
      // ev.respondWith(networkOnly(ev));
      ev.respondWith(staleWhileRevalidate(ev, appCache));
    }
  } else {
    //offline
    if (isSearch && isAPI) {
      ev.respondWith(searchCacheOnlyAll(ev, searchCache));
    } else {
      ev.respondWith(cacheOnly(ev));
    }
  }
});

async function addToCart(movieId) {
  let sCache = await caches.open(searchCache);
  let match = await sCache.match(`/movie/${movieId}`);
  if (match) {
    let cCache = await caches.open(cartCache);
    await cCache.put(`/movie/${movieId}`, match);

    let msg = { action: "addToCartSuccess", movieId: movieId };
    sendMessage(msg);
    getCartAll();
  }
}

async function removeFromCart(movieId) {
  let cCache = await caches.open(cartCache);
  let test = await cCache.delete(`/movie/${movieId}`);
  if (test) {
    let msg = { action: "removeFromCartSuccess", movieId: movieId };
    sendMessage(msg);
  }
}

async function rent(movieId) {
  let cCache = await caches.open(cartCache);
  let rCache = await caches.open(rentedCache);

  let match = await cCache.match(`/movie/${movieId}`);

  if (match) {
    cCache.delete(`/movie/${movieId}`);
    rCache.put(`/movie/${movieId}`, match);
    let msg = { action: "rentSuccess", movieId: movieId };
    sendMessage(msg);
    getRentAll();
  }
}

async function watched(movieId) {
  let rCache = await caches.open(rentedCache);
  let test = await rCache.delete(`/movie/${movieId}`);

  if (test) {
    let msg = {
      action: "watchedSuccess",
      movieId: movieId,
    };
    sendMessage(msg);
  }
}

async function getCartAll() {
  let cCache = await caches.open(cartCache);

  let matches = await cCache.matchAll();
  let movieArray = [];
  if (matches) {
    for (let match of matches) {
      let movie = await match.json();
      movieArray.push(movie);
    }
    let msg = {
      action: "getCartAllSuccess",
      movieArray: movieArray,
      length: movieArray.length,
    };
    sendMessage(msg);
  }
}

async function getRentAll() {
  let rCache = await caches.open(rentedCache);

  let matches = await rCache.matchAll();
  let movieArray = [];
  if (matches) {
    for (let match of matches) {
      let movie = await match.json();
      movieArray.push(movie);
    }
    let msg = {
      action: "getRentAllSuccess",
      movieArray: movieArray,
      length: movieArray.length,
    };
    sendMessage(msg);
  }
}

async function watch(movieId) {
  let rCache = await caches.open(rentedCache);
  let match = await rCache.match(`/movie/${movieId}`);
  let msg;
  if (match) {
    let movie = await match.json();
    msg = {
      action: "watchSuccess",
      movieInfo: movie,
    };
  } else {
    msg = {
      action: "watchSuccess",
      movieInfo: 0,
    };
  }
  sendMessage(msg);
}

async function iconCount() {
  let cCache = await caches.open(cartCache);
  let ckeys = await cCache.keys();
  let rCache = await caches.open(rentedCache);
  let rkeys = await rCache.keys();
  let msg = {
    action: "iconCount",
    cartCount: ckeys.length,
    rentCount: rkeys.length,
  };
  sendMessage(msg);
}

function isOnlineFunc() {
  let online = navigator.onLine && isOnline;
  let msg = { action: "isOnline", isOnline: online };
  sendMessage(msg);
}

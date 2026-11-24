importScripts("/src/js/idb.js");
importScripts("/src/js/utility.js");

var CACHE_STATIC_NAME = "static-v8";
var CACHE_DYNAMIC_NAME = "dynamic-v8";
var STATIC_FILES = [
  "/",
  "/manifest.json",
  "/offline.html",
  "/index.html",
  "/help.html",
  "/src/js/app.js",
  "/src/js/feed.js",
  "/src/js/idb.js",
  "/src/js/utility.js",
  "/src/css/app.css",
  "/src/css/help.css",
  "/src/css/feed.css",
  "/src/images/main-image-lg.jpg",
  "/src/images/sf-boat.jpg",
  "/src/images/icons/icon-192x192.png",
  "/src/images/icons/icon-512x512.png",
  "https://fonts.googleapis.com/css?family=Roboto:400,700",
  "https://fonts.googleapis.com/icon?family=Material+Icons",
  "https://cdnjs.cloudflare.com/ajax/libs/material-design-lite/1.3.0/material.indigo-pink.min.css",
];

var url = "https://uteqgram-24428-default-rtdb.firebaseio.com/post.json";
var STORAGE_BUCKET = "uteqgram-24428.firebasestorage.app";

function uploadImageInSw(file, postId) {
  if (!file) {
    return Promise.resolve("/src/images/sf-boat.jpg");
  }

  var fileName = encodeURIComponent("posts/" + postId + ".jpg");
  var uploadUrl =
    "https://firebasestorage.googleapis.com/v0/b/" +
    STORAGE_BUCKET +
    "/o?uploadType=media&name=" +
    fileName;

  return fetch(uploadUrl, {
    method: "POST",
    headers: {
      "Content-Type": file.type || "image/jpeg",
    },
    body: file,
  })
    .then(function (res) {
      if (!res.ok) {
        throw new Error("Error subiendo imagen en SW: " + res.status);
      }
      return res.json();
    })
    .then(function (data) {
      return (
        "https://firebasestorage.googleapis.com/v0/b/" +
        STORAGE_BUCKET +
        "/o/" +
        encodeURIComponent(data.name) +
        "?alt=media&token=" +
        data.downloadTokens
      );
    });
}

self.addEventListener("install", function (event) {
  console.log("[Service Worker] Installing Service Worker...", event);
  event.waitUntil(
    caches.open(CACHE_STATIC_NAME).then(function (cache) {
      console.log("[Service Worker] Precaching App Shell");
      return cache.addAll(STATIC_FILES);
    }),
  );
});

self.addEventListener("activate", function (event) {
  console.log("[Service Worker] Activating Service Worker...", event);
  event.waitUntil(
    caches.keys().then(function (keyList) {
      return Promise.all(
        keyList.map(function (key) {
          if (key !== CACHE_STATIC_NAME && key !== CACHE_DYNAMIC_NAME) {
            console.log("[Service Worker] Removing old cache...", key);
            return caches.delete(key);
          }
        }),
      );
    }),
  );
  return self.clients.claim();
});

function isInArray(string, array) {
  var cachePath;
  if (string.indexOf(self.origin) === 0) {
    cachePath = string.substring(self.origin.length);
  } else {
    cachePath = string;
  }
  return array.indexOf(cachePath) > -1;
}

self.addEventListener("fetch", function (event) {
  // No interceptar ni cachear peticiones POST/PUT/DELETE
  if (event.request.method !== "GET") {
    return;
  }

  if (event.request.url.indexOf(url) > -1) {
    event.respondWith(
      fetch(event.request).then(function (res) {
        if (res.ok) {
          var clonedRes = res.clone();
          clearAllData("post")
            .then(function () {
              return clonedRes.json();
            })
            .then(function (data) {
              for (var key in data) {
                if (data[key] && data[key].id) {
                  writeData("post", data[key]);
                }
              }
            });
        }
        return res;
      }),
    );
  } else if (isInArray(event.request.url, STATIC_FILES)) {
    event.respondWith(caches.match(event.request));
  } else {
    event.respondWith(
      caches.match(event.request).then(function (response) {
        if (response) {
          return response;
        } else {
          return fetch(event.request)
            .then(function (res) {
              return caches.open(CACHE_DYNAMIC_NAME).then(function (cache) {
                cache.put(event.request.url, res.clone());
                return res;
              });
            })
            .catch(function () {
              return caches.open(CACHE_STATIC_NAME).then(function (cache) {
                return cache.match("/offline.html");
              });
            });
        }
      }),
    );
  }
});

self.addEventListener("sync", function (event) {
  console.log("[Service Worker] Background syncing", event);
  if (event.tag === "post-data-sync") {
    console.log("[Service Worker] Syncing new Posts");
    event.waitUntil(
      readAllData("sync-post").then(function (data) {
        return Promise.all(
          data.map(function (dt) {
            return uploadImageInSw(dt.picture, dt.id)
              .then(function (imageUrl) {
                return fetch(url, {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                  },
                  body: JSON.stringify({
                    id: dt.id,
                    title: dt.title,
                    location: dt.location,
                    image: imageUrl,
                  }),
                });
              })
              .then(function (res) {
                console.log("Sent data", res);
                if (res.ok) {
                  deleteItemFromData("sync-post", dt.id);
                  if (Notification.permission === "granted") {
                    return self.registration.showNotification(
                      "Momento publicado",
                      {
                        body:
                          'Tu publicación "' +
                          dt.title +
                          '" ya se sincronizó en UTEQGram.',
                        icon: "/src/images/icons/icon-192x192.png",
                      },
                    );
                  }
                }
              })
              .catch(function (err) {
                console.log("Error while sending data", err);
              });
          }),
        );
      }),
    );
  }
});

self.addEventListener("notificationclick", function (event) {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: "window" }).then(function (clis) {
      var client = clis.find(function (c) {
        return c.visibilityState === "visible";
      });
      if (client) {
        client.navigate("/");
        client.focus();
      } else {
        clients.openWindow("/");
      }
    }),
  );
});

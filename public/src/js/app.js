var deferredPrompt = null;

if ("serviceWorker" in navigator) {
  navigator.serviceWorker
    .register("/sw.js")
    .then(function () {
      console.log("Service Worker registrado");
    })
    .catch(function (error) {
      console.error("Error al registrar el Service Worker:", error);
    });
}

window.addEventListener("beforeinstallprompt", function (event) {
  event.preventDefault();
  deferredPrompt = event;
  return false;
});

var enableNotificationsButtons = document.querySelectorAll(
  ".enable-notifications",
);

function displayConfirmNotification() {
  if ("serviceWorker" in navigator && Notification.permission === "granted") {
    var options = {
      body: "Las notificaciones de UTEQGram están activas.",
      icon: "/src/images/icons/icon-192x192.png",
      badge: "/src/images/icons/icon-192x192.png",
      dir: "ltr",
      lang: "es-MX",
      vibrate: [100, 50, 200],
      tag: "confirm-notification",
      renotify: true,
    };

    navigator.serviceWorker.ready.then(function (swreg) {
      swreg.showNotification("¡Notificaciones activadas!", options);
    });
  }
}

function askForNotificationPermission() {
  Notification.requestPermission().then(function (result) {
    console.log("Decisión del usuario:", result);
    if (result === "granted") {
      displayConfirmNotification();
    } else {
      console.log("Permiso de notificaciones denegado.");
    }
  });
}

if ("Notification" in window) {
  for (var i = 0; i < enableNotificationsButtons.length; i++) {
    enableNotificationsButtons[i].style.display = "inline-block";
    enableNotificationsButtons[i].addEventListener(
      "click",
      askForNotificationPermission,
    );
  }
}

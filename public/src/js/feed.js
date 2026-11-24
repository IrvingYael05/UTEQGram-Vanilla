var shareImageButton = document.getElementById("share-image-button");
var createPostArea = document.getElementById("create-post");
var sharedMomentsArea = document.getElementById("shared-moments");
var closeCreatePostModalButton = document.getElementById(
  "close-create-post-modal-btn",
);
var form = document.querySelector("form");
var titleInput = document.getElementById("title");
var locationInput = document.getElementById("location");
var url = "https://uteqgram-24428-default-rtdb.firebaseio.com/post.json";
var STORAGE_BUCKET = "uteqgram-24428.firebasestorage.app";
var networkDataReceived = false;

// --- Referencias de cámara ---
var videoPlayer = document.querySelector("#player");
var canvasElement = document.querySelector("#canvas");
var captureButton = document.querySelector("#capture-btn");
var imagePicker = document.querySelector("#image-picker");
var imagePickerArea = document.querySelector("#pick-image");
var picture = null;

function openCreatePostModal() {
  createPostArea.style.display = "block";
  createPostArea.style.transform = "translateY(0)";
  initializeMedia();

  if (typeof deferredPrompt !== "undefined" && deferredPrompt) {
    deferredPrompt.prompt();
    deferredPrompt.userChoice.then(function (choiceResult) {
      console.log(choiceResult.outcome);
      deferredPrompt = null;
    });
  }
}

function closeCreatePostModal() {
  stopCamera();
  createPostArea.style.transform = "translateY(100vh)";
  createPostArea.style.display = "none";
  videoPlayer.style.display = "none";
  canvasElement.style.display = "none";
  captureButton.style.display = "none";
  imagePickerArea.style.display = "none";
}

shareImageButton.addEventListener("click", openCreatePostModal);
closeCreatePostModalButton.addEventListener("click", closeCreatePostModal);

function clearCards() {
  while (sharedMomentsArea.hasChildNodes()) {
    sharedMomentsArea.removeChild(sharedMomentsArea.lastChild);
  }
}

function createCard(data) {
  var cardWrapper = document.createElement("div");
  cardWrapper.className = "shared-moment-card mdl-card mdl-shadow--2dp";

  var cardTitle = document.createElement("div");
  cardTitle.className = "mdl-card__title";
  var validImage =
    typeof data.image === "string" && data.image.trim() !== ""
      ? data.image
      : "/src/images/sf-boat.jpg";
  cardTitle.style.backgroundImage = "url('" + validImage + "')";
  cardTitle.style.backgroundSize = "cover";
  cardTitle.style.backgroundPosition = "center";
  cardTitle.style.height = "180px";
  cardWrapper.appendChild(cardTitle);

  var cardTitleTextElement = document.createElement("h2");
  cardTitleTextElement.style.color = "white";
  cardTitleTextElement.className = "mdl-card__title-text";
  cardTitleTextElement.textContent = data.title;
  cardTitle.appendChild(cardTitleTextElement);

  var cardSupportingText = document.createElement("div");
  cardSupportingText.className = "mdl-card__supporting-text";
  cardSupportingText.textContent = data.location;
  cardSupportingText.style.textAlign = "center";
  cardWrapper.appendChild(cardSupportingText);

  componentHandler.upgradeElement(cardWrapper);
  sharedMomentsArea.appendChild(cardWrapper);
}

function updateUI(data) {
  clearCards();
  for (var i = 0; i < data.length; i++) {
    createCard(data[i]);
  }
}

function fetchPostsFromWeb() {
  fetch(url)
    .then(function (res) {
      return res.json();
    })
    .then(function (data) {
      networkDataReceived = true;
      console.log("From web", data);
      var dataArray = [];
      for (var key in data) {
        if (data[key] && data[key].id) {
          dataArray.push(data[key]);
        }
      }
      updateUI(dataArray);
    });
}

function sendData(capturedPicture, title, location) {
  var postId = new Date().toISOString();

  uploadImageToStorage(capturedPicture, postId)
    .then(function (imageUrl) {
      return fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          id: postId,
          title: title,
          location: location,
          image: imageUrl,
        }),
      });
    })
    .then(function (res) {
      console.log("Sent data", res);
      fetchPostsFromWeb();
    })
    .catch(function (err) {
      console.error("Error enviando publicación:", err);
    });
}

form.addEventListener("submit", function (event) {
  event.preventDefault();

  var titleVal = titleInput.value.trim();
  var locationVal = locationInput.value.trim();

  if (titleVal === "" || locationVal === "") {
    alert("Please enter valid data!");
    return;
  }

  var capturedPicture = picture;
  picture = null;
  titleInput.value = "";
  locationInput.value = "";
  imagePicker.value = "";
  closeCreatePostModal();

  if ("serviceWorker" in navigator && "SyncManager" in window) {
    navigator.serviceWorker.ready.then(function (sw) {
      var post = {
        id: new Date().toISOString(),
        title: titleVal,
        location: locationVal,
        picture: capturedPicture,
      };

      writeData("sync-post", post)
        .then(function () {
          return sw.sync.register("post-data-sync");
        })
        .then(function () {
          var snackbarContainer = document.getElementById("confirmation-toast");
          var data = { message: "Your Post was saved for syncing!" };
          snackbarContainer.MaterialSnackbar.showSnackbar(data);

          if (
            "Notification" in window &&
            Notification.permission === "granted"
          ) {
            sw.showNotification("Publicación en cola", {
              body:
                'Tu publicación "' +
                post.title +
                '" se ha guardado para sincronización en UTEQGram.',
              icon: "/src/images/icons/icon-192x192.png",
            });
          }
        })
        .catch(function (err) {
          console.log(err);
        });
    });
  } else {
    sendData(capturedPicture, titleVal, locationVal);
  }
});

fetchPostsFromWeb();

if ("indexedDB" in window) {
  readAllData("post").then(function (data) {
    if (!networkDataReceived) {
      console.log("From cache", data);
      updateUI(data);
    }
  });
}

// --- Funciones de cámara y Storage ---
function initializeMedia() {
  if (!("mediaDevices" in navigator)) {
    navigator.mediaDevices = {};
  }

  if (!("getUserMedia" in navigator.mediaDevices)) {
    imagePickerArea.style.display = "block";
    return;
  }

  navigator.mediaDevices
    .getUserMedia({ video: { facingMode: "environment" } })
    .then(function (stream) {
      videoPlayer.srcObject = stream;
      videoPlayer.style.display = "block";
      captureButton.style.display = "block";
      imagePickerArea.style.display = "block";
    })
    .catch(function (err) {
      console.warn("Cámara no disponible o permiso denegado:", err);
      imagePickerArea.style.display = "block";
    });
}

function stopCamera() {
  if (videoPlayer.srcObject) {
    videoPlayer.srcObject.getVideoTracks().forEach(function (track) {
      track.stop();
    });
    videoPlayer.srcObject = null;
  }
}

captureButton.addEventListener("click", function () {
  canvasElement.style.display = "block";
  videoPlayer.style.display = "none";
  captureButton.style.display = "none";

  var context = canvasElement.getContext("2d");
  context.drawImage(
    videoPlayer,
    0,
    0,
    canvasElement.width,
    videoPlayer.videoHeight / (videoPlayer.videoWidth / canvasElement.width) ||
      canvasElement.height,
  );

  stopCamera();

  canvasElement.toBlob(
    function (blob) {
      picture = blob;
    },
    "image/jpeg",
    0.85,
  );
});

imagePicker.addEventListener("change", function (event) {
  picture = event.target.files[0];
});

function uploadImageToStorage(file, postId) {
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
      if (!res.ok)
        throw new Error("Error subiendo imagen a Storage: " + res.status);
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

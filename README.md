# UTEQGram (PWA - Vanilla JavaScript)

**UTEQGram** es una Aplicación Web Progresiva (PWA) desarrollada con JavaScript puro (sin frameworks) para compartir momentos fotográficos dentro del campus de la **Universidad Tecnológica de Querétaro (UTEQ)**. La aplicación funciona tanto en línea como sin conexión, integrando captura fotográfica mediante cámara, notificaciones del sistema, persistencia local con IndexedDB y sincronización en segundo plano hacia Firebase.

---

## Características Principales

- **Instalable (PWA):** Configurada con `manifest.json`, íconos adaptables (`192x192` y `512x512`), modo `standalone` y captura del evento `beforeinstallprompt`.
- **Soporte Offline (App Shell):** Precaché de vistas, hojas de estilo, scripts e imágenes críticas a través de un Service Worker (`sw.js`) con página de respaldo (`offline.html`).
- **Renderizado del Lado del Cliente (CSR):** Generación dinámica de tarjetas en el feed a partir de datos remotos o locales.
- **Datos Locales, Remotos y Sincronización:**
  - **Remoto:** Firebase Realtime Database (metadatos de publicaciones) y Firebase Cloud Storage (fotografías).
  - **Local:** IndexedDB (`post-store`) con las tablas `post` (caché de lectura offline) y `sync-post` (cola de publicaciones pendientes).
  - **Background Sync:** Subida automática de imágenes a Storage y publicación en Realtime Database en cuanto el dispositivo recupera conexión a internet.
- **Hardware y Notificaciones:**
  - Captura directa con la cámara del dispositivo mediante `MediaDevices API` (`getUserMedia`) y procesamiento en `<canvas>` (con selector de galería como respaldo).
  - Permisos y despliegue de notificaciones gestionadas desde el Service Worker (`Notification API`).

---

## Tecnologías Utilizadas

- **Frontend:** HTML5, CSS3, JavaScript (Vanilla) y Material Design Lite (MDL).
- **APIs Web / PWA:** Service Workers, Cache API, Web App Manifest, IndexedDB (`idb.js`), Background Sync API, MediaDevices API, Canvas API y Notification API.
- **Backend & Despliegue:** Firebase Realtime Database, Firebase Cloud Storage y Firebase Hosting (HTTPS).
- **Entorno Local:** Node.js y `http-server`.

---

## Estructura del Proyecto

```text
UTEQGram-Vanilla/
├── public/
│   ├── index.html              # Pantalla principal (Home / Feed + modal de nueva publicación)
│   ├── help.html               # Pantalla secundaria (Ayuda / Acerca de)
│   ├── offline.html            # Vista de respaldo sin conexión
│   ├── 404.html                # Manejo de rutas inexistentes
│   ├── manifest.json           # Metadatos e íconos de la PWA
│   ├── sw.js                   # Service Worker (caché, fetch, sync y notificaciones)
│   └── src/
│       ├── css/
│       │   ├── app.css
│       │   ├── feed.css
│       │   └── help.css
│       ├── js/
│       │   ├── app.js          # Registro del SW, prompt de instalación y notificaciones
│       │   ├── feed.js         # Lógica del feed CSR, cámara, Storage y Background Sync
│       │   ├── idb.js          # Wrapper de promesas para IndexedDB
│       │   └── utility.js      # Funciones CRUD para IndexedDB
│       └── images/
│           └── icons/          # Íconos PWA (192x192 y 512x512)
├── firebase.json               # Configuración de Firebase Hosting
├── .firebaserc                 # Proyecto de Firebase vinculado
├── package.json                # Dependencias y scripts locales
└── README.md
```

---

## Instalación y Ejecución Local

1. **Clonar el repositorio:**
   ```bash
   git clone https://github.com/IrvingYael05/UTEQGram-Vanilla.git
   cd UTEQGram-Vanilla
   ```

2. **Instalar dependencias:**
   ```bash
   npm install
   ```

3. **Ejecutar el servidor local:**
   ```bash
   npm start
   ```
   *(El script levanta `http-server` con `-c-1` para deshabilitar la caché HTTP en desarrollo).*

4. **Abrir en el navegador:**
   Accede a `http://localhost:8080` en Google Chrome para probar el Service Worker, IndexedDB, cámara y notificaciones.

---

## Despliegue en Producción

El proyecto se encuentra publicado mediante **Firebase Hosting** con certificado HTTPS automático:

- **URL de la aplicación:** `https://uteqgram-24428.web.app/`

Para volver a desplegar cambios desde la terminal:
```bash
firebase deploy
```

---

## Autor

**Irving Yael Vázquez Serrano**  
Ingeniería en Desarrollo y Gestión de Software — Universidad Tecnológica de Querétaro (UTEQ)
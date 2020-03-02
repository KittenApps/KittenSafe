// This optional code is used to register a service worker.
// register() is not called by default.

// This lets the app load faster on subsequent visits in production, and gives
// it offline capabilities. However, it also means that developers (and users)
// will only see deployed updates on subsequent visits to a page, after all the
// existing tabs open on the page have been closed, since previously cached
// resources are updated in the background.

// To learn more about the benefits of this model and instructions on how to
// opt-in, read https://bit.ly/CRA-PWA

export function register(config) {
  if (process.env.NODE_ENV === 'production' && 'serviceWorker' in navigator) {
    // The URL constructor is available in all browsers that support SW.
    const publicUrl = new URL(process.env.PUBLIC_URL, window.location.href);
    if (publicUrl.origin !== window.location.origin) {
      // Our service worker won't work if PUBLIC_URL is on a different origin
      // from what our page is served on. This might happen if a CDN is used to
      // serve assets; see https://github.com/facebook/create-react-app/issues/2374
      return Promise.resolve(null);;
    }

    // We are not waiting for window's load event as it was for the create-react-app template
    // because we register a service worker in the React app that runs after window loaded
    // and the load event already was emitted.
    const swUrl = `${process.env.PUBLIC_URL}/service-worker.js`;

    if (window.location.hostname === 'localhost'){
      // This is running on localhost. Let's check if a service worker still exists or not.
      return checkValidServiceWorker(swUrl, config);
    } else {
      // Is not localhost. Just register service worker
      return registerValidSW(swUrl, config);
    }
  }
  return Promise.resolve(null);
}

function registerValidSW(swUrl, config) {
  return navigator.serviceWorker.register(swUrl).then(registration => {
    registration.onupdatefound = () => {
      const installingWorker = registration.installing;
      if (installingWorker == null) return;
      installingWorker.onstatechange = () => {
        if (installingWorker.state === 'installed') {
          if (navigator.serviceWorker.controller) {
            // At this point, the updated precached content has been fetched,
            // but the previous service worker will still serve the older
            // content until all client tabs are closed.
            if (config && config.onUpdate) config.onUpdate(registration);
          } else {
            // At this point, everything has been precached.
            // It's the perfect time to display a
            // "Content is cached for offline use." message.
            if (config && config.onSuccess) config.onSuccess(registration);
          }
        }
      };
    };
    // reload when visiting the site with not yet installed update
    const wr = registration.waiting;
    if (wr){
      wr.addEventListener("statechange", e => e.target.state === "activated" && window.location.reload());
      wr.postMessage({type: "SKIP_WAITING"});
    }
    // periodically check (every 5 min) for app updates in the background
    setInterval(() => navigator.onLine && registration.update(), 5*60*1000);
    return registration;
  }).catch(error => {
    console.error('Error during service worker registration:', error);
  });
}

function checkValidServiceWorker(swUrl, config) {
  // Check if the service worker can be found. If it can't reload the page.
  return fetch(swUrl, {headers: {'Service-Worker': 'script'}}).then(response => {
    // Ensure service worker exists, and that we really are getting a JS file.
    const contentType = response.headers.get('content-type');
    if (response.status === 404 || (contentType != null && contentType.indexOf('javascript') === -1)){
      // No service worker found. Probably a different app. Reload the page.
      navigator.serviceWorker.ready.then(reg => reg.unregister().then(() => window.location.reload()));
    } else {
      // Service worker found. Proceed as normal.
      return registerValidSW(swUrl, config);
    }
  }).catch(() => {
    console.log('No internet connection found. App is running in offline mode.');
  });
}

export function unregister() {
  if ('serviceWorker' in navigator) {
    return navigator.serviceWorker.ready.then(reg => reg.unregister()).catch(e => console.error(e.message));
  }
}

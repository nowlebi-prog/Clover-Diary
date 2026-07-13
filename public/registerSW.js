(function unregisterCloverServiceWorker() {
  if (!("serviceWorker" in navigator)) return;

  navigator.serviceWorker
    .getRegistrations()
    .then(function (registrations) {
      registrations.forEach(function (registration) {
        registration.unregister();
      });
    })
    .catch(function () {});

  if ("caches" in window) {
    caches
      .keys()
      .then(function (keys) {
        keys.forEach(function (key) {
          caches.delete(key);
        });
      })
      .catch(function () {});
  }
})();

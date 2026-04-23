(function () {
  const isLocalHost = ["localhost", "127.0.0.1"].includes(window.location.hostname);

  window.SCHULMANAGER_CONFIG = {
    apiBase: isLocalHost ? "http://localhost:4000/api" : `${window.location.origin}/api`
  };
})();

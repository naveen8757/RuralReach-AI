/* RuralReach AI - Phase 1: Network Intelligence
   Uses browser Network Information API when available and online/offline events everywhere.
   The classroom simulator remains available for hackathon demonstrations.
*/
(function () {
  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  let current = navigator.onLine ? "strong" : "offline";

  function classify() {
    if (!navigator.onLine) return "offline";
    if (!connection) return "strong";

    const type = connection.effectiveType || "4g";
    const down = Number(connection.downlink || 0);
    const rtt = Number(connection.rtt || 0);

    if (type === "slow-2g" || type === "2g" || (down > 0 && down < 0.5) || rtt >= 700) return "offline";
    if (type === "3g" || (down > 0 && down < 1.5) || rtt >= 350) return "weak";
    return "strong";
  }

  function details() {
    return {
      state: current,
      online: navigator.onLine,
      effectiveType: connection?.effectiveType || "Not available",
      downlink: connection?.downlink || null,
      rtt: connection?.rtt || null,
      saveData: !!connection?.saveData
    };
  }

  function publish(forceState) {
    const next = forceState || classify();
    current = next;
    window.dispatchEvent(new CustomEvent("ruralreach:network", { detail: details() }));
  }

  window.ruralReachNetwork = {
    getState: () => current,
    getDetails: details,
    refresh: () => publish()
  };

  window.addEventListener("online", () => publish("strong"));
  window.addEventListener("offline", () => publish("offline"));
  connection?.addEventListener?.("change", () => publish());

  publish();
})();

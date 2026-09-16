(function () {
  "use strict";

  const indicator = document.getElementById("paymentStatusIndicator");
  if (!indicator) return;
  const label = indicator.querySelector(".payment-status-label");

  function setStatus(data) {
    const online = Boolean(data && data.isWork);
    const schedule = data?.schedule || {};
    const hours = (schedule.start || "08:00") + "–" + (schedule.end || "23:00") + " India time";
    indicator.classList.toggle("is-online", online);
    indicator.classList.toggle("is-offline", !online);
    label.textContent = online
      ? "Payment Online — accepting paid orders now"
      : "Payment Offline right now — available " + hours;
  }

  async function refreshStatus() {
    try {
      const response = await fetch("/api/site-mode", { cache: "no-store", headers: { Accept: "application/json" } });
      const data = await response.json();
      if (!response.ok) throw new Error("Unavailable");
      setStatus(data);
    } catch (_) {
      indicator.classList.remove("is-online");
      indicator.classList.add("is-offline");
      label.textContent = "Payment status unavailable — please try again shortly";
    }
  }

  refreshStatus();
  window.setInterval(refreshStatus, 60000);
})();
/* Dynamic UPI QR for Sai Graphic Designs cart checkout. */
(function () {
  "use strict";

  var QR_ENDPOINT = "https://quickchart.io/qr";

  function ensureQrUi() {
    var box = document.getElementById("saiUpiBox");
    if (!box) return null;

    var wrap = box.querySelector(".sai-upi-qr-wrap");
    if (!wrap) {
      wrap = document.createElement("div");
      wrap.className = "sai-upi-qr-wrap";
      wrap.innerHTML = '<img class="sai-upi-qr-img" id="saiUpiQrImg" alt="UPI payment QR code"><div class="sai-upi-qr-caption" id="saiUpiQrCaption">Preparing payment QR…</div><div class="sai-upi-qr-error" id="saiUpiQrError" hidden>QR is unavailable. Use the Pay with GPay / UPI button below.</div>';
      box.insertBefore(wrap, box.firstChild);
    }
    return wrap;
  }

  function amountText() {
    var amount = document.getElementById("saiPayAmount");
    return amount ? String(amount.textContent || "").trim() : "";
  }

  function updateQr() {
    var wrap = ensureQrUi();
    if (!wrap) return;

    var pay = document.getElementById("saiUpiPay");
    var img = document.getElementById("saiUpiQrImg");
    var caption = document.getElementById("saiUpiQrCaption");
    var error = document.getElementById("saiUpiQrError");
    if (!pay || !img || !caption || !error) return;

    var upiUri = String(pay.getAttribute("href") || "");
    var disabled = pay.getAttribute("aria-disabled") === "true";
    if (disabled || !/^upi:\/\/pay\?/i.test(upiUri)) {
      img.removeAttribute("src");
      img.hidden = true;
      caption.textContent = "Preparing payment QR…";
      error.hidden = true;
      return;
    }

    var total = amountText();
    var qrUrl = QR_ENDPOINT + "?text=" + encodeURIComponent(upiUri) + "&size=280&margin=2&ecLevel=M&format=png";
    if (img.dataset.paymentUri === upiUri && img.getAttribute("src") === qrUrl) return;

    img.dataset.paymentUri = upiUri;
    img.hidden = false;
    error.hidden = true;
    caption.textContent = total ? "Scan to pay " + total + " exactly" : "Scan to pay with UPI";
    img.alt = total ? "UPI QR code to pay " + total : "UPI payment QR code";
    img.onload = function () {
      error.hidden = true;
      img.hidden = false;
    };
    img.onerror = function () {
      img.hidden = true;
      error.hidden = false;
    };
    img.src = qrUrl;
  }

  function attachPaymentObserver() {
    var overlay = document.getElementById("saiPayOverlay");
    if (!overlay || overlay.dataset.saiDynamicQrAttached === "true") return;
    overlay.dataset.saiDynamicQrAttached = "true";

    var observer = new MutationObserver(function () {
      updateQr();
    });
    observer.observe(overlay, {
      subtree: true,
      childList: true,
      characterData: true,
      attributes: true,
      attributeFilter: ["href", "aria-disabled", "hidden"]
    });
    updateQr();
  }

  var pageObserver = new MutationObserver(function () {
    if (document.getElementById("saiPayOverlay")) attachPaymentObserver();
  });

  if (document.documentElement) pageObserver.observe(document.documentElement, { childList: true, subtree: true });
  document.addEventListener("click", function (event) {
    if (event.target.closest("#cartCheckout")) setTimeout(function () {
      attachPaymentObserver();
      updateQr();
    }, 80);
  }, true);
})();

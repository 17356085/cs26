(() => {
  const APP_VERSION = "2026-09-17.2";
  const SERVICE_WORKER_URL = "./sw.js";

  const installHint = document.querySelector("#installAppHint");
  const installButton = document.querySelector("#installAppButton");
  const installHintCopy = document.querySelector("#installAppHintCopy");
  const guideDialog = document.querySelector("#installGuideDialog");
  const closeGuide = document.querySelector("#closeInstallGuide");
  const iosInstallSteps = document.querySelector("#iosInstallSteps");
  const androidInstallSteps = document.querySelector("#androidInstallSteps");
  const embeddedAndroidInstallSteps = document.querySelector("#embeddedAndroidInstallSteps");
  const isStandalone = Boolean(
    globalThis.matchMedia?.("(display-mode: standalone)")?.matches ||
    globalThis.navigator?.standalone === true
  );
  const isMobileContext = Boolean(
    globalThis.matchMedia?.("(max-width: 760px)")?.matches ||
    globalThis.matchMedia?.("(pointer: coarse)")?.matches
  );
  const userAgent = globalThis.navigator?.userAgent || "";
  const isAndroid = /Android/i.test(userAgent);
  const isIOS = /iPhone|iPad|iPod/i.test(userAgent) || (globalThis.navigator?.platform === "MacIntel" && globalThis.navigator?.maxTouchPoints > 1);
  const isEmbeddedAndroid = isAndroid && /MicroMessenger|QQ\//i.test(userAgent);
  let deferredInstallPrompt = null;

  const hideInstallHint = () => {
    if (installHint) installHint.hidden = true;
  };

  const showInstallHint = () => {
    if (installHint && installButton && !isStandalone && isMobileContext) {
      installHint.hidden = false;
    }
  };

  const updateInstallCopy = () => {
    if (!installButton) return;
    if (isAndroid) {
      installButton.textContent = isEmbeddedAndroid ? "先用浏览器打开" : (deferredInstallPrompt ? "一键安装" : "看安装步骤");
      if (installHintCopy) installHintCopy.textContent = deferredInstallPrompt
        ? "检测到可安装版本，点这里直接添加"
        : (isEmbeddedAndroid ? "当前应用内浏览器不能安装，请先用系统浏览器打开" : "安卓 Chrome：点右上角 ⋮ 添加到主屏幕");
    } else if (isIOS) {
      installButton.textContent = "查看方法";
      if (installHintCopy) installHintCopy.textContent = "Safari：点分享按钮添加到主屏幕";
    }
  };

  if (iosInstallSteps) iosInstallSteps.hidden = !isIOS;
  if (androidInstallSteps) androidInstallSteps.hidden = !isAndroid || isEmbeddedAndroid;
  if (embeddedAndroidInstallSteps) embeddedAndroidInstallSteps.hidden = !isEmbeddedAndroid;
  updateInstallCopy();

  const openInstallGuide = () => {
    if (typeof guideDialog?.showModal === "function") {
      guideDialog.showModal();
      return;
    }
    globalThis.alert?.("请在浏览器菜单中选择“添加到主屏幕”。");
  };

  if (isStandalone || !isMobileContext) hideInstallHint();
  else showInstallHint();

  let registration = null;
  let checkInFlight = false;
  let lastCheck = 0;
  let refreshing = false;
  const reloadLatest = () => {
    if (refreshing) return;
    refreshing = true;
    const url = new URL("./", location.href);
    url.searchParams.set("__refresh", String(Date.now()));
    location.replace(url.href);
  };

  const checkForUpdate = async () => {
    if (document.hidden || checkInFlight || Date.now() - lastCheck < 30000) return;
    checkInFlight = true;
    lastCheck = Date.now();
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    try {
      // A unique URL also bypasses cache-first workers left by old releases.
      const response = await fetch(`./release.json?check=${Date.now()}`, {
        cache: "no-store", signal: controller.signal
      });
      if (!response.ok || new URL(response.url).origin !== location.origin) return;
      const release = await response.json();
      if (typeof release.version === "string" && release.version !== APP_VERSION) reloadLatest();
      registration?.update().catch(() => {});
    } catch { /* Keep the current schedule available when offline. */ }
    finally { clearTimeout(timeout); checkInFlight = false; }
  };

  if ("serviceWorker" in navigator && location.protocol === "https:") {
    // Keep one stable script URL: replacing a worker does not need unregister/reload loops.
    navigator.serviceWorker.register(SERVICE_WORKER_URL, {
      scope: "./", updateViaCache: "none"
    }).then((value) => {
      registration = value;
      return value.update();
    }).catch(() => {});
  }
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) checkForUpdate();
  });
  window.addEventListener("pageshow", checkForUpdate);
  window.addEventListener("online", checkForUpdate);
  window.addEventListener("focus", checkForUpdate);
  setInterval(checkForUpdate, 60000);
  checkForUpdate();

  globalThis.addEventListener?.("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferredInstallPrompt = event;
    updateInstallCopy();
    showInstallHint();
  });

  installButton?.addEventListener?.("click", async () => {
    if (!deferredInstallPrompt) {
      openInstallGuide();
      return;
    }
    deferredInstallPrompt.prompt();
    await deferredInstallPrompt.userChoice;
    deferredInstallPrompt = null;
    updateInstallCopy();
    hideInstallHint();
  });

  globalThis.addEventListener?.("appinstalled", () => {
    deferredInstallPrompt = null;
    hideInstallHint();
  });

  closeGuide?.addEventListener?.("click", () => guideDialog?.close?.());
  guideDialog?.addEventListener?.("click", (event) => {
    const rect = guideDialog.getBoundingClientRect();
    const inside = event.clientX >= rect.left && event.clientX <= rect.right && event.clientY >= rect.top && event.clientY <= rect.bottom;
    if (!inside) guideDialog.close();
  });

})();

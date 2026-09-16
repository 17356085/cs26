(() => {
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

  if ("serviceWorker" in globalThis.navigator && globalThis.location?.protocol === "https:") {
    globalThis.navigator.serviceWorker.register("./sw.js?version=3", { scope: "./" }).catch(() => {});
  }
})();

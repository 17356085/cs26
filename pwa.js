(() => {
  const installHint = document.querySelector("#installAppHint");
  const installButton = document.querySelector("#installAppButton");
  const guideDialog = document.querySelector("#installGuideDialog");
  const closeGuide = document.querySelector("#closeInstallGuide");
  const isStandalone = Boolean(
    globalThis.matchMedia?.("(display-mode: standalone)")?.matches ||
    globalThis.navigator?.standalone === true
  );
  const isMobileContext = Boolean(
    globalThis.matchMedia?.("(max-width: 760px)")?.matches ||
    globalThis.matchMedia?.("(pointer: coarse)")?.matches
  );
  let deferredInstallPrompt = null;

  const hideInstallHint = () => {
    if (installHint) installHint.hidden = true;
  };

  const showInstallHint = () => {
    if (installHint && installButton && !isStandalone && isMobileContext) {
      installHint.hidden = false;
    }
  };

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
    globalThis.navigator.serviceWorker.register("./sw.js", { scope: "./" }).catch(() => {});
  }
})();

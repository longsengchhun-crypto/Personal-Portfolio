const initializePortfolioSite = () => {
  if (document.documentElement.dataset.siteInitialized === "true") return;
  document.documentElement.dataset.siteInitialized = "true";

  const themeButtons = document.querySelectorAll(".theme-toggle");
  const savedTheme = localStorage.getItem("portfolio-theme");
  const preferredLight = window.matchMedia && window.matchMedia("(prefers-color-scheme: light)").matches;
  const initialTheme = document.documentElement.dataset.theme || savedTheme || (preferredLight ? "light" : "dark");

  const applyTheme = (theme) => {
    document.documentElement.dataset.theme = theme;
    document.body.dataset.theme = theme;
    themeButtons.forEach((button) => {
      const icon = button.querySelector("i");
      if (icon) icon.className = theme === "light" ? "bi bi-sun" : "bi bi-moon-stars";
      button.setAttribute("aria-pressed", theme === "light" ? "true" : "false");
    });
  };

  applyTheme(initialTheme);
  themeButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const nextTheme = document.documentElement.dataset.theme === "light" ? "dark" : "light";
      localStorage.setItem("portfolio-theme", nextTheme);
      applyTheme(nextTheme);
    });
  });

  const trackUrl = document.body.dataset.trackUrl;
  if (trackUrl) {
    const trackKey = `portfolio-track:${window.location.pathname}`;
    if (!sessionStorage.getItem(trackKey)) {
      const sendVisit = async () => {
        let clientHints = {};
        if (navigator.userAgentData?.getHighEntropyValues) {
          try {
            const hints = await navigator.userAgentData.getHighEntropyValues(["model", "platformVersion", "fullVersionList"]);
            const browser = hints.fullVersionList?.find((item) => !/not.?a.?brand/i.test(item.brand));
            clientHints = { deviceModel: hints.model || "", osVersion: hints.platformVersion || "", browserVersion: browser?.version || "" };
          } catch (_) { /* Reduced user-agent data is expected in privacy-focused browsers. */ }
        }
        const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
        const payload = {
          path: window.location.pathname, referrer: document.referrer,
          platform: navigator.userAgentData?.platform || navigator.platform || "",
          language: navigator.language || "", timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "",
          screenWidth: window.screen ? window.screen.width : null, screenHeight: window.screen ? window.screen.height : null,
          viewportWidth: window.innerWidth, viewportHeight: window.innerHeight,
          connectionType: connection?.effectiveType || connection?.type || "",
          cpuCores: navigator.hardwareConcurrency || null, deviceMemory: navigator.deviceMemory || null,
          touchSupport: (navigator.maxTouchPoints || 0) > 0, ...clientHints,
        };
        const response = await fetch(trackUrl, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload), keepalive: true,
        });
        if (response.ok) sessionStorage.setItem(trackKey, "1");
      };
      sendVisit().catch(() => {});
    }
  }

  const revealElements = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    const revealObserver = new IntersectionObserver((entries, observer) => entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      }
    }), { rootMargin: "0px 0px -10%", threshold: 0.08 });
    revealElements.forEach((element) => revealObserver.observe(element));
  } else {
    revealElements.forEach((element) => element.classList.add("is-visible"));
  }

  document.querySelectorAll(".lightbox-link").forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      const overlay = document.createElement("div");
      overlay.className = "simple-lightbox";
      overlay.innerHTML = `<button type="button" aria-label="Close image">&times;</button><img src="${link.href}" alt="">`;
      document.body.appendChild(overlay);
      overlay.querySelector("button").focus();
      overlay.addEventListener("click", () => overlay.remove());
      document.addEventListener("keydown", function closeOnEscape(keyEvent) {
        if (keyEvent.key === "Escape") {
          overlay.remove();
          document.removeEventListener("keydown", closeOnEscape);
        }
      });
    });
  });

  document.querySelectorAll(".project-card video").forEach((video) => {
    const card = video.closest(".project-card");
    if (!card) return;
    card.addEventListener("mouseenter", () => {
      video.play().catch(() => {});
    });
    card.addEventListener("mouseleave", () => {
      video.pause();
      video.currentTime = 0;
    });
    card.addEventListener("focusin", () => {
      video.play().catch(() => {});
    });
    card.addEventListener("focusout", () => {
      video.pause();
      video.currentTime = 0;
    });
  });

  document.querySelectorAll("[data-preview-video]").forEach((video) => {
    const player = video.closest(".video-feature-player");
    const markUnavailable = () => player?.classList.add("is-video-unavailable");
    video.addEventListener("error", markUnavailable);
    video.querySelectorAll("source").forEach((source) => source.addEventListener("error", markUnavailable));
    // Only start downloading/playing once the player actually scrolls into view — this
    // section sits well below the fold, and calling play() unconditionally on load forced
    // the browser to start streaming a large video file before the page was even interactive.
    if ("IntersectionObserver" in window) {
      const playObserver = new IntersectionObserver((entries, observer) => entries.forEach((entry) => {
        if (entry.isIntersecting) {
          video.play?.().catch(() => {});
          observer.unobserve(entry.target);
        }
      }), { rootMargin: "200px 0px" });
      playObserver.observe(video);
    } else {
      video.play?.().catch(() => {});
    }
  });

  const successCelebration = document.querySelector("[data-success-celebration]");
  if (successCelebration) {
    const audio = document.getElementById("contactSuccessAudio");
    const closeButton = successCelebration.querySelector("[data-success-close]");
    const continueButton = successCelebration.querySelector("[data-success-continue]");
    let isClosing = false;
    let autoCloseTimer;

    const closeCelebration = () => {
      if (isClosing) return;
      isClosing = true;
      window.clearTimeout(autoCloseTimer);
      if (audio) {
        audio.pause();
        audio.currentTime = 0;
      }
      successCelebration.classList.add("is-leaving");
      document.body.classList.remove("success-dialog-open");
      document.removeEventListener("keydown", closeOnEscape);
      window.setTimeout(() => successCelebration.remove(), 260);
    };

    const closeOnEscape = (event) => {
      if (event.key === "Escape") closeCelebration();
    };

    const playSuccessAudio = () => {
      if (!audio) return;
      audio.currentTime = 0;
      audio.play().catch(() => {});
    };

    document.body.classList.add("success-dialog-open");
    document.addEventListener("keydown", closeOnEscape);
    successCelebration.addEventListener("click", (event) => {
      if (event.target === successCelebration) closeCelebration();
    });
    closeButton?.focus();
    window.setTimeout(playSuccessAudio, 240);
    autoCloseTimer = window.setTimeout(closeCelebration, 12000);
    if (window.history && window.URLSearchParams) {
      const cleanUrl = new URL(window.location.href);
      cleanUrl.searchParams.delete("sent");
      cleanUrl.searchParams.delete("email");
      window.history.replaceState({}, document.title, cleanUrl.toString());
    }
    closeButton?.addEventListener("click", closeCelebration);
    continueButton?.addEventListener("click", closeCelebration);
  }

  const showreelModal = document.getElementById("showreelModal");
  if (showreelModal) {
    showreelModal.addEventListener("shown.bs.modal", () => {
      showreelModal.querySelectorAll("[data-src]").forEach((media) => {
        if (!media.getAttribute("src")) media.setAttribute("src", media.dataset.src);
      });
    });
    showreelModal.addEventListener("hidden.bs.modal", () => {
      showreelModal.querySelectorAll("iframe, video").forEach((media) => media.removeAttribute("src"));
    });
  }
};

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializePortfolioSite, { once: true });
} else {
  initializePortfolioSite();
}

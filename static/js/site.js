document.addEventListener("DOMContentLoaded", () => {
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
      const payload = {
        path: window.location.pathname,
        referrer: document.referrer,
        platform: navigator.platform || "",
        language: navigator.language || "",
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "",
        screenWidth: window.screen ? window.screen.width : null,
        screenHeight: window.screen ? window.screen.height : null,
        viewportWidth: window.innerWidth,
        viewportHeight: window.innerHeight,
      };
      fetch(trackUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        keepalive: true,
      })
        .then(() => sessionStorage.setItem(trackKey, "1"))
        .catch(() => {});
    }
  }

  if (window.gsap && window.ScrollTrigger) {
    gsap.registerPlugin(ScrollTrigger);
    gsap.utils.toArray(".reveal").forEach((element) => {
      gsap.fromTo(
        element,
        { y: 28, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.7,
          ease: "power2.out",
          scrollTrigger: { trigger: element, start: "top 86%" },
        }
      );
    });
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

  const successCelebration = document.querySelector("[data-success-celebration]");
  if (successCelebration) {
    const audio = document.getElementById("contactSuccessAudio");
    const closeButton = successCelebration.querySelector("[data-success-close]");
    const playButton = successCelebration.querySelector("[data-play-success]");
    const closeCelebration = () => {
      successCelebration.classList.add("is-leaving");
      window.setTimeout(() => successCelebration.remove(), 260);
    };
    const playSuccessAudio = () => {
      if (!audio) return;
      audio.currentTime = 0;
      audio.play().catch(() => {
        if (playButton) playButton.hidden = false;
      });
    };

    window.setTimeout(playSuccessAudio, 240);
    window.setTimeout(closeCelebration, 9200);
    if (window.history && window.URLSearchParams) {
      const cleanUrl = new URL(window.location.href);
      cleanUrl.searchParams.delete("sent");
      window.history.replaceState({}, document.title, cleanUrl.toString());
    }
    closeButton?.addEventListener("click", closeCelebration);
    playButton?.addEventListener("click", () => {
      playButton.hidden = true;
      playSuccessAudio();
    });
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
});

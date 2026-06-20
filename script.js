const eventDate = new Date("2026-07-04T18:00:00+05:00");
const music = document.getElementById("weddingMusic");
const toggle = document.getElementById("musicToggle");
const icon = document.getElementById("musicIcon");
const rsvpForm = document.getElementById("rsvpForm");
const rsvpResult = document.getElementById("rsvpResult");
const whatsappLink = document.getElementById("whatsappLink");
const whatsappPhone = "97685700793";
let autoScrollFrame = null;
let autoScrollStarted = false;
let autoScrollStopped = false;

function setMusicState(isPlaying) {
  toggle.classList.toggle("is-playing", isPlaying);
  toggle.setAttribute("aria-label", isPlaying ? "Музыканы тоқтату" : "Музыканы қосу");
  icon.textContent = isPlaying ? "Ⅱ" : "▶";
}

async function tryPlayMusic() {
  try {
    music.muted = false;
    music.volume = 0.68;
    await music.play();
    setMusicState(true);
    return true;
  } catch {
    setMusicState(false);
    return false;
  }
}

function startAutoplayAttempts() {
  tryPlayMusic();

  let attempts = 0;
  const autoplayTimer = setInterval(async () => {
    attempts += 1;
    const isPlaying = await tryPlayMusic();

    if (isPlaying || attempts >= 8) {
      clearInterval(autoplayTimer);
    }
  }, 700);
}

function stopAutoScroll() {
  autoScrollStopped = true;

  if (autoScrollFrame) {
    cancelAnimationFrame(autoScrollFrame);
    autoScrollFrame = null;
  }
}

function startAutoScroll() {
  if (autoScrollStarted || autoScrollStopped) {
    return;
  }

  autoScrollStarted = true;
  let lastTime = null;
  const speed = 26;

  function step(timestamp) {
    if (autoScrollStopped) {
      return;
    }

    if (!lastTime) {
      lastTime = timestamp;
    }

    const delta = timestamp - lastTime;
    lastTime = timestamp;
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;

    if (window.scrollY >= maxScroll - 2) {
      stopAutoScroll();
      return;
    }

    window.scrollBy(0, (speed * delta) / 1000);
    autoScrollFrame = requestAnimationFrame(step);
  }

  autoScrollFrame = requestAnimationFrame(step);
}

function setupRevealAnimations() {
  const revealGroups = [
    [".hero__content span, .script, .date-row, .photo-caption span, .rsvp__text, .closing p", "reveal-left"],
    [".hero__content strong, h1, .time, .photo-caption strong, .calendar-card h2, .rsvp h2, .closing span", "reveal-right"],
    [".hero__content em, .lead, .map-link, .quick-actions, .calendar-photo__image, .gallery__image, .rsvp-form", "reveal-scale"],
    [".divider, .countdown h2, .program h2, .section-kicker", "reveal-top"],
    [".detail, .program-item, .countdown__grid div, .calendar-weekdays span, .calendar-grid span", "reveal-scale"],
  ];
  const revealItems = [];

  revealGroups.forEach(([selector, direction]) => {
    document.querySelectorAll(selector).forEach((element) => {
      element.classList.add("js-reveal", direction);
      revealItems.push(element);
    });
  });

  if (!("IntersectionObserver" in window)) {
    revealItems.forEach((element) => element.classList.add("is-visible"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.18, rootMargin: "0px 0px -8% 0px" }
  );

  revealItems.forEach((element, index) => {
    element.style.animationDelay = `${Math.min(index % 5, 4) * 0.07}s`;
    observer.observe(element);
  });
}

toggle.addEventListener("click", async () => {
  if (music.paused) {
    await tryPlayMusic();
  } else {
    music.pause();
    setMusicState(false);
  }
});

["click", "touchstart", "keydown"].forEach((eventName) => {
  window.addEventListener(
    eventName,
    () => {
      if (music.paused) {
        tryPlayMusic();
      }
    },
    { once: true }
  );
});

function updateCountdown() {
  const now = new Date();
  const distance = Math.max(0, eventDate.getTime() - now.getTime());
  const days = Math.floor(distance / 86400000);
  const hours = Math.floor((distance % 86400000) / 3600000);
  const minutes = Math.floor((distance % 3600000) / 60000);
  const seconds = Math.floor((distance % 60000) / 1000);

  document.getElementById("days").textContent = String(days).padStart(2, "0");
  document.getElementById("hours").textContent = String(hours).padStart(2, "0");
  document.getElementById("minutes").textContent = String(minutes).padStart(2, "0");
  document.getElementById("seconds").textContent = String(seconds).padStart(2, "0");
}

updateCountdown();
setInterval(updateCountdown, 1000);

if (document.readyState === "loading") {
  document.addEventListener(
    "DOMContentLoaded",
    () => {
      setupRevealAnimations();
      startAutoplayAttempts();
      setTimeout(startAutoScroll, 1400);
    },
    { once: true }
  );
} else {
  setupRevealAnimations();
  startAutoplayAttempts();
  setTimeout(startAutoScroll, 1400);
}

["wheel", "touchmove", "pointerdown", "keydown"].forEach((eventName) => {
  window.addEventListener(eventName, stopAutoScroll, { once: true, passive: true });
});

rsvpForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const formData = new FormData(rsvpForm);
  const name = formData.get("guestName").trim();
  const attendance = formData.get("attendance");
  const count = formData.get("guestCount");
  const wish = formData.get("guestWish").trim();
  const message = [
    "Қыз ұзату сауалнамасы",
    `Аты-жөні: ${name}`,
    `Қатысуы: ${attendance}`,
    `Қонақ саны: ${count}`,
    wish ? `Тілек: ${wish}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  whatsappLink.href = `https://wa.me/${whatsappPhone}?text=${encodeURIComponent(message)}`;
  rsvpResult.hidden = false;
  rsvpResult.scrollIntoView({ behavior: "smooth", block: "center" });
});

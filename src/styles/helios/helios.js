/* ============================================================
   HELIOS — drop-in behaviour (prefixed)
   Optional. Works with .hx-theme wrapper. Safe to drop into an
   existing project: touches no existing classes.
   ============================================================ */

(function () {
  "use strict";

  /* Only run inside a .hx-theme scope. If the project never adds that
     class, this script does nothing at all. */
  function boot() {
    const zone = document.querySelector(".hx-theme");
    if (!zone) return;

    document.documentElement.classList.add("hx-js");
    /* every zone gets released, not just the first one found */
    requestAnimationFrame(() =>
      document.querySelectorAll(".hx-theme").forEach((z) => z.classList.add("hx-is-loaded"))
    );

    const $  = (s, r = zone) => r.querySelector(s);
    const $$ = (s, r = zone) => [...r.querySelectorAll(s)];

    /* ---------- scroll reveal ---------- */
    const els = $$("[data-reveal], .hx-reveal, .hx-rise");
    if (els.length) {
      if (!("IntersectionObserver" in window)) {
        els.forEach((el) => el.classList.add("hx-is-in"));
      } else {
        const io = new IntersectionObserver(
          (entries) => {
            entries.forEach((e) => {
              if (!e.isIntersecting) return;
              e.target.classList.add("hx-is-in");
              io.unobserve(e.target);
            });
          },
          { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
        );
        els.forEach((el) => io.observe(el));
      }
    }

    /* ---------- custom cursor ---------- */
    const ring = $(".hx-cursor-ring");
    const dot  = $(".hx-cursor-dot");
    if (ring && dot && !window.matchMedia("(pointer: coarse)").matches) {
      let mx = innerWidth / 2, my = innerHeight / 2, rx = mx, ry = my, raf = null;

      addEventListener("mousemove", (e) => {
        mx = e.clientX; my = e.clientY;
        dot.style.transform = `translate(${mx}px, ${my}px) translate(-50%, -50%)`;
        zone.classList.add("hx-cursor-active");
        if (!raf) raf = requestAnimationFrame(loop);
      }, { passive: true });

      function loop() {
        rx += (mx - rx) * 0.16;
        ry += (my - ry) * 0.16;
        ring.style.transform = `translate(${rx}px, ${ry}px) translate(-50%, -50%)`;
        raf = (Math.abs(mx - rx) > 0.1 || Math.abs(my - ry) > 0.1)
          ? requestAnimationFrame(loop) : null;
      }

      const hoverable = "a, button, [data-cursor='hover']";
      document.addEventListener("mouseover", (e) => {
        if (e.target.closest(hoverable)) zone.classList.add("hx-cursor-hover");
      });
      document.addEventListener("mouseout", (e) => {
        if (e.target.closest(hoverable)) zone.classList.remove("hx-cursor-hover");
      });
      document.addEventListener("mouseleave", () => {
        zone.classList.remove("hx-cursor-active");
      });
    }

    /* ---------- nav scroll state ---------- */
    const nav = $(".hx-nav");
    if (nav) {
      const onScroll = () => nav.classList.toggle("hx-is-scrolled", scrollY > 40);
      onScroll();
      addEventListener("scroll", onScroll, { passive: true });
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();

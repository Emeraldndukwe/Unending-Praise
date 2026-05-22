import gsap from "gsap";

export const ADMIN_EASE_OUT = "power3.out";
export const ADMIN_EASE_IN_OUT = "power3.inOut";

const SIDEBAR_EXPANDED = 260;
const SIDEBAR_COLLAPSED = 76;

export function reducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/** Staggered fade-up for `[data-admin-reveal]` children */
export function staggerReveal(
  container: HTMLElement | null,
  options?: { selector?: string; delay?: number; duration?: number; y?: number; stagger?: number }
) {
  if (!container || reducedMotion()) return;
  const selector = options?.selector ?? "[data-admin-reveal]";
  const targets = container.querySelectorAll<HTMLElement>(selector);
  if (!targets.length) return;

  gsap.fromTo(
    targets,
    { opacity: 0, y: options?.y ?? 22 },
    {
      opacity: 1,
      y: 0,
      duration: options?.duration ?? 0.55,
      ease: ADMIN_EASE_OUT,
      stagger: options?.stagger ?? 0.065,
      delay: options?.delay ?? 0,
      overwrite: "auto",
    }
  );
}

export function pageEnter(el: HTMLElement | null) {
  if (!el || reducedMotion()) return;
  gsap.fromTo(
    el,
    { opacity: 0, y: 20 },
    { opacity: 1, y: 0, duration: 0.55, ease: ADMIN_EASE_OUT, overwrite: "auto" }
  );
}

export function headerSwap(el: HTMLElement | null) {
  if (!el || reducedMotion()) return;
  gsap.fromTo(
    el,
    { opacity: 0, y: 8 },
    { opacity: 1, y: 0, duration: 0.4, ease: ADMIN_EASE_OUT, overwrite: "auto" }
  );
}

export function animateSidebar(
  aside: HTMLElement | null,
  main: HTMLElement | null,
  collapsed: boolean
) {
  if (!aside || !main) return;
  const width = collapsed ? SIDEBAR_COLLAPSED : SIDEBAR_EXPANDED;
  if (reducedMotion()) {
    gsap.set(aside, { width });
    gsap.set(main, { marginLeft: width });
    return;
  }
  gsap.to(aside, { width, duration: 0.48, ease: ADMIN_EASE_IN_OUT, overwrite: "auto" });
  gsap.to(main, { marginLeft: width, duration: 0.48, ease: ADMIN_EASE_IN_OUT, overwrite: "auto" });
}

export function slideDropdown(el: HTMLElement | null, show: boolean) {
  if (!el) return;
  if (reducedMotion()) {
    gsap.set(el, { opacity: show ? 1 : 0, y: 0, scale: 1, pointerEvents: show ? "auto" : "none" });
    return;
  }
  if (show) {
    gsap.killTweensOf(el);
    gsap.fromTo(
      el,
      { opacity: 0, y: -10, scale: 0.97 },
      { opacity: 1, y: 0, scale: 1, duration: 0.38, ease: ADMIN_EASE_OUT, overwrite: "auto" }
    );
  } else {
    gsap.to(el, {
      opacity: 0,
      y: -8,
      scale: 0.98,
      duration: 0.22,
      ease: "power2.in",
      overwrite: "auto",
    });
  }
}

/** Quick press feedback on nav / buttons */
export function tapPulse(el: HTMLElement) {
  if (reducedMotion()) return;
  gsap.fromTo(
    el,
    { scale: 0.94 },
    { scale: 1, duration: 0.45, ease: "elastic.out(1, 0.55)", overwrite: "auto" }
  );
}

export function initSidebarLayout(aside: HTMLElement | null, main: HTMLElement | null, collapsed: boolean) {
  const width = collapsed ? SIDEBAR_COLLAPSED : SIDEBAR_EXPANDED;
  if (aside) gsap.set(aside, { width });
  if (main) gsap.set(main, { marginLeft: width });
}

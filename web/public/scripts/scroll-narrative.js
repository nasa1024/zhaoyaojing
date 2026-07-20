// IntersectionObserver adds .active to [data-step] as they enter the viewport,
// and auto-reveals top-level homepage sections with a subtle fade-up.
// Hiding is JS-driven (.reveal is only added here), so no-JS stays fully visible.
// Under prefers-reduced-motion: add .active to all immediately, never hide.
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const stepEls = document.querySelectorAll('[data-step]');
const autoEls = document.querySelectorAll('.page > section, .page > .grid');

if (reduceMotion) {
  stepEls.forEach((el) => el.classList.add('active'));
} else {
  autoEls.forEach((el) => el.classList.add('reveal'));
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      e.target.classList.add('active');
      io.unobserve(e.target);
    });
  }, { threshold: 0.12 });
  stepEls.forEach((el) => io.observe(el));
  autoEls.forEach((el) => io.observe(el));
}

// Spotlight border on sample cards: track cursor into --mx/--my
document.addEventListener('pointermove', (e) => {
  const card = e.target?.closest?.('.sample-card');
  if (!card) return;
  const r = card.getBoundingClientRect();
  card.style.setProperty('--mx', `${e.clientX - r.left}px`);
  card.style.setProperty('--my', `${e.clientY - r.top}px`);
});

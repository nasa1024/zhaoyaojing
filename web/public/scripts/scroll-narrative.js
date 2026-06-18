// IntersectionObserver adds .active to [data-step] as they enter the viewport
// Under prefers-reduced-motion: add .active to all immediately
const query = window.matchMedia('(prefers-reduced-motion: reduce)');
if (query.matches) {
  document.querySelectorAll('[data-step]').forEach(el => el.classList.add('active'));
} else {
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('active'); });
  }, { threshold: 0.15 });
  document.querySelectorAll('[data-step]').forEach(el => io.observe(el));
}

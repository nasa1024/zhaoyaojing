// Specimen card follows the cursor a few degrees. Fine pointers only, and
// never under prefers-reduced-motion. Pure presentation; no data touched.
const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
const card = document.querySelector('.hero-visual');
const hero = card?.closest('.hero');

if (card && hero && fine && !calm) {
  let frame = 0;
  hero.addEventListener('pointermove', (e) => {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => {
      const r = hero.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      card.style.setProperty('--rx', `${(-y * 7).toFixed(2)}deg`);
      card.style.setProperty('--ry', `${(x * 10).toFixed(2)}deg`);
    });
  });
  hero.addEventListener('pointerleave', () => {
    cancelAnimationFrame(frame);
    card.style.removeProperty('--rx');
    card.style.removeProperty('--ry');
  });
}

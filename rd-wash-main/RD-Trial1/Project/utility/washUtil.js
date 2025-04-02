// ==================== Utility Functions ====================

export function statusClass(s, rewashCount) {
  if (s === 'Waiting Rewash') return `rewash-${rewashCount}`;
  if (s.includes('Waiting')) return 'waiting';
  if (s.includes('Washing')) return 'washing';
  if (s.includes('Completed')) return 'completed';
  if (s.includes('Rewash')) return 'rewash';
  if (s.includes('Scrap')) return 'scrap';
  return '';
}

export function debounce(fn, delay) {
  let t;
  return function () {
    clearTimeout(t);
    t = setTimeout(() => fn.apply(this, arguments), delay);
  };
}

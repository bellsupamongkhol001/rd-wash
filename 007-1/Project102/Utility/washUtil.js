export function generateWashId() {
  const date = new Date();
  const yymmdd = date.toISOString().slice(2, 10).replace(/-/g, '');
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `wash-${yymmdd}-${random}`;
}

export function getStatusClass(status) {
  switch (status) {
    case 'Waiting':
    case 'Waiting to Send': return 'waiting';
    case 'Washing': return 'washing';
    case 'Completed': return 'completed';
    case 'Waiting Rewash #1': return 'rewash1';
    case 'Waiting Rewash #2': return 'rewash2';
    case 'Waiting Rewash #3': return 'rewash3';
    case 'Scrap': return 'scrap';
    default: return '';
  }
}

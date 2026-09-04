export const formatCurrency = (amount) => {
  if (amount === null || amount === undefined) return 'Rp 0';
  const num = Math.abs(Number(amount));
  return 'Rp ' + num.toLocaleString('id-ID');
};

export const formatShortCurrency = (amount) => {
  const num = Math.abs(Number(amount));
  if (num >= 1_000_000_000) return `Rp ${(num / 1_000_000_000).toFixed(1)}M`;
  if (num >= 1_000_000) return `Rp ${(num / 1_000_000).toFixed(1)}jt`;
  if (num >= 1_000) return `Rp ${(num / 1_000).toFixed(0)}rb`;
  return `Rp ${num}`;
};

export const formatDate = (date, format = 'short') => {
  const d = new Date(date);
  if (isNaN(d)) return '-';
  if (format === 'short')
    return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
  if (format === 'long')
    return d.toLocaleDateString('id-ID', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
  if (format === 'monthYear')
    return d.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
  if (format === 'input')
    return d.toISOString().split('T')[0];
  return d.toLocaleDateString('id-ID');
};

export const getMonthName = (monthIndex) => {
  const months = [
    'Januari','Februari','Maret','April','Mei','Juni',
    'Juli','Agustus','September','Oktober','November','Desember',
  ];
  return months[monthIndex] || '';
};

export const isSameMonth = (date1, date2) => {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  return d1.getMonth() === d2.getMonth() && d1.getFullYear() === d2.getFullYear();
};

export const generateId = () =>
  Date.now().toString(36) + Math.random().toString(36).substr(2);

export const toDateInputValue = (date) =>
  new Date(date).toISOString().split('T')[0];

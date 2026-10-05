export const formatCurrency = (amount) => {
  if (amount === null || amount === undefined) return 'Rp 0';
  const num = Math.abs(Number(amount));
  return 'Rp ' + num.toLocaleString('id-ID');
};

export const formatShortCurrency = (amount) => {
  const num = Math.abs(Number(amount));
  const dec = (n) => n.toLocaleString('id-ID', { maximumFractionDigits: 1 });
  if (num >= 1_000_000_000) return `Rp ${dec(num / 1_000_000_000)}M`;
  if (num >= 1_000_000) return `Rp ${dec(num / 1_000_000)}jt`;
  if (num >= 1_000) return `Rp ${dec(num / 1_000)}rb`;
  return `Rp ${num}`;
};

// Angka penuh bila muat dalam batas karakter; kalau tidak, format singkat
// supaya tidak overflow di ruang sempit.
export const formatAmount = (amount, maxChars = 13) => {
  const full = formatCurrency(amount);
  return full.length <= maxChars ? full : formatShortCurrency(amount);
};

export const generateId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

export const toDateInputValue = (date) => {
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return '';
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const formatDate = (date, format = 'short') => {
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return '-';
  if (format === 'short')
    return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
  if (format === 'long')
    return d.toLocaleDateString('id-ID', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
  if (format === 'monthYear')
    return d.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
  if (format === 'input')
    return toDateInputValue(d);
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

import { getCategoryIcon } from './categoryIcons';

export const EXPENSE_CATEGORIES = [
  { id: 'child_baby', label: 'Anak & Bayi', color: '#C92F1C' },
  { id: 'fuel', label: 'BBM', color: '#C92F1C' },
  { id: 'groceries', label: 'Bahan Makanan', color: '#C92F1C' },
  { id: 'donation', label: 'Donasi', color: '#C92F1C' },
  { id: 'electronics', label: 'Elektronik & Gadget', color: '#C92F1C' },
  { id: 'game', label: 'Game', color: '#C92F1C' },
  { id: 'entertainment_subscription', label: 'Hiburan & Langganan', color: '#C92F1C' },
  { id: 'internet_phone', label: 'Internet & Telepon', color: '#C92F1C' },
  { id: 'investment_expense', label: 'Investasi', color: '#C92F1C' },
  { id: 'family', label: 'Keluarga', color: '#C92F1C' },
  { id: 'vehicle', label: 'Kendaraan & Perawatan', color: '#C92F1C' },
  { id: 'work', label: 'Kerja', color: '#C92F1C' },
  { id: 'health', label: 'Kesehatan', color: '#C92F1C' },
  { id: 'correction_expense', label: 'Koreksi (-)', color: '#C92F1C' },
  { id: 'other_expense', label: 'Lainnya', color: '#C92F1C' },
  { id: 'dining_out', label: 'Makan & Minuman di Luar', color: '#C92F1C' },
  { id: 'sports', label: 'Olahraga', color: '#C92F1C' },
  { id: 'tax_admin', label: 'Pajak & Administrasi', color: '#C92F1C' },
  { id: 'clothing', label: 'Pakaian', color: '#C92F1C' },
  { id: 'pet', label: 'Peliharaan', color: '#C92F1C' },
  { id: 'education', label: 'Pendidikan', color: '#C92F1C' },
  { id: 'personal_care', label: 'Perawatan Diri', color: '#C92F1C' },
  { id: 'household', label: 'Rumah Tangga', color: '#C92F1C' },
  { id: 'social', label: 'Sosial', color: '#C92F1C' },
  { id: 'bills', label: 'Tagihan', color: '#C92F1C' },
  { id: 'transport', label: 'Transportasi', color: '#C92F1C' },
].map((category) => ({ ...category, icon: getCategoryIcon(category.id) }));

export const INCOME_CATEGORIES = [
  { id: 'bonus', label: 'Bonus', color: '#5AABA9' },
  { id: 'salary', label: 'Gaji', color: '#5AABA9' },
  { id: 'investment_income', label: 'Hasil Invest', color: '#5AABA9' },
  { id: 'grant', label: 'Hibah', color: '#5AABA9' },
  { id: 'sale', label: 'Jual', color: '#5AABA9' },
  { id: 'correction_income', label: 'Koreksi (+)', color: '#5AABA9' },
  { id: 'other_income', label: 'Pemasukan Lainnya', color: '#5AABA9' },
  { id: 'refund', label: 'Pengembalian', color: '#5AABA9' },
  { id: 'side_income', label: 'Sampingan', color: '#5AABA9' },
  { id: 'rent_income', label: 'Sewa', color: '#5AABA9' },
].map((category) => ({ ...category, icon: getCategoryIcon(category.id) }));

export const ALL_CATEGORIES = [...INCOME_CATEGORIES, ...EXPENSE_CATEGORIES];

const LEGACY_CATEGORY_ALIASES = {
  food: { id: 'dining_out', label: 'Makan & Minuman di Luar', color: '#C92F1C' },
  transport: { id: 'transport', label: 'Transportasi', color: '#C92F1C' },
  shopping: { id: 'groceries', label: 'Bahan Makanan', color: '#C92F1C' },
  health: { id: 'health', label: 'Kesehatan', color: '#C92F1C' },
  entertainment: { id: 'entertainment_subscription', label: 'Hiburan & Langganan', color: '#C92F1C' },
  education: { id: 'education', label: 'Pendidikan', color: '#C92F1C' },
  bills: { id: 'bills', label: 'Tagihan', color: '#C92F1C' },
  household: { id: 'household', label: 'Rumah Tangga', color: '#C92F1C' },
  beauty: { id: 'personal_care', label: 'Perawatan Diri', color: '#C92F1C' },
  sports: { id: 'sports', label: 'Olahraga', color: '#C92F1C' },
  travel: { id: 'transport', label: 'Transportasi', color: '#C92F1C' },
  salary: INCOME_CATEGORIES.find((c) => c.id === 'salary'),
  freelance: { id: 'side_income', label: 'Sampingan', color: '#5AABA9' },
  business: { id: 'sale', label: 'Jual', color: '#5AABA9' },
  investment: { id: 'investment_income', label: 'Hasil Invest', color: '#5AABA9' },
  gift: { id: 'bonus', label: 'Bonus', color: '#5AABA9' },
  other_income: { id: 'other_income', label: 'Pemasukan Lainnya', color: '#5AABA9' },
};

export const getCategoryById = (id) => {
  const category = ALL_CATEGORIES.find((c) => c.id === id);
  if (category) return category;
  const legacy = LEGACY_CATEGORY_ALIASES[id];
  if (legacy) return { ...legacy, icon: getCategoryIcon(legacy.id) };
  return { id: 'other', label: 'Lainnya', icon: getCategoryIcon('other_expense'), color: '#C92F1C' };
};

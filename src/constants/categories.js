import { getCategoryIcon } from './categoryIcons';

export const EXPENSE_CATEGORIES = [
  { id: 'child_baby', label: 'Anak & Bayi', color: '#EF4444' },
  { id: 'fuel', label: 'BBM', color: '#EF4444' },
  { id: 'groceries', label: 'Bahan Makanan', color: '#EF4444' },
  { id: 'donation', label: 'Donasi', color: '#EF4444' },
  { id: 'electronics', label: 'Elektronik & Gadget', color: '#EF4444' },
  { id: 'game', label: 'Game', color: '#EF4444' },
  { id: 'entertainment_subscription', label: 'Hiburan & Langganan', color: '#EF4444' },
  { id: 'internet_phone', label: 'Internet & Telepon', color: '#EF4444' },
  { id: 'investment_expense', label: 'Investasi', color: '#EF4444' },
  { id: 'family', label: 'Keluarga', color: '#EF4444' },
  { id: 'vehicle', label: 'Kendaraan & Perawatan', color: '#EF4444' },
  { id: 'work', label: 'Kerja', color: '#EF4444' },
  { id: 'health', label: 'Kesehatan', color: '#EF4444' },
  { id: 'correction_expense', label: 'Koreksi (-)', color: '#EF4444' },
  { id: 'other_expense', label: 'Lainnya', color: '#EF4444' },
  { id: 'dining_out', label: 'Makan & Minuman di Luar', color: '#EF4444' },
  { id: 'sports', label: 'Olahraga', color: '#EF4444' },
  { id: 'tax_admin', label: 'Pajak & Administrasi', color: '#EF4444' },
  { id: 'clothing', label: 'Pakaian', color: '#EF4444' },
  { id: 'pet', label: 'Peliharaan', color: '#EF4444' },
  { id: 'education', label: 'Pendidikan', color: '#EF4444' },
  { id: 'personal_care', label: 'Perawatan Diri', color: '#EF4444' },
  { id: 'household', label: 'Rumah Tangga', color: '#EF4444' },
  { id: 'social', label: 'Sosial', color: '#EF4444' },
  { id: 'bills', label: 'Tagihan', color: '#EF4444' },
  { id: 'transport', label: 'Transportasi', color: '#EF4444' },
].map((category) => ({ ...category, icon: getCategoryIcon(category.id) }));

export const INCOME_CATEGORIES = [
  { id: 'bonus', label: 'Bonus', color: '#10B981' },
  { id: 'salary', label: 'Gaji', color: '#10B981' },
  { id: 'investment_income', label: 'Hasil Invest', color: '#10B981' },
  { id: 'grant', label: 'Hibah', color: '#10B981' },
  { id: 'sale', label: 'Jual', color: '#10B981' },
  { id: 'correction_income', label: 'Koreksi (+)', color: '#10B981' },
  { id: 'other_income', label: 'Pemasukan Lainnya', color: '#10B981' },
  { id: 'refund', label: 'Pengembalian', color: '#10B981' },
  { id: 'side_income', label: 'Sampingan', color: '#10B981' },
  { id: 'rent_income', label: 'Sewa', color: '#10B981' },
].map((category) => ({ ...category, icon: getCategoryIcon(category.id) }));

export const ALL_CATEGORIES = [...INCOME_CATEGORIES, ...EXPENSE_CATEGORIES];

const LEGACY_CATEGORY_ALIASES = {
  food: { id: 'dining_out', label: 'Makan & Minuman di Luar', color: '#EF4444' },
  transport: { id: 'transport', label: 'Transportasi', color: '#EF4444' },
  shopping: { id: 'groceries', label: 'Bahan Makanan', color: '#EF4444' },
  health: { id: 'health', label: 'Kesehatan', color: '#EF4444' },
  entertainment: { id: 'entertainment_subscription', label: 'Hiburan & Langganan', color: '#EF4444' },
  education: { id: 'education', label: 'Pendidikan', color: '#EF4444' },
  bills: { id: 'bills', label: 'Tagihan', color: '#EF4444' },
  household: { id: 'household', label: 'Rumah Tangga', color: '#EF4444' },
  beauty: { id: 'personal_care', label: 'Perawatan Diri', color: '#EF4444' },
  sports: { id: 'sports', label: 'Olahraga', color: '#EF4444' },
  travel: { id: 'transport', label: 'Transportasi', color: '#EF4444' },
  salary: INCOME_CATEGORIES.find((c) => c.id === 'salary'),
  freelance: { id: 'side_income', label: 'Sampingan', color: '#10B981' },
  business: { id: 'sale', label: 'Jual', color: '#10B981' },
  investment: { id: 'investment_income', label: 'Hasil Invest', color: '#10B981' },
  gift: { id: 'bonus', label: 'Bonus', color: '#10B981' },
  other_income: { id: 'other_income', label: 'Pemasukan Lainnya', color: '#10B981' },
};

export const getCategoryById = (id) => {
  const category = ALL_CATEGORIES.find((c) => c.id === id);
  if (category) return category;
  const legacy = LEGACY_CATEGORY_ALIASES[id];
  if (legacy) return { ...legacy, icon: getCategoryIcon(legacy.id) };
  return { id: 'other', label: 'Lainnya', icon: getCategoryIcon('other_expense'), color: '#EF4444' };
};

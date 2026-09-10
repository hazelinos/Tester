import { getCategoryIcon } from './categoryIcons';

export const EXPENSE_CATEGORIES = [
  { id: 'child_baby', label: 'Anak & Bayi', color: '#E11D48' },
  { id: 'fuel', label: 'BBM', color: '#E11D48' },
  { id: 'groceries', label: 'Bahan Makanan', color: '#E11D48' },
  { id: 'donation', label: 'Donasi', color: '#E11D48' },
  { id: 'electronics', label: 'Elektronik & Gadget', color: '#E11D48' },
  { id: 'game', label: 'Game', color: '#E11D48' },
  { id: 'entertainment_subscription', label: 'Hiburan & Langganan', color: '#E11D48' },
  { id: 'internet_phone', label: 'Internet & Telepon', color: '#E11D48' },
  { id: 'investment_expense', label: 'Investasi', color: '#E11D48' },
  { id: 'family', label: 'Keluarga', color: '#E11D48' },
  { id: 'vehicle', label: 'Kendaraan & Perawatan', color: '#E11D48' },
  { id: 'work', label: 'Kerja', color: '#E11D48' },
  { id: 'health', label: 'Kesehatan', color: '#E11D48' },
  { id: 'correction_expense', label: 'Koreksi (-)', color: '#E11D48' },
  { id: 'other_expense', label: 'Lainnya', color: '#E11D48' },
  { id: 'dining_out', label: 'Makan & Minuman di Luar', color: '#E11D48' },
  { id: 'sports', label: 'Olahraga', color: '#E11D48' },
  { id: 'tax_admin', label: 'Pajak & Administrasi', color: '#E11D48' },
  { id: 'clothing', label: 'Pakaian', color: '#E11D48' },
  { id: 'pet', label: 'Peliharaan', color: '#E11D48' },
  { id: 'education', label: 'Pendidikan', color: '#E11D48' },
  { id: 'personal_care', label: 'Perawatan Diri', color: '#E11D48' },
  { id: 'household', label: 'Rumah Tangga', color: '#E11D48' },
  { id: 'social', label: 'Sosial', color: '#E11D48' },
  { id: 'bills', label: 'Tagihan', color: '#E11D48' },
  { id: 'transport', label: 'Transportasi', color: '#E11D48' },
].map((category) => ({ ...category, icon: getCategoryIcon(category.id) }));

export const INCOME_CATEGORIES = [
  { id: 'bonus', label: 'Bonus', color: '#0F172A' },
  { id: 'salary', label: 'Gaji', color: '#0F172A' },
  { id: 'investment_income', label: 'Hasil Invest', color: '#0F172A' },
  { id: 'grant', label: 'Hibah', color: '#0F172A' },
  { id: 'sale', label: 'Jual', color: '#0F172A' },
  { id: 'correction_income', label: 'Koreksi (+)', color: '#0F172A' },
  { id: 'other_income', label: 'Pemasukan Lainnya', color: '#0F172A' },
  { id: 'refund', label: 'Pengembalian', color: '#0F172A' },
  { id: 'side_income', label: 'Sampingan', color: '#0F172A' },
  { id: 'rent_income', label: 'Sewa', color: '#0F172A' },
].map((category) => ({ ...category, icon: getCategoryIcon(category.id) }));

export const ALL_CATEGORIES = [...INCOME_CATEGORIES, ...EXPENSE_CATEGORIES];

const LEGACY_CATEGORY_ALIASES = {
  food: { id: 'dining_out', label: 'Makan & Minuman di Luar', color: '#E11D48' },
  transport: { id: 'transport', label: 'Transportasi', color: '#E11D48' },
  shopping: { id: 'groceries', label: 'Bahan Makanan', color: '#E11D48' },
  health: { id: 'health', label: 'Kesehatan', color: '#E11D48' },
  entertainment: { id: 'entertainment_subscription', label: 'Hiburan & Langganan', color: '#E11D48' },
  education: { id: 'education', label: 'Pendidikan', color: '#E11D48' },
  bills: { id: 'bills', label: 'Tagihan', color: '#E11D48' },
  household: { id: 'household', label: 'Rumah Tangga', color: '#E11D48' },
  beauty: { id: 'personal_care', label: 'Perawatan Diri', color: '#E11D48' },
  sports: { id: 'sports', label: 'Olahraga', color: '#E11D48' },
  travel: { id: 'transport', label: 'Transportasi', color: '#E11D48' },
  salary: INCOME_CATEGORIES.find((c) => c.id === 'salary'),
  freelance: { id: 'side_income', label: 'Sampingan', color: '#0F172A' },
  business: { id: 'sale', label: 'Jual', color: '#0F172A' },
  investment: { id: 'investment_income', label: 'Hasil Invest', color: '#0F172A' },
  gift: { id: 'bonus', label: 'Bonus', color: '#0F172A' },
  other_income: { id: 'other_income', label: 'Pemasukan Lainnya', color: '#0F172A' },
};

export const getCategoryById = (id) => {
  const category = ALL_CATEGORIES.find((c) => c.id === id);
  if (category) return category;
  const legacy = LEGACY_CATEGORY_ALIASES[id];
  if (legacy) return { ...legacy, icon: getCategoryIcon(legacy.id) };
  return { id: 'other', label: 'Lainnya', icon: getCategoryIcon('other_expense'), color: '#E11D48' };
};

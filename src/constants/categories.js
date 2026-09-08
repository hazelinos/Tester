import { getCategoryIcon } from './categoryIcons';

export const EXPENSE_CATEGORIES = [
  { id: 'child_baby', label: 'Anak & Bayi', color: '#FFB6C1' },
  { id: 'fuel', label: 'BBM', color: '#FF8C69' },
  { id: 'groceries', label: 'Bahan Makanan', color: '#69D4FF' },
  { id: 'donation', label: 'Donasi', color: '#FFD369' },
  { id: 'electronics', label: 'Elektronik & Gadget', color: '#C469FF' },
  { id: 'game', label: 'Game', color: '#69FF8C' },
  { id: 'entertainment_subscription', label: 'Hiburan & Langganan', color: '#FFD369' },
  { id: 'internet_phone', label: 'Internet & Telepon', color: '#69B4FF' },
  { id: 'investment_expense', label: 'Investasi', color: '#69FF8C' },
  { id: 'family', label: 'Keluarga', color: '#FF9F69' },
  { id: 'vehicle', label: 'Kendaraan & Perawatan', color: '#69B4FF' },
  { id: 'work', label: 'Kerja', color: '#A8D8CF' },
  { id: 'health', label: 'Kesehatan', color: '#FF6B9D' },
  { id: 'correction_expense', label: 'Koreksi (-)', color: '#AAAAAA' },
  { id: 'other_expense', label: 'Lainnya', color: '#AAAAAA' },
  { id: 'dining_out', label: 'Makan & Minuman di Luar', color: '#FF8C69' },
  { id: 'sports', label: 'Olahraga', color: '#69FF8C' },
  { id: 'tax_admin', label: 'Pajak & Administrasi', color: '#FF9F69' },
  { id: 'clothing', label: 'Pakaian', color: '#FFB6C1' },
  { id: 'pet', label: 'Peliharaan', color: '#C469FF' },
  { id: 'education', label: 'Pendidikan', color: '#69FFD3' },
  { id: 'personal_care', label: 'Perawatan Diri', color: '#FF69B4' },
  { id: 'household', label: 'Rumah Tangga', color: '#69CFFF' },
  { id: 'social', label: 'Sosial', color: '#C469FF' },
  { id: 'bills', label: 'Tagihan', color: '#FF9F69' },
  { id: 'transport', label: 'Transportasi', color: '#69B4FF' },
].map((category) => ({ ...category, icon: getCategoryIcon(category.id) }));

export const INCOME_CATEGORIES = [
  { id: 'bonus', label: 'Bonus', color: '#FFD369' },
  { id: 'salary', label: 'Gaji', color: '#A8E6CF' },
  { id: 'investment_income', label: 'Hasil Invest', color: '#69FF8C' },
  { id: 'grant', label: 'Hibah', color: '#5DD4A8' },
  { id: 'sale', label: 'Jual', color: '#69B4FF' },
  { id: 'correction_income', label: 'Koreksi (+)', color: '#AAAAAA' },
  { id: 'other_income', label: 'Pemasukan Lainnya', color: '#FFD369' },
  { id: 'refund', label: 'Pengembalian', color: '#69D4FF' },
  { id: 'side_income', label: 'Sampingan', color: '#A8E6CF' },
  { id: 'rent_income', label: 'Sewa', color: '#69CFFF' },
].map((category) => ({ ...category, icon: getCategoryIcon(category.id) }));

export const ALL_CATEGORIES = [...INCOME_CATEGORIES, ...EXPENSE_CATEGORIES];

const LEGACY_CATEGORY_ALIASES = {
  food: { id: 'dining_out', label: 'Makan & Minuman di Luar', color: '#FF8C69' },
  transport: { id: 'transport', label: 'Transportasi', color: '#69B4FF' },
  shopping: { id: 'groceries', label: 'Bahan Makanan', color: '#69D4FF' },
  health: { id: 'health', label: 'Kesehatan', color: '#FF6B9D' },
  entertainment: { id: 'entertainment_subscription', label: 'Hiburan & Langganan', color: '#FFD369' },
  education: { id: 'education', label: 'Pendidikan', color: '#69FFD3' },
  bills: { id: 'bills', label: 'Tagihan', color: '#FF9F69' },
  household: { id: 'household', label: 'Rumah Tangga', color: '#69CFFF' },
  beauty: { id: 'personal_care', label: 'Perawatan Diri', color: '#FF69B4' },
  sports: { id: 'sports', label: 'Olahraga', color: '#69FF8C' },
  travel: { id: 'transport', label: 'Transportasi', color: '#69B4FF' },
  salary: INCOME_CATEGORIES.find((c) => c.id === 'salary'),
  freelance: { id: 'side_income', label: 'Sampingan', color: '#A8E6CF' },
  business: { id: 'sale', label: 'Jual', color: '#69B4FF' },
  investment: { id: 'investment_income', label: 'Hasil Invest', color: '#69FF8C' },
  gift: { id: 'bonus', label: 'Bonus', color: '#FFD369' },
  other_income: { id: 'other_income', label: 'Pemasukan Lainnya', color: '#FFD369' },
};

export const getCategoryById = (id) => {
  const category = ALL_CATEGORIES.find((c) => c.id === id);
  if (category) return category;
  const legacy = LEGACY_CATEGORY_ALIASES[id];
  if (legacy) return { ...legacy, icon: getCategoryIcon(legacy.id) };
  return { id: 'other', label: 'Lainnya', icon: getCategoryIcon('other_expense'), color: '#AAAAAA' };
};

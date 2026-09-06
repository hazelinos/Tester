export const EXPENSE_CATEGORIES = [
  { id: 'child_baby', label: 'Anak & Bayi', icon: '🍼', color: '#FFB6C1' },
  { id: 'fuel', label: 'BBM', icon: '⛽', color: '#FF8C69' },
  { id: 'groceries', label: 'Bahan Makanan', icon: '🛍️', color: '#69D4FF' },
  { id: 'donation', label: 'Donasi', icon: '🎁', color: '#FFD369' },
  { id: 'electronics', label: 'Elektronik & Gadget', icon: '📺', color: '#C469FF' },
  { id: 'game', label: 'Game', icon: '🎮', color: '#69FF8C' },
  { id: 'entertainment_subscription', label: 'Hiburan & Langganan', icon: '🍿', color: '#FFD369' },
  { id: 'internet_phone', label: 'Internet & Telepon', icon: '🌐', color: '#69B4FF' },
  { id: 'investment_expense', label: 'Investasi', icon: '💰', color: '#69FF8C' },
  { id: 'family', label: 'Keluarga', icon: '👨‍👩‍👧', color: '#FF9F69' },
  { id: 'vehicle', label: 'Kendaraan & Perawatan', icon: '🚗', color: '#69B4FF' },
  { id: 'work', label: 'Kerja', icon: '💼', color: '#A8D8CF' },
  { id: 'health', label: 'Kesehatan', icon: '🏥', color: '#FF6B9D' },
  { id: 'correction_expense', label: 'Koreksi (-)', icon: '🎚️', color: '#AAAAAA' },
  { id: 'other_expense', label: 'Lainnya', icon: '💸', color: '#AAAAAA' },
  { id: 'dining_out', label: 'Makan & Minuman di Luar', icon: '🍔', color: '#FF8C69' },
  { id: 'sports', label: 'Olahraga', icon: '🏀', color: '#69FF8C' },
  { id: 'tax_admin', label: 'Pajak & Administrasi', icon: '🧾', color: '#FF9F69' },
  { id: 'clothing', label: 'Pakaian', icon: '👕', color: '#FFB6C1' },
  { id: 'pet', label: 'Peliharaan', icon: '🐾', color: '#C469FF' },
  { id: 'education', label: 'Pendidikan', icon: '📚', color: '#69FFD3' },
  { id: 'personal_care', label: 'Perawatan Diri', icon: '💆', color: '#FF69B4' },
  { id: 'household', label: 'Rumah Tangga', icon: '🏠', color: '#69CFFF' },
  { id: 'social', label: 'Sosial', icon: '💬', color: '#C469FF' },
  { id: 'bills', label: 'Tagihan', icon: '🧾', color: '#FF9F69' },
  { id: 'transport', label: 'Transportasi', icon: '✈️', color: '#69B4FF' },
];

export const INCOME_CATEGORIES = [
  { id: 'bonus', label: 'Bonus', icon: '🏅', color: '#FFD369' },
  { id: 'salary', label: 'Gaji', icon: '💼', color: '#A8E6CF' },
  { id: 'investment_income', label: 'Hasil Invest', icon: '🌱', color: '#69FF8C' },
  { id: 'grant', label: 'Hibah', icon: '🎁', color: '#5DD4A8' },
  { id: 'sale', label: 'Jual', icon: '🏷️', color: '#69B4FF' },
  { id: 'correction_income', label: 'Koreksi (+)', icon: '🎚️', color: '#AAAAAA' },
  { id: 'other_income', label: 'Pemasukan Lainnya', icon: '🟡', color: '#FFD369' },
  { id: 'refund', label: 'Pengembalian', icon: '🔄', color: '#69D4FF' },
  { id: 'side_income', label: 'Sampingan', icon: '💵', color: '#A8E6CF' },
  { id: 'rent_income', label: 'Sewa', icon: '🏠', color: '#69CFFF' },
];

export const ALL_CATEGORIES = [...INCOME_CATEGORIES, ...EXPENSE_CATEGORIES];

const LEGACY_CATEGORY_ALIASES = {
  food: { id: 'dining_out', label: 'Makan & Minuman di Luar', icon: '🍔', color: '#FF8C69' },
  transport: { id: 'transport', label: 'Transportasi', icon: '✈️', color: '#69B4FF' },
  shopping: { id: 'groceries', label: 'Bahan Makanan', icon: '🛍️', color: '#69D4FF' },
  health: { id: 'health', label: 'Kesehatan', icon: '🏥', color: '#FF6B9D' },
  entertainment: { id: 'entertainment_subscription', label: 'Hiburan & Langganan', icon: '🍿', color: '#FFD369' },
  education: { id: 'education', label: 'Pendidikan', icon: '📚', color: '#69FFD3' },
  bills: { id: 'bills', label: 'Tagihan', icon: '🧾', color: '#FF9F69' },
  household: { id: 'household', label: 'Rumah Tangga', icon: '🏠', color: '#69CFFF' },
  beauty: { id: 'personal_care', label: 'Perawatan Diri', icon: '💆', color: '#FF69B4' },
  sports: { id: 'sports', label: 'Olahraga', icon: '🏀', color: '#69FF8C' },
  travel: { id: 'transport', label: 'Transportasi', icon: '✈️', color: '#69B4FF' },
  salary: INCOME_CATEGORIES.find((c) => c.id === 'salary'),
  freelance: { id: 'side_income', label: 'Sampingan', icon: '💵', color: '#A8E6CF' },
  business: { id: 'sale', label: 'Jual', icon: '🏷️', color: '#69B4FF' },
  investment: { id: 'investment_income', label: 'Hasil Invest', icon: '🌱', color: '#69FF8C' },
  gift: { id: 'bonus', label: 'Bonus', icon: '🏅', color: '#FFD369' },
  other_income: { id: 'other_income', label: 'Pemasukan Lainnya', icon: '🟡', color: '#FFD369' },
};

export const getCategoryById = (id) =>
  ALL_CATEGORIES.find((c) => c.id === id) ||
  LEGACY_CATEGORY_ALIASES[id] ||
  { id: 'other', label: 'Lainnya', icon: '📦', color: '#AAAAAA' };

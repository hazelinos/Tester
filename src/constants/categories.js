export const EXPENSE_CATEGORIES = [
  { id: 'food', label: 'Makan & Minum', icon: '🍜', color: '#FF8C69' },
  { id: 'transport', label: 'Transportasi', icon: '🚗', color: '#69B4FF' },
  { id: 'shopping', label: 'Belanja', icon: '🛍️', color: '#C469FF' },
  { id: 'health', label: 'Kesehatan', icon: '💊', color: '#FF6B9D' },
  { id: 'entertainment', label: 'Hiburan', icon: '🎮', color: '#FFD369' },
  { id: 'education', label: 'Pendidikan', icon: '📚', color: '#69FFD3' },
  { id: 'bills', label: 'Tagihan', icon: '📄', color: '#FF9F69' },
  { id: 'household', label: 'Rumah Tangga', icon: '🏠', color: '#69CFFF' },
  { id: 'beauty', label: 'Kecantikan', icon: '💄', color: '#FF69B4' },
  { id: 'sports', label: 'Olahraga', icon: '⚽', color: '#69FF8C' },
  { id: 'travel', label: 'Perjalanan', icon: '✈️', color: '#69D4FF' },
  { id: 'other_expense', label: 'Lainnya', icon: '📦', color: '#AAAAAA' },
];

export const INCOME_CATEGORIES = [
  { id: 'salary', label: 'Gaji', icon: '💼', color: '#A8E6CF' },
  { id: 'freelance', label: 'Freelance', icon: '💻', color: '#6BCF9F' },
  { id: 'business', label: 'Bisnis', icon: '🏪', color: '#4ECBA0' },
  { id: 'investment', label: 'Investasi', icon: '📈', color: '#3DB890' },
  { id: 'gift', label: 'Hadiah / Bonus', icon: '🎁', color: '#5DD4A8' },
  { id: 'other_income', label: 'Lainnya', icon: '💰', color: '#A8D8CF' },
];

export const ALL_CATEGORIES = [...INCOME_CATEGORIES, ...EXPENSE_CATEGORIES];

export const getCategoryById = (id) =>
  ALL_CATEGORIES.find((c) => c.id === id) ||
  { id: 'other', label: 'Lainnya', icon: '📦', color: '#AAAAAA' };

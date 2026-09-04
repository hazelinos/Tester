import { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { generateId, isSameMonth } from '../utils/formatters';

const KEYS = {
  TRANSACTIONS:  'finance_transactions',
  ACCOUNTS:      'finance_accounts',
  BUDGETS:       'finance_budgets',
  SAVINGS:       'finance_savings',
  DEBTS:         'finance_debts',
  SUBSCRIPTIONS: 'finance_subscriptions',
};

const loadFromStorage = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};

const DEFAULT_ACCOUNTS = [
  { id: 'cash',    name: 'Kas',      icon: '💵', color: '#A8E6CF', balance: 0 },
  { id: 'bank',    name: 'Bank',     icon: '🏦', color: '#69B4FF', balance: 0 },
  { id: 'ewallet', name: 'E-Wallet', icon: '📱', color: '#C469FF', balance: 0 },
];

const initialState = {
  transactions:  loadFromStorage(KEYS.TRANSACTIONS,  []),
  accounts:      loadFromStorage(KEYS.ACCOUNTS,      DEFAULT_ACCOUNTS),
  budgets:       loadFromStorage(KEYS.BUDGETS,       []),
  savings:       loadFromStorage(KEYS.SAVINGS,       []),
  debts:         loadFromStorage(KEYS.DEBTS,         []),
  subscriptions: loadFromStorage(KEYS.SUBSCRIPTIONS, []),
};

// ─── Reducer ─────────────────────────────────────────────────────
const reducer = (state, action) => {
  switch (action.type) {
    case 'ADD_TRANSACTION': {
      const txs = [action.payload, ...state.transactions];
      const accounts = state.accounts.map((a) => {
        if (a.id !== action.payload.accountId) return a;
        const delta = action.payload.type === 'income' ? action.payload.amount : -action.payload.amount;
        return { ...a, balance: a.balance + delta };
      });
      return { ...state, transactions: txs, accounts };
    }

    case 'UPDATE_TRANSACTION': {
      const old = state.transactions.find((t) => t.id === action.payload.id);
      const txs = state.transactions.map((t) => t.id === action.payload.id ? action.payload : t);
      const accounts = state.accounts.map((a) => {
        let bal = a.balance;
        if (old?.accountId === a.id)
          bal += old.type === 'income' ? -old.amount : old.amount;
        if (action.payload.accountId === a.id)
          bal += action.payload.type === 'income' ? action.payload.amount : -action.payload.amount;
        return { ...a, balance: bal };
      });
      return { ...state, transactions: txs, accounts };
    }

    case 'DELETE_TRANSACTION': {
      const tx = state.transactions.find((t) => t.id === action.payload);
      const txs = state.transactions.filter((t) => t.id !== action.payload);
      const accounts = state.accounts.map((a) => {
        if (!tx || a.id !== tx.accountId) return a;
        const delta = tx.type === 'income' ? -tx.amount : tx.amount;
        return { ...a, balance: a.balance + delta };
      });
      return { ...state, transactions: txs, accounts };
    }

    case 'ADD_ACCOUNT':
      return { ...state, accounts: [...state.accounts, action.payload] };

    case 'UPDATE_ACCOUNT':
      return { ...state, accounts: state.accounts.map((a) => a.id === action.payload.id ? action.payload : a) };

    case 'DELETE_ACCOUNT':
      return { ...state, accounts: state.accounts.filter((a) => a.id !== action.payload) };

    case 'SET_BUDGET': {
      const exists = state.budgets.find(
        (b) => b.categoryId === action.payload.categoryId &&
               b.month === action.payload.month &&
               b.year === action.payload.year
      );
      const budgets = exists
        ? state.budgets.map((b) => b.id === exists.id ? { ...exists, ...action.payload } : b)
        : [...state.budgets, action.payload];
      return { ...state, budgets };
    }

    case 'DELETE_BUDGET':
      return { ...state, budgets: state.budgets.filter((b) => b.id !== action.payload) };

    // ── Savings ──────────────────────────────────────────────────
    case 'ADD_SAVING':
      return { ...state, savings: [action.payload, ...state.savings] };

    case 'UPDATE_SAVING':
      return { ...state, savings: state.savings.map((s) => s.id === action.payload.id ? action.payload : s) };

    case 'DELETE_SAVING':
      return { ...state, savings: state.savings.filter((s) => s.id !== action.payload) };

    case 'ADD_DEPOSIT': {
      // Tambah setoran ke saving goal + potong saldo akun sumber
      const savings = state.savings.map((s) => {
        if (s.id !== action.payload.savingId) return s;
        const deposits = [...(s.deposits || []), action.payload.deposit];
        const collected = deposits.reduce((sum, d) => sum + d.amount, 0);
        return { ...s, deposits, collected };
      });
      // Potong saldo akun sumber
      const accounts = state.accounts.map((a) => {
        if (a.id !== action.payload.deposit.accountId) return a;
        return { ...a, balance: a.balance - action.payload.deposit.amount };
      });
      return { ...state, savings, accounts };
    }

    case 'DELETE_DEPOSIT': {
      const saving = state.savings.find((s) => s.id === action.payload.savingId);
      const deposit = saving?.deposits?.find((d) => d.id === action.payload.depositId);
      const savings = state.savings.map((s) => {
        if (s.id !== action.payload.savingId) return s;
        const deposits = (s.deposits || []).filter((d) => d.id !== action.payload.depositId);
        const collected = deposits.reduce((sum, d) => sum + d.amount, 0);
        return { ...s, deposits, collected };
      });
      // Kembalikan saldo akun sumber
      const accounts = state.accounts.map((a) => {
        if (!deposit || a.id !== deposit.accountId) return a;
        return { ...a, balance: a.balance + deposit.amount };
      });
      return { ...state, savings, accounts };
    }

    // ── Subscriptions ──────────────────────────────────────────
    case 'ADD_SUBSCRIPTION':
      return { ...state, subscriptions: [action.payload, ...state.subscriptions] };
    case 'UPDATE_SUBSCRIPTION':
      return { ...state, subscriptions: state.subscriptions.map(s => s.id === action.payload.id ? action.payload : s) };
    case 'DELETE_SUBSCRIPTION':
      return { ...state, subscriptions: state.subscriptions.filter(s => s.id !== action.payload) };

    // ── Debts ────────────────────────────────────────────────────
    case 'ADD_DEBT':
      return { ...state, debts: [action.payload, ...state.debts] };

    case 'UPDATE_DEBT':
      return { ...state, debts: state.debts.map((d) => d.id === action.payload.id ? action.payload : d) };

    case 'DELETE_DEBT':
      return { ...state, debts: state.debts.filter((d) => d.id !== action.payload) };

    case 'ADD_PAYMENT': {
      const debts = state.debts.map((d) => {
        if (d.id !== action.payload.debtId) return d;
        const payments = [...(d.payments || []), action.payload.payment];
        const paid = payments.reduce((s, p) => s + p.amount, 0);
        return { ...d, payments, paid };
      });
      const accounts = state.accounts.map((a) => {
        if (!action.payload.payment.accountId || a.id !== action.payload.payment.accountId) return a;
        return { ...a, balance: a.balance - action.payload.payment.amount };
      });
      return { ...state, debts, accounts };
    }

    case 'DELETE_PAYMENT': {
      const debt    = state.debts.find((d) => d.id === action.payload.debtId);
      const payment = debt?.payments?.find((p) => p.id === action.payload.paymentId);
      const debts   = state.debts.map((d) => {
        if (d.id !== action.payload.debtId) return d;
        const payments = (d.payments || []).filter((p) => p.id !== action.payload.paymentId);
        const paid = payments.reduce((s, p) => s + p.amount, 0);
        return { ...d, payments, paid };
      });
      const accounts = state.accounts.map((a) => {
        if (!payment?.accountId || a.id !== payment.accountId) return a;
        return { ...a, balance: a.balance + payment.amount };
      });
      return { ...state, debts, accounts };
    }

    default:
      return state;
  }
};

// ─── Context ─────────────────────────────────────────────────────
const FinanceContext = createContext(null);

export const FinanceProvider = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, initialState);

  // Persist to localStorage on every change
  useEffect(() => {
    localStorage.setItem(KEYS.TRANSACTIONS, JSON.stringify(state.transactions));
  }, [state.transactions]);

  useEffect(() => {
    localStorage.setItem(KEYS.ACCOUNTS, JSON.stringify(state.accounts));
  }, [state.accounts]);

  useEffect(() => {
    localStorage.setItem(KEYS.BUDGETS, JSON.stringify(state.budgets));
  }, [state.budgets]);

  useEffect(() => {
    localStorage.setItem(KEYS.SAVINGS, JSON.stringify(state.savings));
  }, [state.savings]);

  useEffect(() => {
    localStorage.setItem(KEYS.DEBTS, JSON.stringify(state.debts));
  }, [state.debts]);

  useEffect(() => {
    localStorage.setItem(KEYS.SUBSCRIPTIONS, JSON.stringify(state.subscriptions));
  }, [state.subscriptions]);

  // ─── Actions ───────────────────────────────────────────────────
  const addTransaction = useCallback((data) => {
    const tx = { id: generateId(), createdAt: new Date().toISOString(), ...data, amount: Number(data.amount) };
    dispatch({ type: 'ADD_TRANSACTION', payload: tx });
    return tx;
  }, []);

  const updateTransaction = useCallback((data) => {
    dispatch({ type: 'UPDATE_TRANSACTION', payload: { ...data, amount: Number(data.amount) } });
  }, []);

  const deleteTransaction = useCallback((id) => {
    dispatch({ type: 'DELETE_TRANSACTION', payload: id });
  }, []);

  const addAccount = useCallback((data) => {
    const acc = { id: generateId(), balance: 0, ...data };
    dispatch({ type: 'ADD_ACCOUNT', payload: acc });
    return acc;
  }, []);

  const updateAccount = useCallback((data) => {
    dispatch({ type: 'UPDATE_ACCOUNT', payload: data });
  }, []);

  const deleteAccount = useCallback((id) => {
    dispatch({ type: 'DELETE_ACCOUNT', payload: id });
  }, []);

  const setBudget = useCallback((data) => {
    const budget = { id: generateId(), ...data, amount: Number(data.amount) };
    dispatch({ type: 'SET_BUDGET', payload: budget });
  }, []);

  const deleteBudget = useCallback((id) => {
    dispatch({ type: 'DELETE_BUDGET', payload: id });
  }, []);

  // ─── Savings actions ───────────────────────────────────────────
  const addSaving = useCallback((data) => {
    const saving = {
      id: generateId(),
      createdAt: new Date().toISOString(),
      deposits: [],
      collected: 0,
      ...data,
      target: Number(data.target),
    };
    dispatch({ type: 'ADD_SAVING', payload: saving });
    return saving;
  }, []);

  const updateSaving = useCallback((data) => {
    dispatch({ type: 'UPDATE_SAVING', payload: { ...data, target: Number(data.target) } });
  }, []);

  const deleteSaving = useCallback((id) => {
    dispatch({ type: 'DELETE_SAVING', payload: id });
  }, []);

  const addDeposit = useCallback((savingId, amount, note = '', accountId = '') => {
    const deposit = { id: generateId(), amount: Number(amount), note, accountId, date: new Date().toISOString() };
    dispatch({ type: 'ADD_DEPOSIT', payload: { savingId, deposit } });
  }, []);

  const deleteDeposit = useCallback((savingId, depositId) => {
    dispatch({ type: 'DELETE_DEPOSIT', payload: { savingId, depositId } });
  }, []);

  // ─── Debt actions ──────────────────────────────────────────────
  const addDebt = useCallback((data) => {
    const debt = {
      id: generateId(), createdAt: new Date().toISOString(),
      payments: [], paid: 0,
      ...data, total: Number(data.total),
    };
    dispatch({ type: 'ADD_DEBT', payload: debt });
    return debt;
  }, []);

  const updateDebt = useCallback((data) => {
    dispatch({ type: 'UPDATE_DEBT', payload: { ...data, total: Number(data.total) } });
  }, []);

  const deleteDebt = useCallback((id) => {
    dispatch({ type: 'DELETE_DEBT', payload: id });
  }, []);

  const addPayment = useCallback((debtId, amount, note = '', accountId = '') => {
    const payment = { id: generateId(), amount: Number(amount), note, accountId, date: new Date().toISOString() };
    dispatch({ type: 'ADD_PAYMENT', payload: { debtId, payment } });
  }, []);

  const deletePayment = useCallback((debtId, paymentId) => {
    dispatch({ type: 'DELETE_PAYMENT', payload: { debtId, paymentId } });
  }, []);

  // ─── Subscription actions ──────────────────────────────────────
  const addSubscription = useCallback((data) => {
    const sub = { id: generateId(), createdAt: new Date().toISOString(), active: true, ...data, amount: Number(data.amount) };
    dispatch({ type: 'ADD_SUBSCRIPTION', payload: sub });
    return sub;
  }, []);

  const updateSubscription = useCallback((data) => {
    dispatch({ type: 'UPDATE_SUBSCRIPTION', payload: { ...data, amount: Number(data.amount) } });
  }, []);

  const deleteSubscription = useCallback((id) => {
    dispatch({ type: 'DELETE_SUBSCRIPTION', payload: id });
  }, []);

  // ─── Selectors ─────────────────────────────────────────────────
  const getMonthlyTransactions = useCallback(
    (date = new Date()) => state.transactions.filter((t) => isSameMonth(t.date, date)),
    [state.transactions]
  );

  const getMonthlyIncome = useCallback(
    (date = new Date()) =>
      getMonthlyTransactions(date).filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0),
    [getMonthlyTransactions]
  );

  const getMonthlyExpense = useCallback(
    (date = new Date()) =>
      getMonthlyTransactions(date).filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0),
    [getMonthlyTransactions]
  );

  const getTotalBalance = useCallback(
    () => state.accounts.reduce((s, a) => s + a.balance, 0),
    [state.accounts]
  );

  const getExpenseByCategory = useCallback(
    (date = new Date()) => {
      const map = {};
      getMonthlyTransactions(date)
        .filter((t) => t.type === 'expense')
        .forEach((t) => { map[t.categoryId] = (map[t.categoryId] || 0) + t.amount; });
      return map;
    },
    [getMonthlyTransactions]
  );

  const getBudgetUsage = useCallback(
    (date = new Date()) => {
      const d = new Date(date);
      const month = d.getMonth() + 1;
      const year = d.getFullYear();
      const expMap = getExpenseByCategory(date);
      return state.budgets
        .filter((b) => b.month === month && b.year === year)
        .map((b) => ({
          ...b,
          spent: expMap[b.categoryId] || 0,
          remaining: b.amount - (expMap[b.categoryId] || 0),
          percentage: b.amount > 0
            ? Math.min(((expMap[b.categoryId] || 0) / b.amount) * 100, 100) : 0,
        }));
    },
    [state.budgets, getExpenseByCategory]
  );

  const getLast6MonthsData = useCallback(() => {
    const now = new Date();
    return Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
      return {
        month: d.getMonth(),
        year: d.getFullYear(),
        income: getMonthlyIncome(d),
        expense: getMonthlyExpense(d),
      };
    });
  }, [getMonthlyIncome, getMonthlyExpense]);

  return (
    <FinanceContext.Provider value={{
      ...state,
      addTransaction, updateTransaction, deleteTransaction,
      addAccount, updateAccount, deleteAccount,
      setBudget, deleteBudget,
      addSaving, updateSaving, deleteSaving, addDeposit, deleteDeposit,
      addDebt, updateDebt, deleteDebt, addPayment, deletePayment,
      addSubscription, updateSubscription, deleteSubscription,
      getMonthlyTransactions, getMonthlyIncome, getMonthlyExpense,
      getTotalBalance, getExpenseByCategory, getBudgetUsage, getLast6MonthsData,
    }}>
      {children}
    </FinanceContext.Provider>
  );
};

export const useFinance = () => {
  const ctx = useContext(FinanceContext);
  if (!ctx) throw new Error('useFinance must be inside FinanceProvider');
  return ctx;
};

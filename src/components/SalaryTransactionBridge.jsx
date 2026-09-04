import { useEffect, useRef } from 'react';
import { useFinance } from '../context/FinanceContext';

// Gaji sekarang dikonfigurasi dari transaksi pemasukan kategori Gaji.
// Bridge ini menjaga reminder lama tetap bekerja tanpa perlu konfigurasi dari Akun.
export default function SalaryTransactionBridge() {
  const { transactions, accounts, updateAccount } = useFinance();
  const synced = useRef(new Set());

  useEffect(() => {
    transactions
      .filter((tx) => tx.type === 'income' && tx.categoryId === 'salary' && tx.accountId && tx.amount > 0 && tx.date)
      .forEach((tx) => {
        const key = `${tx.id}:${tx.accountId}:${tx.amount}:${new Date(tx.date).getDate()}`;
        if (synced.current.has(key)) return;

        const account = accounts.find((a) => a.id === tx.accountId);
        if (!account) return;

        const salaryDate = new Date(tx.date).getDate();
        if (account.salaryEnabled !== true || account.salaryAmount !== tx.amount || account.salaryDate !== salaryDate) {
          updateAccount({
            ...account,
            salaryEnabled: true,
            salaryAmount: tx.amount,
            salaryDate,
          });
        }
        synced.current.add(key);
      });
  }, [transactions, accounts, updateAccount]);

  return null;
}

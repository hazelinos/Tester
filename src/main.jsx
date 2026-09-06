import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'

import { FinanceProvider } from './context/FinanceContext'
import { SettingsProvider } from './context/SettingsContext'
import Layout        from './components/Layout'
import SalaryTransactionBridge from './components/SalaryTransactionBridge'
import ReminderCenter from './components/ReminderCenter'
import Dashboard     from './pages/Dashboard'
import History       from './pages/History'
import Budget        from './pages/Budget'
import Accounts      from './pages/Accounts'
import Settings      from './pages/Settings'
import Savings       from './pages/Savings'
import Debt          from './pages/Debt'
import Subscriptions from './pages/Subscriptions'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <SettingsProvider>
      <FinanceProvider>
        <SalaryTransactionBridge />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index                   element={<Dashboard />}     />
              <Route path="history"          element={<History />}       />
              <Route path="budget"           element={<Budget />}        />
              <Route path="savings"          element={<Savings />}       />
              <Route path="debt"             element={<Debt />}          />
              <Route path="subscriptions"    element={<Subscriptions />} />
              <Route path="accounts"         element={<Accounts />}      />
              <Route path="settings"         element={<Settings />}      />
            </Route>
          </Routes>
          <ReminderCenter />
        </BrowserRouter>
      </FinanceProvider>
    </SettingsProvider>
  </StrictMode>
)

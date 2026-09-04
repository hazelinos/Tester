import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'

import { FinanceProvider } from './context/FinanceContext'
import { SettingsProvider } from './context/SettingsContext'
import Layout        from './components/Layout'
import Dashboard     from './pages/Dashboard'
import History       from './pages/History'
import Report        from './pages/Report'
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
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index                   element={<Dashboard />}     />
              <Route path="history"          element={<History />}       />
              <Route path="report"           element={<Report />}        />
              <Route path="budget"           element={<Budget />}        />
              <Route path="savings"          element={<Savings />}       />
              <Route path="debt"             element={<Debt />}          />
              <Route path="subscriptions"    element={<Subscriptions />} />
              <Route path="accounts"         element={<Accounts />}      />
              <Route path="settings"         element={<Settings />}      />
            </Route>
          </Routes>
        </BrowserRouter>
      </FinanceProvider>
    </SettingsProvider>
  </StrictMode>
)

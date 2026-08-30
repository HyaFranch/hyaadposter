import { useState } from 'react'
import { AppProvider } from './hooks/useAppState'
import Titlebar from './components/Titlebar'
import Sidebar from './components/Sidebar'
import Dashboard from './pages/Dashboard'
import Profiles from './pages/Profiles'
import Accounts from './pages/Accounts'
import Settings from './pages/Settings'
import Logs from './pages/Logs'

const PAGES = {
  dashboard: Dashboard,
  profiles:  Profiles,
  accounts:  Accounts,
  settings:  Settings,
  logs:      Logs,
}

export default function App() {
  const [page, setPage] = useState('dashboard')
  const Page = PAGES[page] ?? Dashboard

  return (
    <AppProvider>
      <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
        <Titlebar />
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          <Sidebar current={page} onNavigate={setPage} />
          <main style={{
            flex: 1,
            overflow: 'auto',
            background: 'var(--bg)',
            padding: '28px 32px',
          }}>
            <Page />
          </main>
        </div>
      </div>
    </AppProvider>
  )
}

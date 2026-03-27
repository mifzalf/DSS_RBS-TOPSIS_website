import { Outlet } from 'react-router-dom'
import { useState } from 'react'
import { Sidebar } from '../../components/navigation/Sidebar'
import { Topbar } from '../../components/navigation/Topbar'

const SIDEBAR_STORAGE_KEY = 'dss.sidebar.collapsed'
const DESKTOP_BREAKPOINT = '(min-width: 1121px)'

export function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => localStorage.getItem(SIDEBAR_STORAGE_KEY) === 'true')

  const isDesktop = () => window.matchMedia(DESKTOP_BREAKPOINT).matches

  const handleSidebarToggle = () => {
    if (!isDesktop()) {
      setSidebarOpen((current) => !current)
      return
    }

    setSidebarCollapsed((current) => {
      const nextValue = !current
      localStorage.setItem(SIDEBAR_STORAGE_KEY, String(nextValue))
      return nextValue
    })
  }

  const handleSidebarClose = () => {
    if (!isDesktop()) {
      setSidebarOpen(false)
    }
  }

  return (
    <div className={`app-shell ${sidebarCollapsed ? 'is-sidebar-collapsed' : ''}`}>
      <Sidebar open={sidebarOpen} collapsed={sidebarCollapsed} onClose={handleSidebarClose} />
      <div className="app-shell-body">
        <Topbar onMenuToggle={handleSidebarToggle} isSidebarCollapsed={sidebarCollapsed} />
        <main className="app-shell-content">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

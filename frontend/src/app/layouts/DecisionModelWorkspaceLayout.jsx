import { Outlet, useLocation } from 'react-router-dom'
import { useState } from 'react'
import { Topbar } from '../../components/navigation/Topbar'
import { WorkspaceSidebar } from '../../components/navigation/WorkspaceSidebar'

const SIDEBAR_STORAGE_KEY = 'dss.workspace.sidebar.collapsed'
const DESKTOP_BREAKPOINT = '(min-width: 1121px)'

export function DecisionModelWorkspaceLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => localStorage.getItem(SIDEBAR_STORAGE_KEY) === 'true')
  const location = useLocation()

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
    <div className={`workspace-shell ${sidebarCollapsed ? 'is-sidebar-collapsed' : ''}`}>
      <WorkspaceSidebar open={sidebarOpen} collapsed={sidebarCollapsed} onClose={handleSidebarClose} pathname={location.pathname} />
      <div className="workspace-shell-body">
        <Topbar onMenuToggle={handleSidebarToggle} />
        <main className="workspace-shell-content">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

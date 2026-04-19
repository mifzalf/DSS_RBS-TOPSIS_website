import { Outlet } from 'react-router-dom'

export function RootLayout() {
  return (
    <div className="root-shell">
      <main className="root-shell-content">
        <Outlet />
      </main>
    </div>
  )
}

import { Outlet } from 'react-router-dom'

export function AuthLayout() {
  return (
    <div className="auth-layout">
      <section className="auth-intro">
        <span className="page-header-eyebrow">DSS Workspace</span>
        <h1>Decision support that stays readable from setup to recommendation.</h1>
        <p>
          Build models, coordinate members, validate weighted criteria, and present the final ranking in one internal dashboard.
        </p>
        <div className="auth-highlights">
          <div className="surface-panel">
            <strong>Guided workflow</strong>
            <p>Criteria, alternatives, evaluations, rules, and recommendation stay in one structured flow.</p>
          </div>
          <div className="surface-panel">
            <strong>Clear status</strong>
            <p>Progress, completeness, and request errors remain visible so the team knows what comes next.</p>
          </div>
        </div>
      </section>
      <main className="auth-panel">
        <Outlet />
      </main>
    </div>
  )
}

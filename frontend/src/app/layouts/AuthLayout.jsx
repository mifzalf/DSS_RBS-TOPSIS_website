import { Outlet, useLocation } from 'react-router-dom'

export function AuthLayout() {
  const location = useLocation()

  return (
    <div className="auth-layout">
      <section className="auth-intro">
        <div className="auth-hero-shell">
          <div className="auth-hero-copy stack-lg">
            <div className="stack-md">
              <span className="page-header-eyebrow auth-eyebrow">Decision support Studio</span>
              <h1>Organize decisions in one clear and guided workspace.</h1>
              <p>
                Review household conditions, organize eligibility, and produce fair assistance priorities in a place that feels clear,
                practical, and easy to present.
              </p>
            </div>

            <div className="auth-hero-metrics">
              <article className="auth-hero-metric">
                <strong>Group households first</strong>
                <span>Separate eligible and non-eligible households before prioritizing them.</span>
              </article>
              <article className="auth-hero-metric">
                <strong>Prioritize fairly</strong>
                <span>Order households inside each assistance group so the recommendation stays transparent.</span>
              </article>
              <article className="auth-hero-metric">
                <strong>Ready to share</strong>
                <span>Keep the full process neat so the final result is easy to review with your team.</span>
              </article>
            </div>
          </div>

          <div className="auth-storyboard">
            <article className="auth-story-card auth-story-card-primary">
              <span className="auth-story-label">Preparation</span>
              <strong>Set the assessment structure</strong>
              <p>Arrange assessment factors, household data, and eligibility indicators in one connected flow.</p>
            </article>
            <article className="auth-story-card">
              <span className="auth-story-label">Outcome</span>
              <strong>Clear assistance groups</strong>
              <p>Households can be separated into categories such as PKH, Sembako, or not eligible.</p>
            </article>
            <article className="auth-story-card auth-story-card-accent">
              <span className="auth-story-label">Collaboration</span>
              <strong>One place for the team</strong>
              <p>Keep member access, household answers, and final recommendations visible in the same place.</p>
            </article>
          </div>
        </div>
      </section>
      <main className="auth-panel">
        <div key={location.pathname} className="auth-route-transition">
          <Outlet />
        </div>
      </main>
    </div>
  )
}

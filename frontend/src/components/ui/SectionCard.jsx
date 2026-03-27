import { cn } from '../../utils/cn'

export function SectionCard({ title, description, actions, children, className }) {
  return (
    <section className={cn('section-card', className)}>
      {(title || description || actions) && (
        <header className="section-card-header">
          <div>
            {title ? <h2>{title}</h2> : null}
            {description ? <p>{description}</p> : null}
          </div>
          {actions ? <div className="section-card-actions">{actions}</div> : null}
        </header>
      )}
      {children}
    </section>
  )
}

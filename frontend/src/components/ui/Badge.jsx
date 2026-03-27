import { cn } from '../../utils/cn'

export function Badge({ children, tone = 'neutral', className }) {
  return <span className={cn('badge', `badge-${tone}`, className)}>{children}</span>
}

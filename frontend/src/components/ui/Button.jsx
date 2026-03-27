import { cn } from '../../utils/cn'

export function Button({ children, className, variant = 'primary', ...props }) {
  return (
    <button className={cn('button', `button-${variant}`, className)} {...props}>
      {children}
    </button>
  )
}

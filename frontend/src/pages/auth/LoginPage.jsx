import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../app/providers/useAuth'
import { useFeedback } from '../../app/providers/useFeedback'
import { FormField } from '../../components/form/FormField'
import { TextField } from '../../components/form/TextField'
import { Button } from '../../components/ui/Button'
import { ROUTES } from '../../constants/routes'
import { loginSchema } from '../../features/auth/auth.schema'

export function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login } = useAuth()
  const { pushToast } = useFeedback()
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: '',
      password: '',
    },
  })

  const onSubmit = handleSubmit(async (values) => {
    try {
      await login(values)
      pushToast({ title: 'Login successful', description: 'Session is ready and protected routes are now available.', tone: 'success' })
      navigate(location.state?.from?.pathname || ROUTES.decisionModels, { replace: true })
    } catch (error) {
      pushToast({ title: 'Login failed', description: error.message, tone: 'error' })
    }
  })

  return (
    <div className="auth-card surface-panel">
      <div className="auth-card-header">
        <span className="page-header-eyebrow">Welcome back</span>
        <h2>Continue reviewing and prioritizing assistance recipients.</h2>
      </div>

      <form className="stack-md" onSubmit={onSubmit}>
        <FormField label="Username" error={errors.username?.message}>
          <TextField placeholder="your.username" {...register('username')} />
        </FormField>

        <FormField label="Password" error={errors.password?.message}>
          <TextField type="password" placeholder="Enter your password" {...register('password')} />
        </FormField>

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Signing in...' : 'Login'}
        </Button>
      </form>

      <div className="auth-card-note">
        <strong>What you can do here</strong>
        <p>Review household eligibility, organize assistance groups, and see the final priority order for each program.</p>
      </div>

      <p className="auth-switch">
        Belum punya akun? <Link to={ROUTES.register}>Register</Link>
      </p>
    </div>
  )
}

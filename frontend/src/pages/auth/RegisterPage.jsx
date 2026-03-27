import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../app/providers/useAuth'
import { useFeedback } from '../../app/providers/useFeedback'
import { FormField } from '../../components/form/FormField'
import { TextField } from '../../components/form/TextField'
import { Button } from '../../components/ui/Button'
import { ROUTES } from '../../constants/routes'
import { registerSchema } from '../../features/auth/auth.schema'

export function RegisterPage() {
  const navigate = useNavigate()
  const { register: registerAccount } = useAuth()
  const { pushToast } = useFeedback()
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      username: '',
      password: '',
      confirmPassword: '',
    },
  })

  const onSubmit = handleSubmit(async (formValues) => {
    const { confirmPassword: _confirmPassword, ...values } = formValues
    try {
      await registerAccount(values)
      pushToast({ title: 'Registration successful', description: 'Your session is active and dashboard is ready.', tone: 'success' })
      navigate(ROUTES.dashboard, { replace: true })
    } catch (error) {
      pushToast({ title: 'Registration failed', description: error.message, tone: 'error' })
    }
  })

  return (
    <div className="auth-card surface-panel">
      <div className="auth-card-header">
        <span className="page-header-eyebrow">New workspace</span>
        <h2>Create an internal account for DSS operations.</h2>
        <p>Registration immediately opens a protected session so teams can start building a model without extra steps.</p>
      </div>

      <form className="stack-md" onSubmit={onSubmit}>
        <FormField label="Name" error={errors.name?.message}>
          <TextField placeholder="Your full name" {...register('name')} />
        </FormField>

        <FormField label="Username" error={errors.username?.message}>
          <TextField placeholder="team.member" {...register('username')} />
        </FormField>

        <FormField label="Password" error={errors.password?.message}>
          <TextField type="password" placeholder="Minimum 6 characters" {...register('password')} />
        </FormField>

        <FormField label="Confirm password" error={errors.confirmPassword?.message}>
          <TextField type="password" placeholder="Repeat your password" {...register('confirmPassword')} />
        </FormField>

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Creating account...' : 'Register'}
        </Button>
      </form>

      <p className="auth-switch">
        Sudah punya akun? <Link to={ROUTES.login}>Login</Link>
      </p>
    </div>
  )
}

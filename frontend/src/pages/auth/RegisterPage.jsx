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
      pushToast({ title: 'Registrasi berhasil', description: 'Akun berhasil dibuat dan sesi Anda sudah aktif.', tone: 'success' })
      navigate(ROUTES.decisionModels, { replace: true })
    } catch (error) {
      pushToast({ title: 'Registrasi gagal', description: error.message, tone: 'error' })
    }
  })

  return (
    <div className="auth-card surface-panel">
      <div className="auth-card-header">
        <span className="page-header-eyebrow">Akun baru</span>
        <h2>Buat akun untuk mulai menyusun model keputusan secara terstruktur.</h2>
      </div>

      <form className="stack-md" onSubmit={onSubmit}>
        <FormField label="Nama" error={errors.name?.message}>
          <TextField placeholder="Nama lengkap" {...register('name')} />
        </FormField>

        <FormField label="Username" error={errors.username?.message}>
          <TextField placeholder="anggota.tim" {...register('username')} />
        </FormField>

        <FormField label="Password" error={errors.password?.message}>
          <TextField type="password" placeholder="Minimal 6 karakter" {...register('password')} />
        </FormField>

        <FormField label="Konfirmasi password" error={errors.confirmPassword?.message}>
          <TextField type="password" placeholder="Ulangi password" {...register('confirmPassword')} />
        </FormField>

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Membuat akun...' : 'Daftar'}
        </Button>
      </form>

      <div className="auth-card-note">
        <strong>Mendukung kerja kolaboratif</strong>
        <p>Susun kriteria, data alternatif, evaluasi, dan rekomendasi akhir dalam satu alur kerja yang terhubung.</p>
      </div>

      <p className="auth-switch">
        Sudah punya akun? <Link to={ROUTES.login}>Masuk</Link>
      </p>
    </div>
  )
}

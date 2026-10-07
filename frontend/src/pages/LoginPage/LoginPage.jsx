import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router'

import Button from '../../components/Button/Button.jsx'
import TextField from '../../components/TextField/TextField.jsx'
import { useAuth } from '../../hooks/useAuth.js'
import { loginSchema } from '../../schemas/loginSchema.js'
import styles from './LoginPage.module.css'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [apiError, setApiError] = useState(null)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })

  async function onSubmit(credentials) {
    setApiError(null)
    try {
      await login(credentials)
      navigate('/tasks', { replace: true })
    } catch (error) {
      setApiError(error.message)
    }
  }

  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <h1 className={styles.title}>Task Manager</h1>
        <p className={styles.subtitle}>Entre com sua conta</p>

        {apiError && (
          <p role="alert" className={styles.apiError} data-cy="login-error-message">
            {apiError}
          </p>
        )}

        {/* noValidate: quem valida é o schema, não o navegador */}
        <form className={styles.form} onSubmit={handleSubmit(onSubmit)} noValidate>
          <TextField
            label="E-mail"
            type="email"
            autoComplete="email"
            error={errors.email?.message}
            errorDataCy="login-email-error"
            data-cy="login-email-input"
            {...register('email')}
          />
          <TextField
            label="Senha"
            type="password"
            autoComplete="current-password"
            error={errors.password?.message}
            errorDataCy="login-password-error"
            data-cy="login-password-input"
            {...register('password')}
          />
          <Button type="submit" disabled={isSubmitting} data-cy="login-submit-button">
            {isSubmitting ? 'Entrando…' : 'Entrar'}
          </Button>
        </form>
      </section>
    </main>
  )
}

import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Navigate, useLocation } from 'react-router'

import Button from '../../components/Button/Button.jsx'
import TextField from '../../components/TextField/TextField.jsx'
import { useAuth } from '../../hooks/useAuth.js'
import { loginSchema } from '../../schemas/loginSchema.js'
import styles from './LoginPage.module.css'

export default function LoginPage() {
  const { user, isRestoring, login } = useAuth()
  const location = useLocation()
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
    } catch (error) {
      setApiError(error.message)
    }
  }

  // Com um token guardado em confirmação, o formulário espera: um login feito
  // agora correria contra a resposta da restauração.
  if (isRestoring) {
    return <p className={styles.loading}>Carregando sessão…</p>
  }

  // Com sessão aberta — recém-criada pelo login ou restaurada —, a tela segue
  // para onde o usuário queria ir antes de ser mandado ao /login.
  if (user) {
    return <Navigate to={location.state?.from ?? '/tasks'} replace />
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

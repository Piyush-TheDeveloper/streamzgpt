import { useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router'
import { AuthShell } from '@/components/auth/AuthShell'
import { Field } from '@/components/auth/Field'
import { OAuthButtons } from '@/components/auth/OAuthButtons'
import { useAuth } from '@/features/auth/AuthContext'
import { authErrorMessage, signIn } from '@/services/auth'
import { validateEmail, validatePassword } from '@/lib/validation'

export function LoginPage() {
  const { setUser } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [params] = useSearchParams()
  const [errors, setErrors] = useState<{
    email?: string | null
    password?: string | null
  }>({})
  const [formError, setFormError] = useState<string | null>(
    params.get('error') === 'oauth' ? 'Sign-in was cancelled or failed.' : null,
  )
  const [busy, setBusy] = useState(false)

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    const email = String(form.get('email'))
    const password = String(form.get('password'))
    const next = {
      email: validateEmail(email),
      password: validatePassword(password),
    }
    setErrors(next)
    if (next.email || next.password) return
    setBusy(true)
    setFormError(null)
    try {
      setUser(await signIn(email.trim(), password))
      navigate(location.state?.from?.pathname ?? '/', { replace: true })
    } catch (err) {
      setFormError(authErrorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthShell
      title='Sign in'
      footer={
        <>
          New here?{' '}
          <Link to='/signup' className='text-fg hover:underline'>
            Create an account
          </Link>
        </>
      }
    >
      <OAuthButtons />
      <form onSubmit={onSubmit} noValidate className='space-y-4'>
        <Field
          label='Email'
          name='email'
          type='email'
          autoComplete='email'
          error={errors.email}
        />
        <Field
          label='Password'
          name='password'
          type='password'
          autoComplete='current-password'
          error={errors.password}
        />
        {formError && (
          <p role='alert' className='text-sm text-brand'>
            {formError}
          </p>
        )}
        <button
          type='submit'
          disabled={busy}
          className='w-full rounded-md bg-brand px-4 py-2.5 text-sm font-semibold transition hover:bg-brand-hover disabled:opacity-60'
        >
          {busy ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </AuthShell>
  )
}

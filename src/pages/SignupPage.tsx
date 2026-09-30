import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import { AuthShell } from '@/components/auth/AuthShell'
import { Field } from '@/components/auth/Field'
import { OAuthButtons } from '@/components/auth/OAuthButtons'
import { useAuth } from '@/features/auth/AuthContext'
import { authErrorMessage, signUp } from '@/services/auth'
import { validateEmail, validateName, validatePassword } from '@/lib/validation'

export function SignupPage() {
  const { setUser } = useAuth()
  const navigate = useNavigate()
  const [errors, setErrors] = useState<{
    name?: string | null
    email?: string | null
    password?: string | null
  }>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    const name = String(form.get('name')).trim()
    const email = String(form.get('email')).trim()
    const password = String(form.get('password'))
    const next = {
      name: validateName(name),
      email: validateEmail(email),
      password: validatePassword(password),
    }
    setErrors(next)
    if (next.name || next.email || next.password) return
    setBusy(true)
    setFormError(null)
    try {
      setUser(await signUp(name, email, password))
      navigate('/', { replace: true })
    } catch (err) {
      setFormError(authErrorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthShell
      title='Create your account'
      footer={
        <>
          Already have an account?{' '}
          <Link to='/login' className='text-fg hover:underline'>
            Sign in
          </Link>
        </>
      }
    >
      <OAuthButtons />
      <form onSubmit={onSubmit} noValidate className='space-y-4'>
        <Field
          label='Name'
          name='name'
          autoComplete='name'
          error={errors.name}
        />
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
          autoComplete='new-password'
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
          {busy ? 'Creating account…' : 'Create account'}
        </button>
      </form>
    </AuthShell>
  )
}

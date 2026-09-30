const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export const validateEmail = (email: string) =>
  EMAIL_RE.test(email.trim()) ? null : 'Enter a valid email address.'

export const validatePassword = (password: string) =>
  password.length >= 8 ? null : 'Password must be at least 8 characters.'

export const validateName = (name: string) =>
  name.trim().length >= 2 ? null : 'Enter your name.'

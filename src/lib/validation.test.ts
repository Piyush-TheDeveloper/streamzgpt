import { describe, expect, it } from 'vitest'
import { validateEmail, validateName, validatePassword } from './validation'

describe('validation', () => {
  it('validates emails', () => {
    expect(validateEmail('a@b.co')).toBeNull()
    expect(validateEmail(' a@b.co ')).toBeNull()
    expect(validateEmail('nope')).not.toBeNull()
  })
  it('requires 8+ char passwords', () => {
    expect(validatePassword('1234567')).not.toBeNull()
    expect(validatePassword('12345678')).toBeNull()
  })
  it('requires a name', () => {
    expect(validateName(' a ')).not.toBeNull()
    expect(validateName('Al')).toBeNull()
  })
})

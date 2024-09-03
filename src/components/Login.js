import React, { useRef, useState } from 'react'
import { validateForm } from '../utils/validate'
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
} from 'firebase/auth'
import Header from './Header'
import { auth } from '../utils/firebase'
import { LOGIN_PAGE_BACKGROUND, PROFILE_PHOTO } from '../utils/constants'
import { useDispatch } from 'react-redux'
import { addUser } from '../store/userSlice'

const Login = () => {
  const dispatch = useDispatch()
  const [isSignInForm, setIsSignInForm] = useState(true)
  const [errorMessage, setErrorMessage] = useState(false)
  const [loader, setLoader] = useState(false)
  const [passwordValidation, setPasswordValidation] = useState({
    length: false,
    lowerCase: false,
    upperCase: false,
    digit: false,
    specialChar: false,
  })
  const name = useRef(null)
  const email = useRef(null)
  const password = useRef(null)

  const validatePasswordRules = password => {
    const length = password.length >= 8 && password.length <= 15
    const lowerCase = /[a-z]/.test(password)
    const upperCase = /[A-Z]/.test(password)
    const digit = /\d/.test(password)
    const specialChar = /[@.#$!%*?&]/.test(password)

    setPasswordValidation({ length, lowerCase, upperCase, digit, specialChar })
  }

  const handlePasswordChange = e => {
    const passwordValue = e.target.value
    validatePasswordRules(passwordValue)
  }
  const toggleSignInForm = () => {
    setIsSignInForm(!isSignInForm)
    setErrorMessage({
      success: true,
      msg: '',
    })
    if (email.current) email.current.value = ''
    if (password.current) password.current.value = ''
  }
  const handleButtonClick = async () => {
    //Validate Form Data
    const { success, msg } = validateForm(
      email.current.value,
      password.current.value,
    )
    setErrorMessage({ success, msg })
    if (!success) return

    /*******SignIn/SignUp Logic Starts here************/
    setLoader(true)
    try {
      if (isSignInForm) {
        const userCredential = await signInWithEmailAndPassword(
          auth,
          email.current.value,
          password.current.value,
        )
        const user = userCredential.user
        console.log('user:', user)
      } else {
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          email.current.value,
          password.current.value,
        )
        const user = userCredential.user
        updateProfile(user, {
          displayName: name.current.value,
          photoURL: PROFILE_PHOTO,
        })
          .then(() => {
            const { uid, email, displayName, photoURL } = auth.currentUser
            dispatch(
              addUser({
                uid: uid,
                email: email,
                displayName: displayName,
                photoURL: photoURL,
              }),
            )
          })
          .catch(err => {
            console.log(err.message)
          })
        console.log('user:', user)
      }
      setLoader(false)
    } catch (err) {
      const errorMessage = err.message
      setErrorMessage({
        success: true,
        msg:
          errorMessage === 'Firebase: Error (auth/email-already-in-use).'
            ? 'User already exists'
            : errorMessage === 'Firebase: Error (auth/invalid credential).'
              ? "User doesn't exist"
              : errorMessage,
      })
      setLoader(false)
    }
  }

  const validatePassword = validateForm('', password.current?.value || '')

  return (
    <div className=''>
      <Header />
      <div className='absolute bg-gradient-to-b from-gray-800 to-gray-600'>
        <img
          className='mix-blend-overlay'
          src={LOGIN_PAGE_BACKGROUND}
          alt='Logo'
        />
      </div>
      <form
        onSubmit={e => e.preventDefault()}
        className='w-3/12 absolute rounded-md p-12 bg-black my-36 mx-auto right-0 left-0 text-white bg-opacity-75'
      >
        <h1 className='font-bold text-3xl py-4'>
          {isSignInForm ? 'Sign In' : 'Sign Up'}
        </h1>
        {!isSignInForm && (
          <input
            type='text'
            placeholder='Full Name'
            ref={name}
            className='p-4 my-4 bg-[#333] rounded-md w-full'
          />
        )}
        <input
          type='text'
          placeholder='Email Address'
          ref={email}
          className='p-4 my-4 bg-[#333] rounded-md w-full'
        />
        <input
          type='password'
          placeholder='Password'
          ref={password}
          autoComplete='on'
          className='p-4 my-4 bg-[#333] rounded-md w-full'
          onChange={handlePasswordChange}
        />
        {!validatePassword.success && password.current?.value && (
          <div className='tooltip p-4 bg-[#222] rounded-md my-4'>
            <ul className='text-xs'>
              <li
                style={{ color: passwordValidation.length ? 'green' : 'red' }}
              >
                Length must be between 8 to 15 characters
              </li>
              <li
                style={{
                  color: passwordValidation.lowerCase ? 'green' : 'red',
                }}
              >
                Lowercase Letter: Atlease one lowercase letter (a-z)
              </li>
              <li
                style={{
                  color: passwordValidation.upperCase ? 'green' : 'red',
                }}
              >
                Uowercase Letter: Atlease one UPPERCASE letter (A-Z)
              </li>
              <li style={{ color: passwordValidation.digit ? 'green' : 'red' }}>
                Digit: Atlease one digit (0-9)
              </li>
              <li
                style={{
                  color: passwordValidation.specialChar ? 'green' : 'red',
                }}
              >
                Special Charaters: Atlease one special characters
                (@,#,$,!,%,*,?,&,.)
              </li>
            </ul>
          </div>
        )}

        <button
          className='p-4 my-6 bg-red-700 rounded-md w-full flex justify-center items-center'
          onClick={handleButtonClick}
        >
          {loader ? (
            <>
              <svg
                className='animate-spin -ml-1 mr-3 h-5 w-5 text-white'
                xmlns='http://www.w3.org/2000/svg'
                fill='none'
                viewBox='0 0 24 24'
              >
                <circle
                  className='opacity-25'
                  cx='12'
                  cy='12'
                  r='10'
                  stroke='currentColor'
                  strokeWidth='4'
                ></circle>
                <path
                  className='opacity-75'
                  fill='currentColor'
                  d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
                ></path>
              </svg>
              {isSignInForm ? 'Signing In...' : 'Signing Up...'}
            </>
          ) : isSignInForm ? (
            'Sign In'
          ) : (
            'Sign Up'
          )}
        </button>
        {errorMessage.msg && (
          <span className='text-sm  m-2 text-[#e87c03]'>
            {errorMessage.msg}
          </span>
        )}
        <p onClick={toggleSignInForm} className='py-4 m-2 cursor-pointer'>
          {isSignInForm ? (
            <span>
              New to Netflix? <u>Sign Up here</u>
            </span>
          ) : (
            <span>
              Already Registered? <u>Sign In Now</u>
            </span>
          )}
        </p>
      </form>
    </div>
  )
}

export default Login

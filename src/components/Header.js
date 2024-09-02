import React from 'react'
import LOGO from '../assets/streamzgpt.png'
import { RED_USER_ICON } from '../utils/constants'
import { signOut } from 'firebase/auth'
import { auth } from '../utils/firebase'
import { useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'

const Header = () => {
  const navigate = useNavigate()
  const user = useSelector(store => store.user)

  const handleSignOut = () => {
    signOut(auth)
      .then(() => {
        navigate('/')
      })
      .catch(err => {
        navigate('/error')
      })
  }

  return (
    <div className='absolute w-screen px-4 py-8 z-10 bg-gradient-to-b from-black flex justify-between'>
      <img className='w-52' src={LOGO} alt='logo' />
      {user && (
        <div className='flex'>
          <img
            src={user?.photoURL}
            alt='user-icon'
            className='rounded-md w-12 h-12'
          />
          <button
            onClick={handleSignOut}
            type='button'
            className='btn btn-outline-primary'
          >
            Sign Out
          </button>
        </div>
      )}
    </div>
  )
}

export default Header

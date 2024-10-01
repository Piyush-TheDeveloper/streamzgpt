import React, { useEffect } from 'react'
import LOGO from '../assets/streamzgpt.png'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import { auth } from '../utils/firebase'
import { useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { addUser, removeUser } from '../store/userSlice'

const Header = () => {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const user = useSelector(store => store.user)

  const handleSignOut = () => {
    signOut(auth)
      .then(() => {})
      .catch(err => {
        navigate('/error')
      })
  }

  useEffect(() => {
    //onAuthStateChanged = firebaseAPI to handle signin and signout from single place.
    const unsubscribe = onAuthStateChanged(auth, user => {
      if (user) {
        const { uid, email, displayName, photoURL } = user
        dispatch(
          addUser({
            uid: uid,
            email: email,
            displayName: displayName,
            photoURL: photoURL,
          }),
        )
        navigate('/browse')
      } else {
        dispatch(removeUser())
        navigate('/')
      }
    })

    //Unsubscribe when component unmounts.
    return () => unsubscribe()
  }, [])

  return (
    <div className='absolute w-full px-4 py-8 z-10 bg-gradient-to-b from-black flex justify-between text-white'>
      <img className='w-52' src={LOGO} alt='logo' />
      {user && (
        <div className='flex gap-3'>
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

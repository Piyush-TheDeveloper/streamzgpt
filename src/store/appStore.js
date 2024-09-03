import { configureStore } from '@reduxjs/toolkit'
import userReducer from './userSlice'
import moviesReducer from './moviesSlice'

const appStore = configureStore({
  reducer: {
    movies: moviesReducer,
    user: userReducer,
  },
})

export default appStore

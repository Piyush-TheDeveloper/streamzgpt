import React, { useEffect } from 'react'
import Header from './Header'
import { API_OPTIONS } from '../utils/constants'
import { useDispatch } from 'react-redux'
import { addNowPlayingMovies } from '../store/moviesSlice'

const Browse = () => {
  const dispatch = useDispatch()
  const getNowPlayingMoview = async () => {
    const data = await fetch(
      'https://api.themoviedb.org/3/movie/now_playing?page=1',
      API_OPTIONS,
    )
    const json = await data.json()
    console.log('Movies APICall=', json.results)
    dispatch(addNowPlayingMovies(json.results))
  }

  useEffect(() => getNowPlayingMoview, [])

  return (
    <div>
      <Header />
    </div>
  )
}

export default Browse

import { useDispatch } from 'react-redux'
import { API_OPTIONS, TMDB_API_URL } from '../utils/constants'
import { addNowPlayingMovies } from '../store/moviesSlice'
import { useEffect } from 'react'

const useNowPlayingMovies = () => {
  const dispatch = useDispatch()
  const getNowPlayingMoview = async () => {
    const data = await fetch(TMDB_API_URL, API_OPTIONS)
    const json = await data.json()
    console.log('Movies APICall=', json.results)
    dispatch(addNowPlayingMovies(json.results))
  }

  useEffect(() => getNowPlayingMoview, [])
}

export default useNowPlayingMovies
